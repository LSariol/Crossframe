# Supporting Firefox and Edge

Edge is nearly free; Firefox is real but small work. Neither requires
rewriting anything - the codebase already avoids Chrome-only APIs beyond
`chrome.storage`, which both browsers also implement.

## Edge Add-ons - trivial

Edge is Chromium-based and reads Manifest V3 the same way Chrome does.
No code or manifest changes are needed at all.

1. Build the same package you already build for Chrome:
   `npm run build && npm run package`.
2. Register at the
   [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)
   (free, unlike Chrome's one-time $5).
3. Upload the same `release/crossframe-<version>.zip`, and reuse the same
   copy from `store/listing.md` - Edge's submission form asks for
   essentially the same fields (short/detailed description, screenshots,
   privacy answers, single-purpose description).
4. Submit. Review is typically comparable in speed to Chrome's.
5. On every future release: upload the new zip here too, same as Chrome.
   The two listings are entirely independent - nothing links them, so
   this step is easy to forget after a Chrome-only release habit forms.

Already called out as recommended-but-not-yet-done in
`docs/publishing.md`.

## Firefox (AMO) - real work, still small

Firefox has supported Manifest V3 since Firefox 109 (2023), including
`content_scripts`, `options_ui`, and `chrome.storage.sync` (aliased from
`browser.storage.sync`), so this is packaging and one manifest addition,
not a rewrite.

### What actually needs to change

1. **`browser_specific_settings.gecko.id` in the manifest.** Firefox
   requires every extension to have a stable, explicit id for signing and
   updates (Chrome derives its equivalent from the upload itself, so this
   key doesn't exist in Chrome's manifest).

   **Done** - added to `manifest.json`:

   ```json
   "browser_specific_settings": {
     "gecko": {
       "id": "{f3c2291c-83db-469e-ae92-eec9598dceee}",
       "strict_min_version": "109.0"
     }
   }
   ```

   Used a randomly-generated UUID rather than an email-shaped id (the
   more common convention, e.g. `crossframe@example.com`) specifically so
   nothing personal ends up permanently baked into a public manifest file
   - Mozilla's requirement is just that the id is globally unique and
   never changes across future updates of this same listing, not that it
   resolves to anything. **This id is now permanent** - changing it later
   means AMO treats the next upload as a brand-new, unrelated extension
   (loses update continuity, review history, and any installs). Confirmed
   Chrome/Edge silently ignore the unrecognized top-level key: `npm run
   build` and the full test suite both still pass clean with this added.

2. **`browser_specific_settings.gecko.data_collection_permissions` in
   the manifest.** A newer, separate Mozilla requirement from the `id`
   above - a transparency declaration of what categories of user data
   the extension collects. Not needed for the manifest to be *valid* by
   any schema Chrome/Edge or `esbuild`/TypeScript check, only for AMO's
   own upload validation - so this one wasn't caught until an actual
   submission attempt failed with `"the data_collection_permission
   property is missing"`.

   **Done** - added to `manifest.json`, alongside the `id`:

   ```json
   "data_collection_permissions": {
     "required": ["none"]
   }
   ```

   Crossframe collects nothing (see [PRIVACY.md](../PRIVACY.md)), so
   `"none"` is the correct value outright - no judgment call needed. If a
   future AMO upload complains about this field again (Mozilla has
   changed its exact required shape before and may again), the answer is
   always going to be "collects nothing" regardless of what the current
   shape is; only the JSON structure itself might need adjusting to match.

3. **Verify `chrome.storage.sync` behaves the same under Firefox's
   implementation.** It should - `src/settings/settings.ts` uses nothing
   beyond `get`/`set` with a plain object, which both browsers support
   identically. **Done** - verified working in a real Firefox install.

4. **Re-run the adapter test suite's assumptions in real Firefox, not
   just happy-dom.** The vitest suite exercises DOM logic in a simulated
   environment, not any specific browser's actual rendering/timing
   behavior - Firefox is a genuinely different engine (Gecko) than
   Chrome/Edge, so "it works in Chrome" wasn't evidence it works in
   Firefox for anything timing-sensitive, specifically
   `waitForElement`'s `MutationObserver` usage on warframe.market and
   overframe.gg. **Done** - confirmed working across all three sites in
   a real Firefox install, alongside step 3.

5. **One-time developer account.** Register at
   [addons.mozilla.org (AMO)](https://addons.mozilla.org/developers/) -
   free, separate from both the Chrome and Edge developer accounts.

6. **Submit for review.** AMO's review process is stricter and can be
   slower than Chrome's/Edge's, especially for a first submission - budget
   more time than the "hours to a few days" Chrome estimate in
   `docs/publishing.md`. See `store/listing.md`'s Firefox section for the
   "Notes to Reviewers" build-instructions tip and the exact listing
   copy to submit.

### What does NOT need to change

- No new permissions, no `host_permissions`, no background script -
  Firefox's MV3 permission model for exactly what Crossframe already
  declares (`storage` + `content_scripts.matches`) is the same shape as
  Chrome's.
- No build-tooling changes - `scripts/build.mjs` already produces a
  browser-agnostic `dist/`; the same output zips for all three stores.
- No UI/UX changes - `src/ui/buttons.ts` and `styles.css` use nothing
  Chromium-specific.

### Suggested order of operations

Edge first (near-zero cost, same package, wider reach immediately), then
Firefox once there's time to actually sit down and verify it in a real
Firefox install rather than assume compatibility from the Chromium test
suite.

### Current status

Both manifest changes (steps 1-2) are done, and both real-browser
verification steps (3-4) have been confirmed - tested working across
Chrome, Edge, and Firefox as of version 1.1.0. Remaining: AMO account
registration and submission (steps 5-6), and the equivalent Edge Add-ons
submission (see `store/listing.md` for both, and the `data_collection_
permissions` manifest requirement that surfaced on first AMO upload
attempt - already fixed, documented there and in step 2 above).
