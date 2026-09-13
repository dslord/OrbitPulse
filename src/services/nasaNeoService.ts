import { MeteorObject } from '../types';

export async function fetchMeteorFeed(): Promise<MeteorObject[]> {
  const apiKey = process.env.EXPO_PUBLIC_NASA_API_KEY;

  if (!apiKey) {
    throw new Error(
      'NASA API key missing. Please configure EXPO_PUBLIC_NASA_API_KEY environment variable to access near-earth object telemetry.'
    );
  }

  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      throw new Error(
        'NASA API rate limit exceeded. Please configure a valid EXPO_PUBLIC_NASA_API_KEY or try again shortly.'
      );
    }

    if (!response.ok) {
      throw new Error(`NASA NEO API responded with HTTP status ${response.status}`);
    }

    const data = await response.json();
    const nearEarthObjects = data.near_earth_objects;

    if (!nearEarthObjects || Object.keys(nearEarthObjects).length === 0) {
      return [];
    }

    const meteorArrays: MeteorObject[][] = Object.keys(nearEarthObjects).map(
      (date) => nearEarthObjects[date]
    );
    let allMeteors: MeteorObject[] = Array.prototype.concat.apply([], meteorArrays);

    allMeteors.forEach((element) => {
      // Find the approach record corresponding to the current 5-day query window
      const currentApproach =
        element.close_approach_data?.find(
          (cad) =>
            cad.close_approach_date &&
            cad.close_approach_date >= startDate &&
            cad.close_approach_date <= endDate
        ) ||
        element.close_approach_data?.find(
          (cad) => cad.close_approach_date && cad.close_approach_date >= startDate
        ) ||
        element.close_approach_data?.[0];

      element.current_approach = currentApproach;

      let missDistance = parseFloat(
        currentApproach?.miss_distance?.kilometers || '1'
      );
      if (isNaN(missDistance) || missDistance <= 0) {
        missDistance = 1;
      }
      const minDia =
        element.estimated_diameter?.kilometers?.estimated_diameter_min || 0;
      const maxDia =
        element.estimated_diameter?.kilometers?.estimated_diameter_max || 0;
      const avgDiameter = (minDia + maxDia) / 2;

      // Exact legacy multiplier: 1,000,000,000
      const threatScore = (avgDiameter / missDistance) * 1000000000;
      element.threatScore = threatScore;
    });

    allMeteors.sort((a, b) => (b.threatScore || 0) - (a.threatScore || 0));

    return allMeteors.slice(0, 10);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request to NASA Near-Earth Object server timed out.');
    }
    throw err;
  }
}
