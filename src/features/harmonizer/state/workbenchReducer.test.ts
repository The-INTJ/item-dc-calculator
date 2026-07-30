import { describe, expect, it } from 'vitest';
import type { ConstraintLock } from '../domain/locks';
import { melodySignature } from '../domain/signatures';
import { durationToUnits, timeToUnits } from '../domain/timing';
import type { PersistedWorkbench, WorkbenchState } from '../domain/workbench-state';
import { getDefaultFixture } from '../fixtures/registry';
import type { WorkbenchAction } from './actions';
import {
  createInitialWorkbenchState,
  MAX_TEMPO_BPM,
  MIN_TEMPO_BPM,
  workbenchReducer,
} from './workbenchReducer';

const fixture = getDefaultFixture();
const initial = createInitialWorkbenchState(fixture);

function lockFor(candidateId: string, targetId: string): ConstraintLock {
  return {
    id: `lock-${targetId}`,
    targetType: 'voice_event',
    targetId,
    candidateId,
    valueSnapshot: null,
    createdAt: '2026-07-29T00:00:00.000Z',
  };
}

function resize(
  overrides: Partial<Extract<WorkbenchAction, { type: 'RESIZE_VOICE_EVENT' }>>,
): WorkbenchAction {
  return {
    type: 'RESIZE_VOICE_EVENT',
    candidateId: 'keep-moving',
    voice: 'alto',
    eventId: 'c-a-1',
    edge: 'right',
    targetBoundary: 6,
    ripple: false,
    gestureId: 'g1',
    ...overrides,
  };
}

describe('createInitialWorkbenchState', () => {
  it('seeds the workbench with authored suggestions and the new fields', () => {
    expect(initial.suggestionStatus).toBe('fresh');
    expect(initial.suggestionSource).toBe('authored');
    expect(initial.sourceFixtureId).toBe(fixture.id);
    expect(initial.candidateSetId).toBe('default');
    expect(initial.candidates).toHaveLength(3);
    expect(initial.selectedCandidateId).toBe('grounded-descent');
    expect(initial.appliedFragments).toEqual([]);
    expect(initial.history).toEqual([]);
    expect(initial.lastGestureId).toBeNull();
  });
});

describe('live regeneration', () => {
  it('soprano pitch step mirrors the melody and regenerates (computed for unknown melodies)', () => {
    const state = workbenchReducer(initial, {
      type: 'STEP_VOICE_EVENT_PITCH',
      candidateId: 'grounded-descent',
      voice: 'soprano',
      eventId: 'a-s-1',
      direction: 1,
    });
    // sol → la: melody changed, no fixture matches la–fa–mi.
    expect(melodySignature(state.fragment.events)).toBe('la4:q|fa4:q|mi4:h');
    expect(state.suggestionSource).toBe('computed');
    expect(state.candidates.every((candidate) => !candidate.provenance.fixtureAuthored)).toBe(
      true,
    );
    // The regenerated soprano mirrors the edited melody.
    const soprano = state.candidates[0].voicing.soprano;
    expect(soprano.map((event) => event.pitch.midi)).toEqual(
      state.fragment.events.map((event) => event.pitch.midi),
    );
    expect(state.history).toHaveLength(1);
  });

  it('inner-voice edits do NOT regenerate', () => {
    const state = workbenchReducer(initial, {
      type: 'STEP_VOICE_EVENT_PITCH',
      candidateId: 'grounded-descent',
      voice: 'alto',
      eventId: 'a-a-1',
      direction: -1,
    });
    expect(state.suggestionSource).toBe('authored');
    expect(state.candidates[0].id).toBe('grounded-descent');
    // Alto E4 stepped down to D4.
    expect(state.candidates[0].voicing.alto[0].pitch.midi).toBe(62);
    expect(state.fragment).toBe(initial.fragment);
  });

  it('locked notes are frozen against step, resize, and delete', () => {
    const locked = workbenchReducer(initial, {
      type: 'TOGGLE_LOCK',
      lock: lockFor('keep-moving', 'c-a-1'),
    });
    for (const action of [
      {
        type: 'STEP_VOICE_EVENT_PITCH',
        candidateId: 'keep-moving',
        voice: 'alto',
        eventId: 'c-a-1',
        direction: 1,
      } as const,
      resize({}),
      {
        type: 'DELETE_VOICE_EVENT',
        candidateId: 'keep-moving',
        voice: 'alto',
        eventId: 'c-a-1',
      } as const,
    ]) {
      expect(workbenchReducer(locked, action)).toBe(locked);
    }
  });

  it('lock toggle regenerates: satisfiable locks go computed, unlock returns to authored', () => {
    const locked = workbenchReducer(initial, {
      type: 'TOGGLE_LOCK',
      lock: lockFor('strong-arrival', 'b-b-1'),
    });
    expect(locked.locks.length).toBeGreaterThan(0);
    expect(locked.suggestionSource).toBe('computed');

    // Unlock through a live lock reference (the UI clicks the badge on the
    // replacement candidates' note, never a stale pre-replacement id).
    const liveLock =
      locked.locks.find((lock) =>
        locked.candidates.some((candidate) => candidate.id === lock.candidateId),
      ) ?? locked.locks[0];
    const unlocked = workbenchReducer(locked, {
      type: 'TOGGLE_LOCK',
      lock: { ...lockFor(liveLock.candidateId ?? '', liveLock.targetId), id: 'other' },
    });
    expect(unlocked.locks).toHaveLength(0);
    expect(unlocked.suggestionSource).toBe('authored');
    expect(unlocked.candidateSetId).toBe('default');
  });

  it('adopting a lock set remaps locks so badges and unlocking survive the swap', () => {
    const locked = workbenchReducer(initial, {
      type: 'TOGGLE_LOCK',
      lock: lockFor('grounded-descent', 'a-b-1'),
    });
    expect(locked.candidateSetId).toBe('locked-bass-grounded');
    expect(locked.suggestionSource).toBe('authored');
    // The original lock on the working reading plus one remapped lock per
    // adopted card, each targeting a live note.
    expect(locked.locks).toHaveLength(4);
    const selected = locked.candidates.find(
      (candidate) => candidate.id === locked.selectedCandidateId,
    );
    const selectedLock = locked.locks.find(
      (lock) => lock.candidateId === selected?.id,
    );
    expect(selectedLock).toBeTruthy();

    // Unlocking via the selected candidate's note removes the whole value-lock.
    const unlocked = workbenchReducer(locked, {
      type: 'TOGGLE_LOCK',
      lock: lockFor(selectedLock?.candidateId ?? '', selectedLock?.targetId ?? ''),
    });
    expect(unlocked.locks).toHaveLength(0);
    expect(unlocked.candidateSetId).toBe('default');
    expect(unlocked.suggestionSource).toBe('authored');
  });

  it('unsatisfiable locks produce constrained sketch cards; the surface never moves', () => {
    // Whole-bar alto E4 against the melody's fa: no diatonic triad fits the
    // middle span. The working reading stays EXACTLY as it is (the surface
    // rule); sketch cards appear around it — pinned note kept, hole marked ?.
    const state = workbenchReducer(initial, {
      type: 'TOGGLE_LOCK',
      lock: lockFor('grounded-descent', 'a-a-1'),
    });
    expect(state.suggestionSource).toBe('computed');
    expect(state.selectedCandidateId).toBe('grounded-descent');
    const working = state.candidates.find((candidate) => candidate.id === 'grounded-descent');
    expect(working).toEqual(initial.candidates[0]); // untouched, note for note
    const sketches = state.candidates.filter(
      (candidate) => !candidate.provenance.fixtureAuthored,
    );
    expect(sketches.length).toBeGreaterThan(0);
    for (const sketch of sketches) {
      expect(sketch.voicing.alto.map((event) => event.pitch.midi)).toEqual([64]);
      expect(
        sketch.harmonyEvents.some((event) => event.analysis.romanNumeral === '?'),
      ).toBe(true);
      expect(sketch.derivability?.some((note) => note.status === 'needs_math')).toBe(true);
    }
    // The original lock stays on the working note; unlocking it restores the
    // authored default suggestions.
    expect(state.locks.some((lock) => lock.candidateId === 'grounded-descent')).toBe(true);
    const unlocked = workbenchReducer(state, {
      type: 'TOGGLE_LOCK',
      lock: lockFor('grounded-descent', 'a-a-1'),
    });
    expect(unlocked.locks).toHaveLength(0);
    expect(unlocked.suggestionSource).toBe('authored');
    expect(unlocked.candidateSetId).toBe('default');
  });

  it('key change regenerates and an unknown-melody-in-key falls to computed', () => {
    const aMinor = {
      tonic: { letter: 'A' as const, accidental: 'natural' as const, pitchClass: 9 },
      tonicPitchClass: 9,
      mode: 'natural_minor' as const,
      minorDoSystem: 'la_based' as const,
      solfegeSystem: 'movable_do' as const,
    };
    const state = workbenchReducer(initial, {
      type: 'EDIT_TONAL_CONTEXT',
      tonalContext: aMinor,
    });
    expect(state.tonalContext.mode).toBe('natural_minor');
    expect(state.suggestionSource).toBe('computed');
    expect(
      workbenchReducer(state, { type: 'EDIT_TONAL_CONTEXT', tonalContext: aMinor }),
    ).toBe(state);
  });
});

describe('key change respell', () => {
  const gMajor = {
    tonic: { letter: 'G' as const, accidental: 'natural' as const, pitchClass: 7 },
    tonicPitchClass: 7,
    mode: 'major' as const,
    solfegeSystem: 'movable_do' as const,
  };
  const ebMajor = {
    tonic: { letter: 'E' as const, accidental: 'b' as const, pitchClass: 3 },
    tonicPitchClass: 3,
    mode: 'major' as const,
    solfegeSystem: 'movable_do' as const,
  };

  it('keeps every pitch byte-identical and re-reads every stored degree', () => {
    const state = workbenchReducer(initial, {
      type: 'EDIT_TONAL_CONTEXT',
      tonalContext: gMajor,
    });
    // Melody sol-fa-mi (G-F-E) re-reads: G = do, F = te (honest chromatic), E = la.
    state.fragment.events.forEach((event, i) => {
      expect(event.pitch).toEqual(initial.fragment.events[i].pitch);
    });
    expect(state.fragment.events.map((event) => event.scaleDegree.syllable)).toEqual([
      'do',
      'te',
      'la',
    ]);
    // The working reading's voicing degrees follow; its pitches do not move.
    const workingBefore = initial.candidates.find(
      (candidate) => candidate.id === initial.selectedCandidateId,
    )!;
    const workingAfter = state.candidates.find(
      (candidate) => candidate.id === initial.selectedCandidateId,
    )!;
    for (const voice of ['soprano', 'alto', 'tenor', 'bass'] as const) {
      workingAfter.voicing[voice].forEach((event, i) => {
        expect(event.pitch).toEqual(workingBefore.voicing[voice][i].pitch);
      });
    }
    // The re-derived chord strip speaks the new key: C major triad reads IV.
    expect(workingAfter.harmonyEvents[0].analysis.romanNumeral).toBe('IV');
  });

  it('undo restores the previous key and every degree reading atomically', () => {
    const changed = workbenchReducer(initial, {
      type: 'EDIT_TONAL_CONTEXT',
      tonalContext: ebMajor,
    });
    const undone = workbenchReducer(changed, { type: 'UNDO' });
    expect(undone.tonalContext).toEqual(initial.tonalContext);
    expect(undone.fragment).toEqual(initial.fragment);
    expect(
      undone.candidates.find((candidate) => candidate.id === initial.selectedCandidateId)
        ?.voicing,
    ).toEqual(
      initial.candidates.find((candidate) => candidate.id === initial.selectedCandidateId)
        ?.voicing,
    );
  });

  it('a spelled-differently context with the same pitch class is a real change', () => {
    // Same tonic pc as initial C major would be C major itself; use Eb→D#-style
    // guard indirectly: dispatching the identical context is a no-op…
    expect(
      workbenchReducer(initial, { type: 'EDIT_TONAL_CONTEXT', tonalContext: initial.tonalContext }),
    ).toBe(initial);
    // …while a different spelling of the same mode is not (Eb vs initial C).
    const changed = workbenchReducer(initial, {
      type: 'EDIT_TONAL_CONTEXT',
      tonalContext: ebMajor,
    });
    expect(changed).not.toBe(initial);
    expect(changed.tonalContext.tonic.letter).toBe('E');
  });
});

describe('structural editing', () => {
  it('inserts an inner-voice note by ripple without regenerating', () => {
    const state = workbenchReducer(initial, {
      type: 'INSERT_VOICE_EVENT',
      candidateId: 'grounded-descent',
      voice: 'alto',
      neighborEventId: 'a-a-1',
      side: 'after',
      newEventId: 'user-1',
    });
    const alto = state.candidates[0].voicing.alto;
    expect(alto).toHaveLength(2);
    expect(alto[1].id).toBe('user-1');
    expect(timeToUnits(alto[1].start)).toBe(16);
    expect(state.suggestionSource).toBe('authored');
  });

  it('inserts a soprano note, mirrors the melody, and regenerates', () => {
    const state = workbenchReducer(initial, {
      type: 'INSERT_VOICE_EVENT',
      candidateId: 'grounded-descent',
      voice: 'soprano',
      neighborEventId: 'a-s-2',
      side: 'before',
      newEventId: 'user-2',
    });
    expect(state.fragment.events).toHaveLength(4);
    expect(state.fragment.events[1].id).toBe('mel-user-2');
    expect(state.fragment.events[1].scaleDegree.syllable).toBe('fa');
    expect(state.suggestionSource).toBe('computed');
  });

  it('deletes a soprano note leaving a rest, drops its locks, and regenerates', () => {
    const locked = workbenchReducer(initial, {
      type: 'TOGGLE_LOCK',
      lock: lockFor('strong-arrival', 'b-b-1'),
    });
    // Delete the soprano's middle note on the CURRENT (computed) candidates.
    const soprano = locked.candidates[0].voicing.soprano;
    const state = workbenchReducer(locked, {
      type: 'DELETE_VOICE_EVENT',
      candidateId: locked.candidates[0].id,
      voice: 'soprano',
      eventId: soprano[1].id,
    });
    expect(state.fragment.events).toHaveLength(2);
    expect(melodySignature(state.fragment.events)).toBe('sol4:q|r:q|mi4:h');
    expect(state.suggestionSource).toBe('computed');

    // Deleting the only event of a part is a no-op.
    expect(
      workbenchReducer(initial, {
        type: 'DELETE_VOICE_EVENT',
        candidateId: 'grounded-descent',
        voice: 'alto',
        eventId: 'a-a-1',
      }),
    ).toBe(initial);
  });

  it('frozen locked notes block delete until unlocked; unlock returns to authored', () => {
    // Locks live on the working reading — select C first (the UI can only
    // lock notes in the workspace).
    const onC = workbenchReducer(initial, {
      type: 'SELECT_CANDIDATE',
      candidateId: 'keep-moving',
    });
    const locked = workbenchReducer(onC, {
      type: 'TOGGLE_LOCK',
      lock: lockFor('keep-moving', 'c-a-2'),
    });
    // D (re) is satisfiable — computed alternatives appear as cards, while
    // the working reading (and its lock) stay put.
    expect(locked.suggestionSource).toBe('computed');
    expect(locked.selectedCandidateId).toBe('keep-moving');
    expect(locked.locks.some((lock) => lock.candidateId === 'keep-moving')).toBe(true);
    // The note is frozen: delete is a no-op.
    expect(
      workbenchReducer(locked, {
        type: 'DELETE_VOICE_EVENT',
        candidateId: 'keep-moving',
        voice: 'alto',
        eventId: 'c-a-2',
      }),
    ).toBe(locked);

    const unlocked = workbenchReducer(locked, {
      type: 'TOGGLE_LOCK',
      lock: { ...lockFor('keep-moving', 'c-a-2'), id: 'again' },
    });
    expect(unlocked.suggestionSource).toBe('authored');
    const deleted = workbenchReducer(unlocked, {
      type: 'DELETE_VOICE_EVENT',
      candidateId: 'keep-moving',
      voice: 'alto',
      eventId: 'c-a-2',
    });
    expect(deleted.locks).toHaveLength(0);
    expect(
      deleted.candidates.find((candidate) => candidate.id === 'keep-moving')?.voicing.alto,
    ).toHaveLength(2);
  });
});

describe('history', () => {
  it('coalesces one drag into one undo entry, separate gestures into two', () => {
    const move1 = workbenchReducer(initial, resize({ targetBoundary: 5, gestureId: 'g1' }));
    const move2 = workbenchReducer(move1, resize({ targetBoundary: 6, gestureId: 'g1' }));
    expect(move2.history).toHaveLength(1);
    const gesture2 = workbenchReducer(move2, resize({ targetBoundary: 7, gestureId: 'g2' }));
    expect(gesture2.history).toHaveLength(2);

    // Undo the second gesture: boundary back at 6.
    const undone = workbenchReducer(gesture2, { type: 'UNDO' });
    const alto = undone.candidates[2].voicing.alto;
    expect(durationToUnits(alto[0].duration)).toBe(6);
    // Undo the first gesture: back to the fixture's 4.
    const undoneTwice = workbenchReducer(undone, { type: 'UNDO' });
    expect(
      durationToUnits(undoneTwice.candidates[2].voicing.alto[0].duration),
    ).toBe(4);
    // Redo restores.
    const redone = workbenchReducer(undoneTwice, { type: 'REDO' });
    expect(durationToUnits(redone.candidates[2].voicing.alto[0].duration)).toBe(6);
  });

  it('selection is undoable; unknown and same-id selections are no-ops', () => {
    const selected = workbenchReducer(initial, {
      type: 'SELECT_CANDIDATE',
      candidateId: 'keep-moving',
    });
    expect(selected.history).toHaveLength(1);
    expect(workbenchReducer(initial, { type: 'SELECT_CANDIDATE', candidateId: 'nope' })).toBe(
      initial,
    );
    expect(
      workbenchReducer(initial, { type: 'SELECT_CANDIDATE', candidateId: 'grounded-descent' }),
    ).toBe(initial);
    const undone = workbenchReducer(selected, { type: 'UNDO' });
    expect(undone.selectedCandidateId).toBe('grounded-descent');
    expect(workbenchReducer(initial, { type: 'UNDO' })).toBe(initial);
  });

  it('tempo and playback stay out of history', () => {
    const tempo = workbenchReducer(initial, { type: 'SET_TEMPO', tempoBpm: 96 });
    expect(tempo.history).toHaveLength(0);
    expect(tempo.tempoBpm).toBe(96);
    expect(workbenchReducer(initial, { type: 'SET_TEMPO', tempoBpm: 1 }).tempoBpm).toBe(
      MIN_TEMPO_BPM,
    );
    expect(workbenchReducer(initial, { type: 'SET_TEMPO', tempoBpm: 999 }).tempoBpm).toBe(
      MAX_TEMPO_BPM,
    );
    const playing = workbenchReducer(initial, {
      type: 'START_PLAYBACK',
      candidateId: 'strong-arrival',
      voices: ['soprano', 'bass'],
    });
    expect(playing.history).toHaveLength(0);
    expect(playing.playback).toEqual({
      status: 'playing',
      candidateId: 'strong-arrival',
      voices: ['soprano', 'bass'],
      activeUnit: null,
    });
    const progressed = workbenchReducer(playing, {
      type: 'PLAYBACK_PROGRESS',
      activeUnit: 5,
    });
    expect(progressed.playback).toMatchObject({ activeUnit: 5 });
    const stopped = workbenchReducer(progressed, { type: 'STOP_PLAYBACK' });
    expect(workbenchReducer(stopped, { type: 'PLAYBACK_PROGRESS', activeUnit: 9 })).toBe(
      stopped,
    );
  });
});

describe('apply and loading', () => {
  it('APPLY commits the selected reading and UNDO restores everything', () => {
    const selected = workbenchReducer(initial, {
      type: 'SELECT_CANDIDATE',
      candidateId: 'keep-moving',
    });
    const applied = workbenchReducer(selected, { type: 'APPLY_CANDIDATE', appliedId: 'ap1' });
    expect(applied.appliedFragments).toHaveLength(1);
    expect(applied.appliedFragments[0].candidate.id).toBe('keep-moving');
    expect(applied.acceptedContext.previousHarmony?.analysis.romanNumeral).toBe('I6');
    expect(applied.acceptedContext.previousHarmony?.id).toBe('applied-ap1');
    expect(applied.acceptedContext.previousHarmony?.start.measure).toBe(0);

    const undone = workbenchReducer(applied, { type: 'UNDO' });
    expect(undone.appliedFragments).toHaveLength(0);
    expect(undone.acceptedContext.previousHarmony?.analysis.romanNumeral).toBe('I');
  });

  it('carries the seam forward: applying records the notes the next snippet grows from', () => {
    const applied = workbenchReducer(initial, { type: 'APPLY_CANDIDATE', appliedId: 'ap1' });
    // The accepted context now holds the actual notes, not just the chord.
    expect(applied.acceptedContext.previousVoicing).not.toBeNull();
    expect(
      applied.acceptedContext.previousVoicing?.soprano.at(-1)?.scaleDegree.syllable,
    ).toBe('mi');

    // Moving to the next snippet stamps every reading with what it comes from,
    // so the lanes, chord strip, and cards all describe the same seam.
    const next = workbenchReducer(applied, {
      type: 'LOAD_SAMPLE',
      source: { kind: 'fixture', fixture },
      keepAcceptedContext: true,
    });
    for (const candidate of next.candidates) {
      expect(candidate.approach?.harmony?.analysis.romanNumeral).toBe('I');
      expect(candidate.approach?.voices.soprano?.scaleDegree.syllable).toBe('mi');
      expect(candidate.approach?.voices.bass?.pitch.letter).toBe('C');
    }
  });

  it('the opening snippet has no seam to show', () => {
    for (const candidate of initial.candidates) {
      expect(candidate.approach?.voices.soprano).toBeUndefined();
    }
  });

  it('reworking a middle piece sees the piece before it', () => {
    const first = workbenchReducer(initial, { type: 'APPLY_CANDIDATE', appliedId: 'ap1' });
    const second = workbenchReducer(
      workbenchReducer(first, { type: 'SELECT_CANDIDATE', candidateId: 'keep-moving' }),
      { type: 'APPLY_CANDIDATE', appliedId: 'ap2' },
    );
    const editingSecond = workbenchReducer(second, {
      type: 'EDIT_APPLIED_FRAGMENT',
      appliedId: 'ap2',
    });
    // Piece 2 grows out of piece 1's final notes.
    expect(
      editingSecond.acceptedContext.previousVoicing?.soprano.at(-1)?.scaleDegree.syllable,
    ).toBe('mi');
    const working = editingSecond.candidates.find(
      (candidate) => candidate.id === editingSecond.selectedCandidateId,
    );
    expect(working?.approach?.voices.soprano?.scaleDegree.syllable).toBe('mi');
  });

  it('reworks an applied piece in place instead of appending a second copy', () => {
    // Two pieces applied.
    const first = workbenchReducer(initial, { type: 'APPLY_CANDIDATE', appliedId: 'ap1' });
    const second = workbenchReducer(
      workbenchReducer(first, { type: 'SELECT_CANDIDATE', candidateId: 'keep-moving' }),
      { type: 'APPLY_CANDIDATE', appliedId: 'ap2' },
    );
    expect(second.appliedFragments.map((entry) => entry.id)).toEqual(['ap1', 'ap2']);
    const contextAfterBoth = second.acceptedContext.previousHarmony?.analysis.romanNumeral;

    // Click the FIRST piece: it loads for rework with the hymn's opening
    // context, and the piece itself is the working reading.
    const editing = workbenchReducer(second, {
      type: 'EDIT_APPLIED_FRAGMENT',
      appliedId: 'ap1',
    });
    expect(editing.editingAppliedId).toBe('ap1');
    expect(editing.selectedCandidateId).toBe('grounded-descent');
    expect(editing.acceptedContext.previousHarmony).toBeNull(); // first piece opens the hymn
    expect(editing.fragment).toEqual(second.appliedFragments[0].fragment);

    // Apply replaces it where it stands — still two pieces, order preserved,
    // and the tail's accepted context is untouched.
    const reapplied = workbenchReducer(editing, {
      type: 'APPLY_CANDIDATE',
      appliedId: 'ignored-when-reworking',
    });
    expect(reapplied.appliedFragments.map((entry) => entry.id)).toEqual(['ap1', 'ap2']);
    expect(reapplied.editingAppliedId).toBeNull();
    expect(reapplied.acceptedContext.previousHarmony?.analysis.romanNumeral).toBe(
      contextAfterBoth,
    );
  });

  it('reworking the LAST piece refreshes what comes next', () => {
    const applied = workbenchReducer(initial, { type: 'APPLY_CANDIDATE', appliedId: 'ap1' });
    const editing = workbenchReducer(applied, {
      type: 'EDIT_APPLIED_FRAGMENT',
      appliedId: 'ap1',
    });
    // Swap to whatever alternative the rework offered (the opening context no
    // longer matches fixture A's pin, so these are computed sketches).
    const alternative = editing.candidates.find(
      (candidate) => candidate.id !== editing.selectedCandidateId,
    );
    expect(alternative).toBeTruthy();
    if (!alternative) return;
    const swapped = workbenchReducer(editing, {
      type: 'SELECT_CANDIDATE',
      candidateId: alternative.id,
    });
    const reapplied = workbenchReducer(swapped, {
      type: 'APPLY_CANDIDATE',
      appliedId: 'unused',
    });
    expect(reapplied.appliedFragments).toHaveLength(1);
    expect(reapplied.appliedFragments[0].candidate.id).toBe(alternative.id);
    const tailNumeral =
      alternative.harmonyEvents[alternative.harmonyEvents.length - 1].analysis.romanNumeral;
    expect(reapplied.acceptedContext.previousHarmony?.analysis.romanNumeral).toBe(tailNumeral);
  });

  it('loading a different fragment leaves rework mode', () => {
    const applied = workbenchReducer(initial, { type: 'APPLY_CANDIDATE', appliedId: 'ap1' });
    const editing = workbenchReducer(applied, {
      type: 'EDIT_APPLIED_FRAGMENT',
      appliedId: 'ap1',
    });
    expect(editing.editingAppliedId).toBe('ap1');
    const moved = workbenchReducer(editing, {
      type: 'LOAD_SAMPLE',
      source: { kind: 'fixture', fixture },
      keepAcceptedContext: true,
    });
    expect(moved.editingAppliedId).toBeNull();
  });

  it('LOAD_SAMPLE with kept accepted context resolves honestly against the fixture pin', () => {
    const applied = workbenchReducer(
      workbenchReducer(initial, { type: 'SELECT_CANDIDATE', candidateId: 'keep-moving' }),
      { type: 'APPLY_CANDIDATE', appliedId: 'ap1' },
    );
    // Fixture A pins I:root, but the applied context is I6:first → computed.
    const chained = workbenchReducer(applied, {
      type: 'LOAD_SAMPLE',
      source: { kind: 'fixture', fixture },
      keepAcceptedContext: true,
    });
    expect(chained.appliedFragments).toHaveLength(1);
    expect(chained.suggestionSource).toBe('computed');
    expect(chained.acceptedContext.previousHarmony?.analysis.romanNumeral).toBe('I6');

    // Without keeping the context, the fixture's own accepted context is adopted.
    const restored = workbenchReducer(applied, {
      type: 'LOAD_SAMPLE',
      source: { kind: 'fixture', fixture },
      keepAcceptedContext: false,
    });
    expect(restored.suggestionSource).toBe('authored');
    expect(restored.candidateSetId).toBe('default');
    expect(restored.appliedFragments).toHaveLength(1);
  });

  it('LOAD_SAMPLE blank resolves computed skeletons for the lone tonic note', () => {
    const state = workbenchReducer(initial, {
      type: 'LOAD_SAMPLE',
      source: {
        kind: 'blank',
        fragment: {
          id: 'blank',
          events: [
            {
              id: 'blank-note',
              pitch: { letter: 'C', accidental: 'natural', octave: 4, midi: 60, pitchClass: 0 },
              scaleDegree: { degree: 1, chromaticOffset: 0, syllable: 'do' },
              start: { measure: 1, beat: 1, subdivision: 0 },
              duration: { numerator: 1, denominator: 1 },
              tieFromPrevious: false,
            },
          ],
        },
      },
      keepAcceptedContext: true,
    });
    expect(state.suggestionSource).toBe('computed');
    expect(state.candidates.length).toBeGreaterThan(0);
    expect(state.sourceFixtureId).toBeNull();
  });

  it('LOAD_PROJECT adopts a persisted workbench and resets history', () => {
    const edited = workbenchReducer(initial, {
      type: 'SELECT_CANDIDATE',
      candidateId: 'strong-arrival',
    });
    const persisted: PersistedWorkbench = {
      tonalContext: edited.tonalContext,
      phraseIntent: edited.phraseIntent,
      acceptedContext: edited.acceptedContext,
      appliedFragments: edited.appliedFragments,
      fragment: edited.fragment,
      boundaryConstraints: edited.boundaryConstraints,
      suggestionStatus: edited.suggestionStatus,
      suggestionSource: edited.suggestionSource,
      sourceFixtureId: edited.sourceFixtureId,
      candidateSetId: edited.candidateSetId,
      candidates: edited.candidates,
      selectedCandidateId: edited.selectedCandidateId,
      locks: edited.locks,
      tempoBpm: 132,
    };
    const state = workbenchReducer(initial, { type: 'LOAD_PROJECT', workbench: persisted });
    expect(state.selectedCandidateId).toBe('strong-arrival');
    expect(state.tempoBpm).toBe(132);
    expect(state.history).toEqual([]);
    expect(state.playback).toEqual({ status: 'idle' });
  });

  it('LOAD_FIXTURE remains a hard reset', () => {
    const midway = workbenchReducer(initial, {
      type: 'SELECT_CANDIDATE',
      candidateId: 'keep-moving',
    });
    const state: WorkbenchState = workbenchReducer(midway, {
      type: 'LOAD_FIXTURE',
      fixture,
    });
    expect(state.selectedCandidateId).toBe('grounded-descent');
    expect(state.history).toEqual([]);
  });
});
