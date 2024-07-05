const express = require('express');
const fs = require('fs');
const https = require('https');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

// HTTPS 옵션 설정
const httpsOptions = {
  cert: fs.readFileSync('/home/team4/cert/certificate.crt'),
  key: fs.readFileSync('/home/team4/cert/private.key'),
  ca: fs.readFileSync('/home/team4/cert/ca_bundle.crt')
};

// HTTP에서 HTTPS로 리다이렉션
app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  next();
});

// index 페이지 라우트
app.get('/', (req, res) => {
  res.render('index');
});

// HTTP 서버 시작
app.listen(80, () => {
  console.log('80 HTTP 서버 대기중');
});

// HTTPS 서버 시작
https.createServer(httpsOptions, app).listen(443, () => {
  console.log('443 HTTPS 서버 대기중');
});

