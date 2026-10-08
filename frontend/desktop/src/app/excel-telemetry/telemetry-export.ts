import type { DashboardSnapshot, TelemetryHistoryEntry, TelemetryMetric } from '../../api';

type ExportCell = string | number;

interface TelemetryExportTable {
  headers: string[];
  rows: ExportCell[][];
}

function historyValue(entry: TelemetryHistoryEntry, metric: TelemetryMetric): ExportCell {
  const values = entry as unknown as Record<string, ExportCell | undefined>;
  return values[metric.name.trim().toLowerCase()] ?? '';
}

function formatExportTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  const dateParts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).formatToParts(date);
  const timeParts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const getPart = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${getPart(dateParts, 'day')}-${getPart(dateParts, 'month').toLowerCase()}-${getPart(dateParts, 'year')} ` +
    `${getPart(timeParts, 'hour')}:${getPart(timeParts, 'minute')}:${getPart(timeParts, 'second')}`;
}

export function buildTelemetryExportTable(snapshot: DashboardSnapshot): TelemetryExportTable {
  const headers = [
    'Timestamp',
    'Record type',
    'Parameter',
    'Value',
    'Unit',
    'Status',
    'System status'
  ];
  const currentRows = snapshot.metrics.map((metric) => [
    formatExportTimestamp(snapshot.timestamp),
    'Current snapshot',
    metric.name,
    metric.value,
    metric.unit,
    metric.status,
    snapshot.status
  ]);
  const historyRows = snapshot.history.flatMap((entry) => snapshot.metrics.flatMap((metric) => {
    const value = historyValue(entry, metric);
    if (value === '') {
      return [];
    }

    return [[
      formatExportTimestamp(entry.timestamp),
      'History',
      metric.name,
      value,
      metric.unit,
      entry.status,
      ''
    ]];
  }));

  return {
    headers,
    rows: [...currentRows, ...historyRows]
  };
}

function csvCell(value: ExportCell): string {
  const text = String(value);
  const safeText = typeof value === 'string' && /^[\s]*[=+\-@]/.test(text)
    ? `'${text}`
    : text;

  return `"${safeText.replace(/"/g, '""')}"`;
}

export function createTelemetryCsv(snapshot: DashboardSnapshot): string {
  const table = buildTelemetryExportTable(snapshot);
  return [table.headers, ...table.rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');
}

export function downloadTelemetryFile(blob: Blob, extension: 'csv' | 'xlsx'): void {
  const fileStamp = new Date().toISOString().replace(/[:.]/g, '-');
  const anchor = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);

  anchor.href = objectUrl;
  anchor.download = `compressor-telemetry-${fileStamp}.${extension}`;
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}