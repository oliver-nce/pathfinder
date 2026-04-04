app_name = "pathfinder"
app_title = "Pathfinder"
app_publisher = "NCE"
app_description = "Visual field-path navigator for Frappe — create virtual fields by traversing DocType link chains"
app_icon = "octicon octicon-link"
app_color = "blue"
app_email = ""
app_license = "MIT"
app_version = "0.0.1"

# Frontend bundle available on all Desk pages
app_include_js = "/assets/pathfinder/js/pathfinder.bundle.js"

# Auto-inject virtual field values when documents load
doc_events = {
    "*": {
        "onload": "pathfinder.api.pathfinder_api.inject_virtual_fields"
    }
}
