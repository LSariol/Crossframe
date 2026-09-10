import type { SiteId, CanonicalItem } from "../items/types";
import type { DetectedItemKey } from "../items/resolver";
import type { Destination } from "../navigation/destinations";

/**
 * A site adapter's only job is understanding one site's own pages: turning
 * the current URL into a registry lookup key, and finding where on the
 * page Crossframe's buttons belong. Everything generic (resolving that key
 * to an item, deciding which destinations apply, building URLs, rendering
 * the buttons) lives outside the adapter - see run.ts - so no site-specific
 * DOM logic ever touches item/navigation logic and vice versa.
 */
export interface SiteAdapter {
  readonly site: SiteId;

  /**
   * Parses `url` into a registry lookup key, or returns undefined if this
   * URL shape doesn't represent an item page at all (a search page, the
   * homepage, a build listing, ...). Returning a key here is not a
   * guarantee the item is recognized - that is decided by the registry
   * lookup that follows - only that the URL *looks like* an item page.
   */
  detectItemKey(url: URL): DetectedItemKey | undefined;

  /**
   * Locates the element Crossframe's navigation buttons should be
   * inserted after, once `item` is known to be the resolved item for this
   * page. May need to wait for client-side rendering. Resolves to
   * undefined if no safe location is found - callers must do nothing in
   * that case rather than fall back to a riskier insertion point.
   *
   * `destinations` is the final, settings-filtered list Crossframe is
   * about to render (see run.ts) - passed through so an adapter can make
   * an informed decision if it ever wants to react to *which* buttons
   * will actually appear (e.g. only replacing a host page's own Wiki link
   * if Crossframe's own Wiki button will actually be there to replace
   * it). Most adapters have no reason to look at it.
   */
  findInjectionAnchor(
    item: CanonicalItem,
    destinations: readonly Destination[],
  ): Promise<Element | undefined>;
}
