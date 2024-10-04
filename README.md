Nhân viên (Employee):

    employeeID
    CMT
    name
    dob (date of birth)
    address
    level (bậc nghề)
    seniority
    position (vị trí công việc)


Khách hàng (Customer):

    customerID
    CMT
    name
    dob
    address

Tài khoản ngân hàng (BankAccount):

    accountID
    accountType (loại tài khoản: tín dụng/gửi tiền)
    balance (số dư)
    Các thông tin phụ thuộc loại tài khoản:
    Tài khoản tín dụng (Credit Account):
    creditLimit
    currentDebt
    Tài khoản gửi tiền (Deposit Account):
    interestRate
    minBalance

Giao dịch (Transaction):

    transactionID
    customerID
    accountID
    transactionAmount
    transactionType (nợ/thanh toán)