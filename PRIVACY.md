# Crossframe Privacy Policy

_Last updated: 2026-09-09_

Crossframe is a browser extension that adds navigation buttons between
[Warframe Wiki](https://wiki.warframe.com), [Warframe.Market](https://warframe.market),
and [Overframe](https://overframe.gg). This policy covers the whole of what
Crossframe does with data, because that whole fits in one short page.

## What Crossframe collects

Nothing. Crossframe does not collect, transmit, sell, or share any data
about you or your browsing.

## What Crossframe stores

Two settings, saved locally via the browser's built-in `chrome.storage.sync`
API so they follow you between your own signed-in devices the same way
your browser's other settings do:

- which of the three supported sites are enabled
- whether Crossframe's buttons open in a new tab or the current one

That's it. This data is stored by your browser, governed by your browser's
own sync/account settings, and is never sent to Crossframe or to any server
Crossframe controls - Crossframe has no server.

## What Crossframe does not do

- No account or sign-in of any kind, for Crossframe or for Warframe.
- No analytics, telemetry, or crash reporting.
- No tracking of which pages you visit, which items you look up, or how
  you use the extension.
- No network requests at all while you browse. The data Crossframe uses to
  recognize items and build links is bundled into the extension at build
  time (see the project's [data-sources documentation](docs/data-sources.md));
  nothing is fetched at runtime.
- No advertising, no third-party scripts, no third-party embeds.

## Permissions

Crossframe's manifest requests exactly one permission, `storage`, used
solely for the two settings above. It also runs content scripts on
`wiki.warframe.com`, `warframe.market`, and `overframe.gg` - and nowhere
else - to detect the item you're viewing and add its navigation buttons.
No `host_permissions` grant is requested, since Crossframe never makes a
network request or calls an API that would need one.

## Source

Crossframe is open source. The complete source code, including everything
described above, is available at
[github.com/LSariol/Crossframe](https://github.com/LSariol/Crossframe).

## Changes to this policy

If Crossframe's data practices ever change, this file will be updated and
the "Last updated" date above will reflect it.

## Contact

Questions or concerns: open an issue at
[github.com/LSariol/Crossframe/issues](https://github.com/LSariol/Crossframe/issues).
