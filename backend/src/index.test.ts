import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp, createTelemetrySimulator } from './index.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('telemetry API', () => {
  it('returns the health status', async () => {
    const app = createApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.services.telemetry).toBe('online');
  });

  it('returns the dashboard snapshot', async () => {
    const app = createApp();
    const response = await request(app).get('/api/dashboard');

    expect(response.status).toBe(200);
    expect(response.body.metrics).toHaveLength(4);
    expect(response.body.history).toHaveLength(4);
    expect(response.body.history.at(-1).flow).toEqual(expect.any(Number));
    expect(response.body.status).toBe('Warning');
  });

  it('returns the current snapshot without advancing the simulator on reads', async () => {
    const simulator = createTelemetrySimulator({ random: () => 0.99 });
    const app = createApp(simulator);
    const first = await request(app).get('/api/dashboard');
    const second = await request(app).get('/api/dashboard');

    expect(second.body.timestamp).toBe(first.body.timestamp);
    expect(second.body.metrics).toEqual(first.body.metrics);
    expect(second.body.history).toHaveLength(4);

    simulator.tick();
    const updated = await request(app).get('/api/dashboard');
    expect(updated.body.timestamp).not.toBe(first.body.timestamp);
    expect(updated.body.history).toHaveLength(5);
  });

  it('randomly moves readings by about ten percent and recovers over five cycles', () => {
    const increase = createTelemetrySimulator({ random: () => 0.99 });
    const decrease = createTelemetrySimulator({ random: () => 0.01 });
    const originalVelocity = increase.snapshot().metrics[0].value;
    const increasedVelocity = increase.tick().metrics[0].value;
    const decreasedVelocity = decrease.tick().metrics[0].value;

    expect(increasedVelocity).toBeGreaterThan(originalVelocity * 1.08);
    expect(increasedVelocity).toBeLessThan(originalVelocity * 1.1);
    expect(decreasedVelocity).toBeLessThan(originalVelocity * 0.92);
    expect(decreasedVelocity).toBeGreaterThan(originalVelocity * 0.9);

    const recovering = createTelemetrySimulator({ random: () => 0.99 });
    const originalValues = recovering.snapshot().metrics.map((metric) => metric.value);
    let afterRandomUpdates = recovering.snapshot();
    for (let cycle = 0; cycle < 5; cycle += 1) {
      afterRandomUpdates = recovering.tick();
    }
    const firstRecovery = recovering.tick();
    const distanceBeforeRecovery = Math.abs(afterRandomUpdates.metrics[0].value - originalValues[0]);
    const distanceAfterFirstRecovery = Math.abs(firstRecovery.metrics[0].value - originalValues[0]);
    expect(distanceAfterFirstRecovery).toBeLessThan(distanceBeforeRecovery);

    let afterRecovery = firstRecovery;
    for (let cycle = 1; cycle < 5; cycle += 1) {
      afterRecovery = recovering.tick();
    }
    expect(afterRecovery.metrics.map((metric) => metric.value)).toEqual(originalValues);
  });

  it('generates a new sample on each one-second timer tick', () => {
    vi.useFakeTimers();
    const simulator = createTelemetrySimulator({ random: () => 0.99 });
    const initial = simulator.snapshot();
    simulator.start();

    vi.advanceTimersByTime(999);
    expect(simulator.snapshot().timestamp).toBe(initial.timestamp);

    vi.advanceTimersByTime(1);
    const updated = simulator.snapshot();
    expect(updated.timestamp).not.toBe(initial.timestamp);
    expect(updated.history).toHaveLength(5);
    simulator.stop();
  });

  it('maintains only the latest 100 timestamped samples', () => {
    const simulator = createTelemetrySimulator({ random: () => 0.99 });
    for (let cycle = 0; cycle < 110; cycle += 1) {
      simulator.tick();
    }

    const latest = simulator.snapshot();
    expect(latest.history).toHaveLength(100);
    expect(latest.history.at(-1)?.timestamp).toBe(latest.timestamp);
  });
});
