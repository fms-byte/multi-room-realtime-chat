import { useEffect, useState } from "react";

export interface Message {
  type: "message";
  text: string;
  sender: string;
  timestamp: string;
}

export function useMessages(userId: string, room: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    const evtSource = new EventSource(
      `/api/stream?userId=${userId}&room=${room}`
    );
    setMessages([]);
    setOnlineUsers([]);

    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("SSE Event:", data);
      if (data.type === "message") {
        setMessages((prev) => [...prev, data]);
      } else if (data.type === "onlineUsers") {
        setOnlineUsers(data.users);
      }
    };

    return () => evtSource.close();
  }, [userId, room]);

  return { messages, onlineUsers };
}
