import { describe, expect, it, beforeEach } from "vitest";
import type { SiteAdapter } from "./types";
import type { DetectedItemKey } from "../items/resolver";
import { runAdapter } from "./run";

function makeAdapter(overrides: Partial<SiteAdapter> = {}): SiteAdapter {
  return {
    site: "wiki",
    detectItemKey: () => ({ site: "wiki", wikiPath: "/w/Protea/Prime" }) as DetectedItemKey,
    findInjectionAnchor: async () => document.getElementById("anchor") ?? undefined,
    ...overrides,
  };
}

describe("runAdapter", () => {
  beforeEach(() => {
    document.body.innerHTML = `<h1 id="anchor">Protea Prime</h1>`;
  });

  it("injects navigation for a real, recognized item (Protea Prime)", async () => {
    await runAdapter(makeAdapter(), {
      href: "https://wiki.warframe.com/w/Protea/Prime",
    } as Location);

    const nav = document.querySelector(".crossframe-nav");
    expect(nav).toBeTruthy();
    expect(nav?.previousElementSibling?.id).toBe("anchor");
    const sites = [...nav!.querySelectorAll("a")].map((a) => a.dataset["crossframeSite"]);
    expect(sites.sort()).toEqual(["market", "overframe"]);
  });

  it("does nothing when detectItemKey finds no item page", async () => {
    await runAdapter(makeAdapter({ detectItemKey: () => undefined }), {
      href: "https://wiki.warframe.com/",
    } as Location);
    expect(document.querySelector(".crossframe-nav")).toBeNull();
  });

  it("does nothing when the key doesn't resolve to a known item", async () => {
    await runAdapter(
      makeAdapter({ detectItemKey: () => ({ site: "wiki", wikiPath: "/w/Not_A_Real_Page" }) }),
      { href: "https://wiki.warframe.com/w/Not_A_Real_Page" } as Location,
    );
    expect(document.querySelector(".crossframe-nav")).toBeNull();
  });

  it("does nothing when no destinations are relevant (current-site-only item)", async () => {
    // A resource has no destinations on wiki other than itself, so viewing
    // it *from* wiki should never inject anything.
    await runAdapter(
      makeAdapter({
        site: "wiki",
        detectItemKey: () => ({ site: "wiki", wikiPath: "/w/Orokin_Cell" }),
      }),
      { href: "https://wiki.warframe.com/w/Orokin_Cell" } as Location,
    );
    expect(document.querySelector(".crossframe-nav")).toBeNull();
  });

  it("does nothing when no injection anchor is found", async () => {
    await runAdapter(makeAdapter({ findInjectionAnchor: async () => undefined }), {
      href: "https://wiki.warframe.com/w/Protea/Prime",
    } as Location);
    expect(document.querySelector(".crossframe-nav")).toBeNull();
  });

  it("never injects twice", async () => {
    const adapter = makeAdapter();
    const location = { href: "https://wiki.warframe.com/w/Protea/Prime" } as Location;
    await runAdapter(adapter, location);
    await runAdapter(adapter, location);
    expect(document.querySelectorAll(".crossframe-nav")).toHaveLength(1);
  });
});
