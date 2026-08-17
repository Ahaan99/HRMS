import { Search } from "lucide-react";

export default function CallsFilterBar({
  search,
  setSearch,
  status,
  setStatus,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-5">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        {/* 🔍 Search */}
        <div className="relative w-full md:max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search customer / call id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200
                       focus:ring-2 focus:ring-black focus:border-black outline-none"
          />
        </div>

        {/* 📊 Status Filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200
                     focus:ring-2 focus:ring-black focus:border-black outline-none"
        >
          <option value="">All Status</option>
          <option value="hold">Hold</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>
  );
}