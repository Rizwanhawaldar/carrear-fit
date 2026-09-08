const SYSTEM_PROMPT =
  'You are an IT career coach. Given a person\'s target IT role, career-fitness score, the tech stack ' +
  'they already know versus what the market expects for that role, current market demand for the role, and ' +
  'their financial-fitness (emergency fund) standing, write a short (3-5 sentence), specific, IT-industry-focused, ' +
  'upbeat recommendation. Name concrete missing technologies to prioritize learning. Do not generalize to non-IT ' +
  'advice, do not mention "career readiness", and do not repeat the raw numbers back verbatim.';

function buildUserPrompt({
  roleLabel,
  careerScore,
  knownSkills,
  missingSkills,
  marketDemand,
  financialMonths,
  financialRating,
}) {
  return JSON.stringify({
    roleLabel,
    careerScore,
    knownSkills,
    missingSkills,
    marketDemand,
    financialMonths,
    financialRating,
  });
}

/**
 * Calls the Grok (xAI) chat completions API directly from the browser to generate
 * a personalized recommendation. Throws on missing config, non-2xx response, or timeout
 * so the caller can fall back to rule-based recommendations.
 * @param {{ roleLabel: string, careerScore: number, knownSkills: string[], missingSkills: string[], marketDemand: { label: string, points: number }, financialMonths: number, financialRating: string }} context
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<string>}
 */
export async function fetchPersonalizedRecommendation(context, { timeoutMs = 8000 } = {}) {
  const apiKey = import.meta.env.VITE_GROK_API_KEY;
  const apiUrl = import.meta.env.VITE_GROK_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error('Grok API is not configured (missing VITE_GROK_API_KEY or VITE_GROK_API_URL)');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(context) },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Grok API responded with status ${response.status}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Grok API response did not include recommendation text');
    }
    return text.trim();
  } finally {
    clearTimeout(timer);
  }
}
