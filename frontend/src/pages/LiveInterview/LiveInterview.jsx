import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LuMic, LuSquare, LuPhoneOff, LuSettings, LuChevronDown } from 'react-icons/lu';
import axiosInstance from '../../utils/axioInstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { ThemeContext } from '../../context/ThemeContext';

import { useVoiceTTS } from '../../hooks/useVoiceTTS';
import { useMicMeter } from '../../hooks/useMicMeter';
import { useVoiceSTT } from '../../hooks/useVoiceSTT';
import { useWebSocket } from '../../hooks/useWebSocket';
import AIPresence from './components/AIPresence';
import SettingsPopover from './components/SettingsPopover';

const LiveInterview = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const duration = searchParams.get('duration') || '10';
  const persona = searchParams.get('persona') || 'standard';

  const [sessionData, setSessionData] = useState(null);
  const [status, setStatus] = useState('initializing'); // 'initializing' | 'idle' | 'listening' | 'speaking' | 'thinking' | 'finished'
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState('');
  const [timeLeft, setTimeLeft] = useState(parseInt(duration, 10) * 60);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [sttLanguage, setSttLanguage] = useState('en-IN');
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const currentQuestionIndexRef = useRef(0);

  // 1. WebSocket Streaming Voice Pipeline Hook
  const token = localStorage.getItem('token');
  const { isConnected, sendInterruption } = useWebSocket({
    token,
    sessionId,
    autoConnect: Boolean(token),
  });

  // 2. Microphone & Audio Level Meter Hook
  const {
    micDevices,
    selectedMicId,
    setSelectedMicId,
    isMicLoading,
    micLevelPercent,
    micEnergyActive,
    loadMicDevices,
    ensureMicAccess,
    refreshMicStream,
    stopMicStream,
    resumeAudioContext,
  } = useMicMeter();

  // 3. Text-To-Speech Hook
  const { isSpeaking, aiMessage, speakText, stopSpeaking } = useVoiceTTS(persona);

  // 4. Speech-To-Text Hook with Barge-In Interruption Support
  const {
    isListening,
    transcript,
    transcriptRef,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceSTT({
    language: sttLanguage,
    ensureMicAccess,
    refreshMicStream,
    resumeAudioContext,
    onSpeechStart: () => {
      // Instant candidate barge-in: cancel client TTS and signal server
      if (isSpeaking) {
        stopSpeaking();
        if (isConnected) {
          sendInterruption();
        }
      }
    },
    onListeningStateChange: (listening) => {
      if (listening) {
        setStatus('listening');
      }
    },
  });

  // Keep index ref synchronized
  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // Load Session Data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await axiosInstance.get(API_PATHS.SESSION.GET_ONE(sessionId));
        if (res.data?.session) {
          setSessionData(res.data.session);
          if (res.data.session.questions?.length > 0) {
            setActiveQuestion(res.data.session.questions[0].question);
          }
          setStatus('idle');
        }
      } catch (err) {
        console.error('[Data Error]', err);
        toast.error('Failed to load session.');
        navigate('/dashboard');
      }
    };
    fetchSession();
  }, [sessionId, navigate]);

  // Handle End of Interview
  const endInterview = useCallback(async () => {
    setStatus('finished');
    stopListening();
    stopMicStream();
    stopSpeaking();

    try {
      await axiosInstance.post(API_PATHS.SESSION.SAVE_ATTEMPT(sessionId), {
        history: interviewHistory,
        persona,
        duration,
      });
    } catch (err) {
      console.error('[Network Error] Could not save attempt:', err);
      toast.error('Could not save interview history.');
    }

    navigate(`/interview/${sessionId}/feedback`, {
      state: { interviewHistory, persona, duration },
    });
  }, [duration, interviewHistory, navigate, persona, sessionId, stopListening, stopMicStream, stopSpeaking]);

  // Timer Tick (only ticks once interview has started)
  useEffect(() => {
    if (!hasStarted || status === 'initializing' || status === 'finished') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          endInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, status, endInterview]);

  // Handle TTS / Next Question Transition
  const startNextQuestion = useCallback((sessionDataArg, speechPrefix = '', nextQuestionOverride = '') => {
    const idx = currentQuestionIndexRef.current;
    const questions = sessionDataArg?.questions;

    if (!questions || idx >= questions.length) {
      if (speechPrefix) {
        speakText(speechPrefix + " That concludes our interview.", () => endInterview());
      } else {
        endInterview();
      }
      return;
    }

    const nextQ = nextQuestionOverride || questions[idx]?.question;
    setActiveQuestion(nextQ);
    resetTranscript();

    const textToSpeak = speechPrefix ? `${speechPrefix} ${nextQ}` : nextQ;
    setStatus('speaking');

    speakText(textToSpeak, () => {
      setStatus('idle');
      setTimeout(() => {
        startListening();
      }, 900);
    });
  }, [endInterview, resetTranscript, speakText, startListening]);

  // Start Live Interview Flow (only greets candidate once when user clicks start)
  const startInterview = () => {
    setHasStarted(true);
    let intro = 'Welcome to your mock interview. I will now ask you the first question:';
    if (persona === 'friendly' || persona === 'hr') {
      intro = "Hi! I'm glad you're here today. Let's begin your mock interview with the first question:";
    } else if (persona === 'strict' || persona === 'system_design') {
      intro = 'Technical assessment commencing. Please answer clearly and concisely. First question:';
    }

    const questions = sessionData?.questions;
    const firstQ = (questions && questions[0]?.question) || "Can you introduce yourself and discuss a recent technical project you built?";
    setActiveQuestion(firstQ);
    resetTranscript();

    setStatus('speaking');
    speakText(`${intro} ${firstQ}`, () => {
      setStatus('idle');
      setTimeout(() => {
        startListening();
      }, 800);
    });
  };

  // Evaluate candidate answer with LLM
  const evaluateAndRespond = async () => {
    const idx = currentQuestionIndexRef.current;
    const currentQuestion = activeQuestion;
    const userAnswer = transcriptRef.current?.trim() || "I don't know the answer.";

    setStatus('thinking');

    try {
      const res = await axiosInstance.post(API_PATHS.AI.EVALUATE_ANSWER, {
        question: currentQuestion,
        userAnswer,
        persona,
        sessionId,
        history: interviewHistory,
      });

      const { spokenFeedback, evaluation, nextDynamicQuestion } = res.data;
      const newIndex = idx + 1;

      setInterviewHistory(prev => [
        ...prev,
        { question: currentQuestion, userAnswer, spokenFeedback, evaluation }
      ]);
      setCurrentQuestionIndex(newIndex);
      currentQuestionIndexRef.current = newIndex;

      startNextQuestion(sessionData, spokenFeedback, nextDynamicQuestion);
    } catch (err) {
      console.error('[Evaluation Error]', err);
      toast.error('Failed to evaluate answer, moving on...');

      const newIndex = idx + 1;
      setCurrentQuestionIndex(newIndex);
      currentQuestionIndexRef.current = newIndex;

      setStatus('speaking');
      speakText("Let's continue to the next question.", () => {
        const questions = sessionData?.questions;
        const nextQFallback = questions && questions[newIndex] ? questions[newIndex].question : '';
        startNextQuestion(sessionData, '', nextQFallback);
      });
    }
  };

  // Mic Toggle action
  const toggleListening = () => {
    if (status === 'listening') {
      stopListening();
      setStatus('thinking');
      setTimeout(() => {
        evaluateAndRespond();
      }, 800);
    } else if (status === 'idle') {
      resetTranscript();
      startListening();
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const isInterviewNotStarted = !hasStarted;

  if (status === 'initializing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-primary)]">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-sm text-[var(--color-text-muted)]"
        >
          Initializing interview environment...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-200">
      {/* ─── Top Bar ─── */}
      <div className="flex-shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="h-12 flex items-center justify-between px-4 md:px-6">
          {/* Left: Logo + Role */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">Prep</span>
            </div>
            <div className="w-px h-4 bg-[var(--color-border)]" />
            <span className="text-xs font-medium text-[var(--color-text-secondary)] truncate max-w-[200px]">
              {sessionData?.role || 'Interview'}
            </span>
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isConnected ? 'Voice Stream' : 'Voice Pipeline'}
            </span>
          </div>

          {/* Center: Progress + Timer */}
          <div className="hidden md:flex items-center gap-4">
            {sessionData?.questions && (
              <span className="text-xs font-medium text-[var(--color-text-muted)] tabular-nums">
                {String(Math.min(currentQuestionIndex + 1, sessionData.questions.length)).padStart(2, '0')} / {String(sessionData.questions.length).padStart(2, '0')}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status !== 'finished' ? 'bg-[var(--color-error)] animate-pulse' : 'bg-[var(--color-text-muted)]'
                }`}
              />
              <span className="text-xs font-mono font-medium text-[var(--color-text-secondary)] tabular-nums">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Right: Controls & End */}
          <div className="flex items-center gap-2">
            <div className="flex md:hidden items-center gap-2 mr-2">
              {sessionData?.questions && (
                <span className="text-[11px] font-medium text-[var(--color-text-muted)] tabular-nums">
                  {currentQuestionIndex + 1}/{sessionData.questions.length}
                </span>
              )}
              <span className="text-[11px] font-mono text-[var(--color-text-secondary)] tabular-nums">
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={endInterview}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-error)] border border-[var(--color-error)]/20 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LuPhoneOff className="w-3 h-3" />
              <span className="hidden sm:inline">End</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Interview Area ─── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 md:py-12">
        {/* AI Presence */}
        <AIPresence status={status} />

        {/* Question / Transcript Display */}
        <div className="w-full max-w-xl text-center mt-10 min-h-[120px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={status === 'speaking' ? `q-${currentQuestionIndex}` : `t-${transcript.slice(0, 20)}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {status === 'speaking' ? (
                <p className="text-xl md:text-2xl font-medium leading-relaxed text-[var(--color-text-primary)]">
                  {aiMessage || activeQuestion}
                </p>
              ) : transcript ? (
                <div>
                  <p className="text-base md:text-lg leading-relaxed text-[var(--color-text-secondary)] italic">
                    "{transcript}"
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  {status === 'listening'
                    ? "Speak your answer — I'm listening..."
                    : status === 'thinking'
                    ? 'Analyzing your response...'
                    : isInterviewNotStarted
                    ? 'Press Start Interview to begin'
                    : 'Press the mic button to answer'}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Question Progress Dots */}
        {sessionData?.questions && (
          <div className="flex items-center gap-1 mt-6">
            {sessionData.questions.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                  i < currentQuestionIndex
                    ? 'bg-[var(--color-accent)]'
                    : i === currentQuestionIndex
                    ? 'bg-[var(--color-text-primary)]'
                    : 'bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Bottom Controls ─── */}
      <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-col items-center py-5 px-4 gap-3">
          {/* Transcript Toggle */}
          {transcript && !isInterviewNotStarted && (
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              Transcript
              <LuChevronDown className={`w-3 h-3 transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Main Action Buttons */}
          <div className="flex items-center gap-4">
            {isInterviewNotStarted ? (
              <button
                onClick={startInterview}
                className="font-medium px-8 py-3 rounded-lg text-sm bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors active:scale-[0.98]"
              >
                Start Interview
              </button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleListening}
                disabled={status === 'speaking' || status === 'thinking' || status === 'finished'}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                  status === 'listening'
                    ? 'bg-[var(--color-error)] text-white shadow-sm'
                    : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]'
                } ${
                  status === 'speaking' || status === 'thinking' || status === 'finished'
                    ? 'opacity-30 cursor-not-allowed'
                    : ''
                }`}
              >
                {status === 'listening' ? <LuSquare className="w-5 h-5" /> : <LuMic className="w-5 h-5" />}
              </motion.button>
            )}

            {/* Settings Button & Popover */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-9 h-9 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
                title="Settings"
              >
                <LuSettings className="w-4 h-4" />
              </button>
              <SettingsPopover
                isOpen={showSettings}
                onToggle={setShowSettings}
                micDevices={micDevices}
                selectedMicId={selectedMicId}
                setSelectedMicId={setSelectedMicId}
                isMicLoading={isMicLoading}
                loadMicDevices={loadMicDevices}
                sttLanguage={sttLanguage}
                setSttLanguage={setSttLanguage}
                micLevelPercent={micLevelPercent}
                micEnergyActive={micEnergyActive}
                theme={theme}
                toggleTheme={toggleTheme}
              />
            </div>
          </div>

          {/* Status Text / Hint */}
          <p className="text-[11px] text-[var(--color-text-muted)]">
            {status === 'listening'
              ? 'Press ■ when done answering'
              : status === 'idle'
              ? isInterviewNotStarted
                ? ''
                : 'Press mic to answer'
              : status === 'thinking'
              ? 'Evaluating your answer...'
              : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveInterview;
