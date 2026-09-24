# Data sources

Crossframe ships a static registry (`data/items.json`) built ahead of time by
`npm run generate-data` (`scripts/generate-data.mjs`). The extension never
queries any of these sources at runtime - it only reads the bundled JSON.

## Sources used

### WFCD/warframe-items (primary source)

`scripts/lib/sources.mjs` fetches per-category JSON files from
[WFCD/warframe-items](https://github.com/WFCD/warframe-items) on
`raw.githubusercontent.com` - a community-maintained dataset generated from
Warframe's own game data. This is the source for canonical names,
categories, `isPrime`, tradable Prime component parts, and (for most
categories) wiki paths via its `wikiaUrl` field.

Categories consumed: `Warframes`, `Primary`, `Secondary`, `Melee`,
`Arch-Gun`, `Arch-Melee`, `Archwing`, `Pets`, `Sentinels`, `SentinelWeapons`,
`Mods`, `Arcanes`, `Resources`, `Relics`, and (filtered - see below) `Misc`.
Categories deliberately **not** consumed at all: `Enemy`, `Fish`, `Gear`,
`Glyphs`, `Node`, `Quests`, `Railjack`, `Sigils`, `Skins`, `i18n` - these
aren't "items" in the navigational sense Crossframe cares about.

`Misc` is a 1,256-entry grab-bag of collectibles, decorations, and
inconsistently tagged resources - too noisy to trust wholesale, and still
mostly ignored - but one `productCategory` value within it,
`"SpecialItems"`, turned out (verified by checking every entry at the time
it was added) to be a small, clean 36-entry set containing exactly one
thing: **Exalted Weapons** (Exalted Blade, Regulators, Iron Staff, ...) -
see `buildExaltedWeaponItem` in `scripts/lib/build-items.mjs`. Everything
else in `Misc` (companion-part components, Kitgun/Zaw component pieces,
duplicate/inconsistent entries) is still ignored.

### warframe.market v2 API (market cross-reference)

`https://api.warframe.market/v2/items` is warframe.market's public,
documented item API. The generator builds a name -> slug index from it and
cross-references every generated item by display name to decide whether a
Market destination exists and what its slug is - it does **not** trust
WFCD's own `tradable` flag for this, because that flag describes the raw
game item (e.g. a Prime Warframe object itself, which can't be traded
directly) rather than whatever the actually-listed market entity is (e.g.
its "X Prime Set"). For Prime items, the generator tries `"<Name> Set"`
first and falls back to the exact name.

### Overframe (explicit overrides only, no bulk source)

Overframe has no public API, and its `robots.txt` explicitly disallows AI
crawlers (including this tool) and disallows `/api/` for everyone. Bulk
scraping was therefore never on the table (nor is HTML-scraping in general
here, per the design doc's preference for structured data over scraping).

`data/overrides/overframe.json` is the **entire** source of Overframe data:
a hand-maintained `{ "<canonicalId>": { "id": number, "slug": string } }`
map. Every entry in it was verified by opening that one item's real
Overframe page - as of this writing that's 835 mappings, covering all 121
Warframes and the large majority of standard weapons, companions, and
archwing gear (gathered via `scripts/apply-overframe-urls.mjs`, see
below). Kitguns, Zaws, and companion Helminth "Claws"/"Talons" variants
remain uncovered - see "Known limitations" below for why that's a
different, bigger problem than the rest of this list. This is
intentionally built up incrementally by hand rather than guessed. See
"Adding or fixing an Overframe mapping" below.

### wiki.warframe.com (never queried directly)

wiki.warframe.com's `robots.txt` disallows `ClaudeBot` site-wide and
disallows `/*api.php` for every user agent. The generator therefore never
queries the wiki directly; it relies entirely on WFCD's already-published
`wikiaUrl` field. Where that field is absent (see below), Crossframe falls
back to the standard MediaWiki title transform (spaces -> underscores)
rather than fetching anything to confirm it.

### Manual items (brand-new content, before WFCD catches up)

Warframe updates ship faster than WFCD/warframe-items - a community
project - can always keep up with. `data/overrides/manual-items.json` is
a gap-filler for exactly that window: complete `CanonicalItem` records
entered by hand (name, category, `isPrime`, wiki path, market slug and
Overframe id/slug where they exist) for items that don't exist in WFCD's
data at all yet, keyed by id the same way `corrections.json` is. The
generator adds one only if WFCD doesn't already have that id; once WFCD
publishes the real entry, its generated version wins automatically (added
earlier in the pipeline, so already present) and the now-redundant manual
entry is flagged as a warning rather than silently overriding real data
forever - clean it up from the file at that point.

Wiki paths for manual items are derived the same way Resources' are (the
standard MediaWiki title transform), since wiki.warframe.com can't be
queried to confirm them either - see "Known limitations" below. Market
slugs and Overframe ids, by contrast, are confirmed directly against
warframe.market's API and real Overframe URLs respectively before being
entered, the same bar as generated data.

## Known limitations

- **Resource wiki paths are derived, not confirmed.** WFCD's `Resources.json`
  never populates `wikiaUrl` (verified empty across all 241 entries). Their
  wiki path is generated via the standard MediaWiki title transform
  instead. This matches the convention observed on every other category
  (where `wikiaUrl` _is_ present and confirms the same transform), but
  hasn't been individually checked against the live wiki for the reason
  above. If a resource's Wiki button 404s, add a correction (see below).
- **Relic wiki paths are likewise derived.** `Relics.json` has no
  `wikiaUrl` either. Crossframe collapses WFCD's four refinement-tier
  entries (Intact/Exceptional/Flawless/Radiant) per relic into one entry
  keyed by the base name (e.g. "Axi A1"), and derives both the wiki path
  (`/w/Axi_A1`) and, where warframe.market has a matching `"<Base> Relic"`
  listing, the market slug.
- **Manual items' wiki paths are derived too, for the same reason.**
  `data/overrides/manual-items.json` entries (see above) use the standard
  MediaWiki title transform - unconfirmed against the live wiki, same as
  Resources and Relics. If one 404s, just fix the `wiki.path` in that
  file directly.
- **Overframe coverage is complete for all Warframes and near-complete
  for standard weapons, companions, and archwing gear** (gathered via
  `scripts/apply-overframe-urls.mjs`, see below) **but not yet for
  Kitguns, Zaws, or companion Helminth "Claws"/"Talons" variants.**
  Those don't have a clean bulk source the way Exalted Weapons did
  (`Misc.json`'s `"SpecialItems"` `productCategory` is clean; the
  `"Pistols"` value where Kitguns live is a mix of finished Kitguns,
  their individual component parts, and unrelated duplicate entries,
  so it wasn't treated as reliable enough to filter automatically).
  Adding one is the same process as any other Overframe mapping -
  manual, via that script or `data/overrides/overframe.json` directly.
- **Ambiguous item names are excluded, not guessed.** A handful of WFCD
  entries share an exact display name with something that isn't really the
  same navigable page (see `data/overrides/corrections.json`). "Unfused
  Artifact" is the main example: ~40 different Railjack mods all display as
  the same generic name before being identified in-game, so Crossframe
  can't safely resolve that name to any one of them and excludes it
  entirely rather than link to a plausible-but-arbitrary guess.
- **Two distinct canonical ids can independently end up with the same
  display name, and the generator can't catch this on its own.** Unlike
  the same-WFCD-id duplicates below, this is two genuinely separate
  registry entries - different ids, different (or missing) wiki/market
  data - that happen to render an identical name, so nothing about
  generation flags it as a collision. Found this way once already:
  `orion_and_sirius` (the real, corrected, Overframe-verified entry) and
  `sirius_and_orion` (a bogus duplicate pointing at an unrelated wiki
  path, now excluded in `corrections.json`) both displayed as "Sirius &
  Orion". No automated check catches this class of bug - it only
  surfaced because a real player noticed two identically-named things in
  the data. Worth a skeptical look if this pattern shows up again.
- **Duplicate WFCD entries collapse safely, not arbitrarily.** Many mods
  appear multiple times under different internal ids that share one
  display name (e.g. "Vitality" also exists as reduced-strength "Beginner"
  and "Intermediate" starter variants). The generator keeps the first one
  seen and logs the rest as warnings. This is safe rather than arbitrary
  because the resulting entry (wiki path, market slug) is determined by
  the shared _name_, not by which specific WFCD entry "won" - every
  duplicate in a name group produces an identical result.

## Regenerating the registry

```
npm run generate-data          # fetch sources (cached under data/.cache/) and rewrite data/items.json
npm run generate-data -- --refresh   # bypass the cache and re-fetch everything
npm run check-data             # report what would change without writing the file
```

`--check` prints new/removed/changed item ids compared against the
currently committed `data/items.json`, plus warnings about duplicate names
and any override/correction that no longer matches a generated item (e.g.
after an item is renamed or removed upstream) - see the design doc's
"Update Strategy" section for why this matters as Warframe's content
changes over time.

## Adding or fixing an item mapping

- **Wrong name, or wrong/missing Wiki/Market destination, for a specific
  item:** add an entry to `data/overrides/corrections.json` keyed by the
  item's `id` (the slugified canonical name, e.g. `protea_prime` - this
  stays the same even if you're correcting the `name` itself, since the
  id is internal-only and nothing rederives it after generation):

  ```json
  {
    "some_item_id": {
      "name": "Corrected Display Name",
      "wiki": { "path": "/w/Correct_Title" },
      "market": { "slug": "correct_slug" }
    }
  }
  ```

  Include only the fields you're correcting - all three are optional. A
  wrong `name` is worth fixing even though it's never shown to users
  directly, since it's what the Market and Overframe adapters search page
  headings for (see `src/adapters/market.ts`/`overframe.ts`) - a wrong
  name there means those buttons silently fail to appear for that item
  specifically, on those two sites, even though the item itself resolves
  fine. The `orion_and_sirius` entry is a real example: WFCD's `name`
  field disagreed with that same record's other fields (internal path,
  flavor text) and with Overframe's actual slug.

  Set `"exclude": true` instead to remove a generated entry entirely (see
  the `unfused_artifact` example already in that file).

- **Adding or fixing an Overframe mapping:**
  - **In bulk:** `npm run apply-overframe-urls -- urls.txt` (or pipe URLs
    into it) takes a plain list of real Overframe item page URLs - one per
    line, e.g. `https://overframe.gg/items/arsenal/6534/protea-prime/` -
    and writes matching entries into `data/overrides/overframe.json`
    automatically, matching each URL's slug against the generated
    registry. Anything it can't match is reported instead of silently
    dropped, since that usually means either a genuine name mismatch (fix
    by hand) or an item outside Crossframe's current category coverage.
    This is the intended way to gather coverage, since there's no bulk
    source to generate from - see "Overframe (explicit overrides only,
    no bulk source)" above.
    **Known matching gap:** dual-wielded "X & Y"-named weapons
    (e.g. "Silva & Aegis") never auto-match - Overframe's slug drops the
    connecting word entirely (`silva-aegis`), while the registry's
    canonical id keeps it (`silva_and_aegis`), so the script's
    `slug.replace(/-/g, "_")` guess doesn't land on the real id. These
    always need the "one at a time" path below, using the item's real id
    (found by searching `data/items.json` for its name).
  - **One at a time:** add or edit an entry in
    `data/overrides/overframe.json` directly, keyed by the item's `id`:
    ```json
    { "some_item_id": { "id": 1234, "slug": "some-item-slug" } }
    ```
- **A brand-new item that doesn't exist in the registry at all** (a new
  Warframe update, ahead of WFCD/warframe-items publishing it): add a
  complete entry to `data/overrides/manual-items.json`, keyed by id -
  see "Manual items" above for the format and the six entries already
  there for real examples covering every combination (Warframe/weapon,
  Prime/non-Prime, with/without a Market destination, with/without
  individually tradable parts). Once WFCD picks up the item, its
  generated entry takes over automatically and `--check`/`generate-data`
  will warn that the manual entry is now redundant - remove it then.
- Run `npm run generate-data` afterward to apply the change, or
  `npm run check-data` to preview it first.

## Adding a new item category

See [docs/adding-a-site.md](adding-a-site.md) for adding a whole new
_site_; adding a new _category_ from an existing WFCD source is a smaller
change to `scripts/generate-data.mjs` (map the category to an
`ItemCategory`), `src/items/types.ts` (add it to the `ItemCategory` union),
and `src/navigation/rules.ts` (declare its destination relevance).
