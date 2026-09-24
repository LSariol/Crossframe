# Store listing content

Copy-paste-ready content for all three stores Crossframe is submitted
to: Chrome Web Store, Edge Add-ons, and Firefox Add-ons (AMO). The
listing copy itself is shared across all three - only the
privacy/permissions questions and a couple of submission-mechanics
details differ per store, covered in their own sections below. See
[docs/publishing.md](../docs/publishing.md) for the Chrome submission
checklist and [docs/cross-browser-support.md](../docs/cross-browser-support.md)
for what Edge and Firefox each specifically require.

## Listing copy (all three stores)

**Short description** (shown under the name in search results; Chrome's
limit is 132 characters - this is 93, identical to `manifest.json`'s
`description` so the two stay in sync):

```
Jump between Warframe Wiki, Warframe.Market, and Overframe pages for the item you're viewing.
```

**Detailed description:**

```
Crossframe connects the three sites Warframe players actually use side by side:

• Warframe Wiki for acquisition, stats, and mechanics
• Warframe.Market for buying and selling
• Overframe for builds

When you're looking at a supported item on any of the three, Crossframe adds small buttons that jump straight to that same item on the other two - no re-typing the name, no picking the right search result twice.

Crossframe is deliberately conservative about what it shows you:

• Only destinations that actually apply to what you're looking at. A Mod gets you Wiki and Market, never an Overframe link - there's nothing useful for a Mod on a build-planning site.
• Only destinations that actually exist for that specific item. An untradable Warframe never shows a Market button.
• Nothing at all if Crossframe can't confidently identify the page - it never guesses.

Supported: Warframes and their Prime variants, Primary/Secondary/Melee weapons and their Primes, Archwing/Archgun/Archmelee equipment, companions, Mods, Arcanes, individually tradable Prime components (their Overframe button links to the completed item's build, since parts don't have their own build page), Relics, and Resources - up to date with Update 44: Iceblade of Narin, including Narin, Nunchasa, Aksondol, Citrine Prime, Steflos Prime, and Corufell Prime.

Crossframe works entirely offline once installed - no account, no login, no analytics, no server, and nothing about your browsing is ever collected or sent anywhere. The data it uses to recognize items is bundled into the extension itself. Full privacy policy: https://github.com/LSariol/Crossframe/blob/main/PRIVACY.md

Open source: https://github.com/LSariol/Crossframe
```

**Category:** Workflow & Planning / Productivity (each store phrases this
slightly differently and the exact list changes occasionally - pick
whichever most closely matches "browser utility/navigation aid";
Chrome's dashboard also accepts "Tools" as a fallback).

**Language:** English

**Support contact:** the developer email already used for the Chrome
listing - reuse the same one for Edge and AMO rather than creating a
second contact point.

**Assets:**

- **Store icon:** `icons/icon128.png` (already in the repo - upload
  directly; every store asks for something in the 128x128-and-up range).
- **Screenshots (1-5 required, 1280x800 or 640x400 px):** not included in
  this repo - see [docs/publishing.md](../docs/publishing.md) for exactly
  what to capture and why they need to come from your own browser rather
  than being generated. The same screenshots work for all three stores.
- **Small promo tile (440x280, Chrome-only, optional):** not included.
  Skippable.

## Chrome Web Store

Submit via the
[Developer Dashboard](https://chrome.google.com/webstore/devconsole).

### Privacy practices tab

**Single purpose description:**

```
Crossframe adds navigation buttons linking a Warframe item's page across wiki.warframe.com, warframe.market, and overframe.gg, so a player viewing that item on one site can jump directly to it on the others.
```

**Permission justifications:**

| Permission                                                                                                                    | Justification                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                                                                                                     | Stores the user's two preferences (which sites are enabled, and whether links open in a new tab) locally via `chrome.storage.sync`, so they persist across the user's own browser sessions/devices. No other use. |
| Host access to `wiki.warframe.com`, `warframe.market`, `overframe.gg` (via `content_scripts.matches`, not `host_permissions`) | Needed to detect the Warframe item on the current page and insert the navigation buttons. Crossframe runs on no other site.                                                                                       |

**Data usage disclosures:** For every category the dashboard asks about
(personally identifiable information, health info, financial/payment
info, authentication info, personal communications, location, web
history, user activity, website content) - answer **"No, I do not collect
or use this type of data"**. Crossframe collects nothing; see
[PRIVACY.md](../PRIVACY.md).

**Privacy policy URL:**

```
https://github.com/LSariol/Crossframe/blob/main/PRIVACY.md
```

**"Are you using remote code?"** No - the extension package contains
everything it runs; nothing is fetched or eval'd at runtime.

## Edge Add-ons

Submit via
[Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview) -
free account, separate from both Chrome's and Mozilla's. Reuses the
listing copy above as-is; Partner Center's fields map closely enough to
Chrome's (name, short/long description, category, privacy policy URL,
screenshots, logo) that nothing needs rewriting. A couple of things
specific to Edge:

- **Same package, no rebuild needed.** `release/crossframe-<version>.zip`
  is the exact same file uploaded to Chrome - confirmed no code changes
  are required for Edge (see
  [docs/cross-browser-support.md](../docs/cross-browser-support.md)).
- **Privacy/data questions are asked in Partner Center's own format**,
  not Chrome's specific checklist - the underlying answer is identical
  either way: Crossframe collects nothing (see [PRIVACY.md](../PRIVACY.md)),
  so every such question gets the "no" / "not applicable" answer, however
  Partner Center phrases it. Exact field wording isn't reproduced here
  since it's Microsoft's UI and can change; the privacy policy URL and
  single-purpose description above cover the substance regardless of
  which specific fields it's split across.
- **Separate review queue, separate account** - remember to actually
  upload each new version here too on future releases; nothing links the
  three stores together, so this step is easy to forget after a
  Chrome-only release habit forms.

## Firefox Add-ons (AMO)

Submit via [addons.mozilla.org/developers](https://addons.mozilla.org/developers/) -
free account, separate from both of the above.

### The manifest needs `data_collection_permissions`

AMO's upload step validates a `browser_specific_settings.gecko` field
Chrome/Edge don't require at all: `data_collection_permissions`, a
newer Mozilla transparency requirement declaring what categories of user
data the extension collects. Uploading without it fails validation with
`"the data_collection_permission property is missing"` - hit this for
real on first submission. Since Crossframe collects nothing, the answer
is the dedicated `"none"` value, already added to `manifest.json`:

```json
"browser_specific_settings": {
  "gecko": {
    "id": "...",
    "strict_min_version": "109.0",
    "data_collection_permissions": {
      "required": ["none"]
    }
  }
}
```

If a future AMO upload ever complains about this field again (Mozilla
has changed its exact shape before and may again), the fix is the same
in spirit: whatever the current required format is, the answer for
Crossframe is always "collects nothing" - see [PRIVACY.md](../PRIVACY.md).

### Submission notes

- **"Notes to Reviewers" field:** mention `npm install && npm run build`
  as the build command. AMO reviewers sometimes ask for build
  instructions when the uploaded code is bundled (esbuild concatenates
  multiple source files into `content-wiki.js` etc.) even though, as
  here, it isn't minified and stays human-readable - stating this up
  front avoids a review round-trip asking for exactly that (see
  [docs/cross-browser-support.md](../docs/cross-browser-support.md)).
- **Summary / description fields** reuse the listing copy above.
- Review is typically slower than Chrome's/Edge's, especially for a
  first submission - budget more time than Chrome's "hours to a few
  days."
