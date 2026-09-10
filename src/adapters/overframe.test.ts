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

describe("overframeAdapter.detectItemKey on build pages", () => {
  // Real build URLs, gathered by hand: /build/<buildId>/<frameSlug>/<titleSlug>/.
  // buildId identifies the build, not the item, so resolution falls back
  // to the frame slug instead (see resolver.ts).
  it("extracts the frame slug from a Prime build page", () => {
    const key = overframeAdapter.detectItemKey(
      new URL(
        "https://overframe.gg/build/676830/protea-prime/protea-the-invincible-void-destroyer-steel-path/",
      ),
    );
    expect(key).toEqual({ site: "overframe", overframeSlug: "protea-prime" });
  });

  it("extracts the frame slug from a non-Prime build page", () => {
    const key = overframeAdapter.detectItemKey(
      new URL("https://overframe.gg/build/50057/protea/easy-peasy-lemon-squeezy-now-with-prime/"),
    );
    expect(key).toEqual({ site: "overframe", overframeSlug: "protea" });
  });

  it("ignores the build title's specific content, including odd characters", () => {
    const key = overframeAdapter.detectItemKey(
      new URL("https://overframe.gg/build/159165/protea/shitty-shit-i-would-edit-soontm/"),
    );
    expect(key).toEqual({ site: "overframe", overframeSlug: "protea" });
  });

  it("tolerates a missing trailing slash", () => {
    const key = overframeAdapter.detectItemKey(
      new URL(
        "https://overframe.gg/build/861782/protea-prime/temporal-hot-shot-hybrid-caster-weapons-platform",
      ),
    );
    expect(key).toEqual({ site: "overframe", overframeSlug: "protea-prime" });
  });

  it("returns undefined for a build page missing the title segment", () => {
    expect(
      overframeAdapter.detectItemKey(new URL("https://overframe.gg/build/676830/protea-prime/")),
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
