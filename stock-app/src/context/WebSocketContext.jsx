import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);
export const useLivePrices = () => useContext(WebSocketContext);

// גוזר את URL ה-WebSocket מ-VITE_API_URL
function getWsUrl() {
  const apiUrl = import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:5000/api');
  // https://host/api → wss://host
  return apiUrl.replace(/^http/, 'ws').replace(/\/api$/, '');
}

export function WebSocketProvider({ children }) {
  const { user } = useAuth();
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const retryCount = useRef(0);
  const pendingSubscriptions = useRef(new Set());

  const [livePrices, setLivePrices] = useState({});
  const [wsStatus, setWsStatus] = useState('disconnected');

  const scheduleReconnect = useCallback(() => {
    if (retryCount.current >= 15) return;
    const delay = Math.min(1000 * 2 ** retryCount.current, 30000);
    retryCount.current += 1;
    reconnectTimer.current = setTimeout(connect, delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = useCallback(() => {
    if (!user) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      retryCount.current = 0;
      if (pendingSubscriptions.current.size > 0) {
        ws.send(JSON.stringify({
          type: 'subscribe',
          symbols: [...pendingSubscriptions.current]
        }));
        pendingSubscriptions.current.clear();
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'price') {
          setLivePrices((prev) => ({
            ...prev,
            [msg.symbol]: {
              price: msg.price,
              changePercent: msg.changePercent,
              currency: msg.currency
            }
          }));
        }
      } catch {}
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      scheduleReconnect();
    };

    ws.onerror = () => {
      setWsStatus('error');
      ws.close();
    };
  }, [user, scheduleReconnect]);

  const subscribe = useCallback((symbols) => {
    const syms = Array.isArray(symbols) ? symbols : [symbols];
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', symbols: syms }));
    } else {
      syms.forEach((s) => pendingSubscriptions.current.add(s.toUpperCase()));
    }
  }, []);

  const unsubscribe = useCallback((symbols) => {
    const syms = Array.isArray(symbols) ? symbols : [symbols];
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', symbols: syms }));
    }
    syms.forEach((s) => pendingSubscriptions.current.delete(s.toUpperCase()));
  }, []);

  useEffect(() => {
    if (user) {
      connect();
    } else {
      wsRef.current?.close();
      setLivePrices({});
      setWsStatus('disconnected');
    }
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [user, connect]);

  // חזרה לטאב → נסה להתחבר מחדש
  useEffect(() => {
    const onVisible = () => {
      if (
        document.visibilityState === 'visible' &&
        user &&
        wsRef.current?.readyState !== WebSocket.OPEN
      ) {
        retryCount.current = 0;
        clearTimeout(reconnectTimer.current);
        connect();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user, connect]);

  return (
    <WebSocketContext.Provider value={{ livePrices, subscribe, unsubscribe, wsStatus }}>
      {children}
    </WebSocketContext.Provider>
  );
}
