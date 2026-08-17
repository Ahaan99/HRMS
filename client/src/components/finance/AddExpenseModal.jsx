import { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AddExpenseModal({ open, onClose, refresh }) {
  const token = localStorage.getItem("hrms_client_Token");

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category_id: "",
    amount: "",
    expense_date: "",
    description: "",
  });

  useEffect(() => {
    if (open) {
      axios
        .get(`${BASE_URL}/client/expenses/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setCategories(res.data.data));
    }
  }, [open]);

  const submit = async () => {
    await axios.post(`${BASE_URL}/client/expenses`, form, {
      headers: { Authorization: `Bearer ${token}` },
    });

    refresh();
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-5 rounded-xl w-[90%] max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ❌ CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-lg"
        >
          ✕
        </button>

        <h2 className="font-semibold mb-4">Add Expense</h2>

        <select
          className="border p-2 w-full mb-3"
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
        >
          <option>Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Amount"
          className="border p-2 w-full mb-3"
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />

        <input
          type="date"
          className="border p-2 w-full mb-3"
          onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
        />

        <textarea
          placeholder="Description"
          className="border p-2 w-full mb-3"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <button
          onClick={submit}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Save
        </button>
      </div>
    </div>
  );
}
