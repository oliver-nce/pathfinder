# Frappe Framework - Document ORM (Basic)

## Overview

Frappe's ORM (Object-Relational Mapping) allows you to work with database records as Python objects. Documents are instances of DocTypes and provide a clean API for CRUD operations.

## Getting Documents

### Get by Name

```python
# Get a single document by name
user = frappe.get_doc("User", "admin@example.com")

# Access fields
print(user.first_name)
print(user.email)
print(user.enabled)
```

### Get by Filters

```python
# Get document matching filters
user = frappe.get_doc("User", {"email": "admin@example.com"})

# This throws an error if multiple matches found
# Use frappe.get_all() for multiple results
```

### Get with Error Handling

```python
# Check if document exists first
if frappe.db.exists("User", "admin@example.com"):
    user = frappe.get_doc("User", "admin@example.com")
else:
    print("User not found")

# Or use try/except
try:
    user = frappe.get_doc("User", "nonexistent@example.com")
except frappe.DoesNotExistError:
    print("User not found")
```

## Creating Documents

### Using new_doc

```python
# Create new document
task = frappe.new_doc("Task")
task.subject = "Complete Documentation"
task.priority = "High"
task.description = "Write comprehensive docs"
task.save()
frappe.db.commit()
```

### Using get_doc with Dict

```python
# Create using dictionary
task = frappe.get_doc({
    "doctype": "Task",
    "subject": "Complete Documentation",
    "priority": "High",
    "description": "Write comprehensive docs"
})
task.insert()
frappe.db.commit()
```

### Insert vs Save

```python
# insert() - for new documents only
doc = frappe.get_doc({"doctype": "Task", "subject": "New"})
doc.insert()  # Creates new record

# save() - for new or existing documents
doc = frappe.new_doc("Task")
doc.subject = "New Task"
doc.save()  # Creates if new, updates if existing

# For existing documents
doc = frappe.get_doc("Task", "TASK-00001")
doc.status = "Completed"
doc.save()  # Updates existing record
```

## Updating Documents

### Standard Update

```python
# Get, modify, save
doc = frappe.get_doc("Task", "TASK-00001")
doc.status = "Completed"
doc.priority = "Low"
doc.save()
frappe.db.commit()
```

### Update Without Events (db_set)

```python
# Update directly in DB without triggering hooks
doc = frappe.get_doc("Task", "TASK-00001")
doc.db_set("status", "Completed")

# Update multiple fields
doc.db_set({
    "status": "Completed",
    "priority": "Low"
})

# No need to call save() or commit() - db_set commits automatically
```

### Bulk Update

```python
# Update multiple documents matching filter
frappe.db.set_value("Task", {"status": "Open"}, "priority", "High")
frappe.db.commit()
```

## Deleting Documents

```python
# Delete by doctype and name
frappe.delete_doc("Task", "TASK-00001")
frappe.db.commit()

# Force delete (skip permissions)
frappe.delete_doc("Task", "TASK-00001", force=True)

# Delete from document object
doc = frappe.get_doc("Task", "TASK-00001")
doc.delete()
frappe.db.commit()
```

## Document Properties

```python
doc = frappe.get_doc("Task", "TASK-00001")

# Standard fields (all documents have these)
doc.name          # Primary key
doc.owner         # Created by user
doc.creation      # Created datetime
doc.modified      # Last modified datetime
doc.modified_by   # Last modified by user
doc.docstatus     # 0=Draft, 1=Submitted, 2=Cancelled
doc.doctype       # The DocType name

# Check document state
doc.is_new()      # True if not yet saved
doc.has_value_changed("status")  # True if field changed
```

## Document Methods

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
