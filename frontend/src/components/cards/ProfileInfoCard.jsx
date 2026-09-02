import React, { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LuLayoutDashboard, LuLogOut, LuChevronDown } from "react-icons/lu";
import { UserContext } from "../../context/UserContext";

const AVATAR_SYMBOL = "/Proview-Symbol.png";

const ProfileInfoCard = () => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.clear();
    clearUser();
    navigate("/");
    setIsDropdownOpen(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const avatarSrc = user.profileImageUrl || AVATAR_SYMBOL;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface)] transition-all rounded-xl p-1 pr-2.5 focus:outline-none"
      >
        <img
          src={avatarSrc}
          alt={user.name || "Profile"}
          className="w-7 h-7 object-cover rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]"
          onError={(e) => {
            e.currentTarget.src = AVATAR_SYMBOL;
          }}
        />

        <span className="hidden sm:inline-block text-xs font-semibold text-[var(--color-text-primary)] max-w-[120px] truncate">
          {user.name || "User"}
        </span>

        <LuChevronDown
          className={`w-3 h-3 text-[var(--color-text-muted)] transition-transform duration-200 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-surface)]/95 backdrop-blur-md rounded-xl shadow-xl border border-[var(--color-border)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3 border-b border-[var(--color-border)] flex items-center gap-3">
            <img
              src={avatarSrc}
              alt="Avatar"
              className="w-10 h-10 border border-[var(--color-border)] rounded-full object-cover bg-[var(--color-bg)]"
              onError={(e) => {
                e.currentTarget.src = AVATAR_SYMBOL;
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                {user.name || "User"}
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                {user.email || ""}
              </p>
            </div>
          </div>

          <div className="p-1.5 space-y-0.5">
            <button
              onClick={() => {
                navigate("/dashboard");
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] rounded-lg transition-colors"
            >
              <LuLayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
              Dashboard
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LuLogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileInfoCard;