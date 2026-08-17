import jwt from "jsonwebtoken";
import { db } from "../../config/db.js";
import { ENV } from "../../config/env.js";
import { signToken } from "../../utils/jwt.js";
import { sendSms } from "../../utils/sms.js";

const PORTALS = ["hr", "employee", "client", "sales", "it"];
const OTP_TTL_MIN = 5;
const MAX_ATTEMPTS = 5;
const isEmail = (v) => /@/.test(v);

/* Find the account for a portal by email OR phone */
const findSubject = async (portal, identifier) => {
  const field = isEmail(identifier) ? "email" : "phone";
  if (portal === "client") {
    const [[row]] = await db.query(
      `SELECT id, client_code, company_name, email, phone, status
       FROM clients WHERE ${field} = ? LIMIT 1`,
      [identifier],
    );
    if (!row) return null;
    if (row.status !== "ACTIVE") throw new Error("Account is not active");
    return row;
  }
  const [[row]] = await db.query(
    `SELECT id, name, email, phone, employeeCode, joiningId, departmentId, isActive
     FROM employees WHERE ${field} = ? LIMIT 1`,
    [identifier],
  );
  if (!row) return null;
  if (!row.isActive) throw new Error("Account is not active");
  if (portal === "sales") {
    const salesDept = Number(ENV.SALES_DEPT_ID);
    if (salesDept && row.departmentId !== salesDept)
      throw new Error("Access denied for this portal");
  }
  return row;
};

/* ---------- POST /request  { portal, identifier } ---------- */
export const requestOtp = async (req, res) => {
  try {
    const { portal, identifier } = req.body;
    if (!PORTALS.includes(portal))
      return res.status(400).json({ success: false, message: "Invalid portal" });
    if (!identifier?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Email or phone number is required" });

    const id = identifier.trim();
    const subject = await findSubject(portal, id);
    if (!subject)
      return res
        .status(404)
        .json({ success: false, message: "No account found for this email/phone" });

    /* simple rate limit: max 3 unexpired OTPs per identifier */
    const [[recent]] = await db.query(
      `SELECT COUNT(*) AS c FROM login_otps
       WHERE portal = ? AND identifier = ? AND used = 0 AND expires_at > NOW()
       AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
      [portal, id],
    );
    if (recent.c >= 3)
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Please wait a few minutes.",
      });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await db.query(
      `INSERT INTO login_otps (portal, subject_id, identifier, otp_code, expires_at)
       VALUES (?,?,?,?, DATE_ADD(NOW(), INTERVAL ${OTP_TTL_MIN} MINUTE))`,
      [portal, subject.id, id, otp],
    );

    /* delivery: SMS when we have a phone, otherwise dev fallback */
    let delivered = false;
    let channel = "NONE";
    const phone = !isEmail(id) ? id : subject.phone;
    if (phone) {
      const result = await sendSms(
        phone,
        `Your HRMS login OTP is ${otp}. Valid for ${OTP_TTL_MIN} minutes.`,
      );
      delivered = !!result?.delivered;
      channel = "SMS";
    }
    console.log(`[OTP] ${portal} login OTP for ${id}: ${otp}`);

    res.json({
      success: true,
      message: delivered
        ? "OTP sent via SMS"
        : "OTP generated. (Delivery not configured — use the code shown.)",
      channel,
      expires_in: OTP_TTL_MIN * 60,
      /* Dev convenience, same pattern as the superadmin 2FA flow:
         only exposed when no real delivery happened. */
      ...(delivered ? {} : { dev_otp: otp }),
    });
  } catch (e) {
    const code = /not active|denied/.test(e.message) ? 403 : 500;
    res.status(code).json({ success: false, message: e.message });
  }
};

/* Build the same token/response shape each portal's password login uses */
const issueForPortal = async (portal, subject) => {
  if (portal === "hr" || portal === "it") {
    const token = jwt.sign(
      {
        id: subject.id,
        employee_id: subject.id,
        employee_code: subject.employeeCode,
        role: "hr",
      },
      ENV.JWT_SECRET,
      { expiresIn: "7d" },
    );
    return {
      token,
      employee: {
        id: subject.id,
        employee_code: subject.employeeCode,
        name: subject.name,
        email: subject.email,
      },
    };
  }

  if (portal === "employee") {
    const [[dept]] = await db.query(
      "SELECT name FROM departments WHERE id = ? LIMIT 1",
      [subject.departmentId],
    );
    const user = {
      id: subject.id,
      role: "EMPLOYEE",
      name: subject.name,
      email: subject.email,
      employeeCode: subject.employeeCode,
      joiningId: subject.joiningId,
      department: dept?.name || null,
    };
    return { token: signToken(user), user };
  }

  if (portal === "sales") {
    const token = jwt.sign(
      {
        employeeId: subject.id,
        employeeCode: subject.employeeCode,
        email: subject.email,
        role: "sales",
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN || "7d" },
    );
    return {
      token,
      user: { id: subject.id, name: subject.name, email: subject.email },
    };
  }

  /* client */
  const [features] = await db.query(
    `SELECT feature_key FROM client_features WHERE client_id = ? AND is_enabled = 1`,
    [subject.id],
  );
  const token = jwt.sign(
    { id: subject.id, client_code: subject.client_code, role: "client_admin" },
    ENV.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
  return {
    token,
    client: {
      id: subject.id,
      client_code: subject.client_code,
      company_name: subject.company_name,
      email: subject.email,
    },
    enabledFeatures: features.map((f) => f.feature_key),
  };
};

/* ---------- POST /verify  { portal, identifier, otp } ---------- */
export const verifyOtp = async (req, res) => {
  try {
    const { portal, identifier, otp } = req.body;
    if (!PORTALS.includes(portal) || !identifier?.trim() || !otp)
      return res
        .status(400)
        .json({ success: false, message: "portal, identifier and otp are required" });

    const id = identifier.trim();
    const [[row]] = await db.query(
      `SELECT * FROM login_otps
       WHERE portal = ? AND identifier = ? AND used = 0
       ORDER BY id DESC LIMIT 1`,
      [portal, id],
    );
    if (!row)
      return res
        .status(401)
        .json({ success: false, message: "No pending OTP. Request a new one." });
    if (new Date(row.expires_at) < new Date())
      return res
        .status(401)
        .json({ success: false, message: "OTP expired. Request a new one." });
    if (row.attempts >= MAX_ATTEMPTS)
      return res
        .status(429)
        .json({ success: false, message: "Too many wrong attempts. Request a new OTP." });

    if (row.otp_code !== String(otp).trim()) {
      await db.query("UPDATE login_otps SET attempts = attempts + 1 WHERE id = ?", [
        row.id,
      ]);
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    await db.query("UPDATE login_otps SET used = 1 WHERE id = ?", [row.id]);

    const subject = await findSubject(portal, id);
    if (!subject)
      return res.status(401).json({ success: false, message: "Account not found" });

    const data = await issueForPortal(portal, subject);
    res.json({ success: true, message: "Login successful", ...data });
  } catch (e) {
    const code = /not active|denied/.test(e.message) ? 403 : 500;
    res.status(code).json({ success: false, message: e.message });
  }
};
