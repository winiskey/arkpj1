import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const publicContentSeedPath = fileURLToPath(new URL("../public-content.seed.json", import.meta.url));

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

export async function readPublicContentSeed() {
  const raw = await readFile(publicContentSeedPath, "utf8");
  return JSON.parse(raw);
}

export function isPlaceholderPublicContent(publicContent) {
  if (!publicContent || typeof publicContent !== "object" || Array.isArray(publicContent)) {
    return true;
  }

  const siteMeta = publicContent.siteMeta && typeof publicContent.siteMeta === "object" ? publicContent.siteMeta : {};

  return !isNonEmptyString(siteMeta.eventName)
    && !isNonEmptyString(siteMeta.eventCode)
    && !isNonEmptyString(siteMeta.startDate)
    && !hasItems(siteMeta.prizePool)
    && !hasItems(siteMeta.highlights)
    && !hasItems(siteMeta.ctaLinks)
    && !hasItems(publicContent.overviewPanels)
    && !hasItems(publicContent.matches)
    && !hasItems(publicContent.eventSchedule)
    && !hasItems(publicContent.leaderboard)
    && !hasItems(publicContent.judgeNotices)
    && !hasItems(publicContent.teams)
    && !hasItems(publicContent.ruleSections)
    && !hasItems(publicContent.themeRules);
}
