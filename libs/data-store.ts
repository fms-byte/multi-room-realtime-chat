import { Message } from "./types";

// In-memory storage for demo purposes
class DataStore {
  private messages: Message[] = [];
  private clients: Map<string, Response> = new Map();

  // Message management
  addMessage(message: Message): void {
    this.messages.push(message);
    // Keep only last 100 messages per room to prevent memory issues
    const roomMessages = this.messages.filter((m) => m.room === message.room);
    if (roomMessages.length > 100) {
      const oldestId = roomMessages[0].id;
      this.messages = this.messages.filter((m) => m.id !== oldestId);
    }
    this.broadcastMessage(message);
  }

  getMessages(room: string): Message[] {
    return this.messages
      .filter((message) => message.room === room)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  getAllMessages(): Message[] {
    return this.messages.sort((a, b) => a.timestamp - b.timestamp);
  }

  // SSE client management
  addClient(clientId: string, response: Response): void {
    this.clients.set(clientId, response);

    // Send initial ping
    this.sendToClient(clientId, {
      type: "ping",
      data: { timestamp: Date.now() },
    });

    console.log(
      `Client ${clientId} connected. Total clients: ${this.clients.size}`
    );
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(
      `Client ${clientId} disconnected. Total clients: ${this.clients.size}`
    );
  }

  // Broadcasting
  private broadcastMessage(message: Message): void {
    const event = {
      type: "message" as const,
      data: message,
    };

    this.clients.forEach((response, clientId) => {
      this.sendToClient(clientId, event);
    });
  }

  broadcast(event: any): void {
    this.clients.forEach((response, clientId) => {
      this.sendToClient(clientId, event);
    });
  }

  private sendToClient(clientId: string, event: any): void {
    const response = this.clients.get(clientId);
    if (!response) return;

    try {
      // Node.js Response does not have a .body.getWriter(), so we use .write directly
      const data = `data: ${JSON.stringify(event)}\n\n`;
      // @ts-ignore: Node.js Response may not have .write, but this is for SSE
      if (typeof (response as any).write === "function") {
        (response as any).write(data);
      }
    } catch (error) {
      console.error(`Error sending to client ${clientId}:`, error);
      this.removeClient(clientId);
    }
  }

  // Health check - send ping to all clients
  sendPingToAll(): void {
    const event = {
      type: "ping",
      data: { timestamp: Date.now() },
    };
    this.broadcast(event);
  }

  getStats() {
    return {
      totalMessages: this.messages.length,
      totalClients: this.clients.size,
      messagesByRoom: this.messages.reduce((acc, msg) => {
        acc[msg.room] = (acc[msg.room] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

// Global store instance
export const dataStore = new DataStore();

// Initialize periodic ping to keep connections alive
if (typeof window === "undefined") {
  setInterval(() => {
    dataStore.sendPingToAll();
  }, 30000); // Ping every 30 seconds
}
