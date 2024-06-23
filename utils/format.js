function formatNumber(number) {
    return `${number}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getCurrentDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

module.exports.formatNumber = formatNumber;
module.exports.getCurrentDateString = getCurrentDateString;