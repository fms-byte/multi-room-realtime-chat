import { NextRequest } from "next/server";
import { dataStore } from "@/libs/data-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") || Math.random().toString(36).substring(2, 9);

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Create a mock response object for the data store
      const mockResponse = new Response(null, {}) as Response & {
        body: {
          getWriter: () => {
            write: (chunk: Uint8Array) => void;
            close: () => void;
          };
        };
      };

      // Override the body property to include our controller
      Object.defineProperty(mockResponse, "body", {
        value: {
          getWriter: () => ({
            write: (chunk: Uint8Array) => {
              try {
                controller.enqueue(chunk);
              } catch (error) {
                console.error("Error writing to stream:", error);
              }
            },
            close: () => {
              try {
                controller.close();
              } catch (error) {
                // Stream might already be closed
              }
            },
          }),
        },
      });

      // Add client to data store
      dataStore.addClient(clientId, mockResponse);

      // Clean up on stream close
      const cleanup = () => {
        dataStore.removeClient(clientId);
        try {
          controller.close();
        } catch (error) {
          // Stream might already be closed
        }
      };

      // Handle cleanup when the stream is cancelled
      request.signal?.addEventListener("abort", cleanup);
    },
  });

  // Return the SSE response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}
