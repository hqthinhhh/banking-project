const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  accountID: { type: String, required: true, unique: true },
  customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  accountType: { type: String, enum: ['credit', 'deposit'], required: true },
  balance: { type: Number, required: true },
  initialDeposit: { type: Number },
  creditLimit: { type: Number },
  interestRate: { type: Number },
  minBalance: { type: Number },
  employeeID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Employee' },
}, { timestamps: true });

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
module.exports = BankAccount;
