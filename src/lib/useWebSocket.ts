import { useEffect, useRef, useState, useCallback } from "react";

export type WsEventType = "snapshot" | "score:updated" | "match:updated" | "live:updated" | "team:updated";

export interface WsMessage<T = unknown> {
  event: WsEventType;
  data: T;
  time: string;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface UseWebSocketOptions {
  /** Override the WebSocket URL. Defaults to ws(s)://currentHost/ws or localhost:8787 in dev. */
  url?: string;
  /** Called for every incoming message. */
  onMessage?: (message: WsMessage) => void;
}

function resolveWsUrl(override?: string): string {
  if (override) return override;

  // In dev (Vite proxy on :3000), connect directly to the API server
  if (typeof window !== "undefined" && window.location.port === "3000") {
    return `ws://${window.location.hostname}:8787/ws`;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000];

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { url, onMessage } = options;
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const unmountedRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (unmountedRef.current) return;

    const wsUrl = resolveWsUrl(url);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setStatus("connecting");

    ws.addEventListener("open", () => {
      if (unmountedRef.current) { ws.close(); return; }
      setStatus("connected");
      retriesRef.current = 0;
    });

    ws.addEventListener("message", (event) => {
      try {
        const parsed: WsMessage = JSON.parse(event.data);
        setLastMessage(parsed);
        onMessageRef.current?.(parsed);
      } catch {
        // ignore malformed messages
      }
    });

    ws.addEventListener("close", () => {
      if (unmountedRef.current) return;
      setStatus("disconnected");
      const delay = RECONNECT_DELAYS[Math.min(retriesRef.current, RECONNECT_DELAYS.length - 1)];
      retriesRef.current += 1;
      setTimeout(connect, delay);
    });

    ws.addEventListener("error", () => {
      // The close event will fire after this, triggering reconnect
      ws.close();
    });
  }, [url]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return { status, lastMessage };
}
