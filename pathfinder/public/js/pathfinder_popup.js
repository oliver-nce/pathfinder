/**
 * pathfinder_popup.js
 * =====================
 * Pure JavaScript Pathfinder popup — Tag Finder–style column navigator
 * in a Frappe dialog (layout match; sensible static colors via CSS).
 *
 * Frappe v15/v16 compatible.
 */
(function () {
  "use strict"

  var DRILLABLE_TYPES = ["Link", "Table", "Table MultiSelect", "Dynamic Link"]
  var LINK_TYPES = ["Link", "Dynamic Link"]
  var TABLE_TYPES = ["Table", "Table MultiSelect"]

  function escapeHtml(text) {
    if (frappe.utils && frappe.utils.escape_html) {
      return frappe.utils.escape_html(String(text == null ? "" : text))
    }
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  }

  function isDrillable(field) {
    return DRILLABLE_TYPES.indexOf(field.fieldtype) >= 0 && !!field.options
  }

  function badgeText(field) {
    var text = field.fieldtype || "Data"
    if (isDrillable(field)) {
      text += " \u2192 " + field.options
    }
    return text
  }

  function tileClasses(field, isSelected) {
    var cls = ["pf-tile"]
    if (LINK_TYPES.indexOf(field.fieldtype) >= 0) cls.push("pf-tile-link")
    else if (TABLE_TYPES.indexOf(field.fieldtype) >= 0) cls.push("pf-tile-table")
    if (isSelected) cls.push("pf-tile-active")
    return cls.join(" ")
  }

  function buildTileHtml(field, isSelected) {
    var label = escapeHtml(field.label || field.fieldname)
    var fieldname = escapeHtml(field.fieldname)
    var badge = escapeHtml(badgeText(field))
    var arrow = isDrillable(field)
      ? '<span class="pf-tile-arrow">&#9654;</span>'
      : ""

    return (
      '<div class="' + tileClasses(field, isSelected) + '">' +
        '<div class="pf-tile-top">' +
          '<span class="pf-tile-label">' + label + "</span>" +
          arrow +
        "</div>" +
        '<div class="pf-tile-meta">' +
          '<span class="pf-tile-fieldname">' + fieldname + "</span>" +
          '<span class="pf-tile-badge">' + badge + "</span>" +
        "</div>" +
      "</div>"
    )
  }

  function openPathfinderPopup(rootDoctype, options) {
    options = options || {}
    if (!rootDoctype) {
      frappe.msgprint("No DocType specified for Pathfinder.")
      return
    }

    var columns = [{ doctype: rootDoctype, selectedField: null, selectedLabel: null }]

    var dialog = new frappe.ui.Dialog({
      title: __("Pathfinder: {0}", [rootDoctype]),
      size: "large",
      fields: [{ fieldtype: "HTML", fieldname: "navigator" }],
    })

    dialog.$wrapper.addClass("pf-tag-finder-dialog")
    dialog.show()
    renderNavigator(dialog, columns, options)
  }

  function renderNavigator(dialog, columns, options) {
    options = options || {}
    var wrapper = dialog.fields_dict.navigator.$wrapper
    wrapper.empty()

    var container = $('<div class="pf-popup-container"></div>').appendTo(wrapper)

    var breadcrumb = $('<div class="pf-breadcrumb"></div>').appendTo(container)
    columns.forEach(function (col, idx) {
      if (idx > 0) breadcrumb.append('<span> / </span>')
      var isActive = idx === columns.length - 1
      var btn = $(
        '<button type="button" class="pf-breadcrumb-btn' +
          (isActive ? " is-active" : "") +
          '">' +
          escapeHtml(col.selectedLabel || col.doctype) +
        "</button>"
      ).appendTo(breadcrumb)
      btn.on("click", function () {
        columns[idx].selectedField = null
        columns[idx].selectedLabel = null
        columns = columns.slice(0, idx + 1)
        renderNavigator(dialog, columns, options)
      })
    })

    var pathParts = []
    columns.forEach(function (col) {
      if (col.selectedField) pathParts.push(col.selectedField)
    })
    var pathStr = pathParts.join(".")

    if (pathStr) {
      var pathBar = $('<div class="pf-path-bar"></div>').appendTo(container)
      pathBar.append('<i class="fa fa-link"></i>')
      pathBar.append("<code>" + escapeHtml(pathStr) + "</code>")
    }

    var scrollArea = $('<div class="pf-body"></div>').appendTo(container)

    columns.forEach(function (col, colIdx) {
      renderColumn(scrollArea, dialog, columns, col, colIdx, options)
    })
  }

  function renderColumn(container, dialog, columns, col, colIdx, options) {
    var panel = $('<div class="pf-column"></div>').appendTo(container)
    var header = $('<div class="pf-col-header"></div>').appendTo(panel)
    header.append("<span>" + escapeHtml(col.doctype) + "</span>")
    header.append('<span class="pf-col-count pf-col-count-placeholder">…</span>')

    var list = $('<div class="pf-tiles"></div>').appendTo(panel)
    list.append(
      '<div class="pf-loading"><i class="fa fa-spinner fa-spin"></i> ' +
        escapeHtml(__("Loading...")) +
      "</div>"
    )

    frappe.call({
      method: "pathfinder.api.pathfinder_api.get_doctype_fields",
      args: { doctype: col.doctype },
      callback: function (r) {
        list.empty()
        if (!r.message) {
          list.append('<div class="pf-error">' + escapeHtml(__("Error loading fields.")) + "</div>")
          return
        }

        panel.find(".pf-col-count-placeholder").text(
          r.message.length + " " + __("fields")
        )

        r.message.forEach(function (field) {
          var isSelected = col.selectedField === field.fieldname
          var tile = $(buildTileHtml(field, isSelected)).appendTo(list)

          tile.on("click", function () {
            col.selectedField = field.fieldname
            col.selectedLabel = field.label
            columns = columns.slice(0, colIdx + 1)

            if (isDrillable(field)) {
              columns.push({
                doctype: field.options,
                selectedField: null,
                selectedLabel: null,
              })
              renderNavigator(dialog, columns, options)
              setTimeout(function () {
                container[0].scrollLeft = container[0].scrollWidth
              }, 50)
            } else {
              var parts = []
              columns.forEach(function (c) {
                if (c.selectedField) parts.push(c.selectedField)
              })
              var path = parts.join(".")
              dialog.hide()
              if (options.onConfirm) {
                options.onConfirm(path)
              } else {
                showOutputDialog(path, options)
              }
            }
          })
        })
      },
    })
  }

  function showOutputDialog(path, options) {
    var dialog = new frappe.ui.Dialog({
      title: __("Path Selected"),
      fields: [
        { fieldtype: "Section Break", label: __("Path") },
        { fieldtype: "Code", fieldname: "path_display", default: path, read_only: 1 },
        { fieldtype: "Section Break" },
      ],
    })

    var footer = dialog.$wrapper.find(".modal-footer")
    var actions = [
      {
        label: __("Copy Jinja Tag"),
        primary: true,
        action: function () {
          var tag = "{{ doc." + path + " }}"
          navigator.clipboard.writeText(tag).catch(function () { fallbackCopy(tag) })
          frappe.show_alert({ message: __("Jinja tag copied: {0}", [tag]), indicator: "green" }, 3)
          if (options.onJinjaTagSelected) options.onJinjaTagSelected(tag)
        },
      },
      {
        label: __("Create Virtual Field"),
        action: function () {
          dialog.hide()
          showCreateVFDialog(path, options)
        },
      },
      {
        label: __("Copy Frappe Path"),
        action: function () {
          navigator.clipboard.writeText(path).catch(function () { fallbackCopy(path) })
          frappe.show_alert({ message: __("Frappe path copied: {0}", [path]), indicator: "green" }, 3)
          if (options.onPathSelected) options.onPathSelected(path)
        },
      },
    ]

    actions.forEach(function (a) {
      var btn = $(
        '<button type="button" class="btn btn-sm ' +
          (a.primary ? "btn-primary" : "btn-default") +
          '" style="margin-right: 6px;">' +
          escapeHtml(a.label) +
        "</button>"
      )
      btn.on("click", a.action)
      footer.prepend(btn)
    })

    dialog.show()
  }

  function showCreateVFDialog(path, options) {
    var dialog = new frappe.ui.Dialog({
      title: __("Create Virtual Field"),
      fields: [
        { fieldtype: "Data", fieldname: "field_label", label: __("Field Label"), reqd: 1 },
        {
          fieldtype: "Link",
          fieldname: "source_doctype",
          label: __("Source DocType"),
          options: "DocType",
          reqd: 1,
          get_query: function () { return { filters: { istable: 0 } } },
        },
        { fieldtype: "Small Text", fieldname: "field_path", label: __("Field Path"), default: path, read_only: 1 },
        { fieldtype: "Check", fieldname: "show_in_form", label: __("Show in Form"), default: 1 },
        { fieldtype: "Check", fieldname: "show_in_list", label: __("Show in List"), default: 0 },
      ],
      primary_action_label: __("Create"),
      primary_action: function (values) {
        if (!values.field_label || !values.source_doctype) {
          frappe.msgprint("Field Label and Source DocType are required.")
          return
        }

        frappe.call({
          method: "pathfinder.api.pathfinder_api.create_virtual_field",
          args: {
            source_doctype: values.source_doctype,
            field_label: values.field_label,
            field_path: path,
            show_in_form: values.show_in_form,
            show_in_list: values.show_in_list,
          },
          callback: function (r) {
            if (r.message) {
              frappe.show_alert({
                message: __('Virtual field "{0}" created', [r.message.field_label]),
                indicator: "green",
              }, 4)
              if (options.onVirtualFieldCreated) options.onVirtualFieldCreated(r.message)
            }
          },
          freeze: true,
          freeze_message: __("Creating virtual field..."),
        })
        dialog.hide()
      },
    })

    dialog.show()
    var rootRoute = frappe.get_route()
    if (rootRoute[0] === "Form" && rootRoute[1] && rootRoute[1] !== "Customize Form") {
      dialog.set_value("source_doctype", rootRoute[1])
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea")
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand("copy")
    document.body.removeChild(ta)
  }

  window.openPathfinderPopup = openPathfinderPopup
})()
