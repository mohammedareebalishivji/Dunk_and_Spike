import { describe, it, expect } from 'vitest';
import { 
  evaluateBonusStatus, 
  getNextBasketballPeriod, 
  requiresOvertime 
} from './basketballRules';

describe('Basketball FIBA / NCAA Rules Engine', () => {
  describe('Team Fouls & Bonus / Penalty', () => {
    it('is not in bonus with less than 5 fouls', () => {
      const res = evaluateBonusStatus(3);
      expect(res.isBonus).toBe(false);
      expect(res.isDoubleBonus).toBe(false);
      expect(res.label).toBe('3/5 Fouls');
    });

    it('enters bonus penalty at 5 team fouls', () => {
      const res = evaluateBonusStatus(5);
      expect(res.isBonus).toBe(true);
      expect(res.isDoubleBonus).toBe(false);
      expect(res.label).toContain('BONUS');
    });

    it('enters double bonus at 10 fouls', () => {
      const res = evaluateBonusStatus(10);
      expect(res.isBonus).toBe(true);
      expect(res.isDoubleBonus).toBe(true);
    });
  });

  describe('Period Advancement', () => {
    it('advances through quarters in sequence', () => {
      expect(getNextBasketballPeriod('Q1').nextPeriod).toBe('Q2');
      expect(getNextBasketballPeriod('Q2').nextPeriod).toBe('Q3');
      expect(getNextBasketballPeriod('Q3').nextPeriod).toBe('Q4');
      expect(getNextBasketballPeriod('Q4').nextPeriod).toBe('OT1');
      expect(getNextBasketballPeriod('OT1').nextPeriod).toBe('OT2');
    });
  });

  describe('Overtime Evaluation', () => {
    it('requires overtime when tied at end of regulation Q4', () => {
      expect(requiresOvertime(88, 88, 'Q4')).toBe(true);
    });

    it('does not require overtime when scores differ', () => {
      expect(requiresOvertime(89, 88, 'Q4')).toBe(false);
    });

    it('does not trigger overtime in earlier quarters', () => {
      expect(requiresOvertime(50, 50, 'Q2')).toBe(false);
    });
  });
});
