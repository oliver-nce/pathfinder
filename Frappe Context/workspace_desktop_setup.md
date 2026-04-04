---
title: "Frappe Workspaces, Desktop Icons & App Routing"
merged_from:
  - frappe-custom-app-design.md
  - frappe-v16-workspace-guide.md
  - frappe-desktop-icons-guide.md
tokens_approx: 11198
created: 2026-03-23
axes:
  backend: null   # to be scored
  ui: null        # to be scored
  framework: null # to be scored
---

# Frappe Workspaces, Desktop Icons & App Routing

Everything needed to set up a custom app's presence in Frappe Desk. Covers desktop icon creation (v16+), workspace configuration, sidebar setup, and app-switcher routing patterns.

Includes troubleshooting, the single-word workspace name rule, and the CDN cache-busting warning.


---

## App Routing & Workspace Naming Rules

# Designing Custom Frappe Apps: App Switcher & Routing

## The Problem

Frappe's `get_route()` function in `frappe/apps.py` validates your `add_to_apps_screen` route against workspace names before allowing navigation. If validation fails, it falls back to the first sidebar workspace (usually "Admin").

There are two bugs in `get_route()`:

1. **First check** compares `workspace_name.lower()` (spaces preserved) with the URL slug (hyphens). Multi-word names like "NCE Tables" → `"nce tables"` never matches the slug `"nce-tables"`.
2. **Module fallback** uses `.lower()` instead of `frappe.scrub()`, so `"NCE Sync".lower()` → `"nce sync"` never matches the module_app key `"nce_sync"`.

Both checks fail for multi-word names, and the user lands on "Admin" instead of the app.

---

## Rule 1: Use Single-Word Workspace Names

The only reliable way to pass `get_route()` validation is to ensure `workspace_name.lower() == url_slug`. This only works when the name has no spaces.

| Workspace Name | `.lower()`    | URL Slug      | Match? |
|----------------|---------------|---------------|--------|
| Themes         | themes        | themes        | Yes    |
| Tables         | tables        | tables        | Yes    |
| NCE Tables     | nce tables    | nce-tables    | No     |
| Theme Editor   | theme editor  | theme-editor  | No     |

**Always use single-word workspace names.**

---

## Rule 2: Route Must Match Workspace Name

In `hooks.py`, the `add_to_apps_screen` route must point to `/app/{workspace_slug}`:

```python
# hooks.py
add_to_apps_screen = [
    {
        "name": "my_app",
        "logo": "/assets/my_app/logo.png",
        "title": "My App",           # Display name on tile (can be anything)
        "route": "/app/tables",       # Must match workspace slug exactly
    }
]
```

The workspace JSON must have a matching single-word name:

```json
{
    "name": "Tables",
    "label": "Tables",
    "title": "Tables",
    "module": "My Module",
    "public": 1
}
```

---

## Pattern A: App Tile Opens Workspace Directly

Use this when your workspace IS the app content (e.g., a collection of DocType shortcuts).

**Example: NCE Tables**

```
Tile click → /app/tables → "Tables" workspace (shows DocType shortcuts)
```

Files needed:
- `hooks.py` with `add_to_apps_screen` route `/app/tables`
- Workspace JSON with `"name": "Tables"`

No JS redirect needed.

---

## Pattern B: App Tile Opens a Custom Page (Bypassing Workspace)

Use this when your app has a custom Page and the workspace is just a sidebar entry.

**Example: Theme Editor**

```
Tile click → /app/themes → JS redirect → /app/theme-editor (Page)
Sidebar click → /app/themes → JS redirect → /app/theme-editor (Page)
```

The workspace exists only to satisfy `get_route()` validation and provide a sidebar entry. A small JS file intercepts navigation to the workspace and redirects to the actual Page.

### Step 1: Workspace with single-word name

```json
{
    "name": "Themes",
    "label": "Themes",
    "title": "Themes",
    "module": "My Module",
    "public": 1,
    "shortcuts": [
        {
            "label": "Theme Editor",
            "link_to": "theme-editor",
            "type": "Page"
        }
    ]
}
```

### Step 2: Route points to workspace

```python
# hooks.py
add_to_apps_screen = [
    {
        "name": "frappe_theme_editor",
        "logo": "/assets/frappe_theme_editor/logo.png",
        "title": "Theme Editor",
        "route": "/app/themes",
    }
]

app_include_js = "/assets/frappe_theme_editor/js/redirect.js"
```

### Step 3: JS redirect (loaded on every desk page via app_include_js)

```javascript
// public/js/redirect.js
$(document).on('page-change', function() {
    var route = frappe.get_route_str();
    if (route === 'Workspaces/Themes') {
        frappe.set_route('theme-editor');
    }
});
```

### Important: Page name must NOT conflict with workspace slug

If your Page is named `theme-editor`, your workspace must NOT slug to `theme-editor`. Frappe's router prefers workspaces over pages for the same slug. That's why we use "Themes" (slug: `themes`) for the workspace and `theme-editor` for the page.

---

## CloudFlare / CDN Warning

Frappe does NOT add cache-busting version parameters to `app_include_js` files (only `.bundle.` files get hashed filenames). If your site is behind CloudFlare or any CDN with proxying enabled:

- Static JS/CSS files at `/assets/app_name/...` will be cached aggressively
- After deploying changes to these files, you MUST purge the CDN cache
- Alternatively, turn off proxying (orange cloud → grey cloud) for the subdomain during development

---

## Checklist for New Custom Apps

- [ ] Workspace name is a single word (no spaces)
- [ ] `add_to_apps_screen` route matches `/app/{workspace_name_lowercase}`
- [ ] If using a custom Page, page name does NOT match workspace slug
- [ ] If using a custom Page, JS redirect is in `app_include_js`
- [ ] After deployment, CDN cache is purged if applicable



---

## v16 Workspace & Desktop Setup Guide

# Frappe v16: Custom App Workspace & Desktop Setup Guide

## What Changed in v16

Frappe v16 completely redesigned the Desk UI. The key differences from v15:

- **Desktop Icons** are now a separate DocType — they control what appears on the main Desk landing page
- **Workspace Sidebar** is a new DocType — it defines the sidebar navigation within an app
- **Workspaces** still exist but now open with a sidebar and keep related items grouped
- The **app switcher** in the sidebar lets users switch between apps
- The `add_to_apps_screen` hook in `hooks.py` is how apps register themselves on the main app screen
- `bench create-desktop-icons-and-sidebar` is a new command to generate these from hooks

**Documentation for v16 is still incomplete/being written** — this is acknowledged by the community. Much of what follows comes from community trial-and-error.

---

## How the Three Pieces Fit Together

In v16, getting your app to appear on the Desk requires three DocTypes working together:

```
Desktop Icon (App type)         ← The icon/folder on the Desk home screen
  └── Desktop Icon (Link type)  ← Child icon pointing to a sidebar
        └── Workspace Sidebar   ← The left sidebar nav when your app is selected
              └── Workspace     ← The actual page content users see
```

You need all four layers for a fully working custom app on the Desk.

---

## Step-by-Step Setup

### Step 1: Confirm App Structure and Installation

From your bench directory, verify:

```bash
# App is installed on the site
bench --site your-site list-apps

# modules.txt has your module listed
cat apps/your_app/your_app/modules.txt

# hooks.py has the required metadata
cat apps/your_app/your_app/hooks.py
```

**`hooks.py` must have at minimum:**

```python
app_name = "your_app"
app_title = "Your App Title"
app_publisher = "Your Company"
app_description = "Description"
app_email = "you@example.com"
app_license = "MIT"
```

**`modules.txt` must list your module(s), one per line:**

```
Your Module Name
```

### Step 2: Confirm Module Def Exists

Navigate to `/app/module-def` in the browser. Your module must be listed there, with the correct `app_name` field set to your app.

If missing, enable developer mode and create it:

```bash
bench set-config developer_mode 1
```

Then go to Desk → Build → Module Def → New, and create it with your module name linked to your app.

### Step 3: Ensure At Least One DocType Exists in the Module

This is critical. **A module is invisible to non-admin users unless it contains at least one DocType** that the user has permissions on.

If your app has no DocTypes yet, create a simple Settings DocType in your module to make it visible.

### Step 4: Add `add_to_apps_screen` to hooks.py

This is the **v16-specific** hook that registers your app on the Desk app screen:

```python
# hooks.py

add_to_apps_screen = [
    {
        "name": "your_app",
        "logo": "/assets/your_app/logo.png",
        "title": "Your App Title",
        "route": "/desk/your_app",
        "has_permission": "your_app.api.check_app_permission"
    }
]
```

**Place the logo file at:** `your_app/your_app/public/logo.png`

**The permission check function** (optional but recommended):

```python
# your_app/api.py
import frappe

def check_app_permission():
    """Check if current user has permission to access the app."""
    roles = frappe.get_roles()
    if any(role in roles for role in ["System Manager", "Administrator"]):
        return True
    return False
```

### Step 5: Generate Desktop Icons and Sidebar

After updating hooks.py, run:

```bash
bench create-desktop-icons-and-sidebar
bench migrate
bench restart
```

If this command doesn't produce results, proceed to Step 6 for manual setup.

### Step 6: Manual Desktop Icon + Sidebar Setup

This is the approach the community has confirmed works when the bench command doesn't.

**A. Create the Parent Desktop Icon (the app folder on Desk):**

1. Log in as Administrator
2. Go to `/app/desktop-icon` → New
3. Set fields:
   - **Icon Type:** App
   - **Link Type:** External
   - **App:** frappe (or your app name if it appears)
   - **Label:** Your App Name
   - **Logo URL:** /assets/your_app/logo.png
   - **Link:** /desk/your_app
   - **Is Standard:** Check this
4. Save

**B. Create a Workspace Sidebar:**

1. Go to `/app/workspace-sidebar` → New
2. Add sidebar items — these are the links that appear in the left sidebar when your app is selected
3. Each item can link to a Workspace, DocType, Page, Report, or external URL
4. Save

**C. Create Child Desktop Icons (sidebar entries):**

1. Go to `/app/desktop-icon` → New
2. Set fields:
   - **Icon Type:** Link
   - **Link Type:** Workspace Sidebar
   - **Parent Icon:** Select the parent Desktop Icon you created in step A
   - **Link To:** Select the Workspace Sidebar you created in step B
   - **Logo URL:** your icon
3. Save

**D. Refresh the browser** (hard refresh: Ctrl+Shift+R)

**Tip:** If building from scratch seems daunting, try duplicating an existing Desktop Icon (e.g. the "Build" or "Buying" icon) and modifying it. This avoids some of the quirks with creating from scratch.

### Step 7: Create the Workspace Page

The workspace is the actual content page users see when they click a sidebar item:

**Via UI (recommended):**
1. Navigate to any existing workspace
2. Click on the workspace name in the top navbar
3. From there you can create a new workspace
4. Link it to your module
5. Set it as Public
6. Add blocks (shortcuts, cards, charts, etc.)

**Via JSON file:**
Create at: `your_app/your_app/your_module/workspace/your_workspace/your_workspace.json`

Then run `bench migrate` to sync it to the database.

---

## Setup Checklist

### App & Module

```
□ hooks.py has app_name, app_title, etc.
□ modules.txt lists your module name(s)
□ Module Def exists in database (check /app/module-def)
□ Module Def has correct app_name field
□ At least one DocType exists in the module
□ DocType has permissions set for target roles
□ User has module in their Allowed Modules
```

### v16 Desktop / Workspace

```
□ add_to_apps_screen configured in hooks.py
□ bench create-desktop-icons-and-sidebar run
  OR Desktop Icon manually created (parent + child)
□ Workspace Sidebar created and linked from child Desktop Icon
□ Workspace exists and is set to Public
□ Workspace is linked to your module
```

### Build & Cache

```
□ Logo file at your_app/your_app/public/logo.png
□ bench build (after adding static assets)
□ bench migrate
□ bench clear-cache
□ Hard refresh in browser (Ctrl+Shift+R)
```

---

## Common Issues

### Workspace Not Appearing in Sidebar

- Is `public` set on the workspace? Private workspaces only show for the owner.
- Is the `module` field set correctly? Must exactly match the Module Def name (case-sensitive).
- Does the module have at least one DocType? No DocType = invisible module for non-admins.
- Is the module enabled for the user? Check Allowed Modules in the User record.

### "Public" Checkbox Greyed Out on Workspace

- Enable developer mode: `bench set-config developer_mode 1`
- Must be logged in as Administrator
- Must have Workspace Manager role

### v16 Session Boot Error (500) After Creating Desktop Icon

- Make sure **Is Standard** is checked on the Desktop Icon
- Must be logged in as Administrator

### Workspace Sidebar Created But Not Visible Anywhere

- A Workspace Sidebar alone does nothing — it must be linked **FROM** a child Desktop Icon with **Link Type: Workspace Sidebar** and a **Parent Icon** set to your app's Desktop Icon.

### App Shows for Admin But Not Other Users

- Module not in user's Allowed Modules
- No DocType in the module that the user has permission on
- Roles restriction on workspace that user doesn't have

---

## Debugging Commands

```bash
# Check app is installed
bench --site your-site list-apps

# Check modules are registered
bench --site your-site console
>>> frappe.get_all("Module Def", filters={"app_name": "your_app"}, pluck="name")

# Check workspace exists
>>> frappe.get_all("Workspace", filters={"module": "Your Module Name"}, pluck="name")

# Check desktop icons
>>> frappe.get_all("Desktop Icon", filters={"app": "your_app"}, fields=["name", "label", "icon_type", "link_type"])

# Force full rebuild
bench build
bench migrate
bench clear-cache
bench restart
```

---

## References

- [How to Add a Custom App to Desktop in Frappe v16](https://discuss.frappe.io/t/how-to-add-a-custom-app-to-desktop-in-frappe-v16/159272) — Jan 2026
- [How to Create a Menu for a Workspace in v16](https://discuss.frappe.io/t/how-to-create-a-menu-for-a-workspace-in-frappe-version-16/159223) — Jan 2026, step-by-step with screenshots
- [Frappe 16 New UI Questions](https://discuss.frappe.io/t/frappe-16-new-ui-questions/157182) — Nov 2025
- [v16 UI Updates Tracking Issue](https://github.com/frappe/frappe/issues/27900) — Official list of all v16 UI changes
- [Frappe v16 Release Notes](https://github.com/frappe/frappe/releases/tag/v16.0.0)
- [Frappe v16 Feature Overview](https://frappe.io/framework/version-16)

---
---

# Appendix A: Expected Frappe App Directory Structure

This is the standard structure generated by `bench new-app`. Any custom app must conform to this layout.

```
your_app/                          # Git root
├── pyproject.toml                 # or setup.py — Python package config
├── your_app/                      # Inner package directory (SAME NAME as outer)
│   ├── __init__.py                # Must exist
│   ├── hooks.py                   # App metadata, integration hooks
│   ├── modules.txt                # List of modules (one per line)
│   ├── patches.txt                # Migration patches
│   ├── your_module/               # Module directory (snake_case)
│   │   ├── __init__.py            # Must exist
│   │   ├── doctype/               # DocTypes for this module
│   │   │   └── your_doctype/
│   │   │       ├── your_doctype.json
│   │   │       ├── your_doctype.py
│   │   │       └── your_doctype.js
│   │   └── workspace/             # Workspace definitions
│   │       └── your_workspace/
│   │           └── your_workspace.json
│   ├── public/                    # Static assets (CSS, JS, images)
│   │   ├── css/
│   │   └── js/
│   ├── templates/
│   │   ├── __init__.py
│   │   └── includes/
│   └── www/                       # Portal pages
```

---

# Appendix B: Issues Specific to Shoehorned (Non-Native) Frappe Apps

When an app is built outside Frappe and then retrofitted to work as a Frappe app, it typically breaks in predictable ways. This appendix documents those failure modes and fixes.

## B.1: Common Missing Pieces

| What's Missing | Symptom | Fix |
|---|---|---|
| `modules.txt` empty or wrong | Frappe doesn't know the app has modules; nothing appears | Add module name(s), one per line |
| Module Def not in database | Module won't appear in sidebar, Allowed Modules, anywhere | Create via UI at `/app/module-def` or via `after_install` hook |
| No `__init__.py` in module dirs | Python import errors, module not found | Add empty `__init__.py` to every package directory |
| Module folder name doesn't match Module Def | Workspace JSON not picked up, doctypes orphaned | Folder must be snake_case of Module Def name: "Quality Control" → `quality_control/` |
| No DocType in the module | Module invisible to non-admin users | Create a simple Settings DocType |
| `hooks.py` missing `app_name` etc | Frappe can't identify the app at all | Add all required metadata fields |
| `setup.py` / `pyproject.toml` wrong or missing | `bench install-app` fails or partially works | Copy from a working Frappe app and adapt |
| App not in `sites/apps.txt` | App code exists but isn't active | `bench --site your-site install-app your_app` |
| `add_to_apps_screen` not in hooks.py | App won't appear on v16 Desk | Add the hook (see Step 4 in main guide) |

## B.2: The Double-Nested Directory Problem

This is the #1 structural issue with shoehorned apps. Frappe requires:

```
your_app/              ← Git root / outer directory
  └── your_app/        ← Python package / inner directory (SAME NAME)
        ├── hooks.py
        ├── modules.txt
        └── your_module/
```

Shoehorned apps often have `hooks.py` at the git root (`your_app/hooks.py`) instead of inside the inner package (`your_app/your_app/hooks.py`). This breaks everything.

**Fix:** Restructure the directory layout to match the expected nesting. The outer directory is the git repo; the inner directory with the same name is the importable Python package.

## B.3: Module Name Casing Mismatches

Frappe uses three different forms of the module name in different places, and all must be consistent:

| Where | Format | Example |
|---|---|---|
| `modules.txt` | Title Case with spaces | `Quality Control` |
| Module Def `name` field | Title Case with spaces | `Quality Control` |
| Module folder name | snake_case | `quality_control` |
| Workspace JSON `module` field | Title Case with spaces | `Quality Control` |

If any of these don't match, things silently fail.

## B.4: App Not Pip-Installed in Bench Virtualenv

Frappe apps must be pip-installed (in editable mode) into the bench's virtualenv. If you manually copied your app into `apps/` without running `bench get-app` or `bench install-app`, the Python package might not be importable.

**Fix:**

```bash
# From the bench directory
source env/bin/activate
pip install -e apps/your_app
# Or
bench setup env
```

## B.5: Static Assets Not Built

After adding anything to `your_app/your_app/public/` (logos, CSS, JS), you must build:

```bash
bench build
```

Without this, `/assets/your_app/logo.png` will 404.

## B.6: Creating Module Def Programmatically

If your shoehorned app needs to create its Module Def automatically on install:

```python
# your_app/install.py
import frappe

def after_install():
    if not frappe.db.exists("Module Def", "Your Module Name"):
        doc = frappe.new_doc("Module Def")
        doc.module_name = "Your Module Name"
        doc.app_name = "your_app"
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
```

In `hooks.py`:
```python
after_install = "your_app.install.after_install"
```

## B.7: Permission Check Function

A more robust permission check that works with module-based access:

```python
# your_app/api.py
import frappe
from frappe.utils import modules

def check_app_permission():
    """Check if current user has permission to access the app."""
    allowed_modules = modules.get_modules_from_all_apps_for_user()
    allowed_module_names = [x["module_name"] for x in allowed_modules]
    
    if "Your Module Name" not in allowed_module_names:
        return False
    
    roles = frappe.get_roles()
    if any(role in roles for role in [
        "System Manager",
        "Your App Manager",
        "Your App User"
    ]):
        return True
    
    return False
```

## B.8: Full Diagnostic Checklist

Run through this in order when things aren't working:

```
STRUCTURE
□ Outer dir and inner dir have the SAME NAME
□ __init__.py exists in inner dir
□ __init__.py exists in every module dir
□ hooks.py is in the inner dir (not the outer dir)
□ modules.txt is in the inner dir
□ patches.txt exists (can be empty)
□ setup.py or pyproject.toml exists and is valid

INSTALLATION
□ App is in sites/apps.txt
□ App is pip-installed in bench virtualenv
□ bench --site your-site list-apps shows your app

DATABASE
□ Module Def exists for your module (/app/module-def)
□ Module Def app_name field matches your app_name
□ At least one DocType exists in the module
□ DocType has permissions for target roles

STATIC ASSETS
□ Logo file at your_app/your_app/public/logo.png
□ bench build has been run

V16 DESK
□ add_to_apps_screen in hooks.py
□ Desktop Icons created (parent + child)
□ Workspace Sidebar created and linked
□ Workspace exists, is public, linked to module

CACHE
□ bench migrate
□ bench clear-cache  
□ bench restart
□ Hard browser refresh (Ctrl+Shift+R)
```



---

## Desktop Icons Complete Reference

# Frappe Desktop Icons Guide (v16+)

## Overview

Desktop icons (also called "App Tiles") allow your Frappe app to appear on the main apps page, making it easily accessible to users. When configured, your app appears alongside built-in apps like Home, CRM, HR, and Accounting.

> **Important:** Frappe v16 introduced significant changes to how desktop icons work. This guide covers the complete setup required for v16+, which involves **multiple configuration files** working together.

---

## How Desktop Icons Work in Frappe v16

In Frappe v16, desktop icons require **three components** working together:

1. **`hooks.py`** - Registers the app for the apps screen (provides route info)
2. **`app_logo_url`** - Top-level hook for the app's logo (used by sidebar)
3. **`desktop_icon/*.json`** - Desktop Icon DocType definition (provides the actual icon on desktop)

The `add_to_apps_screen` hook alone is **not sufficient** for the icon to appear with a custom logo. You must also create a Desktop Icon JSON file.

---

## Recommended: Use `bench new-app`

The easiest way to create a properly structured Frappe app is to use the built-in command:

```bash
cd ~/frappe-bench
bench new-app your_app
```

This creates the correct triple-folder structure automatically. Then:
1. Copy your existing code into the correct folders (see File Structure Reference below)
2. Configure `hooks.py` with logo and app screen settings
3. Create `desktop_icon/` and `workspace_sidebar/` folders at app root
4. Run `bench --site your-site install-app your_app`

> **Warning:** If you create the app structure manually or copy from another source, you may encounter issues with Pages, DocTypes, or icons not syncing. The `bench new-app` command ensures all folders and marker files are in the correct locations.

---

## Quick Start (All Required Steps)

### Step 1: Edit hooks.py

Add **both** the `app_logo_url` hook AND the `add_to_apps_screen` configuration:

```python
app_name = "your_app"
app_title = "Your App"
app_publisher = "Your Name"
app_description = "Description"
app_email = "you@example.com"
app_license = "MIT"

# REQUIRED for v16: Top-level logo URL hook
app_logo_url = "/assets/your_app/logo.svg"

# App screen configuration
add_to_apps_screen = [
	{
		"name": "your_app",
		"logo": "/assets/your_app/logo.svg",
		"title": "Your App",
		"route": "/app/your-doctype",
	}
]
```

### Step 2: Create the Logo File

Place your logo in the `public/` folder:
```
your_app/public/logo.svg    (or logo.png)
```

### Step 3: Create Desktop Icon JSON (CRITICAL for v16)

Create the folder and JSON file at the **app root level** (same level as `hooks.py`):

```
your_app/
├── hooks.py
├── desktop_icon/              ← Create this folder
│   └── your_app.json          ← Create this file
├── public/
│   └── logo.svg
└── ...
```

**File: `your_app/desktop_icon/your_app.json`**
```json
{
 "app": "your_app",
 "docstatus": 0,
 "doctype": "Desktop Icon",
 "hidden": 0,
 "icon": "tool",
 "icon_type": "Link",
 "idx": 0,
 "label": "Your App",
 "logo_url": "/assets/your_app/logo.svg",
 "link_to": "Your App",
 "link_type": "Workspace Sidebar",
 "name": "Your App",
 "owner": "Administrator",
 "standard": 1
}
```

> **Critical:** The `name` field MUST match the filename (without `.json`). If your file is `your_app.json`, then `"name": "Your App"` should be the label, and the filename should match the scrubbed version.

### Step 4: Create Workspace Sidebar JSON (Required for navigation)

Create at the **app root level**:

```
your_app/
├── hooks.py
├── desktop_icon/
├── workspace_sidebar/         ← Create this folder
│   └── your_app.json          ← Create this file
└── ...
```

**File: `your_app/workspace_sidebar/your_app.json`**
```json
{
 "app": "your_app",
 "docstatus": 0,
 "doctype": "Workspace Sidebar",
 "icon": "tool",
 "idx": 0,
 "items": [],
 "module": "Your App",
 "name": "Your App",
 "owner": "Administrator",
 "standard": 1,
 "title": "Your App"
}
```

### Step 5: Create Workspace JSON (For workspace content)

Create inside the **module folder**:

```
your_app/
├── your_app/                  ← Module folder
│   ├── __init__.py
│   ├── .frappe               ← Required marker file (empty)
│   └── workspace/
│       └── your_app/
│           └── your_app.json
└── ...
```

**File: `your_app/your_app/workspace/your_app/your_app.json`**
```json
{
 "app": "your_app",
 "charts": [],
 "content": "[{\"type\":\"header\",\"data\":{\"text\":\"Your App\",\"col\":12}}]",
 "creation": "2026-02-09 10:00:00.000000",
 "docstatus": 0,
 "doctype": "Workspace",
 "for_user": "",
 "hide_custom": 0,
 "icon": "tool",
 "idx": 0,
 "is_hidden": 0,
 "label": "Your App",
 "links": [],
 "modified": "2026-02-09 10:00:00.000000",
 "modified_by": "Administrator",
 "module": "Your App",
 "name": "Your App",
 "number_cards": [],
 "owner": "Administrator",
 "parent_page": "",
 "public": 1,
 "quick_lists": [],
 "restrict_to_domain": "",
 "roles": [],
 "sequence_id": 1,
 "shortcuts": [],
 "title": "Your App",
 "type": "Workspace"
}
```

### Step 6: Create .frappe Marker File

Create an empty `.frappe` file in your module folder:

```bash
touch your_app/your_app/.frappe
```

This file is **required** for Frappe to recognize the folder as a module and sync its contents.

### Step 7: Apply Changes

```bash
bench --site your-site migrate
bench --site your-site clear-cache
bench build --app your_app
bench restart
```

Then hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R).

---

## Understanding Each Configuration

### hooks.py Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `app_logo_url` | Yes (v16) | Top-level hook for app logo | `"/assets/your_app/logo.svg"` |
| `name` | Yes | Unique identifier for the app tile | `"your_app"` |
| `logo` | Yes | Path to the icon image | `"/assets/your_app/logo.svg"` |
| `title` | Yes | Display name shown under the icon | `"Your App"` |
| `route` | Yes | URL path when users click the icon | `"/app/your-doctype"` |
| `has_permission` | No | Python path to permission check function | `"your_app.api.has_permission"` |

### Desktop Icon JSON Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Must match filename (without .json) |
| `label` | Yes | Display name for the icon |
| `app` | Yes | Your app's name (snake_case) |
| `logo_url` | Yes | Path to logo image |
| `icon_type` | Yes | Usually `"Link"` or `"App"` |
| `link_type` | Yes | Usually `"Workspace Sidebar"` |
| `link_to` | Yes | Name of the Workspace Sidebar to link to |
| `standard` | Yes | Set to `1` for app-defined icons |

---

## Route Options

The `route` field in `add_to_apps_screen` determines where clicking the icon takes the user.

### 1. **DocType List View (Recommended for simple apps)**
```python
"route": "/app/wp-tables"
```
Opens the list view of a specific DocType (shows all records).

### 2. **Workspace**
```python
"route": "/desk/your-app"
```
Opens a Workspace dashboard with links, shortcuts, and cards.

**Requires:** Workspace, Workspace Sidebar, and Desktop Icon JSON files (see Quick Start above).

### 3. **New Document Form**
```python
"route": "/app/wordpress-connection/new"
```
Opens a blank form to create a new document.

### 4. **Report**
```python
"route": "/app/query-report/Sync Status Report"
```
Opens a specific report.

### 5. **Custom Web Page**
```python
"route": "/your_app/dashboard"
```
Opens a custom HTML page from your `www/` folder.

**Requires:** File at `your_app/www/dashboard.html` or `dashboard.py`

---

## Adding the Logo

### Step 1: Create an Icon Image

**Requirements:**
- Format: SVG (recommended) or PNG
- Size: 100x100 pixels or larger (square)
- Background: Transparent or solid color
- File name: `logo.svg` or `logo.png`

### Step 2: Place in Public Folder

Copy your icon to:
```
your_app/public/logo.svg
```

### Step 3: Reference in THREE Places

**1. hooks.py (top-level):**
```python
app_logo_url = "/assets/your_app/logo.svg"
```

**2. hooks.py (add_to_apps_screen):**
```python
"logo": "/assets/your_app/logo.svg"
```

**3. desktop_icon JSON:**
```json
"logo_url": "/assets/your_app/logo.svg"
```

**Note:** The path is automatically mapped:
- `/assets/your_app/` → `your_app/public/`

---

## Permission Control

### Option 1: No Permission Check (Public)
```python
{
	"name": "your_app",
	"logo": "/assets/your_app/logo.svg",
	"title": "Your App",
	"route": "/app/your-doctype"
	# No has_permission field = everyone can see it
}
```

### Option 2: Custom Permission Function
```python
{
	"name": "your_app",
	"logo": "/assets/your_app/logo.svg",
	"title": "Your App",
	"route": "/app/your-doctype",
	"has_permission": "your_app.api.permission.has_app_permission"
}
```

**Create the permission function:**

File: `your_app/your_app/api/permission.py`
```python
import frappe

def has_app_permission():
	"""Check if user has permission to see the app"""
	# Option 1: Check role
	if "System Manager" in frappe.get_roles():
		return True
	
	# Option 2: Check custom permission
	if frappe.has_permission("Your DocType", "read"):
		return True
	
	return False
```

---

## Multiple Desktop Icons

You can add multiple icons for the same app. Each requires its own `desktop_icon/*.json` file:

**hooks.py:**
```python
add_to_apps_screen = [
	{
		"name": "your_app",
		"logo": "/assets/your_app/logo.svg",
		"title": "Your App",
		"route": "/app/main-doctype"
	},
	{
		"name": "quick_create",
		"logo": "/assets/your_app/quick_create.svg",
		"title": "Quick Create",
		"route": "/app/your-doctype/new"
	}
]
```

**desktop_icon/your_app.json** and **desktop_icon/quick_create.json** - create one for each.

---

## Complete Example (v16)

### File: `frappe_theme_editor/hooks.py`

```python
app_name = "frappe_theme_editor"
app_title = "Frappe Theme Editor"
app_publisher = "NCE"
app_description = "Visual theme editor for Frappe/ERPNext applications"
app_email = "dev@ncesoccer.com"
app_license = "MIT"

# REQUIRED for v16: Top-level logo URL hook
app_logo_url = "/assets/frappe_theme_editor/logo.svg"

# Desktop Icons / App Tiles
add_to_apps_screen = [
	{
		"name": "frappe_theme_editor",
		"logo": "/assets/frappe_theme_editor/logo.svg",
		"title": "Theme Editor",
		"route": "/app/theme-editor",
	}
]

# ... rest of hooks.py
```

### File: `frappe_theme_editor/desktop_icon/theme_editor.json`

```json
{
 "app": "frappe_theme_editor",
 "docstatus": 0,
 "doctype": "Desktop Icon",
 "hidden": 0,
 "icon": "tool",
 "icon_type": "Link",
 "idx": 0,
 "label": "Theme Editor",
 "logo_url": "/assets/frappe_theme_editor/logo.svg",
 "link_to": "Frappe Theme Editor",
 "link_type": "Workspace Sidebar",
 "name": "Theme Editor",
 "owner": "Administrator",
 "standard": 1
}
```

### File: `frappe_theme_editor/workspace_sidebar/frappe_theme_editor.json`

```json
{
 "app": "frappe_theme_editor",
 "docstatus": 0,
 "doctype": "Workspace Sidebar",
 "icon": "tool",
 "idx": 0,
 "items": [],
 "module": "Frappe Theme Editor",
 "name": "Frappe Theme Editor",
 "owner": "Administrator",
 "standard": 1,
 "title": "Frappe Theme Editor"
}
```

---

## Applying Changes

After creating/editing configuration files, you need to sync and restart:

### Method 1: Full Sync (Recommended)
```bash
bench --site your-site migrate
bench --site your-site clear-cache
bench build --app your_app
bench restart
```

### Method 2: Quick Refresh (After minor changes)
```bash
bench --site your-site clear-cache
bench restart
```

> **Note:** `bench migrate` is required whenever you add or modify JSON files in `desktop_icon/`, `workspace_sidebar/`, or `workspace/` folders. Simple cache clears won't sync these files to the database.

---

## Troubleshooting

### Icon Doesn't Appear At All

**Check 1:** Verify the app is installed
```bash
bench --site your-site list-apps
```

**Check 2:** Check if Desktop Icon exists in database
```bash
bench --site your-site console
>>> frappe.get_all("Desktop Icon", filters={"app": "your_app"}, fields=["name", "label", "logo_url"])
```

**Check 3:** Verify Desktop Icon JSON file location
- Must be at app root: `your_app/desktop_icon/your_app.json`
- NOT inside module folder: ~~`your_app/your_app/desktop_icon/`~~

**Check 4:** Verify `name` field matches filename
```json
// File: your_app/desktop_icon/theme_editor.json
{
  "name": "Theme Editor",  // ← Must relate to filename
  ...
}
```

**Check 5:** Run migrate to sync JSON files
```bash
bench --site your-site migrate
```

**Check 6:** Check for "Removing orphan Desktop Icons" in migrate output
- If your icon is being deleted, the JSON file isn't being found
- Verify folder location and filename

---

### Icon Appears But Shows Letter Instead of Logo

**Cause:** The `logo_url` field is missing or not synced to the database.

**Fix 1:** Add `logo_url` to desktop_icon JSON
```json
{
  "logo_url": "/assets/your_app/logo.svg",
  ...
}
```

**Fix 2:** Add `app_logo_url` to hooks.py (top-level, not inside add_to_apps_screen)
```python
app_logo_url = "/assets/your_app/logo.svg"
```

**Fix 3:** Re-run migrate and clear cache
```bash
bench --site your-site migrate
bench --site your-site clear-cache
bench restart
```

**Fix 4:** Verify logo_url is in database
```bash
bench --site your-site console
>>> frappe.get_value("Desktop Icon", "Your App", "logo_url")
```

---

### Icon Appears But Image Doesn't Load (Broken Image)

**Check 1:** Verify logo file exists
```bash
ls -la your_app/public/logo.svg
```

**Check 2:** Check logo path spelling (case-sensitive)
```python
"logo_url": "/assets/your_app/logo.svg"  # Correct
"logo_url": "/assets/your_app/Logo.svg"  # Wrong
```

**Check 3:** Test logo URL directly in browser
```
http://your-site:8000/assets/your_app/logo.svg
```

**Check 4:** Rebuild assets
```bash
bench build --app your_app
```

**Check 5:** Check file format
- Use SVG or PNG
- Avoid spaces in filename
- Ensure valid SVG syntax

---

### Icon Removed During Migrate ("Removing orphan Desktop Icons")

**Cause:** Frappe can't find the JSON file or the file format is incorrect.

**Fix 1:** Verify folder is at app root level
```
your_app/
├── desktop_icon/          ← Correct location
│   └── your_app.json
├── hooks.py
└── ...
```

NOT:
```
your_app/
├── your_app/
│   └── desktop_icon/      ← Wrong location
│       └── your_app.json
└── ...
```

**Fix 2:** Verify JSON is valid
```bash
python -m json.tool your_app/desktop_icon/your_app.json
```

**Fix 3:** Check `standard` field is set to `1`
```json
{
  "standard": 1,
  ...
}
```

---

### Wrong Route / 404 Error / "Page not found"

**Cause:** The Page or DocType isn't in the database, usually because it's in the wrong folder location.

**Fix 1:** Verify Page exists in database
```bash
bench --site your-site console
>>> frappe.db.get_value("Page", "your-page-name", ["name", "module"])
```
If this returns `None`, the page wasn't synced.

**Fix 2:** Check folder location - Pages must be in the MODULE folder (Level 3)
```
# CORRECT - page inside module folder (Level 3)
your_app/your_app/your_app/page/your_page/your_page.json

# WRONG - page at app root (Level 1)
your_app/page/your_page/your_page.json

# WRONG - page at package level (Level 2)
your_app/your_app/page/your_page/your_page.json
```

**Fix 3:** Check `module` field in page JSON matches your module name
```json
{
  "module": "Your App",  // Must match modules.txt
  ...
}
```

**Fix 4:** Create `.frappe` marker file in module folder
```bash
touch your_app/your_app/your_app/.frappe
```

**Fix 5:** Run migrate to sync
```bash
bench --site your-site migrate
```

**Fix 6:** Use correct route format
```python
# Correct
"route": "/app/wp-tables"          # DocType: WP Tables
"route": "/app/your-page"          # Page: your-page

# Wrong
"route": "/app/WP Tables"          # Spaces not allowed
"route": "/wp-tables"              # Missing /app/
```

---

### Workspace Shows "Report" Instead of Content

**Cause:** Missing Workspace Sidebar or incorrect module reference.

**Fix 1:** Create workspace_sidebar JSON at app root
```
your_app/workspace_sidebar/your_app.json
```

**Fix 2:** Ensure `module` field matches in all JSON files
```json
"module": "Your App"  // Must be consistent
```

**Fix 3:** Verify Workspace Sidebar exists in database
```bash
bench --site your-site console
>>> frappe.get_all("Workspace Sidebar", filters={"app": "your_app"})
```

---

## Best Practices

### 1. **Use SVG for Icons**
SVG files scale better and load faster than PNG. They also look crisp on high-DPI displays.

### 2. **Keep Icon Simple**
- Use clear, recognizable imagery
- Avoid too much detail (icons are displayed small)
- Use high contrast colors
- 100x100 viewBox is ideal

### 3. **Descriptive Titles**
- Keep titles short (1-3 words)
- Use title case: "Theme Editor" not "theme editor"

### 4. **Consistent Naming**
```python
# Good - consistent naming across files
app_name = "frappe_theme_editor"
"name": "frappe_theme_editor"
"app": "frappe_theme_editor"
"module": "Frappe Theme Editor"

# Avoid - inconsistent naming causes sync issues
```

### 5. **Test After Every Change**
```bash
# Quick verification commands
bench --site your-site console
>>> frappe.get_all("Desktop Icon", filters={"app": "your_app"}, fields=["name", "logo_url"])
>>> frappe.get_all("Workspace Sidebar", filters={"app": "your_app"})
```

### 6. **Check Migrate Output**
Watch for "Removing orphan Desktop Icons" - this means your JSON isn't being found.

---

## File Structure Reference (v16 Complete)

### Standard Structure (created by `bench new-app`)

When you create an app with `bench new-app your_app`, Frappe creates a **triple-nested folder structure**:

```
apps/
└── your_app/                                # Level 1: App root (repo folder)
    ├── hooks.py                             # ← Configure app_logo_url + add_to_apps_screen
    ├── setup.py
    ├── requirements.txt
    ├── modules.txt                          # Lists module names (e.g., "Your App")
    │
    ├── desktop_icon/                        # ← APP ROOT LEVEL (same as hooks.py)
    │   └── your_app.json                    # Desktop Icon definition
    │
    ├── workspace_sidebar/                   # ← APP ROOT LEVEL (same as hooks.py)
    │   └── your_app.json                    # Workspace Sidebar definition
    │
    ├── public/                              # Static assets
    │   └── logo.svg                         # ← Place icon here
    │
    └── your_app/                            # Level 2: Python package folder
        ├── __init__.py
        │
        └── your_app/                        # Level 3: Module folder (CRITICAL!)
            ├── __init__.py
            ├── .frappe                      # ← REQUIRED marker file (empty)
            │
            ├── workspace/                   # Workspace definitions (IN module)
            │   └── your_app/
            │       └── your_app.json        # Workspace content config
            │
            ├── doctype/                     # Your DocTypes go here
            │   └── your_doctype/
            │       └── your_doctype.json
            │
            ├── page/                        # Your Pages go here
            │   └── your_page/
            │       ├── your_page.json
            │       ├── your_page.js
            │       └── your_page.html
            │
            └── report/                      # Your Reports go here
                └── ...
```

### Why Three Levels?

The app name appears three times because:
1. **Level 1** (`apps/your_app/`) - The app/repo root directory
2. **Level 2** (`your_app/your_app/`) - The Python package (what `import your_app` loads)
3. **Level 3** (`your_app/your_app/your_app/`) - The Frappe module (where DocTypes, Pages, etc. live)

This is the **standard Frappe app structure**. The `bench new-app` command creates this automatically.

### Critical Placement Rules

| Item | Location | Example Path |
|------|----------|--------------|
| `hooks.py` | App root (Level 1) | `your_app/hooks.py` |
| `desktop_icon/` | App root (Level 1) | `your_app/desktop_icon/` |
| `workspace_sidebar/` | App root (Level 1) | `your_app/workspace_sidebar/` |
| `public/` | App root (Level 1) | `your_app/public/logo.svg` |
| `.frappe` marker | Module folder (Level 3) | `your_app/your_app/your_app/.frappe` |
| `doctype/` | Module folder (Level 3) | `your_app/your_app/your_app/doctype/` |
| `page/` | Module folder (Level 3) | `your_app/your_app/your_app/page/` |
| `workspace/` | Module folder (Level 3) | `your_app/your_app/your_app/workspace/` |

> **Critical:** `doctype/`, `page/`, and `workspace/` folders MUST be inside the **module folder** (Level 3, where `.frappe` marker is). If placed at Level 1 or Level 2, they will NOT be synced to the database during `bench migrate`.

---

## Summary Checklist (v16)

### Required Files
- [ ] `hooks.py` with `app_logo_url` (top-level hook)
- [ ] `hooks.py` with `add_to_apps_screen` configuration
- [ ] `public/logo.svg` (or .png) - your icon image
- [ ] `desktop_icon/your_app.json` - Desktop Icon definition with `logo_url`
- [ ] `workspace_sidebar/your_app.json` - Workspace Sidebar definition
- [ ] `your_app/workspace/your_app/your_app.json` - Workspace content
- [ ] `your_app/.frappe` - Empty marker file in module folder

### JSON File Checklist
- [ ] `desktop_icon/*.json` is at app root (not in module folder)
- [ ] `workspace_sidebar/*.json` is at app root (not in module folder)
- [ ] `name` field matches filename (without .json)
- [ ] `logo_url` field is present in desktop_icon JSON
- [ ] `standard` field is set to `1`
- [ ] `app` field matches your app name (snake_case)
- [ ] `module` field is consistent across all JSON files

### Commands to Run
- [ ] `bench --site your-site migrate` (syncs JSON files to database)
- [ ] `bench --site your-site clear-cache`
- [ ] `bench build --app your_app` (links assets)
- [ ] `bench restart`
- [ ] Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

### Verification
- [ ] Check Desktop Icon in database: `frappe.get_all("Desktop Icon", filters={"app": "your_app"})`
- [ ] Check logo_url is populated: `frappe.get_value("Desktop Icon", "Your App", "logo_url")`
- [ ] Test logo URL in browser: `http://site:8000/assets/your_app/logo.svg`
- [ ] Verify icon appears on apps page with custom logo
- [ ] Click icon and verify correct destination

---

## Common Mistakes to Avoid

1. **Putting `desktop_icon/` inside the module folder** - It must be at app root level (Level 1)
2. **Putting `doctype/` or `page/` at app root** - They must be inside the module folder (Level 3, where `.frappe` is)
3. **Forgetting `app_logo_url` in hooks.py** - The `logo` field in `add_to_apps_screen` alone isn't enough
4. **Missing `logo_url` in desktop_icon JSON** - This is what actually shows the icon
5. **Filename/name mismatch** - The `name` field must relate to the JSON filename
6. **Missing `.frappe` marker file** - Required for Frappe to recognize the module folder
7. **Not running `bench migrate`** - JSON files won't sync to database without it
8. **Only clearing cache without migrate** - Cache clear doesn't sync JSON files
9. **Wrong module name in JSON files** - The `module` field must match what's in `modules.txt`
10. **Non-standard app structure** - Always use `bench new-app` to create apps, then copy your code into the correct folders

---

## Additional Resources

- [Frappe Framework Documentation](https://frappeframework.com/docs)
- [Workspace Documentation](https://frappeframework.com/docs/user/en/desk/workspace)
- [Hooks Reference](https://frappeframework.com/docs/user/en/python-api/hooks)

---

**Last Updated:** February 2026  
**Frappe Version:** v16+  
**App Example:** frappe_theme_editor

