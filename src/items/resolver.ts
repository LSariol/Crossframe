import type { CanonicalItem } from "./types";
import { registry, type ItemRegistry } from "./registry";

/**
 * What a site adapter extracts from the current page: exactly the
 * identifier that site uses for the item, tagged with which site it came
 * from. A discriminated union rather than three optional fields keeps
 * "which key did the adapter actually find" unambiguous.
 */
export type DetectedItemKey =
  | { site: "wiki"; wikiPath: string }
  | { site: "market"; marketSlug: string }
  | { site: "overframe"; overframeId: number };

/**
 * Resolves a site-specific identifier to the CanonicalItem it represents,
 * or undefined when the registry has no matching entry. Undefined is the
 * expected, silent outcome for a page Crossframe doesn't recognize -
 * callers should do nothing rather than guess.
 */
export function resolveCanonicalItem(
  key: DetectedItemKey,
  source: ItemRegistry = registry,
): CanonicalItem | undefined {
  switch (key.site) {
    case "wiki":
      return source.findByWikiPath(key.wikiPath);
    case "market":
      return source.findByMarketSlug(key.marketSlug);
    case "overframe":
      return source.findByOverframeId(key.overframeId);
  }
}
