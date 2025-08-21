"use client";
import { useState, useEffect } from "react";
import { Chat } from "@/components/Chat";
import { MessageCircle, Activity, Server, ToolCase } from "lucide-react";

const ROOMS = ["Room A", "Room B", "Room C"];

interface Stats {
  totalMessages: number;
  totalClients: number;
  messagesByRoom: Record<string, number>;
  uptime: number;
}

export default function Home() {
  const [activeRoom, setActiveRoom] = useState(ROOMS[0]);
  const [stats, setStats] = useState<Stats | null>(null);

  // Fetch stats periodically
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    SSE + SWR Chat
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">
                    Real-time messaging with Server-Sent Events and SWR
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="hidden md:flex items-center space-x-6">
                <div className="flex items-center space-x-8 text-sm">
                  <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-700">
                      {stats.totalClients} online
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-700">
                      {stats.totalMessages} messages
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                    <Server className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-700">
                      {Math.floor(stats.uptime / 60)}min uptime
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Stats */}
          {stats && (
            <div className="md:hidden mt-4 flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded border border-green-200">
                <Activity className="w-3 h-3 text-green-600" />
                <span className="font-medium text-green-700">
                  {stats.totalClients}
                </span>
              </div>
              <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                <MessageCircle className="w-3 h-3 text-blue-600" />
                <span className="font-medium text-blue-700">
                  {stats.totalMessages}
                </span>
              </div>
              <div className="flex items-center space-x-1 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                <Server className="w-3 h-3 text-purple-600" />
                <span className="font-medium text-purple-700">
                  {Math.floor(stats.uptime / 60)}m
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Room Selector */}
            <div className="">
              <div className="flex items-center justify-center">
                <div className="flex space-x-2 bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-sm border border-gray-200/50">
                  {ROOMS.map((room) => (
                    <button
                      key={room}
                      onClick={() => setActiveRoom(room)}
                      className={`relative px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        activeRoom === room
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md transform scale-105"
                          : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
                      }`}
                    >
                      <span className="relative z-10">{room}</span>
                      {stats?.messagesByRoom[room] && (
                        <span
                          className={`ml-2 text-xs px-2 py-1 rounded-full font-bold ${
                            activeRoom === room
                              ? "bg-white/20 text-white"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {stats.messagesByRoom[room]}
                        </span>
                      )}
                      {activeRoom === room && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl opacity-20 blur-xl"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Chat room={activeRoom} />
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Technical Stack - Compact */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 shadow-sm gap-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <ToolCase className="w-5 h-5 text-blue-600" />
                <span>Tech Stack</span>
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full border border-blue-200">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-blue-800">SSE</span>
                </div>
                <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full border border-green-200">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-green-800">
                    SWR
                  </span>
                </div>
                <div className="flex items-center space-x-1 bg-purple-100 px-2 py-1 rounded-full border border-purple-200">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span className="text-xs font-medium text-purple-800">
                    Next.js 15
                  </span>
                </div>
                <div className="flex items-center space-x-1 bg-orange-100 px-2 py-1 rounded-full border border-orange-200">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span className="text-xs font-medium text-orange-800">
                    In-memory
                  </span>
                </div>
                <div className="flex items-center space-x-1 bg-indigo-100 px-2 py-1 rounded-full border border-indigo-200">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  <span className="text-xs font-medium text-indigo-800">
                    Optimistic UI
                  </span>
                </div>
                <div className="flex items-center space-x-1 bg-red-100 px-2 py-1 rounded-full border border-red-200">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-medium text-red-800">
                    Auto-reconnect
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>How to Test</span>
              </h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-bold text-xs">1</span>
                  </div>
                  <span>
                    Open multiple browser tabs to see real-time messaging
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 font-bold text-xs">2</span>
                  </div>
                  <span>Switch between rooms to test isolation</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 font-bold text-xs">3</span>
                  </div>
                  <span>Use webhook endpoint to inject external messages</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 font-bold text-xs">4</span>
                  </div>
                  <span>
                    Test connection resilience by going offline/online
                  </span>
                </li>
              </ul>
            </div>

            {/* Webhook Testing */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Server className="w-5 h-5 text-purple-600" />
                <span>Webhook Testing</span>
              </h3>
              <div className="space-y-4">
                {/* <div>
                  <p className="text-sm text-gray-600 mb-3 font-medium">
                    Test webhook with curl:
                  </p>
                  <div className="bg-gray-900 p-4 rounded-xl text-xs font-mono text-green-400 overflow-x-auto">
                    <div className="break-all">
                      {`curl -X POST ${
                        typeof window !== "undefined"
                          ? window.location.origin
                          : "http://localhost:3000"
                      }/api/webhook \\`}
                    </div>
                    <div className="text-blue-400 mt-1">
                      {`  -H "Content-Type: application/json" \\`}
                    </div>
                    <div className="text-yellow-400 mt-1">
                      {`  -d '{"content":"Hello!","room":"${activeRoom}","author":"Bot"}'`}
                    </div>
                  </div>
                </div> */}

                <div>
                  <p className="text-sm text-gray-600 mb-3 font-medium">
                    Or use this form:
                  </p>
                  <WebhookForm room={activeRoom} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Webhook testing form component
function WebhookForm({ room }: { room: string }) {
  const [message, setMessage] = useState("");
  const [author, setAuthor] = useState("Webhook Bot");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setSuccess(false);
    try {
      const response = await fetch("/api/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: message,
          room: room,
          author: author,
        }),
      });

      if (response.ok) {
        setMessage("");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        alert("Failed to send webhook message");
      }
    } catch (error) {
      console.error("Webhook error:", error);
      alert("Failed to send webhook message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Bot name"
        className="w-full px-4 py-2 text-sm bg-white border text-gray-800 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Webhook message content"
        rows={3}
        className="w-full px-4 py-2 text-sm bg-white border text-gray-800 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
      />
      <button
        type="submit"
        disabled={!message.trim() || loading}
        className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
          success
            ? "bg-green-500 text-white"
            : loading
            ? "bg-purple-400 text-white cursor-not-allowed"
            : "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        } disabled:opacity-50`}
      >
        {success ? "✓ Sent!" : loading ? "Sending..." : "Send Webhook"}
      </button>
    </form>
  );
}
