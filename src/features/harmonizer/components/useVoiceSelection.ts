'use client';

import { useEffect, useState } from 'react';
import type { CandidatePath } from '../domain/analysis-types';
import type { VoiceId } from '../domain/music-types';
import type { PlaybackState } from '../domain/workbench-state';
import { ALL_VOICES, type WorkbenchPlayback } from './useWorkbenchPlayback';

/** Which parts are checked for playback, plus the play gestures built on that choice. */
export function useVoiceSelection(
  playback: PlaybackState,
  selectedCandidate: CandidatePath | null,
  pb: WorkbenchPlayback,
) {
  const [checkedVoices, setCheckedVoices] = useState<VoiceId[]>(ALL_VOICES);

  function toggleVoice(voice: VoiceId, checked: boolean) {
    setCheckedVoices((previous) =>
      checked
        ? ALL_VOICES.filter((candidate) => previous.includes(candidate) || candidate === voice)
        : previous.filter((candidate) => candidate !== voice),
    );
  }

  function playChecked() {
    if (selectedCandidate) void pb.startPlayback(selectedCandidate.id, checkedVoices);
  }

  function playVoice(candidateId: string, voice: VoiceId) {
    void pb.startPlayback(candidateId, [voice]);
  }

  function playFull(candidateId: string) {
    void pb.startPlayback(candidateId, ALL_VOICES);
  }

  // Space plays/stops the checked parts of the selected reading when focus
  // isn't in a control (spec §24).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== 'Space') return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'SELECT' ||
          tag === 'TEXTAREA' ||
          tag === 'BUTTON' ||
          target.isContentEditable
        ) {
          return;
        }
      }
      event.preventDefault();
      if (playback.status === 'playing') {
        pb.stopPlayback();
      } else if (selectedCandidate) {
        void pb.startPlayback(selectedCandidate.id, checkedVoices);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return { checkedVoices, toggleVoice, playChecked, playVoice, playFull };
}
