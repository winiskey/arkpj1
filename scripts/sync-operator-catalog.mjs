import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const PRTS_API_URL = "https://prts.wiki/api.php";
const OPERATOR_LIST_PAGE_ID = "1831";
// Generated admin data file. Treat this as sync output, not hand-authored source.
const OUTPUT_PATH = resolve("src/pages/admin/operatorCatalog.json");
const FILE_TITLE_PREFIX = "文件:头像_";
const USER_AGENT = "ArkProjectOperatorCatalogSync/1.0";
const QUERY_CHUNK_SIZE = 50;

function normalizeSearchText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

function decodeHtmlEntities(value) {
  return String(value ?? "")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchJson(params) {
  const url = new URL(PRTS_API_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`PRTS API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function extractAttributes(attributeText) {
  const attributes = {};
  const pattern = /data-([a-z_]+)="([^"]*)"/g;

  for (const match of attributeText.matchAll(pattern)) {
    attributes[match[1]] = decodeHtmlEntities(match[2]);
  }

  return attributes;
}

function extractOperatorEntries(html) {
  const entries = [];
  const seen = new Set();
  const pattern = /<div\s+([^>]*\bdata-zh="[^"]+"[^>]*)>/g;

  for (const match of html.matchAll(pattern)) {
    const attributes = extractAttributes(match[1]);
    const name = attributes.zh?.trim();
    const rawRarity = Number(attributes.rarity);

    if (!name || !Number.isFinite(rawRarity)) {
      continue;
    }

    const key = normalizeSearchText(name);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    entries.push({
      id: attributes.id?.trim() || key,
      name,
      rarity: rawRarity + 1,
      sortId: Number(attributes.sortid) || Number.MAX_SAFE_INTEGER,
    });
  }

  return entries.sort((left, right) => left.sortId - right.sortId || left.rarity - right.rarity || left.name.localeCompare(right.name, "zh-Hans-CN"));
}

function chunkList(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function operatorNameFromFileTitle(title) {
  return String(title ?? "")
    .replace(/^文件:/, "")
    .replace(/\.png$/i, "")
    .replace(/^头像[ _]/, "")
    .trim();
}

async function fetchDirectAvatarUrlMap(operators) {
  const avatarUrlMap = new Map();
  const titles = operators.map((operator) => `${FILE_TITLE_PREFIX}${operator.name}.png`);

  for (const titleChunk of chunkList(titles, QUERY_CHUNK_SIZE)) {
    const payload = await fetchJson({
      action: "query",
      titles: titleChunk.join("|"),
      prop: "imageinfo",
      iiprop: "url",
      format: "json",
    });

    for (const page of Object.values(payload.query?.pages ?? {})) {
      const imageUrl = page?.imageinfo?.[0]?.url;
      if (!imageUrl) {
        continue;
      }

      const operatorName = operatorNameFromFileTitle(page.title);
      avatarUrlMap.set(normalizeSearchText(operatorName), imageUrl);
    }
  }

  return avatarUrlMap;
}

function pickFallbackAvatarFile(imageTitles, operatorName) {
  const expected = normalizeSearchText(operatorName);
  const candidates = [];

  for (const title of imageTitles ?? []) {
    const value = String(title ?? "");
    if (!value.endsWith(".png") || !value.startsWith("头像")) {
      continue;
    }

    const normalized = normalizeSearchText(value.replace(/^头像[ _]?/, "").replace(/\.png$/i, ""));
    let score = 0;

    if (normalized === expected) {
      score = 100;
    } else if (normalized.includes(expected)) {
      score = 80;
    } else {
      continue;
    }

    candidates.push({ score, title: `文件:${value}` });
  }

  candidates.sort((left, right) => right.score - left.score || left.title.length - right.title.length);
  return candidates[0]?.title ?? null;
}

async function resolveImageUrlFromFileTitle(fileTitle) {
  const payload = await fetchJson({
    action: "query",
    titles: fileTitle,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
  });

  for (const page of Object.values(payload.query?.pages ?? {})) {
    const imageUrl = page?.imageinfo?.[0]?.url;
    if (imageUrl) {
      return imageUrl;
    }
  }

  return null;
}

async function resolveFallbackAvatarUrl(operatorName) {
  const payload = await fetchJson({
    action: "parse",
    page: operatorName,
    prop: "images",
    format: "json",
  });

  const imageTitles = payload.parse?.images ?? [];
  const fallbackFileTitle = pickFallbackAvatarFile(imageTitles, operatorName);
  if (!fallbackFileTitle) {
    return null;
  }

  return resolveImageUrlFromFileTitle(fallbackFileTitle);
}

async function buildOperatorCatalog() {
  const listPayload = await fetchJson({
    action: "parse",
    pageid: OPERATOR_LIST_PAGE_ID,
    prop: "text",
    format: "json",
  });

  const html = listPayload.parse?.text?.["*"];
  if (!html) {
    throw new Error("PRTS operator list response did not contain rendered HTML.");
  }

  const operators = extractOperatorEntries(html);
  const directAvatarUrlMap = await fetchDirectAvatarUrlMap(operators);
  const catalog = [];
  const missing = [];
  let directHitCount = 0;
  let fallbackHitCount = 0;

  for (const operator of operators) {
    const key = normalizeSearchText(operator.name);
    let avatarUrl = directAvatarUrlMap.get(key) ?? null;

    if (avatarUrl) {
      directHitCount += 1;
    } else {
      avatarUrl = await resolveFallbackAvatarUrl(operator.name);
      if (avatarUrl) {
        fallbackHitCount += 1;
      } else {
        missing.push(operator.name);
      }
    }

    catalog.push({
      id: operator.id,
      name: operator.name,
      rarity: operator.rarity,
      avatarUrl,
      searchText: key,
    });
  }

  return {
    catalog,
    stats: {
      total: catalog.length,
      directHitCount,
      fallbackHitCount,
      missing,
      sixStarCount: catalog.filter((entry) => entry.rarity === 6).length,
    },
  };
}

async function main() {
  const { catalog, stats } = await buildOperatorCatalog();
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

  console.log(`Wrote ${stats.total} operators to ${OUTPUT_PATH}`);
  console.log(`Direct avatar matches: ${stats.directHitCount}`);
  console.log(`Fallback avatar matches: ${stats.fallbackHitCount}`);
  console.log(`Six-star entries: ${stats.sixStarCount}`);

  if (stats.missing.length > 0) {
    console.log(`Missing avatars: ${stats.missing.length}`);
    for (const name of stats.missing.slice(0, 25)) {
      console.log(`- ${name}`);
    }
    if (stats.missing.length > 25) {
      console.log(`...and ${stats.missing.length - 25} more`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
