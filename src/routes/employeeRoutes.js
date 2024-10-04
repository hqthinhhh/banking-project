const express = require('express');
const router = express.Router();
const { createEmployee, calculateSalary } = require('../controllers/employeeController');

router.post('/', createEmployee);
router.post('/calculate-salary', calculateSalary);

module.exports = router;
