import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Clock, User, Filter } from "lucide-react";
import { auditLogService } from "../../services/financeService";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await auditLogService.getAll(200);
      setLogs(response.data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action = "") => {
    if (action.includes("ADD")) return "bg-green-100 text-green-700";
    if (action.includes("DELETE")) return "bg-red-100 text-red-700";
    if (action.includes("UPDATE")) return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  const filteredLogs = filterAction
    ? logs.filter((log) =>
        (log.action || "").includes(filterAction.toUpperCase()),
      )
    : logs;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatDetails = (details) => {
    if (!details) return "";

    const formatObject = (obj) =>
      Object.entries(obj)
        .map(([key, value]) => {
          if (typeof value === "object") {
            return `${key}: { ${formatObject(value)} }`;
          }
          return `${key}: ${value}`;
        })
        .join(", ");

    return formatObject(details);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-1">
          Track all system activities and changes for Inventory, Assets, Purchase order. 
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Activity History
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                <option value="ADD">Add</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No activity yet
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(
                        log.action,
                      )}`}
                    >
                      {(log.action || "").replace(/_/g, " ")}
                    </span>
                    {log.user_name && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        {log.user_name}
                      </div>
                    )}
                  </div>
                  {log.details && (
                    <div className="text-sm text-gray-700 mt-1">
                      {typeof log.details === "object"
                        ? Object.entries(log.details).map(([key, value]) => (
                            <div key={key}>
                              <strong>{key}:</strong>{" "}
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : value}
                            </div>
                          ))
                        : log.details}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
