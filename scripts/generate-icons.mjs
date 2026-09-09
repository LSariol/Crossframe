#!/usr/bin/env node
/**
 * Generates Crossframe's toolbar/options icons as plain PNGs with no image
 * dependencies: a teal circle (a "portal" between sites) with a white X
 * (the "cross" in Crossframe) drawn with simple per-pixel distance math.
 *
 * Run with `node scripts/generate-icons.mjs`. Output is committed to
 * icons/, so this does not need to run as part of the build.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { paintPng } from "./lib/png.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "icons");
mkdirSync(outDir, { recursive: true });

const BG = [26, 58, 66]; // deep teal
const FG = [255, 255, 255]; // white mark
const SIZES = [16, 48, 128];

function paintIcon(size) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.48;
  const armHalfWidth = Math.max(1, size * 0.09);
  const armInset = size * 0.24;

  return (x, y) => {
    const dx = x + 0.5 - cx;
    const dy = y + 0.5 - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) return [0, 0, 0, 0];

    const withinArmSpan =
      Math.abs(dx) < radius - armInset * 0.15 && Math.abs(dy) < radius - armInset * 0.15;
    if (withinArmSpan) {
      const distDiag1 = Math.abs(dx - dy) / Math.SQRT2;
      const distDiag2 = Math.abs(dx + dy) / Math.SQRT2;
      if (distDiag1 < armHalfWidth || distDiag2 < armHalfWidth) {
        return [...FG, 255];
      }
    }
    return [...BG, 255];
  };
}

for (const size of SIZES) {
  const png = paintPng(size, size, paintIcon(size));
  const file = path.join(outDir, `icon${size}.png`);
  writeFileSync(file, png);
  console.log(`Wrote ${path.relative(process.cwd(), file)} (${png.length} bytes)`);
}
