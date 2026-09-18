import { getWeatherCodeInfo } from '../lib/weatherCodes';
import { weatherTimeLabel } from '../lib/weatherTime';
import type { WeatherSnapshot } from '../lib/types';
import styles from './GrassManagerView.module.scss';

interface WeatherSummaryProps {
  weather: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function dateLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString([], { weekday: 'short' });
}

function timeLabel(value: string): string {
  return weatherTimeLabel(value);
}

export function WeatherSummary({ weather, loading, error, onRefresh }: WeatherSummaryProps) {
  if (!weather) {
    return (
      <section className={styles.weatherCard}>
        <div className={styles.cardHeading}>
          <div><span className={styles.eyebrow}>Live weather</span><h2>Put your yard on the map</h2></div>
          <span className={styles.weatherGlyph}>☁︎</span>
        </div>
        <p className={styles.emptyCopy}>Search for your town or use your location to turn the care plan into a forecast.</p>
        {error && <p className={styles.inlineError}>{error}</p>}
      </section>
    );
  }

  const currentInfo = getWeatherCodeInfo(weather.current.weatherCode);
  const firstDays = weather.daily.slice(0, 5);
  return (
    <section className={styles.weatherCard}>
      <div className={styles.cardHeading}>
        <div><span className={styles.eyebrow}>Live weather · {weather.timezone}</span><h2>Today’s conditions</h2></div>
        <button type="button" className={styles.iconButton} onClick={onRefresh} aria-label="Refresh weather">↻</button>
      </div>
      {loading && <p className={styles.loadingLine}>Refreshing the forecast…</p>}
      {error && <p className={styles.inlineError}>{error}</p>}
      <div className={styles.currentWeather}>
        <span className={styles.weatherGlyph} data-tone={currentInfo.tone}>{currentInfo.icon}</span>
        <div><strong>{Math.round(weather.current.temperature)}°</strong><span>{currentInfo.label}</span></div>
        <dl className={styles.weatherStats}>
          <div><dt>Feels</dt><dd>{Math.round(weather.current.apparentTemperature)}°</dd></div>
          <div><dt>Humidity</dt><dd>{weather.current.humidity}%</dd></div>
          <div><dt>Wind</dt><dd>{Math.round(weather.current.windSpeed)} mph</dd></div>
        </dl>
      </div>
      <div className={styles.sunline}>
        <span>☼ Sunrise {timeLabel(weather.daily[0]?.sunrise ?? '')}</span>
        <span>◒ Sunset {timeLabel(weather.daily[0]?.sunset ?? '')}</span>
      </div>
      <div className={styles.forecastStrip} aria-label="Five day forecast">
        {firstDays.map((day) => {
          const info = getWeatherCodeInfo(day.weatherCode);
          return <div key={day.date} className={styles.forecastDay}>
            <span>{dateLabel(day.date)}</span>
            <strong>{info.icon}</strong>
            <b>{Math.round(day.temperatureMax)}°</b>
            <small>{day.precipitationProbability}% rain</small>
          </div>;
        })}
      </div>
    </section>
  );
}
