const express = require('express');
const router = express.Router();
const { createAccount } = require('../controllers/accountController');

// Route tạo tài khoản cho khách hàng
router.post('/customers/:customerId', createAccount);

module.exports = router;
