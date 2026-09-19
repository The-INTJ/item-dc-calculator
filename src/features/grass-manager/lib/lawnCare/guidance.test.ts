import { describe, expect, it } from 'vitest';
import { care, forecast, PROFILE } from '../fixtures/weather';
import { getSegment } from '../yard';
import { growingSeason, seasonalNote, treatmentNote, weedAdvice, zoneAdvice } from './index';

describe('concise weed and seasonal guidance', () => {
  it('favors hands-on removal for scattered weeds', () => {
    expect(weedAdvice('dandelion', PROFILE).action).toBe('Hand removal');
    expect(weedAdvice('nutsedge', PROFILE).note).toContain('repeatedly');
  });
  it('matches aliases and explains why recurring weeds need targeted control', () => {
    const advice = weedAdvice('creeping charlie', { ...PROFILE, weedCoverage: 'patches' });
    expect(advice.name).toBe('Ground ivy');
    expect(advice.action).toBe('Targeted treatment');
    expect(advice.timing).toContain('Fall');
  });
  it('does not infer a chemical from an unknown weed or grass', () => {
    expect(weedAdvice('mystery grass', PROFILE).action).toBe('Identify first');
    expect(weedAdvice('dandelion', { ...PROFILE, weedCoverage: 'widespread', grassType: 'mixed-unsure' }).action).toBe('Hand removal');
  });
  it('protects seeding from generic chemical recommendations', () => {
    const profile = { ...PROFILE, lawnStage: 'seeding' as const, weedCoverage: 'patches' as const };
    expect(weedAdvice('crabgrass', profile).action).toBe('Hand removal');
    expect(seasonalNote(profile, '2026-09-18')).toContain('block grass seed');
  });
  it('uses location and hemisphere for a season, not browser month alone', () => {
    expect(growingSeason(PROFILE, '2026-09-18')).toBe('unknown');
    expect(growingSeason({ ...PROFILE, location: { name: 'Sydney', latitude: -34, longitude: 151 } }, '2026-09-18')).toBe('spring');
    expect(growingSeason({ ...PROFILE, location: { name: 'Miami', latitude: 25, longitude: -80 } }, '2026-09-18')).toBe('fall');
    expect(growingSeason({ ...PROFILE, location: { name: 'Singapore', latitude: 1, longitude: 103 } }, '2026-09-18')).toBe('tropical');
  });
  it('uses soil temperature as a planning trigger, never forecast air temperature', () => {
    const profile = { ...PROFILE, weedTypes: ['crabgrass'], location: { name: 'NY', latitude: 40, longitude: -74 } };
    expect(seasonalNote(profile, '2026-04-18')).toContain('soil');
    expect(seasonalNote(profile, '2026-09-18')).toContain('Next season');
  });
  it('acknowledges recent chemical and fertilizer logs without scheduling another dose', () => {
    expect(treatmentNote(PROFILE, [care('2026-09-17', 'whole-yard', 'weed-control')], '2026-09-18', forecast())).toContain('retreatment');
    expect(treatmentNote(PROFILE, [care('2026-09-17', 'whole-yard', 'fertilized')], '2026-09-18', forecast())).toContain('Do not add');
  });
  it('does not promise fescue will expand by runners', () => {
    expect(zoneAdvice(PROFILE, { ...getSegment('back-lawn'), condition: 'strong' })).toContain('bunches');
  });
  it('prefers pulling mature annual weeds in fall, even when they form patches', () => {
    const profile = { ...PROFILE, weedCoverage: 'patches' as const, location: { name: 'NY', latitude: 40, longitude: -74 } };
    expect(weedAdvice('crabgrass', profile, '2026-09-18').action).toBe('Pull mature plants');
    expect(weedAdvice('dandelion', profile, '2026-09-18').action).toBe('Fall spot treatment');
    expect(weedAdvice('dandelion', profile, '2026-07-18').action).toBe('Plan fall treatment');
  });
  it('holds chemical suggestions on a dormant lawn', () => {
    const profile = { ...PROFILE, weedCoverage: 'patches' as const, lawnStage: 'dormant' as const };
    expect(weedAdvice('nutsedge', profile).action).toBe('Wait for active growth');
  });
  it('suggests staged repair instead of repeated blanket treatments for a mostly weedy lawn', () => {
    expect(treatmentNote({ ...PROFILE, weedCoverage: 'widespread' }, [], '2026-09-18', forecast())).toContain('Repair one small area');
  });
});
