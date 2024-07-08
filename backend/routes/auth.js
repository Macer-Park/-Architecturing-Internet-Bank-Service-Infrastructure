const router = require("express").Router();
const setup = require("../db_setup");

// 사용자 로그인 API
router.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    const userQuery = 'SELECT * FROM user WHERE username = ?';
  
    db.query(userQuery, [username], (err, userResults) => {
      if (err) throw err;
  
      if (userResults.length > 0) {
        const user = userResults[0];
  
        if (user.user_lock) {
          return res.send('로그인 시도 잠금 중입니다. 관리자에게 문의하세요.');
        }
  
        const saltQuery = 'SELECT salt FROM salt WHERE userid = ?';
        saltDb.query(saltQuery, [user.id], (err, saltResults) => {
          if (err) throw err;
  
          const salt = saltResults[0].salt;
          const hashedPassword = sha256(password + salt);
  
          if (user.password === hashedPassword) {
            // 로그인 성공
            const resetAttemptsQuery = 'UPDATE user SET connections = 0 WHERE id = ?';
            db.query(resetAttemptsQuery, [user.id], (err) => {
              if (err) throw err;
  
              req.session.user = user;
              res.cookie('uid', username);
              res.redirect('/');
            });
          } else {
            // 로그인 실패
            const loginAttempts = user.connections + 1;
            let accountLocked = false;
  
            if (loginAttempts >= 5) {
              accountLocked = true;
              const lockAccountQuery = 'UPDATE account SET user_lock = TRUE WHERE user_id = ?';
              db.query(lockAccountQuery, [user.id], (err) => {
                if (err) throw err;
              });
            }
  
            const updateAttemptsQuery = 'UPDATE user SET connections = ?, user_lock = ? WHERE id = ?';
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
  router.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie('uid');
    res.redirect('/');
  });
  
  
  // 회원가입 페이지 렌더링
  router.get('/auth/signup', (req, res) => {
    res.render('register');
  });
  
  // 로그인 페이지 렌더링
  router.get('/auth/login', (req, res) => {
    res.render('login');
  });
  
  // 사용자 파일 업로드 API (예시로 추가)
  router.post('/auth/upload', (req, res) => {
    // 파일 업로드 로직 추가 필요
    res.send('파일 업로드 완료');
  });
  

module.exports = router;