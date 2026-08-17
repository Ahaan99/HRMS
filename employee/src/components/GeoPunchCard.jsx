import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../api/axios";

export default function GeoPunchCard() {
  const [today, setToday] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/geo-attendance/today");
      setToday(data.today);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const punch = () => {
    if (!navigator.geolocation) {
      setMsg({ type: "error", text: "Geolocation not supported on this device" });
      return;
    }
    setBusy(true);
    setMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await axiosInstance.post("/geo-attendance/punch", {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setMsg({ type: "success", text: data.message });
          load();
        } catch (err) {
          setMsg({
            type: "error",
            text: err?.response?.data?.message || "Punch failed",
          });
        } finally {
          setBusy(false);
        }
      },
      (err) => {
        setBusy(false);
        setMsg({
          type: "error",
          text:
            err.code === 1
              ? "Location permission denied. Allow location access to punch."
              : "Could not get your location",
        });
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const checkedIn = !!today?.check_in;
  const checkedOut = !!today?.check_out;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Geo Attendance</h3>
        {today?.geo_status && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
            {today.geo_status}
          </span>
        )}
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div>
          <p className="text-gray-400 text-xs">Check-in</p>
          <p className="font-semibold text-gray-800">
            {today?.check_in || "--:--"}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Check-out</p>
          <p className="font-semibold text-gray-800">
            {today?.check_out || "--:--"}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Status</p>
          <p className="font-semibold text-gray-800">{today?.status || "-"}</p>
        </div>
      </div>

      {!checkedOut && (
        <button
          onClick={punch}
          disabled={busy}
          className={`w-full py-2.5 rounded-xl font-bold text-white transition disabled:opacity-60 ${
            checkedIn ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {busy
            ? "Getting location..."
            : checkedIn
              ? "Check Out (GPS)"
              : "Check In (GPS)"}
        </button>
      )}
      {checkedOut && (
        <p className="text-center text-sm text-gray-400 font-semibold py-1">
          Attendance complete for today
        </p>
      )}

      {msg && (
        <p
          className={`text-xs font-semibold ${
            msg.type === "success" ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
