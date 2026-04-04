# Frappe Framework - Files and Attachments

## Overview

Frappe provides a File doctype for managing file uploads, attachments, and file operations. Files can be public or private and attached to any document.

## Uploading Files

### Create File from Content

```python
# Create file from text content
file_doc = frappe.get_doc({
    "doctype": "File",
    "file_name": "report.txt",
    "content": "This is the file content",
    "is_private": 1
})
file_doc.save()
frappe.db.commit()

# Get the file URL
file_url = file_doc.file_url
```

### Create File from Binary Content

```python
import base64

# From binary data
binary_content = b"Binary file content here"
file_doc = frappe.get_doc({
    "doctype": "File",
    "file_name": "data.bin",
    "content": binary_content,
    "is_private": 1
})
file_doc.save()

# From base64
base64_content = base64.b64decode("SGVsbG8gV29ybGQ=")
file_doc = frappe.get_doc({
    "doctype": "File",
    "file_name": "decoded.txt",
    "content": base64_content,
    "is_private": 0
})
file_doc.save()
```

## Attaching Files to Documents

```python
# Attach file to a document
file_doc = frappe.get_doc({
    "doctype": "File",
    "file_name": "invoice_attachment.pdf",
    "content": pdf_content,
    "is_private": 1,
    "attached_to_doctype": "Sales Invoice",
    "attached_to_name": "SINV-00001"
})
file_doc.save()
frappe.db.commit()
```

### Get Attachments for a Document

```python
# Get all files attached to a document
attachments = frappe.get_all("File",
    filters={
        "attached_to_doctype": "Sales Invoice",
        "attached_to_name": "SINV-00001"
    },
    fields=["name", "file_name", "file_url", "file_size", "is_private"]
)

for attachment in attachments:
    print(f"{attachment.file_name}: {attachment.file_url}")
```

## Downloading and Reading Files

### Read File Content

```python
# Get file document
file_doc = frappe.get_doc("File", "file_name.pdf")

# Read content
content = file_doc.get_content()

# For text files
text_content = content.decode("utf-8")
```

### Get File Path

```python
# Get actual file path on disk
file_doc = frappe.get_doc("File", "my_file.txt")
file_path = file_doc.get_full_path()

# Read using standard Python
with open(file_path, 'r') as f:
    content = f.read()
```

## Saving Files from URL

```python
from frappe.utils.file_manager import save_url

# Download and save file from URL
file_doc = save_url(
    file_url="https://example.com/document.pdf",
    filename="downloaded_document.pdf",
    dt="Sales Invoice",  # Attach to doctype
    dn="SINV-00001"      # Attach to document name
)
```

## File Manager Utilities

```python
from frappe.utils.file_manager import (
    save_file,
    get_file,
    delete_file,
    get_files_path
)

# Save file
file_doc = save_file(
    fname="report.csv",
    content=csv_content,
    dt="Report",
    dn="Daily Report",
    is_private=1
)

# Get file content
file_name, content = get_file("report.csv")

# Delete file
delete_file("report.csv")

# Get files directory path
public_files_path = get_files_path()
private_files_path = get_files_path(is_private=True)
```

## Public vs Private Files

```python
# Public files - accessible without login
# Stored in: /sites/{site}/public/files/
# URL: /files/filename.ext
file_doc = frappe.get_doc({
    "doctype": "File",
    "file_name": "public_image.png",
    "content": image_content,
    "is_private": 0  # Public
})

# Private files - require authentication
# Stored in: /sites/{site}/private/files/
# URL: /private/files/filename.ext
file_doc = frappe.get_doc({
    "doctype": "File",
    "file_name": "confidential.pdf",
    "content": pdf_content,
    "is_private": 1  # Private
})
```

## File Properties

```python
file_doc = frappe.get_doc("File", "my_file.pdf")

# Available properties
file_doc.file_name      # Original filename
file_doc.file_url       # URL to access file
file_doc.file_size      # Size in bytes
file_doc.is_private     # Privacy flag
file_doc.folder         # Folder location
file_doc.attached_to_doctype  # Parent doctype
file_doc.attached_to_name     # Parent document name
file_doc.content_hash   # Hash of file content
```

## Deleting Files

```python
# Delete file document (also removes physical file)
frappe.delete_doc("File", "my_file.pdf")
frappe.db.commit()

# Delete file by path
from frappe.utils.file_manager import delete_file_from_filesystem
delete_file_from_filesystem("my_file.pdf", is_private=True)
```

## Working with Folders

```python
# Files can be organized in folders
file_doc = frappe.get_doc({
    "doctype": "File",
    "file_name": "organized_file.txt",
    "content": "content",
    "folder": "Home/Reports/2024"  # Folder path
})
file_doc.save()

# Create folder
folder = frappe.get_doc({
    "doctype": "File",
    "file_name": "2024",
    "is_folder": 1,
    "folder": "Home/Reports"
})
folder.save()
```

## CSV/Excel File Operations

```python
# Create CSV file
import csv
from io import StringIO

output = StringIO()
writer = csv.writer(output)
writer.writerow(["Name", "Email", "Status"])
writer.writerow(["John", "john@example.com", "Active"])
writer.writerow(["Jane", "jane@example.com", "Active"])

file_doc = frappe.get_doc({
    "doctype": "File",
    "file_name": "users_export.csv",
    "content": output.getvalue(),
    "is_private": 1
})
file_doc.save()
```

## File Hooks

In your doctype's Python controller:

```python
class MyDocType(Document):
    def on_update(self):
        # Process attached files
        attachments = frappe.get_all("File",
            filters={
                "attached_to_doctype": self.doctype,
                "attached_to_name": self.name
            }
        )
        for att in attachments:
            # Process each attachment
            pass
```
