import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../settings/settings";
import { applyToForm, readFromForm } from "./options";

const OPTIONS_HTML_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "options.html");

function renderForm(): void {
  document.body.innerHTML = `
    <label><input type="checkbox" data-site="wiki" /></label>
    <label><input type="checkbox" data-site="market" /></label>
    <label><input type="checkbox" data-site="overframe" /></label>
    <label><input type="radio" name="linkTarget" value="new-tab" /></label>
    <label><input type="radio" name="linkTarget" value="same-tab" /></label>
  `;
}

describe("options page form", () => {
  it("applies settings to the checkboxes and radio buttons", () => {
    renderForm();
    applyToForm({
      enabledSites: { wiki: true, market: false, overframe: true },
      linkTarget: "same-tab",
    });

    expect(document.querySelector<HTMLInputElement>('[data-site="wiki"]')?.checked).toBe(true);
    expect(document.querySelector<HTMLInputElement>('[data-site="market"]')?.checked).toBe(false);
    expect(document.querySelector<HTMLInputElement>('[data-site="overframe"]')?.checked).toBe(true);
    expect(
      document.querySelector<HTMLInputElement>('[name="linkTarget"][value="same-tab"]')?.checked,
    ).toBe(true);
  });

  it("reads the current form state back into a settings object", () => {
    renderForm();
    applyToForm(DEFAULT_SETTINGS);
    document.querySelector<HTMLInputElement>('[data-site="market"]')!.checked = false;
    document.querySelector<HTMLInputElement>('[value="same-tab"]')!.checked = true;

    expect(readFromForm()).toEqual({
      enabledSites: { wiki: true, market: false, overframe: true },
      linkTarget: "same-tab",
    });
  });

  it("round-trips DEFAULT_SETTINGS through apply and read unchanged", () => {
    renderForm();
    applyToForm(DEFAULT_SETTINGS);
    expect(readFromForm()).toEqual(DEFAULT_SETTINGS);
  });
});

// Regression coverage for a real, and genuinely serious, bug: every test
// above exercises applyToForm/readFromForm as plain functions against an
// in-memory fixture - which is exactly why nothing caught options.html
// shipping with *no <script> tag at all*. The functions worked perfectly;
// they just never ran in a real browser, so the entire settings page did
// nothing - no saved state ever applied, no toggle ever took effect -
// silently, for as long as this went unnoticed. Reading the actual source
// file, the way a browser would load it, is the only way a test can catch
// this class of bug; a fixture built by hand in the test itself never can.
describe("options.html wires up its own script", () => {
  it("has a <script> tag loading options.js", () => {
    const html = readFileSync(OPTIONS_HTML_PATH, "utf8");
    expect(html).toMatch(/<script[^>]*\ssrc=["']options\.js["'][^>]*>/);
  });

  it("places the script after the form elements it needs to already exist in the DOM", () => {
    const html = readFileSync(OPTIONS_HTML_PATH, "utf8");
    const scriptIndex = html.indexOf("options.js");
    const lastInputIndex = html.lastIndexOf("<input");
    expect(scriptIndex).toBeGreaterThan(-1);
    expect(lastInputIndex).toBeGreaterThan(-1);
    expect(scriptIndex).toBeGreaterThan(lastInputIndex);
  });
});
