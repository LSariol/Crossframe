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
    if (item.wiki) byWikiPath.set(normalizeWikiPath(item.wiki.path), item);
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
