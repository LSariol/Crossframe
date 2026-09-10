import { describe, expect, it } from "vitest";
import { findHeadingByText, findLinkByText, waitForElement } from "./dom";

describe("findHeadingByText", () => {
  it("finds a heading whose text matches exactly", () => {
    document.body.innerHTML = `<div><h1>Protea Prime</h1><p>Protea Prime is great</p></div>`;
    const heading = findHeadingByText(document.body, "Protea Prime");
    expect(heading?.tagName).toBe("H1");
  });

  it("ignores case and incidental whitespace", () => {
    document.body.innerHTML = `<h2>   protea   PRIME  </h2>`;
    expect(findHeadingByText(document.body, "Protea Prime")).toBeDefined();
  });

  it("matches ARIA heading roles, not just h1-h4", () => {
    document.body.innerHTML = `<div role="heading" aria-level="1">Protea Prime</div>`;
    expect(findHeadingByText(document.body, "Protea Prime")).toBeDefined();
  });

  it("does not match a heading containing extra text", () => {
    document.body.innerHTML = `<h1>Protea Prime Builds</h1>`;
    expect(findHeadingByText(document.body, "Protea Prime")).toBeUndefined();
  });

  it("returns undefined when nothing matches", () => {
    document.body.innerHTML = `<h1>Something Else</h1>`;
    expect(findHeadingByText(document.body, "Protea Prime")).toBeUndefined();
  });

  it("matches any one of several exact candidate strings", () => {
    document.body.innerHTML = `<h1>Protea Prime Set</h1>`;
    expect(findHeadingByText(document.body, "Protea Prime", "Protea Prime Set")).toBeDefined();
    expect(findHeadingByText(document.body, "Something Else", "Protea Prime Set")).toBeDefined();
  });

  it("still requires an exact match against every candidate, not a prefix", () => {
    document.body.innerHTML = `<h1>Protea Prime Set Bonus</h1>`;
    expect(findHeadingByText(document.body, "Protea Prime", "Protea Prime Set")).toBeUndefined();
  });
});

describe("findLinkByText", () => {
  it("finds a link whose text matches exactly, ignoring case and nested markup", () => {
    document.body.innerHTML = `<nav><a href="/items/arsenal/7962/sirius-orion/"><span>Sirius &amp; Orion</span></a></nav>`;
    const link = findLinkByText(document.body, "sirius & orion");
    expect(link?.getAttribute("href")).toBe("/items/arsenal/7962/sirius-orion/");
  });

  it("returns undefined when nothing matches", () => {
    document.body.innerHTML = `<a href="/somewhere">Something Else</a>`;
    expect(findLinkByText(document.body, "Protea Prime")).toBeUndefined();
  });

  it("ignores non-link elements with matching text", () => {
    document.body.innerHTML = `<h1>Protea Prime</h1><span>Protea Prime</span>`;
    expect(findLinkByText(document.body, "Protea Prime")).toBeUndefined();
  });
});

describe("waitForElement", () => {
  it("resolves immediately when the element already exists", async () => {
    document.body.innerHTML = `<div id="target"></div>`;
    const found = await waitForElement(() => document.getElementById("target") ?? undefined);
    expect(found?.id).toBe("target");
  });

  it("resolves once the element is added asynchronously", async () => {
    document.body.innerHTML = "";
    const promise = waitForElement(() => document.getElementById("target") ?? undefined, {
      root: document.body,
      timeoutMs: 2000,
    });

    setTimeout(() => {
      const el = document.createElement("div");
      el.id = "target";
      document.body.appendChild(el);
    }, 10);

    const found = await promise;
    expect(found?.id).toBe("target");
  });

  it("resolves to undefined after the timeout when nothing appears", async () => {
    document.body.innerHTML = "";
    const found = await waitForElement(() => document.getElementById("never") ?? undefined, {
      root: document.body,
      timeoutMs: 50,
    });
    expect(found).toBeUndefined();
  });
});
