import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for Speech-To-Text (STT) via webkitSpeechRecognition
 * @param {Object} options
 * @param {string} options.language - e.g. 'en-US', 'en-IN'
 * @param {Function} options.onListeningStateChange - Callback when listening state changes
 * @param {Function} options.ensureMicAccess - Function to ensure mic permission/stream
 * @param {Function} options.refreshMicStream - Function to refresh stream if needed
 * @param {Function} options.resumeAudioContext - Function to resume AudioContext
 */
export const useVoiceSTT = ({
  language = 'en-IN',
  onListeningStateChange,
  onSpeechStart,
  ensureMicAccess,
  refreshMicStream,
  resumeAudioContext,
} = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const transcriptRef = useRef('');
  const accumulatedRef = useRef('');
  const sessionFinalsRef = useRef('');
  const recognitionRef = useRef(null);
  const isRecognitionActiveRef = useRef(false);
  const shouldBeListeningRef = useRef(false);
  const restartTimerRef = useRef(null);
  const noSpeechRetryRef = useRef(0);
  const heardSpeechRef = useRef(false);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const scheduleRecognitionRestart = useCallback((reason) => {
    if (!shouldBeListeningRef.current || !recognitionRef.current) return;
    if (restartTimerRef.current) return;

    const delay = Math.min(1200 + (noSpeechRetryRef.current * 400), 2500);
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;
      if (!shouldBeListeningRef.current || !recognitionRef.current || isRecognitionActiveRef.current) {
        return;
      }
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('[STT Auto-restart Error]', e.message);
      }
    }, delay);
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.error('[STT] recognitionRef is null — not initialized.');
      return;
    }

    if (resumeAudioContext) resumeAudioContext();
    clearRestartTimer();
    noSpeechRetryRef.current = 0;
    heardSpeechRef.current = false;

    if (isRecognitionActiveRef.current) {
      setIsListening(true);
      if (onListeningStateChange) onListeningStateChange(true);
      return;
    }

    shouldBeListeningRef.current = true;

    const micPromise = ensureMicAccess ? ensureMicAccess() : Promise.resolve();

    micPromise
      .then(() => {
        if (resumeAudioContext) resumeAudioContext();
        if (!shouldBeListeningRef.current || isRecognitionActiveRef.current) return;
        try {
          isRecognitionActiveRef.current = true;
          recognitionRef.current.start();
          setIsListening(true);
          if (onListeningStateChange) onListeningStateChange(true);
        } catch (e) {
          console.error('[STT Error] Failed to start:', e.message);
          isRecognitionActiveRef.current = false;
          shouldBeListeningRef.current = false;
          clearRestartTimer();
        }
      })
      .catch(() => {
        shouldBeListeningRef.current = false;
        clearRestartTimer();
        setIsListening(false);
        if (onListeningStateChange) onListeningStateChange(false);
      });
  }, [clearRestartTimer, ensureMicAccess, onListeningStateChange, resumeAudioContext]);

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    clearRestartTimer();
    setIsListening(false);
    if (onListeningStateChange) onListeningStateChange(false);

    if (!recognitionRef.current || !isRecognitionActiveRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error('[STT Error] Failed to stop:', e.message);
    }
  }, [clearRestartTimer, onListeningStateChange]);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = '';
    accumulatedRef.current = '';
    sessionFinalsRef.current = '';
    setTranscript('');
  }, []);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.error('[STT] Not supported in this browser.');
      toast.error('Speech recognition is not supported. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isRecognitionActiveRef.current = true;
      heardSpeechRef.current = false;
      setIsListening(true);
    };

    recognition.onend = () => {
      isRecognitionActiveRef.current = false;
      if (shouldBeListeningRef.current) {
        scheduleRecognitionRestart('onend');
      } else {
        setIsListening(false);
      }
    };

    recognition.onspeechstart = () => {
      heardSpeechRef.current = true;
      noSpeechRetryRef.current = 0;
      if (onSpeechStart) onSpeechStart();
    };

    recognition.onresult = (event) => {
      let newFinals = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinals += text + ' ';
        } else {
          currentInterim += text;
        }
      }

      if (newFinals) {
        sessionFinalsRef.current = (sessionFinalsRef.current + newFinals).trimEnd();
        heardSpeechRef.current = true;
        noSpeechRetryRef.current = 0;
      }

      const pastText = accumulatedRef.current;
      const displayText = [pastText, sessionFinalsRef.current, currentInterim]
        .map(t => t.trim())
        .filter(Boolean)
        .join(' ');

      transcriptRef.current = [pastText, sessionFinalsRef.current]
        .map(t => t.trim())
        .filter(Boolean)
        .join(' ');

      setTranscript(displayText);

      if (currentInterim) {
        heardSpeechRef.current = true;
        noSpeechRetryRef.current = 0;
      }
    };

    recognition.onspeechend = () => {
      if (sessionFinalsRef.current) {
        accumulatedRef.current = [accumulatedRef.current, sessionFinalsRef.current]
          .map(t => t.trim())
          .filter(Boolean)
          .join(' ');
        sessionFinalsRef.current = '';
      }
      transcriptRef.current = accumulatedRef.current;
    };

    recognition.onerror = (event) => {
      console.error('[STT Error]', event.error, event);

      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Click padlock icon → Allow microphone → Refresh.', { duration: 8000 });
        shouldBeListeningRef.current = false;
        isRecognitionActiveRef.current = false;
        clearRestartTimer();
        setIsListening(false);
        if (onListeningStateChange) onListeningStateChange(false);
      } else if (event.error === 'no-speech') {
        isRecognitionActiveRef.current = false;

        if (!heardSpeechRef.current) {
          noSpeechRetryRef.current += 1;
          if (noSpeechRetryRef.current >= 5) {
            clearRestartTimer();
            shouldBeListeningRef.current = false;
            setIsListening(false);
            if (onListeningStateChange) onListeningStateChange(false);
            console.warn('[STT] Could not detect voice after retries.');
            return;
          }
        } else {
          noSpeechRetryRef.current = 0;
        }

        if (!heardSpeechRef.current && noSpeechRetryRef.current % 2 === 1 && refreshMicStream) {
          refreshMicStream().finally(() => {
            scheduleRecognitionRestart('no-speech');
          });
          return;
        }

        scheduleRecognitionRestart('no-speech');
      } else if (event.error === 'aborted') {
        isRecognitionActiveRef.current = false;
      } else {
        console.error('[STT] Unknown error:', event.error);
        isRecognitionActiveRef.current = false;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldBeListeningRef.current = false;
      clearRestartTimer();
      try { recognition.stop(); } catch (_) {}
    };
  }, [clearRestartTimer, language, onListeningStateChange, refreshMicStream, scheduleRecognitionRestart]);

  // Language update
  useEffect(() => {
    if (recognitionRef.current && recognitionRef.current.lang !== language) {
      recognitionRef.current.lang = language;
      if (isRecognitionActiveRef.current) {
        stopListening();
        setTimeout(() => startListening(), 250);
      }
    }
  }, [language, startListening, stopListening]);

  return {
    isListening,
    transcript,
    transcriptRef,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
};

export default useVoiceSTT;
