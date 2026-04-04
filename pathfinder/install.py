import frappe
from frappe import _


def after_install():
    """Generate sample data after app installation."""
    frappe.db.commit()
    try:
        from pathfinder.demo.data_generator import generate_sample_data
        generate_sample_data()
    except Exception:
        frappe.log_error("Failed to generate demo data", "Pathfinder Install")
