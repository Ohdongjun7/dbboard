const express = require('express');
const db = require('./db');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true })); // 폼 데이터 처리

// 1. 목록보기 + 검색 + 페이징
app.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const limit = 10; // 페이지당 게시글 수
    const offset = (page - 1) * limit;

    try {
        const searchSql = `%${search}%`;
        
        // 전체 글 개수 세기 (페이징 계산용)
        const [countResult] = await db.query(
            'SELECT COUNT(*) as total FROM board WHERE title LIKE ?', 
            [searchSql]
        );
        const totalPosts = countResult[0].total;
        const totalPages = Math.ceil(totalPosts / limit);

        // 글 목록 가져오기
        const [rows] = await db.query(
            'SELECT * FROM board WHERE title LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?',
            [searchSql, limit, offset]
        );

        res.render('list', { 
            posts: rows, 
            currentPage: page, 
            totalPages: totalPages, 
            search: search 
        });
    } catch (err) {
        console.error(err);
        res.send('DB 오류 발생');
    }
});

// 2. 글쓰기 화면
app.get('/write', (req, res) => {
    res.render('write', { post: null }); // 새 글 작성 모드
});

// 3. 글 저장 (INSERT)
app.post('/write', async (req, res) => {
    const { title, author, content } = req.body;
    await db.query('INSERT INTO board (title, author, content) VALUES (?, ?, ?)', [title, author, content]);
    res.redirect('/');
});

// 4. 상세 보기 (조회수 증가 + SELECT)
app.get('/view/:id', async (req, res) => {
    const id = req.params.id;
    // 조회수 1 증가
    await db.query('UPDATE board SET views = views + 1 WHERE id = ?', [id]);
    // 내용 가져오기
    const [rows] = await db.query('SELECT * FROM board WHERE id = ?', [id]);
    res.render('view', { post: rows[0] });
});

// 5. 수정 화면 (기존 내용 채워서 보여주기)
app.get('/edit/:id', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM board WHERE id = ?', [req.params.id]);
    res.render('write', { post: rows[0] }); // 수정 모드
});

// 6. 수정 저장 (UPDATE)
app.post('/edit/:id', async (req, res) => {
    const { title, author, content } = req.body;
    await db.query('UPDATE board SET title=?, author=?, content=? WHERE id=?', 
        [title, author, content, req.params.id]);
    res.redirect(`/view/${req.params.id}`);
});

// 7. 삭제 (DELETE)
app.get('/delete/:id', async (req, res) => {
    await db.query('DELETE FROM board WHERE id = ?', [req.params.id]);
    res.redirect('/');
});

app.listen(3000, () => {
    console.log('http://localhost:3000 에서 서버 실행 중');
});