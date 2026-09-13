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
}

export interface MeteorApproachData {
  close_approach_date?: string;
  close_approach_date_full?: string;
  miss_distance?: {
    kilometers?: string;
  };
  relative_velocity?: {
    kilometers_per_hour?: string;
  };
}

export interface MeteorEstimatedDiameter {
  kilometers?: {
    estimated_diameter_min: number;
    estimated_diameter_max: number;
  };
}

export interface MeteorObject {
  id: string;
  name: string;
  threatScore?: number;
  close_approach_data?: MeteorApproachData[];
  current_approach?: MeteorApproachData;
  estimated_diameter?: MeteorEstimatedDiameter;
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

export type RootStackParamList = {
  Home: undefined;
  ISSlocator: undefined;
  Meteor: undefined;
  Updates: undefined;
  SpaceNews: undefined;
  SatelliteExplorer: undefined;
  LaunchTracker: undefined;
  LaunchDetails: { launch: LaunchItem };
};
