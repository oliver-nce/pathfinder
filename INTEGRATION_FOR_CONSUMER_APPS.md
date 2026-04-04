# Pathfinder — Integration Guide for Consumer Apps

> **Audience:** Coding agents (Qwen Coder, etc.) receiving instructions to integrate Pathfinder into another Frappe app.
> **Prerequisite:** `pathfinder` app installed on the same Frappe bench as the consumer app.
> **No copying or vendoring required.** Everything is consumed from the installed `pathfinder` package.

---

## 1. INSTALLATION (PREREQUISITE)

The consumer app does **not** bundle pathfinder code. Pathfinder is installed at bench level.

```bash
cd ~/frappe-bench
bench get-app https://github.com/oliver-nce/Pathfinder.git
bench --site <sitename> install-app pathfinder
bench build --app pathfinder
bench restart
```

After this, all pathfinder endpoints, DocTypes, and frontend bundles are available to every app on that bench.

---

## 2. BACKEND INTEGRATION

### 2.1 Direct Python API (server-side calls)

Import pathfinder endpoints directly in the consumer app's Python code. All endpoints are whitelisted `@frappe.whitelist()` functions and can also be called as normal Python functions server-side.

```python
# Import from the installed pathfinder package
from pathfinder.api.pathfinder_api import (
    resolve_virtual_fields,
    resolve_single_path,
    build_jinja_tag,
    get_virtual_fields,
    get_doctype_fields,
)
```

**Usage pattern — resolve virtual fields for a document:**

```python
result = resolve_virtual_fields("Sales Order", "SAL-ORD-0001")
# Returns: {
#   "Customer Territory": {
#     "value": "North America",
#     "path": "customer.territory.name",
#     "jinja_tag": "{{ doc.customer.territory.name }}",
#     "fieldtype": "Data",
#   },
#   ...
# }
```

**Usage pattern — resolve an arbitrary path (no virtual field record needed):**

```python
result = resolve_single_path("Sales Order", "SAL-ORD-0001", "customer.territory.name")
# Returns: {
#   "value": "North America",
#   "frappe_path": "customer.territory.name",
#   "jinja_tag": "{{ doc.customer.territory.name }}",
# }
```

**Usage pattern — generate a Jinja tag without resolving:**

```python
tag = build_jinja_tag("Sales Order", "customer.territory.name")
# Returns: "{{ doc.customer.territory.name }}"
```

### 2.2 Client-side via frappe.call (JS)

All pathfinder endpoints are whitelisted and callable from the consumer app's JS:

```javascript
frappe.call({
  method: "pathfinder.api.pathfinder_api.resolve_virtual_fields",
  args: { doctype: "Sales Order", docname: "SAL-ORD-0001" },
  callback: (r) => {
    console.log(r.message); // { "Customer Territory": { value, path, jinja_tag }, ... }
  },
});
```

```javascript
frappe.call({
  method: "pathfinder.api.pathfinder_api.resolve_single_path",
  args: {
    doctype: "Sales Order",
    docname: "SAL-ORD-0001",
    path: "customer.territory.name",
  },
  callback: (r) => {
    console.log(r.message.value);
    console.log(r.message.jinja_tag);
  },
});
```

### 2.3 Path utilities (zero Frappe dependencies)

```python
from pathfinder.utils.path_utils import (
    validate_field_path,
    bind_path_finder_to_field,
    create_field_from_path,
    get_terminal_field_name,
    get_parent_path,
    is_direct_field,
    format_path_for_display,
)
```

These have zero Frappe imports and can be used in standalone scripts, tests, or non-Frappe contexts.

### 2.4 Virtual field definitions (DocType CRUD)

Virtual fields are stored as `Pathfinder Virtual Field` DocType records. Create them programmatically:

```python
vf = frappe.get_doc({
    "doctype": "Pathfinder Virtual Field",
    "source_doctype": "Sales Order",
    "field_label": "Customer Territory",
    "field_path": "customer.territory.name",
    "show_in_form": 1,
    "show_in_list": 0,
    "column_order": 1,
    "enabled": 1,
    "description": "Territory of the linked customer",
}).insert()
```

On `.insert()` or `.save()`, the controller auto-resolves `terminal_fieldtype` and `terminal_options` by walking the path through DocType metadata. No manual assignment needed.

---

## 3. FRONTEND INTEGRATION (VUE COMPONENTS)

### 3.1 How the bundle works

Pathfinder's frontend is built as a **Vite ES module library**:
- Entry: `pathfinder/frontend/src/main.js`
- Output: `pathfinder/public/js/pathfinder.bundle.js`
- Format: ES modules (`formats: ["es"]`)
- Exported on `window.Pathfinder` namespace via Frappe's asset system

The bundle is **already loaded on every Desk page** via `hooks.py`:
```python
app_include_js = "/assets/pathfinder/js/pathfinder.bundle.js"
```

No extra bundle registration or `build.json` config is needed in the consumer app.

### 3.2 Available components

| Component | Purpose |
|-----------|---------|
| `PathFinderCore` | Multi-column navigator (root component) |
| `PathFinderPanel` | Full panel with DocType selector + dual-output buttons |
| `PathFinderDialog` | Tabbed dialog (field paths + whitelisted methods) |
| `PathFinderPanelDesigner` | Thin wrapper — path-only selection for designer contexts |
| `PathColumn` | Single column of fields (used internally by PathFinderCore) |

### 3.3 Embedding in a consumer app's Vue component

If the consumer app has its own Vue 3 build system, it can import the raw source files directly:

```javascript
// Import from pathfinder source (if consuming app can resolve the path)
import { PathFinderPanel } from "../../pathfinder/frontend/src/components/PathFinderPanel.vue";
import { PathFinderDialog } from "../../pathfinder/frontend/src/components/PathFinderDialog.vue";
import { useFieldMeta } from "../../pathfinder/frontend/src/composables/useFieldMeta.ts";
```

**Required peer dependencies** in the consumer app's `package.json`:
```json
{
  "dependencies": {
    "vue": "^3.3.0",
    "frappe-ui": "^0.1.0"
  }
}
```

If the consumer app does not use `frappe-ui`, it must install it. The pathfinder components depend on frappe-ui primitives.

### 3.4 Using the pre-built bundle in Desk JS

For non-Vue consumer apps (classic Frappe Desk pages), the components are NOT available as global Vue components from the bundle. The bundle is an ES module built for import/require usage, not a UMD/global build.

**If Desk integration is needed without Vue**, the consumer app must either:
- Build its own Vue component that imports pathfinder sources (see 3.3)
- Or use pathfinder via `frappe.call` API only (backend-only integration, no UI)

### 3.5 PathFinderPanel usage example

```vue
<template>
  <PathFinderPanel
    :root-doctype="'Sales Order'"
    mode="select"
    @path-selected="onPathSelected"
    @jinja-tag-selected="onJinjaSelected"
    @virtual-field-created="onVirtualFieldCreated"
  />
</template>

<script setup>
import { PathFinderPanel } from "../pathfinder/frontend/src/components/PathFinderPanel.vue";

function onPathSelected({ doctype, path, segments }) {
  console.log("User selected:", path); // e.g. "customer.territory.name"
  // path = Frappe dot-notation for virtual fields
}

function onJinjaSelected({ doctype, path, jinja_tag }) {
  console.log("Jinja tag:", jinja_tag); // e.g. "{{ doc.customer.territory.name }}"
  // Use jinja_tag in email/SMS templates
}

function onVirtualFieldCreated({ virtual_field_doc }) {
  // A new Pathfinder Virtual Field record was saved
}
</script>
```

### 3.6 PathFinderDialog usage example

```vue
<template>
  <PathFinderDialog
    :doctype="'Sales Order'"
    :model-value="showDialog"
    @update:model-value="showDialog = $event"
  />
</template>

<script setup>
import { ref } from "vue";
import { PathFinderDialog } from "../pathfinder/frontend/src/components/PathFinderDialog.vue";

const showDialog = ref(false);
</script>
```

### 3.7 useFieldMeta composable usage

```typescript
import { fetchDoctypeFields, findField, resolveNestedFieldMeta, invalidateCache } from "../pathfinder/frontend/src/composables/useFieldMeta.ts";

// Fetch field metadata for a DocType (cached, deduped)
const fields = await fetchDoctypeFields("Sales Order");

// Find a specific field
const customerField = findField(fields, "customer");

// Resolve nested field meta (for link chains)
const terminal = await resolveNestedFieldMeta("Sales Order", "customer.territory.name");

// Invalidate cache (e.g. after DocType customization)
invalidateCache("Sales Order");
```

---

## 4. DESK INTEGRATION (PHASE 3 — PLANNED)

When Phase 3 is complete, the following will be available:

### 4.1 VirtualFieldManager page
- Route: `/app/pathfinder` (or custom route via `website_route_rules` in hooks.py)
- Vue SPA for CRUD operations on virtual field definitions
- Uses `PathFinderPanel` for path selection

### 4.2 Custom Desk control (`pathfinder_control.js`)
- Drop-in control for any DocType form
- Opens `PathFinderDialog` on click
- Returns selected path to the host form field

### 4.3 Consumer app hook registration

If the consumer app wants to add its own Desk pages that use pathfinder:

```python
# In consumer app's hooks.py
website_route_rules = [
    {
        "from_route": "/app/consumer-app/pathfinder",
        "to_route": "/app/pathfinder",  # pathfinder's VirtualFieldManager
    }
]
```

Or embed the control in a custom DocType form via `custom_js`:
```javascript
// In consumer app's public/js/consumer_custom_script.js
frappe.ui.form.on("My DocType", {
  refresh(frm) {
    frm.add_field("pathfinder_selector", {
      fieldtype: "Pathfinder Selector",  // after Phase 3 control is registered
      label: "Select Path",
    });
  }
});
```

---

## 5. HOOKS THE CONSUMER APP SHOULD KNOW ABOUT

### 5.1 Automatic onload injection (no action needed)

Pathfinder registers a `doc_events["*"]["onload"]` hook that automatically resolves virtual field values and attaches them to `doc._virtual_fields` on every document load.

**Zero-cost:** Redis cache (`pathfinder:doctypes_with_vfields`) gates all DB queries. If no virtual fields exist for a doctype, the hook returns immediately.

**Result available in client scripts:**
```javascript
frappe.ui.form.on("Sales Order", {
  onload(frm) {
    frappe.call({
      method: "pathfinder.api.pathfinder_api.resolve_virtual_fields",
      args: { doctype: frm.doctype, docname: frm.docname },
      callback: (r) => {
        // r.message has { label: { value, path, jinja_tag, fieldtype } }
        frm.set_value("custom_customer_territory", r.message["Customer Territory"]?.value);
      },
    });
  },
});
```

### 5.2 Permission model

All pathfinder whitelisted endpoints call `frappe.has_permission(doctype, throw=True)` before any operation. The consumer app does **not** need to add permission checks when calling pathfinder APIs — they are enforced server-side.

If a user lacks read permission on a linked DocType in the chain, `_resolve_path` returns `None` (does not throw).

---

## 6. DEPENDENCY CHECKLIST FOR CONSUMER APP

### Backend only (API calls)
- [ ] `pathfinder` app installed on bench
- [ ] No additional `requirements.txt` or `pyproject.toml` entries needed
- [ ] No hooks.py changes needed

### Frontend (Vue components)
- [ ] `pathfinder` app installed on bench
- [ ] `bench build --app pathfinder` run after install
- [ ] Consumer app has `vue` ^3.3.0 in its `package.json`
- [ ] Consumer app has `frappe-ui` ^0.1.0 in its `package.json`
- [ ] Consumer app's build system can resolve `../pathfinder/frontend/src/` imports (or uses absolute bench path)

### Full Desk integration (Phase 3)
- [ ] All of the above
- [ ] Consumer app registers routes in its own `hooks.py` if it needs custom pathfinder pages

---

## 7. COMMON INTEGRATION PATTERNS

### Pattern A: Virtual fields displayed on a DocType form

1. Create `Pathfinder Virtual Field` records for the target DocType (via Desk or programmatically)
2. The `onload` hook auto-attaches values to `doc._virtual_fields`
3. Consumer app's client script reads them and displays in a custom section:

```javascript
frappe.ui.form.on("Sales Order", {
  refresh(frm) {
    if (frm.doc._virtual_fields) {
      // Add a custom section to the form
      frm.dashboard.add_section(
        Object.entries(frm.doc._virtual_fields)
          .map(([label, value]) => `<div><b>${label}:</b> ${value}</div>`)
          .join("")
      );
    }
  }
});
```

### Pattern B: Jinja tags inserted into a template editor

1. User opens `PathFinderPanel` in the consumer app's template editor
2. User navigates path and clicks "Use Jinja Tag"
3. Consumer app receives `jinja-tag-selected` event
4. Consumer app inserts the tag at cursor position in the template:

```vue
<PathFinderPanel
  :root-doctype="templateDocType"
  mode="select"
  @jinja-tag-selected="insertJinjaTag"
/>

<script setup>
function insertJinjaTag({ jinja_tag }) {
  // Insert jinja_tag at cursor in template textarea
  const textarea = document.querySelector(".template-editor");
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  textarea.value =
    textarea.value.substring(0, start) + jinja_tag + textarea.value.substring(end);
}
</script>
```

### Pattern C: Bulk resolution for reports/exports

```python
from pathfinder.api.pathfinder_api import resolve_virtual_fields

# Resolve virtual fields for all Sales Orders
orders = frappe.get_all("Sales Order", fields=["name"])
for order in orders:
    vf = resolve_virtual_fields("Sales Order", order.name)
    print(f"{order.name}: Customer Territory = {vf.get('Customer Territory', {}).get('value')}")
```

---

## 8. PATHFINDER API REFERENCE (QUICK LOOKUP)

| Endpoint | Method | Args | Returns |
|----------|--------|------|---------|
| `get_doctype_fields` | `GET/POST` | `doctype: str` | `list[dict]` — field metadata |
| `get_whitelisted_methods` | `GET/POST` | `doctype: str` | `list[str]` — whitelisted method names |
| `get_virtual_fields` | `GET/POST` | `doctype: str` | `list[dict]` — enabled virtual field defs |
| `resolve_virtual_fields` | `GET/POST` | `doctype, docname: str` | `dict` — {label: {value, path, jinja_tag, fieldtype}} |
| `resolve_single_path` | `GET/POST` | `doctype, docname, path: str` | `dict` — {value, frappe_path, jinja_tag} |
| `build_jinja_tag` | `GET/POST` | `doctype, path: str` | `str` — Jinja template tag |
| `inject_virtual_fields` | Internal | `doc, method` | Mutates `doc._virtual_fields` (onload hook) |

**Full module path for imports:** `pathfinder.api.pathfinder_api`
**Clean re-exports available at:** `pathfinder.api` (via `__init__.py`)

---

## 9. TROUBLESHOOTING

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ModuleNotFoundError: No module named 'pathfinder'` | pathfinder not installed on bench | `bench get-app` + `bench install-app` |
| `pathfinder.bundle.js` 404 | bundle not built | `bench build --app pathfinder` |
| `resolve_virtual_fields` returns `{}` | No virtual field definitions exist for this doctype | Create `Pathfinder Virtual Field` records first |
| `value: None` for a path | Broken link chain or permission issue | Check that all intermediate Link fields have values and user has read permission |
| Vue import fails | pathfinder source path not resolvable | Use absolute path: `../../pathfinder/frontend/src/components/...` or symlink |
| frappe-ui missing in consumer app | Consumer app doesn't depend on frappe-ui | Add `frappe-ui` to consumer app's `package.json` |
| Cache serving stale metadata | DocType customized but pathfinder cache not cleared | `frappe.clear_cache(doctype="...")` or restart bench |
