/**
 * Small DOM helpers shared by every site adapter. Kept deliberately generic
 * and free of any site-specific selector so adapters can lean on them
 * without leaking one site's markup assumptions into another's.
 */

/**
 * Strips whitespace entirely (not just collapsing runs of it) before
 * comparing, rather than just trimming/collapsing: confirmed from real
 * warframe.market markup that a Prime set's name is split across
 * adjacent sibling elements with no whitespace between them at all -
 * `<h1><span>Acceltra Prime</span><span>Set</span></h1>` - so `textContent`
 * comes back as "Acceltra PrimeSet", not "Acceltra Prime Set". Matching
 * against a target string with normal spacing would otherwise never find
 * this heading at all. Still an exact match once whitespace is removed
 * from both sides, so this doesn't loosen the match into a prefix/substring
 * check - two genuinely different names remain different with their spaces
 * removed.
 */
function normalizeText(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

const HEADING_SELECTOR = 'h1, h2, h3, h4, [role="heading"]';

/**
 * Finds a heading-like element (or ARIA heading) whose text exactly
 * matches one of `targetTexts`, ignoring case and incidental whitespace.
 * Takes multiple candidates rather than doing a substring/prefix match so
 * callers stay precise about what they'll accept (e.g. a Prime item's
 * canonical name plus warframe.market's "<Name> Set" listing name) instead
 * of risking a match against some unrelated heading elsewhere on the page
 * that merely starts with the same text.
 *
 * Used as a resilience fallback when a site has no stable id/class to
 * anchor on: matching against the item's own name - data Crossframe
 * already trusts - survives CSS/markup churn that a specific selector
 * wouldn't.
 */
export function findHeadingByText(
  root: ParentNode,
  ...targetTexts: [string, ...string[]]
): HTMLElement | undefined {
  const targets = new Set(targetTexts.map(normalizeText));
  const candidates = root.querySelectorAll<HTMLElement>(HEADING_SELECTOR);
  for (const element of candidates) {
    if (targets.has(normalizeText(element.textContent ?? ""))) {
      return element;
    }
  }
  return undefined;
}

const LINK_SELECTOR = "a[href]";

/**
 * Finds a link whose text exactly matches one of `targetTexts`, ignoring
 * case and incidental whitespace - the anchor equivalent of
 * findHeadingByText, for pages that reference an item by name in a link
 * (e.g. a breadcrumb) rather than in a heading. Callers wanting extra
 * confidence should also check the returned link's `href` themselves
 * (text-only matching can't tell a genuine self-link from an unrelated
 * link that happens to share the item's name).
 */
export function findLinkByText(
  root: ParentNode,
  ...targetTexts: [string, ...string[]]
): HTMLAnchorElement | undefined {
  const targets = new Set(targetTexts.map(normalizeText));
  const candidates = root.querySelectorAll<HTMLAnchorElement>(LINK_SELECTOR);
  for (const element of candidates) {
    if (targets.has(normalizeText(element.textContent ?? ""))) {
      return element;
    }
  }
  return undefined;
}

export interface WaitForElementOptions {
  /** Subtree to watch for mutations. Defaults to document.body. Keep this as narrow as possible. */
  root?: Element;
  /** Gives up and resolves to undefined after this many milliseconds. */
  timeoutMs?: number;
}

/**
 * Resolves once `find()` returns an element, or undefined if it still
 * hasn't after `timeoutMs`. Used for sites that render their item content
 * client-side after the content script has already run. The observer is
 * scoped to `root` (never the whole document) and always disconnects -
 * on success, on timeout, or if the page navigates away - so nothing is
 * left watching indefinitely.
 */
export function waitForElement(
  find: () => Element | undefined,
  { root = document.body, timeoutMs = 5000 }: WaitForElementOptions = {},
): Promise<Element | undefined> {
  const immediate = find();
  if (immediate) return Promise.resolve(immediate);

  return new Promise((resolve) => {
    const cleanup = () => {
      observer.disconnect();
      clearTimeout(timer);
    };
    const observer = new MutationObserver(() => {
      const found = find();
      if (found) {
        cleanup();
        resolve(found);
      }
    });
    const timer = setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, timeoutMs);
    observer.observe(root, { childList: true, subtree: true });
  });
}
