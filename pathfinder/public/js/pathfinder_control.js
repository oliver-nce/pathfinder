/**
 * pathfinder_control.js
 * ======================
 * Custom Frappe control that displays resolved virtual field values
 * on any DocType form.
 *
 * Also injects a "Manage Virtual Fields" button into the form header.
 *
 * This is automatically active on all forms via the onload hook
 * (inject_virtual_fields in pathfinder_api.py).
 */

(function () {
  "use strict"

  /**
   * Inject a "Virtual Fields" section into the DocType form dashboard.
   * Called after the form is refreshed and doc._virtual_fields is available
   * (set by the server-side onload hook).
   */
  function renderVirtualFields(frm) {
    if (!frm || !frm.doc || !frm.doc._virtual_fields) return

    var vfields = frm.doc._virtual_fields
    var keys = Object.keys(vfields)
    if (keys.length === 0) return

    // Remove existing section if present
    var existing = frm.dashboard.$wrapper.find(".pathfinder-virtual-fields-section")
    if (existing.length) {
      existing.remove()
    }

    // Build the section HTML
    var sectionHtml = '<div class="pathfinder-virtual-fields-section">'
    sectionHtml += '<div class="form-dashboard-section">'
    sectionHtml += '<div class="section-head" style="margin-bottom: 8px;">'
    sectionHtml += '<span style="font-size: 12px; font-weight: 600; color: var(--gray-600);">Virtual Fields (Pathfinder)</span>'
    sectionHtml += "</div>"
    sectionHtml += '<div class="row">'

    keys.forEach(function (label) {
      var value = vfields[label]
      var displayValue = value === null || value === undefined ? '<span style="color: var(--gray-400);">Not resolved</span>' : frappe.format(value, { fieldtype: "Data" })
      sectionHtml += '<div class="col-sm-6" style="margin-bottom: 4px;">'
      sectionHtml += '<span style="font-size: 11px; color: var(--gray-500);">' + label + ":</span> "
      sectionHtml += '<span style="font-size: 12px;">' + displayValue + "</span>"
      sectionHtml += "</div>"
    })

    sectionHtml += "</div>" // .row
    sectionHtml += '<div style="margin-top: 8px;">'
    sectionHtml +=
      '<a href="/app/pathfinder" class="btn btn-xs btn-default" style="font-size: 11px;">'
    sectionHtml += '<i class="fa fa-cog" style="margin-right: 4px;"></i>Manage Virtual Fields'
    sectionHtml += "</a>"
    sectionHtml += "</div>"
    sectionHtml += "</div>" // .form-dashboard-section
    sectionHtml += "</div>"

    // Prepend to the dashboard (top of the form)
    frm.dashboard.$wrapper.prepend(sectionHtml)
  }

  /**
   * Add a "Virtual Fields" button to the form header.
   * Idempotent — only adds once per form lifecycle.
   */
  function addManageButton(frm) {
    if (!frm || !frm.page) return

    // Check if button group already has our button
    var btnGroup = frm.page.wrapper.find(".btn-group").filter(function () {
      return $(this).find('button:contains("Virtual Fields")').length > 0
    })
    if (btnGroup.length > 0) return

    frm.page.add_inner_button("Virtual Fields", function () {
      frappe.set_route("/app/pathfinder")
    })
  }

  // -------------------------------------------------------------------------
  // Fetch Jinja Tag — global form button (clipboard workflow)
  // -------------------------------------------------------------------------

  /** Map form DocType → doc field holding the Pathfinder root DocType. */
  var ROOT_DOCTYPE_FIELD = {
    "Print Format": "doc_type",
    "Notification": "document_type",
  }

  /** Forms with no reference field — prompt user to pick a DocType. */
  var ROOT_DOCTYPE_PICKER = { "Email Template": 1 }

  /** Forms that already have a dedicated Pathfinder toolbar button. */
  var SKIP_FETCH_JINJA_DOCTYPES = { "Customize Form": 1 }

  function getPathfinderRootDoctype(frm) {
    if (!frm || !frm.doctype) return null

    var fieldname = ROOT_DOCTYPE_FIELD[frm.doctype]
    if (fieldname && frm.doc && frm.doc[fieldname]) {
      return frm.doc[fieldname]
    }

    if (ROOT_DOCTYPE_PICKER[frm.doctype]) {
      return null
    }

    return frm.doctype
  }

  function promptForRootDoctype(callback) {
    var dialog = new frappe.ui.Dialog({
      title: __("Pathfinder — Select DocType"),
      fields: [
        {
          fieldtype: "Link",
          fieldname: "root_doctype",
          label: __("DocType"),
          options: "DocType",
          reqd: 1,
          get_query: function () {
            return { filters: { istable: 0 } }
          },
        },
      ],
      primary_action_label: __("Open Pathfinder"),
      primary_action: function (values) {
        dialog.hide()
        callback(values.root_doctype)
      },
    })
    dialog.show()
  }

  function launchPathfinderPopup(rootDoctype) {
    window.openPathfinderPopup(rootDoctype, {
      onJinjaTagSelected: function () {
        frappe.show_alert(
          { message: __("Jinja tag copied to clipboard"), indicator: "green" },
          3
        )
      },
    })
  }

  function openFetchJinjaTag(frm) {
    if (typeof window.openPathfinderPopup !== "function") {
      frappe.msgprint(__("Pathfinder is not available. Run `bench build --app pathfinder`."))
      return
    }

    if (ROOT_DOCTYPE_PICKER[frm.doctype]) {
      promptForRootDoctype(launchPathfinderPopup)
      return
    }

    var rootDoctype = getPathfinderRootDoctype(frm)
    if (!rootDoctype) {
      frappe.msgprint(__("Could not determine a DocType for Pathfinder."))
      return
    }

    var fieldname = ROOT_DOCTYPE_FIELD[frm.doctype]
    if (fieldname && frm.doc && !frm.doc[fieldname]) {
      frappe.msgprint(
        __("Set {0} on this form first, then open Pathfinder.", [
          frappe.meta.get_label(frm.doctype, fieldname) || fieldname,
        ])
      )
      return
    }

    launchPathfinderPopup(rootDoctype)
  }

  function addFetchJinjaTagButton(frm) {
    if (!frm || frm._pathfinder_fetch_jinja_added) return
    if (SKIP_FETCH_JINJA_DOCTYPES[frm.doctype]) return

    frm.add_custom_button(__("Fetch Jinja Tag"), function () {
      openFetchJinjaTag(frm)
    })
    frm._pathfinder_fetch_jinja_added = true
  }

  // Hook into form refresh — runs after the document is loaded
  // We use frappe.ui.form.on("*") to apply to all doctypes
  frappe.ui.form.on("*", {
    refresh: function (frm) {
      // Defer to ensure _virtual_fields is attached from the server response
      setTimeout(function () {
        renderVirtualFields(frm)
        addManageButton(frm)
        addFetchJinjaTagButton(frm)
      }, 100)
    },
  })
})()
