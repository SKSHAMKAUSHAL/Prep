import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for Text-To-Speech (TTS) using window.speechSynthesis
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
      v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Female'))
    );
    if (preferred) utterance.voice = preferred;

    utterance.rate = 0.95;
    utterance.pitch = persona === 'strict' ? 0.8 : persona === 'friendly' ? 1.2 : 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };

    utterance.onerror = (e) => {
      console.error('[TTS Error]', e);
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
    setAiMessage,
  };
};

export default useVoiceTTS;
