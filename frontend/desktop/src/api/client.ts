import type { ApiClient } from './index';

const API_BASE_URL = window.location.protocol === 'file:'
  ? 'http://127.0.0.1:3000/api'
  : '/api';

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Telemetry API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const liveClient: ApiClient = {
  getDashboard: () => request('/dashboard'),
  getHealth: () => request('/health')
};