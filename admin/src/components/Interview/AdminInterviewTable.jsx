import { useState, useEffect } from "react";
import { getJobPositions } from "../../services/jobPositionService";
import AddJobPositionModal from "../../components/Interview/AddJobPositionModal";
import AddLanguageModal from "../../components/Interview/AddLanguageModal";
import AddLocationModal from "../../components/Interview/AddLocationModal";
import {
  updateJoinedStatus,
  createInterview,
  deleteInterview,
} from "../../services/interviewService";

export default function AdminInterviewTable({
  rows = [],
  table,
  loading,
  hideButtons = false,
}) {
  const [openModal, setOpenModal] = useState(false);
  const [openLangModal, setOpenLangModal] = useState(false);
  const [openLocModal, setOpenLocModal] = useState(false);

  const [jobProfiles, setJobProfiles] = useState([]);
  const [localRows, setLocalRows] = useState(rows);

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const callStatusMap = {
    1: "NOT PICKED",
    2: "SWITCHED OFF",
    3: "CALL BACK",
    4: "INTERESTED",
    5: "NOT INTERESTED",
    6: "INTERVIEW SCHEDULED",
    7: "SELECTED",
    8: "REJECTED",
    9: "NOT REACHABLE",
  };

  useEffect(() => {
    const fetchJobProfiles = async () => {
      try {
        const res = await getJobPositions();
        setJobProfiles(res.data?.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchJobProfiles();
  }, []);


const handleJoinedChange = async (id, joined, joining_date, selection_date) => {
  try {
    await updateJoinedStatus(id, joined, joining_date, selection_date);

    // 🔥 ADD THIS (UI update)
    setLocalRows((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, joined }
          : item
      )
    );
  } catch (err) {
    console.error(err);
  }
};

  // ✅ DELETE (NO PAGE RELOAD)
  const handleDelete = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this interview?");
    if (!ok) return;

    try {
      await deleteInterview(id);

      // remove from UI instantly
      setLocalRows((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading) {
    return <div className="p-10 text-center font-semibold">Loading...</div>;
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-sm">

      {/* HEADER */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">{table}</h2>

        {!hideButtons && (
          <div className="flex gap-2">
            <button
              onClick={() => setOpenModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
            >
              + Schedule Interview
            </button>

            <button
              onClick={() => setOpenLangModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
            >
              + Language
            </button>

            <button
              onClick={() => setOpenLocModal(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm"
            >
              + Location
            </button>
          </div>
        )}
      </div>

      {/* TABLE */}
     <div className="overflow-auto max-h-[60vh] overflow-y-auto max-h-[60vh] w-full">
  <table className="w-full min-w-[1400px] text-sm whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="p-3 text-left">Candidate</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Job</th>
              {/* <th className="p-3 text-left">Language</th> */}
              <th className="p-3 text-left">Exp</th>
              <th className="p-3 text-left">CTC</th>
              <th className="p-3 text-left">Notice</th>
              <th className="p-3 text-left">HR</th>
              {/* <th className="p-3 text-left">Company </th> */}
              <th className="p-3 text-left">Call Status</th>
              <th className="p-3 text-left">Interview Date</th>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Joining Date</th>
              {/* <th className="p-3 text-left">CV</th> */}
              {/* <th className="p-3 text-left">Client Status</th> */}
              {/* <th className="p-3 text-left">Joined</th> */}
              <th className="p-3 text-left">Delete</th>
            </tr>
          </thead>

          <tbody>
            {localRows.map((item) => (
              <tr key={item.id} className="border-t hover:bg-gray-50">

                <td className="p-3">{item.candidate_name}</td>
                <td className="p-3">{item.candidate_phone}</td>
                <td className="p-3">{item.job_profile || "-"}</td>
                {/* <td className="p-3">{item.language_name || "-"}</td> */}
                <td className="p-3">{item.experience || "-"}</td>

                <td className="p-3">
                  {item.current_ctc || "-"} → {item.expected_ctc || "-"}
                </td>

                <td className="p-3">{item.notice_period || "-"}</td>
                <td className="p-3">{item.hr_name || "-"}</td>
                {/* <td className="p-3">{item.company_name || "-"}</td> */}

                <td className="p-3">
                  {callStatusMap[item.call_status_id] || "-"}
                </td>

                <td className="p-3">
                  {item.interview_date
                    ? new Date(item.interview_date).toLocaleDateString()
                    : "-"}
                </td>

                <td className="p-3">{item.interview_time || "-"}</td>

                <td className="p-3">
                  <input
                    type="date"
                    value={item.selection_date?.split("T")[0] || ""}
                    onChange={(e) =>
                      handleJoinedChange(
                        item.id,
                        item.joined || "No",
                        "",
                        e.target.value
                      )
                    }
                    className="border px-2 py-1 rounded"
                  />
                </td>

                {/* <td className="p-3">
                  {item.cv_file ? (
                    <a
                      href={`${import.meta.env.VITE_API_BASE_URL}/uploads/cv/${item.cv_file}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600"
                    >
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </td> */}

                {/* <td className="p-3">{item.client_status || "pending"}</td> */}

                {/* <td className="p-3">
                  <select
                    value={item.joined ?? "No"}
                    onChange={(e) =>
                      handleJoinedChange(
                        item.id,
                        e.target.value,
                        "",
                        item.selection_date?.split("T")[0] || ""
                      )
                    }
                    className="border px-2 py-1 rounded"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </td> */}

                {/* DELETE BUTTON */}
                <td className="p-3">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>

              </tr>
            ))}

            {!localRows.length && (
              <tr>
                <td colSpan="17" className="text-center p-6 text-gray-500">
                  No interviews found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODALS */}
      <AddJobPositionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={createInterview}
        jobProfiles={jobProfiles}
      />

      <AddLanguageModal
        open={openLangModal}
        onClose={() => setOpenLangModal(false)}
      />

      <AddLocationModal
        open={openLocModal}
        onClose={() => setOpenLocModal(false)}
      />
    </div>
  );
}