# Architecture

Every content script runs the same five-stage pipeline, matching the design
doc's diagram exactly:

```
Site Detection
      |
Canonical Item Resolution
      |
Destination Rules
      |
URL Resolution
      |
UI Injection
```

```
current URL
      |
      v
adapter.detectItemKey(url)              src/adapters/{wiki,market,overframe}.ts
      |  DetectedItemKey | undefined
      v
resolveCanonicalItem(key)               src/items/resolver.ts + registry.ts
      |  CanonicalItem | undefined
      v
getDestinations(item, currentSite)      src/navigation/destinations.ts
      |  reads rules.ts (relevant?) + url.ts (resolves?)
      v
Destination[]
      |
      v
adapter.findInjectionAnchor(item)       src/adapters/{wiki,market,overframe}.ts
      |  Element | undefined
      v
renderNavigation + insertAfter          src/ui/buttons.ts
```

`src/adapters/run.ts` is the only thing that calls all of these in order
(see `runAdapter`); every content script (`src/content/*.ts`) is a two-line
file that just hands its site's adapter to `runAdapter`. This is the "avoid
tightly coupling site-specific DOM parsing with general item or navigation
logic" requirement from the design doc, made structural rather than just a
convention: a `SiteAdapter` (`src/adapters/types.ts`) can _only_ do two
things - parse a URL, and find a DOM element - so there's no way for
site-specific code to accidentally reach into item resolution or
destination rules, and no way for that shared logic to accidentally depend
on any one site's markup.

## Module responsibilities

| Module                           | Owns                                                                                              | Does not own                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `src/items/types.ts`             | `CanonicalItem`, `ItemCategory`, per-site destination shapes                                      | any site's URL format specifically                      |
| `src/items/registry.ts`          | Loading `data/items.json`, indexing it for O(1) lookup by wiki path / market slug / Overframe id  | how those keys are produced                             |
| `src/items/resolver.ts`          | Turning a `DetectedItemKey` into a `CanonicalItem` (or not)                                       | detecting that key in the first place                   |
| `src/navigation/rules.ts`        | Whether a destination is ever relevant for a category (e.g. Overframe is never relevant for Mods) | whether a _specific_ item actually has that destination |
| `src/navigation/url.ts`          | Building one destination's absolute URL from a `CanonicalItem`                                    | deciding whether to show it                             |
| `src/navigation/destinations.ts` | Combining the two above into the final "what buttons to show, excluding the current site" list    | anything DOM-related                                    |
| `src/adapters/*.ts`              | Per-site URL parsing and DOM anchor discovery                                                     | item resolution, destination rules, rendering           |
| `src/adapters/run.ts`            | Wiring the pipeline together, idempotently                                                        | any site-specific behavior                              |
| `src/ui/buttons.ts`              | Rendering the button group as plain anchor elements                                               | deciding which buttons to render                        |
| `src/settings/settings.ts`       | Reading/writing `chrome.storage.sync`, with safe defaults                                         | applying settings to a page (that's `run.ts`'s job)     |

See [item-resolution.md](item-resolution.md) for the registry/resolver in
depth, [data-sources.md](data-sources.md) for where `data/items.json` comes
from, and [adding-a-site.md](adding-a-site.md) for what implementing a
fourth `SiteAdapter` actually involves.

## Why no background service worker

Manifest V3 extensions commonly have a background service worker, but
Crossframe has none. Nothing it does needs one: there's no cross-tab state,
no alarms, no message passing between contexts, and settings are read
directly from `chrome.storage.sync` by each content script and the options
page. Adding one would only add a permission and a process for no benefit -
see the design doc's "avoid overengineering" guidance.

## Why the registry is a single bundled JSON file, not per-site chunks

Each content script (`content-wiki.js`, `content-market.js`,
`content-overframe.js`) bundles the _entire_ registry (~800 KB each,
~2.3 MB total unpacked), even though, say, the Wiki content script only
ever looks a page up by wiki path. Splitting the registry into three
site-specific indices would cut that by roughly two-thirds. This was a
deliberate simplicity-over-performance tradeoff (matching the design doc's
priority order: correctness, maintainability, reliability, _then_
simplicity, _then_ performance): 2.3 MB is a non-issue for a locally
installed extension with zero runtime network requests, and one bundled
JSON file is much easier to keep correct than three derived indices that
could drift out of sync. It's a reasonable thing to revisit if the registry
grows dramatically.

## Resilience

Nothing here assumes a specific CSS class or generated id, with one
exception: `#firstHeading` on the Wiki, which is a MediaWiki core
convention, not something specific to wiki.warframe.com's theme. Where a
site doesn't offer a comparable stable hook (Market and Overframe both
render their item content well after the page's initial HTML, with no
`data-testid`-style attributes to anchor on), the adapter instead waits for
a heading whose text exactly matches the resolved item's own name -
something Crossframe already trusts, and about as safe an assumption as a
detail page can make. See `src/lib/dom.ts`'s `findHeadingByText` and
`waitForElement`, and each adapter's own file comment for the specifics
and tradeoffs of its injection strategy.

If an adapter's `findInjectionAnchor` doesn't find anywhere safe to inject
within a bounded timeout, `runAdapter` does nothing - it never falls back
to a riskier insertion point, and it never throws in a way that could
affect the host page.
