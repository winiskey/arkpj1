import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const defaultDataDir = fileURLToPath(new URL("../data", import.meta.url));

export function getRuntimeDataPaths(dataDir = process.env.ARK_DATA_DIR) {
  const normalizedDataDir = String(dataDir ?? "").trim();
  const resolvedDataDir = normalizedDataDir ? resolve(normalizedDataDir) : defaultDataDir;

  return {
    dataDir: resolvedDataDir,
    publicContentPath: join(resolvedDataDir, "public-content.json"),
    opsStatePath: join(resolvedDataDir, "ops-state.json"),
    scoreSheetsPath: join(resolvedDataDir, "score-sheets.json"),
  };
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function parseOrigins(value) {
  return String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getServerConfig() {
  const runtimeDataPaths = getRuntimeDataPaths();

  return {
    host: process.env.API_HOST ?? "127.0.0.1",
    port: parsePositiveInteger(process.env.API_PORT, 8787),
    bodyLimitBytes: parsePositiveInteger(process.env.API_BODY_LIMIT_BYTES, 1024 * 1024),
    corsOrigins: parseOrigins(process.env.API_CORS_ORIGINS),
    adminToken: String(process.env.ADMIN_TOKEN ?? "").trim(),
    prettyJson: process.env.NODE_ENV !== "production",
    ...runtimeDataPaths,
  };
}
