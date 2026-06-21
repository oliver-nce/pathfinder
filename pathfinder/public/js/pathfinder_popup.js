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

  function buildPathFromColumns(columns) {
    var parts = []
    columns.forEach(function (col) {
      if (col.selectedField) parts.push(col.selectedField)
    })
    return parts.join(".")
  }

  function buildPathWithField(columns, colIdx, fieldname) {
    var parts = []
    columns.forEach(function (col, i) {
      if (i < colIdx && col.selectedField) {
        parts.push(col.selectedField)
      } else if (i === colIdx) {
        parts.push(fieldname)
      }
    })
    return parts.join(".")
  }

  function getSelectedPaths(dialog) {
    if (!dialog._pfSelectedPaths) dialog._pfSelectedPaths = []
    return dialog._pfSelectedPaths
  }

  function addSelectedPath(dialog, path) {
    var paths = getSelectedPaths(dialog)
    if (!path || paths.indexOf(path) >= 0) return false
    paths.push(path)
    return true
  }

  function removeSelectedPath(dialog, path) {
    var paths = getSelectedPaths(dialog)
    var idx = paths.indexOf(path)
    if (idx >= 0) paths.splice(idx, 1)
  }

  function finishWithPaths(dialog, paths, options) {
    if (!paths || !paths.length) return
    dialog.hide()
    if (options.onConfirm) {
      options.onConfirm(paths)
    } else if (paths.length === 1) {
      showOutputDialog(paths[0], options)
    }
  }

  function tileClasses(field, isActive, isPicked) {
    var cls = ["pf-tile"]
    if (LINK_TYPES.indexOf(field.fieldtype) >= 0) cls.push("pf-tile-link")
    else if (TABLE_TYPES.indexOf(field.fieldtype) >= 0) cls.push("pf-tile-table")
    if (isPicked) cls.push("pf-tile-picked")
    if (isActive) cls.push("pf-tile-active")
    return cls.join(" ")
  }

  function buildTileHtml(field, isActive, isPicked) {
    var label = escapeHtml(field.label || field.fieldname)
    var fieldname = escapeHtml(field.fieldname)
    var badge = escapeHtml(badgeText(field))
    var arrow = isDrillable(field)
      ? '<span class="pf-tile-arrow">&#9654;</span>'
      : ""

    return (
      '<div class="' + tileClasses(field, isActive, isPicked) + '">' +
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
    dialog._pfSelectedPaths = []
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

    renderMultiBar(container, dialog, columns, options)

    var scrollArea = $('<div class="pf-body"></div>').appendTo(container)

    columns.forEach(function (col, colIdx) {
      renderColumn(scrollArea, dialog, columns, col, colIdx, options)
    })
  }

  function renderMultiBar(container, dialog, columns, options) {
    var paths = getSelectedPaths(dialog)
    var bar = $('<div class="pf-multi-bar"></div>').appendTo(container)

    bar.append(
      '<span class="pf-multi-hint">' +
        escapeHtml(__("Shift+click a field to add paths. Click without Shift to finish.")) +
      "</span>"
    )

    var chips = $('<div class="pf-multi-chips"></div>').appendTo(bar)

    paths.forEach(function (path) {
      var chip = $(
        '<span class="pf-multi-chip">' +
          '<code>' + escapeHtml(path) + "</code>" +
          '<button type="button" class="pf-multi-chip-remove" title="' + escapeHtml(__("Remove")) + '">&times;</button>' +
        "</span>"
      ).appendTo(chips)
      chip.find(".pf-multi-chip-remove").on("click", function (e) {
        e.stopPropagation()
        removeSelectedPath(dialog, path)
        renderNavigator(dialog, columns, options)
      })
    })

    if (paths.length) {
      var doneBtn = $(
        '<button type="button" class="btn btn-xs btn-primary pf-multi-done">' +
          escapeHtml(__("Done")) + " (" + paths.length + ")" +
        "</button>"
      ).appendTo(bar)
      doneBtn.on("click", function () {
        finishWithPaths(dialog, paths.slice(), options)
      })
    }
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
          var isActive = col.selectedField === field.fieldname
          var fieldPath = buildPathWithField(columns, colIdx, field.fieldname)
          var isPicked = getSelectedPaths(dialog).indexOf(fieldPath) >= 0
          var tile = $(buildTileHtml(field, isActive, isPicked)).appendTo(list)

          tile.on("click", function (e) {
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
                if (container[0]) container[0].scrollLeft = container[0].scrollWidth
              }, 50)
              return
            }

            var path = buildPathFromColumns(columns)

            if (e.shiftKey) {
              if (addSelectedPath(dialog, path)) {
                frappe.show_alert({
                  message: __("Added path ({0} selected)", [getSelectedPaths(dialog).length]),
                  indicator: "green",
                }, 2)
              }
              renderNavigator(dialog, columns, options)
              return
            }

            var paths = getSelectedPaths(dialog).slice()
            if (paths.indexOf(path) < 0) paths.push(path)
            finishWithPaths(dialog, paths, options)
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
