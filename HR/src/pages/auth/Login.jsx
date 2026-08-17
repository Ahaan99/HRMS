import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useHrAuth } from "../../context/HrAuthContext";
import OtpLogin from "../../components/OtpLogin";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("password");
  const [showPass, setShowPass] = useState(false);

  const navigate = useNavigate();
  const { login } = useHrAuth();

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/hr/auth/login`,
        form,
      );
      login(res.data);
      toast.success("Login successful");
      navigate("/dashboard");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* ── Brand panel — desktop only ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between overflow-hidden bg-slate-900 p-12">
        {/* subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
            HR
          </div>
          <span className="text-white font-semibold tracking-wide text-lg">
            HR&nbsp;Portal
          </span>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight text-balance">
            People operations,
            <br />
            <span className="text-indigo-400">beautifully organized.</span>
          </h2>
          <p className="mt-4 max-w-md text-slate-400 leading-relaxed">
            Recruitment, AI interviews, attendance and payroll — everything
            your HR team needs in one secure workspace.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "AI-powered candidate screening",
              "Live interview proctoring",
              "One-click reports & analytics",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 6.5L4.8 8.8L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          Secured with role-based access &amp; encrypted sessions
        </p>
      </div>

      {/* ── Form panel ─────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* mobile brand mark */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
              HR
            </div>
            <span className="text-white font-semibold tracking-wide text-lg">
              HR&nbsp;Portal
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to continue to your dashboard
          </p>

          {/* mode switch */}
          <div
            className="mt-8 grid grid-cols-2 gap-1 rounded-xl bg-slate-900 p-1 ring-1 ring-slate-800"
            role="tablist"
            aria-label="Login method"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "password"}
              onClick={() => setMode("password")}
              className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
                mode === "password"
                  ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "otp"}
              onClick={() => setMode("otp")}
              className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
                mode === "otp"
                  ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              OTP Login
            </button>
          </div>

          <div className="mt-6">
            {mode === "otp" && (
              <OtpLogin
                portal="hr"
                variant="glass"
                onSuccess={(data) => {
                  login(data);
                  navigate("/dashboard");
                }}
              />
            )}

            {mode === "password" && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-1.5 block text-sm font-medium text-slate-300"
                  >
                    Email address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-1.5 block text-sm font-medium text-slate-300"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPass ? "text" : "password"}
                      name="password"
                      required
                      autoComplete="current-password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-12 text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      aria-label={showPass ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-colors hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    >
                      {showPass ? (
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden="true"
                        >
                          <path d="M3 3l18 18" strokeLinecap="round" />
                          <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c7 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A16.7 16.7 0 0 0 2 12s3 7 10 7a9.9 9.9 0 0 0 4.3-1" />
                          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden="true"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-500 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-colors hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-90"
                          d="M4 12a8 8 0 0 1 8-8"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      </svg>
                      Signing in…
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            Trouble signing in? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
