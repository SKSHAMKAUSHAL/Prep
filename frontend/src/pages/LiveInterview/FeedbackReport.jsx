import React, { useMemo, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LuTarget, LuMessageSquare, LuChevronLeft, LuZap, LuCircleAlert, LuVolume2, LuSun, LuMoon } from 'react-icons/lu';
import { motion } from 'framer-motion';
import { ThemeContext } from '../../context/ThemeContext';

const getScoreColor = (score) => {
  if (score >= 8) return {
    text: 'text-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    stroke: '#10b981',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    circleBg: 'stroke-slate-100 dark:stroke-slate-800',
    lightBg: 'bg-emerald-50/50 dark:bg-emerald-950/10',
    lightBorder: 'border-emerald-100/50 dark:border-emerald-900/30',
    lightText: 'text-emerald-800 dark:text-emerald-400'
  };
  if (score >= 5) return {
    text: 'text-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    border: 'border-amber-100 dark:border-amber-900/30',
    stroke: '#f59e0b',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    circleBg: 'stroke-slate-100 dark:stroke-slate-800',
    lightBg: 'bg-amber-50/50 dark:bg-amber-950/10',
    lightBorder: 'border-amber-100/50 dark:border-amber-900/30',
    lightText: 'text-amber-800 dark:text-amber-400'
  };
  return {
    text: 'text-rose-500',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    border: 'border-rose-100 dark:border-rose-900/30',
    stroke: '#f43f5e',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]',
    circleBg: 'stroke-slate-100 dark:stroke-slate-800',
    lightBg: 'bg-rose-50/50 dark:bg-rose-950/10',
    lightBorder: 'border-rose-100/50 dark:border-rose-900/30',
    lightText: 'text-rose-800 dark:text-rose-400'
  };
};

const FeedbackReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { theme, toggleTheme } = useContext(ThemeContext);
  
  const history = location.state?.interviewHistory || [];
  const persona = location.state?.persona || 'standard';
  const duration = location.state?.duration || '10';

  const { avgScore, avgConfidence } = useMemo(() => {
    if (history.length === 0) return { avgScore: 0, avgConfidence: 0 };
    let totalScore = 0;
    let totalConfidence = 0;
    history.forEach(h => {
      totalScore += h.evaluation?.score || 0;
      totalConfidence += h.evaluation?.confidenceScore || 0;
    });
    return {
      avgScore: Math.round((totalScore / history.length) * 10) / 10,
      avgConfidence: Math.round(totalConfidence / history.length)
    };
  }, [history]);

  const scoreTheme = getScoreColor(avgScore);

  if (history.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-900 dark:text-slate-100">
        <LuCircleAlert className="text-gray-450 w-16 h-16 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold mb-2">No Interview Data</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6">We couldn't find any feedback data for this session.</p>
        <button onClick={() => navigate('/dashboard')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Circular gauge config
  const radius = 32;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius; // ~201
  const strokeDashoffset = circumference - (circumference * avgScore) / 10;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-150 dark:border-slate-800 sticky top-0 z-20 transition-colors duration-300">
        <div className="container mx-auto px-6 max-w-5xl h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors text-slate-600 dark:text-slate-350"
            >
              <LuChevronLeft className="text-xl" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Interview Feedback</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all text-gray-600 dark:text-slate-300"
              title="Toggle Theme"
            >
              {theme === "dark" ? (
                <LuSun className="text-lg text-amber-400" />
              ) : (
                <LuMoon className="text-lg text-slate-700" />
              )}
            </button>
            <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold border border-blue-100 dark:border-blue-900/50 capitalize">
              {persona} Persona
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-5xl pt-10">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* Circular Score Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-150 dark:border-slate-800/80 shadow-sm flex items-center gap-6 transition-colors duration-300"
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center relative ${scoreTheme.bg} ${scoreTheme.glow} transition-all duration-300`}>
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                {/* Background circle */}
                <circle 
                  cx="40" 
                  cy="40" 
                  r={radius} 
                  className={scoreTheme.circleBg} 
                  strokeWidth={strokeWidth} 
                  fill="transparent" 
                />
                {/* Progress circle */}
                <circle 
                  cx="40" 
                  cy="40" 
                  r={radius} 
                  stroke={scoreTheme.stroke}
                  strokeWidth={strokeWidth} 
                  fill="transparent" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={strokeDashoffset} 
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-2xl font-black">{avgScore}<span className="text-xs text-slate-400 font-normal">/10</span></span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Overall Performance</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Based on technical accuracy and response depth.</p>
            </div>
          </motion.div>

          {/* Confidence Score Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-150 dark:border-slate-800/80 shadow-sm flex items-center gap-6 transition-colors duration-300"
          >
            <div className="w-20 h-20 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.15)] flex-shrink-0">
              <LuTarget className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-end gap-2 mb-1">
                <h3 className="text-3xl font-black leading-none">{avgConfidence}%</h3>
              </div>
              <h3 className="text-lg font-bold mb-0.5">Confidence Score</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Analyzed from delivery tone and phrasing hesitation.</p>
            </div>
          </motion.div>
        </div>

        {/* Detailed Q&A Breakdown */}
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <LuMessageSquare className="text-blue-600 dark:text-blue-400" />
          Detailed Evaluation
        </h2>

        <div className="space-y-8">
          {history.map((item, idx) => {
            const currentItemScore = item.evaluation?.score || 0;
            const cardTheme = getScoreColor(currentItemScore);
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 + (idx * 0.08) }}
                key={idx} 
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300"
              >
                {/* Question Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 block">Question {idx + 1}</span>
                      <h3 className="text-lg font-bold">{item.question}</h3>
                    </div>
                    {/* Score badge with custom score dynamic range colors */}
                    <div className={`flex-shrink-0 ${cardTheme.bg} border ${cardTheme.border} px-4 py-2 rounded-2xl text-center min-w-[70px] ${cardTheme.glow}`}>
                      <span className={`block text-3xl font-black leading-none ${cardTheme.text}`}>{currentItemScore}</span>
                      <span className="block text-[9px] font-bold text-slate-450 dark:text-slate-400 uppercase mt-1">Score</span>
                    </div>
                  </div>
                </div>

                {/* Answers & Feedback */}
                <div className="p-6 space-y-6">
                  
                  {/* User's Answer */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div> Your Answer
                      </h4>
                      <button 
                        onClick={() => {
                          window.speechSynthesis.cancel();
                          const utterance = new SpeechSynthesisUtterance(item.userAnswer);
                          window.speechSynthesis.speak(utterance);
                        }}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                      >
                        <LuVolume2 className="w-3.5 h-3.5" /> Playback
                      </button>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800/60 italic">
                      "{item.userAnswer}"
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* AI Feedback */}
                    <div className="flex flex-col">
                      <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                        <LuZap className="text-yellow-500" /> AI Critique & Sentiment
                      </h4>
                      <div className="bg-yellow-50/30 dark:bg-yellow-950/10 rounded-2xl p-4 text-slate-800 dark:text-slate-300 border border-yellow-100/50 dark:border-yellow-900/20 flex-1 flex flex-col justify-between gap-4">
                        <p className="leading-relaxed text-sm">{item.spokenFeedback}</p>
                        <div className="self-start inline-flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-yellow-250 dark:border-yellow-900/40 text-xs font-semibold text-yellow-800 dark:text-yellow-400 shadow-sm">
                          Sentiment: {item.evaluation?.sentiment || "Neutral"}
                        </div>
                      </div>
                    </div>

                    {/* Key Differences */}
                    <div className="flex flex-col">
                      <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                        <LuCircleAlert className="text-rose-500" /> Areas for Improvement
                      </h4>
                      <div className={`rounded-2xl p-4 border flex-1 ${cardTheme.lightBg} ${cardTheme.lightBorder} ${cardTheme.lightText}`}>
                        <ul className="space-y-2.5">
                          {item.evaluation?.keyDifferences && item.evaluation.keyDifferences.length > 0 ? (
                            item.evaluation.keyDifferences.map((diff, dIdx) => (
                              <li key={dIdx} className="flex gap-2 text-sm leading-relaxed">
                                <span className="mt-1 flex-shrink-0 text-xs opacity-75">•</span>
                                <span>{diff}</span>
                              </li>
                            ))
                          ) : (
                            <span className="text-sm italic">Outstanding! No major differences or critical areas missed.</span>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Industry Standard */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">IS</div> 
                      Industry Standard Answer
                    </h4>
                    <div className="bg-blue-50/40 dark:bg-blue-950/10 rounded-2xl p-5 text-slate-800 dark:text-slate-300 leading-relaxed border border-blue-100 dark:border-blue-900/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                      <p className="relative z-10 text-sm leading-relaxed">{item.evaluation?.industryStandardAnswer || "N/A"}</p>
                    </div>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeedbackReport;
