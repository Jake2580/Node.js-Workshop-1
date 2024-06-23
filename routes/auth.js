let router = require('express').Router();

////// Database
const mongoclient = require('mongodb').MongoClient;
const ObjId = require('mongodb').ObjectId;
const DB_URI = process.env.DB_URI;

let mydb;
mongoclient.connect(DB_URI).then(client => {
    mydb = client.db('myboard');
}).catch((err) => {
    console.log(err);
});
////////////////////

////// Passport
const passport = require('passport');
////////////////////

////// Other
const sha = require('sha256');

function generateRandomAccountNumber() {
    let accountNumber = '';
    for (let i = 0; i < 12; i++) {
        accountNumber += Math.floor(Math.random() * 10);
    }
    return accountNumber;
}

async function generateUniqueAccountNumber() {
    let account_number, result;
    while (true) {
        account_number = generateRandomAccountNumber();
        try {
            result = await mydb.collection('account').findOne({ account_number: account_number });
            if (!result) {
                return account_number;
            }
        } catch (err) {
            console.error(err);
        }
    }
}
///////////////////

////// Auth
router.get('/login', function (req, res) {
    if (req.session.passport) {
        // res.render('index.ejs', { user: req.session.passport });
        res.redirect('/');
    } else {
        res.render('login.ejs');
    }
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/fail', }),
    function (req, res) {
        res.redirect('/');
    });

router.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
});

router.get('/signup', function (req, res) {
    res.render('signup.ejs');
});

router.post('/signup', async function (req, res) {
    try {
        const account_number = await generateUniqueAccountNumber();
        await mydb.collection('account').insertOne({
            userid: req.body.userid,
            userpw: sha(req.body.userpw),
            account_number: account_number,
            email: req.body.useremail,
            account_balance: 0,
            birthday: req.body.userbirthday,
        }).then((result) => {
            res.redirect('/');  // 회원가입 성공
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('회원가입 실패');
    }
});
////////////////////

module.exports = router;