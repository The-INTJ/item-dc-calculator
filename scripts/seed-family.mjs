/**
 * Seed Firebase emulators with the 8 family-member accounts for the
 * weekend mixology contest. Drew is admin; everyone else is a voter
 * (they'll register as contestants through the UI once the contest
 * exists). All passwords are `family123` for convenience.
 *
 * Usage: node scripts/seed-family.mjs
 * Requires: emulators running on default ports (auth:9099, firestore:8080)
 */

import { initializeApp, getApps, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

const PROJECT_ID = 'playground-69cbc';

for (const app of getApps()) {
  await deleteApp(app);
}

const app = initializeApp({ projectId: PROJECT_ID });
const auth = getAuth(app);
const db = getFirestore(app);

const FAMILY = [
  { displayName: 'Drew',    email: 'drew@family.test',    role: 'admin' },
  { displayName: 'Chris',   email: 'chris@family.test',   role: 'voter' },
  { displayName: 'Melissa', email: 'melissa@family.test', role: 'voter' },
  { displayName: 'Alex',    email: 'alex@family.test',    role: 'voter' },
  { displayName: 'Matt',    email: 'matt@family.test',    role: 'voter' },
  { displayName: 'Tori',    email: 'tori@family.test',    role: 'voter' },
  { displayName: 'Will',    email: 'will@family.test',    role: 'voter' },
  { displayName: 'Adeline', email: 'adeline@family.test', role: 'voter' },
];

const PASSWORD = 'family123';

for (const user of FAMILY) {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(user.email);
    console.log(`  exists: ${user.email} (${userRecord.uid})`);
  } catch {
    userRecord = await auth.createUser({
      email: user.email,
      password: PASSWORD,
      displayName: user.displayName,
    });
    console.log(`  created: ${user.email} (${userRecord.uid})`);
  }

  await auth.setCustomUserClaims(userRecord.uid, { role: user.role });

  await db.collection('users').doc(userRecord.uid).set(
    {
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    { merge: true },
  );

  console.log(`  ${user.displayName} -> role=${user.role}`);
}

console.log('\nFamily accounts ready (password: family123)');
for (const u of FAMILY) console.log(`  ${u.displayName.padEnd(8)} ${u.email}  [${u.role}]`);

await deleteApp(app);
