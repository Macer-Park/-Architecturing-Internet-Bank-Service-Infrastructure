const dotenv = require("dotenv").config();

const mysql = require("mysql2");

let main_db;
let salt_db;

const setup = async () => {
    if(main_db && salt_db){
        return {main_db, salt_db};
    }

    try {
        main_db = mysql.createConnection({
            host : process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB
        });

        salt_db = mysql.createConnection({
            host : process.env.MYSQL_HOST_SALT,
            user: process.env.MYSQL_USER_SALT,
            password: process.env.MYSQL_PASSWORD_SALT,
            database: process.env.MYSQL_DB_SALT
        });

        main_db.connect();
        salt_db.connect();
        console.log("main_db 접속 성공");
        console.log("salt_db 접속 성공");

        return {main_db, salt_db};

    } catch (err) {
        console.log("DB 접속 실패", err);
    }
}

module.exports = setup;