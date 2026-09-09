import { describe, expect, it } from "vitest";
import type { CanonicalItem } from "../items/types";
import { buildDestinationUrl } from "./url";

const proteaPrime: CanonicalItem = {
  id: "protea_prime",
  name: "Protea Prime",
  category: "warframe",
  isPrime: true,
  wiki: { path: "/w/Protea/Prime" },
  market: { slug: "protea_prime_set" },
  overframe: { id: 6534, slug: "protea-prime" },
};

describe("buildDestinationUrl", () => {
  it("builds the exact Protea Prime URLs from the design spec", () => {
    expect(buildDestinationUrl(proteaPrime, "wiki")).toBe(
      "https://wiki.warframe.com/w/Protea/Prime",
    );
    expect(buildDestinationUrl(proteaPrime, "market")).toBe(
      "https://warframe.market/items/protea_prime_set",
    );
    expect(buildDestinationUrl(proteaPrime, "overframe")).toBe(
      "https://overframe.gg/items/arsenal/6534/protea-prime/",
    );
  });

  it("returns undefined when the item has no page on that site", () => {
    const wikiOnly: CanonicalItem = {
      id: "orokin_cell",
      name: "Orokin Cell",
      category: "resource",
      isPrime: false,
      wiki: { path: "/w/Orokin_Cell" },
    };
    expect(buildDestinationUrl(wikiOnly, "market")).toBeUndefined();
    expect(buildDestinationUrl(wikiOnly, "overframe")).toBeUndefined();
  });
});
