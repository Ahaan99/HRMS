import * as service from "./clientLead.service.js";
import xlsx from "xlsx";

// 🔥 UPLOAD
export const uploadClientLeads = async (req, res) => {
  try {
    const file = req.file;
    const { assignedTo } = req.body;
    const clientId = req.client.client_id || req.client.id;

    const workbook = xlsx.read(file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const leads = data.map((row) => ({
      name: row["Full Name"] || row.name,
      phone: row["Mobile No."] || row.phone,
    }));

    const batchId = await service.createBatch(
      file.originalname,
      leads.length,
      clientId,
      assignedTo
    );

    await service.insertLeads(leads, batchId, clientId, assignedTo);

    res.json({ success: true });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🔥 CLIENT ADMIN
export const getClientBatches = async (req, res) => {
  try {
    let clientId;
    let employeeId = null;

    // 🔥 ADMIN
    if (req.client) {
      clientId = req.client.id;
    }

    // 🔥 EMPLOYEE
    if (req.employee) {
      clientId = req.employee.client_id;
      employeeId = req.employee.employee_id;
    }

    const data = await service.getBatches(clientId, employeeId);

    res.json({ success: true, data });
  } catch (err) {
    console.error("BATCH ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};


export const getClientLeadsByBatch = async (req, res) => {
  const clientId = req.client.client_id || req.client.id;

  const data = await service.getLeadsByBatch(req.params.id, clientId);
  res.json({ success: true, data });
};

// 🔥 EMPLOYEE
export const getEmployeeLeads = async (req, res) => {
  const employeeId = req.employee.employee_id;

  const data = await service.getEmployeeLeads(employeeId);
  res.json({ success: true, data });
};

// 🔥 UPDATE
export const updateClientLead = async (req, res) => {
  await service.updateLead(req.params.id, req.body);
  res.json({ success: true });
};