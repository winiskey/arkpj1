import { createServer } from "vite";

const args = process.argv.slice(2);
const getArgValue = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && index + 1 < args.length ? args[index + 1] : fallback;
};

const host = getArgValue("--host", "127.0.0.1");
const port = Number(getArgValue("--port", "3000"));

const server = await createServer({
  server: {
    host,
    port,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
      "/ws": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});

const keepAlive = setInterval(() => { }, 1 << 30);

const closeServer = async () => {
  clearInterval(keepAlive);
  await server.close();
  process.exit(0);
};

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);

await server.listen();
server.printUrls();
