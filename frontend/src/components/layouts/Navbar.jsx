import React, { useContext } from 'react';
import ProfileInfoCard from '../cards/ProfileInfoCard';
import { Link, useLocation } from 'react-router-dom';
import { LuSun, LuMoon, LuCoins, LuMessageSquareCode, LuLayoutDashboard, LuSparkles } from 'react-icons/lu';
import { ThemeContext } from '../../context/ThemeContext';
import { UserContext } from '../../context/UserContext';

const Navbar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user } = useContext(UserContext);
  const location = useLocation();

  const tokenBalance = user?.tokens !== undefined ? user.tokens : 1000;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--color-surface)]/90 backdrop-blur-md border-b border-[var(--color-border)] z-50 transition-colors duration-200">
      <div className="container mx-auto h-full flex items-center justify-between px-6 max-w-7xl">
        <div className="flex items-center gap-6">
          <Link 
            to="/" 
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-3 group cursor-pointer"
            title="Prep - Return to Landing Page"
          >
            <img
              src="/Proview-Symbol.png"
              alt="Prep"
              className="w-8 h-8 object-contain rounded-lg border border-[var(--color-border)] shadow-xs group-hover:scale-105 transition-transform"
            />
            <span className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
              Prep
            </span>
          </Link>

          {/* Navigation Links for Authenticated Users */}
          {user && (
            <nav className="hidden sm:flex items-center gap-1.5 ml-2">
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  location.pathname === "/dashboard"
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
                }`}
              >
                <LuLayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/ask-query"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  location.pathname === "/ask-query" || location.pathname === "/query"
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
                }`}
              >
                <LuSparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Ask Query</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded font-semibold">
                  AI
                </span>
              </Link>
              <Link
                to="/doubt-solver"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  location.pathname === "/doubt-solver"
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
                }`}
              >
                <LuMessageSquareCode className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Doubt Solver</span>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* User Monthly Token Badge */}
          {user && (
            <div
              title={`${tokenBalance} of 1000 monthly tokens available. 10 tokens deducted per AI chat. Resets every 30 days.`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium shadow-xs"
            >
              <LuCoins className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 animate-pulse" />
              <span className="tabular-nums font-semibold">{tokenBalance}</span>
              <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 hidden md:inline">
                / 1,000 Tokens
              </span>
            </div>
          )}

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
};

export default Navbar;