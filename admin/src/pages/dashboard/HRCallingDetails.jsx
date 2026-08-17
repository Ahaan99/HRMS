import { useEffect, useState } from "react";
import { getAllInterviews } from "../../services/interviewService";
import AdminInterviewTable from "../../components/Interview/AdminInterviewTable";
import ExportButton from "../../components/common/ExportButton";

export default function HRCallingDetails() {

  const table = "All HR's Calling (Admin)";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // PAGINATION
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  // FILTERS
  const [filters, setFilters] = useState({
    search: "",
  });

  const fetchData = async () => {
    try {

      setLoading(true);

      const res = await getAllInterviews({
        page,
        limit,
        search: filters.search,
      });

      setRows(res.data.data.rows);
      setTotalPages(res.data.data.totalPages);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, filters]);

  useEffect(() => {
    setPage(1);
  }, [limit, filters]);

  return (
    <div className="p-4">

      {/* TOP FILTERS */}
      <div className="flex flex-wrap items-center gap-3 mb-4">

        <span className="font-bold">
          Row Limit
        </span>

        {/* LIMIT */}
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="border rounded-xl px-4 py-2"
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
          <option value={300}>300</option>
          <option value={400}>400</option>
          <option value={500}>500</option>
        </select>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search name or phone"
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              search: e.target.value,
            }))
          }
          className="border rounded-xl px-4 py-2"
        />

        <ExportButton data={rows} filename="hr-calling" />

        {/* PAGINATION */}
        <div className="flex items-center gap-3">

          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="px-4 py-2 rounded-xl border disabled:opacity-50"
          >
            Prev
          </button>

          <span className="font-semibold">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="px-4 py-2 rounded-xl border disabled:opacity-50"
          >
            Next
          </button>

        </div>

      </div>

      {/* TABLE */}
      <AdminInterviewTable
        rows={rows}
        table={table}
        loading={loading}
      />

    </div>
  );
}
