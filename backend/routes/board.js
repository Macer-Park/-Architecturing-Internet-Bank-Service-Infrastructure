const router = require("express").Router();
const { checkDbConnection } = require("../common/utils/dbUtils");

// 특정 카테고리의 게시물 목록
router.get('/list/:category', async (req, res) => {
    const category = req.params.category;
    const query = `SELECT * FROM board WHERE category = ? ORDER BY created_at DESC`;

    try {
        const main_db = await checkDbConnection();
        const [rows] = await main_db.query(query, [category]);
        res.render('board/list', { user: req.session.user, data: rows, category });
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// 공지사항 상세
router.get('/content/:id', async (req, res) => {
    const board_id = req.params.id;
    const query = `SELECT * FROM board WHERE board_id = ?`;

    try {
        const main_db = await checkDbConnection();
        const [rows] = await main_db.query(query, [board_id]);
        if (rows.length > 0) {
            res.render('board/detail', { user: req.session.user, board: rows[0] });
        } else {
            res.status(404).send('공지사항을 찾을 수 없습니다');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});


// 공지사항 추가 폼
router.get('/insert', (req, res) => {
  res.render('board/insert');
});


// 공지사항 추가 처리
router.post('/insert', async (req, res) => {
    const { title, content, category } = req.body;
    const query = `INSERT INTO board (title, content, category) VALUES (?, ?, ?)`;

    try {
        const main_db = await checkDbConnection();
        await main_db.query(query, [title, content, category]);
        res.redirect(`/board/list/${category}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류');
    }
});


// 공지사항 수정 페이지
router.get('/update/:id', async (req, res) => {
    const main_db = await checkDbConnection();
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
        const main_db = await checkDbConnection();
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
        const main_db = await checkDbConnection();
        await main_db.query(query, [board_id]);
        // 삭제 후 기본 페이지로 이동
        res.redirect(`/board/list/default`);
    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류');
    }
});

module.exports = router;
