import type { DashboardSnapshot, HealthStatus } from './index';
import { liveClient } from './client';

describe('liveClient', () => {
  const originalFetch = window.fetch;

  afterEach(() => {
    window.fetch = originalFetch;
  });

  describe('getDashboard', () => {
    it('should call dashboard API and return dashboard data', async () => {
      const dashboard: DashboardSnapshot = {
        timestamp: '2026-10-08T10:00:00.000Z',
        metrics: [],
        history: [],
        status: 'Healthy'
      };

      const fetchSpy = jasmine.createSpy('fetch').and.resolveTo(
        new Response(JSON.stringify(dashboard), {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      window.fetch = fetchSpy;

      const result = await liveClient.getDashboard();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('/api/dashboard');
      expect(result).toEqual(dashboard);
    });

    it('should return dashboard with Warning status', async () => {
      const dashboard: DashboardSnapshot = {
        timestamp: '2026-10-08T10:00:00.000Z',
        metrics: [],
        history: [],
        status: 'Warning'
      };

      const fetchSpy = jasmine.createSpy('fetch').and.resolveTo(
        new Response(JSON.stringify(dashboard), {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      window.fetch = fetchSpy;

      const result = await liveClient.getDashboard();

      expect(result).toEqual(dashboard);
      expect(result.status).toBe('Warning');
    });

    it('should throw an error when dashboard API returns 500', async () => {
      const fetchSpy = jasmine.createSpy('fetch').and.resolveTo(
        new Response(null, {
          status: 500,
          statusText: 'Internal Server Error'
        })
      );

      window.fetch = fetchSpy;

      await expectAsync(
        liveClient.getDashboard()
      ).toBeRejectedWithError(
        'Telemetry API request failed: 500 Internal Server Error'
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('/api/dashboard');
    });

    it('should throw an error when dashboard API returns 404', async () => {
      const fetchSpy = jasmine.createSpy('fetch').and.resolveTo(
        new Response(null, {
          status: 404,
          statusText: 'Not Found'
        })
      );

      window.fetch = fetchSpy;

      await expectAsync(
        liveClient.getDashboard()
      ).toBeRejectedWithError(
        'Telemetry API request failed: 404 Not Found'
      );

      expect(fetchSpy).toHaveBeenCalledWith('/api/dashboard');
    });

    it('should propagate dashboard network errors', async () => {
      const networkError = new Error('Network connection failed');

      const fetchSpy = jasmine
        .createSpy('fetch')
        .and.rejectWith(networkError);

      window.fetch = fetchSpy;

      await expectAsync(
        liveClient.getDashboard()
      ).toBeRejectedWithError('Network connection failed');

      expect(fetchSpy).toHaveBeenCalledWith('/api/dashboard');
    });
  });

  describe('getHealth', () => {
    it('should call health API and return healthy data', async () => {
      const health: HealthStatus = {
        status: 'ok',
        services: {
          telemetry: 'online',
          dashboard: 'online'
        }
      };

      const fetchSpy = jasmine.createSpy('fetch').and.resolveTo(
        new Response(JSON.stringify(health), {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      window.fetch = fetchSpy;

      const result = await liveClient.getHealth();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('/api/health');
      expect(result).toEqual(health);
    });

    it('should return degraded health status', async () => {
      const health: HealthStatus = {
        status: 'degraded',
        services: {
          telemetry: 'offline',
          dashboard: 'online'
        }
      };

      const fetchSpy = jasmine.createSpy('fetch').and.resolveTo(
        new Response(JSON.stringify(health), {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      window.fetch = fetchSpy;

      const result = await liveClient.getHealth();

      expect(result).toEqual(health);
      expect(result.status).toBe('degraded');
      expect(result.services.telemetry).toBe('offline');
      expect(result.services.dashboard).toBe('online');
    });

    it('should handle offline dashboard service', async () => {
      const health: HealthStatus = {
        status: 'degraded',
        services: {
          telemetry: 'online',
          dashboard: 'offline'
        }
      };

      const fetchSpy = jasmine.createSpy('fetch').and.resolveTo(
        new Response(JSON.stringify(health), {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      window.fetch = fetchSpy;

      const result = await liveClient.getHealth();

      expect(result.services.telemetry).toBe('online');
      expect(result.services.dashboard).toBe('offline');
    });

    it('should throw an error when health API returns 503', async () => {
      const fetchSpy = jasmine.createSpy('fetch').and.resolveTo(
        new Response(null, {
          status: 503,
          statusText: 'Service Unavailable'
        })
      );

      window.fetch = fetchSpy;

      await expectAsync(
        liveClient.getHealth()
      ).toBeRejectedWithError(
        'Telemetry API request failed: 503 Service Unavailable'
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('/api/health');
    });

    it('should propagate health network errors', async () => {
      const networkError = new Error('Health service unavailable');

      const fetchSpy = jasmine
        .createSpy('fetch')
        .and.rejectWith(networkError);

      window.fetch = fetchSpy;

      await expectAsync(
        liveClient.getHealth()
      ).toBeRejectedWithError('Health service unavailable');

      expect(fetchSpy).toHaveBeenCalledWith('/api/health');
    });
  });
});