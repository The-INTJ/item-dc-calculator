'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { getWeatherCodeInfo } from '../lib/weatherCodes';
import type { WateringPlan, WeatherSnapshot } from '../lib/types';
import { WateringPlanCard } from './WateringPlanCard';
import styles from './GrassManagerView.module.scss';

interface Props {
  weather: WeatherSnapshot | null; loading: boolean; error: string | null; onRefresh: () => void;
  outlook: WateringPlan[]; locationControl: ReactNode;
}

function dayName(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
}

export function WeatherSummary({ weather, loading, error, onRefresh, outlook, locationControl }: Props) {
  const [selectedDate, setSelectedDate] = useState('');
  const selected = outlook.find((plan) => plan.date === selectedDate) ?? outlook[0];
  const days = outlook.map((plan) => ({ plan, day: weather?.daily.find((day) => day.date === plan.date) }));
  const current = weather ? getWeatherCodeInfo(weather.current.weatherCode) : null;
  return (
    <section className={styles.weatherCard} aria-labelledby="watering-heading">
      <header className={styles.cardHeading}>
        <div><h2 id="watering-heading">Watering outlook</h2>{locationControl}</div>
        <div className={styles.weatherNow}>{weather && <span>{Math.round(weather.current.temperature)}° <small>{current?.label}</small></span>}
          <button type="button" className={styles.textButton} onClick={onRefresh} disabled={loading} aria-label="Refresh weather">↻</button>
        </div>
      </header>
      {loading && <p className={styles.quiet} role="status">Loading forecast…</p>}
      {error && <p className={styles.inlineError} role="alert">{error}</p>}
      {weather && selected ? <>
        <div className={styles.forecastStrip} role="group" aria-label="Five day forecast and watering outlook">
          {days.map(({ plan, day }, index) => day && (
            <button key={day.date} type="button" className={styles.forecastDay} aria-pressed={selected.date === day.date}
              data-status={plan.status} onClick={() => setSelectedDate(day.date)}>
              <strong>{index === 0 ? 'Today' : dayName(day.date)}</strong>
              <span className={styles.weatherIcon} title={getWeatherCodeInfo(day.weatherCode).label}>{getWeatherCodeInfo(day.weatherCode).icon}</span>
              <span className={styles.temperatures}>{Math.round(day.temperatureMax)}° <small>{Math.round(day.temperatureMin)}°</small></span>
              <span className={styles.rainBar} aria-hidden="true" style={{ '--rain': `${Math.min(100, day.precipitation / 0.75 * 100)}%` } as CSSProperties}><i /></span>
              <span className={styles.rainLabel}>{day.precipitationProbability === null ? '—' : day.precipitationProbability + '%'} · {day.precipitation.toFixed(2)}″</span>
              <span className={styles.dayAction}>{plan.label}</span>
            </button>
          ))}
        </div>
        <WateringPlanCard plan={selected} isToday={selected.date === outlook[0]?.date} />
        <p className={styles.forecastCaption}>Rain chance · expected inches. Select a day for why. Assumes no additional watering.</p>
      </> : !loading && !error && <div className={styles.weatherEmpty}><span>☁</span><h3>Will rain do the watering?</h3><p>Choose your town to see the next five days.</p></div>}
    </section>
  );
}
