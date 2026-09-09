import type { SiteAdapter } from "./types";
import { resolveCanonicalItem } from "../items/resolver";
import { getDestinations } from "../navigation/destinations";
import { renderNavigation, insertAfter } from "../ui/buttons";
import { loadSettings, isSiteEnabled } from "../settings/settings";

const NAV_SELECTOR = ".crossframe-nav";

/**
 * The pipeline every content script runs: Site Detection -> Canonical Item
 * Resolution -> Destination Rules -> UI Injection, exactly as laid out in
 * the design doc. Any failure along the way (unrecognized URL, unknown
 * item, no relevant destinations, no safe place to inject) simply stops
 * here and leaves the host page untouched - Crossframe never surfaces an
 * error to the page itself.
 */
export async function runAdapter(
  adapter: SiteAdapter,
  location: Location = window.location,
): Promise<void> {
  if (document.querySelector(NAV_SELECTOR)) return; // already injected

  const settings = await loadSettings();
  if (!isSiteEnabled(settings, adapter.site)) return;

  const url = new URL(location.href);
  const key = adapter.detectItemKey(url);
  if (!key) return;

  const item = resolveCanonicalItem(key);
  if (!item) return;

  const destinations = getDestinations(item, adapter.site).filter((destination) =>
    isSiteEnabled(settings, destination.site),
  );
  if (destinations.length === 0) return;

  const anchor = await adapter.findInjectionAnchor(item);
  if (!anchor) return;
  if (document.querySelector(NAV_SELECTOR)) return; // a concurrent run beat us to it

  insertAfter(anchor, renderNavigation(destinations, settings.linkTarget));
}
