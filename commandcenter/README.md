# FES Command Center

Static prototype for the FES project management app. It is designed for GitHub Pages and uses plain HTML, CSS, and JavaScript so it can be uploaded without a build step.

## What Is Included

- Black/green command sidebar
- Polished dense task table
- Parent tasks with expandable subtasks
- In-grid descriptions
- Always-visible notes boxes on subtask rows
- Attachment icon/count column
- Row-based due date labels
- Circular completion indicators with no visible numbers
- Workstream filters, search, active/due/all views
- Sample facilities/engineering workflow data
- Editable task names, descriptions, and subtask notes
- Shared-storage sync adapter with browser-local fallback
- Google Drive Apps Script backend files

## File Repository

Use this Google Drive folder as the shared file repository:

https://drive.google.com/drive/folders/1ww8rUXsbrb3v_FrbdthnUSENBdDS_Ct4?usp=drive_link

The prototype opens this folder from the file toolbar button and attachment-count buttons.

## Local Preview

Open `index.html` in a browser.

If the icon CDN is blocked, the app still works, but icons may not render.

## Published URL

Target path:

https://www.facilities-engineering.com/commandcenter/

## GitHub Pages Upload

1. Create a new GitHub repository.
2. Upload the contents of this `project-manager-app` folder to the repository root.
3. In GitHub, go to `Settings -> Pages`.
4. Set the source to the default branch and root folder.
5. Save, then open the published GitHub Pages URL.

## Google Backend

The app now supports a Google Drive-backed sync bridge:

```text
Frontend on GitHub Pages
  -> Google Apps Script Web App
  -> command-center-data.json in Google Drive folder 1ww8rUXsbrb3v_FrbdthnUSENBdDS_Ct4
  -> Google Drive folder for attachments
  -> future Google Calendar due-date sync
```

Deploy the Apps Script in `google-drive-backend/Code.gs`, then put the `/exec` Web App URL in `sync-config.js`.

Keep `completion` as a numeric backend value, but display it as a circular indicator with no visible number in the table.

## Editing Behavior

The app saves edits locally immediately, then pushes them to the Google backend when `sync-config.js` has an Apps Script endpoint. Other browsers poll that shared copy and update automatically.

Editable now:

- Task names
- Main task descriptions
- Subtask descriptions
- Subtask notes
- Added tasks
- Added subtasks
- Expanded/collapsed state

If the Google endpoint is blank, the page stays in local-only mode and remains usable for prototype testing.
