# Frappe Framework - Utilities: Numbers and Strings

## Overview

Frappe provides utility functions for handling numbers (formatting, rounding, conversion) and strings (sanitization, formatting, manipulation).

## Number Utilities

### Type Conversion

```python
from frappe.utils import flt, cint, cstr

# Float conversion with precision
amount = flt("123.456")           # 123.456
amount = flt("123.456", 2)        # 123.46 (rounded to 2 decimals)
amount = flt(None)                # 0.0 (safe conversion)
amount = flt("invalid")           # 0.0 (safe conversion)

# Integer conversion
count = cint("42")                # 42
count = cint("42.9")              # 42 (truncates)
count = cint(None)                # 0 (safe conversion)
count = cint("invalid")           # 0 (safe conversion)

# String conversion
text = cstr(123)                  # "123"
text = cstr(None)                 # "" (empty string, not "None")
text = cstr([1, 2, 3])            # "[1, 2, 3]"
```

### Rounding

```python
from frappe.utils import rounded, flt

# Round to precision
value = rounded(123.456, 2)       # 123.46
value = rounded(123.456, 0)       # 123.0
value = rounded(123.456, -1)      # 120.0 (round to tens)

# Flt with precision
value = flt(123.456789, 3)        # 123.457
```

### Formatting Numbers

```python
from frappe.utils import fmt_money, format_value

# Format as currency
formatted = fmt_money(1234567.89)                    # "1,234,567.89"
formatted = fmt_money(1234567.89, currency="USD")    # "$1,234,567.89"
formatted = fmt_money(1234567.89, currency="EUR")    # "€1,234,567.89"

# Format with precision
formatted = fmt_money(1234.5, precision=2)           # "1,234.50"

# Number formatting
from frappe.utils import number_format
formatted = number_format(1234567.89)                # "1,234,567.89"
formatted = number_format(1234567.89, precision=0)   # "1,234,568"
```

### Number Comparison

```python
from frappe.utils import flt

# Safe comparison with floating point
val1 = flt(0.1 + 0.2, 2)  # 0.3 (not 0.30000000000000004)
val2 = flt(0.3, 2)        # 0.3

# Compare safely
are_equal = val1 == val2  # True
```

### Percentage Calculations

```python
from frappe.utils import flt

# Calculate percentage
total = 500
part = 125
percentage = flt(part / total * 100, 2)  # 25.0

# Apply percentage
base_amount = 1000
discount_percent = 10
discount_amount = flt(base_amount * discount_percent / 100, 2)  # 100.0
final_amount = base_amount - discount_amount  # 900.0
```

## String Utilities

### Basic String Operations

```python
from frappe.utils import cstr, strip_html, escape_html

# Safe string conversion
text = cstr(None)          # "" (not "None")
text = cstr(123)           # "123"

# Strip HTML tags
clean = strip_html("<p>Hello <b>World</b></p>")  # "Hello World"

# Escape HTML (prevent XSS)
safe = escape_html("<script>alert('xss')</script>")
# "&lt;script&gt;alert('xss')&lt;/script&gt;"
```

### URL and Path Utilities

```python
from frappe.utils import (
    get_url, get_url_to_form, get_url_to_list,
    get_url_to_report, get_link_to_form
)

# Get site URL
site_url = get_url()  # "https://mysite.com"

# Get URL to specific form
form_url = get_url_to_form("Task", "TASK-00001")
# "https://mysite.com/app/task/TASK-00001"

# Get URL to list view
list_url = get_url_to_list("Task")
# "https://mysite.com/app/task"

# Get URL to report
report_url = get_url_to_report("Task Summary", "Script Report")

# Get HTML link to form
link_html = get_link_to_form("Task", "TASK-00001")
# '<a href="/app/task/TASK-00001">TASK-00001</a>'
```

### String Formatting

```python
from frappe.utils import comma_and, comma_or, comma_sep

# Join list with commas and "and"
result = comma_and(["apple", "banana", "orange"])
# "apple, banana and orange"

# Join list with commas and "or"
result = comma_or(["option1", "option2", "option3"])
# "option1, option2 or option3"

# Simple comma separation
result = comma_sep(["a", "b", "c"])
# "a, b, c"
```

### Slug and Name Generation

```python
from frappe.utils import slugify, random_string, get_random_string

# Create URL-safe slug
slug = slugify("Hello World! This is a Test")
# "hello-world-this-is-a-test"

# Generate random string
random = random_string(10)           # e.g., "a3Bx9kMp2Q"
random = get_random_string(8)        # e.g., "xK9mPq2n"
```

### String Validation

```python
from frappe.utils import validate_email_address, validate_url, is_valid_url

# Validate email
is_valid = validate_email_address("user@example.com")  # True
is_valid = validate_email_address("invalid-email")     # False

# Validate with throw
validate_email_address("invalid", throw=True)  # Raises exception

# Validate URL
is_valid = is_valid_url("https://example.com")  # True
is_valid = is_valid_url("not-a-url")            # False
```

### Text Truncation

```python
from frappe.utils import truncate_string

# Truncate long text
short = truncate_string("This is a very long string that needs truncation", 20)
# "This is a very lo..."
```

### Phone Number Formatting

```python
from frappe.utils import validate_phone_number

# Validate phone number
is_valid = validate_phone_number("+1-234-567-8900")
is_valid = validate_phone_number("1234567890")
```

## JSON Utilities

```python
from frappe.utils import parse_json, as_json

# Parse JSON string
data = parse_json('{"name": "John", "age": 30}')
# Returns: {"name": "John", "age": 30}

# Safe parse (returns empty dict on error)
data = parse_json("invalid json")  # Returns {} or original

# Convert to JSON string
json_str = as_json({"name": "John"})
# '{"name": "John"}'

# Frappe's json module
import frappe
json_str = frappe.as_json({"key": "value"})
data = frappe.parse_json(json_str)
```

## Dictionary Utilities

```python
from frappe.utils import update_dict, get_value

# Update nested dictionary
original = {"a": {"b": 1}}
update_dict(original, {"a": {"c": 2}})
# original = {"a": {"b": 1, "c": 2}}

# Get nested value safely
nested = {"a": {"b": {"c": 1}}}
value = get_value(nested, "a.b.c")  # 1
value = get_value(nested, "a.x.y")  # None (not KeyError)
```

## Data Formatting

```python
from frappe.utils import format_value, sbool

# String to boolean
result = sbool("true")    # True
result = sbool("yes")     # True
result = sbool("1")       # True
result = sbool("false")   # False
result = sbool("")        # False
result = sbool(None)      # False
```

## Encoding Utilities

```python
import frappe

# Safe encode/decode
text = frappe.safe_decode("bytes or string")  # Always returns string
bytes_data = frappe.safe_encode("string")     # Always returns bytes

# Base64
import base64
encoded = base64.b64encode(b"Hello").decode()  # "SGVsbG8="
decoded = base64.b64decode(encoded)            # b"Hello"
```
