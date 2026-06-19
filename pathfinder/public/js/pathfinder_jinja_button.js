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
 * Uses hashchange + cur_frm — same pattern as pathfinder_desk.js.
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

  function getRootDoctype(frm) {
    var f = ROOT_FIELD[frm.doctype]
    if (f && frm.doc && frm.doc[f]) return frm.doc[f]
    if (ROOT_PICKER[frm.doctype]) return "__picker__"
    return frm.doctype
  }

  function openTreeWithRoot(root) {
    window.openPathfinderPopup(root, {
      onConfirm: function (path) {
        showAllOutputsDialog(root, path)
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

  function showAllOutputsDialog(root, path) {
    var values = {
      jinja: "{{ doc." + path + " }}",
      path: path,
      sql_report: __("Loading..."),
      sql_param: __("Loading..."),
    }

    var rowEls = {}

    var dialog = new frappe.ui.Dialog({
      title: __("Pathfinder — copy output"),
      size: "large",
    })

    var body = $('<div class="pathfinder-output-dialog" style="padding: 4px 0;"></div>')
    body.append(
      '<p style="margin: 0 0 12px; font-size: 12px; color: var(--gray-600);">' +
        __("Root DocType") + ": <strong>" + frappe.utils.escape_html(root) + "</strong> &nbsp;|&nbsp; " +
        __("Path") + ": <strong>" + frappe.utils.escape_html(path) + "</strong>" +
      "</p>"
    )

    OUTPUT_ROWS.forEach(function (row) {
      var block = $('<div style="margin-bottom: 14px;"></div>')
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
      body.append(block)
      rowEls[row.key] = textarea
    })

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
    calcAllOutputs(root, path, values, rowEls)
  }

  function calcAllOutputs(root, path, values, rowEls) {
    values.jinja = "{{ doc." + path + " }}"
    values.path = path
    values.sql_report = __("Loading...")
    values.sql_param = __("Loading...")

    rowEls.jinja.val(values.jinja)
    rowEls.path.val(values.path)
    rowEls.sql_report.val(values.sql_report)
    rowEls.sql_param.val(values.sql_param)

    fetchSqlExpression(root, path, "report", function (sql) {
      values.sql_report = sql || ""
      rowEls.sql_report.val(values.sql_report)
    })

    fetchSqlExpression(root, path, "parameterized", function (sql) {
      values.sql_param = sql || ""
      rowEls.sql_param.val(values.sql_param)
    })
  }

  function fetchSqlExpression(root, path, style, done) {
    frappe.call({
      method: "pathfinder.api.pathfinder_api.build_sql_expression",
      args: { root_doctype: root, path: path, style: style },
      callback: function (r) {
        done(r.message || "")
      },
      error: function () {
        done(__("Error generating SQL"))
      },
    })
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

  function injectButton() {
    var route = frappe.get_route ? frappe.get_route() : []
    if (!route || route[0] !== "Form") return
    if (!cur_frm || !cur_frm.doctype) return
    if (SKIP[cur_frm.doctype]) return

    if (
      cur_frm.page.inner_toolbar &&
      cur_frm.page.inner_toolbar.find("button:contains('" + BUTTON_LABEL + "')").length
    ) return

    cur_frm.add_custom_button(BUTTON_LABEL, function () { openPopup(cur_frm) })
  }

  $(document).ready(function () {
    $(window).on("hashchange", function () {
      setTimeout(injectButton, 300)
    })
    setTimeout(injectButton, 500)
  })
})()
