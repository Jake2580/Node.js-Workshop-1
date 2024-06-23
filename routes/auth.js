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

////// Auth
router.get('/login', function (req, res) {
    if (req.session.passport) {
        res.render('index.ejs', { user: req.session.passport });
    } else {
        res.render('login.ejs');
    }
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/fail', }),
    function (req, res) {
        res.render('index.ejs', { user: req.session.passport })
    });

router.get('/logout', function (req, res) {
    req.session.destroy();
    res.render('index.ejs', { user: null });
});

router.get('/signup', function (req, res) {
    res.render('signup.ejs');
});

router.post('/signup', function (req, res) {
    mydb.collection('account').insertOne({
        userid: req.body.userid,
        userpw: sha(req.body.userpw),
        account_number: "0",
        email: req.body.useremail,
        account_balance: 0,
        birthday: req.body.userbirthday,
    }).then((result) => {
        // console.log('회원가입 성공');
    });

    res.redirect('/');
});
////////////////////

module.exports = router;