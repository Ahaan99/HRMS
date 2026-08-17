import { useEffect, useState } from "react";
import StatCard from "../../components/common/StatCard";
import { Users, UserCog, Building2, Briefcase, LayoutGrid } from "lucide-react";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState({
    employees: 0,
    hrAccounts: 0,
    departments: 0,
    clients: 0,
  });

  const navigate = useNavigate();
  const fetchDashboardStats = async () => {
    try {
      const [empRes, deptRes, clientRes] = await Promise.all([
        API.get("/super-admin/employees"),
        API.get("/super-admin/departments"),
        API.get("/super-admin/clients"),
      ]);

      const employees = empRes?.data?.employees || [];
      const departments =
        deptRes?.data?.data || deptRes?.data?.departments || [];
      const clients =
        clientRes?.data?.clients ||
        clientRes?.data?.data ||
        clientRes?.data ||
        [];

      // ✅ HR = departmentId === 1
      const hrCount = employees.filter(
        (emp) => Number(emp.departmentId) === 1,
      ).length;

      setStats({
        employees: employees.length,
        hrAccounts: hrCount,
        departments: departments.length,
        clients: Array.isArray(clients) ? clients.length : 0,
      });
    } catch (err) {
      console.error(`Dashboard stats error: ${err}`);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
  <div className="space-y-5 sm:space-y-6">
    {/* Header */}
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b1220] text-white">
        <LayoutGrid size={20} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7b8698]">
          HRMS Control Center
        </p>
        <h1 className="text-xl font-bold text-[#0b1220] tracking-tight">
          Overview
        </h1>
        <p className="text-[#7b8698] mt-0.5 text-xs sm:text-sm">
          Here&apos;s what&apos;s happening in your HRMS today.
        </p>
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      <StatCard
        title="Total Employees"
        value={stats.employees}
        subText="Active employees in system"
        icon={<Users size={22} />}
        gradient="bg-gradient-to-r from-blue-500/90 to-cyan-500/90"
      />

      <StatCard
        title="Total HR Accounts"
        value={stats.hrAccounts}
        subText="HR managers & recruiters"
        icon={<UserCog size={22} />}
        gradient="bg-gradient-to-r from-purple-500/90 to-pink-500/90"
      />

      <StatCard
        title="Departments"
        value={stats.departments}
        subText="Company departments configured"
        icon={<Building2 size={22} />}
        gradient="bg-gradient-to-r from-emerald-500/90 to-lime-500/90"
      />

      <StatCard
        title="Total Clients"
        value={stats.clients}
        subText="Registered clients"
        icon={<Briefcase size={22} />}
        gradient="bg-gradient-to-r from-orange-500/90 to-red-500/90"
      />
    </div>

    {/* Big Section */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5">
      {/* Activity */}
      <div className="xl:col-span-2 card-premium p-4 sm:p-6">
        <h2 className="card-header-premium">
          Recent Activity
        </h2>
        <p className="text-[#7b8698] text-xs sm:text-sm mt-1">
          Latest admin actions & HR updates.
        </p>

        <div className="mt-4 sm:mt-5 space-y-2 sm:space-y-3">
          {[
            "New HR account created: hr_manager@company.com",
            "Department added: Marketing",
            "Employee onboarding completed: EMP-2041",
            "Payroll cycle started for February",
          ].map((item, idx) => (
            <div
              key={idx}
              className="px-3.5 py-3 rounded-xl bg-[#f7f8fb] border border-[#e6e9f0] text-[#33405c] text-xs sm:text-sm break-words"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-premium p-4 sm:p-6">
        <h2 className="card-header-premium">
          Quick Actions
        </h2>
        <p className="text-[#7b8698] text-xs sm:text-sm mt-1">
          Fast shortcuts for admin.
        </p>

        <div className="mt-4 sm:mt-5 space-y-2 sm:space-y-2.5">
          {[
            {
              label: "Create Employee Account",
              to: "/dashboard/employees",
              glass:
                "bg-gradient-to-r from-[#3b82f6]/15 to-[#06b6d4]/15 border-[#3b82f6]/30 text-[#1d4ed8] hover:from-[#3b82f6]/25 hover:to-[#06b6d4]/25 hover:border-[#3b82f6]/50",
            },
            {
              label: "Add Department",
              to: "/departments",
              glass:
                "bg-gradient-to-r from-[#a855f7]/15 to-[#ec4899]/15 border-[#a855f7]/30 text-[#9333ea] hover:from-[#a855f7]/25 hover:to-[#ec4899]/25 hover:border-[#a855f7]/50",
            },
            {
              label: "Create Admin User",
              to: "/dashboard/client-management",
              glass:
                "bg-gradient-to-r from-[#22c55e]/15 to-[#84cc16]/15 border-[#16a34a]/30 text-[#15803d] hover:from-[#22c55e]/25 hover:to-[#84cc16]/25 hover:border-[#16a34a]/50",
            },
            {
              label: "AI Chat Hub",
              to: "/dashboard/ai-chat-hub",
              glass:
                "bg-gradient-to-r from-[#f97316]/15 to-[#ec4899]/15 border-[#f97316]/30 text-[#c2410c] hover:from-[#f97316]/25 hover:to-[#ec4899]/25 hover:border-[#f97316]/50",
            },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              className={`group w-full flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold border backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-200 ${a.glass}`}
            >
              {a.label}
              <span className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);
}
