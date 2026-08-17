import bcrypt from "bcryptjs";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { signToken } from "../../../utils/jwt.js";
import { db } from "../../../config/db.js";

export const loginEmployee = asyncHandler(async (req, res) => {

  console.log("🔥 LOGIN HIT:", req.body);
  const { email, password } = req.body;

  const [rows] = await db.query(
    `
    SELECT 
      e.id,
      e.name,
      e.email,
      e.password_hash,
      e.employeeCode,
      e.joiningId,
      e.departmentId,
      d.name as department

    FROM employees e
    LEFT JOIN departments d ON d.id = e.departmentId

    WHERE e.email = ?
    AND e.isActive = 1
    LIMIT 1
    `,
    [email],
  );

  if (!rows.length) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const employee = rows[0];

  console.log("👤 EMPLOYEE FOUND:", employee);
  console.log("🔐 ENTERED PASSWORD:", password);
console.log("🔑 DB HASH:", employee.password_hash);

  const isMatch = await bcrypt.compare(
    password,
    employee.password_hash,
  );

  console.log("MATCH RESULT:", isMatch);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

const user = {
  id: employee.id,
  role: "EMPLOYEE",   // <-- YE ADD KARNA HAI
  name: employee.name,
  email: employee.email,
  employeeCode: employee.employeeCode,
  joiningId: employee.joiningId,
  department: employee.department,
};

  const token = signToken(user);

  res.json({
    success: true,
    token,
    user,
  });
});

export const getMe = async (
  req,
  res
) => {
  try {
    res.json({
      success: true,
      user: req.employee,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};