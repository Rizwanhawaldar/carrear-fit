// Fixed advice matrix keyed by career-fitness band × financial rating; used when Grok is unavailable.
const CAREER_ADVICE = {
  Low: 'Your career fitness needs focused work: prioritize closing the biggest skills gaps and gaining recent, relevant experience before pursuing new roles aggressively.',
  Medium: 'You have a reasonable foundation. Sharpen a few key skills and grow your network to move confidently toward stronger opportunities.',
  High: 'You are well positioned for the current job market. Focus on targeting the right opportunities and negotiating from a position of strength.',
};

const FINANCIAL_ADVICE = {
  Critical: 'Your emergency fund is critically low. Build savings toward at least 1 month of essential expenses before taking on career risk.',
  'At Risk': 'Your emergency fund covers a short window. Keep building savings so a job transition would not create financial strain.',
  Adequate: 'Your emergency fund gives you a reasonable cushion. Continue building toward 6 months of coverage for added security.',
  Strong: 'Your emergency fund gives you strong flexibility to pursue career moves, including calculated risks like a career change.',
};

/**
 * Builds a sentence naming the top missing skills for the role, or praise if none are missing.
 * @param {string} roleLabel
 * @param {string[]} missingSkills
 * @returns {string}
 */
function buildSkillGapSentence(roleLabel, missingSkills) {
  if (!missingSkills || missingSkills.length === 0) {
    return `You already cover the core ${roleLabel} stack employers expect right now — focus on depth and specialization.`;
  }
  const top = missingSkills.slice(0, 3).join(', ');
  const suffix = missingSkills.length > 3 ? ', among others' : '';
  return `For a ${roleLabel} role, employers commonly expect ${top}${suffix} — prioritize learning these next.`;
}

/**
 * Returns fixed, rule-based recommendation text combining career standing, the role's
 * tech-stack gap, and financial standing.
 * @param {'Low'|'Medium'|'High'} careerBand
 * @param {'Critical'|'At Risk'|'Adequate'|'Strong'} financialRating
 * @param {{ roleLabel: string, missingSkills: string[] }} roleContext
 * @returns {string}
 */
export function getFallbackRecommendation(careerBand, financialRating, roleContext) {
  const careerText = CAREER_ADVICE[careerBand];
  const financialText = FINANCIAL_ADVICE[financialRating];

  if (!careerText || !financialText) {
    throw new Error(`unknown careerBand "${careerBand}" or financialRating "${financialRating}"`);
  }
  if (!roleContext || !roleContext.roleLabel) {
    throw new Error('roleContext with a roleLabel is required');
  }

  const skillGapText = buildSkillGapSentence(roleContext.roleLabel, roleContext.missingSkills);

  return `${careerText} ${skillGapText} ${financialText}`;
}
