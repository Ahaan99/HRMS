import { db } from "../../../config/db.js";

// ==============================
// CREATE / UPDATE payroll
// ==============================
export const upsertPayrollService = async (client_id, payload) => {
  const employeeCode = payload.employee_id;

  if (!employeeCode) {
    throw new Error("employeeCode is required");
  }

  // 🔥 STEP 1 — get real employee id
  const [[emp]] = await db.query(
    `
    SELECT id
    FROM client_employees
    WHERE client_id = ?
      AND id = ?
    LIMIT 1
    `,
    [client_id, employeeCode],
  );

  if (!emp) {
    throw new Error("Employee not found for this client");
  }
  const employee_id = emp.id;
  let payroll_month = payload.payroll_month?.trim();

  if (!/^\d{4}-\d{2}$/.test(payroll_month)) {
    throw new Error("Invalid payroll month format. Use YYYY-MM");
  }
  const basic_salary = Number(payload.basic_salary || 0);
  const hra = Number(payload.hra || 0);
  const ta = Number(payload.ta || 0);
  const da = Number(payload.da || 0);
  const attendance_days = Number(payload.attendance_days || 0);
  const overtime_amount = Number(payload.overtime_amount || 0);
  const pf = Number(payload.pf || 0);
  const esic = Number(payload.esic || 0);

  // ==============================
  // CALCULATIONS
  // ==============================
  const gross_salary = basic_salary + hra + ta + da + overtime_amount;

  const net_salary = gross_salary + pf + esic;

  const query = `
    INSERT INTO client_payroll
    (client_id, employee_id, payroll_month,
     basic_salary, hra, ta, da,
     attendance_days, overtime_amount,
     gross_salary, pf, esic, net_salary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      basic_salary = VALUES(basic_salary),
      hra = VALUES(hra),
      ta = VALUES(ta),
      da = VALUES(da),
      attendance_days = VALUES(attendance_days),
      overtime_amount = VALUES(overtime_amount),
      gross_salary = VALUES(gross_salary),
      pf = VALUES(pf),
      esic = VALUES(esic),
      net_salary = VALUES(net_salary)
  `;

  const values = [
    client_id,
    employee_id,
    payroll_month,
    basic_salary,
    hra,
    ta,
    da,
    attendance_days,
    overtime_amount,
    gross_salary,
    pf,
    esic,
    net_salary,
  ];

  // 🔥 debug safety (remove later)
  // console.log("VALUES LENGTH:", values.length);

  const [result] = await db.query(query, values);
  return result;
};

// ==============================
// GET payroll list
// ==============================
export const getPayrollListService = async (client_id) => {
  const query = `
  SELECT 
    p.*,
    e.name AS employee_name,
    e.designationId AS designation
  FROM client_payroll p
  LEFT JOIN client_employees e
    ON e.id = p.employee_id
  WHERE p.client_id = ?
  ORDER BY p.id DESC
`;
  const [rows] = await db.query(query, [client_id]);
  return rows;
};

// ==============================
// DELETE payroll
// ==============================
export const deletePayrollService = async (client_id, id) => {
  const [result] = await db.query(
    `DELETE FROM client_payroll WHERE id = ? AND client_id = ?`,
    [id, client_id],
  );
  return result;
};
