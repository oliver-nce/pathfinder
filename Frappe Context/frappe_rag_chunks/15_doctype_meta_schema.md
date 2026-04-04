# Frappe Framework - DocType Meta and Schema

## Overview

DocType Meta provides information about the structure and configuration of a DocType. It includes field definitions, permissions, naming rules, and other schema information.

## Getting DocType Meta

```python
# Get meta object
meta = frappe.get_meta("User")

# Meta is also accessible from document
doc = frappe.get_doc("User", "admin@example.com")
meta = doc.meta
```

## Field Information

### Get All Fields

```python
meta = frappe.get_meta("User")

# All fields
all_fields = meta.fields

# Iterate fields
for field in meta.fields:
    print(f"{field.fieldname}: {field.fieldtype}")
```

### Get Specific Field

```python
meta = frappe.get_meta("User")

# Get field by fieldname
email_field = meta.get_field("email")

# Field properties
print(email_field.fieldname)   # "email"
print(email_field.fieldtype)   # "Data"
print(email_field.label)       # "Email"
print(email_field.reqd)        # 1 (mandatory)
print(email_field.unique)      # 1 (unique field)
print(email_field.options)     # For Link/Select fields
print(email_field.default)     # Default value
```

### Check Field Existence

```python
meta = frappe.get_meta("User")

# Check if field exists
has_email = meta.has_field("email")           # True
has_custom = meta.has_field("custom_field")   # Depends

# Get field or None
field = meta.get_field("nonexistent")         # None
```

## Field Types Queries

```python
meta = frappe.get_meta("Sales Invoice")

# Get link fields
link_fields = meta.get_link_fields()
for field in link_fields:
    print(f"{field.fieldname} -> {field.options}")

# Get select fields
select_fields = meta.get_select_fields()

# Get table fields (child tables)
table_fields = meta.get_table_fields()

# Get image field
image_field = meta.get_image_field()

# Get all data fields (excludes section/column breaks)
data_fields = meta.get_data_fields()

# Get high permlevel fields
restricted_fields = meta.get_high_permlevel_fields()
```

## DocType Properties

```python
meta = frappe.get_meta("Sales Invoice")

# Basic properties
print(meta.name)              # "Sales Invoice"
print(meta.module)            # "Accounts"
print(meta.issingle)          # 0 (not a single doctype)
print(meta.istable)           # 0 (not a child table)
print(meta.is_tree)           # 0 (not a tree structure)
print(meta.is_submittable)    # 1 (can be submitted)
print(meta.is_virtual)        # 0 (has database table)

# Naming
print(meta.autoname)          # Naming rule (e.g., "naming_series:")
print(meta.name_case)         # Case handling

# Features
print(meta.track_changes)     # Track document changes
print(meta.track_seen)        # Track who viewed
print(meta.track_views)       # Track view count
print(meta.allow_rename)      # Can rename documents
print(meta.allow_copy)        # Can copy documents
print(meta.allow_import)      # Can import via Data Import
print(meta.allow_auto_repeat) # Can auto repeat
```

## Permissions

```python
meta = frappe.get_meta("User")

# Get all permission rules
for perm in meta.permissions:
    print(f"Role: {perm.role}")
    print(f"  Read: {perm.read}")
    print(f"  Write: {perm.write}")
    print(f"  Create: {perm.create}")
    print(f"  Delete: {perm.delete}")
    print(f"  Submit: {perm.submit}")
    print(f"  Cancel: {perm.cancel}")
    print(f"  Level: {perm.permlevel}")
```

## DocType Type Checks

```python
meta = frappe.get_meta("Company")

# Is it a single doctype? (only one record exists)
if meta.issingle:
    print("Single DocType - only one record")

# Is it a child table?
if meta.istable:
    print("Child Table DocType")

# Is it a tree structure?
if meta.is_tree:
    print("Tree Structure DocType")

# Is it submittable?
if meta.is_submittable:
    print("Can be submitted/cancelled")
```

## Search Fields and Title Field

```python
meta = frappe.get_meta("Customer")

# Fields used in search/link queries
search_fields = meta.search_fields  # e.g., "customer_name,customer_group"

# Field used as title
title_field = meta.title_field      # e.g., "customer_name"

# Sort field and order
sort_field = meta.sort_field        # Default sort field
sort_order = meta.sort_order        # "ASC" or "DESC"
```

## Getting Mandatory Fields

```python
meta = frappe.get_meta("Sales Order")

# Get all mandatory fields
mandatory_fields = []
for field in meta.fields:
    if field.reqd:
        mandatory_fields.append(field.fieldname)
        
print(mandatory_fields)
```

## Getting Field Options

```python
meta = frappe.get_meta("Task")

# Get options for a Select field
status_field = meta.get_field("status")
if status_field.fieldtype == "Select":
    options = status_field.options.split("\n")
    print(options)  # ["Open", "Working", "Completed", ...]

# Get linked DocType for a Link field
project_field = meta.get_field("project")
linked_doctype = project_field.options  # "Project"
```

## Creating DocType Programmatically

```python
# Create a new DocType
doctype = frappe.get_doc({
    "doctype": "DocType",
    "name": "My Custom DocType",
    "module": "Custom Module",
    "custom": 1,
    "naming_rule": "By fieldname",
    "autoname": "field:title",
    "fields": [
        {
            "fieldname": "title",
            "fieldtype": "Data",
            "label": "Title",
            "reqd": 1
        },
        {
            "fieldname": "description",
            "fieldtype": "Text Editor",
            "label": "Description"
        },
        {
            "fieldname": "status",
            "fieldtype": "Select",
            "label": "Status",
            "options": "Draft\nActive\nCompleted",
            "default": "Draft"
        }
    ],
    "permissions": [
        {
            "role": "System Manager",
            "read": 1,
            "write": 1,
            "create": 1,
            "delete": 1
        }
    ]
})
doctype.insert()
frappe.db.commit()
```

## Exporting DocType Definition

```python
# Get full doctype definition
doctype = frappe.get_doc("DocType", "Task")
definition = doctype.as_dict()

# Export to JSON
import json
json_definition = json.dumps(definition, indent=2, default=str)
```

## Clearing DocType Cache

```python
# Clear cached meta for a doctype
frappe.clear_cache(doctype="User")

# Reload meta
meta = frappe.get_meta("User")
```

## Get All DocTypes

```python
# Get all doctypes in a module
doctypes = frappe.get_all("DocType",
    filters={"module": "Core"},
    fields=["name", "module", "issingle"]
)

# Get all custom doctypes
custom_doctypes = frappe.get_all("DocType",
    filters={"custom": 1},
    fields=["name", "module"]
)

# Get all child table doctypes
child_tables = frappe.get_all("DocType",
    filters={"istable": 1},
    fields=["name", "module"]
)
```
