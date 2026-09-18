'use client';

import Link from 'next/link';

import { CareLogPanel } from './CareLogPanel';
import { GrassInsights } from './GrassInsights';
import { GrassLocationBar } from './GrassLocationBar';
import { GrassProfileForm } from './GrassProfileForm';
import { GrassTipCards } from './GrassTipCards';
import { useGrassManager } from './useGrassManager';
import { WateringPlanCard } from './WateringPlanCard';
import { WeatherSummary } from './WeatherSummary';
import { YardMap } from './YardMap';
import styles from './GrassManagerView.module.scss';

export function GrassManagerView() {
  const manager = useGrassManager();
  const { state, selectedSegment } = manager;
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>← Experiments</Link>
      <header className={styles.hero}>
        <div><span className={styles.eyebrow}>Field guide · grass manager</span><h1>Make the good grass contagious.</h1><p>One calm, repeatable plan for a yard that wraps around the house—weather-aware, zone-aware, and honest about what you actually did.</p></div>
        <div className={styles.heroStamp}><span>Today</span><strong>{new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}</strong><small>{state.events.length} logged care {state.events.length === 1 ? 'step' : 'steps'}</small></div>
      </header>
      <GrassLocationBar locationName={state.profile.locationName} results={manager.locationResults} loading={manager.locationLoading} onSearch={manager.findLocations} onChoose={manager.chooseLocation} />
      <div className={styles.weatherGrid}>
        <WeatherSummary weather={manager.weather} loading={manager.weatherLoading} error={manager.weatherError} onRefresh={manager.refreshWeather} />
        <WateringPlanCard plan={manager.plan} segmentName={selectedSegment.name} />
      </div>
      <div className={styles.workspaceGrid}>
        <YardMap selectedId={state.selectedSegmentId} onChoose={manager.chooseSegment} selectedSegment={selectedSegment} />
        <GrassProfileForm profile={state.profile} onChange={manager.updateProfile} />
        <CareLogPanel events={state.events} selectedSegment={selectedSegment} onAdd={manager.addCareEvent} onRemove={manager.removeCareEvent} />
      </div>
      <GrassInsights insights={manager.insights} segment={selectedSegment} />
      <GrassTipCards cards={manager.tips} loading={manager.tipsLoading} />
    </main>
  );
}
