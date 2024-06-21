const account_number = document.querySelector(`#account_number`);

/** 계좌 잔고 */
const account_balance = document.querySelector(`#account_balance`);
const account_balance_current = 0
if (account_balance_current >= 0) {
    `?`
}
else if(account_balance_current < 0) {
    alert(`현재 계좌 잔고는 ${account_balance_current} 입니다.`)
}


/** 송금 */
const credit = document.querySelector(`#credit`);
const credit_input = document.querySelector(`#credit_input`);
credit.addEventListener(`click`, function () {
    if (account_balance_current >= credit_input) {
        const credit_result = account_balance_current - credit_input
        return account_balance_current(credit_result)
    }
    else if (account_balance_current < credit_input) {
        alert("잔액이 부족합니다.");
    }
});

/** 출금 */
const debit = documenr.querySelector(`#debit`);
const debit_input = document.querySelector(`#debit_input`);
debit.addEventListener(`click`, function () {
    if (account_balance_current >= debit_input) {
        const debit_result = account_balance_current - debit_input
        return account_balance_current(debit_result)
    }
    else if (account_balance_current < debit_input) {
        alert("잔액이 부족합니다.");
    }
});