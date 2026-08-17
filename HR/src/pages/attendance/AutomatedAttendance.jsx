import axios from "axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import HRNavbar from "../../components/hr/HRNavbar";
import AttendanceTable from "../../components/attendance/AttendanceTable";
import AttendanceFilters from "../../components/attendance/AttendanceFilters";
import LocationCapture from "../../components/attendance/LocationCapture";
import OfficeLocation from "../../components/attendance/OfficeLocation";
import ShiftTimings from "../../components/attendance/ShiftTimings";
import {
  Users,
  Clock,
  UserCheck,
  UserX,
  AlarmClock,
  Palmtree,
} from "lucide-react";

function StatTile({ title, value, subText, icon: Icon, accent, bar }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`absolute inset-x-0 top-0 h-1 ${bar}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subText}</p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${accent}`}
        >
          <Icon size={20} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

export default function AutomatedAttendance() {
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    department: "",
    status: "",
  });

  const [activeTab, setActiveTab] = useState("attendance");
  const [officeLocations, setOfficeLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [shiftTimings, setShiftTimings] = useState([]);

  const token = localStorage.getItem("hrms_hr_Token");
  const BASE = import.meta.env.VITE_API_BASE_URL;

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (filters.date) params.append("date", filters.date);
      if (filters.status) params.append("status", filters.status);
      if (filters.department) params.append("department", filters.department);

      const res = await axios.get(`${BASE}/hr/attendance?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res?.data?.data || [];
      setRows(data);

      const present = data.filter((r) => r.status === "present").length;
      const absent = data.filter((r) => r.status === "absent").length;
      const late = data.filter((r) => r.status === "late").length;
      const onLeave = data.filter((r) => r.status === "on_leave").length;

      setStats({ present, absent, late, onLeave });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Fetch failed");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const saveOfficeLocations = async (locations) => {
    try {
      await axios.post(`${BASE}/hr/office-locations`, locations, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      toast.error("Failed to save office locations");
    }
  };

  const handleLocationVerified = (locationData) => {
    setCurrentLocation(locationData);
  };

  const fetchShiftTimings = async () => {
    try {
      const res = await axios.get(`${BASE}/hr/attendance/shift-timings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShiftTimings(res?.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch shifts");
      setShiftTimings([]);
    }
  };

  const saveShiftTimings = async (shifts) => {
    try {
      await axios.post(`${BASE}/hr/attendance/shift-timings`, shifts, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Shift updated");
      fetchShiftTimings();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to save shift timings",
      );
      throw err;
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchShiftTimings();
  }, [filters]);

  const tabs = [
    { id: "attendance", label: "Attendance", icon: Users },
    { id: "shifts", label: "Shift Timings", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-6">
      <HRNavbar />

      <div className="mx-auto mt-6 max-w-[1600px] space-y-6">
        {/* ── HERO BAND ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-9 md:px-12">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #818cf8 1px, transparent 1px), linear-gradient(to bottom, #818cf8 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
                Workforce
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl text-balance">
                Automated Attendance
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                Daily presence, late arrivals, and shift schedules — tracked
                automatically for the whole team.
              </p>
            </div>
            <p className="shrink-0 text-xs text-slate-500">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>

        {/* ── TABS ──────────────────────────────────────────── */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <tab.icon size={15} aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "attendance" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                title="Present"
                value={stats.present}
                subText="Employees present today"
                icon={UserCheck}
                accent="bg-emerald-50 text-emerald-600 ring-emerald-100"
                bar="bg-emerald-500"
              />
              <StatTile
                title="Absent"
                value={stats.absent}
                subText="Employees absent today"
                icon={UserX}
                accent="bg-rose-50 text-rose-600 ring-rose-100"
                bar="bg-rose-500"
              />
              <StatTile
                title="Late Arrivals"
                value={stats.late}
                subText="Arrived after 10:00 AM"
                icon={AlarmClock}
                accent="bg-amber-50 text-amber-600 ring-amber-100"
                bar="bg-amber-500"
              />
              <StatTile
                title="On Leave"
                value={stats.onLeave}
                subText="Approved leave today"
                icon={Palmtree}
                accent="bg-sky-50 text-sky-600 ring-sky-100"
                bar="bg-sky-500"
              />
            </div>

            <AttendanceFilters filters={filters} onFilterChange={setFilters} />
            <AttendanceTable
              rows={rows}
              loading={loading}
              onRefresh={fetchAttendance}
              shifts={shiftTimings}
            />
          </>
        )}

        {activeTab === "check-in" && (
          <div className="max-w-2xl">
            <div className="grid gap-6">
              <LocationCapture
                onLocationVerified={handleLocationVerified}
                officeLocations={officeLocations}
              />

              {currentLocation && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">
                    Today&apos;s Check-In
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Status</p>
                      <p
                        className={`font-medium ${
                          currentLocation.verified
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {currentLocation.verified ? "Verified" : "Not Verified"}
                      </p>
                    </div>
                    {currentLocation.office && (
                      <>
                        <div>
                          <p className="text-sm text-slate-500">Office</p>
                          <p className="font-medium text-slate-800">
                            {currentLocation.office.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Distance</p>
                          <p className="font-medium text-slate-800">
                            {currentLocation.distance?.toFixed(2)} km
                          </p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-sm text-slate-500">Coordinates</p>
                      <p className="font-medium text-slate-800">
                        {currentLocation.latitude?.toFixed(6)},{" "}
                        {currentLocation.longitude?.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "locations" && (
          <div className="max-w-3xl">
            <OfficeLocation
              onSave={saveOfficeLocations}
              initialLocations={officeLocations}
            />
          </div>
        )}

        {activeTab === "shifts" && (
          <div className="max-w-3xl">
            <ShiftTimings
              onSave={saveShiftTimings}
              initialShifts={shiftTimings}
            />
          </div>
        )}
      </div>
    </div>
  );
}
