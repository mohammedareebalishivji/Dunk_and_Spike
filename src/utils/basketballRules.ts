/**
 * FIBA & NCAA Official Basketball Rules Utilities
 */

export interface BonusStatus {
  isBonus: boolean;
  isDoubleBonus: boolean;
  fouls: number;
  label: string;
}

/**
 * Evaluates Team Fouls against FIBA / NCAA bonus free-throw rules:
 * - FIBA: 5th team foul in a quarter enters penalty (2 free throws on all subsequent personal fouls).
 * - NCAA Men's: 7th foul = 1-and-1 bonus; 10th foul = double bonus (2 free throws).
 */
export function evaluateBonusStatus(fouls: number = 0): BonusStatus {
  if (fouls >= 5) {
    return {
      isBonus: true,
      isDoubleBonus: fouls >= 10,
      fouls,
      label: fouls >= 10 ? 'DOUBLE BONUS (2 FT)' : 'PENALTY BONUS (2 FT)',
    };
  }
  return {
    isBonus: false,
    isDoubleBonus: false,
    fouls,
    label: `${fouls}/5 Fouls`,
  };
}

/**
 * Advances basketball period: Q1 -> Q2 -> Halftime -> Q3 -> Q4 -> Overtime (OT1, OT2...)
 */
export function getNextBasketballPeriod(currentPeriod: string): { nextPeriod: string; isFinal: boolean } {
  const normalized = currentPeriod.trim().toUpperCase();
  if (normalized.includes('Q1')) return { nextPeriod: 'Q2', isFinal: false };
  if (normalized.includes('Q2')) return { nextPeriod: 'Q3', isFinal: false };
  if (normalized.includes('Q3')) return { nextPeriod: 'Q4', isFinal: false };
  if (normalized.includes('Q4')) return { nextPeriod: 'OT1', isFinal: false };
  if (normalized.includes('OT1')) return { nextPeriod: 'OT2', isFinal: false };
  if (normalized.includes('OT2')) return { nextPeriod: 'OT3', isFinal: false };
  return { nextPeriod: 'FINAL', isFinal: true };
}

/**
 * Checks if scores are tied at the end of regulation (Q4), which requires 5-minute Overtime.
 */
export function requiresOvertime(homeScore: number, awayScore: number, period: string): boolean {
  const isEndOfRegulation = period.toUpperCase().includes('Q4') || period.toUpperCase().includes('OT');
  return isEndOfRegulation && homeScore === awayScore;
}
