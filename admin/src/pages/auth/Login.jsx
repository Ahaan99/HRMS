import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState("admin");
  const [otpStep, setOtpStep] = useState(null); // { admin_id, dev_otp }
  const [otp, setOtp] = useState("");

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Side (Branding) */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-black to-gray-900 text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide">HRMS</h1>
            <p className="text-white/70 mt-2">
              Human Resource Management System
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white/10 border border-white/10">
              <p className="text-lg font-semibold">Admin Panel</p>
              <p className="text-sm text-white/70 mt-1">
                Manage HR, Employees, Departments & Settings.
              </p>
            </div>

            <p className="text-xs text-white/50">
              Secure Login • Role Based Access • Scalable System
            </p>
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="p-8 md:p-12">
          {/* Toggle Admin / Manager / TL */}
          <div className="flex bg-gray-100 rounded-xl p-1 mt-6 mb-4">
            <button
              type="button"
              onClick={() => setLoginType("admin")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                loginType === "admin" ? "bg-black text-white" : "text-gray-600"
              }`}
            >
              Admin
            </button>

            <button
              type="button"
              onClick={() => setLoginType("manager")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                loginType === "manager"
                  ? "bg-black text-white"
                  : "text-gray-600"
              }`}
            >
              Manager
            </button>

            <button
              type="button"
              onClick={() => setLoginType("tl")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                loginType === "tl" ? "bg-black text-white" : "text-gray-600"
              }`}
            >
              TL
            </button>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome Back 👋
          </h2>
          <p className="text-gray-500 mt-2">
            Login to continue to HRMS Admin Panel.
          </p>

          {otpStep ? (
            <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  One-Time Password
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="6-digit OTP"
                  className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none tracking-[0.4em] text-center text-lg font-bold
                             focus:ring-2 focus:ring-black focus:border-black transition"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
                <p className="text-xs text-gray-400 mt-2">
                  OTP expires in 5 minutes.
                </p>
                {otpStep.dev_otp && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-700">
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
                className="w-full py-3 rounded-xl font-bold text-white bg-black
                           hover:bg-gray-900 transition disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={() => setOtpStep(null)}
                className="w-full py-2 text-sm font-semibold text-gray-500 hover:text-gray-800"
              >
                Back to login
              </button>
            </form>
          ) : (
          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            {/* Email */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                placeholder="admin@hrms.com"
                className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none
                           focus:ring-2 focus:ring-black focus:border-black transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none
                           focus:ring-2 focus:ring-black focus:border-black transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Button */}
            <button
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white bg-black
                         hover:bg-gray-900 transition disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Demo Credentials */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <p className="text-sm font-semibold text-gray-800">
                Demo Credentials:
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Email: <span className="font-semibold">admin@hrms.com</span>
              </p>
              <p className="text-sm text-gray-600">
                Password: <span className="font-semibold">123</span>
              </p>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
