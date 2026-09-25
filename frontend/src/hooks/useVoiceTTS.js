import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for Text-To-Speech (TTS) using window.speechSynthesis
 * Enhanced for WebSocket streaming and barge-in interruption handling.
 * @param {string} persona - Interviewer style ('strict' | 'friendly' | 'standard')
 */
export const useVoiceTTS = (persona = 'standard') => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch (_) {}
    }
    setIsSpeaking(false);
  }, []);

  /**
   * Instantly cancel ongoing voice output when candidate interrupts (barge-in)
   */
  const handleInterruption = useCallback(() => {
    stopSpeaking();
  }, [stopSpeaking]);

  /**
   * Appends incoming real-time token chunks streamed via WebSocket
   */
  const appendStreamedChunk = useCallback((chunk, isFirstToken = false) => {
    setAiMessage((prev) => (isFirstToken ? chunk : prev + chunk));
  }, []);

  const speakText = useCallback((text, callback) => {
    if (!synthRef.current || !text) {
      if (callback) callback();
      return;
    }

    try {
      synthRef.current.cancel();
    } catch (_) {}

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(
      v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural') || v.name.includes('Female'))
    );
    if (preferred) utterance.voice = preferred;

    utterance.rate = 1.0;
    utterance.pitch = persona === 'strict' ? 0.85 : persona === 'friendly' ? 1.15 : 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };

    utterance.onerror = (e) => {
      console.warn('[TTS Notice]', e.error || e.message || 'Speech canceled');
      setIsSpeaking(false);
      if (callback) callback();
    };

    setAiMessage(text);
    synthRef.current.speak(utterance);
  }, [persona]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  return {
    isSpeaking,
    aiMessage,
    speakText,
    stopSpeaking,
    handleInterruption,
    appendStreamedChunk,
    setAiMessage,
  };
};

export default useVoiceTTS;
