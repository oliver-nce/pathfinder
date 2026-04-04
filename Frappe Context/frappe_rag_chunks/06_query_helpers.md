# Frappe Framework - Query Helpers

## Overview

Frappe provides several helper functions for querying documents without writing raw SQL. These include `frappe.get_all()`, `frappe.get_list()`, `frappe.get_value()`, and `frappe.get_cached_value()`.

## frappe.get_all()

The most versatile query function. Ignores user permissions.

### Basic Usage

```python
# Get all enabled users
users = frappe.get_all("User", filters={"enabled": 1})
# Returns: [{"name": "user1@example.com"}, {"name": "user2@example.com"}]

# Get specific fields
users = frappe.get_all("User",
    filters={"enabled": 1},
    fields=["name", "email", "first_name", "last_name"]
)
```

### Filter Operators

```python
# Equals (default)
frappe.get_all("Task", filters={"status": "Open"})

# Not equals
frappe.get_all("Task", filters={"status": ["!=", "Completed"]})

# Greater than / Less than
frappe.get_all("Task", filters={"creation": [">", "2024-01-01"]})
frappe.get_all("Task", filters={"priority_score": [">=", 5]})

# Like (pattern matching)
frappe.get_all("User", filters={"email": ["like", "%@example.com"]})

# In (list of values)
frappe.get_all("Task", filters={"status": ["in", ["Open", "Working"]]})

# Not in
frappe.get_all("Task", filters={"status": ["not in", ["Completed", "Cancelled"]]})

# Between
frappe.get_all("Task", filters={"creation": ["between", ["2024-01-01", "2024-12-31"]]})

# Is null / Is not null
frappe.get_all("Task", filters={"assigned_to": ["is", "not set"]})
frappe.get_all("Task", filters={"assigned_to": ["is", "set"]})
```

### OR Filters

```python
# Combine AND and OR conditions
tasks = frappe.get_all("Task",
    filters={"status": "Open"},  # AND condition
    or_filters=[                  # OR conditions
        {"priority": "High"},
        {"assigned_to": "admin@example.com"}
    ]
)
```

### Ordering and Pagination

```python
tasks = frappe.get_all("Task",
    filters={"status": "Open"},
    fields=["name", "subject", "creation"],
    order_by="creation desc",       # Sort order
    limit_start=0,                   # Offset (skip first N)
    limit_page_length=20             # Limit (max results)
)
```

### Group By

```python
# Group and count
task_counts = frappe.get_all("Task",
    fields=["status", "count(name) as count"],
    group_by="status"
)
# Returns: [{"status": "Open", "count": 5}, {"status": "Completed", "count": 10}]
```

### Pluck (Get Single Field as List)

```python
# Get just names as a flat list
task_names = frappe.get_all("Task",
    filters={"status": "Open"},
    pluck="name"
)
# Returns: ["TASK-001", "TASK-002", "TASK-003"]
```

## frappe.get_list()

Similar to `get_all()` but respects user permissions:

```python
# Only returns documents the current user has permission to read
tasks = frappe.get_list("Task",
    filters={"status": "Open"},
    fields=["name", "subject"]
)
```

### get_all vs get_list

```python
# get_all - ignores permissions (use for backend operations)
all_tasks = frappe.get_all("Task", filters={"status": "Open"})

# get_list - respects permissions (use when showing to users)
user_tasks = frappe.get_list("Task", filters={"status": "Open"})
```

## frappe.get_value()

Get field value(s) for a single document:

```python
# Single field
email = frappe.get_value("User", "admin@example.com", "email")

# Multiple fields as tuple
first, last = frappe.get_value("User", "admin@example.com", ["first_name", "last_name"])

# Multiple fields as dict
user_data = frappe.get_value("User", "admin@example.com", 
    ["first_name", "last_name", "email"], 
    as_dict=True
)
# Returns: {"first_name": "Admin", "last_name": "User", "email": "admin@example.com"}

# With filters instead of name
email = frappe.get_value("User", {"enabled": 1, "user_type": "System User"}, "email")
```

## frappe.get_cached_value()

Like `get_value()` but caches the result for faster repeated access:

```python
# Cached - faster for frequently accessed values
email = frappe.get_cached_value("User", "admin@example.com", "email")

# Good for:
# - Configuration values
# - Frequently accessed master data
# - Values that don't change often
```

## frappe.get_single_value()

For Single DocTypes (settings, configurations):

```python
# Get value from Single DocType
country = frappe.get_single_value("System Settings", "country")
time_zone = frappe.get_single_value("System Settings", "time_zone")
```

## frappe.get_last_doc()

Get the most recent document:

```python
# Get most recent task
last_task = frappe.get_last_doc("Task")

# With filters
last_open_task = frappe.get_last_doc("Task", filters={"status": "Open"})

# Specify order
last_task = frappe.get_last_doc("Task", order_by="creation desc")
```

## Combining Queries

```python
# Example: Get all open tasks assigned to current user with their child items
tasks = frappe.get_all("Task",
    filters={
        "status": "Open",
        "assigned_to": frappe.session.user
    },
    fields=["name", "subject", "priority", "creation"],
    order_by="priority desc, creation desc",
    limit_page_length=10
)

# Then get child table data if needed
for task in tasks:
    task["checklist"] = frappe.get_all("Task Checklist",
        filters={"parent": task["name"]},
        fields=["title", "completed"]
    )
```
