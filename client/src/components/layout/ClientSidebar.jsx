import { NavLink } from "react-router-dom";
import { CLIENT_MENU } from "../../config/clientMenu.config";
import FeatureGuard from "../featureToggle/FeatureGuard";

export default function ClientSidebar({ open, setOpen }) {
  return (
    <>
      {/* Overlay (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
        fixed md:static z-50 top-0 left-0 h-full w-72 h-screen md:h-[calc(100vh-0px)]
        bg-gradient-to-b from-[#0b1220] to-[#0f172a] text-white flex flex-col
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
      >
        {/* Logo */}
        <div className="m-10 flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="logo"
            className="w-10 h-10 object-contain rounded-lg shadow"
          />

          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              ARDHNARISHWAR
            </h1>
            <p className="text-[10px] text-white/60">HRMS Client Pane</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {CLIENT_MENU.map((item) => {
            const Icon = item.icon;

            return (
              <FeatureGuard key={item.key} featureKey={item.key}>
                <NavLink
                  to={item.path}
                  onClick={() => setOpen(false)} // auto close on mobile
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                     ${
                       isActive
                         ? "bg-white/10 text-white"
                         : "text-white/70 hover:bg-white/5 hover:text-white"
                     }`
                  }
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              </FeatureGuard>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
