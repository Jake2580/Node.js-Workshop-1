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

////// 부동산
router.get('/budongsan', function (req, res) {
    mydb.collection('budongsan').find().toArray().then(result => {
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
        res.render('login.ejs');
        return;
    }

    mydb.collection('account').findOne({ userid: req.session.passport.user }).then((result) => {
        let seller_object = result;

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        mydb.collection('budongsan').insertOne({
            title: req.body.title,
            address: req.body.address,
            city: req.body.city,
            seller: seller_object._id.toString(),
            selling_price: Number(req.body.selling_price),
            jeonse_price: Number(req.body.jeonse_price),
            updated_at: formattedDate,
        }).then((result) => {
            
        }).catch(err => {
            console.log(err);
            res.status(500).send();
        });
    
        res.redirect('/budongsan');
    });
});

router.get('/budongsan/:_id', function (req, res) {
    if (req.params._id.length !== 24) {
        return res.status(400).send('Invalid ObjectId format');
    }

    req.params._id = new ObjId(req.params._id);
    mydb.collection('budongsan').findOne({ _id: req.params._id }).then((result) => {
        // console.log(result);
        res.render('budongsan_content.ejs', { data: result });
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

router.get('/budongsan/edit/:_id', function (req, res) {
    req.params._id = new ObjId(req.params._id);
    mydb.collection('budongsan').findOne({ _id: req.params._id }).then((result) => {
        res.render('budongsan_edit.ejs', { data: result });
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

router.post('/budongsan/edit', function (req, res) {
    req.body._id = new ObjId(req.body._id);

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    mydb.collection('budongsan').updateOne({ _id: req.body._id }, {
        $set: {
            title: req.body.title,
            address: req.body.address,
            city: req.body.city,
            selling_price: Number(req.body.selling_price),
            jeonse_price: Number(req.body.jeonse_price),
            updated_at: formattedDate,
        }
    }).then((result) => {
        res.redirect('/budongsan');
    }).catch(err => {
        console.log(err);
    });
});

router.post('/budongsan/delete', function (req, res) {
    req.body._id = new ObjId(req.body._id);
    mydb.collection('budongsan').deleteOne(req.body).then((result) => {
        res.redirect('/budongsan');  // 삭제 완료
    });
});

router.post('/budongsan/selling', function (req, res) {
    if (req.session.passport == undefined) {
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
    if (req.session.passport == undefined) {
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