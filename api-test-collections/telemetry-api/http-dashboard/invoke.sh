#!/usr/bin/env bash
set -euo pipefail
curl -sS -D - "http://localhost:3000/api/dashboard" -o /tmp/telemetry-dashboard.json
cat /tmp/telemetry-dashboard.json
