import React, { useMemo, useContext, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { LuTarget, LuMessageSquare, LuChevronLeft, LuZap, LuCircleAlert, LuVolume2, LuSun, LuMoon, LuChevronDown } from 'react-icons/lu';
import { motion } from 'framer-motion';
import { ThemeContext } from '../../context/ThemeContext';

const getScoreColor = (score) => {
  if (score >= 8) return { text: 'text-emerald-600 dark:text-emerald-400', stroke: '#22c55e', bg: 'bg-emerald-50 dark:bg-emerald-950/20' };
  if (score >= 5) return { text: 'text-amber-600 dark:text-amber-400', stroke: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/20' };
  return { text: 'text-rose-600 dark:text-rose-400', stroke: '#ef4444', bg: 'bg-rose-50 dark:bg-rose-950/20' };
};

const QuestionAccordion = ({ item, idx }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentItemScore = item.evaluation?.score || 0;
  const cardTheme = getScoreColor(currentItemScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + (idx * 0.05) }}
      className="border border-[var(--color-border)] rounded-lg overflow-hidden"
    >
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-bg)] transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs font-medium text-[var(--color-text-muted)] tabular-nums w-5 flex-shrink-0">
            {String(idx + 1).padStart(2, '0')}
          </span>
          <h3 className="text-sm font-medium text-[var(--color-text-primary)] truncate">
            {item.question}
          </h3>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <span className={`text-sm font-semibold tabular-nums ${cardTheme.text}`}>
            {currentItemScore}<span className="text-[var(--color-text-muted)] text-xs font-normal">/10</span>
          </span>
          <LuChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="border-t border-[var(--color-border)] p-4 space-y-5">
          {/* User's Answer */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Your Answer</h4>
              <button
                onClick={() => {
                  window.speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance(item.userAnswer);
                  window.speechSynthesis.speak(utterance);
                }}
                className="text-[11px] font-medium text-[var(--color-accent)] hover:underline flex items-center gap-1"
              >
                <LuVolume2 className="w-3 h-3" /> Playback
              </button>
            </div>
            <div className="bg-[var(--color-bg)] rounded-lg p-3 text-sm text-[var(--color-text-secondary)] leading-relaxed border border-[var(--color-border-subtle)] italic">
              "{item.userAnswer}"
            </div>
          </div>

          {/* AI Feedback */}
          <div>
            <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <LuZap className="w-3 h-3 text-amber-500" /> AI Feedback
            </h4>
            <div className="bg-[var(--color-bg)] rounded-lg p-3 text-sm text-[var(--color-text-secondary)] leading-relaxed border border-[var(--color-border-subtle)]">
              <p>{item.spokenFeedback}</p>
              {item.evaluation?.sentiment && (
                <span className="inline-block mt-2 text-[11px] font-medium text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 rounded-md">
                  Sentiment: {item.evaluation.sentiment}
                </span>
              )}
            </div>
          </div>

          {/* Areas for Improvement */}
          {item.evaluation?.keyDifferences && item.evaluation.keyDifferences.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <LuCircleAlert className="w-3 h-3 text-rose-500" /> What to improve
              </h4>
              <ul className="space-y-1.5">
                {item.evaluation.keyDifferences.map((diff, dIdx) => (
                  <li key={dIdx} className="flex gap-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    <span className="text-[var(--color-text-muted)] mt-0.5 flex-shrink-0">•</span>
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Industry Standard */}
          {item.evaluation?.industryStandardAnswer && (
            <div className="pt-3 border-t border-[var(--color-border)]">
              <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                Industry Standard Answer
              </h4>
              <div className="bg-[var(--color-bg)] rounded-lg p-3 text-sm text-[var(--color-text-secondary)] leading-relaxed border border-[var(--color-border-subtle)]">
                {item.evaluation.industryStandardAnswer}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
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
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-[var(--color-text-primary)]">
        <LuCircleAlert className="text-[var(--color-text-muted)] w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Interview Data</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">We couldn't find any feedback data for this session.</p>
        <button onClick={() => navigate('/dashboard')} className="bg-[var(--color-accent)] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Circular gauge config
  const radius = 32;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * avgScore) / 10;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-20 text-[var(--color-text-primary)] transition-colors duration-200">
      {/* Header */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-20">
        <div className="container mx-auto px-6 max-w-4xl h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-8 h-8 rounded-md hover:bg-[var(--color-bg)] flex items-center justify-center transition-colors text-[var(--color-text-muted)]"
              aria-label="Back to dashboard"
            >
              <LuChevronLeft className="text-lg" />
            </button>
            <Link to="/" className="flex items-center gap-2 group cursor-pointer hover:opacity-85 transition-opacity" title="Prep - Return to Landing Page">
              <img src="/Proview-Symbol.png" alt="Prep" className="w-5 h-5 object-contain rounded border border-[var(--color-border)] shadow-xs group-hover:scale-105 transition-transform" />
              <span className="text-xs font-bold text-[var(--color-text-primary)]">Prep</span>
            </Link>
            <div className="w-px h-3.5 bg-[var(--color-border)]" />
            <h1 className="text-sm font-semibold">Interview Feedback</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-md border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg)] transition-colors text-[var(--color-text-muted)]"
              title="Toggle Theme"
            >
              {theme === "dark" ? <LuSun className="text-sm" /> : <LuMoon className="text-sm" />}
            </button>
            <span className="text-[11px] font-medium text-[var(--color-text-muted)] bg-[var(--color-bg)] px-2.5 py-1 rounded-md border border-[var(--color-border)] capitalize">
              {persona}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-4xl pt-8">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-1">Interview Complete</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {history.length} questions · {duration} min · {persona} persona
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {/* Score */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] flex items-center gap-5"
          >
            <div className="w-[76px] h-[76px] flex items-center justify-center relative flex-shrink-0">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={radius} className="stroke-[var(--color-border)]" strokeWidth={strokeWidth} fill="transparent" />
                <circle cx="40" cy="40" r={radius} stroke={scoreTheme.stroke} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
              </svg>
              <span className="text-xl font-semibold tabular-nums">{avgScore}<span className="text-xs text-[var(--color-text-muted)] font-normal">/10</span></span>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-0.5">Overall Score</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Technical accuracy & response quality</p>
            </div>
          </motion.div>

          {/* Confidence */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.08 }} 
            className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] flex items-center gap-5"
          >
            <div className="w-[76px] h-[76px] rounded-xl bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0">
              <LuTarget className="w-7 h-7 text-[var(--color-accent)]" />
            </div>
            <div>
              <div className="flex items-end gap-1 mb-0.5">
                <h3 className="text-2xl font-semibold tabular-nums leading-none">{avgConfidence}%</h3>
              </div>
              <h3 className="text-sm font-semibold mb-0.5">Confidence Score</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Delivery tone & phrasing analysis</p>
            </div>
          </motion.div>
        </div>

        {/* Question-by-Question */}
        <div className="mb-6">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <LuMessageSquare className="text-[var(--color-accent)]" />
            Question Analysis
          </h2>
        </div>

        <div className="space-y-3">
          {history.map((item, idx) => (
            <QuestionAccordion key={idx} item={item} idx={idx} />
          ))}
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(`/interview-prep/${sessionId}`)}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg)] transition-colors text-center"
          >
            Back to Prep
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-white bg-[var(--color-accent)] rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors text-center"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackReport;
