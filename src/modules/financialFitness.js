const MONTHS_FOR_FULL_SCORE = 6;

/**
 * Calculates emergency-fund coverage from savings and essential monthly expenses.
 * @param {number} savings - total liquid savings available
 * @param {number} monthlyExpenses - essential monthly expenses
 * @returns {{ months: number, score: number, rating: 'Critical'|'At Risk'|'Adequate'|'Strong' }}
 */
export function calculateEmergencyFund(savings, monthlyExpenses) {
  if (typeof savings !== 'number' || Number.isNaN(savings) || savings < 0) {
    throw new Error('savings must be a non-negative number');
  }
  if (typeof monthlyExpenses !== 'number' || Number.isNaN(monthlyExpenses) || monthlyExpenses <= 0) {
    throw new Error('monthlyExpenses must be a positive number');
  }

  const months = savings / monthlyExpenses;
  const score = Math.min(100, Math.round((months / MONTHS_FOR_FULL_SCORE) * 100));
  const rating = getFinancialRating(months);

  return { months, score, rating };
}

export function getFinancialRating(months) {
  if (months < 1) return 'Critical';
  if (months < 3) return 'At Risk';
  if (months < 6) return 'Adequate';
  return 'Strong';
}
