import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';

export type TelemetryMetric = {
  name: string;
  value: number;
  unit: string;
  status: 'Normal' | 'Warning';
};

export type TelemetryHistoryEntry = {
  timestamp: string;
  velocity: number;
  pressure: number;
  temperature: number;
  flow: number;
  status: 'Normal' | 'Warning';
};

export type DashboardSnapshot = {
  timestamp: string;
  metrics: TelemetryMetric[];
  history: TelemetryHistoryEntry[];
  status: 'Healthy' | 'Warning';
};

const MAX_HISTORY_SAMPLES = 100;
const UPDATE_INTERVAL_MS = 1_000;
const RANDOM_UPDATE_CYCLES = 5;
const RECOVERY_CYCLES = 5;

const BASE_METRICS: ReadonlyArray<Omit<TelemetryMetric, 'status'>> = [
  { name: 'Velocity', value: 102.3, unit: 'm/s' },
  { name: 'Pressure', value: 7.6, unit: 'bar' },
  { name: 'Temperature', value: 61.8, unit: '°C' },
  { name: 'Flow', value: 82.1, unit: 'L/min' }
];

const INITIAL_HISTORY = [
  { velocity: 101.8, pressure: 7.5, temperature: 60.7, flow: 81.3, status: 'Normal' },
  { velocity: 103.1, pressure: 7.8, temperature: 61.1, flow: 82.4, status: 'Warning' },
  { velocity: 101.4, pressure: 7.7, temperature: 61.9, flow: 82.8, status: 'Warning' },
  { velocity: 104.2, pressure: 8.0, temperature: 62.3, flow: 83.2, status: 'Warning' }
] as const;

export type TelemetrySimulatorOptions = {
  random?: () => number;
  now?: () => number;
};

export interface TelemetrySimulator {
  snapshot(): DashboardSnapshot;
  tick(): DashboardSnapshot;
  start(): void;
  stop(): void;
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

export function createTelemetrySimulator(options: TelemetrySimulatorOptions = {}): TelemetrySimulator {
  const random = options.random ?? Math.random;
  const now = options.now ?? Date.now;
  const startedAt = now();
  let lastSampleTime = startedAt - UPDATE_INTERVAL_MS;
  let currentTimestamp = new Date(lastSampleTime).toISOString();
  let randomCycles = 0;
  let recoveryCyclesRemaining = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let metrics = BASE_METRICS.map((metric) => ({
    ...metric,
    status: metric.name === 'Pressure' ? 'Warning' as const : 'Normal' as const
  }));
  const history: TelemetryHistoryEntry[] = INITIAL_HISTORY.map((sample, index) => ({
    ...sample,
    timestamp: new Date(startedAt - (INITIAL_HISTORY.length - index) * 5_000 - 1_000).toISOString()
  }));

  function currentStatus(): DashboardSnapshot['status'] {
    return metrics.some((metric) => metric.status === 'Warning') ? 'Warning' : 'Healthy';
  }

  function snapshot(): DashboardSnapshot {
    return {
      timestamp: currentTimestamp,
      metrics: metrics.map((metric) => ({ ...metric })),
      history: history.map((sample) => ({ ...sample })),
      status: currentStatus()
    };
  }

  function tick(): DashboardSnapshot {
    if (recoveryCyclesRemaining > 0) {
      metrics = metrics.map((metric, index) => {
        const baseline = BASE_METRICS[index].value;
        const value = recoveryCyclesRemaining === 1
          ? baseline
          : roundToTenth(metric.value + (baseline - metric.value) / recoveryCyclesRemaining);
        return { ...metric, value };
      });
      recoveryCyclesRemaining -= 1;
      if (recoveryCyclesRemaining === 0) {
        randomCycles = 0;
      }
    } else {
      metrics = metrics.map((metric) => {
        const variation = Math.min(1, Math.max(0, random())) * 0.2 - 0.1;
        return { ...metric, value: roundToTenth(metric.value * (1 + variation)) };
      });
      randomCycles += 1;
      if (randomCycles === RANDOM_UPDATE_CYCLES) {
        recoveryCyclesRemaining = RECOVERY_CYCLES;
      }
    }

    metrics = metrics.map((metric) => ({
      ...metric,
      status: metric.name === 'Pressure' && metric.value >= 7.6 ? 'Warning' : 'Normal'
    }));
    lastSampleTime = Math.max(now(), lastSampleTime + UPDATE_INTERVAL_MS);
    currentTimestamp = new Date(lastSampleTime).toISOString();
    const status = currentStatus();
    const metricValues = Object.fromEntries(metrics.map((metric) => [metric.name.toLowerCase(), metric.value]));

    history.push({
      timestamp: currentTimestamp,
      velocity: metricValues['velocity'],
      pressure: metricValues['pressure'],
      temperature: metricValues['temperature'],
      flow: metricValues['flow'],
      status: status === 'Warning' ? 'Warning' : 'Normal'
    });
    if (history.length > MAX_HISTORY_SAMPLES) {
      history.shift();
    }

    return snapshot();
  }

  return {
    snapshot,
    tick,
    start(): void {
      if (timer === undefined) {
        timer = setInterval(() => tick(), UPDATE_INTERVAL_MS);
      }
    },
    stop(): void {
      if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
    }
  };
}

export function createApp(simulator: TelemetrySimulator = createTelemetrySimulator()): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    const services = {
      telemetry: 'online',
      dashboard: 'online'
    };

    const healthy = Object.values(services).every((service) => service === 'online');

    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      services
    });
  });

  app.get('/api/dashboard', (_req: Request, res: Response) => {
    res.json(simulator.snapshot());
  });

  return app;
}

const simulator = createTelemetrySimulator();
const app = createApp(simulator);
const port = Number(process.env.PORT ?? 3000);

if (process.env.NODE_ENV !== 'test') {
  simulator.start();
  app.listen(port, () => {
    console.log(`Telemetry API listening on http://localhost:${port}`);
  });
}

export default app;
