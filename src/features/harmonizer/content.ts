/**
 * Workbench chrome copy — every non-musical string the UI shows (spec §13.1).
 * Musical strings (titles, summaries, explanations, labels) come from fixture
 * data, never from here.
 *
 * Prose strings MAY carry glossary markup (`[term-id]` / `[Display|term-id]`,
 * see knowledge/markup/parse.ts); every surface that shows them renders
 * markup-aware. fixtures/glossary-markup.test.ts verifies the ids resolve.
 */

export const content = {
  header: {
    title: 'Hymn Harmonization Workbench',
    undo: 'Undo',
    redo: 'Redo',
    help: 'Help',
  },
  comingSoon: 'Coming in a later milestone',
  contextBar: {
    keyLabel: 'Key',
    tempoLabel: 'Tempo',
    tempoUnit: 'bpm',
    samplesLabel: 'Samples',
    samplesHeading: 'Sample fragments',
    soundLabel: 'Sound',
    soundNetworkHint: 'Sampled — fetches audio samples over the network on first use',
    /** Mobile only: the settings collapse into one card that starts closed. */
    settingsLabel: 'Settings',
    settingsShow: 'Show settings',
    settingsHide: 'Hide settings',
    modeLabels: {
      major: 'Major',
      natural_minor: 'Natural minor',
      harmonic_minor: 'Harmonic minor',
      melodic_minor: 'Melodic minor',
      dorian: 'Dorian',
      mixolydian: 'Mixolydian',
    },
    /** Short forms for key names ("A minor", "D dorian") — never collapse
     * distinct modes to one word. */
    modeShortLabels: {
      major: 'major',
      natural_minor: 'minor',
      harmonic_minor: 'harmonic minor',
      melodic_minor: 'melodic minor',
      dorian: 'dorian',
      mixolydian: 'mixolydian',
    },
    majorKeysHeading: 'Major keys',
    minorKeysHeading: 'Minor keys',
  },
  /**
   * Phrase intent lives with the suggestions it steers (Drew, 2026-07-30) —
   * it is a question about the NEXT reading, not a setting about the piece.
   */
  phraseIntent: {
    question: 'What do you want this section to do?',
    label: 'Phrase intent',
    options: {
      continue: 'Continue',
      build: 'Build',
      approach_cadence: 'Approach cadence',
      close: 'Close',
    },
    descriptions: {
      continue: 'Avoid strong closure; favor prolongation and forward availability.',
      build: 'Favor increasing tension, rising energy, or [dominant] preparation.',
      approach_cadence:
        'Favor predominant and [dominant] preparation without necessarily completing the [cadence].',
      close: 'Favor convincing local or phrase-level arrival.',
    },
  },
  regions: {
    acceptedContext: 'Accepted context',
    candidates: 'Suggested readings',
    inspector: 'Selected reading',
  },
  acceptedRail: {
    arrow: 'active fragment',
    bassPrefix: 'bass',
    appliedLabel: 'Applied so far',
    editHeading: 'Previous harmony',
    none: 'None — opens the piece',
    playHymn: 'Play hymn',
    stopHymn: 'Stop',
    playPiece: 'Hear this piece',
    editPiece: 'Rework this piece',
    editingBadge: 'reworking',
    editingHint: 'Add fragment will replace this piece where it stands.',
    addFragment: 'Add fragment',
    addFragmentHint:
      'Save this fragment and start the next one, held on the notes this one ends with.',
  },
  melody: {
    alwaysLocked: 'The melody is always locked',
  },
  candidates: {
    refresh: 'Refresh alternatives',
    selectCard: 'Select',
    selectedCard: 'Selected',
    playFull: 'Hear all four parts',
    stop: 'Stop',
    bassPrefix: 'Bass:',
    /** The card showing what is actually on the workbench right now. */
    currentHeading: 'Current chords',
    workingReading: "Your work's reading:",
  },
  inspector: {
    noSelection: 'Select a reading to inspect it.',
    candidateEvidence: 'Reading-level evidence',
    chords: 'Chords',
    voiceLabels: {
      soprano: 'Soprano',
      alto: 'Alto',
      tenor: 'Tenor',
      bass: 'Bass',
    },
    effectHeading: 'Effect',
    showEvidence: 'View analysis evidence',
    hideEvidence: 'Hide analysis evidence',
    play: 'Play',
    stop: 'Stop',
    playVoice: 'Play voice',
    includeInPlay: 'include in playback',
    noteToolsLabel: 'Note tools',
    panLabel: 'Slide the notes into view',
    panFollowing: 'Following playback',
    approachPrefix: 'coming from',
    approachChordPrefix: 'from',
    /** The three things a first-time visitor cannot guess from looking. */
    hints: [
      'Hold the bars and drag to change the length of notes',
      'Click a note to add a note, change it, or lock it in',
      'Check/uncheck parts to hear them when pressing this play button',
    ],
    /** Label inside the two ghost notes that flank the note being edited. */
    ghostAdd: '(click to add)',
    noteTools: {
      raise: 'Raise pitch',
      lower: 'Lower pitch',
      lock: 'Lock note',
      unlock: 'Unlock note',
      remove: 'Delete note',
      addBefore: 'Add note before',
      addAfter: 'Add note after',
      lockedHint: 'Locked notes are frozen — unlock to edit',
      keepOneHint: 'A part keeps at least one note',
    },
  },
  provenance: {
    authored: 'Authored',
    computed: 'Computed',
    user: 'Your reading',
    legend: '✓ computed · ƒ needs math · ✎ needs custom · ? unknown',
  },
  derivabilityStatus: {
    computed: '✓',
    needs_math: 'ƒ',
    needs_data: '✎',
    unsure: '?',
  },
  derivabilityAspects: {
    chord_path: 'chord path',
    voicing: 'voicing',
    ranking: 'ranking',
    interpretation: 'interpretation',
    effects: 'effects',
  },
  glossary: {
    panelHeading: 'Terms used here',
    back: 'Back',
    close: 'Close',
    seeAlsoLabel: 'See also',
    tierHeadings: {
      core: 'The basics',
      analysis: 'Reading harmony',
      advanced: 'Finer points',
    },
  },
  emptyState: {
    message:
      'This UI proof of concept does not contain a harmonization fixture for the current fragment. Restore a sample, or continue editing the interface without suggestions.',
    restore: 'Restore nearest sample',
    choose: 'Choose sample fragment',
    keep: 'Keep editing',
  },
  projects: {
    menuHeading: 'Projects',
    newProject: 'New project',
    deleteProject: 'Delete this project…',
    confirmDelete: 'Really delete? This cannot be undone.',
    untitled: 'Untitled hymn',
    renameHint: 'Rename project',
    saved: 'Saved',
    saving: 'Saving…',
    error: 'Save failed — storage may be full',
  },
  inversionLabels: ['root position', 'first inversion', 'second inversion', 'third inversion'],
  evidenceSources: {
    computed: 'Computed',
    rule: 'Rule pack',
    corpus: 'Corpus',
    curated: 'Curated',
    user: 'User',
    hybrid: 'Hybrid',
  },
  melodyRoles: {
    chord_tone: 'chord tone',
    passing_tone: 'passing tone',
    neighbor_tone: 'neighbor tone',
    suspension: 'suspension',
    retardation: 'retardation',
    anticipation: 'anticipation',
    appoggiatura: 'appoggiatura',
    escape_tone: 'escape tone',
    pedal_tone: 'pedal tone',
    unclassified: 'unclassified',
    ambiguous: 'ambiguous',
  },
  playback: {
    playingPrefix: 'Playing',
    playingAll: 'Playing all four voices',
    stopped: 'Playback stopped',
  },
  /** Duration glyphs by signature code (see domain/signatures.ts). */
  durationGlyphs: {
    w: '𝅝',
    h: '𝅗𝅥',
    q: '♩',
    e: '♪',
    s: '𝅘𝅥𝅯',
  },
  accidentalLabels: {
    natural: '',
    '#': '♯',
    b: '♭',
    bb: '𝄫',
    x: '𝄪',
  },
  chordQualityLabels: {
    major: 'major',
    minor: 'minor',
    diminished: 'diminished',
    augmented: 'augmented',
    dominant_seventh: 'dominant seventh',
    major_seventh: 'major seventh',
    minor_seventh: 'minor seventh',
    half_diminished_seventh: 'half-diminished seventh',
    fully_diminished_seventh: 'fully diminished seventh',
    suspended_second: 'suspended second',
    suspended_fourth: 'suspended fourth',
    other: 'chord',
  },
} as const;
