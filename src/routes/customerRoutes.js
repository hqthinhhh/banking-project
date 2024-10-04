const express = require('express');
const router = express.Router();
const { createCustomer, getTopCustomersByDeposit } = require('../controllers/customerController');

router.get('/top-customer', getTopCustomersByDeposit)
// Route tạo khách hàng
router.post('/', createCustomer);

module.exports = router;
