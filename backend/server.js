const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json());

const db = mysql.createConnection({
  host: 'team4-mysql',
  user: 'root',
  password: 'team4',
  database: 'team4_db_test'
});

db.connect((err) => {
  if (err) throw err;
  console.log('DB 연결 완료');
});

app.get('/api/data', (req, res) => {
  // 데이터베이스에서 데이터를 가져와서 응답
});

app.listen(80, () => {
  console.log('80 HTTP 서버 대기중');
});

