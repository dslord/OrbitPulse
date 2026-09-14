/**
 * Shared TypeScript interface and type definitions for OrbitPulse
 */

export interface ISSTelemetry {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  timestamp: number;
  isCached?: boolean;
}

export interface MeteorApproachData {
  close_approach_date?: string;
  close_approach_date_full?: string;
  epoch_date_close_approach?: number;
  miss_distance?: {
    astronomical?: string;
    lunar?: string;
    kilometers?: string;
    miles?: string;
  };
  relative_velocity?: {
    kilometers_per_hour?: string;
    kilometers_per_second?: string;
    miles_per_hour?: string;
  };
  orbiting_body?: string;
}

export interface MeteorEstimatedDiameter {
  kilometers?: {
    estimated_diameter_min: number;
    estimated_diameter_max: number;
  };
  meters?: {
    estimated_diameter_min: number;
    estimated_diameter_max: number;
  };
  miles?: {
    estimated_diameter_min: number;
    estimated_diameter_max: number;
  };
}

export interface MeteorOrbitalData {
  orbit_id?: string;
  orbit_determination_date?: string;
  first_observation_date?: string;
  last_observation_date?: string;
  data_arc_in_days?: number;
  observations_used?: number;
  orbit_uncertainty?: string;
  minimum_orbit_intersection?: string;
  jupiter_tisserand_invariant?: string;
  epoch_osculation?: string;
  eccentricity?: string;
  semi_major_axis?: string;
  inclination?: string;
  ascending_node_longitude?: string;
  orbital_period?: string;
  perihelion_distance?: string;
  perihelion_argument?: string;
  aphelion_distance?: string;
  perihelion_time?: string;
  mean_anomaly?: string;
  mean_motion?: string;
  equinox?: string;
  orbit_class?: {
    orbit_class_type?: string;
    orbit_class_description?: string;
    orbit_class_range?: string;
  };
}

export interface MeteorObject {
  id: string;
  name: string;
  nasa_jpl_url?: string;
  absolute_magnitude_h?: number;
  is_potentially_hazardous_asteroid?: boolean;
  is_sentry_object?: boolean;
  threatScore?: number;
  close_approach_data?: MeteorApproachData[];
  current_approach?: MeteorApproachData;
  estimated_diameter?: MeteorEstimatedDiameter;
  orbital_data?: MeteorOrbitalData;
}

export interface SpaceNewsArticle {
  id: number;
  title: string;
  url: string;
  image_url?: string | null;
  news_site: string;
  summary: string;
  published_at: string;
}

export type SatelliteCategory = 'visual' | 'stations' | 'weather' | 'resource';

export interface SatelliteGPData {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  NORAD_CAT_ID: number;
  CLASSIFICATION_TYPE?: string;
  EPHEMERIS_TYPE?: number;
  ELEMENT_SET_NO?: number;
  REV_AT_EPOCH?: number;
  BSTAR?: number;
  MEAN_MOTION_DOT?: number;
  MEAN_MOTION_DDOT?: number;
}

export interface SatellitePosition {
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmH: number;
  timestamp: number;
}

export interface SatelliteItem {
  id: string;
  name: string;
  noradId: number;
  designator: string;
  category: SatelliteCategory;
  gpData: SatelliteGPData;
  position: SatellitePosition | null;
}

export interface LaunchItem {
  id: string;
  name: string;
  net: string;
  statusName: string;
  statusAbbrev: string;
  providerName: string;
  rocketName: string;
  locationName: string;
  padName: string;
  missionDescription: string;
  missionType: string;
  imageUrl: string | null;
  webcastUrl: string | null;
}

export interface ISSPassItem {
  id: string;
  startTime: number;
  peakTime: number;
  endTime: number;
  durationSec: number;
  maxElevation: number;
  riseAzimuth: string;
  peakAzimuth: string;
  setAzimuth: string;
  directionSummary: string;
  visibility: 'Visible' | 'Daylight Pass' | 'Unlit / Shadow' | 'Low Elevation';
  visibilityDetails: string;
}

export type MissionStatus = 'Active' | 'Completed' | 'Upcoming';

export interface MissionItem {
  id: string;
  name: string;
  agency: string;
  agencyAbbrev: string;
  status: MissionStatus;
  category: string;
  target: string;
  launchDate?: string;
  duration?: string;
  description: string;
  objectives: string[];
  websiteUrl?: string;
  imageUrl?: string;
}

export type SpacecraftOrbitRegion =
  | 'Earth Orbit'
  | 'Deep Space'
  | 'Lunar Orbit'
  | 'Mars Orbit'
  | 'Jovian System'
  | 'Solar Orbit';

export type SpacecraftTrackingStatus =
  | 'Live Telemetry'
  | 'Trajectory / Orbit View'
  | 'Telemetry Unavailable';

export interface SpacecraftItem {
  id: string;
  name: string;
  mission: string;
  agency: string;
  agencyAbbrev: string;
  noradCatId?: number;
  region: SpacecraftOrbitRegion;
  status: 'Active' | 'Completed' | 'En Route';
  trackingType: SpacecraftTrackingStatus;
  launchDate: string;
  destination: string;
  description: string;
  primaryObjectives: string[];
  websiteUrl?: string;
  imageUrl?: string;
  hasLiveTracking: boolean;
}

export type RootStackParamList = {
  Home: undefined;
  ISSlocator: undefined;
  Meteor: undefined;
  Updates: undefined;
  SpaceNews: undefined;
  SatelliteExplorer: undefined;
  LaunchTracker: undefined;
  LaunchDetails: { launch: LaunchItem };
  ISSPass: undefined;
  AsteroidDetails: { asteroid: MeteorObject };
  TodayInSpace: undefined;
  SpaceAgencies: undefined;
  MissionExplorer: undefined;
  MissionDetails: { mission: MissionItem };
  SpacecraftTracker: undefined;
  SpacecraftDetails: { spacecraft: SpacecraftItem };
};
