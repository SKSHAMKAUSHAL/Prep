import React, { useContext } from 'react'
import ProfileInfoCard from '../cards/ProfileInfoCard'
import { Link } from 'react-router-dom';
import { LuSun, LuMoon } from 'react-icons/lu';
import { ThemeContext } from '../../context/ThemeContext';

const Navbar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--color-surface)]/90 backdrop-blur-md border-b border-[var(--color-border)] z-50 transition-colors duration-200">
      <div className="container mx-auto h-full flex items-center justify-between px-6 max-w-7xl">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/Proview-Symbol.png"
            alt="Prep"
            className="w-8 h-8 object-contain rounded-lg border border-[var(--color-border)] shadow-xs group-hover:scale-105 transition-transform"
          />
          <span className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
            Prep
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg)] transition-colors text-[var(--color-text-secondary)]"
            title="Toggle Theme"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <LuSun className="text-base text-amber-400" />
            ) : (
              <LuMoon className="text-base text-slate-700" />
            )}
          </button>
          <ProfileInfoCard />
        </div>
      </div>
    </header>
  );
}

export default Navbar