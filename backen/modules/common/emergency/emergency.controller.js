import { db } from "../../../config/db.js";

export const triggerEmergency = async (req, res) => {
  try {
    const userId = req.user.employee_id; // from auth middleware
    console.log(req.user);

    // 🔹 get last click
    const [rows] = await db.query(
      `SELECT * FROM emergency_logs 
       WHERE user_id=? 
       ORDER BY id DESC LIMIT 1`,
      [userId]
    );

    let clickCount = 1;

    if (rows.length > 0) {
      clickCount = rows[0].click_count + 1;
    }

    // 🔹 save new log
    await db.query(
      `INSERT INTO emergency_logs (user_id, click_count, status)
       VALUES (?, ?, ?)`,
      [userId, clickCount, "triggered"]
    );

    // 🔹 RESPONSE ONLY (Twilio later)
    if (clickCount === 1) {
      return res.json({
        success: true,
        msg: "🚨 Emergency Alert Triggered (Step 1)",
      });
    }

    if (clickCount === 2) {
      return res.json({
        success: true,
        msg: "📞 Emergency Call Triggered (Step 2)",
      });
    }

    return res.json({
      success: false,
      msg: "⚠️ Already triggered. Please wait.",
    });
  } catch (error) {
    console.error("Emergency Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

