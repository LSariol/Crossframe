import type { SiteId } from "../items/types";
import type { Destination } from "../navigation/destinations";
import type { LinkTarget } from "../settings/settings";

const SITE_LABELS: Record<SiteId, string> = {
  wiki: "Wiki",
  market: "Market",
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
 */
export function renderNavigation(
  destinations: Destination[],
  linkTarget: LinkTarget = "new-tab",
): HTMLElement {
  const container = document.createElement("div");
  container.className = ROOT_CLASS;

  for (const destination of destinations) {
    const link = document.createElement("a");
    link.className = LINK_CLASS;
    link.dataset["crossframeSite"] = destination.site;
    link.href = destination.url;
    link.rel = "noopener noreferrer";
    if (linkTarget === "new-tab") link.target = "_blank";
    link.textContent = SITE_LABELS[destination.site];
    container.appendChild(link);
  }

  return container;
}

/** Inserts `node` immediately after `anchor` in the DOM. */
export function insertAfter(anchor: Element, node: Element): void {
  anchor.insertAdjacentElement("afterend", node);
}
