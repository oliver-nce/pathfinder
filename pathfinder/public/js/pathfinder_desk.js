/**
 * pathfinder_desk.js
 * ===================
 * Exposes global API and injects Pathfinder into Desk UI:
 *
 * - window.openPathfinderPopup(rootDoctype, options?)
 * - Auto-inject Pathfinder button into Customize Form View toolbar
 *
 * This file is loaded on every Desk page via app_include_js in hooks.py.
 */

/**
 * Global API — open the Pathfinder popup modal.
 *
 * @param {string} rootDoctype
 * @param {object} [options]
 * @param {(path: string) => void} [options.onPathSelected]
 * @param {(tag: string) => void} [options.onJinjaTagSelected]
 * @param {(data: object) => void} [options.onVirtualFieldCreated]
 *
 * Usage:
 *   window.openPathfinderPopup("Sales Order")
 *
 *   window.openPathfinderPopup("Sales Order", {
 *     onPathSelected: (path) => { console.log(path); }
 *   });
 */

let popupVm = null

function openPathfinderPopup(rootDoctype, options) {
  options = options || {}

  // If popup is already open, close it first
  if (popupVm) {
    closePopup()
  }

  // Create a temporary Vue app to mount the popup
  const container = document.createElement("div")
  container.id = "pathfinder-popup-container"
  document.body.appendChild(container)

  popupVm = createPopupApp(container, rootDoctype, {
    onPathSelected: options.onPathSelected || defaultCopyPath,
    onJinjaTagSelected: options.onJinjaTagSelected || defaultCopyJinja,
    onVirtualFieldCreated: options.onVirtualFieldCreated || noop,
    onClose: function () {
      closePopup()
    },
  })
}

function closePopup() {
  if (!popupVm) return

  const container = document.getElementById("pathfinder-popup-container")
  if (container) {
    container.remove()
  }
  popupVm = null
}

function defaultCopyPath(path) {
  if (!path) return
  navigator.clipboard.writeText(path).catch(function () {
    fallbackCopy(path)
  })
  if (window.frappe?.show_alert) {
    frappe.show_alert({ message: "Frappe path copied: " + path, indicator: "green" }, 3)
  }
}

function defaultCopyJinja(tag) {
  if (!tag) return
  navigator.clipboard.writeText(tag).catch(function () {
    fallbackCopy(tag)
  })
  if (window.frappe?.show_alert) {
    frappe.show_alert({ message: "Jinja tag copied: " + tag, indicator: "green" }, 3)
  }
}

function noop() {}

function fallbackCopy(text) {
  var ta = document.createElement("textarea")
  ta.value = text
  document.body.appendChild(ta)
  ta.select()
  document.execCommand("copy")
  document.body.removeChild(ta)
}

function createPopupApp(container, rootDoctype, handlers) {
  var Vue, PathfinderPopup
  // Try to get Vue from frappe's window (frappe includes vue)
  if (window.vue) {
    Vue = window.vue
  } else {
    // Vue might be available via frappe's bundle
    console.error("Pathfinder: Vue not found on window. Ensure pathfinder.bundle.js loads after frappe-web.bundle.js.")
    return null
  }

  // PathfinderPopup should be exported on window.Pathfinder
  // from the main.js re-export. We look for it there.
  if (window.Pathfinder && window.Pathfinder.PathfinderPopup) {
    PathfinderPopup = window.Pathfinder.PathfinderPopup
  } else {
    console.error("Pathfinder: PathfinderPopup component not found. Run `bench build --app pathfinder`.")
    return null
  }

  var app = Vue.createApp({
    template:
      '<PathfinderPopup ' +
      ':rootDoctype="doctype" ' +
      '@close="onClose" ' +
      '@path-selected="onPath" ' +
      '@jinja-tag-selected="onJinja" ' +
      '@virtual-field-created="onVfCreated" ' +
      '/>',
    components: { PathfinderPopup: PathfinderPopup },
    data: function () {
      return { doctype: rootDoctype }
    },
    methods: {
      onClose: handlers.onClose,
      onPath: handlers.onPathSelected,
      onJinja: handlers.onJinjaTagSelected,
      onVfCreated: handlers.onVirtualFieldCreated,
    },
  })

  // Provide frappe's call function via vue injection if needed
  // (PathfinderPopup uses frappe-ui's `call` which is globally available)

  var vm = app.mount(container)
  return vm
}

/**
 * Inject Pathfinder button into Customize Form View toolbar.
 *
 * The Customize Form page has the route ["Form", "Customize Form"].
 * We watch for route changes and inject the button when on that page.
 */
$(document).ready(function () {
  injectCustomizeFormButton()
  // Watch for route changes (Frappe uses hash-based routing)
  $(window).on("hashchange", function () {
    setTimeout(injectCustomizeFormButton, 200)
  })
})

function injectCustomizeFormButton() {
  // Check if we're on the Customize Form page
  var route = frappe.get_route()
  if (!route || route[0] !== "Form" || route[1] !== "Customize Form") {
    return
  }

  // Don't inject twice
  if (document.getElementById("pathfinder-customize-btn")) return

  // Wait for the page actions area to be rendered
  var injectBtn = function () {
    var actionsArea = $(".custom-actions .standard-actions")
    if (actionsArea.length === 0) {
      actionsArea = $(".page-actions")
    }
    if (actionsArea.length === 0) return false

    // Find the Actions dropdown and insert before it
    var actionsDropdown = actionsArea.find(".dropdown-actions, .custom-btn-group").first()

    var btnHtml =
      '<button id="pathfinder-customize-btn" ' +
      'class="btn btn-sm btn-default btn-primary" ' +
      'title="Open Pathfinder to select a field path" ' +
      'style="margin-right: 6px;">' +
      '<i class="fa fa-compass" style="margin-right: 4px;"></i>Pathfinder' +
      "</button>"

    if (actionsDropdown.length) {
      actionsDropdown.before(btnHtml)
    } else {
      actionsArea.prepend(btnHtml)
    }

    $("#pathfinder-customize-btn").on("click", function () {
      var customizeForm = frappe.get_form("Customize Form")
      var docType = ""
      if (customizeForm && customizeForm.doc) {
        docType = customizeForm.doc.doc_type || ""
      }
      // Also check the form wrapper
      if (!docType && cur_frm) {
        docType = cur_frm.doc.doc_type || ""
      }

      if (!docType) {
        frappe.msgprint("Please select a DocType first in the Customize Form.")
        return
      }

      openPathfinderPopup(docType, {
        onPathSelected: function (path) {
          frappe.show_alert({
            message: "Path copied: " + path,
            indicator: "green",
          }, 4)
        },
        onJinjaTagSelected: function (tag) {
          frappe.show_alert({
            message: "Jinja tag copied: " + tag,
            indicator: "green",
          }, 4)
        },
        onVirtualFieldCreated: function (data) {
          frappe.show_alert({
            message: 'Virtual field "' + data.field_label + '" created',
            indicator: "green",
          }, 4)
          // Refresh the form to show the new virtual field
          if (cur_frm) {
            cur_frm.reload_doc()
          }
        },
      })
    })

    return true
  }

  // Retry a few times as the page might still be rendering
  var attempts = 0
  var interval = setInterval(function () {
    attempts++
    if (injectBtn() || attempts > 20) {
      clearInterval(interval)
    }
  }, 100)
}

// Expose on window
window.openPathfinderPopup = openPathfinderPopup
window.closePathfinderPopup = closePopup
