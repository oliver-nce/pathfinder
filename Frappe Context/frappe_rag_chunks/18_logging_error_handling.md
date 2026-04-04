# Frappe Framework - Logging and Error Handling

## Overview

Frappe provides logging utilities, error handling, and user messaging systems for debugging and communication.

## Logging

### Basic Logging

```python
import frappe

# Log to console/file
frappe.log("This is a log message")

# Using logger
frappe.logger().info("Info message")
frappe.logger().debug("Debug message")
frappe.logger().warning("Warning message")
frappe.logger().error("Error message")
```

### Named Logger

```python
# Create named logger for your module
logger = frappe.logger("myapp", allow_site=True, file_count=5)
logger.info("Module-specific log")
logger.error("Module error")
```

### Log to Error Log DocType

```python
# Log error to database (visible in Error Log list)
frappe.log_error(
    title="My Error Title",
    message="Detailed error message or traceback"
)

# Log with traceback
try:
    risky_operation()
except Exception as e:
    frappe.log_error(
        title="Operation Failed",
        message=frappe.get_traceback()
    )
```

### Custom Error Log

```python
# Log structured data
frappe.log_error(
    title="API Request Failed",
    message=f"""
    Request: {request_data}
    Response: {response}
    Error: {error_message}
    """
)
```

## Error Handling

### Throwing Errors

```python
# Basic throw (raises ValidationError)
frappe.throw("Something went wrong")

# With title
frappe.throw("Invalid value", title="Validation Error")

# With specific exception type
frappe.throw("Document not found", frappe.DoesNotExistError)
frappe.throw("No permission", frappe.PermissionError)
frappe.throw("Field is required", frappe.MandatoryError)
frappe.throw("Duplicate entry", frappe.DuplicateEntryError)
```

### Exception Types

```python
# Available exception types
frappe.ValidationError       # Generic validation error
frappe.AuthenticationError   # Login/auth failed
frappe.PermissionError       # Access denied
frappe.DoesNotExistError     # Record not found
frappe.DuplicateEntryError   # Duplicate record
frappe.MandatoryError        # Required field missing
frappe.InvalidStatusError    # Invalid workflow state
frappe.LinkExistsError       # Can't delete - linked records exist
frappe.TimestampMismatchError # Concurrent edit conflict
frappe.OutgoingEmailError    # Email sending failed
frappe.SessionStopped        # Session terminated
```

### Try-Except Pattern

```python
def safe_operation():
    try:
        result = risky_function()
        frappe.db.commit()
        return result
    except frappe.ValidationError as e:
        frappe.log_error(title="Validation Failed")
        raise
    except frappe.PermissionError:
        frappe.log_error(title="Permission Denied")
        frappe.throw("You don't have permission for this action")
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(
            title="Unexpected Error",
            message=frappe.get_traceback()
        )
        frappe.throw("An unexpected error occurred. Please contact support.")
```

## User Messages

### Message Print (UI Alert)

```python
# Show message to user
frappe.msgprint("Operation completed successfully")

# With title
frappe.msgprint("Task assigned to John", title="Assignment")

# With indicator color
frappe.msgprint("Warning: Low inventory", indicator="orange")
frappe.msgprint("Error occurred", indicator="red")
frappe.msgprint("Success!", indicator="green")

# As alert (top bar notification)
frappe.msgprint("Quick notification", alert=True)
```

### Indicators

```python
# Available indicators
# "green" - Success
# "blue" - Info
# "orange" - Warning
# "red" - Error
# "yellow" - Caution
# "gray" - Neutral

frappe.msgprint("Success!", indicator="green", title="Done")
```

### Confirmation Dialog

```python
# In Python (returns to JS)
frappe.msgprint(
    "Are you sure you want to proceed?",
    title="Confirm",
    primary_action={
        "label": "Yes, proceed",
        "server_action": "myapp.api.confirm_action",
        "args": {"doc_name": doc.name}
    }
)
```

## Progress Indicator

```python
# Show progress for long operations
def process_items(items):
    total = len(items)
    for i, item in enumerate(items):
        # Update progress
        frappe.publish_progress(
            percent=int((i + 1) / total * 100),
            title="Processing Items",
            description=f"Processing {item.name}"
        )
        process_item(item)
```

## Debug Logging

### Print Debug Info

```python
# Print to console (development)
print("Debug value:", my_variable)

# Using frappe
frappe.logger().debug(f"Variable: {my_variable}")

# Conditional debug
if frappe.conf.get("developer_mode"):
    print("Debug:", data)
```

### Traceback

```python
# Get current traceback
traceback = frappe.get_traceback()
print(traceback)

# Log traceback
frappe.log_error(
    title="Debug Traceback",
    message=frappe.get_traceback()
)
```

## Console Output

```python
# Colored console output
from frappe.utils import cstr

# Click library (used by bench)
import click
click.echo(click.style("Success!", fg="green"))
click.echo(click.style("Error!", fg="red"))
click.echo(click.style("Warning!", fg="yellow"))
```

## Viewing Logs

### Error Log List

```python
# Get recent errors
errors = frappe.get_all("Error Log",
    fields=["name", "error", "creation"],
    order_by="creation desc",
    limit=20
)
```

### CLI Log Files

```bash
# View logs from command line
tail -f ~/frappe-bench/logs/frappe.log
tail -f ~/frappe-bench/logs/worker.error.log

# Site-specific logs
tail -f ~/frappe-bench/sites/mysite/logs/frappe.log
```

## Raising Exceptions Without Rollback

```python
# Throw but don't rollback current transaction
frappe.throw("Warning message", raise_exception=False)

# Or use msgprint for non-blocking
frappe.msgprint("Warning: This may cause issues", indicator="orange")
```

## Publish Realtime Messages

```python
# Send realtime message to client
frappe.publish_realtime(
    event="my_event",
    message={"key": "value"},
    user=frappe.session.user
)

# Broadcast to all users
frappe.publish_realtime(
    event="announcement",
    message={"text": "Server maintenance in 5 minutes"},
    after_commit=True
)
```

### JavaScript Listener

```javascript
// Listen for realtime events
frappe.realtime.on("my_event", function(data) {
    console.log("Received:", data);
    frappe.show_alert(data.message);
});
```

## Silent Operations

```python
# Suppress messages
frappe.flags.mute_messages = True
try:
    # Operations here won't show msgprint
    do_something()
finally:
    frappe.flags.mute_messages = False
```
