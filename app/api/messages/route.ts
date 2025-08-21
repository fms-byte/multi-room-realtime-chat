import { NextRequest } from "next/server";
import { dataStore } from "@/libs/data-store";
import { Message } from "@/libs/types";

export async function GET(request: NextRequest) {
  // Get messages for a room
  const { searchParams } = new URL(request.url);
  const room = searchParams.get("room");

  if (!room) {
    return Response.json({ error: "Room parameter is required" }, { status: 400 });
  }

  const messages = dataStore.getMessages(room);
  return Response.json(messages);
}

export async function POST(request: NextRequest) {
  // Send a new message
  const { content, room, author } = await request.json();

  if (!content || !room || !author) {
    return Response.json({
      error: "Content, room, and author are required",
    }, { status: 400 });
  }

  const message: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content: content.trim(),
    room,
    timestamp: Date.now(),
    author,
    source: "user",
  };

  // Add message to store (this will also broadcast via SSE)
  dataStore.addMessage(message);

  return Response.json(message, { status: 201 });
}
