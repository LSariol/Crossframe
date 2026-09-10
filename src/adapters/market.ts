import type { SiteAdapter } from "./types";
import { findHeadingByText, waitForElement } from "../lib/dom";

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
 * right next to the name (confirmed from real markup:
 * <div class="name-container">
 *   <div class="name">...heading...</div>
 *   <div class="inlined-attrs"><div>Description</div><div><a href="https://wiki.warframe.com/...">Wiki</a></div></div>
 * </div>
 * ), which duplicates Crossframe's own Wiki button. Per explicit user
 * feedback (real screenshot + DevTools output), when Crossframe is about
 * to show its own Wiki button anyway, this removes the redundant native
 * link and centers whatever's left in its place (just "Description" in
 * practice), returning the name's own wrapper as the injection anchor so
 * Crossframe's buttons land in the freed-up space between the name and
 * that now-centered row.
 *
 * This reaches further into the host page's own content than anything
 * else in Crossframe does - a deliberate, explicit exception to "don't
 * modify the host page" for this one redundant element, not a pattern to
 * extend elsewhere without similarly explicit reasoning. Every step is
 * independently optional: if the structure doesn't match what's
 * documented above (a future warframe.market redesign, an A/B test, a
 * locale variant), this quietly does nothing and falls through to the
 * plain heading anchor - the same as if this function didn't exist at
 * all. Never throws, never assumes.
 */
function repositionAroundNativeWikiLink(heading: Element): Element {
  const nameWrapper = heading.parentElement;
  const attrsRow = nameWrapper?.nextElementSibling;
  const wikiLink = attrsRow?.querySelector(WIKI_LINK_SELECTOR);
  if (!nameWrapper || !attrsRow || !wikiLink) return heading;

  // The <a> itself is usually wrapped in its own <div> alongside
  // "Description" as attrsRow's direct children - remove that wrapper,
  // not just the link, so no empty element is left behind. Walks up from
  // the link rather than assuming a fixed nesting depth, and gives up
  // (removing nothing) if the link somehow isn't inside attrsRow at all.
  let wikiWrapper: Element | null = wikiLink;
  while (wikiWrapper && wikiWrapper.parentElement !== attrsRow) {
    wikiWrapper = wikiWrapper.parentElement;
  }
  if (!wikiWrapper) return heading;

  wikiWrapper.remove();
  if (attrsRow instanceof HTMLElement) {
    attrsRow.style.justifyContent = "center";
    attrsRow.style.textAlign = "center";
  }
  return nameWrapper;
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
    const heading = await waitForElement(() => findNameHeading(root, item), {
      root,
      timeoutMs: 5000,
    });
    if (!heading) return undefined;

    const showingOwnWikiButton = destinations.some((d) => d.site === "wiki");
    return showingOwnWikiButton ? repositionAroundNativeWikiLink(heading) : heading;
  },
};
