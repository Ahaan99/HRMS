import { db } from "../../../config/db.js";
import { getClientId } from "../utils/getClientId.js";

export const getClientExpenses = async (req, res) => {
  try {
    const { client_code } = req.client;

    const client_id = await getClientId(client_code);

    const [rows] = await db.query(
      `SELECT e.*, c.name as category
       FROM client_expenses e
       LEFT JOIN expense_categories c ON e.category_id = c.id
       WHERE e.client_id = ?
       ORDER BY e.expense_date DESC`,
      [client_id]
    );

    res.json(rows);

  } catch (err) {
    console.log("EXPENSE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const addClientExpense = async (req, res) => {
  try {
    const { client_code } = req.client;

    const client_id = await getClientId(client_code);

    const { category_id, amount, expense_date, description } = req.body;

    await db.query(
      `INSERT INTO client_expenses  
       (client_id, category_id, amount, expense_date, description)
       VALUES (?, ?, ?, ?, ?)`,
      [client_id, category_id, amount, expense_date, description]
    );

    res.json({ msg: "Expense added" });

  } catch (err) {
    console.log("ADD EXPENSE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const getExpenseCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name FROM expense_categories`
    );

    res.json({
      success: true,
      data: rows,
    });

  } catch (err) {
    console.log("CATEGORY ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
};