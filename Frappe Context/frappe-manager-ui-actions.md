# Frappe Manager UI -- Canonical Button & Action List

This document defines the **complete, authoritative list of actions that
require UI buttons** in the Frappe Manager application.

**Purpose:**\
Provide a single source of truth that can be handed directly to a Cursor
agent to implement UI buttons and wiring.

**Important constraints:** - Single AWS EC2 Frappe server - Single
GitHub account - UI-first, explain-before-execute - Phase 0--1: buttons
show explanation modals only (no execution)

------------------------------------------------------------------------

## Global / App-Level Actions

These appear in the global header or main chrome.

1.  **Connect to Server**
    -   Purpose: Open SSH session in terminal

    -   Command:

        ``` bash
        ssh -i <key> <user>@<host>
        ```
2.  **Refresh Server Data**
    -   Purpose: Re-scan benches, sites, apps, and versions

    -   Commands (sequence):

        ``` bash
        ls sites
        ls apps
        bench version
        bench --site <site> list-apps
        git rev-parse HEAD
        ```
3.  **Check GitHub Updates**
    -   Purpose: Compare local commits vs remote commits
    -   Type: HTTP only (no SSH)
4.  **Open Settings**
    -   Purpose: Open configuration panel

------------------------------------------------------------------------

## Bench Group Level (UI-only)

Bench Groups are **UI constructs only** and do not map to bench
commands.

5.  **Enter Bench Group**
    -   Purpose: Navigate into benches list

------------------------------------------------------------------------

## Bench-Level Actions

Actions that affect the entire bench.

6.  **Enter Bench**
    -   Purpose: Navigate to Sites / Apps tabs
7.  **Restart Bench**
    -   Command:

        ``` bash
        bench restart
        ```

    -   Warning: ⚠️ Affects all sites
8.  **Build Assets**
    -   Command:

        ``` bash
        bench build
        ```

    -   Warning: ⚠️ Affects all sites
9.  **Update Bench (All Apps)**
    -   Command:

        ``` bash
        bench update --pull
        ```

    -   Warning: ⚠️ Affects all sites
10. **Migrate All Sites**
    -   Command:

        ``` bash
        bench --site all migrate
        ```

    -   Warning: ⚠️ Affects all sites

------------------------------------------------------------------------

## Sites Tab -- Site-Scoped Actions

### Navigation / Open

11. **Open Site**
    -   URL:

            https://<site-url>
12. **Open Desk**
    -   URL:

            https://<site-url>/app
13. **Open Setup Wizard**
    -   URL:

            https://<site-url>/setup-wizard

------------------------------------------------------------------------

### Site Lifecycle

14. **Create New Site**
    -   Command:

        ``` bash
        bench new-site <site-name>
        ```

    -   Inputs: site name, admin password
15. **Drop Site**
    -   Command:

        ``` bash
        bench drop-site <site-name>
        ```

    -   Warning: ⚠️ Destructive

------------------------------------------------------------------------

### Site Maintenance

16. **Clear Cache**
    -   Command:

        ``` bash
        bench --site <site> clear-cache
        ```
17. **Migrate Site**
    -   Command:

        ``` bash
        bench --site <site> migrate
        ```
18. **Maintenance Mode ON**
    -   Command:

        ``` bash
        bench --site <site> set-maintenance-mode on
        ```
19. **Maintenance Mode OFF**
    -   Command:

        ``` bash
        bench --site <site> set-maintenance-mode off
        ```

------------------------------------------------------------------------

### Site App Management

20. **List Installed Apps**
    -   Command:

        ``` bash
        bench --site <site> list-apps
        ```
21. **Install App on Site**
    -   Command:

        ``` bash
        bench --site <site> install-app <app>
        ```
22. **Uninstall App from Site**
    -   Command:

        ``` bash
        bench --site <site> uninstall-app <app>
        ```

    -   Warning: ⚠️ May affect data

------------------------------------------------------------------------

### Advanced / Developer

23. **Open Python Console**
    -   Command:

        ``` bash
        bench --site <site> console
        ```
24. **Show Site Config**
    -   Command:

        ``` bash
        bench --site <site> show-config
        ```

------------------------------------------------------------------------

## Apps Tab -- Bench-Scoped App Actions

### App Acquisition

25. **Get App (Marketplace)**
    -   Command:

        ``` bash
        bench get-app <app-name>
        ```
26. **Get App (GitHub URL)**
    -   Command:

        ``` bash
        bench get-app <repo-url>
        ```
27. **Get App (GitHub + Branch)**
    -   Command:

        ``` bash
        bench get-app <repo-url> --branch <branch>
        ```

------------------------------------------------------------------------

### App Maintenance

28. **Update Selected Apps**
    -   Command:

        ``` bash
        bench update --pull --apps <app1,app2>
        ```
29. **Update All Apps**
    -   Command:

        ``` bash
        bench update --pull
        ```
30. **Remove App from Bench**
    -   Command:

        ``` bash
        bench remove-app <app>
        ```

    -   Warning: ⚠️ Affects all sites using the app

------------------------------------------------------------------------

## Settings Tab Actions

31. **Generate SSH Key**
    -   Command:

        ``` bash
        ssh-keygen -t ed25519
        ```
32. **Copy Public Key**
    -   Command:

        ``` bash
        cat ~/.ssh/id_ed25519.pub
        ```
33. **Save Config**
    -   Action: Download `config.json`
34. **Load Config**
    -   Action: Upload `config.json`
35. **Clear Logs**
    -   Action: Delete `logs.json`
36. **Export Logs**
    -   Action: Download `logs.json`

------------------------------------------------------------------------

## Action Count Summary

  Scope       Count
  ----------- ----------------
  Global      4
  Bench       4
  Site        14
  Apps        6
  Settings    8
  **Total**   **36 actions**

------------------------------------------------------------------------

## Cursor Agent Instruction (Recommended)

    Use this document as the canonical list of UI actions.
    Implement buttons for each action in an appropriate UI location.
    In Phase 0–1, clicking a button must only display an explanation modal
    describing commands, scope, and side effects.
    Do not execute any commands.
