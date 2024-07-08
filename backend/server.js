const express = require('express');
const session = require('express-session');
const sha256 = require('sha256');
const fs = require('fs');
const path = require('path');
const https = require('https');
const setup = require("./db_setup");
const dotenv = require("dotenv").config();
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

const app = express();

/***********************************************************************************/
/***********************************************************************************/

/** https 설정 - 개발시에는 주석처리하고, 푸쉬 할 때는 해제를 해야한다. (반드시)
 * 그래야, 외부서버에서 https 외부서버를 사용할 수 있다.
*/
// //  HTTPS 옵션 설정 (사용할 경우)
const httpsOptions = {
  cert: fs.readFileSync('/home/team4/cert/certificate.crt'),
  key: fs.readFileSync('/home/team4/cert/private.key'),
  ca: fs.readFileSync('/home/team4/cert/ca_bundle.crt')
};

// // HTTPS 서버 시작 (사용할 경우)
https.createServer(httpsOptions, app).listen(443, () => {
  console.log('443 HTTPS 서버 대기중');
});

// // // HTTP에서 HTTPS로 리다이렉션 (사용할 경우)
app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  next();
});

/***********************************************************************************/
/***********************************************************************************/

// express 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/****** 미들웨어 설정 *******/
app.use(express.static(path.join(__dirname, '../frontend/public'))); // frontend 정적 파일 제공

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ejs 미들웨어 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views')); // EJS 템플릿 위치 설정

// session 미들웨어 설정
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// CSRF 미들웨어 설정
app.use(cookieParser());
app.use(csrf({ cookie: true }));

// 전역 CSRF 토큰 설정
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// 라우팅 포함하는 코드
app.use('/user', require('./routes/user'));
app.use('/account', require('./routes/account'));
app.use('/admin', require('./routes/admin'));
app.use('/board', require('./routes/board'));
app.use('/auth', require('./routes/auth'));

/****** 미들웨어 설정 End *******/

// HTTP 서버 시작
app.listen(80, () => {
  console.log('8080 HTTP 서버 대기중');
});

// 홈 페이지 렌더링
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

// 다른 페이지 렌더링
app.get('/ss', (req, res) => {
  res.render('admin', { user: req.session.user });
});
