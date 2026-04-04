"""Portable path utilities extracted from NCE Studio formBinding.ts.

These functions have zero NCE Studio dependencies and work standalone.
"""


def validate_field_path(path: str, target_doctype: str) -> dict:
    """Validate a dot-notation field path.

    Returns {"valid": True} or {"valid": False, "error": "..."}.
    """
    if not path or not path.strip():
        return {"valid": False, "error": "Path cannot be empty"}

    path_regex = r"^[a-zA-Z0-9_.]+$"
    import re
    if not re.match(path_regex, path):
        return {"valid": False, "error": "Path contains invalid characters"}

    segments = path.split(".")
    for segment in segments:
        if segment[0].isdigit():
            return {
                "valid": False,
                "error": f"Field name '{segment}' cannot start with a number",
            }
        if not segment.strip():
            return {"valid": False, "error": "Path contains empty segments"}

    return {"valid": True}


def bind_path_finder_to_field(field_path: str, target_doctype: str) -> dict:
    """Bind a PathFinder selection to a field config.

    Returns dict with field_path, resolved_path, isValid, errorMessage.
    """
    validation = validate_field_path(field_path, target_doctype)

    if not validation["valid"]:
        return {
            "fieldPath": field_path,
            "resolvedPath": [],
            "isValid": False,
            "errorMessage": validation["error"],
        }

    return {
        "fieldPath": field_path,
        "resolvedPath": field_path.split("."),
        "isValid": True,
    }


def create_field_from_path(path: str, label: str = None, fieldtype: str = "Data") -> dict:
    """Create a field config from a path.

    Returns dict with id, label, fieldtype, bindPath.
    """
    field_id = path.replace(".", "_").lower()

    segments = path.split(".")
    field_name = segments[-1]
    field_label = label or field_name.replace("_", " ").title()

    return {
        "id": field_id,
        "label": field_label,
        "fieldtype": fieldtype,
        "bindPath": path,
    }


def get_terminal_field_name(path: str) -> str:
    """Extract the last segment from a dot-notation path."""
    return path.split(".")[-1]


def get_parent_path(path: str) -> str:
    """Return the parent path (all segments except the last)."""
    segments = path.split(".")
    segments.pop()
    return ".".join(segments)


def is_direct_field(path: str) -> bool:
    """Check if path is a direct field (no dots)."""
    return "." not in path


def format_path_for_display(path: str, doctype_labels: dict = None) -> str:
    """Convert dot-notation to human-readable arrows."""
    segments = path.split(".")
    if len(segments) == 1:
        return segments[0]
    return " \u2192 ".join(segments)
