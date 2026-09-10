/**
 * The three external sites Crossframe connects. Every other module keys off
 * this instead of raw hostnames so adding a fourth site is a type-checked,
 * exhaustive change rather than a hunt for string literals.
 */
export type SiteId = "wiki" | "market" | "overframe";

export const SITE_IDS: readonly SiteId[] = ["wiki", "market", "overframe"];

/**
 * The item categories Crossframe's destination rules and data generator
 * understand. "Prime" is deliberately not a separate category: it is the
 * `isPrime` flag on a regular category, since a Prime warframe/weapon uses
 * the same destination rules as its non-Prime counterpart and only differs
 * in whether a market listing actually exists.
 */
export type ItemCategory =
  | "warframe"
  | "primaryWeapon"
  | "secondaryWeapon"
  | "meleeWeapon"
  | "archgun"
  | "archmelee"
  | "archwing"
  | "companion"
  | "companionWeapon"
  | "mod"
  | "arcane"
  | "primeComponent"
  | "relic"
  | "resource"
  | "exaltedWeapon";

/** Path (no origin) of the item's page on wiki.warframe.com, e.g. "/w/Protea/Prime". */
export interface WikiDestination {
  path: string;
}

/** warframe.market item slug, e.g. "protea_prime_set". */
export interface MarketDestination {
  slug: string;
}

/** Overframe's arsenal item id and slug, e.g. 6534 and "protea-prime". */
export interface OverframeDestination {
  id: number;
  slug: string;
}

/**
 * A single Warframe item as Crossframe understands it, independent of any
 * one site's representation of it. `wiki`/`market`/`overframe` are absent
 * (not merely empty) when no corresponding page exists for this item -
 * absence is a real, meaningful state, not a loading placeholder.
 */
export interface CanonicalItem {
  /** Stable internal id, e.g. "protea_prime". Never shown to users. */
  id: string;
  /** Canonical display name, e.g. "Protea Prime". */
  name: string;
  category: ItemCategory;
  isPrime: boolean;
  wiki?: WikiDestination;
  market?: MarketDestination;
  overframe?: OverframeDestination;
}
