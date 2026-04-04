# Frappe Framework - Utilities: Date and Time

## Overview

The `frappe.utils` module provides extensive date and time utilities for common operations like formatting, calculations, and comparisons.

## Current Date and Time

```python
from frappe.utils import (
    now, now_datetime, today, nowdate, nowtime,
    get_datetime, getdate
)

# Current datetime as string
current = now()  # "2024-01-15 14:30:45.123456"

# Current datetime as datetime object
current_dt = now_datetime()  # datetime.datetime object

# Current date as string
current_date = today()  # "2024-01-15"
current_date = nowdate()  # "2024-01-15" (alias)

# Current time as string
current_time = nowtime()  # "14:30:45.123456"
```

## Converting to Date/Datetime

```python
from frappe.utils import getdate, get_datetime

# String to date
date_obj = getdate("2024-01-15")  # datetime.date object
date_obj = getdate("2024/01/15")  # Also works
date_obj = getdate("15-01-2024")  # Handles various formats

# String to datetime
dt_obj = get_datetime("2024-01-15 14:30:00")  # datetime.datetime object

# From date to datetime
dt_obj = get_datetime(date_obj)

# Handle None safely
date_obj = getdate(None)  # Returns None, not error
```

## Date Arithmetic

```python
from frappe.utils import (
    add_days, add_months, add_years,
    add_to_date, date_diff, time_diff
)

# Add/subtract days
tomorrow = add_days(today(), 1)
last_week = add_days(today(), -7)
next_30_days = add_days(today(), 30)

# Add/subtract months
next_month = add_months(today(), 1)
last_quarter = add_months(today(), -3)

# Add/subtract years
next_year = add_years(today(), 1)
five_years_ago = add_years(today(), -5)

# Generic add function
future_date = add_to_date(today(), days=5, months=2, years=1)
future_date = add_to_date(today(), hours=5, minutes=30)
```

## Date Differences

```python
from frappe.utils import date_diff, time_diff, time_diff_in_seconds

# Difference in days
days = date_diff("2024-12-31", "2024-01-01")  # 365

# Difference in time (returns timedelta)
diff = time_diff("14:30:00", "10:00:00")

# Difference in seconds
seconds = time_diff_in_seconds("14:30:00", "10:00:00")  # 16200.0
```

## Date Formatting

```python
from frappe.utils import (
    format_date, format_datetime, format_time,
    formatdate, format_duration
)

# Format date for display
formatted = format_date("2024-01-15")  # "January 15, 2024" (based on system settings)

# Format with specific format
formatted = formatdate("2024-01-15", "dd-MM-yyyy")  # "15-01-2024"
formatted = formatdate("2024-01-15", "MMM d, yyyy")  # "Jan 15, 2024"

# Format datetime
formatted = format_datetime("2024-01-15 14:30:00")  # "January 15, 2024 2:30 PM"

# Format time
formatted = format_time("14:30:00")  # "2:30 PM"

# Format duration (seconds to readable)
formatted = format_duration(3661)  # "1h 1m 1s"
```

## Date Comparison

```python
from frappe.utils import getdate, now_datetime

date1 = getdate("2024-01-15")
date2 = getdate("2024-01-20")

# Compare dates
is_before = date1 < date2  # True
is_after = date1 > date2   # False
is_equal = date1 == date2  # False

# Check if date is past
from frappe.utils import today, getdate
is_past = getdate("2020-01-01") < getdate(today())

# Check if date is future
is_future = getdate("2030-01-01") > getdate(today())
```

## Date Range Operations

```python
from frappe.utils import (
    get_first_day, get_last_day,
    get_first_day_of_week, get_last_day_of_week,
    get_quarter_start, get_quarter_ending,
    get_year_start, get_year_ending
)

date = "2024-06-15"

# Month boundaries
first_of_month = get_first_day(date)  # "2024-06-01"
last_of_month = get_last_day(date)    # "2024-06-30"

# Week boundaries
week_start = get_first_day_of_week(date)  # Monday of that week
week_end = get_last_day_of_week(date)     # Sunday of that week

# Quarter boundaries
quarter_start = get_quarter_start(date)   # "2024-04-01"
quarter_end = get_quarter_ending(date)    # "2024-06-30"

# Year boundaries
year_start = get_year_start(date)         # "2024-01-01"
year_end = get_year_ending(date)          # "2024-12-31"
```

## Date Validation

```python
from frappe.utils import validate_date_range, is_valid_date

# Check if valid date string
is_valid = is_valid_date("2024-01-15")  # True
is_valid = is_valid_date("invalid")     # False

# Validate date range
validate_date_range("2024-01-01", "2024-12-31")  # Passes
validate_date_range("2024-12-31", "2024-01-01")  # Throws error
```

## Timezone Operations

```python
from frappe.utils import (
    convert_utc_to_user_timezone,
    convert_utc_to_system_timezone,
    get_time_zone
)

# Get system timezone
tz = get_time_zone()  # e.g., "Asia/Kolkata"

# Convert UTC to user timezone
local_time = convert_utc_to_user_timezone(utc_datetime)

# Convert UTC to system timezone
system_time = convert_utc_to_system_timezone(utc_datetime)
```

## Date Parsing

```python
from frappe.utils import parse_date, get_datetime_str

# Parse various date formats
date = parse_date("15/01/2024")   # Handles dd/mm/yyyy
date = parse_date("01-15-2024")   # Handles mm-dd-yyyy
date = parse_date("Jan 15, 2024") # Handles text dates

# Convert datetime to string
date_str = get_datetime_str(datetime_obj)  # "2024-01-15 14:30:00"
```

## Fiscal Year Utilities

```python
from frappe.utils import get_fiscal_year, get_fiscal_years

# Get fiscal year for a date
fiscal_year = get_fiscal_year("2024-06-15")
# Returns: ("FY 2024-25", "2024-04-01", "2025-03-31")

# Get all fiscal years
all_fy = get_fiscal_years(company="My Company")
```

## Common Date Patterns

```python
from frappe.utils import today, add_days, getdate

# Get last N days
last_7_days_start = add_days(today(), -7)

# Get documents from last 7 days
recent_tasks = frappe.get_all("Task",
    filters={"creation": [">=", last_7_days_start]},
    fields=["name", "subject", "creation"]
)

# Check if overdue
due_date = getdate("2024-01-01")
is_overdue = due_date < getdate(today())

# Calculate age in days
creation_date = getdate("2024-01-01")
age_days = (getdate(today()) - creation_date).days
```
