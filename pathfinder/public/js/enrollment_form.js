/**
 * enrollment_form.js
 * ==================
 * Adds Pathfinder button left of the "Actions" dropdown in the Enrollments form.
 * Also populates the Instructions tab with content and a Reset Sample Data button.
 */

(function () {
  "use strict"

  frappe.ui.form.on("Enrollments", {
    refresh: function (frm) {
      injectPathfinderButton(frm)
      populateInstructionsTab(frm)
      addResetDataButton(frm)
    },
  })

  function injectPathfinderButton(frm) {
    if (document.getElementById("pathfinder-enrollment-btn")) return

    // Add standalone button to form header, left of Actions dropdown
    frm.page.add_button(__("Pathfinder"), function () {
      if (typeof window.openPathfinderPopup === "function") {
        window.openPathfinderPopup(frm.doctype, {
          onPathSelected: function (path) {
            frappe.show_alert({ message: "Path copied: " + path, indicator: "green" }, 4)
          },
          onJinjaTagSelected: function (tag) {
            // Insert Jinja at cursor in report field
            var $report = frm.fields_dict.report.$wrapper.find("textarea, .ql-editor")
            if ($report.length) {
              var textarea = $report[0]
              if (textarea.tagName === "TEXTAREA") {
                var start = textarea.selectionStart
                var end = textarea.selectionEnd
                var text = textarea.value
                textarea.value = text.substring(0, start) + tag + text.substring(end)
                frm.set_value("report", textarea.value)
              } else {
                // Quill editor
                document.execCommand("insertText", false, tag)
              }
            }
            frappe.show_alert({ message: "Jinja tag inserted", indicator: "green" }, 3)
          },
          onVirtualFieldCreated: function (data) {
            frappe.show_alert({ message: 'Virtual field "' + data.field_label + '" created', indicator: "green" }, 4)
          },
        })
      } else {
        frappe.msgprint("Pathfinder popup is not available. Run `bench build --app pathfinder`.")
      }
    }, "fa fa-compass")
  }

  function populateInstructionsTab(frm) {
    var $wrapper = frm.fields_dict.instructions_html.$wrapper
    if ($wrapper.find(".pathfinder-instructions").length) return

    var html =
      '<div class="pathfinder-instructions" style="padding: 12px 0;">' +

        '<h4>How to Use Pathfinder in a Jinja Template</h4>' +
        '<p>1. Place your cursor in the Report field below.</p>' +
        '<p>2. Click the <strong>Pathfinder</strong> button in the form header.</p>' +
        '<p>3. Navigate through linked fields using the multi-column navigator.</p>' +
        '<p>4. Select "Copy Jinja Tag" — the tag will be inserted into the Report field at your cursor position.</p>' +
        '<p>5. The template resolves at render time, e.g.:</p>' +
        '<pre style="background: var(--gray-100); padding: 8px; border-radius: 4px; font-size: 12px;">' +
        "{{ doc.person_id.first_name }} {{ doc.person_id.last_name }}\n" +
        "{{ doc.event_id.event_name }}\n" +
        "{{ doc.person_id.family_id.email }}" +
        '</pre>' +

        '<h4 style="margin-top: 20px;">How to Create a Virtual Field</h4>' +
        '<p>1. Open Pathfinder and navigate to a field path.</p>' +
        '<p>2. Select <strong>"Create Virtual Field"</strong> in the output dialog.</p>' +
        '<p>3. Give it a label and save — it will be automatically resolved on every document load.</p>' +
        '<p>4. Virtual fields appear in the dashboard section at the top of the form.</p>' +

        '<h4 style="margin-top: 20px;">How to Add a Pathfinder Button to Any DocType</h4>' +
        '<p>In your custom app\'s JS file, add:</p>' +
        '<pre style="background: var(--gray-100); padding: 8px; border-radius: 4px; font-size: 12px;">' +
        'frappe.ui.form.on("Your DocType", {\n' +
        '  refresh: function(frm) {\n' +
        '    frm.page.add_action_item("Pathfinder", function() {\n' +
        '      window.openPathfinderPopup(frm.doctype);\n' +
        '    });\n' +
        '  }\n' +
        '});' +
        '</pre>' +

      '</div>'

    $wrapper.html(html)
  }

  function addResetDataButton(frm) {
    if (frm.fields_dict.instructions_html.$wrapper.find("#reset-sample-data-btn").length) return

    var $btn = $(
      '<button id="reset-sample-data-btn" ' +
      'class="btn btn-sm btn-warning" ' +
      'style="margin-top: 16px;">' +
      '<i class="fa fa-refresh" style="margin-right: 4px;"></i>Reset Sample Data' +
      '</button>'
    )

    $btn.on("click", function () {
      frappe.confirm(
        "This will delete all existing Events, Families, People, and Enrollments and regenerate fresh sample data. Continue?",
        function () {
          frappe.call({
            method: "pathfinder.demo.api.reset_sample_data",
            freeze: true,
            freeze_message: "Resetting sample data...",
            callback: function (r) {
              if (r.message) {
                frappe.show_alert({ message: r.message.message, indicator: "green" }, 5)
                frm.reload_doc()
              }
            },
          })
        }
      )
    })

    frm.fields_dict.instructions_html.$wrapper.find(".pathfinder-instructions").after($btn)
  }
})()
