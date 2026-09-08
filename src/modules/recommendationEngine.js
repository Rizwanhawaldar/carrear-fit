import { fetchPersonalizedRecommendation } from './grokClient.js';
import { getFallbackRecommendation } from './recommendations.js';

/**
 * Gets a recommendation for the user, preferring a Grok-personalized result and
 * transparently falling back to fixed rule-based text if Grok errors or times out.
 * @param {{ careerScore: number, careerBand: string, roleLabel: string, knownSkills: string[], missingSkills: string[], financialMonths: number, financialRating: string }} context
 * @returns {Promise<{ text: string, source: 'ai' | 'fallback' }>}
 */
export async function getRecommendation(context) {
  try {
    const text = await fetchPersonalizedRecommendation(context);
    return { text, source: 'ai' };
  } catch {
    const text = getFallbackRecommendation(context.careerBand, context.financialRating, {
      roleLabel: context.roleLabel,
      missingSkills: context.missingSkills,
    });
    return { text, source: 'fallback' };
  }
}
