export type StatusTone = 'ok' | 'warning';
export type Theme = 'light' | 'dark';
export type VelocityUnit = 'mm/s' | 'cm/s' | 'm/s' | 'km/h' | 'ft/s';
export type PressureUnit = 'Pa' | 'kPa' | 'mbar' | 'bar' | 'psi' | 'atm';
export type TemperatureUnit = '°C' | '°F' | 'K';

export interface TrendPoint {
  timestamp: string;
  value: number;
}

export interface MetricCard {
  name: string;
  value: string;
  unit: string;
  status: 'Normal' | 'Warning';
  tone: StatusTone;
  samples: TrendPoint[];
}

export interface TrendRow {
  time: string;
  velocity: number;
  pressure: number;
  temperature: number;
  flow: number;
  status: 'Normal' | 'Warning';
}

export interface ConditionItem {
  label: string;
  value: string;
  detail: string;
}

export interface ServiceItem {
  label: string;
  state: string;
  tone: StatusTone;
}