import type { SiteAdapter } from "./types";
import { findHeadingByText, waitForElement } from "../lib/dom";

const ARSENAL_ITEM_PATH = /^\/items\/arsenal\/(\d+)\/[a-z0-9-]+\/?$/i;

/**
 * Overframe identifies an item by both a numeric id and a slug in its URL
 * (/items/arsenal/<id>/<slug>/ - the id is load-bearing; a slug-only path
 * 404s). That shape already distinguishes real item pages from Overframe's
 * other page types (tier lists, generic build listings, the homepage) on
 * its own, so detectItemKey needs nothing beyond the regex.
 *
 * overframe.gg's robots.txt disallows AI crawlers site-wide, so this
 * adapter's injection strategy should be treated as unverified: one live
 * automated check (which shouldn't have been run, given the robots.txt
 * restriction above, and wasn't repeated) found no injection on a real
 * item page, but couldn't distinguish a real gap in the heuristic below
 * from Overframe's bot-protection serving a challenge page instead of
 * real content. Unlike wiki.ts and market.ts, do not treat this adapter
 * as confirmed working without checking it in a real browser by hand
 * first. It uses the same name-matching heuristic as the Market adapter
 * (see market.ts): it only depends on the item's name being visible
 * somewhere on its own page, not on any specific selector - but that
 * assumption itself is unverified here.
 */
export const overframeAdapter: SiteAdapter = {
  site: "overframe",

  detectItemKey(url) {
    const match = ARSENAL_ITEM_PATH.exec(url.pathname);
    if (!match?.[1]) return undefined;
    return { site: "overframe", overframeId: Number(match[1]) };
  },

  async findInjectionAnchor(item) {
    return waitForElement(() => findHeadingByText(document.body, item.name), { timeoutMs: 5000 });
  },
};
