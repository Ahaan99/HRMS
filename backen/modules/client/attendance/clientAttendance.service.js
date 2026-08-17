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

// ===============================
// CREATE
// ===============================
export const createAttendanceService = async (client_code, payload) => {
  const client_id = await getClientId(client_code);

  const { employee_id, attendance_date, check_in, check_out, status, remarks } =
    payload;

  // ✅ normalize time → datetime
  const checkInDT = check_in ? `${attendance_date} ${check_in}:00` : null;

  const checkOutDT = check_out ? `${attendance_date} ${check_out}:00` : null;

  const [result] = await db.query(
    `INSERT INTO client_attendance
     (client_id, employee_id, attendance_date, check_in, check_out, status, remarks)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      client_id,
      employee_id,
      attendance_date,
      checkInDT,
      checkOutDT,
      status || "PRESENT",
      remarks || null,
    ],
  );

  return result.insertId;
};

// ===============================
// LIST
// ===============================
export const listAttendanceService = async (client_code) => {
  const client_id = await getClientId(client_code);

  const [rows] = await db.query(
    `SELECT 
        a.*,
        e.name AS employeeName,
        e.employeeCode
     FROM client_attendance a
     LEFT JOIN client_employees e ON a.employee_id = e.id
     WHERE a.client_id = ?
     ORDER BY a.attendance_date DESC`,
    [client_id],
  );

  return rows;
};

// ===============================
// UPDATE
// ===============================
export const updateAttendanceService = async (client_code, id, payload) => {
  const client_id = await getClientId(client_code);

  const fields = [];
  const values = [];

// ===============================
// normalize time safely
// ===============================
if (payload.check_in) {
  const datePart =
    payload.attendance_date ||
    (await db.query(
      `SELECT attendance_date FROM client_attendance WHERE id = ? LIMIT 1`,
      [id]
    ))[0][0]?.attendance_date;

  if (datePart) {
    payload.check_in = `${datePart} ${payload.check_in}:00`;
  }
}

if (payload.check_out) {
  const datePart =
    payload.attendance_date ||
    (await db.query(
      `SELECT attendance_date FROM client_attendance WHERE id = ? LIMIT 1`,
      [id]
    ))[0][0]?.attendance_date;

  if (datePart) {
    payload.check_out = `${datePart} ${payload.check_out}:00`;
  }
}

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (!fields.length) return;

  values.push(id, client_id);

  await db.query(
    `UPDATE client_attendance
     SET ${fields.join(", ")}
     WHERE id = ? AND client_id = ?`,
    values,
  );
};

// ===============================
// DELETE
// ===============================
export const deleteAttendanceService = async (client_code, id) => {
  const client_id = await getClientId(client_code);

  await db.query(
    `DELETE FROM client_attendance
     WHERE id = ? AND client_id = ?`,
    [id, client_id],
  );
};
