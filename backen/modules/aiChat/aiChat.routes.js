import express from "express";
import { askAI } from "./aiChat.controller.js";

const router = express.Router();

router.post("/ask", askAI);

export default router;