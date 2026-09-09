import { describe, expect, it } from "vitest";
import type { CanonicalItem } from "../items/types";
import { getDestinations } from "./destinations";

const proteaPrime: CanonicalItem = {
  id: "protea_prime",
  name: "Protea Prime",
  category: "warframe",
  isPrime: true,
  wiki: { path: "/w/Protea/Prime" },
  market: { slug: "protea_prime_set" },
  overframe: { id: 6534, slug: "protea-prime" },
};

const tradableMod: CanonicalItem = {
  id: "primed_continuity",
  name: "Primed Continuity",
  category: "mod",
  isPrime: false,
  wiki: { path: "/w/Primed_Continuity" },
  market: { slug: "primed_continuity" },
};

const arcane: CanonicalItem = {
  id: "arcane_energize",
  name: "Arcane Energize",
  category: "arcane",
  isPrime: false,
  wiki: { path: "/w/Arcane_Energize" },
  market: { slug: "arcane_energize" },
};

const untradableWarframe: CanonicalItem = {
  id: "excalibur",
  name: "Excalibur",
  category: "warframe",
  isPrime: false,
  wiki: { path: "/w/Excalibur" },
  overframe: { id: 1, slug: "excalibur" },
};

const untradableResource: CanonicalItem = {
  id: "orokin_cell",
  name: "Orokin Cell",
  category: "resource",
  isPrime: false,
  wiki: { path: "/w/Orokin_Cell" },
};

describe("getDestinations", () => {
  it("shows Wiki, Market, and Overframe for Protea Prime when viewed on Market", () => {
    const destinations = getDestinations(proteaPrime, "market");
    expect(destinations).toEqual([
      { site: "wiki", url: "https://wiki.warframe.com/w/Protea/Prime" },
      { site: "overframe", url: "https://overframe.gg/items/arsenal/6534/protea-prime/" },
    ]);
  });

  it("never includes the current site", () => {
    const destinations = getDestinations(proteaPrime, "wiki");
    expect(destinations.some((d) => d.site === "wiki")).toBe(false);
  });

  it("omits Overframe for a tradable mod even though wiki+market exist", () => {
    const destinations = getDestinations(tradableMod, "wiki");
    expect(destinations).toEqual([
      { site: "market", url: "https://warframe.market/items/primed_continuity" },
    ]);
  });

  it("omits Overframe for arcanes", () => {
    const destinations = getDestinations(arcane, "market");
    expect(destinations.map((d) => d.site)).toEqual(["wiki"]);
  });

  it("omits Market for untradable equipment, keeping Overframe", () => {
    const destinations = getDestinations(untradableWarframe, "overframe");
    expect(destinations).toEqual([{ site: "wiki", url: "https://wiki.warframe.com/w/Excalibur" }]);
  });

  it("shows only Wiki for an untradable resource", () => {
    const destinations = getDestinations(untradableResource, "wiki");
    expect(destinations).toEqual([]);
  });

  it("shows nothing when the item has no destinations besides the current site", () => {
    const wikiOnly: CanonicalItem = {
      id: "solo",
      name: "Solo",
      category: "resource",
      isPrime: false,
      wiki: { path: "/w/Solo" },
    };
    expect(getDestinations(wikiOnly, "wiki")).toEqual([]);
  });
});
