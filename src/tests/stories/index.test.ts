/**
 * User Story API Tests
 *
 * This file loads and runs all JSON test specifications for User Stories.
 * Each spec file defines a complete test scenario with setup, actions,
 * validation, and teardown phases.
 */

import { runStoryTest } from './runner';

// Import all spec files
import createContestSpec from './specs/01-create-contest.spec.json';
import participateSpec from './specs/02-participate.spec.json';
import customConfigSpec from './specs/03-custom-config.spec.json';
import editEntrySpec from './specs/04-edit-entry.spec.json';
import editRoundsSpec from './specs/05-edit-rounds.spec.json';
import editScoreSpec from './specs/06-edit-score.spec.json';
import deleteEntrySpec from './specs/07-delete-entry.spec.json';
import deleteContestSpec from './specs/08-delete-contest.spec.json';

// Run all story tests
runStoryTest(createContestSpec);
runStoryTest(participateSpec);
runStoryTest(customConfigSpec);
runStoryTest(editEntrySpec);
runStoryTest(editRoundsSpec);
runStoryTest(editScoreSpec);
runStoryTest(deleteEntrySpec);
runStoryTest(deleteContestSpec);
