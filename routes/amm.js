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

////// Other
const format = require('../utils/format.js')
////////////////////

////// 자산관리 AMM
router.get('/amm', function (req, res) {
    if (!req.session.passport) {
        res.redirect('/login');
        return;
    }

    mydb.collection('account').findOne({ userid: req.session.passport.user }).then((result) => {
        result.account_balance = format.formatNumber(result.account_balance);
        res.render('amm.ejs', { user: result });
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

router.post('/amm/credit', function (req, res) {
    req.body.userid = new ObjId(req.body.userid);
    mydb.collection('account').findOne({ _id: req.body.userid }).then((result) => {
        result.account_balance = format.formatNumber(result.account_balance);
        res.render('amm_credit.ejs', { user: result });
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

router.post('/amm/credit/submit', function (req, res) {
    let other_account_number = req.body.other_account_number;
    let other_account_balance = Number(req.body.other_account_balance);
    req.body.userid = new ObjId(req.body.userid);

    mydb.collection('account').findOne({ _id: req.body.userid }).then((result) => {
        if (result == null) {
            res.send('고객님의 계정은 존재하지 않습니다.');
            return;
        }

        let my_account = result;
        let other_account;
        mydb.collection('account').findOne({ account_number: other_account_number }).then((result) => {
            if (result == null) {
                res.send(`(${other_account_number}) 존재하지 않는 계좌번호 입니다.`);
                return;
            }
            other_account = result;

            // update my_account
            mydb.collection('account').updateOne({ _id: my_account._id }, {
                $set: { account_balance: my_account.account_balance - other_account_balance }
            }).then((result) => {
                // update other_account
                mydb.collection('account').updateOne({ _id: other_account._id }, {
                    $set: { account_balance: other_account.account_balance + other_account_balance }
                }).then((result) => {
                    res.redirect('/amm');  // Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
                }).catch(err => {
                    console.log(err);
                });
            }).catch(err => {
                console.log(err);
            });
        });

        // console.log(`result: ${result}`);
        // res.render('amm_credit.ejs', { user: result });
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

router.post('/amm/debit', function (req, res) {
    req.body.userid = new ObjId(req.body.userid);
    mydb.collection('account').findOne({ _id: req.body.userid }).then((result) => {
        result.account_balance = format.formatNumber(result.account_balance);
        res.render('amm_debit.ejs', { user: result });
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

router.post('/amm/debit/submit', function (req, res) {
    let withdraw = req.body.withdraw;
    req.body.userid = new ObjId(req.body.userid);

    mydb.collection('account').findOne({ _id: req.body.userid }).then((result) => {
        if (result == null) {
            res.send('고객님의 계정은 존재하지 않습니다.');
            return;
        }

        let my_account = result;
        mydb.collection('account').updateOne({ _id: my_account._id }, {
            $set: { account_balance: my_account.account_balance - withdraw }
        }).then((result) => {
            res.redirect('/amm');
        }).catch(err => {
            console.log(err);
        });
    });
});
////////////////////

module.exports = router;