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
  var REVERSE_TABLE_CHAR = "\u25A6"
  function getModalDialog(dialog) {
    var $wrapper = dialog.$wrapper
    if (!$wrapper || !$wrapper.length) return $()
    var $modalDialog = $wrapper.find("> .modal-dialog")
    if (!$modalDialog.length) $modalDialog = $wrapper.filter(".modal-dialog")
    if (!$modalDialog.length) $modalDialog = $wrapper.closest(".modal-dialog")
    return $modalDialog
  }

  function updateDialogWidth(dialog, container) {
    var $modalDialog = getModalDialog(dialog)
    if (!$modalDialog.length || !container) return

    requestAnimationFrame(function () {
      var $container = $(container)
      var $body = $container.find(".pf-body")
      if (!$body.length) return

      var columnsWidth = 0
      $body.find(".pf-column").each(function () {
        columnsWidth += $(this).outerWidth(true)
      })

      var innerWidth = Math.max(columnsWidth, $container[0].scrollWidth)
      var width = Math.ceil(innerWidth + 2)
      var maxWidth = Math.floor(window.innerWidth * 0.98)
      var applied = Math.min(maxWidth, Math.max(320, width))

      $modalDialog.css({
        maxWidth: applied + "px",
        width: applied + "px",
      })
      $body.css("overflow-x", applied < width ? "auto" : "hidden")
    })
  }

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

  function isLinkedValueField(field) {
    return LINK_TYPES.indexOf(field.fieldtype) >= 0
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
      options.onConfirm({ mode: "forward", paths: paths })
    } else if (paths.length === 1) {
      showOutputDialog(paths[0], options)
    }
  }

  function getReverseColumns(dialog) {
    if (!dialog._pfReverseColumns) dialog._pfReverseColumns = []
    return dialog._pfReverseColumns
  }

  function addReverseColumn(dialog, colPath) {
    var cols = getReverseColumns(dialog)
    if (!colPath || cols.indexOf(colPath) >= 0) return false
    cols.push(colPath)
    return true
  }

  function removeReverseColumn(dialog, colPath) {
    var cols = getReverseColumns(dialog)
    var idx = cols.indexOf(colPath)
    if (idx >= 0) cols.splice(idx, 1)
  }

  function getReverseAnchor(columns) {
    for (var i = 0; i < columns.length; i++) {
      if (columns[i].direction === "reverse") return columns[i]
    }
    return null
  }

  function buildReverseColumnPath(col, fieldname) {
    if (col.hopPrefix) return col.hopPrefix + "." + fieldname
    return fieldname
  }

  function finishWithReverseSelection(dialog, columns, col, fieldnames, options) {
    var anchor = getReverseAnchor(columns)
    if (!fieldnames || !fieldnames.length || !anchor || !anchor.reverseLink) return
    dialog.hide()
    if (options.onConfirm) {
      options.onConfirm({
        mode: "reverse",
        selection: {
          root_doctype: columns[0].doctype,
          child_doctype: anchor.doctype,
          link_field: anchor.reverseLink.link_field,
          columns: fieldnames,
        },
      })
    }
  }

  function isReverseColumn(col) {
    return col && col.direction === "reverse"
  }

  function isReverseMode(col) {
    return col && (col.direction === "reverse" || col.direction === "reverse_hop")
  }

  function tileClasses(field, isActive, isPicked, isReverse) {
    var cls = ["pf-tile"]
    if (isReverse) cls.push("pf-tile-reverse")
    else if (LINK_TYPES.indexOf(field.fieldtype) >= 0) cls.push("pf-tile-link")
    else if (TABLE_TYPES.indexOf(field.fieldtype) >= 0) cls.push("pf-tile-table")
    if (isPicked) cls.push("pf-tile-picked")
    if (isActive) cls.push("pf-tile-active")
    return cls.join(" ")
  }

  function buildReverseRelationTileHtml(rel, isActive) {
    var label = escapeHtml(rel.label || rel.child_doctype)
    var fieldname = escapeHtml(rel.link_field)
    var badge = escapeHtml(REVERSE_TABLE_CHAR + " " + rel.child_doctype)

    return (
      '<div class="pf-tile pf-tile-reverse' + (isActive ? " pf-tile-active" : "") + '">' +
        '<div class="pf-tile-top">' +
          '<span class="pf-tile-label">' + label + "</span>" +
          '<span class="pf-tile-arrow pf-tile-arrow-reverse">' + REVERSE_TABLE_CHAR + "</span>" +
        "</div>" +
        '<div class="pf-tile-meta">' +
          '<span class="pf-tile-fieldname">' + fieldname + "</span>" +
          '<span class="pf-tile-badge">' + badge + "</span>" +
        "</div>" +
      "</div>"
    )
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
    dialog._pfReverseColumns = []
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
    var reverseCol = columns.length ? columns[columns.length - 1] : null

    if (isReverseMode(reverseCol)) {
      var anchor = getReverseAnchor(columns)
      var revCols = getReverseColumns(dialog)
      pathStr =
        REVERSE_TABLE_CHAR + anchor.doctype +
        " (" + anchor.reverseLink.link_field + ")" +
        (reverseCol.hopPrefix ? " → " + reverseCol.hopPrefix : "") +
        (revCols.length ? ": " + revCols.join(", ") : "")
    }

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

    updateDialogWidth(dialog, container)
  }

  function renderMultiBar(container, dialog, columns, options) {
    var reverseCol = columns.length ? columns[columns.length - 1] : null
    var inReverse = isReverseMode(reverseCol)
    var paths = inReverse ? getReverseColumns(dialog) : getSelectedPaths(dialog)
    if (!paths.length) return

    var bar = $('<div class="pf-multi-bar"></div>').appendTo(container)
    var chips = $('<div class="pf-multi-chips"></div>').appendTo(bar)

    paths.forEach(function (item) {
      var chip = $(
        '<span class="pf-multi-chip">' +
          '<code>' + escapeHtml(item) + "</code>" +
          '<button type="button" class="pf-multi-chip-remove" title="' + escapeHtml(__("Remove")) + '">&times;</button>' +
        "</span>"
      ).appendTo(chips)
      chip.find(".pf-multi-chip-remove").on("click", function (e) {
        e.stopPropagation()
        if (inReverse) removeReverseColumn(dialog, item)
        else removeSelectedPath(dialog, item)
        renderNavigator(dialog, columns, options)
      })
    })

    var doneBtn = $(
      '<button type="button" class="btn btn-xs btn-primary pf-multi-done">' +
        escapeHtml(__("Done")) + " (" + paths.length + ")" +
      "</button>"
    ).appendTo(bar)
    doneBtn.on("click", function () {
      if (inReverse) {
        finishWithReverseSelection(dialog, columns, reverseCol, paths.slice(), options)
      } else {
        finishWithPaths(dialog, paths.slice(), options)
      }
    })
  }

  function renderReverseLinksSection(list, panel, dialog, columns, col, colIdx, container, options) {
    if (isReverseMode(col)) return

    frappe.call({
      method: "pathfinder.api.pathfinder_api.get_reverse_link_doctypes",
      args: { doctype: col.doctype },
      callback: function (r) {
        var relations = r.message || []
        if (!relations.length) return

        list.append('<div class="pf-section-label">' + escapeHtml(__("Related tables")) + "</div>")

        relations.forEach(function (rel) {
          var isActive =
            columns[colIdx + 1] &&
            columns[colIdx + 1].doctype === rel.child_doctype &&
            columns[colIdx + 1].reverseLink &&
            columns[colIdx + 1].reverseLink.link_field === rel.link_field

          var tile = $(buildReverseRelationTileHtml(rel, isActive)).appendTo(list)
          tile.on("click", function () {
            columns = columns.slice(0, colIdx + 1)
            dialog._pfReverseColumns = []
            columns.push({
              doctype: rel.child_doctype,
              direction: "reverse",
              reverseLink: {
                parent_doctype: col.doctype,
                link_field: rel.link_field,
              },
              selectedField: null,
              selectedLabel: rel.label || rel.child_doctype,
            })
            renderNavigator(dialog, columns, options)
            setTimeout(function () {
              if (container[0]) container[0].scrollLeft = container[0].scrollWidth
            }, 50)
          })
        })

        panel.find(".pf-col-count-placeholder").text(
          list.find(".pf-tile").length + " " + __("items")
        )
      },
    })
  }

  function renderColumn(container, dialog, columns, col, colIdx, options) {
    var panel = $('<div class="pf-column"></div>').appendTo(container)
    var header = $('<div class="pf-col-header"></div>').appendTo(panel)
    var headerLabel = col.direction === "reverse"
      ? REVERSE_TABLE_CHAR + " " + col.doctype
      : col.direction === "reverse_hop"
      ? "\u2192 " + col.doctype
      : col.doctype
    header.append("<span>" + escapeHtml(headerLabel) + "</span>")
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
          var colPath = buildReverseColumnPath(col, field.fieldname)
          var isPicked = isReverseMode(col)
            ? getReverseColumns(dialog).indexOf(colPath) >= 0
            : getSelectedPaths(dialog).indexOf(buildPathWithField(columns, colIdx, field.fieldname)) >= 0
          var tile = $(buildTileHtml(field, isActive, isPicked)).appendTo(list)

          tile.on("click", function () {
            col.selectedField = field.fieldname
            col.selectedLabel = field.label
            columns = columns.slice(0, colIdx + 1)

            if (isReverseMode(col)) {
              if (isDrillable(field)) {
                columns.push({
                  doctype: field.options,
                  direction: "reverse_hop",
                  hopPrefix: colPath,
                  selectedField: null,
                  selectedLabel: field.label,
                })
                renderNavigator(dialog, columns, options)
                setTimeout(function () {
                  if (container[0]) container[0].scrollLeft = container[0].scrollWidth
                }, 50)
                return
              }

              if (isLinkedValueField(field)) {
                frappe.show_alert({
                  message: __("Link columns are excluded (scalar fields only)."),
                  indicator: "orange",
                }, 3)
                return
              }

              addReverseColumn(dialog, colPath)
              renderNavigator(dialog, columns, options)
              return
            }

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

            if (isLinkedValueField(field)) {
              frappe.show_alert({
                message: __("Link fields are omitted from paths/tags (use Related tables for one-to-many)."),
                indicator: "orange",
              }, 3)
              return
            }

            var path = buildPathFromColumns(columns)
            addSelectedPath(dialog, path)
            renderNavigator(dialog, columns, options)
          })
        })

        renderReverseLinksSection(list, panel, dialog, columns, col, colIdx, container, options)
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
