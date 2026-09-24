import type { SiteAdapter } from "./types";
import type { DetectedItemKey } from "../items/resolver";
import { resolveCanonicalItem } from "../items/resolver";
import { getDestinations } from "../navigation/destinations";
import { renderNavigation, insertAfter } from "../ui/buttons";
import { loadSettings, isSiteEnabled } from "../settings/settings";

const NAV_SELECTOR = ".crossframe-nav";
const NAV_KEY_ATTR = "data-crossframe-key";

/** A stable string identifying which item a given DetectedItemKey resolves to. */
function keyString(key: DetectedItemKey): string {
  return JSON.stringify(key);
}

/**
 * Monotonically-increasing id of the most recently *started* run. Lets an
 * in-flight run notice it's been superseded (see the comment near the end
 * of runAdapter) without needing anything heavier like cancellation.
 */
let latestRunId = 0;

/**
 * The pipeline every content script runs: Site Detection -> Canonical Item
 * Resolution -> Destination Rules -> UI Injection, exactly as laid out in
 * the design doc. Any failure along the way (unrecognized URL, unknown
 * item, no relevant destinations, no safe place to inject) simply stops
 * here and leaves the host page untouched - Crossframe never surfaces an
 * error to the page itself.
 *
 * Safe to call more than once for the same page load (see `watchAdapter`
 * below, which does exactly that) - re-running for the same resolved item
 * is a cheap no-op (checked before doing any of the real work), and
 * re-running for a *different* item (the common case: the site's own SPA
 * routing changed the URL without a full navigation) replaces whatever
 * was injected before rather than leaving stale buttons pointing at the
 * previous item, or leaving no buttons at all if the previous injection
 * got wiped out by the host page's own re-render.
 */
export async function runAdapter(
  adapter: SiteAdapter,
  location: Location = window.location,
): Promise<void> {
  const runId = ++latestRunId;
  // True once this run is no longer the most recent one started - checked
  // after every await point below (loadSettings and findInjectionAnchor
  // are both real async work a newer, faster-resolving call could finish
  // ahead of). Guards every DOM mutation this function makes, not just
  // the final insert: a slow, now-superseded run clearing the *newer*
  // run's already-correct nav would be just as wrong as it inserting a
  // stale one.
  const supersededByNewerRun = (): boolean => runId !== latestRunId;

  const settings = await loadSettings();
  if (supersededByNewerRun()) return;
  if (!isSiteEnabled(settings, adapter.site)) return;

  const url = new URL(location.href);
  const key = adapter.detectItemKey(url);
  if (!key) return;

  const thisKey = keyString(key);
  const existingNav = document.querySelector<HTMLElement>(NAV_SELECTOR);
  if (existingNav?.getAttribute(NAV_KEY_ATTR) === thisKey) return; // already correct for this item

  // Reaching here means whatever's currently injected (if anything) is for
  // a different item than the one the URL now points to - clear it
  // immediately, before any of the async work below, rather than only
  // right before inserting a replacement. Otherwise a page that legitimately
  // has nothing to show for its new URL (no matching item, no relevant
  // destinations, no safe anchor) would keep showing the *previous* item's
  // stale buttons forever, since nothing later in this function would ever
  // run to clear them.
  document.querySelectorAll(NAV_SELECTOR).forEach((stale) => stale.remove());

  const item = resolveCanonicalItem(key);
  if (!item) return;

  const destinations = getDestinations(item, adapter.site).filter((destination) =>
    isSiteEnabled(settings, destination.site),
  );
  if (destinations.length === 0) return;

  const anchor = await adapter.findInjectionAnchor(item, destinations);
  if (!anchor) return;
  // See supersededByNewerRun above - by this point a newer run may well
  // have already cleared and replaced whatever this run cleared earlier,
  // so inserting now would leave two nav bars (or the wrong one) rather
  // than just the current item's.
  if (supersededByNewerRun()) return;

  const nav = renderNavigation(destinations, settings.linkTarget, item.name);
  nav.setAttribute(NAV_KEY_ATTR, thisKey);
  insertAfter(anchor, nav);
}

/** How often to check `location.href` for a change. Short enough that a
 * SPA navigation's buttons appearing feels instant to a person, long
 * enough to be a total non-issue for a background timer running for the
 * lifetime of every matched tab (one string comparison, twice a second). */
const POLL_INTERVAL_MS = 500;

/**
 * Runs the pipeline now, then keeps re-running it whenever the URL changes
 * without a full page load - the normal way warframe.market and
 * overframe.gg navigate between items (both are single-page apps: clicking
 * around, or using warframe.market's own internal search, rewrites the
 * page's content and the address bar via JavaScript, without the browser
 * ever loading a new document). A content script only ever runs once, at
 * real page-load time, so without this a tab would work on first load and
 * then silently stop doing anything the moment an in-page navigation like
 * that happened - the page stays perfectly usable, Crossframe just never
 * finds out anything changed.
 *
 * Detected by polling `location.href` rather than hooking
 * `history.pushState`/`replaceState` (the more common technique for this):
 * tried that first, and confirmed via real-site debugging that it doesn't
 * work here - warframe.market's own router doesn't go through the
 * instance-level `window.history.pushState` property at all for its
 * internal search (most likely calling `History.prototype.pushState`
 * directly, or some other mechanism this project has no visibility into
 * from a minified bundle), so a patch on that property is simply never
 * invoked. Polling doesn't care *how* the URL changed - it notices
 * regardless of the mechanism, which is exactly the property needed here
 * given the actual mechanism turned out to be unknowable from the
 * outside. `runAdapter` itself is idempotent per resolved item (tags its
 * nav with a key, replaces it if the key changes, clears it if the new
 * URL resolves to nothing) and race-guarded against overlapping calls
 * finishing out of order.
 */
export function watchAdapter(adapter: SiteAdapter, location: Location = window.location): void {
  void runAdapter(adapter, location);

  let lastHref = location.href;
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      void runAdapter(adapter, location);
    }
  }, POLL_INTERVAL_MS);
}
