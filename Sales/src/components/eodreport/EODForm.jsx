import { useState } from "react";
import toast from "react-hot-toast";
import API from "../../api/axios";

export default function EODForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    tasksCompleted: "",
    tasksInProgress: "",
    hoursWorked: "",
    summary: "",
  });

  const handleChange = (key, value) => {
    // allow only numbers for numeric fields
    if (
      ["tasksCompleted", "tasksInProgress", "hoursWorked"].includes(key)
    ) {
      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setForm((prev) => ({ ...prev, [key]: value }));
      }
    } else {
      setForm((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!form.tasksCompleted || !form.hoursWorked) {
      return toast.error("Please fill required fields");
    }

    try {
      await API.post("/sales/eod-reports", {
        ...form,
        tasksCompleted: Number(form.tasksCompleted),
        tasksInProgress: Number(form.tasksInProgress || 0),
        hoursWorked: Number(form.hoursWorked),
      });

      toast.success("EOD submitted");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to submit");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl">

        <h2 className="text-xl font-semibold text-gray-800">
          Create EOD Report
        </h2>

        {/* Tasks Completed */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Tasks Completed *
          </label>
          <input
            type="number"
            min="0"
            placeholder="Enter number of completed tasks"
            value={form.tasksCompleted}
            onChange={(e) =>
              handleChange("tasksCompleted", e.target.value)
            }
            className="w-full mt-1 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Tasks In Progress */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Tasks In Progress
          </label>
          <input
            type="number"
            min="0"
            placeholder="Enter ongoing tasks"
            value={form.tasksInProgress}
            onChange={(e) =>
              handleChange("tasksInProgress", e.target.value)
            }
            className="w-full mt-1 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Hours Worked */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Hours Worked *
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="Enter total hours (e.g. 8.5)"
            value={form.hoursWorked}
            onChange={(e) =>
              handleChange("hoursWorked", e.target.value)
            }
            className="w-full mt-1 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Summary */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Work Summary
          </label>
          <textarea
            rows="3"
            placeholder="Describe what you worked on today..."
            value={form.summary}
            onChange={(e) =>
              handleChange("summary", e.target.value)
            }
            className="w-full mt-1 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow"
          >
            Submit EOD
          </button>
        </div>
      </div>
    </div>
  );
}