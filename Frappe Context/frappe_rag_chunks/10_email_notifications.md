# Frappe Framework - Email and Notifications

## Overview

Frappe provides email functionality including sending emails, email templates, email queues, and notification systems.

## Sending Basic Emails

### Simple Email

```python
frappe.sendmail(
    recipients=["user@example.com"],
    subject="Hello from Frappe",
    message="This is the email body in plain text."
)
```

### HTML Email

```python
frappe.sendmail(
    recipients=["user@example.com"],
    subject="HTML Email",
    message="""
    <h1>Welcome!</h1>
    <p>This is an <strong>HTML</strong> email.</p>
    """,
    delayed=False  # Send immediately (default is queued)
)
```

### Multiple Recipients

```python
frappe.sendmail(
    recipients=["user1@example.com", "user2@example.com"],
    cc=["cc@example.com"],
    bcc=["bcc@example.com"],
    subject="Team Update",
    message="Message to multiple recipients."
)
```

## Email with Attachments

```python
# Attach from file content
frappe.sendmail(
    recipients=["user@example.com"],
    subject="Report Attached",
    message="Please find the report attached.",
    attachments=[
        {
            "fname": "report.pdf",
            "fcontent": pdf_content  # bytes
        },
        {
            "fname": "data.csv",
            "fcontent": csv_content
        }
    ]
)
```

### Attach Existing File

```python
# Get file content and attach
file_doc = frappe.get_doc("File", "existing_report.pdf")
file_content = file_doc.get_content()

frappe.sendmail(
    recipients=["user@example.com"],
    subject="Your Document",
    message="Here is the document you requested.",
    attachments=[{
        "fname": file_doc.file_name,
        "fcontent": file_content
    }]
)
```

## Email Templates

### Using Email Template

```python
# Email template stored in Email Template doctype
frappe.sendmail(
    recipients=["user@example.com"],
    template="welcome_email",  # Template name
    args={
        "first_name": "John",
        "company": "ACME Corp",
        "login_url": "https://example.com/login"
    }
)
```

### Creating Email Template Programmatically

```python
# Create email template
template = frappe.get_doc({
    "doctype": "Email Template",
    "name": "Order Confirmation",
    "subject": "Order {{ order_id }} Confirmed",
    "response": """
    <p>Dear {{ customer_name }},</p>
    <p>Your order <strong>{{ order_id }}</strong> has been confirmed.</p>
    <p>Total Amount: {{ amount }}</p>
    <p>Thank you for your purchase!</p>
    """
})
template.insert()
```

## Reference Documents

Link emails to documents for tracking:

```python
frappe.sendmail(
    recipients=["customer@example.com"],
    subject="Invoice SINV-00001",
    message="Please find your invoice attached.",
    reference_doctype="Sales Invoice",
    reference_name="SINV-00001"
)
```

## Email Queue

### Queue Email for Later

```python
# Email is queued by default
frappe.sendmail(
    recipients=["user@example.com"],
    subject="Queued Email",
    message="This goes to the queue",
    delayed=True  # Default behavior
)

# Send immediately (bypass queue)
frappe.sendmail(
    recipients=["user@example.com"],
    subject="Immediate Email",
    message="This sends right away",
    delayed=False
)
```

### Send Queued Emails

```python
# Process email queue (usually done by scheduler)
from frappe.email.queue import flush
flush()
```

### Check Email Queue

```python
# View queued emails
queued = frappe.get_all("Email Queue",
    filters={"status": "Not Sent"},
    fields=["name", "sender", "recipients", "subject", "creation"]
)
```

## Email via Background Job

```python
# Send email in background
frappe.enqueue(
    method=frappe.sendmail,
    queue="short",
    recipients=["user@example.com"],
    subject="Background Email",
    message="Sent via background job"
)
```

## System Notifications

### Create System Notification

```python
from frappe.desk.doctype.notification_log.notification_log import enqueue_create_notification

# Create notification for user
enqueue_create_notification(
    users=["user@example.com"],
    doc=doc,  # Reference document
    subject="New Task Assigned",
    message="You have been assigned a new task."
)
```

### Manual Notification Log

```python
# Create notification log directly
notification = frappe.get_doc({
    "doctype": "Notification Log",
    "for_user": "user@example.com",
    "from_user": frappe.session.user,
    "subject": "New Assignment",
    "email_content": "You have a new assignment",
    "document_type": "Task",
    "document_name": "TASK-00001"
})
notification.insert(ignore_permissions=True)
frappe.db.commit()
```

## Notification Settings

```python
# Check user's notification settings
settings = frappe.get_doc("Notification Settings", "user@example.com")

# Check if notifications enabled
if settings.enabled:
    # Send notification
    pass
```

## Email Alerts (Notification DocType)

### Create Automated Email Alert

```python
# Create notification rule
notification = frappe.get_doc({
    "doctype": "Notification",
    "name": "Task Overdue Alert",
    "document_type": "Task",
    "event": "Days After",
    "days_in_advance": -1,  # 1 day after
    "date_changed": "due_date",
    "subject": "Task {{ doc.name }} is Overdue",
    "message": """
    <p>The following task is overdue:</p>
    <p><strong>{{ doc.subject }}</strong></p>
    <p>Due Date: {{ doc.due_date }}</p>
    """,
    "recipients": [
        {"receiver_by_document_field": "assigned_to"}
    ]
})
notification.insert()
```

## Validating Email Addresses

```python
from frappe.utils import validate_email_address

# Validate email format
is_valid = validate_email_address("user@example.com")

# Validate with throw
validate_email_address("invalid-email", throw=True)  # Raises exception
```

## Email Account Configuration

```python
# Get default outgoing email account
email_account = frappe.get_doc("Email Account", {"default_outgoing": 1})

# Send using specific account
frappe.sendmail(
    recipients=["user@example.com"],
    subject="From Specific Account",
    message="Email body",
    sender="specific@mycompany.com"
)
```
