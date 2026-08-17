import * as service from "./clientAttendance.service.js";

export const createAttendance = async (req, res) => {
  try {
    const id = await service.createAttendanceService(
      req.user.client_code,
      req.body
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const listAttendance = async (req, res) => {
  try {
    const data = await service.listAttendanceService(
      req.user.client_code
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    await service.updateAttendanceService(
      req.user.client_code,
      req.params.id,
      req.body
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    await service.deleteAttendanceService(
      req.user.client_code,
      req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};