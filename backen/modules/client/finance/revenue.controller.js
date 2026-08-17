import { db } from "../../../config/db.js";
import { getClientId } from "../utils/getClientId.js";

export const getClientRevenue = async (req, res) => {
  try {
    const { client_code } = req.client;

    const client_id = await getClientId(client_code);

    const [rows] = await db.query(
      `SELECT r.*, c.name as category
       FROM client_revenue r
       LEFT JOIN revenue_categories c ON r.category_id = c.id
       WHERE r.client_id = ?
       ORDER BY r.revenue_date DESC`,
      [client_id]
    );

    res.json(rows);

  } catch (err) {
    console.log("REVENUE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const addClientRevenue = async (req, res) => {
  try {
    const { client_code } = req.client;

    const client_id = await getClientId(client_code);

    const { category_id, amount, revenue_date, description } = req.body;

    await db.query(
      `INSERT INTO client_revenue  
       (client_id, category_id, amount, revenue_date, description)
       VALUES (?, ?, ?, ?, ?)`,
      [client_id, category_id, amount, revenue_date, description]
    );

    res.json({ msg: "Revenue added" });

  } catch (err) {
    console.log("ADD REVENUE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const getRevenueCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name FROM revenue_categories`
    );

    res.json(rows);

  } catch (err) {
    console.log("REVENUE CATEGORY ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
};