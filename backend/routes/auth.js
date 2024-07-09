const router = require("express").Router();
const setup = require("../db_setup");
const sha256 = require("sha256");
const multer = require("multer");
const Tesseract = require("tesseract.js");
const path = require("path");
const fs = require("fs");

// csrf 보호 설정
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

let main_db, salt_db;

(async () => {
  ({main_db, salt_db} = await setup());
})();

/************************************************************************************************************************************ */
/********************************* Google Authenticator Start *********************************************************** */
/************************************************************************************************************************************ */

const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// // 관리자 계정 생성 및 Secret Key 생성
// router.get("/qrcode", async (req,res) => {

//   // 여기서 google Authorizer를 쓴다.       
//    auth_secret = speakeasy.generateSecret({
//     name: "Authorizer-authReal"
//   });
//   console.log("auth_secret : ", auth_secret);

//   // 생성한 Secret Key를 기반으로 QR 코드 생성(URL) - 2
//   console.log("auth_secret.otpauth_url : ", auth_secret.otpauth_url);
//   qrcode.toDataURL(auth_secret.otpauth_url, function(err, data) {
//     if(err){
//       console.error('Error generating QR code:', err);
//       return res.status(500).send('Error generating QR code');
//     }
//       console.log("data : ", data);

//       const filePath = path.join(__dirname, '..', 'test-qrcode.html');
//       // res.sendFile(filePath);
//       res.render("test-qrcode.ejs", {qrcode_data: data});
//       // res.render("test-qrcode.ejs");
//   });

// })

/** 관리자 2차 인증 url */
router.get("/verify",csrfProtection,  async (req,res) => {
  console.log(req.csrfToken());
  res.render('adminTwo', { csrfToken: req.csrfToken() });
})

router.post("/verify", csrfProtection, (req, res) => {

  const code = req.body.code;
  const csrfToken = req.body.csrfToken;
  console.log("code : ", code);
  console.log("csrfToken : ", csrfToken);
  // ajax를 통해 전달받은 데이터를 token에다가 넣어야 한다.
  var verified = speakeasy.totp.verify({
    secret: "dz81bN1ZwsXKKzzo>>3e}lsBV9v<1Ow9", // qrcode ascii를 요기다가 넣어주면 된다.
    encoding: 'ascii',
    token: code
  });

  console.log("verified : ",verified);

  if(verified){
    res.json({ msg: 'Verification successful' });
  } else {
    res.status(400).json({ msg: 'Verification failed' });
  }
})

/************************************************************************************************************************************ */
/********************************* Google Authenticator End *********************************************************** */
/************************************************************************************************************************************ */

// 로그인 페이지 렌더링
router.get('/login', csrfProtection, (req, res) => {
  console.log(req.csrfToken());
  res.render('login', { csrfToken: req.csrfToken() });
});


// 사용자 로그인 API
router.post('/login', csrfProtection, async (req, res) => {

  // CSRF 토큰은 미들웨어가 자동으로 검증
  // // CSRF token token
  // if(req.body._csrf != req.session.csrfToken){
  //
  //   // CSRF token fail - 에러 처리
  //   return res.status(403).send('Invalid CSRF token');
  // }

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
      salt_db.query(saltQuery, [user.user_id], (err, saltResults) => {

        if (err) {
          console.error(err);
          return res.status(500).json({ msg: 'Internal Server Error' });
        }

        if (saltResults.length === 0) {
          return res.status(400).json({ msg: '잘못된 사용자명 또는 비밀번호입니다. 다시 시도해주세요.' });
        }

        if (saltResults.length === 0) {
          return res.status(400).json({ msg: '잘못된 사용자명 또는 비밀번호입니다. 다시 시도해주세요.' });
        }

        const salt = saltResults[0].salt;
        const hashedPassword = sha256(password + salt);

        if (user.user_pw === hashedPassword) {
          const resetAttemptsQuery = 'UPDATE user SET connections = 0 WHERE user_id = ?';
          main_db.query(resetAttemptsQuery, [user.id], (err) => {
            if (err) {
              console.error(err);
              return res.status(500).send('Internal Server Error');
            }

            // 관리자 인가?
            if (user.user_type == "admin"){
              // 관리자 2차인증 거쳐야 한다.
              console.log("user.user_type : ", user.user_type);
              res.render('adminTwo', { csrfToken: req.csrfToken() });
            } else {
              req.session.user = user;
              res.cookie('uid', username);
              res.render("index", {data : req.session.user});
            }
          });
        } else {
          const loginAttempts = user.connections + 1;
          let userLock = false;

          if (loginAttempts >= 5) {
            userLock = true;
          }

          const updateAttemptsQuery = 'UPDATE user SET connections = ?, user_lock = ? WHERE user_id = ?';
          main_db.query(updateAttemptsQuery, [loginAttempts, userLock, user.user_id], (err) => {
            if (err) {
              console.error(err);
              return res.status(500).send('Internal Server Error');
            }
            res.render('login', { msg: '잘못된 사용자명 또는 비밀번호입니다. 다시 시도해주세요.' });
          });

        }
      });
    } else {
      res.status(400).json({ msg: '잘못된 사용자명 또는 비밀번호입니다. 다시 시도해주세요.' });
    }
  });
});


// 사용자 로그아웃 API
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("세션 파괴 중 오류 발생:", err);
      return res.status(500).send("서버 오류로 로그아웃 실패");
    } else {
      // res.clearCookie('uid');
      res.render("index");
      // res.render("mainPage.ejs");
        // res.send("/user/logout");
    }
  });
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

  // 사용자 ID 중복 확인
  const checkUserQuery = 'SELECT * FROM user WHERE user_id = ?';

  main_db.query(checkUserQuery, [username], (err, results) => {
    if (err) {
      console.error('Error checking user ID:', err);
      return res.status(500).json({ msg: 'Internal Server Error' });
    }

    if (results.length > 0) {
      return res.status(400).json({ msg: '이미 존재하는 사용자명입니다.' });
    }

    if (password !== checkPassword) {
      return res.status(400).json({ msg: '비밀번호가 일치하지 않습니다.' });
    }

    const salt = Math.random().toString(36).substring(2, 15);
    const hashedPassword = sha256(password + salt);

    Tesseract.recognize(idCardPath, 'kor')
      .then(({ data: { text } }) => {
        const ssn = extractSSNFromText(text);

        if (!ssn) {
          return res.status(400).json({ msg: '주민등록증에서 유효한 주민번호를 찾을 수 없습니다.' });
        }

        const insertUserQuery = 'INSERT INTO user (user_id, user_pw, name, ssn, user_type, user_lock, connections) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const insertSaltQuery = 'INSERT INTO salt (user_id, salt) VALUES (?, ?)';

        main_db.query(insertUserQuery, [username, hashedPassword, name, ssn, 'USER', 0, 0], (err, result) => {
          if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).json({ msg: 'Internal Server Error' });
          }

          const userId = result.insertId;

          salt_db.query(insertSaltQuery, [userId, salt], (err) => {
            if (err) {
              console.error('Error inserting salt:', err);
              return res.status(500).json({ msg: 'Internal Server Error' });
            }

            res.status(200).json({ msg: '회원가입이 완료되었습니다.' });
          });
        });
      })
      .catch(err => {
        console.error('Error during OCR:', err);
        return res.status(500).json({ msg: 'OCR 처리 중 오류가 발생했습니다.' });
      });
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

