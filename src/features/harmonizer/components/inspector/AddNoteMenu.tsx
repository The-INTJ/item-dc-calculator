import { content } from '../../content';
import type { VoiceId } from '../../domain/music-types';
import { PopoverMenu, PopoverMenuItem } from '../shared/PopoverMenu';
import styles from './CandidateInspector.module.scss';

const VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];

/** "+ Add note" → pick a part → a note is appended to that part's end. */
export function AddNoteMenu({ onAddNote }: { onAddNote: (voice: VoiceId) => void }) {
  return (
    <PopoverMenu
      triggerLabel={`+ ${content.melody.addNote}`}
      triggerClassName={styles.addNote}
      heading={content.addNoteMenu.heading}
      align="right"
    >
      {(close) =>
        VOICES.map((voice) => (
          <PopoverMenuItem
            key={voice}
            onSelect={() => {
              close();
              onAddNote(voice);
            }}
          >
            {content.inspector.voiceLabels[voice]}
          </PopoverMenuItem>
        ))
      }
    </PopoverMenu>
  );
}
