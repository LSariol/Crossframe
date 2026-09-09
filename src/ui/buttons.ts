import type { SiteId } from "../items/types";
import type { Destination } from "../navigation/destinations";

const SITE_LABELS: Record<SiteId, string> = {
  wiki: "Wiki",
  market: "Market",
  overframe: "Overframe",
};

const ROOT_CLASS = "crossframe-nav";
const LINK_CLASS = "crossframe-nav__link";

/** Builds the "[ Wiki ] [ Market ] [ Overframe ]"-style button group for `destinations`. */
export function renderNavigation(destinations: Destination[]): HTMLElement {
  const container = document.createElement("div");
  container.className = ROOT_CLASS;

  for (const destination of destinations) {
    const link = document.createElement("a");
    link.className = LINK_CLASS;
    link.dataset["crossframeSite"] = destination.site;
    link.href = destination.url;
    link.rel = "noopener noreferrer";
    link.textContent = SITE_LABELS[destination.site];
    container.appendChild(link);
  }

  return container;
}

/** Inserts `node` immediately after `anchor` in the DOM. */
export function insertAfter(anchor: Element, node: Element): void {
  anchor.insertAdjacentElement("afterend", node);
}
