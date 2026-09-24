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
   key doesn't exist in the current `manifest.json`). Something like:

   ```json
   "browser_specific_settings": {
     "gecko": {
       "id": "crossframe@<your-domain-or-email>",
       "strict_min_version": "109.0"
     }
   }
   ```

   Chrome and Edge both silently ignore an unrecognized top-level key, so
   this is safe to add directly to the existing `manifest.json` rather
   than needing a separate Firefox-only manifest variant - confirm this
   with a Chrome build after adding it, but there's no structural reason
   it would break anything.

2. **Verify `chrome.storage.sync` behaves the same under Firefox's
   implementation.** It should - `src/settings/settings.ts` uses nothing
   beyond `get`/`set` with a plain object, which both browsers support
   identically - but this needs an actual Firefox test pass before
   claiming it works, not an assumption. This is the one item on this
   list that's a real "go verify," not just packaging.

3. **Re-run the adapter test suite's assumptions in real Firefox, not
   just happy-dom.** The vitest suite exercises DOM logic in a simulated
   environment, not any specific browser's actual rendering/timing
   behavior. Chrome and Edge share an engine, so testing one covers both;
   Firefox is a genuinely different engine (Gecko), so "it works in
   Chrome" isn't evidence it works in Firefox for anything
   timing-sensitive - specifically `waitForElement`'s `MutationObserver`
   usage on warframe.market and overframe.gg, both of which render
   client-side after initial load. `MutationObserver` itself is
   standard and well-supported, so this is very likely fine, but "very
   likely fine" is exactly the kind of claim that should be confirmed by
   loading the unpacked extension in real Firefox and visiting all three
   sites before submitting, not assumed from the Chromium test results.

4. **One-time developer account.** Register at
   [addons.mozilla.org (AMO)](https://addons.mozilla.org/developers/) -
   free, separate from both the Chrome and Edge developer accounts.

5. **Submit for review.** AMO's review process is stricter and can be
   slower than Chrome's/Edge's, especially for a first submission - budget
   more time than the "hours to a few days" Chrome estimate in
   `docs/publishing.md`.

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
