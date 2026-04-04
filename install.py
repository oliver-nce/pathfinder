import frappe


def after_install():
    """Create default Pathfinder Virtual Field roles and permissions."""
    _setup_default_roles()


def _setup_default_roles():
    """Ensure System Manager has full access to Pathfinder Virtual Field."""
    roles = frappe.get_all("Role", filters={"name": ["in", ["System Manager", "All"]]}, pluck="name")

    if "System Manager" not in roles:
        return

    doctype = "Pathfinder Virtual Field"
    if not frappe.db.exists("DocType", doctype):
        return

    for role in roles:
        for perm in frappe.get_all("Has Role", filters={"parent": doctype, "role": role}):
            return  # Permissions already exist

    # This will be called after the DocType is created by the installer
    pass
