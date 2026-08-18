/**
 * Event Portal – script.js
 * Handles frontend validation and form submission for the Event Registration Portal.
 * Communicates with the Flask backend at /api/register.
 */

"use strict";

/* ──────────────────────────────────────────────────────────────
   Configuration
   ────────────────────────────────────────────────────────────── */
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5001"
  : "";  // same origin when deployed behind nginx

const API_REGISTER = `${API_BASE}/api/register`;

/* ──────────────────────────────────────────────────────────────
   DOM References
   ────────────────────────────────────────────────────────────── */
const form       = document.getElementById("registrationForm");
const alertBox   = document.getElementById("formAlert");
const submitBtn  = document.getElementById("submitBtn");
const btnText    = document.getElementById("btnText");
const btnLoader  = document.getElementById("btnLoader");

/* ──────────────────────────────────────────────────────────────
   Utility Helpers
   ────────────────────────────────────────────────────────────── */
function showAlert(message, type = "error") {
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type}`;
  alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideAlert() {
  alertBox.className = "alert hidden";
  alertBox.textContent = "";
}

function setFieldError(errorId, message) {
  const el = document.getElementById(errorId);
  if (el) el.textContent = message;
}

function clearAllErrors() {
  ["nameError", "emailError", "phoneError", "deptError", "collegeError", "eventError", "yearError"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });

  form.querySelectorAll(".form-control").forEach(el => {
    el.classList.remove("is-invalid", "is-valid");
  });
}

function markInvalid(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  if (input) input.classList.add("is-invalid");
  setFieldError(errorId, message);
}

function markValid(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
  }
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  btnText.textContent = isLoading ? "Registering…" : "REGISTER";
  btnLoader.classList.toggle("hidden", !isLoading);
}

/* ──────────────────────────────────────────────────────────────
   Phone – allow only digits
   ────────────────────────────────────────────────────────────── */
document.getElementById("phone").addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "").slice(0, 10);
});

/* ──────────────────────────────────────────────────────────────
   Validation
   ────────────────────────────────────────────────────────────── */
function validateForm(data) {
  let valid = true;

  // Student Name
  const name = data.student_name;
  if (!name) {
    markInvalid("studentName", "nameError", "Student name is required.");
    valid = false;
  } else if (name.length < 3) {
    markInvalid("studentName", "nameError", "Name must be at least 3 characters.");
    valid = false;
  } else if (name.length > 100) {
    markInvalid("studentName", "nameError", "Name must not exceed 100 characters.");
    valid = false;
  } else {
    markValid("studentName");
  }

  // Email
  const email = data.email;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    markInvalid("email", "emailError", "Email is required.");
    valid = false;
  } else if (!emailRegex.test(email)) {
    markInvalid("email", "emailError", "Enter a valid email address.");
    valid = false;
  } else if (email.length > 150) {
    markInvalid("email", "emailError", "Email must not exceed 150 characters.");
    valid = false;
  } else {
    markValid("email");
  }

  // Phone
  const phone = data.phone;
  const phoneRegex = /^[6-9][0-9]{9}$/;
  if (!phone) {
    markInvalid("phone", "phoneError", "Phone number is required.");
    valid = false;
  } else if (!phoneRegex.test(phone)) {
    markInvalid("phone", "phoneError", "Enter a valid 10-digit Indian mobile number.");
    valid = false;
  } else {
    markValid("phone");
  }

  // Department
  if (!data.department) {
    markInvalid("department", "deptError", "Please select a department.");
    valid = false;
  } else {
    markValid("department");
  }

  // College
  if (!data.college) {
    markInvalid("college", "collegeError", "College name is required.");
    valid = false;
  } else if (data.college.length > 200) {
    markInvalid("college", "collegeError", "College name must not exceed 200 characters.");
    valid = false;
  } else {
    markValid("college");
  }

  // Event
  if (!data.event) {
    markInvalid("event", "eventError", "Please select an event.");
    valid = false;
  } else {
    markValid("event");
  }

  // Year
  if (!data.year) {
    markInvalid("year", "yearError", "Please select your year.");
    valid = false;
  } else {
    markValid("year");
  }

  return valid;
}

/* ──────────────────────────────────────────────────────────────
   Collect Form Data
   ────────────────────────────────────────────────────────────── */
function collectFormData() {
  return {
    student_name: document.getElementById("studentName").value.trim().replace(/\s+/g, " "),
    email:        document.getElementById("email").value.trim().toLowerCase(),
    phone:        document.getElementById("phone").value.trim(),
    department:   document.getElementById("department").value,
    college:      document.getElementById("college").value.trim(),
    event:        document.getElementById("event").value,
    year:         document.getElementById("year").value,
  };
}

/* ──────────────────────────────────────────────────────────────
   Form Submit Handler
   ────────────────────────────────────────────────────────────── */
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  hideAlert();
  clearAllErrors();

  const data = collectFormData();

  if (!validateForm(data)) {
    showAlert("Please fix the errors below before submitting.", "error");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(API_REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Save success data for the success page
      sessionStorage.setItem("registrationSuccess", JSON.stringify({
        registration_id: result.registration_id,
        student_name:    data.student_name,
        email:           data.email,
        department:      data.department,
        college:         data.college,
        event:           data.event,
        year:            data.year,
      }));
      window.location.href = "success.html";
    } else {
      showAlert(result.message || "Registration failed. Please try again.", "error");
      setLoading(false);
    }
  } catch (err) {
    console.error("Registration error:", err);
    showAlert("Unable to connect to the server. Please try again later.", "error");
    setLoading(false);
  }
});

/* ──────────────────────────────────────────────────────────────
   Inline validation on blur
   ────────────────────────────────────────────────────────────── */
document.getElementById("studentName").addEventListener("blur", function () {
  const v = this.value.trim();
  if (v.length > 0 && v.length < 3) markInvalid("studentName", "nameError", "Name must be at least 3 characters.");
  else if (v.length >= 3) markValid("studentName");
});

document.getElementById("email").addEventListener("blur", function () {
  const v = this.value.trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (v.length > 0 && !regex.test(v)) markInvalid("email", "emailError", "Enter a valid email address.");
  else if (regex.test(v)) markValid("email");
});

document.getElementById("phone").addEventListener("blur", function () {
  const v = this.value.trim();
  const regex = /^[6-9][0-9]{9}$/;
  if (v.length > 0 && !regex.test(v)) markInvalid("phone", "phoneError", "Enter a valid 10-digit Indian mobile number.");
  else if (regex.test(v)) markValid("phone");
});
