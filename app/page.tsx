"use client";

import { useMessages } from "../hooks/useMessages";
import { useUserId } from "../hooks/useUserId";
import { useState } from "react";

const rooms = ["default", "room-1", "room-2", "room-3"];

export default function Home() {
  const userId = useUserId();
  const [room, setRoom] = useState("default");
  const { messages, onlineUsers } = useMessages(userId, room);
  const [text, setText] = useState("");

  const sendMessage = async () => {
    if (!text.trim() || !userId) return;

    await fetch("/api/send", {
      method: "POST",
      body: JSON.stringify({ text, sender: userId, room }),
      headers: { "Content-Type": "application/json" },
    });
    setText("");
  };

  return (
    <main className="flex flex-col items-center min-h-screen p-6 bg-gray-100 text-black">
      <h1 className="text-2xl font-bold mb-4">💬 Multi-Room Chat</h1>

      {/* Room Selector */}
      <div className="mb-4">
        {rooms.map((r) => (
          <label key={r} className="mr-4 cursor-pointer">
            <input
              type="radio"
              name="room"
              value={r}
              checked={room === r}
              onChange={() => setRoom(r)}
              className="mr-1"
            />
            {r}
          </label>
        ))}
      </div>

      {/* Chat + Online Users */}
      <div className="flex gap-4 w-full max-w-3xl">
        {/* Chat Box */}
        <div className="border rounded w-full h-96 overflow-y-auto p-3 bg-white shadow">
          {messages.map((m, i) => {
            const isMe = m.sender === userId;
            return (
              <div
                key={i}
                className={`flex mb-2 ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                    isMe
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-200 text-black rounded-bl-none"
                  }`}
                >
                  <p>{m.text}</p>
                  <span className="block text-xs text-gray-600 mt-1">
                    {new Date(m.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Online Users */}
        <div className="w-40 border rounded p-2 bg-white shadow">
          <h2 className="font-semibold text-sm mb-2">👥 Online</h2>
          {onlineUsers.map((u) => (
            <p
              key={u}
              className={`text-xs ${
                u === userId ? "font-bold text-blue-600" : "text-gray-800"
              }`}
            >
              {u === userId ? "You" : u}
            </p>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 w-full max-w-3xl mt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border p-2 rounded flex-1"
          placeholder={`Message in ${room}...`}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </main>
  );
}