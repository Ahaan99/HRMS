import express from "express";
import {getLedger} from "./ledger.controller.js";

import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";

const router = express.Router();

router.use(clientAuthMiddleware);
// ledger.routes.js

router.get("/ledger", getLedger);

export default router;