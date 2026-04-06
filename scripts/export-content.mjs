import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import ts from "typescript";
import { getRuntimeDataPaths } from "../server/app/config.mjs";
import { publicContentSeedPath } from "../server/app/public-content-seed.mjs";

const require = createRequire(import.meta.url);
const moduleCache = new Map();

// This script mirrors src/content into runtime JSON files. Keep the loader
// behavior aligned with the actual TypeScript toolchain; it is not a second
// authoritative module system.

function resolveModulePath(specifier, parentFile) {
  const basePath = resolve(dirname(parentFile), specifier);
  const candidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    resolve(basePath, "index.ts"),
    resolve(basePath, "index.tsx"),
  ];

  for (const candidate of candidates) {
    try {
      readFileSync(candidate, "utf8");
      return candidate;
    } catch {
      // Keep trying the next candidate.
    }
  }

  throw new Error(`Cannot resolve module ${specifier} from ${parentFile}`);
}

function loadTsModule(filePath) {
  const resolvedPath = resolve(filePath);
  if (moduleCache.has(resolvedPath)) {
    return moduleCache.get(resolvedPath).exports;
  }

  const sourceText = readFileSync(resolvedPath, "utf8");
  const transpiled = ts.transpileModule(sourceText, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: resolvedPath,
  }).outputText;

  const module = { exports: {} };
  moduleCache.set(resolvedPath, module);

  const localRequire = (specifier) => {
    if (specifier.startsWith(".")) {
      return loadTsModule(resolveModulePath(specifier, resolvedPath));
    }

    return require(specifier);
  };

  const wrapper = new Function("require", "module", "exports", transpiled);
  wrapper(localRequire, module, module.exports);
  return module.exports;
}

const contentModule = loadTsModule("src/content/index.ts");
const publicContent = {
  siteMeta: contentModule.siteMeta,
  overviewPanels: contentModule.overviewPanels,
  liveBroadcast: contentModule.liveBroadcast,
  matches: contentModule.matches,
  eventSchedule: contentModule.eventSchedule,
  leaderboard: contentModule.leaderboard,
  judgeNotices: contentModule.judgeNotices,
  teams: contentModule.teams,
  ruleSections: contentModule.ruleSections,
  themeRules: contentModule.themeRules,
};

const { publicContentPath } = getRuntimeDataPaths();
mkdirSync(dirname(publicContentPath), { recursive: true });
writeFileSync(publicContentPath, `${JSON.stringify(publicContent, null, 2)}\n`, "utf8");
mkdirSync(dirname(publicContentSeedPath), { recursive: true });
writeFileSync(publicContentSeedPath, `${JSON.stringify(publicContent, null, 2)}\n`, "utf8");

console.log(`Exported ${publicContentPath} from src/content.`);
console.log(`Updated seed ${publicContentSeedPath}.`);
