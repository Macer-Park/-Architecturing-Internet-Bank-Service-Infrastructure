const router = require("express").Router();
const setup = require("../db_setup");

// 공지사항 페이지 렌더링
router.get('/board/list', (req, res) => {
    res.render('board_list', { user: req.session.user });
  });
  
  // 공지사항 상세 페이지 렌더링
  router.get('/board/list/select', (req, res) => {
    res.render('board_select', { user: req.session.user });
  });
  
  // 공지사항 추가 API
  router.post('/board/insert', (req, res) => {
    // 공지사항 추가 로직 추가 필요
    res.send('공지사항 추가 완료');
  });
  
  // 공지사항 업데이트 API
  router.post('/board/update', (req, res) => {
    // 공지사항 업데이트 로직 추가 필요
    res.send('공지사항 업데이트 완료');
  });
  
  // 공지사항 삭제 API
  router.post('/board/delete', (req, res) => {
    // 공지사항 삭제 로직 추가 필요
    res.send('공지사항 삭제 완료');
  });

module.exports = router;