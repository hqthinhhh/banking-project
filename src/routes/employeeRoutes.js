const express = require('express');
const router = express.Router();
const { createEmployee, calculateSalariesForAllEmployees } = require('../controllers/employeeController');

router.post('/', createEmployee);
// router.post('/calculate-salary/:employeeID', calculateSalary);
router.post('/calculate-salary', calculateSalariesForAllEmployees)
module.exports = router;
