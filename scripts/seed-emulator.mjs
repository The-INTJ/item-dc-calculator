/**
 * Seed Firebase emulators with test data.
 *
 * Creates:
 *  - admin@test.com / admin123  (role: admin)
 *  - voter@test.com / voter123  (role: voter)
 *
 * Usage: node scripts/seed-emulator.mjs
 * Requires: Firebase emulators running on default ports
 */

import { initializeApp, getApps, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Point Admin SDK at emulators
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

const PROJECT_ID = 'playground-69cbc';

// Clean up any existing app (in case of re-runs)
for (const app of getApps()) {
  await deleteApp(app);
}

const app = initializeApp({ projectId: PROJECT_ID });
const auth = getAuth(app);
const db = getFirestore(app);

const TEST_USERS = [
  {
    email: 'admin@test.com',
    password: 'admin123',
    displayName: 'Test Admin',
    role: 'admin',
  },
  {
    email: 'voter@test.com',
    password: 'voter123',
    displayName: 'Test Voter',
    role: 'voter',
  },
];

for (const user of TEST_USERS) {
  try {
    // Create auth user (or skip if exists)
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(user.email);
      console.log(`  exists: ${user.email} (${userRecord.uid})`);
    } catch {
      userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      });
      console.log(`  created: ${user.email} (${userRecord.uid})`);
    }

    // Set custom claims (used by serverAuth.ts resolveRoleFromClaims)
    await auth.setCustomUserClaims(userRecord.uid, { role: user.role });

    // Create Firestore user document (used by client-side auth context)
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

    console.log(`  role: ${user.role}, claims set`);
  } catch (error) {
    console.error(`  FAILED ${user.email}:`, error.message);
  }
}

console.log('\nTest accounts ready:');
console.log('  Admin: admin@test.com / admin123');
console.log('  Voter: voter@test.com / voter123');

await deleteApp(app);
