import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.js";
import { db } from "../../config/db.js";

const VALID_ROOMS = ["hr-it", "hr-superadmin", "it-superadmin"];

/* ============================================ */
/* AUTH: accepts employee OR superadmin tokens  */
/* ============================================ */

export const internalChatAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }
    const decoded = jwt.verify(header.split(" ")[1], ENV.JWT_SECRET);

    if (decoded.role === "SUPER_ADMIN") {
      req.internalUser = { type: "superadmin", id: decoded.id || 0 };
    } else if (decoded.employee_id) {
      /* portal identity (hr | it) comes from the request, but only
         employees may claim it */
      const claimed =
        req.body?.senderType || req.query?.senderType || "hr";
      req.internalUser = {
        type: claimed === "it" ? "it" : "hr",
        id: decoded.employee_id,
      };
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Not allowed" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const canAccess = (room, type) => room.split("-").includes(type);

/* ============================= */
/* GET INTERNAL MESSAGES         */
/* ============================= */

export const getInternalMessages = async (req, res) => {
  try {
    const { room } = req.params;
    if (!VALID_ROOMS.includes(room)) {
      return res.status(400).json({ success: false, message: "Bad room" });
    }
    if (!canAccess(room, req.internalUser.type)) {
      return res.status(403).json({ success: false, message: "No access" });
    }
    const [rows] = await db.query(
      `SELECT id, room, sender_type, sender_id, message, created_at
       FROM internal_messages
       WHERE room = ?
       ORDER BY created_at ASC, id ASC
       LIMIT 500`,
      [room],
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("internal chat get error:", err);
    res.status(500).json({ success: false });
  }
};

/* ============================= */
/* SEND INTERNAL MESSAGE         */
/* ============================= */

export const sendInternalMessage = async (req, res) => {
  try {
    const { room, message } = req.body;
    if (!VALID_ROOMS.includes(room)) {
      return res.status(400).json({ success: false, message: "Bad room" });
    }
    if (!message || !String(message).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Message required" });
    }
    if (!canAccess(room, req.internalUser.type)) {
      return res.status(403).json({ success: false, message: "No access" });
    }
    const [result] = await db.query(
      `INSERT INTO internal_messages (room, sender_type, sender_id, message)
       VALUES (?,?,?,?)`,
      [room, req.internalUser.type, req.internalUser.id, String(message).trim()],
    );
    const [[row]] = await db.query(
      `SELECT id, room, sender_type, sender_id, message, created_at
       FROM internal_messages WHERE id = ?`,
      [result.insertId],
    );
    res.json({ success: true, data: row });
  } catch (err) {
    console.error("internal chat send error:", err);
    res.status(500).json({ success: false });
  }
};
