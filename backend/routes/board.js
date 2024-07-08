const router = require("express").Router();
const { checkDbConnection } = require("../common/utils/dbUtils");

const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// CSRF 토큰을 모든 뷰에 전역으로 전달
// router.use(csrfProtection); // 모든 라우트에 CSRF 미들웨어 적용

// router.use(function(req, res, next) {
//   res.locals.csrfToken = req.csrfToken();
//   next();
// });

// 특정 카테고리의 게시물 목록
router.get('/list/:category', csrfProtection, async (req, res) => {
    const category = req.params.category;
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 10; // 페이지당 항목 수
    const offset = (page - 1) * itemsPerPage;

    const countQuery = `SELECT COUNT(*) AS count FROM board WHERE category = ?`;
    const listQuery = `SELECT * FROM board WHERE category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    try {
        const main_db = await checkDbConnection();

        // 전체 항목 수 가져오기
        const [countRows] = await main_db.query(countQuery, [category]);
        const totalItems = countRows[0].count;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // 항목 목록 가져오기
        const [rows] = await main_db.query(listQuery, [category, itemsPerPage, offset]);

        res.render('board/list', {
            user: req.session.user,
            data: rows,
            category,
            currentPage: page,
            totalPages,
            csrfToken: req.csrfToken()
        });
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
router.get('/insert', csrfProtection, (req, res) => {
    if (!req.session.user || req.session.user.user_type.toLowerCase() !== 'admin') {
        return res.status(403).send('권한이 없습니다');
    }
    res.render('board/insert', { user: req.session.user, csrfToken: req.csrfToken() });
});


// 공지사항 추가 처리
router.post('/insert', csrfProtection, async (req, res) => {
    if (!req.session.user || req.session.user.user_type.toLowerCase() !== 'admin') {
        return res.status(403).send('권한이 없습니다');
    }

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
    if (!req.session.user || req.session.user.user_type.toLowerCase() !== 'admin') {
        return res.status(403).send('권한이 없습니다');
    }
    const main_db = await checkDbConnection();
    const board_id = req.params.id;
    const query = `SELECT * FROM board WHERE board_id = ?`;

    try {
        const [rows] = await main_db.query(query, [board_id]);
        if (rows.length > 0) {
            res.render('board/update', { user: req.session.user, board: rows[0], csrfToken: req.csrfToken() });
        } else {
            res.status(404).send('공지사항을 찾을 수 없습니다');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('서버 오류');
    }
});

// 공지사항 수정 처리
router.post('/update/:id', csrfProtection, async (req, res) => {
    if (!req.session.user || req.session.user.user_type.toLowerCase() !== 'admin') {
        return res.status(403).send('권한이 없습니다');
    }
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
