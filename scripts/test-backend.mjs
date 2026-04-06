import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";

const testDir = join("server", "app");
const testFiles = (await readdir(testDir))
  .filter((entry) => entry.endsWith(".test.mjs"))
  .sort()
  .map((entry) => join(testDir, entry));

if (testFiles.length === 0) {
  console.error("No backend test files found in server/app.");
  process.exit(1);
}

const child = spawn(process.execPath, ["--test", ...testFiles], {
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
