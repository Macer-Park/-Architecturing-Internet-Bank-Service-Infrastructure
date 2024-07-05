const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const sha256 = require('sha256');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 메인 DB 연결 설정
const db = mysql.createConnection({
  host: 'team4-mysql',
  user: 'root',
  password: 'team4',
  database: 'bank'
});

db.connect((err) => {
  if (err) throw err;
  console.log('DB 연결 완료');
});

// Salt DB 연결 설정
const saltDb = mysql.createConnection({
  host: 'team4-mysql',
  user: 'salt-admin',
  password: 'team4',
  database: 'salt'
});

saltDb.connect((err) => {
  if (err) throw err;
  console.log('Salt DB 연결 완료');
});

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.listen(80, () => {
  console.log('80 HTTP 서버 대기중');
});

// 관리자 페이지 렌더링
app.get('/admin', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/');
  }
  res.render('admin', { user: req.session.user });
});

// 모든 사용자 정보를 가져오는 API
app.post('/admin/userlist', (req, res) => {
  const query = 'SELECT * FROM user';
  db.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// 사용자 계정 잠금 해제 API
app.post('/admin/unlock', (req, res) => {
  const userId = req.body.user_id;
  const query = 'UPDATE user SET account_locked = FALSE, login_attempts = 0 WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) throw err;
    res.json({ message: '사용자 계정이 잠금 해제되었습니다.' });
  });
});

// 계좌 잠금 해제 API
app.post('/admin/release', (req, res) => {
  const userId = req.body.user_id;
  const query = 'UPDATE account SET account_locked = FALSE WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) throw err;
    res.json({ message: '계좌 잠금이 해제되었습니다.' });
  });
});

// 사용자 로그인 API
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const userQuery = 'SELECT * FROM user WHERE username = ?';

  db.query(userQuery, [username], (err, userResults) => {
    if (err) throw err;

    if (userResults.length > 0) {
      const user = userResults[0];

      if (user.account_locked) {
        return res.send('로그인 시도 잠금 중입니다. 관리자에게 문의하세요.');
      }

      const saltQuery = 'SELECT salt FROM salt WHERE userid = ?';
      saltDb.query(saltQuery, [user.id], (err, saltResults) => {
        if (err) throw err;

        const salt = saltResults[0].salt;
        const hashedPassword = sha256(password + salt);

        if (user.password === hashedPassword) {
          // 로그인 성공
          const resetAttemptsQuery = 'UPDATE user SET login_attempts = 0 WHERE id = ?';
          db.query(resetAttemptsQuery, [user.id], (err) => {
            if (err) throw err;

            req.session.user = user;
            res.cookie('uid', username);
            res.redirect('/');
          });
        } else {
          // 로그인 실패
          const loginAttempts = user.login_attempts + 1;
          let accountLocked = false;

          if (loginAttempts >= 5) {
            accountLocked = true;
            const lockAccountQuery = 'UPDATE account SET account_locked = TRUE WHERE user_id = ?';
            db.query(lockAccountQuery, [user.id], (err) => {
              if (err) throw err;
            });
          }

          const updateAttemptsQuery = 'UPDATE user SET login_attempts = ?, account_locked = ? WHERE id = ?';
          db.query(updateAttemptsQuery, [loginAttempts, accountLocked, user.id], (err) => {
            if (err) throw err;
            res.render('login', { msg: '잘못된 사용자명 또는 비밀번호입니다. 다시 시도해주세요.' });
          });
        }
      });
    } else {
      res.render('login', { msg: '잘못된 사용자명 또는 비밀번호입니다. 다시 시도해주세요.' });
    }
  });
});

// 사용자 로그아웃 API
app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('uid');
  res.redirect('/');
});

// 홈 페이지 렌더링
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

// 회원가입 페이지 렌더링
app.get('/auth/signup', (req, res) => {
  res.render('register');
});

// 로그인 페이지 렌더링
app.get('/auth/login', (req, res) => {
  res.render('login');
});

// 사용자 파일 업로드 API (예시로 추가)
app.post('/auth/upload', (req, res) => {
  // 파일 업로드 로직 추가 필요
  res.send('파일 업로드 완료');
});

// 공지사항 페이지 렌더링
app.get('/board/list', (req, res) => {
  res.render('board_list', { user: req.session.user });
});

// 공지사항 상세 페이지 렌더링
app.get('/board/list/select', (req, res) => {
  res.render('board_select', { user: req.session.user });
});

// 공지사항 추가 API
app.post('/board/insert', (req, res) => {
  // 공지사항 추가 로직 추가 필요
  res.send('공지사항 추가 완료');
});

// 공지사항 업데이트 API
app.post('/board/update', (req, res) => {
  // 공지사항 업데이트 로직 추가 필요
  res.send('공지사항 업데이트 완료');
});

// 공지사항 삭제 API
app.post('/board/delete', (req, res) => {
  // 공지사항 삭제 로직 추가 필요
  res.send('공지사항 삭제 완료');
});

/* 최초 Commit Data
const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json());

const db = mysql.createConnection({
  host: 'team4-mysql',
  user: 'root',
  password: 'team4',
  database: 'bank'
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
*/
