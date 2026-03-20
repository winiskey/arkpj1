import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function stripWrappingQuotes(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }

  return value;
}

function parseEnvFile(sourceText) {
  const result = {};

  for (const rawLine of sourceText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim());
    if (!key) {
      continue;
    }

    result[key] = value;
  }

  return result;
}

export function loadProjectEnv(envPath = ".env") {
  const resolvedPath = resolve(envPath);
  let fileText = "";

  try {
    fileText = readFileSync(resolvedPath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {};
    }
    throw error;
  }

  const parsed = parseEnvFile(fileText);

  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return parsed;
}
