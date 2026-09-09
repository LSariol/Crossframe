import { describe, expect, it } from "vitest";
import { marketAdapter } from "./market";

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
  const item = {
    id: "protea_prime",
    name: "Protea Prime Set",
    category: "warframe" as const,
    isPrime: true,
  };

  it("finds a heading matching the item name inside the React mount point", async () => {
    document.body.innerHTML = `<section id="warframe_react"><h1>Protea Prime Set</h1></section>`;
    const anchor = await marketAdapter.findInjectionAnchor(item);
    expect(anchor?.textContent).toBe("Protea Prime Set");
  });

  it("waits for the heading to render client-side", async () => {
    document.body.innerHTML = `<section id="warframe_react"></section>`;
    const promise = marketAdapter.findInjectionAnchor(item);

    setTimeout(() => {
      const section = document.getElementById("warframe_react")!;
      section.innerHTML = "<h1>Protea Prime Set</h1>";
    }, 10);

    const anchor = await promise;
    expect(anchor?.textContent).toBe("Protea Prime Set");
  });

  it("resolves to undefined when the mount point never renders a matching heading", async () => {
    document.body.innerHTML = `<section id="warframe_react"><p>loading...</p></section>`;
    const anchor = await marketAdapter.findInjectionAnchor(item);
    expect(anchor).toBeUndefined();
  }, 7000);
});
