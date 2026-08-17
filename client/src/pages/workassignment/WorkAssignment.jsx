import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import API from "../../services/api.js";

import StatCard from "../../components/common/StatCard";
import WorkAssignmentFilters from "../../components/workassignment/WorkAssignmentFilters";
import WorkAssignmentTable from "../../components/workassignment/WorkAssignmentTable";
import AssignWorkModal from "../../components/workassignment/AssignWorkModal";
import { useClientAuth } from "../../context/ClientAuthContext";

export default function WorkAssignment() {
  const { client } = useClientAuth();
  const isEmployee = client?.role === "CLIENT_EMPLOYEE";
  const [stats, setStats] = useState({
    assigned: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    department: "",
  });

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v),
      );

      const query = new URLSearchParams(cleanFilters).toString();

      const res = await API.get(`/client/work-assignment?${query}`);
      console.log(res);

      const data = res.data.data || [];

      setAssignments(data);
      calculateStats(data);
    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const assigned = data.filter((r) => r.status === "assigned").length;
    const inProgress = data.filter((r) => r.status === "in_progress").length;
    const completed = data.filter((r) => r.status === "completed").length;
    const overdue = data.filter((r) => r.status === "overdue").length;

    setStats({ assigned, inProgress, completed, overdue });
  };

  useEffect(() => {
    fetchAssignments();
  }, [filters]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Automated Work Assignment
        </h2>
        <div className="text-sm text-gray-500">
          Auto-assign & track employee tasks
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Assigned"
          value={stats.assigned}
          subText="New tasks assigned"
          gradient="bg-gradient-to-tr from-blue-500 to-cyan-500"
          icon="📋"
        />

        <StatCard
          title="In Progress"
          value={stats.inProgress}
          subText="Tasks being worked on"
          gradient="bg-gradient-to-tr from-yellow-500 to-orange-500"
          icon="⚙️"
        />

        <StatCard
          title="Completed"
          value={stats.completed}
          subText="Tasks finished"
          gradient="bg-gradient-to-tr from-emerald-500 to-teal-500"
          icon="✅"
        />

        <StatCard
          title="Overdue"
          value={stats.overdue}
          subText="Past deadline"
          gradient="bg-gradient-to-tr from-red-500 to-pink-500"
          icon="⏰"
        />
      </div>

      <div className="flex justify-between items-center">
        <WorkAssignmentFilters
          filters={filters}
          onFilterChange={setFilters}
          onChange={setFilters}
        />
        {!isEmployee && (
          <button
            onClick={() => setShowAssign(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg transition"
          >
            + Assign New Task
          </button>
        )}
      </div>

      <WorkAssignmentTable
        rows={assignments}
        loading={loading}
        onRefresh={fetchAssignments}
      />

      <AssignWorkModal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        onSuccess={fetchAssignments}
      />
    </div>
  );
}
