import type {
  ContributorRole,
  HymnEntry,
  HymnSearchResult,
  SearchMatch,
} from '../lib/types';
import { HighlightedText, matchesFor } from './HighlightedText';
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

function MetadataRow({
  kind,
  value,
  matches,
}: {
  kind: MetadataKind;
  value: string;
  matches: SearchMatch[];
}) {
  return (
    <div className={cx(styles.metadataRow, styles[`metadataRow_${kind}`])}>
      <dt>{metadataLabels[kind]}</dt>
      <dd>
        <HighlightedText value={value} matches={matches} />
      </dd>
    </div>
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

  if (sameWordsAndMusic) {
    return (
      <MetadataRow
        kind="words"
        value={words.join(', ')}
        matches={contributorMatchesForNames(result, words)}
      />
    );
  }

  return (
    <>
      {words.length > 0 ? (
        <MetadataRow
          kind="words"
          value={words.join(', ')}
          matches={contributorMatchesForNames(result, words)}
        />
      ) : null}
      {music.length > 0 ? (
        <MetadataRow
          kind="music"
          value={music.join(', ')}
          matches={contributorMatchesForNames(result, music)}
        />
      ) : null}
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

export function HymnCard({ result }: { result: HymnSearchResult }) {
  const { entry, matches } = result;
  const number = String(entry.number);

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
          </header>
          <dl className={styles.metadataList}>
            <AttributionRows result={result} />
            <MetadataRow
              kind="firstLine"
              value={entry.firstLine}
              matches={matchesFor(matches, 'firstLine', entry.firstLine)}
            />
            {entry.chorusFirstLine ? (
              <MetadataRow
                kind="chorus"
                value={entry.chorusFirstLine}
                matches={matchesFor(matches, 'chorusFirstLine', entry.chorusFirstLine)}
              />
            ) : null}
          </dl>
          <div className={styles.detailRail} aria-label="Era, tune, and meter">
            <span className={styles.detailPill}>{entry.era}</span>
            <span className={styles.detailPill}>
              <HighlightedText value={entry.tuneName} matches={matchesFor(matches, 'tuneName', entry.tuneName)} />
            </span>
            <span className={styles.detailPill}>{entry.meter}</span>
          </div>
        </div>
        <aside className={styles.hymnRightRail} aria-label="Themes">
          <div className={styles.themeRail} aria-label="Themes">
            {entry.themes.map((theme) => (
              <span className={styles.themePill} key={theme}>{theme}</span>
            ))}
          </div>
        </aside>
      </div>
    </article>
  );
}
