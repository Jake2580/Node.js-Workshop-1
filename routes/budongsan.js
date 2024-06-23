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

////// 부동산
router.get('/budongsan', function (req, res) {
    mydb.collection('budongsan').find().toArray().then(result => {
        for (let i = 0; i < result.length; i++) {
            result[i].selling_price = format.formatNumber(result[i].selling_price);
            result[i].jeonse_price = format.formatNumber(result[i].jeonse_price);
        }
        res.render('budongsan.ejs', { data: result });
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

router.get('/budongsan/enter', function (req, res) {
    res.render('budongsan_enter.ejs');
});

router.post('/budongsan/save', function (req, res) {
    if (!req.session.passport) {
        res.redirect('/login');
        return;
    }

    mydb.collection('account').findOne({ userid: req.session.passport.user }).then((result) => {
        let seller_object = result;
        mydb.collection('budongsan').insertOne({
            title: req.body.title,
            address: req.body.address,
            city: req.body.city,
            seller: seller_object._id.toString(),
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

    req.params._id = new ObjId(req.params._id);
    mydb.collection('budongsan').findOne({ _id: req.params._id }).then((result) => {
        result.selling_price = format.formatNumber(result.selling_price);
        result.jeonse_price = format.formatNumber(result.jeonse_price);
        res.render('budongsan_content.ejs', { data: result });
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
    mydb.collection('budongsan').findOne({ _id: req.params._id }).then((result) => {
        let req_userid = req.session.passport.user;
        let budongsan_object = result;
        mydb.collection('account').findOne({ userid: req_userid }).then((result) => {
            let req_id = result._id.toString();
            let seller = budongsan_object.seller;
            if (req_id != seller && req_userid != 'admin') {
                res.send('당신은 권한이 없습니다.');
                return;
            }
    
            res.render('budongsan_edit.ejs', { data: budongsan_object });
        });
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

router.post('/budongsan/edit', function (req, res) {
    req.body._id = new ObjId(req.body._id);
    mydb.collection('budongsan').updateOne({ _id: req.body._id }, {
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
    mydb.collection('account').findOne({ userid: req_userid }).then((result) => {
        if (result._id.toString() != req.body.seller && req_userid != 'admin') {
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

    const USERID = req.session.passport.user;
    req.body._id = new ObjId(req.body._id);
    mydb.collection('budongsan').findOne({ _id: req.body._id }).then((result) => {
        if (result == null) {
            res.send('존재하지 않습니다.');
            return;
        }

        let budongsan = result;
        mydb.collection('account').findOne({ userid: req.session.passport.user }).then((result) => {
            if (result == null) {
                res.send('존재하지 않습니다.');
                return;
            }

            let my_account = result;
            if (budongsan.selling_price > my_account.account_balance) {
                res.send(`${budongsan.selling_price - my_account.account_balance}원이 부족합니다.`);
                return;
            }

            // budongsan 삭제 delete
            mydb.collection('budongsan').deleteOne(budongsan).then(result => { });

            // account_balance update
            mydb.collection('account').updateOne({ _id: my_account._id }, {
                $set: { account_balance: my_account.account_balance - budongsan.selling_price }
            }).then((result) => {
                res.redirect('/budongsan');  // 매매 구매 완료
            }).catch(err => {
                console.log(err);
            });
        });
    });
});

router.post('/budongsan/jeonse/', function (req, res) {
    if (!req.session.passport) {
        res.redirect('/login');
        return;
    }

    const USERID = req.session.passport.user;
    req.body._id = new ObjId(req.body._id);
    mydb.collection('budongsan').findOne({ _id: req.body._id }).then((result) => {
        if (result == null) {
            res.send('존재하지 않습니다.');
            return;
        }

        let budongsan = result;
        mydb.collection('account').findOne({ userid: USERID }).then((result) => {
            if (result == null) {
                res.send('존재하지 않습니다.');
                return;
            }

            let my_account = result;
            if (budongsan.jeonse_price > my_account.account_balance) {
                res.send(`${budongsan.jeonse_price - my_account.account_balance}원이 부족합니다.`);
                return;
            }

            // budongsan 삭제 delete
            mydb.collection('budongsan').deleteOne(budongsan).then(result => { });

            // account_balance update
            mydb.collection('account').updateOne({ _id: my_account._id }, {
                $set: { account_balance: my_account.account_balance - budongsan.jeonse_price }
            }).then((result) => {
                res.redirect('/budongsan');  // 전세 구매 완료
            }).catch(err => {
                console.log(err);
            });
        });
    });
});
////////////////////

module.exports = router;