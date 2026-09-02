import React, { useState } from "react";
import { FaEye, FaRegEyeSlash } from "react-icons/fa";

const Input = ({ value, onChange, label, placeholder, type, icon: Icon }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="mb-3">
      <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">{label}</label>
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-[var(--color-text-muted)] flex items-center justify-center">
            <Icon size={16} />
          </div>
        )}
        <input
          type={type === "password" ? (showPassword ? "text" : "password") : type}
          placeholder={placeholder}
          className={`premium-input ${Icon ? "!pl-9" : ""} ${type === "password" ? "!pr-9" : ""}`}
          value={value}
          onChange={(e) => onChange(e)}
        />
        {type === "password" && (
          <div className="absolute right-3 cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors" onClick={toggleShowPassword}>
            {showPassword ? <FaEye size={16} /> : <FaRegEyeSlash size={16} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;
