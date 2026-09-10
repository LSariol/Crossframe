import type { CanonicalItem } from "./types";
import { registry, type ItemRegistry } from "./registry";

/**
 * What a site adapter extracts from the current page: exactly the
 * identifier that site uses for the item, tagged with which site it came
 * from. A discriminated union rather than three optional fields keeps
 * "which key did the adapter actually find" unambiguous.
 *
 * Overframe gets two variants because it identifies an item differently
 * depending on page type: an arsenal item page carries both a numeric id
 * and a slug (/items/arsenal/<id>/<slug>/), but a build page only carries
 * the slug (/build/<buildId>/<frameSlug>/<title>/ - buildId identifies the
 * build, not the item). Resolving by slug would work for both, but the id
 * lookup is kept for arsenal pages since it's the more specific identifier
 * where one is available.
 */
export type DetectedItemKey =
  | { site: "wiki"; wikiPath: string }
  | { site: "market"; marketSlug: string }
  | { site: "overframe"; overframeId: number }
  | { site: "overframe"; overframeSlug: string };

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
      return "overframeId" in key
        ? source.findByOverframeId(key.overframeId)
        : source.findByOverframeSlug(key.overframeSlug);
  }
}
