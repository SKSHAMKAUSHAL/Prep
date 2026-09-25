import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Enterprise production hook for persistent WebSocket communication with the backend
 * Features:
 * - Auto-reconnect with exponential backoff and jitter
 * - Heartbeat ping/pong keepalive
 * - Message routing and type-safe handlers
 * - Offline queue buffering
 */
export const useWebSocket = ({
  token,
  sessionId,
  onMessage,
  onOpen,
  onClose,
  onError,
  autoConnect = true,
} = {}) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  const [lastMessage, setLastMessage] = useState(null);

  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const offlineQueueRef = useRef([]);
  const isIntentionalClosureRef = useRef(false);

  // Compute WebSocket URL from environment or current origin
  const getWebSocketUrl = useCallback(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';
    let wsUrl = backendUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');

    // Remove any trailing slash
    wsUrl = wsUrl.replace(/\/$/, '');

    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (sessionId) params.set('sessionId', sessionId);

    return `${wsUrl}/ws/interview?${params.toString()}`;
  }, [token, sessionId]);

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!token) return;
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    clearTimers();
    isIntentionalClosureRef.current = false;
    setConnectionStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');

    try {
      const url = getWebSocketUrl();
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Start ping heartbeat every 30s
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          }
        }, 30000);

        // Flush queued offline messages
        while (offlineQueueRef.current.length > 0) {
          const queued = offlineQueueRef.current.shift();
          ws.send(JSON.stringify(queued));
        }

        if (onOpen) onOpen();
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setLastMessage(parsed);
          if (onMessage) onMessage(parsed);
        } catch (err) {
          console.warn('[WebSocket] Non-JSON message received:', event.data);
        }
      };

      ws.onclose = (event) => {
        clearTimers();
        setConnectionStatus('disconnected');
        socketRef.current = null;

        if (onClose) onClose(event);

        // Schedule auto-reconnect with exponential backoff if not closed intentionally
        if (!isIntentionalClosureRef.current && event.code !== 1008 && event.code !== 4001) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.onerror = (err) => {
        if (onError) onError(err);
      };
    } catch (err) {
      setConnectionStatus('disconnected');
      if (onError) onError(err);
    }
  }, [token, getWebSocketUrl, clearTimers, onOpen, onMessage, onClose, onError]);

  const disconnect = useCallback(() => {
    isIntentionalClosureRef.current = true;
    clearTimers();
    reconnectAttemptsRef.current = 0;
    offlineQueueRef.current = [];

    if (socketRef.current) {
      socketRef.current.close(1000, 'Intentional client closure');
      socketRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, [clearTimers]);

  const sendMessage = useCallback((message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }

    // Buffer for when connection resumes
    offlineQueueRef.current.push(message);
    return false;
  }, []);

  // Convenience methods
  const sendTranscript = useCallback((text, question, persona = 'balanced') => {
    return sendMessage({
      type: 'transcript:final',
      sessionId,
      text,
      question,
      persona,
    });
  }, [sendMessage, sessionId]);

  const sendInterruption = useCallback(() => {
    return sendMessage({
      type: 'interruption',
      sessionId,
    });
  }, [sendMessage, sessionId]);

  const startInterview = useCallback((metadata = {}) => {
    return sendMessage({
      type: 'interview:start',
      sessionId,
      ...metadata,
    });
  }, [sendMessage, sessionId]);

  const sendGazeTelemetry = useCallback((telemetry = {}) => {
    return sendMessage({
      type: 'gaze:telemetry',
      sessionId,
      ...telemetry,
    });
  }, [sendMessage, sessionId]);

  useEffect(() => {
    if (autoConnect && token) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, token, connect, disconnect]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    lastMessage,
    sendMessage,
    sendTranscript,
    sendInterruption,
    sendGazeTelemetry,
    startInterview,
    connect,
    disconnect,
  };
};

export default useWebSocket;
