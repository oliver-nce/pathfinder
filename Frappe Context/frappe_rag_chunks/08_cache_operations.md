# Frappe Framework - Cache Operations

## Overview

Frappe uses Redis for caching. The cache API provides methods to store, retrieve, and manage cached data for improved performance.

## Basic Cache Operations

### Set and Get

```python
# Store a value
frappe.cache().set("my_key", "my_value")

# Retrieve a value
value = frappe.cache().get("my_key")
# Returns: "my_value" or None if not found

# Store complex data (automatically serialized)
frappe.cache().set("user_data", {
    "name": "John",
    "roles": ["Admin", "Manager"],
    "settings": {"theme": "dark"}
})

# Retrieve complex data
user_data = frappe.cache().get("user_data")
```

### Set with Expiration

```python
# Cache with expiration (in seconds)
frappe.cache().set("temp_token", "abc123", expires_in_sec=3600)  # 1 hour

# Short-lived cache
frappe.cache().set("rate_limit", 1, expires_in_sec=60)  # 1 minute
```

### Delete and Check

```python
# Delete a cached value
frappe.cache().delete("my_key")

# Check if key exists
exists = frappe.cache().exists("my_key")
```

## Hash Operations

For storing multiple related values under one key:

```python
# Set hash field
frappe.cache().hset("user:settings", "theme", "dark")
frappe.cache().hset("user:settings", "language", "en")
frappe.cache().hset("user:settings", "notifications", "enabled")

# Get hash field
theme = frappe.cache().hget("user:settings", "theme")

# Get all hash fields
all_settings = frappe.cache().hgetall("user:settings")
# Returns: {"theme": "dark", "language": "en", "notifications": "enabled"}

# Delete hash field
frappe.cache().hdel("user:settings", "theme")
```

## List Operations

```python
# Push to list
frappe.cache().lpush("queue", "item1")
frappe.cache().rpush("queue", "item2")

# Pop from list
item = frappe.cache().lpop("queue")
item = frappe.cache().rpop("queue")

# Get list length
length = frappe.cache().llen("queue")

# Get range
items = frappe.cache().lrange("queue", 0, -1)  # Get all
```

## Set Operations

```python
# Add to set
frappe.cache().sadd("online_users", "user1")
frappe.cache().sadd("online_users", "user2")

# Check membership
is_online = frappe.cache().sismember("online_users", "user1")

# Get all members
online = frappe.cache().smembers("online_users")

# Remove from set
frappe.cache().srem("online_users", "user1")
```

## Clearing Cache

### Clear All Cache

```python
# Clear entire cache (use with caution)
frappe.clear_cache()
```

### Clear Specific Cache

```python
# Clear cache for specific doctype
frappe.clear_cache(doctype="User")

# Clear document cache
frappe.clear_document_cache("User", "admin@example.com")

# Clear cache for specific user
frappe.clear_cache(user="user@example.com")
```

### Clear Website Cache

```python
# Clear website related cache
frappe.clear_website_cache()

# Clear specific page cache
frappe.clear_website_cache(path="/about")
```

## Cache Helpers

### Get or Set Pattern

```python
def get_expensive_data():
    # Check cache first
    cache_key = "expensive_data"
    data = frappe.cache().get(cache_key)
    
    if data is None:
        # Calculate expensive data
        data = calculate_expensive_operation()
        # Store in cache
        frappe.cache().set(cache_key, data, expires_in_sec=3600)
    
    return data
```

### Using frappe.cache.get_value()

```python
# Built-in get-or-generate pattern
def get_user_stats():
    return frappe.cache().get_value(
        "user_stats",
        generator=calculate_user_stats,  # Called if not in cache
        expires_in_sec=300
    )
```

## Document Cache

Frappe automatically caches documents:

```python
# This uses document cache automatically
doc = frappe.get_cached_doc("User", "admin@example.com")

# Get cached value (faster than get_value for repeated calls)
email = frappe.get_cached_value("User", "admin@example.com", "email")

# Clear specific document from cache
frappe.clear_document_cache("User", "admin@example.com")
```

## Cache Keys Best Practices

```python
# Use meaningful, namespaced keys
frappe.cache().set("myapp:user:123:settings", settings)
frappe.cache().set("myapp:report:daily_summary:2024-01-15", data)

# Include version for invalidation
cache_version = "v1"
key = f"myapp:{cache_version}:user_stats"
frappe.cache().set(key, stats)

# Site-specific keys (automatically handled by frappe.cache)
# Frappe automatically prefixes keys with site name
```

## Redis Commands (Advanced)

For direct Redis access:

```python
# Get Redis connection
redis_conn = frappe.cache().redis

# Execute raw Redis commands
redis_conn.ping()
redis_conn.info()

# Use Redis transactions
pipe = redis_conn.pipeline()
pipe.set("key1", "value1")
pipe.set("key2", "value2")
pipe.execute()
```
