import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPersonalizedRecommendation } from './grokClient.js';

const CONTEXT = {
  roleLabel: 'Java Backend Developer',
  careerScore: 75,
  knownSkills: ['Core Java (8/11/17+)', 'Spring Boot'],
  missingSkills: ['Kubernetes'],
  marketDemand: { label: 'High demand', points: 13 },
  financialMonths: 4,
  financialRating: 'Adequate',
};

describe('fetchPersonalizedRecommendation', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GROK_API_KEY', 'test-key');
    vi.stubEnv('VITE_GROK_API_URL', 'https://api.x.ai/v1/chat/completions');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns trimmed recommendation text on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '  Great job! Keep it up.  ' } }] }),
    });

    const text = await fetchPersonalizedRecommendation(CONTEXT);
    expect(text).toBe('Great job! Keep it up.');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.x.ai/v1/chat/completions',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws when the API responds with a non-2xx status', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchPersonalizedRecommendation(CONTEXT)).rejects.toThrow(/status 500/);
  });

  it('throws when the response has no recommendation text', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [] }) });
    await expect(fetchPersonalizedRecommendation(CONTEXT)).rejects.toThrow(/did not include/);
  });

  it('throws when fetch rejects (network error)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down'));
    await expect(fetchPersonalizedRecommendation(CONTEXT)).rejects.toThrow('network down');
  });

  it('throws when API key or URL is not configured', async () => {
    vi.unstubAllEnvs();
    global.fetch = vi.fn();
    await expect(fetchPersonalizedRecommendation(CONTEXT)).rejects.toThrow(/not configured/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('aborts and throws when the request exceeds the timeout', async () => {
    global.fetch = vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));

    await expect(fetchPersonalizedRecommendation(CONTEXT, { timeoutMs: 10 })).rejects.toThrow();
  });
});
