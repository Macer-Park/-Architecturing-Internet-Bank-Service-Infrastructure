const router = require("express").Router();
const setup = require("../db_setup");

// 공지사항
router.get('/list', async (req, res) => {
    const { main_db } = await setup();
    const query = `SELECT * FROM board ORDER BY created_at DESC`;
    try {
        const [rows] = await main_db.query(query);
        res.render('board/list', { user: req.session.user, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).send('서버 오류');
    }
});

// 공지사항 상세
router.get('/content/:id', async (req, res) => {
    const { main_db } = await setup();
    const board_id = req.params.id;
    const query = `SELECT * FROM board WHERE board_id = ?`;

    try {
        const [rows] = await main_db.query(query, [board_id]);
        if (rows.length > 0) {
            res.render('board/detail', { user: req.session.user, board: rows[0] });
        } else {
            res.status(404).send('공지사항을 찾을 수 없습니다');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('서버 오류');
    }
});


// 공지사항 추가 폼
router.get('/insert', (req, res) => {
  res.render('board/insert');
});

// 공지사항 수정 페이지
router.get('/update/:id', async (req, res) => {
    const { main_db } = await setup();
    if (!main_db) {
        return res.status(500).send('DB 접속 실패');
    }
    const board_id = req.params.id;
    const query = `SELECT * FROM board WHERE board_id = ?`;

    try {
        const [rows] = await main_db.query(query, [board_id]);
        if (rows.length > 0) {
            res.render('board/update', { user: req.session.user, board: rows[0] });
        } else {
            res.status(404).send('공지사항을 찾을 수 없습니다');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('서버 오류');
    }
});

// 공지사항 수정 처리
router.post('/update/:id', async (req, res) => {
    const { title, content } = req.body;
    const board_id = req.params.id;
    const query = `UPDATE board SET title = ?, content = ?, updated_at = NOW() WHERE board_id = ?`;

    try {
        const { main_db } = await setup();
        if (!main_db) {
            return res.status(500).send('DB 접속 실패');
        }
        await main_db.query(query, [title, content, board_id]);
        res.redirect(`/board/content/${board_id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('서버 오류');
    }
});

// 공지사항 삭제
router.post('/delete', async (req, res) => {
    const { board_id } = req.body;
    const query = `DELETE FROM board WHERE board_id = ?`;

    try {
        const { main_db } = await setup();
        if (!main_db) {
            return res.status(500).send('DB 접속 실패');
        }
        await main_db.query(query, [board_id]);
        // res.send('공지사항 삭제 완료');
        res.redirect(`/board/list`);
    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류');
    }
});

module.exports = router;
