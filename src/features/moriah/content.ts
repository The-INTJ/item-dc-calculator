/**
 * Every string on the Moriah design preview.
 *
 * NOTHING HERE IS INVENTED, AND NO OTHER CHURCH'S CONTENT OR MEMBER DATA
 * APPEARS. This page is shown to a pastor, so every line is traceable:
 *
 *   MORIAH      — verbatim (or condensed) from moriahpbc.org.
 *   LABEL       — a short UI label we wrote (button text, a column heading).
 *                 Never a claim about the church.
 *   EXAMPLE     — structurally obvious stand-ins shown behind a visible
 *                 on-page notice: "—" service times, generic calendar
 *                 entries, 555-01xx phone numbers.
 *
 * If you add a string here, say which of those it is. Do not write new prose
 * about Moriah, and do not import anyone's real member data.
 */

/* ---------- MORIAH: the church itself ---------- */

export const church = {
  name: 'Moriah Primitive Baptist Church',
  shortName: 'Moriah',
  /** From the church's own name. */
  tagline: 'A Primitive Baptist congregation',
  address: {
    street: '1337 Moriah Church Rd',
    city: 'Colbert',
    state: 'Georgia',
    zip: '30628',
  },
} as const;

export const urls = {
  maps:
    'https://www.google.com/maps/place/1337+Moriah+Church+Rd,+Colbert,+GA+30628/@34.0722424,-83.2487487,17z/data=!3m1!4b1!4m5!3m4!1s0x88f63df6bfd36ad7:0x2efd8173e758c3d1!8m2!3d34.072238!4d-83.24656?hl=en',
  history: 'https://drive.google.com/file/d/1dy4DV-LXCgVPav6IFIUxvIWP3U97jKaB/view?usp=drive_link',
  sermonArchive:
    'https://drive.google.com/drive/folders/1qUbxxYlBEG339YAOxQss-_FZvocVqwJX?usp=drive_link',
  pastorPhone: 'tel:+17063383536',
  /** EXAMPLE — mocked. Facebook is the only place the church is today; swap
      in their real page URL before this goes anywhere near the public. */
  facebook: 'https://www.facebook.com/',
} as const;

/**
 * The preview is a single route; `?page=` selects which one you are on, so
 * the nav behaves like real page navigation (URL changes, fresh render)
 * without a route file per section.
 */
export const BASE_PATH = '/moriah';

export type PageKey =
  | 'home'
  | 'sermons'
  | 'blog'
  | 'pastor'
  | 'beliefs'
  | 'news'
  | 'directory'
  | 'visit'
  | 'give';

const PAGE_KEYS: readonly PageKey[] = [
  'home',
  'sermons',
  'blog',
  'pastor',
  'beliefs',
  'news',
  'directory',
  'visit',
  'give',
];

/** Unknown or missing `?page=` falls back to home rather than 404ing. */
export function parsePageKey(value: string | undefined): PageKey {
  return PAGE_KEYS.includes(value as PageKey) ? (value as PageKey) : 'home';
}

export function pageHref(page: PageKey): string {
  return page === 'home' ? BASE_PATH : `${BASE_PATH}?page=${page}`;
}

/** Title shown in the browser tab and the page's own heading block. */
export const pageTitles: Record<PageKey, string> = {
  home: 'Moriah Primitive Baptist Church',
  sermons: 'Sermons',
  blog: 'Blog',
  pastor: 'Our Pastor',
  beliefs: 'What We Believe',
  news: 'News & Calendar',
  directory: 'Church Directory',
  visit: 'Visit',
  give: 'Give',
};

export interface NavLeaf {
  label: string;
  page: PageKey;
}

export interface NavGroup {
  label: string;
  items: readonly NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry;
}

export const nav: readonly NavEntry[] = [
  {
    label: 'About',
    items: [
      { label: 'Our Pastor', page: 'pastor' },
      { label: 'What We Believe', page: 'beliefs' },
    ],
  },
  {
    label: 'Media',
    items: [
      { label: 'Sermons', page: 'sermons' },
      { label: 'Blog', page: 'blog' },
    ],
  },
  {
    label: 'Church Life',
    items: [
      { label: 'News & Calendar', page: 'news' },
      { label: 'Directory', page: 'directory' },
    ],
  },
  { label: 'Visit', page: 'visit' },
  { label: 'Give', page: 'give' },
];

/**
 * MORIAH — headline and sub are consecutive sentences from Elder Bryson's
 * "The Vision" on moriahpbc.org/Pastor.htm, verbatim.
 */
export const hero = {
  eyebrow: church.tagline,
  headline: 'The Church is not just a place for the well, but for the sick.',
  sub: 'It is a place for those in need to come and find the support and comfort of God’s people.',
  attribution: 'Elder Ernie Bryson, Pastor',
  primaryCta: 'Plan your visit',
  secondaryCta: 'Listen to a sermon',
  image: {
    src: '/moriah/church-aerial.jpg',
    alt: 'Aerial view of Moriah Primitive Baptist Church and its grounds in Colbert, Georgia',
  },
} as const;

/**
 * EXAMPLE — Moriah publishes no service times anywhere on its site, so the
 * strip renders the slots empty rather than guessing. Filling these in is the
 * first question to ask the church.
 */
export const services = {
  note: 'Service times are not published on the current site — the church supplies these.',
  times: [
    { day: 'Sunday', name: 'Morning Worship', time: '—' },
    { day: 'Sunday', name: 'Evening Worship', time: '—' },
    { day: 'Wednesday', name: 'Prayer & Bible Study', time: '—' },
  ],
} as const;

/**
 * MORIAH — headline and body are verbatim from Elder Bryson's "The Vision"
 * on Pastor.htm. The three point bodies are verbatim from Pastor.htm and the
 * Articles of Faith; only their short titles are LABELs we wrote.
 */
export const welcome = {
  eyebrow: 'Our vision',
  headline: 'Take her beyond her walls.',
  body: 'Her members have ministered to one another and those that are without for many years. I hope to continue these efforts and be a light in the community of Colbert and beyond.',
  attribution: 'Elder Ernie Bryson, Pastor',
  points: [
    {
      title: 'A ministry of simplicity',
      body: 'It is my hope and prayer that I can present the Bible in a way that those from five to ninety five can understand and embrace it.',
      source: 'Elder Ernie Bryson',
    },
    {
      title: 'Singing together',
      body: 'Singing of psalms, hymns and spiritual songs, vocally, is an ordinance of the gospel to be performed by believers.',
      source: 'Articles of Faith',
    },
    {
      title: 'The ordinances',
      body: 'Baptism and the Lord’s supper are ordinances, and washing of the saints’ feet an example of Jesus Christ.',
      source: 'Articles of Faith',
    },
  ],
} as const;

/* ---------- sermons ---------- */

export const sermonSection = {
  eyebrow: 'Sermon library',
  headline: 'Search every sermon',
  sub: 'Search by title, book of the Bible, or any word in the text.',
  notice:
    'Placeholder entries, built only from Moriah’s own Articles of Faith and the pastor’s page — they are not recordings. Moriah’s real sermons, with dates and preachers, drop straight in here.',
  archiveCta: 'Moriah’s sermon archive',
} as const;

export interface Sermon {
  id: string;
  title: string;
  scripture: string;
  book: string;
  summary: string;
}

/**
 * MORIAH ONLY. Every title, passage and summary below is Moriah’s own
 * published text — the thirteen Articles of Faith from
 * moriahpbc.org/MoriahArtofFaith.htm and Elder Bryson’s own words from
 * Pastor.htm. Nothing here is written by us, and no other church’s content
 * or member data appears. There are no dates or preacher names because the
 * church publishes none; see README.md.
 */
export const sermons: Sermon[] = [
  {
    id: 's-01',
    title: 'It is finished',
    scripture: 'John 19:30',
    book: 'John',
    summary:
      'The message of the Primitive Baptist Church can be found in one statement made by our Lord. “It is finished”. The promise of saving is complete.',
  },
  {
    id: 's-02',
    title: 'Thou shalt call His name JESUS',
    scripture: 'Matthew 1:21',
    book: 'Matthew',
    summary:
      '“And she shall bring forth a son, and thou shalt call His name JESUS; for He shall save his people from their sins.”',
  },
  {
    id: 's-03',
    title: 'Don’t stop believing',
    scripture: '1 John 5:5',
    book: '1 John',
    summary:
      'If I can but impart one pearl of truth to God’s people, I pray that it be this simple statement. Don’t stop believing.',
  },
  {
    id: 's-04',
    title: 'If my people',
    scripture: '2 Chronicles 7:14',
    book: '2 Chronicles',
    summary:
      'If my people, which are called by my name, shall humble themselves, and pray, and seek my face, and turn from their wicked ways; then will I hear from Heaven, and will forgive their sin, and will heal their land.',
  },
  {
    id: 's-05',
    title: 'One true and living God',
    scripture: '1 John 5:7',
    book: '1 John',
    summary:
      'We believe in one true and living God, and that there are three persons in the God-Head: The Father, The Son, and The Holy Ghost.',
  },
  {
    id: 's-06',
    title: 'The inspired word of God',
    scripture: 'Psalm 12:6-7',
    book: 'Psalms',
    summary:
      'We believe the Scripture of the Old and New Testament to be the inspired word of God and that they alone are to govern God’s people, both in faith and in practice.',
  },
  {
    id: 's-07',
    title: 'Eternal and particular election',
    scripture: 'Romans 9:11-13',
    book: 'Romans',
    summary: 'We believe in the doctrine of eternal and particular election.',
  },
  {
    id: 's-08',
    title: 'Original sin',
    scripture: '1 Corinthians 15:21-22',
    book: '1 Corinthians',
    summary: 'We believe in the doctrine of original sin.',
  },
  {
    id: 's-09',
    title: 'Man’s impotency to recover himself',
    scripture: 'Romans 3:10-18',
    book: 'Romans',
    summary:
      'We believe in the doctrine of man’s impotency to recover himself from the fallen state he is in by nature of his own free will and ability.',
  },
  {
    id: 's-10',
    title: 'The imputed righteousness of Christ',
    scripture: 'Galatians 2:16',
    book: 'Galatians',
    summary:
      'We believe that sinners are justified in the sight of God only by the imputed righteousness of Christ.',
  },
  {
    id: 's-11',
    title: 'Called, regenerated, and sanctified',
    scripture: 'Romans 8:28-30',
    book: 'Romans',
    summary:
      'We believe that God’s elect shall be called, regenerated, and sanctified by the Holy Spirit.',
  },
  {
    id: 's-12',
    title: 'Preserved in Christ',
    scripture: 'Jude 1:1',
    book: 'Jude',
    summary:
      'We believe that the elect are preserved in Christ and shall spend eternity in Heaven with Him.',
  },
  {
    id: 's-13',
    title: 'Baptism and the Lord’s supper',
    scripture: 'Acts 8:38',
    book: 'Acts',
    summary:
      'We believe that baptism and the Lord’s supper are ordinances, and washing of the saints’ feet an example of Jesus Christ, and true believers are the proper subjects. We believe immersion the only mode of baptism.',
  },
  {
    id: 's-14',
    title: 'The resurrection of the dead',
    scripture: '1 Thessalonians 4:15-18',
    book: '1 Thessalonians',
    summary: 'We believe in the resurrection of the dead, and a general judgment.',
  },
  {
    id: 's-15',
    title: 'Psalms, hymns and spiritual songs',
    scripture: 'Ephesians 5:19',
    book: 'Ephesians',
    summary:
      'We believe that singing of psalms, hymns and spiritual songs, vocally is an ordinance of the gospel to be performed by believers.',
  },
];

/* ---------- MORIAH: pastor, beliefs, history, visit ---------- */

/** MORIAH — all verbatim from moriahpbc.org/Pastor.htm. */
export const pastor = {
  eyebrow: 'Our pastor',
  name: 'Elder Ernie Bryson',
  spouse: 'and his wife, Cheryl',
  opening:
    'It is an honor and a privilege to serve the Lord’s people. My prayer is that all I do at and for Moriah Church will benefit them and glorify our Heavenly Father.',
  columns: [
    {
      title: 'The Ministry',
      body: 'I hope, by the Grace of God, that my Ministry will be one of simplicity. It is my hope and prayer that I can present the Bible in a way that those from five to ninety five can understand and embrace it.',
    },
    {
      title: 'The Vision',
      body: 'My hope and vision for Moriah Church is to take her beyond her walls. I hope to continue these efforts and be a light in the community of Colbert and beyond.',
    },
    {
      title: 'The Message',
      body: 'The message of the Primitive Baptist Church can be found in one statement made by our Lord. “It is finished”. The promise of saving is complete.',
    },
  ],
  pullQuote:
    'I pray that, by the Grace of God, Moriah’s light will compel those in darkness to come in and find rest for their souls, in the finished work of Christ.',
} as const;

/** MORIAH — all thirteen articles verbatim from moriahpbc.org/MoriahArtofFaith.htm. */
export const beliefs = {
  eyebrow: 'What we believe',
  headline: 'Articles of Faith',
  articles: [
    {
      text: 'We believe in one true and living God, and that there are three persons in the God-Head: The Father, The Son, and The Holy Ghost.',
      refs: '1 John 5:7 · 1 Peter 1:2 · John 1:1 · John 10:28-30 · John 14:16-26',
    },
    {
      text: 'We believe the Scripture of the Old and New Testament (in English, the King James Translation) to be the inspired word of God and that they alone are to govern God’s people, both in faith and in practice.',
      refs: 'Psalm 12:6-7 · 2 Timothy 3:16 · Psalm 119 · 2 Peter 1:16-21',
    },
    {
      text: 'We believe in the doctrine of eternal and particular election.',
      refs: 'Romans 9:11-13 · Ephesians 1:1-6 · John 10:25-30',
    },
    {
      text: 'We believe in the doctrine of original sin.',
      refs: 'Romans 5 · 1 Corinthians 15:21-22',
    },
    {
      text: 'We believe in the doctrine of man’s impotency to recover himself from the fallen state he is in by nature of his own free will and ability.',
      refs: 'Romans 3:10-18 · Romans 8:7-8 · Ephesians 2:1 · Job 14:1-4 · Jeremiah 13:23',
    },
    {
      text: 'We believe that sinners are justified in the sight of God only by the imputed righteousness of Christ.',
      refs: 'Romans 5:9 · Galatians 2:16 · Ephesians 2:9 · 2 Timothy 1:9 · Titus 3:5',
    },
    {
      text: 'We believe that God’s elect shall be called, regenerated, and sanctified by the Holy Spirit.',
      refs: 'Romans 8:28-30 · 1 Peter 1:2',
    },
    {
      text: 'We believe that the elect are preserved in Christ and shall spend eternity in Heaven with Him.',
      refs: 'Jude 1:1 · John 10:27-29',
    },
    {
      text: 'We believe that baptism and the Lord’s supper are ordinances, and washing of the saints’ feet an example of Jesus Christ, and true believers are the proper subjects. We believe immersion the only mode of baptism.',
      refs: 'Matthew 28:19 · 1 Corinthians 11:24-25 · Acts 8:38 · John 3:23',
    },
    {
      text: 'We believe in the resurrection of the dead, and a general judgment.',
      refs: '1 Thessalonians 4:15-18 · Hebrews 9:27',
    },
    {
      text: 'We believe that the punishment of the wicked is everlasting and that the joys of the righteous are eternal.',
      refs: 'Matthew 25:46',
    },
    {
      text: 'We believe that ordained ministers are such as have come under imposition of hands of a regular authorized presbytery, and that they only have the right to administer the ordinances.',
      refs: '1 Timothy 4:14 · Matthew 28:18-20',
    },
    {
      text: 'We believe that singing of psalms, hymns and spiritual songs, vocally is an ordinance of the gospel to be performed by believers.',
      refs: 'Ephesians 5:19 · Hebrews 2:12 · James 5:13 · Matthew 26:30',
    },
  ],
} as const;

/** MORIAH — the button label on moriahpbc.org and the file it links to. */
export const history = {
  eyebrow: 'Our history',
  headline: '200 Years of Blessing',
  cta: 'Open the book',
} as const;

/** MORIAH — all verbatim from moriahpbc.org/Contacts.htm. */
export const visit = {
  eyebrow: 'Visit us',
  headline: 'Find us on Moriah Church Road',
  directionsCta: 'Get directions',
  pastorLabel: 'Pastor',
  pastorName: 'Elder Ernie Bryson',
  pastorAddress: '111 Mathis Rd, Danielsville, GA 30633',
  pastorPhoneDisplay: '706-338-3536',
  deaconsLabel: 'Deacons',
  deacons: [
    'Jack Chandler',
    'Rodney Chandler',
    'Tony Tyson',
    'Terry Chandler',
    'Will Cabe',
    'Danny Nichols',
  ],
  clerkLabel: 'Clerk',
  clerk: 'Steve McCannon',
} as const;

/* ---------- news + calendar page ---------- */

export const newsPage = {
  eyebrow: 'Church life',
  headline: 'News & Calendar',
  notice:
    'Example entries only — generic church events with no real dates, and notices about material already published on moriahpbc.org. They are here to show how the page works.',
  backCta: 'Back to home',
} as const;

export interface Announcement {
  id: string;
  title: string;
  /** The "this page last updated" date the source page itself prints. */
  date: string;
  body: string;
  pinned?: boolean;
}

/**
 * MORIAH — each notice states a fact about something the church already
 * publishes, and links to it. No people, no events, no invented news.
 */
export const announcements: Announcement[] = [
  {
    id: 'n-001',
    title: '200 Years of Blessing',
    date: '2025-01-27',
    pinned: true,
    body: 'The bicentennial book is available to read online from the church’s own library.',
  },
  {
    id: 'n-002',
    title: 'Articles of Faith',
    date: '2018-01-17',
    pinned: true,
    body: 'The thirteen articles held by this congregation are published in full, each with its scripture references.',
  },
  {
    id: 'n-003',
    title: 'Sermon recordings',
    date: '2025-01-27',
    body: 'Recordings are collected in the church’s archive, and are searchable from the sermon library on this site.',
  },
  {
    id: 'n-004',
    title: 'Contact the church',
    date: '2023-09-06',
    body: 'The pastor, deacons and clerk are listed with their published contact details on the Visit page.',
  },
];

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO date. */
  date: string;
  time: string;
  kind: 'worship' | 'fellowship' | 'conference' | 'special';
  detail: string;
}

/**
 * EXAMPLE — generic entries so the month grid, the day panel and the coming-up
 * list have something to render. No real dates, no names, no claim that any of
 * this is scheduled. Moriah's own calendar replaces the whole array.
 */
export const calendarEvents: CalendarEvent[] = [
  {
    id: 'e-001',
    title: 'Sunday Worship',
    date: '2026-09-27',
    time: '—',
    kind: 'worship',
    detail: 'Example entry.',
  },
  {
    id: 'e-002',
    title: 'Church Conference',
    date: '2026-09-27',
    time: '—',
    kind: 'conference',
    detail: 'Example entry.',
  },
  {
    id: 'e-003',
    title: 'Prayer & Bible Study',
    date: '2026-09-23',
    time: '—',
    kind: 'worship',
    detail: 'Example entry.',
  },
  {
    id: 'e-004',
    title: 'Cemetery Workday',
    date: '2026-09-26',
    time: '—',
    kind: 'fellowship',
    detail: 'Example entry.',
  },
  {
    id: 'e-005',
    title: 'Sunday Worship',
    date: '2026-10-04',
    time: '—',
    kind: 'worship',
    detail: 'Example entry.',
  },
  {
    id: 'e-006',
    title: 'Dinner on the Grounds',
    date: '2026-10-04',
    time: '—',
    kind: 'fellowship',
    detail: 'Example entry.',
  },
  {
    id: 'e-007',
    title: 'Prayer & Bible Study',
    date: '2026-10-07',
    time: '—',
    kind: 'worship',
    detail: 'Example entry.',
  },
  {
    id: 'e-008',
    title: 'Sunday Worship',
    date: '2026-10-11',
    time: '—',
    kind: 'worship',
    detail: 'Example entry.',
  },
  {
    id: 'e-009',
    title: 'Homecoming',
    date: '2026-10-11',
    time: '—',
    kind: 'special',
    detail: 'Example entry.',
  },
  {
    id: 'e-010',
    title: 'Sunday Worship',
    date: '2026-10-18',
    time: '—',
    kind: 'worship',
    detail: 'Example entry.',
  },
  {
    id: 'e-011',
    title: 'Sunday Worship',
    date: '2026-10-25',
    time: '—',
    kind: 'worship',
    detail: 'Example entry.',
  },
];

export const eventKindLabels: Record<CalendarEvent['kind'], string> = {
  worship: 'Worship',
  fellowship: 'Fellowship',
  conference: 'Conference',
  special: 'Special service',
};


/* ---------- connect ---------- */

/**
 * LABEL + EXAMPLE — Facebook is the one place the church has a presence today,
 * so it is the only channel offered. The URL itself is mocked.
 */
export const connect = {
  eyebrow: 'Connect with us',
  headline: 'Find us on Facebook',
  body: 'Facebook is where the congregation posts today. Everything else on this page links back to the church’s own material.',
  cta: 'Moriah on Facebook',
  placeholderTag: 'mock link',
} as const;

/* ---------- blog page ---------- */

/**
 * EXAMPLE — the church has written no blog. Every word below is lorem ipsum
 * and every card carries a placeholder pill, so nothing here can be mistaken
 * for something Moriah said. Replace wholesale when they write real posts.
 */
export const blogPage = {
  eyebrow: 'Writing',
  headline: 'Blog',
  notice:
    'Nothing here is real writing. The church has not published a blog, so these are lorem ipsum placeholders showing what the layout would do with real posts.',
  placeholderTag: 'placeholder text',
  posts: [
    {
      id: 'b-01',
      title: 'Lorem ipsum dolor sit amet',
      date: '2026-09-14',
      excerpt:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    },
    {
      id: 'b-02',
      title: 'Sed do eiusmod tempor incididunt',
      date: '2026-08-31',
      excerpt:
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.',
    },
    {
      id: 'b-03',
      title: 'Ut enim ad minim veniam',
      date: '2026-08-17',
      excerpt:
        'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto.',
    },
    {
      id: 'b-04',
      title: 'Quis nostrud exercitation ullamco',
      date: '2026-08-03',
      excerpt:
        'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
    },
    {
      id: 'b-05',
      title: 'Neque porro quisquam est',
      date: '2026-07-20',
      excerpt:
        'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint.',
    },
    {
      id: 'b-06',
      title: 'Temporibus autem quibusdam',
      date: '2026-07-06',
      excerpt:
        'Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat.',
    },
  ],
} as const;

/* ---------- give page ---------- */

/**
 * EXAMPLE — the church publishes nothing about giving, so this page is
 * lorem ipsum behind a notice. The only real thing on it is the church's own
 * mailing address, which they do publish.
 */
export const givePage = {
  eyebrow: 'Give',
  headline: 'Give',
  notice:
    'The church publishes nothing about giving, so the copy below is lorem ipsum placeholder. The mailing address is their real published one.',
  placeholderTag: 'placeholder text',
  body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  methods: [
    {
      id: 'g-01',
      title: 'Lorem ipsum',
      body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    },
    {
      id: 'g-02',
      title: 'Consectetur adipiscing',
      body: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    },
  ],
  byMailLabel: 'By mail',
} as const;

/* ---------- directory page ---------- */

export const directoryPage = {
  eyebrow: 'Members',
  headline: 'Church directory',
  sub: 'Households at a glance. Tap a name for their phone, or a spouse to jump to their household.',
  notice:
    'Sample directory. Names and roles are from Moriah’s published contact page; the pastor’s phone and address are the real published ones. All other numbers are placeholders in the 555-01xx range reserved for examples, and household members beyond Elder Bryson and Cheryl are not real — they are here to show the card layout.',
  backCta: 'Back to home',
} as const;

export interface DirectoryPerson {
  id: string;
  name: string;
  /** Published role, or undefined for a household member with none. */
  role?: string;
  /** Digits for a tel: link, or null when not published. */
  phone: string | null;
  /** True when the phone is a reserved 555-01xx placeholder. */
  phonePlaceholder?: boolean;
  /** `id` of a person in another household, or this one. */
  spouseId?: string;
}

export interface Household {
  id: string;
  /** Surname as the card title. */
  name: string;
  /** Published address, or undefined. */
  address?: string;
  addressPlaceholder?: boolean;
  members: DirectoryPerson[];
}

/**
 * MORIAH names and roles from moriahpbc.org/Contacts.htm. Elder Bryson's phone
 * and address are the real published ones; Cheryl is named on Pastor.htm.
 * Every other phone is a reserved 555-01xx placeholder, and no relationships
 * beyond the Brysons are asserted. See `directoryPage.notice`.
 */
export const households: Household[] = [
  {
    id: 'h-bryson',
    name: 'Bryson',
    address: '111 Mathis Rd, Danielsville, GA 30633',
    members: [
      {
        id: 'p-ernie',
        name: 'Elder Ernie Bryson',
        role: 'Pastor',
        phone: '+17063383536',
        spouseId: 'p-cheryl',
      },
      { id: 'p-cheryl', name: 'Cheryl Bryson', phone: null, spouseId: 'p-ernie' },
    ],
  },
  {
    id: 'h-jack-chandler',
    name: 'Chandler',
    address: 'Colbert, GA',
    addressPlaceholder: true,
    members: [
      {
        id: 'p-jack',
        name: 'Jack Chandler',
        role: 'Deacon',
        phone: '+17065550118',
        phonePlaceholder: true,
      },
    ],
  },
  {
    id: 'h-rodney-chandler',
    name: 'Chandler',
    address: 'Colbert, GA',
    addressPlaceholder: true,
    members: [
      {
        id: 'p-rodney',
        name: 'Rodney Chandler',
        role: 'Deacon',
        phone: '+17065550129',
        phonePlaceholder: true,
      },
    ],
  },
  {
    id: 'h-terry-chandler',
    name: 'Chandler',
    address: 'Colbert, GA',
    addressPlaceholder: true,
    members: [
      {
        id: 'p-terry',
        name: 'Terry Chandler',
        role: 'Deacon',
        phone: '+17065550143',
        phonePlaceholder: true,
      },
    ],
  },
  {
    id: 'h-tyson',
    name: 'Tyson',
    address: 'Colbert, GA',
    addressPlaceholder: true,
    members: [
      {
        id: 'p-tony',
        name: 'Tony Tyson',
        role: 'Deacon',
        phone: '+17065550156',
        phonePlaceholder: true,
      },
    ],
  },
  {
    id: 'h-cabe',
    name: 'Cabe',
    address: 'Colbert, GA',
    addressPlaceholder: true,
    members: [
      {
        id: 'p-will',
        name: 'Will Cabe',
        role: 'Deacon',
        phone: '+17065550167',
        phonePlaceholder: true,
      },
    ],
  },
  {
    id: 'h-nichols',
    name: 'Nichols',
    address: 'Colbert, GA',
    addressPlaceholder: true,
    members: [
      {
        id: 'p-danny',
        name: 'Danny Nichols',
        role: 'Deacon',
        phone: '+17065550172',
        phonePlaceholder: true,
      },
    ],
  },
  {
    id: 'h-mccannon',
    name: 'McCannon',
    address: 'Colbert, GA',
    addressPlaceholder: true,
    members: [
      {
        id: 'p-steve',
        name: 'Steve McCannon',
        role: 'Clerk',
        phone: '+17065550185',
        phonePlaceholder: true,
      },
    ],
  },
];

export const footer = {
  /** John 1:46. */
  invitation: 'Come and see.',
  note: 'Moriah Primitive Baptist Church · 1337 Moriah Church Rd, Colbert, Georgia 30628',
  copyright: 'Design preview · not the live site',
} as const;
