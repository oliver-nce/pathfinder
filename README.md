# Pathfinder

Visual field-path navigator for Frappe — create virtual fields by traversing DocType link chains.

## Installation

```bash
cd ~/frappe-bench
bench get-app pathfinder /path/to/pathfinder
bench --site <sitename> install-app pathfinder
```

## Usage

### Python API

```python
import frappe

# Get field metadata for browsing
fields = frappe.call("pathfinder.api.get_doctype_fields", doctype="Customer")

# Resolve a virtual field value
result = frappe.call("pathfinder.api.resolve_virtual_fields",
                     doctype="Sales Order", docname="SAL-ORD-00001")

# Resolve a single path with both output formats
result = frappe.call("pathfinder.api.resolve_single_path",
                     doctype="Sales Order", docname="SAL-ORD-00001",
                     path="customer.territory.name")
# Returns: {value: "...", frappe_path: "customer.territory.name", jinja_tag: "{{ doc.customer.territory.name }}"}

# Build a Jinja tag without resolving
tag = frappe.call("pathfinder.api.build_jinja_tag",
                  doctype="Sales Order", path="customer.email_id")
```

### Virtual Fields

Create `Pathfinder Virtual Field` records via Desk or API to define virtual fields on any DocType. They automatically resolve on document load via the `onload` hook.

### Frontend Components

Import Vue components in your app's build:

```typescript
import { PathFinderCore, PathFinderDialog } from "pathfinder"
```

## Architecture

- **Many-to-One (Phase 1):** Follow Link fields in the drill-down direction. Single value returned.
- **One-to-Many (Phase 2):** Traverse child tables for recordset building. Multiple values returned.

## License

MIT
