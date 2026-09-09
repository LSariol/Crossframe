import type { SiteId } from "../items/types";
import { SITE_IDS } from "../items/types";

export type LinkTarget = "new-tab" | "same-tab";

export interface CrossframeSettings {
  /** Whether Crossframe is active on each site at all, and whether that site is ever offered as a destination. */
  enabledSites: Record<SiteId, boolean>;
  /** Where clicking a Crossframe button navigates to. */
  linkTarget: LinkTarget;
}

export const DEFAULT_SETTINGS: CrossframeSettings = {
  enabledSites: { wiki: true, market: true, overframe: true },
  linkTarget: "new-tab",
};

/** True when the chrome.storage API is available - false in a test/non-extension context. */
function hasStorage(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.sync);
}

/**
 * Loads settings from chrome.storage.sync, falling back to defaults when
 * nothing has been saved yet or storage isn't available at all. Settings
 * are always written as one complete object (see saveSettings), so no
 * partial merge is needed here.
 */
export async function loadSettings(): Promise<CrossframeSettings> {
  if (!hasStorage()) return DEFAULT_SETTINGS;
  const stored = await chrome.storage.sync.get(
    DEFAULT_SETTINGS as unknown as Record<string, unknown>,
  );
  return stored as unknown as CrossframeSettings;
}

export async function saveSettings(settings: CrossframeSettings): Promise<void> {
  if (!hasStorage()) return;
  await chrome.storage.sync.set(settings);
}

export function isSiteEnabled(settings: CrossframeSettings, site: SiteId): boolean {
  return settings.enabledSites[site];
}

/** All sites present and true - used by the options page to render one checkbox per site. */
export function allSites(): readonly SiteId[] {
  return SITE_IDS;
}
