# E.D.I.T.H. Privacy Monitor

E.D.I.T.H. is a privacy-focused dashboard that helps users review which mobile apps are collecting too much personal data and whether those permissions are actually necessary. The application presents a clear overview of installed apps, their permission usage, privacy risk, and trust score. It is designed to look and behave like a mobile app permissions control center, while keeping the logic simple enough to understand and extend.

This project is a React + Vite frontend that can either work with a live backend API or fall back to local mock data. The UI is intentionally interactive: users can inspect an app in detail, toggle permissions on or off, block risky access, and simulate suspicious behavior to see how the trust score changes.

## What this app does

The app is built around one core idea: every app should be accountable for the data it requests.

Instead of just showing a static list of applications, E.D.I.T.H.:

- Groups apps into risk categories: Safe, Caution, and Dangerous
- Displays a trust score from 0 to 100 for each app
- Lists the permissions each app requests
- Explains why the score was assigned in plain language
- Shows a timeline of suspicious or questionable app activity
- Lets the user block or allow permissions with a single click
- Allows a "danger simulation" that mimics a background contact access attempt
- Shows a floating alert banner when suspicious behavior is detected

This makes the app useful both as a demo and as a concept for a real privacy dashboard.

## Tech stack

- React 19
- Vite
- JavaScript (ES modules)
- Tailwind CSS
- Lucide React icons
- Fetch API for backend communication

## App architecture

The frontend is composed of a small set of reusable components and a single main app state manager.

### Main flow

The central logic lives in [src/App.jsx](src/App.jsx). It keeps the application state:

- `apps`: the list of apps currently shown
- `selectedApp`: the currently opened app details screen
- `searchQuery`: the search term for filtering apps
- `activeZone`: the active risk filter (`ALL`, `RISKY`, `CAUTION`, `SAFE`)
- `currentAlert`: the currently displayed alert toast
- `loading`: whether the app data is still loading

The component loads data from the backend when available and falls back to local seed data when the API is unavailable.

## Data source and fallback behavior

The project expects a backend service at `http://localhost:5000/api`, as defined in [src/services/api.js](src/services/api.js).

The main API calls are:

- `fetchAppsData()`
  - `GET /api/apps`
  - If it fails, it logs a warning and returns `initialApps`
- `updateAppPermission(appId, permissionName, status)`
  - `PATCH /api/apps/:appId/permissions`
  - Sends permission updates to the backend

This means the frontend is designed to be resilient: even when the backend is offline, the app still works using the static mock dataset in [src/data/appsData.js](src/data/appsData.js).

## Seed data model

The mock dataset is the real contract the app expects. Each app object contains:

- `id`: unique identifier
- `name`: display name
- `category`: category label
- `icon`: emoji used for the app tile
- `trustScore`: numeric score from 0 to 100
- `status`: one of `Safe`, `Caution`, `Dangerous`, or `Needs Review`
- `installDate`: relative time string
- `permissions`: array of permission objects
- `timeline`: activity log entries
- `plainExplanation`: human-readable explanation of why the app has that score

Each permission entry looks like this:

- `name`: permission name such as Contacts, Location, Camera
- `status`: `allowed` or `restricted`
- `risk`: `LOW`, `MEDIUM`, or `HIGH`
- `purpose`: description of why the permission is needed

Each timeline event includes:

- `time`
- `event`
- `severity`: `LOW`, `MEDIUM`, or `HIGH`

## Trust score logic

The most important business logic is implemented in `calculateAppHealth()` inside [src/App.jsx](src/App.jsx).

The scoring is a simple heuristic model based on active risky permissions:

- If there are no allowed permissions, the app is considered fully safe and gets a score of `100`
- Otherwise, score starts at `100`
- Each high-risk allowed permission subtracts `25` points
- Each non-high-risk allowed permission subtracts `5` points
- The score is clamped to a minimum of `20`

Pseudo-logic:

```js
const allowedPerms = updatedPermissions.filter(p => p.status === 'allowed');
const allowedRisky = allowedPerms.filter(p => p.risk === 'HIGH');

if (allowedPerms.length === 0) {
  return { score: 100, status: 'Safe' };
}

let score = 100 - (allowedRisky.length * 25) - ((allowedPerms.length - allowedRisky.length) * 5);
score = Math.max(score, 20);
```

Status thresholds:

- `score < 50` => `Dangerous`
- `score < 80` => `Caution`
- otherwise => `Safe`

This is intentionally lightweight and easy to understand. It is not a production-grade security model, but it is perfect for a frontend demo and a clear teaching example.

## UI and component breakdown

### Navbar

The [src/components/Navbar.jsx](src/components/Navbar.jsx) component provides the top bar for the app. It includes the brand, app title, and a reset action for returning the app list to the default seed state.

### RiskSummary

The [src/components/RiskSummary.jsx](src/components/RiskSummary.jsx) component displays three summary cards:

- Needs Attention
- Review Recommended
- Safe & Normal

Each card is clickable and toggles a filter for the app list.

### AppCard

The [src/components/AppCard.jsx](src/components/AppCard.jsx) component renders each app entry in the main dashboard. It shows:

- app icon
- app name and category
- trust score badge
- permission chips
- current status
- a “Manage” action area

### AppDetail

The [src/components/AppDetail.jsx](src/components/AppDetail.jsx) component is the expanded screen for one app. It includes:

- app summary banner with score
- plain-language explanation
- permission list with allow/block buttons
- a “Turn Off Risky Permissions” call-to-action
- recent app activity timeline
- a button to simulate a privacy violation

### AlertToast

The [src/components/AlertToast.jsx](src/components/AlertToast.jsx) component is a floating banner that appears when something suspicious happens. It usually displays the app name, permission being blocked, and a short reason. The user can dismiss it or block the permission immediately.

## App behavior and interactions

### Permission toggling

When a user clicks a permission control, `handleTogglePermission()` in [src/App.jsx](src/App.jsx) performs two actions:

1. It updates the app permission status (allowed or restricted)
2. It recomputes the app's trust score and status
3. It syncs the change to the backend if the backend is available

This makes the dashboard feel live and reactive.

### Fix risky permissions

`handleFixRisky(appId)` automatically switches all high-risk permissions to `restricted` and recalculates the score.

This is useful for a quick remediation flow.

### Simulated attack

`handleSimulate(appId)` simulates a suspicious event—such as a hidden contact list read in the background. When triggered:

- the app trust score is reduced
- the status becomes `Dangerous`
- the timeline gains a new high-severity event
- an alert banner appears telling the user what happened

This demonstrates how the app could react to privacy violations.

### Search and filtering

The dashboard supports two layers of filtering:

- text search by app name or category
- risk group filter (`ALL`, `RISKY`, `CAUTION`, `SAFE`)

The filter logic lives inside the `filteredApps` calculation in [src/App.jsx](src/App.jsx).

## Folder structure

```text
NITSHACKS/
├── public/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── App.css
│   ├── components/
│   │   ├── AlertToast.jsx
│   │   ├── AppCard.jsx
│   │   ├── AppDetail.jsx
│   │   ├── Navbar.jsx
│   │   └── RiskSummary.jsx
│   ├── data/
│   │   └── appsData.js
│   ├── services/
│   │   └── api.js
│   └── assets/
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── README.md
└── package-lock.json
```

## Installation and running locally

From the project root:

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal, typically:

```text
http://localhost:5173
```

## Production build

To generate a production bundle:

```bash
npm run build
```

To preview the built app:

```bash
npm run preview
```

## Notes on project intent

This project is best understood as a privacy awareness demo. It is not a full mobile operating system permission manager, and it does not perform actual system-level monitoring. Instead, it provides a realistic user interface and persuasive logic for demonstrating how a privacy dashboard could help people understand, monitor, and remediate app data access.

The idea is to turn technical permission data into something understandable and actionable. The design emphasizes clarity over complexity: users can immediately see which apps are risky, why they are risky, and how to respond.

## Summary

E.D.I.T.H. is a front-end privacy monitoring dashboard that gives users visibility into app behavior, permission requests, and risk exposure. It combines a clean visual layout with a simple trust model to make privacy decisions easier to understand and act on.

It is particularly valuable for:

- product demos
- privacy awareness education
- prototype app security dashboards
- UX experiments around transparency and permission visibility

If you extend the project further, the most natural next steps would be:

- connecting the frontend to a real backend database
- adding authentication and role-based access
- introducing real analytics for permission events
- creating a more advanced scoring model based on historical behavior and risk categories
