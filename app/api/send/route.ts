import { broadcast } from "../stream/route";

export async function POST(req: Request) {
  const data = await req.json();

  const newMessage = {
    type: "message",
    text: data.text,
    sender: data.sender || "anonymous",
    timestamp: new Date().toISOString(),
  };

  const selectedRoom = data.room || "default";

  // Broadcast to all connected SSE clients
  broadcast(selectedRoom, newMessage);

  return Response.json({ ok: true });
}
