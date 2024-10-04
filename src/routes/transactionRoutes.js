const express = require('express');
const router = express.Router();
const { getAccountTransactionsByDate, getCreditAccountsWithDebt, makeWithdrawCredit, makePaymentFromDeposit } = require('../controllers/transactionController');

router.get('/credit/:accountID', getAccountTransactionsByDate)
router.get('/credit/list/debt', getCreditAccountsWithDebt)
router.post('/credit', makeWithdrawCredit);
router.post('/credit/payment', makePaymentFromDeposit);

module.exports = router;
