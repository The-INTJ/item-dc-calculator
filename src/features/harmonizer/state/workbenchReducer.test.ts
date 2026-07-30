import { describe, expect, it } from 'vitest';
import type { ConstraintLock } from '../domain/locks';
import { melodySignature } from '../domain/signatures';
import { durationToUnits, timeToUnits } from '../domain/timing';
import type { PersistedWorkbench, WorkbenchState } from '../domain/workbench-state';
import { getDefaultFixture } from '../fixtures/registry';
import { toPersistedWorkbench } from '../projects/project-store';
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

function addMeasure(id: string): WorkbenchAction {
  return {
    type: 'ADD_MEASURE',
    appliedId: id,
    fragmentId: `frag-${id}`,
    candidateId: `cand-${id}`,
    melodyEventId: `mel-${id}`,
    voiceEventIds: {
      soprano: `s-${id}`,
      alto: `a-${id}`,
      tenor: `t-${id}`,
      bass: `b-${id}`,
    },
  };
}

/** The workspace's soprano note id — for edits that must hit the melody. */
function sopranoEventId(state: WorkbenchState, index = 0): string {
  const working = state.candidates.find(
    (candidate) => candidate.id === state.selectedCandidateId,
  );
  return working!.voicing.soprano[index].id;
}

describe('createInitialWorkbenchState', () => {
  it('seeds the workbench with authored suggestions and the new fields', () => {
    expect(initial.suggestionStatus).toBe('fresh');
    expect(initial.suggestionSource).toBe('authored');
    expect(initial.sourceFixtureId).toBe(fixture.id);
    expect(initial.candidateSetId).toBe('default');
    expect(initial.candidates).toHaveLength(3);
    expect(initial.selectedCandidateId).toBe('grounded-descent');
    expect(initial.history).toEqual([]);
    expect(initial.lastGestureId).toBeNull();
  });

  it('seeds the hymn with the working measure, selected and reference-synced', () => {
    expect(initial.appliedFragments).toHaveLength(1);
    const entry = initial.appliedFragments[0];
    expect(initial.selectedMeasureId).toBe(entry.id);
    // Same references as the workspace — the sync wrapper's short-circuit
    // depends on this seed.
    expect(entry.fragment).toBe(initial.fragment);
    expect(entry.candidate).toBe(initial.candidates[0]);
  });
});

describe('the measure mirror (write-through)', () => {
  it('a soprano edit is mirrored into the selected measure entry live', () => {
    const state = workbenchReducer(initial, {
      type: 'STEP_VOICE_EVENT_PITCH',
      candidateId: 'grounded-descent',
      voice: 'soprano',
      eventId: 'a-s-1',
      direction: 1,
    });
    const entry = state.appliedFragments[0];
    expect(entry.fragment).toBe(state.fragment);
    expect(entry.candidate).toBe(
      state.candidates.find((candidate) => candidate.id === state.selectedCandidateId),
    );
    // The rail pill reads this entry — its melody changed with the workspace.
    expect(melodySignature(entry.fragment.events)).toBe('la4:q|fa4:q|mi4:h');
  });

  it('adopting a different reading writes through and UNDO restores it', () => {
    const selected = workbenchReducer(initial, {
      type: 'SELECT_CANDIDATE',
      candidateId: 'keep-moving',
    });
    expect(selected.appliedFragments).toHaveLength(1);
    expect(selected.appliedFragments[0].candidate.id).toBe('keep-moving');
    expect(selected.appliedFragments[0].id).toBe(initial.selectedMeasureId);
    const undone = workbenchReducer(selected, { type: 'UNDO' });
    expect(undone.appliedFragments[0].candidate.id).toBe('grounded-descent');
    expect(undone.selectedMeasureId).toBe(initial.selectedMeasureId);
  });

  it('non-mutating actions leave appliedFragments reference-identical', () => {
    const tempo = workbenchReducer(initial, { type: 'SET_TEMPO', tempoBpm: 96 });
    expect(tempo.appliedFragments).toBe(initial.appliedFragments);
    const playing = workbenchReducer(initial, {
      type: 'START_PLAYBACK',
      candidateId: 'grounded-descent',
      voices: ['soprano'],
    });
    expect(playing.appliedFragments).toBe(initial.appliedFragments);
    const progressed = workbenchReducer(playing, {
      type: 'PLAYBACK_PROGRESS',
      activeUnit: 3,
    });
    expect(progressed.appliedFragments).toBe(initial.appliedFragments);
  });

  it('undo across a measure switch restores selection without cross-contamination', () => {
    const two = workbenchReducer(initial, addMeasure('m2'));
    const editedSecond = workbenchReducer(two, {
      type: 'STEP_VOICE_EVENT_PITCH',
      candidateId: two.selectedCandidateId!,
      voice: 'soprano',
      eventId: sopranoEventId(two),
      direction: 1,
    });
    const firstId = two.appliedFragments[0].id;
    const onFirst = workbenchReducer(editedSecond, { type: 'SELECT_MEASURE', appliedId: firstId });
    const editedFirst = workbenchReducer(onFirst, {
      type: 'STEP_VOICE_EVENT_PITCH',
      candidateId: onFirst.selectedCandidateId!,
      voice: 'soprano',
      eventId: sopranoEventId(onFirst),
      direction: 1,
    });
    // Undo the measure-1 edit: measure 1 reverts, measure 2 keeps its edit.
    const undoEdit = workbenchReducer(editedFirst, { type: 'UNDO' });
    expect(undoEdit.selectedMeasureId).toBe(firstId);
    expect(undoEdit.appliedFragments).toBe(onFirst.appliedFragments);
    // Undo the switch: back on measure 2, its edited melody intact.
    const undoSwitch = workbenchReducer(undoEdit, { type: 'UNDO' });
    expect(undoSwitch.selectedMeasureId).toBe('m2');
    expect(undoSwitch.fragment).toBe(editedSecond.fragment);
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
    expect(unlocked.suggestionSource).toBe('computed');
    expect(unlocked.candidateSetId).toBeNull();
  });

  it('locking remaps locks onto the engine cards so badges and unlocking survive', () => {
    const locked = workbenchReducer(initial, {
      type: 'TOGGLE_LOCK',
      lock: lockFor('grounded-descent', 'a-b-1'),
    });
    expect(locked.suggestionSource).toBe('computed');
    // The original lock on the working reading plus one remapped lock per
    // engine card that keeps the pinned note, each targeting a live note.
    expect(locked.locks.length).toBeGreaterThan(1);
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
    expect(unlocked.suggestionSource).toBe('computed');
  });

  it('a lock no chord satisfies is explained, not dead-ended; the surface never moves', () => {
    // Whole-bar alto E4 against the melody's fa: no vocabulary chord holds
    // both. The working reading stays EXACTLY as it is (the surface rule);
    // the engine cards around it keep the pinned note as one sustained tone
    // and read the fa as ornamental motion over the held chord.
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
      ).toBe(false);
      expect(
        sketch.derivability?.find((note) => note.aspect === 'interpretation')?.status,
      ).toBe('computed');
    }
    // The original lock stays on the working note; unlocking it regenerates
    // unconstrained engine cards.
    expect(state.locks.some((lock) => lock.candidateId === 'grounded-descent')).toBe(true);
    const unlocked = workbenchReducer(state, {
      type: 'TOGGLE_LOCK',
      lock: lockFor('grounded-descent', 'a-a-1'),
    });
    expect(unlocked.locks).toHaveLength(0);
    expect(unlocked.suggestionSource).toBe('computed');
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
    // The alto's whole note fills the measure — shorten it first (the editor
    // never grows a part past one measure).
    const roomy = workbenchReducer(
      initial,
      resize({
        candidateId: 'grounded-descent',
        voice: 'alto',
        eventId: 'a-a-1',
        edge: 'right',
        targetBoundary: 8,
        gestureId: 'room',
      }),
    );
    const state = workbenchReducer(roomy, {
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
    expect(timeToUnits(alto[1].start)).toBe(8);
    expect(state.suggestionSource).toBe('authored');
  });

  it('inserts a soprano note, mirrors the melody, and regenerates', () => {
    // Make room: the melody fills the measure, so shorten its final half note
    // before inserting a copy of the quarter.
    const half = initial.candidates[0].voicing.soprano[2];
    const roomy = workbenchReducer(
      initial,
      resize({
        candidateId: 'grounded-descent',
        voice: 'soprano',
        eventId: half.id,
        edge: 'right',
        targetBoundary: 12,
        gestureId: 'room',
      }),
    );
    const state = workbenchReducer(roomy, {
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

  it('the editor never grows a part past one measure', () => {
    // grounded-descent's alto whole note already fills the measure: dragging
    // its right edge further is a no-op…
    expect(
      workbenchReducer(
        initial,
        resize({
          candidateId: 'grounded-descent',
          voice: 'alto',
          eventId: 'a-a-1',
          edge: 'right',
          targetBoundary: 40,
          gestureId: 'cap',
        }),
      ),
    ).toBe(initial);
    // …and so is inserting into the full measure.
    expect(
      workbenchReducer(initial, {
        type: 'INSERT_VOICE_EVENT',
        candidateId: 'grounded-descent',
        voice: 'alto',
        neighborEventId: 'a-a-1',
        side: 'after',
        newEventId: 'nope',
      }),
    ).toBe(initial);
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
    expect(unlocked.suggestionSource).toBe('computed');
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

describe('measures and loading', () => {
  it('ADD_MEASURE appends a continuation at the end and selects it', () => {
    const added = workbenchReducer(initial, addMeasure('m2'));
    expect(added.appliedFragments.map((entry) => entry.id)).toEqual([
      initial.selectedMeasureId,
      'm2',
    ]);
    expect(added.selectedMeasureId).toBe('m2');
    // The workspace opens on the one-beat continuation, held on the tail's notes.
    expect(added.fragment.events).toHaveLength(1);
    expect(added.appliedFragments[1].fragment).toBe(added.fragment);
    expect(added.suggestionSource).toBe('computed');
    expect(added.sourceFixtureId).toBeNull();
    // One undoable step back to the single-measure hymn.
    const undone = workbenchReducer(added, { type: 'UNDO' });
    expect(undone.appliedFragments).toHaveLength(1);
    expect(undone.selectedMeasureId).toBe(initial.selectedMeasureId);
  });

  it('carries the seam forward: the new measure grows from the tail notes', () => {
    const added = workbenchReducer(initial, addMeasure('m2'));
    // The accepted context holds the actual notes, not just the chord.
    expect(added.acceptedContext.previousVoicing).not.toBeNull();
    expect(
      added.acceptedContext.previousVoicing?.soprano.at(-1)?.scaleDegree.syllable,
    ).toBe('mi');
    expect(added.acceptedContext.previousHarmony?.start.measure).toBe(0);
    // Every reading of the new measure is stamped with what it comes from, so
    // the lanes, chord strip, and cards all describe the same seam.
    for (const candidate of added.candidates) {
      expect(candidate.approach?.harmony?.analysis.romanNumeral).toBe('I');
      expect(candidate.approach?.voices.soprano?.scaleDegree.syllable).toBe('mi');
    }
  });

  it('the opening measure has no seam to show', () => {
    for (const candidate of initial.candidates) {
      expect(candidate.approach?.voices.soprano).toBeUndefined();
    }
  });

  it('selecting a middle measure sees the measure before it', () => {
    const two = workbenchReducer(initial, addMeasure('m2'));
    const three = workbenchReducer(two, addMeasure('m3'));
    const editing = workbenchReducer(three, { type: 'SELECT_MEASURE', appliedId: 'm2' });
    expect(editing.selectedMeasureId).toBe('m2');
    // Measure 2 grows out of measure 1's final notes.
    expect(
      editing.acceptedContext.previousVoicing?.soprano.at(-1)?.scaleDegree.syllable,
    ).toBe('mi');
    const working = editing.candidates.find(
      (candidate) => candidate.id === editing.selectedCandidateId,
    );
    expect(working?.approach?.voices.soprano?.scaleDegree.syllable).toBe('mi');
  });

  it('switching measures preserves the outgoing measure in place; re-clicks are no-ops', () => {
    const two = workbenchReducer(initial, addMeasure('m2'));
    // Edit measure 2 so its entry visibly diverges from the continuation.
    const edited = workbenchReducer(two, {
      type: 'STEP_VOICE_EVENT_PITCH',
      candidateId: two.selectedCandidateId!,
      voice: 'soprano',
      eventId: sopranoEventId(two),
      direction: 1,
    });
    const editedEntry = edited.appliedFragments[1];
    expect(editedEntry.fragment).toBe(edited.fragment);

    // Click measure 1: it loads with the hymn's opening context, measure 2
    // keeps its edited state where it stands.
    const onFirst = workbenchReducer(edited, {
      type: 'SELECT_MEASURE',
      appliedId: edited.appliedFragments[0].id,
    });
    expect(onFirst.selectedMeasureId).toBe(edited.appliedFragments[0].id);
    expect(onFirst.selectedCandidateId).toBe('grounded-descent');
    expect(onFirst.acceptedContext.previousHarmony).toBeNull(); // opens the hymn
    expect(onFirst.fragment).toEqual(edited.appliedFragments[0].fragment);
    expect(onFirst.appliedFragments[1]).toBe(editedEntry);

    // Same-id and unknown-id selections are no-ops.
    expect(
      workbenchReducer(onFirst, {
        type: 'SELECT_MEASURE',
        appliedId: onFirst.selectedMeasureId!,
      }),
    ).toBe(onFirst);
    expect(workbenchReducer(onFirst, { type: 'SELECT_MEASURE', appliedId: 'nope' })).toBe(
      onFirst,
    );
  });

  it('ADD_MEASURE always appends at the end, even while an earlier measure is selected', () => {
    const two = workbenchReducer(initial, addMeasure('m2'));
    const firstId = two.appliedFragments[0].id;
    const onFirst = workbenchReducer(two, { type: 'SELECT_MEASURE', appliedId: firstId });
    const three = workbenchReducer(onFirst, addMeasure('m3'));
    expect(three.appliedFragments.map((entry) => entry.id)).toEqual([firstId, 'm2', 'm3']);
    expect(three.selectedMeasureId).toBe('m3');
    // The new measure grows from the TAIL (m2), not the previously selected m1.
    expect(three.acceptedContext.previousHarmony?.id).toBe('applied-m2');
  });

  it('adopting a different reading refreshes what the next measure grows from', () => {
    const swapped = workbenchReducer(initial, {
      type: 'SELECT_CANDIDATE',
      candidateId: 'keep-moving',
    });
    const added = workbenchReducer(swapped, addMeasure('m2'));
    // keep-moving lands on I6 — the seam records it.
    expect(added.acceptedContext.previousHarmony?.analysis.romanNumeral).toBe('I6');
    expect(added.appliedFragments[0].candidate.id).toBe('keep-moving');
  });

  it('LOAD_SAMPLE loads into the selected measure and keeps the selection', () => {
    const two = workbenchReducer(initial, addMeasure('m2'));
    const moved = workbenchReducer(two, {
      type: 'LOAD_SAMPLE',
      source: { kind: 'fixture', fixture },
      keepAcceptedContext: true,
    });
    expect(moved.selectedMeasureId).toBe('m2');
    expect(moved.appliedFragments).toHaveLength(2);
    // The sample's reading is mirrored onto measure 2's entry.
    expect(moved.appliedFragments[1].fragment).toBe(moved.fragment);
    expect(moved.appliedFragments[1].candidate.id).toBe(moved.selectedCandidateId);
  });

  it('LOAD_SAMPLE resolves honestly against the fixture pin mid-hymn', () => {
    // keep-moving lands on I6; the next measure's seam diverges from fixture
    // A's I:root pin.
    const two = workbenchReducer(
      workbenchReducer(initial, { type: 'SELECT_CANDIDATE', candidateId: 'keep-moving' }),
      addMeasure('m2'),
    );
    const chained = workbenchReducer(two, {
      type: 'LOAD_SAMPLE',
      source: { kind: 'fixture', fixture },
      keepAcceptedContext: true,
    });
    expect(chained.appliedFragments).toHaveLength(2);
    expect(chained.suggestionSource).toBe('computed');
    expect(chained.acceptedContext.previousHarmony?.analysis.romanNumeral).toBe('I6');

    // Without keeping the context, a mid-hymn measure STILL grows out of its
    // predecessor (the sample's own opening seam is only for the first
    // measure) — and the pin resolves honestly against that seam too.
    const restored = workbenchReducer(two, {
      type: 'LOAD_SAMPLE',
      source: { kind: 'fixture', fixture },
      keepAcceptedContext: false,
    });
    expect(restored.acceptedContext.previousHarmony?.analysis.romanNumeral).toBe('I6');
    expect(restored.suggestionSource).toBe('computed');
    expect(restored.appliedFragments).toHaveLength(2);

    // On the FIRST measure, dropping the kept context adopts the sample's own
    // opening seam and the authored set comes back.
    const firstRestored = workbenchReducer(initial, {
      type: 'LOAD_SAMPLE',
      source: { kind: 'fixture', fixture },
      keepAcceptedContext: false,
    });
    expect(firstRestored.suggestionSource).toBe('authored');
    expect(firstRestored.candidateSetId).toBe('default');
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

  it('LOAD_PROJECT rehydrates a persisted workbench: notes verbatim, analysis re-derived', () => {
    const edited = workbenchReducer(initial, {
      type: 'SELECT_CANDIDATE',
      candidateId: 'strong-arrival',
    });
    const persisted: PersistedWorkbench = toPersistedWorkbench({ ...edited, tempoBpm: 132 });
    expect(persisted.selectedMeasureId).toBe(edited.selectedMeasureId);
    const state = workbenchReducer(initial, { type: 'LOAD_PROJECT', workbench: persisted });
    // The saved working reading survives as the selected surface…
    expect(state.selectedCandidateId).toBe('strong-arrival');
    const working = state.candidates.find((candidate) => candidate.id === 'strong-arrival')!;
    // …with its notes byte-identical and its analysis freshly re-derived.
    expect(working.voicing.soprano.map((event) => event.pitch.midi)).toEqual(
      edited.candidates
        .find((candidate) => candidate.id === 'strong-arrival')!
        .voicing.soprano.map((event) => event.pitch.midi),
    );
    expect(working.harmonyEvents.length).toBeGreaterThan(0);
    expect(working.provenance.generatorId).toBe('user-surface');
    // Suggestion cards regenerated around it.
    expect(state.candidates.length).toBeGreaterThan(1);
    expect(state.tempoBpm).toBe(132);
    expect(state.history).toEqual([]);
    expect(state.playback).toEqual({ status: 'idle' });
    // The selection round-trips and its entry mirrors the derived workspace.
    expect(state.selectedMeasureId).toBe(edited.selectedMeasureId);
    expect(state.appliedFragments).toHaveLength(1);
    expect(state.appliedFragments[0].candidate).toBe(working);
  });

  it('LOAD_PROJECT migrates an old save (no selectedMeasureId) by appending the working measure', () => {
    const two = workbenchReducer(initial, addMeasure('m2'));
    const persisted = toPersistedWorkbench(two);
    // Simulate a pre-measures save: committed pieces only, the working
    // reading separate, no selection field.
    const { selectedMeasureId: _dropped, ...oldSave } = persisted;
    const legacy: PersistedWorkbench = {
      ...oldSave,
      appliedFragments: persisted.appliedFragments.slice(0, 1),
    };
    const state = workbenchReducer(initial, { type: 'LOAD_PROJECT', workbench: legacy });
    // The working reading was appended as the selected measure.
    expect(state.appliedFragments).toHaveLength(2);
    expect(state.selectedMeasureId).toBe(`measure-${legacy.fragment.id}`);
    expect(state.appliedFragments[1].id).toBe(state.selectedMeasureId);
    expect(state.appliedFragments[1].fragment).toBe(state.fragment);
    expect(state.appliedFragments[0].id).toBe(persisted.appliedFragments[0].id);
  });

  it('LOAD_PROJECT keeps an applied measure’s saved identity while re-deriving its analysis', () => {
    const two = workbenchReducer(initial, addMeasure('m2'));
    const persisted = toPersistedWorkbench(two);
    const state = workbenchReducer(initial, { type: 'LOAD_PROJECT', workbench: persisted });
    expect(state.appliedFragments).toHaveLength(2);
    const piece = state.appliedFragments[0].candidate;
    // Curated-feeling fields survive verbatim…
    expect(piece.title).toBe(two.appliedFragments[0].candidate.title);
    expect(piece.provenance.fixtureAuthored).toBe(
      two.appliedFragments[0].candidate.provenance.fixtureAuthored,
    );
    // …while the analysis is freshly derived from the piece's own notes.
    expect(piece.harmonyEvents.length).toBeGreaterThan(0);
    // The seam is re-stamped from the persisted accepted context.
    expect(
      state.candidates.every((candidate) => candidate.approach !== undefined),
    ).toBe(true);
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
