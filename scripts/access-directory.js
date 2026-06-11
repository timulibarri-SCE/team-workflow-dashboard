(function () {
  const usersKey = "facilitiesEngineeringAccessUsers";
  const sessionKey = "facilitiesEngineeringCurrentUser";
  const profileWidgetsKey = "facilitiesEngineeringProfileWidgets";
  const profilePagesKey = "facilitiesEngineeringProfilePages";
  const profileWidgetsVersionKey = "facilitiesEngineeringProfileWidgetsVersion";
  const profilePagesVersionKey = "facilitiesEngineeringProfilePagesVersion";
  const currentProfileWidgetsVersion = "facilities-engineering-1";
  const currentProfilePagesVersion = "facilities-engineering-1";

  const pages = [
    { id: "home", label: "Home", path: "../home/", description: "Public Facilities Engineering home page" },
    { id: "dashboard", label: "Facilities Engineering", path: "../dashboard/", description: "Facilities Engineering mission-control dashboard" },
    { id: "hvac-login", label: "Systems", path: "../lion-HopVAC/", description: "Systems workspace for building controls" },
    { id: "settings", label: "Administration", path: "../settings/", description: "Users, profiles, page access, and widget access" }
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
      id: "dashboard",
      label: "Dashboard",
      description: "Open the site-first Facilities Engineering landing page.",
      url: "#dashboard"
    },
    {
      id: "assets",
      label: "Assets",
      description: "Open asset records, asset health, and maintenance identity.",
      url: "http://192.168.0.6:3010"
    },
    {
      id: "systems",
      label: "Systems",
      description: "Open live systems graphics and pressure-gauge views.",
      url: "http://192.168.0.6:1881"
    },
    {
      id: "projects",
      label: "Projects",
      description: "Open projects, work orders, PM tasks, and delivery tracking.",
      url: "http://192.168.0.6:8081"
    },
    {
      id: "analytics",
      label: "Analytics",
      description: "Open trends, reporting, energy, and KPI dashboards.",
      url: "http://192.168.0.6:3001"
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
      url: "http://192.168.0.6:8083"
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
      url: "http://192.168.0.6:3000"
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
    engineer: [
      "dashboard",
      "assets",
      "systems",
      "projects",
      "alarms",
      "mail",
      "johny"
    ],
    manager: [
      "dashboard",
      "projects",
      "analytics",
      "alarms",
      "mail",
      "johny",
      "administration"
    ],
    administrator: widgets.map((widget) => widget.id),
    "asset-manager": [
      "dashboard",
      "assets",
      "systems",
      "projects",
      "analytics",
      "alarms",
      "mail"
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
      .map((widgetId) => {
        const aliases = {
          "team-projects": "dashboard",
          "work-orders": "projects",
          "asset-inventory": "assets",
          "preventive-maintenance": "projects",
          hvac: "systems",
          "vendor-tracker": "projects",
          "events-calendar": "dashboard",
          "pto-calendar": "dashboard",
          reports: "analytics",
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
