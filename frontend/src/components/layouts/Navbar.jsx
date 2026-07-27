import React, { useContext } from 'react'
import ProfileInfoCard from '../cards/ProfileInfoCard'
import { Link } from 'react-router-dom';
import { LuSparkles, LuSun, LuMoon } from 'react-icons/lu';
import { ThemeContext } from '../../context/ThemeContext';

const Navbar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-900 z-50 transition-colors duration-300">
      <div className="container mx-auto h-full flex items-center justify-between px-6 max-w-7xl">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center transition-transform group-hover:scale-105">
            <LuSparkles className="text-white text-lg" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Prep
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all text-gray-600 dark:text-slate-300"
            title="Toggle Theme"
          >
            {theme === "dark" ? (
              <LuSun className="text-lg text-amber-400" />
            ) : (
              <LuMoon className="text-lg text-slate-700" />
            )}
          </button>
          <ProfileInfoCard />
        </div>
      </div>
    </div>
  );
}

export default Navbar