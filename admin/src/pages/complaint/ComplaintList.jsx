import { useEffect, useState } from "react";
import API from "../../services/api.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function ComplaintList() {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  const fetchComplaints = async () => {
    try {
      const res = await API.get("/complaints");

      // 🔥 SORT latest first
      const sorted = res.data.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      setData(sorted);
    } catch (err) {
      toast.error("Failed to fetch complaints");
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // 🔥 FILTER ACTIVE (hide resolved)
  const active = data.filter((c) => c.status !== "resolved");

  // 🔥 GROUP BY PORTAL
  const groupByRole = (role) =>
    active.filter((item) => item.created_by_role === role);

  const clientData = groupByRole("client");
  const salesData = groupByRole("sales");
  const hrData = groupByRole("hr");

  // const renderSection = (title, list) => {
  //   if (!list.length) return null;

  //   return (
  //     <div className="mb-8">
  //       <h2 className="text-lg font-semibold mb-3">{title}</h2>

  //       <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
  //         {list.map((item) => (
  //           <div
  //             key={item.id}
  //             onClick={() => navigate(`/complaints/${item.id}`)}
  //             className="p-4 rounded-xl border shadow hover:shadow-lg cursor-pointer"
  //           >
  //             <div className="flex justify-between mb-2">
  //               <h3 className="font-semibold">{item.title}</h3>

  //               <span
  //                 className={`text-xs px-2 py-1 rounded ${
  //                   item.priority === "high"
  //                     ? "bg-red-100 text-red-600"
  //                     : item.priority === "medium"
  //                       ? "bg-yellow-100 text-yellow-600"
  //                       : "bg-green-100 text-green-600"
  //                 }`}
  //               >
  //                 {item.priority}
  //               </span>
  //             </div>

  //             <p className="text-sm text-gray-600">
  //               👤 {item.employee_name || item.client_name || "Unknown"}
  //             </p>

  //             <p className="text-sm text-gray-500">
  //               🏢 {item.department_name || "N/A"}
  //             </p>

  //             <p className="text-xs mt-2 text-gray-400">
  //               {new Date(item.created_at).toLocaleString()}
  //             </p>
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   );
  // };


  const renderSection = (title, list, gradient) => {
  if (!list.length) return null;

  return (
    <div className="space-y-4">
      {/* SECTION HEADER */}
      <div className={`p-3 rounded-xl text-white font-semibold bg-gradient-to-r ${gradient} shadow`}>
        {title}
      </div>

      {/* CARDS */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {list.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/complaints/${item.id}`)}
            className="group relative p-5 rounded-2xl bg-white/70 backdrop-blur-lg 
            border border-gray-200 shadow-md cursor-pointer 
            hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            {/* GLOW EFFECT */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
            bg-gradient-to-r from-indigo-200 via-transparent to-purple-200 blur-xl transition"></div>

            {/* CONTENT */}
            <div className="relative z-10">
              {/* TITLE + PRIORITY */}
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition">
                  {item.title}
                </h3>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
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
                👤 {item.employee_name || item.client_name || "Unknown"}
              </p>

              {/* DEPARTMENT */}
              <p className="text-sm text-gray-500">
                🏢 {item.department_name || "N/A"}
              </p>

              {/* DATE */}
              <p className="text-xs mt-3 text-gray-400">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

return (
  <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">

    {/* HEADER */}
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
        Active Complaints
      </h1>

      <button
        onClick={() => navigate("/complaints/resolved")}
        className="px-5 py-2 rounded-xl text-sm font-semibold 
        bg-gradient-to-r from-indigo-500 to-purple-500 
        text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all"
      >
        View Resolved →
      </button>
    </div>

    {/* SECTION RENDER */}
    {renderSection("Client Complaints", clientData, "from-indigo-500 to-blue-500")}
    {renderSection("Sales Complaints", salesData, "from-green-500 to-emerald-500")}
    {renderSection("HR Complaints", hrData, "from-orange-500 to-yellow-500")}

    {!active.length && (
      <p className="text-gray-400 text-center">No active complaints</p>
    )}
  </div>
);
}
