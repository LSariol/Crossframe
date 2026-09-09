import type { SiteAdapter } from "./types";
import { findHeadingByText, waitForElement } from "../lib/dom";

/**
 * wiki.warframe.com is a standard MediaWiki install: every content page
 * lives at /w/<Title> (title case, spaces as underscores, subpages using a
 * literal "/" - e.g. "/w/Protea/Prime"), and content is rendered
 * server-side, so there's no client-rendering wait involved. Pages that
 * aren't items (update logs, lore, category pages, ...) use the exact
 * same /w/<Title> shape, so detectItemKey doesn't try to distinguish them
 * itself - it hands every /w/ path to the registry and lets an unknown
 * title resolve to nothing, which is what "fail silently" means here.
 */
export const wikiAdapter: SiteAdapter = {
  site: "wiki",

  detectItemKey(url) {
    if (!url.pathname.startsWith("/w/")) return undefined;
    let path: string;
    try {
      path = decodeURIComponent(url.pathname);
    } catch {
      path = url.pathname;
    }
    return { site: "wiki", wikiPath: path };
  },

  async findInjectionAnchor(item) {
    // #firstHeading is MediaWiki's standard page-title heading id, present
    // in every core skin. It falls back to a text match against the
    // item's own name in case a future skin ever drops that id.
    return waitForElement(
      () => document.getElementById("firstHeading") ?? findHeadingByText(document.body, item.name),
      // MediaWiki pages are server-rendered, so #firstHeading is normally
      // present the moment the content script runs; this is just a small
      // safety margin, not a real wait for client-side rendering.
      { timeoutMs: 1000 },
    );
  },
};
