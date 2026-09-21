import { describe, it, expect } from 'vitest';

export function validatePledgeAmount(amount: number | string): { isValid: boolean; parsedAmount: number; error?: string } {
  const parsed = Number(amount);
  if (typeof amount === 'string' && amount.trim() === '') {
    return { isValid: false, parsedAmount: 0, error: 'Pledge amount cannot be empty' };
  }
  if (isNaN(parsed) || parsed <= 0) {
    return { isValid: false, parsedAmount: 0, error: 'Please enter a valid positive pledge amount' };
  }
  return { isValid: true, parsedAmount: parsed };
}

export function formatIndianCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

describe('Sponsor Booster Pledge Amount Any Value Verification', () => {
  it('accepts small arbitrary values (e.g. ₹1, ₹15, ₹100)', () => {
    const r1 = validatePledgeAmount(1);
    expect(r1.isValid).toBe(true);
    expect(r1.parsedAmount).toBe(1);

    const r2 = validatePledgeAmount('15');
    expect(r2.isValid).toBe(true);
    expect(r2.parsedAmount).toBe(15);
  });

  it('accepts custom odd amounts that are not multiples of 500 (e.g. ₹73, ₹1234, ₹9999)', () => {
    const testCases = [73, '251', 1234, '9999', 42000];
    for (const val of testCases) {
      const result = validatePledgeAmount(val);
      expect(result.isValid).toBe(true);
      expect(result.parsedAmount).toBe(Number(val));
    }
  });

  it('accepts large values (e.g. ₹5,00,000 or ₹10,00,000)', () => {
    const r1 = validatePledgeAmount(500000);
    expect(r1.isValid).toBe(true);
    expect(r1.parsedAmount).toBe(500000);
    expect(formatIndianCurrency(r1.parsedAmount)).toBe('₹5,00,000');

    const r2 = validatePledgeAmount('1000000');
    expect(r2.isValid).toBe(true);
    expect(formatIndianCurrency(r2.parsedAmount)).toBe('₹10,00,000');
  });

  it('accepts decimal pledge amounts (e.g. ₹99.50)', () => {
    const res = validatePledgeAmount('99.50');
    expect(res.isValid).toBe(true);
    expect(res.parsedAmount).toBe(99.50);
  });

  it('rejects invalid, zero, negative, or empty amounts', () => {
    expect(validatePledgeAmount(0).isValid).toBe(false);
    expect(validatePledgeAmount(-500).isValid).toBe(false);
    expect(validatePledgeAmount('').isValid).toBe(false);
    expect(validatePledgeAmount('   ').isValid).toBe(false);
    expect(validatePledgeAmount('abc').isValid).toBe(false);
  });
});
