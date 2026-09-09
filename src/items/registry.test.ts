import { describe, expect, it } from "vitest";
import type { CanonicalItem } from "./types";
import { createRegistry } from "./registry";

const proteaPrime: CanonicalItem = {
  id: "protea_prime",
  name: "Protea Prime",
  category: "warframe",
  isPrime: true,
  wiki: { path: "/w/Protea/Prime" },
  market: { slug: "protea_prime_set" },
  overframe: { id: 6534, slug: "protea-prime" },
};

const wikiOnly: CanonicalItem = {
  id: "orokin_cell",
  name: "Orokin Cell",
  category: "resource",
  isPrime: false,
  wiki: { path: "/w/Orokin_Cell" },
};

describe("createRegistry", () => {
  it("finds an item by its exact wiki path, market slug, and overframe id", () => {
    const reg = createRegistry([proteaPrime]);
    expect(reg.findByWikiPath("/w/Protea/Prime")).toBe(proteaPrime);
    expect(reg.findByMarketSlug("protea_prime_set")).toBe(proteaPrime);
    expect(reg.findByOverframeId(6534)).toBe(proteaPrime);
  });

  it("tolerates a trailing slash and percent-encoded wiki paths", () => {
    const reg = createRegistry([proteaPrime]);
    expect(reg.findByWikiPath("/w/Protea/Prime/")).toBe(proteaPrime);
    expect(reg.findByWikiPath("/w/Protea%2FPrime")).toBe(proteaPrime);
  });

  it("returns undefined for lookups on a destination the item doesn't have", () => {
    const reg = createRegistry([wikiOnly]);
    expect(reg.findByMarketSlug("orokin_cell")).toBeUndefined();
    expect(reg.findByOverframeId(1)).toBeUndefined();
  });

  it("returns undefined for a completely unknown key", () => {
    const reg = createRegistry([proteaPrime]);
    expect(reg.findByWikiPath("/w/Nonexistent_Item")).toBeUndefined();
  });

  it("exposes the full item list", () => {
    const reg = createRegistry([proteaPrime, wikiOnly]);
    expect(reg.items).toHaveLength(2);
  });

  it("resolves a shared wiki path to the parent item, never a prime component, regardless of order", () => {
    const component: CanonicalItem = {
      id: "protea_prime_systems_blueprint",
      name: "Protea Prime Systems Blueprint",
      category: "primeComponent",
      isPrime: true,
      wiki: { path: "/w/Protea/Prime" },
      market: { slug: "protea_prime_systems_blueprint" },
    };

    expect(createRegistry([proteaPrime, component]).findByWikiPath("/w/Protea/Prime")).toBe(
      proteaPrime,
    );
    expect(createRegistry([component, proteaPrime]).findByWikiPath("/w/Protea/Prime")).toBe(
      proteaPrime,
    );
  });
});
