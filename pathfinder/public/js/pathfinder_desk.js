/**
 * pathfinder_desk.js
 * ===================
 * Exposes global API and injects Pathfinder into Desk UI:
 *
 * - window.openPathfinderPopup(rootDoctype, options?)  — pure JS (default)
 * - window.openPathfinderPopupVue(rootDoctype, options?) — Vue version (optional)
 * - Auto-inject Pathfinder button into Customize Form View toolbar
 *
 * The pure JS version is always available. The Vue version requires the
 * pathfinder.bundle.js (Vite build) to be loaded first.
 *
 * This file is loaded on every Desk page via app_include_js in hooks.py.
 */

// ---------------------------------------------------------------------------
//  Vue-based popup (optional — requires pathfinder.bundle.js)
// ---------------------------------------------------------------------------

var _pf_popup_vm = null

function _openPathfinderPopupVue(rootDoctype, options) {
  options = options || {}
  if (_pf_popup_vm) {
    _pf_popup_vm.close()
  }

  var container = document.createElement("div")
  container.id = "pathfinder-popup-container"
  document.body.appendChild(container)

  _pf_popup_vm = _pf_create_vue_popup(container, rootDoctype, options)
}

function _close_vue_popup() {
  if (!_pf_popup_vm) return
  var container = document.getElementById("pathfinder-popup-container")
  if (container) container.remove()
  _pf_popup_vm = null
}

function _pf_create_vue_popup(container, rootDoctype, options) {
  var Vue = window.vue || (window.Pathfinder && window.Pathfinder.__vue)
  var PathfinderPopup = (window.Pathfinder && window.Pathfinder.PathfinderPopup)

  if (!Vue || !PathfinderPopup) {
    console.warn("Pathfinder: Vue popup unavailable — falling back to JS version.")
    return null
  }

  var vm = Vue.createApp({
    template:
      '<PathfinderPopup ' +
      ':rootDoctype="doctype" ' +
      '@close="onClose" ' +
      '@path-selected="onPath" ' +
      '@jinja-tag-selected="onJinja" ' +
      '@virtual-field-created="onVfCreated" ' +
      '/>',
    components: { PathfinderPopup: PathfinderPopup },
    data: function () { return { doctype: rootDoctype } },
    methods: {
      onClose: function () { _close_vue_popup() },
      onPath: options.onPathSelected || function (p) {
        navigator.clipboard.writeText(p).catch(function () {})
        frappe.show_alert({ message: "Path copied: " + p, indicator: "green" }, 3)
      },
      onJinja: options.onJinjaTagSelected || function (t) {
        navigator.clipboard.writeText(t).catch(function () {})
        frappe.show_alert({ message: "Jinja tag copied: " + t, indicator: "green" }, 3)
      },
      onVfCreated: options.onVirtualFieldCreated || function () {},
    },
  }).mount(container)

  // Wrap to expose close()
  vm.close = _close_vue_popup
  return vm
}

// ---------------------------------------------------------------------------
//  Customize Form button injection
// ---------------------------------------------------------------------------

$(document).ready(function () {
  injectCustomizeFormButton()
  $(window).on("hashchange", function () {
    setTimeout(injectCustomizeFormButton, 200)
  })
})

function injectCustomizeFormButton() {
  var route = frappe.get_route()
  if (!route || route[0] !== "Form" || route[1] !== "Customize Form") return
  if (document.getElementById("pathfinder-customize-btn")) return

  var injectBtn = function () {
    var actionsArea = $(".custom-actions .standard-actions")
    if (actionsArea.length === 0) actionsArea = $(".page-actions")
    if (actionsArea.length === 0) return false

    var actionsDropdown = actionsArea.find(".dropdown-actions, .custom-btn-group").first()
    var btnHtml =
      '<button id="pathfinder-customize-btn" ' +
      'class="btn btn-sm btn-default btn-primary" ' +
      'title="Open Pathfinder" ' +
      'style="margin-right: 6px;">' +
      '<i class="fa fa-compass" style="margin-right: 4px;"></i>Pathfinder' +
      "</button>"

    if (actionsDropdown.length) actionsDropdown.before(btnHtml)
    else actionsArea.prepend(btnHtml)

    $("#pathfinder-customize-btn").on("click", function () {
      var docType = ""
      var customizeForm = frappe.get_form("Customize Form")
      if (customizeForm && customizeForm.doc) docType = customizeForm.doc.doc_type || ""
      if (!docType && cur_frm) docType = cur_frm.doc.doc_type || ""

      if (!docType) {
        frappe.msgprint("Please select a DocType first.")
        return
      }

      openPathfinderPopup(docType, {
        onPathSelected: function (p) {
          frappe.show_alert({ message: "Path copied: " + p, indicator: "green" }, 4)
        },
        onJinjaTagSelected: function (t) {
          frappe.show_alert({ message: "Jinja tag copied: " + t, indicator: "green" }, 4)
        },
        onVirtualFieldCreated: function (data) {
          frappe.show_alert({ message: 'Virtual field "' + data.field_label + '" created', indicator: "green" }, 4)
          if (cur_frm) cur_frm.reload_doc()
        },
      })
    })

    return true
  }

  var attempts = 0
  var interval = setInterval(function () {
    attempts++
    if (injectBtn() || attempts > 20) clearInterval(interval)
  }, 100)
}

// ---------------------------------------------------------------------------
//  Expose Vue version separately; JS popup (pathfinder_popup.js) sets
//  the default openPathfinderPopup when it loads after this file.
// ---------------------------------------------------------------------------

window.openPathfinderPopupVue = _openPathfinderPopupVue
window.closePathfinderPopupVue = _close_vue_popup
