import type { SiteAdapter } from "./types";
import { findHeadingByText, waitForElement } from "../lib/dom";

// Item page: /items/arsenal/<id>/<slug>/ - the id is load-bearing (a
// slug-only path 404s), and paired with the slug in every generated
// registry entry (scripts/lib/build-items.mjs), so either can resolve it.
const ARSENAL_ITEM_PATH = /^\/items\/arsenal\/(\d+)\/([a-z0-9-]+)\/?$/i;

// Build page: /build/<buildId>/<frameSlug>/<buildTitleSlug>/ - buildId
// identifies the build itself, not the item, so it's not useful for
// lookup. frameSlug is the same slug the item page uses, so resolution
// falls back to that. This pattern already distinguishes item and build
// pages from Overframe's other page types (tier lists, generic build
// *listings*, the homepage) without any further filtering.
const BUILD_PAGE_PATH = /^\/build\/\d+\/([a-z0-9-]+)\/[a-z0-9-]+\/?$/i;

/**
 * Confirmed working (by manual testing against the live site) on arsenal
 * item pages. Build pages are a newer addition and use the same
 * name-matching injection strategy, on the reasonable assumption that a
 * build page displays its Warframe/weapon's name prominently too, but
 * that assumption hasn't been separately confirmed the way the item-page
 * behavior has - see the design decisions in git history around this file
 * if that ever needs revisiting.
 *
 * overframe.gg's robots.txt disallows AI crawlers site-wide, so nothing
 * here was ever verified by automated means - only by a human loading the
 * real, built extension in a real browser. Keep verifying changes to this
 * file that way rather than by adding automated fetches against the live
 * site.
 */
export const overframeAdapter: SiteAdapter = {
  site: "overframe",

  detectItemKey(url) {
    const itemMatch = ARSENAL_ITEM_PATH.exec(url.pathname);
    if (itemMatch?.[1]) {
      return { site: "overframe", overframeId: Number(itemMatch[1]) };
    }
    const buildMatch = BUILD_PAGE_PATH.exec(url.pathname);
    if (buildMatch?.[1]) {
      return { site: "overframe", overframeSlug: buildMatch[1].toLowerCase() };
    }
    return undefined;
  },

  async findInjectionAnchor(item) {
    return waitForElement(() => findHeadingByText(document.body, item.name), { timeoutMs: 5000 });
  },
};
