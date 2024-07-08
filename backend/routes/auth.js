const router = require("express").Router(); // router 사용
const setup = require("../db_setup");
const sha256 = require("sha256");  // salt 사용
const multer = require("multer");
const Tesseract = require("tesseract.js");
const path = require("path");
const fs = require("fs");




// 로그인 페이지 렌더링
router.get('/login', (req, res) => {
  res.render('login'); // 로그인 페이지 렌더링
});


// 사용자 로그인 API
router.post('/login', async(req, res) => {
    const {main_db, salt_db} = await setup();
    const { username, password } = req.body; // username, password 추출
    const userQuery = 'SELECT * FROM user WHERE user_id = ?'; // userQurey에 사용자 정보 조회 정의
  
    main_db.query(userQuery, [username], (err, userResults) => { // 사용자 정보 userResults에 정보 저장
      if (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
      }
  
      if (userResults.length > 0) { // 조회된 사용자가 있으면
        const user = userResults[0]; // 사용자 정보 user에 저장
  
        if (user.account_locked) { //사용자가 잠겨있으면
          return res.send('로그인 시도 잠금 중입니다. 관리자에게 문의하세요.');
        }
  
        const saltQuery = 'SELECT salt FROM salt WHERE user_id = ?'; // slatQurey에 salt 조회 정의
        salt_db.query(saltQuery, [user.id], (err, saltResults) => { // salt 조회후 saltResults에 저장
          if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
          }
  
          const salt = saltResults[0].salt; // salt변수에 salt 저장
          const hashedPassword = sha256(password + salt); // 비밀번호 salt 결합해 해시 비밀번호 생성
  
          if (user.password === hashedPassword) { // 해시 비밀번호와 유저 비밀번호가 같으면
            // 로그인 성공
            const resetAttemptsQuery = 'UPDATE user SET login_attempts = 0 WHERE id = ?'; // 로그인 시도 횟수 초기화 정의
            main_db.query(resetAttemptsQuery, [user.id], (err) => { // 로그인 시도 횟수 초기화
              if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
              }
  
              req.session.user = user; // 세션에 사용자 정보 저장
              res.cookie('uid', username); // 사용자 이름 쿠키에 저장
              res.redirect('/'); // 로그인 성공 후 home으로 리다이렉션
            });
          } else { // 로그인 실패하면
            // 로그인 실패
            const loginAttempts = user.login_attempts + 1; // 로그인 시도 횟수 증가
            let accountLocked = false; // 계정 잠금 비활성화
  
            if (loginAttempts >= 5) { // 로그인 시도횟수가 5이상이면
              accountLocked = true; // 계정 잠금 활성화
            }
  
            const updateAttemptsQuery = 'UPDATE user SET login_attempts = ?, account_locked = ? WHERE id = ?'; // 로그인 시도 횟수, 계정 잠금 상태 갱신 정의
            main_db.query(updateAttemptsQuery, [loginAttempts, accountLocked, user.id], (err) => { // 로그인 시도 횟수, 계정 잠금 상태 갱신
              if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
              }
              res.render('login', { msg: '잘못된 사용자명 또는 비밀번호입니다. 다시 시도해주세요.' });
            });
          }
        });
      } else { // 조회한 사용자가 없으면
        res.render('login', { msg: '잘못된 사용자명 또는 비밀번호입니다. 다시 시도해주세요.' });
      }
    });
  });
  

// 사용자 로그아웃 API
router.get('/logout', (req, res) => { 
  req.session.destroy(); // 세션 파기
  res.clearCookie('uid'); // uid 쿠키 삭제
  res.redirect('/'); // home으로 이동
});
  
  
// 회원가입 페이지 렌더링
router.get('/signup', (req, res) => {
  res.render('signup'); // 회원가입 페이지 렌더링
});

  
// uploads 디렉토리 생성 확인 및 생성
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // 업로드 디렉토리 설정
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // 파일 이름 설정
  }
});
const upload = multer({ storage: storage });


// 회원가입 API
router.post('/signup', upload.single('idCard'), (req, res) => { // 파일 업로드 처리 
  
  const { username, password, checkPassword, name } = req.body; // username, password, checkPassword, name 추출
  const idCardPath = req.file.path; // 업로드 파일 경로 저장

  if (password !== checkPassword) { // 비밀번호와 비밀번호 재입력 일치 확인 
    return res.render('signup', { msg: '비밀번호가 일치하지 않습니다.' });
  }

  const salt = Math.random().toString(36).substring(2, 15); // 랜덤한 salt 생성
  const hashedPassword = sha256(password + salt); // 비밀번호와 salt를 결합해 해시 비밀번호 생성

  Tesseract.recognize(idCardPath, 'kor') // Tesseract.js를 사용해 ocr 기능
    .then(({ data: { text } }) => { // ocr 정보 text에 저장
    const ssn = extractSSNFromText(text); // 주민번호 추출 함수 (구현 필요)

    if (!ssn) { // 유효한 주민번호를 찾을 수 없으면
      return res.render('signup', { msg: '주민등록증에서 유효한 주민번호를 찾을 수 없습니다.' });
    }

    const insertUserQuery = 'INSERT INTO user (user_id, user_pw, name, ssn, user_type, user_lock, connections) VALUES (?, ?, ?, ?, ?, ?, ?)'; // 사용자 정보 user 테이블에 삽입 구현
    const insertSaltQuery = 'INSERT INTO salt (user_id, salt) VALUES (LAST_INSERT_ID(), ?)'; // 사용자 id, salt를 salt 테이블에 삽입 구현

    main_db.query(insertUserQuery, [username, hashedPassword, name, ssn, 'USER', 0, 0], (err, result) => { // username, hashedPassword, name, ssn를 db에 삽입
      if (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
      }

      const userId = result.insertId; // 삽입된 사용자의 ID를 가져옴
      
      salt_db.query(insertSaltQuery, [salt], (err) => { // salt db에 삽입
        if (err) {
          console.error(err);
          return res.status(500).send('Internal Server Error');
        }

        res.redirect('/auth/login'); // 회원가입 성공시 로그인 페이지로
      });
    });
  })
  .catch(err => {
    console.error(err);
    return res.status(500).send('OCR 처리 중 오류가 발생했습니다.');
  });
});


// 주민번호 추출 로직 구현 
function extractSSNFromText(text) {
  const ssnRegex = /\b\d{6}-\d{7}\b/;
  const match = text.match(ssnRegex);
  if (match) {
    return match[0].replace('-', ''); // 하이픈을 제거하고 반환
  }
  return null;
}
  

module.exports = router;