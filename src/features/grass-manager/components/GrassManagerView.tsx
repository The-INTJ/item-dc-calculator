'use client';

import { BackToExperiments } from '@/components/ui/BackToExperiments';

import { WHOLE_YARD } from '../lib/yard';
import { CareActions, CareHistory } from './care';
import { GrassLocationBar } from './GrassLocationBar';
import { GrassTipCards } from './GrassTipCards';
import { LawnGuide } from './LawnGuide';
import { useGrassManager } from './useGrassManager';
import { WeatherSummary } from './WeatherSummary';
import { YardMap } from './YardMap';
import { ZoneDetails } from './ZoneDetails';
import styles from './GrassManagerView.module.scss';

export function GrassManagerView() {
  const manager = useGrassManager();
  const { state, selectedSegment } = manager;
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div><BackToExperiments className={styles.backLink} /><h1>Grass Manager</h1></div>
        <CareActions scope={WHOLE_YARD} profile={state.profile} today={manager.today} onAdd={manager.addCareEvent} disabled={!manager.hydrated} />
      </header>
      {manager.saveError && <p role="alert" className={styles.inlineError}>Browser storage is unavailable. Changes will be lost when this page closes.</p>}
      <div className={styles.dashboard}>
        <WeatherSummary weather={manager.weather} loading={manager.weatherLoading} error={manager.weatherError} onRefresh={manager.refreshWeather} outlook={manager.outlook}
          locationControl={<GrassLocationBar locationName={state.profile.locationName} results={manager.locationResults} loading={manager.locationLoading} error={manager.locationError} onSearch={manager.findLocations} onChoose={manager.chooseLocation} />} />
        {manager.hydrated && <LawnGuide profile={state.profile} events={state.events} today={manager.today} weather={manager.weather} onChange={manager.updateProfile} />}
      </div>
      <section className={styles.yardCard} aria-labelledby="yard-heading">
        <header className={styles.cardHeading}><h2 id="yard-heading">Your yard</h2><span className={styles.subtle}>Select an area for local care</span></header>
        <YardMap segments={manager.segments} selectedId={state.selectedSegmentId} onChoose={manager.chooseSegment} />
        {selectedSegment && <ZoneDetails segment={selectedSegment} plan={manager.selectedPlan} profile={state.profile} events={state.events} today={manager.today} onChange={manager.updateZone} onAdd={manager.addCareEvent} onClose={() => manager.chooseSegment(selectedSegment.id)} />}
        <CareHistory events={state.events} onRemove={manager.removeCareEvent} />
      </section>
      <GrassTipCards cards={manager.tips} />
      <footer className={styles.footer}><span>Saved in this browser · rules-based guidance</span><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather by Open-Meteo</a></footer>
    </main>
  );
}
