"""
Event Portal – routes/registration.py
Handles event registration API endpoints.
"""

import re
import datetime
from flask import Blueprint, request, jsonify
from db import execute_query

registration_bp = Blueprint("registration", __name__)

# ──────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────

VALID_DEPARTMENTS = {
    "B.E. Computer Science and Engineering",
    "B.E. Electronics and Communication Engineering",
    "B.E. Electrical and Electronics Engineering",
    "B.E. Mechanical Engineering",
    "B.Tech Information Technology",
    "B.Tech Artificial Intelligence and Data Science",
    "B.Tech Artificial Intelligence and Machine Learning",
    "Other",
}

VALID_EVENTS = {
    "Hackathon",
    "Workshop",
    "Paper Presentation",
    "Project Presentation",
}

VALID_YEARS = {"1st Year", "2nd Year", "3rd Year", "4th Year"}

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_REGEX = re.compile(r"^[6-9][0-9]{9}$")

# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────

def _generate_registration_id() -> str:
    """Generate a sequential registration ID like EVT20260001."""
    year = datetime.datetime.utcnow().year
    prefix = f"EVT{year}"

    rows = execute_query(
        "SELECT registration_id FROM event_registrations "
        "WHERE registration_id LIKE %s ORDER BY id DESC LIMIT 1",
        (f"{prefix}%",),
        fetch=True,
    )

    if rows:
        last_id = rows[0]["registration_id"]  # e.g. EVT20260005
        seq = int(last_id[len(prefix):]) + 1
    else:
        seq = 1

    return f"{prefix}{seq:04d}"


def _validate_payload(data: dict) -> list[str]:
    """Return a list of validation error strings, or empty list if valid."""
    errors = []

    # Student Name
    name = (data.get("student_name") or "").strip()
    name = re.sub(r"\s+", " ", name)
    if not name:
        errors.append("Student name is required.")
    elif len(name) < 3:
        errors.append("Student name must be at least 3 characters.")
    elif len(name) > 100:
        errors.append("Student name must not exceed 100 characters.")

    # Email
    email = (data.get("email") or "").strip().lower()
    if not email:
        errors.append("Email is required.")
    elif not EMAIL_REGEX.match(email):
        errors.append("Invalid email format.")
    elif len(email) > 150:
        errors.append("Email must not exceed 150 characters.")

    # Phone
    phone = (data.get("phone") or "").strip()
    if not phone:
        errors.append("Phone number is required.")
    elif not PHONE_REGEX.match(phone):
        errors.append("Phone must be a valid 10-digit Indian mobile number.")

    # Department
    dept = data.get("department") or ""
    if not dept:
        errors.append("Department is required.")
    elif dept not in VALID_DEPARTMENTS:
        errors.append("Invalid department selected.")

    # College
    college = (data.get("college") or "").strip()
    if not college:
        errors.append("College name is required.")
    elif len(college) > 200:
        errors.append("College name must not exceed 200 characters.")

    # Event
    event = data.get("event") or ""
    if not event:
        errors.append("Event selection is required.")
    elif event not in VALID_EVENTS:
        errors.append("Invalid event selected.")

    # Year
    year = data.get("year") or ""
    if not year:
        errors.append("Year is required.")
    elif year not in VALID_YEARS:
        errors.append("Invalid year selected.")

    return errors


# ──────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────

@registration_bp.route("/api/health", methods=["GET"])
def health_check():
    """ALB / load-balancer health-check endpoint."""
    return jsonify({"status": "healthy", "service": "event-registration-api"}), 200


@registration_bp.route("/api/register", methods=["POST"])
def register():
    """Register a student for an event."""
    if not request.is_json:
        return jsonify({"success": False, "message": "Request must be JSON."}), 400

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"success": False, "message": "Invalid JSON payload."}), 400

    # Sanitise inputs
    student_name = re.sub(r"\s+", " ", (data.get("student_name") or "").strip())
    email        = (data.get("email") or "").strip().lower()
    phone        = (data.get("phone") or "").strip()
    department   = (data.get("department") or "").strip()
    college      = (data.get("college") or "").strip()
    event        = (data.get("event") or "").strip()
    year         = (data.get("year") or "").strip()

    sanitised = {
        "student_name": student_name,
        "email": email,
        "phone": phone,
        "department": department,
        "college": college,
        "event": event,
        "year": year,
    }

    # Validate
    errors = _validate_payload(sanitised)
    if errors:
        return jsonify({"success": False, "message": errors[0], "errors": errors}), 422

    try:
        # Check for duplicate (email + event)
        existing = execute_query(
            "SELECT id FROM event_registrations WHERE email = %s AND event = %s LIMIT 1",
            (email, event),
            fetch=True,
        )
        if existing:
            return jsonify({
                "success": False,
                "message": "You have already registered for this event.",
            }), 409

        # Generate unique registration ID
        registration_id = _generate_registration_id()

        # Insert record
        execute_query(
            """
            INSERT INTO event_registrations
                (registration_id, student_name, email, phone, department, college, event, year)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (registration_id, student_name, email, phone, department, college, event, year),
        )

        return jsonify({
            "success": True,
            "message": "Registration successful",
            "registration_id": registration_id,
        }), 201

    except RuntimeError as e:
        # Log the real error server-side but never expose DB details to the client
        print(f"[ERROR] /api/register: {e}")
        return jsonify({
            "success": False,
            "message": "An internal server error occurred. Please try again later.",
        }), 500
