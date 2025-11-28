const mysql = require('mysql2');

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',   
  password: 'whtlagofk7?', 
  database: 'dbreport',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = connection.promise(); 