/**
 * Fetches Crossframe's build-time data sources and caches the raw responses
 * under data/.cache/ so re-running the generator doesn't re-hit the network
 * (or fail offline) every time. This runs only when a developer regenerates
 * the bundled registry - never at extension runtime.
 *
 * Sources:
 *  - WFCD/warframe-items (github.com/WFCD/warframe-items): a community
 *    dataset generated from Warframe's own game data and DE's public wiki
 *    export, published as plain JSON per item category. This is the
 *    primary source for canonical names, categories, tradability, isPrime,
 *    and wiki.warframe.com paths.
 *  - api.warframe.market/v2/items: Warframe.Market's public, documented
 *    item API, used to cross-reference market slugs by name.
 *
 * wiki.warframe.com itself is deliberately never queried here: its
 * robots.txt disallows AI crawlers (including this tool) site-wide, so
 * Crossframe relies entirely on WFCD's already-published wikiaUrl field
 * instead of querying the wiki directly. See docs/data-sources.md.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const CACHE_DIR = path.join(process.cwd(), "data", ".cache");
const USER_AGENT = "crossframe-data-generator (https://github.com/, build-time only)";

const WFCD_CATEGORIES = [
  "Warframes",
  "Primary",
  "Secondary",
  "Melee",
  "Arch-Gun",
  "Arch-Melee",
  "Archwing",
  "Pets",
  "Sentinels",
  "SentinelWeapons",
  "Mods",
  "Arcanes",
  "Resources",
  "Relics",
  "Misc",
];

const WFCD_RAW_BASE = "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json";

async function fetchJsonCached(cacheKey, url, { refresh = false } = {}) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);

  if (!refresh && existsSync(cachePath)) {
    return JSON.parse(readFileSync(cachePath, "utf8"));
  }

  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  writeFileSync(cachePath, JSON.stringify(data));
  return data;
}

/** Fetches every WFCD category file used by the generator, keyed by category name. */
export async function fetchWfcdCategories({ refresh = false } = {}) {
  const entries = await Promise.all(
    WFCD_CATEGORIES.map(async (category) => {
      const data = await fetchJsonCached(`wfcd-${category}`, `${WFCD_RAW_BASE}/${category}.json`, {
        refresh,
      });
      return [category, data];
    }),
  );
  return Object.fromEntries(entries);
}

/** Fetches warframe.market's full item list (v2 API). */
export async function fetchMarketItems({ refresh = false } = {}) {
  const data = await fetchJsonCached(
    "warframe-market-items",
    "https://api.warframe.market/v2/items",
    { refresh },
  );
  return data.data;
}
