# Auralis

Portfolio-grade concept website for **Auralis**, an AI platform that turns satellite data into a living 3D model of the planet. The site is a single cinematic landing page built around an interactive 3D globe, scroll-driven storytelling and smooth motion. Clients will read this code, so its quality matters as much as the visuals.

@AGENTS.md

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (configured in `src/app/globals.css`, no `tailwind.config`)
- **3D:** three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, postprocessing
- **Motion:** gsap + @gsap/react (`useGSAP`), lenis for smooth scrolling
- **Tooling:** ESLint (eslint-config-next), Prettier + prettier-plugin-tailwindcss, npm

## Commands

| Command             | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start the dev server                      |
| `npm run build`     | Production build                          |
| `npm run lint`      | ESLint                                    |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm run format`    | Format everything with Prettier           |

Before finishing any change, `npm run lint`, `npm run typecheck` and `npm run build` must pass.

## Folder conventions

```
src/
  app/                  Routes, root layout, globals.css (Tailwind theme lives here)
  components/
    sections/           One file per page section (Hero.tsx, Features.tsx, ...)
    three/              3D scene components (R3F). Client-only.
    ui/                 Small reusable UI pieces (Button, Tag, ...)
  hooks/                Reusable hooks (useReducedMotion, useDeviceTier, ...)
  lib/                  Utilities, constants, GSAP setup (lib/gsap.ts)
  content/              All site copy, as typed objects
public/                 Static assets (textures, images, fonts)
```

- Files are named after their main export: `PascalCase.tsx` for components and `camelCase.ts` for hooks and utilities.
- Import through the `@/*` alias (`@/components/ui/Button`), not long relative paths.
- Import GSAP and its plugins from `@/lib/gsap`, never directly from `gsap`, so plugin registration happens in one place.

## Rules

1. **Strict TypeScript, no `any`.** `strict` is on and `@typescript-eslint/no-explicit-any` is an error. Use `unknown` plus narrowing, generics or proper types instead.
2. **Small, single-purpose components.** If a component does two things, split it.
3. **All copy lives in `src/content`.** Components receive text from typed content objects. No user-facing strings are hardcoded in JSX.
4. **Every animation respects `prefers-reduced-motion`.** Use `useReducedMotion` (or `gsap.matchMedia`) and provide a static or instant alternative. This includes GSAP, Lenis, CSS transitions and 3D camera or auto-rotation.
5. **3D always has a low-power fallback.** Gate the WebGL scene behind `useDeviceTier`. Low-tier devices, missing WebGL2 and SSR all get a lightweight static fallback, such as an image or poster.
6. **Comments only where logic is non-obvious.** Explain _why_, not _what_.
7. **Clean, readable code.** Clients will review this repository. Prefer clarity over cleverness and leave no dead code, stray logs or TODO clutter.
8. **Server Components by default.** Add `"use client"` only to the components that need it (3D, animation, browser APIs), and keep those boundaries as low in the tree as possible.
