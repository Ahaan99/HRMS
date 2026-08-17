import { useEffect, useState } from "react";
import {
  Bell,
  Inbox,
  UserPlus,
  Users,
  Bot,
  MessageSquare,
  ClipboardCheck,
  BarChart3,
  ScrollText,
  Search,
  Globe,
  BookOpen,
  Target,
  Laptop,
  FileEdit,
  MessageCircleWarning,
  ArrowUpRight,
  CalendarCheck,
  LogOut,
  X,
  Cake,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getTodayBirthdays,
  getNotifications,
  markNotificationsRead,
} from "../../services/notificationService";

export default function HRDashboard() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [slides, setSlides] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const user = JSON.parse(localStorage.getItem("hrms_hr_User") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("hrms_hr_Token");
    localStorage.removeItem("hrms_hr_User");
    window.location.href = "/";
  };

  const menuItems = [
    {
      title: "Lead Assigned to you",
      path: "/leads",
      icon: Inbox,
      accent: "bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-100",
      bar: "bg-fuchsia-500",
      desc: "Track and follow up on leads assigned to you",
    },
    {
      title: "New Joining",
      path: "/new-joining",
      icon: UserPlus,
      accent: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      bar: "bg-emerald-500",
      desc: "Onboard new employees and manage joinings",
    },
    {
      title: "Interview Management",
      path: "/inInterview-management",
      icon: Users,
      accent: "bg-indigo-50 text-indigo-600 ring-indigo-100",
      bar: "bg-indigo-500",
      desc: "Schedule, track and update interviews",
    },
    {
      title: "AI Robot Interviews",
      path: "/ai-interviews",
      icon: Bot,
      accent: "bg-violet-50 text-violet-600 ring-violet-100",
      bar: "bg-violet-500",
      desc: "Automated AI-driven candidate interviews",
    },
    {
      title: "Chat",
      path: "/chat",
      icon: MessageSquare,
      accent: "bg-sky-50 text-sky-600 ring-sky-100",
      bar: "bg-sky-500",
      desc: "Message employees and teams in real time",
    },
    {
      title: "Automated Attendance",
      path: "/attendance",
      icon: ClipboardCheck,
      accent: "bg-cyan-50 text-cyan-600 ring-cyan-100",
      bar: "bg-cyan-500",
      desc: "Monitor daily attendance and shift timings",
    },
    {
      title: "Performance",
      path: "/my-performance",
      icon: BarChart3,
      accent: "bg-purple-50 text-purple-600 ring-purple-100",
      bar: "bg-purple-500",
      desc: "Review scores, ratings and growth trends",
    },
    {
      title: "Work Policy",
      path: "/work-policy",
      icon: ScrollText,
      accent: "bg-blue-50 text-blue-600 ring-blue-100",
      bar: "bg-blue-500",
      desc: "Company policies, rules and guidelines",
    },
    {
      title: "Advanced Search",
      path: "/advanced-search",
      icon: Search,
      accent: "bg-slate-100 text-slate-600 ring-slate-200",
      bar: "bg-slate-500",
      desc: "Find employees, records and documents fast",
    },
    {
      title: "Website Forms",
      path: "/web-forms",
      icon: Globe,
      accent: "bg-teal-50 text-teal-600 ring-teal-100",
      bar: "bg-teal-500",
      desc: "Review submissions from the public website",
    },
    {
      title: "SOP Management",
      path: "/sop-management",
      icon: BookOpen,
      accent: "bg-sky-50 text-sky-600 ring-sky-100",
      bar: "bg-sky-500",
      desc: "Standard operating procedures library",
    },
    {
      title: "My Targets",
      path: "/my-targets",
      icon: Target,
      accent: "bg-rose-50 text-rose-600 ring-rose-100",
      bar: "bg-rose-500",
      desc: "Your goals, milestones and progress",
    },
    {
      title: "My assignments",
      path: "/my-assignments",
      icon: Laptop,
      accent: "bg-amber-50 text-amber-600 ring-amber-100",
      bar: "bg-amber-500",
      desc: "Work assigned to you and its status",
    },
    {
      title: "EOD",
      path: "/my-eod",
      icon: FileEdit,
      accent: "bg-indigo-50 text-indigo-600 ring-indigo-100",
      bar: "bg-indigo-500",
      desc: "Submit and review end-of-day reports",
    },
    {
      title: "Complaint box",
      path: "/complaint",
      icon: MessageCircleWarning,
      accent: "bg-orange-50 text-orange-600 ring-orange-100",
      bar: "bg-orange-500",
      desc: "Raise and resolve workplace concerns",
    },
  ];

  const fetchNotifications = async () => {
    try {
      const res = await getTodayBirthdays();
      const list = res?.data?.data || [];
      setNotifications(list);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchBirthdays = async () => {
    try {
      const res = await getTodayBirthdays();
      const list = res?.data?.data || [];

      const todayKey = `birthday_seen_${new Date().toDateString()}`;
      const alreadySeen = localStorage.getItem(todayKey);

      if (!alreadySeen && list.length > 0) {
        const newSlides = list.map((b) => {
          const isMe = Number(b.id) === Number(user?.id);
          return {
            id: b.id,
            message: isMe
              ? "🎂 Happy Birthday to you!"
              : `🎉 Happy Birthday ${b.name}`,
          };
        });

        setSlides(newSlides);

        setTimeout(() => {
          setSlides([]);
        }, 10000 + list.length * 2000);

        localStorage.setItem(todayKey, "true");
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchBirthdays();
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ── STICKY HEADER ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="Ardhnarishwar logo"
              className="h-10 w-10 rounded-xl shadow-sm ring-1 ring-slate-200"
            />
            <div>
              <h1 className="text-sm font-bold tracking-wide text-slate-900">
                ARDHNARISHWAR
              </h1>
              <p className="text-xs text-slate-500">HRMS HR Panel</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              onClick={() => navigate("/attendance")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-500"
            >
              <CalendarCheck size={15} aria-hidden="true" />
              Attendance
            </button>

            <button
              onClick={() => navigate("/performance")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-500"
            >
              <BarChart3 size={15} aria-hidden="true" />
              Performance
            </button>

            <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white shadow-sm">
                {user.name?.charAt(0) || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight text-slate-900">
                  {user.name || "Demo User"}
                </p>
                <p className="text-xs text-slate-500">
                  {user.email || "demo@hrms.com"}
                </p>
              </div>
            </div>

            <div className="relative">
              <button
                aria-label="Notifications"
                onClick={async () => {
                  setOpenDropdown(!openDropdown);
                  try {
                    await markNotificationsRead();
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, is_read: 1 })),
                    );
                  } catch (err) {
                    console.log(err);
                  }
                }}
                className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100"
            >
              <LogOut size={15} aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── BIRTHDAY SIDEBAR ──────────────────────────────────── */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-80 transform bg-white shadow-2xl transition-transform duration-300
        ${openDropdown ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="inline-flex items-center gap-2 font-semibold text-slate-900">
            <Cake size={18} className="text-rose-500" aria-hidden="true" />
            Birthdays
          </h3>
          <button
            onClick={() => setOpenDropdown(false)}
            aria-label="Close birthdays panel"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 p-4">
          {notifications.length === 0 && (
            <p className="text-sm text-slate-500">No birthdays today.</p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-100"
            >
              🎉 {n.name}
            </div>
          ))}
        </div>
      </div>

      {/* ── BIRTHDAY SLIDES ───────────────────────────────────── */}
      <div className="pointer-events-none fixed left-0 top-20 z-50 w-full">
        {slides.map((s, index) => (
          <div
            key={s.id}
            className="animate-slide-across absolute left-0 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg"
            style={{
              top: `${index * 60}px`,
              animationDelay: `${index * 1.5}s`,
            }}
          >
            {s.message}
          </div>
        ))}
      </div>

      {/* ── HERO BAND ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-900">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #818cf8 1px, transparent 1px), linear-gradient(to bottom, #818cf8 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-12">
          <p className="text-xs font-medium uppercase tracking-widest text-indigo-300">
            {today}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl text-balance">
            Welcome back, {user.name || "User"}
          </h2>
          <p className="mt-1 text-sm text-slate-400 md:text-base">
            Here&apos;s what&apos;s happening today — pick a workspace to get
            started.
          </p>
        </div>
      </section>

      {/* ── MAIN CARDS ────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 pb-14 md:px-8">
        <div className="-mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {/* top accent bar */}
                <span
                  className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${item.bar}`}
                />

                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-transform duration-200 group-hover:scale-110 ${item.accent}`}
                  >
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:border-slate-300 group-hover:text-slate-700">
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </span>
                </div>

                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
