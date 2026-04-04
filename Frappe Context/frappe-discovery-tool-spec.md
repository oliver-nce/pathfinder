# Frappe Discovery Tool - Project Specification

## Project Overview

**App Name:** Frappe Discovery Tool  
**Type:** Electron Desktop Application (Mac)  
**Purpose:** Discover, catalog, and manage Frappe/ERPNext installations via database queries and CLI command composition

### What This App Does

1. **Connects to MariaDB/RDS** - Stores multiple database connections securely
2. **Runs Discovery Queries** - Executes SQL queries to discover Frappe installation details
3. **Catalogs Results in SQLite** - Stores discovered data locally for offline access and history
4. **Composes CLI Commands** - Generates bench commands based on discovered data
5. **Logs Everything** - Maintains audit trail of all actions and results

---

## Tech Stack

| Component | Technology | Why |
|-----------|------------|-----|
| Desktop Framework | Electron | Cross-platform, runs on Mac |
| Frontend | HTML/CSS/JavaScript (Vanilla or Vue.js) | Simple, lightweight |
| Backend (Main Process) | Node.js | Electron's main process |
| Local Database | SQLite (better-sqlite3) | Lightweight, no server needed |
| Remote Database | mysql2 | MariaDB/MySQL connector |
| UI Framework | Tailwind CSS | Fast styling, small footprint |
| Icons | Lucide Icons | Clean, consistent |

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  SQLite Module  │  │  MySQL Module   │  │ SSH Module  │ │
│  │  (Local Store)  │  │  (Remote Query) │  │ (Optional)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                              │                               │
│                     IPC Communication                        │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────┐
│                    Electron Renderer Process                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                      Web UI (HTML/JS)                    │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐ │ │
│  │  │Connections│ │ Discovery │ │  Command  │ │  Logs   │ │ │
│  │  │  Manager  │ │  Results  │ │ Composer  │ │ Viewer  │ │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └─────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Features by Screen

### Screen 1: Connections Manager

**Purpose:** Store and manage database connection credentials

**UI Elements:**
- List of saved connections (cards or table)
- "Add Connection" button → opens modal
- Connection card shows: Name, Host, Status (connected/disconnected)
- Actions per connection: Test, Edit, Delete, Set as Default

**Connection Form Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | text | Yes | Friendly name (e.g., "Production RDS") |
| Host | text | Yes | RDS endpoint or IP |
| Port | number | No | Default: 3306 |
| Username | text | Yes | Usually "admin" for RDS root |
| Password | password | Yes | Stored encrypted in SQLite |
| Description | textarea | No | Notes about this connection |
| Is Root | checkbox | No | Has privileges to see all databases |

**Actions:**
- Test Connection: Attempts to connect and returns success/failure
- Auto-discover: After connecting, auto-detect all Frappe databases

---

### Screen 2: Discovery Dashboard

**Purpose:** Run discovery queries and view results

**Sections:**

#### 2a. Database/Site Selector
- Dropdown of discovered databases (sites)
- "Refresh" button to re-scan
- Shows: Database name, size, last discovered date

#### 2b. Discovery Categories (Tabs or Accordion)

**Category: Installation Info**
- Installed apps (from tabInstalled_Application)
- App versions and git branches
- Installation dates

**Category: Users**
- All users with email, enabled status
- User types (System User, Website User)
- Roles per user
- Last login dates
- Active sessions

**Category: System Config**
- System Settings values
- Email configuration status
- Scheduler status

**Category: Customizations**
- Custom DocTypes
- Custom Fields
- Custom Scripts
- Property Setters

**Category: Health**
- Database size (total and per table)
- Error log summary (count by type)
- Failed background jobs
- Scheduled jobs status

#### 2c. Query Results Panel
- Table view of query results
- Export to CSV/JSON buttons
- "Save to Catalog" button (stores snapshot in SQLite)

---

### Screen 3: Command Composer

**Purpose:** Generate bench CLI commands based on discovered data

**UI Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  Command Category: [Dropdown]                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ○ Backup Site                                         │ │
│  │ ○ Restore Site                                        │ │
│  │ ○ Install App                                         │ │
│  │ ○ Uninstall App                                       │ │
│  │ ○ Migrate                                             │ │
│  │ ○ Clear Cache                                         │ │
│  │ ○ Set Admin Password                                  │ │
│  │ ○ Add User                                            │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Parameters:                                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Site: [dropdown - auto-populated from discovery]      │ │
│  │ App:  [dropdown - auto-populated from discovery]      │ │
│  │ ...                                                   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Generated Command:                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ bench --site mysite.localhost backup --with-files     │ │
│  └──────────────────────────────────────────────────────┘ │
│  [Copy to Clipboard] [Save to Log] [Execute via SSH*]     │
└────────────────────────────────────────────────────────────┘
```

**Command Templates:**

```javascript
const commandTemplates = {
  backup: {
    name: "Backup Site",
    template: "bench --site {site} backup",
    options: [
      { flag: "--with-files", label: "Include files", type: "checkbox" },
      { flag: "--backup-path", label: "Backup path", type: "text" }
    ]
  },
  restore: {
    name: "Restore Site",
    template: "bench --site {site} restore {backup_file}",
    params: [
      { name: "backup_file", label: "Backup file path", type: "text", required: true }
    ],
    options: [
      { flag: "--with-public-files", label: "Public files path", type: "text" },
      { flag: "--with-private-files", label: "Private files path", type: "text" }
    ]
  },
  install_app: {
    name: "Install App",
    template: "bench --site {site} install-app {app}",
    params: [
      { name: "app", label: "App name", type: "select", source: "discovered_apps" }
    ]
  },
  // ... more commands
};
```

---

### Screen 4: Catalog/History

**Purpose:** View stored discovery snapshots and action logs

**Tabs:**

#### 4a. Discovery Snapshots
- List of saved discovery runs
- Timestamp, connection, databases scanned
- Click to view details
- Compare two snapshots (diff view)

#### 4b. Command Log
- History of generated/executed commands
- Timestamp, command, result (if executed)
- Filter by date, command type, site

#### 4c. Error Log
- Captured errors from discovery or connections
- Useful for troubleshooting

---

## SQLite Database Schema

```sql
-- Store database connections (credentials encrypted)
CREATE TABLE connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    host TEXT NOT NULL,
    port INTEGER DEFAULT 3306,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    description TEXT,
    is_root INTEGER DEFAULT 0,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Store discovered databases (Frappe sites)
CREATE TABLE discovered_databases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id INTEGER NOT NULL,
    database_name TEXT NOT NULL,
    size_mb REAL,
    is_frappe_site INTEGER DEFAULT 0,
    first_discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_scanned_at DATETIME,
    FOREIGN KEY (connection_id) REFERENCES connections(id),
    UNIQUE(connection_id, database_name)
);

-- Store discovered apps per database
CREATE TABLE discovered_apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    database_id INTEGER NOT NULL,
    app_name TEXT NOT NULL,
    version TEXT,
    git_branch TEXT,
    installed_at DATETIME,
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (database_id) REFERENCES discovered_databases(id)
);

-- Store discovered users per database
CREATE TABLE discovered_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    database_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    email TEXT,
    full_name TEXT,
    user_type TEXT,
    enabled INTEGER,
    last_login DATETIME,
    roles TEXT,  -- JSON array of roles
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (database_id) REFERENCES discovered_databases(id)
);

-- Store discovery snapshots (point-in-time captures)
CREATE TABLE discovery_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id INTEGER NOT NULL,
    database_id INTEGER,
    snapshot_type TEXT NOT NULL,  -- 'full', 'apps', 'users', 'config', etc.
    data JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (connection_id) REFERENCES connections(id),
    FOREIGN KEY (database_id) REFERENCES discovered_databases(id)
);

-- Store command history
CREATE TABLE command_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id INTEGER,
    database_name TEXT,
    command_type TEXT NOT NULL,
    command_text TEXT NOT NULL,
    parameters JSON,
    executed INTEGER DEFAULT 0,
    execution_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    executed_at DATETIME,
    FOREIGN KEY (connection_id) REFERENCES connections(id)
);

-- Store action/error logs
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_type TEXT NOT NULL,  -- 'INFO', 'ERROR', 'WARNING', 'ACTION'
    category TEXT,           -- 'connection', 'discovery', 'command', etc.
    message TEXT NOT NULL,
    details JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Store custom discovery queries (user can add their own)
CREATE TABLE custom_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    sql_query TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Discovery Queries (Built-in)

Store these as the default queries the app can run:

```javascript
const discoveryQueries = {
  // Installation Info
  installed_apps: {
    name: "Installed Applications",
    category: "installation",
    sql: `SELECT app_name, git_branch, version, installed 
          FROM tabInstalled_Application 
          ORDER BY installed`
  },
  
  // Users
  all_users: {
    name: "All Users",
    category: "users",
    sql: `SELECT name, email, full_name, user_type, enabled, 
                 last_login, last_active, creation
          FROM tabUser 
          WHERE name NOT IN ('Guest', 'Administrator')
          ORDER BY last_login DESC`
  },
  
  system_managers: {
    name: "System Managers",
    category: "users",
    sql: `SELECT u.name, u.email, u.full_name, u.enabled, u.last_login
          FROM tabUser u
          JOIN \`tabHas Role\` r ON r.parent = u.name
          WHERE r.role = 'System Manager' AND r.parenttype = 'User'`
  },
  
  user_roles: {
    name: "User Roles",
    category: "users",
    sql: `SELECT parent as user, GROUP_CONCAT(role) as roles
          FROM \`tabHas Role\`
          WHERE parenttype = 'User'
          GROUP BY parent`
  },
  
  active_sessions: {
    name: "Active Sessions",
    category: "users",
    sql: `SELECT user, device, status, last_request
          FROM tabSessions
          WHERE TIMESTAMPDIFF(HOUR, last_request, NOW()) < 24
          ORDER BY last_request DESC`
  },
  
  // System Config
  system_settings: {
    name: "System Settings",
    category: "config",
    sql: `SELECT field, value 
          FROM tabSingles 
          WHERE doctype = 'System Settings'`
  },
  
  email_accounts: {
    name: "Email Accounts",
    category: "config",
    sql: `SELECT name, email_id, enable_incoming, enable_outgoing, 
                 default_incoming, default_outgoing
          FROM \`tabEmail Account\``
  },
  
  // Customizations
  custom_doctypes: {
    name: "Custom DocTypes",
    category: "customizations",
    sql: `SELECT name, module, creation, modified
          FROM tabDocType 
          WHERE custom = 1
          ORDER BY module, name`
  },
  
  custom_fields: {
    name: "Custom Fields",
    category: "customizations",
    sql: `SELECT dt, fieldname, label, fieldtype, insert_after
          FROM \`tabCustom Field\`
          ORDER BY dt, idx`
  },
  
  property_setters: {
    name: "Property Setters",
    category: "customizations",
    sql: `SELECT doc_type, field_name, property, value
          FROM \`tabProperty Setter\`
          ORDER BY doc_type, field_name`
  },
  
  custom_scripts: {
    name: "Custom Scripts (Client Scripts)",
    category: "customizations",
    sql: `SELECT name, dt, script_type, enabled
          FROM \`tabClient Script\`
          ORDER BY dt`
  },
  
  server_scripts: {
    name: "Server Scripts",
    category: "customizations",
    sql: `SELECT name, script_type, reference_doctype, disabled
          FROM \`tabServer Script\`
          ORDER BY reference_doctype`
  },
  
  // Health
  database_size: {
    name: "Database Size by Table",
    category: "health",
    sql: `SELECT table_name,
                 ROUND(data_length / 1024 / 1024, 2) AS data_mb,
                 ROUND(index_length / 1024 / 1024, 2) AS index_mb,
                 table_rows
          FROM information_schema.tables
          WHERE table_schema = DATABASE()
          ORDER BY data_length DESC
          LIMIT 30`
  },
  
  total_db_size: {
    name: "Total Database Size",
    category: "health",
    sql: `SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS total_mb
          FROM information_schema.tables
          WHERE table_schema = DATABASE()`
  },
  
  error_log_summary: {
    name: "Error Log Summary",
    category: "health",
    sql: `SELECT method, COUNT(*) as count, MAX(creation) as last_occurrence
          FROM tabError_Log
          GROUP BY method
          ORDER BY count DESC
          LIMIT 20`
  },
  
  recent_errors: {
    name: "Recent Errors",
    category: "health",
    sql: `SELECT name, method, error, creation
          FROM tabError_Log
          ORDER BY creation DESC
          LIMIT 50`
  },
  
  scheduled_jobs: {
    name: "Scheduled Jobs",
    category: "health",
    sql: `SELECT name, method, frequency, last_execution, next_execution, stopped
          FROM \`tabScheduled Job Type\`
          ORDER BY next_execution`
  },
  
  failed_jobs: {
    name: "Failed Background Jobs",
    category: "health",
    sql: `SELECT name, job_name, status, exc_info, creation
          FROM \`tabRQ Job\`
          WHERE status = 'failed'
          ORDER BY creation DESC
          LIMIT 20`
  },
  
  // Site Info
  site_config_db: {
    name: "Site Configuration (DB)",
    category: "installation",
    sql: `SELECT * FROM tabSite LIMIT 1`
  }
};
```

---

## Command Templates

```javascript
const commandTemplates = {
  // Site Management
  backup_site: {
    name: "Backup Site",
    category: "site",
    template: "bench --site {site} backup",
    params: [],
    options: [
      { flag: "--with-files", label: "Include files", type: "checkbox", default: false },
      { flag: "--backup-path", label: "Custom backup path", type: "text", placeholder: "/path/to/backups" }
    ],
    description: "Creates a backup of the site's database and optionally files."
  },
  
  restore_site: {
    name: "Restore Site",
    category: "site",
    template: "bench --site {site} restore {backup_path}",
    params: [
      { name: "backup_path", label: "Backup file (.sql.gz)", type: "text", required: true }
    ],
    options: [
      { flag: "--with-public-files", label: "Public files backup", type: "text" },
      { flag: "--with-private-files", label: "Private files backup", type: "text" }
    ],
    description: "Restores a site from a backup file. WARNING: Overwrites existing data!"
  },
  
  migrate_site: {
    name: "Run Migrations",
    category: "site",
    template: "bench --site {site} migrate",
    params: [],
    options: [
      { flag: "--skip-failing", label: "Skip failing patches", type: "checkbox" }
    ],
    description: "Runs database migrations after code updates."
  },
  
  clear_cache: {
    name: "Clear Cache",
    category: "site",
    template: "bench --site {site} clear-cache",
    params: [],
    options: [],
    description: "Clears all cached data for the site."
  },
  
  // User Management
  set_admin_password: {
    name: "Set Admin Password",
    category: "users",
    template: "bench --site {site} set-admin-password {password}",
    params: [
      { name: "password", label: "New Password", type: "password", required: true }
    ],
    options: [],
    description: "Changes the Administrator account password."
  },
  
  add_system_manager: {
    name: "Add System Manager",
    category: "users",
    template: "bench --site {site} add-system-manager {email}",
    params: [
      { name: "email", label: "Email Address", type: "email", required: true }
    ],
    options: [
      { flag: "--first-name", label: "First Name", type: "text" },
      { flag: "--last-name", label: "Last Name", type: "text" }
    ],
    description: "Creates a new user with System Manager role."
  },
  
  // App Management
  install_app: {
    name: "Install App",
    category: "apps",
    template: "bench --site {site} install-app {app}",
    params: [
      { name: "app", label: "App Name", type: "select", source: "bench_apps", required: true }
    ],
    options: [],
    description: "Installs an app on the site. App must already be in bench."
  },
  
  uninstall_app: {
    name: "Uninstall App",
    category: "apps",
    template: "bench --site {site} uninstall-app {app}",
    params: [
      { name: "app", label: "App Name", type: "select", source: "installed_apps", required: true }
    ],
    options: [
      { flag: "--force", label: "Force uninstall", type: "checkbox" },
      { flag: "--yes", label: "Skip confirmation", type: "checkbox" }
    ],
    description: "Removes an app from the site. WARNING: Deletes app data!"
  },
  
  // Bench Operations
  get_app: {
    name: "Get App from GitHub",
    category: "bench",
    template: "bench get-app {repo_url}",
    params: [
      { name: "repo_url", label: "GitHub URL", type: "text", required: true, placeholder: "https://github.com/org/app" }
    ],
    options: [
      { flag: "--branch", label: "Branch", type: "text", placeholder: "version-16" }
    ],
    description: "Downloads an app from GitHub into the bench."
  },
  
  remove_app: {
    name: "Remove App from Bench",
    category: "bench",
    template: "bench remove-app {app}",
    params: [
      { name: "app", label: "App Name", type: "select", source: "bench_apps", required: true }
    ],
    options: [
      { flag: "--force", label: "Force remove", type: "checkbox" }
    ],
    description: "Removes an app from the bench entirely."
  },
  
  bench_update: {
    name: "Update Bench",
    category: "bench",
    template: "bench update",
    params: [],
    options: [
      { flag: "--pull", label: "Pull latest code", type: "checkbox", default: true },
      { flag: "--apps", label: "Specific apps only", type: "text", placeholder: "erpnext,hrms" },
      { flag: "--no-backup", label: "Skip backup", type: "checkbox" },
      { flag: "--no-compile", label: "Skip asset compilation", type: "checkbox" }
    ],
    description: "Updates all apps and runs migrations."
  },
  
  bench_build: {
    name: "Build Assets",
    category: "bench",
    template: "bench build",
    params: [],
    options: [
      { flag: "--app", label: "Specific app", type: "text" },
      { flag: "--force", label: "Force rebuild", type: "checkbox" }
    ],
    description: "Compiles frontend assets (JS/CSS)."
  },
  
  // Scheduler
  enable_scheduler: {
    name: "Enable Scheduler",
    category: "scheduler",
    template: "bench --site {site} enable-scheduler",
    params: [],
    options: [],
    description: "Enables background job processing."
  },
  
  disable_scheduler: {
    name: "Disable Scheduler",
    category: "scheduler",
    template: "bench --site {site} disable-scheduler",
    params: [],
    options: [],
    description: "Disables background job processing."
  },
  
  // Console/Debug
  console: {
    name: "Open Console",
    category: "debug",
    template: "bench --site {site} console",
    params: [],
    options: [],
    description: "Opens Python shell with Frappe context."
  },
  
  execute: {
    name: "Execute Function",
    category: "debug",
    template: "bench --site {site} execute {method}",
    params: [
      { name: "method", label: "Method path", type: "text", required: true, placeholder: "frappe.client.get" }
    ],
    options: [
      { flag: "--args", label: "Arguments (JSON)", type: "text", placeholder: '{"doctype": "User"}' }
    ],
    description: "Runs a specific Python function."
  }
};
```

---

## File Structure

```
frappe-discovery-tool/
├── package.json
├── main.js                    # Electron main process
├── preload.js                 # Preload script for IPC
├── src/
│   ├── index.html            # Main window HTML
│   ├── css/
│   │   └── styles.css        # Tailwind + custom styles
│   ├── js/
│   │   ├── renderer.js       # Main renderer logic
│   │   ├── connections.js    # Connection management
│   │   ├── discovery.js      # Discovery queries
│   │   ├── commands.js       # Command composer
│   │   └── logs.js           # Log viewer
│   └── components/           # Reusable UI components
│       ├── modal.js
│       ├── table.js
│       └── toast.js
├── lib/
│   ├── database.js           # SQLite operations
│   ├── mysql-client.js       # MariaDB connection
│   ├── encryption.js         # Password encryption
│   └── queries.js            # Built-in query definitions
├── data/
│   └── app.db                # SQLite database (created at runtime)
└── assets/
    └── icon.png              # App icon
```

---

## Build Instructions for Cursor

### Step 1: Initialize Project

Prompt for Cursor:
```
Create a new Electron project with the following:
- Name: frappe-discovery-tool
- Use electron-forge for building
- Include these dependencies: better-sqlite3, mysql2, electron-store
- Set up Tailwind CSS for styling
- Configure for Mac build (darwin, x64 and arm64)
```

### Step 2: Create Main Process

Prompt for Cursor:
```
Create main.js for Electron with:
1. Single window, 1400x900 default size
2. IPC handlers for:
   - database operations (SQLite)
   - MySQL connections (connect, query, disconnect)
   - file operations (export CSV/JSON)
3. Menu bar with standard Mac menus
4. Auto-create SQLite database on first run using this schema: [paste schema]
```

### Step 3: Create Database Module

Prompt for Cursor:
```
Create lib/database.js with these methods:
- initDatabase() - creates tables if not exist
- addConnection(data) - stores encrypted connection
- getConnections() - returns all connections
- testConnection(id) - tests a connection
- saveDiscoverySnapshot(connectionId, dbId, type, data)
- getSnapshots(filters)
- logCommand(data)
- logActivity(type, category, message, details)
Use better-sqlite3 for synchronous operations.
Password encryption using electron-store's built-in encryption.
```

### Step 4: Create MySQL Client Module

Prompt for Cursor:
```
Create lib/mysql-client.js with:
- connect(host, port, user, password, database?) - returns connection
- query(connection, sql) - executes query, returns results
- getDatabases(connection) - lists all databases
- disconnect(connection)
- Use mysql2/promise for async operations
- Handle connection errors gracefully
- Add timeout (10 seconds) for connections
```

### Step 5: Create Main UI

Prompt for Cursor:
```
Create src/index.html with:
1. Sidebar navigation: Connections, Discovery, Commands, Logs
2. Main content area that changes based on nav
3. Use Tailwind CSS classes
4. Dark mode support (respect system preference)
5. Professional look similar to VS Code or TablePlus

Include sections for:
- Connection manager (list + add/edit modal)
- Discovery dashboard (database selector, query categories, results table)
- Command composer (category selector, command builder, output display)
- Logs viewer (filterable table)
```

### Step 6: Create Renderer Scripts

Prompt for Cursor:
```
Create renderer.js that:
1. Handles navigation between sections
2. Communicates with main process via IPC
3. Manages UI state

Create connections.js that:
1. Loads and displays saved connections
2. Opens modal for add/edit
3. Tests connections with visual feedback
4. Sets default connection

Create discovery.js that:
1. Uses the built-in queries from queries.js
2. Displays results in sortable tables
3. Allows export to CSV/JSON
4. Saves snapshots to SQLite

Create commands.js that:
1. Uses command templates
2. Builds command string from selections
3. Copies to clipboard
4. Logs generated commands
```

### Step 7: Build and Package

Prompt for Cursor:
```
Configure electron-forge for:
1. Mac DMG build
2. Code signing (optional, leave placeholders)
3. Auto-update support (optional)
4. App icon

Create build scripts in package.json:
- npm run start (development)
- npm run build (production build)
- npm run make (create DMG)
```

---

## UI Mockup Descriptions

### Connections Screen
```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Connections                         [+ Add New]   │
│            │                                                     │
│ Connections│  ┌─────────────────┐ ┌─────────────────┐           │
│ Discovery  │  │ ★ Production    │ │   Staging       │           │
│ Commands   │  │ rds.aws.com     │ │ staging.rds.com │           │
│ Logs       │  │ ● Connected     │ │ ○ Disconnected  │           │
│            │  │ [Test] [Edit]   │ │ [Test] [Edit]   │           │
│            │  └─────────────────┘ └─────────────────┘           │
│            │                                                     │
│            │  Last tested: 2 minutes ago                        │
└─────────────────────────────────────────────────────────────────┘
```

### Discovery Screen
```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Discovery                                         │
│            │                                                     │
│            │  Connection: [Production ▼]  Database: [mysite ▼]  │
│            │                                                     │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ [Apps] [Users] [Config] [Customizations] [Health]│
│            │  └─────────────────────────────────────────────┘   │
│            │                                                     │
│            │  Installed Applications                  [Run Query]│
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ App Name     │ Version  │ Branch    │ Install│   │
│            │  │──────────────│──────────│───────────│────────│   │
│            │  │ frappe       │ 16.0.0   │ version-16│ Jan 15 │   │
│            │  │ erpnext      │ 16.0.0   │ version-16│ Jan 15 │   │
│            │  │ custom_app   │ 1.0.0    │ main      │ Jan 20 │   │
│            │  └─────────────────────────────────────────────┘   │
│            │  [Export CSV] [Export JSON] [Save Snapshot]        │
└─────────────────────────────────────────────────────────────────┘
```

### Command Composer Screen
```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Command Composer                                  │
│            │                                                     │
│            │  Category: [Site Management ▼]                     │
│            │                                                     │
│            │  ○ Backup Site                                     │
│            │  ● Restore Site                                    │
│            │  ○ Run Migrations                                  │
│            │  ○ Clear Cache                                     │
│            │                                                     │
│            │  ─────────────────────────────────────────────     │
│            │                                                     │
│            │  Site:        [mysite.localhost ▼]                 │
│            │  Backup path: [/backups/site.sql.gz        ]       │
│            │  □ With public files  □ With private files         │
│            │                                                     │
│            │  ─────────────────────────────────────────────     │
│            │                                                     │
│            │  Generated Command:                                 │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ bench --site mysite.localhost restore \     │   │
│            │  │   /backups/site.sql.gz                      │   │
│            │  └─────────────────────────────────────────────┘   │
│            │  [📋 Copy] [💾 Save to Log]                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Development Workflow

1. **Clone/Create project** - Use Cursor to scaffold
2. **Run in development** - `npm start` opens the app
3. **Test connections** - Add your RDS connection
4. **Run discoveries** - Execute queries against real data
5. **Build for distribution** - `npm run make` creates DMG

---

## Security Notes

1. **Password Storage**: Use electron-store with encryption for connection passwords
2. **No Plain Text**: Never log or display passwords
3. **Connection Timeout**: Implement timeouts to prevent hanging
4. **SQL Injection**: Use parameterized queries when needed (though discovery queries are static)
5. **App Signing**: For distribution, sign the Mac app with Apple Developer certificate

---

## Future Enhancements (v2)

1. **SSH Tunnel Support**: Connect to RDS through SSH bastion
2. **Command Execution**: Actually run commands via SSH (with confirmation)
3. **Scheduled Discovery**: Auto-run discovery on schedule
4. **Alerts**: Notify on error count thresholds
5. **Multi-window**: Open multiple connections in tabs/windows
6. **Sync**: Backup SQLite catalog to cloud storage

---

## Reference Documents

Keep these documents in the project for Cursor reference:
- This spec document (SPEC.md)
- Frappe Bench CLI Reference (the document we just created)
- SQLite schema (schema.sql)
- Query definitions (queries.js)
- Command templates (commands.js)

---

*Document Version: 1.0*
*Created: January 2025*
*For use with: Cursor AI IDE*
