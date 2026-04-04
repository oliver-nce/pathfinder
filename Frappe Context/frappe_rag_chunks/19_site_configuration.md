# Frappe Framework - Site Configuration

## Overview

Frappe site configuration controls database connections, site settings, and runtime behavior. Configuration is stored in `site_config.json` and common settings.

## Accessing Site Configuration

```python
import frappe

# Access configuration values
db_name = frappe.conf.db_name
db_password = frappe.conf.db_password
db_host = frappe.conf.db_host

# Custom configuration values
my_setting = frappe.conf.get("my_custom_setting")

# Check developer mode
if frappe.conf.developer_mode:
    print("Developer mode is enabled")
```

## Site Config File

Location: `sites/{site_name}/site_config.json`

```json
{
    "db_name": "site_database",
    "db_password": "database_password",
    "db_type": "mariadb",
    "db_host": "localhost",
    "db_port": 3306,
    
    "encryption_key": "xxxxxxxxxxxxxxxxxxxxx",
    
    "developer_mode": 1,
    "disable_website_cache": 1,
    
    "mail_server": "smtp.example.com",
    "mail_port": 587,
    "use_ssl": 1,
    "mail_login": "user@example.com",
    "mail_password": "mail_password",
    
    "custom_setting": "custom_value"
}
```

## Common Site Config

Location: `sites/common_site_config.json`

Settings that apply to all sites:

```json
{
    "background_workers": 4,
    "gunicorn_workers": 9,
    "socketio_port": 9000,
    "webserver_port": 8000,
    
    "redis_cache": "redis://localhost:13000",
    "redis_queue": "redis://localhost:11000",
    "redis_socketio": "redis://localhost:12000",
    
    "serve_default_site": true,
    "frappe_user": "frappe",
    
    "developer_mode": 0
}
```

## Setting Configuration via CLI

```bash
# Set single value
bench --site mysite set-config key value

# Set nested value
bench --site mysite set-config db_host "192.168.1.100"

# Enable developer mode
bench --site mysite set-config developer_mode 1

# View current config
bench --site mysite show-config
```

## Setting Configuration via Python

```python
# Read config
config = frappe.get_site_config()
print(config.db_name)

# Update config (not commonly done programmatically)
from frappe.installer import update_site_config
update_site_config("my_key", "my_value")
```

## System Settings (Single DocType)

System-wide settings stored in database:

```python
# Get system setting
language = frappe.get_single_value("System Settings", "language")
time_zone = frappe.get_single_value("System Settings", "time_zone")
date_format = frappe.get_single_value("System Settings", "date_format")

# Get multiple values
settings = frappe.get_doc("System Settings")
print(settings.country)
print(settings.currency)
```

### Common System Settings

```python
# Language and locale
language = frappe.get_single_value("System Settings", "language")
country = frappe.get_single_value("System Settings", "country")
time_zone = frappe.get_single_value("System Settings", "time_zone")

# Date/time formats
date_format = frappe.get_single_value("System Settings", "date_format")
time_format = frappe.get_single_value("System Settings", "time_format")
number_format = frappe.get_single_value("System Settings", "number_format")

# Security
password_policy = frappe.get_single_value("System Settings", "enable_password_policy")
session_expiry = frappe.get_single_value("System Settings", "session_expiry")
```

## Path Functions

```python
from frappe.utils import get_bench_path, get_site_path, get_files_path

# Get bench directory
bench_path = get_bench_path()
# /home/user/frappe-bench

# Get site directory
site_path = get_site_path()
# /home/user/frappe-bench/sites/mysite

# Get files directory
public_files = get_files_path()
# /home/user/frappe-bench/sites/mysite/public/files

private_files = get_files_path(is_private=True)
# /home/user/frappe-bench/sites/mysite/private/files

# Get site name
site_name = frappe.local.site
```

## Environment-Based Config

```python
# Check environment
import os

environment = os.environ.get("FRAPPE_ENV", "development")

if environment == "production":
    # Production settings
    pass
elif environment == "staging":
    # Staging settings
    pass
```

## Developer Mode Features

```python
# Developer mode enables:
# - Verbose error messages
# - No asset caching
# - No email sending (unless explicitly enabled)
# - Detailed SQL query logging

if frappe.conf.developer_mode:
    # Development-only code
    frappe.log("Debug info")
```

## Multi-Tenancy Configuration

```python
# Get current site
current_site = frappe.local.site

# Get all sites
import os
sites_path = os.path.join(get_bench_path(), "sites")
sites = [s for s in os.listdir(sites_path) 
         if os.path.isdir(os.path.join(sites_path, s)) 
         and not s.startswith(".")]
```

## Email Configuration

```python
# Email settings from config
mail_server = frappe.conf.get("mail_server")
mail_port = frappe.conf.get("mail_port")
mail_login = frappe.conf.get("mail_login")

# Or from Email Account doctype
default_account = frappe.get_doc("Email Account", {"default_outgoing": 1})
```

## Database Configuration

```python
# Get database info
db_name = frappe.conf.db_name
db_host = frappe.conf.get("db_host", "localhost")
db_port = frappe.conf.get("db_port", 3306)
db_type = frappe.conf.get("db_type", "mariadb")

# Check database connection
try:
    frappe.db.sql("SELECT 1")
    print("Database connected")
except Exception as e:
    print(f"Database error: {e}")
```

## Redis Configuration

```python
# Redis URLs from common config
redis_cache = frappe.conf.get("redis_cache")
redis_queue = frappe.conf.get("redis_queue")
redis_socketio = frappe.conf.get("redis_socketio")
```

## Custom App Configuration

Store app-specific settings:

```python
# In site_config.json
{
    "myapp_api_key": "xxxx",
    "myapp_debug": true,
    "myapp_settings": {
        "feature1": true,
        "feature2": false
    }
}
```

```python
# Access in code
api_key = frappe.conf.get("myapp_api_key")
settings = frappe.conf.get("myapp_settings", {})
feature1 = settings.get("feature1", False)
```
