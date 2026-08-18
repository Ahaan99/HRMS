export default function StatCard({ title, value, subText, icon, gradient }) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5
                 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Accent glow (subtle, top-right) */}
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-15 blur-2xl transition-opacity duration-200 group-hover:opacity-25 ${gradient}`}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-gray-500">
            {title}
          </p>
          <h2 className="mt-1.5 text-3xl font-extrabold tracking-tight text-gray-900">
            {value}
          </h2>
          {subText ? (
            <p className="mt-1.5 text-xs font-medium text-gray-400">
              {subText}
            </p>
          ) : null}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg text-white shadow-md ${gradient}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
