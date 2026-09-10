import type { SiteAdapter } from "./types";
import { findHeadingByText, findLinkByText, waitForElement } from "../lib/dom";

const ITEM_PATH = /^\/items\/([a-z0-9_]+)\/?$/i;
const WIKI_LINK_SELECTOR = 'a[href^="https://wiki.warframe.com/"]';

/**
 * warframe.market renders its entire page client-side into a single
 * <section id="warframe_react">...</section> mount point - the initial
 * server response has no item content at all, only a <title> tag - so
 * there is no stable server-rendered selector to anchor on the way there
 * is for the wiki. Instead of guessing at whatever CSS-module class names
 * their React build happens to emit, findInjectionAnchor waits for a
 * heading whose text matches the resolved item's own name, which only
 * depends on the item's name being visible on its own page - about as
 * safe an assumption as a detail page can make - not on any particular
 * markup shape.
 *
 * For a Prime set, the listing (and its heading) is named "<Name> Set" -
 * e.g. "Protea Prime Set" - not the bare canonical name, so both are
 * tried; a Prime component's canonical name already includes "Blueprint"
 * etc. because it was generated to match its market listing exactly (see
 * scripts/lib/build-items.mjs), so it needs no such variant. Confirmed
 * from real markup that the heading actually splits "Set" into its own
 * adjacent span with no whitespace in between
 * (<h1><span>Acceltra Prime</span><span>Set</span></h1>, textContent
 * "Acceltra PrimeSet") - findHeadingByText's whitespace-insensitive
 * matching (see lib/dom.ts) handles this without needing special-casing
 * here.
 */
function findNameHeading(root: ParentNode, item: { name: string }) {
  return findHeadingByText(root, item.name, `${item.name} Set`);
}

/**
 * warframe.market shows its own outbound link to the item's wiki page
 * right next to the name, which duplicates Crossframe's own Wiki button.
 * Removed (only when Crossframe is actually about to show its own Wiki
 * button - see findInjectionAnchor) since it's redundant, not because
 * Crossframe generally touches host content - it doesn't, anywhere else.
 * If the link is the sole content of its immediate wrapper (the common
 * shape, confirmed from real markup: <div><a>Wiki</a></div>), that
 * wrapper is removed too rather than leaving an empty element behind;
 * otherwise just the link itself goes. A no-op, not an error, if no such
 * link is found - a future warframe.market redesign shouldn't need this
 * file to change to stay safe.
 */
function removeNativeWikiLink(root: ParentNode): void {
  const link = root.querySelector(WIKI_LINK_SELECTOR);
  if (!link) return;
  const parent = link.parentElement;
  if (parent && parent.children.length === 1) {
    parent.remove();
  } else {
    link.remove();
  }
}

/**
 * Anchors Crossframe's buttons after the item page's Orders/Statistics/
 * Drop Sources tab bar, per explicit user preference - after two rounds
 * of trying to fit them into the name/description area produced
 * inconsistent, hard-to-diagnose results (most likely a flex/grid layout
 * with an explicit visual order that doesn't match DOM order, which isn't
 * visible in plain HTML - would need computed styles or the site's actual
 * CSS to confirm). The tab bar is a much more stable anchor: a plain
 * <ul> of links identified by their own stable, human-readable text
 * ("Drop Sources") rather than by position relative to elements whose
 * layout isn't fully understood.
 */
function findTabsAnchor(root: ParentNode): Element | undefined {
  return findLinkByText(root, "Drop Sources")?.closest("ul") ?? undefined;
}

export const marketAdapter: SiteAdapter = {
  site: "market",

  detectItemKey(url) {
    const match = ITEM_PATH.exec(url.pathname);
    if (!match?.[1]) return undefined;
    return { site: "market", marketSlug: match[1].toLowerCase() };
  },

  async findInjectionAnchor(item, destinations) {
    const root = document.getElementById("warframe_react") ?? document.body;
    const showingOwnWikiButton = destinations.some((d) => d.site === "wiki");

    // Checks for the tab bar and the heading together on every poll tick,
    // rather than waiting specifically for the tab bar with a heading
    // fallback only once the whole timeout elapses: the tab bar is simple
    // static navigation, not data-dependent content, so in practice it's
    // there at least as early as the heading is - and if it somehow never
    // shows up, this shouldn't cost a real page 5 full seconds before
    // falling back to the heading, which would already be sitting there.
    return waitForElement(
      () => {
        const heading = findNameHeading(root, item);
        if (!heading) return undefined; // wait for the real item page, not a loading state
        if (showingOwnWikiButton) removeNativeWikiLink(root);
        return findTabsAnchor(root) ?? heading;
      },
      { root, timeoutMs: 5000 },
    );
  },
};
