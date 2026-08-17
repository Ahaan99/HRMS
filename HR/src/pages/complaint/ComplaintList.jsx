import { useEffect, useState } from "react";
import API from "../../api/axios.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import HRNavbar from "../../components/hr/HRNavbar";

export default function ComplaintList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔥 NEW FORM STATE
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "low",
  });

  const navigate = useNavigate();

  // 🔥 FETCH
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await API.get("/complaints");
      setData(res.data.data);
    } catch (err) {
      toast.error("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // 🔥 CREATE COMPLAINT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      return toast.error("Title & Description required");
    }

    try {
      await API.post("/complaints", {
        ...form,
        category: "other",
      });

      toast.success("Complaint submitted");

      setForm({
        title: "",
        description: "",
        priority: "low",
      });

      fetchComplaints(); // refresh list
    } catch (err) {
      toast.error("Failed to submit");
    }
  };

  const getPortal = (role) => {
    if (role === "hr") return "HR Portal";
    if (role === "sales") return "Sales Portal";
    if (role === "client") return "Client Portal";
    if (role === "admin") return "Admin Portal";
    return "Unknown";
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-4 space-y-6">
      <HRNavbar />

      {/* 🔥 NEW COMPLAINT BOX (ALWAYS VISIBLE) */}
      <div className="border rounded-xl p-4 shadow-sm bg-white">
        <h2 className="font-semibold mb-3">Create New Complaint</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
            placeholder="Complaint title..."
            className="w-full border p-2 rounded"
          />

          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Describe your issue..."
            className="w-full border p-2 rounded"
          />

          <div className="flex justify-between items-center">
            <select
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value })
              }
              className="border p-2 rounded"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <button className="bg-blue-500 text-white px-4 py-2 rounded">
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* 🔥 EMPTY STATE */}
      {data.length === 0 && (
        <div className="text-center text-gray-400">
          No complaints yet. Create your first complaint.
        </div>
      )}

      {/* 🔥 LIST */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/complaints/${item.id}`)}
            className="p-4 rounded-xl border shadow hover:shadow-lg cursor-pointer transition"
          >
            {/* TOP */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">{item.title}</h2>

              <span
                className={`text-xs px-2 py-1 rounded ${
                  item.priority === "high"
                    ? "bg-red-100 text-red-600"
                    : item.priority === "medium"
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {item.priority}
              </span>
            </div>

            {/* USER */}
            <p className="text-sm text-gray-600">
              👤 {item.employee_name || item.client_name || "You"}
            </p>

            {/* DEPARTMENT */}
            <p className="text-sm text-gray-500">
              🏢 {item.department_name || "N/A"}
            </p>

            {/* PORTAL */}
            <p className="text-xs text-blue-500 mt-1">
              🌐 {getPortal(item.created_by_role)}
            </p>

            {/* STATUS */}
            <p className="text-xs mt-2 text-gray-400">
              Status: {item.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

