export default function Modal({
  open,
  title,
  onClose,
  children,
  width = "max-w-xl",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />

      {/* Modal Box */}
      <div
        className={`relative w-full ${width} bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden`}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 transition font-bold"
          >
            ✕
          </button>
        </div>

        {/* ✅ Body Scroll */}
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
