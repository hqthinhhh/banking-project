const mongoose = require('mongoose');

const Customer = require('../models/customer');
const BankAccount = require('../models/bankAccount');
const Transaction = require('../models/transaction');

const makeWithdrawCredit = async (req, res) => {
  const { creditAccountId, transactionAmount } = req.body;

  try {
    const account = await BankAccount.findOne({accountID: creditAccountId});
    if (!account || account.accountType !== 'credit') {
      return res.status(404).json({ message: 'Credit account not found' });
    }

    const currentDebt = account.balance;
    if (currentDebt - transactionAmount < 0) {
      return res.status(400).json({ message: 'Payment amount exceeds current debt' });
    }

    account.balance -= transactionAmount;
    await account.save();

    const transaction = new Transaction({
      transactionID: new mongoose.Types.ObjectId(),
      customerID: account.customerID,
      accountID: account.accountID,
      transactionAmount,
      transactionType: 'withdraw',
    });
    await transaction.save();

    return res.status(200).json({ message: 'Payment successful', transaction });
  } catch (error) {
    console.error('Error making payment:', error);
    return res.status(500).json({ message: error });
  }
};

const makePaymentFromDeposit = async (req, res) => {
  const { creditAccountId, depositAccountId, paymentAmount, createdBy } = req.body;

  try {
    const creditAccount = await BankAccount.findOne({ accountID: creditAccountId });
    if (!creditAccount || creditAccount.accountType !== 'credit') {
      return res.status(404).json({ message: 'Credit account not found' });
    }

    const depositAccount = await BankAccount.findOne({ accountID: depositAccountId });
    if (!depositAccount || depositAccount.accountType !== 'deposit') {
      return res.status(404).json({ message: 'Deposit account not found' });
    }

    const remainingBalance = depositAccount.balance - paymentAmount;
    if (remainingBalance < depositAccount.minBalance) {
      return res.status(400).json({ message: 'Remaining balance must be greater than or equal to minimum balance' });
    }

    creditAccount.balance += paymentAmount;
    depositAccount.balance -= paymentAmount;

    await creditAccount.save();
    await depositAccount.save();

    const transaction = new Transaction({
      transactionID: new mongoose.Types.ObjectId(),
      customerID: creditAccount.customerID,
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

const getAccountTransactionsByDate = async (req, res) => {
  const { accountId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const account = await BankAccount.findOne({ accountId, accountType: 'credit' });
    if (!account) {
      return res.status(404).json({ message: 'Credit account not found' });
    }

    const customer = await Customer.findById(account.customerID);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const transactions = await Transaction.find({
      accountID: account.accountID,
      transactionType: 'withdraw',
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

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

const getCreditAccountsWithDebt = async (req, res) => {
  try {
    const creditAccounts = await BankAccount.find({ accountType: 'credit' });

    const accountsWithDebt = creditAccounts.map(account => {
      const debt = account.creditLimit - account.balance;
      return {
        accountID: account._id,
        customerID: account.customerID,
        creditLimit: account.creditLimit,
        balance: account.balance,
        debt,
      };
    });

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
