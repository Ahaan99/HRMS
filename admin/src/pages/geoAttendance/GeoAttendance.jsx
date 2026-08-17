import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { MapPin, Trash2, Plus, LocateFixed, Navigation } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("hrms_admin_token")}`,
});

export default function GeoAttendance() {
  const [offices, setOffices] = useState([]);
  const [punches, setPunches] = useState([]);
  const [form, setForm] = useState({ name: "", latitude: "", longitude: "", radius_m: 200 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [o, p] = await Promise.all([
        axios.get(`${BASE_URL}/geo-attendance/offices`, { headers: authHeaders() }),
        axios.get(`${BASE_URL}/geo-attendance/punches`, { headers: authHeaders() }),
      ]);
      setOffices(o.data.offices || []);
      setPunches(p.data.punches || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation unsupported");
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7),
        })),
      () => toast.error("Could not get location"),
    );
  };

  const addOffice = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/geo-attendance/offices`, form, {
        headers: authHeaders(),
      });
      toast.success("Office added");
      setForm({ name: "", latitude: "", longitude: "", radius_m: 200 });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Add failed");
    }
  };

  const removeOffice = async (id) => {
    if (!window.confirm("Remove this office location?")) return;
    try {
      await axios.delete(`${BASE_URL}/geo-attendance/offices/${id}`, {
        headers: authHeaders(),
      });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Remove failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-black text-white">
          <Navigation size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Geo Attendance</h1>
          <p className="text-sm text-gray-500">
            Office geo-fences and GPS punch log
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offices */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Office Locations</h2>

          <form onSubmit={addOffice} className="space-y-3">
            <input
              required
              placeholder="Office name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            />
            <div className="flex gap-2">
              <input
                required
                placeholder="Latitude"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
              <input
                required
                placeholder="Longitude"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="button"
                onClick={useMyLocation}
                title="Use my current location"
                className="px-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <LocateFixed size={16} />
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="20"
                placeholder="Radius (m)"
                value={form.radius_m}
                onChange={(e) => setForm({ ...form, radius_m: e.target.value })}
                className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
              <span className="text-xs text-gray-400">fence radius in meters</span>
              <button className="ml-auto flex items-center gap-1.5 bg-black text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-900">
                <Plus size={15} /> Add
              </button>
            </div>
          </form>

          <div className="divide-y divide-gray-100">
            {offices.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <MapPin size={16} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{o.name}</p>
                    <p className="text-xs text-gray-400">
                      {o.latitude}, {o.longitude} &middot; {o.radius_m}m
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeOffice(o.id)}
                  className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {!loading && offices.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">
                No offices yet. Employees cannot geo-punch until one exists.
              </p>
            )}
          </div>
        </div>

        {/* Punch log */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-3">
            Today&apos;s GPS Punches
          </h2>
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-3">Employee</th>
                  <th className="py-2 pr-3">In</th>
                  <th className="py-2 pr-3">Out</th>
                  <th className="py-2 pr-3">Office</th>
                  <th className="py-2">Fence</th>
                </tr>
              </thead>
              <tbody>
                {punches.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-2 pr-3 font-semibold text-gray-800">
                      {p.employee_name}
                    </td>
                    <td className="py-2 pr-3">{p.check_in || "-"}</td>
                    <td className="py-2 pr-3">{p.check_out || "-"}</td>
                    <td className="py-2 pr-3">{p.office_name || "-"}</td>
                    <td className="py-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.geo_status === "INSIDE"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-500"
                        }`}
                      >
                        {p.geo_status || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && punches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">
                      No GPS punches today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
