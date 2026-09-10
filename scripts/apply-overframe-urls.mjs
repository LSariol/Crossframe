#!/usr/bin/env node
/**
 * Turns a plain list of real Overframe item URLs into entries in
 * data/overrides/overframe.json - the file that's the entire source of
 * Overframe data (see docs/data-sources.md for why: no public API, and
 * their robots.txt disallows automated access, so every mapping has to be
 * gathered by a human actually opening the page).
 *
 * Usage:
 *   node scripts/apply-overframe-urls.mjs urls.txt
 *   node scripts/apply-overframe-urls.mjs < urls.txt
 *   pbpaste | node scripts/apply-overframe-urls.mjs   (macOS, from clipboard)
 *
 * Input: one Overframe item URL per line, e.g.
 *   https://overframe.gg/items/arsenal/6534/protea-prime/
 * Blank lines and anything that doesn't match that shape are ignored.
 *
 * Matching: an Overframe slug ("protea-prime") is converted to
 * underscore form ("protea_prime") and matched against generated
 * canonical item ids in data/items.json, since both are derived from the
 * same display name through very similar slugification. This matches the
 * large majority of items automatically; anything that doesn't match is
 * reported (id/slug and the canonical id it tried) so the right item's
 * real id can be found by hand and added to
 * data/overrides/overframe.json directly, instead of being silently
 * dropped.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ITEMS_PATH = path.join(root, "data", "items.json");
const OVERRIDES_PATH = path.join(root, "data", "overrides", "overframe.json");

const ARSENAL_URL = /overframe\.gg\/items\/arsenal\/(\d+)\/([a-z0-9-]+)\/?/i;

function readInput() {
  const arg = process.argv[2];
  if (arg) return readFileSync(arg, "utf8");
  if (!process.stdin.isTTY) return readFileSync(0, "utf8");
  console.error("Usage: node scripts/apply-overframe-urls.mjs <file>  (or pipe URLs via stdin)");
  process.exit(1);
}

function main() {
  const text = readInput();
  const lines = text.split(/\r?\n/).map((l) => l.trim());

  const items = JSON.parse(readFileSync(ITEMS_PATH, "utf8"));
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const overrides = existsSync(OVERRIDES_PATH)
    ? JSON.parse(readFileSync(OVERRIDES_PATH, "utf8"))
    : {};

  const matched = [];
  const unmatched = [];
  const skipped = [];

  for (const line of lines) {
    if (!line) continue;
    const match = ARSENAL_URL.exec(line);
    if (!match) {
      skipped.push(line);
      continue;
    }
    const id = Number(match[1]);
    const slug = match[2].toLowerCase();
    const canonicalId = slug.replace(/-/g, "_");
    const item = itemsById.get(canonicalId);

    if (!item) {
      unmatched.push({ line, id, slug, canonicalId });
      continue;
    }

    const already = overrides[item.id];
    if (already && already.id === id && already.slug === slug) {
      continue; // no-op, already recorded
    }
    overrides[item.id] = { id, slug };
    matched.push({ name: item.name, id: item.id, overframe: { id, slug } });
  }

  writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2) + "\n");

  console.log(`Matched ${matched.length} item(s):`);
  for (const m of matched)
    console.log(`  + ${m.name} (${m.id}) -> ${m.overframe.id}/${m.overframe.slug}`);

  if (unmatched.length > 0) {
    console.log(`\n${unmatched.length} URL(s) didn't match a generated item by slug:`);
    for (const u of unmatched) {
      console.log(`  ? ${u.line}`);
      console.log(`    tried canonical id "${u.canonicalId}" - not found in data/items.json`);
    }
    console.log(
      "\nThese need a manual entry in data/overrides/overframe.json (find the item's real " +
        "id by searching data/items.json for its name) or may be items outside Crossframe's " +
        "current category coverage - see docs/data-sources.md.",
    );
  }

  if (skipped.length > 0) {
    console.log(`\nIgnored ${skipped.length} line(s) that weren't Overframe item URLs.`);
  }

  console.log(
    `\nWrote ${path.relative(root, OVERRIDES_PATH)}. Run \`npm run generate-data\` to apply.`,
  );
}

main();
