import { dataStore } from "@/libs/data-store";

export async function GET() {
  const stats = dataStore.getStats();

  return Response.json({
    ...stats,
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
}
