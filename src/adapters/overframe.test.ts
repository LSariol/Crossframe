import { describe, expect, it } from "vitest";
import { overframeAdapter } from "./overframe";

describe("overframeAdapter.detectItemKey", () => {
  it("extracts the numeric id from an arsenal item page", () => {
    const key = overframeAdapter.detectItemKey(
      new URL("https://overframe.gg/items/arsenal/6534/protea-prime/"),
    );
    expect(key).toEqual({ site: "overframe", overframeId: 6534 });
  });

  it("tolerates a missing trailing slash", () => {
    const key = overframeAdapter.detectItemKey(
      new URL("https://overframe.gg/items/arsenal/6534/protea-prime"),
    );
    expect(key).toEqual({ site: "overframe", overframeId: 6534 });
  });

  it("ignores query strings like pagination", () => {
    const key = overframeAdapter.detectItemKey(
      new URL("https://overframe.gg/items/arsenal/6534/protea-prime/?page=2"),
    );
    expect(key).toEqual({ site: "overframe", overframeId: 6534 });
  });

  it("returns undefined for tier lists, build listings, and the homepage", () => {
    expect(overframeAdapter.detectItemKey(new URL("https://overframe.gg/"))).toBeUndefined();
    expect(
      overframeAdapter.detectItemKey(new URL("https://overframe.gg/items/all/")),
    ).toBeUndefined();
    expect(
      overframeAdapter.detectItemKey(new URL("https://overframe.gg/tier-list/warframe/")),
    ).toBeUndefined();
    expect(
      overframeAdapter.detectItemKey(new URL("https://overframe.gg/builds/12345/")),
    ).toBeUndefined();
  });

  it("requires the numeric id - a slug-only path is not a valid Overframe item URL", () => {
    expect(
      overframeAdapter.detectItemKey(new URL("https://overframe.gg/items/arsenal/protea-prime/")),
    ).toBeUndefined();
  });
});

describe("overframeAdapter.findInjectionAnchor", () => {
  const item = {
    id: "protea_prime",
    name: "Protea Prime",
    category: "warframe" as const,
    isPrime: true,
  };

  it("finds a heading matching the item name", async () => {
    document.body.innerHTML = `<main><h1>Protea Prime</h1></main>`;
    const anchor = await overframeAdapter.findInjectionAnchor(item);
    expect(anchor?.textContent).toBe("Protea Prime");
  });

  it("resolves to undefined when no matching heading ever appears", async () => {
    document.body.innerHTML = `<main><h1>Some Other Page</h1></main>`;
    const anchor = await overframeAdapter.findInjectionAnchor(item);
    expect(anchor).toBeUndefined();
  }, 7000);
});
