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
  it("finds an item by its exact wiki path, market slug, and overframe id/slug", () => {
    const reg = createRegistry([proteaPrime]);
    expect(reg.findByWikiPath("/w/Protea/Prime")).toBe(proteaPrime);
    expect(reg.findByMarketSlug("protea_prime_set")).toBe(proteaPrime);
    expect(reg.findByOverframeId(6534)).toBe(proteaPrime);
    expect(reg.findByOverframeSlug("protea-prime")).toBe(proteaPrime);
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
    expect(reg.findByOverframeSlug("orokin-cell")).toBeUndefined();
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

  it("resolves a shared Overframe id/slug to the parent item, never a prime component, regardless of order", () => {
    // Components have no Overframe build page of their own, so they reuse
    // their parent's id/slug directly (see generate-data.mjs and
    // rules.ts) - the same kind of collision as the shared wiki path
    // above, and it needs the exact same "parent always wins" protection.
    // Caught for real during development: without this, findByOverframeId
    // started returning a component instead of Protea Prime itself the
    // moment components picked up their parent's Overframe id.
    const component: CanonicalItem = {
      id: "protea_prime_systems_blueprint",
      name: "Protea Prime Systems Blueprint",
      category: "primeComponent",
      isPrime: true,
      wiki: { path: "/w/Protea/Prime" },
      market: { slug: "protea_prime_systems_blueprint" },
      overframe: { id: 6534, slug: "protea-prime" },
    };

    expect(createRegistry([proteaPrime, component]).findByOverframeId(6534)).toBe(proteaPrime);
    expect(createRegistry([component, proteaPrime]).findByOverframeId(6534)).toBe(proteaPrime);
    expect(createRegistry([proteaPrime, component]).findByOverframeSlug("protea-prime")).toBe(
      proteaPrime,
    );
    expect(createRegistry([component, proteaPrime]).findByOverframeSlug("protea-prime")).toBe(
      proteaPrime,
    );
  });
});
