const getStatusBadge = (status) => {
  const base =
    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold";

  switch (status) {
    case "accepted":
      return `${base} bg-green-100 text-green-700`;
    case "rejected":
      return `${base} bg-red-100 text-red-700`;
    default:
      return `${base} bg-yellow-100 text-yellow-700`;
  }
};

const isFollowupOverdue = (call) => {
  if (!call.follow_up_datetime) return false;
  return new Date(call.follow_up_datetime) < new Date();
};

export default function CallsTable({
  calls = [],
  onEdit,
  loading,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          {/* HEADER */}
          <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="th">Call ID</th>
              <th className="th">Client</th>
              <th className="th">Customer</th>
              <th className="th">Phone</th>
              <th className="th">Email</th>
              <th className="th">Language</th>
              <th className="th">Call Date</th>
              <th className="th">Time</th>
              <th className="th">Status</th>
              <th className="th">Follow Up</th>
              <th className="th">Salary / CTC</th>
              <th className="th">Remarks</th>
              <th className="th text-right">Action</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan="13" className="text-center py-12 text-gray-500">
                  Loading calls...
                </td>
              </tr>
            )}

            {!loading &&
              calls.map((c) => (
                <tr
                  key={c.id}
                  className={`transition-colors ${
                    isFollowupOverdue(c)
                      ? "bg-red-50 hover:bg-red-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* Call ID */}
                  <td className="td font-semibold text-gray-900">
                    {c.call_id}
                  </td>

                  {/* Client */}
                  <td className="td">
                    <span className="font-medium text-gray-800">
                      {c.client_code || "-"}
                    </span>
                  </td>

                  {/* Customer */}
                  <td className="td">
                    <div className="font-medium text-gray-900">
                      {c.customer_name || "-"}
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="td text-gray-700">
                    {c.phone || "-"}
                  </td>

                  {/* Email */}
                  <td className="td text-gray-600">
                    {c.email || "-"}
                  </td>

                  {/* Language */}
                  <td className="td text-gray-600">
                    {c.language || "-"}
                  </td>

                  {/* Call Date */}
                  <td className="td text-gray-600">
                    {c.call_date
                      ? c.call_date.slice(0, 10)
                      : "-"}
                  </td>

                  {/* Call Time */}
                  <td className="td text-gray-600">
                    {c.call_time || "-"}
                  </td>

                  {/* Status */}
                  <td className="td">
                    <span className={getStatusBadge(c.status)}>
                      {c.status}
                    </span>
                  </td>

                  {/* Follow Up */}
                  <td className="td text-gray-600">
                    {c.follow_up_datetime
                      ? c.follow_up_datetime
                          .slice(0, 16)
                          .replace("T", " ")
                      : "-"}
                  </td>

                  {/* Salary / CTC */}
                  <td className="td text-gray-600 whitespace-nowrap">
                    {c.salary || c.ctc || c.lpa ? (
                      <div className="flex flex-col leading-tight">
                        {c.salary != null && c.salary !== "" && (
                          <span className="font-medium text-gray-800">
                            &#8377;
                            {Number(c.salary).toLocaleString("en-IN", {
                              maximumFractionDigits: 0,
                            })}
                            /mo
                          </span>
                        )}
                        {c.lpa != null && c.lpa !== "" && (
                          <span className="text-[11px] text-emerald-700">
                            {Number(c.lpa).toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}{" "}
                            LPA
                          </span>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* Remarks */}
                  <td className="td max-w-[200px]">
                    <div className="truncate text-gray-600">
                      {c.remarks || "-"}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="td text-right">
                    <button
                      onClick={() => onEdit?.(c)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg
                                 bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}

            {!loading && !calls.length && (
              <tr>
                <td colSpan="13" className="text-center py-12 text-gray-500">
                  No calls found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}