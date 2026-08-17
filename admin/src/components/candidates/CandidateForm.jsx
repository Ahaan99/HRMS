import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./CandidateForm.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const CandidateForm = ({ onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    qualification: "",
    experience: "",
    skills: "",
    currentCtc: "",
    expectedSalary: "",
    noticePeriod: "",
    jobProfile: "",
    languageName: "",
    currentCompany: "",
    preferredLocation: "",
  });

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.experience.trim()) newErrors.experience = "Experience is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add all form fields
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add resume file
      if (resume) {
        formDataToSend.append("resume", resume);
      }

      console.log("Submitting form data:", {
        ...formData,
        hasResume: !!resume,
      });

      const response = await axios.post(
        `${API_BASE_URL}/forms/candidate`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Success response:", response.data);

      toast.success("Application submitted successfully!");

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        city: "",
        qualification: "",
        experience: "",
        skills: "",
        currentCtc: "",
        expectedSalary: "",
        noticePeriod: "",
        jobProfile: "",
        languageName: "",
        currentCompany: "",
        preferredLocation: "",
      });

      setResume(null);

      const fileInput = document.getElementById("resume-upload");
      if (fileInput) {
        fileInput.value = "";
      }

      // Call success callback to refresh table
      if (onSuccess) {
        setTimeout(onSuccess, 500);
      }

      // Close modal
      if (onClose) {
        setTimeout(onClose, 500);
      }
    } catch (error) {
      console.error("Submission Error:", error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.request) {
        toast.error("Backend server is not running on port 5000");
      } else {
        toast.error("Error submitting form");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="candidate-form-wrapper">
      <div className="candidate-card">
        <div className="candidate-header">
          <h2>Join Our Talent Pool</h2>
          <p>
            Submit your professional profile and resume to unlock matching
            opportunities.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="candidate-portal-form">
          <h3 className="section-title">Personal Details</h3>

          <div className="form-grid layout-double">
            <div className="form-group span-2">
              <label>Full Name * {errors.fullName && <span style={{ color: "red" }}>- {errors.fullName}</span>}</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                placeholder="Jane Doe"
                onChange={handleChange}
                className={errors.fullName ? "error" : ""}
              />
            </div>

            <div className="form-group">
              <label>Email Address * {errors.email && <span style={{ color: "red" }}>- {errors.email}</span>}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                placeholder="jane.doe@example.com"
                onChange={handleChange}
                className={errors.email ? "error" : ""}
              />
            </div>

            <div className="form-group">
              <label>Phone Number * {errors.phone && <span style={{ color: "red" }}>- {errors.phone}</span>}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                placeholder="+91 XXXXX XXXXX"
                onChange={handleChange}
                className={errors.phone ? "error" : ""}
              />
            </div>

            <div className="form-group span-2">
              <label>Current City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                placeholder="e.g. New Delhi"
                onChange={handleChange}
              />
            </div>
          </div>

          <h3 className="section-title">Professional Background</h3>

          <div className="form-grid layout-double">
            <div className="form-group">
              <label>Highest Qualification</label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                placeholder="e.g. B.Tech / MCA"
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Years of Experience * {errors.experience && <span style={{ color: "red" }}>- {errors.experience}</span>}</label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                placeholder="e.g. Fresher / 2 Years"
                onChange={handleChange}
                className={errors.experience ? "error" : ""}
              />
            </div>

            <div className="form-group span-2">
              <label>Key Skills</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                placeholder="React, Node.js, MongoDB"
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Languages Known</label>
              <input
                type="text"
                name="languageName"
                value={formData.languageName}
                placeholder="e.g. English, Hindi, Spanish"
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Current Company</label>
              <input
                type="text"
                name="currentCompany"
                value={formData.currentCompany}
                placeholder="Leave blank if fresher"
                onChange={handleChange}
              />
            </div>
          </div>

          <h3 className="section-title">Job Preferences & Compensation</h3>

          <div className="form-grid layout-double">
            <div className="form-group">
              <label>Job Profile / Role Applying For</label>
              <input
                type="text"
                name="jobProfile"
                value={formData.jobProfile}
                placeholder="e.g. Senior Developer"
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Current CTC</label>
              <input
                type="text"
                name="currentCtc"
                value={formData.currentCtc}
                placeholder="e.g. 5"
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Expected Salary (LPA)</label>
              <input
                type="text"
                name="expectedSalary"
                value={formData.expectedSalary}
                placeholder="e.g. 6"
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Notice Period</label>
              <input
                type="text"
                name="noticePeriod"
                value={formData.noticePeriod}
                placeholder="e.g. 30 days"
                onChange={handleChange}
              />
            </div>

            <div className="form-group span-2">
              <label>Preferred Work Location</label>
              <input
                type="text"
                name="preferredLocation"
                value={formData.preferredLocation}
                placeholder="e.g. Remote, Bangalore"
                onChange={handleChange}
              />
            </div>
          </div>

          <h3 className="section-title">Documents</h3>

          <div className="form-group resume-upload-zone">
            <label
              htmlFor="resume-upload"
              className={`file-drop-area ${resume ? "file-selected" : ""}`}
            >
              <span className="upload-text">
                {resume ? resume.name : "Click to upload your Resume"}
              </span>

              <span className="upload-formats">
                Supported formats: PDF, DOC, DOCX
              </span>
            </label>

            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResume(e.target.files[0])}
              className="hidden-file-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-action-btn"
          >
            {loading ? "Submitting..." : "Submit Application Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CandidateForm;
