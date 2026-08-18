/**
 * Student Result Portal – results.js
 * Fetches and renders examination results.
 * Requires student to be logged in (sessionStorage auth).
 */

"use strict";

/* ──────────────────────────────────────────────────────────────
   Configuration
   ────────────────────────────────────────────────────────────── */
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5002"
  : "";

/* ──────────────────────────────────────────────────────────────
   Auth Guard – redirect to login if no session
   ────────────────────────────────────────────────────────────── */
const authRaw = sessionStorage.getItem("studentAuth");
if (!authRaw) {
  window.location.replace("index.html");
}
const auth = JSON.parse(authRaw || "{}");

/* ──────────────────────────────────────────────────────────────
   DOM References
   ────────────────────────────────────────────────────────────── */
const loadingSection  = document.getElementById("loadingSection");
const errorSection    = document.getElementById("errorSection");
const resultsSection  = document.getElementById("resultsSection");
const errorMessage    = document.getElementById("errorMessage");
const retryBtn        = document.getElementById("retryBtn");

/* ──────────────────────────────────────────────────────────────
   Logout
   ────────────────────────────────────────────────────────────── */
function logout() {
  sessionStorage.removeItem("studentAuth");
  window.location.href = "index.html";
}

document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("logoutBtnBottom").addEventListener("click", logout);

/* ──────────────────────────────────────────────────────────────
   Show / Hide Sections
   ────────────────────────────────────────────────────────────── */
function showLoading() {
  loadingSection.classList.remove("hidden");
  errorSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
}

function showError(msg) {
  loadingSection.classList.add("hidden");
  errorSection.classList.remove("hidden");
  resultsSection.classList.add("hidden");
  errorMessage.textContent = msg || "Unable to load results.";
}

function showResults() {
  loadingSection.classList.add("hidden");
  errorSection.classList.add("hidden");
  resultsSection.classList.remove("hidden");
}

/* ──────────────────────────────────────────────────────────────
   Grade Badge Helper
   ────────────────────────────────────────────────────────────── */
function gradeBadge(grade) {
  const cls = {
    "O":  "grade-O",
    "A+": "grade-A+",
    "A":  "grade-A",
    "B+": "grade-B+",
    "B":  "grade-B",
    "C":  "grade-C",
    "U":  "grade-U",
  }[grade] || "grade-C";
  return `<span class="grade-badge ${cls}">${grade}</span>`;
}

function resultBadge(result) {
  return result === "P"
    ? `<span class="result-pass">PASS</span>`
    : `<span class="result-fail">FAIL</span>`;
}

/* ──────────────────────────────────────────────────────────────
   Render Results
   ────────────────────────────────────────────────────────────── */
function renderResults(data) {
  const { student, exam, results } = data;

  // Header
  const titleEl   = document.getElementById("resultTitle");
  const sessionEl = document.getElementById("resultSession");
  if (titleEl)   titleEl.textContent   = exam?.title   || "Examination Results";
  if (sessionEl) sessionEl.textContent = exam?.session || "";

  // Student info
  document.getElementById("infoRegNo").textContent    = student.registration_number || "—";
  document.getElementById("infoName").textContent     = student.name || "—";
  document.getElementById("infoBranch").textContent   = student.branch || "—";
  document.getElementById("infoSemester").textContent = student.semester ? `Semester ${student.semester}` : "—";

  // Results table
  const tbody = document.getElementById("resultTableBody");
  tbody.innerHTML = "";

  if (!results || results.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" style="text-align:center;color:#607d8b;padding:24px;">No results found.</td>`;
    tbody.appendChild(tr);
  } else {
    results.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>Semester ${row.semester}</td>
        <td>${row.subject_code}</td>
        <td>${gradeBadge(row.grade)}</td>
        <td>${resultBadge(row.result)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Overall status
  const allPassed = results && results.length > 0 && results.every(r => r.result === "P");
  const overallStatus = document.getElementById("overallStatus");
  if (overallStatus) {
    if (!results || results.length === 0) {
      overallStatus.textContent = "—";
    } else if (allPassed) {
      overallStatus.innerHTML = `<span class="result-pass">ALL PASS</span>`;
    } else {
      overallStatus.innerHTML = `<span class="result-fail">ARREAR(S) PRESENT</span>`;
    }
  }

  showResults();
}

/* ──────────────────────────────────────────────────────────────
   Fetch Results from API
   ────────────────────────────────────────────────────────────── */
async function fetchResults() {
  showLoading();

  const regNo = auth.registration_number;
  if (!regNo) {
    logout();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/results/${encodeURIComponent(regNo)}`);
    const data = await response.json();

    if (response.ok && data.success) {
      renderResults(data);
    } else {
      showError(data.message || "Results not found for this student.");
    }
  } catch (err) {
    console.error("Results fetch error:", err);
    showError("Unable to connect to the server. Please check your connection.");
  }
}

/* Retry button */
retryBtn.addEventListener("click", fetchResults);

/* ──────────────────────────────────────────────────────────────
   Init
   ────────────────────────────────────────────────────────────── */
fetchResults();
