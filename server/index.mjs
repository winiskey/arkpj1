import { loadProjectEnv } from "../scripts/load-env.mjs";
import { getServerConfig } from "./app/config.mjs";
import { createApp } from "./app/create-server.mjs";

loadProjectEnv();
const config = getServerConfig();

if (!config.adminToken) {
  console.error("❌ FATAL: ADMIN_TOKEN 未配置，拒绝启动。");
  console.error("   请在环境变量文件中设置 ADMIN_TOKEN=<强密码>，然后重启服务。");
  process.exit(1);
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
