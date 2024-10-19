const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeID: { type: String, required: true, unique: true },
  CMT: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  address: { type: String, required: true },
  level: { type: String, required: true },
  seniority: { type: Number, required: true },
  position: { type: String, required: true },
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;
