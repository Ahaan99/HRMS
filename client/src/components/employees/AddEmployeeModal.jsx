import { useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Toggle from "../ui/Toggle";
import SalaryInput from "../ui/SalaryInput";

export default function AddEmployeeModal({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
  departmentOptions,
  designationOptions,
  statusOptions,
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    try {
      await onSubmit(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title="Create Employee" onClose={onClose} width="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Employee Code"
            value={form.employeeCode}
            onChange={(e) =>
              setForm((p) => ({ ...p, employeeCode: e.target.value }))
            }
            placeholder="EMP-0001 (optional)"
          />

          <Select
            label="Status"
            value={form.statusId}
            onChange={(e) =>
              setForm((p) => ({ ...p, statusId: Number(e.target.value) }))
            }
            options={statusOptions}
          />
        </div>

        <Input
          label="Full Name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />

        <Input
          label="Email"
          value={form.email}
          type="email"
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        />

        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 10) value = value.slice(0, 10);

            setForm((p) => ({ ...p, phone: value }));
          }}
          placeholder="10 digit number"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Department"
            value={form.departmentId}
            onChange={(e) =>
              setForm((p) => ({ ...p, departmentId: Number(e.target.value) }))
            }
            options={departmentOptions}
          />

          <Select
            label="Designation"
            value={form.designationId}
            onChange={(e) =>
              setForm((p) => ({ ...p, designationId: Number(e.target.value) }))
            }
            options={designationOptions}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Joining Date"
            type="date"
            value={form.joiningDate}
            onChange={(e) =>
              setForm((p) => ({ ...p, joiningDate: e.target.value }))
            }
          />

          <SalaryInput
            label="Salary"
            value={form.salary}
            onChange={(val) => setForm((p) => ({ ...p, salary: val }))}
          />
        </div>

        <Toggle
          label="Active Employee"
          value={form.isActive}
          onChange={(val) => setForm((p) => ({ ...p, isActive: val }))}
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-gray-100"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className={`px-5 py-2 rounded-xl text-white ${
              loading ? "bg-gray-400" : "bg-black"
            }`}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
