import dayjs from "dayjs";

export default function ClientProfitAnalytics({ revenues, expenses }) {

  const today = dayjs();

  const calculate = (fromDate) => {

    const rev = revenues
      .filter(r => dayjs(r.revenue_date).isAfter(fromDate))
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const exp = expenses
      .filter(e => dayjs(e.expense_date).isAfter(fromDate))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      revenue: rev,
      expenses: exp,
      profit: rev - exp
    };
  };

  const todayData = calculate(today.startOf("day"));
  const weekData = calculate(today.subtract(7, "day"));
  const monthData = calculate(today.startOf("month"));

  const rows = [
    { label: "Today", ...todayData },
    { label: "Last 7 Days", ...weekData },
    { label: "This Month", ...monthData },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow">

      <h2 className="font-semibold mb-3">Profit Analytics</h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2">Period</th>
            <th className="p-2">Revenue</th>
            <th className="p-2">Expenses</th>
            <th className="p-2">Profit</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{r.label}</td>
              <td className="p-2 text-green-600">₹{r.revenue}</td>
              <td className="p-2 text-red-600">₹{r.expenses}</td>
              <td className="p-2 font-semibold">₹{r.profit}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}