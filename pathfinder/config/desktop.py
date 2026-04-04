# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from frappe import _


def get_data():
    return [
        {
            "module_name": "pathfinder",
            "label": _("pathfinder"),
            "color": "blue",
            "icon": "octicon octicon-link",
            "type": "module",
            "description": _("Visual field-path navigator for Frappe"),
        },
    ]
