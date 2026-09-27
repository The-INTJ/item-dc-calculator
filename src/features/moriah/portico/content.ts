/**
 * Strings for the Portico preview (/moriah-2) that ../content.ts does not
 * already hold. The same rule applies here as there, only stricter:
 *
 *   MORIAH  — verbatim from moriahpbc.org. Typographic quotes and apostrophes
 *             are the only change, plus one flagged typo fix.
 *   LABEL   — a short UI label we wrote (a placeholder, an aria-label).
 *             Never a claim about the church.
 *   NOTICE  — a visible note that says a block is a demo stand-in.
 *
 * Nothing here is prose we wrote about Moriah. In particular there is no
 * service schedule, no invented event, and no program the church does not
 * name itself. If a string is not on their site, it is a LABEL or NOTICE,
 * and it says nothing about what they believe or do.
 */

/* ---------- MORIAH: the site's own lockup and labels ---------- */

/** MORIAH — the header lockup on every moriahpbc.org page: "Moriah" over "Primitive Baptist Church". */
export const lockup = {
  first: 'Moriah',
  rest: 'Primitive Baptist Church',
} as const;

/** MORIAH — link labels from the moriahpbc.org home page, verbatim. */
export const siteLabels = {
  pastor: 'Pastor',
  faith: 'Our Faith',
  sermons: 'Sermons',
  calendar: 'Calendar',
  contact: 'Contact',
  directions: 'Directions',
  history: '200 Years of Blessing',
  /** The LISTEN button on Pastor.htm. */
  listen: 'Listen',
} as const;

/* ---------- MORIAH: Pastor.htm, verbatim ---------- */

export const pastorPage = {
  name: 'Elder Ernie Bryson',
  caption: 'Ernie Bryson and his wife Cheryl',
  photo: {
    src: '/moriah/pastor-and-wife.jpg',
    /** LABEL */
    alt: 'Elder Ernie Bryson and his wife, Cheryl',
  },
  opening: [
    'It is an honor and a privilege to serve the Lord’s people.',
    'My prayer is that all I do at and for Moriah Church will benefit them and glorify our Heavenly Father.',
  ],
  ministry: {
    title: 'The Ministry',
    lines: [
      'I hope, by the Grace of God, that my Ministry will be one of simplicity.',
      'It is my hope and prayer that I can present the Bible in a way that those from five to ninety five can understand and embrace it.',
      'I pray that God will continue to bless Moriah Church with growth, both physical and spiritual.',
      'I pray for continued opportunity to serve and minister to the saints of God for as long as they will have me.',
    ],
    pearlLead:
      'If I can but impart one pearl of truth to God’s people, I pray that it be this simple statement.',
    pearl: 'Don’t stop believing.',
    pearlRef: '1 John 5:5',
    /** The LISTEN button's own target on Pastor.htm. */
    listenHref: 'https://drive.google.com/open?id=0B4Yaw2c7G7wCeGRacllxcjZ2Yms',
  },
  vision: {
    title: 'The Vision',
    lines: [
      'My hope and vision for Moriah Church is to take her beyond her walls.',
      'Her members have ministered to one another and those that are without for many years.',
      'I hope to continue these efforts and be a light in the community of Colbert and beyond.',
    ],
    well: 'The Church is not just a place for the well, but for the sick.',
    need: 'It is a place for those in need to come and find the support and comfort of God’s people.',
    prayer:
      'I pray that, by the Grace of God, Moriah’s light will compel those in darkness to come in and find rest for their souls, in the finished work of Christ.',
  },
  message: {
    title: 'The Message',
    lead: 'The message of the Primitive Baptist Church can be found in one statement made by our Lord.',
    statement: '“It is finished”.',
    statementRef: 'John 19:30',
    /** The site reads "our simple"; the only word we changed, as an obvious typo. */
    bookends: 'The “bookends” of our doctrine are simple.',
    first: {
      ref: 'Matthew 1:21',
      text: 'The Angel told Joseph in Matthew 1:21, “And she shall bring forth a son, and thou shalt call His name JESUS; for He shall save his people from their sins.”',
    },
    last: {
      ref: 'John 19:30',
      text: 'With this promise, Christ proclaims on the cross, in John 19:30, “It is finished”.',
    },
    complete: 'The promise of saving is complete.',
    backdrop:
      'With the finished work of Christ as a back drop, we then proclaim another promise given to God’s people.',
    chroniclesLead: 'In 2 Chronicles 7:14, it reads,',
    chronicles:
      '“If my people, which are called by my name, shall humble themselves, and pray, and seek my face, and turn from their wicked ways; then will I hear from Heaven, and will forgive their sin, and will heal their land”.',
    rest: 'The finished work of Christ is our rest. The commandment of good work is our purpose.',
    close: 'That is the message.',
  },
  fathers: {
    title: 'My Fathers in the Ministry',
    intro: [
      'Pictured below are two men that have been invaluable in my life.',
      'Both have taught me to love and respect the Word of God.',
      'Both have taught me to “rightly divide the Word of Truth”.',
    ],
    photo: {
      src: '/moriah/fathers-in-the-ministry.jpg',
      /** LABEL */
      alt: 'Elder Dolph Painter and Elder Eddie Whidby, seated before a brick wall',
    },
    left: 'Elder Dolph Painter (left) has taught me to be jealous over God’s people. 2 Cor 11:2',
    right:
      'Elder Eddie Whidby (right) has taught me to be a “thinker” in the service of God. 2 Tim 2:7, Heb 3:1',
    closing: [
      'I thank God for these and other ministers that have taught, encouraged and corrected me through the years.',
      'I pray my ministry will be a reflection of the person of Christ and the efforts of God’s ministers which I have known.',
    ],
  },
} as const;

/* ---------- MORIAH: MoriahArtofFaith.htm and Contacts.htm headings ---------- */

/** MORIAH — the page heading on MoriahArtofFaith.htm. The articles themselves live in ../content.ts. */
export const faithPage = {
  heading: 'Articles of Faith',
} as const;

/** MORIAH — headings and labels from Contacts.htm; names come from ../content.ts `visit`. */
export const contactPage = {
  heading: 'Contact Us',
  pastorLabel: 'Pastor',
  addressLabel: 'Church Address',
  deaconsLabel: 'Deacons',
  clerkLabel: 'Clerk',
  pastorAddress: '111 Mathis Rd, Danielsville GA 30633',
  /** The church address block, line for line as Contacts.htm sets it. */
  churchAddress: ['Moriah Primitive Baptist Church', '1337 Moriah Church Rd', 'Colbert GA 30628'],
} as const;

/* ---------- LABEL + NOTICE: the demo's own furniture ---------- */

export const sermonsLabels = {
  /** LABEL */
  searchPlaceholder: 'Search the sermons',
  /** LABEL */
  bookLabel: 'Book',
  /** LABEL */
  all: 'All',
  /** LABEL */
  empty: 'Nothing found',
  /** LABEL */
  entry: 'entry',
  /** LABEL */
  entries: 'entries',
  /** LABEL */
  sortAscending: 'Title A–Z',
  /** LABEL */
  sortDescending: 'Title Z–A',
} as const;

export const calendarLabels = {
  /** NOTICE — Calendar.htm on the live site lists no events, so none are invented here. */
  notice:
    'The calendar on the current site lists no events, so this one is empty too. Anything the church adds appears on its day.',
  /** LABEL */
  empty: 'Nothing on the calendar for this day.',
  /** LABEL */
  today: 'Today',
  /** LABEL */
  previous: 'Previous month',
  /** LABEL */
  next: 'Next month',
} as const;

export const porticoLabels = {
  /** LABEL — the door's accessible name. */
  door: 'Open the doors',
  /** LABEL — the oculus is the home link. */
  home: 'Moriah Primitive Baptist Church, home',
  /** NOTICE */
  preview: 'Design preview · not the live site',
} as const;
