const roleModes = {
  Operator: ["Active alarms", "System overview", "Critical equipment", "Recent activity"],
  Maintenance: ["Work orders", "Asset health", "PM tasks", "Critical assets"],
  Manager: ["Energy", "Cost", "KPIs", "Compliance"],
  Administrator: ["System health", "Users", "Integrations", "Mail settings", "Notification settings"],
};

const siteNames = {
  "DAL-B1": "Dallas Building 1",
  "DAL-B2": "Dallas Building 2",
  "AUS-C1": "Austin Campus",
};

const moduleSearch = document.querySelector("#moduleSearch");
const moduleCards = Array.from(document.querySelectorAll(".module-card"));
const roleTabs = Array.from(document.querySelectorAll(".role-tab"));
const roleEyebrow = document.querySelector("#roleEyebrow");
const roleTitle = document.querySelector("#roleTitle");
const roleItems = document.querySelector("#roleItems");
const siteSelector = document.querySelector("#siteSelector");
const siteContext = document.querySelector("#siteContext");
const lastSync = document.querySelector("#lastSync");
const refreshButton = document.querySelector("#refreshButton");

function setRole(role) {
  const items = roleModes[role] || roleModes.Operator;
  roleTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.role === role);
  });
  roleEyebrow.textContent = `${role} dashboard`;
  roleTitle.textContent = items.join(", ");
  roleItems.innerHTML = items.map((item) => `<span>${item}</span>`).join("");
}

function updateSiteContext() {
  const siteName = siteNames[siteSelector.value] || siteSelector.value;
  siteContext.textContent = siteName;
  document.querySelectorAll("[data-module]").forEach((item) => {
    item.setAttribute("data-site", siteSelector.value);
  });
}

function filterModules() {
  const term = moduleSearch.value.trim().toLowerCase();
  moduleCards.forEach((card) => {
    const text = `${card.textContent} ${card.dataset.search || ""}`.toLowerCase();
    card.classList.toggle("is-hidden", Boolean(term) && !text.includes(term));
  });
}

function refreshDashboard() {
  const now = new Date();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  lastSync.textContent = `Updated ${now.getHours()}:${minutes}`;

  document.querySelectorAll(".metric-card").forEach((card, index) => {
    card.animate(
      [
        { transform: "translateY(0)", filter: "brightness(1)" },
        { transform: "translateY(-2px)", filter: "brightness(1.08)" },
        { transform: "translateY(0)", filter: "brightness(1)" },
      ],
      { duration: 320 + index * 20, easing: "ease-out" }
    );
  });
}

roleTabs.forEach((tab) => {
  tab.addEventListener("click", () => setRole(tab.dataset.role));
});

siteSelector.addEventListener("change", updateSiteContext);
moduleSearch.addEventListener("input", filterModules);
refreshButton.addEventListener("click", refreshDashboard);

setRole("Operator");
updateSiteContext();
refreshDashboard();
