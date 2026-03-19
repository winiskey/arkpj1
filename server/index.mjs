import { getServerConfig } from "./app/config.mjs";
import { createApp } from "./app/create-server.mjs";

const config = getServerConfig();

if (!config.adminToken) {
  console.warn("⚠️  ADMIN_TOKEN is not set. Admin endpoints are UNPROTECTED.");
}

const { server, service, wsManager } = createApp(config);

await service.ensureReady();

server.on("error", (error) => {
  console.error("Ark backend failed to start.", error);
  process.exitCode = 1;
});

server.listen(config.port, config.host, () => {
  console.log(`Ark backend listening on http://${config.host}:${config.port}`);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    console.log(`Received ${signal}, shutting down…`);
    wsManager.close();
    server.close(() => process.exit(0));
  });
}
