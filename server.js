const express = require('express');
const APP = express();

const dotenv = require('dotenv').config();
const HOST = process.env.HOST;
const PORT = process.env.PORT;

const bodyParser = require('body-parser');
APP.use(bodyParser.urlencoded({ extended: true }));

////// templates, public
const path = require('path');
APP.set('views', path.join(__dirname, 'templates'));
APP.set('view engine', 'ejs');
APP.use(express.static('public'));
////////////////////

////// Database
const mongoclient = require('mongodb').MongoClient;
const DB_URI = dotenv.parsed.DB_URI;
let mydb;

mongoclient.connect(DB_URI).then(client => {
    mydb = client.db('myboard');
    APP.listen(PORT, function () {
        console.log(`SERVER READY! http://${HOST}:${PORT}`);
    });
}).catch((err) => {
    console.log(err);
});
////////////////////

////// Session 및 Passport 설정
const session = require('express-session');
const routes_session = require('./routes/session');

APP.use(session(routes_session.session_config));
APP.use(routes_session.passport.initialize());
APP.use(routes_session.passport.session());
////////////////////

////// Routes
APP.use('/', require('./routes/amm'));
APP.use('/', require('./routes/budongsan'));
APP.use('/', require('./routes/auth'));
////////////////////

////// Home
APP.get('/', function (req, res) {
    let user;
    if (req.session.passport) { user = req.session.passport; } else { user = req.user; }
    res.render('index.ejs', { user: user });
});
////////////////////