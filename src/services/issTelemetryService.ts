import { ISSTelemetry } from '../types';

const ISS_TELEMETRY_ENDPOINT = 'https://api.wheretheiss.at/v1/satellites/25544';

export async function fetchISSTelemetry(timeoutMs: number = 10000): Promise<ISSTelemetry> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(ISS_TELEMETRY_ENDPOINT, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`ISS Satellite API responded with status ${response.status}`);
    }

    const data = await response.json();
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude,
      velocity: data.velocity,
      visibility: data.visibility || 'N/A',
      timestamp: data.timestamp,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Connection to ISS satellite telemetry server timed out.');
    }
    throw err;
  }
}
