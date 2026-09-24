# Changelog

All notable changes to Crossframe are documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); dates
are when a version was packaged, which may be a day or two before it's
actually submitted/approved on any given store.

## [Unreleased]

## [1.1.0] - 2026-09-24

First version submitted to Edge Add-ons and Mozilla Add-ons (AMO), alongside Chrome - tested working on all three browsers.

### Added

- Overframe button on individually tradable Prime component pages
  (Blueprints, Chassis, Barrels, Receivers, ...) on warframe.market -
  Overframe has no build page for a single part, so it links to the
  *finished item's* build page instead (e.g. "Sevagoth Prime Blueprint"
  links to Sevagoth Prime; "Acceltra Prime Receiver" links to Acceltra
  Prime). No new Overframe data needed - each component simply inherits
  its parent's existing mapping.

### Fixed

- Firefox Add-ons (AMO) rejected the package on upload with `"the
  data_collection_permission property is missing"` -
  `browser_specific_settings.gecko` needs a
  `data_collection_permissions` field (a Mozilla transparency
  requirement separate from the `gecko.id` added for 1.0.3), which
  Chrome/Edge don't validate at all so nothing caught it until an actual
  AMO submission attempt. Added `{ "required": ["none"] }` - accurate,
  since Crossframe collects nothing (see `PRIVACY.md`).
- **The options page did nothing.** `options.html` had no `<script>` tag
  at all - `options.js` was bundled but never loaded in a real browser, so
  every checkbox/radio always showed its default unchecked state
  regardless of saved settings, and toggling any of them had no effect.
  Not a regression - this appears to have been broken since the options
  page was first built, undetected because the existing tests exercised
  the page's functions directly against an in-memory fixture rather than
  the real HTML file. Fixed, with a new regression test that reads the
  actual `options.html` source and confirms the script tag is there.
- `findByOverframeId`/`findByOverframeSlug` could resolve to a Prime
  component instead of the actual item once components started sharing
  their parent's Overframe id/slug (see above) - the same class of bug
  already fixed for wiki-path lookups, now fixed the same way for
  Overframe lookups too (a component is never allowed to win either
  index over a non-component).

## [1.0.3] - 2026-09-24

### Added

- "Report an issue" link on the options page, pointing at GitHub Issues.
- Overframe mappings for 11 previously-uncovered weapons, all
  dual-wielded "X & Y"-named items (Ack & Brunt, Argo & Vel, Cobra &
  Crane, Cobra & Crane Prime, Sigma & Octantis, Silva & Aegis, Silva &
  Aegis Prime, Sun & Moon, Tak & Lug, Afuris, Dual Skana).
- `browser_specific_settings.gecko.id` in `manifest.json`, required by
  Firefox for signing/updates - see `docs/cross-browser-support.md`.
  Chrome/Edge confirmed unaffected (silently ignore the unrecognized
  key). Real-Firefox verification and AMO submission still pending
  before this counts as full Firefox support - not bumping to 1.1.0
  until that's actually done.

### Fixed

- Removed three bad registry entries: `sirius_and_orion`, a duplicate of
  the real, already-verified `orion_and_sirius` entry that pointed at an
  unrelated wiki page; `hinta_stabilizer`, a companion *part* miscategorized
  as a standalone companion; and `sirocco`, an Operator/Drifter Amp
  miscategorized as a Tenno primary weapon.
- Corrected `orion_and_sirius`'s ("Sirius & Orion") Wiki link from the
  generated `/w/Orion` to the official `/w/Sirius_&_Orion` page.
- Crossframe stopped working on warframe.market and overframe.gg after
  their own client-side navigation changed the URL (e.g. using
  warframe.market's internal search from its homepage, which lands on
  `?type=sell` - its own "Orders" tab URL) - both are single-page apps
  that rewrite content and the address bar via JavaScript without the
  browser ever loading a new document, and content scripts only run once,
  at real page-load time, so the buttons simply never reappeared once
  that happened. The obvious fix - hooking `history.pushState`/
  `replaceState`, the standard technique for this - turned out not to
  work on the real site: confirmed via live debugging that warframe.market's
  own router doesn't go through those instance-level properties at all
  for its internal search (most likely calling `History.prototype
  .pushState` directly), so a hook on them was simply never invoked, no
  matter how early it was installed. Fixed instead by polling
  `location.href` for changes every 500ms, which doesn't need to know
  *how* the URL changed - if the address bar shows something different
  than a moment ago, something navigated, regardless of mechanism. All
  three content scripts now pick up an in-page navigation this way and
  re-run the detection pipeline, correctly replacing stale buttons or
  clearing them if the new URL doesn't resolve to anything.

### Changed

- Injected navigation buttons are now a `<nav>` landmark with an
  `aria-label`, and each link's accessible name spells out the full site
  name and item ("View Protea Prime on Warframe Wiki") instead of relying
  on the short visible label ("Wiki") alone, which reads as ambiguous to
  screen reader users navigating out of visual context.
- The options page's two settings groups are now `<fieldset>`/`<legend>`
  instead of `<section>`/`<h2>`, so assistive technology announces them as
  a single grouped control rather than an unrelated heading followed by a
  list of checkboxes.
- The hover/focus "lift" animation on nav buttons now respects
  `prefers-reduced-motion`.

## [1.0.2] - 2026-09-23

### Fixed

- Warframe.Market pages could intermittently crash to a full-page error
  screen (`NotFoundError: Failed to execute 'removeChild' on 'Node'`).
  Caused by Crossframe removing the host page's own Wiki link from the
  DOM directly, which desynced React's internal tree from the real DOM;
  a later unrelated re-render would then try to remove a node that was
  already gone. Fixed by hiding that link (`display: none`) instead of
  removing it, which never touches DOM structure.
- Individually-tradable Prime **weapon** parts (Barrel, Receiver, Stock,
  Handle) were being silently dropped from the registry - a latent bug
  since the feature was first added, not a regression. The generator
  always assumed every Prime component's market listing name carried a
  `"Blueprint"` suffix, which is true for Warframe parts
  (Chassis/Neuroptics/Systems) but not weapon parts. Recovered 267
  previously-missing entries.

### Added

- Support for Update 44: Iceblade of Narin content, ahead of
  WFCD/warframe-items publishing it upstream: Narin, Nunchasa, Aksondol,
  Citrine Prime, Steflos Prime, and Corufell Prime (plus their Prime
  components, where applicable).

## [1.0.1] - 2026-09-11

### Fixed

- Replaced the placeholder/generated toolbar and store icons with a
  custom design, re-submitted immediately after the 1.0.0 listing went
  live with the wrong images.

## [1.0.0] - 2026-09-11

Initial Chrome Web Store release.

### Added

- Navigation between Warframe Wiki, Warframe.Market, and Overframe for
  Warframes and their Primes, Primary/Secondary/Melee weapons and their
  Primes, Archwing/Archgun/Archmelee equipment, companions and companion
  weapons, Exalted Weapons, Mods, Arcanes, individually tradable Prime
  components, Relics, and (Wiki-only) Resources.
- Options page: per-site enable/disable, and a choice between opening
  links in a new tab or the current one.
- Overframe support for both item pages and build pages.
- Overframe coverage for the large majority of Warframes, standard
  weapons, companions, and archwing gear, gathered and verified by hand
  (`data/overrides/overframe.json` - Overframe has no public API and its
  `robots.txt` disallows automated access).
