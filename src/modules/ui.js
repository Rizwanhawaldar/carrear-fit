import {
  scoreCareerReadiness,
  getCareerScoreBand,
  EXPERIENCE_LEVELS,
  CREDENTIALS_LEVELS,
  NETWORK_LEVELS,
  ADAPTABILITY_LEVELS,
} from './scoring.js';
import { IT_ROLES, getRoleById } from './itRoles.js';
import { calculateEmergencyFund } from './financialFitness.js';
import { getRecommendation } from './recommendationEngine.js';
import { CONTACT_PHONE } from '../config.js';

function renderLevelFieldset(fieldName, legendText, levels) {
  return `
    <fieldset class="question" data-field="${fieldName}">
      <legend>${legendText}</legend>
      ${levels.map((label, level) => `
        <label class="option">
          <input type="radio" name="${fieldName}" value="${level}" ${level === 0 ? 'checked' : ''} />
          <span>${label}</span>
        </label>
      `).join('')}
    </fieldset>
  `;
}

function renderStackChecklist(role) {
  return `
    <fieldset class="question" id="stack-checklist" data-role-id="${role.id}">
      <legend>Which of these ${role.label} technologies do you know?</legend>
      ${role.coreStack.map((skill) => `
        <label class="option">
          <input type="checkbox" name="knownSkill" value="${skill.id}" />
          <span>${skill.label}</span>
        </label>
      `).join('')}
    </fieldset>
  `;
}

function renderCareerQuestions(container, roleId) {
  const role = getRoleById(roleId);

  container.innerHTML = `
    <label class="field">
      <span>1. Which IT role are you targeting?</span>
      <select id="role-select" name="roleId">
        ${IT_ROLES.map((r) => `<option value="${r.id}" ${r.id === roleId ? 'selected' : ''}>${r.label}</option>`).join('')}
      </select>
    </label>
    <p class="hint" id="market-demand-info">
      Current market demand for ${role.label}: <strong>${role.marketDemand.label}</strong>
      (${role.marketDemand.points}/15 pts).
    </p>
    <div id="stack-container">${renderStackChecklist(role)}</div>
    ${renderLevelFieldset('experience', '2. Years of hands-on experience with this stack', EXPERIENCE_LEVELS)}
    ${renderLevelFieldset('credentials', '3. Certifications/education relevant to this stack', CREDENTIALS_LEVELS)}
    ${renderLevelFieldset('network', '4. Professional network & job-search activity', NETWORK_LEVELS)}
    ${renderLevelFieldset('adaptability', '5. Willingness to reskill/upskill for this stack', ADAPTABILITY_LEVELS)}
  `;
}

function readCareerAnswers(form) {
  const roleId = form.roleId.value;
  const knownSkillIds = Array.from(form.querySelectorAll('input[name="knownSkill"]:checked')).map((el) => el.value);
  const readLevel = (fieldName) => {
    const selected = form.querySelector(`input[name="${fieldName}"]:checked`);
    return selected ? Number(selected.value) : 0;
  };

  return {
    roleId,
    knownSkillIds,
    experience: readLevel('experience'),
    credentials: readLevel('credentials'),
    network: readLevel('network'),
    adaptability: readLevel('adaptability'),
  };
}

// Traffic-light coding for the emergency-fund rating, worst (red) to best (green).
const FINANCIAL_RATING_CLASS = {
  Critical: 'rating-critical',
  'At Risk': 'rating-at-risk',
  Adequate: 'rating-adequate',
  Strong: 'rating-strong',
};

export function initApp(root = document) {
  const form = root.getElementById('career-form');
  const questionsContainer = root.getElementById('career-questions');
  const resultsSection = root.getElementById('results');
  const careerScoreEl = root.getElementById('career-score');
  const financialScoreEl = root.getElementById('financial-score');
  const financialDetailEl = root.getElementById('financial-detail');
  const recommendationTextEl = root.getElementById('recommendation-text');
  const recommendationSourceEl = root.getElementById('recommendation-source');
  const callButton = root.getElementById('call-advice');

  renderCareerQuestions(questionsContainer, IT_ROLES[0].id);

  questionsContainer.addEventListener('change', (event) => {
    if (event.target.name === 'roleId') {
      renderCareerQuestions(questionsContainer, event.target.value);
    }
  });

  if (CONTACT_PHONE) {
    callButton.setAttribute('href', `tel:${CONTACT_PHONE}`);
  } else {
    callButton.setAttribute('aria-disabled', 'true');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const answers = readCareerAnswers(form);
    const {
      total: careerScore,
      role,
      marketDemand,
      knownSkills,
      missingSkills,
    } = scoreCareerReadiness(answers);
    const careerBand = getCareerScoreBand(careerScore);

    const savings = Number(form.savings.value);
    const monthlyExpenses = Number(form.monthlyExpenses.value);
    const { months, score: financialScore, rating: financialRating } = calculateEmergencyFund(
      savings,
      monthlyExpenses
    );

    resultsSection.hidden = false;
    careerScoreEl.textContent = String(careerScore);
    financialScoreEl.textContent = String(financialScore);
    financialDetailEl.textContent =
      `Your savings would cover about ${months.toFixed(1)} month(s) of essential expenses (${financialRating}).`;
    financialDetailEl.className = `financial-detail ${FINANCIAL_RATING_CLASS[financialRating] ?? ''}`.trim();

    recommendationTextEl.textContent = 'Calculating your personalized recommendation...';
    recommendationSourceEl.textContent = '';

    const { text, source } = await getRecommendation({
      careerScore,
      careerBand,
      roleLabel: role.label,
      knownSkills,
      missingSkills,
      marketDemand,
      financialMonths: months,
      financialRating,
    });

    recommendationTextEl.textContent = text;
    recommendationSourceEl.textContent =
      source === 'ai' ? 'Personalized by AI' : 'Based on your score range (offline recommendation)';

    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
