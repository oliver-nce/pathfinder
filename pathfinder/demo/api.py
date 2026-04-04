import frappe
from frappe import _
from pathfinder.demo.data_generator import generate_sample_data, delete_sample_data


@frappe.whitelist()
def reset_sample_data():
    """Delete all existing demo data and regenerate fresh sample data.

    Called from the Enrollments Instructions tab "Reset Sample Data" button.
    Requires System Manager role.
    """
    frappe.only_for("System Manager")

    # Delete existing data in dependency order
    delete_sample_data()

    # Regenerate
    generate_sample_data()

    return {"message": "Sample data has been reset successfully."}
