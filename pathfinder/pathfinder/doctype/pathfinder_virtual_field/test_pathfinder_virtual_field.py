# Copyright (c) 2026, NCE and contributors
# For license information, please see license.txt

import frappe
from frappe.tests import IntegrationTestCase


class TestPathfinderVirtualField(IntegrationTestCase):
    def test_validate_empty_path(self):
        vf = frappe.new_doc("Pathfinder Virtual Field")
        vf.source_doctype = "User"
        vf.field_label = "Test"
        vf.field_path = ""
        with self.assertRaises(frappe.ValidationError):
            vf.validate()

    def test_validate_invalid_path_format(self):
        vf = frappe.new_doc("Pathfinder Virtual Field")
        vf.source_doctype = "User"
        vf.field_label = "Test"
        vf.field_path = "1invalid.field"
        with self.assertRaises(frappe.ValidationError):
            vf.validate()

    def test_validate_empty_segments(self):
        vf = frappe.new_doc("Pathfinder Virtual Field")
        vf.source_doctype = "User"
        vf.field_label = "Test"
        vf.field_path = "full_name."
        with self.assertRaises(frappe.ValidationError):
            vf.validate()
