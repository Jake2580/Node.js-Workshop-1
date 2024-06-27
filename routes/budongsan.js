let router = require('express').Router();

const Format = require('../utils/format');
const BudongsanGenerator = require('../utils/budongsan-generator');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const { setup } = require('../utils/db_setup');

////// Generator
router.get('/budongsan/generator/:size', async function (req, res) {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    if (req.session.user.userid != 'admin') {
        return res.send('당신은 권한이 없습니다.');
    }

    const length = Number(req.params.size);
    if (length == NaN || length < 1) {
        return res.send('제대로 입력해주세요.');
    }

    budongsans = BudongsanGenerator.generateApartmentsData(length);
    const { mongodb } = await setup();
    result = await mongodb.collection('budongsan').insertMany(budongsans);
    res.send(result);
});
////////////////////

// 부동산 매물
router.get('/budongsan', async function (req, res) {
    let currentPage = Number(req.query.page);
    if (!currentPage) {
        currentPage = 1;
    }

    const itemsPerPage = 50;  // 한번에 얼만큼의 게시물을 뿌려줄 것인가.
    const paginationWindowSize = 15;  // 맨 아래에 있는 2번째 페이지 크기 설정
    const skipCount = (currentPage - 1) * itemsPerPage;

    const { mongodb } = await setup();
    mongodb.collection('budongsan').find().sort({ updated_at: -1 }).skip(skipCount).limit(itemsPerPage).toArray().then((budongsans) => {
        mongodb.collection('budongsan').countDocuments({}).then((budongsanCount) => {
            let pageSize = Math.ceil(budongsanCount / itemsPerPage);  // 최대 페이지 크기
            let startNumber = (Math.floor((currentPage - 1) / paginationWindowSize) * paginationWindowSize) + 1;  // 페이지의 첫 숫자
            res.render('budongsan.ejs', { 
                data: budongsans,
                number: { currentPage, pageSize, startNumber, paginationWindowSize },
            });
        });
    });
});

// 부동산 매물 등록 페이지
router.get('/budongsan/enter', async function (req, res) {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    res.render('budongsan_enter.ejs');
});

// 부동산 매물 등록
router.post('/budongsan/save', async function (req, res) {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { mongodb } = await setup();
    mongodb.collection('account').findOne({ userid: req.session.user.userid }).then((sellerUser) => {
        mongodb.collection('budongsan').insertOne({
            title: req.body.title,
            address: req.body.address,
            city: req.body.city,
            seller: sellerUser._id.toString(),
            selling_price: Number(req.body.selling_price),
            jeonse_price: Number(req.body.jeonse_price),
            updated_at: Format.getCurrentDateString(),
        }).then((result) => {
            res.redirect('/budongsan');
        }).catch((err) => {
            console.log(err);
            res.status(500).send();
        });
    });
});

// 부동산 매물 Content
router.get('/budongsan/:_id', async function (req, res) {
    if (req.params._id.length !== 24) {
        return res.status(400).send('Invalid ObjectId format');
    }

    const { mongodb } = await setup();
    let seller = false;
    mongodb.collection('budongsan').findOne({ _id: ObjectId.createFromHexString(req.params._id) }).then(async (budongsan) => {
        try {
            if (req.session.user) {
                await mongodb.collection('account').findOne({ userid: req.session.user.userid }).then((sessionUser) => {
                    if (sessionUser._id.toString() == budongsan.seller || sessionUser.userid == 'admin') {
                        seller = true;
                    }
                });
            }

            budongsan.selling_price = Format.formatNumber(budongsan.selling_price);
            budongsan.jeonse_price = Format.formatNumber(budongsan.jeonse_price);
            res.render('budongsan_content.ejs', { data: budongsan, seller: seller });
        } catch (err) {
            console.log(err);
        }
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

// 부동산 매물 수정 페이지
router.get('/budongsan/edit/:_id', async function (req, res) {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { mongodb } = await setup();
    mongodb.collection('budongsan').findOne({ _id: ObjectId.createFromHexString(req.params._id) }).then((budongsan) => {
        mongodb.collection('account').findOne({ userid: req.session.user.userid }).then((sessionUser) => {
            if (sessionUser._id.toString() != budongsan.seller && req.session.user.userid != 'admin') {
                return res.send('당신은 권한이 없습니다.');
            }
            
            res.render('budongsan_edit.ejs', { data: budongsan });
        });
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

// 부동산 매물 수정
router.post('/budongsan/edit', async function (req, res) {
    const { mongodb } = await setup();
    mongodb.collection('budongsan').updateOne({ _id: ObjectId.createFromHexString(req.body._id) }, {
        $set: {
            title: req.body.title,
            address: req.body.address,
            city: req.body.city,
            selling_price: Number(req.body.selling_price),
            jeonse_price: Number(req.body.jeonse_price),
            updated_at: Format.getCurrentDateString(),
        }
    }).then((result) => {
        res.redirect('/budongsan');
    }).catch(err => {
        console.log(err);
    });
});

// 부동산 매물 삭제
router.post('/budongsan/delete', async function (req, res) {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { mongodb } = await setup();
    mongodb.collection('account').findOne({ userid: req.session.user.userid }).then((sessionUser) => {
        if (sessionUser._id.toString() != req.body.seller && req.session.user.userid != 'admin') {
            return res.send('당신은 권한이 없습니다.');
        }
        
        req.body._id = ObjectId.createFromHexString(req.body._id);
        mongodb.collection('budongsan').deleteOne(req.body).then((deleteResult) => {
            res.redirect('/budongsan');  // 삭제 완료
        });
    });
});

// 부동산 매물 매매가
router.post('/budongsan/selling', async function (req, res) {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { mongodb } = await setup();
    mongodb.collection('budongsan').findOne({ _id: ObjectId.createFromHexString(req.body._id) }).then((budongsan) => {
        if (budongsan == null) {
            return res.send('해당 매물은 존재하지 않습니다.');
        }

        mongodb.collection('account').findOne({ userid: req.session.user.userid }).then((sessionUser) => {
            if (sessionUser == null) {
                return res.redirect('/login');
            }

            if (budongsan.selling_price > sessionUser.account_balance) {
                return res.send(`${budongsan.selling_price - sessionUser.account_balance}원이 부족합니다.`);
            }

            // budongsan delete
            mongodb.collection('budongsan').deleteOne(budongsan).then(deleteResult => { });

            // session_user account_balance update
            mongodb.collection('account').updateOne({ _id: sessionUser._id }, {
                $set: { account_balance: sessionUser.account_balance - budongsan.selling_price }
            }).then((updateResult) => { });

            // seller account_balance update
            const _id = ObjectId.createFromHexString(budongsan.seller);
            mongodb.collection('account').findOne({ _id }).then((sellerUser) => {
                mongodb.collection('account').updateOne({ _id }, {
                    $set: { account_balance: sellerUser.account_balance + budongsan.selling_price }
                }).then((result) => {
                    res.redirect('/budongsan');
                });
            });
        });
    });
});

// 부동산 매물 전세가
router.post('/budongsan/jeonse/', async function (req, res) {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { mongodb } = await setup();
    mongodb.collection('budongsan').findOne({ _id: ObjectId.createFromHexString(req.body._id) }).then((budongsan) => {
        if (budongsan == null) {
            return res.send('해당 매물은 존재하지 않습니다.');
        }

        mongodb.collection('account').findOne({ userid: req.session.user.userid }).then((sessionUser) => {
            if (sessionUser == null) {  // 세션 유저의 계정이 존재하지 않음
                return res.redirect('/login');
            }

            if (budongsan.jeonse_price > sessionUser.account_balance) {
                return res.send(`${budongsan.jeonse_price - sessionUser.account_balance}원이 부족합니다.`);
            }

            // budongsan delete
            mongodb.collection('budongsan').deleteOne(budongsan).then(deleteResult => { });

            // account_balance update
            mongodb.collection('account').updateOne({ _id: sessionUser._id }, {
                $set: { account_balance: sessionUser.account_balance - budongsan.jeonse_price }
            }).then((updateResult) => { });

            // seller account_balance update
            const _id = ObjectId.createFromHexString(budongsan.seller);
            mongodb.collection('account').findOne({ _id }).then((seller) => {
                mongodb.collection('account').updateOne({ _id }, {
                    $set: { account_balance: seller.account_balance + budongsan.jeonse_price }
                }).then((result) => {
                    res.redirect('/budongsan');
                });
            });
        });
    });
});

module.exports = router;