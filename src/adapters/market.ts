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
 * heading whose text matches the resolved item's own canonical name,
 * which only depends on the item's name being visible on its own page -
 * about as safe an assumption as a detail page can make - not on any
 * particular markup shape.
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
    return waitForElement(() => findHeadingByText(root, item.name), { root, timeoutMs: 5000 });
  },
};
