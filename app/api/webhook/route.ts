import { NextRequest } from "next/server";
import { dataStore } from "@/libs/data-store";
import { Message } from "@/libs/types";

export async function POST(request: NextRequest) {
  const { content, room, author = "Webhook Bot" } = await request.json();

  if (!content || !room) {
    return Response.json({
      error: "Content and room are required",
    }, { status: 400 });
  }

  const message: Message = {
    id: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content: content.trim(),
    room,
    timestamp: Date.now(),
    author,
    source: "webhook",
  };

  // Add message to store (this will broadcast via SSE)
  dataStore.addMessage(message);

  return Response.json({
    success: true,
    message,
    stats: dataStore.getStats(),
  });
}
