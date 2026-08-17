import * as service from "./lead.service.js";

// 🔥 UPDATE
export const updateLead = async (req, res) => {
  try {
    await service.updateLead(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 HR VIEW
export const getMyLeads = async (req, res) => {
  const data = await service.getMyLeads(req.user.id || req.user.employeeId);
  res.json({ success: true, data });
};

export const getAllBatches = async (req, res) => {
  const data = await service.getAllBatches(req.user?.employee_id || req.user.employeeId );
  res.json({ success: true, data });
};

export const getLeadsByBatch = async (req, res) => {

  try {
    const data = await service.getLeadsByBatch(
      req.params.id,
      req.user.employee_id || req.user.employeeId
    );

    res.json({ success: true, data });
  } catch (err) {
    console.error("GET BATCH LEADS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
