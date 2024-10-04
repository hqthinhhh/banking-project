const BankAccount = require('../models/bankAccount');
const Employee = require('../models/employee');

// Thêm nhân viên
const createEmployee = async (req, res) => {
  const { employeeID, CMT, name, dob, address, level, seniority, position } = req.body;

  try {
    // Kiểm tra xem nhân viên đã tồn tại chưa
    const existingEmployee = await Employee.findOne({ CMT });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this identity card already exists' });
    }

    const newEmployee = new Employee({
      employeeID,
      CMT,
      name,
      dob,
      address,
      level,
      seniority,
      position,
    });

    // Lưu nhân viên vào database
    await newEmployee.save();
    return res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Tính lương nhân viên dựa trên số tài khoản ngân hàng đã tạo
const calculateSalary = async (req, res) => {
  const { employeeId, startDate, endDate } = req.body;

  try {
    // Lấy tất cả tài khoản ngân hàng mà nhân viên đã tạo trong khoảng thời gian
    const accounts = await BankAccount.find({
      employeeID: employeeId,
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    // Tính lương
    let salary = 0;
    accounts.forEach(account => {
      if (account.accountType === 'credit') {
        salary += 500000; // 500 nghìn cho mỗi tài khoản tín dụng
      } else if (account.accountType === 'deposit') {
        salary += (account.initialDeposit * 0.02); // 2% số tiền gửi lần đầu
      }
    });

    // Cập nhật lương cho nhân viên
    await Employee.findByIdAndUpdate(employeeId, { salary });

    return res.status(200).json({ employeeId, salary });
  } catch (error) {
    console.error('Error calculating salary:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


module.exports = {
  calculateSalary,createEmployee
};
