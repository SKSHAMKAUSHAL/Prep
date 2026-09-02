import React, { useContext } from "react";
import Navbar from "./Navbar";
import { UserContext } from "../../context/UserContext";

const DashboardLayout = ({ children }) => {
  const { user } = useContext(UserContext);
  return (
    <div className="bg-[var(--color-bg)] min-h-screen text-[var(--color-text-primary)] transition-colors duration-200 math-notebook-pattern">
      <Navbar />
      {user && <div className="pt-16">{children}</div>}
    </div>
  );
};

export default DashboardLayout;
