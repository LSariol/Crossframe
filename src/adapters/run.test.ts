import { describe, expect, it, beforeEach, vi } from "vitest";
import type { SiteAdapter } from "./types";
import type { DetectedItemKey } from "../items/resolver";
import { runAdapter, watchAdapter } from "./run";

/** Flushes pending microtasks and one macrotask tick - enough for a
 * fire-and-forget runAdapter() call (triggered internally by watchAdapter,
 * which can't be awaited directly) to fully settle. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

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

  // Regression coverage for a real bug: warframe.market and overframe.gg
  // are React SPAs that change the URL via the History API for in-page
  // tab/state transitions (confirmed for real: warframe.market's own
  // "Orders" tab link points at "?type=sell" on the *same* item page) -
  // browsers don't re-run content scripts for that kind of navigation, so
  // a version of runAdapter that only ever does anything once per page
  // load would simply stop working the moment that happened, even though
  // the page itself is still perfectly navigable.
  describe("re-running after the URL changes without a full page load", () => {
    it("replaces the old nav when re-run resolves to a different item", async () => {
      let path = "/w/Protea/Prime";
      const adapter = makeAdapter({
        detectItemKey: () => ({ site: "wiki", wikiPath: path }) as DetectedItemKey,
      });
      const location = { href: "" } as Location;
      Object.defineProperty(location, "href", { get: () => `https://wiki.warframe.com${path}` });

      await runAdapter(adapter, location);
      expect(document.querySelectorAll(".crossframe-nav")).toHaveLength(1);
      const sitesBefore = [
        ...document.querySelectorAll(".crossframe-nav a"),
      ].map((a) => a.getAttribute("aria-label"));
      expect(sitesBefore.some((l) => l?.includes("Protea Prime"))).toBe(true);

      path = "/w/Orokin_Cell"; // a real resource: wiki-only, no market/overframe
      await runAdapter(adapter, location);

      expect(document.querySelectorAll(".crossframe-nav")).toHaveLength(0); // Orokin Cell has no destinations from wiki
    });

    it("does nothing when re-run resolves to the same item and the nav is still present", async () => {
      const adapter = makeAdapter();
      const location = { href: "https://wiki.warframe.com/w/Protea/Prime" } as Location;
      await runAdapter(adapter, location);
      const firstNav = document.querySelector(".crossframe-nav");

      await runAdapter(adapter, location);
      expect(document.querySelector(".crossframe-nav")).toBe(firstNav); // same element, not replaced
    });

    it("re-injects if the previously-injected nav got wiped out by the host page's own re-render", async () => {
      const adapter = makeAdapter();
      const location = { href: "https://wiki.warframe.com/w/Protea/Prime" } as Location;
      await runAdapter(adapter, location);
      document.querySelector(".crossframe-nav")?.remove();

      await runAdapter(adapter, location);
      expect(document.querySelectorAll(".crossframe-nav")).toHaveLength(1);
    });
  });
});

describe("watchAdapter", () => {
  beforeEach(() => {
    document.body.innerHTML = `<h1 id="anchor">Protea Prime</h1>`;
  });

  it("runs the pipeline immediately", async () => {
    watchAdapter(makeAdapter());
    await flush();
    expect(document.querySelector(".crossframe-nav")).toBeTruthy();
  });

  // Regression coverage for a real bug: warframe.market's own internal
  // search changes the URL via a mechanism this project was never able to
  // identify from its minified bundle - confirmed, via real debugging on
  // the live site, that it does *not* go through the instance-level
  // window.history.pushState/replaceState properties (an earlier version
  // hooked those directly and never saw the call). Polling location.href
  // is the fallback that doesn't need to know the mechanism at all.
  it("re-runs when location.href changes, however it changed - picked up by the polling fallback, not by hooking history directly", async () => {
    vi.useFakeTimers();
    try {
      let path = "/w/Protea/Prime";
      const adapter = makeAdapter({
        detectItemKey: () => ({ site: "wiki", wikiPath: path }) as DetectedItemKey,
      });
      const location = { href: "" } as Location;
      Object.defineProperty(location, "href", { get: () => `https://wiki.warframe.com${path}` });

      watchAdapter(adapter, location);
      await vi.advanceTimersByTimeAsync(0); // let the immediate run settle
      expect(document.querySelectorAll(".crossframe-nav")).toHaveLength(1);

      // Nothing calls pushState/replaceState here at all - the URL just
      // changes out from under us, the same as warframe.market's search.
      path = "/w/Orokin_Cell"; // a real resource: wiki-only, no market/overframe

      await vi.advanceTimersByTimeAsync(600); // past one poll interval
      expect(document.querySelectorAll(".crossframe-nav")).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
