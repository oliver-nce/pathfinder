# Frappe Framework - Hooks and Document Events

## Overview

Hooks allow you to extend Frappe's functionality by intercepting events, adding custom logic, and modifying behavior. Document events are specific hooks that trigger during document lifecycle.

## Document Events (Controller Methods)

In your DocType's Python file (e.g., `task.py`):

```python
import frappe
from frappe.model.document import Document

class Task(Document):
    def before_insert(self):
        """Called before new document is inserted"""
        self.set_defaults()
    
    def after_insert(self):
        """Called after document is inserted"""
        self.notify_assignment()
    
    def validate(self):
        """Called before save (both insert and update)"""
        self.validate_dates()
        self.calculate_totals()
    
    def before_save(self):
        """Called before document is saved"""
        self.set_status()
    
    def on_update(self):
        """Called after document is saved"""
        self.update_related_documents()
        frappe.db.commit()
    
    def before_submit(self):
        """Called before document submission"""
        self.validate_for_submit()
    
    def on_submit(self):
        """Called after document submission"""
        self.create_gl_entries()
    
    def before_cancel(self):
        """Called before document cancellation"""
        self.check_linked_documents()
    
    def on_cancel(self):
        """Called after document cancellation"""
        self.reverse_gl_entries()
    
    def on_trash(self):
        """Called before document deletion"""
        self.cleanup_related_data()
    
    def after_delete(self):
        """Called after document deletion"""
        self.log_deletion()
    
    def on_change(self):
        """Called when document state changes"""
        pass
```

## Document Event Order

```python
# Insert order:
# 1. before_insert
# 2. validate
# 3. before_save
# 4. [database insert]
# 5. after_insert
# 6. on_update

# Update order:
# 1. validate
# 2. before_save
# 3. [database update]
# 4. on_update

# Submit order:
# 1. validate
# 2. before_save
# 3. before_submit
# 4. [database update]
# 5. on_submit
# 6. on_update

# Cancel order:
# 1. before_cancel
# 2. [database update]
# 3. on_cancel
# 4. on_update
```

## Global Document Events (hooks.py)

Apply hooks to documents from other apps:

```python
# hooks.py

doc_events = {
    # Specific DocType
    "Sales Invoice": {
        "validate": "myapp.events.sales_invoice_validate",
        "on_submit": "myapp.events.sales_invoice_on_submit",
        "on_cancel": "myapp.events.sales_invoice_on_cancel"
    },
    
    # All documents
    "*": {
        "on_update": "myapp.events.all_docs_on_update",
        "after_insert": "myapp.events.all_docs_after_insert"
    },
    
    # Multiple DocTypes
    ("Sales Invoice", "Purchase Invoice"): {
        "validate": "myapp.events.invoice_validate"
    }
}
```

### Event Handler Function

```python
# myapp/events.py

import frappe

def sales_invoice_validate(doc, method):
    """
    Args:
        doc: The document object
        method: The event name (e.g., "validate")
    """
    if doc.total < 0:
        frappe.throw("Total cannot be negative")

def all_docs_on_update(doc, method):
    """Called for all documents on update"""
    frappe.logger().info(f"Document updated: {doc.doctype} - {doc.name}")
```

## App Hooks

### hooks.py Structure

```python
# hooks.py

app_name = "myapp"
app_title = "My Application"
app_publisher = "My Company"
app_description = "App description"
app_version = "1.0.0"

# Includes
app_include_css = "/assets/myapp/css/myapp.css"
app_include_js = "/assets/myapp/js/myapp.js"

# Website
website_route_rules = [
    {"from_route": "/old-path", "to_route": "/new-path"}
]

# Installation
after_install = "myapp.install.after_install"
before_uninstall = "myapp.install.before_uninstall"

# Migration
after_migrate = "myapp.migrate.after_migrate"

# Document Events
doc_events = {
    "User": {
        "after_insert": "myapp.user.after_insert"
    }
}

# Scheduler
scheduler_events = {
    "daily": ["myapp.tasks.daily_task"],
    "hourly": ["myapp.tasks.hourly_task"]
}

# Permissions
permission_query_conditions = {
    "Task": "myapp.permissions.task_query_conditions"
}

# Jinja
jinja = {
    "methods": ["myapp.utils.jinja_method"]
}

# Boot Session
boot_session = "myapp.startup.boot_session"
```

## Override Standard Methods

### Override Whitelisted Methods

```python
# hooks.py
override_whitelisted_methods = {
    "frappe.desk.search.search_link": "myapp.overrides.custom_search_link"
}
```

### Override DocType Class

```python
# hooks.py
override_doctype_class = {
    "Sales Invoice": "myapp.overrides.CustomSalesInvoice"
}
```

```python
# myapp/overrides.py
from erpnext.accounts.doctype.sales_invoice.sales_invoice import SalesInvoice

class CustomSalesInvoice(SalesInvoice):
    def validate(self):
        super().validate()
        # Add custom validation
        self.custom_validation()
```

## Boot Session

Add data to the initial page load:

```python
# hooks.py
boot_session = "myapp.boot.boot_session"
```

```python
# myapp/boot.py
def boot_session(bootinfo):
    """Add data to bootinfo sent to client"""
    bootinfo.my_custom_data = frappe.db.get_single_value("My Settings", "value")
    bootinfo.user_preferences = get_user_preferences()
```

## Fixtures

Auto-export/import data:

```python
# hooks.py
fixtures = [
    "Custom Field",
    "Property Setter",
    {
        "doctype": "Role",
        "filters": [["name", "in", ["My Custom Role"]]]
    },
    {
        "doctype": "Workflow",
        "filters": [["document_type", "=", "My DocType"]]
    }
]
```

## Website Generators

```python
# hooks.py
website_generators = ["Blog Post", "Web Page"]

# For custom doctype
website_route_rules = [
    {"from_route": "/my-pages/<path>", "to_route": "my_page"}
]
```

## Jinja Customization

```python
# hooks.py
jinja = {
    "methods": [
        "myapp.utils.get_custom_value"
    ],
    "filters": [
        "myapp.utils.my_filter"
    ]
}
```

```python
# myapp/utils.py
def get_custom_value(doctype, name):
    return frappe.db.get_value(doctype, name, "custom_field")

def my_filter(value):
    return value.upper()
```

## Permission Query Conditions

```python
# hooks.py
permission_query_conditions = {
    "Task": "myapp.permissions.get_task_conditions"
}
```

```python
# myapp/permissions.py
def get_task_conditions(user):
    """Return SQL conditions for filtering"""
    if "System Manager" in frappe.get_roles(user):
        return ""  # No restriction
    return f"`tabTask`.assigned_to = '{user}'"
```

## Has Permission

```python
# hooks.py
has_permission = {
    "Task": "myapp.permissions.has_task_permission"
}
```

```python
# myapp/permissions.py
def has_task_permission(doc, user=None, permission_type=None):
    """Custom permission check"""
    if permission_type == "read":
        return True
    if doc.assigned_to == (user or frappe.session.user):
        return True
    return False
```
