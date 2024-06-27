let router = require('express').Router();

const format = require('../utils/format.js')
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const { setup } = require('../utils/db_setup');

// 자산관리 메인 페이지
router.get('/amm', async function (req, res) {
    if (!req.session.user) {
        res.redirect('/login');
        return;
    }

    const { mongodb } = await setup();
    mongodb.collection('account').findOne({ userid: req.session.user.userid }).then((sessionUser) => {
        sessionUser.account_balance = format.formatNumber(sessionUser.account_balance);
        res.render('amm.ejs', { user: sessionUser });
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

// 자산관리 입금 페이지
router.post('/amm/credit', async function (req, res) {
    const { mongodb } = await setup();
    mongodb.collection('account').findOne({ _id: ObjectId.createFromHexString(req.body.userid) }).then((sessionUser) => {
        sessionUser.account_balance = format.formatNumber(sessionUser.account_balance);
        res.render('amm_credit.ejs', { user: sessionUser });
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

// 자산관리 입금
router.post('/amm/credit/submit', async function (req, res) {
    const otherAccountNumber = req.body.other_account_number;
    const received = Number(req.body.other_account_balance);

    const { mongodb } = await setup();
    mongodb.collection('account').findOne({ _id: ObjectId.createFromHexString(req.body.userid) }).then((sessionUser) => {
        if (sessionUser == null) {
            res.send('고객님의 계정은 존재하지 않습니다.');
            return;
        }

        mongodb.collection('account').findOne({ account_number: otherAccountNumber }).then((otherUser) => {
            if (otherUser == null) {
                res.send(`(${otherAccountNumber}) 존재하지 않는 계좌번호 입니다.`);
                return;
            }

            // update my account
            mongodb.collection('account').updateOne({ _id: sessionUser._id }, {
                $set: { account_balance: sessionUser.account_balance - received }
            }).then((result) => {
                // update other account
                mongodb.collection('account').updateOne({ _id: otherUser._id }, {
                    $set: { account_balance: otherUser.account_balance + received }
                }).then((result) => {
                    res.redirect('/amm');
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

// 자산관리 출금 페이지
router.post('/amm/debit', async function (req, res) {
    const { mongodb } = await setup();
    mongodb.collection('account').findOne({ _id: ObjectId.createFromHexString(req.body.userid) }).then((sessionUser) => {
        sessionUser.account_balance = format.formatNumber(sessionUser.account_balance);
        res.render('amm_debit.ejs', { user: sessionUser });
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

// 자산관리 출금
router.post('/amm/debit/submit', async function (req, res) {
    const { mongodb } = await setup();
    mongodb.collection('account').findOne({ _id: ObjectId.createFromHexString(req.body.userid) }).then((sessionUser) => {
        if (sessionUser == null) {
            res.send('고객님의 계정은 존재하지 않습니다.');
            return;
        }

        mongodb.collection('account').updateOne({ _id: sessionUser._id }, {
            $set: { account_balance: sessionUser.account_balance - req.body.withdraw }
        }).then((result) => {
            res.redirect('/amm');
        }).catch(err => {
            console.log(err);
        });
    });
});
////////////////////

module.exports = router;