import { db } from "../../../config/db.js";

export const createJoining = async (req, res) => {
  try {
    const hrId = req.employee.id;

    const {
      fullName,
      fatherName,
      dob,
      gender,
      maritalStatus,
      bloodGroup,
      nationality,
      mobile,
      altMobile,
      email,
      presentAddress,
      presentCity,
      presentState,
      presentPincode,
      qualification10,
      board10,
      year10,
      percent10,
      experienceType,
      totalExperience,
      lastCompany,
      lastDesignation,
      lastSalary,
      accountHolder,
      bankName,
      accountNumber,
      ifsc,
      branch,
      emergencyName,
      emergencyRelation,
      emergencyMobile,
      fatherOccupation,
      fatherMobile,
      motherName,
      motherOccupation,
      motherMobile,
    } = req.body;

    const photo = req.files?.photo?.[0]?.filename
  ? `/uploads/profile/${req.files.photo[0].filename}`
  : req.body.photo || null;

const signature = req.files?.signature?.[0]?.filename
  ? `/uploads/signature/${req.files.signature[0].filename}`
  : req.body.signature || null;

    const safeDob = dob && dob.trim() !== "" ? dob : null;

    const sql = `
INSERT INTO joining_forms (
  hr_id,
  full_name,
  father_name,
  dob,
  gender,
  marital_status,
  blood_group,
  nationality,
  mobile,
  alt_mobile,
  email,
  present_address,
  present_city,
  present_state,
  present_pincode,
  qualification10,
  board10,
  year10,
  percent10,
  experience_type,
  total_experience,
  last_company,
  last_designation,
  last_salary,
  account_holder,
  bank_name,
  account_number,
  ifsc,
  branch,
  emergency_name,
  emergency_relation,
  emergency_mobile,
  father_occupation,
  father_mobile,
  mother_name,
  mother_occupation,
  mother_mobile,
  photo,
  signature
)
VALUES (
?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`;

    const values = [
      hrId,
      fullName || null,
      fatherName || null,
      safeDob,
      gender || null,
      maritalStatus || null,
      bloodGroup || null,
      nationality || null,
      mobile || null,
      altMobile || null,
      email || null,
      presentAddress || null,
      presentCity || null,
      presentState || null,
      presentPincode || null,
      qualification10 || null,
      board10 || null,
      year10 || null,
      percent10 || null,
      experienceType || null,
      totalExperience || null,
      lastCompany || null,
      lastDesignation || null,
      lastSalary || null,
      accountHolder || null,
      bankName || null,
      accountNumber || null,
      ifsc || null,
      branch || null,
      emergencyName || null,
      emergencyRelation || null,
      emergencyMobile || null,
      fatherOccupation || null,
      fatherMobile || null,
      motherName || null,
      motherOccupation || null,
      motherMobile || null,
      photo,
      signature,
    ];

    await db.query(sql, values);

    res.json({
      success: true,
      message: "Joining form submitted successfully",
    });
  } catch (err) {
    console.error("Joining Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
