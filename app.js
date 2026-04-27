const today = new Date();
today.setHours(0, 0, 0, 0);

const teamProjects = [
  {
    title: "North wing move plan",
    owner: "Avery",
    status: "On Track",
    due: addDays(3),
    progress: 68,
    priority: "P2",
    note: "Floor plan signoff and mover quote ready",
  },
  {
    title: "Asset inventory cleanup",
    owner: "Jordan",
    status: "At Risk",
    due: addDays(2),
    progress: 46,
    priority: "P1",
    note: "Missing serials from storage cage audit",
  },
  {
    title: "Q2 safety refresh",
    owner: "Sam",
    status: "On Track",
    due: addDays(9),
    progress: 54,
    priority: "P3",
    note: "Deck drafted, hands-on stations booked",
  },
  {
    title: "Badge access review",
    owner: "Taylor",
    status: "Blocked",
    due: addDays(1),
    progress: 31,
    priority: "P1",
    note: "Waiting for HR export to reconcile groups",
  },
  {
    title: "Conference room refresh",
    owner: "Morgan",
    status: "On Track",
    due: addDays(14),
    progress: 73,
    priority: "P2",
    note: "AV kit staged, weekend install planned",
  },
  {
    title: "Policy exception queue",
    owner: "Riley",
    status: "At Risk",
    due: addDays(5),
    progress: 38,
    priority: "P2",
    note: "Needs manager approvals before release",
  },
  {
    title: "Storage standardization",
    owner: "Casey",
    status: "Blocked",
    due: addDays(7),
    progress: 22,
    priority: "P2",
    note: "Shelving order delayed by vendor",
  },
  {
    title: "New hire workspace batch",
    owner: "Avery",
    status: "Done",
    due: addDays(-1),
    progress: 100,
    priority: "P3",
    note: "All desks provisioned and tagged",
  },
];

const vendors = [
  {
    vendor: "Brightline Moving",
    deliverable: "Move plan and weekend labor roster",
    owner: "Avery",
    status: "On Track",
    due: addDays(4),
    nextStep: "Confirm freight elevator window",
  },
  {
    vendor: "Northstar AV",
    deliverable: "Conference room hardware kit",
    owner: "Morgan",
    status: "Needs Review",
    due: addDays(6),
    nextStep: "Approve substitution list",
  },
  {
    vendor: "Keystone Supply",
    deliverable: "Storage shelving delivery",
    owner: "Casey",
    status: "Blocked",
    due: addDays(7),
    nextStep: "Escalate backorder date",
  },
  {
    vendor: "ClearPath Security",
    deliverable: "Badge reader firmware review",
    owner: "Taylor",
    status: "Waiting",
    due: addDays(10),
    nextStep: "Receive risk memo",
  },
  {
    vendor: "Atlas Training",
    deliverable: "Safety workshop facilitators",
    owner: "Sam",
    status: "On Track",
    due: addDays(12),
    nextStep: "Send attendee list",
  },
  {
    vendor: "Papertrail Records",
    deliverable: "Inventory archive import",
    owner: "Jordan",
    status: "Needs Review",
    due: addDays(2),
    nextStep: "Validate import sample",
  },
];

const events = [
  {
    date: addDays(1),
    title: "Move readiness review",
    detail: "Avery / Ops leads / 10:00 AM",
    type: "review",
  },
  {
    date: addDays(3),
    title: "Monday planning",
    detail: "Team leads / 9:30 AM",
    type: "event",
  },
  {
    date: addDays(5),
    title: "Vendor checkpoint",
    detail: "Northstar AV and Keystone / 2:00 PM",
    type: "review",
  },
  {
    date: addDays(8),
    title: "Safety refresh session",
    detail: "All hands / 1:00 PM",
    type: "event",
  },
  {
    date: addDays(13),
    title: "Project closeout review",
    detail: "Workflow owners / 3:30 PM",
    type: "review",
  },
  {
    date: addDays(18),
    title: "Quarterly roadmap sync",
    detail: "Leadership / 11:00 AM",
    type: "event",
  },
];

const pto = [
  {
    person: "Jordan",
    start: addDays(4),
    end: addDays(5),
    detail: "Inventory backup: Riley",
    type: "pto",
  },
  {
    person: "Sam",
    start: addDays(7),
    end: addDays(7),
    detail: "Safety backup: Avery",
    type: "pto",
  },
  {
    person: "Morgan",
    start: addDays(12),
    end: addDays(14),
    detail: "AV backup: Taylor",
    type: "pto",
  },
  {
    person: "Casey",
    start: addDays(13),
    end: addDays(13),
    detail: "Storage backup: Jordan",
    type: "coverage",
  },
  {
    person: "Riley",
    start: addDays(20),
    end: addDays(22),
    detail: "Approvals backup: Sam",
    type: "pto",
  },
];

const ranges = {
  "This Week": {
    projects: "8",
    projectMeta: "4 due this week",
    blocked: "3",
    vendors: "6",
    vendorMeta: "3 need attention",
    events: "6",
    eventMeta: "Next: Monday planning",
    pto: "5",
    ptoMeta: "2 overlapping days",
  },
  "Next 30": {
    projects: "18",
    projectMeta: "9 active milestones",
    blocked: "5",
    vendors: "12",
    vendorMeta: "4 need review",
    events: "11",
    eventMeta: "3 vendor checkpoints",
    pto: "9",
    ptoMeta: "4 coverage handoffs",
  },
  Quarter: {
    projects: "31",
    projectMeta: "6 cross-team initiatives",
    blocked: "7",
    vendors: "16",
    vendorMeta: "3 contract renewals",
    events: "24",
    eventMeta: "8 leadership reviews",
    pto: "18",
    ptoMeta: "6 heavy PTO weeks",
  },
};

const projectBoard = document.querySelector("#projectBoard");
const focusList = document.querySelector("#focusList");
const vendorRows = document.querySelector("#vendorRows");
const projectStatusFilter = document.querySelector("#projectStatusFilter");
const projectOwnerFilter = document.querySelector("#projectOwnerFilter");
const vendorStatusFilter = document.querySelector("#vendorStatusFilter");
const searchInput = document.querySelector("#globalSearch");
const lastSync = document.querySelector("#lastSync");

const eventCalendar = document.querySelector("#eventCalendar");
const ptoCalendar = document.querySelector("#ptoCalendar");
const eventDetail = document.querySelector("#eventDetail");
const ptoDetail = document.querySelector("#ptoDetail");
const eventMonthLabel = document.querySelector("#eventMonthLabel");
const ptoMonthLabel = document.querySelector("#ptoMonthLabel");

let risksOnly = false;
let eventMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let ptoMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedEventDate = toISODate(today);
let selectedPtoDate = toISODate(today);

const projectStatuses = ["On Track", "At Risk", "Blocked", "Done"];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addDays(offset) {
  const date = new Date(today);
  date.setDate(date.getDate() + offset);
  return toISODate(date);
}

function toISODate(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function fromISO(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(value) {
  return fromISO(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatMonth(date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function getSearchTerm() {
  return searchInput.value.trim().toLowerCase();
}

function includesTerm(values, term) {
  return values.join(" ").toLowerCase().includes(term);
}

function statusTone(status) {
  if (status === "On Track" || status === "Done") return "good";
  if (status === "At Risk" || status === "Needs Review") return "caution";
  if (status === "Blocked") return "critical";
  if (status === "Waiting") return "info";
  return "violet";
}

function priorityTone(priority) {
  if (priority === "P1") return "critical";
  if (priority === "P2") return "caution";
  return "info";
}

function populateOwnerFilter() {
  const owners = [...new Set(teamProjects.map((project) => project.owner))].sort();
  projectOwnerFilter.innerHTML = [
    '<option value="All">All Owners</option>',
    ...owners.map((owner) => `<option value="${owner}">${owner}</option>`),
  ].join("");
}

function getFilteredProjects() {
  const term = getSearchTerm();
  const selectedStatus = projectStatusFilter.value;
  const selectedOwner = projectOwnerFilter.value;

  return teamProjects.filter((project) => {
    const matchesStatus = selectedStatus === "All" || project.status === selectedStatus;
    const matchesOwner = selectedOwner === "All" || project.owner === selectedOwner;
    const matchesSearch = includesTerm(
      [project.title, project.owner, project.status, project.priority, project.note],
      term
    );
    return matchesStatus && matchesOwner && matchesSearch;
  });
}

function renderProjects() {
  const filteredProjects = getFilteredProjects();

  projectBoard.innerHTML = projectStatuses
    .map((status) => {
      const items = filteredProjects.filter((project) => project.status === status);
      return `
        <section class="board-column" aria-label="${status} projects">
          <div class="column-header">
            <h3>${status}</h3>
            <span>${items.length}</span>
          </div>
          <div class="column-items">
            ${items.map(renderProjectCard).join("") || `<span class="empty-state">No projects</span>`}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderProjectCard(project) {
  const statusClass = project.status.toLowerCase().replace(/\s+/g, "-");
  return `
    <article class="project-card ${statusClass}">
      <div>
        <strong>${project.title}</strong>
        <span>${project.note}</span>
      </div>
      <div class="progress" aria-label="${project.progress}% complete">
        <i style="width: ${project.progress}%"></i>
      </div>
      <div class="project-footer">
        <span class="status-pill ${statusTone(project.status)}">${project.status}</span>
        <span class="status-pill ${priorityTone(project.priority)}">${project.priority}</span>
        <span>${project.owner}</span>
        <span>${formatShortDate(project.due)}</span>
      </div>
    </article>
  `;
}

function renderVendors() {
  const term = getSearchTerm();
  const selectedStatus = vendorStatusFilter.value;

  const filteredVendors = vendors.filter((vendor) => {
    const matchesStatus = selectedStatus === "All" || vendor.status === selectedStatus;
    const matchesSearch = includesTerm(
      [vendor.vendor, vendor.deliverable, vendor.owner, vendor.status, vendor.nextStep],
      term
    );
    return matchesStatus && matchesSearch;
  });

  vendorRows.innerHTML = filteredVendors
    .map(
      (vendor) => `
        <tr>
          <td><strong>${vendor.vendor}</strong></td>
          <td>${vendor.deliverable}</td>
          <td>${vendor.owner}</td>
          <td><span class="status-pill ${statusTone(vendor.status)}">${vendor.status}</span></td>
          <td>${formatShortDate(vendor.due)}</td>
          <td>${vendor.nextStep}</td>
        </tr>
      `
    )
    .join("");
}

function renderFocusList() {
  const term = getSearchTerm();
  const projectItems = teamProjects
    .filter((project) => ["At Risk", "Blocked"].includes(project.status) || daysUntil(project.due) <= 3)
    .map((project) => ({
      title: project.title,
      detail: `${project.owner} / ${project.note}`,
      status: project.status,
      due: project.due,
      type: "Project",
    }));

  const vendorItems = vendors
    .filter((vendor) => ["Needs Review", "Blocked", "Waiting"].includes(vendor.status))
    .map((vendor) => ({
      title: vendor.vendor,
      detail: `${vendor.deliverable} / ${vendor.nextStep}`,
      status: vendor.status,
      due: vendor.due,
      type: "Vendor",
    }));

  const allItems = [...projectItems, ...vendorItems]
    .filter((item) => !risksOnly || ["At Risk", "Blocked", "Needs Review"].includes(item.status))
    .filter((item) => includesTerm([item.title, item.detail, item.status, item.type], term))
    .sort((a, b) => fromISO(a.due) - fromISO(b.due));

  focusList.innerHTML = allItems
    .map(
      (item) => `
        <article class="focus-item">
          <div>
            <strong>${item.title}</strong>
            <span>${item.detail}</span>
          </div>
          <div class="focus-meta">
            <span class="status-pill ${statusTone(item.status)}">${item.status}</span>
            <span class="pill violet">${item.type}</span>
            <span>${formatShortDate(item.due)}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderCalendars() {
  renderCalendar({
    container: eventCalendar,
    label: eventMonthLabel,
    monthDate: eventMonth,
    selectedDate: selectedEventDate,
    items: events.map((item) => ({ ...item, start: item.date, end: item.date })),
    detail: eventDetail,
    emptyText: "No scheduled events",
    detailType: "event",
  });

  renderCalendar({
    container: ptoCalendar,
    label: ptoMonthLabel,
    monthDate: ptoMonth,
    selectedDate: selectedPtoDate,
    items: pto,
    detail: ptoDetail,
    emptyText: "No PTO scheduled",
    detailType: "pto",
  });
}

function renderCalendar({ container, label, monthDate, selectedDate, items, detail, emptyText, detailType }) {
  label.textContent = formatMonth(monthDate);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const firstCell = new Date(year, month, 1 - startOffset);

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCell);
    date.setDate(firstCell.getDate() + index);
    const key = toISODate(date);
    const dayItems = itemsForDay(items, key);
    const isCurrentMonth = date.getMonth() === month;
    const isToday = key === toISODate(today);
    const isSelected = key === selectedDate;

    return `
      <button class="calendar-day${isCurrentMonth ? "" : " is-muted"}${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}" type="button" data-date="${key}" aria-label="${formatShortDate(key)}">
        <span class="day-number">${date.getDate()}</span>
        ${dayItems.slice(0, 2).map(renderDayMarker).join("")}
        ${dayItems.length > 2 ? `<span class="day-marker ${detailType}">+${dayItems.length - 2}</span>` : ""}
      </button>
    `;
  });

  container.innerHTML = [
    ...weekdays.map((day) => `<div class="weekday">${day}</div>`),
    ...days,
  ].join("");

  renderDayDetail(detail, itemsForDay(items, selectedDate), emptyText, detailType);
}

function renderDayMarker(item) {
  const markerClass = item.type === "coverage" ? "coverage" : item.type === "review" ? "review" : item.type;
  const label = item.title || item.person;
  return `<span class="day-marker ${markerClass}">${label}</span>`;
}

function renderDayDetail(container, items, emptyText, detailType) {
  if (!items.length) {
    container.innerHTML = `<span>${emptyText}</span>`;
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const title = item.title || item.person;
      const detail = item.detail || "";
      const rowClass = detailType === "pto" ? item.type : item.type === "review" ? "coverage" : "";
      return `
        <div class="detail-row ${rowClass}">
          <strong>${title}</strong>
          <span>${detail}</span>
        </div>
      `;
    })
    .join("");
}

function itemsForDay(items, key) {
  return items.filter((item) => key >= item.start && key <= item.end);
}

function daysUntil(value) {
  return Math.round((fromISO(value) - today) / 86400000);
}

function changeMonth(current, direction) {
  return new Date(current.getFullYear(), current.getMonth() + direction, 1);
}

function updateRange(range) {
  const values = ranges[range];
  document.querySelector("#teamProjectCount").textContent = values.projects;
  document.querySelector("#teamProjectMeta").textContent = values.projectMeta;
  document.querySelector("#blockedCount").textContent = values.blocked;
  document.querySelector("#vendorCount").textContent = values.vendors;
  document.querySelector("#vendorMeta").textContent = values.vendorMeta;
  document.querySelector("#eventCount").textContent = values.events;
  document.querySelector("#eventMeta").textContent = values.eventMeta;
  document.querySelector("#ptoCount").textContent = values.pto;
  document.querySelector("#ptoMeta").textContent = values.ptoMeta;
}

function refreshDashboard() {
  const now = new Date();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  lastSync.textContent = `Updated ${now.getHours()}:${minutes}`;

  document.querySelectorAll(".metric-card").forEach((card) => {
    card.animate(
      [
        { transform: "translateY(0)", filter: "brightness(1)" },
        { transform: "translateY(-2px)", filter: "brightness(1.03)" },
        { transform: "translateY(0)", filter: "brightness(1)" },
      ],
      { duration: 360, easing: "ease-out" }
    );
  });
}

function renderAll() {
  renderProjects();
  renderVendors();
  renderFocusList();
  renderCalendars();
}

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    updateRange(button.dataset.range);
  });
});

document.querySelector("#toggleRisks").addEventListener("click", () => {
  risksOnly = !risksOnly;
  document.querySelector("#toggleRisks").textContent = risksOnly ? "Show All" : "Risks Only";
  renderFocusList();
});

document.querySelector("#refreshButton").addEventListener("click", refreshDashboard);

projectStatusFilter.addEventListener("change", renderProjects);
projectOwnerFilter.addEventListener("change", renderProjects);
vendorStatusFilter.addEventListener("change", renderVendors);
searchInput.addEventListener("input", renderAll);

eventCalendar.addEventListener("click", (event) => {
  const day = event.target.closest(".calendar-day");
  if (!day) return;
  selectedEventDate = day.dataset.date;
  eventMonth = new Date(fromISO(selectedEventDate).getFullYear(), fromISO(selectedEventDate).getMonth(), 1);
  renderCalendars();
});

ptoCalendar.addEventListener("click", (event) => {
  const day = event.target.closest(".calendar-day");
  if (!day) return;
  selectedPtoDate = day.dataset.date;
  ptoMonth = new Date(fromISO(selectedPtoDate).getFullYear(), fromISO(selectedPtoDate).getMonth(), 1);
  renderCalendars();
});

document.querySelector("#eventPrev").addEventListener("click", () => {
  eventMonth = changeMonth(eventMonth, -1);
  renderCalendars();
});

document.querySelector("#eventNext").addEventListener("click", () => {
  eventMonth = changeMonth(eventMonth, 1);
  renderCalendars();
});

document.querySelector("#ptoPrev").addEventListener("click", () => {
  ptoMonth = changeMonth(ptoMonth, -1);
  renderCalendars();
});

document.querySelector("#ptoNext").addEventListener("click", () => {
  ptoMonth = changeMonth(ptoMonth, 1);
  renderCalendars();
});

populateOwnerFilter();
updateRange("This Week");
renderAll();
refreshDashboard();
