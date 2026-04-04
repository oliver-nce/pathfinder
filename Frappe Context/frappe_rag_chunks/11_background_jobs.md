# Frappe Framework - Background Jobs and Queues

## Overview

Frappe uses Redis Queue (RQ) for background job processing. This allows long-running tasks to be executed asynchronously without blocking the web request.

## Basic Job Enqueueing

### Simple Enqueue

```python
# Enqueue a function to run in background
frappe.enqueue(
    method="myapp.tasks.long_running_function",
    arg1="value1",
    arg2="value2"
)
```

### Enqueue with Options

```python
frappe.enqueue(
    method="myapp.tasks.process_data",
    queue="long",           # Queue type: short, default, long
    timeout=600,            # Max execution time in seconds
    is_async=True,          # Run asynchronously (default)
    job_name="process_data_job",  # Custom job name
    at_front=False,         # Add to front of queue
    # Function arguments
    data=my_data,
    user_id=frappe.session.user
)
```

### Queue Types

```python
# short - Quick tasks (default timeout: 300 seconds)
frappe.enqueue(method="myapp.tasks.quick_task", queue="short")

# default - Normal tasks (default timeout: 300 seconds)
frappe.enqueue(method="myapp.tasks.normal_task", queue="default")

# long - Long running tasks (default timeout: 1500 seconds)
frappe.enqueue(method="myapp.tasks.heavy_task", queue="long")
```

## Preventing Duplicate Jobs

```python
# Deduplicate - prevent same job from running twice
frappe.enqueue(
    method="myapp.tasks.sync_data",
    queue="default",
    job_name="sync_data_unique",
    deduplicate=True  # Won't enqueue if job with same name is pending
)
```

## Enqueue Document Method

```python
# Enqueue a method on a document
doc = frappe.get_doc("Sales Invoice", "SINV-00001")
frappe.enqueue_doc(
    doctype="Sales Invoice",
    name="SINV-00001",
    method="send_invoice_email",
    queue="short"
)
```

## Writing Background Task Functions

### Basic Task Function

```python
# myapp/tasks.py

import frappe

def process_orders():
    """Background task to process pending orders"""
    # Initialize frappe for background context
    orders = frappe.get_all("Sales Order",
        filters={"status": "Pending"},
        fields=["name"]
    )
    
    for order in orders:
        try:
            doc = frappe.get_doc("Sales Order", order.name)
            doc.process()
            frappe.db.commit()
        except Exception as e:
            frappe.log_error(f"Error processing {order.name}: {e}")
            frappe.db.rollback()
```

### Task with Arguments

```python
# myapp/tasks.py

import frappe

def send_bulk_emails(recipients, template, context):
    """Send emails to multiple recipients"""
    for recipient in recipients:
        try:
            frappe.sendmail(
                recipients=[recipient],
                template=template,
                args=context,
                delayed=False
            )
        except Exception as e:
            frappe.log_error(f"Failed to send to {recipient}: {e}")
    
    frappe.db.commit()

# Usage
frappe.enqueue(
    method="myapp.tasks.send_bulk_emails",
    recipients=["user1@example.com", "user2@example.com"],
    template="newsletter",
    context={"title": "Monthly Update"}
)
```

## Scheduled Jobs (Hooks)

Define recurring jobs in your app's `hooks.py`:

```python
# hooks.py

scheduler_events = {
    # Run every minute
    "cron": {
        "* * * * *": [
            "myapp.tasks.every_minute_task"
        ],
        "0 * * * *": [
            "myapp.tasks.every_hour_task"
        ],
        "0 0 * * *": [
            "myapp.tasks.midnight_task"
        ],
        "0 9 * * 1": [
            "myapp.tasks.monday_morning_task"
        ]
    },
    
    # Predefined intervals
    "hourly": [
        "myapp.tasks.hourly_sync"
    ],
    
    "daily": [
        "myapp.tasks.daily_report"
    ],
    
    "weekly": [
        "myapp.tasks.weekly_cleanup"
    ],
    
    "monthly": [
        "myapp.tasks.monthly_archive"
    ],
    
    # Run on specific events
    "all": [
        "myapp.tasks.always_run"  # Every scheduler tick
    ]
}
```

### Cron Expression Format

```python
# Cron format: minute hour day month weekday
# * * * * *
# │ │ │ │ │
# │ │ │ │ └─ Day of week (0-6, Sunday=0)
# │ │ │ └─── Month (1-12)
# │ │ └───── Day of month (1-31)
# │ └─────── Hour (0-23)
# └───────── Minute (0-59)

scheduler_events = {
    "cron": {
        "*/5 * * * *": ["task"],    # Every 5 minutes
        "0 */2 * * *": ["task"],    # Every 2 hours
        "0 9 * * 1-5": ["task"],    # 9 AM on weekdays
        "0 0 1 * *": ["task"],      # First day of month
    }
}
```

## Checking Job Status

```python
from frappe.utils.background_jobs import get_jobs

# Get all jobs for current site
jobs = get_jobs(site=frappe.local.site)

# Filter by queue
short_jobs = get_jobs(site=frappe.local.site, queue="short")

# Get job info
for job in jobs:
    print(f"Job: {job.get('job_name')}, Status: {job.get('status')}")
```

## Managing Jobs via CLI

```bash
# View running workers
bench show-workers

# Start scheduler
bench --site your_site scheduler enable

# Disable scheduler
bench --site your_site scheduler disable

# Run scheduler once (for debugging)
bench --site your_site execute frappe.utils.scheduler.enqueue_events

# View queued jobs
bench --site your_site show-pending-jobs
```

## Error Handling in Background Jobs

```python
import frappe

def risky_background_task(data):
    """Task with proper error handling"""
    try:
        # Process data
        result = process(data)
        
        # Log success
        frappe.logger().info(f"Task completed: {result}")
        
        frappe.db.commit()
        
    except Exception as e:
        # Log error with traceback
        frappe.log_error(
            title="Background Task Failed",
            message=frappe.get_traceback()
        )
        frappe.db.rollback()
        raise  # Re-raise to mark job as failed
```

## Monitoring Background Jobs

```python
# Check for failed jobs
failed_jobs = frappe.get_all("RQ Job",
    filters={"status": "failed"},
    fields=["name", "job_name", "exc_info"]
)

# Get error logs
errors = frappe.get_all("Error Log",
    filters={"creation": [">", "2024-01-01"]},
    fields=["name", "error", "creation"],
    order_by="creation desc",
    limit=50
)
```
