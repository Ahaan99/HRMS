import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("hrms_hr_Token");
  return token ? <Outlet /> : <Navigate to="/" replace />;
}
