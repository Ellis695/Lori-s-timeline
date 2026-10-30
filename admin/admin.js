const API = "https://lori-s-timeline.onrender.com/api/admin";
const loginPanel = document.getElementById("login-panel");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const dashboardMessage = document.getElementById("dashboard-message");
const rows = document.getElementById("registration-rows");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
let token = sessionStorage.getItem("loriAdminToken") || "";
let registrations = [];

function setMessage(element, text) { element.textContent = text || ""; }
function showDashboard(show) { loginPanel.hidden = show; dashboard.hidden = !show; }
function money(amount) { return new Intl.NumberFormat("en-NG", { style:"currency", currency:"NGN", maximumFractionDigits:0 }).format(amount || 0); }
function dateLabel(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}
async function api(path, options = {}) {
  const response = await fetch(API + path, {
    ...options,
    headers: { "Content-Type":"application/json", ...(token ? { Authorization:"Bearer " + token } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    token = "";
    sessionStorage.removeItem("loriAdminToken");
    showDashboard(false);
  }
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}
async function loadRegistrations() {
  setMessage(dashboardMessage, "Loading registrations…");
  try {
    const data = await api("/registrations");
    registrations = data.registrations || [];
    document.getElementById("total-count").textContent = data.stats.total;
    document.getElementById("enrolled-count").textContent = data.stats.enrolled;
    document.getElementById("pending-count").textContent = data.stats.pending;
    document.getElementById("revenue-count").textContent = money(data.stats.revenue);
    renderRows();
    setMessage(dashboardMessage, "");
  } catch (error) {
    setMessage(dashboardMessage, error.message);
  }
}
function renderRows() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const filtered = registrations.filter((item) => {
    const haystack = [item.name,item.email,item.description,item.goal,item.paymentReference,item.phone].join(" ").toLowerCase();
    return haystack.includes(query) && (status === "all" || item.status === status);
  });
  rows.replaceChildren();
  if (!filtered.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7; td.className = "empty"; td.textContent = "No registrations found.";
    tr.append(td); rows.append(tr); return;
  }
  filtered.forEach((item) => {
    const tr = document.createElement("tr");
    const student = document.createElement("td");
    const name = document.createElement("span"); name.className = "student-name"; name.textContent = item.name;
    const email = document.createElement("span"); email.className = "student-email"; email.textContent = item.email;
    student.append(name,email);
    const about = document.createElement("td"); about.textContent = item.description || "—";
    const goal = document.createElement("td"); goal.textContent = item.goal || "—";
    const ref = document.createElement("td"); ref.className = "ref"; ref.textContent = item.paymentReference || "—";
    const state = document.createElement("td");
    const badge = document.createElement("span"); badge.className = "status " + item.status; badge.textContent = item.status === "enrolled" ? "paid" : "pending"; state.append(badge);
    const date = document.createElement("td"); date.textContent = dateLabel(item.createdAt);
    const actionCell = document.createElement("td");
    const button = document.createElement("button");
    button.className = item.status === "enrolled" ? "action revert" : "action";
    button.textContent = item.status === "enrolled" ? "Set pending" : "Confirm payment";
    button.addEventListener("click", () => updateStatus(item, item.status === "enrolled" ? "pending" : "enrolled"));
    actionCell.append(button);
    tr.append(student,about,goal,ref,state,date,actionCell); rows.append(tr);
  });
}
async function updateStatus(item, nextStatus) {
  if (nextStatus === "enrolled" && !window.confirm("Only continue if you have verified the money was received. Confirm payment for " + item.name + "?")) return;
  if (nextStatus === "pending" && !window.confirm("Return " + item.name + "'s status to pending?")) return;
  try {
    const result = await api("/registrations/" + encodeURIComponent(item._id) + "/status", {
      method:"PATCH", body:JSON.stringify({ status:nextStatus })
    });
    setMessage(dashboardMessage, result.message + (result.emailSent === false ? " Confirmation email failed; check Render logs." : result.emailSent === true ? " Confirmation email sent." : ""));
    await loadRegistrations();
  } catch (error) { setMessage(dashboardMessage, error.message); }
}
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginMessage, "Signing in…");
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  try {
    const result = await fetch(API + "/login", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({username,password})
    });
    const data = await result.json().catch(() => ({}));
    if (!result.ok) throw new Error(data.message || "Sign in failed.");
    token = data.token;
    sessionStorage.setItem("loriAdminToken", token);
    document.getElementById("password").value = "";
    showDashboard(true);
    await loadRegistrations();
  } catch (error) { setMessage(loginMessage, error.message); }
});
document.getElementById("logout-button").addEventListener("click", () => {
  token = ""; sessionStorage.removeItem("loriAdminToken"); showDashboard(false);
  loginForm.reset(); setMessage(loginMessage, "You have signed out.");
});
document.getElementById("refresh-button").addEventListener("click", loadRegistrations);
searchInput.addEventListener("input", renderRows);
statusFilter.addEventListener("change", renderRows);
if (token) { showDashboard(true); loadRegistrations(); } else { showDashboard(false); }


const enquiryRows = document.getElementById("enquiry-rows");
const enquirySearch = document.getElementById("enquiry-search");
const enquiryStatusFilter = document.getElementById("enquiry-status-filter");
let enquiries = [];

function switchDashboardPanel(panelId) {
  document.getElementById("registrations-panel").hidden = panelId !== "registrations-panel";
  document.getElementById("enquiries-panel").hidden = panelId !== "enquiries-panel";
  document.querySelectorAll(".dashboard-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.panel === panelId);
  });
  if (panelId === "enquiries-panel") loadEnquiries();
}
document.querySelectorAll(".dashboard-tab").forEach((button) => {
  button.addEventListener("click", () => switchDashboardPanel(button.dataset.panel));
});

async function loadEnquiries() {
  setMessage(dashboardMessage, "Loading enquiries…");
  try {
    const data = await api("/enquiries");
    enquiries = data.enquiries || [];
    renderEnquiries();
    setMessage(dashboardMessage, "");
  } catch (error) {
    setMessage(dashboardMessage, error.message);
  }
}
function renderEnquiries() {
  if (!enquiryRows) return;
  const query = enquirySearch.value.trim().toLowerCase();
  const status = enquiryStatusFilter.value;
  const filtered = enquiries.filter((item) => {
    const haystack = [item.name,item.email,item.phone,item.enquiryType,item.service,item.details].join(" ").toLowerCase();
    return haystack.includes(query) && (status === "all" || item.status === status);
  });
  enquiryRows.replaceChildren();
  if (!filtered.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6; td.className = "empty"; td.textContent = "No enquiries found.";
    tr.append(td); enquiryRows.append(tr); return;
  }
  filtered.forEach((item) => {
    const tr = document.createElement("tr");
    const client = document.createElement("td");
    const name = document.createElement("span"); name.className = "student-name"; name.textContent = item.name;
    const email = document.createElement("span"); email.className = "student-email"; email.textContent = item.email;
    const details = document.createElement("span"); details.className = "student-email";
    details.textContent = [item.phone,item.budget ? "Budget: "+item.budget : "",item.deliveryDate ? "Due: "+item.deliveryDate : ""].filter(Boolean).join(" · ");
    client.append(name,email,details);
    const type = document.createElement("td"); type.textContent = item.enquiryType;
    const service = document.createElement("td");
    const serviceName = document.createElement("strong"); serviceName.textContent = item.service;
    const description = document.createElement("span"); description.className = "student-email"; description.textContent = item.details;
    service.append(serviceName,description);
    const state = document.createElement("td");
    const badge = document.createElement("span"); badge.className = "status enquiry-status"; badge.textContent = item.status; state.append(badge);
    const date = document.createElement("td"); date.textContent = dateLabel(item.createdAt);
    const action = document.createElement("td");
    const select = document.createElement("select");
    select.className = "enquiry-status-select";
    ["New","Contacted","Quoted","Accepted","Declined"].forEach((value) => {
      const option = document.createElement("option"); option.value = value; option.textContent = value;
      option.selected = item.status === value; select.append(option);
    });
    select.addEventListener("change", () => updateEnquiryStatus(item, select.value));
    action.append(select);
    tr.append(client,type,service,state,date,action);
    enquiryRows.append(tr);
  });
}
async function updateEnquiryStatus(item, nextStatus) {
  try {
    const result = await api("/enquiries/" + encodeURIComponent(item._id) + "/status", {
      method:"PATCH", body:JSON.stringify({status:nextStatus})
    });
    setMessage(dashboardMessage, result.message);
    await loadEnquiries();
  } catch (error) {
    setMessage(dashboardMessage, error.message);
  }
}
if (enquirySearch) enquirySearch.addEventListener("input", renderEnquiries);
if (enquiryStatusFilter) enquiryStatusFilter.addEventListener("change", renderEnquiries);
const enquiryRefresh = document.getElementById("enquiry-refresh");
if (enquiryRefresh) enquiryRefresh.addEventListener("click", loadEnquiries);

const passwordInput = document.getElementById("password");
const togglePasswordButton = document.getElementById("toggle-password");
togglePasswordButton.addEventListener("click", () => {
  const shouldShow = passwordInput.type === "password";
  passwordInput.type = shouldShow ? "text" : "password";
  togglePasswordButton.textContent = shouldShow ? "Hide" : "Show";
  togglePasswordButton.setAttribute("aria-pressed", String(shouldShow));
});
