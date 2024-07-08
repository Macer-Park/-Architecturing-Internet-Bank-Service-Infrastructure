const router = require("express").Router();
const setup = require("../db_setup");
const crypto = require("crypto");


// 사용자 로그인 API
router.post('/login', async(req, res) => {
    const {main_db, salt_db} = await setup();
    
    const userid = req.body.userid;
    const userQuery = 'SELECT * FROM user WHERE user_id = ?';
  
    main_db.query(userQuery, [userid], (err, userResults) => {
      if (err) throw err;
  
      if (userResults.length > 0) {
        const user = userResults[0];

        if (user.user_lock) {
          return res.send('로그인 시도 잠금 중입니다. 관리자에게 문의하세요.');
        }
  
        const saltQuery = 'SELECT salt FROM salt WHERE user_id = ?';
        salt_db.query(saltQuery, [user.id], (err, saltResults) => {
          if (err) throw err;
  
          const salt = saltResults[0].salt;
          const hashedPassword = sha256(password + salt);
  
          if (user.password === hashedPassword) { 
            // 로그인 성공
            const resetAttemptsQuery = 'UPDATE user SET connections = 0 WHERE user_id = ?';
            main_db.query(resetAttemptsQuery, [user.id], (err) => {
              if (err) throw err;
  
              req.session.user = user;
              res.cookie('uid', username);
              res.render('login', { user: result });
            });
          } else {
            // 로그인 실패
            const loginAttempts = user.connections + 1;
            let accountLocked = false;
  
            if (loginAttempts >= 5) {
              accountLocked = true;
              const lockAccountQuery = 'UPDATE account SET user_lock = TRUE WHERE user_id = ?';
              main_db.query(lockAccountQuery, [user.id], (err) => {
                if (err) throw err;
              });
            }
  
            const updateAttemptsQuery = 'UPDATE user SET connections = ?, user_lock = ? WHERE id = ?';
            db.query(updateAttemptsQuery, [loginAttempts, accountLocked, user.id], (err) => {
              if (err) throw err;
              res.status(500).json({ msg: '잘못된 사용자명 또는 비밀번호입니다. 다시 시도해주세요.' });
            });
          }
        });
      } else {
        res.status(500).json({msg: '잘못된 사용자명 또는 비밀번호입니다. 다시 시도해주세요.' });
      }
    });
  });
  
  // 사용자 로그아웃 API
  router.get('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie('uid');
    res.redirect('/');
  });
  
  
  // 회원가입 페이지 렌더링
  router.get('/signup', (req, res) => {
    res.render('signup');
  });

// 비밀번호 해시화 함수
function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// 회원가입 페이지 렌더링
router.post('/signup', async (req, res) => {
  const {main_db, salt_db} = await setup();
  const { name, user_id, user_pw, birthday } = req.body;

    // user_id 중복 확인
    main_db.query('SELECT user_id FROM user WHERE user_id = ?', [user_id], (err, result) => {
      return res.status(301).send('아이디가 중복 되었습니다.');
    });

    // 비밀번호 해시화
    const salt = crypto.randomBytes(16).toString('hex'); // 랜덤 솔트 생성
    const hashedPassword = hashPassword(user_pw, salt);

    // 회원 정보 저장
    const query = 'INSERT INTO user (name, user_id, user_pw, birthday) VALUES (?, ?, ?, ?)';
    main_db.query(query, [name, user_id, hashedPassword, birthday]);

    // 솔트 저장
    const saltQuery = 'INSERT INTO salt (internal_id, salt) VALUES (LAST_INSERT_ID(), ?)';
    salt_db.query(saltQuery, [salt]);

    res.status(200).send('User registered successfully!');
  });

  // 로그인 페이지 렌더링
  router.get('/login', (req, res) => {
    res.render('login');
  });
  
  // 사용자 파일 업로드 API (예시로 추가)
  router.post('/upload', (req, res) => {
    // 파일 업로드 로직 추가 필요
    res.send('파일 업로드 완료');
  });
  

module.exports = router;