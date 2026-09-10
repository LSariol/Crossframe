import { describe, expect, it } from "vitest";
import { marketAdapter } from "./market";
import type { Destination } from "../navigation/destinations";

describe("marketAdapter.detectItemKey", () => {
  it("extracts the item slug from an item page", () => {
    const key = marketAdapter.detectItemKey(
      new URL("https://warframe.market/items/protea_prime_set"),
    );
    expect(key).toEqual({ site: "market", marketSlug: "protea_prime_set" });
  });

  it("tolerates a trailing slash", () => {
    const key = marketAdapter.detectItemKey(
      new URL("https://warframe.market/items/protea_prime_set/"),
    );
    expect(key).toEqual({ site: "market", marketSlug: "protea_prime_set" });
  });

  it("lowercases the slug", () => {
    const key = marketAdapter.detectItemKey(
      new URL("https://warframe.market/items/Protea_Prime_Set"),
    );
    expect(key?.site).toBe("market");
    if (key?.site === "market") expect(key.marketSlug).toBe("protea_prime_set");
  });

  it("returns undefined for the homepage, search, and listing pages", () => {
    expect(marketAdapter.detectItemKey(new URL("https://warframe.market/"))).toBeUndefined();
    expect(marketAdapter.detectItemKey(new URL("https://warframe.market/items"))).toBeUndefined();
    expect(
      marketAdapter.detectItemKey(new URL("https://warframe.market/items/protea_prime_set/extra")),
    ).toBeUndefined();
  });
});

describe("marketAdapter.findInjectionAnchor", () => {
  // The canonical name is "Protea Prime" (see data/items.json), not
  // "Protea Prime Set" - warframe.market's own heading for a Prime item is
  // expected to say "Set" even though the resolved item's name doesn't.
  const item = {
    id: "protea_prime",
    name: "Protea Prime",
    category: "warframe" as const,
    isPrime: true,
  };

  const withWiki: Destination[] = [
    { site: "wiki", url: "https://wiki.warframe.com/w/Protea/Prime" },
  ];
  const withoutWiki: Destination[] = [
    { site: "overframe", url: "https://overframe.gg/items/arsenal/6534/protea-prime/" },
  ];

  it("finds a heading reading '<Name> Set', not just the bare canonical name", async () => {
    document.body.innerHTML = `<section id="warframe_react"><h1>Protea Prime Set</h1></section>`;
    const anchor = await marketAdapter.findInjectionAnchor(item, withWiki);
    expect(anchor?.textContent).toBe("Protea Prime Set");
  });

  it('finds the real heading shape: "Set" in its own adjacent span, no space in between', async () => {
    // Confirmed from real warframe.market markup - this is not a
    // hypothetical: <h1><span>Acceltra Prime</span><span>Set</span></h1>
    // renders as "Acceltra Prime Set" but textContent comes back as
    // "Acceltra PrimeSet", with no space between the two words. This
    // silently broke every Prime set on warframe.market until fixed.
    document.body.innerHTML = `<section id="warframe_react"><h1><span>Protea Prime</span><span class="item__name-highlight">Set</span></h1></section>`;
    const anchor = await marketAdapter.findInjectionAnchor(item, withWiki);
    expect(anchor?.textContent).toBe("Protea PrimeSet");
  });

  it("also matches a heading using the bare canonical name (non-Prime items)", async () => {
    document.body.innerHTML = `<section id="warframe_react"><h1>Protea Prime</h1></section>`;
    const anchor = await marketAdapter.findInjectionAnchor(item, withWiki);
    expect(anchor?.textContent).toBe("Protea Prime");
  });

  it("waits for the heading to render client-side", async () => {
    document.body.innerHTML = `<section id="warframe_react"></section>`;
    const promise = marketAdapter.findInjectionAnchor(item, withWiki);

    setTimeout(() => {
      const section = document.getElementById("warframe_react")!;
      section.innerHTML = "<h1>Protea Prime Set</h1>";
    }, 10);

    const anchor = await promise;
    expect(anchor?.textContent).toBe("Protea Prime Set");
  });

  it("resolves to undefined when the mount point never renders a matching heading", async () => {
    document.body.innerHTML = `<section id="warframe_react"><p>loading...</p></section>`;
    const anchor = await marketAdapter.findInjectionAnchor(item, withWiki);
    expect(anchor).toBeUndefined();
  }, 7000);

  describe("anchoring near the Orders/Statistics/Drop Sources tab bar", () => {
    // Real structure from a live warframe.market page, per user-provided
    // DevTools output: a plain <ul> of tab links, "Drop Sources" being
    // the last and most distinctively-named one.
    function realMarkup() {
      return `
        <section id="warframe_react">
          <section class="name-container">
            <div class="name"><h1>Protea Prime Set</h1></div>
            <div class="inlined-attrs">
              <div class="tooltip"><div class="tooltip__trigger">Description</div></div>
              <div><a href="https://wiki.warframe.com/w/Protea/Prime" target="_blank">Wiki</a></div>
            </div>
          </section>
          <ul class="tabs">
            <li><a href="/items/protea_prime_set?type=sell"><span>Orders</span></a></li>
            <li><a href="/items/protea_prime_set/statistics"><span>Statistics</span></a></li>
            <li><a href="/items/protea_prime_set/dropsources"><span>Drop Sources</span></a></li>
          </ul>
        </section>
      `;
    }

    it("anchors after the tab bar, not the name heading", async () => {
      document.body.innerHTML = realMarkup();
      const anchor = await marketAdapter.findInjectionAnchor(item, withWiki);
      expect(anchor).toBe(document.querySelector("ul.tabs"));
    });

    it("removes the native Wiki link when Crossframe is showing its own Wiki button", async () => {
      document.body.innerHTML = realMarkup();
      await marketAdapter.findInjectionAnchor(item, withWiki);
      expect(document.querySelector('a[href^="https://wiki.warframe.com/"]')).toBeNull();
    });

    it("leaves the native Wiki link alone when Crossframe isn't showing its own Wiki button", async () => {
      // e.g. the user disabled Wiki as a destination in settings - removing
      // the only way to reach the wiki page would be worse than the
      // duplicate link this is otherwise meant to clean up.
      document.body.innerHTML = realMarkup();
      const anchor = await marketAdapter.findInjectionAnchor(item, withoutWiki);

      expect(document.querySelector('a[href^="https://wiki.warframe.com/"]')).not.toBeNull();
      expect(anchor).toBe(document.querySelector("ul.tabs"));
    });

    it("falls back to the plain heading anchor when no tab bar is found", async () => {
      // A future redesign, an A/B test, or just a different page layout.
      document.body.innerHTML = `<section id="warframe_react"><h1>Protea Prime Set</h1></section>`;
      const anchor = await marketAdapter.findInjectionAnchor(item, withWiki);
      expect(anchor).toBe(document.querySelector("h1"));
    });
  });
});
