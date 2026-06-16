const siteStorageKey = "facilitiesEsSelectedSite";

const sites = [
  {
    id: "mb0",
    name: "MB0",
    status: "Online",
    health: 94,
    activeAlarms: 3,
    criticalAlarms: 1,
    systemsRunning: 18,
    systemsTotal: 20,
    criticalEquipment: 2,
    activityCount: 14,
    workOrders: 12,
    assetHealth: 91,
    pmTasks: 8,
    criticalAssets: 4,
    energy: "4.1 MWh",
    cost: "$2.8k",
    kpi: "96%",
    compliance: "98%",
    users: 26,
    integrations: 9,
    mail: {
      unreadAlerts: 7,
      failedNotifications: 1,
      recentSystemEmails: 18,
      serverStatus: "Online",
      smtpStatus: "Ready",
      imapStatus: "Ready",
      queueStatus: "Normal",
    },
  },
  {
    id: "mbwest",
    name: "MBwest",
    status: "Online",
    health: 90,
    activeAlarms: 2,
    criticalAlarms: 0,
    systemsRunning: 15,
    systemsTotal: 17,
    criticalEquipment: 1,
    activityCount: 9,
    workOrders: 9,
    assetHealth: 88,
    pmTasks: 6,
    criticalAssets: 3,
    energy: "3.6 MWh",
    cost: "$2.4k",
    kpi: "93%",
    compliance: "96%",
    users: 18,
    integrations: 8,
    mail: {
      unreadAlerts: 4,
      failedNotifications: 0,
      recentSystemEmails: 12,
      serverStatus: "Online",
      smtpStatus: "Ready",
      imapStatus: "Ready",
      queueStatus: "Normal",
    },
  },
  {
    id: "575-florida",
    name: "575 Florida",
    status: "Maintenance",
    health: 86,
    activeAlarms: 5,
    criticalAlarms: 2,
    systemsRunning: 14,
    systemsTotal: 18,
    criticalEquipment: 5,
    activityCount: 20,
    workOrders: 18,
    assetHealth: 84,
    pmTasks: 11,
    criticalAssets: 7,
    energy: "5.2 MWh",
    cost: "$3.9k",
    kpi: "89%",
    compliance: "93%",
    users: 22,
    integrations: 7,
    mail: {
      unreadAlerts: 12,
      failedNotifications: 2,
      recentSystemEmails: 24,
      serverStatus: "Online",
      smtpStatus: "Retrying",
      imapStatus: "Ready",
      queueStatus: "Watch",
    },
  },
  {
    id: "350-ellis",
    name: "350 Ellis",
    status: "Online",
    health: 96,
    activeAlarms: 1,
    criticalAlarms: 0,
    systemsRunning: 12,
    systemsTotal: 12,
    criticalEquipment: 1,
    activityCount: 8,
    workOrders: 6,
    assetHealth: 95,
    pmTasks: 4,
    criticalAssets: 2,
    energy: "2.7 MWh",
    cost: "$1.9k",
    kpi: "98%",
    compliance: "99%",
    users: 13,
    integrations: 6,
    mail: {
      unreadAlerts: 2,
      failedNotifications: 0,
      recentSystemEmails: 9,
      serverStatus: "Online",
      smtpStatus: "Ready",
      imapStatus: "Ready",
      queueStatus: "Normal",
    },
  },
  {
    id: "564-pacific",
    name: "564 Pacific",
    status: "Online",
    health: 92,
    activeAlarms: 2,
    criticalAlarms: 1,
    systemsRunning: 16,
    systemsTotal: 18,
    criticalEquipment: 3,
    activityCount: 11,
    workOrders: 10,
    assetHealth: 90,
    pmTasks: 7,
    criticalAssets: 4,
    energy: "3.9 MWh",
    cost: "$2.6k",
    kpi: "95%",
    compliance: "97%",
    users: 17,
    integrations: 8,
    mail: {
      unreadAlerts: 5,
      failedNotifications: 0,
      recentSystemEmails: 15,
      serverStatus: "Online",
      smtpStatus: "Ready",
      imapStatus: "Ready",
      queueStatus: "Normal",
    },
  },
  {
    id: "harbour-way",
    name: "Harbour Way",
    status: "Online",
    health: 89,
    activeAlarms: 4,
    criticalAlarms: 1,
    systemsRunning: 13,
    systemsTotal: 16,
    criticalEquipment: 4,
    activityCount: 17,
    workOrders: 16,
    assetHealth: 87,
    pmTasks: 10,
    criticalAssets: 5,
    energy: "4.8 MWh",
    cost: "$3.3k",
    kpi: "91%",
    compliance: "95%",
    users: 19,
    integrations: 7,
    mail: {
      unreadAlerts: 9,
      failedNotifications: 1,
      recentSystemEmails: 20,
      serverStatus: "Online",
      smtpStatus: "Ready",
      imapStatus: "Ready",
      queueStatus: "Normal",
    },
  },
  {
    id: "lion",
    name: "Lion",
    status: "Online",
    health: 97,
    activeAlarms: 0,
    criticalAlarms: 0,
    systemsRunning: 10,
    systemsTotal: 10,
    criticalEquipment: 0,
    activityCount: 6,
    workOrders: 4,
    assetHealth: 96,
    pmTasks: 3,
    criticalAssets: 1,
    energy: "2.1 MWh",
    cost: "$1.4k",
    kpi: "99%",
    compliance: "99%",
    users: 11,
    integrations: 6,
    mail: {
      unreadAlerts: 1,
      failedNotifications: 0,
      recentSystemEmails: 7,
      serverStatus: "Online",
      smtpStatus: "Ready",
      imapStatus: "Ready",
      queueStatus: "Normal",
    },
  },
];

const navigationOrder = [
  "dashboard",
  "assets",
  "systems",
  "lighting",
  "projects",
  "work-orders",
  "mail",
  "johny",
  "administration",
];

const moduleMetadata = {
  dashboard: {
    displayName: "Dashboard",
    description: "Adaptive role-based landing page",
    href: "#dashboard",
  },
  assets: {
    displayName: "Assets",
    description: "Records, health, and critical assets",
    href: "http://192.168.0.6:3010",
  },
  systems: {
    displayName: "Systems",
    description: "Live process graphics and equipment state",
    href: "http://192.168.0.6:1881",
  },
  lighting: {
    displayName: "Lighting",
    description: "Lighting zones, schedules, and controls",
    href: "#lighting",
  },
  projects: {
    displayName: "Projects",
    description: "Work orders, PM tasks, and delivery",
    href: "http://192.168.0.6:8081",
  },
  "work-orders": {
    displayName: "Work Orders",
    description: "Open work orders, PM tasks, and maintenance tracking",
    href: "#work-orders",
  },
  analytics: {
    displayName: "Analytics",
    description: "Energy, cost, KPIs, and compliance",
    href: "http://192.168.0.6:3001",
  },
  alarms: {
    displayName: "Alarms",
    description: "Active alarms and routing status",
    href: "#kpiGrid",
  },
  wireless: {
    displayName: "Wireless",
    description: "Gateways, devices, and sensor links",
    href: "http://192.168.0.6:8083",
  },
  mail: {
    displayName: "Mail",
    description: "Inbox, alerts, templates, and settings",
    href: "#mail",
  },
  johny: {
    displayName: "Johny",
    description: "Site-aware assistant and summaries",
    href: "http://192.168.0.6:3000",
  },
  administration: {
    displayName: "Administration",
    description: "Users, integrations, and settings",
    href: "../settings/",
  },
};

const roleModes = {
  engineer: "Operator",
  "asset-manager": "Maintenance",
  manager: "Manager",
  administrator: "Administrator",
};

const vendorCalendarItems = [
  {
    date: "Jun 16",
    title: "Vendor visit",
    detail: "Scheduled service window",
  },
  {
    date: "Jun 22",
    title: "Vendor inspection",
    detail: "Two-week look-ahead",
  },
  {
    date: "Jun 26",
    title: "Vendor follow-up",
    detail: "Pending site confirmation",
  },
];

const ptoCalendarItems = [
  {
    date: "Jun 17-18",
    title: "PTO approved",
    detail: "Coverage assigned",
  },
  {
    date: "Jun 23",
    title: "PTO request",
    detail: "Coverage review",
  },
  {
    date: "Jun 29",
    title: "PTO scheduled",
    detail: "Two-week look-ahead",
  },
];

const siteMenu = document.querySelector("#siteMenu");
const kpiGrid = document.querySelector("#kpiGrid");
const vendorCalendarList = document.querySelector("#vendorCalendarList");
const ptoCalendarList = document.querySelector("#ptoCalendarList");
const openModuleGrid = document.querySelector("#openModuleGrid");
const activityList = document.querySelector("#activityList");
const logoutButton = document.querySelector("#logoutButton");
const sidebarToggle = document.querySelector("#sidebarToggle");
const topSearch = document.querySelector("#topSearch");
const notificationCount = document.querySelector("#notificationCount");
const siteScope = document.querySelector("#siteScope");
const dashboardTitle = document.querySelector("#dashboardTitle");
const dashboardSummary = document.querySelector("#dashboardSummary");
const siteStatusLabel = document.querySelector("#siteStatusLabel");
const activitySiteLabel = document.querySelector("#activitySiteLabel");
const vendorCalendarSiteLabel = document.querySelector("#vendorCalendarSiteLabel");
const ptoCalendarSiteLabel = document.querySelector("#ptoCalendarSiteLabel");
const profileLabel = document.querySelector("#profileLabel");
const userInitials = document.querySelector("#userInitials");
const userMenu = document.querySelector("#userMenu");
const mailShortcut = document.querySelector("#mailShortcut");
const johnyShortcut = document.querySelector("#johnyShortcut");
const notificationButton = document.querySelector("#notificationButton");
const facilitiesMenuClose = document.querySelector("#facilitiesMenuClose");

const currentUser = window.dashboardUser || AccessDirectory.getCurrentUser();
const currentProfile = AccessDirectory.normalizeProfile(currentUser?.profile || "engineer");
const mode = roleModes[currentProfile] || "Operator";
const allowedModuleIds = new Set(AccessDirectory.getWidgetsForUser(currentUser).map((widget) => widget.id));
const moduleIconPaths = {
  lighting: "../assets/facilities-es/modules/sidebar-graphics/lighting-sidebar-graphic.svg",
  "work-orders": "../assets/facilities-es/modules/review/projects-icon-options/projects-option-02-work-order-check.svg",
};

function getSelectedSite() {
  const storedSite = localStorage.getItem(siteStorageKey);
  return sites.find((site) => site.id === storedSite) || sites[0];
}

function setSelectedSite(siteId) {
  localStorage.setItem(siteStorageKey, siteId);
}

function iconPath(moduleId) {
  if (moduleIconPaths[moduleId]) {
    return moduleIconPaths[moduleId];
  }
  return `../assets/facilities-es/modules/icons/${moduleId}-icon.svg`;
}

function siteButtonPath(siteId) {
  return `assets/fes-graphics/site-buttons/${siteId}-site-button.svg?v=site-clean-2`;
}

function isExternalHref(href) {
  return /^https?:\/\//.test(href);
}

function initials(name) {
  return String(name || "Facilities ES")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getModules() {
  return navigationOrder.map((id) => ({
    id,
    ...moduleMetadata[id],
    allowed: allowedModuleIds.has(id),
  }));
}

function cardState(value, type) {
  if (type === "alarm" && value > 0) {
    return "alarm";
  }
  if (type === "warning" && value > 0) {
    return "maintenance";
  }
  return "running";
}

function jiraOpenCount(site) {
  return site.workOrders + site.pmTasks;
}

function openProjectsCount(site) {
  return Math.max(1, Math.ceil(site.workOrders / 4));
}

function roleCards(site) {
  const cards = {
    Operator: [
      {
        label: "Active alarms",
        value: site.activeAlarms,
        detail: `${site.criticalAlarms} critical conditions`,
        state: cardState(site.activeAlarms, "alarm"),
      },
      {
        label: "System overview",
        value: `${site.systemsRunning}/${site.systemsTotal}`,
        detail: "Systems running",
        state: "running",
      },
      {
        label: "Critical equipment",
        value: site.criticalEquipment,
        detail: "Assets need attention",
        state: cardState(site.criticalEquipment, "warning"),
      },
      {
        label: "Recent activity",
        value: site.activityCount,
        detail: "Events in the last shift",
        state: "running",
      },
    ],
    Maintenance: [
      {
        label: "Work orders",
        value: site.workOrders,
        detail: "Open tasks",
        state: cardState(site.workOrders, "warning"),
      },
      {
        label: "Asset health",
        value: `${site.assetHealth}%`,
        detail: "Weighted asset score",
        state: "running",
      },
      {
        label: "PM tasks",
        value: site.pmTasks,
        detail: "Due this week",
        state: cardState(site.pmTasks, "warning"),
      },
      {
        label: "Critical assets",
        value: site.criticalAssets,
        detail: "Priority watch list",
        state: cardState(site.criticalAssets, "alarm"),
      },
    ],
    Manager: [
      {
        label: "Energy",
        value: site.energy,
        detail: "Today",
        state: "running",
      },
      {
        label: "Cost",
        value: site.cost,
        detail: "Today",
        state: "running",
      },
      {
        label: "KPIs",
        value: site.kpi,
        detail: "Monthly target",
        state: "running",
      },
      {
        label: "Compliance",
        value: site.compliance,
        detail: "Current checks",
        state: "running",
      },
    ],
    Administrator: [
      {
        label: "Vendor calendar",
        value: "2 weeks",
        detail: "Look-ahead schedule",
        state: "running",
      },
      {
        label: "PTO calendar",
        value: "List",
        detail: "Upcoming PTO coverage",
        state: "running",
      },
      {
        label: "Jira Open",
        value: jiraOpenCount(site),
        detail: "Open Jira items",
        state: cardState(jiraOpenCount(site), "warning"),
      },
      {
        label: "Open Projects",
        value: openProjectsCount(site),
        detail: "Active project records",
        state: "running",
      },
    ],
  };

  return cards[mode] || cards.Operator;
}

function siteActivities(site) {
  return [
    {
      title: "Vendor calendar reviewed",
      detail: `${site.name} has ${vendorCalendarItems.length} vendor items in the two-week look-ahead`,
      state: "running",
    },
    {
      title: "PTO coverage reviewed",
      detail: `${ptoCalendarItems.length} PTO list items are visible for coverage planning`,
      state: "running",
    },
    {
      title: "Jira open work updated",
      detail: `${jiraOpenCount(site)} open Jira items are ready for review`,
      state: cardState(jiraOpenCount(site), "warning"),
    },
    {
      title: "Open projects updated",
      detail: `${openProjectsCount(site)} open project records are active`,
      state: "running",
    },
  ];
}

function createLink(module) {
  const element = document.createElement(module.allowed ? "a" : "span");
  element.className = module.allowed ? "module-link" : "module-link disabled";
  element.setAttribute("data-module", module.id);

  if (module.allowed) {
    element.href = module.href;
    if (isExternalHref(module.href)) {
      element.target = "_blank";
      element.rel = "noopener noreferrer";
    }
  } else {
    element.setAttribute("aria-disabled", "true");
  }

  element.innerHTML = `
    <img src="${iconPath(module.id)}" alt="" />
    <span>${module.displayName}</span>
  `;
  return element;
}

function createSiteMenuItem(site, selectedSite, modules) {
  const isSelected = site.id === selectedSite.id;
  const item = document.createElement("section");
  const moduleListId = `site-modules-${site.id}`;
  item.className = "site-menu-item";
  item.toggleAttribute("data-selected", isSelected);

  const trigger = document.createElement("button");
  trigger.className = "site-menu-trigger";
  trigger.type = "button";
  trigger.dataset.siteId = site.id;
  trigger.setAttribute("aria-expanded", String(isSelected));
  trigger.setAttribute("aria-controls", moduleListId);
  trigger.setAttribute("aria-label", `${site.name} modules`);
  trigger.innerHTML = `
    <img src="${siteButtonPath(site.id)}" alt="" />
    <span class="site-menu-name">${site.name}</span>
    <span class="site-menu-chevron" aria-hidden="true"></span>
  `;

  const moduleList = document.createElement("div");
  moduleList.className = "site-module-list";
  moduleList.id = moduleListId;
  moduleList.hidden = !isSelected;
  moduleList.replaceChildren(...modules.map(createLink));

  item.replaceChildren(trigger, moduleList);
  return item;
}

function renderNavigation(selectedSite) {
  const modules = getModules();
  siteMenu.replaceChildren(...sites.map((site) => createSiteMenuItem(site, selectedSite, modules)));
}

function renderHero(site) {
  siteScope.textContent = `${site.name} selected site`;
  dashboardTitle.textContent = `${mode} Dashboard`;
  dashboardSummary.textContent = `${site.name} is scoped for vendor scheduling, PTO coverage, Jira open work, and open projects.`;
  siteStatusLabel.textContent = site.status;
  activitySiteLabel.textContent = site.name;
  vendorCalendarSiteLabel.textContent = site.name;
  ptoCalendarSiteLabel.textContent = site.name;
  profileLabel.textContent = AccessDirectory.profileLabel(currentProfile);
  if (notificationCount) {
    notificationCount.textContent = site.activeAlarms + site.mail.unreadAlerts;
  }
  userInitials.textContent = initials(currentUser?.name);
  userMenu.title = currentUser?.name || "Facilities ES user";
}

function renderKpis(site) {
  kpiGrid.innerHTML = roleCards(site)
    .map((card) => `
      <article class="kpi-card ${card.state}">
        <span class="state-dot ${card.state}" aria-hidden="true"></span>
        <p>${card.label}</p>
        <strong>${card.value}</strong>
        <small>${card.detail}</small>
      </article>
    `)
    .join("");
}

function renderCalendarList(container, items) {
  container.innerHTML = items
    .map((item) => `
      <article class="calendar-item">
        <time>${item.date}</time>
        <div>
          <h3>${item.title}</h3>
          <p>${item.detail}</p>
        </div>
      </article>
    `)
    .join("");
}

function renderCalendars() {
  renderCalendarList(vendorCalendarList, vendorCalendarItems);
  renderCalendarList(ptoCalendarList, ptoCalendarItems);
}

function renderActivity(site) {
  activityList.innerHTML = siteActivities(site)
    .map((activity) => `
      <article class="activity-item ${activity.state}">
        <span class="state-dot ${activity.state}" aria-hidden="true"></span>
        <div>
          <h3>${activity.title}</h3>
          <p>${activity.detail}</p>
        </div>
      </article>
    `)
    .join("");
}

function renderOpenModules(site) {
  const openModules = [
    {
      id: "jira-open",
      label: "Jira Open",
      value: jiraOpenCount(site),
      detail: "Open Jira items",
      href: "#jira-open",
    },
    {
      id: "projects-open",
      label: "Open Projects",
      value: openProjectsCount(site),
      detail: "Active project records",
      href: moduleMetadata.projects.href,
    },
  ];

  openModuleGrid.innerHTML = openModules
    .map((module) => `
      <a
        class="open-module-card"
        href="${module.href}"
        ${isExternalHref(module.href) ? 'target="_blank" rel="noopener noreferrer"' : ""}
        data-module="${module.id}"
      >
        <span>
          <strong>${module.label}</strong>
          <small>${module.detail}</small>
        </span>
        <b>${module.value}</b>
      </a>
    `)
    .join("");
}

function setShortcutState() {
  [
    [mailShortcut, "mail"],
    [johnyShortcut, "johny"],
  ].forEach(([element, moduleId]) => {
    const module = moduleMetadata[moduleId];
    const allowed = allowedModuleIds.has(moduleId);
    if (!element) {
      return;
    }
    element.href = allowed ? module.href : "#";
    element.classList.toggle("disabled", !allowed);
    element.setAttribute("aria-disabled", String(!allowed));
    if (allowed && isExternalHref(module.href)) {
      element.target = "_blank";
      element.rel = "noopener noreferrer";
    }
  });
}

function renderDashboard() {
  const selectedSite = getSelectedSite();
  renderNavigation(selectedSite);
  renderHero(selectedSite);
  renderKpis(selectedSite);
  renderCalendars();
  renderActivity(selectedSite);
  renderOpenModules(selectedSite);
  setShortcutState();
}

function applySearchFilter(query) {
  const normalized = query.trim().toLowerCase();
  const searchableItems = document.querySelectorAll(".calendar-item, .activity-item, .open-module-card");

  searchableItems.forEach((item) => {
    const matches = !normalized || item.textContent.toLowerCase().includes(normalized);
    item.hidden = !matches;
  });
}

siteMenu.addEventListener("click", (event) => {
  const trigger = event.target.closest(".site-menu-trigger");
  if (!trigger) {
    return;
  }

  const siteId = trigger.dataset.siteId;
  setSelectedSite(siteId);
  renderDashboard();
  siteMenu.querySelector(`.site-menu-trigger[data-site-id="${siteId}"]`)?.scrollIntoView({ block: "nearest" });
  if (topSearch) {
    applySearchFilter(topSearch.value);
  }
});

topSearch?.addEventListener("input", (event) => {
  applySearchFilter(event.target.value);
});

sidebarToggle.addEventListener("click", () => {
  document.body.classList.toggle("nav-open");
});

facilitiesMenuClose.addEventListener("click", () => {
  document.body.classList.remove("nav-open");
});

notificationButton?.addEventListener("click", () => {
  kpiGrid.scrollIntoView({ behavior: "smooth", block: "center" });
});

logoutButton.addEventListener("click", () => {
  AccessDirectory.clearSession();
  window.location.href = "../login/";
});

renderDashboard();
