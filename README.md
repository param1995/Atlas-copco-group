# Compressor Operations Dashboard

A local compressor telemetry dashboard built with Angular and Electron, backed by a Node.js/Express API.

## Requirements

- Node.js 22.x (recommended for Angular 19)
- npm

## Setup

From the repository root, install all workspace dependencies:

```bash
npm install
```

Start the backend in one terminal:

```bash
run : npm run dev 
or
npm --prefix backend run dev
```

Start the Angular renderer in an Electron window in another terminal:

```bash
npm --prefix frontend/desktop start
```

The backend listens on `http://localhost:3000`; the Angular development server listens on `http://127.0.0.1:4200`. The Electron development launcher starts Angular and opens its URL. The backend must be started separately.

To run the renderer in a browser instead, keep the backend running and use:

```bash
npm --prefix frontend/desktop run start:web
```

Then open `http://127.0.0.1:4200`.

## Build And Test

Build the backend and Angular renderer:

```bash
npm run build
```

Run backend tests:

```bash
npm run test:api
```

Run desktop tests once:

```bash
npm --prefix frontend/desktop test -- --watch=false
```

To build Angular and open the build in Electron, start the backend and run:

```bash
npm --prefix frontend/desktop run electron:preview
```

This preview command does not create a packaged installer.

## Backend API Endpoints

The backend API runs locally on port `3000`.

### Dashboard API

Returns the current compressor telemetry snapshot and historical samples.

```text
GET http://localhost:3000/api/dashboard
```

### Health API

Checks whether the backend API is running.

```text
GET http://localhost:3000/api/health
```

### API Base URL

```text
http://localhost:3000
```

The Angular application communicates with these endpoints through `/api`. During Angular development, the development proxy forwards `/api` requests to the local backend running on port `3000`.

## Architecture

```text
backend/                 Node.js + Express API
  src/index.ts           Health and dashboard endpoints
frontend/desktop/            Angular + Electron desktop application
  electron/               Electron main, preload, and dev launcher
  src/                    Angular renderer and telemetry UI
    app/dashboard/        Lazy-loaded Overview route
    app/trends/           Lazy-loaded charts and history route
    app/services/         Shared dashboard data store
shared/                   Shared workspace packages
```

- Angular Router lazy-loads the Overview at `/` and Trends at `/trends`. A root-scoped dashboard store keeps polling, theme, and unit-selection state alive while navigating between routes.
- The Express service owns `GET /api/health` and `GET /api/dashboard` on port 3000.
- The in-memory simulator generates a timestamped reading every second, randomly varies values by up to about 10% for five cycles, then gradually returns them to baseline over five cycles. It runs independently of API requests and retains the newest 100 server samples; the renderer polls once per second and plots independent line charts for velocity, pressure, temperature, and flow.
- Angular renders the dashboard and requests telemetry through `/api`. The Angular development proxy forwards those requests to the local backend. In Electron's built `file:` renderer, the API client calls the local backend URL directly.
- Electron's main and preload processes are separate from Angular. The window enables context isolation and sandboxing and disables Node integration.
- CSV and Excel exports use a common timestamped, one-measurement-per-row table. ExcelJS is loaded only when an Excel export is requested, keeping it out of the initial UI bundle.
- Chart.js and its zoom plugin are loaded on demand. Each metric chart keeps the newest 100 timestamped samples, updates every second, and supports zoom, drag-pan, and reset controls. Tooltips show timestamp, value, and unit; updates animate without recreating chart instances.

## Assumptions And Data Limits

- The app is a local, single-workstation tool. The API is expected at `localhost:3000`; no remote service URL or authentication is configured.
- The backend simulates in-memory sample telemetry. It is not connected to compressor hardware, a database, or persistent storage.
- Snapshot and history data include velocity, pressure, temperature, and flow.
- Snapshot and historical sample timestamps are ISO date-time values.
- Velocity units: `mm/s`, `cm/s`, `m/s`, `km/h`, and `ft/s`. Pressure units: `Pa`, `kPa`, `mbar`, `bar`, `psi`, and `atm`. Temperature units: `°C`, `°F`, and `K`. Conversion uses the API's canonical `m/s`, `bar`, and `°C` values and is applied locally to current readings, charts, history, and exports without another API request.
- The Electron preview runs the local build but does not package or sign an installer.

## Source And Generated Files

All application source, workspace manifests, lockfiles, and tests are part of the source tree. Do not include installed dependencies or generated output in a source submission. The root `.gitignore` excludes `node_modules`, Angular caches, `dist`, TypeScript test output, coverage, and Electron release output.