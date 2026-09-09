#!/usr/bin/env node
/**
 * Generates Crossframe's toolbar/options icons as plain PNGs with no image
 * dependencies: a teal circle (a "portal" between sites) with a white X
 * (the "cross" in Crossframe) drawn with simple per-pixel distance math,
 * then hand-assembled into PNG chunks (zlib-deflate is Node's built-in).
 *
 * Run with `node scripts/generate-icons.mjs`. Output is committed to
 * icons/, so this does not need to run as part of the build.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "icons");
mkdirSync(outDir, { recursive: true });

const BG = [26, 58, 66]; // deep teal
const FG = [255, 255, 255]; // white mark
const SIZES = [16, 48, 128];

function crc32(buf) {
  let c;
  const table = crc32.table ?? (crc32.table = makeCrcTable());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(crc ^ buf[i]) & 0xff];
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function drawIcon(size) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.48;
  const armHalfWidth = Math.max(1, size * 0.09);
  const armInset = size * 0.24;

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // no filter
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      if (dist <= radius) {
        [r, g, b] = BG;
        a = 255;
        const withinArmSpan =
          Math.abs(dx) < radius - armInset * 0.15 && Math.abs(dy) < radius - armInset * 0.15;
        if (withinArmSpan) {
          const distDiag1 = Math.abs(dx - dy) / Math.SQRT2;
          const distDiag2 = Math.abs(dx + dy) / Math.SQRT2;
          if (distDiag1 < armHalfWidth || distDiag2 < armHalfWidth) {
            [r, g, b] = FG;
          }
        }
      }
      const offset = 1 + x * 4;
      row[offset] = r;
      row[offset + 1] = g;
      row[offset + 2] = b;
      row[offset + 3] = a;
    }
    rows.push(row);
  }
  return Buffer.concat(rows);
}

function buildPng(size) {
  const raw = drawIcon(size);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of SIZES) {
  const png = buildPng(size);
  const file = path.join(outDir, `icon${size}.png`);
  writeFileSync(file, png);
  console.log(`Wrote ${path.relative(process.cwd(), file)} (${png.length} bytes)`);
}
