import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Wallet, BarChart3, DollarSign, PieChart } from "lucide-react";
import { reportService, revenueService, expenseService } from "../../services/financeService";

export default function FinanceDashboard() {
  const [summary, setSummary] = useState(null);
  const [recentRevenue, setRecentRevenue] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, revenueRes, expenseRes] = await Promise.all([
        reportService.getSummary(),
        revenueService.getAll(),
        expenseService.getAll(),
      ]);

      setSummary(summaryRes.data);
      setRecentRevenue(revenueRes.data.slice(0, 5));
      setRecentExpenses(expenseRes.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching finance data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Revenue",
      value: `₹${(summary?.revenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Total Expenses",
      value: `₹${(summary?.expenses || 0).toLocaleString()}`,
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-100",
    },
    {
      title: "Net Profit",
      value: `₹${(summary?.profit || 0).toLocaleString()}`,
      icon: DollarSign,
      color: summary?.profit >= 0 ? "text-green-600" : "text-red-600",
      bg: summary?.profit >= 0 ? "bg-green-100" : "bg-red-100",
    },
    {
      title: "Profit Margin",
      value: `${summary?.profitMargin || 0}%`,
      icon: PieChart,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Cash Flow",
      value: `₹${(summary?.cashFlow || 0).toLocaleString()}`,
      icon: Wallet,
      color: summary?.cashFlow >= 0 ? "text-green-600" : "text-red-600",
      bg: summary?.cashFlow >= 0 ? "bg-green-100" : "bg-red-100",
    },
    {
      title: "Total Assets",
      value: `₹${(summary?.totalAssets || 0).toLocaleString()}`,
      icon: BarChart3,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your financial performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Revenue</h2>
          <div className="space-y-3">
            {recentRevenue.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No revenue records yet</p>
            ) : (
              recentRevenue.map((rev) => (
                <div key={rev.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{rev.source}</p>
                    <p className="text-sm text-gray-600">{new Date(rev.date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-green-600 font-semibold">₹{rev.amount.toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Expenses</h2>
          <div className="space-y-3">
            {recentExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No expense records yet</p>
            ) : (
              recentExpenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{exp.category}</p>
                    <p className="text-sm text-gray-600">{new Date(exp.date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-red-600 font-semibold">₹{exp.amount.toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
