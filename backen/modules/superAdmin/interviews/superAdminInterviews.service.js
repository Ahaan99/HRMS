import { db } from "../../../config/db.js";

/* =========================
   GET ALL INTERVIEWS — Kashish (search + filter + pagination)
========================= */
export const getAllInterviews = async (queryParams = {}) => {
  const {
    page = 1, limit = 50, search = "", hr = "",
    status = "", call_status = "", joined = "",
    job_profile = "", language_id = "",
  } = queryParams;

  const parsedPage = Math.max(1, Number(page));
  const parsedLimit = Math.max(1, Number(limit));
  const offset = (parsedPage - 1) * parsedLimit;

  let sql = `SELECT ci.* FROM client_interviews ci WHERE 1=1`;
  let countSql = `SELECT COUNT(*) as total FROM client_interviews ci WHERE 1=1`;

  const values = [];
  const countValues = [];

  if (search?.trim()) {
    const s = `%${search.trim()}%`;
    const clause = ` AND (ci.candidate_name LIKE ? OR ci.candidate_phone LIKE ? OR ci.job_profile LIKE ?)`;
    sql += clause;
    countSql += clause;
    values.push(s, s, s);
    countValues.push(s, s, s);
  }

  if (hr) { sql += ` AND ci.hr_name = ?`; countSql += ` AND ci.hr_name = ?`; values.push(hr); countValues.push(hr); }
  if (status) { sql += ` AND ci.client_status = ?`; countSql += ` AND ci.client_status = ?`; values.push(status); countValues.push(status); }
  if (call_status) { sql += ` AND ci.call_status_id = ?`; countSql += ` AND ci.call_status_id = ?`; values.push(call_status); countValues.push(call_status); }
  if (joined) { sql += ` AND ci.joined = ?`; countSql += ` AND ci.joined = ?`; values.push(joined); countValues.push(joined); }
  if (job_profile) { sql += ` AND ci.job_profile = ?`; countSql += ` AND ci.job_profile = ?`; values.push(job_profile); countValues.push(job_profile); }
  if (language_id) { sql += ` AND ci.language_id = ?`; countSql += ` AND ci.language_id = ?`; values.push(language_id); countValues.push(language_id); }

  sql += ` ORDER BY ci.id DESC LIMIT ? OFFSET ?`;
  values.push(parsedLimit, offset);

  const [rows] = await db.query(sql, values);
  const [countResult] = await db.query(countSql, countValues);
  const totalRows = countResult[0]?.total || 0;

  return {
    rows,
    totalRows,
    currentPage: parsedPage,
    totalPages: Math.ceil(totalRows / parsedLimit),
  };
};

/* =========================
   GET SCHEDULED INTERVIEWS — Teri file (JOIN ke saath)
========================= */
export const getScheduledInterviews = async ({
  page = 1, limit = 50, search = "", client = "", hr = "",
  status = "", call_status = "", joined = "", job_profile = "", language_id = "",
}) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT ci.*, c.client_code, c.company_name,
           e.name AS hr_name, l.name AS language_name
    FROM client_interviews ci
    LEFT JOIN clients c ON c.id = ci.client_id
    LEFT JOIN employees e ON e.id = ci.hr_employee_id
    LEFT JOIN languages l ON l.id = ci.language_id
    WHERE 1=1
  `;

  const values = [];

  if (search) { query += ` AND (ci.candidate_name LIKE ? OR ci.candidate_phone LIKE ?)`; values.push(`%${search}%`, `%${search}%`); }
  if (client) { query += ` AND ci.client_id = ?`; values.push(Number(client)); }
  if (hr) { query += ` AND ci.hr_employee_id = ?`; values.push(Number(hr)); }
  if (status) { query += ` AND ci.client_status = ?`; values.push(status); }
  if (joined) { query += ` AND ci.joined = ?`; values.push(joined); }
  if (job_profile) { query += ` AND ci.job_profile = ?`; values.push(job_profile); }
  if (language_id) { query += ` AND ci.language_id = ?`; values.push(Number(language_id)); }
  if (call_status) { query += ` AND ci.call_status_id = ?`; values.push(Number(call_status)); }

  query += ` ORDER BY ci.created_at DESC LIMIT ? OFFSET ?`;
  values.push(Number(limit), Number(offset));

  const [rows] = await db.query(query, values);

  let countQuery = `
    SELECT COUNT(*) as total
    FROM client_interviews ci
    LEFT JOIN clients c ON c.id = ci.client_id
    LEFT JOIN employees e ON e.id = ci.hr_employee_id
    WHERE 1=1
  `;
  const countValues = [];

  if (search) { countQuery += ` AND (ci.candidate_name LIKE ? OR ci.candidate_phone LIKE ?)`; countValues.push(`%${search}%`, `%${search}%`); }
  if (client) { countQuery += ` AND ci.client_id = ?`; countValues.push(Number(client)); }
  if (hr) { countQuery += ` AND ci.hr_employee_id = ?`; countValues.push(Number(hr)); }
  if (status) { countQuery += ` AND ci.client_status = ?`; countValues.push(status); }
  if (joined) { countQuery += ` AND ci.joined = ?`; countValues.push(joined); }
  if (call_status) { countQuery += ` AND ci.call_status_id = ?`; countValues.push(Number(call_status)); }
  if (job_profile) { countQuery += ` AND ci.job_profile = ?`; countValues.push(job_profile); }
  if (language_id) { countQuery += ` AND ci.language_id = ?`; countValues.push(Number(language_id)); }

  const [[{ total }]] = await db.query(countQuery, countValues);

  return { rows, total, totalPages: Math.ceil(total / limit) };
};

/* =========================
   HR LIST DROPDOWN — FIXED
   hr_name column nahi hai, employees table se JOIN karke name lao
========================= */
export const getUniqueHRList = async () => {
  const [rows] = await db.query(`
    SELECT DISTINCT e.name AS hr_name
    FROM client_interviews ci
    JOIN employees e ON e.id = ci.hr_employee_id
    WHERE ci.hr_employee_id IS NOT NULL
    ORDER BY e.name ASC
  `);
  return rows;
};

/* =========================
   GET BY ID
========================= */
export const getInterviewById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM client_interviews WHERE id = ?`, [id]);
  if (!rows.length) throw new Error("Interview not found");
  return rows[0];
};

/* =========================
   CREATE
========================= */
export const createCandidate = async (data) => {
  if (!data.candidate_name) throw new Error("candidate_name required");
  if (!data.candidate_phone) throw new Error("candidate_phone required");

  const [result] = await db.query(
    `INSERT INTO client_interviews (
      candidate_name, candidate_phone, job_profile, language_id,
      experience, current_ctc, expected_ctc, notice_period, hr_name,
      client_id, call_status_id, interview_date, interview_time,
      selection_date, joining_date, client_status, joined, cv_file
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      data.candidate_name, data.candidate_phone, data.job_profile || null,
      data.language_id || null, data.experience || null, data.current_ctc || null,
      data.expected_ctc || null, data.notice_period || null, data.hr_name || null,
      data.client_id || null, data.call_status_id || 1, data.interview_date || null,
      data.interview_time || null, data.selection_date || null, data.joining_date || null,
      data.client_status || "pending", data.joined || "No", data.cv_file || null,
    ]
  );

  return getInterviewById(result.insertId);
};

/* =========================
   UPDATE
========================= */
export const updateCandidate = async (id, data) => {
  const old = await getInterviewById(id);

  const updated = {
    candidate_name: data.candidate_name ?? old.candidate_name,
    candidate_phone: data.candidate_phone ?? old.candidate_phone,
    job_profile: data.job_profile ?? old.job_profile,
    language_id: data.language_id ?? old.language_id,
    experience: data.experience ?? old.experience,
    current_ctc: data.current_ctc ?? old.current_ctc,
    expected_ctc: data.expected_ctc ?? old.expected_ctc,
    notice_period: data.notice_period ?? old.notice_period,
    hr_name: data.hr_name ?? old.hr_name,
    client_id: data.client_id ?? old.client_id,
    call_status_id: data.call_status_id ?? old.call_status_id,
    interview_date: data.interview_date ?? old.interview_date,
    interview_time: data.interview_time ?? old.interview_time,
    selection_date: data.selection_date ?? old.selection_date,
    joining_date: data.joining_date ?? old.joining_date,
    client_status: data.client_status ?? old.client_status,
    joined: data.joined ?? old.joined,
    cv_file: data.cv_file ?? old.cv_file,
  };

  await db.query(
    `UPDATE client_interviews SET
      candidate_name=?, candidate_phone=?, job_profile=?, language_id=?,
      experience=?, current_ctc=?, expected_ctc=?, notice_period=?, hr_name=?,
      client_id=?, call_status_id=?, interview_date=?, interview_time=?,
      selection_date=?, joining_date=?, client_status=?, joined=?, cv_file=?
    WHERE id=?`,
    [
      updated.candidate_name, updated.candidate_phone, updated.job_profile,
      updated.language_id, updated.experience, updated.current_ctc,
      updated.expected_ctc, updated.notice_period, updated.hr_name,
      updated.client_id, updated.call_status_id, updated.interview_date,
      updated.interview_time, updated.selection_date, updated.joining_date,
      updated.client_status, updated.joined, updated.cv_file, id,
    ]
  );

  return getInterviewById(id);
};

/* =========================
   UPDATE JOINED STATUS — Teri file se
========================= */
export const updateJoinedStatus = async (id, joined, joining_date, selection_date) => {
  await db.query(
    `UPDATE client_interviews SET joined=?, joining_date=?, selection_date=? WHERE id=?`,
    [joined, joining_date || null, selection_date || null, id]
  );
};

/* =========================
   DELETE
========================= */
export const deleteCandidate = async (id) => {
  const existing = await getInterviewById(id);
  if (!existing) throw new Error("Not found");
  await db.query(`DELETE FROM client_interviews WHERE id=?`, [id]);
  return true;
};