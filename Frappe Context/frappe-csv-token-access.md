# CSV Export with Token-Gated Access
## Cursor Agent Context Document
### Feature: Serve DocType data as CSV via a stable URL that Google Sheets can import directly

---

## Overview

This feature allows a Frappe custom app to export DocType data as a CSV file accessible via a stable public URL, gated by a secret token. The URL can be used directly in Google Sheets via `=IMPORTDATA()` without requiring a Frappe login.

**Key design decisions:**
- `allow_guest=True` on the endpoint so Google Sheets can call it anonymously
- Token stored in a `CSV Access Token` DocType — validation replaces auth
- Tokens are per-DocType, revocable by setting `active = 0`
- Only System Managers can generate tokens

---

## Files to Create

```
your_app/
    your_app/
        doctype/
            csv_access_token/
                csv_access_token.json
                csv_access_token.py
        api/
            csv_export.py
        public/
            js/
                csv_token_manager.js   (optional UI helper)
```

---

## 1. DocType: CSV Access Token

### `csv_access_token.json`

```json
{
    "doctype": "DocType",
    "name": "CSV Access Token",
    "module": "Your Module",
    "is_submittable": 0,
    "is_child_table": 0,
    "track_changes": 1,
    "fields": [
        {
            "fieldname": "label",
            "fieldtype": "Data",
            "label": "Label",
            "reqd": 1,
            "in_list_view": 1,
            "description": "Human readable name e.g. 'Families sheet for coaches'"
        },
        {
            "fieldname": "doctype_name",
            "fieldtype": "Data",
            "label": "DocType",
            "reqd": 1,
            "in_list_view": 1,
            "description": "The Frappe DocType this token grants access to"
        },
        {
            "fieldname": "token",
            "fieldtype": "Data",
            "label": "Token",
            "reqd": 1,
            "read_only": 1,
            "in_list_view": 1,
            "description": "Auto-generated secret token. Do not edit manually."
        },
        {
            "fieldname": "active",
            "fieldtype": "Check",
            "label": "Active",
            "default": "1",
            "in_list_view": 1,
            "description": "Uncheck to revoke access immediately"
        },
        {
            "fieldname": "generated_url",
            "fieldtype": "Small Text",
            "label": "Generated URL",
            "read_only": 1,
            "description": "Paste this URL into =IMPORTDATA() in Google Sheets"
        }
    ],
    "permissions": [
        {
            "role": "System Manager",
            "read": 1,
            "write": 1,
            "create": 1,
            "delete": 1
        }
    ]
}
```

### `csv_access_token.py`

```python
import frappe
import secrets
from frappe.model.document import Document

class CSVAccessToken(Document):

    def before_insert(self):
        # Auto-generate token on creation
        if not self.token:
            self.token = secrets.token_hex(16)  # 32 char hex string

    def after_insert(self):
        self._set_generated_url()

    def on_update(self):
        self._set_generated_url()

    def _set_generated_url(self):
        base_url = frappe.utils.get_url()
        url = (
            f"{base_url}/api/method/your_app.api.csv_export.download_csv"
            f"?doctype={self.doctype_name}&token={self.token}"
        )
        # Store the URL for easy copy-paste
        frappe.db.set_value("CSV Access Token", self.name, "generated_url", url)
```

---

## 2. CSV Export Endpoint

### `your_app/api/csv_export.py`

```python
import frappe
import csv
import io


@frappe.whitelist(allow_guest=True)
def download_csv(doctype, token):
    """
    Serve a DocType's data as a CSV file.
    Gated by a secret token stored in the CSV Access Token DocType.
    Designed to be called by Google Sheets =IMPORTDATA() without authentication.
    """

    # --- Validate token ---
    token_doc = frappe.db.get_value(
        "CSV Access Token",
        {
            "token": token,
            "doctype_name": doctype,
            "active": 1
        },
        ["name", "label"],
        as_dict=True
    )

    if not token_doc:
        frappe.throw("Invalid or expired token", frappe.AuthenticationError)

    # --- Fetch data ---
    # Use ignore_permissions since we've validated via token
    records = frappe.get_all(
        doctype,
        fields=["*"],
        ignore_permissions=True,
        order_by="creation asc"
    )

    if not records:
        # Return empty CSV with no headers rather than an error
        frappe.response["filename"] = f"{doctype}.csv"
        frappe.response["filecontent"] = ""
        frappe.response["type"] = "download"
        frappe.response["content_type"] = "text/csv"
        return

    # --- Build CSV ---
    # Remove internal Frappe fields that are not useful for export
    exclude_fields = {"name", "owner", "creation", "modified", "modified_by",
                      "docstatus", "idx", "parent", "parenttype", "parentfield"}

    fieldnames = [k for k in records[0].keys() if k not in exclude_fields]

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=fieldnames,
        extrasaction="ignore"   # silently drop any extra fields
    )
    writer.writeheader()
    writer.writerows(records)

    # --- Return CSV response ---
    frappe.response["filename"] = f"{doctype.lower().replace(' ', '_')}.csv"
    frappe.response["filecontent"] = output.getvalue()
    frappe.response["type"] = "download"
    frappe.response["content_type"] = "text/csv"


@frappe.whitelist()
def generate_token(doctype_name, label):
    """
    Programmatically create a new CSV Access Token.
    Only callable by System Manager (frappe.whitelist enforces login,
    DocType permissions enforce role).
    """
    frappe.only_for("System Manager")

    doc = frappe.get_doc({
        "doctype": "CSV Access Token",
        "label": label,
        "doctype_name": doctype_name,
        "active": 1
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()

    return {
        "token": doc.token,
        "url": doc.generated_url
    }


@frappe.whitelist()
def revoke_token(token_name):
    """
    Revoke a token by setting active = 0.
    Google Sheets will immediately get a 403 on next refresh.
    """
    frappe.only_for("System Manager")
    frappe.db.set_value("CSV Access Token", token_name, "active", 0)
    frappe.db.commit()
```

---

## 3. Register the API Module

In `hooks.py`, make sure the api module is discoverable. No special hook needed — Frappe auto-discovers whitelisted methods by module path. Just ensure `your_app/api/__init__.py` exists:

```python
# your_app/api/__init__.py
# (empty file — just marks this as a Python package)
```

---

## 4. Usage

### Generating a Token (via Frappe UI)

1. Go to **CSV Access Token List**
2. Click **New**
3. Fill in **Label** and **DocType**
4. Save — token is auto-generated, URL is populated in **Generated URL** field
5. Copy the Generated URL and paste into Google Sheets

### Google Sheets Formula

```
=IMPORTDATA("https://manager.ncesoccer.com/api/method/your_app.api.csv_export.download_csv?doctype=Families&token=a8f3c9d2e1b4")
```

Google Sheets will refresh this periodically. The data updates without any manual intervention.

### Revoking Access

Set `active = 0` on the token record. The next time Google Sheets refreshes, it will receive a 403 error and stop importing. No need to update the formula or notify the user — access simply stops.

---

## 5. Security Notes

- `allow_guest=True` is intentional — it allows Google Sheets to call the endpoint without a Frappe session. The token is the authentication mechanism.
- Tokens should be treated like passwords — only share via secure means
- Anyone with the URL can access the data, so do not use this for highly sensitive information
- Adding an `expires_on` Date field to the DocType and checking it in the endpoint is a recommended enhancement for time-limited access
- Consider adding a `last_accessed` Datetime field updated on each request for audit purposes

---

## 6. Optional Enhancement — Exclude Specific Fields Per Token

Add a `fields` Long Text field to `CSV Access Token` where the admin can specify a comma-separated list of fields to include. In `download_csv`, parse that and use it to filter `fieldnames` before writing the CSV. This lets you give different tokens different column visibility on the same DocType.

---

## 7. Suggested Enhancements (Future)

| Enhancement | Implementation |
|---|---|
| Field-level control per token | Add `fields` field to token DocType |
| Token expiry | Add `expires_on` Date field, check in endpoint |
| Access logging | Add `last_accessed` Datetime, update on each call |
| Filters per token | Add `filters` JSON field, apply to `frappe.get_all` |
| Rate limiting | Track call count per token per day |

---

## 8. Checklist

- [ ] `CSV Access Token` DocType created with all fields
- [ ] `csv_access_token.py` controller auto-generates token on insert
- [ ] `your_app/api/__init__.py` exists
- [ ] `csv_export.py` placed in `your_app/api/`
- [ ] Module path in endpoint matches app name exactly
- [ ] `bench migrate` run after adding DocType
- [ ] Token generated and URL tested in browser before using in Google Sheets
- [ ] Google Sheets formula tested with `=IMPORTDATA(url)`
- [ ] Revocation tested by setting `active = 0` and refreshing sheet
