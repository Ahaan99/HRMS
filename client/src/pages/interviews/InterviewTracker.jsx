import { useEffect, useState } from "react";
import axios from "axios";

export default function InterviewTracker() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState({});
  const [decision, setDecision] = useState({});

  const token = localStorage.getItem("hrms_client_Token");

  // 🔒 helper — row lock check
  const isLocked = (item) => item.client_status !== "pending";

  // ================= FETCH
  const fetchInterviews = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/client/interviews`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const rows = res.data.data || [];
      setData(rows);

      // preload remarks & decision from DB
      const remarksMap = {};
      const decisionMap = {};

      rows.forEach((row) => {
        if (row.client_remarks) {
          remarksMap[row.id] = row.client_remarks;
        }
        if (row.client_status && row.client_status !== "pending") {
          decisionMap[row.id] = row.client_status;
        }
      });

      setRemarks(remarksMap);
      setDecision(decisionMap);
    } catch (err) {
      console.error("fetchInterviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  // ================= SUBMIT
  const handleSubmit = async (id) => {
    try {
      if (!decision[id]) {
        return alert("Select Accept or Reject");
      }

      if (!remarks[id]?.trim()) {
        return alert("Remarks required");
      }

      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/client/interviews/${id}/decision`,
        {
          client_status: decision[id],
          client_remarks: remarks[id],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      fetchInterviews();
    } catch (err) {
      console.error("decision error:", err);
    }
  };

// ===== helpers =====
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const formatTime = (time) => {
  if (!time) return "-";
  const [h, m] = time.split(":");
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ===== UI =====
return (
  <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 rounded-2xl">

    {/* CARD */}
    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-white/40 overflow-hidden w-screen sm:max-w-[calc(100vw-288px-40px)]">

      {/* HEADER */}
      <div className="px-6 py-5 bg-white border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-gray-900">Interview Tracker</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage candidate interviews efficiently
          </p>
        </div>

        <div className="text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1 rounded-full">
          {data.length} Candidates
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-auto max-h-[60vh]">
        <table className="min-w-[900px] w-full text-sm">

          {/* HEADER */}
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600">
            <tr>
              <th className="px-5 py-3 text-left font-semibold">Candidate</th>
              <th className="px-5 py-3 text-left font-semibold">Schedule</th>
              <th className="px-5 py-3 text-left font-semibold">Remarks</th>
              <th className="px-5 py-3 text-left font-semibold">Decision</th>
              <th className="px-5 py-3 text-center font-semibold">Action</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-12 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-12 text-gray-400">
                  No interviews found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="group border-t hover:bg-indigo-50/40 transition-all duration-200"
                >

                  {/* CANDIDATE */}
                  <td className="px-5 py-4">
                    <div className="font-semibold text-gray-900 group-hover:text-indigo-600">
                      {item.candidate_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      📞 {item.candidate_phone}
                    </div>
                  </td>

                  {/* DATE + TIME */}
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-gray-800">
                      {formatDate(item.interview_date)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTime(item.interview_time)}
                    </div>
                  </td>

                  {/* REMARKS */}
                  <td className="px-5 py-4">
                    <input
                      type="text"
                      disabled={isLocked(item)}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 w-52 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition disabled:bg-gray-100"
                      placeholder="Add remarks..."
                      value={remarks[item.id] || ""}
                      onChange={(e) =>
                        setRemarks({
                          ...remarks,
                          [item.id]: e.target.value,
                        })
                      }
                    />
                  </td>

                  {/* DECISION */}
                  <td className="px-5 py-4">
                    <select
                      disabled={isLocked(item)}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition disabled:bg-gray-100"
                      value={decision[item.id] || ""}
                      onChange={(e) =>
                        setDecision({
                          ...decision,
                          [item.id]: e.target.value,
                        })
                      }
                    >
                      <option value="">Select</option>
                      <option value="accepted">✅ Accept</option>
                      <option value="rejected">❌ Reject</option>
                    </select>
                  </td>

                  {/* ACTION */}
                  <td className="px-5 py-4 text-center">
                    <button
                      disabled={isLocked(item)}
                      onClick={() => handleSubmit(item.id)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow transition ${
                        isLocked(item)
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-105"
                      }`}
                    >
                      {isLocked(item) ? "Submitted" : "Submit"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
}
