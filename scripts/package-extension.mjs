#!/usr/bin/env node
/**
 * Zips dist/ into release/crossframe-<version>.zip, ready to upload to the
 * Chrome Web Store Developer Dashboard (or Edge Add-ons, which accepts the
 * same package). No archiver dependency - a ZIP file is a simple enough
 * format (a local header + deflated data per entry, then a central
 * directory) to write by hand with Node's built-in zlib, in the same spirit
 * as scripts/lib/png.mjs.
 *
 * Run `npm run build` first. Usage: `npm run package`.
 */
import { deflateRawSync } from "node:zlib";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { crc32 } from "./lib/crc32.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const releaseDir = path.join(root, "release");

if (!existsSync(distDir)) {
  console.error("dist/ not found - run `npm run build` first.");
  process.exit(1);
}

function listFiles(dir, base = dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(full, base));
    } else if (entry.isFile()) {
      files.push(path.relative(base, full).split(path.sep).join("/"));
    }
  }
  return files;
}

function dosDateTime(date) {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, dosDate };
}

function buildZip(files, baseDir) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { time, dosDate } = dosDateTime(new Date());

  for (const relPath of files) {
    const data = readFileSync(path.join(baseDir, relPath));
    const compressed = deflateRawSync(data, { level: 9 });
    const nameBuf = Buffer.from(relPath, "utf8");
    const crc = crc32(data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(8, 8); // compression: deflate
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field length

    localParts.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(8, 10); // compression
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra field length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk number
    centralHeader.writeUInt16LE(0, 36); // internal attrs
    centralHeader.writeUInt32LE(0, 38); // external attrs
    centralHeader.writeUInt32LE(offset, 42); // offset of local header

    centralParts.push(centralHeader, nameBuf);

    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localSection = Buffer.concat(localParts);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4); // disk number
  end.writeUInt16LE(0, 6); // disk with central directory
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localSection.length, 16);
  end.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([localSection, centralDirectory, end]);
}

const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const files = listFiles(distDir).filter((f) => !f.endsWith(".map"));
const zip = buildZip(files, distDir);

mkdirSync(releaseDir, { recursive: true });
const outPath = path.join(releaseDir, `crossframe-${pkg.version}.zip`);
writeFileSync(outPath, zip);
console.log(`Wrote ${path.relative(root, outPath)} (${files.length} files, ${zip.length} bytes)`);
