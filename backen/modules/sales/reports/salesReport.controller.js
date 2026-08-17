import { db } from "../../../config/db.js";

// helper
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code],
  );

  if (!rows.length) throw new Error("Client not found");

  return rows[0].id;
};

// ==============================
// CREATE SALE
// ==============================
export const createSale = async (req, res) => {
  try {
    const employeeId = req.salesUser.employeeId; // 🔥 from token

    const {
      client_code,
      plan_name,
      billing_months,
      amount,
      amount_paid,
      payment_status,
      payment_method,
      purchase_date,
      start_date,
      due_date,
      subscription_status,
      remarks,
    } = req.body;

    const client_id = await getClientId(client_code);

    const [result] = await db.query(
      `INSERT INTO sales_report
       (employee_id, client_id, plan_name, billing_months, amount,
        amount_paid, payment_status, payment_method,
        purchase_date, start_date, due_date,
        subscription_status, remarks)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        employeeId,
        client_id,
        plan_name,
        billing_months,
        amount,
        amount_paid,
        payment_status,
        payment_method,
        purchase_date,
        start_date,
        due_date,
        subscription_status,
        remarks,
      ],
    );

    res.json({ message: "Sale created", id: result.insertId });
  } catch (err) {
    console.error("Create sale error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// GET MY SALE
// ==============================
export const getMySales = async (req, res) => {
  try {
    const employeeId = req.salesUser.employeeId;

    const [rows] = await db.query(
      `SELECT 
          sr.*,
          c.client_code
       FROM sales_report sr
       LEFT JOIN clients c ON c.id = sr.client_id
       WHERE sr.employee_id = ?
       ORDER BY sr.created_at DESC`,
      [employeeId],
    );

    res.json(rows);
  } catch (err) {
    console.error("Get sales error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// UPDATE SALE
// ==============================
export const updateSale = async (req, res) => {
  try {
    const employeeId = req.salesUser.employeeId; // 🔥 security
    const saleId = req.params.id;

    const {
      client_code,
      plan_name,
      billing_months,
      amount,
      amount_paid,
      payment_status,
      payment_method,
      purchase_date,
      start_date,
      due_date,
      subscription_status,
      remarks,
    } = req.body;

    // 🔥 get client_id from code
    const client_id = await getClientId(client_code);

    console.log("saleId:", saleId);
    console.log("employeeId from token:", employeeId);
    // 🔥 IMPORTANT: ensure user updates only their own sale
    const [existing] = await db.query(
      `SELECT id FROM sales_report 
       WHERE id = ? AND employee_id = ? 
       LIMIT 1`,
      [saleId, employeeId],
    );

    if (!existing.length) {
      return res.status(403).json({
        message: "Sale not found or access denied",
      });
    }

    // 🔥 update query
    await db.query(
      `UPDATE sales_report SET
        client_id = ?,
        plan_name = ?,
        billing_months = ?,
        amount = ?,
        amount_paid = ?,
        payment_status = ?,
        payment_method = ?,
        purchase_date = ?,
        start_date = ?,
        due_date = ?,
        subscription_status = ?,
        remarks = ?
       WHERE id = ?`,
      [
        client_id,
        plan_name,
        billing_months,
        amount,
        amount_paid,
        payment_status,
        payment_method,
        purchase_date,
        start_date,
        due_date,
        subscription_status,
        remarks,
        saleId,
      ],
    );

    res.json({
      success: true,
      message: "Sale updated successfully",
    });
  } catch (err) {
    console.error("Update sale error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
