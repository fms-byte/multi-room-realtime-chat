import { useEffect, useState, useRef, useCallback } from "react";
import { SSEEvent, ConnectionStatus, Message } from "@/libs/types";

export function useSSE(onMessage?: (message: Message) => void) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnectAttempts: 0,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return; // Already connected
    }

    try {
      const clientId = Math.random().toString(36).substr(2, 9);
      const eventSource = new EventSource(`/api/events?clientId=${clientId}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE connected");
        setConnectionStatus((prev) => ({
          connected: true,
          lastPing: Date.now(),
          reconnectAttempts: 0,
        }));
      };

      eventSource.onmessage = (event) => {
        try {
          const sseEvent: SSEEvent = JSON.parse(event.data);

          switch (sseEvent.type) {
            case "message":
              if (onMessage && sseEvent.data) {
                onMessage(sseEvent.data);
              }
              break;
            case "ping":
              setConnectionStatus((prev) => ({
                ...prev,
                lastPing: Date.now(),
              }));
              break;
            case "error":
              console.error("SSE error event:", sseEvent.data);
              break;
          }
        } catch (error) {
          console.error("Error parsing SSE event:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        setConnectionStatus((prev) => ({
          connected: false,
          lastPing: prev.lastPing,
          reconnectAttempts: prev.reconnectAttempts + 1,
        }));

        eventSource.close();

        // Attempt to reconnect with exponential backoff
        const currentAttempts = connectionStatus.reconnectAttempts + 1;
        if (currentAttempts <= maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, currentAttempts), 30000);
          console.log(
            `Reconnecting in ${delay}ms (attempt ${currentAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error("Max reconnection attempts reached");
        }
      };
    } catch (error) {
      console.error("Failed to create EventSource:", error);
    }
  }, [onMessage, connectionStatus.reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnectionStatus({
      connected: false,
      reconnectAttempts: 0,
    });
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setConnectionStatus((prev) => ({ ...prev, reconnectAttempts: 0 }));
    setTimeout(connect, 1000);
  }, [connect, disconnect]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionStatus,
    reconnect,
    disconnect,
  };
}
