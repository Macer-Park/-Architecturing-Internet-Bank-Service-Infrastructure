const router = require("express").Router();
const setup = require("../db_setup");

// 계좌 메인
router.get('/', async (req, res) => {
    console.log("account main");
    // if (!req.session.user) {
    //     return res.redirect('/');
    // }
    const { main_db, salt_db } = await setup();

    // 현재는 조건문에 고정값
    const sql = `SELECT * FROM account WHERE account_id = 'testId_1'`;

    main_db.query(sql, [req.body.userid], (err, rows, fields) => {
        if (err) {
            res.render('account', { user: req.session.user });
            return;
        }
        try {
            console.log('DB read ok');
            console.log(rows);
            res.render('account', { user: req.session.user, account: rows });
        } catch (err) {
            res.render('account', { user: req.session.user });
        }
    });
});

// 거래내역 상세
router.get('/detail', async (req, res) => {
    console.log("account detial");
    // if (!req.session.user) {
    //     return res.redirect('/');
    // }
    const { main_db, salt_db } = await setup();

    // 현재는 조건문에 고정값
    const sql = `SELECT * FROM transfer_history WHERE sender_id = 'testId_1' OR reciever_id = 'testId_1'`;

    main_db.query(sql, [req.body.userid], (err, rows, fields) => {
        if (err) {
            res.render('account', { user: req.session.user });
            return;
        }
        try {
            console.log('DB read ok');
            console.log(rows);
            res.render('accountDetail', { user: req.session.user, transfer: rows });
        } catch (err) {
            res.render('account', { user: req.session.user });
        }
    });
});

// 이체
router.get('/transfer', async (req, res) => {
    console.log("transfer");
    // if (!req.session.user) {
    //     return res.redirect('/');
    // }
    res.render('transfer', { user: req.session.user });
});

module.exports = router;