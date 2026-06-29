import type { Contributor, HymnEntry, ThemeOption } from './types';

export const eras = [
  'Before 1700',
  '18th Century',
  '19th Century',
  '20th Century',
  '21st Century',
] as const;

export const meters = [
  'CM (8 6 8 6)',
  'CMD (8 6 8 6 D)',
  'HM (6 6 6 6 8 8)',
  'LM (8 8 8 8)',
  'LMD (8 8 8 8 D)',
  'LPM (8 8 8 8 8 8)',
  'SM (6 6 8 6)',
  'SMD (6 6 8 6 D)',
  'SPM (6 6 8 6 6 8)',
  'Other Meters',
] as const;

export const themeOptions: ThemeOption[] = [
  { label: 'Call to Worship', selectable: true },
  { label: 'Adoration & Praise', selectable: true },
  { label: "God's Perfections", selectable: false },
  { label: "God's Eternity", selectable: true, depth: 1 },
  { label: "God's Immutability", selectable: true, depth: 1 },
  { label: "God's Independence", selectable: true, depth: 1 },
  { label: "God's Omnipresence", selectable: true, depth: 1 },
  { label: "God's Omniscience", selectable: true, depth: 1 },
  { label: "God's Sovereignty", selectable: true, depth: 1 },
  { label: "God's Faithfulness", selectable: true, depth: 1 },
  { label: "God's Forgiveness", selectable: true, depth: 1 },
  { label: "God's Goodness", selectable: true, depth: 1 },
  { label: "God's Grace", selectable: true, depth: 1 },
  { label: "God's Holiness", selectable: true, depth: 1 },
  { label: "God's Justice", selectable: true, depth: 1 },
  { label: "God's Love", selectable: true, depth: 1 },
  { label: "God's Lovingkindness", selectable: true, depth: 1 },
  { label: "God's Mercy", selectable: true, depth: 1 },
  { label: "God's Patience", selectable: true, depth: 1 },
  { label: "God's Righteousness", selectable: true, depth: 1 },
  { label: "God's Truthfulness", selectable: true, depth: 1 },
  { label: "God's Word", selectable: true, depth: 1 },
  { label: 'The Holy Trinity', selectable: true },
  { label: 'God the Father', selectable: true },
  { label: 'God the Son', selectable: false },
  { label: 'The Person of Christ', selectable: true, depth: 1 },
  { label: 'The Incarnation', selectable: true, depth: 1 },
  { label: "The Savior's Sacrifice", selectable: true, depth: 1 },
  { label: 'The Risen Lord', selectable: true, depth: 1 },
  { label: "Christ's Return", selectable: true, depth: 1 },
  { label: 'The Reigning King', selectable: true, depth: 1 },
  { label: 'God the Holy Spirit', selectable: true },
  { label: 'Creation', selectable: true },
  { label: 'Providence', selectable: true },
  { label: 'Redemption', selectable: true },
  { label: 'The Christian Life', selectable: false },
  { label: 'Conversion & Calling', selectable: true, depth: 1 },
  { label: 'Prayer', selectable: true, depth: 1 },
  { label: 'Faith & Dependence', selectable: true, depth: 1 },
  { label: 'Assurance & Security', selectable: true, depth: 1 },
  { label: 'Devotion to Christ', selectable: true, depth: 1 },
  { label: 'Gratitude & Thanksgiving', selectable: true, depth: 1 },
  { label: 'Hope & Heaven', selectable: true, depth: 1 },
  { label: 'The Church', selectable: false },
  { label: 'The Bride of Christ', selectable: true, depth: 1 },
  { label: 'Christian Mission', selectable: true, depth: 1 },
  { label: 'Christian Community', selectable: true, depth: 1 },
  { label: 'Baptism', selectable: true, depth: 1 },
  { label: "The Lord's Supper", selectable: true, depth: 1 },
  { label: 'Revival', selectable: true },
  { label: 'Benediction', selectable: true },
  { label: 'Evening Meditations', selectable: true },
];

const selectableThemes = themeOptions
  .filter((theme) => theme.selectable)
  .map((theme) => theme.label);

function contributor(displayName: string, sortName: string, roles: Contributor['roles']): Contributor {
  return { displayName, sortName, roles };
}

function copyright(wordsPublicDomain: boolean, musicPublicDomain: boolean): HymnEntry['copyright'] {
  return { wordsPublicDomain, musicPublicDomain };
}

const handcraftedEntries: HymnEntry[] = [
  {
    id: 'hymn-016',
    number: 16,
    title: 'The Crowned Redeemer Reigns',
    firstLine: 'The crowned Redeemer reigns above the morning skies',
    tuneName: 'ST. HARBOR',
    meter: 'CM (8 6 8 6)',
    era: '19th Century',
    themes: ['The Reigning King'],
    contributors: [
      contributor('Thomas Kellen', 'Kellen, Thomas', ['words']),
      contributor('Jeremiah Clarke', 'Clarke, Jeremiah', ['music']),
    ],
    copyright: copyright(true, true),
  },
  {
    id: 'hymn-023',
    number: 23,
    title: 'Holy Lord of Endless Light',
    firstLine: 'Holy Lord of endless light, whose glory crowns the day',
    tuneName: 'NICASTOR',
    meter: 'LM (8 8 8 8)',
    era: '19th Century',
    themes: ['The Holy Trinity'],
    contributors: [
      contributor('Reginald Mercer', 'Mercer, Reginald', ['words']),
      contributor('John D. Ames', 'Ames, John D.', ['music']),
    ],
    copyright: copyright(true, true),
  },
  {
    id: 'hymn-042',
    number: 42,
    title: 'Waters of Mercy Flow',
    firstLine: 'Waters of mercy flow where weary sinners kneel',
    chorusFirstLine: 'Mercy flows, and grace is near',
    tuneName: 'MERCY BROOK',
    meter: 'CMD (8 6 8 6 D)',
    era: '18th Century',
    themes: ["God's Mercy"],
    contributors: [
      contributor('Elias Waters', 'Waters, Elias', ['words']),
      contributor('Marian Ashford', 'Ashford, Marian', ['music']),
    ],
    copyright: copyright(true, false),
  },
  {
    id: 'hymn-087',
    number: 87,
    title: 'Before the Throne of Dawn',
    firstLine: 'Before the throne of dawn we lift a quiet song',
    tuneName: 'MORNING COURT',
    meter: 'SM (6 6 8 6)',
    era: 'Before 1700',
    themes: ['Call to Worship'],
    contributors: [contributor('Anne Selby', 'Selby, Anne', ['words', 'music'])],
    copyright: copyright(true, true),
  },
  {
    id: 'hymn-118',
    number: 118,
    title: 'The Word That Stands Forever',
    firstLine: 'The Word that stands forever speaks mercy to the dust',
    tuneName: 'COVENANT OAK',
    meter: 'LMD (8 8 8 8 D)',
    era: '20th Century',
    themes: ["God's Word"],
    contributors: [
      contributor('Nathaniel Rowe', 'Rowe, Nathaniel', ['words']),
      contributor('Clara Benton', 'Benton, Clara', ['music', 'arranger']),
    ],
    copyright: copyright(false, false),
  },
  {
    id: 'hymn-146',
    number: 146,
    title: 'Christ Returns with Gentle Thunder',
    firstLine: 'Christ returns with gentle thunder, every promise now made plain',
    chorusFirstLine: 'Come, Lord of glory, gather Your own',
    tuneName: 'NEW BRIGHTON',
    meter: 'Other Meters',
    era: '21st Century',
    themes: ["Christ's Return"],
    contributors: [
      contributor('Julian Merritt', 'Merritt, Julian', ['words']),
      contributor('Elise Harrow', 'Harrow, Elise', ['music']),
    ],
    copyright: copyright(false, false),
  },
  {
    id: 'hymn-174',
    number: 174,
    title: 'Bread of the Pilgrim Table',
    firstLine: 'Bread of the pilgrim table, feed us with grace today',
    tuneName: 'PILGRIM TABLE',
    meter: 'CM (8 6 8 6)',
    era: '18th Century',
    themes: ["The Lord's Supper"],
    contributors: [
      contributor('Silas Renwick', 'Renwick, Silas', ['words']),
      contributor('Marta Bell', 'Bell, Marta', ['music']),
    ],
    copyright: copyright(true, true),
  },
  {
    id: 'hymn-205',
    number: 205,
    title: 'In Fields of Providence',
    firstLine: 'In fields of providence the hidden mercies grow',
    tuneName: 'GREEN RIDGE',
    meter: 'HM (6 6 6 6 8 8)',
    era: '19th Century',
    themes: ['Providence'],
    contributors: [
      contributor('Clara Whitcomb', 'Whitcomb, Clara', ['words']),
      contributor('Edwin Larke', 'Larke, Edwin', ['music']),
    ],
    copyright: copyright(true, true),
  },
  {
    id: 'hymn-227',
    number: 227,
    title: 'Endless Alleluias Rise',
    firstLine: 'There is an endless song awaiting every tongue',
    chorusFirstLine: 'Alleluia, alleluia, let the King be praised',
    tuneName: 'ENDLESS SONG',
    meter: 'LPM (8 8 8 8 8 8)',
    era: '21st Century',
    themes: ['The Reigning King'],
    contributors: [
      contributor('Mason Bell', 'Bell, Mason', ['words', 'music']),
      contributor('Keira Glenn', 'Glenn, Keira', ['words', 'music']),
    ],
    copyright: copyright(false, false),
  },
  {
    id: 'hymn-302',
    number: 302,
    title: 'O Spirit, Kindle Quiet Fire',
    firstLine: 'O Spirit, kindle quiet fire where cold devotion sleeps',
    tuneName: 'EMBER LANE',
    meter: 'SMD (6 6 8 6 D)',
    era: '20th Century',
    themes: ['God the Holy Spirit'],
    contributors: [
      contributor('Peter Hollis', 'Hollis, Peter', ['words']),
      contributor('Lena Carver', 'Carver, Lena', ['music']),
    ],
    copyright: copyright(false, false),
  },
  {
    id: 'hymn-418',
    number: 418,
    title: 'Safe in the Shepherds Keeping',
    firstLine: 'Safe in the Shepherds keeping, I rest beneath His eye',
    tuneName: 'SHEPHERD WATCH',
    meter: 'CM (8 6 8 6)',
    era: '19th Century',
    themes: ['Assurance & Security'],
    contributors: [
      contributor('Amelia North', 'North, Amelia', ['words']),
      contributor('Gideon Vale', 'Vale, Gideon', ['music']),
    ],
    copyright: copyright(true, true),
  },
  {
    id: 'hymn-512',
    number: 512,
    title: 'Evening Light Upon the Chapel',
    firstLine: 'Evening light upon the chapel gathers every care',
    tuneName: 'LAMPLIGHT',
    meter: 'SPM (6 6 8 6 6 8)',
    era: '20th Century',
    themes: ['Evening Meditations'],
    contributors: [
      contributor('Margaret Voss', 'Voss, Margaret', ['words']),
      contributor('Henry Alden', 'Alden, Henry', ['music', 'arranger']),
    ],
    copyright: copyright(true, false),
  },
];

const firstNames = [
  'Abel',
  'Ada',
  'Benedict',
  'Celia',
  'Daniel',
  'Edith',
  'Frederick',
  'Grace',
  'Hugh',
  'Iris',
  'Jonas',
  'Lydia',
  'Martin',
  'Nora',
  'Owen',
  'Phoebe',
  'Rufus',
  'Susanna',
  'Theodore',
  'Viola',
  'Warren',
  'Yvonne',
  'Zachary',
];

const lastNames = [
  'Alcott',
  'Bramwell',
  'Cairn',
  'Davenport',
  'Ellison',
  'Fairchild',
  'Gresham',
  'Hartwell',
  'Ingram',
  'Jessel',
  'Kingsley',
  'Lowell',
  'Marden',
  'Norcross',
  'Orchard',
  'Prescott',
  'Quillen',
  'Ravenscroft',
  'Stillman',
  'Taverner',
  'Underhill',
  'Verity',
  'Winslow',
  'Yardley',
];

const titleOpeners = [
  'A Song for',
  'Behold the',
  'Come Praise the',
  'From Every',
  'Great Is the',
  'Let Zion',
  'O Blessed',
  'The Mercy of',
  'When Morning',
  'With Quiet',
];

const titleSubjects = [
  'Faithful Shepherd',
  'King of Grace',
  'Living Word',
  'Lord of Harvest',
  'Pilgrim Hope',
  'Risen Savior',
  'Steadfast Love',
  'Table of Peace',
  'Throne of Glory',
  'Voice of Mercy',
];

const firstLineOpeners = [
  'Across the fields of morning',
  'Before the mercy seat',
  'Beneath the quiet heavens',
  'Come lift the ancient promise',
  'From every shaded valley',
  'In every hour of waiting',
  'Let every heart remember',
  'O keep us near the Savior',
  'The saints in hope are singing',
  'When evening gathers softly',
];

const tuneRoots = [
  'ABBEY GATE',
  'BRIGHT MEADOW',
  'CEDAR HALL',
  'DOVEWELL',
  'ELM COMMON',
  'FAIRHAVEN',
  'GRACEFIELD',
  'HARBOR ROAD',
  'IVORY LANE',
  'KINGSMEAD',
  'LOWLAND',
  'MERCY HILL',
  'NORTH CHAPEL',
  'OAK PARISH',
  'PRAISEWELL',
  'QUIET VALE',
];

function makeGeneratedContributor(seed: number, role: Contributor['roles'][number]): Contributor {
  const firstName = firstNames[seed % firstNames.length];
  const lastName = lastNames[Math.floor(seed / firstNames.length) % lastNames.length];
  return contributor(`${firstName} ${lastName}`, `${lastName}, ${firstName}`, [role]);
}

function makeGeneratedEntry(number: number, index: number): HymnEntry {
  const title = `${titleOpeners[index % titleOpeners.length]} ${
    titleSubjects[Math.floor(index / titleOpeners.length) % titleSubjects.length]
  }`;
  const firstLine = `${firstLineOpeners[index % firstLineOpeners.length]}, we trace the Lord's kindness`;
  const theme = selectableThemes[index % selectableThemes.length];
  const tuneName = `${tuneRoots[index % tuneRoots.length]} ${String((index % 9) + 1)}`;
  const words = makeGeneratedContributor(index * 2, 'words');
  const music = index % 13 === 0 ? words : makeGeneratedContributor(index * 2 + 1, 'music');

  return {
    id: `hymn-${String(number).padStart(3, '0')}`,
    number,
    title,
    firstLine,
    chorusFirstLine: index % 6 === 0 ? 'Sing praise, sing praise, the covenant stands sure' : undefined,
    tuneName,
    meter: meters[index % meters.length],
    era: eras[index % eras.length],
    themes: [theme],
    contributors: music === words ? [words] : [words, music],
    copyright: copyright(index % 3 === 0, index % 4 === 0),
  };
}

export function buildDummyHymnCatalog(): HymnEntry[] {
  const handcraftedNumbers = new Set(handcraftedEntries.map((entry) => entry.number));
  const generatedEntries: HymnEntry[] = [];

  for (let number = 1; number <= 573; number += 1) {
    if (!handcraftedNumbers.has(number)) {
      generatedEntries.push(makeGeneratedEntry(number, generatedEntries.length));
    }
  }

  return [...handcraftedEntries, ...generatedEntries].sort((a, b) => a.number - b.number);
}

export const hymnCatalog = buildDummyHymnCatalog();
