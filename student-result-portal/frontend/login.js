/**
 * Student Result Portal – login.js
 * Handles CAPTCHA generation and login form submission.
 * Communicates with Flask backend at /api/login.
 */

"use strict";

/* ──────────────────────────────────────────────────────────────
   Configuration
   ────────────────────────────────────────────────────────────── */
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5002"
  : "";

const API_LOGIN = `${API_BASE}/api/login`;

/* ──────────────────────────────────────────────────────────────
   DOM References
   ────────────────────────────────────────────────────────────── */
const loginForm    = document.getElementById("loginForm");
const loginAlert   = document.getElementById("loginAlert");
const loginBtn     = document.getElementById("loginBtn");
const loginBtnText = document.getElementById("loginBtnText");
const loginBtnLoader = document.getElementById("loginBtnLoader");
const captchaCodeEl  = document.getElementById("captchaCode");
const refreshBtn     = document.getElementById("refreshCaptcha");
const captchaInput   = document.getElementById("captchaInput");

/* ──────────────────────────────────────────────────────────────
   CAPTCHA
   ────────────────────────────────────────────────────────────── */
const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
let currentCaptcha = "";

function generateCaptcha() {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  }
  currentCaptcha = code;
  captchaCodeEl.textContent = code;
  captchaInput.value = "";
  captchaInput.focus();
}

generateCaptcha();
refreshBtn.addEventListener("click", generateCaptcha);

/* ──────────────────────────────────────────────────────────────
   Utility Helpers
   ────────────────────────────────────────────────────────────── */
function showAlert(message, type = "error") {
  loginAlert.textContent = message;
  loginAlert.className = `alert alert-${type}`;
}

function hideAlert() {
  loginAlert.className = "alert hidden";
  loginAlert.textContent = "";
}

function markInvalid(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const errEl = document.getElementById(errorId);
  if (input) input.classList.add("is-invalid");
  if (errEl) errEl.textContent = message;
}

function clearErrors() {
  ["regNumber", "dob", "captchaInput"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("is-invalid");
  });
  ["regError", "dobError", "captchaError"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

function setLoading(isLoading) {
  loginBtn.disabled = isLoading;
  loginBtnText.textContent = isLoading ? "Logging in…" : "LOG IN";
  loginBtnLoader.classList.toggle("hidden", !isLoading);
}

/* ──────────────────────────────────────────────────────────────
   Validation
   ────────────────────────────────────────────────────────────── */
function validateLoginForm(regNo, dob, captchaEntry) {
  let valid = true;

  if (!regNo) {
    markInvalid("regNumber", "regError", "Registration number is required.");
    valid = false;
  } else if (regNo.length < 3 || regNo.length > 20) {
    markInvalid("regNumber", "regError", "Enter a valid registration number.");
    valid = false;
  }

  if (!dob) {
    markInvalid("dob", "dobError", "Date of birth is required.");
    valid = false;
  }

  if (!captchaEntry) {
    markInvalid("captchaInput", "captchaError", "Please enter the CAPTCHA code.");
    valid = false;
  } else if (captchaEntry.toUpperCase() !== currentCaptcha) {
    markInvalid("captchaInput", "captchaError", "Incorrect CAPTCHA. Please try again.");
    generateCaptcha();
    valid = false;
  }

  return valid;
}

/* ──────────────────────────────────────────────────────────────
   Form Submit
   ────────────────────────────────────────────────────────────── */
loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  hideAlert();
  clearErrors();

  const regNo  = document.getElementById("regNumber").value.trim().toUpperCase();
  const dob    = document.getElementById("dob").value.trim();
  const captchaEntry = captchaInput.value.trim();

  if (!validateLoginForm(regNo, dob, captchaEntry)) return;

  setLoading(true);

  try {
    const response = await fetch(API_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registration_number: regNo, date_of_birth: dob }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Store auth info for results page (not a real JWT – demo only)
      sessionStorage.setItem("studentAuth", JSON.stringify({
        registration_number: result.student.registration_number,
        name:                result.student.name,
        branch:              result.student.branch,
        semester:            result.student.semester,
      }));
      window.location.href = "results.html";
    } else {
      showAlert(result.message || "Invalid credentials. Please try again.", "error");
      generateCaptcha();
      setLoading(false);
    }
  } catch (err) {
    console.error("Login error:", err);
    showAlert("Unable to connect to the server. Please try again later.", "error");
    generateCaptcha();
    setLoading(false);
  }
});
