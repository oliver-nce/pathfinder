# Pathfinder — Project Handoff

> **Date:** 2026-04-04
> **Status:** Phase 1 complete, ready for Phase 2 or Phase 3
> **Repo:** https://github.com/oliver-nce/Pathfinder

---

## What This Project Is

Pathfinder is a standalone Frappe v15 app that lets users browse DocType link chains visually (multi-column navigator) and create **virtual fields** — dot-notation paths that resolve values across linked documents at runtime.

**Key feature:** Every path selection returns **dual output**:
1. **Frappe path** — `customer.territory.name` → used for virtual fields, Vue form display
2. **Jinja tag** — `{{ doc.customer.territory.name }}` → used for email/SMS/text templates

**Phase 1 (complete):** Many-to-One traversal — follows Link fields only (drill-down direction, single value returned).

**Phase 2 (planned):** One-to-Many — traverses child Table fields for recordset building. Code has placeholder comments (`PHASE 2 — ONE-TO-MANY EXTENSION`) at all insertion points.

---

## What's Done

### Backend (all in `api/pathfinder_api.py`)
| Endpoint | Purpose |
|----------|---------|
| `get_doctype_fields` | Returns field metadata for a DocType (excludes layout fields) |
| `get_whitelisted_methods` | Returns whitelisted controller methods for a DocType |
| `get_virtual_fields` | Lists all enabled virtual field definitions for a DocType |
| `resolve_virtual_fields` | Resolves ALL virtual fields for a document, returns values + both output formats |
| `resolve_single_path` | Resolves ONE path, returns `{value, frappe_path, jinja_tag}` |
| `build_jinja_tag` | Generates Jinja tag from doctype + path |
| `inject_virtual_fields` | `doc_events["*"]["onload"]` hook — attaches resolved values to `doc._virtual_fields` (zero-cost via Redis cache) |

### Core Resolvers
- `_resolve_path(doc, path)` — Many-to-One link chain walker
- `_build_jinja_tag(doctype, path)` — Jinja tag generator

### DocType
- `pathfinder/doctype/pathfinder_virtual_field/` — stores virtual field definitions
- Controller auto-resolves `terminal_fieldtype` and `terminal_options` on save

### Frontend (Vue 3 + frappe-ui)
- `PathFinderCore.vue` — multi-column navigator with drill-down
- `PathColumn.vue` — single column with color-coded field types
- `PathFinderDialog.vue` — tabbed dialog (field path + button actions)
- `PathFinderPanel.vue` — refactored, event-driven (no NCE Studio coupling)
- `PathFinderPanelDesigner.vue` — thin wrapper for designer contexts
- `useFieldMeta.ts` — cached composable for field metadata
- `types/index.ts` — FieldMeta, PathSegment, FieldPath
- `path_utils.py` — portable path utilities (Python port of formBinding.ts)

### Tests
- `api/test_pathfinder_api.py` — backend API tests
- `pathfinder/doctype/.../test_pathfinder_virtual_field.py` — DocType validation tests
- `frontend/src/tests/pathUtils.test.js` — Vitest tests for path utilities

### Index
- `CODE_INDEX.json` — machine-readable module index (same format as NCE_Sync)

---

## What's NOT Done

### Phase 2 — One-to-Many (not started)
Placeholder comments exist at these locations:

| File | Location | What to add |
|------|----------|-------------|
| `api/pathfinder_api.py` | `_resolve_path()` | Table field iteration, `_resolve_table_path()` function |
| `api/pathfinder_api.py` | `_resolve_path()` | Dynamic Link resolution from companion field |
| `api/pathfinder_api.py` | `_build_jinja_tag()` | `{% for row in doc.items %}` loop generation |
| `api/pathfinder_api.py` | `inject_virtual_fields()` | Aggregated child value attachment |
| `pathfinder/doctype/.../pathfinder_virtual_field.py` | `_resolve_terminal_metadata()` | Table field type resolution |

### Phase 3 — Desk Integration (not started)
Per the extraction plan (§3.4):
- `frontend/src/desk/VirtualFieldManager.vue` — management UI (CRUD virtual fields)
- `frontend/src/desk/pathfinder_control.js` — custom Frappe control for Desk forms
- Bundle via `bench build --app pathfinder`
- Register page route in `hooks.py` `website_route_rules`

### Migration (not started)
NCE Studio → pathfinder dependency migration per plan §4.

---

## Source Files Used

All frontend components were extracted/adapted from:
- `NCE Studio/studio/frontend/src/nce/components/PathFinder/` (Vue components)
- `NCE Studio/studio/frontend/src/nce/composables/useFieldMeta.ts`
- `NCE Studio/studio/frontend/src/nce/utils/formBinding.ts`
- `NCE Studio/studio/frontend/src/nce/types/index.ts`
- `NCE Studio/studio/studio/api/__init__.py` (get_doctype_fields)

TagFinder in NCE_Events was reviewed for Jinja tag generation patterns.

---

## Key Design Decisions

1. **Table fields:** Excluded from Phase 1. Return type for child table traversal is ambiguous (first child? all? sum?). Phase 2 should define the aggregation strategy.
2. **Dynamic Link fields:** Excluded from Phase 1. Target doctype is only known at runtime.
3. **Dual output:** Every resolver returns both Frappe path AND Jinja tag — consuming app picks what it needs.
4. **Zero-cost onload hook:** Redis cache (`pathfinder:doctypes_with_vfields`) gates all DB queries. If no virtual fields exist for a doctype, the hook returns immediately.
5. **Event-driven Panel:** PathFinderPanel has no NCE Studio imports. Emits `path-selected` and `jinja-tag-selected` — consuming apps decide what to do with the output.
6. **Permissions:** All whitelisted endpoints include `frappe.has_permission()` checks. `_resolve_path` returns None (not throws) on broken links or permission issues.

---

## How to Install

```bash
cd ~/frappe-bench
bench get-app https://github.com/oliver-nce/Pathfinder.git
bench --site <sitename> install-app pathfinder
bench build --app pathfinder   # after Phase 3 frontend is complete
```

---

## Relevant Files

| File | Purpose |
|------|---------|
| `PATHFINDER_EXTRACTION_PLAN.md` | Original extraction plan — full spec |
| `CODE_INDEX.json` | Machine-readable module index |
| `hooks.py` | Frappe app configuration |
| `api/pathfinder_api.py` | All 7 API endpoints + core resolvers |
| `pathfinder/doctype/pathfinder_virtual_field/` | DocType definition |
| `frontend/src/components/PathFinderPanel.vue` | Refactored panel (no Studio coupling) |
| `frontend/src/composables/useFieldMeta.ts` | Cached field metadata composable |
| `pathfinder/utils/path_utils.py` | Portable path utilities |

---

## Open Questions (from plan §7)

1. **Table field traversal:** What should virtual fields return for child table paths? First child? Comma-separated list? JSON array? Aggregation (sum, count, max)?
2. **Performance at scale:** `doc_events["*"]["onload"]` — the current Redis cache approach handles this, but should we also batch-resolve on first load and serve from doc cache?
3. **Dynamic Link fields:** Support at runtime (read companion field for target doctype) or exclude from virtual field creation?
4. **Custom app dependency:** NCE Studio will depend on pathfinder. Migration path: keep PathFinder files in NCE Studio temporarily with deprecation warnings, remove in next major version.
