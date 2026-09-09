import type { CanonicalItem, SiteId } from "../items/types";
import { SITE_IDS } from "../items/types";
import { isDestinationRelevant } from "./rules";
import { buildDestinationUrl } from "./url";

export interface Destination {
  site: SiteId;
  url: string;
}

/**
 * The buttons Crossframe should show for `item` given the site the user is
 * currently on. A destination appears only when it is both relevant for the
 * item's category (rules.ts) and actually resolves to a URL (url.ts) - the
 * two checks the design doc calls out as independent. The current site is
 * always excluded: Crossframe is for navigating *away*.
 */
export function getDestinations(item: CanonicalItem, currentSite: SiteId): Destination[] {
  const destinations: Destination[] = [];
  for (const site of SITE_IDS) {
    if (site === currentSite) continue;
    if (!isDestinationRelevant(item.category, site)) continue;
    const url = buildDestinationUrl(item, site);
    if (url) destinations.push({ site, url });
  }
  return destinations;
}
