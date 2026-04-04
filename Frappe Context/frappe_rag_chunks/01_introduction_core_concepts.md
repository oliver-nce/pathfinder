# Frappe Framework - Introduction and Core Concepts

## Overview

Frappe is a full-stack web application framework written in Python and JavaScript. It provides the foundation for ERPNext and other applications. The framework includes an ORM, database abstraction, user management, REST API, and much more.

## Accessing Frappe

To use the Frappe API, you must be within the Frappe context. You cannot run Frappe scripts as standalone Python files.

### Methods to Access Frappe Context

**Bench Console (Interactive)**
```bash
bench --site your_site console
```

**Bench Execute (Run a Function)**
```bash
bench --site your_site execute your_app.module.function_name
```

**Custom Bench Command**
```python
import click
import frappe
from frappe.commands import pass_context

@click.command('my-command')
@pass_context
def my_command(context):
    """Custom bench command description"""
    site = context.sites[0]
    frappe.init(site=site)
    frappe.connect()
    
    # Your logic here
    
    frappe.destroy()

commands = [my_command]
```

## The `import frappe` Statement

When you run `import frappe`, it loads the entire Frappe framework module. This gives you access to:

- Database operations (`frappe.db`)
- Document ORM (`frappe.get_doc`, `frappe.new_doc`)
- Query helpers (`frappe.get_all`, `frappe.get_list`)
- Session information (`frappe.session`)
- Utilities (`frappe.utils`)
- Cache (`frappe.cache`)
- And much more

### Why Frappe Needs Context

The `import frappe` statement alone doesn't know which site or database to connect to. The bench commands initialize this context:

```python
frappe.init(site="your_site")   # Load site config
frappe.connect()                 # Connect to database
# Now frappe.db, frappe.get_doc etc. work
frappe.destroy()                 # Clean up when done
```

When using `bench console`, this initialization happens automatically.

## Core Frappe Modules

| Module | Purpose |
|--------|---------|
| `frappe.db` | Database operations |
| `frappe.utils` | Utility functions |
| `frappe.cache` | Caching operations |
| `frappe.session` | Current user session |
| `frappe.conf` | Site configuration |
| `frappe.permissions` | Permission checks |

## Basic Example

```python
import frappe

# Get a document
user = frappe.get_doc("User", "admin@example.com")
print(user.first_name)

# Query the database
users = frappe.get_all("User", filters={"enabled": 1}, fields=["name", "email"])

# Create a new document
task = frappe.new_doc("Task")
task.subject = "My New Task"
task.save()
frappe.db.commit()
```
