import { useState } from "react";
import axios from "axios";
import "./ClientForm.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const ClientForm = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    hrName: "",
    email: "",
    phone: "",
    jobRole: "",
    openings: "",
    salary: "",
    experience: "",
    location: "",
    employmentType: "",
    skillsRequired: "",
    joiningTimeline: "",
    jobDescription: "",
    company_logo: null, // NEW
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

   const submitData = new FormData();

Object.keys(formData).forEach((key) => {
  submitData.append(key, formData[key]);
});

await axios.post(
  `${API_BASE_URL}/forms/client`,
  submitData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  }
);

      alert("Hiring Requirements Submitted Successfully!");

      setFormData({
        companyName: "",
        hrName: "",
        email: "",
        phone: "",
        jobRole: "",
        openings: "",
        salary: "",
        experience: "",
        location: "",
        employmentType: "",
        skillsRequired: "",
        joiningTimeline: "",
        jobDescription: "",
        company_logo: null,
      });

    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
        "Failed to submit requirements. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-form-container-wrapper">
      <div className="client-form-card">
        <div className="client-form-header">
          <h2>Post a Hiring Requirement</h2>
          <p>Provide your details below to find your next exceptional team member.</p>
        </div>

        <form onSubmit={handleSubmit} className="client-portal-form">
          <h3 className="client-section-title">Company Info</h3>
          <div className="client-form-grid client-layout-double">
            <div className="client-form-group">
              <label>Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                placeholder="e.g. Acme Corp"
                onChange={handleChange}
                required
              />
            </div>

            <div className="client-form-group">
  <label>Company Logo</label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setFormData({
        ...formData,
        company_logo: e.target.files[0],
      })
    }
  />
</div>

            <div className="client-form-group">
              <label>Contact Person (HR) *</label>
              <input
                type="text"
                name="hrName"
                value={formData.hrName}
                placeholder="e.g. Jane Doe"
                onChange={handleChange}
                required
              />
            </div>

            <div className="client-form-group">
              <label>Official Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                placeholder="hr@company.com"
                onChange={handleChange}
                required
              />
            </div>

            <div className="client-form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                placeholder="+1 (555) 000-0000"
                onChange={handleChange}
              />
            </div>
          </div>

          <h3 className="client-section-title">Role Details</h3>
          <div className="client-form-grid client-layout-triple">
            <div className="client-form-group client-span-2">
              <label>Hiring Role</label>
              <input
                type="text"
                name="jobRole"
                value={formData.jobRole}
                placeholder="e.g. Full Stack Developer"
                onChange={handleChange}
              />
            </div>

            <div className="client-form-group">
              <label>No. of Openings</label>
              <input
                type="number"
                name="openings"
                value={formData.openings}
                placeholder="3"
                onChange={handleChange}
                min="1"
              />
            </div>

            <div className="client-form-group">
              <label>Salary Offered</label>
              <input
                type="text"
                name="salary"
                value={formData.salary}
                placeholder="e.g. ₹6-8 LPA"
                onChange={handleChange}
              />
            </div>

            <div className="client-form-group">
              <label>Required Experience</label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                placeholder="e.g. 2-4 Years"
                onChange={handleChange}
              />
            </div>

            <div className="client-form-group">
              <label>Job Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                placeholder="e.g. Delhi / Remote"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="client-form-grid client-layout-double">
            <div className="client-form-group">
              <label>Employment Type</label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
              >
                <option value="">Select Type</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Remote">Remote</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div className="client-form-group">
              <label>Joining Timeline</label>
              <input
                type="text"
                name="joiningTimeline"
                value={formData.joiningTimeline}
                placeholder="Urgent / Within 15 Days"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="client-form-group client-full-width">
            <label>Skills Required</label>
            <textarea
              name="skillsRequired"
              value={formData.skillsRequired}
              placeholder="List specific technologies, languages, or core frameworks required..."
              rows="3"
              onChange={handleChange}
            />
          </div>

          <div className="client-form-group client-full-width">
            <label>Job Description</label>
            <textarea
              name="jobDescription"
              value={formData.jobDescription}
              placeholder="Write core daily operations, scope, and specific milestone responsibilities..."
              rows="5"
              onChange={handleChange}
            />
          </div>

          

          <button type="submit" disabled={loading} className="client-submit-btn">
            {loading ? <span className="client-spinner"></span> : "Submit Hiring Requirement"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;
