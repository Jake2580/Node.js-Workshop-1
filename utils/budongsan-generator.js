const faker = require('faker');

////// Database
const { setup } = require('./db_setup');
////////////////////

////// Other
const format = require('./format.js')
////////////////////

////// 부동산 매물 자동(랜덤) 등록
function generateApartmentData() {
    return {
        title: `${faker.address.cityName()} ${faker.address.streetName()} 아파트`,
        address: faker.address.streetAddress(),
        city: faker.address.city(),
        seller: "6677faedeb0522988d1d93dd",
        selling_price: Number(faker.commerce.price(300000000, 600000000, 0)),
        jeonse_price: Number(faker.commerce.price(150000000, 300000000, 0)),
        updated_at: format.getCurrentDateString(faker.date.recent(3650))
    };
}

function generateApartmentsData(length = 1) {
    return Array.from({ length }, generateApartmentData);  // { length: length }
}

async function insertApartmentsData(length = 1) {
    try {
        const { mongodb } = await setup();
        const insertResult = await mongodb.collection('budongsan').insertMany(generateApartmentsData(length));
        return insertResult;
    } catch (err) {
        console.err(err);
    }
}

module.exports.generateApartmentsData = generateApartmentsData;
module.exports.insertApartmentsData = insertApartmentsData;
////////////////////
