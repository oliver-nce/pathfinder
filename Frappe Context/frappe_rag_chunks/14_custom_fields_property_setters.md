# Frappe Framework - Custom Fields and Property Setters

## Overview

Custom Fields allow you to add new fields to existing DocTypes without modifying their source code. Property Setters allow you to modify properties of existing fields.

## Creating Custom Fields

### Using Python API

```python
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

# Create single custom field
create_custom_fields({
    "User": [
        {
            "fieldname": "employee_id",
            "fieldtype": "Data",
            "label": "Employee ID",
            "insert_after": "email",
            "reqd": 0
        }
    ]
})
frappe.db.commit()
```

### Multiple Custom Fields

```python
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

create_custom_fields({
    "User": [
        {
            "fieldname": "department",
            "fieldtype": "Link",
            "label": "Department",
            "options": "Department",
            "insert_after": "email"
        },
        {
            "fieldname": "desk_location",
            "fieldtype": "Data",
            "label": "Desk Location",
            "insert_after": "department"
        }
    ],
    "Customer": [
        {
            "fieldname": "loyalty_points",
            "fieldtype": "Int",
            "label": "Loyalty Points",
            "insert_after": "customer_name",
            "default": "0"
        }
    ]
})
frappe.db.commit()
```

### Field Types

```python
# Common fieldtypes
{
    "fieldtype": "Data",           # Single line text
    "fieldtype": "Text",           # Multi-line text
    "fieldtype": "Small Text",     # Small text area
    "fieldtype": "Long Text",      # Large text area
    "fieldtype": "Text Editor",    # Rich text editor
    "fieldtype": "Int",            # Integer
    "fieldtype": "Float",          # Decimal number
    "fieldtype": "Currency",       # Currency amount
    "fieldtype": "Percent",        # Percentage
    "fieldtype": "Date",           # Date picker
    "fieldtype": "Datetime",       # Date and time picker
    "fieldtype": "Time",           # Time picker
    "fieldtype": "Check",          # Checkbox (0/1)
    "fieldtype": "Select",         # Dropdown
    "fieldtype": "Link",           # Link to another doctype
    "fieldtype": "Dynamic Link",   # Dynamic link
    "fieldtype": "Table",          # Child table
    "fieldtype": "Attach",         # File attachment
    "fieldtype": "Attach Image",   # Image attachment
    "fieldtype": "Signature",      # Signature field
    "fieldtype": "HTML",           # HTML content
    "fieldtype": "Read Only",      # Read-only text
    "fieldtype": "Section Break",  # Section divider
    "fieldtype": "Column Break",   # Column divider
}
```

### Custom Field with Select Options

```python
create_custom_fields({
    "Task": [
        {
            "fieldname": "priority_level",
            "fieldtype": "Select",
            "label": "Priority Level",
            "options": "Low\nMedium\nHigh\nCritical",
            "default": "Medium",
            "insert_after": "status"
        }
    ]
})
```

### Custom Field with Link

```python
create_custom_fields({
    "Sales Invoice": [
        {
            "fieldname": "sales_person",
            "fieldtype": "Link",
            "label": "Sales Person",
            "options": "Sales Person",  # Target DocType
            "insert_after": "customer"
        }
    ]
})
```

### Custom Child Table Field

```python
# First create the child doctype if needed
create_custom_fields({
    "Sales Order": [
        {
            "fieldname": "custom_items",
            "fieldtype": "Table",
            "label": "Custom Items",
            "options": "Custom Item Child",  # Child DocType name
            "insert_after": "items"
        }
    ]
})
```

## Deleting Custom Fields

```python
# Delete by custom field name
frappe.delete_doc("Custom Field", "User-employee_id")
frappe.db.commit()

# Delete programmatically
custom_field = frappe.get_doc("Custom Field", "User-employee_id")
custom_field.delete()
frappe.db.commit()

# Check if exists before deleting
if frappe.db.exists("Custom Field", "User-employee_id"):
    frappe.delete_doc("Custom Field", "User-employee_id")
```

## Property Setters

Property Setters modify properties of existing fields without creating new ones.

### Create Property Setter

```python
# Change field property
frappe.make_property_setter({
    "doctype": "User",
    "fieldname": "middle_name",
    "property": "hidden",
    "value": "1",
    "property_type": "Check"
})
frappe.db.commit()
```

### Common Property Modifications

```python
# Make field mandatory
frappe.make_property_setter({
    "doctype": "Customer",
    "fieldname": "customer_group",
    "property": "reqd",
    "value": "1",
    "property_type": "Check"
})

# Make field read-only
frappe.make_property_setter({
    "doctype": "Sales Invoice",
    "fieldname": "posting_date",
    "property": "read_only",
    "value": "1",
    "property_type": "Check"
})

# Change default value
frappe.make_property_setter({
    "doctype": "Task",
    "fieldname": "priority",
    "property": "default",
    "value": "High",
    "property_type": "Text"
})

# Change field label
frappe.make_property_setter({
    "doctype": "User",
    "fieldname": "email",
    "property": "label",
    "value": "Email Address",
    "property_type": "Data"
})

# Add description/help text
frappe.make_property_setter({
    "doctype": "Customer",
    "fieldname": "tax_id",
    "property": "description",
    "value": "Enter the customer's tax identification number",
    "property_type": "Small Text"
})
```

### DocType Level Property Setter

```python
# Set property on the DocType itself (not a field)
frappe.make_property_setter({
    "doctype": "Task",
    "doctype_or_field": "DocType",
    "property": "track_changes",
    "value": "1",
    "property_type": "Check"
})

# Allow rename
frappe.make_property_setter({
    "doctype": "Customer",
    "doctype_or_field": "DocType",
    "property": "allow_rename",
    "value": "1",
    "property_type": "Check"
})
```

### Delete Property Setter

```python
# Property setter name format: doctype-fieldname-property
frappe.delete_doc("Property Setter", "User-middle_name-hidden")
frappe.db.commit()

# Or delete by filters
property_setters = frappe.get_all("Property Setter",
    filters={
        "doc_type": "User",
        "field_name": "middle_name"
    }
)
for ps in property_setters:
    frappe.delete_doc("Property Setter", ps.name)
```

## Custom Field in App Fixtures

For apps, define custom fields in fixtures to auto-create on install:

```python
# hooks.py
fixtures = [
    {
        "doctype": "Custom Field",
        "filters": [
            ["name", "in", [
                "User-employee_id",
                "User-department"
            ]]
        ]
    }
]
```

## Export/Import Custom Fields

```python
# Export custom field definition
custom_field = frappe.get_doc("Custom Field", "User-employee_id")
definition = custom_field.as_dict()

# Import/recreate
frappe.get_doc({
    "doctype": "Custom Field",
    **definition
}).insert()
```

## Checking if Custom Field Exists

```python
# Check by full name
exists = frappe.db.exists("Custom Field", "User-employee_id")

# Check if field exists on doctype
meta = frappe.get_meta("User")
has_field = meta.has_field("employee_id")
```
