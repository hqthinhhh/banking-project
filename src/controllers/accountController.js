const mongoose = require('mongoose');
const BankAccount = require('../models/bankAccount');
const Customer = require('../models/customer');
const Employee = require('../models/employee');

// Tạo tài khoản ngân hàng cho khách hàng
const createAccount = async (req, res) => {
  const { customerId } = req.params;
  const { accountType, balance, creditLimit, interestRate, minBalance, employeeId } = req.body;

  try {
    // check if the employee exists
    const customer = await Customer.findOne({ _id: customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    // check if the employee exists
    const employee = await Employee.findById(employeeId); // Giả định bạn có model Employee
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    let newAccount;
    if (accountType === 'credit') {
      const creditAccountsCount = await BankAccount.countDocuments({
        customerID: customer._id,
        accountType: 'credit'
      });
      if (creditAccountsCount >= 2) {
        return res.status(400).json({ message: 'A customer can only have a maximum of 2 credit accounts' });
      }
      if (!creditLimit) {
        return res.status(400).json({ message: 'Credit limit is required for credit accounts' });
      }
      newAccount = new BankAccount({
        accountID: new mongoose.Types.ObjectId(),
        customerID: customer._id,
        accountType,
        balance,
        creditLimit,
        employeeID: employee._id,
      });
    } else if (accountType === 'deposit') {
      const depositAccountsCount = await BankAccount.countDocuments({
        customerID: customer._id,
        accountType: 'deposit'
      });
      if (depositAccountsCount >= 3) {
        return res.status(400).json({ message: 'A customer can only have a maximum of 3 deposit accounts' });
      }
      if (!interestRate || !minBalance) {
        return res.status(400).json({ message: 'Interest rate and minimum balance are required for deposit accounts' });
      }
      newAccount = new BankAccount({
        accountID: new mongoose.Types.ObjectId(),
        customerID: customer._id,
        accountType,
        balance,
        initialDeposit: balance,
        interestRate,
        minBalance,
        employeeID: employee._id,
      });
    } else {
      return res.status(400).json({ message: 'Invalid account type' });
    }

    await newAccount.save();
    return res.status(201).json(newAccount);
  } catch (error) {
    console.error('Error creating account:', error);
    return res.status(500).json({ message: error });
  }
};

module.exports = {
  createAccount,
};
