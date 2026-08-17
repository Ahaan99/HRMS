import React from "react";
import AssignedHRMultiSelect from "./AssignedHRMultiSelect";

const ClientProfileDrawer = ({
  profileOpen,
  handleCloseProfile,
  clientProfile,
  loadingProfile,
  onToggleFeature,
  togglingKey,
  onRefreshProfile,
}) => {
  if (!profileOpen) return null;

  const client = clientProfile?.client;

  return (
    <>
      {/* ===== GLASS OVERLAY ===== */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleCloseProfile}
      >
        {/* ===== GLASS MODAL ===== */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="
            w-full max-w-xl max-h-[90vh] overflow-hidden
            rounded-3xl
            bg-white/70 backdrop-blur-xl
            border border-white/40
            shadow-[0_25px_80px_rgba(0,0,0,0.25)]
            animate-[profilePop_.28s_ease-out]
            flex flex-col
          "
        >
          {/* ===== HEADER ===== */}
          <div className="relative px-8 pt-8 pb-6 overflow-hidden">
            {/* gradient glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200 via-purple-100 to-cyan-200 opacity-60" />

            {/* close */}
            <button
              onClick={handleCloseProfile}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-xl z-10"
            >
              ✕
            </button>

            {/* center identity */}
            <div className="relative z-10 flex flex-col items-center text-center mb-14">
              {/* <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-xl">
                {client?.company_name?.charAt(0)?.toUpperCase() || "C"}
              </div> */}

              <h2 className="mt-3 text-xl font-semibold text-gray-900">
                {client?.company_name || "—"}
              </h2>

              <p className="text-xs text-gray-500">
                Client Code: {client?.client_code || "—"}
              </p>

              <span
                className={`mt-3 px-4 py-1.5 rounded-full text-xs font-semibold ${
                  client?.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {client?.status}
              </span>
            </div>
          </div>

          {/* ===== BODY ===== */}
          <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6">
            {loadingProfile ? (
              <div className="text-center text-gray-500 py-10">
                Loading profile...
              </div>
            ) : client ? (
              <>
                {/* BASIC INFO */}
                <div className="grid grid-cols-2 gap-4">
                  <ProfileRow label="Client Name" value={client.client_name} />
                  <ProfileRow label="Email" value={client.email} />
                  <ProfileRow label="Phone" value={client.phone} />
                  <ProfileRow label="Website" value={client.website} />
                  <ProfileRow label="GST Number" value={client.gst_number} />
                  <ProfileRow
                    label="Business Address"
                    value={client.business_address}
                    full
                  />
                </div>

                {/* DESCRIPTION */}
                {client.company_description && (
                  <div className="pt-4 border-t border-white/40">
                    <p className="text-xs text-gray-500 mb-1">
                      Company Description
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {client.company_description}
                    </p>
                  </div>
                )}

                {/* ASSIGNED HR */}
                <div className="pt-4 border-t border-white/40">
                  <AssignedHRMultiSelect
                    clientId={client.id}
                    assignedHRs={clientProfile.assignedHRs}
                    onUpdate={onRefreshProfile}
                  />
                </div>

                {/* FEATURES */}
                <div className="pt-4 border-t border-white/40">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Enabled Features
                  </h3>

                  <div className="space-y-3">
                    {clientProfile.features?.map((f) => (
                      <div
                        key={f.feature_key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-700">
                          {f.feature_key.replaceAll("_", " ")}
                        </span>

                        <button
                          disabled={togglingKey === f.feature_key}
                          onClick={() =>
                            onToggleFeature(
                              client.id,
                              f.feature_key,
                              !f.is_enabled,
                            )
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                            f.is_enabled ? "bg-indigo-600" : "bg-gray-300"
                          } ${
                            togglingKey === f.feature_key
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              f.is_enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-10">
                No data found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== POP ANIMATION ===== */}
      <style>{`
        @keyframes profilePop {
          0% { transform: scale(.92) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

/* ===== ROW ===== */
const ProfileRow = ({ label, value, full }) => (
  <div className={full ? "col-span-2" : ""}>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold text-gray-900 break-words">{value || "-"}</p>
  </div>
);

export default ClientProfileDrawer;