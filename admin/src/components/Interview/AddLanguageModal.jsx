import { useState } from "react";
import { createLanguage } from "../../services/languageService";

export default function AddLanguageModal({ open, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name) return alert("Enter language");

    try {
      setLoading(true);
      await createLanguage({ name });
      setName("");
      onSuccess?.();
      onClose();
    } catch(err){
      console.log(err)
    }
    finally {
      setLoading(false);
    }
  };

return (
  <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto">
    <div className="bg-white rounded-xl w-[90%] max-w-md p-6 shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Add Language</h2>

      <input
        type="text"
        placeholder="Enter language"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  </div>
);
}