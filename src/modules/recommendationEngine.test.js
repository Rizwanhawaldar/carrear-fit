import { describe, it, expect, vi } from 'vitest';
import { getRecommendation } from './recommendationEngine.js';
import * as grokClient from './grokClient.js';
import * as recommendations from './recommendations.js';

const CONTEXT = {
  careerScore: 60,
  careerBand: 'Medium',
  roleLabel: 'Java Backend Developer',
  knownSkills: ['Core Java (8/11/17+)'],
  missingSkills: ['Kubernetes', 'Kafka / messaging queues'],
  financialMonths: 2,
  financialRating: 'At Risk',
};

describe('getRecommendation', () => {
  it('returns the Grok result with source "ai" when the call succeeds', async () => {
    vi.spyOn(grokClient, 'fetchPersonalizedRecommendation').mockResolvedValue('AI-personalized advice');

    const result = await getRecommendation(CONTEXT);

    expect(result).toEqual({ text: 'AI-personalized advice', source: 'ai' });
    vi.restoreAllMocks();
  });

  it('falls back to rule-based text with source "fallback" when Grok throws', async () => {
    vi.spyOn(grokClient, 'fetchPersonalizedRecommendation').mockRejectedValue(new Error('boom'));
    const fallbackSpy = vi.spyOn(recommendations, 'getFallbackRecommendation');

    const result = await getRecommendation(CONTEXT);

    expect(result.source).toBe('fallback');
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
    vi.restoreAllMocks();
    fallbackSpy.mockRestore();
  });
});
