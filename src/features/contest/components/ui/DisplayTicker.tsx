'use client';

import type { ContestDisplaySurface } from '@/contest/lib/presentation/displaySurface';
import type {
  DisplayModel,
  DisplayRound,
} from '@/contest/lib/presentation/displayModel';
import { MaterialSymbol } from './MaterialSymbol';
import { matchupLabel } from './displayLabels';

function firstMatchup(round: DisplayRound | null | undefined) {
  return round?.matchups[0] ?? null;
}

function featuredPanelTitle(model: DisplayModel, surface: ContestDisplaySurface) {
  if (model.featuredMatchupMode === 'standby') return surface.standbySpotlightLabel;
  return model.featuredMatchup?.contestantA.name ?? 'Waiting for active round';
}

function featuredPanelSubtitle(model: DisplayModel) {
  if (!model.featuredMatchup) return 'No matchup currently scoring';
  if (model.featuredMatchupMode === 'standby') {
    return `Next look: ${matchupLabel(model.featuredMatchup)}`;
  }
  return `vs ${model.featuredMatchup.contestantB.name}`;
}

/** The hero's now/next panel pair — champion results once crowned, live spotlight otherwise. */
export function DisplayTicker({
  model,
  surface,
}: {
  model: DisplayModel;
  surface: ContestDisplaySurface;
}) {
  const activeRound = model.rounds.find((round) => round.id === model.activeRoundId) ?? null;
  const activeRoundIndex = activeRound
    ? model.rounds.findIndex((round) => round.id === activeRound.id)
    : -1;
  const nextRound = activeRoundIndex >= 0 ? model.rounds[activeRoundIndex + 1] ?? null : null;
  const nextMatchup = firstMatchup(nextRound);

  return model.champion ? (
    <div className="contest-display__ticker">
      <section className="contest-display__panel contest-display__panel--now">
        <span className="contest-display__label">
          <MaterialSymbol
            name="emoji_events"
            className="contest-display__panel-icon"
          />
          Champion
        </span>
        <strong className="contest-display__value">
          {model.champion.contestant.name}
        </strong>
        <span className="contest-display__panel-sub">
          {model.champion.runnerUp
            ? `Defeated ${model.champion.runnerUp.name}`
            : `Won ${model.champion.finalRoundName}`}
        </span>
      </section>
      <section className="contest-display__panel contest-display__panel--next">
        <span className="contest-display__label">
          <MaterialSymbol name="celebration" className="contest-display__panel-icon" />
          Final
        </span>
        <strong className="contest-display__value">{model.champion.finalRoundName}</strong>
        <span className="contest-display__panel-sub">
          {typeof model.champion.contestant.score === 'number' &&
          model.champion.runnerUp &&
          typeof model.champion.runnerUp.score === 'number'
            ? `Final score: ${model.champion.contestant.score} – ${model.champion.runnerUp.score}`
            : 'Bracket complete'}
        </span>
      </section>
    </div>
  ) : (
    <div className="contest-display__ticker">
      <section className="contest-display__panel contest-display__panel--now">
        <span className="contest-display__label">
          <MaterialSymbol name={surface.centerIcon} className="contest-display__panel-icon" />
          {model.featuredMatchupMode === 'shake'
            ? surface.nowPanelLabel
            : surface.standbyPanelLabel}
        </span>
        <strong className="contest-display__value">{featuredPanelTitle(model, surface)}</strong>
        <span className="contest-display__panel-sub">{featuredPanelSubtitle(model)}</span>
      </section>
      <section className="contest-display__panel contest-display__panel--next">
        <span className="contest-display__label">
          <MaterialSymbol name="double_arrow" className="contest-display__panel-icon" />
          {surface.nextPanelLabel}
        </span>
        <strong className="contest-display__value">
          {nextMatchup
            ? nextMatchup.contestantA.name
            : model.nextRoundName ?? 'No next round queued'}
        </strong>
        <span className="contest-display__panel-sub">
          {nextMatchup ? `vs ${nextMatchup.contestantB.name}` : 'Awaiting bracket advance'}
        </span>
      </section>
    </div>
  );
}
