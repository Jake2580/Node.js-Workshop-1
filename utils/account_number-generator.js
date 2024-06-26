////// Database
const { MongoClient } = require('mongodb');
const ObjId = require('mongodb').ObjectId;
const DB_URI = process.env.DB_URI;
let mydb;

MongoClient.connect(DB_URI).then(client => {
    mydb = client.db('myboard');
}).catch((err) => {
    console.log(err);
});
////////////////////

function generateRandomAccountNumber() {
    let accountNumber = '';
    for (let i = 0; i < 12; i++) {
        accountNumber += Math.floor(Math.random() * 10);
    }
    return accountNumber;
}

async function generateUniqueAccountNumber() {
    let accountNumber, result;
    while (true) {
        accountNumber = generateRandomAccountNumber();
        try {
            result = await mydb.collection('account').findOne({ account_number: accountNumber });
            if (!result) {
                return accountNumber;
            }
        } catch (err) {
            console.error(err);
        }
    }
}

module.exports.generateRandomAccountNumber = generateRandomAccountNumber;
module.exports.generateUniqueAccountNumber = generateUniqueAccountNumber;
