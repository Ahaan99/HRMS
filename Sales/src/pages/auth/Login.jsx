import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import OtpLogin from "../../components/OtpLogin";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Side (Branding) */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-black to-gray-900 text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide">
              HRMS SALES
            </h1>
            <p className="text-white/70 mt-2">Sales Management System</p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white/10 border border-white/10">
              <p className="text-lg font-semibold">Sales Panel</p>
              <p className="text-sm text-white/70 mt-1">
                Manage Sales, Report, Due Follow-Up
              </p>
            </div>

            <p className="text-xs text-white/50">
              • Secure Login • User Based Access
            </p>
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="p-8 md:p-12">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome Back 👋
          </h2>
          <p className="text-gray-500 mt-2">
            Login to continue to HRMS Sales Panel.
          </p>

          <div className="flex bg-gray-100 rounded-xl p-1 mt-6">
            <button
              type="button"
              onClick={() => setMode("password")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === "password"
                  ? "bg-white text-gray-900 shadow"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setMode("otp")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === "otp"
                  ? "bg-white text-gray-900 shadow"
                  : "text-gray-500 hover:text-gray-800"
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
              <label className="text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                placeholder="user@gmail.com"
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

              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Button */}
            <button
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white bg-black
                         hover:bg-gray-900 transition disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
