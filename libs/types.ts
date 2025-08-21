export interface Message {
  id: string;
  content: string;
  room: string;
  timestamp: number;
  author: string;
  source?: "user" | "webhook";
}

export interface SSEEvent {
  type: "message" | "ping" | "error";
  data?: any;
}

export interface ConnectionStatus {
  connected: boolean;
  lastPing?: number;
  reconnectAttempts: number;
}
