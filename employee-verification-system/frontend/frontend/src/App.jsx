import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import AuditLogs from "./pages/AuditLogs";

import BackgroundVerification from "./pages/BackgroundVerification";
import IdentityVerification from "./pages/IdentityVerification";
import InternationalVerification from "./pages/InternationalVerification";
import EmploymentHistory from "./pages/EmploymentHistory";
import VerificationStatus from "./pages/VerificationStatus";

import ProtectedRoute from "./components/ProtectedRoute";

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={guard(<Dashboard />)} />

        <Route path="/employees" element={guard(<Employees />)} />

        <Route path="/documents" element={guard(<Documents />)} />

        <Route path="/reports" element={guard(<Reports />)} />

        <Route path="/profile" element={guard(<Profile />)} />

        <Route path="/audit-logs" element={guard(<AuditLogs />)} />

        <Route
          path="/background-verification"
          element={guard(<BackgroundVerification />)}
        />

        <Route
          path="/identity-verification"
          element={guard(<IdentityVerification />)}
        />

        <Route
          path="/international-verification"
          element={guard(<InternationalVerification />)}
        />

        <Route
          path="/employment-history"
          element={guard(<EmploymentHistory />)}
        />

        <Route
          path="/verification-status"
          element={guard(<VerificationStatus />)}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
