const fs = require('fs');
/** process env set */
const ini = require('ini');
/** MongoDB set config */
const config = ini.parse(fs.readFileSync('private.ini', 'utf-8'));

const Express = require(`express`);
const app = Express();

const path = require(`path`);

/** script file  */
const public = path.join(__dirname, `public`);
/** source file */
const src = path.join(__dirname, `src`);
/** ejs file */
const views = path.join(__dirname, `views`);
app.set(`views`, views);
app.set(`view engine`, `ejs`);

const bodyParser = require(`body-parser`);
app.use(bodyParser.urlencoded({ extended: true }));

/** PORT : 8080 */
const PORT = process.env.PORT || 8080;
/** HOST : localhost and 127.0.0.1 */
const HOST = process.env.HOST || '127.0.0.1';


const MongoDB_client = require(`mongodb`).MongoClient;
const MongoDB_URI = config.mongodb.uri;
const ObjID = require(`mongodb`).ObjectId;

let mydb;
MongoDB_client
    .connect(MongoDB_URI)
    .then(client => {
        mydb = client.db('account');
        console.log(`MongoDB connet`);
        app.listen(PORT, function () {
            console.log(`SERVER ON! http://${HOST}:${PORT}`);
        });
    })
    .catch((err) => {
        console.log(err);
    });

// const MongoDB_connet = () => {
//     if (process.env.NODE_ENV !== `production`) {
//         MongoDB_client.set(`debug`, true)
//     }
//     MongoDB_client.MongoDB_connet(MongoDB_URI, {
//         DB_name: `account`,
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     }), (error) => {
//         if (error) {
//             console.log(error);
//         }
//         else {
//             console.log(`SERVER ON! http:${HOST}:${PORT}`);
//         }
//     }
// }

// MongoDB_client.connection.on(`error`, (error) => {
//     console.error(`MongoDB connet error`, error);
// });

// MongoDB_client.connection.on(`disconneted`, () => {
//     console.error(`Retry MongoDB connetion`);
//     MongoDB_connet();
// })

app.get(`/saving/:_id`, (req, res) => {
    const _id = req.params._id;
})
// Views EJS Web page
app.post(`/saving`, function (req, res) {
    req.body._id = new ObjId(req.body._id);
    mydb.collection(`account`)
        .insertOne ({
            userid : req.body.userid,
            userpw : req.body.userpw,
            account_number : req.body.account_number,
            account_balance : req.body.account_balance,
            email : req.body.email,
            birthday : req.body.birthday
        })
        .then(result => {
            console.log(result);
            res.status(200).send()
        })
        .catch(error => {
            console.error(error);
            res.status(500).send(error)
        })
    res.render(`saving.ejs`)
})

app.post(`/budongsan`, function (req, res) {
    req.body._id = new ObjId(req.body._id);
    mydb.collection(`account`)
        .insertOne({
            title : req.body.apartment_title,
            address : req.body.address,
            city : req.body.city,
            selling_price : req.body.selling_price,
            jeonse_price : req.body.jeonse_price,
            update : req.body.update
        })
        .then(result => {
            console.log(result);
            res.status(200).send()
        })
        .catch(error => {
            console.error(error);
            res.status(500).send(error)
        })
        res.render(`budongsan.ejs`)
})

// module.exports = connect;