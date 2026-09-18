export type GrassType =
  | 'tall-fescue'
  | 'kentucky-bluegrass'
  | 'perennial-ryegrass'
  | 'bermuda'
  | 'zoysia'
  | 'st-augustine'
  | 'centipede'
  | 'mixed-unsure';

export type SunExposure = 'full-sun' | 'part-sun' | 'shade';
export type Slope = 'flat' | 'gentle-slope' | 'steep-slope';
export type YardCondition = 'strong' | 'thin' | 'weedy' | 'bare';
export type CareEventType = 'watered' | 'fertilized' | 'weed-control';
export type WateringStatus = 'water-now' | 'wait' | 'check-soil' | 'skip';

export interface YardSegment {
  id: string;
  name: string;
  shortName: string;
  sun: SunExposure;
  slope: Slope;
  condition: YardCondition;
  area: 'back' | 'left-side' | 'right-side' | 'front';
  sprinklerMinutes: number;
  note: string;
}

export interface GrassProfile {
  grassType: GrassType;
  weedTypes: string[];
  sprinklerMinutes: number;
  locationName: string;
  location: WeatherLocation | null;
}

export interface WeatherLocation {
  id?: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface CareEvent {
  id: string;
  type: CareEventType;
  at: string;
  segmentId: string;
  minutes?: number;
  product?: string;
  note?: string;
}

export interface GrassManagerState {
  profile: GrassProfile;
  events: CareEvent[];
  selectedSegmentId: string;
}

export interface WeatherCurrent {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: number;
}

export interface DailyWeather {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  precipitationProbability: number;
  sunrise: string;
  sunset: string;
  sunshineDuration: number;
  windSpeedMax: number;
}

export interface WeatherSnapshot {
  timezone: string;
  current: WeatherCurrent;
  daily: DailyWeather[];
  fetchedAt: string;
}

export interface WateringPlan {
  status: WateringStatus;
  label: string;
  headline: string;
  detail: string;
  timing: string;
  minutes: number;
  reasons: string[];
  watchFor: string;
}

export interface GrassInsights {
  headline: string;
  actions: string[];
  propagation: string;
  weedPlan: string;
  sprinklerPlan: string;
}

export type TipCategory = 'water' | 'grow' | 'weeds' | 'sun' | 'soil';

export interface TipCard {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: TipCategory;
  tags: string[];
  updatedAt?: string;
  source?: string;
}

export interface LocationSearchResult extends WeatherLocation {
  countryCode?: string;
}
