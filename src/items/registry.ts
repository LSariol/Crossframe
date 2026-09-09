import type { CanonicalItem } from "./types";
// The generated registry (see scripts/generate-data.mjs and docs/data-sources.md).
// esbuild inlines this JSON at bundle time, so there is no runtime fetch.
import itemsData from "../../data/items.json";

export interface ItemRegistry {
  readonly items: readonly CanonicalItem[];
  findByWikiPath(path: string): CanonicalItem | undefined;
  findByMarketSlug(slug: string): CanonicalItem | undefined;
  findByOverframeId(id: number): CanonicalItem | undefined;
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

export function createRegistry(items: readonly CanonicalItem[]): ItemRegistry {
  const byWikiPath = new Map<string, CanonicalItem>();
  const byMarketSlug = new Map<string, CanonicalItem>();
  const byOverframeId = new Map<number, CanonicalItem>();

  for (const item of items) {
    // Prime components deliberately reuse their parent item's wiki path
    // (a component has no wiki page of its own - see
    // scripts/lib/build-items.mjs) but must never win a reverse lookup for
    // that path: a visitor on that page is looking at the parent, not one
    // specific component. Regardless of item order, the parent always wins.
    if (item.wiki) {
      const key = normalizeWikiPath(item.wiki.path);
      const existing = byWikiPath.get(key);
      const existingIsComponent = existing?.category === "primeComponent";
      if (!existing || (existingIsComponent && item.category !== "primeComponent")) {
        byWikiPath.set(key, item);
      }
    }
    if (item.market) byMarketSlug.set(item.market.slug, item);
    if (item.overframe) byOverframeId.set(item.overframe.id, item);
  }

  return {
    items,
    findByWikiPath: (path) => byWikiPath.get(normalizeWikiPath(path)),
    findByMarketSlug: (slug) => byMarketSlug.get(slug),
    findByOverframeId: (id) => byOverframeId.get(id),
  };
}

/** The registry built from Crossframe's bundled data. Adapters resolve items through this singleton. */
export const registry = createRegistry(itemsData as CanonicalItem[]);
