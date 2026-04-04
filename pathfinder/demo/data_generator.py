"""Sample data generator for the Pathfinder demo app.

Generates realistic US-based sample data:
  - 20 Events
  - 50 Families
  - 150 People distributed across the 50 families
  - 30-50 enrollments per event (600-1000 total)
"""

import random
import frappe
from datetime import date, timedelta


# --- US Realistic Data ---

FIRST_NAMES_MALE = [
    "James", "John", "Robert", "Michael", "William", "David", "Joseph",
    "Thomas", "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Donald",
    "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian",
    "George", "Edward", "Ronald", "Timothy", "Jason", "Jeffrey", "Ryan",
    "Jacob", "Gary", "Nicholas", "Eric", "Stephen", "Jonathan", "Larry",
    "Justin", "Scott", "Brandon", "Benjamin", "Samuel", "Raymond",
    "Gregory", "Patrick", "Alexander", "Frank", "Dennis", "Jerry", "Tyler",
    "Aaron", "Jose", "Adam", "Nathan", "Henry", "Zachary", "Douglas",
    "Peter", "Kyle", "Noah", "Ethan", "Jeremy", "Walter", "Christian",
    "Keith", "Roger", "Terry", "Austin", "Sean", "Gerald", "Carl",
    "Dylan", "Harold", "Jordan", "Jesse", "Bryan", "Billy", "Bruce",
    "Gabriel", "Logan", "Alan", "Juan", "Albert", "Willie", "Elijah",
    "Wayne", "Randy", "Mason", "Vincent", "Liam", "Evan", "Roy",
    "Dominic", "Travis", "Todd", "Caleb", "Marcus", "Curtis"
]

FIRST_NAMES_FEMALE = [
    "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara",
    "Susan", "Jessica", "Sarah", "Karen", "Lisa", "Nancy", "Betty",
    "Margaret", "Sandra", "Ashley", "Dorothy", "Kimberly", "Emily",
    "Donna", "Michelle", "Carol", "Amanda", "Melissa", "Deborah",
    "Stephanie", "Rebecca", "Sharon", "Laura", "Cynthia", "Kathleen",
    "Amy", "Angela", "Shirley", "Anna", "Brenda", "Pamela", "Emma",
    "Nicole", "Helen", "Samantha", "Katherine", "Christine", "Debra",
    "Rachel", "Carolyn", "Janet", "Catherine", "Maria", "Heather",
    "Diane", "Ruth", "Julie", "Olivia", "Joyce", "Virginia", "Victoria",
    "Kelly", "Lauren", "Christina", "Joan", "Evelyn", "Judith", "Megan",
    "Cheryl", "Andrea", "Hannah", "Martha", "Jacqueline", "Frances",
    "Gloria", "Ann", "Teresa", "Kathryn", "Sara", "Janice", "Jean",
    "Alice", "Madison", "Grace", "Judy", "Theresa", "Abigail", "Sophia",
    "Beverly", "Denise", "Marilyn", "Amber", "Danielle", "Brittany",
    "Diana", "Jane", "Natalie", "Isabella", "Rose", "Charlotte"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
    "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
    "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
    "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
    "Carter", "Roberts", "Phillips", "Evans", "Turner", "Parker", "Collins",
    "Edwards", "Stewart", "Morris", "Murphy", "Cook", "Rogers", "Morgan",
    "Peterson", "Cooper", "Reed", "Bailey", "Bell", "Howard", "Ward",
    "Brooks", "Bennett", "Wood", "James", "Ross", "Henderson", "Coleman",
    "Jenkins", "Perry", "Powell", "Long", "Patterson", "Hughes", "Butler",
    "Simmons", "Foster", "Bryant", "Alexander", "Russell", "Griffin",
    "Diaz", "Hayes", "Myers", "Ford", "Hamilton"
]

EVENT_NAMES = [
    "Annual Tech Summit", "Spring Leadership Conference", "Digital Marketing Workshop",
    "Product Innovation Day", "Community Outreach Program", "Data Science Bootcamp",
    "Customer Success Forum", "Agile Transformation Workshop", "Sales Kickoff Meeting",
    "Health & Wellness Fair", "Engineering Deep Dive", "New Hire Orientation",
    "Strategic Planning Retreat", "Vendor Showcase", "Quarterly Review Meeting",
    "Team Building Retreat", "Cybersecurity Awareness Day", "UX Design Sprint",
    "Finance & Budget Workshop", "Holiday Celebration"
]

EVENT_LOCATIONS = [
    "San Francisco, CA", "New York, NY", "Chicago, IL", "Austin, TX", "Seattle, WA",
    "Denver, CO", "Boston, MA", "Atlanta, GA", "Portland, OR", "Miami, FL",
    "Nashville, TN", "Phoenix, AZ", "Minneapolis, MN", "Salt Lake City, UT", "Raleigh, NC"
]

US_ZIP_CODES = [
    "10001", "90210", "60601", "73301", "98101", "80201", "02101",
    "30301", "97201", "33101", "37201", "85001", "55401", "84101",
    "27601", "10011", "90001", "60614", "78701", "98104", "80202",
    "02108", "30303", "97209", "33139", "37203", "85004", "55402",
    "84111", "27603", "10025", "90212", "60611", "78702", "98109",
    "80203", "02109", "30308", "97205", "33141"
]


def _generate_events(count=20):
    """Create sample Events."""
    events = []
    for i in range(count):
        start = date(2026, 1, 1) + timedelta(days=random.randint(0, 300))
        end = start + timedelta(days=random.randint(1, 5))
        evt = frappe.get_doc({
            "doctype": "Events",
            "event_name": EVENT_NAMES[i % len(EVENT_NAMES)] + (f" #{i+1}" if i >= len(EVENT_NAMES) else ""),
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "location": EVENT_LOCATIONS[i % len(EVENT_LOCATIONS)],
        })
        evt.insert()
        events.append(evt.name)
        if (i + 1) % 5 == 0:
            frappe.db.commit()
    frappe.db.commit()
    return events


def _generate_families(count=50):
    """Create sample Families."""
    families = []
    used_names = set()
    for _ in range(count):
        while True:
            fn = random.choice(FIRST_NAMES_MALE + FIRST_NAMES_FEMALE)
            ln = random.choice(LAST_NAMES)
            key = (fn, ln)
            if key not in used_names:
                used_names.add(key)
                break

        family = frappe.get_doc({
            "doctype": "Families",
            "first_name": fn,
            "last_name": ln,
            "email": f"{fn.lower()}.{ln.lower().replace(' ', '')}@example.com",
            "phone": f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}",
            "zip_code": random.choice(US_ZIP_CODES),
        })
        family.insert()
        families.append(family.name)
        if len(families) % 10 == 0:
            frappe.db.commit()
    frappe.db.commit()
    return families


def _generate_people(families, count=150):
    """Create sample People distributed across families."""
    people = []
    used_names = set()
    for _ in range(count):
        while True:
            fn = random.choice(FIRST_NAMES_MALE + FIRST_NAMES_FEMALE)
            ln = random.choice(LAST_NAMES)
            key = (fn, ln)
            if key not in used_names:
                used_names.add(key)
                break

        dob = date(random.randint(1960, 2010), random.randint(1, 12), random.randint(1, 28))
        person = frappe.get_doc({
            "doctype": "People",
            "first_name": fn,
            "last_name": ln,
            "family_id": random.choice(families),
            "gender": random.choice(["Male", "Female", "Non-binary"]),
            "date_of_birth": dob.isoformat(),
        })
        person.insert()
        people.append(person.name)
        if len(people) % 30 == 0:
            frappe.db.commit()
    frappe.db.commit()
    return people


def _generate_enrollments(events, people, min_per_event=30, max_per_event=50):
    """Create Enrollments: each event gets 30-50 enrollments."""
    used_pairs = set()
    count = 0
    for event in events:
        num_enrollments = random.randint(min_per_event, max_per_event)
        for _ in range(num_enrollments):
            person = random.choice(people)
            pair = (event, person)
            if pair in used_pairs:
                continue
            used_pairs.add(pair)

            enroll_date = date(2026, 1, 1) + timedelta(days=random.randint(0, 180))
            enrollment = frappe.get_doc({
                "doctype": "Enrollments",
                "event_id": event,
                "person_id": person,
                "enrollment_date": enroll_date.isoformat(),
            })
            enrollment.insert()
            count += 1
            if count % 50 == 0:
                frappe.db.commit()
    frappe.db.commit()
    return count


def generate_sample_data():
    """Generate all sample data for the Pathfinder demo."""
    print("Generating Events...")
    events = _generate_events(20)
    print(f"  Created {len(events)} events")

    print("Generating Families...")
    families = _generate_families(50)
    print(f"  Created {len(families)} families")

    print("Generating People...")
    people = _generate_people(families, 150)
    print(f"  Created {len(people)} people")

    print("Generating Enrollments...")
    count = _generate_enrollments(events, people)
    print(f"  Created {count} enrollments")

    print(f"Sample data generation complete: {len(events)} events, {len(families)} families, "
          f"{len(people)} people, {count} enrollments")


def delete_sample_data():
    """Delete all demo app sample data."""
    for doctype in ["Enrollments", "People", "Families", "Events"]:
        existing = frappe.get_all(doctype, pluck="name")
        for name in existing:
            frappe.delete_doc(doctype, name, force=True)
        frappe.db.commit()
    print(f"Deleted all sample data")
