import type { ItemCategory } from "../items/types";
import type { SiteId } from "../items/types";

/**
 * Whether a destination is ever *useful* for a category, independent of
 * whether a page actually exists for one specific item. This is the single
 * place category-based navigation decisions are made - e.g. "Mods don't get
 * an Overframe button" - so no adapter or UI code should branch on category
 * itself. Whether a specific item's page actually exists is a separate,
 * data-driven question answered by the resolver (see destinations.ts).
 */
type RelevanceTable = Record<ItemCategory, Record<SiteId, boolean>>;

const DESTINATION_RELEVANCE: RelevanceTable = {
  warframe: { wiki: true, market: true, overframe: true },
  primaryWeapon: { wiki: true, market: true, overframe: true },
  secondaryWeapon: { wiki: true, market: true, overframe: true },
  meleeWeapon: { wiki: true, market: true, overframe: true },
  archgun: { wiki: true, market: true, overframe: true },
  archmelee: { wiki: true, market: true, overframe: true },
  archwing: { wiki: true, market: true, overframe: true },
  companion: { wiki: true, market: true, overframe: true },
  companionWeapon: { wiki: true, market: true, overframe: true },

  // Overframe is a build-planning site: it has no meaningful destination for
  // items that aren't equipped/built, so these three are wiki+market only.
  mod: { wiki: true, market: true, overframe: false },
  arcane: { wiki: true, market: true, overframe: false },

  // Individual Prime parts and relics don't have their own build pages
  // either, and don't have their own wiki pages distinct from the parent
  // item/relic-tier page (the resolver points them at that shared page).
  primeComponent: { wiki: true, market: true, overframe: false },
  relic: { wiki: true, market: true, overframe: false },

  // Most crafting resources aren't traded on warframe.market at all; the
  // rare ones that are will still surface a Market button because that's
  // data-driven (see destinations.ts), not decided here.
  resource: { wiki: true, market: false, overframe: false },
};

export function isDestinationRelevant(category: ItemCategory, site: SiteId): boolean {
  return DESTINATION_RELEVANCE[category][site];
}
