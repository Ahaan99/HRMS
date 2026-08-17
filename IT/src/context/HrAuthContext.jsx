import { createContext, useContext, useState } from "react";

const HrAuthContext = createContext();

export const HrAuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(() => {
    const stored = localStorage.getItem("hrms_hr_User");
    return stored ? JSON.parse(stored) : null;
  });
  const login = (data) => {
    localStorage.setItem("hrms_hr_Token", data.token);
    localStorage.setItem("hrms_hr_User", JSON.stringify(data.employee));
    setEmployee(data.employee);
  };

  const logout = () => {
    localStorage.removeItem("hrms_hr_Token");
    localStorage.removeItem("hrms_hr_User");
    setEmployee(null);
  };

  return (
    <HrAuthContext.Provider value={{ employee, login, logout }}>
      {children}
    </HrAuthContext.Provider>
  );
};

export const useHrAuth = () => useContext(HrAuthContext);
