---
title: "Frappe Theming: CSS Systems & Application Points"
merged_from:
  - frappe-css-handoff.md
  - FRAPPE-CSS-RESEARCH.md
  - Frappe Presentation Methods Complete Inventory.md
tokens_approx: 8219
created: 2026-03-23
axes:
  backend: null   # to be scored
  ui: null        # to be scored
  framework: null # to be scored
---

# Frappe Theming: CSS Systems & Application Points

Consolidated reference for all CSS theming in Frappe. Covers CSS variable systems (custom properties, SCSS, LESS), all UI application points where styles are applied, and the complete inventory of presentation methods.

Use this when working on any CSS/styling task that is NOT Vue-component-specific (see theming_vue_tokens.md for that).


---

## CSS Variable Systems

# Frappe CSS Theming - Chat Handoff Document

## Overview

This document contains verified information about Frappe Framework's CSS variable system for theming purposes. Use this to continue development of the NCE Theme system.

---

## Frappe's Three Variable Systems

| System | Syntax | Location | Runtime Changeable |
|--------|--------|----------|-------------------|
| CSS Custom Properties | `--variable-name` | `css_variables.scss` | ✅ Yes |
| SCSS Variables | `$variable-name` | `desk/variables.scss` | ❌ No (compile-time) |
| LESS Variables | `@variable-name` | `variables.less` | ❌ No (legacy) |

---

## Source File Paths

```
frappe/public/scss/common/css_variables.scss   → Main CSS custom properties
frappe/public/scss/desk/variables.scss         → Desk SCSS variables
frappe/public/scss/website/variables.scss      → Website SCSS variables
frappe/public/less/variables.less              → Legacy LESS variables
frappe/public/scss/common/global.scss          → Global styles (checkboxes, etc.)
frappe/public/scss/common/indicator.scss       → Status indicator colors
```

---

## Verified CSS Custom Properties (css_variables.scss)

### Core Variables
```scss
:root,
[data-theme="light"] {
  --brand-color: #0089FF;
  --primary-color: #2490EF;
  --btn-height: 28px;
  --border-radius: 6px;
  --border-radius-lg: 12px;
  --border-radius-full: 999px;
}
```

### Pink Scale (Example of Color Naming)
```scss
--pink-900: #5B1E34;
--pink-800: #702440;
--pink-700: #8C2F53;
--pink-600: #A73966;
--pink-500: #C24478;
--pink-400: #D56D97;
--pink-300: #E496B5;
--pink-200: #F0BFD4;
--pink-100: #FAE8F0;
```

---

## Verified SCSS Variables (desk/variables.scss)

### Gray Scale
```scss
$gray-900: #1F272E;  // Primary text
$gray-800: #313B44;  // Dark text
$gray-700: #505A62;  // Secondary headings
$gray-600: #687178;  // Muted text, labels
$gray-500: #7C868E;  // Placeholder text
$gray-400: #98A1A8;  // Disabled text
$gray-300: #C0C6CC;  // Borders
$gray-200: #EBEEF0;  // Light borders
$gray-100: #F4F5F6;  // Backgrounds (control-bg)
$gray-50:  #F9FAFA;  // Page background

$primary: #2490EF;
$danger:  #E24C4C;
$black:   #000;
$white:   #fff;
```

---

## Verified LESS Variables (variables.less)

### Brand Colors
```less
@brand-primary: #2996F1;
@erpnext-blue: #2996F1;
@brand-gradient: linear-gradient(180deg, #2C9AF1 0%, #2490EF 100%);
@control-bg: #F4F5F6;
@checkbox-color: #3b99fc;
@border-radius: 6px;
```

### Status Label Backgrounds
```less
@label-success-bg: #cef5d6;
@label-info-bg: #e8ddff;
@label-warning-bg: #ffe6bf;
@label-danger-bg: #ffdcdc;
```

### Color Palette (light/standard/dark variants)
```less
// Red
@red-light: #ffc4c4;
@red: #ff5858;
@red-dark: #a83333;

// Yellow
@yellow-light: #fffce7;
@yellow: #ECAD0B;
@yellow-dark: #a58b00;

// Green
@green-light: #cef5d6;
@green: #98D85B;
@green-dark: #48a30f;

// Blue
@blue-light: #d3f8ff;
@blue: #5e64ff;
@blue-dark: #3b69d9;

// Orange
@orange-light: #ffd7bf;
@orange: #f8814f;
@orange-dark: #d45619;

// Purple
@purple-light: #e8ddff;
@purple: #743ee2;
@purple-dark: #5424b8;

// Cyan
@cyan-light: #d4f1ff;
@cyan: #449CF0;
@cyan-dark: #007cc2;

// Pink
@pink-light: #ffd2d2;
@pink: #f095a5;
@pink-dark: #a8586a;

// Darkgrey
@darkgrey-light: #c5c5c5;
@darkgrey: #b1bdca;
@darkgrey-dark: #48515b;
```

### Breakpoints
```less
@screen-xs: 767px;
@screen-sm: 991px;
```

---

## How Frappe Theming Works

1. Frappe adds `data-theme="THEME-NAME"` to the `<html>` element
2. CSS variables defined in `:root` and `[data-theme="light"]` selectors
3. Custom themes override using `[data-theme="your_theme"]` selector

### Theme Override Example
```scss
[data-theme="nce_custom"] {
  --primary-color: #FF5757;
  --brand-color: #FF5757;
  --blue-500: #FF5757;  // Note: name stays "blue" even with red value
}
```

---

## Important: Color Naming Issue

**Frappe uses literal color names, not semantic names.**

The variable `--pink-500` is always called "pink" regardless of what hex value you assign:

```scss
--pink-500: #00FF00;  // Still called "pink" even though it's green
```

### Implication for NCE Theme

Your theme compiler needs to:
1. Accept semantic tokens (primary, accent, success, etc.)
2. Map them to Frappe's literal color-named variables
3. Generate CSS that overrides Frappe's names with your values

---

## Creating a Custom Theme App

### 1. Create hooks.py entry
```python
app_include_css = "your_theme.bundle.css"
web_include_css = "your_theme.bundle.css"
```

### 2. Create CSS override file
```scss
[data-theme="your_theme"] {
  --primary-color: #YOUR_COLOR;
  // ... other overrides
}
```

### 3. Build assets
```bash
bench build --app your_app
```

---

## Existing Theme Apps (Reference)

- `github.com/Suvaidyam/frappe_theme` - UI configuration via DocType
- `github.com/tahir-zaqout/sundae_theme` - Multiple color scheme options
- `github.com/Midocean-Technologies/business_theme_v14` - Business theme

---

## Key Variables for NCE Theme Mapping

| Purpose | Frappe Variable | Default |
|---------|-----------------|---------|
| Primary actions | `--primary-color` | #2490EF |
| Brand identity | `--brand-color` | #0089FF |
| Primary text | `$gray-900` | #1F272E |
| Muted text | `$gray-600` | #687178 |
| Backgrounds | `$gray-100` / `--control-bg` | #F4F5F6 |
| Page background | `$gray-50` | #F9FAFA |
| Borders | `$gray-300` | #C0C6CC |
| Danger/Error | `$danger` | #E24C4C |
| Success bg | `@label-success-bg` | #cef5d6 |
| Warning bg | `@label-warning-bg` | #ffe6bf |
| Info bg | `@label-info-bg` | #e8ddff |
| Button height | `--btn-height` | 28px |
| Border radius | `--border-radius` | 6px |

---

## Notes

- Frappe v15 changed default colors from blue to more neutral/black tones
- CSS Custom Properties (`--var`) can be changed at runtime via JavaScript
- SCSS/LESS variables require rebuild (`bench build`)
- The `frappe_theme` app by Suvaidyam provides a DocType-based UI for theme configuration

---

*Document created: January 2026*
*Source: Frappe Framework GitHub repository analysis*



---

## CSS Application Points Deep Dive

# Frappe CSS Research: Application Points Deep Dive

**Research Date:** January 10, 2026  
**Purpose:** Document Frappe UI elements for NCE Design System integration

---

## Executive Summary

Frappe uses a **hybrid CSS system**:
- Bootstrap 4 base classes (buttons, modals, grid)
- Custom CSS variables for theming
- Component-specific selectors (`.frappe-control`, `.indicator`, etc.)
- Tailwind CSS in newer versions (v16+) and Frappe UI

**Key Finding:** Frappe's theming is fragmented across multiple systems. Your NCE Design System can unify this.

---

## Application Point 1: Form View

### CSS Selectors & Classes

| Element | Selector | Style Properties |
|---------|----------|------------------|
| Form wrapper | `.frappe-control` | Container for each field |
| Field label | `.control-label` | Typography, color |
| Field input | `.control-input` | Border, background, focus |
| Required indicator | `.reqd` | Color (typically red asterisk) |
| Section break | `.section-break` | Background, border, padding |
| Column break | `.column-break` | Gap/gutter spacing |
| Tab break | `.form-tabs` | Active/inactive states |
| Read-only field | `.like-disabled-input` | Background, text color |
| HTML field | `.html-field` | Full CSS control |

### NCE Style Specs Needed

```json
"form": {
  "fieldLabel": { "color": "neutral-700", "fontWeight": 500 },
  "fieldInput": { 
    "background": "white",
    "border": "neutral-300",
    "focusBorder": "primary-500",
    "focusRing": "primary-100"
  },
  "requiredIndicator": { "color": "error-600" },
  "sectionHeader": { 
    "background": "neutral-50",
    "border": "neutral-200",
    "textColor": "neutral-800"
  },
  "readOnlyField": { "background": "neutral-50", "textColor": "neutral-600" }
}
```

---

## Application Point 2: List View

### CSS Selectors & Classes

| Element | Selector | Style Properties |
|---------|----------|------------------|
| List container | `.frappe-list` | Container styling |
| Header row | `.list-row-head` | Background, typography |
| Data row | `.list-row` | Background, hover, borders |
| Row hover | `.list-row:hover` | Background change |
| Selected row | `.list-row.selected` | Background highlight |
| Checkbox column | `.list-row-checkbox` | Checkbox styling |
| Action buttons | `.list-actions` | Button group styling |

### List View JavaScript API

```javascript
frappe.listview_settings['DocType'] = {
  get_indicator: function(doc) {
    // Returns: [label, color, filter]
    return ["Draft", "orange", "status,=,Draft"];
  },
  formatters: {
    fieldname: function(val) {
      return `<span class="custom-class">${val}</span>`;
    }
  }
};
```

### NCE Style Specs Needed

```json
"list": {
  "headerBackground": "neutral-100",
  "headerText": "neutral-700",
  "rowBackground": "white",
  "rowAlternate": "neutral-50",
  "rowHover": "primary-50",
  "rowSelected": "primary-100",
  "rowBorder": "neutral-200"
}
```

---

## Application Point 3: Status Indicators

### Frappe's Built-in Indicator Colors

| Color Name | CSS Class | Hex Value | Typical Use |
|------------|-----------|-----------|-------------|
| `blue` | `.indicator.blue` | `#5e64ff` | Draft, In Progress |
| `green` | `.indicator.green` | `#98d85b` | Submitted, Active, Paid |
| `red` | `.indicator.red` | `#ff5858` | Cancelled, Failed, Overdue |
| `orange` | `.indicator.orange` | `#ffa00a` | Pending, On Hold |
| `purple` | `.indicator.purple` | `#743ee2` | Custom status |
| `darkgrey` | `.indicator.darkgrey` | `#b8c2cc` | Disabled, Closed |
| `yellow` | `.indicator.yellow` | (varies) | Warning states |
| `light-blue` | `.indicator.light-blue` | (varies) | Info states |

### DocStatus Mapping

| docstatus | Label | Recommended Color |
|-----------|-------|-------------------|
| 0 | Draft | `orange` or `blue` |
| 1 | Submitted | `green` |
| 2 | Cancelled | `red` |

### NCE Style Specs Needed

```json
"indicators": {
  "draft": { "background": "warning-100", "text": "warning-800", "dot": "warning-500" },
  "submitted": { "background": "success-100", "text": "success-800", "dot": "success-500" },
  "cancelled": { "background": "error-100", "text": "error-800", "dot": "error-500" },
  "pending": { "background": "warning-100", "text": "warning-700", "dot": "warning-400" },
  "active": { "background": "success-100", "text": "success-700", "dot": "success-500" },
  "info": { "background": "primary-100", "text": "primary-700", "dot": "primary-500" }
}
```

---

## Application Point 4: Buttons

### Frappe/Bootstrap Button Classes

| Class | Use Case | Default Color |
|-------|----------|---------------|
| `.btn-primary` | Primary action | Blue |
| `.btn-secondary` | Secondary action | Gray |
| `.btn-default` | Standard button | Light gray |
| `.btn-danger` | Destructive action | Red |
| `.btn-success` | Positive action | Green |
| `.btn-warning` | Caution action | Yellow/Orange |
| `.btn-lg` | Large button | Size modifier |
| `.btn-sm` | Small button | Size modifier |
| `.btn-xs` | Extra small | Size modifier |

### NCE Style Specs Needed

```json
"buttons": {
  "primary": {
    "background": "primary-600",
    "text": "white",
    "hoverBackground": "primary-700",
    "activeBackground": "primary-800"
  },
  "secondary": {
    "background": "primary-100",
    "text": "primary-700",
    "hoverBackground": "primary-200"
  },
  "default": {
    "background": "neutral-100",
    "text": "neutral-700",
    "border": "neutral-300",
    "hoverBackground": "neutral-200"
  },
  "danger": {
    "background": "error-600",
    "text": "white",
    "hoverBackground": "error-700"
  },
  "success": {
    "background": "success-600",
    "text": "white",
    "hoverBackground": "success-700"
  }
}
```

---

## Application Point 5: Dialogs & Modals

### CSS Selectors & Classes

| Element | Selector | Style Properties |
|---------|----------|------------------|
| Modal overlay | `.modal-backdrop` | Background opacity |
| Modal dialog | `.modal-dialog` | Width, positioning |
| Modal content | `.modal-content` | Background, border, shadow |
| Modal header | `.modal-header` | Background, border-bottom |
| Modal title | `.modal-title` | Typography |
| Modal body | `.modal-body` | Padding, content |
| Modal footer | `.modal-footer` | Background, button alignment |
| Close button | `.close` | Icon styling |

### NCE Style Specs Needed

```json
"modals": {
  "overlay": { "background": "rgba(0,0,0,0.5)" },
  "container": {
    "background": "white",
    "borderRadius": "8px",
    "shadow": "0 10px 40px rgba(0,0,0,0.2)"
  },
  "header": {
    "background": "neutral-50",
    "borderBottom": "neutral-200",
    "textColor": "neutral-900"
  },
  "body": { "textColor": "neutral-700" },
  "footer": { "background": "neutral-50", "borderTop": "neutral-200" }
}
```

---

## Application Point 6: Navigation (Navbar, Sidebar, Awesomebar)

### CSS Selectors & Classes

| Element | Selector | Style Properties |
|---------|----------|------------------|
| Navbar | `.navbar` | Background, height |
| Navbar brand | `.navbar-brand` | Logo area |
| Sidebar | `.desk-sidebar` | Background, width |
| Sidebar item | `.sidebar-item` | Text, hover, active |
| Active sidebar item | `.sidebar-item.active` | Background, text |
| Awesomebar | `.awesomplete` | Search input styling |
| Awesomebar results | `.awesomplete > ul` | Dropdown styling |
| Breadcrumbs | `.breadcrumb` | Navigation path |

### NCE Style Specs Needed

```json
"navigation": {
  "navbar": {
    "background": "neutral-900",
    "text": "white",
    "iconColor": "neutral-400"
  },
  "sidebar": {
    "background": "neutral-50",
    "itemText": "neutral-700",
    "itemHover": "primary-50",
    "itemActive": "primary-100",
    "itemActiveText": "primary-700",
    "moduleIcon": "primary-500"
  },
  "awesomebar": {
    "background": "white",
    "border": "neutral-300",
    "focusBorder": "primary-500",
    "resultsBackground": "white",
    "resultHover": "primary-50"
  },
  "breadcrumb": {
    "text": "neutral-500",
    "linkText": "primary-600",
    "separator": "neutral-400"
  }
}
```

---

## Application Point 7: Workspace Components

### CSS Selectors & Classes

| Element | Selector | Style Properties |
|---------|----------|------------------|
| Workspace container | `.workspace` | Layout |
| Shortcut card | `.workspace .shortcut` | Background, text |
| Shortcut count | `.shortcut-count` | Badge styling |
| Link card | `.widget` | Card container |
| Number card | `.number-card` | KPI display |
| Quick list | `.quick-list` | Recent items |

### NCE Style Specs Needed

```json
"workspace": {
  "shortcutCard": {
    "background": "white",
    "border": "neutral-200",
    "hoverBorder": "primary-300",
    "text": "neutral-800",
    "countBadge": {
      "background": "primary-100",
      "text": "primary-700"
    }
  },
  "numberCard": {
    "background": "white",
    "valueColor": "neutral-900",
    "labelColor": "neutral-600",
    "trendPositive": "success-600",
    "trendNegative": "error-600"
  },
  "linkCard": {
    "background": "white",
    "headerBackground": "neutral-50",
    "headerText": "neutral-800",
    "linkText": "primary-600",
    "linkHover": "primary-700"
  }
}
```

---

## Application Point 8: Child Tables (Grids)

### CSS Selectors & Classes

| Element | Selector | Style Properties |
|---------|----------|------------------|
| Grid container | `.frappe-control[data-fieldtype="Table"]` | Container |
| Grid header | `.grid-heading-row` | Header row |
| Grid row | `.grid-row` | Data row |
| Grid row edited | `.grid-row.edited` | Modified indicator |
| Add row button | `.grid-add-row` | Button styling |
| Remove row | `.grid-delete-row` | Delete icon |

### NCE Style Specs Needed

```json
"childTable": {
  "headerBackground": "neutral-100",
  "headerText": "neutral-700",
  "rowBackground": "white",
  "rowAlternate": "neutral-50",
  "rowEdited": "warning-50",
  "rowBorder": "neutral-200",
  "addButton": {
    "background": "primary-50",
    "text": "primary-600",
    "hoverBackground": "primary-100"
  }
}
```

---

## Application Point 9: Reports

### Report Types & Styling

| Type | Customization Method |
|------|---------------------|
| Query Report | `formatter` function in JS |
| Script Report | Full HTML/CSS control |
| Report Builder | Limited via CSS overrides |

### CSS Selectors

| Element | Selector | Style Properties |
|---------|----------|------------------|
| Report table | `.report-table` | Table styling |
| Report header | `.report-table th` | Header cells |
| Report cell | `.report-table td` | Data cells |
| Total row | `.report-table .total-row` | Summary row |

### NCE Style Specs Needed

```json
"reports": {
  "table": {
    "headerBackground": "neutral-100",
    "headerText": "neutral-800",
    "cellBackground": "white",
    "cellText": "neutral-700",
    "cellBorder": "neutral-200",
    "totalRowBackground": "neutral-100",
    "totalRowText": "neutral-900",
    "totalRowFontWeight": 600
  },
  "chart": {
    "colors": ["primary-500", "primary-300", "primary-700", "neutral-400"]
  }
}
```

---

## Application Point 10: Print Formats

### Styling Methods

1. **Print Format Builder** - Drag-drop, limited styling
2. **Custom CSS field** - Per-format CSS
3. **Print Style DocType** - Global print CSS

### Key CSS Considerations

| Element | Selector | Notes |
|---------|----------|-------|
| Print container | `@media print` | Print-specific rules |
| Header | `.print-heading` | Document title |
| Body | `.print-format` | Main content |
| Table | `.print-table` | Item tables |
| Footer | `.print-footer` | Page footer |

### NCE Style Specs Needed

```json
"print": {
  "pageBackground": "white",
  "textColor": "neutral-900",
  "heading": {
    "color": "primary-700",
    "fontWeight": 700
  },
  "table": {
    "headerBackground": "neutral-100",
    "headerText": "neutral-800",
    "cellBorder": "neutral-300",
    "alternateRow": "neutral-50"
  },
  "footer": {
    "textColor": "neutral-500",
    "borderTop": "neutral-300"
  }
}
```

---

## Application Point 11: Web Pages & Portal

### CSS Variables (Website Theme)

Frappe uses SCSS/Bootstrap variables for website theming:

```scss
$primary: #your-color;
$spacer: 1rem;
// Bootstrap 4 variables
```

### CSS Selectors

| Element | Selector | Style Properties |
|---------|----------|------------------|
| Web form header | `.web-form-header` | Header styling |
| Web form body | `.web-form` | Form container |
| Portal navbar | `.web-navbar` | Navigation |
| Portal card | `.card` | Content cards |
| Portal button | `.btn` | Bootstrap buttons |

### NCE Style Specs Needed

```json
"webPortal": {
  "pageBackground": "neutral-50",
  "cardBackground": "white",
  "cardBorder": "neutral-200",
  "navbarBackground": "primary-700",
  "navbarText": "white",
  "formHeader": {
    "background": "primary-50",
    "border": "primary-200",
    "textColor": "primary-800"
  }
}
```

---

## Application Point 12: Specialized Views (Kanban, Calendar, Gantt)

### Kanban Board

| Element | Selector | Style Properties |
|---------|----------|------------------|
| Kanban container | `.kanban-board` | Container |
| Kanban column | `.kanban-column` | Column styling |
| Kanban card | `.kanban-card` | Card styling |
| Column header | `.kanban-column-header` | Header |

### Calendar View

Configured via `{doctype}_calendar.js`:

```javascript
frappe.views.calendar['DocType'] = {
  style_map: {
    'Public': 'success',
    'Private': 'info'
  }
};
```

### Gantt Chart (CSS Variables)

```css
:root {
  --g-bar-color: var(--primary-500);
  --g-bar-border: var(--primary-600);
  --g-progress-color: var(--primary-700);
  --g-header-background: var(--neutral-100);
  --g-row-color: var(--neutral-50);
  --g-today-highlight: var(--primary-100);
}
```

### NCE Style Specs Needed

```json
"specializedViews": {
  "kanban": {
    "columnBackground": "neutral-50",
    "columnHeader": "neutral-700",
    "cardBackground": "white",
    "cardBorder": "neutral-200",
    "cardDragging": "primary-50"
  },
  "calendar": {
    "todayBackground": "primary-50",
    "eventDefault": "primary-500",
    "eventSuccess": "success-500",
    "eventWarning": "warning-500",
    "eventDanger": "error-500"
  },
  "gantt": {
    "barColor": "primary-500",
    "barBorder": "primary-600",
    "progressColor": "primary-700",
    "headerBackground": "neutral-100",
    "rowColor": "neutral-50",
    "todayHighlight": "primary-100"
  }
}
```

---

## Frappe's Core CSS Variables

Based on research, Frappe uses these core variables (varies by version):

```css
:root {
  --primary: #5e64ff;
  --primary-light: /* computed */;
  --bg-color: #f5f5f6;
  --fg-color: #ffffff;
  --text-color: #1f272e;
  --text-muted: #687178;
  --text-light: #b0bac0;
  --border-color: #d1d8dd;
  --dark-border-color: #8d99a6;
  --control-bg: #f7fafc;
  --control-bg-on-gray: #ffffff;
  --awesomplete-hover-bg: #f0f4f7;
  --btn-default-bg: #f7fafc;
}
```

---

## JSON Organization Options

### Option A: Grouped by Application Point

```json
{
  "frappe": {
    "form": { ... },
    "list": { ... },
    "indicators": { ... },
    "buttons": { ... },
    "modals": { ... },
    "navigation": { ... },
    "workspace": { ... },
    "childTable": { ... },
    "reports": { ... },
    "print": { ... },
    "webPortal": { ... },
    "specializedViews": { ... }
  }
}
```

**Pros:** Logical grouping, easy for AI to find "how to style a form"
**Cons:** Styles scattered across sections

### Option B: Attached to Style Tokens

```json
{
  "primary-500": {
    "$value": "hsl(210, 83%, 60%)",
    "frappeUsage": ["btn-primary", "focus-ring", "kanban-bar", "link-text"]
  }
}
```

**Pros:** Clear token-to-element mapping
**Cons:** Harder to understand full component styling

### Option C: Hybrid (Recommended)

```json
{
  "tokens": { /* W3C Design Tokens */ },
  "frappeMapping": {
    "applicationPoints": {
      "form": { ... },
      "list": { ... }
    },
    "cssOverrides": {
      /* Ready-to-use CSS variable mappings */
    },
    "agentInstructions": {
      /* Per-application-point guidance */
    }
  }
}
```

**Pros:** Best of both worlds - tokens stay clean, Frappe specifics are additive
**Cons:** Larger file size

---

## Next Steps Discussion Points

1. **Which JSON structure** works best for your AI agent workflow?
2. **Priority order** - which Application Points matter most?
3. **CSS file generation** - should export also produce ready-to-use `.css` files?
4. **Version targeting** - Frappe v14/v15/v16+ differences?
5. **ERPNext specifics** - any ERPNext-only components to include?

---

*Research compiled from Frappe documentation, GitHub repos, and community resources.*



---

## Presentation Methods Inventory

Here's a comprehensive inventory of **Frappe Presentation Methods** where your NCE theme could be applied:

------

## Frappe Presentation Methods: Complete Inventory

### 1. **Desk (Admin Interface) - Core Views**

| View Type          | Description                    | Theme Application Points                                     |
| ------------------ | ------------------------------ | ------------------------------------------------------------ |
| **Form View**      | Individual document editing    | Field labels, inputs, buttons, sections, tabs, sidebar       |
| **List View**      | Tabular display of documents   | Row backgrounds, headers, filters, action buttons, selection states |
| **Report Builder** | Custom tabular reports         | Grid styling, headers, aggregation rows, export buttons      |
| **Tree View**      | Hierarchical data display      | Node styling, expand/collapse, indentation                   |
| **Calendar View**  | Date-based document display    | Event cards, day/week/month grid, navigation                 |
| **Kanban View**    | Card-based workflow boards     | Column headers, cards, drag states, status colors            |
| **Gantt View**     | Timeline/project visualization | Bars, dependencies, milestones, timeline grid                |
| **Image View**     | Gallery-style document listing | Thumbnails, hover states, selection                          |

### 2. **Workspaces** (As shown in your screenshots)

| Component              | Description                                    | Theme Application Points                          |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------- |
| **Shortcut Blocks**    | Quick navigation links with counts             | Background, text, count badges, hover states      |
| **Link Cards**         | Grouped navigation (e.g., "Reports & Masters") | Card background, headers, link styling            |
| **Number Cards**       | KPI/metric displays                            | Value typography, label styling, trend indicators |
| **Chart Blocks**       | Embedded visualizations                        | Chart colors, axes, legends, tooltips             |
| **Quick List Blocks**  | Recent records display                         | Row styling, timestamps, action buttons           |
| **Onboarding Blocks**  | Step-by-step guides (as in Website screenshot) | Progress indicators, step styling, video buttons  |
| **Heading Blocks**     | Section headers                                | Typography, dividers                              |
| **Spacer Blocks**      | Layout spacing                                 | N/A (structural)                                  |
| **Custom HTML Blocks** | Arbitrary content                              | Full theme CSS access                             |

### 3. **Dashboards**

| Component           | Description                | Theme Application Points        |
| ------------------- | -------------------------- | ------------------------------- |
| **Dashboard**       | Container for charts/cards | Background, grid layout         |
| **Dashboard Chart** | Individual chart widgets   | Chart colors, titles, legends   |
| **Number Card**     | Single metric display      | Value color, background, trends |

### 4. **Reports**

| Report Type        | Description               | Theme Application Points            |
| ------------------ | ------------------------- | ----------------------------------- |
| **Query Report**   | SQL-based reports         | Table styling, headers, totals row  |
| **Script Report**  | Python-generated reports  | Full HTML/CSS control, chart colors |
| **Report Builder** | User-configurable reports | Grid styling, filters, grouping     |

### 5. **Print Formats**

| Component                | Description                         | Theme Application Points               |
| ------------------------ | ----------------------------------- | -------------------------------------- |
| **Print Format Builder** | Drag-drop print design              | Field styling, section breaks, headers |
| **Custom Print Format**  | HTML/Jinja templates                | Full CSS control, typography, colors   |
| **Print Designer**       | Visual print format tool            | Element styling, tables, dynamic data  |
| **Letter Head**          | Header/footer templates             | Logo placement, borders, typography    |
| **Print Style**          | CSS presets (Modern, Classic, etc.) | Base styling for all prints            |

### 6. **Web Pages (Public-facing)**

| Component         | Description                  | Theme Application Points                |
| ----------------- | ---------------------------- | --------------------------------------- |
| **Web Page**      | Static/dynamic content pages | Full CSS per page, sections             |
| **Web Form**      | Public data entry forms      | Form fields, buttons, validation states |
| **Web Template**  | Reusable page sections       | Section styling, responsive layouts     |
| **Website Theme** | Site-wide styling (SCSS)     | Colors, fonts, Bootstrap overrides      |
| **Blog Post**     | Article pages                | Typography, images, metadata            |
| **Portal Pages**  | User self-service pages      | Navigation, cards, tables               |

### 7. **Form Components (Detail)**

| Component                     | Description               | Theme Application Points                       |
| ----------------------------- | ------------------------- | ---------------------------------------------- |
| **Section Break**             | Collapsible form sections | Header styling, collapse icons, borders        |
| **Column Break**              | Multi-column layouts      | Gap/gutter styling                             |
| **Tab Break**                 | Form tabs                 | Active/inactive states, borders                |
| **Field Types**               | 40+ input types           | Input borders, focus states, labels, help text |
| **Child Table (Table field)** | Embedded grids            | Row styling, add/delete buttons, headers       |
| **HTML Field**                | Custom HTML in forms      | Full CSS control                               |
| **Attach/Image fields**       | File upload areas         | Drop zone styling, preview styling             |

### 8. **Dialogs & Modals**

| Component               | Description          | Theme Application Points         |
| ----------------------- | -------------------- | -------------------------------- |
| **Dialog**              | Modal windows        | Header, body, footer, overlay    |
| **Message Dialog**      | Alerts/confirmations | Icon colors, button styles       |
| **Prompt Dialog**       | Input requests       | Field styling within modal       |
| **Multi-select Dialog** | List selection       | Checkbox styling, search field   |
| **Link Selector**       | Document picker      | Search results, selection states |

### 9. **Navigation & Chrome**

| Component        | Description          | Theme Application Points            |
| ---------------- | -------------------- | ----------------------------------- |
| **Navbar**       | Top navigation bar   | Background, brand area, icons       |
| **Sidebar**      | Left navigation tree | Module colors, active states, icons |
| **Awesomebar**   | Search/command bar   | Input styling, results dropdown     |
| **Breadcrumbs**  | Navigation path      | Link styling, separators            |
| **Page Actions** | Action button area   | Primary/secondary button styling    |

### 10. **Scripting & Custom UI**

| Component                    | Description                 | Theme Application Points     |
| ---------------------------- | --------------------------- | ---------------------------- |
| **Client Script**            | Form-level JS customization | Can inject CSS, modify DOM   |
| **Server Script**            | Server-side logic           | N/A (backend)                |
| **Page (Custom Page)**       | Fully custom desk pages     | Complete HTML/CSS/JS control |
| **Custom HTML in Workspace** | Embedded widgets            | Full theme CSS access        |

------

## Theme Application Methods in Frappe

### Method 1: **CSS Variables via Custom App**

```css
/* Target the data-theme attribute */
[data-theme="nce-theme"] {
    --primary: hsl(210, 75%, 50%);
    --primary-light: hsl(210, 75%, 90%);
    --bg-color: hsl(210, 10%, 98%);
    /* ... */
}
```

### Method 2: **hooks.py CSS Injection**

```python
# hooks.py
app_include_css = "/assets/myapp/css/nce-theme.css"
web_include_css = "/assets/myapp/css/nce-theme.css"
```

### Method 3: **Website Theme DocType**

- Custom SCSS overrides
- Bootstrap variable overrides
- Custom JavaScript

### Method 4: **Print Style CSS**

- Per-print-format styling
- Global print CSS

------

## Recommended NCE Theme Extensions for Frappe

Based on your current theme structure and Frappe's needs, I recommend adding these sections:

```json
{
  "frappe": {
    "desk": {
      "form": {
        "sectionHeader": { "background": "neutral-100", "border": "neutral-200" },
        "fieldLabel": { "color": "neutral-700", "weight": 500 },
        "requiredIndicator": { "color": "error-600" },
        "readOnlyField": { "background": "neutral-50" }
      },
      "list": {
        "headerBackground": "neutral-100",
        "rowHover": "primary-50",
        "rowAlternate": "neutral-50",
        "selectedRow": "primary-100"
      },
      "sidebar": {
        "background": "neutral-50",
        "activeItem": "primary-100",
        "moduleIcon": "primary-500"
      }
    },
    "status": {
      "draft": { "background": "neutral-200", "text": "neutral-700" },
      "submitted": { "background": "primary-100", "text": "primary-800" },
      "cancelled": { "background": "error-100", "text": "error-700" }
    },
    "docstatus": {
      "0": "warning",
      "1": "success", 
      "2": "error"
    }
  }
}
```

