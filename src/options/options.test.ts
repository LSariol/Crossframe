import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../settings/settings";
import { applyToForm, readFromForm } from "./options";

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
