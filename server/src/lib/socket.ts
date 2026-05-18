import type { Server } from "bun";

class EventBus {
  private server: Server<any> | null = null;

  setServer(server: Server<any>) {
    this.server = server;
  }

  publish(topic: string, payload: any) {
    if (!this.server) return;
    this.server.publish(topic, JSON.stringify(payload));
  }
}

export const eventBus = new EventBus();
