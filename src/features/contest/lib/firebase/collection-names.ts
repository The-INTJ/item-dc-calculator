/**
 * Firestore collection and subcollection names for the contest data model.
 * Shared by the client-SDK adapter (firestoreAdapter/) and the Admin-SDK
 * adapter (firestoreAdminAdapter/) so both read and write the same paths.
 */

export const CONTESTS_COLLECTION = 'contests';
export const CONFIGS_COLLECTION = 'configs';
export const USERS_COLLECTION = 'users';
export const VOTES_SUBCOLLECTION = 'votes';
export const MATCHUPS_SUBCOLLECTION = 'matchups';
