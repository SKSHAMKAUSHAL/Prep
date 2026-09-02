import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuArrowLeft,
  LuCompass,
  LuSparkles,
  LuTerminal,
  LuLightbulb,
  LuSun,
  LuMoon,
  LuCheck,
  LuRotateCcw,
  LuChevronRight,
  LuLayoutDashboard,
  LuFlame,
  LuBrain
} from "react-icons/lu";
import { ThemeContext } from "../../context/ThemeContext";
import { UserContext } from "../../context/UserContext";

const BRAIN_TEASERS = [
  {
    id: 1,
    topic: "JavaScript & Event Loop",
    question: "In what order will this execute: `Promise.resolve().then(...)`, `setTimeout(..., 0)`, and `console.log()`?",
    answer: "1. Synchronous `console.log` (Call Stack)\n2. `Promise` (Microtask Queue)\n3. `setTimeout` (Macrotask Queue)",
    tag: "Core Runtime"
  },
  {
    id: 2,
    topic: "System Design",
    question: "What is the primary difference between Consistent Hashing and Simple Modulo Hashing?",
    answer: "Consistent Hashing ensures that when a cache node is added/removed, only `k/N` keys need remapping on average, preventing massive cache miss cascades.",
    tag: "Scalability"
  },
  {
    id: 3,
    topic: "Database Indexing",
    question: "Why do relational databases predominantly use B+ Trees instead of Binary Search Trees for disk-backed indexes?",
    answer: "B+ Trees have high fan-out, shallow height, and contiguous leaf nodes connected in a linked list, minimizing expensive disk I/O operations.",
    tag: "Databases"
  },
  {
    id: 4,
    topic: "React Architecture",
    question: "What problem does React 18 Concurrent Rendering solve that synchronous reconciliation could not?",
    answer: "It allows React to pause, prioritize, and discard non-urgent render trees (like heavy list filtering) so user typing and inputs stay smooth at 60 FPS.",
    tag: "Frontend"
  },
  {
    id: 5,
    topic: "Networking & Security",
    question: "Why is TLS 1.3 handshake faster than TLS 1.2?",
    answer: "TLS 1.3 reduced the handshake from 2 round trips (2-RTT) down to 1-RTT (and 0-RTT for resumed connections) with improved cipher security.",
    tag: "Protocols"
  }
];

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user } = useContext(UserContext);

  const [teaserIdx, setTeaserIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Pick random brain teaser on mount
  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * BRAIN_TEASERS.length);
    setTeaserIdx(randomIdx);
  }, []);

  const currentTeaser = BRAIN_TEASERS[teaserIdx];

  const handleNextTeaser = () => {
    setShowAnswer(false);
    setTeaserIdx((prev) => (prev + 1) % BRAIN_TEASERS.length);
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      
      {/* ─── Immersive 404 Background Image Layer ─── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/404.png"
          alt="Deep Study Late Night Focus Background"
          className="w-full h-full object-cover object-center scale-105 filter brightness-75 contrast-110 motion-safe:animate-pulse-glow"
        />

        {/* Ambient Warm Desk Lamp Glow on Left */}
        <div className="absolute -top-1/4 left-0 w-[650px] h-[650px] bg-gradient-to-br from-amber-500/25 via-orange-600/15 to-transparent blur-[140px] rounded-full pointer-events-none" />

        {/* Ambient Indigo Twilight Glow on Right */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-indigo-600/25 via-purple-600/15 to-transparent blur-[150px] rounded-full pointer-events-none" />

        {/* Dynamic Dark Vignette & Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
      </div>

      {/* ─── Floating Top Navigation ─── */}
      <header className="relative z-20 container mx-auto px-6 py-6 max-w-7xl">
        <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 shadow-2xl">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/Proview-Symbol.png"
              alt="Prep"
              className="w-8 h-8 rounded-lg border border-white/15 object-contain shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              Prep
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                404 Space
              </span>
            </span>
          </Link>

          {/* Center Diagnostic Beacon */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-300 bg-black/40 border border-white/10 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-amber-300 font-semibold">ERR_ROUTE_NOT_FOUND</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 truncate max-w-[200px]">{location.pathname}</span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-slate-300"
              title="Toggle Theme"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <LuSun className="w-4 h-4 text-amber-300" />
              ) : (
                <LuMoon className="w-4 h-4 text-indigo-300" />
              )}
            </button>

            <button
              onClick={() => navigate(user ? "/dashboard" : "/")}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs tracking-wide uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-1.5"
            >
              <LuLayoutDashboard className="w-3.5 h-3.5" />
              <span>{user ? "Dashboard" : "Home"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main 404 Hero Content ─── */}
      <main className="relative z-10 container mx-auto px-6 py-8 max-w-6xl flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Column: Status & Call to Action (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold tracking-wider uppercase backdrop-blur-md">
              <LuTerminal className="w-3.5 h-3.5 text-amber-400" />
              <span>Exception: 404 Not Found</span>
            </div>

            {/* Glowing Giant Number & Title */}
            <div className="relative">
              <div className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-tighter leading-none bg-gradient-to-r from-amber-200 via-orange-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_10px_35px_rgba(245,158,11,0.25)] select-none">
                404
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mt-2">
                Lost in the late-night grind?
              </h1>
            </div>

            {/* Explanatory Copy */}
            <p className="text-base text-slate-300 max-w-xl leading-relaxed">
              The page you're searching for was moved, renamed, or never committed to the repo. Don't let an unhandled route break your momentum — your interview preparation is right on track.
            </p>

            {/* Path Copier pill */}
            <div className="inline-flex items-center gap-2 bg-black/40 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-300 backdrop-blur-md">
              <span className="text-slate-500">Path:</span>
              <span className="text-amber-300 font-semibold">{location.pathname}</span>
              <button
                onClick={handleCopyPath}
                className="ml-2 text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {isCopied ? "Copied!" : "Copy URL"}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigate(user ? "/dashboard" : "/")}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-amber-500/25 active:scale-95 flex items-center gap-2 group"
              >
                <LuLayoutDashboard className="w-4 h-4" />
                <span>Return to {user ? "Dashboard" : "Home"}</span>
                <LuChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => navigate(-1)}
                className="px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium text-sm transition-all backdrop-blur-md active:scale-95 flex items-center gap-2"
              >
                <LuArrowLeft className="w-4 h-4 text-slate-400" />
                <span>Go Back</span>
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="pt-4 border-t border-white/10">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <LuCompass className="w-3.5 h-3.5 text-amber-400" />
                <span>Jump straight to high-yield tracks:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "System Design", path: "/dashboard" },
                  { name: "Frontend Architect", path: "/dashboard" },
                  { name: "Backend Distributed Systems", path: "/dashboard" }
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-all flex items-center gap-1.5"
                  >
                    <span>{item.name}</span>
                    <LuChevronRight className="w-3 h-3 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>

          </motion.div>

          {/* Right Interactive Column: "While You're Lost" 60-Second Brain Teaser (5 cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="relative rounded-2xl p-6 bg-slate-900/70 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden">
              
              {/* Card Header Sheen */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
              
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                    <LuBrain className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Quick Interview Brain Teaser
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Master a concept while you're here
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-amber-300">
                  {currentTeaser.tag}
                </span>
              </div>

              {/* Teaser Question Box */}
              <div className="space-y-4">
                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                  <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-1 font-semibold">
                    Topic: {currentTeaser.topic}
                  </div>
                  <p className="text-sm font-medium text-slate-100 leading-snug">
                    "{currentTeaser.question}"
                  </p>
                </div>

                {/* Reveal Answer Button / Expanded Section */}
                <AnimatePresence mode="wait">
                  {showAnswer ? (
                    <motion.div
                      key="answer"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 text-xs text-emerald-200 space-y-2"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <LuCheck className="w-4 h-4" />
                        <span>Explanation & Standard Answer:</span>
                      </div>
                      <p className="leading-relaxed text-slate-200 whitespace-pre-line font-mono text-[11px]">
                        {currentTeaser.answer}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Control Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <LuLightbulb className="w-3.5 h-3.5" />
                    <span>{showAnswer ? "Hide Explanation" : "Reveal Answer"}</span>
                  </button>

                  <button
                    onClick={handleNextTeaser}
                    className="py-2.5 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                    title="Next Question"
                  >
                    <LuRotateCcw className="w-3.5 h-3.5" />
                    <span>Next</span>
                  </button>
                </div>

                <div className="text-center pt-2">
                  <span className="text-[11px] text-slate-400">
                    Question {teaserIdx + 1} of {BRAIN_TEASERS.length} in quick drill
                  </span>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </main>

      {/* ─── Minimal Bottom Footer ─── */}
      <footer className="relative z-20 container mx-auto px-6 py-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Prep Engineering Platform</span>
            <span>•</span>
            <span>Error Reference: HTTP_404_PAGE_NOT_FOUND</span>
          </div>
          <div>
            <span>Turn every obstacle into an interview advantage.</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default NotFound;
