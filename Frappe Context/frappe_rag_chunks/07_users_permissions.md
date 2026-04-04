# Frappe Framework - Users and Permissions

## Overview

Frappe provides comprehensive user management and permission controls. This includes session management, role-based access, document-level permissions, and sharing.

## Current User Session

```python
# Get current user
current_user = frappe.session.user

# Get session ID
session_id = frappe.session.sid

# Get session data
session_data = frappe.session.data
```

## User Information

```python
# Get user object
user = frappe.get_user()

# Get user's roles
roles = frappe.get_user().get_roles()
# Returns: ["System Manager", "Administrator", "Guest"]

# Get roles for specific user
roles = frappe.get_roles("user@example.com")

# Check if user has a role
has_role = frappe.get_user().has_role("System Manager")

# Get user's email
email = frappe.get_user().email

# Get full name
full_name = frappe.utils.get_fullname(frappe.session.user)
```

## Switch User Context

```python
# Run code as different user
frappe.set_user("user@example.com")

# Do operations as that user
tasks = frappe.get_list("Task")  # Will respect user's permissions

# Switch back
frappe.set_user("Administrator")

# Common pattern
original_user = frappe.session.user
try:
    frappe.set_user("admin@example.com")
    # Do something as admin
finally:
    frappe.set_user(original_user)
```

## Permission Checks

### Basic Permission Check

```python
# Check if current user has permission
can_read = frappe.has_permission("Task", "read")
can_write = frappe.has_permission("Task", "write")
can_create = frappe.has_permission("Task", "create")
can_delete = frappe.has_permission("Task", "delete")

# Check permission for specific document
can_edit = frappe.has_permission("Task", "write", doc="TASK-00001")

# Check permission for specific user
can_read = frappe.has_permission("Task", "read", user="user@example.com")
```

### Permission Types

```python
# Available permission types:
# - read: View document
# - write: Edit document
# - create: Create new document
# - delete: Delete document
# - submit: Submit document (for submittable doctypes)
# - cancel: Cancel submitted document
# - amend: Amend cancelled document
# - print: Print document
# - email: Email document
# - report: View reports
# - import: Import data
# - export: Export data
# - share: Share document with other users
```

### Role Permission Check

```python
# Get role permissions for a doctype
permissions = frappe.permissions.get_role_permissions("Task", "System Manager")

# Check specific permission for role
can_read = frappe.permissions.has_permission("Task", "read", role="System Manager")
```

## Restricting Access

### Only For Decorator

```python
# Restrict function to certain roles
@frappe.whitelist()
def admin_only_function():
    frappe.only_for("System Manager")  # Throws if user doesn't have role
    # ... rest of function
    
# Multiple roles (user needs at least one)
@frappe.whitelist()
def manager_function():
    frappe.only_for(["System Manager", "HR Manager"])
```

### Manual Permission Check

```python
# Throw error if no permission
if not frappe.has_permission("Task", "write", doc="TASK-00001"):
    frappe.throw("You don't have permission to edit this task", frappe.PermissionError)
```

## Sharing Documents

Share a document with specific users:

```python
# Share document
frappe.share.add(
    doctype="Task",
    name="TASK-00001",
    user="user@example.com",
    read=1,
    write=1,
    share=0  # Can they re-share?
)

# Remove share
frappe.share.remove("Task", "TASK-00001", "user@example.com")

# Get users document is shared with
shared_with = frappe.share.get_users("Task", "TASK-00001")

# Check if shared
is_shared = frappe.share.get_shared("Task", "TASK-00001", "user@example.com")
```

### Share Permissions

```python
# Share with different permission levels
frappe.share.add(
    doctype="Task",
    name="TASK-00001",
    user="user@example.com",
    read=1,        # Can view
    write=1,       # Can edit
    submit=0,      # Can submit
    share=0,       # Can share with others
    everyone=0     # Share with everyone
)
```

## User Permission (Field-Level Restrictions)

User Permissions restrict which values a user can access in Link fields:

```python
# Add user permission
from frappe.permissions import add_user_permission, remove_user_permission

# User can only access tasks for "Project A"
add_user_permission("Project", "Project A", "user@example.com")

# Remove user permission
remove_user_permission("Project", "Project A", "user@example.com")

# Get user permissions
user_perms = frappe.get_all("User Permission",
    filters={"user": "user@example.com"},
    fields=["allow", "for_value"]
)
```

## Creating Users Programmatically

```python
# Create new user
user = frappe.get_doc({
    "doctype": "User",
    "email": "newuser@example.com",
    "first_name": "New",
    "last_name": "User",
    "enabled": 1,
    "user_type": "System User",
    "roles": [
        {"role": "System Manager"},
        {"role": "Sales User"}
    ]
})
user.insert(ignore_permissions=True)
frappe.db.commit()

# Set password
from frappe.utils.password import update_password
update_password("newuser@example.com", "new_password")
```

## Check User Enabled Status

```python
# Check if user is enabled
is_enabled = frappe.db.get_value("User", "user@example.com", "enabled")

# Get all enabled users
enabled_users = frappe.get_all("User",
    filters={"enabled": 1, "user_type": "System User"},
    fields=["name", "email", "full_name"]
)
```
