import { useState } from "react";
import { createLocation } from "../../services/locationService";

export default function AddLocationModal({ open, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name) return alert("Enter language");

    try {
      setLoading(true);
      await createLocation({ name });
      setName("");
      onSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-xl w-[90%] max-w-md p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Add Location</h2>

        <input
          type="text"
          placeholder="Enter location"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-orange-600 text-white rounded"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
