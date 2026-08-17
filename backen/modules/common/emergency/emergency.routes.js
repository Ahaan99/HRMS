import express from "express";
import { triggerEmergency } from "./emergency.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "MANAGER", "hr"]));

// 🔐 protected route
router.post("/", triggerEmergency);

export default router;

