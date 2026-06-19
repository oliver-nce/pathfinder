/**
 * pathfinder_jinja_button.js
 * ===========================
 * Adds "Fetch Jinja Tag" to every Desk form view.
 *
 * Uses hashchange + cur_frm — the same proven pattern that pathfinder_desk.js
 * uses to inject the Pathfinder button on Customize Form. Avoids frappe.ui.form.on("*")
 * which does not reliably fire for all DocTypes in Frappe v15.
 *
 * Frappe v15 / v16 compatible.
 */
(function () {
  "use strict"

  var SKIP = { "Customize Form": 1 }

  var ROOT_FIELD = {
    "Print Format": "doc_type",
    "Notification": "document_type",
  }

  var ROOT_PICKER = { "Email Template": 1 }

  function getRootDoctype(frm) {
    var f = ROOT_FIELD[frm.doctype]
    if (f && frm.doc && frm.doc[f]) return frm.doc[f]
    if (ROOT_PICKER[frm.doctype]) return "__picker__"
    return frm.doctype
  }

  function openPopup(frm) {
    if (typeof window.openPathfinderPopup !== "function") {
      frappe.msgprint(__("Pathfinder popup not available."))
      return
    }

    var root = getRootDoctype(frm)

    if (root === "__picker__") {
      var d = new frappe.ui.Dialog({
        title: __("Pathfinder — pick a DocType"),
        fields: [{ fieldtype: "Link", fieldname: "dt", label: __("DocType"), options: "DocType", reqd: 1, get_query: function () { return { filters: { istable: 0 } } } }],
        primary_action_label: __("Open"),
        primary_action: function (v) { d.hide(); window.openPathfinderPopup(v.dt, onTag) },
      })
      d.show()
      return
    }

    window.openPathfinderPopup(root, onTag)
  }

  var onTag = {
    onJinjaTagSelected: function () {
      frappe.show_alert({ message: __("Jinja tag copied to clipboard"), indicator: "green" }, 3)
    },
  }

  function injectButton() {
    var route = frappe.get_route ? frappe.get_route() : []
    if (!route || route[0] !== "Form") return
    if (!cur_frm || !cur_frm.doctype) return
    if (SKIP[cur_frm.doctype]) return

    // Guard: don't add twice for this form instance
    var label = __("Fetch Jinja Tag")
    if (cur_frm.page.inner_toolbar && cur_frm.page.inner_toolbar.find("button:contains('" + label + "')").length) return

    cur_frm.add_custom_button(label, function () { openPopup(cur_frm) })
  }

  $(document).ready(function () {
    // Fire on every route change
    $(window).on("hashchange", function () {
      setTimeout(injectButton, 300)
    })

    // Also fire once for the page that is already open on script load
    setTimeout(injectButton, 500)
  })
})()
