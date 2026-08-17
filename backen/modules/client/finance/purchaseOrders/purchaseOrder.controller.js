import {
  fetchOrders,
  createNewOrder,
  updateStatus,
  deleteOrderById,
} from "./purchaseOrder.service.js";

import { db } from "../../../../config/db.js";

// helper
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code]
  );

  if (!rows.length) throw new Error("Client not found");

  return rows[0].id;
};

// GET ALL
export const getAllOrders = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const data = await fetchOrders(clientId);

    res.json(data);
  } catch (error) {
    console.error("getAllOrders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// CREATE
export const createOrder = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const { vendor_name, items, total_amount, order_date } = req.body;

    if (!vendor_name || !items?.length) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const order = await createNewOrder({
      client_id: clientId,
      vendor_name,
      items,
      total_amount,
      order_date,
    });

    res.status(201).json(order);
  } catch (error) {
    console.error("createOrder:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

// UPDATE STATUS
export const updateOrderStatus = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const { id } = req.params;
    const { status } = req.body;

    const updated = await updateStatus(id, clientId, status);

    res.json(updated);
  } catch (error) {
    console.error("updateOrderStatus:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
};

// DELETE
export const deleteOrder = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const { id } = req.params;

    await deleteOrderById(id, clientId);

    res.json({ message: "Order deleted" });
  } catch (error) {
    console.error("deleteOrder:", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
};