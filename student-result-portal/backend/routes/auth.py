"""
Student Result Portal – routes/auth.py
Handles student login authentication.
"""

import re
from flask import Blueprint, request, jsonify
from db import execute_query

auth_bp = Blueprint("auth", __name__)

# Basic sanity patterns
REG_NO_REGEX  = re.compile(r"^[A-Za-z0-9]{3,20}$")
DATE_REGEX     = re.compile(r"^\d{4}-\d{2}-\d{2}$")


@auth_bp.route("/api/health", methods=["GET"])
def health_check():
    """ALB / load-balancer health-check endpoint."""
    return jsonify({"status": "healthy", "service": "student-result-api"}), 200


@auth_bp.route("/api/login", methods=["POST"])
def login():
    """Authenticate a student using registration number and date of birth."""
    if not request.is_json:
        return jsonify({"success": False, "message": "Request must be JSON."}), 400

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"success": False, "message": "Invalid JSON payload."}), 400

    reg_no = (data.get("registration_number") or "").strip().upper()
    dob    = (data.get("date_of_birth") or "").strip()

    # Input validation
    if not reg_no:
        return jsonify({"success": False, "message": "Registration number is required."}), 422

    if not REG_NO_REGEX.match(reg_no):
        return jsonify({"success": False, "message": "Invalid registration number format."}), 422

    if not dob:
        return jsonify({"success": False, "message": "Date of birth is required."}), 422

    if not DATE_REGEX.match(dob):
        return jsonify({"success": False, "message": "Date of birth must be in YYYY-MM-DD format."}), 422

    try:
        rows = execute_query(
            "SELECT registration_number, name, date_of_birth, branch, semester "
            "FROM students "
            "WHERE registration_number = %s AND date_of_birth = %s "
            "LIMIT 1",
            (reg_no, dob),
            fetch=True,
        )

        if not rows:
            return jsonify({
                "success": False,
                "message": "Invalid registration number or date of birth.",
            }), 401

        student = rows[0]

        return jsonify({
            "success": True,
            "student": {
                "registration_number": student["registration_number"],
                "name":                student["name"],
                "branch":              student["branch"],
                "semester":            student["semester"],
            },
        }), 200

    except RuntimeError as e:
        print(f"[ERROR] /api/login: {e}")
        return jsonify({
            "success": False,
            "message": "An internal server error occurred. Please try again later.",
        }), 500
