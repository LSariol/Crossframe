/**
 * Transforms raw WFCD/warframe-items category data plus a warframe.market
 * name index into Crossframe's CanonicalItem shape (see src/items/types.ts,
 * duplicated loosely here since this is a plain JS build script).
 */

const REFINEMENT_SUFFIX = /\s+(Intact|Exceptional|Flawless|Radiant)$/i;

// Combining diacritical marks (U+0300-U+036F) left behind by NFKD
// normalization, e.g. turning "é" into "e" + a combining acute accent.
const COMBINING_MARKS = /[̀-ͯ]/g;

export function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeName(name) {
  return name.trim().toLowerCase();
}

/** Builds a name -> { slug, tags } lookup from warframe.market's v2 item list. */
export function buildMarketIndex(marketItems) {
  const index = new Map();
  for (const raw of marketItems) {
    const name = raw?.i18n?.en?.name;
    if (!name) continue;
    const key = normalizeName(name);
    // Keep the first match; warframe.market has no duplicate display names
    // in practice, but this keeps the mapping deterministic if it ever does.
    if (!index.has(key)) index.set(key, { slug: raw.slug, tags: raw.tags ?? [] });
  }
  return index;
}

function findMarketSlug(marketIndex, name, isPrime) {
  if (isPrime) {
    const set = marketIndex.get(normalizeName(`${name} Set`));
    if (set) return set.slug;
  }
  const exact = marketIndex.get(normalizeName(name));
  return exact?.slug;
}

/** Converts a WFCD wikiaUrl into the decoded path Crossframe stores (e.g. "/w/Protea/Prime"). */
function wikiPathFrom(wikiaUrl) {
  if (!wikiaUrl) return undefined;
  try {
    const url = new URL(wikiaUrl);
    return decodeURIComponent(url.pathname);
  } catch {
    return undefined;
  }
}

/**
 * Equipment categories (warframes, weapons, companions, archwing gear):
 * WFCD reliably provides wikiaUrl and isPrime, and market slugs are found
 * by cross-referencing warframe.market (trying "<Name> Set" first for Prime
 * items, since the assembled item - not the individually untradable frame -
 * is what's listed there).
 */
export function buildEquipmentItem(raw, category, marketIndex) {
  if (!raw.name) return undefined;
  const isPrime = Boolean(raw.isPrime);
  const item = {
    id: slugify(raw.name),
    name: raw.name,
    category,
    isPrime,
  };
  const wikiPath = wikiPathFrom(raw.wikiaUrl);
  if (wikiPath) item.wiki = { path: wikiPath };
  const marketSlug = findMarketSlug(marketIndex, raw.name, isPrime);
  if (marketSlug) item.market = { slug: marketSlug };
  return item;
}

/**
 * Individually tradable Prime parts (e.g. "Protea Prime Chassis"). WFCD
 * nests these under the parent item's `components` array rather than
 * listing them as top-level items. warframe.market lists each as
 * "<Parent> [<Part>] Blueprint" - verified against the live API for
 * Protea Prime's Blueprint/Chassis/Neuroptics/Systems components - so a
 * component only becomes a registry entry when that name actually
 * resolves on the market, rather than being constructed from a guess.
 * They share the parent's wiki page, since components don't have their
 * own wiki pages separate from it.
 */
export function buildPrimeComponents(parentItem, rawComponents, marketIndex) {
  if (!parentItem.isPrime || !Array.isArray(rawComponents)) return [];
  const items = [];
  for (const comp of rawComponents) {
    if (!comp.tradable || !comp.name) continue;
    const displayName =
      comp.name === "Blueprint"
        ? `${parentItem.name} Blueprint`
        : `${parentItem.name} ${comp.name} Blueprint`;
    const marketEntry = marketIndex.get(normalizeName(displayName));
    if (!marketEntry) continue;
    const item = {
      id: slugify(displayName),
      name: displayName,
      category: "primeComponent",
      isPrime: true,
      market: { slug: marketEntry.slug },
    };
    if (parentItem.wiki) item.wiki = parentItem.wiki;
    items.push(item);
  }
  return items;
}

/**
 * Exalted Weapons (Exalted Blade, Regulators, Iron Staff, ...): WFCD lists
 * these inside Misc.json - a 1,256-entry grab-bag Crossframe otherwise
 * deliberately ignores as too noisy to trust wholesale (see
 * docs/data-sources.md) - tagged with productCategory "SpecialItems",
 * which turns out to be a small (36-entry, verified at generation time),
 * clean subset containing exactly this category and nothing else. The
 * caller is expected to have already filtered to that subset (see
 * generate-data.mjs); this function doesn't re-check productCategory
 * itself; so it stays a plain per-item transform like the others here.
 *
 * Never independently tradable - bundled with their Warframe, and every
 * entry confirms this with tradable: false - so market is never
 * attempted, the same reasoning as buildResourceItem. WFCD doesn't
 * populate isPrime on these entries the way it does elsewhere, so it's
 * derived from the name itself (e.g. "Regulators Prime", "Garuda Prime
 * Talons") - safe here since every one of the 36 either clearly is or
 * clearly isn't, with no ambiguous cases.
 */
export function buildExaltedWeaponItem(raw) {
  if (!raw.name) return undefined;
  const wikiPath = wikiPathFrom(raw.wikiaUrl);
  if (!wikiPath) return undefined;
  return {
    id: slugify(raw.name),
    name: raw.name,
    category: "exaltedWeapon",
    isPrime: /\bprime\b/i.test(raw.name),
    wiki: { path: wikiPath },
  };
}

/** Mods and Arcanes: same shape as equipment but without the "Set" market pattern. */
export function buildSimpleItem(raw, category, marketIndex) {
  if (!raw.name) return undefined;
  const item = {
    id: slugify(raw.name),
    name: raw.name,
    category,
    isPrime: Boolean(raw.isPrime),
  };
  const wikiPath = wikiPathFrom(raw.wikiaUrl);
  if (wikiPath) item.wiki = { path: wikiPath };
  const marketSlug = findMarketSlug(marketIndex, raw.name, false);
  if (marketSlug) item.market = { slug: marketSlug };
  return item;
}

/**
 * Resources: WFCD's Resources.json never populates wikiaUrl (verified
 * empty across all 241 entries at generation time), so the wiki path here
 * falls back to the standard MediaWiki title transform (spaces ->
 * underscores) rather than a confirmed URL. This is the one category where
 * Crossframe knowingly ships a derived-not-confirmed wiki link; see
 * docs/data-sources.md. Market is never attempted for resources - they are
 * not a market-relevant category (see navigation/rules.ts) and base
 * crafting resources are not tradable, so cross-referencing would only
 * risk false-positive name collisions.
 */
export function buildResourceItem(raw) {
  if (!raw.name) return undefined;
  const wikiPath = wikiPathFrom(raw.wikiaUrl) ?? `/w/${raw.name.replace(/ /g, "_")}`;
  return {
    id: slugify(raw.name),
    name: raw.name,
    category: "resource",
    isPrime: false,
    wiki: { path: wikiPath },
  };
}

/**
 * Relics: WFCD lists one entry per refinement tier ("Axi A1 Exceptional",
 * "Axi A1 Radiant", ...); Crossframe collapses these to one entry per base
 * relic ("Axi A1"), since all refinements share one wiki page and one
 * market listing pattern ("<Base> Relic", verified against the live API).
 */
export function buildRelicItems(rawRelics, marketIndex) {
  const baseNames = new Set();
  for (const raw of rawRelics) {
    if (!raw.name) continue;
    baseNames.add(raw.name.replace(REFINEMENT_SUFFIX, "").trim());
  }
  const items = [];
  for (const baseName of baseNames) {
    const displayName = `${baseName} Relic`;
    const item = {
      id: slugify(displayName),
      name: displayName,
      category: "relic",
      isPrime: false,
      wiki: { path: `/w/${baseName.replace(/ /g, "_")}` },
    };
    const marketEntry = marketIndex.get(normalizeName(displayName));
    if (marketEntry) item.market = { slug: marketEntry.slug };
    items.push(item);
  }
  return items;
}

/** An item with no destination on any site is dead weight in the registry. */
export function hasAnyDestination(item) {
  return Boolean(item.wiki || item.market || item.overframe);
}
