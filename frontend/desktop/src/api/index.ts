export type MetricStatus = 'Normal' | 'Warning';
export type TelemetryMetric = {
  name: string;
  value: number;
  unit: string;
  status: MetricStatus;
};

export type TelemetryHistoryEntry = {
  timestamp: string;
  velocity: number;
  pressure: number;
  temperature: number;
  flow: number;
  status: MetricStatus;
};

export type DashboardSnapshot = {
  timestamp: string;
  metrics: TelemetryMetric[];
  history: TelemetryHistoryEntry[];
  status: 'Healthy' | 'Warning';
};

export type HealthStatus = {
  status: 'ok' | 'degraded';
  services: {
    telemetry: 'online' | 'offline';
    dashboard: 'online' | 'offline';
  };
};

export interface ApiClient {
  getDashboard(): Promise<DashboardSnapshot>;
  getHealth(): Promise<HealthStatus>;
}

import { liveClient } from './client';

export const apiClient: ApiClient = liveClient;
