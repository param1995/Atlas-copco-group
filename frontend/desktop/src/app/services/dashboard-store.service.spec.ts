import { TestBed } from '@angular/core/testing';
import { apiClient, type DashboardSnapshot } from '../../api';
import { createTelemetryWorkbook } from '../excel-telemetry/excel-export';
import { LiveTrendChartComponent } from '../live-trend-data/live-trend-chart.component';
import {
  buildTelemetryExportTable,
  createTelemetryCsv
} from '../excel-telemetry/telemetry-export';
import { DashboardStore } from './dashboard-store.service';

const dashboardSnapshot: DashboardSnapshot = {
  timestamp: '2026-10-07T12:00:00.000Z',
  status: 'Warning',
  metrics: [
    { name: 'Velocity', value: 102.3, unit: 'm/s', status: 'Normal' },
    { name: 'Pressure', value: 7.6, unit: 'bar', status: 'Warning' },
    { name: 'Temperature', value: 61.8, unit: '°C', status: 'Normal' },
    { name: 'Flow', value: 82.1, unit: 'L/min', status: 'Normal' }
  ],
  history: [
    { timestamp: '2026-10-07T12:00:00.000Z', velocity: 102.3, pressure: 7.6, temperature: 61.8, flow: 82.1, status: 'Warning' }
  ]
};

describe('DashboardStore', () => {
  let dashboardRequest: jasmine.Spy;
  let store: DashboardStore;

  beforeEach(async () => {
    document.documentElement.removeAttribute('data-theme');
    window.localStorage.removeItem('compressor-operations-theme');
    dashboardRequest = spyOn(apiClient, 'getDashboard').and.resolveTo(dashboardSnapshot);
    await TestBed.configureTestingModule({ providers: [DashboardStore] }).compileComponents();
    store = TestBed.inject(DashboardStore);
  });

  it('loads live measurements and the API warning status', async () => {
    await store.start();

    expect(store.metrics).toHaveSize(4);
    expect(store.systemStatus).toBe('Warning');
    expect(store.metrics.find((metric) => metric.name === 'Pressure')?.value).toBe('7.6');
  });

  it('converts velocity, pressure, and temperature locally', async () => {
    await store.start();
    const requestCount = dashboardRequest.calls.count();

    expect(store.velocityUnits).toEqual(['mm/s', 'cm/s', 'm/s', 'km/h', 'ft/s']);
    expect(store.pressureUnits).toEqual(['Pa', 'kPa', 'mbar', 'bar', 'psi', 'atm']);
    expect(store.temperatureUnits).toEqual(['°C', '°F', 'K']);

    const velocityCases = [
      ['mm/s', 102_300],
      ['cm/s', 10_230],
      ['m/s', 102.3],
      ['km/h', 368.28],
      ['ft/s', 102.3 * 3.280839895]
    ] as const;
    for (const [unit, expectedValue] of velocityCases) {
      store.setVelocityUnit(unit);
      expect(store.metrics.find((metric) => metric.name === 'Velocity')?.samples[0].value)
        .toBeCloseTo(expectedValue, 5);
    }

    const pressureCases = [
      ['Pa', 760_000],
      ['kPa', 760],
      ['mbar', 7_600],
      ['bar', 7.6],
      ['psi', 7.6 * 14.5037738],
      ['atm', 7.6 * 0.9869232667]
    ] as const;
    for (const [unit, expectedValue] of pressureCases) {
      store.setPressureUnit(unit);
      expect(store.metrics.find((metric) => metric.name === 'Pressure')?.samples[0].value)
        .toBeCloseTo(expectedValue, 5);
    }

    const temperatureCases = [
      ['°C', 61.8],
      ['°F', 61.8 * 9 / 5 + 32],
      ['K', 61.8 + 273.15]
    ] as const;
    for (const [unit, expectedValue] of temperatureCases) {
      store.setTemperatureUnit(unit);
      expect(store.metrics.find((metric) => metric.name === 'Temperature')?.samples[0].value)
        .toBeCloseTo(expectedValue, 5);
    }

    store.setVelocityUnit('km/h');
    store.setPressureUnit('psi');
    store.setTemperatureUnit('°F');

    const velocity = store.metrics.find((metric) => metric.name === 'Velocity');
    const pressure = store.metrics.find((metric) => metric.name === 'Pressure');
    const temperature = store.metrics.find((metric) => metric.name === 'Temperature');
    expect(velocity?.unit).toBe('km/h');
    expect(velocity?.value).toBe('368.28');
    expect(velocity?.samples[0].value).toBeCloseTo(102.3 * 3.6, 5);
    expect(pressure?.unit).toBe('psi');
    expect(pressure?.value).toBe('110.23');
    expect(temperature?.unit).toBe('°F');
    expect(temperature?.value).toBe('143.24');
    expect(store.trendData[0].velocity).toBeCloseTo(102.3 * 3.6, 5);
    expect(store.trendData[0].pressure).toBeCloseTo(7.6 * 14.5037738, 5);
    expect(store.trendData[0].temperature).toBeCloseTo(143.24, 5);
    expect(store.conditions.find((condition) => condition.label === 'Oil temp')?.value).toBe('143.24 °F');
    expect(dashboardRequest.calls.count()).toBe(requestCount);
  });

  it('keeps only the latest 100 samples in each chart', () => {
    const chart = new LiveTrendChartComponent();
    chart.samples = Array.from({ length: 101 }, (_, index) => ({
      timestamp: `sample-${index}`,
      value: index
    }));

    expect(chart.visibleSamples).toHaveSize(100);
    expect(chart.visibleSamples[0].value).toBe(1);
    expect(chart.visibleSamples[99].value).toBe(100);
  });

  it('switches and persists themes without navigating or reloading', async () => {
    await store.start();
    const currentUrl = window.location.href;

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    store.setTheme('dark');

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem('compressor-operations-theme')).toBe('dark');
    expect(window.location.href).toBe(currentUrl);
  });

  it('shows a retry action when telemetry cannot be loaded', async () => {
    dashboardRequest.and.rejectWith(new Error('offline'));
    await store.start();

    expect(store.loadError).toContain('Telemetry could not be reached');
    expect(store.canExport).toBeFalse();
    dashboardRequest.and.resolveTo(dashboardSnapshot);
    await store.refreshDashboard();
    expect(store.loadError).toBe('');
    expect(store.metrics).toHaveSize(4);
  });

  it('exports timestamped snapshot and history values with parameter status', () => {
    const table = buildTelemetryExportTable(dashboardSnapshot);
    const currentRows = table.rows.filter((row) => row[1] === 'Current snapshot');
    const historyRows = table.rows.filter((row) => row[1] === 'History');
    const flowSnapshot = currentRows.find((row) => row[2] === 'Flow');
    const exportTimestamp = String(currentRows[0][0]);
    const csv = createTelemetryCsv(dashboardSnapshot);

    expect(table.headers).toEqual([
      'Timestamp',
      'Record type',
      'Parameter',
      'Value',
      'Unit',
      'Status',
      'System status'
    ]);
    expect(currentRows).toHaveSize(4);
    expect(exportTimestamp).toMatch(/^\d{2}-[a-z]{3}-\d{4} \d{2}:\d{2}:\d{2}$/);
    expect(exportTimestamp).not.toContain('T');
    expect(exportTimestamp).not.toContain('Z');
    expect(flowSnapshot).toEqual([
      exportTimestamp,
      'Current snapshot',
      'Flow',
      82.1,
      'L/min',
      'Normal',
      'Warning'
    ]);
    expect(historyRows).toHaveSize(4);
    expect(historyRows.every((row) => row[0] === exportTimestamp)).toBeTrue();
    expect(historyRows.some((row) => row[2] === 'Flow')).toBeTrue();
    expect(csv).toContain('"Timestamp","Record type","Parameter","Value","Unit","Status","System status"');
    expect(csv).toContain(`"${exportTimestamp}","History","Velocity","102.3","m/s","Warning",""`);
  });

  it('creates an Excel workbook blob', async () => {
    const workbook = await createTelemetryWorkbook(dashboardSnapshot);
    const signature = new Uint8Array(await workbook.arrayBuffer()).slice(0, 2);

    expect(workbook.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(Array.from(signature)).toEqual([0x50, 0x4b]);
  });
});
