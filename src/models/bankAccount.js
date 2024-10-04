const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  accountID: { type: String, required: true, unique: true },
  customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  accountType: { type: String, enum: ['credit', 'deposit'], required: true },
  balance: { type: Number, required: true },
  initialDeposit: { type: Number },
  // Thông tin đặc biệt cho loại tài khoản
  creditLimit: { type: Number }, // Chỉ dành cho tài khoản tín dụng
  interestRate: { type: Number }, // Chỉ dành cho tài khoản gửi tiền
  minBalance: { type: Number },   // Số dư tối thiểu (dành cho tài khoản gửi tiền)
  employeeID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Employee' },
}, { timestamps: true });

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
module.exports = BankAccount;
