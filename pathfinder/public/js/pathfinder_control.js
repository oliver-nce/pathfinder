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

    var btnGroup = frm.page.wrapper.find(".btn-group").filter(function () {
      return $(this).find('button:contains("Virtual Fields")').length > 0
    })
    if (btnGroup.length > 0) return

    frm.page.add_inner_button("Virtual Fields", function () {
      frappe.set_route("/app/pathfinder")
    })
  }

  frappe.ui.form.on("*", {
    refresh: function (frm) {
      setTimeout(function () {
        renderVirtualFields(frm)
        addManageButton(frm)
      }, 100)
    },
  })
})()
