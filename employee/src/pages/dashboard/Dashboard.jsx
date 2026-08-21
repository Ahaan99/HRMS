import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  PartyPopper,
  FileText,
  Target,
  BarChart3,
  Award,
  BookOpen,
  Palmtree,
  MessageSquare,
} from "lucide-react";

import EmployeeNavbar from "../../components/layout/EmployeeNavbar";
import GeoPunchCard from "../../components/GeoPunchCard";
import StatCard from "../../components/common/StatCard";
import API from "../../api/axios";

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    leaveAvailable: 0,
    leaveUsed: 0,
    pendingTasks: 0,
    upcomingHolidays: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [balRes, workRes, holRes] = await Promise.allSettled([
          API.get("/leave/my-balance"),
          API.get("/employee/work-assignment"),
          API.get("/leave/holidays"),
        ]);

        const next = { ...stats };

        if (balRes.status === "fulfilled") {
          const rows = balRes.value?.data || [];
          const allocated = rows.reduce(
            (sum, r) => sum + (parseFloat(r.allocated) || 0),
            0,
          );
          const used = rows.reduce(
            (sum, r) => sum + (parseFloat(r.used) || 0),
            0,
          );
          next.leaveAvailable = Math.max(allocated - used, 0);
          next.leaveUsed = used;
        }

        if (workRes.status === "fulfilled") {
          const tasks = workRes.value?.data?.data || [];
          next.pendingTasks = tasks.filter(
            (t) => (t.status || "").toLowerCase() !== "completed",
          ).length;
        }

        if (holRes.status === "fulfilled") {
          const hols = Array.isArray(holRes.value?.data)
            ? holRes.value.data
            : holRes.value?.data?.data || [];
          next.upcomingHolidays = hols.filter(
            (h) => new Date(h.date || h.holiday_date) >= new Date(),
          ).length;
        }

        setStats(next);
      } catch {
        /* widgets stay at defaults */
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const menuItems = [
    {
      title: "Work Assignment",
      path: "/assignments",
      icon: <FileText size={22} />,
    },

    {
      title: "My Targets",
      path: "/targets",
      icon: <Target size={22} />,
    },

    {
      title: "EOD",
      path: "/eod",
      icon: <BarChart3 size={22} />,
    },

    {
      title: "Performance",
      path: "/performance",
      icon: <Award size={22} />,
    },

    {
      title: "SOP Library",
      path: "/sops",
      icon: <BookOpen size={22} />,
    },

    {
      title: "My Leave",
      path: "/leave",
      icon: <Palmtree size={22} />,
    },

    {
      title: "AI Chat",
      path: "/chat",
      icon: <MessageSquare size={22} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <EmployeeNavbar />

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* WELCOME */}
        <div className="mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-700">
            Welcome back 👋
          </h2>

          <p className="text-sm text-gray-500">
            Manage your daily work easily
          </p>
        </div>

        {/* GEO ATTENDANCE */}
        <div className="mb-6 max-w-md">
          <GeoPunchCard />
        </div>

        {/* LIVE STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div onClick={() => navigate("/leave")} className="cursor-pointer">
            <StatCard
              title="Leave Available"
              value={stats.leaveAvailable}
              subText="Days remaining this year"
              gradient="bg-gradient-to-tr from-emerald-500 to-teal-500"
              icon={<Palmtree size={20} />}
            />
          </div>
          <div onClick={() => navigate("/leave")} className="cursor-pointer">
            <StatCard
              title="Leave Used"
              value={stats.leaveUsed}
              subText="Days taken this year"
              gradient="bg-gradient-to-tr from-amber-500 to-orange-500"
              icon={<CalendarDays size={20} />}
            />
          </div>
          <div
            onClick={() => navigate("/assignments")}
            className="cursor-pointer"
          >
            <StatCard
              title="Pending Tasks"
              value={stats.pendingTasks}
              subText="Open work assignments"
              gradient="bg-gradient-to-tr from-indigo-500 to-purple-500"
              icon={<ClipboardList size={20} />}
            />
          </div>
          <div onClick={() => navigate("/leave")} className="cursor-pointer">
            <StatCard
              title="Upcoming Holidays"
              value={stats.upcomingHolidays}
              subText="Company holidays ahead"
              gradient="bg-gradient-to-tr from-blue-500 to-cyan-500"
              icon="🎉"
            />
          </div>
        </div>

        {/* CARDS */}
        <div
          className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          gap-6
        "
        >
          {menuItems.map((item) => (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              className="
              group
              bg-white
              rounded-2xl
              p-6
              border
              shadow-sm
              hover:shadow-lg
              transition-all
              cursor-pointer
              hover:-translate-y-1
            "
            >
              {/* ICON */}
              <div
                className="
                w-12 h-12
                rounded-xl
                flex items-center justify-center
                mb-4
                bg-gray-100
                text-gray-700
                group-hover:bg-gray-900
                group-hover:text-white
                transition
              "
              >
                {item.icon}
              </div>

              {/* TITLE */}
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {item.title}
              </h3>

              <p className="text-sm text-gray-500">
                Open {item.title.toLowerCase()}
              </p>

              {/* HOVER LINE */}
              <div
                className="
                mt-4
                h-1
                w-0
                bg-indigo-500
                group-hover:w-full
                transition-all
                rounded-full
              "
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}