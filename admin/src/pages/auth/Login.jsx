import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";

const ROLE_META = {
  admin: {
    label: "Admin",
    panelTitle: "Admin Panel",
    panelDesc: "Manage HR, Employees, Departments & Settings.",
    subtitle: "Login to continue to HRMS Admin Panel.",
    icon: "\u2699",
  },
  manager: {
    label: "Manager",
    panelTitle: "Manager Panel",
    panelDesc: "Oversee teams, approvals & performance.",
    subtitle: "Login to continue to HRMS Manager Panel.",
    icon: "\u2691",
  },
  tl: {
    label: "TL",
    panelTitle: "Team Lead Panel",
    panelDesc: "Track your team's tasks, attendance & reports.",
    subtitle: "Login to continue to HRMS TL Panel.",
    icon: "\u2605",
  },
};

const FEATURES = [
  { icon: "\u{1F512}", title: "Secure Access", desc: "Role-based permissions" },
  { icon: "\u{1F4CA}", title: "Live Insights", desc: "Real-time dashboards" },
  { icon: "\u26A1", title: "Automation", desc: "Tasks, payroll & tracking" },
  { icon: "\u{1F4AC}", title: "Built-in Chat", desc: "Talk to HR instantly" },
];

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState("admin");
  const [otpStep, setOtpStep] = useState(null); // { admin_id, dev_otp }
  const [otp, setOtp] = useState("");

  const role = ROLE_META[loginType];

  const finishLogin = (res) => {
    setAuth({
      token: res.token,
      user: res.user,
    });
    toast.success("Login successful");
    navigate("/");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const endpoint =
      loginType === "admin"
        ? "/super-admin/auth/login"
        : loginType === "manager"
          ? "/super-admin/auth/login-manager"
          : "/super-admin/auth/login-tl";
    try {
      setLoading(true);

      const { data: res } = await API.post(endpoint, {
        email,
        password,
      });

      if (!res?.success) {
        throw new Error(res?.message || "Login failed");
      }

      if (res.requires_otp) {
        setOtpStep({ admin_id: res.admin_id, dev_otp: res.dev_otp });
        setOtp("");
        toast("Enter the OTP to continue");
        return;
      }

      finishLogin(res);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: res } = await API.post("/super-admin/auth/verify-otp", {
        admin_id: otpStep.admin_id,
        otp,
      });
      if (!res?.success) throw new Error(res?.message || "OTP failed");
      finishLogin(res);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "OTP verification failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white placeholder-white/25 " +
    "outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/25";

  const labelClass =
    "text-xs font-semibold uppercase tracking-wider text-white/60";

  const gradientBtn =
    "w-full rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-600 py-4 text-base font-bold text-white " +
    "shadow-[0_0_24px_rgba(217,70,239,0.35)] transition-all hover:brightness-110 " +
    "disabled:opacity-50 disabled:hover:brightness-100";

  return (
    <div className="min-h-screen flex bg-[#0a0812] text-white">
      {/* ============ LEFT — VIOLET PANEL (large screens) ============ */}
      <div className="hidden lg:flex w-[48%] shrink-0 flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#150f2e] via-[#120b22] to-[#0a0714] px-10 py-8 xl:px-14 max-h-screen">
        {/* grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(167,139,250,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,.5) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        {/* soft glows */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-fuchsia-600/10 blur-[110px]" />

        {/* Brand */}
        <div className="relative flex items-center gap-3 shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 text-base font-extrabold text-white shadow-lg shadow-fuchsia-900/50">
            H
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-wide leading-none">
              HRMS
            </p>
            <p className="text-[10px] text-white/50 tracking-wide mt-1">
              HUMAN RESOURCE MANAGEMENT SYSTEM
            </p>
          </div>
        </div>

        {/* Middle: pill + headline + paragraph + features */}
        <div className="relative my-6 min-h-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-[11px] font-semibold text-fuchsia-200">
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
            Trusted workspace for modern teams
          </p>

          <h1 className="mt-4 text-3xl xl:text-4xl font-extrabold leading-[1.15] tracking-tight text-balance">
            Your entire workforce,
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
              one beautiful dashboard.
            </span>
          </h1>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
            Attendance, payroll, performance, assets and support — everything
            your company runs on, unified in a single premium workspace.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 max-w-lg">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.08] hover:border-white/20"
              >
                <span className="text-lg shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-bold leading-tight">{f.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: role card + footer */}
        <div className="relative space-y-3 shrink-0">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.08] to-white/[0.03] px-4 py-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 text-lg shadow-lg shadow-fuchsia-900/40">
              {role.icon}
            </div>
            <div>
              <p className="text-sm font-bold">{role.panelTitle}</p>
              <p className="text-xs text-white/60 mt-0.5">{role.panelDesc}</p>
            </div>
          </div>
          <p className="text-[10px] text-white/35 tracking-wide">
            Secure Login &bull; Role Based Access &bull; Scalable System
          </p>
        </div>
      </div>

      {/* ============ RIGHT — FLAT DARK FORM ============ */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-10">
        <div className="w-full max-w-lg">
          {/* Brand (only when left panel hidden) */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 text-sm font-extrabold text-white shadow-lg shadow-fuchsia-900/50">
              H
            </div>
            <div>
              <p className="text-base font-extrabold tracking-wide leading-none">
                HRMS
              </p>
              <p className="text-[9px] text-white/50 tracking-wide mt-1">
                HUMAN RESOURCE MANAGEMENT SYSTEM
              </p>
            </div>
          </div>

          {/* Role toggle */}
          <div className="flex rounded-2xl border border-white/10 bg-white/[0.04] p-1.5">
            {Object.entries(ROLE_META).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => setLoginType(key)}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
                  loginType === key
                    ? "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-600 text-white shadow-lg shadow-fuchsia-900/50"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {meta.label}
              </button>
            ))}
          </div>

          <h2 className="mt-7 text-4xl font-extrabold tracking-tight">
            Welcome{" "}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
              back
            </span>
          </h2>
          <p className="mt-2 text-white/50">{role.subtitle}</p>

          {otpStep ? (
            <form onSubmit={handleVerifyOtp} className="mt-7 space-y-6">
              <div>
                <label className={labelClass}>One-Time Password</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="6-digit OTP"
                  className={`${inputClass} text-center text-lg font-bold tracking-[0.4em]`}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
                <p className="mt-2 text-xs text-white/35">
                  OTP expires in 5 minutes.
                </p>
                {otpStep.dev_otp && (
                  <div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/10 p-3">
                    <p className="text-xs text-amber-200">
                      Dev mode (no email configured) &mdash; your OTP is{" "}
                      <span className="font-bold tracking-widest">
                        {otpStep.dev_otp}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <button
                disabled={loading || otp.length !== 6}
                className={gradientBtn}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => setOtpStep(null)}
                className="w-full text-center text-sm text-white/40 transition hover:text-white"
              >
                Back to login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="mt-7 space-y-6">
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  placeholder="admin@hrms.com"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`${inputClass} pr-12`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-white/40 transition hover:text-white"
                  >
                    {showPassword ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button disabled={loading} className={gradientBtn}>
                {loading ? "Logging in..." : `Login as ${role.label}`}
              </button>

              {/* Demo credentials */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Demo Credentials
                </p>
                <div className="mt-2 flex flex-col gap-1 text-sm text-white/70">
                  <p>
                    Email:{" "}
                    <span className="font-semibold text-white">
                      admin@hrms.com
                    </span>
                  </p>
                  <p>
                    Password:{" "}
                    <span className="font-semibold text-white">123</span>
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
