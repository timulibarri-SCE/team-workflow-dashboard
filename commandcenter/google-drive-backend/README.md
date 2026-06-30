# Command Center Google Drive Sync

This Apps Script stores the Command Center task grid in the shared Google Drive database folder as `command-center-data.json`.

Database folder:

https://drive.google.com/drive/folders/1zja8ZdT4tiZ8-yTSi17JepBez493WkSC

## Deploy

1. Open [script.google.com](https://script.google.com/).
2. Create a new Apps Script project named `Command Center Sync`.
3. Replace the starter code with `Code.gs` from this folder.
4. Run `setupCommandCenterStore` once and approve the Drive permissions.
5. Deploy as a Web App.
6. Set `Execute as` to the owner account.
7. Set access to the team scope you want, then copy the `/exec` Web App URL.
8. Put that URL in `sync-config.js` as `endpoint`.

The frontend can also be connected once by visiting:

```text
https://www.facilities-engineering.com/commandcenter/?syncEndpoint=WEB_APP_EXEC_URL
```

After the endpoint is saved in the browser, the app polls Google Drive for updates and pushes local edits to the shared JSON file.
