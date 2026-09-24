import { describe, expect, it } from "vitest";
import type { ItemCategory } from "../items/types";
import { isDestinationRelevant } from "./rules";

describe("isDestinationRelevant", () => {
  it("makes all three destinations relevant for equipment categories", () => {
    const equipmentCategories: ItemCategory[] = [
      "warframe",
      "primaryWeapon",
      "secondaryWeapon",
      "meleeWeapon",
      "archgun",
      "archmelee",
      "archwing",
      "companion",
      "companionWeapon",
    ];
    for (const category of equipmentCategories) {
      expect(isDestinationRelevant(category, "wiki")).toBe(true);
      expect(isDestinationRelevant(category, "market")).toBe(true);
      expect(isDestinationRelevant(category, "overframe")).toBe(true);
    }
  });

  it("excludes Overframe for mods, arcanes, and relics", () => {
    const noBuildCategories: ItemCategory[] = ["mod", "arcane", "relic"];
    for (const category of noBuildCategories) {
      expect(isDestinationRelevant(category, "wiki")).toBe(true);
      expect(isDestinationRelevant(category, "market")).toBe(true);
      expect(isDestinationRelevant(category, "overframe")).toBe(false);
    }
  });

  it("makes Overframe relevant for Prime components too - it points at the parent item's page, not the component's own", () => {
    expect(isDestinationRelevant("primeComponent", "wiki")).toBe(true);
    expect(isDestinationRelevant("primeComponent", "market")).toBe(true);
    expect(isDestinationRelevant("primeComponent", "overframe")).toBe(true);
  });

  it("only makes Wiki relevant for resources", () => {
    expect(isDestinationRelevant("resource", "wiki")).toBe(true);
    expect(isDestinationRelevant("resource", "market")).toBe(false);
    expect(isDestinationRelevant("resource", "overframe")).toBe(false);
  });

  it("makes Wiki and Overframe relevant for Exalted Weapons, but never Market", () => {
    // Bundled with their Warframe - never independently tradable.
    expect(isDestinationRelevant("exaltedWeapon", "wiki")).toBe(true);
    expect(isDestinationRelevant("exaltedWeapon", "market")).toBe(false);
    expect(isDestinationRelevant("exaltedWeapon", "overframe")).toBe(true);
  });
});
