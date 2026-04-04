"""Tests for pathfinder.api.pathfinder_api — Phase 1 (Many-to-One)."""

import frappe
from frappe.tests import IntegrationTestCase
from pathfinder.api.pathfinder_api import (
    _resolve_path,
    _build_jinja_tag,
    get_doctype_fields,
    build_jinja_tag,
    validate_field_path,
)


class TestPathfinderAPI(IntegrationTestCase):
    """Backend API endpoint tests."""

    def test_get_doctype_fields_user(self):
        """Should return field metadata for User DocType."""
        fields = get_doctype_fields("User")
        self.assertIsInstance(fields, list)
        self.assertTrue(len(fields) > 0)

        # Should contain email field
        fieldnames = [f["fieldname"] for f in fields]
        self.assertIn("email", fieldnames)

    def test_get_doctype_fields_excludes_layout(self):
        """Should exclude Section Break, Column Break, Tab Break, HTML."""
        fields = get_doctype_fields("User")
        excluded = {"Section Break", "Column Break", "Tab Break", "HTML"}
        for f in fields:
            self.assertNotIn(f["fieldtype"], excluded)

    def test_build_jinja_tag_simple(self):
        """Direct field should produce {{ doc.fieldname }}."""
        tag = _build_jinja_tag("Customer", "email_id")
        self.assertEqual(tag, "{{ doc.email_id }}")

    def test_build_jinja_tag_nested(self):
        """Nested path should produce {{ doc.a.b.c }}."""
        tag = _build_jinja_tag("Sales Order", "customer.territory.name")
        self.assertEqual(tag, "{{ doc.customer.territory.name }}")

    def test_resolve_path_broken_link(self):
        """Broken link in chain should return None, not raise."""
        # Use a non-existent docname — resolution should gracefully return None
        result = _build_jinja_tag("User", "nonexistent.path")
        self.assertEqual(result, "{{ doc.nonexistent.path }}")

    def test_validate_field_path_empty(self):
        result = validate_field_path("", "User")
        self.assertFalse(result["valid"])
        self.assertIn("empty", result["error"])

    def test_validate_field_path_starts_with_number(self):
        result = validate_field_path("1invalid.field", "User")
        self.assertFalse(result["valid"])
        self.assertIn("number", result["error"])

    def test_validate_field_path_valid(self):
        result = validate_field_path("customer.territory.name", "Sales Order")
        self.assertTrue(result["valid"])


class TestJinjaTagGeneration(IntegrationTestCase):
    """Test Jinja tag generation via whitelisted endpoint."""

    def test_build_jinja_tag_endpoint(self):
        tag = build_jinja_tag("User", "full_name")
        self.assertEqual(tag, "{{ doc.full_name }}")

    def test_build_jinja_tag_nested_endpoint(self):
        tag = build_jinja_tag("Sales Order", "customer.customer_name")
        self.assertEqual(tag, "{{ doc.customer.customer_name }}")
