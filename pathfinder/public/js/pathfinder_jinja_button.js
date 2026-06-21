/**
 * pathfinder_jinja_button.js
 * ===========================
 * Adds a "Pathfinder" button to every Desk form view.
 *
 * Flow:
 *   1. User clicks "Pathfinder"
 *   2. (Email Template etc.) pick root DocType if needed
 *   3. Walk the relationship tree — selecting a terminal field opens results immediately
 *   4. Results dialog shows all 4 outputs with Copy widgets, Cancel, and Redo Selection
 *
 * Uses form refresh + hashchange retry polling (same retry pattern as pathfinder_desk.js).
 * Frappe v15 / v16 compatible.
 */
;(function () {
  "use strict"

  var SKIP = { "Customize Form": 1 }

  var ROOT_FIELD = {
    "Print Format": "doc_type",
    "Notification": "document_type",
  }

  var ROOT_PICKER = { "Email Template": 1 }

  var BUTTON_LABEL = __("Pathfinder")

  var OUTPUT_ROWS = [
    { key: "jinja", label: __("Jinja Tag") },
    { key: "path", label: __("Frappe Path") },
    { key: "sql_report", label: __("SQL — Report") },
    { key: "sql_param", label: __("SQL — Parameterized") },
  ]

  var SQL_ROWS = [
    { key: "sql_report", label: __("SQL — Report") },
    { key: "sql_param", label: __("SQL — Parameterized") },
  ]

  function getRootDoctype(frm) {
    var f = ROOT_FIELD[frm.doctype]
    if (f && frm.doc && frm.doc[f]) return frm.doc[f]
    if (ROOT_PICKER[frm.doctype]) return "__picker__"
    return frm.doctype
  }

  function normalizePaths(pathOrPaths) {
    if (!pathOrPaths) return []
    if (Array.isArray(pathOrPaths)) return pathOrPaths.filter(Boolean)
    return [pathOrPaths]
  }

  function openTreeWithRoot(root) {
    window.openPathfinderPopup(root, {
      onConfirm: function (paths) {
        showAllOutputsDialog(root, normalizePaths(paths))
      },
    })
  }

  function openPopup(frm) {
    if (typeof window.openPathfinderPopup !== "function") {
      frappe.msgprint(__("Pathfinder popup not available."))
      return
    }

    var root = getRootDoctype(frm)

    if (root === "__picker__") {
      var d = new frappe.ui.Dialog({
        title: __("Pathfinder — select root DocType"),
        fields: [
          {
            fieldtype: "Link",
            fieldname: "dt",
            label: __("DocType"),
            options: "DocType",
            reqd: 1,
            get_query: function () { return { filters: { istable: 0 } } },
          },
        ],
        primary_action_label: __("Open"),
        primary_action: function (v) {
          d.hide()
          openTreeWithRoot(v.dt)
        },
      })
      d.show()
      return
    }

    openTreeWithRoot(root)
  }

  function appendOutputRows(container, rows, values, rowEls) {
    rows.forEach(function (row) {
      var block = $('<div class="pf-output-row" style="margin-bottom: 14px;"></div>')
      var header = $('<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;"></div>')
      header.append('<span style="font-size:12px; font-weight:600;">' + row.label + "</span>")

      var copyBtn = $('<button type="button" class="btn btn-xs btn-default">' + __("Copy") + "</button>")
      copyBtn.on("click", function () {
        var text = values[row.key]
        if (!text || text === __("Loading...")) return
        copyToClipboard(text, row.label)
      })
      header.append(copyBtn)

      var textarea = $(
        '<textarea readonly rows="2" style="width:100%; font-family:monospace; font-size:11px; ' +
          'padding:6px 8px; resize:vertical; background:var(--gray-50); border:1px solid var(--gray-200);"></textarea>'
      )
      textarea.val(values[row.key])

      block.append(header).append(textarea)
      container.append(block)
      rowEls[row.key] = textarea
    })
  }

  function appendTaggedCopyRow(container, path, value, copyLabel) {
    var block = $('<div class="pf-output-tagged-row"></div>')
    var header = $('<div class="pf-output-tagged-header"></div>')
    header.append(
      '<code class="pf-output-tagged-path">' + frappe.utils.escape_html(path) + "</code>"
    )

    var copyBtn = $('<button type="button" class="btn btn-xs btn-default">' + __("Copy") + "</button>")
    copyBtn.on("click", function () {
      copyToClipboard(value, copyLabel)
    })
    header.append(copyBtn)

    var textarea = $(
      '<textarea readonly rows="1" class="pf-output-tagged-value"></textarea>'
    )
    textarea.val(value)

    block.append(header).append(textarea)
    container.append(block)
  }

  function showAllOutputsDialog(root, paths) {
    paths = normalizePaths(paths)
    if (!paths.length) return

    var dialog = new frappe.ui.Dialog({
      title: __("Pathfinder — copy output"),
      size: "large",
    })

    var body = $('<div class="pathfinder-output-dialog" style="padding: 4px 0;"></div>')
    var headerText =
      __("Root DocType") + ": <strong>" + frappe.utils.escape_html(root) + "</strong>"
    if (paths.length === 1) {
      headerText +=
        " &nbsp;|&nbsp; " + __("Path") + ": <strong>" + frappe.utils.escape_html(paths[0]) + "</strong>"
    } else {
      headerText +=
        " &nbsp;|&nbsp; " + __("{0} paths selected", [paths.length])
    }
    body.append(
      '<p style="margin: 0 0 12px; font-size: 12px; color: var(--gray-600);">' + headerText + "</p>"
    )

    if (paths.length === 1) {
      var path = paths[0]
      var values = {
        jinja: "{{ doc." + path + " }}",
        path: path,
        sql_report: __("Loading..."),
        sql_param: __("Loading..."),
      }
      var rowEls = {}
      var section = $('<div class="pf-output-path-section"></div>')
      appendOutputRows(section, OUTPUT_ROWS, values, rowEls)
      body.append(section)
      calcAllOutputs(root, paths, values, rowEls)
    } else {
      var jinjaGroup = $('<div class="pf-output-group"></div>')
      jinjaGroup.append('<div class="pf-output-group-title">' + __("Jinja Tags") + "</div>")
      paths.forEach(function (path) {
        appendTaggedCopyRow(
          jinjaGroup,
          path,
          "{{ doc." + path + " }}",
          __("Jinja Tag")
        )
      })
      body.append(jinjaGroup)

      var pathGroup = $('<div class="pf-output-group"></div>')
      pathGroup.append('<div class="pf-output-group-title">' + __("Frappe Paths") + "</div>")
      paths.forEach(function (path) {
        appendTaggedCopyRow(pathGroup, path, path, __("Frappe Path"))
      })
      body.append(pathGroup)

      var sqlValues = {
        sql_report: __("Loading..."),
        sql_param: __("Loading..."),
      }
      var sqlRowEls = {}
      var sqlSection = $('<div class="pf-output-group pf-output-sql-group"></div>')
      sqlSection.append(
        '<div class="pf-output-group-title">' + __("SQL (all selected fields)") + "</div>"
      )
      appendOutputRows(sqlSection, SQL_ROWS, sqlValues, sqlRowEls)
      body.append(sqlSection)
      calcAllOutputs(root, paths, sqlValues, sqlRowEls)
    }

    dialog.$body.empty().append(body)

    dialog.set_primary_action(__("Cancel"), function () {
      dialog.hide()
    })

    var footer = dialog.$wrapper.find(".modal-footer")
    var redoBtn = $(
      '<button type="button" class="btn btn-sm btn-default" style="margin-right: 6px;">' +
        __("Redo Selection") +
      "</button>"
    )
    redoBtn.on("click", function () {
      dialog.hide()
      openTreeWithRoot(root)
    })
    footer.prepend(redoBtn)

    dialog.show()
  }

  function calcAllOutputs(root, paths, values, rowEls) {
    paths = normalizePaths(paths)
    if (!paths.length) return

    if (paths.length === 1) {
      var path = paths[0]
      values.jinja = "{{ doc." + path + " }}"
      values.path = path
      if (rowEls.jinja) rowEls.jinja.val(values.jinja)
      if (rowEls.path) rowEls.path.val(values.path)
    }

    if (rowEls.sql_report) {
      values.sql_report = __("Loading...")
      rowEls.sql_report.val(values.sql_report)
    }
    if (rowEls.sql_param) {
      values.sql_param = __("Loading...")
      rowEls.sql_param.val(values.sql_param)
    }

    fetchSqlExpressions(root, paths, "report", function (sql) {
      values.sql_report = sql || ""
      if (rowEls.sql_report) rowEls.sql_report.val(values.sql_report)
    })

    fetchSqlExpressions(root, paths, "parameterized", function (sql) {
      values.sql_param = sql || ""
      if (rowEls.sql_param) rowEls.sql_param.val(values.sql_param)
    })
  }

  function fetchSqlExpressions(root, paths, style, done) {
    paths = normalizePaths(paths)
    var method = paths.length > 1
      ? "pathfinder.api.pathfinder_api.build_sql_expressions"
      : "pathfinder.api.pathfinder_api.build_sql_expression"

    frappe.call({
      method: method,
      args: paths.length > 1
        ? { root_doctype: root, paths: paths, style: style }
        : { root_doctype: root, path: paths[0], style: style },
      callback: function (r) {
        done(r.message || "")
      },
      error: function () {
        done(__("Error generating SQL"))
      },
    })
  }

  function fetchSqlExpression(root, path, style, done) {
    fetchSqlExpressions(root, [path], style, done)
  }

  function copyToClipboard(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text) })
    } else {
      fallbackCopy(text)
    }
    frappe.show_alert({ message: label + " " + __("copied"), indicator: "green" }, 3)
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea")
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand("copy")
    document.body.removeChild(ta)
  }

  function injectButton(frm) {
    frm = frm || (typeof cur_frm !== "undefined" ? cur_frm : null)
    var route = frappe.get_route ? frappe.get_route() : []
    if (!route || route[0] !== "Form") return false
    if (!frm || !frm.doctype || !frm.page) return false
    if (SKIP[frm.doctype]) return false

    if (
      frm.page.inner_toolbar &&
      frm.page.inner_toolbar.find("button:contains('" + BUTTON_LABEL + "')").length
    ) return true

    frm.add_custom_button(BUTTON_LABEL, function () { openPopup(frm) })
    return true
  }

  function scheduleInject() {
    var attempts = 0
    var timer = setInterval(function () {
      attempts++
      if (injectButton() || attempts > 30) clearInterval(timer)
    }, 100)
  }

  $(document).ready(function () {
    // Reliable: form toolbar exists when refresh fires
    frappe.ui.form.on("*", {
      refresh: function (frm) {
        injectButton(frm)
      },
    })

    // SPA navigation — cur_frm may not exist until form finishes loading
    $(window).on("hashchange", function () {
      scheduleInject()
    })

    // Initial page load (direct URL or desk already open)
    scheduleInject()
  })
})()
