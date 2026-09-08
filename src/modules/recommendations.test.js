import { describe, it, expect } from 'vitest';
import { getFallbackRecommendation } from './recommendations.js';

const ROLE_CONTEXT = { roleLabel: 'Java Backend Developer', missingSkills: ['Kubernetes', 'Kafka', 'Docker', 'CI/CD'] };

describe('getFallbackRecommendation', () => {
  it('combines career, skill-gap, and financial advice for a valid input', () => {
    const text = getFallbackRecommendation('High', 'Strong', ROLE_CONTEXT);
    expect(text).toContain('well positioned');
    expect(text).toContain('Java Backend Developer');
    expect(text).toContain('Kubernetes');
    expect(text).toContain('strong flexibility');
  });

  it('names missing skills, capped at the top 3, with an "among others" suffix beyond that', () => {
    const text = getFallbackRecommendation('Medium', 'Adequate', ROLE_CONTEXT);
    expect(text).toContain('Kubernetes, Kafka, Docker');
    expect(text).toContain('among others');
    expect(text).not.toContain('CI/CD');
  });

  it('praises full stack coverage when no skills are missing', () => {
    const text = getFallbackRecommendation('High', 'Strong', { roleLabel: 'Java Backend Developer', missingSkills: [] });
    expect(text).toContain('already cover the core');
  });

  it('produces distinct text for each career band', () => {
    const low = getFallbackRecommendation('Low', 'Adequate', ROLE_CONTEXT);
    const medium = getFallbackRecommendation('Medium', 'Adequate', ROLE_CONTEXT);
    const high = getFallbackRecommendation('High', 'Adequate', ROLE_CONTEXT);
    expect(new Set([low, medium, high]).size).toBe(3);
  });

  it('produces distinct text for each financial rating', () => {
    const critical = getFallbackRecommendation('Medium', 'Critical', ROLE_CONTEXT);
    const atRisk = getFallbackRecommendation('Medium', 'At Risk', ROLE_CONTEXT);
    const adequate = getFallbackRecommendation('Medium', 'Adequate', ROLE_CONTEXT);
    const strong = getFallbackRecommendation('Medium', 'Strong', ROLE_CONTEXT);
    expect(new Set([critical, atRisk, adequate, strong]).size).toBe(4);
  });

  it('throws for an unknown career band', () => {
    expect(() => getFallbackRecommendation('Unknown', 'Strong', ROLE_CONTEXT)).toThrow();
  });

  it('throws for an unknown financial rating', () => {
    expect(() => getFallbackRecommendation('Low', 'Unknown', ROLE_CONTEXT)).toThrow();
  });

  it('throws when roleContext is missing', () => {
    expect(() => getFallbackRecommendation('Low', 'Strong')).toThrow(/roleContext/);
  });
});
