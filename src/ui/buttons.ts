import type { SiteId } from "../items/types";
import type { Destination } from "../navigation/destinations";
import type { LinkTarget } from "../settings/settings";

const SITE_LABELS: Record<SiteId, string> = {
  wiki: "Wiki",
  market: "Market",
  overframe: "Overframe",
};

/**
 * Full site names, used only for the accessible name of each link (screen
 * readers announce this instead of the short visible label) and the "opens
 * a new tab" suffix - "Wiki" alone is ambiguous out of context, but
 * "Warframe Wiki" isn't.
 */
const SITE_FULL_NAMES: Record<SiteId, string> = {
  wiki: "Warframe Wiki",
  market: "Warframe.Market",
  overframe: "Overframe",
};

const ROOT_CLASS = "crossframe-nav";
const LINK_CLASS = "crossframe-nav__link";

/**
 * Builds the "[ Wiki ] [ Market ] [ Overframe ]"-style button group for
 * `destinations`, as plain anchor elements so click/middle-click/ctrl-click
 * all behave normally. `linkTarget` mirrors the standard `target="_blank"`
 * behavior; it's only a default, never a restriction - a modifier click
 * still opens wherever the browser normally would.
 *
 * The container is a `<nav>` with its own accessible name so screen reader
 * users can jump straight to it (or skip it) as a landmark distinct from
 * the host page's own navigation, and each link's `aria-label` spells out
 * the full site name plus - when known - the item name, since the short
 * visible label ("Wiki") reads as ambiguous on its own without that
 * context. `itemName` is optional because not every caller has it handy
 * (e.g. existing tests); the label degrades gracefully to just the site
 * name when it's omitted.
 */
export function renderNavigation(
  destinations: Destination[],
  linkTarget: LinkTarget = "new-tab",
  itemName?: string,
): HTMLElement {
  const container = document.createElement("nav");
  container.className = ROOT_CLASS;
  container.setAttribute("aria-label", "Crossframe");

  for (const destination of destinations) {
    const link = document.createElement("a");
    link.className = LINK_CLASS;
    link.dataset["crossframeSite"] = destination.site;
    link.href = destination.url;
    link.rel = "noopener noreferrer";
    const fullName = SITE_FULL_NAMES[destination.site];
    const opensNewTab = linkTarget === "new-tab";
    if (opensNewTab) link.target = "_blank";
    link.textContent = SITE_LABELS[destination.site];
    link.setAttribute(
      "aria-label",
      `${itemName ? `View ${itemName} on ${fullName}` : `View on ${fullName}`}${
        opensNewTab ? " (opens in a new tab)" : ""
      }`,
    );
    container.appendChild(link);
  }

  return container;
}

/** Inserts `node` immediately after `anchor` in the DOM. */
export function insertAfter(anchor: Element, node: Element): void {
  anchor.insertAdjacentElement("afterend", node);
}
