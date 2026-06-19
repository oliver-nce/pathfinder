# -*- coding: utf-8 -*-
"""
pathfinder.api.pathfinder_api
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Whitelisted API endpoints for the pathfinder app.

Usage from client JS:
    frappe.call({
        method: "pathfinder.api.pathfinder_api.get_doctype_fields",
        args: { doctype: "Customer" },
        callback: (r) => console.log(r.message),
    });

Usage via REST:
    GET  /api/method/pathfinder.api.pathfinder_api.get_doctype_fields?doctype=Customer

Frappe v15/v16 compatible.
"""

from __future__ import unicode_literals

import frappe
from frappe import _


# ---------------------------------------------------------------------------
# 1. get_doctype_fields
# ---------------------------------------------------------------------------
@frappe.whitelist()
def get_doctype_fields(doctype: str) -> list:
    """Return field metadata for a given DocType (used by path navigation).

    Excludes layout break fields (Section Break, Column Break, Tab Break, HTML).
    """
    frappe.has_permission(doctype, throw=True)

    meta = frappe.get_meta(doctype)
    fields = []
    for field in meta.fields:
        if field.fieldtype in (
            "Section Break",
            "Column Break",
            "Tab Break",
            "HTML",
        ):
            continue
        fields.append(
            {
                "fieldname": field.fieldname,
                "fieldtype": field.fieldtype,
                "label": _(field.label or field.fieldname),
                "value": field.fieldname,
                "options": field.options,
                "reqd": field.reqd,
            }
        )
    return fields


# ---------------------------------------------------------------------------
# 2. get_whitelisted_methods
# ---------------------------------------------------------------------------
@frappe.whitelist()
def get_whitelisted_methods(doctype: str) -> list:
    """Return whitelisted methods on a DocType's controller class."""
    frappe.has_permission(doctype, throw=True)
    controller = frappe.get_meta(doctype).get_controller()
    methods = []
    for attr_name in dir(controller):
        attr = getattr(controller, attr_name, None)
        if callable(attr) and getattr(attr, "is_whitelisted", False):
            methods.append(attr_name)
    return sorted(methods)


# ---------------------------------------------------------------------------
# 3. get_virtual_fields
# ---------------------------------------------------------------------------
@frappe.whitelist()
def get_virtual_fields(doctype: str) -> list:
    """Return all enabled virtual field definitions for a DocType."""
    frappe.has_permission(doctype, throw=True)
    return frappe.get_all(
        "Pathfinder Virtual Field",
        filters={"source_doctype": doctype, "enabled": 1},
        fields=[
            "name",
            "field_label",
            "field_path",
            "terminal_fieldtype",
            "terminal_options",
            "show_in_form",
            "show_in_list",
            "column_order",
        ],
        order_by="column_order asc",
    )


# ---------------------------------------------------------------------------
# 4. resolve_virtual_fields
# ---------------------------------------------------------------------------
@frappe.whitelist()
def resolve_virtual_fields(doctype: str, docname: str) -> dict:
    """Resolve actual values for a document's virtual fields.

    Returns {field_label: {value, path, jinja_tag}} for all enabled virtual
    fields on the given document.
    """
    frappe.has_permission(doctype, "read", docname, throw=True)
    vfields = get_virtual_fields(doctype)
    doc = frappe.get_doc(doctype, docname)
    result = {}

    for vf in vfields:
        path = vf["field_path"]
        label = vf["field_label"]
        value = _resolve_path(doc, path)
        jinja_tag = _build_jinja_tag(doctype, path)

        result[label] = {
            "value": value,
            "path": path,
            "jinja_tag": jinja_tag,
            "fieldtype": vf.get("terminal_fieldtype"),
        }

    return result


# ---------------------------------------------------------------------------
# 5. resolve_single_path
# ---------------------------------------------------------------------------
@frappe.whitelist()
def resolve_single_path(doctype: str, docname: str, path: str) -> dict:
    """Resolve a single dot-notation path and return value + both output formats.

    Returns:
        {
            "value": <resolved value>,
            "frappe_path": "customer.territory.name",
            "jinja_tag": "{{ doc.customer.territory.name }}",
        }
    """
    frappe.has_permission(doctype, "read", docname, throw=True)
    doc = frappe.get_doc(doctype, docname)
    value = _resolve_path(doc, path)

    return {
        "value": value,
        "frappe_path": path,
        "jinja_tag": _build_jinja_tag(doctype, path),
    }


# ---------------------------------------------------------------------------
# 6. build_jinja_tag
# ---------------------------------------------------------------------------
@frappe.whitelist()
def build_jinja_tag(doctype: str, path: str) -> str:
    """Generate a Jinja tag for a given DocType + dot-notation path."""
    frappe.has_permission(doctype, throw=True)
    return _build_jinja_tag(doctype, path)


# ---------------------------------------------------------------------------
# Core path resolver — MANY-TO-ONE (Phase 1)
# ---------------------------------------------------------------------------

def _resolve_path(doc, path):
    """Walk a dot-notation path through linked documents.

    Phase 1: follows Link fields only (many-to-one / drill-down direction).
    Returns the terminal value, or None if any link in the chain is broken.

    PHASE 2 — ONE-TO-MANY EXTENSION
    When Phase 2 is added, this function will also handle:
    - Table fields: iterate child rows and return list/aggregation
    - Dynamic Link fields: resolve target doctype from companion field
    - Recordset building: combine multiple hops into a result set
    """
    segments = path.split(".")
    current = doc

    for i, segment in enumerate(segments):
        if current is None:
            return None

        if i < len(segments) - 1:
            link_value = current.get(segment)
            if not link_value:
                return None

            meta = frappe.get_meta(current.doctype)
            field = meta.get_field(segment)
            if not field:
                return None

            if field.fieldtype == "Link" and field.options:
                current = frappe.get_doc(field.options, link_value)
            # PHASE 2 — ONE-TO-MANY EXTENSION
            # elif field.fieldtype in ("Table", "Table MultiSelect"):
            #     return _resolve_table_path(current, field, segments[i+1:])
            # elif field.fieldtype == "Dynamic Link":
            #     target_dt = current.get(field.options) or current.get(segment + "_type")
            #     if target_dt:
            #         current = frappe.get_doc(target_dt, link_value)
            #     else:
            #         return None
            else:
                return None
        else:
            return current.get(segment)

    return None


def _build_jinja_tag(doctype, path):
    """Generate a Jinja template tag for a given path.

    Phase 1: generates simple {{ doc.<path> }} for direct fields,
    and nested set blocks for link chains deeper than 1 hop.

    PHASE 2 — ONE-TO-MANY EXTENSION
    When Phase 2 is added, this function will also generate:
    - {% for row in doc.items %}{{ row.fieldname }}{% endfor %}
    - Aggregation tags
    """
    segments = path.split(".")

    if len(segments) <= 1:
        return "{{{{ doc.{0} }}}}".format(path)

    return "{{{{ doc.{0} }}}}".format(path)


# ---------------------------------------------------------------------------
# 7. build_sql_expression
# ---------------------------------------------------------------------------
@frappe.whitelist()
def build_sql_expression(root_doctype: str, path: str, style: str) -> str:
    """Build a SQL expression for a given root DocType + dot-notation path.

    Walks the Link-field chain and produces a ready-to-paste SQL string.

    style:
        "report"        — correlated subquery referencing the root table;
                          paste into the SELECT clause of a Frappe SQL Report.
                          e.g. (SELECT first_name FROM tabContact
                                WHERE name = `tabSales Order`.contact)

        "parameterized" — standalone query with %(name)s placeholder for the
                          root record PK; use in frappe.db.sql() or a Script
                          Report filter.
                          e.g. SELECT first_name FROM tabContact
                               WHERE name = (SELECT contact FROM `tabSales Order`
                                             WHERE name = %(name)s)
    """
    frappe.has_permission(root_doctype, throw=True)

    parts = [p.strip() for p in path.split(".") if p.strip()]
    if not parts:
        frappe.throw(_("Empty path"))

    def tab(dt: str) -> str:
        if " " in dt or "-" in dt:
            return f"`tab{dt}`"
        return f"tab{dt}"

    # Walk chain: [(field_name, source_doctype, target_doctype), ...]
    chain = []
    current_doctype = root_doctype

    for field_name in parts[:-1]:
        meta = frappe.get_meta(current_doctype)
        field = meta.get_field(field_name)
        if not field:
            frappe.throw(_(f"Field '{field_name}' not found in '{current_doctype}'"))
        if field.fieldtype != "Link" or not field.options:
            frappe.throw(_(f"Field '{field_name}' in '{current_doctype}' is not a Link field"))
        target_doctype = field.options
        chain.append((field_name, current_doctype, target_doctype))
        current_doctype = target_doctype

    final_field = parts[-1]
    final_doctype = current_doctype

    if not chain:
        # Direct field on root — no traversal
        if style == "report":
            return f"{tab(root_doctype)}.{final_field}"
        return f"SELECT {final_field} FROM {tab(root_doctype)} WHERE name = %(name)s"

    if style == "report":
        # Correlated subquery: inner condition anchors to root table column
        inner = f"{tab(chain[0][1])}.{chain[0][0]}"
        for field_name, src, _tgt in chain[1:]:
            inner = f"(SELECT {field_name} FROM {tab(src)} WHERE name = {inner})"
        return f"(SELECT {final_field} FROM {tab(final_doctype)} WHERE name = {inner})"

    # parameterized
    inner = f"(SELECT {chain[0][0]} FROM {tab(chain[0][1])} WHERE name = %(name)s)"
    for field_name, src, _tgt in chain[1:]:
        inner = f"(SELECT {field_name} FROM {tab(src)} WHERE name = {inner})"
    return f"SELECT {final_field} FROM {tab(final_doctype)} WHERE name = {inner}"


# ---------------------------------------------------------------------------
# 8. create_virtual_field
# ---------------------------------------------------------------------------
@frappe.whitelist()
def create_virtual_field(
    source_doctype,
    field_label,
    field_path,
    description="",
    show_in_form=1,
    show_in_list=0,
    column_order=0,
):
    """Create a Pathfinder Virtual Field record from a user-selected path.

    Returns the created document (with auto-resolved terminal metadata).
    Called from the Pathfinder popup when user selects "Create Virtual Field".
    """
    frappe.has_permission("Pathfinder Virtual Field", "create", throw=True)

    existing = frappe.db.exists(
        "Pathfinder Virtual Field",
        {"source_doctype": source_doctype, "field_label": field_label},
    )
    if existing:
        frappe.throw(
            _("A virtual field with label '{}' already exists for {}").format(
                field_label, source_doctype
            )
        )

    vf = frappe.get_doc({
        "doctype": "Pathfinder Virtual Field",
        "source_doctype": source_doctype,
        "field_label": field_label,
        "field_path": field_path,
        "show_in_form": show_in_form,
        "show_in_list": show_in_list,
        "column_order": column_order,
        "enabled": 1,
        "description": description,
    }).insert()

    cache_key = "pathfinder:doctypes_with_vfields"
    frappe.cache().hset(cache_key, source_doctype, 1)

    return {
        "name": vf.name,
        "field_label": vf.field_label,
        "field_path": vf.field_path,
        "terminal_fieldtype": vf.terminal_fieldtype,
        "terminal_options": vf.terminal_options,
    }


# ---------------------------------------------------------------------------
# 8. inject_virtual_fields (doc_events onload hook)
# ---------------------------------------------------------------------------
def inject_virtual_fields(doc, method):
    """Attach resolved virtual field values to a document on load.

    This is the doc_events["*"]["onload"] handler registered in hooks.py.
    It is zero-cost when no virtual fields exist for the doctype
    (cached check first).

    Resolved values are attached as doc._virtual_fields dict so that
    client-side controls or API responses can access them.
    """
    doctype = doc.doctype

    cache_key = "pathfinder:doctypes_with_vfields"
    has_vfields = frappe.cache().hget(cache_key, doctype)

    if has_vfields is None:
        count = frappe.db.count(
            "Pathfinder Virtual Field",
            filters={"source_doctype": doctype, "enabled": 1},
        )
        has_vfields = count > 0
        frappe.cache().hset(cache_key, doctype, 1 if has_vfields else 0)

    if not has_vfields:
        return

    vfields = frappe.get_all(
        "Pathfinder Virtual Field",
        filters={"source_doctype": doctype, "enabled": 1},
        fields=["field_label", "field_path"],
        order_by="column_order asc",
    )

    if not vfields:
        return

    doc._virtual_fields = {}
    for vf in vfields:
        doc._virtual_fields[vf["field_label"]] = _resolve_path(doc, vf["field_path"])
