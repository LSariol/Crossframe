# Item resolution

This is the "how does Crossframe know Protea/Prime, protea_prime_set, and
6534/protea-prime are the same item" system - the core problem the design
doc identifies as requiring "an item-resolution layer between page
detection and URL generation."

## The types (`src/items/types.ts`)

```ts
type SiteId = "wiki" | "market" | "overframe";

type ItemCategory =
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
  | "resource";

interface CanonicalItem {
  id: string; // stable internal id, e.g. "protea_prime" - never shown to users
  name: string; // canonical display name, e.g. "Protea Prime"
  category: ItemCategory;
  isPrime: boolean;
  wiki?: { path: string }; // e.g. "/w/Protea/Prime"
  market?: { slug: string }; // e.g. "protea_prime_set"
  overframe?: { id: number; slug: string }; // e.g. { id: 6534, slug: "protea-prime" }
}
```

Two things worth calling out:

- **`isPrime` is a flag, not a separate branch of the category union.** A
  Prime Warframe uses exactly the same destination rules as a non-Prime one
  (see `navigation/rules.ts`) - the only thing that differs is whether a
  Market listing actually exists, which is a data question, not a rules
  question. Baking "Prime Warframe" in as its own category would mean
  duplicating every equipment category's rule.
- **`wiki`/`market`/`overframe` being absent is a real, final state, not a
  loading placeholder.** Primed Continuity has no `overframe` key at all -
  not because Crossframe hasn't checked, but because there's genuinely
  nothing useful to link to there (see `rules.ts`). This is what lets
  `getDestinations` be a pure function of already-known data with no
  "still figuring it out" state to handle.

## The registry (`src/items/registry.ts`)

`data/items.json` (generated - see [data-sources.md](data-sources.md)) is
an array of `CanonicalItem`. The registry loads it once at content-script
startup and builds three `Map`s for O(1) lookup:

- wiki path -> item
- market slug -> item
- Overframe id -> item

One subtlety: Prime components (e.g. "Protea Prime Chassis Blueprint")
deliberately reuse their parent item's wiki path, because they have no
wiki page of their own - the wiki documents Prime parts as a section of
the parent item's page, not as separate pages. That means the wiki-path
index can have two `CanonicalItem`s claiming the same key. The registry
resolves this by construction, not by array ordering: a component entry
is never allowed to win the wiki-path index slot over its parent,
regardless of which one happens to be processed first. (This was a real
bug caught during development - see the "Add Warframe data generator..."
commit - which is why it's covered by a dedicated regression test in
`registry.test.ts` rather than just described here.)

## The resolver (`src/items/resolver.ts`)

```ts
type DetectedItemKey =
  | { site: "wiki"; wikiPath: string }
  | { site: "market"; marketSlug: string }
  | { site: "overframe"; overframeId: number };

function resolveCanonicalItem(key: DetectedItemKey): CanonicalItem | undefined;
```

This is a thin, deliberately dumb layer: it exists so that a `SiteAdapter`
(see [architecture.md](architecture.md)) only has to know how to extract
_its own_ site's identifier from a URL - not how the registry is indexed,
and not what the other two sites' identifiers look like. `DetectedItemKey`
being a discriminated union (rather than three optional fields on one
object) makes "which key did this adapter actually produce" unambiguous at
the type level.

Returning `undefined` here is not an error path - it's the normal, expected
outcome for the vast majority of pages a content script will ever run on
(every Wiki page that isn't a supported item, every Market listing that
isn't in the registry yet, ...). "If detection fails, do nothing" falls
directly out of this function returning `undefined` and `runAdapter`
stopping there; no separate exclusion logic is needed for pages the
registry doesn't recognize.

## Worked example: Protea Prime

```json
{
  "id": "protea_prime",
  "name": "Protea Prime",
  "category": "warframe",
  "isPrime": true,
  "wiki": { "path": "/w/Protea/Prime" },
  "market": { "slug": "protea_prime_set" },
  "overframe": { "id": 6534, "slug": "protea-prime" }
}
```

- On `wiki.warframe.com/w/Protea/Prime`, `wikiAdapter.detectItemKey` reads
  `{ site: "wiki", wikiPath: "/w/Protea/Prime" }` straight from the URL
  (MediaWiki page paths already _are_ the identifier - no DOM parsing
  needed to know _which_ item this is, only to know _where_ to put the
  buttons).
- `resolveCanonicalItem` finds this exact object via the wiki-path index.
- `getDestinations(item, "wiki")` excludes `wiki` (the current site) and
  returns Market + Overframe, since both keys are present and both
  destinations are relevant for the `warframe` category.
- `buildDestinationUrl` turns those into
  `https://warframe.market/items/protea_prime_set` and
  `https://overframe.gg/items/arsenal/6534/protea-prime/`.

The same object resolves correctly starting from any of the three sites -
that's the entire point of having one canonical representation instead of
three site-specific ones talking to each other directly.
