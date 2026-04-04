# Frappe Framework - Database Operations (Basic)

## Overview

The `frappe.db` module provides direct database access. It wraps MariaDB/MySQL operations and provides helper methods for common operations.

## Accessing Frappe Database

To use database operations, you must be within Frappe context:

```bash
bench --site your_site console
```

Then use `frappe.db` for all database operations.

## Basic CRUD Operations

### Get Value

Retrieve a single field value from a document:

```python
# Get single field
first_name = frappe.db.get_value("User", "admin@example.com", "first_name")

# Get multiple fields
first_name, last_name = frappe.db.get_value("User", "admin@example.com", ["first_name", "last_name"])

# Get as dict
user_data = frappe.db.get_value("User", "admin@example.com", ["first_name", "last_name"], as_dict=True)
# Returns: {"first_name": "Admin", "last_name": "User"}
```

### Set Value

Update field values directly in database:

```python
# Set single field
frappe.db.set_value("User", "admin@example.com", "first_name", "John")

# Set multiple fields
frappe.db.set_value("User", "admin@example.com", {
    "first_name": "John",
    "last_name": "Doe",
    "middle_name": "William"
})

# Don't forget to commit!
frappe.db.commit()
```

### Check Existence

```python
# Check if document exists by name
exists = frappe.db.exists("User", "admin@example.com")

# Check with filters
exists = frappe.db.exists("User", {"email": "admin@example.com", "enabled": 1})

# Returns document name if exists, None otherwise
if frappe.db.exists("Task", {"subject": "My Task"}):
    print("Task exists!")
```

### Count Records

```python
# Count all records
total_users = frappe.db.count("User")

# Count with filters
active_users = frappe.db.count("User", {"enabled": 1})

# Count with complex filters
recent_tasks = frappe.db.count("Task", {
    "creation": [">", "2024-01-01"],
    "status": ["in", ["Open", "Working"]]
})
```

## Raw SQL Queries

For complex queries, use raw SQL:

```python
# Basic query - returns list of tuples
result = frappe.db.sql("SELECT name, email FROM tabUser WHERE enabled=1")

# With parameters (safe from SQL injection)
result = frappe.db.sql("SELECT * FROM tabUser WHERE name=%s", ("admin@example.com",))

# Return as dict
result = frappe.db.sql("SELECT name, email FROM tabUser WHERE enabled=1", as_dict=True)
# Returns: [{"name": "admin@example.com", "email": "admin@example.com"}, ...]

# Return as list
result = frappe.db.sql("SELECT name, email FROM tabUser", as_list=True)
# Returns: [["admin@example.com", "admin@example.com"], ...]
```

### SQL Query Best Practices

```python
# Always use parameterized queries to prevent SQL injection
# GOOD:
frappe.db.sql("SELECT * FROM tabUser WHERE name=%s", (user_name,))

# BAD (SQL injection vulnerability):
frappe.db.sql(f"SELECT * FROM tabUser WHERE name='{user_name}'")

# Table names are prefixed with 'tab' in database
# DocType "User" -> table "tabUser"
# DocType "Sales Invoice" -> table "tabSales Invoice"
```

## Transactions

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
