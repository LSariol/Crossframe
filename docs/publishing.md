# Publishing to the Chrome Web Store

Everything on the code/content side is ready (see
[store/listing.md](../store/listing.md) for the copy-paste listing text).
This is the remaining checklist - the parts that need your Google account,
your payment, and your browser.

## 1. One-time developer account

Register at the
[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
(one-time $5 fee, covers unlimited extensions and visibility changes -
switching Unlisted <-> Public later doesn't cost anything more or require
re-submission).

## 2. Build the package

```
npm run build
npm run package
```

Produces `release/crossframe-1.0.0.zip`. That's the file the dashboard
upload step wants.

## 3. Take screenshots (do this yourself, in your own browser)

Chrome Web Store requires 1-5 screenshots (1280x800 or 640x400 px) showing
the extension actually working. These need to come from your own browser
loading the real sites - not something to generate or fake, and not
something I can capture myself (both wiki.warframe.com and overframe.gg
disallow automated/AI access in their `robots.txt`, which is exactly the
kind of access an automated screenshot tool would be). It's quick:

1. `npm run build`, then load `dist/` unpacked (see the README's
   "Installing" section) if you haven't already.
2. Visit each page below, wait a second for the buttons to appear, and
   capture a screenshot (Win+Shift+S works fine, or your browser's own
   screenshot tool) that includes both the page title/item image _and_
   the Crossframe buttons - where exactly that is differs per site:
   - `https://wiki.warframe.com/w/Protea/Prime` - buttons sit right next
     to the page title. Capture that area (Market + Overframe buttons).
   - `https://warframe.market/items/protea_prime_set` - buttons sit next
     to the Orders/Statistics/Drop Sources tabs, not the title - capture
     enough of the page to include both the item name/image near the top
     and that tab row a bit further down (Wiki + Overframe buttons).
   - `https://overframe.gg/items/arsenal/6534/protea-prime/` - buttons
     sit next to the page title (Wiki + Market buttons).
3. A 4th showing a Mod (Wiki + Market only, no Overframe button - e.g.
   `https://wiki.warframe.com/w/Primed_Continuity`) is a good one to
   include too - it's the clearest illustration of Crossframe's
   "only relevant destinations" behavior, which is worth showing off.
4. Crop/resize to 1280x800 or 640x400 if your capture tool doesn't
   already produce one of those sizes.

All three sites have been confirmed working end-to-end (including
Overframe's build pages) as of this writing - see the README's "Known
limitations" section for what's still unverified (Kitguns, Zaws, and a
few other edge cases), none of which affect these specific screenshots.

## 4. Submit

In the dashboard: new item -> upload the zip -> fill in the Store Listing
and Privacy tabs using [store/listing.md](../store/listing.md) -> upload
your screenshots and the store icon (`icons/icon128.png`) -> choose
Visibility (Public or Unlisted - see the README/your own judgment on
which) -> Submit for review.

Review is typically fast (hours to a few days) for an extension this
size and scope with no remote code and minimal permissions.

## 5. (Recommended) Edge Add-ons too

Free, separate submission, same package and mostly the same listing copy:
[Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview).
Worth doing since you were testing in Edge anyway.

## After publishing

- Bump `version` in `package.json` before each future release (the build
  syncs it into `manifest.json` automatically) - the Web Store rejects
  re-uploading the same version number.
- `npm run generate-data` periodically to pick up new Warframe content
  (new items, changed market slugs) - see
  [docs/data-sources.md](data-sources.md)'s "Regenerating the registry"
  section.
