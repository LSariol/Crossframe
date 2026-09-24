import { describe, expect, it } from "vitest";
import type { Destination } from "../navigation/destinations";
import { renderNavigation, insertAfter } from "./buttons";

describe("renderNavigation", () => {
  it("renders one anchor per destination with the right label, href, and site attribute", () => {
    const destinations: Destination[] = [
      { site: "market", url: "https://warframe.market/items/protea_prime_set" },
      { site: "overframe", url: "https://overframe.gg/items/arsenal/6534/protea-prime/" },
    ];

    const nav = renderNavigation(destinations);
    const links = nav.querySelectorAll("a");

    expect(nav.className).toBe("crossframe-nav");
    expect(links).toHaveLength(2);
    expect(links[0]?.textContent).toBe("Market");
    expect(links[0]?.href).toBe("https://warframe.market/items/protea_prime_set");
    expect(links[0]?.dataset["crossframeSite"]).toBe("market");
    expect(links[1]?.textContent).toBe("Overframe");
  });

  it("renders normal anchor elements so click/middle-click/ctrl+click behave normally", () => {
    const nav = renderNavigation([{ site: "wiki", url: "https://wiki.warframe.com/w/Protea" }]);
    const link = nav.querySelector("a");
    expect(link?.tagName).toBe("A");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders nothing when given no destinations", () => {
    const nav = renderNavigation([]);
    expect(nav.children).toHaveLength(0);
  });

  it("is a <nav> landmark with its own accessible name, distinct from the host page's own navigation", () => {
    const nav = renderNavigation([{ site: "wiki", url: "https://wiki.warframe.com/w/Protea" }]);
    expect(nav.tagName).toBe("NAV");
    expect(nav.getAttribute("aria-label")).toBe("Crossframe");
  });

  it("gives each link an aria-label with the full site name and item name, since the short visible label alone is ambiguous out of context", () => {
    const nav = renderNavigation(
      [{ site: "wiki", url: "https://wiki.warframe.com/w/Protea/Prime" }],
      "new-tab",
      "Protea Prime",
    );
    const link = nav.querySelector("a");
    expect(link?.getAttribute("aria-label")).toBe(
      "View Protea Prime on Warframe Wiki (opens in a new tab)",
    );
  });

  it("degrades the aria-label gracefully when no item name is given", () => {
    const nav = renderNavigation([{ site: "market", url: "https://warframe.market/items/x" }]);
    const link = nav.querySelector("a");
    expect(link?.getAttribute("aria-label")).toBe("View on Warframe.Market (opens in a new tab)");
  });

  it("omits the 'opens in a new tab' suffix when linkTarget is same-tab", () => {
    const nav = renderNavigation(
      [{ site: "overframe", url: "https://overframe.gg/items/arsenal/1/x/" }],
      "same-tab",
    );
    const link = nav.querySelector("a");
    expect(link?.getAttribute("aria-label")).toBe("View on Overframe");
    expect(link?.target).toBe("");
  });
});

describe("insertAfter", () => {
  it("places the node immediately after the anchor as a sibling", () => {
    document.body.innerHTML = `<div id="anchor"></div><div id="after"></div>`;
    const anchor = document.getElementById("anchor")!;
    const node = document.createElement("span");
    node.id = "inserted";

    insertAfter(anchor, node);

    expect(anchor.nextElementSibling?.id).toBe("inserted");
    expect(document.getElementById("inserted")?.nextElementSibling?.id).toBe("after");
  });
});
