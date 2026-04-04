# -*- coding: utf-8 -*-
"""
pathfinder.install
~~~~~~~~~~~~~~~~~~

Installation hook — generates sample demo data after app installation.

Frappe v15 / v16 compatible.
"""

from __future__ import unicode_literals

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
