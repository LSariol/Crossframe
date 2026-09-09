import { describe, expect, it } from "vitest";
import type { CanonicalItem } from "./types";
import { createRegistry } from "./registry";
import { resolveCanonicalItem } from "./resolver";

const proteaPrime: CanonicalItem = {
  id: "protea_prime",
  name: "Protea Prime",
  category: "warframe",
  isPrime: true,
  wiki: { path: "/w/Protea/Prime" },
  market: { slug: "protea_prime_set" },
  overframe: { id: 6534, slug: "protea-prime" },
};

const testRegistry = createRegistry([proteaPrime]);

describe("resolveCanonicalItem", () => {
  it("resolves a wiki path to the canonical item", () => {
    const item = resolveCanonicalItem({ site: "wiki", wikiPath: "/w/Protea/Prime" }, testRegistry);
    expect(item).toBe(proteaPrime);
  });

  it("resolves a market slug to the canonical item", () => {
    const item = resolveCanonicalItem(
      { site: "market", marketSlug: "protea_prime_set" },
      testRegistry,
    );
    expect(item).toBe(proteaPrime);
  });

  it("resolves an overframe id to the canonical item", () => {
    const item = resolveCanonicalItem({ site: "overframe", overframeId: 6534 }, testRegistry);
    expect(item).toBe(proteaPrime);
  });

  it("returns undefined for an unknown key on any site", () => {
    expect(
      resolveCanonicalItem({ site: "wiki", wikiPath: "/w/Nonexistent" }, testRegistry),
    ).toBeUndefined();
    expect(
      resolveCanonicalItem({ site: "market", marketSlug: "nonexistent" }, testRegistry),
    ).toBeUndefined();
    expect(
      resolveCanonicalItem({ site: "overframe", overframeId: 999999 }, testRegistry),
    ).toBeUndefined();
  });
});
