import { describe, it, expect } from 'vitest';
import { scoreCareerReadiness, getCareerScoreBand } from './scoring.js';
import { IT_ROLES } from './itRoles.js';

const JAVA_ROLE = IT_ROLES.find((role) => role.id === 'java-backend');
const ALL_JAVA_SKILL_IDS = JAVA_ROLE.coreStack.map((s) => s.id);

const baseAnswers = (overrides = {}) => ({
  roleId: 'java-backend',
  experience: 0,
  knownSkillIds: [],
  credentials: 0,
  network: 0,
  adaptability: 0,
  ...overrides,
});

describe('scoreCareerReadiness', () => {
  it('scores only the fixed market-demand points when nothing else is known/rated', () => {
    const { total } = scoreCareerReadiness(baseAnswers());
    expect(total).toBe(JAVA_ROLE.marketDemand.points);
  });

  it('scores stack+experience+credentials+network+adaptability plus fixed market points when maxed', () => {
    const { total } = scoreCareerReadiness(
      baseAnswers({ knownSkillIds: ALL_JAVA_SKILL_IDS, experience: 5, credentials: 4, network: 4, adaptability: 4 })
    );
    expect(total).toBe(40 + 15 + 10 + 10 + 10 + JAVA_ROLE.marketDemand.points);
  });

  it('computes partial stack match proportionally', () => {
    const halfSkills = ALL_JAVA_SKILL_IDS.slice(0, 5); // 5 of 10 = 50% of the 40-point stack weight
    const { breakdown } = scoreCareerReadiness(baseAnswers({ knownSkillIds: halfSkills }));
    const stackEntry = breakdown.find((b) => b.label.startsWith('Tech stack match'));
    expect(stackEntry.points).toBe(20);
  });

  it('returns known and missing skill labels', () => {
    const knownIds = ['core-java', 'spring-boot'];
    const { knownSkills, missingSkills } = scoreCareerReadiness(baseAnswers({ knownSkillIds: knownIds }));
    expect(knownSkills).toContain('Core Java (8/11/17+)');
    expect(knownSkills).toContain('Spring Boot');
    expect(missingSkills).toContain('Kubernetes');
    expect(knownSkills.length + missingSkills.length).toBe(JAVA_ROLE.coreStack.length);
  });

  it('includes the role-specific fixed market-demand points in the breakdown', () => {
    const { breakdown, marketDemand } = scoreCareerReadiness(baseAnswers());
    const marketEntry = breakdown.find((b) => b.label.startsWith('Market demand'));
    expect(marketEntry.points).toBe(JAVA_ROLE.marketDemand.points);
    expect(marketDemand).toEqual(JAVA_ROLE.marketDemand);
  });

  it('ignores unknown skill ids not in the role stack', () => {
    const { knownSkills } = scoreCareerReadiness(baseAnswers({ knownSkillIds: ['not-a-real-skill'] }));
    expect(knownSkills).toHaveLength(0);
  });

  it('throws for an unknown roleId', () => {
    expect(() => scoreCareerReadiness(baseAnswers({ roleId: 'astronaut' }))).toThrow(/unknown roleId/);
  });

  it('throws when knownSkillIds is not an array', () => {
    expect(() => scoreCareerReadiness(baseAnswers({ knownSkillIds: 'core-java' }))).toThrow(/knownSkillIds/);
  });

  it('throws when the experience level exceeds its max (10+ years = level 5)', () => {
    expect(() => scoreCareerReadiness(baseAnswers({ experience: 6 }))).toThrow();
  });

  it('throws when a rating level (e.g. credentials) exceeds its max of 4', () => {
    expect(() => scoreCareerReadiness(baseAnswers({ credentials: 5 }))).toThrow();
  });

  it('throws when answers is missing or not an object', () => {
    expect(() => scoreCareerReadiness(null)).toThrow();
    expect(() => scoreCareerReadiness(undefined)).toThrow();
  });
});

describe('getCareerScoreBand', () => {
  it('classifies Low, Medium, High bands at boundaries', () => {
    expect(getCareerScoreBand(0)).toBe('Low');
    expect(getCareerScoreBand(40)).toBe('Low');
    expect(getCareerScoreBand(41)).toBe('Medium');
    expect(getCareerScoreBand(70)).toBe('Medium');
    expect(getCareerScoreBand(71)).toBe('High');
    expect(getCareerScoreBand(100)).toBe('High');
  });
});
