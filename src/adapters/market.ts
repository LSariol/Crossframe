import type { SiteAdapter } from "./types";
import { findHeadingByText, waitForElement } from "../lib/dom";

const ITEM_PATH = /^\/items\/([a-z0-9_]+)\/?$/i;

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
 * scripts/lib/build-items.mjs), so it needs no such variant.
 */
export const marketAdapter: SiteAdapter = {
  site: "market",

  detectItemKey(url) {
    const match = ITEM_PATH.exec(url.pathname);
    if (!match?.[1]) return undefined;
    return { site: "market", marketSlug: match[1].toLowerCase() };
  },

  async findInjectionAnchor(item) {
    const root = document.getElementById("warframe_react") ?? document.body;
    return waitForElement(() => findHeadingByText(root, item.name, `${item.name} Set`), {
      root,
      timeoutMs: 5000,
    });
  },
};
