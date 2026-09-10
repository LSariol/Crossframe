import type { SiteAdapter } from "./types";
import { findHeadingByText, findLinkByText, waitForElement } from "../lib/dom";

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
 * item pages, where the item's name is the page's actual heading.
 *
 * Build pages are different: confirmed, from real build-page markup, that
 * the item's name is *not* in a heading there at all - the prominent
 * heading is the build's own arbitrary, user-chosen title (e.g. "Two Body
 * Problem | Sirius and Orion"). The item's name only appears as the last
 * crumb of the page's breadcrumb nav, e.g.:
 *   <nav aria-label="Breadcrumb">...
 *     <a href="/items/arsenal/7962/sirius-orion/">Sirius &amp; Orion</a>
 *   </nav>
 * findInjectionAnchor therefore falls back to a link matching the item's
 * name (rather than a heading) once no heading matches, and additionally
 * requires that link's href to itself be a valid arsenal item path -
 * matching by text alone would also accept an unrelated link elsewhere on
 * the page that happens to share the item's name (e.g. a "related
 * builds" list). The whole breadcrumb nav is used as the actual
 * insertion point (found via the link's closest `nav` ancestor) rather
 * than the tiny link itself, since a `<li>`/`<ul>` structure isn't a
 * reasonable place to insert an unrelated block of buttons.
 *
 * overframe.gg's robots.txt disallows AI crawlers site-wide, so nothing
 * here was ever verified by automated means - only by a human loading the
 * real, built extension in a real browser, or (for the build-page markup
 * above) sharing real DevTools output. Keep verifying changes to this
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
    return waitForElement(
      () => {
        const heading = findHeadingByText(document.body, item.name);
        if (heading) return heading;

        const link = findLinkByText(document.body, item.name);
        if (!link) return undefined;
        let pathname: string;
        try {
          pathname = new URL(link.href).pathname;
        } catch {
          return undefined;
        }
        if (!ARSENAL_ITEM_PATH.test(pathname)) return undefined;
        return link.closest("nav") ?? link.closest("li") ?? link;
      },
      { timeoutMs: 5000 },
    );
  },
};
