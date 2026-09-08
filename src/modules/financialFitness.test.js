import { describe, it, expect } from 'vitest';
import { calculateEmergencyFund, getFinancialRating } from './financialFitness.js';

describe('calculateEmergencyFund', () => {
  it('computes months as savings / monthlyExpenses', () => {
    const { months } = calculateEmergencyFund(3000, 1000);
    expect(months).toBe(3);
  });

  it('caps score at 100 for 6+ months', () => {
    const { score } = calculateEmergencyFund(12000, 1000);
    expect(score).toBe(100);
  });

  it('scores 0 months as 0', () => {
    const { score } = calculateEmergencyFund(0, 1000);
    expect(score).toBe(0);
  });

  it('scales score proportionally below 6 months', () => {
    const { score } = calculateEmergencyFund(1500, 1000);
    expect(score).toBe(25);
  });

  it('rejects negative savings', () => {
    expect(() => calculateEmergencyFund(-1, 1000)).toThrow();
  });

  it('rejects zero or negative monthly expenses', () => {
    expect(() => calculateEmergencyFund(1000, 0)).toThrow();
    expect(() => calculateEmergencyFund(1000, -500)).toThrow();
  });

  it('rejects non-numeric input', () => {
    expect(() => calculateEmergencyFund('1000', 500)).toThrow();
    expect(() => calculateEmergencyFund(1000, NaN)).toThrow();
  });
});

describe('getFinancialRating', () => {
  it('classifies bands at boundaries', () => {
    expect(getFinancialRating(0)).toBe('Critical');
    expect(getFinancialRating(0.99)).toBe('Critical');
    expect(getFinancialRating(1)).toBe('At Risk');
    expect(getFinancialRating(2.9)).toBe('At Risk');
    expect(getFinancialRating(3)).toBe('Adequate');
    expect(getFinancialRating(5.9)).toBe('Adequate');
    expect(getFinancialRating(6)).toBe('Strong');
    expect(getFinancialRating(12)).toBe('Strong');
  });
});
