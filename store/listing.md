# Chrome Web Store listing content

Copy-paste-ready content for the
[Developer Dashboard](https://chrome.google.com/webstore/devconsole). See
[docs/publishing.md](../docs/publishing.md) for the full submission
checklist this content belongs to.

## Store listing tab

**Short description** (shown under the name in search results; CWS limit
132 characters - this is 93, identical to `manifest.json`'s `description`
so the two stay in sync):

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

Supported: Warframes and their Prime variants, Primary/Secondary/Melee weapons and their Primes, Archwing/Archgun/Archmelee equipment, companions, Mods, Arcanes, individually tradable Prime components, Relics, and Resources.

Crossframe works entirely offline once installed - no account, no login, no analytics, no server, and nothing about your browsing is ever collected or sent anywhere. The data it uses to recognize items is bundled into the extension itself. Full privacy policy: https://github.com/LSariol/Crossframe/blob/main/PRIVACY.md

Open source: https://github.com/LSariol/Crossframe
```

**Category:** Workflow & Planning (or Tools, if that category isn't
offered in your region's dashboard - CWS's category list changes
occasionally, pick whichever most closely matches "browser
utility/navigation aid").

**Language:** English

## Privacy practices tab

CWS requires answering these regardless of how little data an extension
handles.

**Single purpose description:**

```
Crossframe adds navigation buttons linking a Warframe item's page across wiki.warframe.com, warframe.market, and overframe.gg, so a player viewing that item on one site can jump directly to it on the others.
```

**Permission justifications:**

| Permission                                                                                                                    | Justification                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
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

## Assets

- **Store icon (128x128):** `icons/icon128.png` (already in the repo -
  upload that file directly).
- **Screenshots (1-5 required, 1280x800 or 640x400 px):** not included in
  this repo - see [docs/publishing.md](../docs/publishing.md) for exactly
  what to capture and why they need to come from your own browser rather
  than being generated.
- **Small promo tile (440x280, optional):** not included. Skippable for
  an initial submission; revisit if useful later.
