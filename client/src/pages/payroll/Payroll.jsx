import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [payrollList, setPayrollList] = useState([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [pdfForm, setPdfForm] = useState({
    employeeCode: "",
    month: "",
  });

  const [form, setForm] = useState({
    employee_id: "",
    payroll_month: "",
    basic_salary: "",
    hra: "",
    ta: "",
    da: "",
    attendance_days: "",
    overtime_amount: "",
    pf: "",
    esic: "",
  });

  const token = localStorage.getItem("hrms_client_Token");

  // =============================
  // FETCH PAYROLL
  // =============================
  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/client/payroll`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setPayrollList(res.data.data || []);
      }
    } catch (err) {
      toast.error(`Payroll fetch error`);
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // FETCH AVAILABLE MONTHS
  // =============================
  const fetchAvailableMonths = async (employeeCode) => {
    try {
      if (!employeeCode) {
        setAvailableMonths([]);
        return;
      }

      const res = await axios.get(
        `${BASE_URL}/client/payroll/months/${encodeURIComponent(employeeCode)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("MONTH API:", res.data); // 🔍 DEBUG

      if (res.data?.success) {
        setAvailableMonths(res.data.data || []);
      } else {
        setAvailableMonths([]);
      }
    } catch (err) {
      console.error("Months fetch error:", err);
      setAvailableMonths([]);
    }
  };

  // =============================
  // FETCH EMPLOYEES (A-Z)
  // =============================
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/client/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        const sorted = (res.data.data || []).sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        setEmployees(sorted);
      }
    } catch (err) {
      console.error("Employees fetch error:", err);
    }
  };

  // =============================
  // HANDLE INPUT
  // =============================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // =============================
  // GENERATE PAYROLL (SERVER SIDE)
  // =============================
  const handleGeneratePayroll = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/client/payroll/generate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data?.success) {
        toast.success("Payroll generated successfully");
        fetchPayroll();
      } else {
        toast.error(res.data?.message || "Generation failed");
      }
    } catch (err) {
      toast.error(
        `Generate error: ${err?.response?.data?.message || err.message}`,
      );
    }
  };

  // =============================
  // DOWNLOAD PDF
  // =============================
  const handleDownloadPDF = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/client/payroll/pdf/${encodeURIComponent(
          pdfForm.employeeCode,
        )}?month=${pdfForm.month}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `payroll-${pdfForm.employeeCode}.pdf`;
      link.click();

      setShowPdfModal(false);
      toast.success("PDF downloaded");
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || "PDF download failed");
    }
  };

  // =============================
  // CREATE PAYROLL
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/client/payroll`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowModal(false);
      setForm({
        employee_id: "",
        payroll_month: "",
        basic_salary: "",
        hra: "",
        ta: "",
        da: "",
        attendance_days: "",
        overtime_amount: "",
        pf: "",
        esic: "",
      });

      fetchPayroll();
      toast.success("Payroll added");
    } catch (err) {
      toast.error(`Payroll Add error: ${err}`);
    }
  };

  // =============================
  // DELETE PAYROLL
  // =============================
  const handleDelete = async (id) => {
    try {
      if (!window.confirm("Delete this payroll?")) return;

      await axios.delete(`${BASE_URL}/client/payroll/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchPayroll();
      toast.success("Payroll deleted");
    } catch (err) {
      toast.error(`Payroll Delete error: ${err}`);
    }
  };

  useEffect(() => {
    fetchPayroll();
    fetchEmployees();
  }, []);

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;

  // ===== UI =====
  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Payroll</h2>

        <div className="flex gap-2">
          {/* <button
            onClick={handleGeneratePayroll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Generate Payroll
          </button> */}

          <button
            onClick={() => setShowPdfModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Download PDF
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Add Payroll
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-linear-to-br from-indigo-50 via-white to-blue-50 p-4 rounded-2xl">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-white/40 overflow-hidden">
          {/* HEADER */}
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Payroll Summary
              </h2>
              <p className="text-sm text-gray-500">Employee salary breakdown</p>
            </div>

            <div className="text-sm text-gray-500">
              Total: {payrollList.length}
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-auto max-h-[60vh] w-screen sm:max-w-[calc(100vw-288px-40px)]">
            <table className="min-w-300 w-full text-sm">
              {/* HEADER */}
              <thead className="sticky top-0 z-10 bg-linear-to-r from-gray-50 to-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">#</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Attendance
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Role</th>
                  <th className="px-4 py-3 text-right font-semibold">Basic</th>
                  <th className="px-4 py-3 text-right font-semibold">HRA</th>
                  <th className="px-4 py-3 text-right font-semibold">TA</th>
                  <th className="px-4 py-3 text-right font-semibold">DA</th>
                  <th className="px-4 py-3 text-right font-semibold">Gross</th>
                  <th className="px-4 py-3 text-right font-semibold">PF</th>
                  <th className="px-4 py-3 text-right font-semibold">ESIC</th>
                  <th className="px-4 py-3 text-right font-semibold">Net</th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              {/* BODY */}
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="13"
                      className="text-center py-10 text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : payrollList.length === 0 ? (
                  <tr>
                    <td
                      colSpan="13"
                      className="text-center py-10 text-gray-400"
                    >
                      No payroll data found
                    </td>
                  </tr>
                ) : (
                  payrollList.map((row, index) => (
                    <tr
                      key={row.id}
                      className="border-t hover:bg-indigo-50/40 transition"
                    >
                      {/* SR */}
                      <td className="px-4 py-3 font-semibold text-gray-700">
                        {index + 1}
                      </td>

                      {/* EMPLOYEE */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">
                          {row.employee_name || "-"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {row.designation || "-"}
                        </div>
                      </td>

                      {/* ATTENDANCE */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">
                          {console.log(row)}
                          {row.attendance_days ?? 0} days
                        </span>
                      </td>

                      {/* ROLE */}
                      <td className="px-4 py-3 text-gray-600">
                        {row.designation || "-"}
                      </td>

                      {/* SALARY PARTS */}
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(row.basic_salary)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(row.hra)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(row.ta)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(row.da)}
                      </td>

                      {/* GROSS */}
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(row.gross_salary)}
                      </td>

                      {/* DEDUCTIONS */}
                      <td className="px-4 py-3 text-right text-red-600">
                        -{formatCurrency(row.pf)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        -{formatCurrency(row.esic)}
                      </td>

                      {/* NET */}
                      <td className="px-4 py-3 text-right font-bold text-green-600">
                        {formatCurrency(row.net_salary)}
                      </td>

                      {/* ACTION */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition"
                        >
                          Delete
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

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Add Payroll</h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
              <select
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              >
                <option value="">Select Employee</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.employeeCode})
                  </option>
                ))}
              </select>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  Payroll Month <span className="text-red-500">*</span>
                </label>

                <input
                  type="month"
                  name="payroll_month"
                  required
                  className="border p-2 rounded"
                  value={form.payroll_month}
                  onChange={handleChange}
                />

                <span className="text-xs text-gray-400">
                  Select salary month (YYYY-MM)
                </span>
              </div>

              <input
                name="basic_salary"
                placeholder="Basic"
                className="border p-2 rounded"
                value={form.basic_salary}
                onChange={handleChange}
              />
              <input
                name="hra"
                placeholder="HRA"
                className="border p-2 rounded"
                value={form.hra}
                onChange={handleChange}
              />

              <input
                name="ta"
                placeholder="TA"
                className="border p-2 rounded"
                value={form.ta}
                onChange={handleChange}
              />
              <input
                name="da"
                placeholder="DA"
                className="border p-2 rounded"
                value={form.da}
                onChange={handleChange}
              />

              <input
                name="attendance_days"
                placeholder="Attendance Days"
                className="border p-2 rounded"
                value={form.attendance_days}
                onChange={handleChange}
              />
              <input
                name="overtime_amount"
                placeholder="Overtime"
                className="border p-2 rounded"
                value={form.overtime_amount}
                onChange={handleChange}
              />

              <input
                name="pf"
                placeholder="PF"
                className="border p-2 rounded"
                value={form.pf}
                onChange={handleChange}
              />
              <input
                name="esic"
                placeholder="ESIC"
                className="border p-2 rounded"
                value={form.esic}
                onChange={handleChange}
              />

              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PDF MODAL ================= */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Download Payroll PDF</h3>

            <div className="grid gap-3">
              {/* Employee dropdown */}
              <select
                className="border p-2 rounded"
                value={pdfForm.employeeCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setPdfForm({ employeeCode: code, month: "" });
                  fetchAvailableMonths(code);
                }}
              >
                <option value="">Select Employee</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.employeeCode}>
                    {e.name} ({e.employeeCode})
                  </option>
                ))}
              </select>

              {/* Month dropdown */}

              <select
                className="border p-2 rounded"
                value={pdfForm.month}
                onChange={(e) =>
                  setPdfForm({ ...pdfForm, month: e.target.value })
                }
              >
                <option value="">Select Month</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// re-correct month section line 463
