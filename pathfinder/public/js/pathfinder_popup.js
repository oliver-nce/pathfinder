/**
 * pathfinder_popup.js
 * =====================
 * Pure JavaScript (no Vue) Pathfinder popup — column-based path navigator
 * embedded in a Frappe dialog.
 *
 * This is the default handler for window.openPathfinderPopup().
 * The Vue version remains available as window.openPathfinderPopupVue().
 *
 * Frappe v15/v16 compatible.
 */
(function () {
  "use strict"

  var DRILLABLE_TYPES = ["Link", "Table", "Table MultiSelect", "Dynamic Link"]

  /**
   * Open the Pathfinder popup using pure JS (no Vue).
   */
  function openPathfinderPopup(rootDoctype, options) {
    options = options || {}
    if (!rootDoctype) {
      frappe.msgprint("No DocType specified for Pathfinder.")
      return
    }

    var columns = [{ doctype: rootDoctype, selectedField: null, selectedLabel: null }]

    var dialog = new frappe.ui.Dialog({
      title: __("Pathfinder — {0}", [rootDoctype]),
      fields: [
        {
          fieldtype: "HTML",
          fieldname: "navigator",
        },
      ],
    })

    dialog.show()
    renderNavigator(dialog, columns, options)
  }

  /**
   * Render the column-based navigator into the dialog HTML field.
   */
  function renderNavigator(dialog, columns, options) {
    options = options || {}
    var wrapper = dialog.fields_dict.navigator.$wrapper
    wrapper.empty()

    var container = wrapper.append(
      '<div class="pf-popup-container" style="position: relative; max-height: 400px;"></div>'
    ).find(".pf-popup-container")

    // Breadcrumb trail
    var breadcrumb = $('<div class="pf-breadcrumb" style="display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 12px; font-size: 12px; color: var(--gray-500); border-bottom: 1px solid var(--gray-200);"></div>').appendTo(container)
    columns.forEach(function (col, idx) {
      if (idx > 0) {
        breadcrumb.append('<span style="color: var(--gray-300);"> / </span>')
      }
      var btn = $('<button class="pf-breadcrumb-btn" style="background: none; border: none; cursor: pointer; padding: 2px 6px; border-radius: 4px; color: ' +
        (idx === columns.length - 1 ? 'var(--gray-800); font-weight: 600;' : 'var(--gray-500);') + '">' +
        (col.selectedLabel || col.doctype) + '</button>').appendTo(breadcrumb)
      btn.on("click", function () {
        columns[idx].selectedField = null
        columns[idx].selectedLabel = null
        columns = columns.slice(0, idx + 1)
        renderNavigator(dialog, columns, options)
      })
    })

    // Path bar
    var pathParts = []
    columns.forEach(function (col) { if (col.selectedField) pathParts.push(col.selectedField) })
    var pathStr = pathParts.join(".")

    if (pathStr) {
      var pathBar = $('<div style="display: flex; align-items: center; gap: 8px; margin: 8px 12px; padding: 6px 10px; background: var(--blue-50); border: 1px solid var(--blue-200); border-radius: 6px; font-size: 12px;"></div>').appendTo(container)
      pathBar.append('<i class="fa fa-link" style="color: var(--blue-500);"></i>')
      pathBar.append('<code style="flex: 1; font-family: monospace; color: var(--blue-700);">' + pathStr + '</code>')
    }

    // Columns area
    var scrollArea = $('<div style="display: flex; overflow-x: auto; gap: 1px; padding: 8px 0; min-height: 200px; max-height: 260px; border-top: 1px solid var(--gray-100);"></div>').appendTo(container)

    columns.forEach(function (col, colIdx) {
      renderColumn(scrollArea, dialog, columns, col, colIdx, options)
    })
  }

  /**
   * Render a single column of fields.
   */
  function renderColumn(container, dialog, columns, col, colIdx, options) {
    var panel = $('<div style="min-width: 200px; max-width: 240px; flex-shrink: 0; border-right: 1px solid var(--gray-200);"></div>').appendTo(container)

    var header = $('<div style="padding: 8px 10px; font-size: 13px; font-weight: 600; color: var(--gray-700); background: var(--gray-50); border-bottom: 1px solid var(--gray-200);">' + col.doctype + '</div>').appendTo(panel)

    var list = $('<div style="overflow-y: auto; max-height: 220px;"></div>').appendTo(panel)
    var loading = $('<div style="padding: 20px; text-align: center; color: var(--gray-400); font-size: 13px;"><i class="fa fa-spinner fa-spin"></i> Loading...</div>').appendTo(list)

    frappe.call({
      method: "pathfinder.api.pathfinder_api.get_doctype_fields",
      args: { doctype: col.doctype },
      callback: function (r) {
        loading.remove()
        if (!r.message) {
          list.append('<div style="padding: 10px; color: var(--red-500); font-size: 12px;">Error loading fields.</div>')
          return
        }

        var fields = r.message
        fields.forEach(function (field) {
          var isSelected = col.selectedField === field.fieldname
          var isDrillable = DRILLABLE_TYPES.indexOf(field.fieldtype) >= 0

          var row = $('<div style="padding: 5px 10px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; ' +
            (isSelected ? 'background: var(--blue-100); color: var(--blue-700); font-weight: 600;' : 'color: var(--gray-700);') + '">' +
            '<span style="opacity: 0.5; font-size: 11px; min-width: 50px;">' + field.fieldtype + '</span>' +
            '<span>' + field.label + '</span>' +
            (isDrillable ? '<i class="fa fa-chevron-right" style="margin-left: auto; opacity: 0.4; font-size: 10px;"></i>' : '') +
            '</div>').appendTo(list)

          row.on("click", function () {
            col.selectedField = field.fieldname
            col.selectedLabel = field.label
            columns = columns.slice(0, colIdx + 1)

            if (isDrillable && field.options) {
              columns.push({ doctype: field.options, selectedField: null, selectedLabel: null })
              renderNavigator(dialog, columns, options)
              setTimeout(function () {
                container[0].scrollLeft = container[0].scrollWidth
              }, 50)
            } else {
              var pathParts = []
              columns.forEach(function (c) { if (c.selectedField) pathParts.push(c.selectedField) })
              var pathStr = pathParts.join(".")
              dialog.hide()
              if (options.onConfirm) {
                options.onConfirm(pathStr)
              } else {
                showOutputDialog(pathStr, options)
              }
            }
          })
        })
      },
    })
  }

  /**
   * Show the 3-option output dialog after a path is selected.
   */
  function showOutputDialog(path, options) {
    var dialog = new frappe.ui.Dialog({
      title: __("Path Selected"),
      fields: [
        {
          fieldtype: "Section Break",
          label: __("Path"),
        },
        {
          fieldtype: "Code",
          fieldname: "path_display",
          default: path,
          read_only: 1,
        },
        {
          fieldtype: "Section Break",
        },
      ],
    })

    var footer = dialog.$wrapper.find(".modal-footer")

    var actions = [
      {
        label: __("Copy Jinja Tag"),
        primary: true,
        action: function () {
          var tag = "{{ doc." + path + " }}"
          navigator.clipboard.writeText(tag).catch(function () {
            fallbackCopy(tag)
          })
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
          navigator.clipboard.writeText(path).catch(function () {
            fallbackCopy(path)
          })
          frappe.show_alert({ message: __("Frappe path copied: {0}", [path]), indicator: "green" }, 3)
          if (options.onPathSelected) options.onPathSelected(path)
        },
      },
    ]

    actions.forEach(function (a) {
      var btn = $('<button class="btn btn-sm ' +
        (a.primary ? 'btn-primary' : 'btn-default') +
        '" style="margin-right: 6px;">' + a.label + '</button>')
      btn.on("click", a.action)
      footer.prepend(btn)
    })

    dialog.show()
  }

  /**
   * Dialog to create a Pathfinder Virtual Field.
   */
  function showCreateVFDialog(path, options) {
    var dialog = new frappe.ui.Dialog({
      title: __("Create Virtual Field"),
      fields: [
        {
          fieldtype: "Data",
          fieldname: "field_label",
          label: __("Field Label"),
          reqd: 1,
        },
        {
          fieldtype: "Link",
          fieldname: "source_doctype",
          label: __("Source DocType"),
          options: "DocType",
          reqd: 1,
          get_query: function () {
            return {
              filters: { istable: 0 },
            }
          },
        },
        {
          fieldtype: "Small Text",
          fieldname: "field_path",
          label: __("Field Path"),
          default: path,
          read_only: 1,
        },
        {
          fieldtype: "Check",
          fieldname: "show_in_form",
          label: __("Show in Form"),
          default: 1,
        },
        {
          fieldtype: "Check",
          fieldname: "show_in_list",
          label: __("Show in List"),
          default: 0,
        },
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
    // Pre-fill source_doctype if we can detect it from the last column
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

  // Expose on window
  window.openPathfinderPopup = openPathfinderPopup

})()
