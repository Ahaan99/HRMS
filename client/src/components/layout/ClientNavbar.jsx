import { LogOut, Menu } from "lucide-react";
import { useClientAuth } from "../../context/ClientAuthContext";

export default function ClientNavbar({ setOpen }) {
  const { client, logout } = useClientAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* 🔥 MOBILE LOGO */}
        <img
          src="/logo.jpeg"
          alt="logo"
          className="w-8 h-8 object-contain md:hidden"
        />

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(true)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>

        {/* TEXT */}
        <div>
          <h2 className="text-sm md:text-lg font-semibold text-gray-800">
            Welcome back 👋
          </h2>
          <p className="text-xs text-gray-500">
            {client?.company_name || "Client Portal"}
          </p>
        </div>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs md:text-sm font-medium hover:opacity-90 transition"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </header>
  );
}
