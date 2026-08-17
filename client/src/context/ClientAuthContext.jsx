import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const ClientAuthContext = createContext();

export const ClientAuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("hrms_client_Token");
    const client = localStorage.getItem("hrms_client_user");
    const features = localStorage.getItem("hrms_client_features");

    return {
      token: token || null,
      client: client ? JSON.parse(client) : null,
      enabledFeatures: features ? JSON.parse(features) : [],
    };
  });

  // 🔥 keep localStorage in sync
  useEffect(() => {
    if (auth?.token)
      localStorage.setItem("hrms_client_Token", auth.token);
    else localStorage.removeItem("hrms_client_Token");

    if (auth?.client)
      localStorage.setItem(
        "hrms_client_user",
        JSON.stringify(auth.client)
      );
    else localStorage.removeItem("hrms_client_user");

    if (auth?.enabledFeatures)
      localStorage.setItem(
        "hrms_client_features",
        JSON.stringify(auth.enabledFeatures)
      );
    else localStorage.removeItem("hrms_client_features");
  }, [auth]);

  // Refresh enabled features from server (Master Control live sync)
  useEffect(() => {
    if (!auth?.token || !auth?.client) return;
    let cancelled = false;
    API.get("/client/auth/features")
      .then(({ data }) => {
        if (cancelled || !data?.success) return;
        setAuth((prev) => {
          const next = data.enabledFeatures || [];
          const same =
            JSON.stringify([...(prev.enabledFeatures || [])].sort()) ===
            JSON.stringify([...next].sort());
          return same ? prev : { ...prev, enabledFeatures: next };
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token]);

const login = (data) => {
  setAuth({
    token: data.token,
    // ✅ supports both client and employee
    client: data.client || data.user || null,
    enabledFeatures: data.enabledFeatures || [],
  });
};

  const logout = () => {
    setAuth({
      token: null,
      client: null,
      enabledFeatures: [],
    });
  };

  return (
    <ClientAuthContext.Provider
      value={{
        token: auth.token,
        client: auth.client,
        enabledFeatures: auth.enabledFeatures,
        login,
        logout,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
};

export const useClientAuth = () => useContext(ClientAuthContext);
