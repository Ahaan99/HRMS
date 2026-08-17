import { Outlet } from "react-router-dom";
import { useState } from "react";
import ClientSidebar from "./ClientSidebar";
import ClientNavbar from "./ClientNavbar";

export default function ClientLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Sidebar */}
      <ClientSidebar open={open} setOpen={setOpen} />

      <div className="flex-1 flex flex-col">
        <ClientNavbar setOpen={setOpen} />

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
