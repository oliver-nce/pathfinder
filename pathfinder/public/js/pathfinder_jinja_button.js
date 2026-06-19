/**
 * pathfinder_jinja_button.js
 * ============================
 * Adds "Fetch Jinja Tag" to every Desk form when pathfinder is installed.
 * Opens Pathfinder with the appropriate root DocType; selected tags are
 * copied to the clipboard for the user to paste anywhere.
 *
 * Frappe v15 / v16 compatible.
 */
(function () {
  "use strict"

  /** DocTypes where Pathfinder root != form DocType (field on doc holds target). */
  var ROOT_DOCTYPE_OVERRIDES = {
    "Email Template": "document_type",
    "Print Format": "doc_type",
    "Notification": "document_type",
  }

  /** Forms that already ship a dedicated Pathfinder control — avoid duplicate buttons. */
  var SKIP_DOCTYPES = new Set(["Customize Form"])

  function getPathfinderRootDoctype(frm) {
    if (!frm || !frm.doctype) return null

    var overrideField = ROOT_DOCTYPE_OVERRIDES[frm.doctype]
    if (overrideField && frm.doc && frm.doc[overrideField]) {
      return frm.doc[overrideField]
    }

    return frm.doctype
  }

  function openFetchJinjaTag(frm) {
    if (typeof window.openPathfinderPopup !== "function") {
      frappe.msgprint(__("Pathfinder is not available. Run `bench build --app pathfinder`."))
      return
    }

    var rootDoctype = getPathfinderRootDoctype(frm)
    if (!rootDoctype) {
      frappe.msgprint(__("Could not determine a DocType for Pathfinder."))
      return
    }

    var overrideField = ROOT_DOCTYPE_OVERRIDES[frm.doctype]
    if (overrideField && frm.doc && !frm.doc[overrideField]) {
      frappe.msgprint(
        __("Set {0} on this form first, then open Pathfinder.", [
          frappe.meta.get_label(frm.doctype, overrideField) || overrideField,
        ])
      )
      return
    }

    window.openPathfinderPopup(rootDoctype, {
      onJinjaTagSelected: function () {
        frappe.show_alert(
          { message: __("Jinja tag copied to clipboard"), indicator: "green" },
          3
        )
      },
    })
  }

  function addFetchJinjaTagButton(frm) {
    if (!frm || !frm.page) return
    if (SKIP_DOCTYPES.has(frm.doctype)) return
    if (frm._pathfinder_jinja_button_added) return

    frm.page.add_button(
      __("Fetch Jinja Tag"),
      function () {
        openFetchJinjaTag(frm)
      },
      "fa fa-tag"
    )
    frm._pathfinder_jinja_button_added = true
  }

  frappe.ui.form.on("*", {
    refresh: function (frm) {
      addFetchJinjaTagButton(frm)
    },
  })
})()
