const COMMAND_CENTER_CONFIG = {
  folderId: "1ww8rUXsbrb3v_FrbdthnUSENBdDS_Ct4",
  fileName: "command-center-data.json",
  namespace: "commandcenter",
};

function doGet(e) {
  const action = getParameter_(e, "action") || "read";

  try {
    if (action === "health") {
      return respond_({ ok: true, service: "command-center-sync" }, getParameter_(e, "callback"));
    }

    if (action === "syncCalendar") {
      return respond_(syncCalendar_(), getParameter_(e, "callback"));
    }

    return respond_(readState_(), getParameter_(e, "callback"));
  } catch (error) {
    return respond_(toError_(error), getParameter_(e, "callback"));
  }
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    return respond_(writeState_(payload));
  } catch (error) {
    return respond_(toError_(error));
  }
}

function setupCommandCenterStore() {
  const file = getDataFile_(true);
  return {
    ok: true,
    fileName: file.getName(),
    fileUrl: file.getUrl(),
  };
}

function authorizeCalendarAccess() {
  const calendar = CalendarApp.getDefaultCalendar();
  return {
    ok: true,
    calendarName: calendar.getName(),
  };
}

function readState_() {
  const file = getDataFile_(false);
  if (!file) {
    return {
      ok: true,
      empty: true,
      namespace: COMMAND_CENTER_CONFIG.namespace,
      version: 0,
      updatedAt: "",
      updatedBy: "",
      calendar: {},
      tasks: [],
    };
  }

  const raw = file.getBlob().getDataAsString() || "{}";
  const state = JSON.parse(raw);

  return {
    ok: true,
    empty: !Array.isArray(state.tasks) || state.tasks.length === 0,
    namespace: state.namespace || COMMAND_CENTER_CONFIG.namespace,
    version: Number(state.version) || 0,
    updatedAt: state.updatedAt || "",
    updatedBy: state.updatedBy || "",
    calendar: state.calendar || {},
    tasks: Array.isArray(state.tasks) ? state.tasks : [],
  };
}

function writeState_(payload) {
  if (!payload || payload.namespace !== COMMAND_CENTER_CONFIG.namespace) {
    throw new Error("Invalid Command Center namespace.");
  }

  if (!Array.isArray(payload.tasks)) {
    throw new Error("Command Center payload must include a tasks array.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const current = readState_();
    const nextState = {
      ok: true,
      namespace: COMMAND_CENTER_CONFIG.namespace,
      version: (Number(current.version) || 0) + 1,
      updatedAt: payload.updatedAt || new Date().toISOString(),
      updatedBy: payload.clientId || "unknown-client",
      calendar: current.calendar || {},
      tasks: payload.tasks,
    };

    const file = getDataFile_(true);
    file.setContent(JSON.stringify(nextState, null, 2));
    return nextState;
  } finally {
    lock.releaseLock();
  }
}

function getDataFile_(createIfMissing) {
  const folder = DriveApp.getFolderById(COMMAND_CENTER_CONFIG.folderId);
  const files = folder.getFilesByName(COMMAND_CENTER_CONFIG.fileName);

  if (files.hasNext()) {
    return files.next();
  }

  if (!createIfMissing) {
    return null;
  }

  return folder.createFile(
    COMMAND_CENTER_CONFIG.fileName,
    JSON.stringify({
      namespace: COMMAND_CENTER_CONFIG.namespace,
      version: 0,
      updatedAt: "",
      updatedBy: "",
      calendar: {},
      tasks: [],
    }, null, 2),
    MimeType.PLAIN_TEXT
  );
}

function syncCalendar_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const state = readState_();
    if (!Array.isArray(state.tasks) || state.tasks.length === 0) {
      return {
        ok: true,
        created: 0,
        updated: 0,
        skipped: 0,
        tasks: [],
        calendar: state.calendar || {},
        version: Number(state.version) || 0,
      };
    }

    const calendar = CalendarApp.getDefaultCalendar();
    const summary = {
      created: 0,
      updated: 0,
      skipped: 0,
      syncedAt: new Date().toISOString(),
      calendarName: calendar.getName(),
    };

    walkTasks_(state.tasks, function(task, parent) {
      if (task.status === "Complete") {
        summary.skipped += 1;
        return;
      }

      const dueDate = parseDueDate_(task.due);
      if (!dueDate) {
        summary.skipped += 1;
        return;
      }

      const eventTitle = `[${task.team || "Work"}] ${task.title || "Untitled task"}`;
      const description = buildCalendarDescription_(task, parent);
      let event = task.calendarEventId ? calendar.getEventById(task.calendarEventId) : null;

      if (event) {
        event.setTitle(eventTitle);
        event.setDescription(description);
        event.setAllDayDate(dueDate);
        summary.updated += 1;
      } else {
        event = calendar.createAllDayEvent(eventTitle, dueDate, {
          description: description,
        });
        task.calendarEventId = event.getId();
        summary.created += 1;
      }

      task.calendarSyncedAt = summary.syncedAt;
    });

    const nextState = {
      ok: true,
      namespace: COMMAND_CENTER_CONFIG.namespace,
      version: (Number(state.version) || 0) + 1,
      updatedAt: summary.syncedAt,
      updatedBy: "calendar-sync",
      calendar: summary,
      tasks: state.tasks,
    };

    const file = getDataFile_(true);
    file.setContent(JSON.stringify(nextState, null, 2));
    return nextState;
  } finally {
    lock.releaseLock();
  }
}

function walkTasks_(tasks, callback) {
  tasks.forEach(function(task) {
    callback(task, null);
    (Array.isArray(task.subtasks) ? task.subtasks : []).forEach(function(subtask) {
      callback(subtask, task);
    });
  });
}

function parseDueDate_(value) {
  const match = String(value || "").trim().match(/^([A-Za-z]{3,9})\s+(\d{1,2})$/);
  if (!match) {
    return null;
  }

  const date = new Date(`${match[1]} ${match[2]}, ${new Date().getFullYear()}`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function buildCalendarDescription_(task, parent) {
  const lines = [
    task.description || "",
    task.notes ? `Notes: ${task.notes}` : "",
    parent ? `Parent task: ${parent.title}` : "",
    task.assignee ? `Assignee: ${task.assignee}` : "",
    task.status ? `Status: ${task.status}` : "",
    task.priority ? `Priority: ${task.priority}` : "",
    `Command Center ID: ${task.id}`,
  ];

  return lines.filter(Boolean).join("\n");
}

function parsePayload_(e) {
  const raw =
    e && e.postData && e.postData.contents
      ? e.postData.contents
      : getParameter_(e, "data") || "{}";
  return JSON.parse(raw);
}

function getParameter_(e, name) {
  return e && e.parameter ? e.parameter[name] : "";
}

function respond_(payload, callback) {
  const json = JSON.stringify(payload);
  const callbackName = String(callback || "");

  if (/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callbackName)) {
    return ContentService.createTextOutput(`${callbackName}(${json});`).setMimeType(
      ContentService.MimeType.JAVASCRIPT,
    );
  }

  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function toError_(error) {
  return {
    ok: false,
    error: error && error.message ? error.message : String(error),
  };
}
