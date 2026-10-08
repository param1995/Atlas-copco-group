# Compressor Operations Dashboard

A local compressor telemetry dashboard built with **Angular 19, Electron, Node.js, and Express**, designed to simulate and visualize real-time compressor operational data.

The application provides a desktop-style monitoring experience with live telemetry, historical trends, health monitoring, unit conversion, interactive charts, and CSV/Excel export.

## Project Highlights

- Real-time compressor telemetry simulation with **1-second updates**
- Angular dashboard with responsive and user-friendly UI
- Electron desktop application with secure renderer isolation
- Node.js + Express REST API
- Live telemetry for:
  - Velocity
  - Pressure
  - Temperature
  - Flow
- Historical telemetry with the latest **100 samples**
- Interactive Chart.js trend charts
- Zoom, pan, and reset chart controls
- Light/Dark theme support
- Local unit conversion without additional API requests
- CSV and Excel export
- API health monitoring
- Angular lazy-loaded Overview and Trends routes
- Shared root-scoped dashboard state
- Automated Angular/Jasmine/Karma tests
- Backend API tests
- Code coverage reporting

## Technology Stack

### Frontend

- Angular 19
- TypeScript
- HTML5
- SCSS
- Angular Router
- Angular Forms
- Chart.js
- Chart.js Zoom Plugin

### Desktop

- Electron
- Context Isolation
- Preload API
- Sandboxed renderer
- Node integration disabled

### Backend

- Node.js
- Express
- TypeScript
- REST API

### Export

- CSV
- ExcelJS

### Testing

- Jasmine
- Karma
- Angular TestBed
- Backend API tests
- Code coverage

## Requirements

- Node.js 22.x
- npm
- Windows/Linux/macOS
- Git

Node.js 22.x is recommended for the Angular 19 workspace.

## Project Structure

```text
Atlas-copco-group/
│
├── backend/
│   └── src/
│       └── index.ts
│
├── frontend/
│   └── desktop/
│       ├── electron/
│       │   ├── main
│       │   ├── preload
│       │   └── dev launcher
│       │
│       └── src/
│           └── app/
│               ├── dashboard/
│               ├── trends/
│               └── services/
│
├── shared/
│
├── package.json
├── package-lock.json
├── angular.json
├── tsconfig.json
├── tsconfig.spec.json
└── README.md
```

## Setup

Clone the repository and install the workspace dependencies:

```bash
git clone https://github.com/param1995/Atlas-copco-group.git

cd Atlas-copco-group

npm install
```

## Start Backend

Start the Node.js/Express API in one terminal:

```bash
npm run dev
```

Or:

```bash
npm --prefix backend run dev
```

The backend runs on:

```text
http://localhost:3000
```

## Start Angular + Electron

In another terminal:

```bash
npm --prefix frontend/desktop start
```

The Angular development server runs on:

```text
http://127.0.0.1:4200
```

The Electron development launcher starts the Angular application and opens it inside an Electron window.

> The backend must be started separately.

## Run in Browser

To run the Angular renderer directly in a browser:

```bash
npm --prefix frontend/desktop run start:web
```

Then open:

```text
http://127.0.0.1:4200
```

Make sure the backend is running before opening the application.

## Backend API

The backend provides two REST endpoints.

### Dashboard API

Returns the current compressor telemetry snapshot and historical samples.

```http
GET http://localhost:3000/api/dashboard
```

### Health API

Checks whether the backend API is available.

```http
GET http://localhost:3000/api/health
```

### API Base URL

```text
http://localhost:3000
```

The Angular application communicates through `/api`.

During Angular development, the development proxy forwards `/api` requests to the local backend on port `3000`.

When running the built Angular application inside Electron using the `file:` protocol, the API client communicates directly with:

```text
http://127.0.0.1:3000/api
```

## Dashboard Features

### Live Telemetry

The dashboard displays live readings for:

| Metric | Description |
|---|---|
| Velocity | Compressor vibration/velocity measurement |
| Pressure | Compressor pressure |
| Temperature | Compressor temperature |
| Flow | Compressor flow rate |

The simulator generates a new reading every second.

### Historical Data

The backend retains the newest **100 samples**.

The frontend polls the backend once per second and updates the dashboard and trend charts without recreating chart instances.

### Trend Charts

Each telemetry metric has an independent line chart.

Chart controls include:

- Zoom In
- Zoom Out
- Pan
- Reset Zoom

Chart tooltips display:

- Timestamp
- Value
- Unit

Chart.js and the zoom plugin are loaded on demand.

### Theme

The application supports:

- Light theme
- Dark theme

Chart colors, grid colors, text colors, and metric colors are adjusted according to the selected theme.

### Unit Conversion

The application supports local unit conversion.

#### Velocity

- `mm/s`
- `cm/s`
- `m/s`
- `km/h`
- `ft/s`

#### Pressure

- `Pa`
- `kPa`
- `mbar`
- `bar`
- `psi`
- `atm`

#### Temperature

- `°C`
- `°F`
- `K`

Conversion uses the API's canonical:

```text
Velocity    → m/s
Pressure    → bar
Temperature → °C
```

Converted values are applied locally to:

- Current readings
- Charts
- Historical data
- CSV export
- Excel export

No additional API request is required for unit conversion.

## Data Simulation

The backend uses an in-memory telemetry simulator.

The simulator:

1. Generates a timestamped reading every second.
2. Randomly varies telemetry values by approximately 10%.
3. Maintains the variation for approximately five cycles.
4. Gradually returns values toward their baseline over the next five cycles.
5. Retains the newest 100 samples.

The simulator runs independently from API requests.

No physical compressor hardware is required.

## CSV and Excel Export

The application supports exporting telemetry data to:

- CSV
- Excel `.xlsx`

Both formats use the same export table structure.

Each measurement is exported as a separate row with:

```text
Timestamp
Record type
Parameter
Value
Unit
Status
System status
```

Excel files are generated using **ExcelJS**.

ExcelJS is loaded only when an Excel export is requested to avoid unnecessarily increasing the initial UI bundle.

## Architecture

```text
┌─────────────────────────────────────┐
│          Electron Desktop           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       Angular Renderer        │  │
│  │                               │  │
│  │  Overview                     │  │
│  │  Trends                       │  │
│  │  Dashboard Store              │  │
│  │  Chart.js                     │  │
│  │  CSV / Excel Export           │  │
│  └───────────────┬───────────────┘  │
│                  │ /api              │
└──────────────────┼──────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │   Node.js / Express │
        │                     │
        │ GET /api/dashboard  │
        │ GET /api/health     │
        │                     │
        │ Telemetry Simulator │
        └─────────────────────┘
```

### Angular Routing

Angular Router lazy-loads:

```text
/          → Overview
/trends    → Trends
```

A root-scoped dashboard store keeps polling, theme, and unit-selection state alive while navigating between routes.

## Electron Security

The Electron application separates the main process, preload process, and Angular renderer.

Security-related configuration includes:

- Context isolation enabled
- Sandbox enabled
- Node integration disabled
- Preload process separated from the renderer

The Angular renderer does not directly access Node.js APIs.

## Build

Build the backend and Angular renderer:

```bash
npm run build
```

## Testing

### Backend Tests

Run backend tests:

```bash
npm run test:api
```

### Angular Tests

Run Angular tests:

```bash
npm --prefix frontend/desktop test -- --watch=false
```

### Angular Code Coverage

Generate the Angular test coverage report:

```bash
cd frontend/desktop
ng test --code-coverage --watch=false
```

The coverage report is generated under:

```text
coverage/
```

Open the generated:

```text
coverage/index.html
```

to view:

- Statements
- Branches
- Functions
- Lines

## Electron Preview

To build Angular and open the production build inside Electron:

```bash
npm --prefix frontend/desktop run electron:preview
```

The backend must be running separately.

This command runs the local production build in Electron but does **not** create a packaged installer.

## Assumptions and Data Limitations

This project is designed as a local single-workstation demonstration application.

- The API runs on `localhost:3000`.
- No authentication is configured.
- No remote service is configured.
- Telemetry is simulated in memory.
- No physical compressor hardware is connected.
- No database is used.
- No persistent telemetry storage is used.
- Snapshot and history data contain velocity, pressure, temperature, and flow.
- Telemetry timestamps are ISO date-time values.
- The Electron preview does not package or sign an installer.

## Source and Generated Files

Application source code, workspace manifests, lockfiles, configuration, and tests are maintained in the repository.

Generated or machine-specific files should not be committed.

The root `.gitignore` excludes:

```text
node_modules/
dist/
.angular/
.cache/
out-tsc/
coverage/
release/
build/
out/
.env
.vscode/
.idea/
.azure/
.github/agents/
```

`package-lock.json` is intentionally committed so that dependencies can be installed consistently.

## Development Notes

This project demonstrates a complete local telemetry workflow:

```text
Telemetry Simulation
        ↓
Node.js / Express API
        ↓
Angular Dashboard Store
        ↓
Live Dashboard
        ↓
Chart.js Trends
        ↓
Unit Conversion
        ↓
CSV / Excel Export
```

The application is structured so that the backend, Angular renderer, Electron shell, shared models, charts, and export functionality remain separated and maintainable.

## Future Improvements

Possible future enhancements include:

- Real compressor/hardware telemetry integration
- WebSocket-based real-time communication
- Database-backed historical telemetry
- User authentication and authorization
- Multiple compressor support
- Alarm and notification system
- Configurable telemetry thresholds
- Advanced analytics
- Predictive maintenance
- Cloud/Azure deployment
- Docker-based deployment
- Production Electron packaging and signing

## Repository

**GitHub Repository**

https://github.com/param1995/Atlas-copco-group

## License

This project is intended for demonstration, evaluation, and development purposes.