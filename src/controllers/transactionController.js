const mongoose = require('mongoose');

const Customer = require('../models/customer');
const BankAccount = require('../models/bankAccount');
const Transaction = require('../models/transaction');

// Thực hiện thanh toán trên tài khoản tín dụng
const makeWithdrawCredit = async (req, res) => {
  const { creditAccountId, transactionAmount } = req.body;

  try {
    // Tìm tài khoản tín dụng
    const account = await BankAccount.findOne({accountID: creditAccountId});
    if (!account || account.accountType !== 'credit') {
      return res.status(404).json({ message: 'Credit account not found' });
    }

    // Kiểm tra số tiền thanh toán không vượt quá hạn mức tín dụng
    const currentDebt = account.balance; // Giả định rằng balance là số dư nợ hiện tại
    if (currentDebt - transactionAmount < 0) {
      return res.status(400).json({ message: 'Payment amount exceeds current debt' });
    }

    // Cập nhật số dư nợ
    account.balance -= transactionAmount;
    await account.save();

    // Ghi lại giao dịch
    const transaction = new Transaction({
      transactionID: new mongoose.Types.ObjectId(), // Hoặc bạn có thể tạo một ID riêng
      customerID: account.customerID, // Lấy customerID từ tài khoản ngân hàng
      accountID: account.accountID,
      transactionAmount,
      transactionType: 'withdraw', // Loại giao dịch
    });
    await transaction.save();

    return res.status(200).json({ message: 'Payment successful', transaction });
  } catch (error) {
    console.error('Error making payment:', error);
    return res.status(500).json({ message: error });
  }
};

// Thực hiện thanh toán từ tài khoản gửi tiền cho tài khoản tín dụng (dựa trên accountID từ body)
const makePaymentFromDeposit = async (req, res) => {
  const { creditAccountId, depositAccountId, paymentAmount, createdBy } = req.body; // Lấy từ body

  try {
    // Tìm tài khoản tín dụng bằng accountID
    const creditAccount = await BankAccount.findOne({ accountID: creditAccountId });
    if (!creditAccount || creditAccount.accountType !== 'credit') {
      return res.status(404).json({ message: 'Credit account not found' });
    }

    // Tìm tài khoản gửi tiền bằng accountID
    const depositAccount = await BankAccount.findOne({ accountID: depositAccountId });
    if (!depositAccount || depositAccount.accountType !== 'deposit') {
      return res.status(404).json({ message: 'Deposit account not found' });
    }

    // // Kiểm tra số tiền thanh toán không vượt quá hạn mức tín dụng
    // const currentDebt = creditAccount.balance; // Giả định rằng balance là số dư nợ hiện tại
    // if (currentDebt + paymentAmount > creditAccount.creditLimit) {
    //   return res.status(400).json({ message: 'Payment amount exceeds credit limit' });
    // }

    // Kiểm tra số dư tối thiểu trong tài khoản gửi tiền
    const remainingBalance = depositAccount.balance - paymentAmount;
    if (remainingBalance < depositAccount.minBalance) {
      return res.status(400).json({ message: 'Remaining balance must be greater than or equal to minimum balance' });
    }
    // // Kiểm tra tài khoản gửi tiền là của người tạo giao dịch
    // if (createdBy !== depositAccount.customerID) {
    //   return res.status(400).json({ message: 'This account does not belong to this customer' });
    // }

    // Cập nhật số dư nợ của tài khoản tín dụng và số dư của tài khoản gửi tiền
    creditAccount.balance += paymentAmount; // Cập nhật số dư nợ
    depositAccount.balance -= paymentAmount; // Trừ tiền từ tài khoản gửi tiền

    await creditAccount.save();
    await depositAccount.save();

    // Ghi lại giao dịch
    const transaction = new Transaction({
      transactionID: new mongoose.Types.ObjectId(), // Hoặc bạn có thể tạo một ID riêng
      customerID: creditAccount.customerID, // Lấy customerID từ tài khoản tín dụng
      accountID: creditAccount.accountID,
      transactionAmount: paymentAmount,
      transactionType: 'payment',
    });
    await transaction.save();

    return res.status(200).json({ message: 'Payment successful', transaction });
  } catch (error) {
    console.error('Error making payment:', error);
    return res.status(500).json({ message: error });
  }
};

// Lấy danh sách giao dịch tín dụng của một tài khoản trong khoảng thời gian
const getAccountTransactionsByDate = async (req, res) => {
  const { accountId } = req.params; // Lấy accountId từ params
  const { startDate, endDate } = req.query; // Lấy khoảng thời gian từ query

  try {
    // Kiểm tra xem tài khoản có tồn tại không
    const account = await BankAccount.findOne({ accountId, accountType: 'credit' });
    if (!account) {
      return res.status(404).json({ message: 'Credit account not found' });
    }

    // Lấy thông tin khách hàng dựa trên customerID từ tài khoản tín dụng
    const customer = await Customer.findById(account.customerID);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Tìm các giao dịch liên quan đến tài khoản tín dụng trong khoảng thời gian
    const transactions = await Transaction.find({
      accountID: account.accountID,
      transactionType: 'withdraw', // Chỉ lấy các giao dịch thanh toán
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    // Tính tổng số tiền giao dịch trên tài khoản đó
    const totalTransactionAmount = transactions.reduce((sum, tx) => sum + tx.transactionAmount, 0);

    return res.status(200).json({
      accountId: account.accountID,
      customerID: account.customerID,
      customerName: customer.name,
      totalTransactionAmount,
      transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Liệt kê thông tin các tài khoản tín dụng cùng tổng số nợ tồn đọng, sắp xếp theo số dư nợ giảm dần
const getCreditAccountsWithDebt = async (req, res) => {
  try {
    // Tìm tất cả các tài khoản tín dụng
    const creditAccounts = await BankAccount.find({ accountType: 'credit' });

    // Tính toán tổng nợ tồn đọng (creditLimit - balance) cho mỗi tài khoản
    const accountsWithDebt = creditAccounts.map(account => {
      const debt = account.creditLimit - account.balance;
      return {
        accountID: account._id,
        customerID: account.customerID,
        creditLimit: account.creditLimit,
        balance: account.balance,
        debt, // Tổng số nợ tồn đọng
      };
    });

    // Sắp xếp danh sách theo số nợ giảm dần
    accountsWithDebt.sort((a, b) => b.debt - a.debt);

    return res.status(200).json(accountsWithDebt);
  } catch (error) {
    console.error('Error fetching credit accounts with debt:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAccountTransactionsByDate,
  getCreditAccountsWithDebt,
  makeWithdrawCredit,
  makePaymentFromDeposit
};
