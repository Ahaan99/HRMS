import { useEffect, useState } from "react";
import API from "../../services/api.js";
import { useNavigate } from "react-router-dom";

export default function ResolvedComplaints() {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const res = await API.get("/complaints");

      const resolved = res.data.data
        .filter((c) => c.status === "resolved")
        .sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        );

      setData(resolved);
    };

    fetch();
  }, []);

return (
  <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    
    <h1 className="text-2xl font-bold mb-6 text-gray-800">
      Resolved Complaints
    </h1>

    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      {data.map((item) => (
        <div
          key={item.id}
          onClick={() => navigate(`/complaints/${item.id}`)}
          className="group p-5 rounded-2xl bg-white border shadow-md cursor-pointer
          hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div className="flex justify-between mb-3">
            <h3 className="font-semibold text-gray-800 group-hover:text-green-600">
              {item.title}
            </h3>

            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
              Resolved
            </span>
          </div>

          <p className="text-sm text-gray-600">
            👤 {item.client_name || item.employee_name}
          </p>

          <p className="text-xs mt-3 text-gray-400">
            {new Date(item.updated_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  </div>
);
}
