import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  providerStatus,
  listTemplates,
  updateTemplate,
  sendManual,
  listLogs,
} from "./messaging.controller.js";

const router = express.Router();
const admin = protect(["SUPER_ADMIN", "MANAGER", "hr"]);

router.get("/status", admin, providerStatus);
router.get("/templates", admin, listTemplates);
router.put("/templates/:id", admin, updateTemplate);
router.post("/send", admin, sendManual);
router.get("/logs", admin, listLogs);

export default router;
