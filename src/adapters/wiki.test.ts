import { describe, expect, it } from "vitest";
import { wikiAdapter } from "./wiki";

describe("wikiAdapter.detectItemKey", () => {
  it("extracts the decoded page path for a /w/ page", () => {
    const key = wikiAdapter.detectItemKey(new URL("https://wiki.warframe.com/w/Protea/Prime"));
    expect(key).toEqual({ site: "wiki", wikiPath: "/w/Protea/Prime" });
  });

  it("decodes a percent-encoded subpage slash", () => {
    const key = wikiAdapter.detectItemKey(new URL("https://wiki.warframe.com/w/Protea%2FPrime"));
    expect(key).toEqual({ site: "wiki", wikiPath: "/w/Protea/Prime" });
  });

  it("still produces a key for non-item /w/ pages - resolution, not detection, filters those out", () => {
    const key = wikiAdapter.detectItemKey(new URL("https://wiki.warframe.com/w/Update_40"));
    expect(key).toEqual({ site: "wiki", wikiPath: "/w/Update_40" });
  });

  it("returns undefined for the homepage and non-/w/ paths", () => {
    expect(wikiAdapter.detectItemKey(new URL("https://wiki.warframe.com/"))).toBeUndefined();
    expect(
      wikiAdapter.detectItemKey(new URL("https://wiki.warframe.com/wiki/Special:Search")),
    ).toBeUndefined();
  });
});

describe("wikiAdapter.findInjectionAnchor", () => {
  const item = {
    id: "protea_prime",
    name: "Protea Prime",
    category: "warframe" as const,
    isPrime: true,
  };

  it("prefers #firstHeading when present", async () => {
    document.body.innerHTML = `<h1 id="firstHeading">Protea Prime</h1>`;
    const anchor = await wikiAdapter.findInjectionAnchor(item, []);
    expect(anchor?.id).toBe("firstHeading");
  });

  it("falls back to a text match when #firstHeading is missing", async () => {
    document.body.innerHTML = `<h1 class="page-title">Protea Prime</h1>`;
    const anchor = await wikiAdapter.findInjectionAnchor(item, []);
    expect(anchor?.textContent).toBe("Protea Prime");
  });

  it("resolves to undefined when no anchor can be found", async () => {
    document.body.innerHTML = `<h1>Unrelated Page</h1>`;
    const anchor = await wikiAdapter.findInjectionAnchor(item, []);
    expect(anchor).toBeUndefined();
  });
});
