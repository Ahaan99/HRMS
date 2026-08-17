import express from "express";
import {
  generateOfferLetterPdfController,
  getOfferLetterTemplatesController,
  saveOfferLetterTemplateController,
  getOfferLettersController,
  deleteOfferLetterController
} from "./offerLetter.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

//router.use(protect);

router.use((req, res, next) => {
  console.log("INSIDE OFFER LETTER ROUTE");
  next();
});

router.use((req, res, next) => {
  console.log("Offer Letter Route Hit");
  next();
});
router.delete("/:id", deleteOfferLetterController);

router.post("/generate", generateOfferLetterPdfController);
router.get("/templates", getOfferLetterTemplatesController);
router.post("/templates", saveOfferLetterTemplateController);
router.get("/", getOfferLettersController);
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Offer Letter Route Working" });
});



export default router;
