import { fileURLToPath } from "node:url";

export const publicContentPath = fileURLToPath(new URL("../data/public-content.json", import.meta.url));
export const opsStatePath = fileURLToPath(new URL("../data/ops-state.json", import.meta.url));
export const scoreSheetsPath = fileURLToPath(new URL("../data/score-sheets.json", import.meta.url));

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
  return {
    host: process.env.API_HOST ?? "127.0.0.1",
    port: parsePositiveInteger(process.env.API_PORT, 8787),
    bodyLimitBytes: parsePositiveInteger(process.env.API_BODY_LIMIT_BYTES, 1024 * 1024),
    corsOrigins: parseOrigins(process.env.API_CORS_ORIGINS),
    adminToken: String(process.env.ADMIN_TOKEN ?? "").trim(),
    prettyJson: process.env.NODE_ENV !== "production",
  };
}
