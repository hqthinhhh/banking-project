const BankAccount = require('../models/bankAccount');
const Employee = require('../models/employee');
const mongoose = require("mongoose");

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
// const calculateSalary = async (req, res) => {
//   const { employeeID } = req.params;
//   const { startDate, endDate } = req.body;
//
//   try {
//     // Lấy tất cả tài khoản ngân hàng mà nhân viên đã tạo trong khoảng thời gian
//     const accounts = await BankAccount.aggregate([
//   {
//     $match: {
//       employeeID: new mongoose.Types.ObjectId(employeeID),
//       createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
//     }
//   },
//   {
//     $lookup: {
//       from: "customers",  // Tên collection chứa thông tin khách hàng
//       localField: "customerID",  // Trường trong BankAccount (là customerID)
//       foreignField: "_id",  // Trường trong Customer
//       as: "customerInfo"  // Kết quả sẽ được lưu vào trường này
//     }
//   },
//   {
//     $unwind: "$customerInfo"  // Chuyển đổi mảng thành đối tượng
//   },
//   // {
//   //   $project: {
//   //     _id: 0,
//   //     accountID: "$_id",  // Hoặc bạn có thể để ID tài khoản
//   //     accountType: "$accountType",
//   //     balance: "$balance",
//   //     customerName: "$customerInfo.name",  // Tên khách hàng
//   //     employeeID: "$employeeID",
//   //     createdAt: "$createdAt"
//   //   }
//   // }
// ]);
//     console.log(accounts)
//
//     // Tính lương
//     let salary = 0;
//     accounts.forEach(account => {
//       if (account.accountType === 'credit') {
//         salary += 500000; // 500 nghìn cho mỗi tài khoản tín dụng
//       } else if (account.accountType === 'deposit') {
//         salary += (account.initialDeposit * 0.02); // 2% số tiền gửi lần đầu
//       }
//     });
//
//     // Cập nhật lương cho nhân viên
//     // await Employee.findByIdAndUpdate(employeeId, { salary });
//
//     return res.status(200).json({ accounts, salary });
//   } catch (error) {
//     console.error('Error calculating salary:', error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

const calculateSalariesForAllEmployees = async (req, res) => {
  const { employeeID, startDate, endDate } = req.body;

  const match = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
    };

    // Validate and conditionally add employeeID to the match criteria
    if (employeeID) {
      if (!mongoose.Types.ObjectId.isValid(employeeID)) {
        return res.status(400).json({ message: 'Invalid employee ID format' });
      }
      match.employeeID = new mongoose.Types.ObjectId(employeeID); // Convert to ObjectId if valid
      // check if the employee exists
      const employee = await Employee.findOne({ _id: match.employeeID });
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
    }

  try {
    const results = await BankAccount.aggregate([
      {
        $match: match
      },
      {
        $group: {
          _id: "$employeeID",  // Gom nhóm theo ID nhân viên
          totalCreditAccounts: {
            $sum: {
              $cond: [{ $eq: ["$accountType", "credit"] }, 1, 0]  // Đếm số tài khoản tín dụng
            }
          },
          totalDepositAccounts: {
            $sum: {
              $cond: [{ $eq: ["$accountType", "deposit"] }, { $multiply: ["$initialDeposit", 0.02] }, 0]  // Tính tiền cho tài khoản gửi tiền từ initialDeposit
            }
          }
        }
      },
      {
        $lookup: {
          from: "employees",  // Tên collection chứa thông tin nhân viên
          localField: "_id",  // Trường trong bankAccounts (là employeeID)
          foreignField: "_id",  // Trường trong employees
          as: "employeeInfo"  // Kết quả sẽ được lưu vào trường này
        }
      },
      {
        $unwind: "$employeeInfo"  // Chuyển đổi mảng thành đối tượng
      },
      {
        $project: {
          _id: 0,
          employeeName: "$employeeInfo.name",  // Tên nhân viên
          salary: {
            $add: [
              { $multiply: ["$totalCreditAccounts", 500000] },  // 500k cho mỗi tài khoản tín dụng
              { $sum: "$totalDepositAccounts" }  // Tổng số tiền từ tài khoản gửi tiền
            ]
          }
        }
      }
    ]);

    return res.status(200).json(employeeID ? results[0] : results);
  } catch (error) {
    console.error('Error calculating salaries:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};



module.exports = {
  calculateSalariesForAllEmployees,
  createEmployee
};
