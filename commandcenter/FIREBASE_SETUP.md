# Command Center Firebase Setup

This is the production database path for Command Center accounts, roles, and shared task state.

Drive folder for database setup artifacts:

https://drive.google.com/drive/folders/1zja8ZdT4tiZ8-yTSi17JepBez493WkSC

## Firebase Project

1. Open the Firebase console.
2. Create or select a project for `Facilities Engineering`.
3. Add a Web app for `Command Center`.
4. Enable Authentication providers:
   - Email/password
   - Google, if the team should sign in with Google accounts
5. Create a Firestore database in production mode.
6. Copy the web app Firebase config into `commandcenter/firebase-config.js`.
7. Set `enabled` to `true`.

The public Firebase web config is safe to ship in the static page. Security comes from Firebase Auth and Firestore Security Rules, not from hiding the config.

## Deploy Rules

Install and authenticate the Firebase CLI, then run:

```bash
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy --only firestore
```

The repo includes:

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`

## Seed The First Owner

The rules intentionally do not let a random signed-in user make themselves an admin. After the first account is created in Firebase Authentication, create this Firestore document manually from the Firebase console:

Path:

```text
orgs/facilities-engineering/members/USER_UID
```

Fields:

```json
{
  "displayName": "Tim Ulibarri",
  "email": "tim@example.com",
  "role": "owner",
  "status": "active",
  "createdAt": "2026-06-29T00:00:00.000Z"
}
```

Use the actual Firebase Authentication UID and email.

## Roles

- `owner`: full database and member administration
- `admin`: full database and member administration
- `manager`: read and write Command Center work
- `tech`: read and write Command Center work
- `viewer`: read only

## Data Paths

The app currently writes the board state here so it can migrate without a risky UI rewrite:

```text
orgs/facilities-engineering/commandCenter/state
```

Backups are written before each shared overwrite:

```text
orgs/facilities-engineering/commandCenter/state/backups/{backupId}
```

The rules also reserve proper collection paths for the next schema step:

```text
orgs/facilities-engineering/tasks/{taskId}
orgs/facilities-engineering/workstreams/{workstreamId}
orgs/facilities-engineering/activityLog/{eventId}
orgs/facilities-engineering/settings/{settingId}
```

## Legacy Drive Bridge

The Apps Script bridge is still present as a fallback. Its Drive folder is now set to the database folder above so any legacy JSON state and backups stay in the same place while Firebase is activated.
