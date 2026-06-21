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
# 7. build_sql_expression / build_sql_expressions
# ---------------------------------------------------------------------------

def _tab_name(dt: str) -> str:
    if " " in dt or "-" in dt:
        return f"`tab{dt}`"
    return f"tab{dt}"


def _path_alias(path: str, index: int = 0) -> str:
    alias = path.replace(".", "_")
    return alias if alias else f"field_{index + 1}"


def _parse_path_chain(root_doctype: str, path: str):
    """Return (link_chain, final_field, final_doctype) for a dot-notation path."""
    parts = [p.strip() for p in path.split(".") if p.strip()]
    if not parts:
        frappe.throw(_("Empty path"))

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

    return chain, parts[-1], current_doctype


def _build_report_correlated_expr(root_doctype: str, path: str) -> str:
    """Correlated subquery/expression for SQL Report SELECT lists."""
    chain, final_field, final_doctype = _parse_path_chain(root_doctype, path)

    if not chain:
        return f"{_tab_name(root_doctype)}.{final_field}"

    inner = f"{_tab_name(chain[0][1])}.{chain[0][0]}"
    for field_name, src, _tgt in chain[1:]:
        inner = f"(SELECT {field_name} FROM {_tab_name(src)} WHERE name = {inner})"
    return f"(SELECT {final_field} FROM {_tab_name(final_doctype)} WHERE name = {inner})"


def _build_parameterized_scalar(root_doctype: str, path: str) -> str:
    """Standalone parameterized query for a single path."""
    chain, final_field, final_doctype = _parse_path_chain(root_doctype, path)

    if not chain:
        return f"SELECT {final_field} FROM {_tab_name(root_doctype)} WHERE name = %(name)s"

    inner = f"(SELECT {chain[0][0]} FROM {_tab_name(chain[0][1])} WHERE name = %(name)s)"
    for field_name, src, _tgt in chain[1:]:
        inner = f"(SELECT {field_name} FROM {_tab_name(src)} WHERE name = {inner})"
    return f"SELECT {final_field} FROM {_tab_name(final_doctype)} WHERE name = {inner}"


def _build_join_select_sql(root_doctype: str, paths: list, style: str) -> str:
    """Build one SELECT with LEFT JOINs linking all paths from the root table."""
    root_tab = _tab_name(root_doctype)
    root_alias = "root"

    joins = []
    join_keys = set()
    select_cols = []

    for i, path in enumerate(paths):
        chain, final_field, _final_doctype = _parse_path_chain(root_doctype, path)
        current_alias = root_alias
        alias_parts = []

        for field_name, _src_dt, tgt_dt in chain:
            alias_parts.append(field_name)
            child_alias = "_".join(alias_parts)
            join_key = (current_alias, field_name)

            if join_key not in join_keys:
                join_keys.add(join_key)
                joins.append(
                    f"LEFT JOIN {_tab_name(tgt_dt)} AS `{child_alias}` "
                    f"ON `{child_alias}`.name = `{current_alias}`.{field_name}"
                )
            current_alias = child_alias

        if chain:
            col_ref = f"`{current_alias}`.{final_field}"
        else:
            col_ref = f"`{root_alias}`.{final_field}"

        select_cols.append(f"  {col_ref} AS `{_path_alias(path, i)}`")

    lines = [
        "SELECT",
        ",\n".join(select_cols),
        f"FROM {root_tab} AS `{root_alias}`",
    ]
    lines.extend(joins)

    if style == "parameterized":
        lines.append(f"WHERE `{root_alias}`.name = %(name)s")

    return "\n".join(lines)


def _build_combined_sql(root_doctype: str, paths: list, style: str) -> str:
    paths = [p.strip() for p in paths if p and str(p).strip()]
    if not paths:
        frappe.throw(_("No paths provided"))

    if len(paths) == 1:
        if style == "report":
            return _build_report_correlated_expr(root_doctype, paths[0])
        return _build_parameterized_scalar(root_doctype, paths[0])

    return _build_join_select_sql(root_doctype, paths, style)


@frappe.whitelist()
def build_sql_expression(root_doctype: str, path: str, style: str) -> str:
    """Build a SQL expression for a single path (backward compatible)."""
    frappe.has_permission(root_doctype, throw=True)
    return _build_combined_sql(root_doctype, [path], style)


@frappe.whitelist()
def build_sql_expressions(root_doctype: str, paths, style: str) -> str:
    """Build one combined SQL query/expression for multiple paths.

    style:
        "report"        — single SELECT with LEFT JOINs linking all paths
        "parameterized" — same JOIN query with WHERE name = %(name)s
    """
    frappe.has_permission(root_doctype, throw=True)

    if isinstance(paths, str):
        import json

        try:
            paths = json.loads(paths)
        except (TypeError, ValueError):
            paths = [p.strip() for p in paths.split(",") if p.strip()]

    if not isinstance(paths, (list, tuple)):
        paths = [paths]

    return _build_combined_sql(root_doctype, list(paths), style)


# ---------------------------------------------------------------------------
# 8. Reverse joins (one-to-many via separate related DocTypes)
# ---------------------------------------------------------------------------

def _parse_string_list(values):
    if isinstance(values, str):
        import json

        try:
            values = json.loads(values)
        except (TypeError, ValueError):
            values = [v.strip() for v in values.split(",") if v.strip()]
    if not isinstance(values, (list, tuple)):
        values = [values]
    return [str(v).strip() for v in values if v and str(v).strip()]


def _doctype_alias(doctype: str) -> str:
    return doctype.lower().replace(" ", "_").replace("-", "_")


def _terminal_field_meta(root_doctype: str, path: str):
    """Return (terminal_field, fieldtype) for a dot path from root."""
    parts = [p.strip() for p in path.split(".") if p.strip()]
    if not parts:
        return None, None

    current_doctype = root_doctype
    field = None

    for i, segment in enumerate(parts):
        meta = frappe.get_meta(current_doctype)
        field = meta.get_field(segment)
        if not field:
            return segment, None

        if i < len(parts) - 1:
            if field.fieldtype != "Link" or not field.options:
                return segment, field.fieldtype
            current_doctype = field.options
        else:
            return segment, field.fieldtype

    return None, None


def _is_linked_value_path(root_doctype: str, path: str) -> bool:
    """True when the path resolves to a Link / Dynamic Link (docname value)."""
    _fieldname, fieldtype = _terminal_field_meta(root_doctype, path)
    return fieldtype in ("Link", "Dynamic Link")


@frappe.whitelist()
def filter_scalar_paths(root_doctype: str, paths) -> list:
    """Drop paths whose terminal field is a Link (one-to-many / FK docname)."""
    frappe.has_permission(root_doctype, throw=True)
    paths = _parse_string_list(paths)
    return [p for p in paths if not _is_linked_value_path(root_doctype, p)]


def _filter_scalar_columns(doctype: str, columns: list) -> list:
    """Drop Link / child-table columns from one-to-many column picks."""
    columns = _parse_string_list(columns)
    skip_types = {"Link", "Dynamic Link", "Table", "Table MultiSelect"}
    filtered = []
    for col in columns:
        field = frappe.get_meta(doctype).get_field(col)
        if field and field.fieldtype in skip_types:
            continue
        filtered.append(col)
    return filtered


@frappe.whitelist()
def get_reverse_link_doctypes(doctype: str) -> list:
    """Return separate DocTypes that Link back to *doctype* (one-to-many)."""
    frappe.has_permission(doctype, throw=True)

    link_fields = frappe.get_all(
        "DocField",
        filters={"fieldtype": "Link", "options": doctype},
        fields=["parent", "fieldname", "label"],
        order_by="parent asc, fieldname asc",
    )

    result = []
    for row in link_fields:
        child_doctype = row.parent
        if not child_doctype or frappe.get_meta(child_doctype).istable:
            continue
        result.append(
            {
                "child_doctype": child_doctype,
                "link_field": row.fieldname,
                "label": _(row.label or row.fieldname),
            }
        )
    return result


def _build_reverse_sql(
    root_doctype: str,
    child_doctype: str,
    link_field: str,
    columns: list,
    style: str,
) -> str:
    columns = _parse_string_list(columns)
    if not columns:
        frappe.throw(_("No columns provided"))

    alias = _doctype_alias(child_doctype)
    child_tab = _tab_name(child_doctype)
    root_tab = _tab_name(root_doctype)
    select_cols = ",\n".join(f"  `{alias}`.{col}" for col in columns)

    lines = [
        "SELECT",
        select_cols,
        f"FROM {child_tab} AS `{alias}`",
    ]

    if style == "report":
        lines.append(f"WHERE `{alias}`.{link_field} = {root_tab}.name")
    else:
        lines.append(f"WHERE `{alias}`.{link_field} = %(name)s")

    return "\n".join(lines)


def _html_cell_expr(alias: str, col: str) -> str:
    """SQL expression for one escaped HTML table cell value."""
    return (
        f"REPLACE(REPLACE(REPLACE(CAST(IFNULL(`{alias}`.{col}, '') AS CHAR), "
        "'&', '&amp;'), '<', '&lt;'), '>', '&gt;')"
    )


def _build_reverse_row_concat_expr(alias: str, columns: list) -> str:
    parts = ["'<tr>'"]
    for col in columns:
        parts.append(f"'<td>', {_html_cell_expr(alias, col)}, '</td>'")
    parts.append("'</tr>'")
    return "CONCAT(" + ", ".join(parts) + ")"


def _build_reverse_html_table_sql(
    root_doctype: str,
    child_doctype: str,
    link_field: str,
    columns: list,
    style: str,
) -> str:
    """Build SQL that returns a complete HTML <table> string (CONCAT + GROUP_CONCAT)."""
    columns = _parse_string_list(columns)
    if not columns:
        frappe.throw(_("No columns provided"))

    alias = _doctype_alias(child_doctype)
    child_tab = _tab_name(child_doctype)
    root_tab = _tab_name(root_doctype)
    header = "".join(f"<th>{col}</th>" for col in columns)
    row_expr = _build_reverse_row_concat_expr(alias, columns)

    agg_sql = (
        f"SELECT GROUP_CONCAT({row_expr} SEPARATOR '')\n"
        f"FROM {child_tab} AS `{alias}`\n"
        f"WHERE `{alias}`.{link_field} = "
    )

    if style == "report":
        agg_sql += f"{root_tab}.name"
        return (
            "CONCAT(\n"
            f"  '<table><tr>{header}</tr>',\n"
            f"  IFNULL(({agg_sql}), ''),\n"
            "  '</table>'\n"
            ")"
        )

    return (
        "SELECT CONCAT(\n"
        f"  '<table><tr>{header}</tr>',\n"
        "  IFNULL((\n"
        f"    {agg_sql}%(name)s\n"
        "  ), ''),\n"
        "  '</table>'\n"
        ") AS html_table"
    )


@frappe.whitelist()
def build_reverse_outputs(
    root_doctype: str,
    child_doctype: str,
    link_field: str,
    columns,
) -> dict:
    """Build row SQL plus SQL expressions that return an HTML table string."""
    frappe.has_permission(root_doctype, throw=True)
    frappe.has_permission(child_doctype, throw=True)

    columns = _filter_scalar_columns(child_doctype, columns)
    if not columns:
        frappe.throw(_("No scalar columns provided (Link fields are excluded)."))

    return {
        "sql_report": _build_reverse_sql(
            root_doctype, child_doctype, link_field, columns, "report"
        ),
        "sql_param": _build_reverse_sql(
            root_doctype, child_doctype, link_field, columns, "parameterized"
        ),
        "html_table": _build_reverse_html_table_sql(
            root_doctype, child_doctype, link_field, columns, "parameterized"
        ),
        "html_table_report": _build_reverse_html_table_sql(
            root_doctype, child_doctype, link_field, columns, "report"
        ),
    }


# ---------------------------------------------------------------------------
# 9. create_virtual_field
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
