import { db } from "../../../config/db.js";

// CREATE BATCH
export const createBatch = async (fileName, total, clientId, assignedTo) => {
  const [res] = await db.query(
    `INSERT INTO client_lead_batches 
     (file_name, total_records, client_id, assigned_to)
     VALUES (?, ?, ?, ?)`,
    [fileName, total, clientId, assignedTo],
  );

  return res.insertId;
};

// INSERT LEADS
export const insertLeads = async (leads, batchId, clientId, assignedTo) => {
  const values = leads.map((l) => [
    l.name,
    l.phone,
    batchId,
    assignedTo,
    clientId,
    new Date(),
  ]);

  await db.query(
    `INSERT INTO client_leads 
     (name, phone, batch_id, assigned_to, client_id, assigned_date)
     VALUES ?`,
    [values],
  );
};

// GET BATCHES
export const getBatches = async (clientId, employeeId = null) => {
  let query = `
    SELECT 
      b.id,
      b.file_name,
      b.created_at,

      COUNT(l.id) as total,
      SUM(CASE WHEN l.status != 'pending' THEN 1 ELSE 0 END) as completed,

      MAX(e.name) as employee_name

    FROM client_lead_batches b

    LEFT JOIN client_leads l 
      ON l.batch_id = b.id

    LEFT JOIN client_employees e 
      ON b.assigned_to = e.id

    WHERE b.client_id = ?
  `;

  let values = [clientId];

  // 🔥 EMPLOYEE FILTER
  if (employeeId) {
    query += ` AND l.assigned_to = ?`;
    values.push(employeeId);
  }

  query += `
    GROUP BY b.id
    ORDER BY b.id DESC
  `;

  const [rows] = await db.query(query, values);
  return rows;
};


// GET BY BATCH
export const getLeadsByBatch = async (batchId, clientId) => {
  const [rows] = await db.query(
    `SELECT * FROM client_leads 
     WHERE batch_id = ? AND client_id = ?
     ORDER BY id DESC`,
    [batchId, clientId],
  );

  return rows;
};

// EMPLOYEE
export const getEmployeeLeads = async (employeeId) => {
  const [rows] = await db.query(
    `SELECT * FROM client_leads 
     WHERE assigned_to = ?
     ORDER BY id DESC`,
    [employeeId],
  );

  return rows;
};

// UPDATE
export const updateLead = async (id, data) => {
  const { status, remarks } = data;

  await db.query(
    `UPDATE client_leads 
     SET status=?, remarks=?, 
     response_date = CASE 
       WHEN ? != 'pending' THEN NOW() 
       ELSE response_date 
     END
     WHERE id=?`,
    [status, remarks, status, id],
  );
};
