import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for microphone input streaming, device enumeration, and audio level measurement
 */
export const useMicMeter = () => {
  const [micDevices, setMicDevices] = useState([]);
  const [selectedMicId, setSelectedMicId] = useState('');
  const [isMicLoading, setIsMicLoading] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micEnergyActive, setMicEnergyActive] = useState(false);
  const [activeMicLabel, setActiveMicLabel] = useState('');

  const micStreamRef = useRef(null);
  const micAccessPromiseRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const meterRafRef = useRef(null);
  const micSourceRef = useRef(null);

  const stopMicMeter = useCallback(() => {
    if (meterRafRef.current) {
      cancelAnimationFrame(meterRafRef.current);
      meterRafRef.current = null;
    }
    if (micSourceRef.current) {
      try { micSourceRef.current.disconnect(); } catch (_) {}
      micSourceRef.current = null;
    }
    if (analyserRef.current) {
      try { analyserRef.current.disconnect(); } catch (_) {}
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (_) {}
      audioContextRef.current = null;
    }
    setMicLevel(0);
    setMicEnergyActive(false);
  }, []);

  const resumeAudioContext = useCallback(() => {
    const context = audioContextRef.current;
    if (!context || context.state !== 'suspended') return;
    context.resume().catch((err) => {
      console.error('[Mic] Failed to resume AudioContext:', err);
    });
  }, []);

  const startMicMeter = useCallback((stream) => {
    if (!stream) return;
    stopMicMeter();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = context;
    analyserRef.current = analyser;
    micSourceRef.current = source;

    context.resume().catch((err) => {
      console.error('[Mic] Failed to resume AudioContext:', err);
    });

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sumSquares = 0;
      for (let i = 0; i < data.length; i += 1) {
        const centered = (data[i] - 128) / 128;
        sumSquares += centered * centered;
      }
      const rms = Math.sqrt(sumSquares / data.length);
      setMicLevel(rms);
      setMicEnergyActive(rms > 0.01);
      meterRafRef.current = requestAnimationFrame(tick);
    };
    meterRafRef.current = requestAnimationFrame(tick);
  }, [stopMicMeter]);

  const stopMicStream = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    stopMicMeter();
  }, [stopMicMeter]);

  const ensureMicAccess = useCallback(async () => {
    if (micStreamRef.current) return micStreamRef.current;
    if (!navigator.mediaDevices?.getUserMedia) return null;

    if (!micAccessPromiseRef.current) {
      const baseConstraints = selectedMicId ? { deviceId: { ideal: selectedMicId } } : {};
      const audioConstraints = {
        ...baseConstraints,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };

      micAccessPromiseRef.current = navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
        .then((stream) => {
          micStreamRef.current = stream;
          startMicMeter(stream);
          return stream;
        })
        .catch((err) => {
          console.error('[Mic] Failed to acquire microphone:', err);
          toast.error('Could not access microphone. Check browser permissions and input device.');
          throw err;
        })
        .finally(() => {
          micAccessPromiseRef.current = null;
        });
    }
    return micAccessPromiseRef.current;
  }, [selectedMicId, startMicMeter]);

  const refreshMicStream = useCallback(async () => {
    stopMicStream();
    try {
      await ensureMicAccess();
    } catch (err) {
      console.error('[Mic] Failed to refresh microphone stream:', err);
    }
  }, [ensureMicAccess, stopMicStream]);

  const loadMicDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    setIsMicLoading(true);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      setMicDevices(audioInputs);
      if (!selectedMicId && audioInputs.length) {
        setSelectedMicId(audioInputs[0].deviceId);
      }
    } catch (err) {
      console.error('[Mic] Failed to enumerate devices:', err);
    } finally {
      setIsMicLoading(false);
    }
  }, [selectedMicId]);

  useEffect(() => {
    const active = micDevices.find(device => device.deviceId === selectedMicId);
    setActiveMicLabel(active?.label || (selectedMicId ? 'Unknown microphone' : ''));
  }, [micDevices, selectedMicId]);

  // Permission query & device change listeners
  useEffect(() => {
    if (!navigator.permissions) return;
    navigator.permissions.query({ name: 'microphone' }).then((result) => {
      if (result.state === 'denied') {
        toast.error('Microphone is blocked. Go to browser settings → Allow microphone for this site.', { duration: 10000 });
      }
      loadMicDevices();
      result.onchange = () => loadMicDevices();
    }).catch(err => {
      console.error('[Permission] Could not query mic permission:', err);
    });
  }, [loadMicDevices]);

  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return;
    const handleDeviceChange = () => loadMicDevices();
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
  }, [loadMicDevices]);

  useEffect(() => {
    return () => {
      stopMicStream();
    };
  }, [stopMicStream]);

  const micLevelPercent = Math.min(Math.round(micLevel * 100), 100);

  return {
    micDevices,
    selectedMicId,
    setSelectedMicId,
    isMicLoading,
    micLevel,
    micLevelPercent,
    micEnergyActive,
    activeMicLabel,
    loadMicDevices,
    ensureMicAccess,
    refreshMicStream,
    stopMicStream,
    resumeAudioContext,
  };
};

export default useMicMeter;
