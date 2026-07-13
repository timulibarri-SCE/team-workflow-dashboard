(function () {
  const usersKey = "facilitiesEngineeringAccessUsers";
  const sessionKey = "facilitiesEngineeringCurrentUser";
  const pagesKey = "facilitiesEngineeringPages";
  const profileWidgetsKey = "facilitiesEngineeringProfileWidgets";
  const profilePagesKey = "facilitiesEngineeringProfilePages";
  const pagesVersionKey = "facilitiesEngineeringPagesVersion";
  const profileWidgetsVersionKey = "facilitiesEngineeringProfileWidgetsVersion";
  const profilePagesVersionKey = "facilitiesEngineeringProfilePagesVersion";
  const currentPagesVersion = "facilities-engineering-pages-2";
  const currentProfileWidgetsVersion = "facilities-engineering-widgets-4";
  const currentProfilePagesVersion = "facilities-engineering-pages-2";

  const defaultPages = [
    { id: "home", label: "Home", path: "../home/", description: "Public Facilities Engineering home page" },
    { id: "dashboard", label: "Facilities Engineering", path: "../dashboard/", description: "Facilities Engineering mission-control dashboard" },
    { id: "commandcenter", label: "Command Center", path: "../commandcenter/", description: "Project board, workstations, tasks, and shared Firestore data" },
    { id: "hvac-login", label: "Systems", path: "../lion-HopVAC/", description: "Systems workspace for building controls" },
    { id: "settings", label: "Administration", path: "../settings/", description: "Users, roles, Firebase rules, page access, and security requirements" }
  ];

  const profiles = [
    { id: "owner", label: "Owner" },
    { id: "admin", label: "Admin" },
    { id: "manager", label: "Manager" },
    { id: "tech", label: "Tech" },
    { id: "viewer", label: "Viewer" }
  ];
  const profileIds = new Set(profiles.map((profile) => profile.id));

  const widgets = [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Open the site-first Facilities Engineering landing page.",
      url: "#dashboard"
    },
    {
      id: "assets",
      label: "Assets",
      description: "Open asset records, asset health, and maintenance identity.",
      url: "https://assets.facilities-engineering.com/"
    },
    {
      id: "systems",
      label: "Systems",
      description: "Open live systems graphics and pressure-gauge views.",
      url: "../lion-HopVAC/"
    },
    {
      id: "lighting",
      label: "Lighting",
      description: "Open lighting zones, schedules, and controls.",
      url: "#lighting"
    },
    {
      id: "projects",
      label: "Projects",
      description: "Open projects, work orders, PM tasks, and delivery tracking.",
      url: "../commandcenter/"
    },
    {
      id: "work-orders",
      label: "Work Orders",
      description: "Open work orders, PM tasks, and maintenance tracking.",
      url: "#work-orders"
    },
    {
      id: "analytics",
      label: "Analytics",
      description: "Open trends, reporting, energy, and KPI dashboards.",
      url: "#analytics"
    },
    {
      id: "alarms",
      label: "Alarms",
      description: "Open active alarms, alarm routing, and notification queue status.",
      url: "#alarms"
    },
    {
      id: "wireless",
      label: "Wireless",
      description: "Open wireless gateways, LoRaWAN devices, and sensor connectivity.",
      url: "#wireless"
    },
    {
      id: "mail",
      label: "Mail",
      description: "Open inbox, alerts, templates, and Mail Settings.",
      url: "#mail"
    },
    {
      id: "johny",
      label: "Johny",
      description: "Open the AI assistant for site, systems, reports, and mail.",
      url: "#johny"
    },
    {
      id: "administration",
      label: "Administration",
      description: "Open users, integrations, system health, and notification settings.",
      url: "../settings/"
    }
  ];
  const widgetIds = new Set(widgets.map((widget) => widget.id));

  const defaultProfileWidgets = {
    owner: widgets.map((widget) => widget.id),
    admin: widgets.map((widget) => widget.id),
    manager: [
      "dashboard",
      "assets",
      "systems",
      "lighting",
      "projects",
      "work-orders",
      "alarms",
      "mail",
      "johny",
      "administration"
    ],
    tech: [
      "dashboard",
      "assets",
      "systems",
      "lighting",
      "projects",
      "work-orders",
      "alarms",
      "mail",
      "johny"
    ],
    viewer: [
      "dashboard",
      "assets",
      "systems",
      "projects",
      "analytics"
    ]
  };

  const defaultProfilePages = {
    owner: ["home", "dashboard", "commandcenter", "hvac-login", "settings"],
    admin: ["home", "dashboard", "commandcenter", "hvac-login", "settings"],
    manager: ["home", "dashboard", "commandcenter", "hvac-login"],
    tech: ["home", "dashboard", "commandcenter", "hvac-login"],
    viewer: ["home", "dashboard", "commandcenter"]
  };

  const defaultUsers = [
    {
      id: "tim-default",
      name: "Tim Ulibarri",
      email: "tim.ulibarri@c-openai.com",
      password: "",
      profile: "owner",
      active: true,
      pages: ["home", "dashboard", "commandcenter", "settings"]
    }
  ];

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function normalizePassword(password) {
    return String(password || "").trim();
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizePageRecord(page) {
    const id = slugify(page.id || page.label || page.path);
    if (!id) {
      return null;
    }

    return {
      id,
      label: String(page.label || id).trim(),
      path: String(page.path || "#").trim(),
      description: String(page.description || "").trim()
    };
  }

  function readPages() {
    const raw = localStorage.getItem(pagesKey);
    const shouldAddNewDefaults = localStorage.getItem(pagesVersionKey) !== currentPagesVersion;

    if (!raw) {
      writePages(defaultPages);
      return defaultPages.slice();
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const pageMap = new Map();
        parsed.forEach((page) => {
          const normalized = normalizePageRecord(page);
          if (normalized) pageMap.set(normalized.id, normalized);
        });

        if (shouldAddNewDefaults) {
          defaultPages.forEach((page) => {
            const normalized = normalizePageRecord(page);
            if (normalized && !pageMap.has(normalized.id)) {
              pageMap.set(normalized.id, normalized);
            }
          });
        }

        const pages = Array.from(pageMap.values());
        if (JSON.stringify(pages) !== raw || shouldAddNewDefaults) {
          writePages(pages);
        }
        return pages;
      }
    } catch (error) {
      console.warn("Unable to parse page registry", error);
    }

    writePages(defaultPages);
    return defaultPages.slice();
  }

  function writePages(pages) {
    const pageMap = new Map();
    (Array.isArray(pages) ? pages : defaultPages).forEach((page) => {
      const normalized = normalizePageRecord(page);
      if (normalized) pageMap.set(normalized.id, normalized);
    });

    defaultPages.forEach((page) => {
      const normalized = normalizePageRecord(page);
      if (normalized && !pageMap.has(normalized.id)) {
        pageMap.set(normalized.id, normalized);
      }
    });

    const normalizedPages = Array.from(pageMap.values());
    localStorage.setItem(pagesKey, JSON.stringify(normalizedPages));
    localStorage.setItem(pagesVersionKey, currentPagesVersion);
    return normalizedPages;
  }

  function normalizePages(pageList) {
    const pageIds = new Set(readPages().map((page) => page.id));
    const migrated = (Array.isArray(pageList) ? pageList : []).map((pageId) => {
      if (pageId === "fms") {
        return "dashboard";
      }
      return pageId;
    });

    return Array.from(new Set(migrated)).filter((pageId) => pageIds.has(pageId));
  }

  function normalizeProfile(profile) {
    const aliases = {
      administrator: "admin",
      engineer: "tech",
      "asset-manager": "manager",
      operator: "tech",
      read: "viewer",
      readonly: "viewer",
      "read-only": "viewer"
    };
    const normalized = String(profile || "").trim().toLowerCase().replace(/\s+/g, "-");
    if (aliases[normalized]) {
      return aliases[normalized];
    }
    if (profileIds.has(normalized)) {
      return normalized;
    }
    return "tech";
  }

  function profileLabel(profileId) {
    return profiles.find((profile) => profile.id === profileId)?.label || "Engineer";
  }

  function normalizeWidgetIds(widgetList) {
    const migrated = (Array.isArray(widgetList) ? widgetList : [])
      .map((widgetId) => {
        const aliases = {
          "team-projects": "dashboard",
          "asset-inventory": "assets",
          "preventive-maintenance": "projects",
          hvac: "systems",
          "vendor-tracker": "projects",
          "events-calendar": "dashboard",
          "pto-calendar": "dashboard",
          reports: "analytics",
          recorder: "work-orders",
          "fms-resources": "systems",
          "qr-inspector": "assets",
          settings: "administration",
          "credential-settings": "administration",
        };
        return aliases[widgetId] || widgetId;
      });

    return Array.from(new Set(migrated)).filter((widgetId) => widgetIds.has(widgetId));
  }

  function roleToProfile(user) {
    return normalizeProfile(user.profile || user.role || "engineer");
  }

  function normalizeUser(user) {
    const profile = roleToProfile(user);
    return {
      ...user,
      email: normalizeEmail(user.email),
      password: normalizePassword(user.password),
      profile,
      role: profileLabel(profile),
      pages: normalizePages(user.pages)
    };
  }

  function ensureDefaultUsers(users) {
    const normalizedUsers = users.map(normalizeUser);
    const defaultUser = normalizeUser(defaultUsers[0]);
    const defaultEmail = normalizeEmail(defaultUser.email);
    const existingIndex = normalizedUsers.findIndex((user) => normalizeEmail(user.email) === defaultEmail);

    if (existingIndex < 0) {
      return [defaultUser, ...normalizedUsers];
    }

    const existingUser = normalizedUsers[existingIndex];
    const mergedUser = {
      ...defaultUser,
      ...existingUser,
      password: existingUser.password || defaultUser.password,
      pages: existingUser.pages.length ? existingUser.pages : defaultUser.pages
    };
    const remainingUsers = normalizedUsers.filter((user, index) => index !== existingIndex);
    return [mergedUser, ...remainingUsers];
  }

  function readUsers() {
    const raw = localStorage.getItem(usersKey);
    if (!raw) {
      localStorage.setItem(usersKey, JSON.stringify(defaultUsers));
      return defaultUsers.slice();
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const users = ensureDefaultUsers(parsed);
        if (JSON.stringify(users) !== raw) {
          writeUsers(users);
        }
        return users;
      }
    } catch (error) {
      console.warn("Unable to parse access directory", error);
    }

    localStorage.setItem(usersKey, JSON.stringify(defaultUsers));
    return defaultUsers.slice();
  }

  function writeUsers(users) {
    localStorage.setItem(usersKey, JSON.stringify(users));
  }

  function readProfileWidgets() {
    const raw = localStorage.getItem(profileWidgetsKey);
    if (!raw) {
      localStorage.setItem(profileWidgetsKey, JSON.stringify(defaultProfileWidgets));
      localStorage.setItem(profileWidgetsVersionKey, currentProfileWidgetsVersion);
      return { ...defaultProfileWidgets };
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const shouldAddNewDefaults = localStorage.getItem(profileWidgetsVersionKey) !== currentProfileWidgetsVersion;
        const merged = profiles.reduce((settings, profile) => {
          const widgetIds = normalizeWidgetIds(parsed[profile.id] || defaultProfileWidgets[profile.id]);
          if (shouldAddNewDefaults) {
            defaultProfileWidgets[profile.id].forEach((widgetId) => {
              if (!widgetIds.includes(widgetId)) {
                widgetIds.push(widgetId);
              }
            });
          }
          settings[profile.id] = widgetIds;
          return settings;
        }, {});
        if (JSON.stringify(merged) !== raw || shouldAddNewDefaults) {
          writeProfileWidgets(merged);
        }
        return merged;
      }
    } catch (error) {
      console.warn("Unable to parse profile widget settings", error);
    }

    localStorage.setItem(profileWidgetsKey, JSON.stringify(defaultProfileWidgets));
    localStorage.setItem(profileWidgetsVersionKey, currentProfileWidgetsVersion);
    return { ...defaultProfileWidgets };
  }

  function writeProfileWidgets(profileWidgets) {
    const normalized = profiles.reduce((settings, profile) => {
      settings[profile.id] = normalizeWidgetIds(profileWidgets[profile.id]);
      return settings;
    }, {});
    localStorage.setItem(profileWidgetsKey, JSON.stringify(normalized));
    localStorage.setItem(profileWidgetsVersionKey, currentProfileWidgetsVersion);
    return normalized;
  }

  function readProfilePages() {
    const raw = localStorage.getItem(profilePagesKey);
    if (!raw) {
      localStorage.setItem(profilePagesKey, JSON.stringify(defaultProfilePages));
      localStorage.setItem(profilePagesVersionKey, currentProfilePagesVersion);
      return { ...defaultProfilePages };
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const shouldAddNewDefaults = localStorage.getItem(profilePagesVersionKey) !== currentProfilePagesVersion;
        const merged = profiles.reduce((settings, profile) => {
          const pageIds = normalizePages(parsed[profile.id] || defaultProfilePages[profile.id]);
          if (shouldAddNewDefaults) {
            defaultProfilePages[profile.id].forEach((pageId) => {
              if (!pageIds.includes(pageId)) {
                pageIds.push(pageId);
              }
            });
          }
          settings[profile.id] = pageIds;
          return settings;
        }, {});
        if (JSON.stringify(merged) !== raw || shouldAddNewDefaults) {
          writeProfilePages(merged);
        }
        return merged;
      }
    } catch (error) {
      console.warn("Unable to parse profile page settings", error);
    }

    localStorage.setItem(profilePagesKey, JSON.stringify(defaultProfilePages));
    localStorage.setItem(profilePagesVersionKey, currentProfilePagesVersion);
    return { ...defaultProfilePages };
  }

  function writeProfilePages(profilePages) {
    const normalized = profiles.reduce((settings, profile) => {
      settings[profile.id] = normalizePages(profilePages[profile.id]);
      return settings;
    }, {});
    localStorage.setItem(profilePagesKey, JSON.stringify(normalized));
    localStorage.setItem(profilePagesVersionKey, currentProfilePagesVersion);
    return normalized;
  }

  function findUserByEmail(email) {
    const normalized = normalizeEmail(email);
    return readUsers().find((user) => normalizeEmail(user.email) === normalized);
  }

  function findUserByCredentials(email, password) {
    const user = findUserByEmail(email);
    const normalizedPassword = normalizePassword(password);
    if (!user || !normalizedPassword) {
      return null;
    }

    if (!normalizePassword(user.password)) {
      return upsertUser({ ...user, password: normalizedPassword, active: true });
    }

    if (normalizePassword(user.password) !== normalizedPassword) {
      return null;
    }

    return user;
  }

  function getCurrentUser() {
    const session = readSession();
    if (!session) {
      return null;
    }

    const user = findUserByEmail(session.email);
    if (!user || !user.active) {
      clearSession();
      return null;
    }

    return user;
  }

  function userCanAccess(user, pageId) {
    return Boolean(user && user.active && getPageIdsForProfile(user.profile).includes(pageId));
  }

  function requirePageAccess(pageId, loginPath) {
    const user = getCurrentUser();
    if (!userCanAccess(user, pageId)) {
      clearSession();
      window.location.replace(loginPath || "../login/");
      return null;
    }

    return user;
  }

  function saveSession(user) {
    localStorage.setItem(sessionKey, JSON.stringify({
      id: user.id,
      name: user.name,
      email: normalizeEmail(user.email),
      profile: normalizeProfile(user.profile),
      pages: getPageIdsForProfile(user.profile)
    }));
  }

  function readSession() {
    const raw = localStorage.getItem(sessionKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      localStorage.removeItem(sessionKey);
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(sessionKey);
  }

  function getAllowedPages(user) {
    if (!user) {
      return [];
    }

    const allowed = new Set(getPageIdsForProfile(user.profile));
    return readPages().filter((page) => allowed.has(page.id));
  }

  function getPageIdsForProfile(profileId) {
    const assignments = readProfilePages();
    return assignments[normalizeProfile(profileId)] || [];
  }

  function getPagesForProfile(profileId) {
    const allowed = new Set(getPageIdsForProfile(profileId));
    return readPages().filter((page) => allowed.has(page.id));
  }

  function getWidgetsForProfile(profileId) {
    const assignments = readProfileWidgets();
    const allowed = new Set(assignments[normalizeProfile(profileId)] || []);
    return widgets.filter((widget) => allowed.has(widget.id));
  }

  function getWidgetsForUser(user) {
    return getWidgetsForProfile((user && user.profile) || "engineer");
  }

  function upsertUser(input) {
    const users = readUsers();
    const email = normalizeEmail(input.email);
    const existingIndex = users.findIndex((user) => normalizeEmail(user.email) === email);
    const profile = normalizeProfile(input.profile || input.role);
    const nextUser = {
      id: existingIndex >= 0 ? users[existingIndex].id : `user-${Date.now()}`,
      name: String(input.name || "").trim(),
      email,
      password: normalizePassword(input.password),
      profile,
      role: profileLabel(profile),
      active: Boolean(input.active),
      pages: getPageIdsForProfile(profile)
    };

    if (existingIndex >= 0) {
      users[existingIndex] = nextUser;
    } else {
      users.push(nextUser);
    }

    writeUsers(users);
    return nextUser;
  }

  function deleteUser(id) {
    const users = readUsers().filter((user) => user.id !== id);
    writeUsers(users);
  }

  window.AccessDirectory = {
    get pages() {
      return readPages();
    },
    profiles,
    widgets,
    readPages,
    writePages,
    readUsers,
    writeUsers,
    readProfileWidgets,
    writeProfileWidgets,
    readProfilePages,
    writeProfilePages,
    findUserByEmail,
    findUserByCredentials,
    getCurrentUser,
    userCanAccess,
    requirePageAccess,
    saveSession,
    readSession,
    clearSession,
    getAllowedPages,
    getPageIdsForProfile,
    getPagesForProfile,
    getWidgetsForProfile,
    getWidgetsForUser,
    upsertUser,
    deleteUser,
    normalizeEmail,
    normalizePassword,
    normalizeProfile,
    profileLabel
  };
}());
