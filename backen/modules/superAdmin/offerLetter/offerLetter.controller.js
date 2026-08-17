import PDFDocument from "pdfkit";
import { db } from "../../../config/db.js";

const BRAND = "#1a2b4a"; // deep navy
const ACCENT = "#c8a24a"; // muted gold
const LIGHT = "#f4f6fa";

// Role-based terms: senior roles get longer probation review + notice period
const roleTerms = (position = "") => {
  const p = position.toLowerCase();
  if (/head|director|vp|chief|cxo|president/.test(p)) {
    return { level: "Leadership", probation: 6, noticeProbation: 30, noticeConfirmed: 90 };
  }
  if (/manager|lead|senior|architect|principal/.test(p)) {
    return { level: "Senior", probation: 6, noticeProbation: 30, noticeConfirmed: 60 };
  }
  if (/intern|trainee|apprentice/.test(p)) {
    return { level: "Trainee", probation: 3, noticeProbation: 15, noticeConfirmed: 30 };
  }
  return { level: "Associate", probation: 3, noticeProbation: 15, noticeConfirmed: 30 };
};

export const generateOfferLetterPdfController = async (req, res) => {
  try {
    const {
      candidateName,
      candidateEmail,
      position,
      department,
      salary,
      joiningDate,
      companyName,
      hrName,
      location,
      templateId,
    } = req.body;

    if (!candidateName || !position || !joiningDate) {
      return res.status(400).json({
        success: false,
        message: "Candidate name, position and joining date are required",
      });
    }

    let company = companyName || "Tech HR Solutions";
    let hr = hrName || "HR Manager";
    let loc = location || "Noida, India";
    let customTerms = "";

    if (templateId) {
      const [templates] = await db.query(
        `SELECT * FROM offer_letter_templates WHERE id = ?`,
        [templateId]
      );
      if (templates.length > 0) {
        const t = templates[0];
        company = t.company_name || company;
        hr = t.hr_name || hr;
        loc = t.location || loc;
        customTerms = t.terms || "";
      }
    }

    const [result] = await db.query(
      `INSERT INTO offer_letters
      (candidate_name, candidate_email, position, department, salary,
       joining_date, company_name, hr_name, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        candidateName,
        candidateEmail || "",
        position,
        department || "",
        salary || 0,
        joiningDate,
        company,
        hr,
        loc,
      ]
    );

    const refNo = `${company.replace(/[^A-Z]/gi, "").slice(0, 3).toUpperCase()}/HR/${new Date().getFullYear()}/${String(result.insertId).padStart(4, "0")}`;

    const doc = new PDFDocument({ margin: 0, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=OfferLetter-${candidateName.replace(/\s+/g, "_")}.pdf`
    );

    doc.pipe(res);

    const safe = (v) => (v === null || v === undefined ? "" : String(v));
    const formatDate = (d) => {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };
    const inr = (n) =>
      Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });

    const PAGE_W = 595.28;
    const M = 56; // content margin
    const CW = PAGE_W - M * 2; // content width

    // ---------- CTC computation (Code on Wages aligned: Basic = 50% of CTC) ----------
    const monthly = Number(salary || 0);
    const annualCTC = monthly * 12;
    const basic = Math.round(annualCTC * 0.5);
    const hra = Math.round(basic * 0.4);
    const pf = Math.round(basic * 0.12);
    const gratuity = Math.round(basic * 0.0481);
    const specialAllowance = Math.max(annualCTC - basic - hra - pf - gratuity, 0);
    const terms = roleTerms(position);

    // ---------- LETTERHEAD ----------
    doc.rect(0, 0, PAGE_W, 96).fill(BRAND);
    doc.rect(0, 96, PAGE_W, 4).fill(ACCENT);
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text(company, M, 30, { width: CW });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#c9d4e5")
      .text(loc, M, 60, { width: CW });
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(ACCENT)
      .text("PRIVATE & CONFIDENTIAL", M, 74, { width: CW });

    // ---------- REF / DATE ROW ----------
    let y = 120;
    doc.font("Helvetica").fontSize(9.5).fillColor("#444444");
    doc.text(`Ref: ${refNo}`, M, y);
    doc.text(
      `Date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
      M,
      y,
      { width: CW, align: "right" }
    );

    // ---------- ADDRESSEE ----------
    y += 26;
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#111111");
    doc.text(safe(candidateName), M, y);
    if (candidateEmail) {
      y += 14;
      doc.font("Helvetica").fontSize(9.5).fillColor("#555555");
      doc.text(safe(candidateEmail), M, y);
    }

    // ---------- SUBJECT ----------
    y += 26;
    doc.rect(M, y - 4, CW, 22).fill(LIGHT);
    doc
      .font("Helvetica-Bold")
      .fontSize(10.5)
      .fillColor(BRAND)
      .text(
        `Subject: Offer of Employment - ${safe(position)}${department ? `, ${safe(department)}` : ""}`,
        M + 8,
        y,
        { width: CW - 16 }
      );

    // ---------- BODY ----------
    y += 32;
    doc.font("Helvetica").fontSize(10).fillColor("#222222");
    const body =
      `Dear ${safe(candidateName)},\n\n` +
      `Further to our recent discussions, we are delighted to offer you the position of ${safe(position)}` +
      `${department ? ` in the ${safe(department)} department` : ""} (${terms.level} grade) at ${company}, based at ${loc}. ` +
      `Your date of joining will be ${formatDate(joiningDate)}.\n\n` +
      `Your total annual Cost to Company (CTC) will be INR ${inr(annualCTC)} (INR ${inr(monthly)} per month). ` +
      `A detailed compensation structure is provided in Annexure A below.`;
    doc.text(body, M, y, { width: CW, lineGap: 3 });
    y = doc.y + 16;

    // ---------- ANNEXURE A: CTC TABLE ----------
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(BRAND);
    doc.text("ANNEXURE A - COMPENSATION STRUCTURE (ANNUAL)", M, y);
    y += 18;

    const rows = [
      ["Component", "Amount (INR / year)"],
      ["Basic Salary (50% of CTC)", inr(basic)],
      ["House Rent Allowance (40% of Basic)", inr(hra)],
      ["Special Allowance", inr(specialAllowance)],
      ["Employer Provident Fund (12% of Basic)", inr(pf)],
      ["Gratuity Provision (4.81% of Basic)", inr(gratuity)],
      ["Total Cost to Company", inr(annualCTC)],
    ];
    const col1 = CW * 0.65;
    const rowH = 20;
    rows.forEach((r, i) => {
      const isHeader = i === 0;
      const isTotal = i === rows.length - 1;
      if (isHeader) doc.rect(M, y, CW, rowH).fill(BRAND);
      else if (isTotal) doc.rect(M, y, CW, rowH).fill("#e9e2cf");
      else if (i % 2 === 0) doc.rect(M, y, CW, rowH).fill(LIGHT);
      doc
        .font(isHeader || isTotal ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9.5)
        .fillColor(isHeader ? "#ffffff" : "#222222");
      doc.text(r[0], M + 8, y + 5.5, { width: col1 - 16 });
      doc.text(r[1], M + col1, y + 5.5, { width: CW - col1 - 8, align: "right" });
      y += rowH;
    });

    // ---------- TERMS ----------
    y += 16;
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(BRAND);
    doc.text("KEY TERMS OF EMPLOYMENT", M, y);
    y += 16;
    doc.font("Helvetica").fontSize(9.5).fillColor("#222222");
    const termLines = [
      `1. Probation: ${terms.probation} months from the date of joining, extendable once based on performance review.`,
      `2. Notice Period: ${terms.noticeProbation} days during probation; ${terms.noticeConfirmed} days after confirmation, by either party in writing.`,
      `3. Working Hours: 9:30 AM to 6:30 PM, Monday to Friday, subject to business requirements.`,
      `4. Background Verification: This offer is conditional upon satisfactory background verification and submission of all requested documents on or before your joining date.`,
      `5. Statutory Benefits: PF, and ESI where applicable, will be provided per statutory requirements. Leave and holidays are governed by the company leave policy shared at onboarding.`,
      `6. Confidentiality: You will maintain strict confidentiality of all company and client information, during and after your employment.`,
      `7. Offer Validity: This offer is valid for 7 calendar days from the date of this letter, after which it lapses automatically.`,
    ];
    if (customTerms.trim()) {
      termLines.push(`8. Additional Terms: ${customTerms.trim()}`);
    }
    termLines.forEach((t) => {
      doc.text(t, M, y, { width: CW, lineGap: 2 });
      y = doc.y + 6;
    });

    // ---------- SIGNATURE + ACCEPTANCE (new page if needed) ----------
    if (y > 640) {
      doc.addPage({ margin: 0 });
      doc.rect(0, 0, PAGE_W, 14).fill(BRAND);
      y = 48;
    }
    y += 10;
    doc.font("Helvetica").fontSize(10).fillColor("#222222");
    doc.text("We look forward to welcoming you to the team.", M, y);
    y += 30;
    doc.text("Sincerely,", M, y);
    y += 34;
    doc.font("Helvetica-Bold").text(hr, M, y);
    y += 13;
    doc.font("Helvetica").fontSize(9.5).fillColor("#555555");
    doc.text(`Human Resources, ${company}`, M, y);

    y += 34;
    doc.rect(M, y, CW, 92).lineWidth(1).stroke("#cccccc");
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(BRAND)
      .text("CANDIDATE ACCEPTANCE", M + 12, y + 10);
    doc.font("Helvetica").fontSize(9.5).fillColor("#222222");
    doc.text(
      "I have read and understood the terms above and accept this offer of employment.",
      M + 12,
      y + 28,
      { width: CW - 24 }
    );
    doc.text("Signature: ____________________________", M + 12, y + 54);
    doc.text("Date: ______________________", M + 300, y + 54);

    // ---------- FOOTER ----------
    doc.rect(0, 812, PAGE_W, 30).fill(BRAND);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#c9d4e5")
      .text(
        `${company}  |  ${loc}  |  ${refNo}  |  This is a system-generated document.`,
        M,
        822,
        { width: CW, align: "center" }
      );

    doc.end();
  } catch (err) {
    console.error("Offer letter error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getOfferLetterTemplatesController = async (req, res) => {
  try {
    const [templates] = await db.query(
      `SELECT * FROM offer_letter_templates ORDER BY id DESC`
    );
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch templates" });
  }
};

export const saveOfferLetterTemplateController = async (req, res) => {
  try {
    const { templateName, companyName, hrName, location, terms } = req.body;

    if (!templateName || !companyName) {
      return res.status(400).json({
        success: false,
        message: "Template name and company name are required",
      });
    }

    const [result] = await db.query(
      `INSERT INTO offer_letter_templates (template_name, company_name, hr_name, location, terms) VALUES (?, ?, ?, ?, ?)`,
      [templateName, companyName, hrName || "", location || "", terms || ""]
    );

    res.json({
      success: true,
      message: "Template saved successfully",
      data: { id: result.insertId },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to save template" });
  }
};

export const getOfferLettersController = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM offer_letters ORDER BY id DESC");
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch offer letters" });
  }
};

export const deleteOfferLetterController = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM offer_letters WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Offer letter not found" });
    }

    res.json({ success: true, message: "Offer letter deleted successfully" });
  } catch (err) {
    console.error("Delete offer letter error:", err);
    res.status(500).json({ success: false, message: "Failed to delete offer letter" });
  }
};
