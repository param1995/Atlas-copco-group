
set -euo pipefail
curl -sS -D - "http://localhost:3000/api/health" -o /tmp/telemetry-health.json
cat /tmp/telemetry-health.json
