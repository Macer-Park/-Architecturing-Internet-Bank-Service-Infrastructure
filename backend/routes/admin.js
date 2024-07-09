const router = require("express").Router();
const setup = require("../db_setup");
const XLSX = require('xlsx');

const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// 사용자 계정 잠금 API
router.post('/lock', async (req, res) => {
  const userId = req.body.user_id;
  const { main_db, salt_db } = await setup();
  console.log("userId : ", userId);
  const query = 'UPDATE user SET user_lock = 1 WHERE user_id = ?';
  main_db.query(query, [userId], (err, results) => {
    if (err) throw err;
    res.json({ message: '사용자 계정이 잠금 되었습니다.' });
  });
});


// 모든 사용자 정보를 가져오는 API
router.get('/userlist', async (req, res) => {
  console.log("Userlist accessed");
  userlist(req, res);
});

// 페이지네이션을 위한 사용자 목록을 가져오는 함수
async function userlist(req, res) {
  const { main_db } = await setup();
  let page = parseInt(req.query.page) || 1;  // 페이지 번호
  const limit = 5;  // 페이지당 항목 수
  const skip = (page - 1) * limit;  // 건너뛸 항목 수

  const totalQuery = 'SELECT COUNT(*) AS count FROM user WHERE user_type = ?';
  const dataQuery = 'SELECT * FROM user WHERE user_type = ? ORDER BY user_id DESC LIMIT ? OFFSET ?';

  // 총 게시물 수 조회
  main_db.query(totalQuery, ["user"], (err, totalResults) => {
    if (err) throw err;
    
    const totalPosts = totalResults[0].count;
    const totalPages = Math.ceil(totalPosts / limit);

    // 현재 페이지의 게시물 목록 조회
    main_db.query(dataQuery, ["user", limit, skip], (err, results) => {
      if (err) throw err;
      
      res.render("admin", { user : results, currentPage: page, totalPages });
    });
  });
}

// 사용자 목록을 엑셀 파일로 다운로드하는 라우트
router.get('/download', async (req, res) => {
  const { main_db } = await setup();
  const query = 'SELECT user_id, name, user_lock FROM user WHERE user_type = ?';
  main_db.query(query, ["user"], (err, results) => {
    if (err) throw err;

    // 데이터 형식 변환
    const data = results.map(user => ({
      'USER ID': user.user_id,
      'USER NAME': user.name,
      'USER LOCK': user.user_lock
    }));

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // 오른쪽 상단에 설명 추가
    // XLSX.utils.sheet_add_aoa(ws, [["0 = false, 1 = true"]], { origin: "E1" });
    XLSX.utils.book_append_sheet(wb, ws, 'Users');

    // 버퍼로 엑셀 파일 생성
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // 파일 다운로드
    res.setHeader('Content-Disposition', 'attachment; filename="userlist.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  });
});




// 사용자 계정 잠금 해제 API
router.post('/unlock', async(req, res) => {
  const { main_db, salt_db } = await setup();
  const userId = req.body.user_id;
  console.log("userId : ", userId);

  const query = 'UPDATE user SET user_lock = 0 WHERE user_id = ?';
  main_db.query(query, [userId], (err, results) => {
    if (err) throw err;
    res.json({ message: '사용자 계정이 잠금 해제되었습니다.' });
  });
});

module.exports = router;
