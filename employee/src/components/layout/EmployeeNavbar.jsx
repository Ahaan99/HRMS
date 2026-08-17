import { useNavigate } from "react-router-dom";
import { useEmployeeAuth } from "../../context/EmployeeAuthContext";

export default function EmployeeNavbar() {
  const navigate = useNavigate();

  const { employee, logout } = useEmployeeAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="w-full px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4">
      <div
        className="
        flex flex-col sm:flex-row
        sm:items-center
        sm:justify-between
        gap-3
        bg-white/70
        backdrop-blur-xl
        border border-white/40
        shadow-lg
        rounded-2xl
        px-6 py-3
      "
      >
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="logo"
            className="w-10 h-10 rounded-lg object-cover"
          />

          <div>
            <h1 className="text-lg font-bold text-gray-800">
              Employee Portal
            </h1>

            <p className="text-xs text-gray-500">
              Universal Employee Workspace
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="
            px-4 py-2
            bg-indigo-600
            text-white
            rounded-lg
            hover:bg-indigo-700
            shadow-lg
          "
          >
            Dashboard
          </button>

          <button
            onClick={handleLogout}
            className="
            px-4 py-2
            text-sm font-medium
            rounded-xl
            bg-gradient-to-r
            from-red-500
            to-pink-500
            text-white
            shadow-md
            hover:scale-105
            transition
          "
          >
            Logout
          </button>

          {/* USER */}
          <div
            className="
            flex items-center gap-3
            bg-white/60
            px-4 py-2
            rounded-xl
            shadow-sm
            border border-white/40
          "
          >
            <div
              className="
              w-10 h-10 rounded-full
              bg-gradient-to-tr
              from-indigo-500
              to-purple-500
              flex items-center justify-center
              text-white font-semibold
            "
            >
              {employee?.name?.charAt(0)}
            </div>

            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-800">
                {employee?.name}
              </p>

              <p className="text-xs text-gray-500">
                {employee?.department}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}