let router = require('express').Router();

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

////// Other
const format = require('../utils/format.js')
////////////////////

////// 부동산
router.get('/budongsan', function (req, res) {
    mydb.collection('budongsan').find().toArray().then(results => {
        for (let i = 0; i < results.length; i++) {
            results[i].selling_price = format.formatNumber(results[i].selling_price);
            results[i].jeonse_price = format.formatNumber(results[i].jeonse_price);
        }

        res.render('budongsan.ejs', { data: results });
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

router.get('/budongsan/enter', function (req, res) {
    if (!req.session.passport) {
        res.redirect('/login');
        return;
    }
    
    res.render('budongsan_enter.ejs');
});

router.post('/budongsan/save', function (req, res) {
    if (!req.session.passport) {
        res.redirect('/login');
        return;
    }

    mydb.collection('account').findOne({ userid: req.session.passport.user }).then((seller_user) => {
        mydb.collection('budongsan').insertOne({
            title: req.body.title,
            address: req.body.address,
            city: req.body.city,
            seller: seller_user._id.toString(),
            selling_price: Number(req.body.selling_price),
            jeonse_price: Number(req.body.jeonse_price),
            updated_at: format.getCurrentDateString(),
        }).then((result) => {
            res.redirect('/budongsan');
        }).catch(err => {
            console.log(err);
            res.status(500).send();
        });
    });
});

router.get('/budongsan/:_id', function (req, res) {
    if (req.params._id.length !== 24) {
        return res.status(400).send('Invalid ObjectId format');
    }
    
    let seller = false;
    req.params._id = new ObjId(req.params._id);
    mydb.collection('budongsan').findOne({ _id: req.params._id }).then(async (budongsan) => {
        try {
            if (req.session.passport) {
                await mydb.collection('account').findOne({ userid: req.session.passport.user }).then((session_user) => {
                    if (session_user._id.toString() == budongsan.seller || session_user.userid == 'admin') {
                        seller = true;
                    }
                });
            }
            
            budongsan.selling_price = format.formatNumber(budongsan.selling_price);
            budongsan.jeonse_price = format.formatNumber(budongsan.jeonse_price);
            res.render('budongsan_content.ejs', { data: budongsan, seller: seller });
        } catch (err) {
            console.log(err);
        }
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

router.get('/budongsan/edit/:_id', function (req, res) {
    if (!req.session.passport) {
        res.redirect('/login');
        return;
    }

    req.params._id = new ObjId(req.params._id);
    mydb.collection('budongsan').findOne({ _id: req.params._id }).then((budongsan) => {
        let req_userid = req.session.passport.user;
        mydb.collection('account').findOne({ userid: req_userid }).then((session_user) => {
            if (session_user._id.toString() != budongsan.seller && req_userid != 'admin') {
                res.send('당신은 권한이 없습니다.');
                return;
            }
    
            res.render('budongsan_edit.ejs', { data: budongsan });
        });
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

router.post('/budongsan/edit', function (req, res) {
    mydb.collection('budongsan').updateOne({ _id: new ObjId(req.body._id) }, {
        $set: {
            title: req.body.title,
            address: req.body.address,
            city: req.body.city,
            selling_price: Number(req.body.selling_price),
            jeonse_price: Number(req.body.jeonse_price),
            updated_at: format.getCurrentDateString(),
        }
    }).then((result) => {
        res.redirect('/budongsan');
    }).catch(err => {
        console.log(err);
    });
});

router.post('/budongsan/delete', function (req, res) {
    if (!req.session.passport) {
        res.redirect('/login');
        return;
    }

    let req_userid = req.session.passport.user;
    mydb.collection('account').findOne({ userid: req_userid }).then((session_user) => {
        if (session_user._id.toString() != req.body.seller && req_userid != 'admin') {
            res.send('당신은 권한이 없습니다.');
            return;
        }

        req.body._id = new ObjId(req.body._id);
        mydb.collection('budongsan').deleteOne(req.body).then((result) => {
            res.redirect('/budongsan');  // 삭제 완료
        });
    });
});

router.post('/budongsan/selling', function (req, res) {
    if (!req.session.passport) {
        res.redirect('/login');
        return;
    }

    mydb.collection('budongsan').findOne({ _id: new ObjId(req.body._id) }).then((budongsan) => {
        if (budongsan == null) {
            res.send('존재하지 않습니다.');
            return;
        }

        mydb.collection('account').findOne({ userid: req.session.passport.user }).then((session_user) => {
            if (session_user == null) {
                res.send('존재하지 않습니다.');
                return;
            }

            if (budongsan.selling_price > session_user.account_balance) {
                res.send(`${budongsan.selling_price - session_user.account_balance}원이 부족합니다.`);
                return;
            }

            // budongsan delete
            mydb.collection('budongsan').deleteOne(budongsan).then(result => {});

            // session_user account_balance update
            mydb.collection('account').updateOne({ _id: session_user._id }, {
                $set: { account_balance: session_user.account_balance - budongsan.selling_price }
            }).then((result) => {});

            // seller account_balance update
            const seller_id = new ObjId(budongsan.seller);
            mydb.collection('account').findOne({ _id: seller_id }).then((seller_user) => {
                mydb.collection('account').updateOne({ _id: seller_id }, {
                    $set: { account_balance: seller_user.account_balance + budongsan.selling_price }
                }).then((result) => {
                    res.redirect('/budongsan');
                });
            });
        });
    });
});

router.post('/budongsan/jeonse/', function (req, res) {
    if (!req.session.passport) {
        res.redirect('/login');
        return;
    }

    mydb.collection('budongsan').findOne({ _id: new ObjId(req.body._id) }).then((budongsan) => {
        if (budongsan == null) {
            res.send('게시물이 존재하지 않습니다.');
            return;
        }

        mydb.collection('account').findOne({ userid: req.session.passport.user }).then((session_user) => {
            if (session_user == null) {
                res.redirect('/');  // 세션 유저의 계정이 존재하지 않음
                return;
            }

            if (budongsan.jeonse_price > session_user.account_balance) {
                res.send(`${budongsan.jeonse_price - session_user.account_balance}원이 부족합니다.`);
                return;
            }

            // budongsan delete
            mydb.collection('budongsan').deleteOne(budongsan).then(result => { });

            // account_balance update
            mydb.collection('account').updateOne({ _id: session_user._id }, {
                $set: { account_balance: session_user.account_balance - budongsan.jeonse_price }
            }).then((result) => {});

            // seller account_balance update
            const seller_id = new ObjId(budongsan.seller);
            mydb.collection('account').findOne({ _id: seller_id }).then((seller) => {
                mydb.collection('account').updateOne({ _id: seller_id }, {
                    $set: { account_balance: seller.account_balance + budongsan.jeonse_price }
                }).then((result) => {
                    res.redirect('/budongsan');
                });
            });
        });
    });
});
////////////////////

module.exports = router;