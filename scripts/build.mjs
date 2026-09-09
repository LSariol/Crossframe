#!/usr/bin/env node
/**
 * Bundles Crossframe's content scripts and options page with esbuild, then
 * assembles a loadable unpacked extension in dist/. No framework or
 * multi-tool build pipeline is needed for a handful of small entry points.
 */
import * as esbuild from "esbuild";
import { mkdirSync, copyFileSync, cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const dist = path.join(root, "dist");
const watch = process.argv.includes("--watch");

mkdirSync(dist, { recursive: true });

const entryPoints = {
  "content-wiki": "src/content/wiki.ts",
  "content-market": "src/content/market.ts",
  "content-overframe": "src/content/overframe.ts",
  options: "src/options/options.ts",
};

const buildOptions = {
  entryPoints: Object.entries(entryPoints).map(([out, entry]) => ({
    out,
    in: path.join(root, entry),
  })),
  bundle: true,
  outdir: dist,
  format: "iife",
  target: "chrome110",
  sourcemap: true,
  logLevel: "info",
};

function copyStaticFiles() {
  const manifestSrc = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"));
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  manifestSrc.version = pkg.version;
  writeFileSync(path.join(dist, "manifest.json"), JSON.stringify(manifestSrc, null, 2));

  cpSync(path.join(root, "icons"), path.join(dist, "icons"), { recursive: true });
  copyFileSync(path.join(root, "src/ui/styles.css"), path.join(dist, "styles.css"));

  const optionsHtml = path.join(root, "src/options/options.html");
  if (existsSync(optionsHtml)) {
    copyFileSync(optionsHtml, path.join(dist, "options.html"));
  }
  console.log("Copied static assets (manifest, icons, styles, options.html)");
}

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  copyStaticFiles();
  console.log("Watching for changes... (static files are not auto-copied on change)");
} else {
  await esbuild.build(buildOptions);
  copyStaticFiles();
  console.log(`Build complete: ${path.relative(process.cwd(), dist)}`);
}
