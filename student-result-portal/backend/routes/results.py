"""
Student Result Portal – routes/results.py
Handles fetching student examination results.
"""

import re
from flask import Blueprint, jsonify
from db import execute_query

results_bp = Blueprint("results", __name__)

REG_NO_REGEX = re.compile(r"^[A-Za-z0-9]{3,20}$")


@results_bp.route("/api/results/<string:registration_number>", methods=["GET"])
def get_results(registration_number: str):
    """Return all examination results for a given registration number."""

    reg_no = registration_number.strip().upper()

    # Validate path parameter
    if not REG_NO_REGEX.match(reg_no):
        return jsonify({"success": False, "message": "Invalid registration number."}), 400

    try:
        # Fetch student info
        student_rows = execute_query(
            "SELECT registration_number, name, branch, semester "
            "FROM students WHERE registration_number = %s LIMIT 1",
            (reg_no,),
            fetch=True,
        )

        if not student_rows:
            return jsonify({"success": False, "message": "Student not found."}), 404

        student = student_rows[0]

        # Fetch results
        result_rows = execute_query(
            "SELECT semester, subject_code, grade, result "
            "FROM student_results "
            "WHERE registration_number = %s "
            "ORDER BY semester ASC, subject_code ASC",
            (reg_no,),
            fetch=True,
        )

        return jsonify({
            "success": True,
            "student": {
                "registration_number": student["registration_number"],
                "name":                student["name"],
                "branch":              student["branch"],
                "semester":            student["semester"],
            },
            "exam": {
                "title":   "Autonomous End Semester Examination Results",
                "session": "April / May 2026",
            },
            "results": [
                {
                    "semester":     row["semester"],
                    "subject_code": row["subject_code"],
                    "grade":        row["grade"],
                    "result":       row["result"],
                }
                for row in result_rows
            ],
        }), 200

    except RuntimeError as e:
        print(f"[ERROR] /api/results/{reg_no}: {e}")
        return jsonify({
            "success": False,
            "message": "An internal server error occurred. Please try again later.",
        }), 500
