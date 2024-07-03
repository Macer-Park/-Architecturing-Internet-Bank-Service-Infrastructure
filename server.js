const express = require('express');
const mysql = require('mysql2');
// const fs = require('fs'); // 필요 없음
// const https = require('https'); // 필요 없음

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

// HTTPS 옵션 설정 (주석 처리)
/*
const httpsOptions = {
  cert: fs.readFileSync('/etc/letsencrypt/live/www.team4isbest.chungyun.net/fullchain.pem'),
  key: fs.readFileSync('/etc/letsencrypt/live/www.team4isbest.chungyun.net/privkey.pem')
};

// HTTPS 서버 시작
https.createServer(httpsOptions, app).listen(443, () => {
  console.log('443 HTTPS 서버 대기중');
});
*/

// HTTP에서 HTTPS로 리다이렉션 (주석 처리)
/*
app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  next();
});
*/

// index 페이지 라우트
app.get('/', (req, res) => {
  res.render('index', { user: req.session ? req.session.user : null });
});

// MySQL 연결 설정 (주석 처리)
/*
const db = mysql.createConnection({
  host: 'localhost',
  user: 'dbuser',
  password: 'dbpassword',
  database: 'dbname'
});

db.connect((err) => {
  if (err) throw err;
  console.log('DB 연결 완료');
});
*/

// HTTP 서버 시작
app.listen(80, () => {
  console.log('80 HTTP 서버 대기중');
});

