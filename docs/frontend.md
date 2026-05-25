---
name: frontend-design
description: >
  Create distinctive, production-grade frontend interfaces with high design quality.
  Use this skill when the user asks to build web components, pages, artifacts, posters,
  or applications (examples include websites, landing pages, dashboards, React components,
  HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished
  code and UI design that avoids generic AI aesthetics.
argument-hint: "Describe the component, page, or interface to build"
---

# Frontend Design

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Procedure

### 1. Design Thinking (before writing any code)

Understand the context and commit to a **BOLD** aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme and own it — brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian. Use these as inspiration, but design something true to the context.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

> **CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

### 2. Implement

Write production-grade code that is:

- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail
- Functional — no placeholder content, no empty states left undesigned

### 3. Aesthetics Checklist

Before finalizing, verify each dimension:

| Dimension               | Guidance                                                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Typography**          | Distinctive, characterful fonts — never Arial, Inter, Roboto. Pair a display font with a refined body font. Import from Google Fonts or use @font-face.         |
| **Color & Theme**       | Commit to a palette. Use CSS variables. Dominant color + sharp accent outperforms timid even distribution.                                                      |
| **Motion**              | CSS-only for HTML/vanilla. Motion library for React. One well-orchestrated page-load stagger > scattered micro-interactions. Surprise on hover and scroll.      |
| **Spatial Composition** | Asymmetry, overlap, diagonal flow, grid-breaking elements. Generous negative space OR controlled density — never bland uniform spacing.                         |
| **Backgrounds & Depth** | Gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, grain overlays. Never plain solid colors as the only atmosphere. |

### 4. Anti-patterns to Avoid

- ❌ Inter / Roboto / Arial / system-ui as the primary font
- ❌ Purple gradient on white background
- ❌ Generic card-grid-with-rounded-corners layouts
- ❌ Space Grotesk (overused in AI-generated UIs)
- ❌ Cookie-cutter hero sections with centered headline + CTA button
- ❌ Evenly distributed pastel color palettes
- ❌ Predictable component patterns that could belong to any project

## Quality Criteria

The design is complete when:

- [ ] A specific aesthetic direction was chosen and named (e.g., "industrial brutalism", "warm editorial")
- [ ] Fonts are loaded and distinctive — not system defaults
- [ ] Color palette is defined in CSS variables with clear intent
- [ ] At least one animation or motion effect is present
- [ ] Layout uses spatial tension — not a default top-to-bottom stack
- [ ] Background has depth or texture, not a flat solid
- [ ] Code is production-ready (no TODOs, no placeholder Lorem ipsum for real content fields)

## Implementation Notes

- **HTML/CSS/JS artifacts**: Use `<style>` and `<script>` inline; load fonts via `<link>` from Google Fonts.
- **React**: Use `styled-components`, `CSS modules`, or `tailwind` with custom config. Use Motion (`motion/react`) for animations.
- **Vue (this project)**: Scoped `<style>` blocks, Tailwind utility classes with CSS variable overrides in `globals.css`.
- **Match complexity to vision**: Maximalist designs need elaborate code with extensive animations. Minimalist designs need restraint and precision — elegance comes from executing the vision well.

> Claude is capable of extraordinary creative work. Don't hold back. Show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
