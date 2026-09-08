import { getRoleById } from './itRoles.js';

// Point weights sum to 100. Tech-stack match against the role's expected market
// stack is the dominant factor, since generic self-rated questions were too vague.
const WEIGHTS = {
  experience: 15,
  stack: 40,
  credentials: 10,
  network: 10,
  adaptability: 10,
};
const MAX_MARKET_POINTS = 15;
const EXPERIENCE_MAX_LEVEL = 5;
const RATING_MAX_LEVEL = 4;

export const EXPERIENCE_LEVELS = ['None', 'Less than 1 year', '1-2 years', '3-5 years', '5-10 years', '10+ years'];
export const CREDENTIALS_LEVELS = [
  'No certifications/education in this stack',
  'Self-taught / online courses only',
  'Relevant degree or one certification',
  'Relevant degree and certification(s)',
  'Degree, certifications, and hands-on production use',
];
export const NETWORK_LEVELS = ['Inactive', 'Rarely active', 'Occasionally active', 'Regularly active', 'Very active'];
export const ADAPTABILITY_LEVELS = [
  'Not willing',
  'Slightly willing',
  'Moderately willing',
  'Very willing',
  'Fully flexible',
];

function scoreLevel(level, maxPoints, fieldName, maxLevel) {
  if (!Number.isInteger(level) || level < 0 || level > maxLevel) {
    throw new Error(`answer for "${fieldName}" must be an integer between 0 and ${maxLevel}`);
  }
  return Math.round((level / maxLevel) * maxPoints);
}

/**
 * Scores career readiness for a specific IT role against that role's expected market tech stack.
 * @param {{ roleId: string, experience: number, knownSkillIds: string[], credentials: number, network: number, adaptability: number }} answers
 * @returns {{
 *   total: number,
 *   role: { id: string, label: string },
 *   marketDemand: { label: string, points: number },
 *   knownSkills: string[],
 *   missingSkills: string[],
 *   breakdown: Array<{ label: string, points: number, maxPoints: number }>
 * }}
 */
export function scoreCareerReadiness(answers) {
  if (!answers || typeof answers !== 'object') {
    throw new Error('answers must be an object');
  }

  const role = getRoleById(answers.roleId);
  if (!role) {
    throw new Error(`unknown roleId "${answers.roleId}"`);
  }

  if (!Array.isArray(answers.knownSkillIds)) {
    throw new Error('knownSkillIds must be an array');
  }

  const knownSet = new Set(answers.knownSkillIds);
  const knownStackItems = role.coreStack.filter((skill) => knownSet.has(skill.id));
  const missingStackItems = role.coreStack.filter((skill) => !knownSet.has(skill.id));
  const stackPoints = Math.round((knownStackItems.length / role.coreStack.length) * WEIGHTS.stack);

  const experiencePoints = scoreLevel(answers.experience, WEIGHTS.experience, 'experience', EXPERIENCE_MAX_LEVEL);
  const credentialsPoints = scoreLevel(answers.credentials, WEIGHTS.credentials, 'credentials', RATING_MAX_LEVEL);
  const networkPoints = scoreLevel(answers.network, WEIGHTS.network, 'network', RATING_MAX_LEVEL);
  const adaptabilityPoints = scoreLevel(answers.adaptability, WEIGHTS.adaptability, 'adaptability', RATING_MAX_LEVEL);
  const marketPoints = role.marketDemand.points;

  const breakdown = [
    { label: `Tech stack match (${role.label})`, points: stackPoints, maxPoints: WEIGHTS.stack },
    { label: 'Relevant experience', points: experiencePoints, maxPoints: WEIGHTS.experience },
    { label: `Market demand for ${role.label}`, points: marketPoints, maxPoints: MAX_MARKET_POINTS },
    { label: 'Certifications/education relevance', points: credentialsPoints, maxPoints: WEIGHTS.credentials },
    { label: 'Network & job-search activity', points: networkPoints, maxPoints: WEIGHTS.network },
    { label: 'Adaptability / willingness to reskill', points: adaptabilityPoints, maxPoints: WEIGHTS.adaptability },
  ];

  const total = Math.min(
    100,
    stackPoints + experiencePoints + marketPoints + credentialsPoints + networkPoints + adaptabilityPoints
  );

  return {
    total,
    role: { id: role.id, label: role.label },
    marketDemand: role.marketDemand,
    knownSkills: knownStackItems.map((skill) => skill.label),
    missingSkills: missingStackItems.map((skill) => skill.label),
    breakdown,
  };
}

export function getCareerScoreBand(total) {
  if (total <= 40) return 'Low';
  if (total <= 70) return 'Medium';
  return 'High';
}
