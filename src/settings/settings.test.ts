import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, isSiteEnabled, loadSettings, saveSettings } from "./settings";

function installFakeChromeStorage() {
  const store = new Map<string, unknown>();
  vi.stubGlobal("chrome", {
    storage: {
      sync: {
        get: vi.fn(async (defaults: Record<string, unknown>) => {
          const result: Record<string, unknown> = { ...defaults };
          for (const key of Object.keys(defaults)) {
            if (store.has(key)) result[key] = store.get(key);
          }
          return result;
        }),
        set: vi.fn(async (values: Record<string, unknown>) => {
          for (const [key, value] of Object.entries(values)) store.set(key, value);
        }),
      },
    },
  });
  return store;
}

describe("settings", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back to defaults when nothing has been saved", async () => {
    installFakeChromeStorage();
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("falls back to defaults when chrome.storage isn't available at all", async () => {
    vi.stubGlobal("chrome", undefined);
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips a saved settings object", async () => {
    installFakeChromeStorage();
    const custom = {
      enabledSites: { wiki: true, market: false, overframe: true },
      linkTarget: "same-tab" as const,
    };
    await saveSettings(custom);
    expect(await loadSettings()).toEqual(custom);
  });

  it("does nothing (not throw) when saving without chrome.storage available", async () => {
    vi.stubGlobal("chrome", undefined);
    await expect(saveSettings(DEFAULT_SETTINGS)).resolves.toBeUndefined();
  });
});

describe("isSiteEnabled", () => {
  it("reads the per-site flag", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      enabledSites: { wiki: true, market: false, overframe: true },
    };
    expect(isSiteEnabled(settings, "wiki")).toBe(true);
    expect(isSiteEnabled(settings, "market")).toBe(false);
  });
});
