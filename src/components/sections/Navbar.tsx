"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { AuralisLogo } from "@/components/ui/AuralisLogo";
import { Container } from "@/components/ui/Container";
import { site } from "@/content/site";
import { MOBILE_MENU_REVEAL } from "@/lib/constants";
import { cn } from "@/lib/utils";

const DESKTOP_QUERY = "(min-width: 48rem)";
const MENU_ID = "mobile-menu";
// Both lines sit on the centre and only transform, so the burger morphs into a cross smoothly.
const BURGER_LINE =
  "absolute inset-x-0 top-1/2 h-px bg-text transition-transform duration-300 ease-out-expo";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      toggleRef.current?.focus();
    };
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const closeOnDesktop = () => setIsOpen(false);

    document.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keep Tab inside the open menu: the toggle stays on top as the close control.
  const trapFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (
      !isOpen ||
      event.key !== "Tab" ||
      !toggleRef.current ||
      !menuRef.current
    ) {
      return;
    }
    const links = Array.from(menuRef.current.querySelectorAll("a"));
    const first = toggleRef.current;
    const last = links[links.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const close = () => setIsOpen(false);

  // Links rise in one after another on open and leave together on close.
  const revealItem = cn(
    "transition duration-500 ease-out-expo",
    isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
  );
  const revealDelay = (index: number) => ({
    transitionDelay: isOpen
      ? `${MOBILE_MENU_REVEAL.delayMs + index * MOBILE_MENU_REVEAL.staggerMs}ms`
      : "0ms",
  });

  return (
    <header
      onKeyDown={trapFocus}
      className="fixed inset-x-0 top-0 z-50 border-b border-line"
    >
      {/* The blur sits on its own layer: a backdrop-filter on the header itself would make it the
          containing block for the fixed menu below and squeeze the menu into the header's height. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-void/40 backdrop-blur-xl"
      />
      <Container className="flex h-16 items-center justify-between">
        <a href="#top" onClick={close} className="relative z-10">
          <AuralisLogo />
        </a>

        <nav aria-label={site.navLabels.primary} className="hidden md:block">
          <ul className="flex items-center gap-8">
            {site.nav.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-small text-muted transition-colors duration-300 hover:text-text"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <a
            href={site.navCta.href}
            className="hidden rounded-full border border-line px-5 py-2.5 text-small font-medium transition-colors duration-300 hover:border-accent hover:text-accent md:inline-block"
          >
            {site.navCta.label}
          </a>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={isOpen}
            aria-controls={MENU_ID}
            aria-label={
              isOpen ? site.navLabels.closeMenu : site.navLabels.openMenu
            }
            onClick={() => setIsOpen((open) => !open)}
            className="relative z-10 flex size-10 items-center justify-center md:hidden"
          >
            <span aria-hidden className="relative block h-3.5 w-6">
              <span
                className={cn(
                  BURGER_LINE,
                  isOpen ? "rotate-45" : "-translate-y-1.5",
                )}
              />
              <span
                className={cn(
                  BURGER_LINE,
                  isOpen ? "-rotate-45" : "translate-y-1.5",
                )}
              />
            </span>
          </button>
        </div>
      </Container>

      {/* Stays mounted so it can fade out; while closed it is invisible and inert, so nothing in
          it can be reached by pointer, keyboard or screen reader. */}
      <div
        ref={menuRef}
        id={MENU_ID}
        inert={!isOpen}
        className={cn(
          "fixed inset-0 flex h-dvh flex-col bg-void/96 backdrop-blur-xl transition-[opacity,visibility] duration-300 ease-out-expo md:hidden",
          !isOpen && "invisible opacity-0",
        )}
      >
        {/* Scrolls below the header row, so on short screens no link slides under the logo. */}
        <ul className="mt-16 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-gutter pt-10 pb-12">
          {site.nav.map((link, index) => (
            <li
              key={link.href}
              className={revealItem}
              style={revealDelay(index)}
            >
              <a
                href={link.href}
                onClick={close}
                className="text-h2 font-medium"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li
            className={cn("pt-4", revealItem)}
            style={revealDelay(site.nav.length)}
          >
            <a
              href={site.navCta.href}
              onClick={close}
              className="inline-block rounded-full bg-accent px-6 py-3.5 text-small font-medium text-void"
            >
              {site.navCta.label}
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
