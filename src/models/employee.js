const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeID: { type: String, required: true, unique: true },
  CMT: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  address: { type: String, required: true },
  level: { type: String, required: true }, // bậc nghề
  seniority: { type: Number, required: true }, // thâm niên
  position: { type: String, required: true }, // vị trí công việc
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;
