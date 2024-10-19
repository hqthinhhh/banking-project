const Customer = require('../models/customer');
const BankAccount = require('../models/bankAccount');
const Counter = require('../models/counter');

// Hàm lấy customerID tự động tăng
const getNextSequence = async (name) => {
  const counter = await Counter.findOneAndUpdate(
    { id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

const createCustomer = async (req, res) => {
  const { CMT, name, customerID, dob, address } = req.body;

  try {
    const idForCustomer = customerID ? customerID : await getNextSequence('customerID');

    const newCustomer = new Customer({
      customerID: idForCustomer,
      CMT,
      name,
      dob,
      address,
    });

    await newCustomer.save();
    return res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ message: `Error creating customer: ${error}` });
  }
};

const getTopCustomersByDeposit = async (req, res) => {
  try {
    const depositAccounts = await BankAccount.find({ accountType: 'deposit' });

    const customerDeposits = {};

    depositAccounts.forEach(account => {
      if (customerDeposits[account.customerID]) {
        customerDeposits[account.customerID] += account.balance;
      } else {
        customerDeposits[account.customerID] = account.balance;
      }
    });

    const sortedCustomers = Object.keys(customerDeposits)
      .map(customerID => ({
        customerID,
        totalDeposit: customerDeposits[customerID],
      }))
      .sort((a, b) => b.totalDeposit - a.totalDeposit)
      .slice(0, 10);

    // Lấy thông tin chi tiết của 10 khách hàng này
    const topCustomers = await Promise.all(
      sortedCustomers.map(async customer => {
        const customerInfo = await Customer.findById(customer.customerID);
        return {
          customerID: customerInfo._id,
          name: customerInfo.name,
          CMT: customerInfo.CMT,
          totalDeposit: customer.totalDeposit,
        };
      })
    );

    return res.status(200).json(topCustomers);
  } catch (error) {
    console.error('Error fetching top customers by deposit:', error);
    return res.status(500).json({ message: error});
  }
};

module.exports = {
  createCustomer,
  getTopCustomersByDeposit
};
