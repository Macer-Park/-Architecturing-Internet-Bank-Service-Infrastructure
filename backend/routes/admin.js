const router = require("express").Router();
const setup = require("../db_setup");

// 관리자 페이지 렌더링
router.get('/admin', (req, res) => {
  console.log("Admin page accessed");
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/');
  }
  res.render('admin', { user: req.session.user });
});

// 모든 사용자 정보를 가져오는 API
router.get('/userlist', async(req, res) => {
  console.log("Userlist accessed");
  const { main_db, salt_db } = await setup();
  const query = 'SELECT * FROM user';
  main_db.query(query, (err, results) => {
    if (err) throw err;
    console.log(results);
    res.json(results);
  });
});

// 사용자 계정 잠금 해제 API
router.post('/unlock', (req, res) => {
  const userId = req.body.user_id;
  const query = 'UPDATE user SET account_locked = FALSE, login_attempts = 0 WHERE id = ?';
  main_db.query(query, [userId], (err, results) => {
    if (err) throw err;
    res.json({ message: '사용자 계정이 잠금 해제되었습니다.' });
  });
});

// 계좌 잠금 해제 API
router.post('/release', (req, res) => {
  const userId = req.body.user_id;
  const query = 'UPDATE account SET account_locked = FALSE WHERE user_id = ?';
  main_db.query(query, [userId], (err, results) => {
    if (err) throw err;
    res.json({ message: '계좌 잠금이 해제되었습니다.' });
  });
});

module.exports = router;
