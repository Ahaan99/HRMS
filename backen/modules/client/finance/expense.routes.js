import express from "express";
import {
  getClientExpenses,
  addClientExpense,
  getExpenseCategories
} from "./expense.controller.js";

import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";



const router = express.Router();

router.use(clientAuthMiddleware);

router.get("/", getClientExpenses);
router.post("/", addClientExpense);
router.get("/categories", getExpenseCategories);

export default router;