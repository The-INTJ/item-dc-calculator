export interface WeatherCodeInfo {
  label: string;
  icon: string;
  tone: 'clear' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog';
  waterSignal: 'drying' | 'neutral' | 'wet' | 'freeze';
}

/** WMO weather interpretation codes returned by Open-Meteo. */
export const WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  0: { label: 'Clear sky', icon: '☀️', tone: 'clear', waterSignal: 'drying' },
  1: { label: 'Mainly clear', icon: '🌤️', tone: 'clear', waterSignal: 'drying' },
  2: { label: 'Partly cloudy', icon: '⛅', tone: 'cloud', waterSignal: 'neutral' },
  3: { label: 'Overcast', icon: '☁️', tone: 'cloud', waterSignal: 'neutral' },
  45: { label: 'Fog', icon: '🌫️', tone: 'fog', waterSignal: 'wet' },
  48: { label: 'Rime fog', icon: '🌫️', tone: 'fog', waterSignal: 'freeze' },
  51: { label: 'Light drizzle', icon: '🌦️', tone: 'rain', waterSignal: 'wet' },
  53: { label: 'Drizzle', icon: '🌦️', tone: 'rain', waterSignal: 'wet' },
  55: { label: 'Heavy drizzle', icon: '🌧️', tone: 'rain', waterSignal: 'wet' },
  56: { label: 'Light freezing drizzle', icon: '🌧️', tone: 'rain', waterSignal: 'freeze' },
  57: { label: 'Heavy freezing drizzle', icon: '🌧️', tone: 'rain', waterSignal: 'freeze' },
  61: { label: 'Light rain', icon: '🌦️', tone: 'rain', waterSignal: 'wet' },
  63: { label: 'Rain', icon: '🌧️', tone: 'rain', waterSignal: 'wet' },
  65: { label: 'Heavy rain', icon: '🌧️', tone: 'rain', waterSignal: 'wet' },
  66: { label: 'Light freezing rain', icon: '🌧️', tone: 'rain', waterSignal: 'freeze' },
  67: { label: 'Heavy freezing rain', icon: '🌧️', tone: 'rain', waterSignal: 'freeze' },
  71: { label: 'Light snow', icon: '🌨️', tone: 'snow', waterSignal: 'freeze' },
  73: { label: 'Snow', icon: '❄️', tone: 'snow', waterSignal: 'freeze' },
  75: { label: 'Heavy snow', icon: '❄️', tone: 'snow', waterSignal: 'freeze' },
  77: { label: 'Snow grains', icon: '🌨️', tone: 'snow', waterSignal: 'freeze' },
  80: { label: 'Light rain showers', icon: '🌦️', tone: 'rain', waterSignal: 'wet' },
  81: { label: 'Rain showers', icon: '🌧️', tone: 'rain', waterSignal: 'wet' },
  82: { label: 'Violent rain showers', icon: '⛈️', tone: 'storm', waterSignal: 'wet' },
  85: { label: 'Light snow showers', icon: '🌨️', tone: 'snow', waterSignal: 'freeze' },
  86: { label: 'Heavy snow showers', icon: '🌨️', tone: 'snow', waterSignal: 'freeze' },
  95: { label: 'Thunderstorm', icon: '⛈️', tone: 'storm', waterSignal: 'wet' },
  96: { label: 'Thunderstorm with hail', icon: '⛈️', tone: 'storm', waterSignal: 'wet' },
  99: { label: 'Thunderstorm with heavy hail', icon: '⛈️', tone: 'storm', waterSignal: 'wet' },
};

export function getWeatherCodeInfo(code: number): WeatherCodeInfo {
  return WEATHER_CODES[code] ?? {
    label: 'Changing conditions',
    icon: '🌥️',
    tone: 'cloud',
    waterSignal: 'neutral',
  };
}
