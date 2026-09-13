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

export type RootStackParamList = {
  Home: undefined;
  ISSlocator: undefined;
  Meteor: undefined;
  Updates: undefined;
  SpaceNews: undefined;
};
