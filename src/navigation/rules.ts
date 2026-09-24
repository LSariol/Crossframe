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

  // Individual Prime parts don't have their own build page on Overframe -
  // only the finished item does - but Overframe *is* still a relevant
  // destination for them: someone looking at "Acceltra Prime Receiver" on
  // warframe.market almost certainly wants the build for the completed
  // "Acceltra Prime", not nothing. The generator gives each component's
  // own registry entry the *parent* item's Overframe id/slug directly
  // (see generate-data.mjs), the same way it already reuses the parent's
  // wiki path - so this is still "does this item have that destination,"
  // just resolved via the parent's data rather than the component's own.
  primeComponent: { wiki: true, market: true, overframe: true },
  // Relics don't have their own wiki pages distinct from the parent
  // relic-tier page (the resolver points them at that shared page)
  // either, but unlike Prime components there's no single "parent build"
  // an Overframe link would make sense pointing at - a relic can drop
  // parts for many different, unrelated items, so there's no one
  // Overframe page that's obviously "the" destination the way a
  // component's parent item is.
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
