# Crossframe

[![Available in the Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install%20Crossframe-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/crossframe/claacejnponkofnfgcdcdcanpkmjpgdd)

A browser extension that links [Warframe Wiki](https://wiki.warframe.com),
[Warframe.Market](https://warframe.market), and
[Overframe](https://overframe.gg) together. When you're looking at a
supported Warframe item on one of these sites, Crossframe adds small
buttons that jump straight to that same item's page on the other
supported sites - no re-typing the name, no picking the right search
result twice.

## Example

Viewing [Protea Prime on the Wiki](https://wiki.warframe.com/w/Protea/Prime)
adds two buttons:

```
[ Market ]  ->  https://warframe.market/items/protea_prime_set
[ Overframe ] -> https://overframe.gg/items/arsenal/6534/protea-prime/
```

Click Market, and you'll instead see `[ Wiki ]  [ Overframe ]`. The
current site is never shown as a destination.

Crossframe is deliberately conservative about _which_ buttons it shows.
Viewing a Mod gets you Wiki and Market, never Overframe - there's little
value in an Overframe link for something that isn't a build component.
Viewing an untradable item (a Founders-exclusive weapon, a starter
Warframe) never shows a Market button. If Crossframe can't confidently
identify the current page as a supported item, it shows nothing at all
rather than guess.

## Supported sites and categories

| Site            | Domain              |
| --------------- | ------------------- |
| Warframe Wiki   | `wiki.warframe.com` |
| Warframe.Market | `warframe.market`   |
| Overframe       | `overframe.gg`      |

Categories: Warframes, Prime Warframes, Primary/Secondary/Melee weapons
(and their Prime variants), Archwing/Archgun/Archmelee equipment,
companions and companion weapons, Exalted Weapons (Exalted Blade,
Regulators, Iron Staff, ...), Mods, Arcanes, individually tradable Prime
components, Relics, and (Wiki-only) Resources. See
[`src/navigation/rules.ts`](src/navigation/rules.ts) for exactly which
destinations apply to which category, and
[docs/data-sources.md](docs/data-sources.md) for current data coverage per
category (Overframe coverage is gathered by hand and near-complete for
most categories, but not yet Kitguns/Zaws/companion Helminth
"Claws"/"Talons" - see "Known limitations" below).

## Development

Requires Node.js 18+.

```
npm install
npm run dev      # esbuild in watch mode
npm run build    # production build into dist/
npm run package  # zips dist/ into release/crossframe-<version>.zip
npm test         # vitest
npm run lint     # eslint
npm run typecheck
```

### Installing

Easiest option: [install it from the Chrome Web Store](https://chromewebstore.google.com/detail/crossframe/claacejnponkofnfgcdcdcanpkmjpgdd) -
one click, no developer mode needed.

To run a local build instead (for development, or to try changes before
they're published):

1. `npm run build` (produces `dist/`).
2. Open `chrome://extensions` (or `edge://extensions`) in a
   Chromium-based browser.
3. Enable Developer Mode.
4. "Load unpacked" and select the `dist/` folder.
5. Visit a supported item page on any of the three sites.

`npm run dev` rebuilds the JS/TS on change but does **not** re-copy
`manifest.json`/`icons/`/`options.html` - re-run `npm run build` after
changing any of those, and click the reload icon on `chrome://extensions`
after any change (Chrome doesn't hot-reload unpacked extensions).

### Publishing

Live on the
[Chrome Web Store](https://chromewebstore.google.com/detail/crossframe/claacejnponkofnfgcdcdcanpkmjpgdd).
See [docs/publishing.md](docs/publishing.md) for the submission
checklist (useful for future updates, or for publishing to another
store like Edge Add-ons) and [store/listing.md](store/listing.md) for
the listing copy. [PRIVACY.md](PRIVACY.md) is Crossframe's privacy
policy (short version: it collects nothing).

## Architecture

```
Site Detection -> Canonical Item Resolution -> Destination Rules -> URL Resolution -> UI Injection
```

Every content script runs this same pipeline (`src/adapters/run.ts`); each
site only supplies a `SiteAdapter` that (a) parses its own URLs and (b)
finds where to inject the buttons - no site-specific code ever touches
item resolution, destination rules, or rendering. See
[docs/architecture.md](docs/architecture.md) for the full breakdown and
[docs/item-resolution.md](docs/item-resolution.md) for how a single
`CanonicalItem` reconciles three sites' different identifiers for what's
conceptually the same item (`Protea/Prime`, `protea_prime_set`, and
`6534/protea-prime` all resolving to one "Protea Prime").

### Project structure

```
manifest.json            Extension manifest (MV3)
scripts/
  build.mjs               esbuild bundling + static asset copying
  generate-data.mjs        Regenerates data/items.json (see docs/data-sources.md)
  generate-icons.mjs       One-off: produced icons/*.png (no image deps)
  lib/
    sources.mjs            Fetches + caches WFCD + warframe.market data
    build-items.mjs        Raw source data -> CanonicalItem transforms
src/
  items/
    types.ts               CanonicalItem, ItemCategory, SiteId
    registry.ts             Indexes data/items.json for O(1) lookup
    resolver.ts             DetectedItemKey -> CanonicalItem
  navigation/
    rules.ts                Per-category destination relevance
    url.ts                  CanonicalItem -> destination URL
    destinations.ts          Combines the two into the final button list
  adapters/
    types.ts                SiteAdapter interface
    run.ts                  The shared pipeline every content script runs
    wiki.ts / market.ts / overframe.ts
  content/
    wiki.ts / market.ts / overframe.ts   Thin entry points (2 lines each)
  ui/
    buttons.ts               Renders the button group
    styles.css                Injected styles + options page styles
  settings/
    settings.ts               chrome.storage.sync wrapper
  options/
    options.html / options.ts  The extension's options page
  lib/
    dom.ts                    Site-agnostic DOM helpers (used by adapters)
data/
  items.json                 Generated registry, bundled into the extension
  overrides/
    overframe.json            Hand-verified Overframe id/slug mappings
    corrections.json          Fixes/exclusions for specific generated entries
docs/
  architecture.md, item-resolution.md, data-sources.md, adding-a-site.md
```

## How destination rules work

Two independent questions decide whether a button shows, matching the
design doc's "whether a destination exists" + "whether it's useful for
that category" split:

1. **Is the destination ever relevant for this item's category?**
   (`src/navigation/rules.ts` - a static table, e.g. Overframe is never
   relevant for Mods, regardless of any specific Mod's data.)
2. **Does this specific item actually have that destination?**
   (data-driven - `item.market` is simply absent for an untradable item.)

`getDestinations()` (`src/navigation/destinations.ts`) shows a button only
when both are true, and never for the site the user is currently on.

## How the registry is generated

`data/items.json` is generated ahead of time (`npm run generate-data`) from
[WFCD/warframe-items](https://github.com/WFCD/warframe-items) (canonical
names, categories, wiki paths) cross-referenced against
[warframe.market's public API](https://docs.warframe.market/) (market
slugs). Overframe has no public API and its `robots.txt` disallows
automated access, so its mappings come entirely from
`data/overrides/overframe.json`, verified by hand one item at a time.

Full rationale, known limitations, and instructions for adding or fixing a
specific item's mapping: [docs/data-sources.md](docs/data-sources.md).

## Adding another site

See [docs/adding-a-site.md](docs/adding-a-site.md).

## Security and permissions

Crossframe requests exactly two things:

- `"storage"` - to save your settings (enabled sites, link target) via
  `chrome.storage.sync`.
- Content script injection on the three supported domains only
  (`wiki.warframe.com`, `warframe.market`, `overframe.gg`), declared via
  `content_scripts.matches` in `manifest.json`. This does **not** require
  a `host_permissions` grant, since Crossframe never makes a network
  request or calls a scripting API that would need it - `data/items.json`
  is bundled at build time, not fetched.

No account, no login, no analytics, no external server, and no browsing
history is collected or transmitted anywhere. See the design doc's
"Privacy" section for the full list of things Crossframe deliberately does
not do.

## Known limitations

- **Overframe coverage is near-complete but not exhaustive.** Its
  `robots.txt` disallows AI crawlers and there's no public API, so
  unlike Wiki and Market, its mappings are entirely hand-verified
  (`data/overrides/overframe.json`, built up via
  `npm run apply-overframe-urls`) rather than generated. Warframes,
  standard weapons, companions, and archwing gear are covered; Kitguns,
  Zaws, and companion Helminth "Claws"/"Talons" variants mostly aren't
  yet - not because Crossframe determined Overframe doesn't apply to
  them, just because no one's gathered those URLs yet. Contributions
  welcome via that file - see [docs/data-sources.md](docs/data-sources.md).
- **Resource and Relic wiki paths are derived, not individually
  confirmed** against the live wiki (whose `robots.txt` also disallows
  automated access) - see [docs/data-sources.md](docs/data-sources.md)
  for the specific transform and how to correct one if it's wrong.
- **All three sites are confirmed working end-to-end on their real, live
  pages** - Wiki and Market via direct browser testing during
  development, and all of Overframe (arsenal item pages, and build
  pages specifically) via manual testing plus real DevTools output
  shared back during development, since Overframe's `robots.txt`
  disallows automated access entirely and every adapter decision there
  had to be verified by a human in a real browser rather than
  automated. Several real bugs only surfaced this way and are fixed -
  see git history around `src/adapters/overframe.ts` and
  `src/adapters/market.ts` for the specifics (a build page never
  showing the item's name as a heading at all, warframe.market
  splitting a Prime set's "Set" suffix into a separate span with no
  space in the markup, and layout adjustments driven by real
  screenshots).
- **Firefox is not yet packaged.** The codebase avoids
  Chrome-specific APIs beyond `chrome.storage` and Manifest V3's
  `content_scripts`/`options_ui`, both of which Firefox also supports, but
  no `manifest.json` variant or WebExtension polyfill has been added yet.
- **Cosmetics/Skins, Sigils, and Glyphs are not covered.** The design
  doc's "other categories encountered during implementation" - these were
  judged lower-value for navigation (they're cosmetic, not build- or
  trade-relevant in the way the covered categories are) and out of scope
  for this pass.

## License

MIT - see [LICENSE](LICENSE).
