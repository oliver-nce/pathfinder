# Frappe Framework - API and Whitelisted Methods

## Overview

Frappe provides a REST API for all DocTypes and allows you to create custom API endpoints using whitelisted methods.

## Whitelisted Methods

### Basic Whitelist

```python
import frappe

@frappe.whitelist()
def my_api_method(param1, param2):
    """
    Accessible at: /api/method/myapp.api.my_api_method
    Requires login by default
    """
    # Your logic here
    return {
        "status": "success",
        "data": {"param1": param1, "param2": param2}
    }
```

### Allow Guest Access

```python
@frappe.whitelist(allow_guest=True)
def public_endpoint():
    """Accessible without login"""
    return {"message": "Hello, guest!"}
```

### XSS Safe Methods

```python
@frappe.whitelist(xss_safe=True)
def safe_method():
    """Won't escape HTML in response"""
    return "<p>HTML content</p>"
```

## Calling Whitelisted Methods

### From Python

```python
# Call another whitelisted method
result = frappe.call("myapp.api.my_api_method", param1="value1", param2="value2")
```

### From JavaScript (Client)

```javascript
// Using frappe.call
frappe.call({
    method: "myapp.api.my_api_method",
    args: {
        param1: "value1",
        param2: "value2"
    },
    callback: function(r) {
        if (r.message) {
            console.log(r.message);
        }
    }
});

// Async/await style
let response = await frappe.call({
    method: "myapp.api.my_api_method",
    args: {param1: "value1"}
});
console.log(response.message);
```

### Via HTTP Request

```bash
# POST request
curl -X POST "https://yoursite.com/api/method/myapp.api.my_api_method" \
  -H "Authorization: token api_key:api_secret" \
  -H "Content-Type: application/json" \
  -d '{"param1": "value1", "param2": "value2"}'

# GET request (for simple methods)
curl "https://yoursite.com/api/method/myapp.api.my_api_method?param1=value1"
```

## REST API for DocTypes

### Get Document

```bash
# Get single document
GET /api/resource/Task/TASK-00001

# Response
{
    "data": {
        "name": "TASK-00001",
        "subject": "My Task",
        "status": "Open"
    }
}
```

### List Documents

```bash
# Get list
GET /api/resource/Task

# With filters
GET /api/resource/Task?filters=[["status","=","Open"]]

# With fields
GET /api/resource/Task?fields=["name","subject","status"]

# With pagination
GET /api/resource/Task?limit_start=0&limit_page_length=20

# With order
GET /api/resource/Task?order_by=creation%20desc
```

### Create Document

```bash
POST /api/resource/Task
Content-Type: application/json

{
    "subject": "New Task",
    "priority": "High"
}
```

### Update Document

```bash
PUT /api/resource/Task/TASK-00001
Content-Type: application/json

{
    "status": "Completed"
}
```

### Delete Document

```bash
DELETE /api/resource/Task/TASK-00001
```

## API Authentication

### Token Based (API Key)

```python
# Generate API keys for user
from frappe.core.doctype.user.user import generate_keys

api_secret = generate_keys("user@example.com")
# Returns the api_secret; api_key is stored in user doc
```

```bash
# Use in requests
curl -H "Authorization: token api_key:api_secret" \
     https://yoursite.com/api/resource/Task
```

### OAuth 2.0

```python
# OAuth is configured via Social Login Keys
# Tokens are obtained through OAuth flow
```

```bash
# Use bearer token
curl -H "Authorization: Bearer access_token" \
     https://yoursite.com/api/resource/Task
```

### Session Based

```bash
# Login first
curl -c cookies.txt -X POST \
  https://yoursite.com/api/method/login \
  -d "usr=user@example.com&pwd=password"

# Use session cookie
curl -b cookies.txt https://yoursite.com/api/resource/Task
```

## Handling API Response

### Return Data

```python
@frappe.whitelist()
def get_data():
    data = {"key": "value"}
    return data  # Automatically wrapped in {"message": data}
```

### Return with Custom Status

```python
@frappe.whitelist()
def custom_response():
    frappe.response["http_status_code"] = 201
    return {"status": "created"}
```

### File Download Response

```python
@frappe.whitelist()
def download_file():
    content = "File content here"
    frappe.response["filename"] = "export.csv"
    frappe.response["filecontent"] = content
    frappe.response["type"] = "download"
```

## Error Handling in API

```python
@frappe.whitelist()
def api_with_errors(value):
    if not value:
        frappe.throw("Value is required", frappe.MandatoryError)
    
    if not frappe.has_permission("Task", "read"):
        frappe.throw("No permission", frappe.PermissionError)
    
    try:
        result = process(value)
        return result
    except Exception as e:
        frappe.log_error(frappe.get_traceback())
        frappe.throw(f"Processing failed: {str(e)}")
```

### HTTP Status Codes

```python
@frappe.whitelist()
def api_method():
    # 404 Not Found
    if not frappe.db.exists("Task", task_id):
        frappe.throw("Task not found", frappe.DoesNotExistError)
    
    # 403 Forbidden
    if not frappe.has_permission("Task", "write"):
        frappe.throw("Access denied", frappe.PermissionError)
    
    # 400 Bad Request
    if invalid_input:
        frappe.throw("Invalid input", frappe.ValidationError)
```

## Rate Limiting

```python
from frappe.rate_limiter import rate_limit

@frappe.whitelist(allow_guest=True)
@rate_limit(limit=5, seconds=60)  # 5 requests per minute
def limited_endpoint():
    return {"status": "ok"}
```

## Async Methods

```python
@frappe.whitelist()
def start_long_task():
    """Start background job and return task ID"""
    job = frappe.enqueue(
        "myapp.tasks.long_running_task",
        queue="long"
    )
    return {"task_id": job.id}

@frappe.whitelist()
def check_task_status(task_id):
    """Check background job status"""
    from frappe.utils.background_jobs import get_job
    job = get_job(task_id)
    if job:
        return {"status": job.get_status()}
    return {"status": "not_found"}
```

## Document Method API

```python
# In your DocType controller
class Task(Document):
    @frappe.whitelist()
    def complete_task(self):
        """
        Accessible at: /api/method/frappe.client.run_doc_method
        With params: {doctype: "Task", name: "TASK-001", method: "complete_task"}
        """
        self.status = "Completed"
        self.save()
        return {"status": "completed"}
```

```javascript
// Call from JS
frappe.call({
    method: "run_doc_method",
    args: {
        doctype: "Task",
        name: "TASK-00001",
        method: "complete_task"
    },
    callback: function(r) {
        console.log(r.message);
    }
});
```
