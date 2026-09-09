import type { CanonicalItem, SiteId } from "../items/types";

const WIKI_ORIGIN = "https://wiki.warframe.com";
const MARKET_ITEM_BASE = "https://warframe.market/items";
const OVERFRAME_ARSENAL_BASE = "https://overframe.gg/items/arsenal";

/**
 * Builds the absolute URL for `item` on `site`, or returns undefined when
 * the item has no known page there. Never guesses a URL from the item's
 * name - every path/slug/id here comes from the registry, which is either
 * generated from a verified data source or an explicit override.
 */
export function buildDestinationUrl(item: CanonicalItem, site: SiteId): string | undefined {
  switch (site) {
    case "wiki":
      return item.wiki ? `${WIKI_ORIGIN}${item.wiki.path}` : undefined;
    case "market":
      return item.market ? `${MARKET_ITEM_BASE}/${item.market.slug}` : undefined;
    case "overframe":
      return item.overframe
        ? `${OVERFRAME_ARSENAL_BASE}/${item.overframe.id}/${item.overframe.slug}/`
        : undefined;
  }
}
