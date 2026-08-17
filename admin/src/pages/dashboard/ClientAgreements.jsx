import { useEffect, useState } from "react";
import AddClientAgreementModal from "../../components/clientAgreements/AddClientAgreementModal";
import GenerateAgreementModal from "../../components/clientAgreements/GenerateAgreementModal";
import {
  FileText,
  Trash2,
  ExternalLink,
  Plus,
  CalendarDays,
  Building2,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  getAgreementTemplates,
  getClientAgreements,
  deleteClientAgreement,
} from "../../services/clientAgreementService";

import API from "../../services/api";

const BASE = import.meta.env.VITE_API_BASE_URL.replace("/api", "");

export default function ClientAgreements() {

const [templateName, setTemplateName] = useState("");
const [templateFile, setTemplateFile] = useState(null);
const [uploadingTemplate, setUploadingTemplate] = useState(false);
const [templates, setTemplates] = useState([]);
const [selectedTemplate, setSelectedTemplate] = useState("");


  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openGenerate, setOpenGenerate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAgreements();
  }, []);

  useEffect(() => {
  fetchTemplates();
}, []);

const fetchTemplates = async () => {
  try {
    const res = await getAgreementTemplates();

    console.log("TEMPLATES RESPONSE:", res);

    setTemplates(res.data?.data || res.data || []);
  } catch (err) {
    console.error(err);
  }
};

  const fetchAgreements = async () => {
    try {
      setLoading(true);

      const res = await getClientAgreements();


console.log("AGREEMENTS RESPONSE:", res);

      setAgreements(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);

      toast.error("Failed to fetch agreements");
    } finally {
      setLoading(false);
    }
  };

const handleTemplateUpload = async (e) => {
  e.preventDefault();

  try {
    setUploadingTemplate(true);

    const formData = new FormData();
    formData.append("template_name", templateName);
    formData.append("templateFile", templateFile); // IMPORTANT NAME

    await API.post(
      "/super-admin/agreement-templates",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    toast.success("Template uploaded successfully");

    setTemplateName("");
    setTemplateFile(null);

  } catch (err) {
    console.error(err);
    toast.error("Upload failed");
  } finally {
    setUploadingTemplate(false);
  }
};



  const filteredAgreements = agreements.filter((item) =>
  [
    item.agreement_title,
    item.agreement_type,
    item.company_name,
    item.agreement_number,
  ]
    .join(" ")
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return "active";

  const today = new Date();
  const expiry = new Date(expiryDate);

  const diffDays = Math.ceil(
    (expiry - today) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "expired";

  if (diffDays <= 30) return "expiring";

  return "active";
};


  const handleDelete = async (id) => {
    try {
      const confirmDelete = window.confirm("Delete this agreement?");

      if (!confirmDelete) return;

      await deleteClientAgreement(id);

      toast.success("Agreement deleted");

      fetchAgreements();
    } catch (err) {
      console.error(err);

      toast.error("Delete failed");
    }
  };

  const expiredCount = agreements.filter(
  (a) => getExpiryStatus(a.expiry_date) === "expired"
).length;

const expiringCount = agreements.filter(
  (a) => getExpiryStatus(a.expiry_date) === "expiring"
).length;

  return (

    
    <div className="p-6 min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
         <div className="bg-white p-4 rounded-2xl border mb-6">

  <h2 className="font-semibold text-lg mb-3">
    Upload Agreement Template (PDF)
  </h2>

  <form onSubmit={handleTemplateUpload} className="flex flex-col md:flex-row gap-3">

    {/* TEMPLATE NAME */}
    <input
      type="text"
      placeholder="Template Name"
      value={templateName}
      onChange={(e) => setTemplateName(e.target.value)}
      className="border p-2 rounded-xl w-full"
      required
    />

    {/* FILE */}
    <input
      type="file"
      accept="application/pdf"
      onChange={(e) => setTemplateFile(e.target.files[0])}
      className="border p-2 rounded-xl w-full"
      required
    />

    {/* BUTTON */}
    <button
      type="submit"
      disabled={uploadingTemplate}
      className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
    >
      {uploadingTemplate ? "Uploading..." : "Upload Template"}
    </button>

  </form>
</div>

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Client Agreements
          </h1>

          <p className="text-gray-500 mt-1 text-sm">
            Manage uploaded agreement PDFs
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 transition text-white rounded-2xl shadow-sm font-medium"
            onClick={() => setOpenGenerate(true)}
          >
            <Plus size={18} />
            Generate Agreement
          </button>
          <button
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-2xl shadow-sm font-medium"
            onClick={() => setOpenModal(true)}
          >
            <Plus size={18} />
            Upload Agreement
          </button>
        </div>
      </div>

<div className="mb-6">
  <input
    type="text"
    placeholder="Search agreements..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full md:w-96 px-4 py-3 border border-gray-300 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400"
  />
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
  <div className="bg-red-100 border border-red-200 rounded-2xl p-4">
    <h3 className="text-red-700 font-semibold">
      Expired Agreements
    </h3>

    <p className="text-3xl font-bold text-red-800">
      {expiredCount}
    </p>
  </div>

  <div className="bg-yellow-100 border border-yellow-200 rounded-2xl p-4">
    <h3 className="text-yellow-700 font-semibold">
      Expiring Soon
    </h3>

    <p className="text-3xl font-bold text-yellow-800">
      {expiringCount}
    </p>
  </div>
</div>


      {/* LOADING */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center shadow-sm">
          <p className="text-gray-500 font-medium">Loading agreements...</p>
        </div>
      ) : filteredAgreements.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-red-50 flex items-center justify-center mb-5">
            <FileText className="text-red-500" size={34} />
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No Agreements Found
          </h2>

          <p className="text-gray-500 text-sm">
            Upload your first client agreement PDF
          </p>
        </div>
      ) : (
        <div className="max-h-[75vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
          {filteredAgreements.map((item) => {
            const expiryStatus = getExpiryStatus(item.expiry_date);
             



            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* TOP */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                    <FileText className="text-red-600" size={28} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 leading-tight">
                      {item.agreement_title}
                    </h2>

                    <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                      <Building2 size={15} />
                      <span>{item.company_name || "No Client"}</span>
                    </div>
                  </div>
                </div>

                <span
  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap
    ${
      expiryStatus === "active"
        ? "bg-green-100 text-green-700"
        : expiryStatus === "expiring"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700"
    }
  `}
>
  {expiryStatus === "expired"
    ? "Expired"
    : expiryStatus === "expiring"
    ? "Expiring Soon"
    : "Active"}
</span>
              </div>

              {/* INFO */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Agreement Type</p>

                    <p className="text-sm font-medium text-gray-700 break-words">
                      {item.agreement_type || "-"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">
                      Agreement Number
                    </p>

                    <p className="text-sm font-medium text-gray-700 break-words">
                      {item.agreement_number || "-"}
                    </p>
                  </div>
                </div>

               <div className="grid grid-cols-2 gap-4">
  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
      <CalendarDays size={14} />
      <span>Start Date</span>
    </div>

    <p className="text-sm font-medium text-gray-700">
      {item.start_date
        ? new Date(item.start_date).toLocaleDateString("en-IN")
        : "-"}
    </p>
  </div>

  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
      <CalendarDays size={14} />
      <span>Expiry Date</span>
    </div>

    <p className="text-sm font-medium text-gray-700">
      {item.expiry_date
        ? new Date(item.expiry_date).toLocaleDateString("en-IN")
        : "-"}
    </p>

    {expiryStatus === "expired" && (
      <div className="mt-3 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-xl">
        🚨 Agreement Expired
      </div>
    )}

    {expiryStatus === "expiring" && (
      <div className="mt-3 bg-yellow-100 border border-yellow-300 text-yellow-700 px-3 py-2 rounded-xl">
        ⚠️ Agreement expires within 30 days
      </div>
    )}
  </div>
</div>
</div>

              {/* REMARKS */}
              {item.remarks && (
                <div className="mt-5">
                  <p className="text-xs text-gray-400 mb-2">Remarks</p>

                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-700 leading-relaxed">
                    {item.remarks}
                  </div>
                </div>
              )}

              {/* FOOTER */}
              <div className="mt-6 flex items-center justify-between gap-3">
                
                
                <a
                 href={item.agreement_pdf}

                  
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                >
                  <ExternalLink size={17} />
                  View PDF
                </a>

<a
  href={`${BASE}${item.agreement_pdf}`}
  download
  className="px-3 py-2 bg-green-100 text-green-700 rounded-xl text-sm"
>
  Download PDF
</a>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="w-11 h-11 rounded-2xl bg-red-50 hover:bg-red-100 transition flex items-center justify-center text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            );
          })}

          </div>
         
        </div>
      )}

      <AddClientAgreementModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={fetchAgreements}
      />

      <GenerateAgreementModal
        open={openGenerate}
        onClose={() => setOpenGenerate(false)}
        onSuccess={fetchAgreements}
      />
    </div>
  );
}
