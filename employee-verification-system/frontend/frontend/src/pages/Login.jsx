import { useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

import API from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (localStorage.getItem("token")) {
    return <Navigate to="/dashboard" replace />;
  }

  const login = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const res = await API.post("/login", formData);

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", "Admin");
      localStorage.setItem("email", email);

      toast.success("Login Successful");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.detail || "Login Failed");
      } else {
        toast.error("Backend not running on port 8000");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      login();
    }
  };

  return (
    <div className="login-container">
      <div className="login-shell">
        {/* ===== BRAND PANEL ===== */}
        <div className="login-brand">
          <div className="login-brand-top">
            <img
              src="/logo.png"
              alt="Ardhnarishwar logo"
              className="login-logo"
            />
            <div>
              <p className="login-brand-name">ARDHNARISHWAR</p>
              <p className="login-brand-sub">Employee Verification System</p>
            </div>
          </div>

          <div className="login-brand-body">
            <h1>
              Verify with <span>confidence.</span>
            </h1>
            <p>
              Manage verifications, documents and background checks from one
              secure portal.
            </p>

            <ul className="login-points">
              <li>Document &amp; identity verification</li>
              <li>Background check tracking</li>
              <li>Exportable audit reports</li>
            </ul>
          </div>

          <p className="login-brand-foot">
            Trusted internal tool &middot; Authorized staff only
          </p>
        </div>

        {/* ===== FORM PANEL ===== */}
        <div className="login-card">
          <h2>Welcome back</h2>
          <p className="login-sub">Sign in to your verification workspace</p>

          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyPress}
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyPress}
          />

          <button onClick={login} disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <div className="login-demo">
            Demo credentials
            <br />
            <strong>admin@test.com</strong> / <strong>admin123</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
