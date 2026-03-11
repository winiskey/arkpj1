import { getServerConfig } from "./app/config.mjs";
import { createApp } from "./app/create-server.mjs";

const config = getServerConfig();
const { server, service } = createApp(config);

await service.ensureReady();

server.on("error", (error) => {
  console.error("Ark backend failed to start.", error);
  process.exitCode = 1;
});

server.listen(config.port, config.host, () => {
  console.log(`Ark backend listening on http://${config.host}:${config.port}`);
});
