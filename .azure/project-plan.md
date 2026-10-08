# Project Plan

**Status**: Integrated
**Created**: 2026-10-07
**Mode**: NEW

---

## 1. Project Overview

**Goal**: Build a desktop monitoring dashboard for compressor telemetry that runs locally without external services, with a real-time Angular interface and a localhost API that simulates sensor health. The project is designed so that every module is independently testable.

**App Type**: SPA + API

**API Login**: No

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Backend — Local Telemetry API

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Runtime** | Node |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |
| **Orchestration** | docker-compose |

> **Language vs Runtime**: `Language` is the source language the user picked in this service's `language` question. `Runtime` is the execution runtime — default `Node` for TypeScript/JavaScript, `CPython` for Python, `.NET` for C#. Only deviate from the default (e.g. `Bun`, `Deno`, `PyPy`) when the user explicitly asks. **Package Manager and Test Runner are language-dependent** — match them to this service's Language (e.g. C# → `dotnet (NuGet)` + `xUnit`/`NUnit`/`MSTest`). The `Orchestration` row is recorded for the scaffold step but hidden in the plan UI — always keep it set to `docker-compose`.

---

## 3. Frontend — Desktop Dashboard

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Framework** | Angular |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

---

## 4. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| None | Local-only monitoring app runs entirely on the workstation; no cloud-hosted dependency is required | — | — | Not required |

---

## 5. Prerequisites

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js | Backend, Frontend | ✅ | v22.x |
| npm | Backend, Frontend | ✅ | v10.x |
| Angular CLI | Frontend | ✅ | v19.x |
| Docker | Backend, Frontend | ✅ | v27.x |
| Docker Compose | Backend, Frontend | ✅ | v2.x |
| Git | * | ✅ | Installed |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Docker Desktop | Backend, Frontend | ✅ | v27.x |
| Docker Compose | Backend, Frontend | ✅ | v2.x |
| VS Code TypeScript extension | Frontend | ❓ | unknown |
| VS Code Angular extension | Frontend | ❓ | unknown |

---

## 6. Design System & UI

**Component Library**: Angular Material
**Style Direction**: Modern industrial telemetry interface with subtle depth, rounded surfaces, and high-contrast readings for operators monitoring live compressor health.
**Typography**: Segoe UI Variable

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#1F6FEB` | Primary action buttons, active navigation, selected KPI highlights |
| `accent`  | `#F59E0B` | Secondary emphasis for alerts, warnings, and trending deltas |
| `surface` | `#F8FAFC` | Page and card backgrounds for the monitoring workspace |
| `text`    | `#0F172A` | Main measurement labels, values, and panel headers |
| `muted`   | `#64748B` | Secondary text, timestamps, and status captions |
| `border`  | `#CBD5E1` | Dividers, input borders, and chart framing |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| Overview | `/` | Live compressor telemetry snapshot with KPIs, conditions, and system status | `header + grid + card-list + actions` |
| Trends | `/trends` | Detailed metric history for velocity, pressure, and temperature | `header + split(main|sidebar) + chart + table` |

### Sample Content

```
Overview — Live telemetry:
| Metric | Current Value | Unit | Status |
| Velocity | 102.3 | m/s | Normal |
| Pressure | 7.6 | bar | Warning |
| Temperature | 61.8 | °C | Normal |
| Flow | 82.1 | L/min | Normal |

Trends — Metric history:
| Timestamp | Velocity | Pressure | Temperature | Status |
| 08:00:00 | 101.8 | 7.5 | 60.7 | Normal |
| 08:00:05 | 103.1 | 7.8 | 61.1 | Normal |
| 08:00:10 | 101.4 | 7.7 | 61.9 | Warning |
| 08:00:15 | 104.2 | 8.0 | 62.3 | Warning |
```

---

## 7. Project Structure

```
compressor-dashboard/
├─ backend/
│  ├─ src/
│  ├─ package.json
│  └─ tsconfig.json
├─ apps/
│  └─ desktop/
│     ├─ src/
│     ├─ electron/
│     ├─ angular.json
│     ├─ package.json
│     └─ tsconfig.json
├─ shared/
│  └─ telemetry-contracts/
├─ docker-compose.yml
├─ package.json
├─ README.md
└─ .gitignore
```

---

## 8. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | GET | `/api/health` | Health check for the local telemetry API | — | `{ status, services }` | 200, 503 |
| 2 | GET | `/api/dashboard` | Returns the latest telemetry snapshot and recent samples | — | `{ timestamp, metrics, history, status }` | 200 |

---

## 9. Next Steps

1. Run **azure-project-scaffold** to execute this plan
2. Run **azure-project-integrate** to wire the frontend to live data, smoke-test the backend, and create the migrations
3. Run **azure-debug-plan** → **azure-debug-generate** for Docker emulators and VS Code debugging
4. Run the **azure-deploy** agent when ready; it uses **azure-app-onboard** for architecture, cost estimation, IaC generation, provisioning, and health verification
