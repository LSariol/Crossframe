import type { SiteId } from "../items/types";
import {
  allSites,
  loadSettings,
  saveSettings,
  type CrossframeSettings,
  type LinkTarget,
} from "../settings/settings";

function siteCheckbox(site: SiteId): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(`input[type="checkbox"][data-site="${site}"]`);
}

function linkTargetRadio(value: LinkTarget): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(`input[name="linkTarget"][value="${value}"]`);
}

export function applyToForm(settings: CrossframeSettings): void {
  for (const site of allSites()) {
    const checkbox = siteCheckbox(site);
    if (checkbox) checkbox.checked = settings.enabledSites[site];
  }
  const radio = linkTargetRadio(settings.linkTarget);
  if (radio) radio.checked = true;
}

export function readFromForm(): CrossframeSettings {
  const enabledSites = {} as Record<SiteId, boolean>;
  for (const site of allSites()) {
    enabledSites[site] = siteCheckbox(site)?.checked ?? true;
  }
  const checkedTarget = document.querySelector<HTMLInputElement>(
    'input[name="linkTarget"]:checked',
  );
  const linkTarget: LinkTarget = checkedTarget?.value === "same-tab" ? "same-tab" : "new-tab";
  return { enabledSites, linkTarget };
}

function showSavedStatus(): void {
  const status = document.querySelector(".crossframe-options__status");
  if (!status) return;
  status.textContent = "Saved";
  window.setTimeout(() => {
    if (status.textContent === "Saved") status.textContent = "";
  }, 1500);
}

async function handleChange(): Promise<void> {
  await saveSettings(readFromForm());
  showSavedStatus();
}

async function init(): Promise<void> {
  applyToForm(await loadSettings());
  document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => void handleChange());
  });
}

void init();
