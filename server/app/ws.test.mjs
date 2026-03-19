import { describe, it, after, before } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { WebSocket } from "ws";
import { createWebSocketManager } from "./ws.mjs";

function waitForMessage(ws, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out waiting for message")), timeoutMs);
    ws.once("message", (data) => {
      clearTimeout(timer);
      resolve(JSON.parse(data.toString()));
    });
  });
}

function waitForOpen(ws, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.OPEN) { resolve(); return; }
    const timer = setTimeout(() => reject(new Error("Timed out waiting for open")), timeoutMs);
    ws.once("open", () => { clearTimeout(timer); resolve(); });
  });
}

function waitForClose(ws, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.CLOSED) { resolve(); return; }
    const timer = setTimeout(() => reject(new Error("Timed out waiting for close")), timeoutMs);
    ws.once("close", () => { clearTimeout(timer); resolve(); });
  });
}

function createClient(port) {
  return new WebSocket(`ws://127.0.0.1:${port}/ws`);
}

describe("WebSocket manager", () => {
  let httpServer;
  let wsManager;
  let port;

  before(async () => {
    httpServer = http.createServer((_req, res) => {
      res.writeHead(404);
      res.end();
    });

    wsManager = createWebSocketManager();
    wsManager.attach(httpServer, async () => ({ snapshot: true }));

    await new Promise((resolve) => {
      httpServer.listen(0, "127.0.0.1", resolve);
    });

    port = httpServer.address().port;
  });

  after(() => {
    wsManager.close();
    httpServer.close();
  });

  it("sends a snapshot on connection", async () => {
    const ws = createClient(port);
    // Listen for message before open to avoid race
    const msgPromise = waitForMessage(ws);
    await waitForOpen(ws);
    const msg = await msgPromise;

    assert.equal(msg.event, "snapshot");
    assert.deepStrictEqual(msg.data, { snapshot: true });
    assert.ok(msg.time);

    ws.close();
    await waitForClose(ws);
  });

  it("broadcasts messages to connected clients", async () => {
    const ws1 = createClient(port);
    const ws2 = createClient(port);

    // Set up snapshot drain before open
    const snap1 = waitForMessage(ws1);
    const snap2 = waitForMessage(ws2);
    await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);
    await Promise.all([snap1, snap2]);

    // Now listen for broadcast
    const msg1Promise = waitForMessage(ws1);
    const msg2Promise = waitForMessage(ws2);

    wsManager.broadcast("score:updated", { teamId: "t1", score: 100 });

    const [msg1, msg2] = await Promise.all([msg1Promise, msg2Promise]);

    assert.equal(msg1.event, "score:updated");
    assert.equal(msg1.data.teamId, "t1");
    assert.equal(msg2.event, "score:updated");
    assert.equal(msg2.data.score, 100);

    ws1.close();
    ws2.close();
    await Promise.all([waitForClose(ws1), waitForClose(ws2)]);
  });

  it("tracks client count correctly", async () => {
    // Wait for any lingering connections to clear
    await new Promise((r) => setTimeout(r, 100));
    const baseline = wsManager.clientCount;

    const ws = createClient(port);
    await waitForOpen(ws);
    await new Promise((r) => setTimeout(r, 50));

    assert.equal(wsManager.clientCount, baseline + 1);

    ws.close();
    await waitForClose(ws);
    await new Promise((r) => setTimeout(r, 50));

    assert.equal(wsManager.clientCount, baseline);
  });
});
