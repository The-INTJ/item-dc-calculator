import type {
  ContributorRole,
  HymnEntry,
  HymnMaterials,
  HymnSearchResult,
  SearchMatch,
} from '../lib/types';
import { HighlightedText, matchesFor } from './HighlightedText';
import { MaterialSymbol } from './MaterialSymbol';
import styles from './HeritageHymnsDemo.module.scss';

type MetadataKind = 'words' | 'music' | 'additional' | 'firstLine' | 'chorus';

const metadataLabels: Record<MetadataKind, string> = {
  words: 'Words',
  music: 'Music',
  additional: 'Additional',
  firstLine: 'First Line',
  chorus: 'Chorus',
};

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

function contributorsForRole(entry: HymnEntry, role: ContributorRole): string[] {
  return entry.contributors
    .filter((person) => person.roles.includes(role))
    .map((person) => person.displayName);
}

function contributorMatchesForNames(result: HymnSearchResult, names: string[]): SearchMatch[] {
  return result.matches.filter(
    (match) => match.field === 'contributors' && names.includes(match.value),
  );
}

function PublicDomainBadge({ label }: { label: 'Words' | 'Music' }) {
  return (
    <span className={styles.publicDomainBadge} aria-label={`${label} public domain`}>
      PD
    </span>
  );
}

function MetadataRow({
  kind,
  value,
  matches,
  publicDomainBadges = [],
  quietValue = false,
}: {
  kind: MetadataKind;
  value: string;
  matches: SearchMatch[];
  publicDomainBadges?: Array<'Words' | 'Music'>;
  quietValue?: boolean;
}) {
  return (
    <div className={cx(styles.metadataRow, styles[`metadataRow_${kind}`])}>
      <dt>{metadataLabels[kind]}</dt>
      <dd className={cx(quietValue && styles.metadataValueQuiet, !value && styles.metadataValueEmpty)}>
        {value ? (
          <HighlightedText value={value} matches={matches} />
        ) : (
          <span className={styles.emptyMetadataValue} aria-hidden="true" />
        )}
        {publicDomainBadges.length > 0 ? (
          <span className={styles.publicDomainBadges}>
            {publicDomainBadges.map((label) => (
              <PublicDomainBadge key={label} label={label} />
            ))}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

function publicDomainBadgesFor(entry: HymnEntry, roles: Array<'Words' | 'Music'>): Array<'Words' | 'Music'> {
  return roles.filter((role) =>
    role === 'Words' ? entry.copyright.wordsPublicDomain : entry.copyright.musicPublicDomain,
  );
}

function AttributionRows({ result }: { result: HymnSearchResult }) {
  const entry = result.entry;
  const words = contributorsForRole(entry, 'words');
  const music = contributorsForRole(entry, 'music');
  const additional = entry.contributors
    .filter((person) => person.roles.some((role) => role !== 'words' && role !== 'music'))
    .map((person) => person.displayName);
  const sameWordsAndMusic =
    words.length > 0 &&
    music.length > 0 &&
    words.length === music.length &&
    words.every((name) => music.includes(name));

  return (
    <>
      <MetadataRow
        kind="words"
        value={words.join(', ')}
        matches={contributorMatchesForNames(result, words)}
        publicDomainBadges={publicDomainBadgesFor(entry, ['Words'])}
      />
      <MetadataRow
        kind="music"
        value={music.join(', ')}
        matches={contributorMatchesForNames(result, music)}
        publicDomainBadges={publicDomainBadgesFor(entry, ['Music'])}
        quietValue={sameWordsAndMusic}
      />
      {additional.length > 0 ? (
        <MetadataRow
          kind="additional"
          value={additional.join(', ')}
          matches={contributorMatchesForNames(result, additional)}
        />
      ) : null}
    </>
  );
}

const materialOrder: Array<{
  key: keyof HymnMaterials;
  icon: string;
  label: string;
}> = [
  { key: 'midi', icon: 'piano', label: 'MIDI learning recording' },
  { key: 'congregation', icon: 'groups', label: 'Congregation recording' },
  { key: 'pdf', icon: 'picture_as_pdf', label: 'Public domain PDF' },
];

function MaterialLinks({ materials }: { materials: HymnMaterials | undefined }) {
  const available = materialOrder.filter((item) => materials?.[item.key]);
  if (available.length === 0) return null;

  return (
    <div className={styles.materialLinks} aria-label="Available hymn materials">
      {available.map((item) => (
        <span
          className={styles.materialLink}
          data-material-kind={item.key}
          key={item.key}
          aria-label={item.label}
          title={item.label}
        >
          <MaterialSymbol icon={item.icon} />
        </span>
      ))}
    </div>
  );
}

export function HymnCard({ result }: { result: HymnSearchResult }) {
  const { entry, matches } = result;
  const number = String(entry.number);
  const primaryTheme = entry.themes[0];

  return (
    <article className={styles.hymnCard}>
      <div className={styles.hymnNumber}>
        <HighlightedText value={number} matches={matchesFor(matches, 'number', number)} />
      </div>
      <div className={styles.hymnBody}>
        <div className={styles.hymnContent}>
          <header className={styles.hymnHeader}>
            <h2>
              <HighlightedText value={entry.title} matches={matchesFor(matches, 'title', entry.title)} />
            </h2>
            <div className={styles.hymnHeaderMeta}>
              {primaryTheme ? (
                <span className={styles.themePill}>
                  <HighlightedText value={primaryTheme} matches={matchesFor(matches, 'theme', primaryTheme)} />
                </span>
              ) : null}
              <MaterialLinks materials={entry.materials} />
            </div>
          </header>
          <dl className={styles.metadataList}>
            <AttributionRows result={result} />
            <MetadataRow
              kind="firstLine"
              value={entry.firstLine}
              matches={matchesFor(matches, 'firstLine', entry.firstLine)}
            />
            <MetadataRow
              kind="chorus"
              value={entry.chorusFirstLine ?? ''}
              matches={
                entry.chorusFirstLine
                  ? matchesFor(matches, 'chorusFirstLine', entry.chorusFirstLine)
                  : []
              }
            />
          </dl>
          <div className={styles.detailRail} aria-label="Era, tune, and meter">
            <span className={styles.detailPill}>
              <HighlightedText value={entry.era} matches={matchesFor(matches, 'era', entry.era)} />
            </span>
            {entry.tuneName ? (
              <span className={styles.detailPill}>
                <HighlightedText
                  value={entry.tuneName}
                  matches={matchesFor(matches, 'tuneName', entry.tuneName)}
                />
              </span>
            ) : null}
            {entry.meter ? (
              <span className={styles.detailPill}>
                <HighlightedText value={entry.meter} matches={matchesFor(matches, 'meter', entry.meter)} />
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
