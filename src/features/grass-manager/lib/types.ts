export type GrassType =
  | 'tall-fescue'
  | 'kentucky-bluegrass'
  | 'perennial-ryegrass'
  | 'bermuda'
  | 'zoysia'
  | 'st-augustine'
  | 'centipede'
  | 'mixed-unsure';

export type SunExposure = 'unknown' | 'full-sun' | 'part-sun' | 'shade';
export type Slope = 'flat' | 'gentle-slope' | 'steep-slope';
export type YardCondition = 'unknown' | 'strong' | 'thin' | 'weedy' | 'bare';
export type CareEventType = 'watered' | 'fertilized' | 'weed-control' | 'hand-weeded';
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
  sprinklerInches?: number;
  weedCoverage: 'scattered' | 'patches' | 'widespread';
  lawnStage: 'established' | 'seeding' | 'new-seed' | 'dormant';
  configured: boolean;
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
  zones: Record<string, Pick<YardSegment, 'sun' | 'condition'>>;
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
  precipitationProbability: number | null;
  sunrise: string;
  sunset: string;
  sunshineDuration: number;
  windSpeedMax: number;
}

export interface WeatherSnapshot {
  timezone: string;
  current: WeatherCurrent;
  daily: DailyWeather[];
  hourly: HourlyWeather[];
  fetchedAt: string;
}

export interface HourlyWeather {
  time: string;
  precipitation: number | null;
  precipitationProbability: number | null;
}

export interface WateringPlan {
  date: string;
  status: WateringStatus;
  label: string;
  reason: string;
  timing: string;
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
