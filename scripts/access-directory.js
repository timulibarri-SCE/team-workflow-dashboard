(function () {
  const usersKey = "facilitiesEngineeringAccessUsers";
  const sessionKey = "facilitiesEngineeringCurrentUser";
  const profileWidgetsKey = "facilitiesEngineeringProfileWidgets";
  const profilePagesKey = "facilitiesEngineeringProfilePages";
  const profileWidgetsVersionKey = "facilitiesEngineeringProfileWidgetsVersion";
  const profilePagesVersionKey = "facilitiesEngineeringProfilePagesVersion";
  const currentProfileWidgetsVersion = "lion-hopvac-4";
  const currentProfilePagesVersion = "lion-hopvac-4";

  const pages = [
    { id: "home", label: "Home", path: "../home/", description: "Public Facilities Engineering home page" },
    { id: "dashboard", label: "Team Dashboard", path: "../dashboard/", description: "Team dashboard and operating resources" },
    { id: "hvac-login", label: "Lion-HopVAC", path: "../lion-HopVAC/", description: "HopVAC FUXA workspace for the ABM Lion BMS" },
    { id: "settings", label: "Settings", path: "../settings/", description: "Login, profile, page, and widget access management" }
  ];
  const pageIds = new Set(pages.map((page) => page.id));

  const profiles = [
    { id: "engineer", label: "Engineer" },
    { id: "manager", label: "Manager" },
    { id: "administrator", label: "Administrator" },
    { id: "asset-manager", label: "Asset Manager" }
  ];
  const profileIds = new Set(profiles.map((profile) => profile.id));

  const widgets = [
    {
      id: "team-projects",
      label: "Team Projects",
      description: "Open the project tracker for active facility work.",
      url: "#team-projects"
    },
    {
      id: "work-orders",
      label: "Work Orders",
      description: "Open the external work-order system.",
      url: "https://example.com/work-orders"
    },
    {
      id: "asset-inventory",
      label: "Asset Inventory",
      description: "Open the asset inventory and equipment records system.",
      url: "https://example.com/asset-inventory"
    },
    {
      id: "preventive-maintenance",
      label: "Preventive Maintenance",
      description: "Open preventive maintenance schedules and task plans.",
      url: "https://example.com/preventive-maintenance"
    },
    {
      id: "hvac",
      label: "HopVAC",
      description: "Open the HopVAC controller workspace.",
      url: "../lion-HopVAC/"
    },
    {
      id: "vendor-tracker",
      label: "Vendor Tracker",
      description: "Open vendor deliverables, contacts, and follow-ups.",
      url: "#vendor-tracker"
    },
    {
      id: "events-calendar",
      label: "Events Calendar",
      description: "Open upcoming reviews, planning events, and milestones.",
      url: "#events-calendar"
    },
    {
      id: "pto-calendar",
      label: "PTO Calendar",
      description: "Open PTO and coverage planning.",
      url: "#pto-calendar"
    },
    {
      id: "reports",
      label: "Reports",
      description: "Open dashboard reports and leadership summaries.",
      url: "https://example.com/reports"
    },
    {
      id: "fms-resources",
      label: "FMS Resources",
      description: "Open facility systems and operating resources.",
      url: "https://example.com/fms-resources"
    },
    {
      id: "qr-inspector",
      label: "QR Inspector",
      description: "Open the QR inspection tool.",
      url: "qr-reader.html"
    },
    {
      id: "settings",
      label: "Settings",
      description: "Open profile, login, page, and widget settings.",
      url: "../settings/"
    }
  ];
  const widgetIds = new Set(widgets.map((widget) => widget.id));

  const defaultProfileWidgets = {
    engineer: [
      "team-projects",
      "work-orders",
      "preventive-maintenance",
      "hvac",
      "vendor-tracker",
      "events-calendar",
      "qr-inspector"
    ],
    manager: [
      "team-projects",
      "work-orders",
      "hvac",
      "vendor-tracker",
      "events-calendar",
      "pto-calendar",
      "reports"
    ],
    administrator: widgets.map((widget) => widget.id),
    "asset-manager": [
      "asset-inventory",
      "work-orders",
      "preventive-maintenance",
      "hvac",
      "vendor-tracker",
      "fms-resources",
      "qr-inspector",
      "reports"
    ]
  };

  const defaultProfilePages = {
    engineer: ["home", "dashboard", "hvac-login"],
    manager: ["home", "dashboard", "hvac-login"],
    administrator: ["home", "dashboard", "hvac-login", "settings"],
    "asset-manager": ["home", "dashboard", "hvac-login"]
  };

  const defaultUsers = [
    {
      id: "tim-default",
      name: "Tim Ulibarri",
      email: "tim.ulibarri@c-openai.com",
      password: "",
      profile: "administrator",
      active: true,
      pages: ["home", "dashboard", "settings"]
    }
  ];

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function normalizePassword(password) {
    return String(password || "").trim();
  }

  function normalizePages(pageList) {
    const migrated = (Array.isArray(pageList) ? pageList : []).map((pageId) => {
      if (pageId === "fms") {
        return "dashboard";
      }
      return pageId;
    });

    return Array.from(new Set(migrated)).filter((pageId) => pageIds.has(pageId));
  }

  function normalizeProfile(profile) {
    const normalized = String(profile || "").trim().toLowerCase().replace(/\s+/g, "-");
    if (profileIds.has(normalized)) {
      return normalized;
    }
    return "engineer";
  }

  function profileLabel(profileId) {
    return profiles.find((profile) => profile.id === profileId)?.label || "Engineer";
  }

  function normalizeWidgetIds(widgetList) {
    const migrated = (Array.isArray(widgetList) ? widgetList : [])
      .map((widgetId) => widgetId === "credential-settings" ? "settings" : widgetId);

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
          if (
            shouldAddNewDefaults &&
            defaultProfileWidgets[profile.id].includes("hvac") &&
            !widgetIds.includes("hvac")
          ) {
            widgetIds.push("hvac");
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
          if (
            shouldAddNewDefaults &&
            defaultProfilePages[profile.id].includes("hvac-login") &&
            !pageIds.includes("hvac-login")
          ) {
            pageIds.push("hvac-login");
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
    return pages.filter((page) => allowed.has(page.id));
  }

  function getPageIdsForProfile(profileId) {
    const assignments = readProfilePages();
    return assignments[normalizeProfile(profileId)] || [];
  }

  function getPagesForProfile(profileId) {
    const allowed = new Set(getPageIdsForProfile(profileId));
    return pages.filter((page) => allowed.has(page.id));
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
    pages,
    profiles,
    widgets,
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
