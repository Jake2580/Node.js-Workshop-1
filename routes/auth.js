let router = require('express').Router();

const sha = require('sha256');
const AccountNumber = require('../utils/account-number-generator');
const { setup } = require('../utils/db_setup');

router.get('/', async function (req, res) {
    if (!req.session.user) {
        res.clearCookie('uid', { path: '/' });
    }

    res.render('index.ejs', { user : req.session.user });
});

router.get('/login', async function (req, res) {
    if (!req.session.user) {
        return res.render('login.ejs');
    }

    res.redirect('/');
});

router.post('/login', async function (req, res) {
    const { mongodb } = await setup();
    mongodb.collection('account').findOne({ userid: req.body.userid }).then((sessionUser) => {
        if (!sessionUser) {  // 계정 없음
            return res.render('login.ejs', { data: { alertMsg: '다시 로그인 해주세요.' } });
        }
        
        if (sessionUser.userpw != sha(req.body.userpw)) {  // 비밀번호 틀림
            return res.render('login.ejs', { data: { alertMsg: '다시 로그인 해주세요.' } });
        }
        
        req.session.user = { userid: req.body.userid };  // 로그인 성공
        res.cookie('uid', req.body.userid);
        return res.redirect('/');
    }).catch((err) => {
        res.render('login.ejs', { data: { alertMsg: '다시 로그인 해주세요.' } });
    });
});

// router.post('/login', passport.authenticate('local', { failureRedirect: '/fail', }),
// function (req, res) {
//     res.cookie('uid', req.session.user.user, {
//         expires: new Date(Date.now() + 60 * 60 * 1000),  // 1 hour
//         path: '/',
//     });

//     res.redirect('/');
// });

router.get('/logout', function (req, res) {
    req.session.destroy();
    res.clearCookie('uid', { path: '/' });
    res.redirect('/');
});

router.get('/signup', function (req, res) {
    res.render('signup.ejs');
});

router.post('/signup', async function (req, res) {
    const { mongodb } = await setup();
    mongodb.collection('account').findOne({ userid: req.body.userid }).then(async (result) => {
        if (result != null) {
            return res.status(500).send('중복되는 아이디입니다.');
        }
        
        if (req.body.userpw.length < 4 || req.body.userid.length < 4) {
            return res.status(500).send('아이디와 비밀번호는 4자리 이상으로 해주세요.');
        }
        
        try {
            const account_number = await AccountNumber.generateUniqueAccountNumber();
            await mongodb.collection('account').insertOne({
                userid: req.body.userid,
                userpw: sha(req.body.userpw),
                account_number: account_number,
                email: req.body.useremail,
                account_balance: 0,
                birthday: req.body.userbirthday,
            }).then((result) => {
                res.redirect('/');  // 회원가입 성공
            });
        }
        catch (err) {
            console.error(err);
            res.status(500).send('회원가입 실패');
        }
    });
});
////////////////////

//// signup check id
router.post('/check-id', async function (req, res) {
    try {
        if (req.body.userid == undefined) {
            res.json({ isDuplicate: true });
            return;
        }
        
        const { mongodb } = await setup();
        const existingUser = await mongodb.collection('account').findOne({ userid: req.body.userid });
        
        if (existingUser) {
            res.json({ isDuplicate: true });
        } else {
            res.json({ isDuplicate: false });
        }
    } catch (error) {
        console.error('Error checking user ID:', error);
        res.status(500).json({ error: 'An error occurred while checking the user ID.' });
    }
});

router.post('/check-account', async function (req, res) {
    let userid = req.body.userid;
    let userpw = sha(req.body.userpw);

    const { mongodb } = await setup();
    mongodb.collection('account').findOne({ userid }).then((sessionUser) => {
        if (!sessionUser) {
            return res.json({ success: false, message: 'id' });
        }
        
        if (sessionUser.userpw != userpw) {
            return res.json({ success: false, message: 'pw' });
        }
        
        return res.json({ success: true });
    });
});
////////////////////

module.exports = router;