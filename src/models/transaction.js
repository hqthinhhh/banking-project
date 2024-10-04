const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionID: { type: String, required: true, unique: true },
  customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  accountID: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  transactionAmount: { type: Number, required: true },
  transactionType: { type: String, enum: ['payment', 'withdraw'], required: true }, // Thanh toán hoặc rút tiền
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
