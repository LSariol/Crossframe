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
