'use client';

import { useState } from 'react';

import { households, type DirectoryPerson, type Household } from '../content';
import styles from './MoriahDemo.module.scss';

/** Every person in the directory, by id, for spouse lookups across households. */
const peopleById = new Map<string, { person: DirectoryPerson; household: Household }>(
  households.flatMap((household) =>
    household.members.map((person) => [person.id, { person, household }] as const),
  ),
);

function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '').slice(-10);
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * One member row. The whole row toggles the member's details open, and the
 * details hold their own links — a `tel:` for the phone and a button that
 * jumps to the spouse — so nothing is nested inside another interactive
 * element and every target stays independently clickable.
 */
function MemberRow({
  person,
  expanded,
  onToggle,
  onJumpToSpouse,
}: {
  person: DirectoryPerson;
  expanded: boolean;
  onToggle: () => void;
  onJumpToSpouse: (id: string) => void;
}) {
  const spouse = person.spouseId ? peopleById.get(person.spouseId) : undefined;
  const detailsId = `member-${person.id}`;

  return (
    <li className={styles.memberItem}>
      <button
        type="button"
        className={styles.memberButton}
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={onToggle}
      >
        <span className={styles.memberName}>{person.name}</span>
        {person.role && <span className={styles.memberRole}>{person.role}</span>}
        <span className={styles.memberChevron} aria-hidden="true">
          {expanded ? '−' : '+'}
        </span>
      </button>

      {expanded && (
        <div className={styles.memberDetails} id={detailsId}>
          {person.phone ? (
            <p className={styles.memberDetailRow}>
              <a href={`tel:${person.phone}`} className={styles.textLink}>
                {formatPhone(person.phone)}
              </a>
              {person.phonePlaceholder && (
                <span className={styles.placeholderTag}>placeholder number</span>
              )}
            </p>
          ) : (
            <p className={styles.memberDetailRow}>
              <span className={styles.memberMuted}>No phone published</span>
            </p>
          )}

          {spouse && (
            <p className={styles.memberDetailRow}>
              <span className={styles.memberMuted}>Spouse</span>{' '}
              <button
                type="button"
                className={styles.spouseLink}
                onClick={() => onJumpToSpouse(spouse.person.id)}
              >
                {spouse.person.name}
              </button>
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function HouseholdCard({
  household,
  openIds,
  onToggle,
  onJumpToSpouse,
}: {
  household: Household;
  openIds: Set<string>;
  onToggle: (id: string) => void;
  onJumpToSpouse: (id: string) => void;
}) {
  return (
    <article className={styles.householdCard} id={`household-${household.id}`}>
      <header className={styles.householdHead}>
        <h3 className={styles.householdName}>{household.name}</h3>
        {household.address && (
          <p className={styles.householdAddress}>
            {household.address}
            {household.addressPlaceholder && (
              <span className={styles.placeholderTag}>placeholder</span>
            )}
          </p>
        )}
      </header>
      <ul className={styles.memberList}>
        {household.members.map((person) => (
          <MemberRow
            key={person.id}
            person={person}
            expanded={openIds.has(person.id)}
            onToggle={() => onToggle(person.id)}
            onJumpToSpouse={onJumpToSpouse}
          />
        ))}
      </ul>
    </article>
  );
}

export function DirectoryCards() {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Open the spouse's row and scroll their household card into view. */
  function jumpToSpouse(id: string) {
    const target = peopleById.get(id);
    if (!target) return;
    setOpenIds((current) => new Set(current).add(id));
    document
      .getElementById(`household-${target.household.id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className={styles.directoryGrid}>
      {households.map((household) => (
        <HouseholdCard
          key={household.id}
          household={household}
          openIds={openIds}
          onToggle={toggle}
          onJumpToSpouse={jumpToSpouse}
        />
      ))}
    </div>
  );
}
