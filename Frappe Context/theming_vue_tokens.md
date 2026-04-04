---
title: "Vue Component Theming & NCE Token System"
merged_from:
  - VUE_THEME_USAGE.md
  - nce-theme-system.md
tokens_approx: 5739
created: 2026-03-23
axes:
  backend: null   # to be scored
  ui: null        # to be scored
  framework: null # to be scored
---

# Vue Component Theming & NCE Token System

REQUIRED READING for any Vue component work. Covers the golden rule (all visual properties use NCE tokens), the complete token reference, Tailwind and plain CSS usage, the two-file architecture (nce_theme.css vs nce-builder.css), and absolute no-nos.

Use this for ANY Vue component styling. See theming_css_systems.md for non-Vue CSS work.


---

## Vue Component Theme Usage

# Vue Component Theme Usage

> **This document is REQUIRED READING before creating or modifying any Vue component in an NCE project.**

---

## The Golden Rule

**ALL Vue components MUST use NCE theme tokens for every visual property.**

**NEVER hardcode colors, font sizes, border radii, shadows, or spacing values.**

If you are an AI agent reading this: violating these rules will break theming and produce visual disasters. Follow every rule precisely.

---

## How the Theme System Works

NCE Builder defines a centralized theme via CSS custom properties (`--nce-*`) injected into `:root` at runtime. Every NCE project consumes these tokens through one of two paths:

| Project type | How tokens are consumed |
|---|---|
| **Tailwind projects** (NCE Builder) | `tailwind.config.js` maps utility classes to `--nce-*` variables. Use standard Tailwind classes — they resolve to theme values automatically. |
| **Plain CSS projects** (NCE Events) | Use `var(--nce-*)` directly in `<style>` blocks with semantic aliases in `theme_defaults.css`. |

---

## Quick Decision Tree

1. **Need a color?** → Use a theme token. Never a hex literal.
2. **Working in a Tailwind project?** → Use Tailwind classes: `bg-primary`, `text-muted`, `rounded-lg`, `text-sm`, `shadow`
3. **Working in plain CSS?** → Use `var(--nce-color-primary)`, `var(--nce-font-size)`, etc.
4. **Need a shade of a brand color?** → Use the shade scale: `--nce-color-primary-100` through `--nce-color-primary-950`
5. **Need a semantic variable?** → Check `theme_defaults.css` first. Add new aliases there if needed.
6. **Tempted to hardcode one value?** → Don't. Re-read the golden rule.

---

## Complete Token Reference

### Brand & Status Colors

Each has a full shade scale: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950.

| Tailwind class | CSS variable | Default | Shade example |
|---|---|---|---|
| `primary` | `--nce-color-primary` | `#3B82F6` | `--nce-color-primary-100` … `--nce-color-primary-950` |
| `secondary` | `--nce-color-secondary` | `#10B981` | `--nce-color-secondary-100` … `--nce-color-secondary-950` |
| `accent` | `--nce-color-accent` | `#8B5CF6` | `--nce-color-accent-100` … `--nce-color-accent-950` |
| `success` | `--nce-color-success` | `#10B981` | `--nce-color-success-100` … `--nce-color-success-950` |
| `info` | `--nce-color-info` | `#3B82F6` | `--nce-color-info-100` … `--nce-color-info-950` |
| `warning` | `--nce-color-warning` | `#F59E0B` | `--nce-color-warning-100` … `--nce-color-warning-950` |
| `danger` | `--nce-color-danger` | `#EF4444` | `--nce-color-danger-100` … `--nce-color-danger-950` |

### Semantic Colors

| Tailwind usage | CSS variable | Default | Purpose |
|---|---|---|---|
| `text` (default) | `--nce-color-text` | `#1F2937` | Body text |
| `text-heading` | `--nce-color-heading` | `#111827` | Headings |
| `text-muted` | `--nce-color-muted` | `#6B7280` | Secondary text |
| `text-link` | `--nce-color-link` | `#3B82F6` | Hyperlinks |
| focus rings | `--nce-color-focus` | `#3B82F6` | Focus outlines |
| `bg` (default) | `--nce-color-bg` | `#FFFFFF` | Page background |
| `bg-surface`, `bg-card` | `--nce-color-surface` | `#F9FAFB` | Cards/panels |
| `border` (default) | `--nce-color-border` | `#E5E7EB` | All borders |
| `bg-row-alt` | `--nce-color-row-alt` | `#F3F4F6` | Alternate table rows |
| — | `--nce-shadow-color` | `#000000` | Shadow color |

### Typography

| Tailwind usage | CSS variable | Default |
|---|---|---|
| `font-sans` | `--nce-font-family` | System Default |
| `font-heading` | `--nce-font-heading` | System Default |
| `text-base` | `--nce-font-size` | `14px` |
| — | `--nce-line-height` | `1.5` |
| — | `--nce-font-weight` | `400` |

**Font size scale** (relative to `--nce-font-size`):

| Class | Computation |
|---|---|
| `text-xs` | `× 0.75` |
| `text-sm` | `× 0.875` |
| `text-base` | `× 1` (14px default) |
| `text-lg` | `× 1.125` |
| `text-xl` | `× 1.25` |
| `text-2xl` | `× 1.5` |
| `text-3xl` | `× 1.875` |
| `text-4xl` | `× 2.25` |

### Layout & Decoration

| Tailwind usage | CSS variable | Default |
|---|---|---|
| `rounded` / `rounded-md` | `--nce-border-radius` | `0.375rem` |
| `rounded-sm` | `× 0.5` | |
| `rounded-lg` | `× 1.5` | |
| `rounded-xl` | `× 2` | |
| `shadow` | `--nce-shadow` | medium shadow |
| spacing `xs` | `--nce-spacing-base × 0.25` | |
| spacing `sm` | `--nce-spacing-base × 0.5` | |
| spacing `md` | `--nce-spacing-base` | `1rem` |
| spacing `lg` | `--nce-spacing-base × 1.5` | |
| spacing `xl` | `--nce-spacing-base × 2` | |
| `duration-theme` | `--nce-transition-speed` | `200ms` |

### Semantic Aliases (in `theme_defaults.css`)

| Alias | Maps to | Purpose |
|---|---|---|
| `--bg-header` | `var(--nce-color-primary)` | Header background |
| `--text-header` | `#ffffff` | Text on headers |
| `--row-hover-bg` | `var(--nce-color-primary-100)` | Table row hover |
| `--row-selected-bg` | `var(--nce-color-primary-200)` | Table row selected |
| `--column-header-bg` | `var(--nce-color-secondary-200)` | Column header background |
| `--column-header-text` | `var(--nce-color-secondary-800)` | Column header text |

---

## Tailwind Usage (NCE Builder)

The `tailwind.config.js` maps every utility class to theme values. Write normal Tailwind — it automatically resolves to the theme.

### ✅ CORRECT

```vue
<template>
  <div class="bg-surface rounded-lg shadow p-4 border">
    <h2 class="text-heading text-xl font-semibold mb-2">
      Event Details
    </h2>
    <p class="text-base">Body text uses the default color automatically.</p>
    <p class="text-muted text-sm mt-1">Last updated 2 hours ago</p>
    <div class="flex gap-3 mt-4">
      <button class="bg-primary text-white rounded px-4 py-2 text-sm font-medium">
        Save
      </button>
      <button class="border rounded px-4 py-2 text-sm font-medium">
        Cancel
      </button>
    </div>
  </div>
</template>
```

### ❌ WRONG — Hardcoded inline styles

```vue
<template>
  <div style="background: #f9fafb; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="color: #111827; font-size: 20px; font-weight: 600;">Event Details</h2>
    <button style="background: #3b82f6; color: white;">Save</button>
  </div>
</template>
```

Every value ignores theme changes. When the site owner changes colors or spacing, this component stays the same.

### ❌ WRONG — Using Tailwind's built-in palette instead of theme tokens

```vue
<div class="bg-gray-50 text-gray-900 border-gray-200">
  <h2 class="text-gray-800">Title</h2>
  <button class="bg-blue-500 text-white">Action</button>
</div>
```

`gray-50`, `gray-900`, `blue-500` are **static colors NOT connected to the NCE theme**.

### ✅ CORRECT — Theme-mapped equivalents

```vue
<div class="bg-surface text border">
  <h2 class="text-heading">Title</h2>
  <button class="bg-primary text-white">Action</button>
</div>
```

### ⚠️ CRITICAL: No `gray-*` Classes

Tailwind's `gray-100`, `gray-200`, etc. exist because `frappe-ui` uses them but are **NOT theme-aware**. Code using `bg-gray-50` or `text-gray-700` will NOT respond to theme changes.

| Instead of… | Use… |
|---|---|
| `bg-gray-50` | `bg-surface` |
| `bg-white` | `bg` |
| `text-gray-900` | `text-heading` |
| `text-gray-700` | `text` |
| `text-gray-500` | `text-muted` |
| `border-gray-200` | `border` |
| `bg-blue-500` | `bg-primary` |
| `bg-green-500` | `bg-success` or `bg-secondary` |
| `bg-red-500` | `bg-danger` |

---

## Plain CSS Usage (NCE Events)

Use `var(--nce-*)` directly in `<style>` blocks.

### ✅ CORRECT

```vue
<template>
  <div class="event-card">
    <div class="event-card-header">
      <h3 class="event-card-title">Winter Training Program</h3>
      <button class="event-card-close">&times;</button>
    </div>
    <div class="event-card-body">
      <p>Charleston, SC — Jan 23, 2026</p>
      <span class="event-card-badge">Training</span>
    </div>
  </div>
</template>

<style scoped>
.event-card {
  background: var(--nce-color-surface);
  border: 1px solid var(--nce-color-border);
  border-radius: var(--nce-border-radius);
  box-shadow: var(--nce-shadow);
  color: var(--nce-color-text);
}

.event-card-header {
  padding: 8px 12px;
  background: var(--bg-header);
  color: var(--text-header);
}

.event-card-title {
  font-family: var(--nce-font-heading);
  font-size: calc(var(--nce-font-size) * 1.125);
  font-weight: 600;
  margin: 0;
}

.event-card-badge {
  padding: 2px 8px;
  border-radius: calc(var(--nce-border-radius) * 0.5);
  background: var(--nce-color-primary-100);
  color: var(--nce-color-primary-800);
  font-size: calc(var(--nce-font-size) * 0.75);
}
</style>
```

### Using Fallbacks

```css
.my-component {
  background: var(--nce-color-surface, #f9fafb);
  color: var(--nce-color-text, #1f2937);
  border: 1px solid var(--nce-color-border, #e5e7eb);
  border-radius: var(--nce-border-radius, 0.375rem);
}
```

---

## Shade Scale Usage

Brand and status colors have an 11-step shade scale from 50 (lightest) to 950 (darkest).

| Shade range | Use for |
|---|---|
| `50` – `100` | Subtle backgrounds, hover states |
| `200` – `300` | Selected/active backgrounds, light badges |
| `400` – `500` | Base color (buttons, icons, accents) |
| `600` – `700` | Darker borders, active button states |
| `800` – `950` | Text on light tinted backgrounds |

### Examples

```css
.table-row:hover {
  background: var(--nce-color-primary-100);
}

.table-row.selected {
  background: var(--nce-color-primary-200);
}

.badge-primary {
  background: var(--nce-color-primary-100);
  color: var(--nce-color-primary-800);
}

.btn-primary:hover {
  background: var(--nce-color-primary-600);
}

.btn-primary:active {
  background: var(--nce-color-primary-700);
}
```

---

## Adding Semantic Aliases

Define purpose-specific variables in `theme_defaults.css`. **Aliases MUST map to `--nce-*` tokens**, not hardcoded values.

### ✅ CORRECT

```css
:root {
  --bg-header: var(--nce-color-primary);
  --text-header: #ffffff;
  --row-hover-bg: var(--nce-color-primary-100);
  --row-selected-bg: var(--nce-color-primary-200);
}
```

### ❌ WRONG

```css
:root {
  --bg-header: #126bc4;
  --row-hover-bg: #e3f0fc;
}
```

---

## Dynamic Styles in Vue

Use theme variables in `:style` bindings:

### ✅ CORRECT

```vue
<template>
  <div
    class="rounded border"
    :style="{
      backgroundColor: isActive
        ? 'var(--nce-color-primary-100)'
        : 'var(--nce-color-surface)',
      borderColor: isActive ? 'var(--nce-color-primary-400)' : undefined
    }"
  >
    <slot />
  </div>
</template>
```

### ❌ WRONG

```vue
<div :style="{ backgroundColor: isActive ? '#dbeafe' : '#f9fafb' }">
```

---

## `color-mix()` for Derived Colors

Use `color-mix()` instead of hardcoding lighter/darker shades:

```css
/* 15% primary tint for badges */
background: color-mix(in srgb, var(--nce-color-primary) 15%, transparent);

/* 8% success tint for alerts */
background: color-mix(in srgb, var(--nce-color-success) 8%, var(--nce-color-bg, white));
```

---

## Common Mistakes

| Mistake | ❌ Wrong | ✅ Correct |
|---|---|---|
| Hardcoded hex colors | `color: #3b82f6;` | `color: var(--nce-color-primary);` |
| Built-in palette | `bg-blue-500 text-gray-700` | `bg-primary text` |
| Hardcoded font sizes | `font-size: 14px;` | `font-size: var(--nce-font-size);` |
| Hardcoded border-radius | `border-radius: 6px;` | `border-radius: var(--nce-border-radius);` |
| Hardcoded shadows | `box-shadow: 0 1px 3px rgba(0,0,0,0.1);` | `box-shadow: var(--nce-shadow);` |
| Inline styles with hardcoded values | `:style="{ color: '#1f2937' }"` | `:style="{ color: 'var(--nce-color-text)' }"` or use classes |

---

## Hardcoding is Acceptable ONLY In:

1. **Overlays and shadows** — `rgba(0,0,0,0.5)` for modal backdrops
2. **`--text-header: #ffffff`** — white text on brand backgrounds is a design decision
3. **Third-party component overrides** — when CSS variables aren't supported
4. **Decorative elements** — one-off illustration strokes (extremely rare)

Always add a comment explaining WHY.

---

## Checklist Before Submitting

- [ ] Zero hardcoded hex values (search for `#`)
- [ ] Zero hardcoded pixel font sizes
- [ ] Zero hardcoded border-radius values
- [ ] Zero hardcoded box-shadow values
- [ ] All text uses theme tokens (`text`, `text-heading`, `text-muted`, or `var(--nce-color-text)`)
- [ ] All backgrounds use theme tokens (`bg`, `bg-surface`, `bg-primary`, or `var(--nce-color-*)`)
- [ ] All borders use theme tokens (`border` or `var(--nce-color-border)`)
- [ ] No Tailwind built-in colors (`gray-*`, `blue-*`, `red-*`, etc.)
- [ ] Component renders correctly when theme colors are changed

---

## Source Files

| File | Location | Purpose |
|---|---|---|
| `tailwind.config.js` | `NCE Builder/frontend/` | Maps Tailwind utilities → `--nce-*` variables |
| `useThemeDefaults.ts` | `NCE Builder/frontend/src/composables/` | Default values and shade scales |
| `theme-injector.ts` | `NCE Builder/frontend/src/utils/` | Injects `--nce-*` variables at runtime |
| `theme_defaults.css` | `NCE_Events/nce_events/public/css/` | Semantic aliases |
| `index.css` | `NCE Builder/frontend/src/` | Tailwind entry point |



---

## NCE Theme System — Architecture & Rules

# NCE Theme System — Agent Reference

> **If you are styling a Vue component or adding CSS to any NCE app, read this file first.**
> This doc tells you exactly how theming works, what variables to use, and what will break Frappe Desk if you get it wrong.

---

## What This System Does

NCE Builder generates a file called `nce_theme.css` that loads on **every page of the Frappe installation** (Desk, web, SPA — everything). It contains only CSS custom properties prefixed `--nce-*`. Downstream apps (NCE Events, etc.) consume these tokens to theme their components.

The separation is intentional:
- NCE Builder **defines** tokens (`--nce-color-primary`, `--nce-color-muted`, etc.)
- Downstream apps **map** those tokens to their own internal variables, scoped tightly to their own component selectors
- Frappe Desk is **never touched**

---

## The Two Files You Care About

### 1. `nce_theme.css` — loads EVERYWHERE
- Generated at runtime by `NCEThemeSettings.on_update()`
- Loaded via `app_include_css` in `nce_builder/hooks.py`
- Contains **only** `:root { --nce-* }` declarations
- Regenerated when admin saves NCE Theme Settings in Desk
- Does NOT exist in the git repo — it lives on disk at `nce_builder/public/css/nce_theme.css`

### 2. `nce-builder.css` — loads on `/nce/*` SPA pages ONLY
- Built by Vite + Tailwind (`npm run build` in `frontend/`)
- Loaded via `nce_builder/www/nce.html` only
- Contains full Tailwind output including Preflight global resets
- **Never loaded on Frappe Desk pages**

---

## Available `--nce-*` Tokens

These are always available on every page once the theme has been saved:

```css
--nce-color-primary
--nce-color-secondary
--nce-color-accent
--nce-color-success
--nce-color-info
--nce-color-warning
--nce-color-danger
--nce-color-text
--nce-color-heading
--nce-color-muted
--nce-color-link
--nce-color-focus
--nce-color-bg
--nce-color-surface
--nce-color-border
--nce-color-row-alt

/* Shade scales 50–950 for each semantic colour */
--nce-color-primary-50  … --nce-color-primary-950
--nce-color-secondary-50 … --nce-color-secondary-950
--nce-color-accent-50   … --nce-color-accent-950
--nce-color-success-50  … --nce-color-success-950
--nce-color-info-50     … --nce-color-info-950
--nce-color-warning-50  … --nce-color-warning-950
--nce-color-danger-50   … --nce-color-danger-950

/* Typography */
--nce-font-family
--nce-font-heading
--nce-font-size
--nce-font-weight
--nce-line-height

/* Layout */
--nce-border-radius
--nce-spacing-base
--nce-shadow
--nce-shadow-color
--nce-transition-speed
--nce-sidebar-width
--nce-container-max-width
```

Always include a hardcoded fallback: `var(--nce-color-primary, #126bc4)` — the token may not exist if the theme has never been saved.

---

## How to Use Tokens in a Downstream App (e.g. NCE Events)

Map `--nce-*` tokens to your internal variables **inside a component-scoped selector**:

```css
/* CORRECT — scoped to your component root */
.ppv2-root,
.ppv2-float {
  --text-muted:  var(--nce-color-muted, #888888);
  --text-color:  var(--nce-color-text, #333333);
  --primary:     var(--nce-color-primary, #126bc4);
  --border-color: var(--nce-color-border, #d1d5db);
}
```

Then use your internal variables freely inside your components:

```css
.my-component {
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}
```

---

## Tailwind Utilities in the NCE Builder SPA

`frontend/tailwind.config.js` maps Tailwind utility classes to `--nce-*` tokens:

```js
colors: {
  primary:   "var(--nce-color-primary)",
  secondary: "var(--nce-color-secondary)",
  muted:     "var(--nce-color-muted)",
  ...
}
```

So in Vue templates inside the SPA you can write:
```html
<div class="bg-primary text-white">...</div>
<span class="text-muted">...</span>
```

These utilities **only work inside the SPA** (`/nce/*` pages). Do not expect them to work on Desk pages.

---

## ❌ ABSOLUTE NO-NOS

**Violating any of these will break Frappe Desk for all users on all pages.**

### ❌ NO-NO 1: Setting Frappe native variables at `:root`

```css
/* NEVER DO THIS in any file loaded via app_include_css */
:root {
  --text-muted: var(--nce-color-muted);   /* BREAKS ALL DESK TEXT */
  --text-color: var(--nce-color-text);    /* BREAKS ALL DESK TEXT */
  --primary: var(--nce-color-primary);    /* BREAKS ALL DESK BUTTONS */
  --border-color: var(--nce-color-border); /* BREAKS ALL DESK BORDERS */
}
```

Frappe's `desk.bundle.css` uses these variables for body text, buttons, borders, and more. Overriding them at `:root` in any file loaded site-wide will affect every element on every Desk page.

### ❌ NO-NO 2: Adding un-namespaced variables to `nce_theme.css`

```python
# NEVER add this to _generate_css() in nce_theme_settings.py
lines.append(f"\t--text-muted: {muted_color};")   # WRONG
lines.append(f"\t--primary: {primary};")           # WRONG
lines.append(f"\t--text-color: {text_color};")     # WRONG

# CORRECT — always use --nce- prefix
lines.append(f"\t--nce-color-muted: {muted_color};")
lines.append(f"\t--nce-color-primary: {primary};")
```

### ❌ NO-NO 3: Loading `nce-builder.css` site-wide

```python
# NEVER add nce-builder.css to app_include_css in hooks.py
app_include_css = [
  "/assets/nce_builder/css/nce_theme.css",
  "/assets/nce_builder/frontend/assets/nce-builder.css",  # WRONG — Tailwind Preflight bleeds
]
```

Tailwind Preflight in `nce-builder.css` emits global resets like `*, :before, :after { border-color: var(--nce-color-border) }` which will override Frappe Desk element styles.

### ❌ NO-NO 4: Using component-level CSS without a scope selector

```css
/* WRONG — in a CSS file loaded via app_include_css */
--text-muted: var(--nce-color-muted);  /* at :root or bare */

/* CORRECT — always inside your component root class */
.ppv2-root, .ppv2-float {
  --text-muted: var(--nce-color-muted, #888888);
}
```

---

## ⚠️ Common Mistakes

| Mistake | Symptom | Fix |
|---|---|---|
| `:root {` in `theme_defaults.css` | All Desk muted text turns the NCE muted colour | Change selector to `.your-component-root` |
| Stale `nce_theme.css` on server | Theme changes don't appear, or old colours persist | Re-save NCE Theme Settings in Desk to regenerate |
| Browser cache | Correct file on server, wrong colour in browser | Hard refresh: `Cmd/Ctrl + Shift + R` |
| Adding `--text-muted` etc. to `_generate_css()` | Desk text/borders all change colour | Remove — only `--nce-*` vars belong in that function |
| `nce-builder.css` on Desk page | Global border/font resets affect Desk elements | Only load via `nce.html`, never `app_include_css` |
| No fallback in `var()` | Token undefined on fresh install = invisible/broken | Always use `var(--nce-color-primary, #126bc4)` pattern |
| Forgetting to commit CSS fix before deploying | Server pulls old version, bug reappears | Commit local changes before running deploy script |

---

## Real Bug Example: Desk Text Bleed (fixed 2026-03-22)

**What happened**: All Frappe Desk body text turned pink/magenta, then green, across all pages.

**Cause**: `nce_events/public/css/theme_defaults.css` had this:
```css
:root {
  --text-muted: var(--nce-color-muted, #888888);  /* line 15 on server */
}
```
Instead of:
```css
.ppv2-root,
.ppv2-float {
  --text-muted: var(--nce-color-muted, #888888);
}
```

Since NCE Events loads `theme_defaults.css` on every page via `app_include_css`, the `:root` rule overrode Frappe's `--text-muted: var(--gray-700)`. Frappe's own `desk.bundle.css` sets `body { color: var(--text-muted) }` — so all body text inherited the NCE muted colour.

**What made it hard to diagnose**:
- Browser had cached an old magenta value (`#cc00cc`) for `--nce-color-muted` for 12+ hours after the theme was changed to green (`#5b8635`) — the server was already correct but the browser wasn't
- The server file differed from the local repo (local had the fix, server had the old `:root` version — the fix was never committed)
- `nce-builder.css` was innocent — grepping it for `secondary`/`text-muted` returned nothing

**How it was found**:
```bash
grep -rn "\-\-text-muted:" /home/frappe/frappe-bench/apps/ --include="*.css" \
  | grep -v "frappe/frappe/public/dist"
# → nce_events/.../theme_defaults.css:34: --text-muted: var(--nce-color-muted...)
head -40 /home/frappe/frappe-bench/apps/nce_events/.../theme_defaults.css
# → revealed :root { selector on line 15
```

**Fix**: Change `:root {` to `.ppv2-root, .ppv2-float {`. Commit. Push. Deploy.

---

## Deployment Checklist

When deploying theme-related changes:

- [ ] Local CSS changes are **committed and pushed** before running the deploy script
- [ ] After deploying `nce_theme_settings.py` changes — re-save NCE Theme Settings to regenerate the CSS file
- [ ] After deploying `theme_defaults.css` changes — run `bench build --app nce_events` (or the full deploy script)
- [ ] Tell users to hard-refresh if they see stale colours after a theme change

---

## File Reference

| File | App | Purpose |
|---|---|---|
| `nce_builder/hooks.py` | NCE Builder | `app_include_css` — loads `nce_theme.css` site-wide |
| `nce_builder/www/nce.html` | NCE Builder | Loads `nce-builder.css` for SPA only |
| `nce_builder/nce_builder/doctype/nce_theme_settings/nce_theme_settings.py` | NCE Builder | CSS generator, OKLCH shade math |
| `nce_builder/api.py` | NCE Builder | `regenerate_theme_css()` API endpoint |
| `frontend/tailwind.config.js` | NCE Builder | Maps Tailwind utilities to `--nce-*` tokens |
| `nce_events/public/css/theme_defaults.css` | NCE Events | Maps `--nce-*` to panel-internal vars (scoped to `.ppv2-root, .ppv2-float`) |
| `nce_events/hooks.py` | NCE Events | `app_include_css` loads `theme_defaults.css` and `schema_explorer.css` |

