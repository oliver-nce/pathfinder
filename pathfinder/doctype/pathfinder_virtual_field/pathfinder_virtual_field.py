# Copyright (c) 2026, NCE and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _


class PathfinderVirtualField(Document):
    def validate(self):
        self._validate_path_format()
        self._resolve_terminal_metadata()

    def _validate_path_format(self):
        """Ensure field_path is valid dot-notation."""
        if not self.field_path or not self.field_path.strip():
            frappe.throw(_("Field Path cannot be empty"))

        segments = self.field_path.split(".")
        for segment in segments:
            if not segment.strip():
                frappe.throw(_("Field Path contains empty segments"))
            if segment.strip()[0].isdigit():
                frappe.throw(
                    _("Field name '{}' cannot start with a number").format(segment)
                )

    def _resolve_terminal_metadata(self):
        """Auto-resolve terminal fieldtype and options from the path."""
        root_doctype = self.source_doctype
        path = self.field_path
        segments = path.split(".")

        current_doctype = root_doctype
        terminal_fieldtype = None
        terminal_options = None

        for i, segment in enumerate(segments):
            meta = frappe.get_meta(current_doctype)
            field = meta.get_field(segment)

            if not field:
                frappe.throw(
                    _("Field '{}' not found in DocType '{}'").format(
                        segment, current_doctype
                    )
                )

            if i == len(segments) - 1:
                # Terminal field
                terminal_fieldtype = field.fieldtype
                terminal_options = field.options or ""
            elif field.fieldtype == "Link" and field.options:
                # Intermediate Link hop
                current_doctype = field.options
            # PHASE 2 — ONE-TO-MANY EXTENSION
            # elif field.fieldtype in ("Table", "Table MultiSelect"):
            #     current_doctype = field.options
            # elif field.fieldtype == "Dynamic Link":
            #     pass  # target doctype resolved at runtime in Phase 2

        self.terminal_fieldtype = terminal_fieldtype or ""
        self.terminal_options = terminal_options or ""
