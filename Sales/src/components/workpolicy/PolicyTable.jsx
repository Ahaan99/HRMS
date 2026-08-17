import { RefreshCw, Eye, Edit, Trash2, FileText } from "lucide-react";
import { useState } from "react";

export default function PolicyTable({ rows, loading, onRefresh }) {
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-emerald-100 text-emerald-700 border-emerald-200",
      draft: "bg-gray-100 text-gray-700 border-gray-200",
      under_review: "bg-yellow-100 text-yellow-700 border-yellow-200",
      archived: "bg-red-100 text-red-700 border-red-200",
    };
    const labels = {
      active: "Active",
      draft: "Draft",
      under_review: "Under Review",
      archived: "Archived",
    };
    const icons = {
      active: "🟢",
      draft: "📝",
      under_review: "🔍",
      archived: "📦",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}
      >
        {icons[status]} {labels[status]}
      </span>
    );
  };

  return (
    <>
      <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Company Policies
          </h3>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gray-50/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Policy ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Effective Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No policies found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-4 text-sm font-mono text-indigo-600">
                      {row.policyId || `POL-${row.id}`}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-800 text-sm">
                          {row.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {row.category}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {row.department}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {row.effectiveDate
                        ? new Date(row.effectiveDate).toLocaleDateString(
                            "en-GB",
                          )
                        : "-"}
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(row.status)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedPolicy(row)}
                          className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 transition"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 text-sm text-gray-500">
            Showing {rows.length} policy policies
          </div>
        )}
      </div>

      {selectedPolicy && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPolicy(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedPolicy.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedPolicy.policyId}
                </p>
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="font-medium text-gray-800">
                    {selectedPolicy.category}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="font-medium text-gray-800">
                    {selectedPolicy.department}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Effective Date</p>
                  <p className="font-medium text-gray-800">
                    {selectedPolicy.effectiveDate
                      ? new Date(
                          selectedPolicy.effectiveDate,
                        ).toLocaleDateString("en-GB")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="font-medium text-gray-800">
                    {selectedPolicy.lastUpdated
                      ? new Date(selectedPolicy.lastUpdated).toLocaleDateString(
                          "en-GB",
                        )
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedPolicy.status)}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3 text-sm">
                  {selectedPolicy.description}
                </p>
              </div>

              {selectedPolicy.rules && selectedPolicy.rules.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Policy Rules</p>
                  <div className="space-y-2">
                    {selectedPolicy.rules.map((rule, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-amber-50 rounded-lg p-3"
                      >
                        <span className="text-amber-600 font-bold">•</span>
                        <span className="text-gray-700 text-sm">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPolicy.violations &&
                selectedPolicy.violations.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      Violation Penalties
                    </p>
                    <div className="space-y-2">
                      {selectedPolicy.violations.map((violation, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 bg-red-50 rounded-lg p-3"
                        >
                          <span className="text-red-600 font-bold">
                            {index + 1}.
                          </span>
                          <span className="text-gray-700 text-sm">
                            {violation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="flex gap-3 pt-4 border-t">
                <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
