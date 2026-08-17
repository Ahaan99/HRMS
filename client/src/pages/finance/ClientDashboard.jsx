import { useEffect, useState } from "react";
import axios from "axios";

import AddExpenseModal from "../../components/finance/AddExpenseModal";
import AddRevenueModal from "../../components/finance/AddRevenueModal";

import ClientRevenueExpenseChart from "../../components/finance/ClientRevenueExpenseChart";
import ClientProfitAnalytics from "../../components/finance/ClientProfitAnalytics";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ClientDashboard() {
  const token = localStorage.getItem("hrms_client_Token");

  const [summary, setSummary] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
  });

  const [revenues, setRevenues] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [activeView, setActiveView] = useState("revenue");

  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const fetchData = async () => {
    const [summaryRes, revRes, expRes] = await Promise.all([
      axios.get(`${BASE_URL}/client/profit`, { headers }),
      axios.get(`${BASE_URL}/client/revenue`, { headers }),
      axios.get(`${BASE_URL}/client/expenses`, { headers }),
    ]);

    setSummary(summaryRes.data);
    setRevenues(revRes.data);
    setExpenses(expRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* 🔥 KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveView("revenue")}
          className="bg-green-100 p-5 rounded-xl cursor-pointer"
        >
          <p>Total Revenue</p>
          <h2 className="font-bold">₹{summary.revenue}</h2>
        </div>

        <div
          onClick={() => setActiveView("expenses")}
          className="bg-red-100 p-5 rounded-xl cursor-pointer"
        >
          <p>Total Expenses</p>
          <h2 className="font-bold">₹{summary.expenses}</h2>
        </div>

        <div
          onClick={() => setActiveView("profit")}
          className="bg-blue-100 p-5 rounded-xl cursor-pointer"
        >
          <p>Net Profit</p>
          <h2 className="font-bold">₹{summary.profit}</h2>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <ClientRevenueExpenseChart data={summary} />
        <ClientProfitAnalytics revenues={revenues} expenses={expenses} />
      </div>

      {/* 🔥 ACTION BUTTONS */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setShowRevenueModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Add Revenue
        </button>

        <button
          onClick={() => setShowExpenseModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Add Expense
        </button>
      </div>

      {/* 🔥 TABLES */}
      <div className="bg-white p-4 rounded-xl shadow">
        {/* Revenue */}
        {activeView === "revenue" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Category</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Date</th>
                <th className="p-2">Description</th>
              </tr>
            </thead>

            <tbody>
              {revenues.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.category}</td>
                  <td className="p-2">₹{r.amount}</td>
                  <td className="p-2">{r.revenue_date}</td>
                  <td className="p-2">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Expenses */}
        {activeView === "expenses" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Category</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Date</th>
                <th className="p-2">Description</th>
              </tr>
            </thead>

            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="p-2">{e.category}</td>
                  <td className="p-2">₹{e.amount}</td>
                  <td className="p-2">{e.expense_date}</td>
                  <td className="p-2">{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Profit */}
        {activeView === "profit" && (
          <div className="text-center py-10">
            <h2 className="text-lg font-semibold">Net Profit</h2>
            <p className="text-2xl font-bold mt-2">₹{summary.profit}</p>
          </div>
        )}
      </div>

      {/* 🔥 MODALS */}
      <AddRevenueModal
        open={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
        refresh={fetchData}
      />

      <AddExpenseModal
        open={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        refresh={fetchData}
      />
    </div>
  );
}
