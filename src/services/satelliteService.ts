import { SatelliteCategory, SatelliteGPData, SatellitePosition } from '../types';

const CELESTRAK_BASE_URL = 'https://celestrak.org/NORAD/elements/gp.php';

const EARTH_MU = 398600.4418; // km^3/s^2
const EARTH_RADIUS = 6378.137; // km

/**
 * Fetches real satellite orbital GP data from CelesTrak public HTTPS API
 */
export async function fetchSatellites(
  category: SatelliteCategory = 'visual',
  timeoutMs: number = 10000
): Promise<SatelliteGPData[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${CELESTRAK_BASE_URL}?GROUP=${encodeURIComponent(category)}&FORMAT=json`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`CelesTrak satellite API responded with status ${response.status}`);
    }

    const data: SatelliteGPData[] = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid response payload received from CelesTrak API');
    }

    // Filter valid GP objects with NORAD ID & orbital parameters
    return data.filter(
      (item) =>
        item &&
        typeof item.NORAD_CAT_ID === 'number' &&
        typeof item.MEAN_MOTION === 'number' &&
        item.MEAN_MOTION > 0 &&
        typeof item.INCLINATION === 'number' &&
        typeof item.ECCENTRICITY === 'number' &&
        typeof item.RA_OF_ASC_NODE === 'number' &&
        typeof item.ARG_OF_PERICENTER === 'number' &&
        typeof item.MEAN_ANOMALY === 'number' &&
        Boolean(item.EPOCH)
    );
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Connection to CelesTrak satellite server timed out.');
      }
      throw err;
    }
    throw new Error('Failed to fetch satellite orbital data.');
  }
}

/**
 * Propagates current latitude, longitude, altitude, and velocity from Keplerian orbital elements
 */
export function calculateSatellitePosition(
  gp: SatelliteGPData,
  timestampMs: number = Date.now()
): SatellitePosition | null {
  try {
    const epochMs = new Date(gp.EPOCH).getTime();
    if (isNaN(epochMs)) return null;

    const deltaSec = (timestampMs - epochMs) / 1000;

    // Mean motion in rad/s
    const meanMotionRadSec = (gp.MEAN_MOTION * 2 * Math.PI) / 86400;

    // Semi-major axis (a) in km
    const semiMajorAxis = Math.cbrt(EARTH_MU / Math.pow(meanMotionRadSec, 2));

    // Mean anomaly M at target timestamp
    const m0 = (gp.MEAN_ANOMALY * Math.PI) / 180;
    let m = (m0 + meanMotionRadSec * deltaSec) % (2 * Math.PI);
    if (m < 0) m += 2 * Math.PI;

    // Solve Kepler's equation for Eccentric Anomaly (E)
    const e = gp.ECCENTRICITY;
    let eccAnomaly = m;
    for (let iter = 0; iter < 10; iter++) {
      const f = eccAnomaly - e * Math.sin(eccAnomaly) - m;
      const fPrime = 1 - e * Math.cos(eccAnomaly);
      const delta = f / fPrime;
      eccAnomaly -= delta;
      if (Math.abs(delta) < 1e-7) break;
    }

    // True anomaly nu
    const sinHalfE = Math.sin(eccAnomaly / 2);
    const cosHalfE = Math.cos(eccAnomaly / 2);
    const trueAnomaly =
      2 * Math.atan2(Math.sqrt(1 + e) * sinHalfE, Math.sqrt(1 - e) * cosHalfE);

    // Distance r from center of Earth (km)
    const distanceR = semiMajorAxis * (1 - e * Math.cos(eccAnomaly));

    // Argument of latitude u
    const argPerigeeRad = (gp.ARG_OF_PERICENTER * Math.PI) / 180;
    const argLatitude = argPerigeeRad + trueAnomaly;

    // Orbital plane position
    const xOrb = distanceR * Math.cos(argLatitude);
    const yOrb = distanceR * Math.sin(argLatitude);

    // Orientations
    const incRad = (gp.INCLINATION * Math.PI) / 180;
    const raanRad = (gp.RA_OF_ASC_NODE * Math.PI) / 180;

    // Earth-Centered Inertial (ECI) coordinates
    const cosRaan = Math.cos(raanRad);
    const sinRaan = Math.sin(raanRad);
    const cosInc = Math.cos(incRad);
    const sinInc = Math.sin(incRad);

    const xEci = xOrb * cosRaan - yOrb * cosInc * sinRaan;
    const yEci = xOrb * sinRaan + yOrb * cosInc * cosRaan;
    const zEci = yOrb * sinInc;

    // Greenwich Mean Sidereal Time (GMST) approximation
    const dDays = timestampMs / 86400000 - 10957.5;
    let gmstRad = ((280.46061837 + 360.98564736629 * dDays) * Math.PI) / 180;
    gmstRad = gmstRad % (2 * Math.PI);
    if (gmstRad < 0) gmstRad += 2 * Math.PI;

    // Longitude (-180 to 180 degrees)
    let lonRad = Math.atan2(yEci, xEci) - gmstRad;
    lonRad = Math.atan2(Math.sin(lonRad), Math.cos(lonRad));
    let longitude = (lonRad * 180) / Math.PI;

    // Latitude (-90 to 90 degrees)
    const xyDist = Math.sqrt(xEci * xEci + yEci * yEci);
    let latitude = (Math.atan2(zEci, xyDist) * 180) / Math.PI;

    // Altitude (km) & Velocity (km/h)
    const altitudeKm = Math.max(0, distanceR - EARTH_RADIUS);
    const velocityKmS = Math.sqrt(EARTH_MU * (2 / distanceR - 1 / semiMajorAxis));
    const velocityKmH = velocityKmS * 3600;

    // Validation
    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      isNaN(altitudeKm) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return null;
    }

    return {
      latitude,
      longitude,
      altitudeKm,
      velocityKmH,
      timestamp: timestampMs,
    };
  } catch {
    return null;
  }
}

/**
 * Propagates orbital path points [longitude, latitude] for one full orbit period
 */
export function calculateSatelliteOrbitTrail(
  gp: SatelliteGPData,
  pointsCount: number = 120,
  timestampMs: number = Date.now()
): [number, number][] {
  try {
    if (!gp || typeof gp.MEAN_MOTION !== 'number' || gp.MEAN_MOTION <= 0) {
      return [];
    }

    // Orbital Period in seconds (P = 86400 / MEAN_MOTION)
    const periodSec = 86400 / gp.MEAN_MOTION;
    const halfPeriodMs = (periodSec * 1000) / 2;
    const stepMs = (periodSec * 1000) / pointsCount;

    const points: [number, number][] = [];
    const startMs = timestampMs - halfPeriodMs;

    for (let i = 0; i <= pointsCount; i++) {
      const sampleTime = startMs + i * stepMs;
      const pos = calculateSatellitePosition(gp, sampleTime);
      if (
        pos &&
        typeof pos.latitude === 'number' &&
        typeof pos.longitude === 'number' &&
        !isNaN(pos.latitude) &&
        !isNaN(pos.longitude)
      ) {
        points.push([pos.longitude, pos.latitude]);
      }
    }

    return points;
  } catch {
    return [];
  }
}

let cachedISSGPData: SatelliteGPData | null = null;

/**
 * Fetches real GP orbital element data specifically for ISS (NORAD CATNR 25544) with in-memory caching
 */
export async function fetchISSGPData(): Promise<SatelliteGPData | null> {
  if (cachedISSGPData) return cachedISSGPData;

  try {
    const url = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=json';
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const data: SatelliteGPData[] = await response.json();
    if (
      Array.isArray(data) &&
      data.length > 0 &&
      data[0] &&
      typeof data[0].NORAD_CAT_ID === 'number' &&
      data[0].NORAD_CAT_ID === 25544
    ) {
      cachedISSGPData = data[0];
      return cachedISSGPData;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches real GP orbital data for a specific spacecraft by NORAD CATNR
 */
export async function fetchSpacecraftGPData(
  noradId: number
): Promise<SatelliteGPData | null> {
  try {
    const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=json`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const data: SatelliteGPData[] = await response.json();
    if (
      Array.isArray(data) &&
      data.length > 0 &&
      data[0] &&
      typeof data[0].NORAD_CAT_ID === 'number' &&
      data[0].NORAD_CAT_ID === noradId
    ) {
      return data[0];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Converts orbit coordinate points [longitude, latitude] into a GeoJSON FeatureCollection,
 * automatically splitting line segments across the antimeridian (|lon2 - lon1| > 180)
 * with precise boundary interpolation at +/-180 degrees to eliminate line gaps.
 */
export function generateOrbitTrailGeoJson(
  points: [number, number][],
  prefixId: string = 'orbit'
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  if (!points || points.length < 2) {
    return { type: 'FeatureCollection', features: [] };
  }

  const segments: [number, number][][] = [];
  let currentSegment: [number, number][] = [];

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (currentSegment.length === 0) {
      currentSegment.push(pt);
    } else {
      const prevPt = currentSegment[currentSegment.length - 1];
      const lonDiff = pt[0] - prevPt[0];

      if (Math.abs(lonDiff) > 180) {
        // Crossing antimeridian (International Date Line)
        const lon1 = prevPt[0];
        const lat1 = prevPt[1];
        const lon2 = pt[0];
        const lat2 = pt[1];

        if (lon1 > 0 && lon2 < 0) {
          // East to West crossing (e.g. +179 to -179)
          const dLon = (lon2 + 360) - lon1;
          const t = dLon !== 0 ? (180 - lon1) / dLon : 0.5;
          const latCross = lat1 + t * (lat2 - lat1);

          currentSegment.push([180, latCross]);
          if (currentSegment.length >= 2) {
            segments.push(currentSegment);
          }
          currentSegment = [[-180, latCross], pt];
        } else if (lon1 < 0 && lon2 > 0) {
          // West to East crossing (e.g. -179 to +179)
          const dLon = (lon2 - 360) - lon1;
          const t = dLon !== 0 ? (-180 - lon1) / dLon : 0.5;
          const latCross = lat1 + t * (lat2 - lat1);

          currentSegment.push([-180, latCross]);
          if (currentSegment.length >= 2) {
            segments.push(currentSegment);
          }
          currentSegment = [[180, latCross], pt];
        } else {
          if (currentSegment.length >= 2) {
            segments.push(currentSegment);
          }
          currentSegment = [pt];
        }
      } else {
        currentSegment.push(pt);
      }
    }
  }

  if (currentSegment.length >= 2) {
    segments.push(currentSegment);
  }

  return {
    type: 'FeatureCollection',
    features: segments.map((seg, index) => ({
      type: 'Feature',
      id: `${prefixId}-segment-${index}`,
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: seg,
      },
    })),
  };
}

/**
 * Calculates a complete GeoJSON FeatureCollection for a satellite's orbital trail
 */
export function calculateOrbitTrailGeoJson(
  gpData: SatelliteGPData | null | undefined,
  pointsCount: number = 120,
  timestampMs: number = Date.now(),
  prefixId: string = 'orbit'
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  if (!gpData) {
    return { type: 'FeatureCollection', features: [] };
  }
  const points = calculateSatelliteOrbitTrail(gpData, pointsCount, timestampMs);
  return generateOrbitTrailGeoJson(points, prefixId);
}

export interface SatelliteArrowInfo {
  arrowPos: [number, number];
  bearing: number;
}

/**
 * Calculates a future position directly on the calculated orbital path line,
 * positioned aheadSeconds (default 50s) along the orbit, along with its directional bearing angle in degrees (0-360).
 */
export function calculateSatelliteArrowFromOrbit(
  gp: SatelliteGPData | null | undefined,
  timestampMs: number = Date.now(),
  aheadSeconds: number = 50
): SatelliteArrowInfo | null {
  if (!gp) return null;

  // Current position at timestampMs
  const currentPos = calculateSatellitePosition(gp, timestampMs);
  if (!currentPos) return null;

  // Future position at timestampMs + aheadSeconds
  const futurePos = calculateSatellitePosition(gp, timestampMs + aheadSeconds * 1000);
  if (!futurePos) return null;

  const cLon = currentPos.longitude;
  const cLat = currentPos.latitude;
  const fLon = futurePos.longitude;
  const fLat = futurePos.latitude;

  // Calculate bearing from cLon,cLat to fLon,fLat
  const lat1Rad = (cLat * Math.PI) / 180;
  const lat2Rad = (fLat * Math.PI) / 180;

  let dLon = fLon - cLon;
  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;
  const dLonRad = (dLon * Math.PI) / 180;

  const y = Math.sin(dLonRad) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLonRad);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  return {
    arrowPos: [fLon, fLat],
    bearing,
  };
}

export interface OrbitalVisualizationData {
  currentPos: { latitude: number; longitude: number; altitudeKm: number; velocityKmH: number };
  trailGeoJson: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  arrowInfo: SatelliteArrowInfo | null;
}

/**
 * Single unified orbital visualization pipeline for BOTH Feature 1 (ISS Tracker) and Feature 2 (Satellite Explorer).
 * Calculates current position, full orbit trail, and 50s ahead directional arrow from the exact same GP parameters and timestamp.
 */
export function calculateOrbitalVisualization(
  gpData: SatelliteGPData | null | undefined,
  timestampMs: number = Date.now(),
  prefixId: string = 'orbit',
  aheadSeconds: number = 50
): OrbitalVisualizationData | null {
  if (!gpData) return null;

  const currentPos = calculateSatellitePosition(gpData, timestampMs);
  if (!currentPos) return null;

  const trailGeoJson = calculateOrbitTrailGeoJson(gpData, 120, timestampMs, prefixId);
  const arrowInfo = calculateSatelliteArrowFromOrbit(gpData, timestampMs, aheadSeconds);

  return {
    currentPos,
    trailGeoJson,
    arrowInfo,
  };
}
