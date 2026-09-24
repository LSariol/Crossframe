import type { CanonicalItem } from "./types";
// The generated registry (see scripts/generate-data.mjs and docs/data-sources.md).
// esbuild inlines this JSON at bundle time, so there is no runtime fetch.
import itemsData from "../../data/items.json";

export interface ItemRegistry {
  readonly items: readonly CanonicalItem[];
  findByWikiPath(path: string): CanonicalItem | undefined;
  findByMarketSlug(slug: string): CanonicalItem | undefined;
  findByOverframeId(id: number): CanonicalItem | undefined;
  findByOverframeSlug(slug: string): CanonicalItem | undefined;
}

/** Trims a trailing slash and decodes percent-escapes so lookups are forgiving of harmless URL variance. */
function normalizeWikiPath(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

/**
 * Sets `key -> item` in `map`, except a Prime component is never allowed to
 * win the slot over a non-component that's already holding it, regardless
 * of item order. Needed anywhere two items can legitimately share the same
 * key - so far that's a component's wiki path (it has no wiki page of its
 * own; see scripts/lib/build-items.mjs) and, since components also reuse
 * their parent's Overframe id/slug (Overframe has no build page for an
 * individual part either; see generate-data.mjs and rules.ts), the same
 * collision now happens for Overframe lookups too. A reverse lookup by any
 * of these keys should always resolve to the one page a visitor is
 * actually looking at - the parent - not whichever component happened to
 * be processed last.
 */
function setPreferringNonComponent<K>(map: Map<K, CanonicalItem>, key: K, item: CanonicalItem): void {
  const existing = map.get(key);
  const existingIsComponent = existing?.category === "primeComponent";
  if (!existing || (existingIsComponent && item.category !== "primeComponent")) {
    map.set(key, item);
  }
}

export function createRegistry(items: readonly CanonicalItem[]): ItemRegistry {
  const byWikiPath = new Map<string, CanonicalItem>();
  const byMarketSlug = new Map<string, CanonicalItem>();
  const byOverframeId = new Map<number, CanonicalItem>();
  const byOverframeSlug = new Map<string, CanonicalItem>();

  for (const item of items) {
    if (item.wiki) {
      setPreferringNonComponent(byWikiPath, normalizeWikiPath(item.wiki.path), item);
    }
    if (item.market) byMarketSlug.set(item.market.slug, item); // always unique per item, no collision possible
    if (item.overframe) {
      setPreferringNonComponent(byOverframeId, item.overframe.id, item);
      setPreferringNonComponent(byOverframeSlug, item.overframe.slug, item);
    }
  }

  return {
    items,
    findByWikiPath: (path) => byWikiPath.get(normalizeWikiPath(path)),
    findByMarketSlug: (slug) => byMarketSlug.get(slug),
    findByOverframeId: (id) => byOverframeId.get(id),
    findByOverframeSlug: (slug) => byOverframeSlug.get(slug),
  };
}

/** The registry built from Crossframe's bundled data. Adapters resolve items through this singleton. */
export const registry = createRegistry(itemsData as CanonicalItem[]);
