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

  // Base crafting resources are never individually traded on
  // warframe.market - this is a hard rule, not a data-driven one (the
  // generator never even attempts a market cross-reference for resources;
  // see buildResourceItem in scripts/lib/build-items.mjs).
  resource: { wiki: true, market: false, overframe: false },

  // Exalted Weapons (Exalted Blade, Regulators, Iron Staff, ...) come
  // bundled with their Warframe and can never be independently bought or
  // sold - every WFCD entry confirms this with tradable: false - but they
  // are exactly the kind of thing Overframe covers (mod/build pages exist
  // for them).
  exaltedWeapon: { wiki: true, market: false, overframe: true },
};

export function isDestinationRelevant(category: ItemCategory, site: SiteId): boolean {
  return DESTINATION_RELEVANCE[category][site];
}
