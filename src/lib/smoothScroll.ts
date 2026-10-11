import type Lenis from "lenis";

let lenis: Lenis | null = null;

/** Registers the page's Lenis instance, or clears it when smooth scrolling is torn down. */
export function setSmoothScroll(instance: Lenis | null): void {
  lenis = instance;
}

/** Holds the page still, e.g. under an overlay. Does nothing when smooth scrolling is off. */
export function stopSmoothScroll(): void {
  lenis?.stop();
}

export function startSmoothScroll(): void {
  lenis?.start();
}

/**
 * Scrolls an element into view, respecting its `scroll-margin-top` (which clears the fixed
 * header). Smooth with Lenis, instant without it. `force` lets the scroll run even while Lenis is
 * stopped, which matters for mobile menu links: they close the menu on the same click.
 */
export function scrollToElement(element: HTMLElement): void {
  if (lenis) lenis.scrollTo(element, { force: true });
  else element.scrollIntoView();
}
