import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import toast from "react-hot-toast";
import API from "../../services/api";
import { Trash2, FileText, Check, Search } from "lucide-react";

/* ─── professional built-in template designs ──────────────────────
   Each preset carries a visual identity (used in the preview card)
   and sensible default content that fills the form on click.      */
const PRESET_TEMPLATES = [
  {
    id: "classic",
    name: "Classic Corporate",
    tagline: "Timeless serif letterhead for established companies",
    accent: "#0b1220",
    accentSoft: "#e9ebf1",
    font: "Georgia, serif",
    defaults: {
      companyName: "Tech HR Solutions Pvt. Ltd.",
      hrName: "Head of Human Resources",
      location: "Noida, India",
    },
  },
  {
    id: "modern",
    name: "Modern Minimal",
    tagline: "Clean indigo rule lines, confident whitespace",
    accent: "#4f63f0",
    accentSoft: "#eef0fe",
    font: "Inter, sans-serif",
    defaults: {
      companyName: "Tech HR Solutions",
      hrName: "People Operations Lead",
      location: "Gurugram, India",
    },
  },
  {
    id: "executive",
    name: "Executive Elite",
    tagline: "Understated luxury for senior leadership offers",
    accent: "#146862",
    accentSoft: "#e7f5f0",
    font: "Georgia, serif",
    defaults: {
      companyName: "Tech HR Solutions — Executive Office",
      hrName: "Chief People Officer",
      location: "Mumbai, India",
    },
  },
  {
    id: "startup",
    name: "Startup Fresh",
    tagline: "Warm, friendly tone for fast-growing teams",
    accent: "#b45309",
    accentSoft: "#fdf3e3",
    font: "Inter, sans-serif",
    defaults: {
      companyName: "Tech HR Solutions",
      hrName: "Talent Team",
      location: "Bengaluru, India",
    },
  },
];

/* mini letter preview drawn with pure divs — no images needed */
function LetterThumb({ preset }) {
  return (
    <div
      className="relative h-36 w-full overflow-hidden rounded-lg border border-[#e6e9f0] bg-white px-4 pt-4"
      style={{ fontFamily: preset.font }}
    >
      {/* letterhead bar */}
      <div className="h-2 w-full rounded-sm" style={{ background: preset.accent }} />
      {/* company line */}
      <div className="mt-3 h-2.5 w-24 rounded-sm" style={{ background: preset.accent, opacity: 0.85 }} />
      <div className="mt-1 h-1.5 w-16 rounded-sm bg-[#d5dae4]" />
      {/* body lines */}
      <div className="mt-3 space-y-1.5">
        <div className="h-1.5 w-full rounded-sm bg-[#eceff4]" />
        <div className="h-1.5 w-11/12 rounded-sm bg-[#eceff4]" />
        <div className="h-1.5 w-full rounded-sm bg-[#eceff4]" />
        <div className="h-1.5 w-4/5 rounded-sm bg-[#eceff4]" />
      </div>
      {/* salary chip */}
      <div
        className="mt-3 inline-block rounded-sm px-2 py-1 text-[8px] font-bold"
        style={{ background: preset.accentSoft, color: preset.accent }}
      >
        CTC · JOINING · TERMS
      </div>
      {/* signature */}
      <div className="absolute bottom-3 right-4 h-1.5 w-12 rounded-sm" style={{ background: preset.accent, opacity: 0.5 }} />
    </div>
  );
}

export default function OfferLetter() {
  const [formData, setFormData] = useState({
    candidateName: "",
    candidateEmail: "",
    position: "",
    department: "",
    salary: "",
    joiningDate: "",
    companyName: "Tech HR Solutions",
    hrName: "HR Manager",
    location: "Noida, India",
  });
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [offerLetters, setOfferLetters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    templateName: "",
    companyName: "",
    hrName: "",
    location: "",
    terms: "",
  });

  useEffect(() => {
    fetchTemplates();
    fetchOfferLetters();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await API.get("/super-admin/offer-letter/templates");
      if (res.data.success) {
        setTemplates(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  };

  const fetchOfferLetters = async () => {
    try {
      const res = await API.get("/super-admin/offer-letter");
      if (res.data.success) {
        setOfferLetters(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch offer letters:", err);
    }
  };

  const handleDeleteOfferLetter = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer letter?")) {
      return;
    }
    try {
      await API.delete(`/super-admin/offer-letter/${id}`);
      setOfferLetters((prev) => prev.filter((item) => item.id !== id));
      toast.success("Offer letter deleted successfully");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTemplateChange = (e) => {
    setTemplateForm({ ...templateForm, [e.target.name]: e.target.value });
  };

  const applyPreset = (preset) => {
    setSelectedPreset(preset.id);
    setFormData((prev) => ({
      ...prev,
      ...preset.defaults,
      templateStyle: preset.id,
    }));
    toast.success(`"${preset.name}" template applied`);
  };

  const handleGeneratePdf = async (e) => {
    e.preventDefault();

    if (!formData.candidateName || !formData.position || !formData.joiningDate) {
      toast.error("Please fill in candidate name, position, and joining date");
      return;
    }

    setLoading(true);
    try {
      const response = await API.post("/super-admin/offer-letter/generate", formData, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `OfferLetter-${formData.candidateName.replace(/\s+/g, "_")}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Offer letter PDF generated successfully!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      if (err.response && err.response.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          toast.error(json.message || "Failed to generate PDF");
        } catch {
          toast.error("Failed to generate PDF");
        }
      } else {
        toast.error(err?.response?.data?.message || err?.message || "Failed to generate PDF");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();

    if (!templateForm.templateName || !templateForm.companyName) {
      toast.error("Please fill in template name and company name");
      return;
    }

    try {
      const res = await API.post("/super-admin/offer-letter/templates", templateForm);
      if (res.data.success) {
        toast.success("Template saved successfully!");
        setShowTemplateModal(false);
        setTemplateForm({
          templateName: "",
          companyName: "",
          hrName: "",
          location: "",
          terms: "",
        });
        fetchTemplates();
      }
    } catch (err) {
      toast.error("Failed to save template");
    }
  };

  const loadTemplate = (template) => {
    setFormData({
      ...formData,
      companyName: template.company_name || formData.companyName,
      hrName: template.hr_name || formData.hrName,
      location: template.location || formData.location,
      terms: template.terms || formData.terms,
    });
    toast.success("Template loaded!");
  };

  const handleDeleteTemplate = async (e, templateId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await API.delete(`/super-admin/offer-letter/templates/${templateId}`);
      if (res.data.success) {
        toast.success("Template deleted successfully!");
        fetchTemplates();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete template");
    }
  };

  const filteredOfferLetters = offerLetters.filter((item) =>
    item.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Offer Letter & PDF"
        desc="Generate offer letters and export PDFs."
      />

      {/* ═══ professional template gallery ═══ */}
      <div className="mt-6">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h3 className="text-[15px] font-bold tracking-tight text-[#0b1220]">
              Professional Templates
            </h3>
            <p className="mt-0.5 text-xs text-[#7b8698]">
              Pick a design — company details fill in automatically
            </p>
          </div>
          {selectedPreset ? (
            <button
              onClick={() => {
                setSelectedPreset(null);
                setFormData((prev) => {
                  const next = { ...prev };
                  delete next.templateStyle;
                  return next;
                });
              }}
              className="text-xs font-semibold text-[#7b8698] hover:text-[#0b1220] transition"
            >
              Clear selection
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PRESET_TEMPLATES.map((preset) => {
            const active = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`card-premium group relative p-3 text-left transition-all duration-200 ${
                  active ? "ring-2 ring-offset-2" : "hover:-translate-y-0.5"
                }`}
                style={active ? { "--tw-ring-color": preset.accent } : undefined}
              >
                {/* selected check */}
                {active ? (
                  <span
                    className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-md"
                    style={{ background: preset.accent }}
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>
                ) : null}

                <LetterThumb preset={preset} />

                <div className="mt-3 px-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: preset.accent }}
                    />
                    <h4 className="text-[13px] font-bold tracking-tight text-[#0b1220]">
                      {preset.name}
                    </h4>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#7b8698]">
                    {preset.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card-premium p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="card-header-premium">Generate Offer Letter</h3>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="btn-premium-outline !px-3.5 !py-2 text-xs"
              >
                + Save as Template
              </button>
            </div>

            <form onSubmit={handleGeneratePdf} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">
                    Candidate Name *
                  </label>
                  <input
                    type="text"
                    name="candidateName"
                    value={formData.candidateName}
                    onChange={handleChange}
                    placeholder="Enter candidate name"
                    className="input-premium"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">
                    Candidate Email
                  </label>
                  <input
                    type="email"
                    name="candidateEmail"
                    value={formData.candidateEmail}
                    onChange={handleChange}
                    placeholder="candidate@email.com"
                    className="input-premium"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">
                    Position *
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="Software Engineer"
                    className="input-premium"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Engineering"
                    className="input-premium"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">
                    Monthly Salary (INR)
                  </label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="50000"
                    className="input-premium num"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">
                    Joining Date *
                  </label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    className="input-premium num"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Tech HR Solutions"
                    className="input-premium"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">
                    HR Name
                  </label>
                  <input
                    type="text"
                    name="hrName"
                    value={formData.hrName}
                    onChange={handleChange}
                    placeholder="HR Manager"
                    className="input-premium"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Noida, India"
                    className="input-premium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-premium w-full !py-3 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText size={16} />
                {loading ? "Generating PDF..." : "Generate Offer Letter PDF"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card-premium p-6">
            <h3 className="card-header-premium mb-1">Saved Templates</h3>
            <p className="card-sub-premium mb-4">Your custom company presets</p>

            {templates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d5dae4] bg-[#f7f8fb] px-4 py-8 text-center">
                <FileText size={22} className="mx-auto text-[#7b8698]" />
                <p className="mt-2 text-xs font-medium text-[#33405c]">
                  No templates saved yet
                </p>
                <p className="mt-1 text-[11px] text-[#7b8698]">
                  Fill the form, then use &ldquo;Save as Template&rdquo;
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="group relative cursor-pointer rounded-xl border border-[#e6e9f0] p-4 transition hover:border-[#4f63f0] hover:bg-[#f9faff]"
                    onClick={() => loadTemplate(template)}
                  >
                    <button
                      onClick={(e) => handleDeleteTemplate(e, template.id)}
                      className="absolute right-2 top-2 rounded-lg bg-[#fdeef0] p-1.5 text-[#c73e4c] opacity-0 transition-opacity hover:bg-[#f9dade] group-hover:opacity-100"
                      title="Delete template"
                    >
                      <Trash2 size={14} />
                    </button>
                    <h4 className="pr-8 text-[13px] font-bold text-[#0b1220]">
                      {template.template_name}
                    </h4>
                    <p className="mt-1 text-xs text-[#33405c]">{template.company_name}</p>
                    {template.location && (
                      <p className="mt-0.5 text-[11px] text-[#7b8698]">{template.location}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ generated letters ═══ */}
      <div className="card-premium mt-8 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="card-header-premium">Generated Offer Letters</h3>
            <p className="card-sub-premium">
              {offerLetters.length} letter{offerLetters.length === 1 ? "" : "s"} on record
            </p>
          </div>
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8698]"
            />
            <input
              type="text"
              placeholder="Search candidate…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium w-60 !pl-9"
            />
          </div>
        </div>

        {filteredOfferLetters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d5dae4] bg-[#f7f8fb] px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#33405c]">
              {searchTerm ? "No matches for your search." : "No offer letters generated yet."}
            </p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-xl border border-[#e6e9f0]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7f8fb]">
                <tr className="border-b border-[#e6e9f0] text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7b8698]">
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Position</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Joining Date</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOfferLetters.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#eceff4] last:border-0 hover:bg-[#f9faff]"
                  >
                    <td className="p-3 font-semibold text-[#0b1220]">{item.candidate_name}</td>
                    <td className="p-3 text-[#33405c]">{item.position}</td>
                    <td className="p-3 text-[#7b8698]">{item.candidate_email}</td>
                    <td className="num p-3 text-[#33405c]">
                      {item.joining_date?.split("T")[0]}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteOfferLetter(item.id)}
                        className="rounded-lg p-1.5 text-[#c73e4c] transition hover:bg-[#fdeef0]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="card-premium w-full max-w-md p-6">
            <h3 className="card-header-premium mb-1">Save as Template</h3>
            <p className="card-sub-premium mb-4">Reusable company preset for future letters</p>
            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">
                  Template Name *
                </label>
                <input
                  type="text"
                  name="templateName"
                  value={templateForm.templateName}
                  onChange={handleTemplateChange}
                  placeholder="My Company Template"
                  className="input-premium"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={templateForm.companyName}
                  onChange={handleTemplateChange}
                  placeholder="Company Name"
                  className="input-premium"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">
                  HR Name
                </label>
                <input
                  type="text"
                  name="hrName"
                  value={templateForm.hrName}
                  onChange={handleTemplateChange}
                  placeholder="HR Manager"
                  className="input-premium"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={templateForm.location}
                  onChange={handleTemplateChange}
                  placeholder="City, Country"
                  className="input-premium"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="btn-premium-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-premium flex-1">
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
