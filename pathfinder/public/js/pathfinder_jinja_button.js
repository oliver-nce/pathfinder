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

  var SQL_ROWS = [
    { key: "sql_report", label: __("SQL — Report") },
    { key: "sql_param", label: __("SQL — Parameterized") },
  ]

  var COPY_ICON_SVG =
    '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/>' +
      '<rect x="2" y="2" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2" fill="var(--bg-color, #fff)"/>' +
    "</svg>"

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

  function buildCopyCell(text, copyLabel) {
    var td = $('<td class="pf-output-cell"></td>')
    var inner = $('<div class="pf-output-cell-inner"></div>')
    inner.append(
      '<code class="pf-output-cell-text">' + frappe.utils.escape_html(text) + "</code>"
    )

    var btn = $(
      '<button type="button" class="pf-copy-cell-btn" title="' + frappe.utils.escape_html(__("Copy")) + '">' +
        COPY_ICON_SVG +
      "</button>"
    )
    btn.on("click", function (e) {
      e.stopPropagation()
      copyToClipboard(text, copyLabel)
    })
    inner.append(btn)
    td.append(inner)
    return td
  }

  function appendPathsJinjaTable(container, paths) {
    var table = $('<table class="pf-output-table"></table>')
    table.append(
      "<thead><tr>" +
        "<th>" + __("Frappe Path") + "</th>" +
        "<th>" + __("Jinja Tag") + "</th>" +
      "</tr></thead>"
    )

    var tbody = $("<tbody></tbody>")
    paths.forEach(function (path) {
      var jinja = "{{ doc." + path + " }}"
      var tr = $("<tr></tr>")
      tr.append(buildCopyCell(path, __("Frappe Path")))
      tr.append(buildCopyCell(jinja, __("Jinja Tag")))
      tbody.append(tr)
    })

    table.append(tbody)
    container.append(table)
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

    var tableGroup = $('<div class="pf-output-group pf-output-table-group"></div>')
    appendPathsJinjaTable(tableGroup, paths)
    body.append(tableGroup)

    var sqlValues = {
      sql_report: __("Loading..."),
      sql_param: __("Loading..."),
    }
    var sqlRowEls = {}
    var sqlSection = $('<div class="pf-output-group pf-output-sql-group"></div>')
    if (paths.length > 1) {
      sqlSection.append(
        '<div class="pf-output-group-title">' + __("SQL (all selected fields)") + "</div>"
      )
    }
    appendOutputRows(sqlSection, SQL_ROWS, sqlValues, sqlRowEls)
    body.append(sqlSection)
    calcAllOutputs(root, paths, sqlValues, sqlRowEls)

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
