import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import AddWorkPolicyModal from "../../components/workPolicy/AddWorkPolicyModal";
import EditWorkPolicyModal from "../../components/workPolicy/EditWorkPolicyModal";

import {
  getWorkPolicies,
  createWorkPolicy,
  updateWorkPolicy,
  deleteWorkPolicy,
} from "../../services/workPolicyService";

import { useClientAuth } from "../../context/ClientAuthContext";

import { getDepartments } from "../../services/masterService";

export default function WorkPolicy() {
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [policies, setPolicies] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");

  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const { client } = useClientAuth();
  const isEmployee = client?.role === "CLIENT_EMPLOYEE";

  const [form, setForm] = useState({
    title: "",
    type: "attendance",
    departmentId: 0,
    description: "",
    isActive: true,
    isAutomated: true,
    autoDeduction: "",
    autoApply: true,
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const policyRes = await getWorkPolicies();
        setPolicies(policyRes.data?.data ?? []);
      } catch (err) {
        toast.error("Failed to load policies");
      }

      try {
        const deptRes = await getDepartments();
        setDepartments(deptRes.data?.data || []);
      } catch (err) {
        console.warn("Departments not allowed");
      }
    };

    fetchAll();
  }, []);

  const deptById = useMemo(() => {
    const obj = {};
    departments.forEach((d) => (obj[d.id] = d));
    return obj;
  }, [departments]);

  const departmentOptions = [
    { value: 0, label: "All Departments" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const deptFilterOptions = [
    { value: 0, label: "All Departments" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "attendance", label: "Attendance" },
    { value: "leave", label: "Leave" },
    { value: "behavior", label: "Behavior" },
    { value: "meal_management", label: "Meal Management" },
    { value: "general", label: "General" },
  ];

  const policyTypeOptions = [
    { value: "attendance", label: "Attendance" },
    { value: "leave", label: "Leave" },
    { value: "behavior", label: "Behavior" },
    { value: "meal_management", label: "Meal Management" },
    { value: "general", label: "General" },
  ];

  // const quickPolicyTemplates = [
  //   {
  //     title: "No Meal Discussion with Management",
  //     type: "meal_management",
  //     description:
  //       "Employees are strictly prohibited from discussing meal preferences, food choices, or dining arrangements during management meetings or official discussions. This policy ensures professional focus during work hours.",
  //     isAutomated: true,
  //     autoApply: true,
  //     autoDeduction:
  //       "Warning for first offense, 1 day salary deduction for second offense",
  //   },
  //   {
  //     title: "No Food/Drinks in Meeting Rooms",
  //     type: "meal_management",
  //     description:
  //       "Consumption of food and beverages is not allowed in meeting rooms during official discussions and presentations.",
  //     isAutomated: true,
  //     autoApply: true,
  //     autoDeduction: "Verbal warning, written notice for repeat",
  //   },
  //   {
  //     title: "Strict No-Talk Policy During Management Briefing",
  //     type: "meal_management",
  //     description:
  //       "Complete silence must be maintained during management briefings and official announcements. Only raise questions after the session ends.",
  //     isAutomated: true,
  //     autoApply: true,
  //     autoDeduction: "Formal warning for non-compliance",
  //   },
  // ];

  // const handleQuickAdd = async (template) => {
  //   try {
  //     const payload = {
  //       title: template.title,
  //       type: template.type,
  //       departmentId: 0,
  //       description: template.description,
  //       isActive: 1,
  //       isAutomated: 1,
  //       autoDeduction: template.autoDeduction,
  //       autoApply: 1,
  //     };

  //     const res = await createWorkPolicy(payload);
  //     const newPolicy = res.data.data;

  //     setPolicies((prev) => [newPolicy, ...prev]);
  //     toast.success(`"${template.title}" policy added`);
  //   } catch (err) {
  //     toast.error(err?.response?.data?.message || "Failed to add policy");
  //   }
  // };

  const filteredPolicies = (policies || []).filter((p) => {
    if (!p) return false;

    const q = (search || "").toLowerCase();

    const matchSearch =
      (p.title || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q);

    const matchDept =
      deptFilter === 0
        ? true
        : Number(p.departmentId || 0) === Number(deptFilter);

    const matchType = typeFilter === "all" ? true : p.type === typeFilter;

    return matchSearch && matchDept && matchType;
  });

  const resetForm = () => {
    setForm({
      title: "",
      type: "attendance",
      departmentId: 0,
      description: "",
      isActive: true,
      isAutomated: true,
      autoDeduction: "",
      autoApply: true,
    });
  };

  const openAddModal = () => {
    resetForm();
    setOpenAdd(true);
  };

  const openEditModal = (policy) => {
    setSelectedPolicy(policy);
    setForm({
      title: policy.title || "",
      type: policy.type || "attendance",
      departmentId: Number(policy.departmentId || 0),
      description: policy.description || "",
      isActive: policy.isActive === 1 || policy.isActive === true,
      isAutomated: policy.isAutomated === 1 || policy.isAutomated === true,
      autoDeduction: policy.autoDeduction || "",
      autoApply: policy.autoApply === 1 || policy.autoApply === true,
    });
    setOpenEdit(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        title: form.title,
        type: form.type,
        departmentId: Number(form.departmentId),
        description: form.description,
        isActive: form.isActive ? 1 : 0,
        isAutomated: form.isAutomated ? 1 : 0,
        autoDeduction: form.autoDeduction || null,
        autoApply: form.autoApply ? 1 : 0,
      };

      const res = await createWorkPolicy(payload);

      setPolicies((prev) => [res.data.data, ...prev]);

      toast.success("Work policy created");
      setOpenAdd(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create policy");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPolicy) return;

    try {
      const payload = {
        title: form.title,
        type: form.type,
        departmentId: Number(form.departmentId),
        description: form.description,
        isActive: form.isActive ? 1 : 0,
        isAutomated: form.isAutomated ? 1 : 0,
        autoDeduction: form.autoDeduction || null,
        autoApply: form.autoApply ? 1 : 0,
      };

      const res = await updateWorkPolicy(selectedPolicy.id, payload);

      const updatedPolicy = res.data.policy || res.data.data;

      setPolicies((prev) =>
        prev.map((x) => (x.id === updatedPolicy.id ? updatedPolicy : x)),
      );

      toast.success("Work policy updated");
      setOpenEdit(false);
      setSelectedPolicy(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update policy");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;

    try {
      await deleteWorkPolicy(id);

      setPolicies((prev) => prev.filter((x) => x.id !== Number(id)));

      toast.success("Work policy deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    }
  };

  const getTypeBadge = (type) => {
    const types = {
      attendance: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Attendance",
      },
      leave: { bg: "bg-purple-100", text: "text-purple-700", label: "Leave" },
      behavior: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        label: "Behavior",
      },
      meal_management: {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Meal Mgmt",
      },
      general: { bg: "bg-gray-100", text: "text-gray-700", label: "General" },
    };
    return types[type] || types.general;
  };

  const statCounts = useMemo(() => {
    const active = policies.filter(
      (p) => p.isActive === 1 || p.isActive === true,
    ).length;
    const inactive = policies.length - active;
    return { active, inactive, total: policies.length };
  }, [policies]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Policy</h1>
          <p className="text-gray-500 mt-1">
            Manage automated work policies for employees.
          </p>
        </div>

        <div className="flex gap-3">
          {!isEmployee && (
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-xl bg-black text-white font-semibold hover:bg-gray-900 transition"
            >
              + Add Policy
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
          <p className="text-sm text-gray-500 font-medium">Total Policies</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {statCounts.total}
          </p>
        </div>
        <div className="bg-green-50 rounded-2xl shadow border border-green-200 p-4">
          <p className="text-sm text-green-600 font-medium">Active</p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {statCounts.active}
          </p>
        </div>
        <div className="bg-red-50 rounded-2xl shadow border border-red-200 p-4">
          <p className="text-sm text-red-600 font-medium">Inactive</p>
          <p className="text-2xl font-bold text-red-700 mt-1">
            {statCounts.inactive}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5 border border-gray-100 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or description..."
          className="w-full xl:w-[420px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
        />

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(Number(e.target.value))}
          className="w-full xl:w-[200px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
        >
          {deptFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full xl:w-[180px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-gray-900">
            Total Policies: {filteredPolicies.length}
          </p>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="w-full overflow-auto max-h-[60vh]">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-5 py-4 font-semibold">Title</th>
                  <th className="text-left px-5 py-4 font-semibold">Type</th>
                  <th className="text-left px-5 py-4 font-semibold">
                    Department
                  </th>
                  <th className="text-left px-5 py-4 font-semibold">
                    Automated
                  </th>
                  <th className="text-left px-5 py-4 font-semibold">
                    Auto Apply
                  </th>
                  <th className="text-left px-5 py-4 font-semibold">Status</th>
                  {!isEmployee && (
                    <th className="text-right px-5 py-4 font-semibold">
                      Action
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredPolicies.map((p) => {
                  const deptName = deptById[p.departmentId]?.name || "All";
                  const badge = getTypeBadge(p.type);
                  const isActive = p.isActive === 1 || p.isActive === true;

                  return (
                    <tr
                      key={p.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {p.title}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                        {p.departmentId ? deptName : "All"}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            p.isAutomated === 1 || p.isAutomated === true
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {p.isAutomated === 1 || p.isAutomated === true
                            ? "Auto"
                            : "Manual"}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            p.autoApply === 1 || p.autoApply === true
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {p.autoApply === 1 || p.autoApply === true
                            ? "Yes"
                            : "No"}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      {!isEmployee && (
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEditModal(p)}
                            className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(p.id)}
                            className="ml-2 px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-semibold transition"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {filteredPolicies.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      No policies found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddWorkPolicyModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        form={form}
        setForm={setForm}
        onSubmit={handleCreate}
        departmentOptions={departmentOptions}
        policyTypeOptions={policyTypeOptions}
      />

      {/* {quickAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Quick Add Meal Policy
              </h2>
              <button
                onClick={() => setQuickAddModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {quickPolicyTemplates.map((template, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-xl p-4 hover:border-red-300 hover:bg-red-50 transition cursor-pointer"
                  onClick={() => {
                    handleQuickAdd(template);
                    setQuickAddModal(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-bold text-lg">M</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {template.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {template.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          Auto-Enabled
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          Meal Management
                        </span>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )} */}

      <EditWorkPolicyModal
        open={openEdit}
        policy={selectedPolicy}
        onClose={() => {
          setOpenEdit(false);
          setSelectedPolicy(null);
        }}
        form={form}
        setForm={setForm}
        onSubmit={handleUpdate}
        departmentOptions={departmentOptions}
        policyTypeOptions={policyTypeOptions}
      />
    </div>
  );
}
