# -*- coding: utf-8 -*-
from __future__ import unicode_literals

# ===========================================================================
#  pathfinder — hooks.py
#  Visual field-path navigator for Frappe — create virtual fields by
#  traversing DocType link chains.
#
#  Frappe v15 / v16 compatible.
#  Docs: https://frappeframework.com/docs/user/en/basics/hooks
# ===========================================================================

app_name = "pathfinder"
app_title = "pathfinder"
app_publisher = "NCE"
app_description = "Visual field-path navigator for Frappe — create virtual fields by traversing DocType link chains"
app_icon = "octicon octicon-link"
app_color = "blue"
app_email = "dev@nce.dev"
app_license = "MIT"
source_link = "https://github.com/oliver-nce/pathfinder"
app_version = "0.0.1"

# --------------------------------------------------------------------------
#  App Logo (v16 app landing page) — v15 ignores this safely
# --------------------------------------------------------------------------
app_logo_url = "/assets/pathfinder/images/logo.png"

# --------------------------------------------------------------------------
#  Includes — CSS / JS injected into every Desk page
# --------------------------------------------------------------------------
app_include_js = [
    "/assets/pathfinder/js/pathfinder.bundle.js",
    "/assets/pathfinder/js/pathfinder_popup.js",
    "/assets/pathfinder/js/pathfinder_desk.js",
    "/assets/pathfinder/js/pathfinder_control.js",
    "/assets/pathfinder/js/enrollment_form.js",
]

# --------------------------------------------------------------------------
#  Installation
# --------------------------------------------------------------------------
after_install = "pathfinder.install.after_install"

# --------------------------------------------------------------------------
#  Document Events — auto-inject virtual field values on every doc load
# --------------------------------------------------------------------------
doc_events = {
    "*": {
        "onload": "pathfinder.api.pathfinder_api.inject_virtual_fields"
    }
}

# --------------------------------------------------------------------------
#  Jinja
# --------------------------------------------------------------------------
# jinja = {
#     "methods": [],
#     "filters": [],
# }

# --------------------------------------------------------------------------
#  Website / Portal
# --------------------------------------------------------------------------
# website_route_rules = []

# --------------------------------------------------------------------------
#  Permissions
# --------------------------------------------------------------------------
# permission_query_conditions = {}
# has_permission = {}

# --------------------------------------------------------------------------
#  Scheduler Events
# --------------------------------------------------------------------------
# scheduler_events = {}

# --------------------------------------------------------------------------
#  Fixtures
# --------------------------------------------------------------------------
# fixtures = []

# --------------------------------------------------------------------------
#  Override Whitelisted Methods
# --------------------------------------------------------------------------
# override_whitelisted_methods = {}

# --------------------------------------------------------------------------
#  Override DocType Dashboards
# --------------------------------------------------------------------------
# override_doctype_dashboards = {}
