import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';

import { apiClient, type DashboardSnapshot, type TelemetryHistoryEntry } from '../../api';
import type {
  ConditionItem,
  MetricCard,
  PressureUnit,
  ServiceItem,
  TemperatureUnit,
  Theme,
  TrendPoint,
  TrendRow,
  VelocityUnit
} from '../models/dashboard.models';
import { createTelemetryCsv, downloadTelemetryFile } from '../excel-telemetry/telemetry-export';

const velocityFactors: Record<VelocityUnit, number> = {
  'mm/s': 1_000,
  'cm/s': 100,
  'm/s': 1,
  'km/h': 3.6,
  'ft/s': 3.280839895
};

const pressureFactors: Record<PressureUnit, number> = {
  Pa: 100_000,
  kPa: 100,
  mbar: 1_000,
  bar: 1,
  psi: 14.5037738,
  atm: 0.9869232667
};

@Injectable({ providedIn: 'root' })
export class DashboardStore implements OnDestroy {
  private readonly ngZone = inject(NgZone);
  metrics: MetricCard[] = [];
  systemStatus: DashboardSnapshot['status'] | null = null;
  updatedAt: string | null = null;
  loadError = '';
  isLoading = true;
  isRefreshing = true;
  isExportingExcel = false;
  exportMessage = '';
  theme: Theme = 'light';
  velocityUnit: VelocityUnit = 'm/s';
  pressureUnit: PressureUnit = 'bar';
  temperatureUnit: TemperatureUnit = '°C';
  readonly velocityUnits: VelocityUnit[] = ['mm/s', 'cm/s', 'm/s', 'km/h', 'ft/s'];
  readonly pressureUnits: PressureUnit[] = ['Pa', 'kPa', 'mbar', 'bar', 'psi', 'atm'];
  readonly temperatureUnits: TemperatureUnit[] = ['°C', '°F', 'K'];
  private dashboardSnapshot: DashboardSnapshot | null = null;
  private readonly themeStorageKey = 'compressor-operations-theme';
  private pollTimer: number | undefined;
  private refreshInProgress = false;
  private started = false;

  readonly conditions: ConditionItem[] = [
    { label: 'Air intake', value: 'Clean', detail: 'Filter efficiency 96%' },
    { label: 'Load factor', value: '74%', detail: 'Target 70–80%' },
    { label: 'Oil temp', value: '61.8°C', detail: 'Nominal band' }
  ];

  readonly services: ServiceItem[] = [
    { label: 'Cooling loop', state: 'Nominal', tone: 'ok' },
    { label: 'Drive train', state: 'Watch', tone: 'warning' },
    { label: 'SCADA link', state: 'Stable', tone: 'ok' }
  ];

  trendData: TrendRow[] = [];

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;
    this.initializeTheme();
    await this.refreshDashboard();
    if (this.started) {
      this.pollTimer = this.ngZone.runOutsideAngular(() => window.setInterval(() => {
        void this.ngZone.run(() => this.refreshDashboard());
      }, 1_000));
    }
  }

  ngOnDestroy(): void {
    this.started = false;
    if (this.pollTimer !== undefined) {
      window.clearInterval(this.pollTimer);
    }
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    try {
      window.localStorage.setItem(this.themeStorageKey, theme);
    } catch {
      // The theme still applies when local storage is unavailable.
    }
  }

  async refreshDashboard(): Promise<void> {
    if (this.refreshInProgress) {
      return;
    }

    this.refreshInProgress = true;
    this.isRefreshing = true;
    this.loadError = '';

    try {
      const snapshot = await apiClient.getDashboard();
      this.applySnapshot(snapshot);
    } catch {
      this.systemStatus = null;
      this.loadError = 'Telemetry could not be reached. Check the backend connection and try again.';
    } finally {
      this.isLoading = false;
      this.isRefreshing = false;
      this.refreshInProgress = false;
    }
  }

  setVelocityUnit(unit: VelocityUnit): void {
    this.velocityUnit = unit;
    this.rebuildDisplayedSnapshot();
  }

  setPressureUnit(unit: PressureUnit): void {
    this.pressureUnit = unit;
    this.rebuildDisplayedSnapshot();
  }

  setTemperatureUnit(unit: TemperatureUnit): void {
    this.temperatureUnit = unit;
    this.rebuildDisplayedSnapshot();
  }

  get canExport(): boolean {
    return !!this.dashboardSnapshot && !this.isLoading && !this.loadError && !this.isExportingExcel;
  }

  exportCsv(): void {
    const snapshot = this.getExportSnapshot();
    if (!snapshot || !this.canExport) {
      return;
    }

    try {
      const csv = createTelemetryCsv(snapshot);
      downloadTelemetryFile(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }), 'csv');
      this.exportMessage = 'CSV export downloaded.';
    } catch {
      this.exportMessage = 'CSV export failed. Please try again.';
    }
  }

  async exportExcel(): Promise<void> {
    const snapshot = this.getExportSnapshot();
    if (!snapshot || !this.canExport) {
      return;
    }

    this.isExportingExcel = true;
    this.exportMessage = '';
    try {
      const { createTelemetryWorkbook } = await import('../excel-telemetry/excel-export');
      const workbook = await createTelemetryWorkbook(snapshot);
      downloadTelemetryFile(workbook, 'xlsx');
      this.exportMessage = 'Excel export downloaded.';
    } catch {
      this.exportMessage = 'Excel export failed. Please try again.';
    } finally {
      this.isExportingExcel = false;
    }
  }

  private initializeTheme(): void {
    let theme: Theme = 'light';

    try {
      theme = window.localStorage.getItem(this.themeStorageKey) === 'dark' ? 'dark' : 'light';
    } catch {
      theme = 'light';
    }

    this.setTheme(theme);
  }

  private getHistoryValue(entry: TelemetryHistoryEntry, metricName: string): number | undefined {
    const values: Record<string, number> = {
      velocity: entry.velocity,
      pressure: entry.pressure,
      temperature: entry.temperature,
      flow: entry.flow
    };
    return values[metricName.toLowerCase()];
  }

  private applySnapshot(snapshot: DashboardSnapshot): void {
    this.dashboardSnapshot = snapshot;
    this.metrics = snapshot.metrics.map((metric) => {
      const unit = this.unitForMetric(metric.name, metric.unit);
      const value = this.convertMetricValue(metric.name, metric.value);

      return {
        name: metric.name,
        value: this.formatMetricValue(value, unit),
        unit,
        status: metric.status,
        tone: metric.status === 'Normal' ? 'ok' : 'warning',
        samples: snapshot.history.flatMap((entry) => {
          const historyValue = this.getHistoryValue(entry, metric.name);
          return typeof historyValue === 'number'
            ? [{ timestamp: entry.timestamp, value: this.convertMetricValue(metric.name, historyValue) }]
            : [];
        }).slice(-100)
      };
    });
    this.trendData = snapshot.history.slice(-100).map((row) => ({
      time: this.formatTimestamp(row.timestamp),
      velocity: this.convertMetricValue('Velocity', row.velocity),
      pressure: this.convertMetricValue('Pressure', row.pressure),
      temperature: this.convertMetricValue('Temperature', row.temperature),
      flow: row.flow,
      status: row.status
    }));
    this.systemStatus = snapshot.status;
    const temperature = snapshot.metrics.find((metric) => metric.name.toLowerCase() === 'temperature');
    const oilCondition = this.conditions.find((condition) => condition.label === 'Oil temp');
    if (temperature && oilCondition) {
      const unit = this.unitForMetric(temperature.name, temperature.unit);
      const value = this.convertMetricValue(temperature.name, temperature.value);
      oilCondition.value = `${this.formatMetricValue(value, unit)} ${unit}`;
    }
    this.updatedAt = new Date(snapshot.timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  private rebuildDisplayedSnapshot(): void {
    if (this.dashboardSnapshot) {
      this.applySnapshot(this.dashboardSnapshot);
    }
  }

  private convertMetricValue(metricName: string, value: number): number {
    switch (metricName.toLowerCase()) {
      case 'velocity':
        return value * velocityFactors[this.velocityUnit];
      case 'pressure':
        return value * pressureFactors[this.pressureUnit];
      case 'temperature':
        if (this.temperatureUnit === '°F') {
          return value * 9 / 5 + 32;
        }
        if (this.temperatureUnit === 'K') {
          return value + 273.15;
        }
        return value;
      default:
        return value;
    }
  }

  private unitForMetric(metricName: string, sourceUnit: string): string {
    switch (metricName.toLowerCase()) {
      case 'velocity':
        return this.velocityUnit;
      case 'pressure':
        return this.pressureUnit;
      case 'temperature':
        return this.temperatureUnit;
      default:
        return sourceUnit;
    }
  }

  private formatMetricValue(value: number, unit: string): string {
    if (unit === 'm/s' || unit === 'bar' || unit === '°C' || unit === 'L/min') {
      return value.toFixed(1);
    }

    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  }

  private getExportSnapshot(): DashboardSnapshot | null {
    if (!this.dashboardSnapshot) {
      return null;
    }

    return {
      ...this.dashboardSnapshot,
      metrics: this.dashboardSnapshot.metrics.map((metric) => ({
        ...metric,
        value: this.convertMetricValue(metric.name, metric.value),
        unit: this.unitForMetric(metric.name, metric.unit)
      })),
      history: this.dashboardSnapshot.history.map((entry) => ({
        ...entry,
        velocity: this.convertMetricValue('Velocity', entry.velocity),
        pressure: this.convertMetricValue('Pressure', entry.pressure),
        temperature: this.convertMetricValue('Temperature', entry.temperature)
      }))
    };
  }

  private formatTimestamp(timestamp: string): string {
    const parsed = new Date(timestamp);
    return Number.isNaN(parsed.getTime())
      ? timestamp
      : parsed.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}