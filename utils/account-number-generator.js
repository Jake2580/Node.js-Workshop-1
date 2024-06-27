const { setup } = require('./db_setup');

function generateRandomAccountNumber() {
    let accountNumber = '';
    for (let i = 0; i < 12; i++) {
        accountNumber += Math.floor(Math.random() * 10);
    }
    return accountNumber;
}

async function generateUniqueAccountNumber() {
    let accountNumber, result;
    const { mongodb } = await setup();
    
    while (true) {
        accountNumber = generateRandomAccountNumber();
        try {
            result = await mongodb.collection('account').findOne({ account_number: accountNumber });
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
