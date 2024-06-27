const session = require('express-session');
const sessionConfig = session({
    secret: 'dkufe8938493j4e08349u',
    resave: false,
    saveUninitialized: true,
});

module.exports = { sessionConfig };