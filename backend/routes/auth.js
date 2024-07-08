const router = require("express").Router();
const setup = require("../db_setup");
const sha256 = require("sha256");
const multer = require("multer");
const Tesseract = require("tesseract.js");
const path = require("path");
const fs = require("fs");

let main_db, salt_db;

(async () => {
  ({main_db, salt_db} = await setup());
})();

// 로그인 페이지 렌더링
router.get('/login', (req, res) => {
  res.render('login');
});

// 사용자 로그인 API
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const userQuery = 'SELECT * FROM user WHERE user_id = ?';

  main_db.query(userQuery, [username], (err, userResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ msg: 'Internal Server Error' });
    }

    if (userResults.length > 0) {
      const user = userResults[0];

      if (user.user_lock) {
        return res.status(403).json({ msg: '로그인 시도 잠금 중입니다. 관리자에게 문의하세요.' });
      }

      const saltQuery = 'SELECT salt FROM salt WHERE user_id = ?';
      salt_db.query(saltQuery, [user.internal_id], (err, saltResults) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ msg: 'Internal Server Error' });
        }

        if (saltResults.length === 0) {
          return res.status(400).json({ msg: '잘못된 사용자명 또는 비밀번호입니다. 다시 시도해주세요.' });
        }

        const salt = saltResults[0].salt;
        const hashedPassword = sha256(password + salt);

        if (user.user_pw === hashedPassword) {
          req.session.user = user;
          res.cookie('uid', username);
          res.status(200).json({ msg: '로그인 성공', user: user });
        } else {
          res.status(400).json({ msg: '잘못된 사용자명 또는 비밀번호입니다. 다시 시도해주세요.' });
        }
      });
    } else {
      res.status(400).json({ msg: '잘못된 사용자명 또는 비밀번호입니다. 다시 시도해주세요.' });
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

// uploads 디렉토리 생성 확인 및 생성
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

// 회원가입 API
router.post('/signup', upload.single('idCard'), (req, res) => {
  const { username, password, checkPassword, name } = req.body;
  const idCardPath = req.file.path;

  if (password !== checkPassword) {
    console.log('Passwords do not match');
    return res.status(400).json({ msg: '비밀번호가 일치하지 않습니다.' });
  }

  const salt = Math.random().toString(36).substring(2, 15);
  const hashedPassword = sha256(password + salt);

  Tesseract.recognize(idCardPath, 'kor')
    .then(({ data: { text } }) => {
      const ssn = extractSSNFromText(text);

      if (!ssn) {
        console.log('No valid SSN found in ID card');
        return res.status(400).json({ msg: '주민등록증에서 유효한 주민번호를 찾을 수 없습니다.' });
      }

      // 사용자 ID 중복 확인
      const checkUserQuery = 'SELECT * FROM user WHERE user_id = ?';
      main_db.query(checkUserQuery, [username], (err, results) => {
        if (err) {
          console.error('Error checking user ID:', err);
          return res.status(500).json({ msg: 'Internal Server Error' });
        }

        if (results.length > 0) {
          console.log('User ID already exists');
          return res.status(400).json({ msg: '이미 존재하는 사용자 ID입니다.' });
        }

        // 사용자 추가
        const insertUserQuery = 'INSERT INTO user (user_id, user_pw, name, ssn, user_type, user_lock, connections) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const insertSaltQuery = 'INSERT INTO salt (user_id, salt) VALUES (?, ?)';

        console.log('Executing query to insert user...');
        main_db.query(insertUserQuery, [username, hashedPassword, name, ssn, 'USER', 0, 0], (err, result) => {
          if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).json({ msg: 'Internal Server Error' });
          }

          const userId = result.insertId;
          console.log('User inserted with ID:', userId);

          console.log('Executing query to insert salt...');
          salt_db.query(insertSaltQuery, [userId, salt], (err) => {
            if (err) {
              console.error('Error inserting salt:', err);
              return res.status(500).json({ msg: 'Internal Server Error' });
            }

            console.log('Salt inserted for user ID:', userId);
            res.status(200).json({ msg: '회원가입이 완료되었습니다.' });
          });
        });
      });
    })
    .catch(err => {
      console.error('Error during OCR:', err);
      return res.status(500).json({ msg: 'OCR 처리 중 오류가 발생했습니다.' });
    });
});


// 주민번호 추출 로직 구현 
function extractSSNFromText(text) {
  const ssnRegex = /\b\d{6}-\d{7}\b/;
  const match = text.match(ssnRegex);
  if (match) {
    return match[0].replace('-', '');
  }
  return null;
}

module.exports = router;
