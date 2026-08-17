import express from "express";
import {
  getLoginSettings,
  updateGlobalSettings,
  saveEmployeeSettings,
  getTodayLogs,
  getHistory,
} from "./loginSettings.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "MANAGER"]));

router.get("/", getLoginSettings);
router.put("/global", updateGlobalSettings);
router.post("/employee", saveEmployeeSettings);

router.get("/today", getTodayLogs);
router.get("/history", getHistory);

export default router;