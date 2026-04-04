# Frappe Framework - Document ORM (Advanced)

## Overview

This document covers advanced document operations including child tables, document methods, copying, renaming, and workflow operations.

## Document Methods (Continued)

```python
doc = frappe.get_doc("Task", "TASK-00001")

# Reload from database
doc.reload()

# Convert to dictionary
data = doc.as_dict()

# Convert to JSON
json_str = doc.as_json()

# Get only valid fields (excludes internal fields)
valid_data = doc.get_valid_dict()
```

## Working with Child Tables

Child tables (Table fields) are stored as lists on the parent document:

```python
# Get parent document with children
invoice = frappe.get_doc("Sales Invoice", "SINV-00001")

# Access child table
for item in invoice.items:
    print(item.item_code, item.qty, item.rate)

# Add new child row
invoice.append("items", {
    "item_code": "ITEM-001",
    "qty": 5,
    "rate": 100
})
invoice.save()

# Remove child row
invoice.items = [item for item in invoice.items if item.item_code != "ITEM-001"]
invoice.save()
```

### Creating Document with Child Tables

```python
invoice = frappe.get_doc({
    "doctype": "Sales Invoice",
    "customer": "Customer Name",
    "items": [
        {
            "item_code": "ITEM-001",
            "qty": 2,
            "rate": 100
        },
        {
            "item_code": "ITEM-002",
            "qty": 1,
            "rate": 200
        }
    ]
})
invoice.insert()
frappe.db.commit()
```

### Modifying Child Table Rows

```python
invoice = frappe.get_doc("Sales Invoice", "SINV-00001")

# Modify existing row
for item in invoice.items:
    if item.item_code == "ITEM-001":
        item.qty = 10
        item.rate = 150

# Clear all rows
invoice.set("items", [])

# Replace all rows
invoice.set("items", [
    {"item_code": "NEW-001", "qty": 1, "rate": 500}
])

invoice.save()
frappe.db.commit()
```

## Copying Documents

```python
# Copy a document
original = frappe.get_doc("Task", "TASK-00001")
new_doc = frappe.copy_doc(original)

# Modify the copy
new_doc.subject = "Copy of " + new_doc.subject

# Insert as new document
new_doc.insert()
frappe.db.commit()
```

### Copy with Amendments

```python
# For amended documents (like Sales Invoice)
original = frappe.get_doc("Sales Invoice", "SINV-00001")
amended = frappe.copy_doc(original)
amended.amended_from = original.name
amended.insert()
frappe.db.commit()
```

## Renaming Documents

```python
# Rename a document
frappe.rename_doc("Task", "TASK-00001", "TASK-NEW-00001")
frappe.db.commit()

# Rename with merge (combine two documents)
frappe.rename_doc("Customer", "Old Customer", "New Customer", merge=True)
frappe.db.commit()
```

## Submittable Documents

Some DocTypes support submission workflow (Draft → Submitted → Cancelled):

```python
# Create and submit
invoice = frappe.get_doc({
    "doctype": "Sales Invoice",
    "customer": "Customer",
    "items": [{"item_code": "ITEM", "qty": 1, "rate": 100}]
})
invoice.insert()
invoice.submit()  # docstatus changes from 0 to 1
frappe.db.commit()

# Cancel a submitted document
invoice = frappe.get_doc("Sales Invoice", "SINV-00001")
invoice.cancel()  # docstatus changes from 1 to 2
frappe.db.commit()
```

### Check Document Status

```python
doc = frappe.get_doc("Sales Invoice", "SINV-00001")

# docstatus values
# 0 = Draft
# 1 = Submitted
# 2 = Cancelled

if doc.docstatus == 0:
    print("Draft")
elif doc.docstatus == 1:
    print("Submitted")
elif doc.docstatus == 2:
    print("Cancelled")
```

## Comments and Activity

```python
doc = frappe.get_doc("Task", "TASK-00001")

# Add a comment
doc.add_comment("Comment", "This is a comment on the task")

# Add different comment types
doc.add_comment("Info", "Information message")
doc.add_comment("Edit", "Document was edited")
doc.add_comment("Shared", "Document was shared")

# Get comments
comments = frappe.get_all("Comment", 
    filters={
        "reference_doctype": "Task",
        "reference_name": "TASK-00001"
    },
    fields=["content", "comment_by", "creation"]
)
```

## Tags

```python
doc = frappe.get_doc("Task", "TASK-00001")

# Add tag
doc.add_tag("Important")
doc.add_tag("Urgent")

# Get document tags
tags = doc.get_tags()

# Remove tag
doc.remove_tag("Important")

# Find documents by tag
tasks = frappe.get_all("Task", filters={"_user_tags": ["like", "%Important%"]})
```

## Running Document Methods

```python
doc = frappe.get_doc("Task", "TASK-00001")

# Run a custom method defined in the DocType class
doc.run_method("my_custom_method", arg1="value1")

# Run with return value
result = doc.run_method("calculate_something")
```

## Flags

Flags are temporary attributes that don't persist:

```python
doc = frappe.get_doc("Task", "TASK-00001")

# Set a flag
doc.flags.ignore_permissions = True
doc.flags.ignore_validate = True

# Check flag
if doc.flags.get("ignore_permissions"):
    print("Permissions ignored")

# Common flags
doc.flags.ignore_permissions    # Skip permission checks
doc.flags.ignore_validate       # Skip validate method
doc.flags.ignore_mandatory      # Skip mandatory field checks
doc.flags.ignore_links          # Skip link validation
```
