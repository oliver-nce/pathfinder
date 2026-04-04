import frappe
from frappe.model.document import Document


class PF_Enrollments(Document):
    def on_create(self):
        """Pre-fill the report field with a Jinja template about the person's event experience."""
        self._populate_sample_report()

    def _populate_sample_report(self):
        """Populate the RTF field with a personalized Jinja template."""
        if not self.report:
            self.report = (
                "<h2>Enrollment Report</h2>"
                "<p><strong>Person:</strong> {{ doc.person_id.first_name }} {{ doc.person_id.last_name }}</p>"
                "<p><strong>Event:</strong> {{ doc.event_id.event_name }}</p>"
                "<p><strong>Enrollment Date:</strong> {{ doc.enrollment_date }}</p>"
                "<p><strong>Family:</strong> {{ doc.person_id.family_id.first_name }} "
                "{{ doc.person_id.family_id.last_name }}</p>"
                "<p><strong>Email:</strong> {{ doc.person_id.family_id.email }}</p>"
                "<p><strong>Location:</strong> {{ doc.event_id.location }}</p>"
                "<p><strong>Gender:</strong> {{ doc.person_id.gender }}</p>"
                "<p><strong>Date of Birth:</strong> {{ doc.person_id.date_of_birth }}</p>"
            )
            self.db_set("report", self.report, update_modified=False)
