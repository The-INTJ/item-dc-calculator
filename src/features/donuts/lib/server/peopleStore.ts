/** Admin-side writes: the roster and the base ordinal-Sunday rotation. */

import 'server-only';

import { newId } from '../ids';
import type { UpdatePersonInput } from '../schemas';
import type { DonutBoard, DonutPerson, ProviderResult } from '../types';

import { mutateBoard } from './boardAccess';

function findPerson(board: DonutBoard, personId: string): DonutPerson {
  const person = board.people.find((entry) => entry.id === personId);
  if (!person) {
    throw new Error('Person not found');
  }
  return person;
}

function assertNameFree(board: DonutBoard, name: string, exceptId?: string): void {
  const clash = board.people.some(
    (person) =>
      person.id !== exceptId && person.name.toLowerCase() === name.toLowerCase(),
  );
  if (clash) {
    throw new Error(`${name} is already on the list`);
  }
}

export function addPerson(
  name: string,
  active = true,
): Promise<ProviderResult<DonutBoard>> {
  return mutateBoard((board) => {
    assertNameFree(board, name);
    const person: DonutPerson = { id: newId(), name, active, createdAt: Date.now() };
    return { ...board, people: [...board.people, person] };
  });
}

export function updatePerson(
  personId: string,
  changes: UpdatePersonInput,
): Promise<ProviderResult<DonutBoard>> {
  return mutateBoard((board) => {
    findPerson(board, personId);
    if (changes.name) {
      assertNameFree(board, changes.name, personId);
    }
    const people = board.people.map((person) =>
      person.id === personId
        ? {
            ...person,
            name: changes.name ?? person.name,
            active: changes.active ?? person.active,
          }
        : person,
    );
    return { ...board, people };
  });
}

/**
 * Remove someone entirely. Their rotation slot is emptied and their pending
 * overrides are dropped so no date is left pointing at a person who is gone.
 * The log keeps their name, since it records what actually happened.
 */
export function removePerson(personId: string): Promise<ProviderResult<DonutBoard>> {
  return mutateBoard((board) => {
    findPerson(board, personId);
    return {
      ...board,
      people: board.people.filter((person) => person.id !== personId),
      rotation: board.rotation.map((slot) => (slot === personId ? null : slot)),
      overrides: board.overrides.filter((entry) => entry.personId !== personId),
    };
  });
}

/** Replace the 1st-through-5th-Sunday rotation wholesale. */
export function setRotation(
  rotation: (string | null)[],
): Promise<ProviderResult<DonutBoard>> {
  return mutateBoard((board) => {
    for (const slot of rotation) {
      if (slot !== null) {
        findPerson(board, slot);
      }
    }
    return { ...board, rotation: [...rotation] };
  });
}
