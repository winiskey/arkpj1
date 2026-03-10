import { spawn } from "node:child_process";

const commands = [
  {
    name: "api",
    command: process.execPath,
    args: ["server/index.mjs"],
  },
  {
    name: "web",
    command: process.execPath,
    args: ["scripts/dev.mjs"],
  },
];

const children = commands.map((entry) => {
  const child = spawn(entry.command, entry.args, {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`${entry.name} exited with signal ${signal}`);
      return;
    }

    if (typeof code === "number" && code !== 0) {
      console.log(`${entry.name} exited with code ${code}`);
      shutdown(code);
    }
  });

  return child;
});

let isShuttingDown = false;

function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => process.exit(exitCode), 100);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
