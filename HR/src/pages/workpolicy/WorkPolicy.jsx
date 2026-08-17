import API from "../../api/axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import StatCard from "../../components/common/StatCard";
import HRNavbar from "../../components/hr/HRNavbar";
import PolicyFilters from "../../components/workpolicy/PolicyFilters";
import PolicyTable from "../../components/workpolicy/PolicyTable";
import AddPolicyModal from "../../components/workpolicy/AddPolicyModal";

export default function WorkPolicy() {
  const [stats, setStats] = useState({
    active: 0,
    draft: 0,
    underReview: 0,
    archived: 0,
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    department: "",
  });

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.status) params.append("status", filters.status);
      if (filters.department) params.append("department", filters.department);

      const res = await API.get(`/hr/work-policies?${params}`);

      const data = res?.data?.data || [];
      setRows(data);
      calculateStats(data);
    } catch (err) {
      toast.error(`Work policies fetch error: ${err}`);
        setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const active = data.filter((r) => r.status === "active").length;
    const draft = data.filter((r) => r.status === "draft").length;
    const underReview = data.filter((r) => r.status === "under_review").length;
    const archived = data.filter((r) => r.status === "archived").length;

    setStats({ active, draft, underReview, archived });
  };

  useEffect(() => {
    fetchPolicies();
  }, [filters]);

  const handleDelete = async (id) => {
  try {
    await API.delete(`/hr/work-policies/${id}`);
    toast.success("Policy deleted");
    fetchPolicies(); // refresh table
  } catch (err) {
    console.error("DELETE ERROR:", err);
    toast.error("Delete failed");
  }
};

  return (
    <div className="p-6 space-y-6">
      <HRNavbar />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Work Policy Sheet</h2>
        <div className="text-sm text-gray-500">
          Company work guidelines & policies
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Policies"
          value={stats.active}
          subText="Currently in effect"
          gradient="bg-gradient-to-tr from-emerald-500 to-teal-500"
          icon="📜"
        />

        <StatCard
          title="Draft"
          value={stats.draft}
          subText="Under preparation"
          gradient="bg-gradient-to-tr from-gray-500 to-slate-500"
          icon="📝"
        />

        <StatCard
          title="Under Review"
          value={stats.underReview}
          subText="Pending approval"
          gradient="bg-gradient-to-tr from-yellow-500 to-orange-500"
          icon="🔍"
        />

        <StatCard
          title="Archived"
          value={stats.archived}
          subText="Previous versions"
          gradient="bg-gradient-to-tr from-red-500 to-pink-500"
          icon="📦"
        />
      </div>

      <div className="flex justify-between items-center">
        <PolicyFilters filters={filters} onFilterChange={setFilters} />
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg transition"
        >
          + Add New Policy
        </button>
      </div>

      <PolicyTable rows={rows} loading={loading} onRefresh={fetchPolicies} onDelete={handleDelete}/>

      <AddPolicyModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={fetchPolicies}
      />
    </div>
  );
}


// const mockPolicyData = [
//   { id: 1, policyId: "POL001", title: "Remote Work Policy", category: "Work Arrangements", department: "All", status: "active", effectiveDate: "2026-01-01", lastUpdated: "2026-03-15", version: "2.1", description: "Guidelines for remote and hybrid work arrangements including eligibility, equipment, and communication protocols." },
//   { id: 2, policyId: "POL002", title: "Leave & Attendance Policy", category: "Leave Management", department: "All", status: "active", effectiveDate: "2025-06-01", lastUpdated: "2026-02-20", version: "3.0", description: "Comprehensive leave policy covering PTO, sick leave, parental leave, and attendance requirements." },
//   { id: 3, policyId: "POL003", title: "Performance Review Guidelines", category: "Performance", department: "All", status: "under_review", effectiveDate: "2026-04-01", lastUpdated: "2026-03-18", version: "4.0", description: "Quarterly and annual performance review process, rating criteria, and improvement plans." },
//   { id: 4, policyId: "POL004", title: "Code of Conduct", category: "Ethics", department: "All", status: "active", effectiveDate: "2024-01-01", lastUpdated: "2025-12-10", version: "2.0", description: "Professional conduct expectations, workplace behavior, and ethical guidelines." },
//   { id: 5, policyId: "POL005", title: "Project Deadline Policy", category: "Project Management", department: "Engineering", status: "draft", effectiveDate: "2026-05-01", lastUpdated: "2026-03-19", version: "1.0", description: "Project milestone tracking, deadline extensions, and escalation procedures for engineering teams." },
//   { id: 6, policyId: "POL006", title: "Sales Target Policy", category: "Sales", department: "Sales", status: "active", effectiveDate: "2026-01-01", lastUpdated: "2026-01-05", version: "2.0", description: "Quarterly sales targets, commission structure, and performance metrics for sales department." },
//   { id: 7, policyId: "POL007", title: "Marketing Budget Guidelines", category: "Marketing", department: "Marketing", status: "archived", effectiveDate: "2025-01-01", lastUpdated: "2025-12-31", version: "1.0", description: "Marketing campaign budget allocation and approval workflow (superseded by new policy)."},
//   { id: 8, policyId: "POL008", title: "Data Security Policy", category: "IT Security", department: "All", status: "active", effectiveDate: "2025-03-01", lastUpdated: "2026-02-28", version: "3.2", description: "Data handling, password requirements, and security protocols for all employees." },
//   { id: 9, policyId: "POL009", title: "No Meal Discussion with Management", category: "Workplace Ethics", department: "All", status: "active", effectiveDate: "2026-03-21", lastUpdated: "2026-03-21", version: "1.0", description: "Employees are prohibited from discussing work-related matters with management during meal breaks. Formal discussions should be scheduled through proper channels only.", rules: ["No work discussions during designated meal times", "Schedule meetings via official channels only", "Respect break schedules of all employees", "Use proper communication channels for work queries"], violations: ["Verbal warning for first offense", "Written warning for second offense", "Disciplinary action for repeated violations"] },
// ];
