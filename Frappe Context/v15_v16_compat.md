---
title: "Frappe v15/v16 Compatibility: Policy, Migration & Quick Reference"
merged_from:
  - frappe_rag_context_v15_v16.md
  - cursor_engineering_policy_frappe_v15_v16.md
  - frappe-v15-v16-compatibility.md
tokens_approx: 5599
created: 2026-03-23
axes:
  backend: null   # to be scored
  ui: null        # to be scored
  framework: null # to be scored
---

# Frappe v15/v16 Compatibility: Policy, Migration & Quick Reference

Single reference for building apps that work on both Frappe v15 and v16. Combines the engineering policy (enforceable rules), the migration/compatibility guide (how-to), and the compressed RAG quick-reference.

Sections are ordered: quick-ref first (for fast lookups), then policy rules, then detailed migration guide.


---

## Quick Reference (RAG Context)

# RAG Context — Future‑Proof Frappe Apps (v15 + v16)

**Use case:** Retrieval context for an AI coding agent writing and reviewing Frappe apps that must run on **Frappe v15 and v16** from a **single codebase**.

**Non‑negotiables**
- Single codebase, no forks.
- Develop to v15 APIs, comply with v16 strictness.
- Never rely on implicit behaviors (sorting, type casting, JS globals, schema state).
- Centralize version logic; never scatter checks.

---

## 0) Quick Facts (High Signal)
- v16 uses **bleeding‑edge runtimes**; mismatches cause Python syntax errors or asset build failures.
- v16 shifts Desk routes from `/app` to `/desk`.
- v16 enforces stricter security (CSRF/POST requirements) and stricter hook return semantics.
- v16 modularizes “lean core” features into separate apps (install explicitly or guard).

---

## 1) Runtime / Dependency Matrix (Treat as a hard gate)
| Component | v15 | v16 | Consequence if wrong |
|---|---:|---:|---|
| Python | 3.10–3.12 | **3.14+** | Python `SyntaxError` / runtime incompat |
| Node.js | 18+ | **24+** | `bench build` fails |
| MariaDB | 10.6.6+ | **11.8+** | perf / lock handling regressions |
| Redis | 6.0 | 6.0+ (Redis 8 rec.) | cache/locking regressions |
| Package manager | pip | **uv** | install workflow differs |

**Agent rule:** If environment versions do not meet the v16 gates, stop and fix environment first.

---

## 2) Core v16 Architectural Shifts
- **SQLite support (v16):** single‑file DB option; useful for portable/offline/CI.
- **Lock‑free caching (v16):** removes blocking under concurrency; improves throughput.
- **Shorter UUIDs (v16):** faster writes at scale.

---

## 3) Cross‑Version Compatibility Principle
**Write v15‑compatible code** but **follow v16 strictness**:
- Explicit returns (`True/False`) for permission hooks.
- Explicit `order_by` in list queries.
- Defensive schema patches (`has_column` before add/alter).
- Explicit JS scoping (no implicit globals).
- Explicit whitelisting and guest access flags.

---

## 4) Version Detection (Centralized Only)
**Location:** `your_app/utils/version.py`

```python
import frappe

def get_frappe_major_version():
    try:
        return int(frappe.__version__.split(".")[0])
    except (ValueError, IndexError):
        return 15

def is_v16_or_later():
    return get_frappe_major_version() >= 16
```

**Agent rule:** all version‑conditionals must call these helpers; no inline checks elsewhere.

---

## 5) Packaging / Dependency Metadata
### 5.1 Dual‑support dependency range
`pyproject.toml`:
```toml
[tool.bench.frappe-dependencies]
frappe = ">=15.0.0,<17.0.0"
```

### 5.2 Python requirement declaration
```toml
[project]
requires-python = ">=3.10"
```

---

## 6) Database Semantics (Sorting + Type Casting)
### 6.1 Implicit sorting changed in v16
- v16 defaults list/get APIs to **`creation desc`**
- v15 commonly behaved like **`modified desc`**

**Rule:** If order matters, always set `order_by`.

✅ Correct:
```python
frappe.get_all("My DocType", filters=..., order_by="creation desc")
```

### 6.2 `db.get_value` (Single DocTypes) returns types in v16
- v16 returns proper Python types (int/float/datetime), not strings.

✅ Correct:
```python
if frappe.db.get_value("My Settings", "My Settings", "enabled"):
    ...
```

---

## 7) Permissions + Security Strictness
### 7.1 `has_permission` hook must return boolean
✅ Correct:
```python
def has_permission(doc, ptype, user):
    if condition:
        return True
    return False
```

### 7.2 Whitelisted methods + CSRF/POST enforcement
- v16 enforces stricter CSRF.
- Certain endpoints require **POST** (examples: `logout`, `web_logout`, `upload_file`).

✅ Correct public endpoint:
```python
@frappe.whitelist(allow_guest=True)
def my_public_function():
    ...
```

---

## 8) Schema / Patches (Defensive Only)
**Rule:** Never assume schema state during migrate.

✅ Correct:
```python
from frappe.database.schema import add_column
if not frappe.db.has_column("My DocType", "my_field"):
    add_column("My DocType", "my_field", "varchar(140)")
```

---

## 9) Lean Core Modularization (Must guard imports)
Some v15 “built‑ins” move to separate apps in v16:
- Offsite Backups (`offsite_backups`)
- Energy Points
- Blog
- Newsletter
- Transaction Logs

**Rule:** Either declare dependency, or guard imports.

✅ Correct:
```python
try:
    from frappe.email.doctype.newsletter.newsletter import Newsletter
except ImportError:
    Newsletter = None
```

---

## 10) Frontend / Desk / Workspaces
### 10.1 Route change
- v15: `/app`
- v16: `/desk`

**Rule:** never hardcode `/app` routes; treat route as configurable.

### 10.2 App landing page (v16) needs logo
`hooks.py`:
```python
app_logo_url = "/assets/your_app/images/logo.png"
```
Place at: `your_app/public/images/logo.png`

### 10.3 Workspace JSON re-import requires `modified` bump
**Rule:** Always bump workspace JSON `"modified"` timestamp when changing workspace content; otherwise `bench migrate` may not import it.

### 10.4 Deploy sequence (safe default)
```bash
bench --site all clear-cache
bench --site all migrate
bench build --app your_app
```

---

## 11) JavaScript (IIFE scope isolation in v16)
v16 loads Page/Report/Dashboard JS as IIFEs:
- top-level `var/let/const` does **not** leak to global scope.

✅ Correct:
```js
window.myHelper = function () { ... };
```
or
```js
frappe.provide('myapp.utils');
myapp.utils.helper = function () { ... };
```

---

## 12) PDF Rendering
- v16 moving from `wkhtmltopdf` to **Chrome-based** rendering.
**Rule:** ensure Chrome/Chromium exists on the server.

---

## 13) Migration Workflow (v15 → v16)
1. Install Python 3.14 and Node 24
2. Update app `pyproject.toml` dependencies
3. Switch branch:
```bash
bench switch-to-branch version-16 <app_name> --upgrade
```
4. Install lean-core apps if used (example: `offsite_backups`)
5. Rebuild assets:
```bash
bench build
```

---

## 14) Test Strategy (Dual target)
- CI must test against both v15 and v16 benches.
- Compatibility logic must be centralized in `utils/version.py`.

---

## 15) “Do Not” List (Hard failures)
- No scattered version checks.
- No implicit ordering in queries when order matters.
- No permission hooks returning `None`.
- No schema patches without `has_column` guard.
- No JS reliance on implicit globals.
- No unguarded imports for lean-core modules.
- No forgetting workspace JSON `modified` bump.



---

## Engineering Policy

# Cursor Engineering Policy — Future‑Proof Frappe Apps (v15 + v16)

**Scope:** Rules for planning, coding, reviewing, and shipping Frappe apps that support **both v15 and v16** from **one codebase**.

This document is written as enforceable policy for Cursor (and human reviewers). Any PR that violates a MUST rule is rejected.

---

## 1) Primary Goal
Single codebase compatible with:
- Frappe v15 benches
- Frappe v16 benches

No forks, no “v16-only” branch logic scattered through the code.

---

## 2) Environment Gates (MUST pass)
### v16 minimum runtime gates
- Python: **3.14+**
- Node: **24+**
- MariaDB: **11.8+**
- Redis: 6+ (Redis 8 preferred)

**Policy:** If any gate fails, the correct action is to fix environment first. Do not “patch around” missing runtime features.

---

## 3) Packaging Policy (MUST)
### 3.1 Frappe dependency range (dual support)
`pyproject.toml` MUST include:
```toml
[tool.bench.frappe-dependencies]
frappe = ">=15.0.0,<17.0.0"
```

### 3.2 Python requirement
```toml
[project]
requires-python = ">=3.10"
```

---

## 4) Version Logic Policy (MUST)
### 4.1 Single source of truth
All version checks MUST live in:
- `your_app/utils/version.py`

Required functions:
- `get_frappe_major_version()`
- `is_v16_or_later()`

No other file may parse `frappe.__version__` directly.

### 4.2 Conditional logic allowed only when required
When conditional logic is required, use:
```python
from your_app.utils.version import is_v16_or_later
```

---

## 5) Database Query Policy (MUST)
### 5.1 Explicit ordering
Any query where order matters MUST provide `order_by`.

Forbidden:
```python
frappe.get_all("X", filters=...)
```

Required:
```python
frappe.get_all("X", filters=..., order_by="creation desc")
```

### 5.2 No string assumptions from Single DocType get_value
Forbidden:
```python
... == "1"
```

Required:
```python
if frappe.db.get_value(...):
    ...
```
or explicit casting.

---

## 6) Permissions & Security Policy (MUST)
### 6.1 has_permission hooks
MUST return boolean in all cases.

Forbidden:
- returning `None`
- returning ambiguous truthy values

Required:
```python
return True
return False
```

### 6.2 Whitelisted methods
Any HTTP-exposed function MUST use `@frappe.whitelist(...)` with explicit guest access only when needed:

```python
@frappe.whitelist(allow_guest=True)
def public():
    ...
```

### 6.3 POST requirements in v16
Endpoints that require POST in v16 MUST be treated as POST-only across the app. Do not create GET alternatives.

---

## 7) Schema & Patches Policy (MUST)
### 7.1 Defensive schema updates
Any patch that adds/changes schema MUST guard with `frappe.db.has_column` (or equivalent existence check).

Required pattern:
```python
if not frappe.db.has_column("DocType", "field"):
    ...
```

Forbidden:
- direct add/alter assuming absent/present

---

## 8) Lean Core / Optional Modules Policy (MUST)
### 8.1 Guard all lean-core imports
If a feature moved out of core in v16 (newsletter/blog/offsite backups/energy points/transaction logs), code MUST:
- declare dependency OR
- guard imports with try/except and handle missing module.

Required:
```python
try:
    ...
except ImportError:
    ...
```

### 8.2 Offsite backups
If remote backups are used, `offsite_backups` app MUST be installed on v16 benches. PRs must include explicit install/runbook steps.

---

## 9) Frontend / JS Policy (MUST)
### 9.1 No implicit globals in Page/Report JS
v16 loads JS in IIFEs. Code MUST not rely on `var/let/const` at top level being global.

Required:
```js
window.someHelper = ...
```
or
```js
frappe.provide('myapp.utils');
myapp.utils.helper = ...
```

---

## 10) Desk / Routes / Workspaces Policy (MUST)
### 10.1 Route change awareness
v16 uses `/desk` instead of `/app`. Hardcoded `/app` links are forbidden.

### 10.2 App landing logo
`hooks.py` MUST include `app_logo_url` and the asset MUST exist:
```python
app_logo_url = "/assets/your_app/images/logo.png"
```
File must be at:
- `your_app/public/images/logo.png`

### 10.3 Workspace JSON update rule
When workspace JSON content changes, the JSON `modified` timestamp MUST be bumped; otherwise migrations can skip import.

---

## 11) PDF Rendering Policy (MUST)
v16 uses Chrome-based PDF rendering in place of wkhtmltopdf.

Policy:
- Chrome/Chromium presence is a deployment requirement.
- Runbooks must include installation/verification steps.

---

## 12) CI/CD Policy (MUST)
### 12.1 Dual bench test matrix
CI must run tests on:
- Frappe v15 bench
- Frappe v16 bench

### 12.2 Required build steps (per bench)
- `bench --site <site> migrate`
- `bench build --app <app>`

### 12.3 Fail-fast criteria
CI fails immediately on:
- missing runtime gates (Python/Node)
- any import error from optional modules without guard
- migration errors
- JS build failures

---

## 13) Release Checklist (MUST)
A release PR must include confirmation of:
- `pyproject.toml` range `>=15,<17`
- version helpers exist and are used
- explicit `order_by` for order-sensitive queries
- `has_permission` returns boolean
- schema patches guarded
- no implicit JS globals
- workspace JSON `modified` bumped
- `app_logo_url` present and asset exists
- lean-core imports guarded or app dependencies installed
- tests pass on v15 and v16 benches

---

## 14) Prohibited Practices (PR rejection)
- Scattered version checks (`frappe.__version__` parsing in random files)
- Implicit ordering reliance in list/get APIs
- Permission hooks that return `None`
- Schema patches without existence checks
- Frontend code relying on global scope leakage
- Unconditional imports of lean-core modules
- Hardcoded `/app` URLs
- Workspace JSON changes without `modified` bump



---

## Migration & Compatibility Guide

I have fact-checked the document, cleaned up the typos, and added pertinent technical details relevant to the v15 to v16 transition (specifically regarding Python/Node versions, CSRF protection, and strict typing).

Here is the revised and edited document.

------

# Frappe App Compatibility Guide

## Writing Apps That Work in Both Frappe v15 and v16

------

## Purpose

This document provides architectural and coding guidelines for building or adapting a Frappe v15 application so that it runs cleanly on both Frappe v15 and v16 without requiring separate branches.

The goal is:

- Single codebase
- No version-specific forks
- Clean upgrade path
- Minimal conditional logic

------

## 1. Core Compatibility Principle

Always develop against v15 APIs, but adhere to v16 strictness. Frappe v16 is largely additive but introduces stricter typing and separates "batteries-included" modules into standalone apps. Handle these changes explicitly — do not scatter version checks across the codebase.

------

## 2. Version Detection

Centralize all version detection in a single utility module. Never scatter version checks across files.

**`your_app/utils/version.py`**

Python

```
import frappe

def get_frappe_major_version():
    try:
        return int(frappe.__version__.split(".")[0])
    except (ValueError, IndexError):
        # Fallback for dev versions or non-standard version strings
        return 15

def is_v16_or_later():
    return get_frappe_major_version() >= 16
```

Use it anywhere conditional behavior is needed:

Python

```
from your_app.utils.version import is_v16_or_later

if is_v16_or_later():
    # v16 behavior
else:
    # v15 behavior
```

Guard potentially missing imports (especially for modules moved out of core):

Python

```
try:
    from frappe.email.doctype.newsletter.newsletter import Newsletter
except ImportError:
    # Handle missing module or import from new app namespace if applicable
    Newsletter = None
```

------

## 3. Dependency Management (pyproject.toml)

### 3.1 Version Pinning

Always declare a Frappe version range that covers both versions. Without this, installing on a v16 bench will fail with a versioning error.

Ini, TOML

```
[tool.bench.frappe-dependencies]
frappe = ">=15.0.0,<17.0.0"
```

### 3.2 Python Requirement

Frappe v16 generally requires Python 3.11 or newer. Ensure your app's Python constraints are compatible.

Ini, TOML

```
[project]
requires-python = ">=3.10"
```

------

## 4. hooks.py — UI & Assets

### 4.1 App Logo for v16 Landing Page

v16 introduced a redesigned app landing page (Android-style app drawer). It expects a logo image URL. Add this to `hooks.py`:

Python

```
app_logo_url = "/assets/your_app/images/logo.png"
```

Place the image at `your_app/public/images/logo.png`. This field is safely ignored by v15.

### 4.2 Website Route Rules

If your app uses `website_route_rules`, ensure the targets exist. v16 is stricter about resolving paths during boot.

------

## 5. Python Breaking Changes & strictness

### 5.1 Default Sort Order

In v16, `frappe.get_all()`, `frappe.get_list()`, `frappe.db.get_value()`, and `frappe.db.get_values()` may default to sorting by `creation desc` (performance optimization) rather than `modified desc`.

**Always be explicit about `order_by` in any query where order matters.**

Python

```
# BAD — implicit sort, behavior may vary between versions
results = frappe.get_all("My DocType", filters={...})

# GOOD — explicit, guarantees identical order in both versions
results = frappe.get_all("My DocType", filters={...}, order_by="creation desc")
```

### 5.2 Permission Hooks Must Return Boolean

In v15, returning `None` from a `has_permission` hook was often treated as "pass". In v16, hooks should explicitly return `True` (allow) or `False` (deny/pass to next check).

Python

```
# BAD — works in v15, ambiguous in v16
def has_permission(doc, ptype, user):
    if some_condition:
        return

# GOOD — explicit
def has_permission(doc, ptype, user):
    if some_condition:
        return True
    return False
```

### 5.3 db.get_value Type Casting

In v16, `frappe.db.get_value` aims to return proper Python types (int, float, datetime) for Single DocTypes, whereas v15 often returned strings.

Python

```
# BAD — works in v15, breaks in v16 if type conversion happens
if frappe.db.get_value("My Settings", "My Settings", "enabled") == "1":
    ...

# GOOD — works in both (truthy check or explicit casting)
if frappe.db.get_value("My Settings", "My Settings", "enabled"):
    ...
```

### 5.4 Defensive Schema Migrations

Always check before modifying schema in patches. v16 migrations run strictly; attempting to add a column that exists will crash the build.

Python

```
from frappe.database.schema import add_column

if not frappe.db.has_column("My DocType", "my_field"):
    add_column("My DocType", "my_field", "varchar(140)")
```

### 5.5 CSRF and Whitelisting

v16 enforces stricter CSRF checks. Ensure all public-facing methods are properly whitelisted.

Python

```
# Ensure allow_guest is explicit if public access is needed
@frappe.whitelist(allow_guest=True)
def my_public_function():
    pass
```

------

## 6. JavaScript Breaking Changes

### 6.1 Scope Isolation (IIFEs)

In v16, JS files for Reports, Pages, and Dashboard Charts are loaded as IIFEs (Immediately Invoked Function Expressions). Variables declared at the top level with `var`, `let`, or `const` **will not** leak to the global scope.

JavaScript

```
// BAD — works in v15, breaks in v16 if other files depend on `myHelper`
var myHelper = function() { ... }

// GOOD — explicitly attach to window/frappe if global access is required
window.myHelper = function() { ... }
// OR
frappe.provide('myapp.utils');
myapp.utils.helper = function() { ... }
```

### 6.2 Standard Frappe APIs

`frappe.call`, `frappe.db`, `frappe.ui.form`, and `frappe.listview_settings` generally remain stable. However, prefer `frappe.db.get_doc` over manual ajax calls where possible to benefit from v16's improved caching.

------

## 7. Workspace Icons

| **Context**      | **v15**                                | **v16**                             |
| ---------------- | -------------------------------------- | ----------------------------------- |
| Sidebar icon     | `"icon": "database"` in workspace JSON | Same — still works                  |
| App landing page | Derived from workspace icon            | Requires `app_logo_url` in hooks.py |

The `icon` field in workspace JSON continues to work in v16 for the sidebar. Only the landing page behavior changed.

------

## 8. Workspace JSON and bench migrate

The `modified` timestamp inside the workspace JSON must be strictly newer than the DB record for `bench migrate` to re-import it. **Always bump this field before committing workspace changes.**

**Recommended deploy sequence:**

Bash

```
cd /path/to/bench/apps/your_app
git reset --hard origin/your-branch
# Clear cache before migrate to ensure schema states are fresh
bench --site all clear-cache
bench --site all migrate
bench build --app your_app
```

**Force workspace update (Emergency Script):**

If `bench migrate` fails to pick up changes due to timestamp conflicts:

Python

```
# Run in bench console
import frappe, json
from frappe.desk.doctype.workspace.workspace import Workspace

with open('/path/to/bench/apps/your_app/.../workspace/your_workspace.json') as f:
    data = json.load(f)

# Update content directly
frappe.db.set_value("Workspace", "Your Workspace", "content", data["content"])
frappe.db.commit()
```

------

## 9. Modules Removed from Frappe Core in v16

v16 continues the "Lean Core" initiative. Features built into v15 may now be standalone apps. If your app relies on these, you must verify their presence or declare them as dependencies in `pyproject.toml`.

| **Feature**     | **v15**  | **v16 Status**                             |
| --------------- | -------- | ------------------------------------------ |
| Energy Points   | Built-in | Moved to `frappe/eps` (check availability) |
| Newsletter      | Built-in | Likely moved to `frappe/newsletter`        |
| Offsite Backups | Built-in | Moved to `frappe/offsite_backups`          |
| Blog            | Built-in | Moved to `frappe/blog`                     |
| Webhooks        | Built-in | Remains in core (usually), but verify.     |

------

## 10. Testing Strategy

Test in both environments before releasing:

1. **Develop in v15** (Primary development environment).
2. **CI/CD Pipeline:** Configure GitHub Actions (or GitLab CI) to run tests against both `version-15` and `develop` (v16) branches of Frappe.
3. **Guard Logic:** Add conditional logic only where required, centralized in `utils/version.py`.

------

## 11. Long-Term Strategy

When v15 reaches end-of-life:

1. Remove `utils/version.py` compatibility layer.
2. Search and replace all `is_v16_or_later()` blocks.
3. Update `pyproject.toml` dependencies to `frappe = ">=16.0.0"`.

Until then: **Stability > New Features.**

------

## 12. What NOT To Do

- **No Forks:** Do not maintain two branches (e.g., `version-15` and `version-16`) unless absolutely required.
- **No Implicit Sorting:** Never rely on default sort order in DB queries.
- **No Global JS:** Do not rely on global variable scope in reports or pages.
- **No Hard Dependencies:** Do not import `frappe.email.doctype.newsletter` without a try/except block if you want to support v16 lean core.

------

## Summary Checklist

- [ ] `pyproject.toml` has `frappe = ">=15.0.0,<17.0.0"`
- [ ] `hooks.py` includes `app_logo_url` pointing to a real image
- [ ] Version detection centralized in `utils/version.py`
- [ ] All `frappe.get_all()` / `frappe.get_list()` calls have explicit `order_by`
- [ ] All `has_permission` hooks explicitly return `True` or `False`
- [ ] No `db.get_value` comparisons assume string return type (use casting)
- [ ] Schema patches use `has_column()` defensive checks
- [ ] No Report/Page JS relies on implicit global variable scope
- [ ] Workspace JSON `modified` field bumped on every change before commit
- [ ] Verified dependencies for modules potentially removed from Core (Newsletter, Blog, etc.)
- [ ] Tested on both a v15 and v16 bench before release

