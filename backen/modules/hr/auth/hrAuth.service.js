import { db } from "../../../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ENV } from "../../../config/env.js";

export const loginHRService = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password required");
  }

  // 🔍 find HR employee
  const [rows] = await db.query(
    `SELECT id, employeeCode, name, email, password_hash
     FROM employees
     WHERE email = ? AND isActive = 1
     LIMIT 1`,
    [email],
  );

  if (!rows.length) {
    throw new Error("Invalid credentials");
  }

  const employee = rows[0];

  // 👇 YAHAN ADD KARO DEBUG LOGS
console.log("EMPLOYEE:", employee);
console.log("PASSWORD HASH:", employee.password_hash);

  // 🔐 compare password
  const isMatch = await bcrypt.compare(password, employee.password_hash);
  console.log("ENTERED PASSWORD:", password);
console.log("MATCH RESULT:", isMatch);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // 🎫 generate token
  const token = jwt.sign(
    {
      id: employee.id,
      employee_id: employee.id,
      employee_code: employee.employeeCode,
      role: "hr",
    },
    ENV.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return {
    message: "Login successful",
    token,
    employee: {
      id: employee.id,
      employee_code: employee.employee_code,
      name: employee.name,
      email: employee.email,
    },
  };
};
