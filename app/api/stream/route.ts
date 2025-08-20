// export const runtime = "edge"; // If this is active, then the localhost is not updating the UI as well as on vercel deployment

import { NextRequest } from "next/server";

interface Client {
  userId: string;
  send: (msg: string) => void;
}

const rooms: Record<string, Client[]> = {};

export function broadcast(room: string, data: any) {
  const payload = JSON.stringify(data);
  console.log(`Broadcasting to room ${room}:`, payload);
  rooms[room]?.forEach(({ send }) => send(payload));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "anon";
  const room = searchParams.get("room") || "default";

  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const send = (msg: string) => {
          controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
        };

        if (!rooms[room]) rooms[room] = [];
        rooms[room].push({ userId, send });

        // notify presence
        broadcast(room, {
          type: "onlineUsers",
          users: rooms[room].map((c) => c.userId),
        });

        // initial system message
        send(
          JSON.stringify({
            type: "message",
            sender: "system",
            text: `👋 ${userId} joined room: ${room}`,
            timestamp: new Date().toISOString(),
          })
        );

        req.signal.addEventListener("abort", () => {
          rooms[room] = rooms[room].filter((c) => c.userId !== userId);
          broadcast(room, {
            type: "onlineUsers",
            users: rooms[room].map((c) => c.userId),
          });
        });
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
}

export async function POST(req: NextRequest) {
    const { text, sender, room } = await req.json();
    broadcast(room, {
        type: "message",
        text,
        sender,
        timestamp: new Date().toISOString(),
    });
    return new Response("ok");
}