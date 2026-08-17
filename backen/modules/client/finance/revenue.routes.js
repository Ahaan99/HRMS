import express from "express";

import {getClientRevenue, addClientRevenue, getRevenueCategories } from "./revenue.controller.js"

import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";

const router = express.Router();

router.use(clientAuthMiddleware);

router.get("/", getClientRevenue);
router.post("/", addClientRevenue);
router.get("/categories", getRevenueCategories);

export default router;