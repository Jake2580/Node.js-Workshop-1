const dotenv = require('dotenv').config();
const { MongoClient } = require('mongodb');

let mongodb;

const setup = async function() {
    if (mongodb) {
        return { mongodb };
    }

    try {
        const mognoDbUrl = process.env.MONGODB_URL;
        const mongoClient  = await MongoClient.connect(mognoDbUrl);
        mongodb = mongoClient.db(process.env.MONGODB_DB);
        console.log('MongoDB 접속 성공.');

        return { mongodb };
    } catch (err) {
        console.error('DB 접속 실패', err);
        throw err;  // 접속에 실패한다면 서버 가동을 할 수 없게 함
    }
};

module.exports = { setup };