import { ISSPassItem, SatelliteGPData } from '../types';
import { fetchSatellites, calculateSatellitePosition } from './satelliteService';

const EARTH_RADIUS_KM = 6378.137;

/**
 * Converts azimuth angle in degrees (0-360) to a cardinal direction string
 */
export function azimuthToCardinal(azimuthDeg: number): string {
  const normalized = (azimuthDeg % 360 + 360) % 360;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  const index = Math.round(normalized / 45);
  return `${directions[index]} (${Math.round(normalized)}°)`;
}

/**
 * Calculates topocentric East-North-Up (ENU) elevation and azimuth of ISS from observer location
 */
function calculateTopocentricHorizon(
  obsLatDeg: number,
  obsLonDeg: number,
  obsAltKm: number,
  satLatDeg: number,
  satLonDeg: number,
  satAltKm: number
): { elevationDeg: number; azimuthDeg: number; distanceKm: number } {
  const phi = (obsLatDeg * Math.PI) / 180;
  const lambda = (obsLonDeg * Math.PI) / 180;

  const rObs = EARTH_RADIUS_KM + obsAltKm;
  const xObs = rObs * Math.cos(phi) * Math.cos(lambda);
  const yObs = rObs * Math.cos(phi) * Math.sin(lambda);
  const zObs = rObs * Math.sin(phi);

  const phiSat = (satLatDeg * Math.PI) / 180;
  const lambdaSat = (satLonDeg * Math.PI) / 180;
  const rSat = EARTH_RADIUS_KM + satAltKm;
  const xSat = rSat * Math.cos(phiSat) * Math.cos(lambdaSat);
  const ySat = rSat * Math.cos(phiSat) * Math.sin(lambdaSat);
  const zSat = rSat * Math.sin(phiSat);

  const dx = xSat - xObs;
  const dy = ySat - yObs;
  const dz = zSat - zObs;

  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const sinLam = Math.sin(lambda);
  const cosLam = Math.cos(lambda);

  const east = -sinLam * dx + cosLam * dy;
  const north = -sinPhi * cosLam * dx - sinPhi * sinLam * dy + cosPhi * dz;
  const up = cosPhi * cosLam * dx + cosPhi * sinLam * dy + sinPhi * dz;

  const distance = Math.sqrt(east * east + north * north + up * up);
  const elevationRad = Math.asin(up / distance);
  const elevationDeg = (elevationRad * 180) / Math.PI;

  let azimuthRad = Math.atan2(east, north);
  let azimuthDeg = (azimuthRad * 180) / Math.PI;
  if (azimuthDeg < 0) azimuthDeg += 360;

  return { elevationDeg, azimuthDeg, distanceKm: distance };
}

/**
 * Calculates solar elevation at a given location and timestamp to check day/night
 */
function calculateSolarElevation(latDeg: number, lonDeg: number, timestampMs: number): number {
  const dDays = timestampMs / 86400000 - 10957.5;
  const meanAnomaly = ((357.529 + 0.98560028 * dDays) * Math.PI) / 180;
  const eclipticLon =
    ((280.459 + 0.98564736 * dDays + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * Math.PI) /
    180;

  const sinDec = Math.sin(23.439 * (Math.PI / 180)) * Math.sin(eclipticLon);
  const decRad = Math.asin(sinDec);

  let gmstRad = ((280.46061837 + 360.98564736629 * dDays) * Math.PI) / 180;
  gmstRad = gmstRad % (2 * Math.PI);
  if (gmstRad < 0) gmstRad += 2 * Math.PI;

  const hourAngleRad = gmstRad + (lonDeg * Math.PI) / 180 - Math.atan2(Math.cos(23.439 * (Math.PI / 180)) * Math.sin(eclipticLon), Math.cos(eclipticLon));

  const phi = (latDeg * Math.PI) / 180;
  const sinAlt = Math.sin(phi) * Math.sin(decRad) + Math.cos(phi) * Math.cos(decRad) * Math.cos(hourAngleRad);
  return (Math.asin(sinAlt) * 180) / Math.PI;
}

/**
 * Calculates upcoming observer-specific ISS passes over a target time window
 */
export async function calculateISSPasses(
  obsLat: number,
  obsLon: number,
  obsAltKm: number = 0,
  daysToScan: number = 3,
  nowMs: number = Date.now()
): Promise<ISSPassItem[]> {
  try {
    const satellites = await fetchSatellites('visual');
    let issGp = satellites.find((s) => s.NORAD_CAT_ID === 25544);

    if (!issGp && satellites.length > 0) {
      issGp = satellites[0];
    }

    if (!issGp) {
      throw new Error('Unable to retrieve ISS orbital parameters from CelesTrak.');
    }

    const scanEndMs = nowMs + daysToScan * 86400 * 1000;
    const stepMs = 25 * 1000; // 25s resolution
    const passes: ISSPassItem[] = [];

    let inPass = false;
    let passStartMs = 0;
    let passEndMs = 0;
    let passPeakMs = 0;
    let maxEl = -90;
    let riseAz = 0;
    let peakAz = 0;
    let setAz = 0;

    for (let t = nowMs; t <= scanEndMs; t += stepMs) {
      const pos = calculateSatellitePosition(issGp, t);
      if (!pos) continue;

      const horiz = calculateTopocentricHorizon(
        obsLat,
        obsLon,
        obsAltKm,
        pos.latitude,
        pos.longitude,
        pos.altitudeKm
      );

      if (horiz.elevationDeg > 0) {
        if (!inPass) {
          inPass = true;
          passStartMs = t;
          maxEl = horiz.elevationDeg;
          passPeakMs = t;
          riseAz = horiz.azimuthDeg;
          peakAz = horiz.azimuthDeg;
        } else {
          if (horiz.elevationDeg > maxEl) {
            maxEl = horiz.elevationDeg;
            passPeakMs = t;
            peakAz = horiz.azimuthDeg;
          }
        }
      } else {
        if (inPass) {
          inPass = false;
          passEndMs = t;
          setAz = horiz.azimuthDeg;

          // Record valid pass if max elevation >= 10 degrees and duration >= 60s
          const durationSec = Math.round((passEndMs - passStartMs) / 1000);

          if (maxEl >= 10 && durationSec >= 60) {
            const obsSolarEl = calculateSolarElevation(obsLat, obsLon, passPeakMs);
            const issPosAtPeak = calculateSatellitePosition(issGp, passPeakMs);
            const issSolarEl = issPosAtPeak
              ? calculateSolarElevation(issPosAtPeak.latitude, issPosAtPeak.longitude, passPeakMs)
              : 0;

            let visibility: ISSPassItem['visibility'] = 'Visible';
            let visibilityDetails = 'Nighttime sky pass with direct solar illumination.';

            if (obsSolarEl > -6) {
              visibility = 'Daylight Pass';
              visibilityDetails = 'Pass occurs during daytime daylight hours.';
            } else if (issSolarEl < -12) {
              visibility = 'Unlit / Shadow';
              visibilityDetails = 'Pass occurs in Earth shadow (unlit by Sun).';
            } else if (maxEl < 15) {
              visibility = 'Low Elevation';
              visibilityDetails = 'Pass stays low on the horizon (< 15° max elevation).';
            }

            const riseCard = azimuthToCardinal(riseAz);
            const setCard = azimuthToCardinal(setAz);
            const riseShort = riseCard.split(' ')[0];
            const setShort = setCard.split(' ')[0];

            passes.push({
              id: `iss-pass-${passStartMs}`,
              startTime: passStartMs,
              peakTime: passPeakMs,
              endTime: passEndMs,
              durationSec,
              maxElevation: Math.round(maxEl),
              riseAzimuth: riseCard,
              peakAzimuth: azimuthToCardinal(peakAz),
              setAzimuth: setCard,
              directionSummary: `${riseShort} → ${setShort}`,
              visibility,
              visibilityDetails,
            });
          }

          if (passes.length >= 10) break;
        }
      }
    }

    return passes;
  } catch (err: any) {
    throw new Error(err.message || 'Failed to calculate ISS pass predictions.');
  }
}

/**
 * Calculates dynamic countdown ticker for next upcoming pass
 */
export function calculatePassCountdown(targetMs: number, nowMs: number = Date.now()): {
  countdownText: string;
  isLive: boolean;
  isPast: boolean;
} {
  const diffMs = targetMs - nowMs;

  if (diffMs <= 0) {
    if (Math.abs(diffMs) <= 10 * 60 * 1000) {
      return { countdownText: 'PASS IN PROGRESS', isLive: true, isPast: false };
    } else {
      return { countdownText: 'PASSED', isLive: false, isPast: true };
    }
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const daysStr = days > 0 ? `${days}d ` : '';
  const hoursStr = hours > 0 || days > 0 ? `${hours.toString().padStart(2, '0')}h ` : '';
  const minutesStr = `${minutes.toString().padStart(2, '0')}m `;
  const secondsStr = `${seconds.toString().padStart(2, '0')}s`;

  return {
    countdownText: `T - ${daysStr}${hoursStr}${minutesStr}${secondsStr}`,
    isLive: false,
    isPast: false,
  };
}
