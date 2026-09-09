# Adding a new supported site

The architecture ([architecture.md](architecture.md)) is built so that
adding a fourth destination is additive - a new adapter, a new field on
`CanonicalItem`, a new URL builder, a new content script and manifest
entry - rather than a change to existing site logic. Using a hypothetical
"Overwiki" site as an example:

1. **Add the `SiteId`.** In `src/items/types.ts`, add `"overwiki"` to the
   `SiteId` union and `SITE_IDS` array, and an `OverwikiDestination`
   interface plus an optional `overwiki?: OverwikiDestination` field on
   `CanonicalItem`.

2. **Add a URL builder.** In `src/navigation/url.ts`, add a case to
   `buildDestinationUrl` for `"overwiki"`.

3. **Add destination relevance.** In `src/navigation/rules.ts`, add an
   `overwiki` entry to every row of `DESTINATION_RELEVANCE` - this is
   where you decide, per category, whether Overwiki is ever a useful
   destination (the same "is this destination ever relevant" judgment call
   the design doc asks for when weighing e.g. Overframe for Mods).

4. **Write the adapter.** Create `src/adapters/overwiki.ts` implementing
   `SiteAdapter` (`src/adapters/types.ts`):
   - `detectItemKey(url)`: parse Overwiki's URL shape into a
     `DetectedItemKey`-compatible key (you'll also need to add an
     `{ site: "overwiki"; ... }` variant to `DetectedItemKey` in
     `src/items/resolver.ts`, and a `findByOverwikiX` lookup + index to
     `src/items/registry.ts`).
   - `findInjectionAnchor(item)`: find where on the page to put the
     buttons. Investigate the real site first (view source, check
     `robots.txt` before doing anything automated) rather than guessing -
     see the Wiki, Market, and Overframe adapters for three different real
     answers to this (a stable server-rendered id, a client-rendered
     mount point matched by heading text, and an unscoped heading-text
     match respectively), and `docs/architecture.md`'s "Resilience"
     section for the reasoning behind preferring a resilient strategy over
     a specific selector when the DOM can't be verified.

5. **Add a content script entry point.** Create `src/content/overwiki.ts`:

   ```ts
   import { overwikiAdapter } from "../adapters/overwiki";
   import { runAdapter } from "../adapters/run";

   void runAdapter(overwikiAdapter);
   ```

6. **Wire it into the build and manifest.** Add an entry to
   `entryPoints` in `scripts/build.mjs`, and a `content_scripts` block to
   `manifest.json` with the narrowest possible `matches` pattern for
   Overwiki's actual domain (see the Security section of the README for
   why permissions should stay minimal).

7. **Extend the data generator** (only if Overwiki has a bulk data source
   - see [data-sources.md](data-sources.md) for how Crossframe decides
     between generated data and hand-maintained overrides for Overframe).

8. **Add the UI label.** `src/ui/buttons.ts`'s `SITE_LABELS` needs an
   `overwiki` entry, and `src/ui/styles.css` an optional
   `[data-crossframe-site="overwiki"]` color rule to match the pattern the
   other three sites use.

9. **Update settings.** `src/settings/settings.ts`'s `DEFAULT_SETTINGS`
   needs an `overwiki: true` entry in `enabledSites` (this falls out
   automatically from `SITE_IDS` if you used `allSites()` rather than a
   hardcoded list anywhere - check `src/options/options.html` needs a
   matching checkbox added by hand, since that markup isn't generated).

10. **Tests.** Each existing adapter's `*.test.ts` file is a template:
    URL-shape tests for `detectItemKey` (including pages that should
    _not_ match), and DOM-fixture tests for `findInjectionAnchor`
    (present-immediately, appears-async, and never-appears cases).

None of this requires touching `src/adapters/run.ts`, `src/navigation/destinations.ts`,
or any other adapter - that's the separation
[architecture.md](architecture.md) describes.
