---
name: frontend-design
description: Use when building or restyling any UI, page, component, or frontend artifact - pushes designs away from generic defaults toward distinctive, intentional, context-fit visuals. Covers typography, color, motion, backgrounds, and layout. Don't use for pure logic/backend work with no visual surface.
---

# Frontend Design

## Why this skill exists

Left to defaults, frontend output converges on the same safe, "on-distribution" look: Inter font, purple-on-white gradients, timid spacing, almost no motion. Those choices dominate training data, so they feel like the path of least resistance — but they produce forgettable UIs.

The goal of this skill: **make creative, distinctive frontends that surprise and delight, and that feel genuinely designed for their specific context** — not cookie-cutter. Interpret briefs creatively and make unexpected-but-intentional choices. Vary between light and dark themes, different fonts, and different aesthetics across projects. Think outside the box.

## Typography

- **Avoid the overused defaults:** Inter, Roboto, Open Sans, Lato, Arial, and raw system fonts.
- **Pick from distinctive families** and load from Google Fonts:
  - Code/technical aesthetic: JetBrains Mono, Fira Code, Space Grotesk, IBM Plex family, Source Sans 3
  - Editorial: Playfair Display, Crimson Pro, Newsreader
  - Distinctive display: Bricolage Grotesque
- **Pair with high contrast** — that's what makes type interesting: display + monospace, or serif + geometric sans.
- **Use extreme weight and size hierarchy:** 100/200 weight against 800/900 (not 400 vs 600). Size jumps of 3x+, not 1.5x.
- **Pick one distinctive font and use it decisively.** Don't reflexively reach for the same "safe distinctive" font (e.g. Space Grotesk) every time — vary it per project.

## Color & theme

- **Commit to one cohesive aesthetic.** Define it once with CSS variables and reuse them everywhere.
- **Dominant color + sharp accents** beats a timid, evenly-distributed palette.
- Draw inspiration from **IDE themes and cultural/contextual aesthetics**, not generic palettes.
- **Avoid clichés** — especially purple gradients on white backgrounds.

## Motion & animation

- Use animation for effects and micro-interactions. **Prefer CSS-only solutions** for plain HTML.
- In React, use the **Motion** library when available.
- **One well-orchestrated page-load sequence with staggered reveals** (`animation-delay`) creates more delight than scattered, random micro-interactions. Orchestrate, don't sprinkle.

## Backgrounds

Create **atmosphere and depth** instead of defaulting to a flat solid color: layer CSS gradients, use geometric patterns, or add contextual effects that match the chosen aesthetic.

## Layout & components

- Avoid predictable, templated layouts and the same component patterns every time.
- Give each design **context-specific character** — what fits a fintech dashboard shouldn't look like a music app.
- When richer artifacts are needed, lean on modern tooling (React, Tailwind, shadcn/ui) rather than hand-coding everything from scratch.

## Anti-patterns checklist (reject these)

- Overused fonts: Inter, Roboto, Arial, system defaults
- Purple gradients on white backgrounds / other clichéd schemes
- Predictable layouts and stock component patterns
- Cookie-cutter design with no context-specific character
- Repeatedly converging on the same "distinctive" choice across projects

## How to apply

1. Identify the context and mood the UI should convey before picking anything.
2. Choose a cohesive aesthetic (theme, one strong font, palette with a dominant + accent) and encode it in CSS variables.
3. Build the layout with intentional hierarchy (extreme type scale, generous/deliberate spacing).
4. Add one orchestrated motion moment + atmospheric background.
5. Run the anti-patterns checklist before calling it done.
