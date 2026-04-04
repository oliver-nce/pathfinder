# Frappe Framework - Database Operations (Advanced)

## Overview

This document covers advanced database operations in Frappe including bulk operations, schema management, and the Query Builder API.

## Transactions (Continued from Basic)

Always commit or rollback database changes:

```python
# Commit changes to database
frappe.db.commit()

# Rollback changes
frappe.db.rollback()

# Example with error handling
try:
    frappe.db.set_value("User", "admin", "first_name", "John")
    frappe.db.set_value("User", "admin", "last_name", "Doe")
    frappe.db.commit()
except Exception as e:
    frappe.db.rollback()
    frappe.log_error(f"Update failed: {e}")
```

## Insert Operations

### Single Insert

```python
# Insert a single record
frappe.db.insert({
    "doctype": "Task",
    "subject": "New Task",
    "priority": "High"
})
frappe.db.commit()
```

### Bulk Insert

For inserting many records efficiently:

```python
# Bulk insert - much faster for many records
records = [
    {"subject": "Task 1", "priority": "High"},
    {"subject": "Task 2", "priority": "Medium"},
    {"subject": "Task 3", "priority": "Low"}
]
frappe.db.bulk_insert("Task", records)
frappe.db.commit()
```

### Bulk Insert with Ignore Duplicates

```python
frappe.db.bulk_insert("Task", records, ignore_duplicates=True)
frappe.db.commit()
```

## Delete Operations

```python
# Delete by filter
frappe.db.delete("Task", {"status": "Cancelled"})

# Delete by name
frappe.db.delete("Task", "TASK-00001")

# Delete all (use with caution!)
frappe.db.delete("Task")

frappe.db.commit()
```

## Schema Operations

### Get Table Information

```python
# Get all columns in a table
columns = frappe.db.get_table_columns("User")
# Returns: ['name', 'creation', 'modified', 'email', 'first_name', ...]

# Check if column exists
has_column = frappe.db.has_column("User", "custom_field")
```

### Index Management

```python
# Add an index
frappe.db.add_index("User", ["email", "enabled"])

# Add unique index
frappe.db.add_unique("User", ["email"])

# Check if index exists
frappe.db.has_index("tabUser", "email_enabled_index")
```

### Table Operations

```python
# Create table (rarely needed - DocTypes create tables automatically)
frappe.db.create_table("Custom Table", {
    "name": "varchar(140)",
    "data": "text"
})

# Check if table exists
frappe.db.table_exists("Custom Table")
```

## Query Builder API

Frappe provides a modern query builder for type-safe queries:

```python
from frappe.query_builder import DocType

# Define DocType reference
User = DocType("User")

# Basic select
query = (
    frappe.qb.from_(User)
    .select(User.name, User.email, User.first_name)
    .where(User.enabled == 1)
)
result = query.run(as_dict=True)
```

### Query Builder with Conditions

```python
from frappe.query_builder import DocType
from frappe.query_builder.functions import Count, Sum

User = DocType("User")

# Multiple conditions
query = (
    frappe.qb.from_(User)
    .select(User.name, User.email)
    .where(User.enabled == 1)
    .where(User.user_type == "System User")
    .orderby(User.creation, order=frappe.qb.desc)
    .limit(10)
)
result = query.run(as_dict=True)
```

### Query Builder with Joins

```python
from frappe.query_builder import DocType

User = DocType("User")
UserRole = DocType("Has Role")

query = (
    frappe.qb.from_(User)
    .join(UserRole)
    .on(User.name == UserRole.parent)
    .select(User.name, User.email, UserRole.role)
    .where(User.enabled == 1)
)
result = query.run(as_dict=True)
```

### Aggregation Functions

```python
from frappe.query_builder import DocType
from frappe.query_builder.functions import Count, Sum, Avg

Task = DocType("Task")

# Count
query = (
    frappe.qb.from_(Task)
    .select(Count(Task.name).as_("count"))
    .where(Task.status == "Open")
)

# Group by with aggregation
query = (
    frappe.qb.from_(Task)
    .select(Task.status, Count(Task.name).as_("count"))
    .groupby(Task.status)
)
result = query.run(as_dict=True)
```

## Database Utilities

```python
# Get last inserted ID
last_id = frappe.db.get_last_id()

# Escape string for SQL
safe_string = frappe.db.escape("user's input")

# Format date for SQL
formatted_date = frappe.db.format_date("2024-01-15")
```
