#!/usr/bin/env node
/**
 * Regenerates data/items.json, Crossframe's bundled item registry, from
 * WFCD/warframe-items and the warframe.market API (see
 * scripts/lib/sources.mjs and docs/data-sources.md for what each source
 * provides and why). Overframe has no such bulk source - its ids and slugs
 * come entirely from data/overrides/overframe.json, hand-verified one item
 * at a time.
 *
 * Usage:
 *   node scripts/generate-data.mjs            Regenerate data/items.json
 *   node scripts/generate-data.mjs --check     Report what would change,
 *                                              without writing the file
 *   node scripts/generate-data.mjs --refresh   Bypass the data/.cache/
 *                                              snapshot and re-fetch sources
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fetchWfcdCategories, fetchMarketItems } from "./lib/sources.mjs";
import {
  buildEquipmentItem,
  buildPrimeComponents,
  buildSimpleItem,
  buildResourceItem,
  buildRelicItems,
  buildMarketIndex,
  hasAnyDestination,
} from "./lib/build-items.mjs";

const root = process.cwd();
const OUTPUT_PATH = path.join(root, "data", "items.json");
const OVERFRAME_OVERRIDES_PATH = path.join(root, "data", "overrides", "overframe.json");
const CORRECTIONS_PATH = path.join(root, "data", "overrides", "corrections.json");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const refresh = args.includes("--refresh");

/** Equipment WFCD category name -> Crossframe ItemCategory. */
const EQUIPMENT_CATEGORY_MAP = {
  Warframes: "warframe",
  Primary: "primaryWeapon",
  Secondary: "secondaryWeapon",
  Melee: "meleeWeapon",
  "Arch-Gun": "archgun",
  "Arch-Melee": "archmelee",
  Archwing: "archwing",
  Pets: "companion",
  Sentinels: "companion",
  SentinelWeapons: "companionWeapon",
};

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function buildRegistry(wfcd, marketItems) {
  const marketIndex = buildMarketIndex(marketItems);
  const overframeOverrides = readJson(OVERFRAME_OVERRIDES_PATH);
  const corrections = readJson(CORRECTIONS_PATH);

  const itemsById = new Map();
  const warnings = [];

  function addItem(item) {
    if (!item) return;
    if (itemsById.has(item.id)) {
      warnings.push(`Duplicate id "${item.id}" ("${item.name}") - keeping the first one seen.`);
      return;
    }
    itemsById.set(item.id, item);
  }

  for (const [wfcdCategory, ourCategory] of Object.entries(EQUIPMENT_CATEGORY_MAP)) {
    for (const raw of wfcd[wfcdCategory] ?? []) {
      const item = buildEquipmentItem(raw, ourCategory, marketIndex);
      if (!item) continue;
      addItem(item);
      for (const component of buildPrimeComponents(item, raw.components, marketIndex)) {
        addItem(component);
      }
    }
  }

  for (const raw of wfcd.Mods ?? []) addItem(buildSimpleItem(raw, "mod", marketIndex));
  for (const raw of wfcd.Arcanes ?? []) addItem(buildSimpleItem(raw, "arcane", marketIndex));
  for (const raw of wfcd.Resources ?? []) addItem(buildResourceItem(raw));
  for (const item of buildRelicItems(wfcd.Relics ?? [], marketIndex)) addItem(item);

  // Apply corrections (fix or exclude a specific generated entry) before
  // Overframe overrides, so a correction can't accidentally resurrect an
  // item that was deliberately excluded.
  for (const [id, correction] of Object.entries(corrections)) {
    const item = itemsById.get(id);
    if (!item) {
      warnings.push(`Correction for unknown id "${id}" - no such generated item.`);
      continue;
    }
    if (correction.exclude) {
      itemsById.delete(id);
      continue;
    }
    if (correction.wiki) item.wiki = correction.wiki;
    if (correction.market) item.market = correction.market;
  }

  // Overframe: entirely override-driven (see file header + docs/data-sources.md).
  for (const [id, overframe] of Object.entries(overframeOverrides)) {
    const item = itemsById.get(id);
    if (!item) {
      warnings.push(`Overframe override for unknown id "${id}" - no such generated item.`);
      continue;
    }
    item.overframe = overframe;
  }

  const items = [...itemsById.values()]
    .filter(hasAnyDestination)
    .sort((a, b) => a.id.localeCompare(b.id));

  return { items, warnings };
}

function summarize(items) {
  const bySite = { wiki: 0, market: 0, overframe: 0 };
  const byCategory = {};
  for (const item of items) {
    if (item.wiki) bySite.wiki++;
    if (item.market) bySite.market++;
    if (item.overframe) bySite.overframe++;
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
  }
  console.log(`\nGenerated ${items.length} items.`);
  console.log(`  Wiki:      ${bySite.wiki}`);
  console.log(`  Market:    ${bySite.market}`);
  console.log(`  Overframe: ${bySite.overframe}`);
  console.log("\nBy category:");
  for (const [category, count] of Object.entries(byCategory).sort()) {
    console.log(`  ${category.padEnd(16)} ${count}`);
  }
}

function diffAgainstExisting(newItems) {
  if (!existsSync(OUTPUT_PATH)) {
    console.log(
      "No existing data/items.json to compare against - this would be the first generation.",
    );
    return;
  }
  const existing = readJson(OUTPUT_PATH);
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const newById = new Map(newItems.map((item) => [item.id, item]));

  const added = [...newById.keys()].filter((id) => !existingById.has(id));
  const removed = [...existingById.keys()].filter((id) => !newById.has(id));
  const changed = [...newById.keys()].filter((id) => {
    const before = existingById.get(id);
    return before && JSON.stringify(before) !== JSON.stringify(newById.get(id));
  });

  console.log(`\nCompared to committed data/items.json:`);
  console.log(`  New items:     ${added.length}`);
  console.log(`  Removed items: ${removed.length}`);
  console.log(`  Changed items: ${changed.length}`);
  for (const id of added.slice(0, 20)) console.log(`    + ${id}`);
  for (const id of removed.slice(0, 20)) console.log(`    - ${id}`);
  for (const id of changed.slice(0, 20)) console.log(`    ~ ${id}`);
}

async function main() {
  console.log(`Fetching data sources${refresh ? " (bypassing cache)" : ""}...`);
  const [wfcd, marketItems] = await Promise.all([
    fetchWfcdCategories({ refresh }),
    fetchMarketItems({ refresh }),
  ]);

  const { items, warnings } = buildRegistry(wfcd, marketItems);

  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const warning of warnings) console.log(`  ! ${warning}`);
  }

  summarize(items);

  if (checkOnly) {
    diffAgainstExisting(items);
    console.log("\n--check: data/items.json was not modified.");
    return;
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(items, null, 2) + "\n");
  console.log(`\nWrote ${path.relative(root, OUTPUT_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
