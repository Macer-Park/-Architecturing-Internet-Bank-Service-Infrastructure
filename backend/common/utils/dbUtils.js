const setup = require("../../db_setup");

const checkDbConnection = async () => {
    const { main_db } = await setup();
    if (!main_db) {
        throw new Error('DB 접속 실패');
    }
    return main_db;
};

module.exports = { checkDbConnection };