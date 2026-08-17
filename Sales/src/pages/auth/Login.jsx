import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  TrendingUp,
  FileBarChart,
  BellRing,
  ShieldCheck,
} from "lucide-react";
import OtpLogin from "../../components/OtpLogin";

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Sales Pipeline",
    desc: "Track every deal from lead to close",
  },
  {
    icon: FileBarChart,
    title: "Smart Reports",
    desc: "Real-time revenue & performance insights",
  },
  {
    icon: BellRing,
    title: "Due Follow-Ups",
    desc: "Never miss a client follow-up again",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("password");

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { data: res } = await axios.post(`${BASE_URL}/sales/auth/login`, {
        email,
        password,
      });

      if (!res?.success) {
        throw new Error(res?.message || "Login failed");
      }

      setAuth({
        token: res.token,
        user: res.user,
      });

      toast.success("Login successful");
      navigate("/sales-reports");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 p-4">
      {/* ambient background */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-purple-200/50 blur-3xl" />

      <div className="relative grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-300/60 ring-1 ring-slate-200/60 md:grid-cols-2">
        {/* ================= LEFT / BRAND ================= */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-10 text-white md:flex">
          {/* grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-purple-600/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/25 blur-3xl" />

          {/* brand */}
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-medium uppercase tracking-widest text-slate-300">
                Ardhnarishwar HRMS
              </span>
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight">
              HRMS{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                SALES
              </span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              The command center for your entire sales operation.
            </p>
          </div>

          {/* features */}
          <div className="relative space-y-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition-colors hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-950/50">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-xs text-slate-400">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* footer */}
          <div className="relative flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Secure Login</span>
            <span className="text-slate-700">|</span>
            <span>User Based Access</span>
          </div>
        </div>

        {/* ================= RIGHT / FORM ================= */}
        <div className="p-8 md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Sales Panel
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 text-balance">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Login to continue to HRMS Sales Panel.
          </p>

          {/* mode switch */}
          <div className="mt-7 flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("password")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === "password"
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setMode("otp")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === "otp"
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              OTP Login
            </button>
          </div>

          {mode === "otp" && (
            <div className="mt-8">
              <OtpLogin
                portal="sales"
                variant="light"
                onSuccess={(data) => {
                  setAuth({ token: data.token, user: data.user });
                  navigate("/sales-reports");
                }}
              />
            </div>
          )}

          {mode === "password" && (
            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="sales-email"
                  className="text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>
                <div className="relative mt-2">
                  <Mail
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="sales-email"
                    type="email"
                    placeholder="user@gmail.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="sales-password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Password
                </label>
                <div className="relative mt-2">
                  <Lock
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="sales-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-300 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
                <ShieldCheck size={13} aria-hidden="true" />
                Protected by role-based access control
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
