// DB Setup
const { setup } = require('./utils/db_setup');

// Express
const express = require('express');
const app = express();

// Dotenv
const dotenv = require('dotenv').config();
const PORT = process.env.PORT;

// Body-parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());  // /check-id POST 요청 시 필요함

// templates, public
const path = require('path');
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// listen
app.listen(PORT, function () {
    console.log(`SERVER READY! http://127.0.0.1:${PORT}`);
});

// session
const { sessionConfig } = require('./routes/session');
app.use(sessionConfig);

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/amm'));
app.use('/', require('./routes/budongsan'));
