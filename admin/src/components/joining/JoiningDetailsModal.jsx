import { useEffect, useState } from "react";
import { getDepartments, getDesignations } from "../../services/masterService";

export default function JoiningDetailsModal({ data, onClose, BASE }) {
  if (!data) return null;

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const [d1, d2] = await Promise.all([
        getDepartments(),
        getDesignations(),
      ]);
      

      setDepartments(d1.data?.departments || []);
      setDesignations(d2.data?.designations || []);
    };

    fetchData();
  }, []);

  const deptName =
    departments.find((d) => Number(d.id) === Number(data.departmentId))
      ?.name || "-";

  const desigName =
    designations.find((d) => Number(d.id) === Number(data.designationId))
      ?.name || "-";

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-[900px] max-h-[90vh] overflow-y-auto rounded-xl p-6">

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-semibold">Joining Details</h2>
          <button onClick={onClose} className="text-red-500">
            Close
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">

          {/* IMAGE */}
          <img
            src={
              data.photo
                ? `${BASE}/profile/${data.photo}`
                : "https://via.placeholder.com/100"
            }
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border"
          />

          <img
            src={
              data.signature
                ? `${BASE}/signature/${data.signature}`
                : "https://via.placeholder.com/120x60"
            }
            alt="Signature"
            className="w-32 h-16 object-contain border rounded"
          />

          {/* BASIC INFO */}
          <div><b>Name:</b> {data.full_name || "-"}</div>
          <div><b>Father:</b> {data.father_name || "-"}</div>
          <div><b>DOB:</b>{" "}{data.dob  ? new Date(data.dob).toLocaleDateString("en-GB"): "-"}</div>
          <div><b>Gender:</b> {data.gender || "-"}</div>

          {/* CONTACT */}
          <div><b>Mobile:</b> {data.mobile || "-"}</div>
          <div><b>Email:</b> {data.email || "-"}</div>

          {/* ADDRESS */}
          <div className="col-span-2">
            <b>Address:</b> {data.present_address || "-"}
          </div>

          <div><b>City:</b> {data.present_city || "-"}</div>

          {/* 🔥 FIXED HR DATA */}
          <div><b>Department:</b> {deptName}</div>
          <div><b>Designation:</b> {desigName}</div>

          <div className="col-span-2">
            <b>Total Experience:</b>{" "}{data.total_experience?.trim() ? data.total_experience : "-"}
          </div>

        </div>
      </div>
    </div>
  );
}