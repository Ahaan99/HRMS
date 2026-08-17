import { db } from "../../config/db.js";
import { sendSms } from "../../utils/sms.js";
import {
  sendWhatsApp,
  whatsappConfigured,
  smsConfigured,
} from "../../utils/whatsapp.js";

/* ------------------------------------------------------------------ */
/* Table bootstrap                                                      */
/* ------------------------------------------------------------------ */
const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS message_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      event_key VARCHAR(60) NOT NULL,
      channel ENUM('SMS','WHATSAPP','BOTH') DEFAULT 'BOTH',
      body TEXT NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_event (event_key)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS message_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      channel ENUM('SMS','WHATSAPP') NOT NULL,
      recipient VARCHAR(40) NOT NULL,
      body TEXT NOT NULL,
      event_key VARCHAR(60) NULL,
      status ENUM('SENT','SIMULATED','FAILED') NOT NULL,
      error VARCHAR(255) NULL,
      sent_by VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created (created_at)
    )
  `);
  /* Seed default templates once */
  const [[{ c }]] = await db.query("SELECT COUNT(*) c FROM message_templates");
  if (!c) {
    const defaults = [
      ["Leave Approved", "leave_approved", "BOTH", "Hi {{name}}, your {{leave_type}} leave from {{from_date}} to {{to_date}} has been APPROVED."],
      ["Leave Rejected", "leave_rejected", "BOTH", "Hi {{name}}, your {{leave_type}} leave request was REJECTED. Note: {{note}}"],
      ["Interview Scheduled", "interview_scheduled", "BOTH", "Hi {{name}}, your interview for {{position}} is scheduled on {{date}} at {{time}}."],
      ["Offer Letter Sent", "offer_sent", "BOTH", "Congratulations {{name}}! Your offer letter for {{position}} has been sent to your email."],
      ["Document Expiry", "doc_expiry", "BOTH", "Reminder: document '{{doc_name}}' expires on {{expiry_date}}. Please renew it."],
      ["Visitor Arrived", "visitor_arrived", "BOTH", "{{visitor_name}} has arrived at reception to meet you. Purpose: {{purpose}}."],
    ];
    for (const d of defaults) {
      await db.query(
        "INSERT INTO message_templates (name, event_key, channel, body) VALUES (?,?,?,?)",
        d,
      );
    }
  }
};
ensureTables().catch((e) => console.error("messaging init:", e.message));

/* ------------------------------------------------------------------ */
/* Core dispatch — usable by other modules too                          */
/* ------------------------------------------------------------------ */
const fill = (body, vars = {}) =>
  body.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? `{{${k}}}`));

export const dispatchMessage = async ({
  channel,
  recipient,
  body,
  eventKey = null,
  sentBy = "system",
}) => {
  const send = channel === "WHATSAPP" ? sendWhatsApp : sendSms;
  const result = await send(recipient, body);
  const status = result.delivered ? "SENT" : result.dev ? "SIMULATED" : "FAILED";
  await db.query(
    `INSERT INTO message_logs (channel, recipient, body, event_key, status, error, sent_by)
     VALUES (?,?,?,?,?,?,?)`,
    [channel, recipient, body, eventKey, status, result.error || null, sentBy],
  );
  return { status, ...result };
};

/** Fire a templated notification for an event (used by other modules). */
export const notifyEvent = async (eventKey, recipient, vars = {}) => {
  try {
    const [[tpl]] = await db.query(
      "SELECT * FROM message_templates WHERE event_key = ? AND is_active = 1",
      [eventKey],
    );
    if (!tpl || !recipient) return { status: "SKIPPED" };
    const body = fill(tpl.body, vars);
    const channels =
      tpl.channel === "BOTH" ? ["SMS", "WHATSAPP"] : [tpl.channel];
    const out = [];
    for (const ch of channels) {
      out.push(await dispatchMessage({ channel: ch, recipient, body, eventKey }));
    }
    return { status: "DISPATCHED", results: out };
  } catch (e) {
    console.error("[notifyEvent]", e.message);
    return { status: "ERROR", error: e.message };
  }
};

/* ------------------------------------------------------------------ */
/* HTTP endpoints                                                       */
/* ------------------------------------------------------------------ */

/* GET /status */
export const providerStatus = async (_req, res) => {
  res.json({
    success: true,
    sms: { configured: smsConfigured(), provider: "Twilio" },
    whatsapp: { configured: whatsappConfigured(), provider: "WhatsApp Cloud API" },
    mode:
      smsConfigured() || whatsappConfigured() ? "LIVE" : "SIMULATION",
  });
};

/* GET /templates */
export const listTemplates = async (_req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM message_templates ORDER BY id",
  );
  res.json({ success: true, data: rows });
};

/* PUT /templates/:id  { body, channel, is_active } */
export const updateTemplate = async (req, res) => {
  const { body, channel, is_active } = req.body;
  await db.query(
    `UPDATE message_templates SET
       body = COALESCE(?, body),
       channel = COALESCE(?, channel),
       is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [body ?? null, channel ?? null, is_active ?? null, req.params.id],
  );
  res.json({ success: true, message: "Template updated" });
};

/* POST /send  { channel, recipient, message } — manual/test send */
export const sendManual = async (req, res) => {
  const { channel, recipient, message } = req.body;
  if (!["SMS", "WHATSAPP"].includes(channel) || !recipient || !message?.trim())
    return res.status(400).json({
      success: false,
      message: "channel (SMS|WHATSAPP), recipient and message are required",
    });
  const result = await dispatchMessage({
    channel,
    recipient,
    body: message.trim(),
    sentBy: req.user?.email || req.user?.name || "admin",
  });
  res.json({
    success: true,
    status: result.status,
    message:
      result.status === "SENT"
        ? "Message delivered"
        : result.status === "SIMULATED"
          ? "Simulation mode — add provider keys in .env to send for real"
          : "Send failed: " + (result.error || "unknown"),
  });
};

/* GET /logs?limit=50 */
export const listLogs = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const [rows] = await db.query(
    "SELECT * FROM message_logs ORDER BY id DESC LIMIT ?",
    [limit],
  );
  res.json({ success: true, data: rows });
};
