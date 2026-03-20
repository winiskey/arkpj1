import { WebSocketServer } from "ws";

const HEARTBEAT_INTERVAL_MS = 30_000;

export function createWebSocketManager() {
  let wss = null;
  let heartbeatTimer = null;
  const clients = new Set();

  function broadcast(eventType, payload) {
    const message = JSON.stringify({ event: eventType, data: payload, time: new Date().toISOString() });
    for (const ws of clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    }
  }

  function startHeartbeat() {
    heartbeatTimer = setInterval(() => {
      for (const ws of clients) {
        if (!ws.isAlive) {
          clients.delete(ws);
          ws.terminate();
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  function attach(httpServer, getSnapshot) {
    wss = new WebSocketServer({ server: httpServer, path: "/ws" });

    wss.on("connection", async (ws) => {
      ws.isAlive = true;
      clients.add(ws);

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("close", () => {
        clients.delete(ws);
      });

      ws.on("error", () => {
        clients.delete(ws);
      });

      // Send initial snapshot on connect
      try {
        const snapshot = await getSnapshot();
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ event: "snapshot", data: snapshot, time: new Date().toISOString() }));
        }
      } catch (error) {
        console.error("Failed to send WebSocket snapshot:", error);
      }
    });

    startHeartbeat();
    console.log("WebSocket server attached on /ws");
  }

  function close() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    for (const ws of clients) {
      ws.terminate();
    }
    clients.clear();
    if (wss) {
      wss.close();
      wss = null;
    }
  }

  return { attach, broadcast, close, get clientCount() { return clients.size; } };
}
