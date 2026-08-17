import { db } from "../../../../config/db.js";

// GET
export const fetchOrders = async (clientId) => {
  const [rows] = await db.query(
    `SELECT * FROM purchase_orders WHERE client_id = ? ORDER BY id DESC`,
    [clientId],
  );

  // parse JSON
  return rows.map((row) => ({
    ...row,
    items:
      typeof row.items === "string" ? JSON.parse(row.items) : row.items || [],
  }));
};

// CREATE
export const createNewOrder = async (data) => {
  const { client_id, vendor_name, items, total_amount, order_date } = data;

  const [result] = await db.query(
    `INSERT INTO purchase_orders 
     (client_id, vendor_name, items, total_amount, order_date)
     VALUES (?, ?, ?, ?, ?)`,
    [client_id, vendor_name, JSON.stringify(items), total_amount, order_date],
  );

  return { id: result.insertId, ...data };
};

// UPDATE STATUS
export const updateStatus = async (id, clientId, status) => {
  await db.query(
    `UPDATE purchase_orders SET status = ?
     WHERE id = ? AND client_id = ?`,
    [status, id, clientId],
  );

  return { id, status };
};

// DELETE
export const deleteOrderById = async (id, clientId) => {
  await db.query(`DELETE FROM purchase_orders WHERE id = ? AND client_id = ?`, [
    id,
    clientId,
  ]);
};
