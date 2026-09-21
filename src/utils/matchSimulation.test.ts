import { describe, it, expect } from 'vitest';
import { 
  evaluateVolleyballScore, 
  getBaseTargetPoints, 
  isDecidingSetNumber,
  needsCourtSwitch 
} from './volleyballRules';
import { 
  evaluateBonusStatus, 
  getNextBasketballPeriod, 
  requiresOvertime 
} from './basketballRules';

describe('End-to-End Match Simulation & Tournament Integrity', () => {
  describe('Full 5-Set VNL Volleyball Tournament Match Simulation', () => {
    it('simulates a full 5-set Olympic/VNL match through tiebreak deuce to victory', () => {
      let homeSets = 0;
      let awaySets = 0;

      // SET 1 (To 25)
      expect(getBaseTargetPoints(1, 'best-of-5')).toBe(25);
      const set1 = evaluateVolleyballScore(25, 22, 1, 'best-of-5', homeSets, awaySets);
      expect(set1.isSetWon).toBe(true);
      expect(set1.setWinner).toBe('home');
      expect(set1.isMatchWon).toBe(false);
      homeSets++;

      // SET 2 (To 25)
      const set2 = evaluateVolleyballScore(23, 25, 2, 'best-of-5', homeSets, awaySets);
      expect(set2.isSetWon).toBe(true);
      expect(set2.setWinner).toBe('away');
      expect(set2.isMatchWon).toBe(false);
      awaySets++;
      expect(homeSets).toBe(1);
      expect(awaySets).toBe(1);

      // SET 3 (To 25, reaches deuce 24-24)
      const set3Deuce = evaluateVolleyballScore(24, 24, 3, 'best-of-5', homeSets, awaySets);
      expect(set3Deuce.isDeuce).toBe(true);
      expect(set3Deuce.currentTarget).toBe(26);

      const set3Win = evaluateVolleyballScore(26, 24, 3, 'best-of-5', homeSets, awaySets);
      expect(set3Win.isSetWon).toBe(true);
      expect(set3Win.setWinner).toBe('home');
      homeSets++;
      expect(homeSets).toBe(2);

      // SET 4 (To 25)
      const set4 = evaluateVolleyballScore(20, 25, 4, 'best-of-5', homeSets, awaySets);
      expect(set4.isSetWon).toBe(true);
      expect(set4.setWinner).toBe('away');
      awaySets++;
      expect(homeSets).toBe(2);
      expect(awaySets).toBe(2);

      // SET 5 (DECIDING TIEBREAKER SET TO 15)
      expect(isDecidingSetNumber(5, 'best-of-5')).toBe(true);
      expect(getBaseTargetPoints(5, 'best-of-5')).toBe(15);

      // Court Switch Test at 8 Points
      expect(needsCourtSwitch(5, 'best-of-5', 7, 7)).toBe(false);
      expect(needsCourtSwitch(5, 'best-of-5', 8, 7)).toBe(true); // Court switch triggered!

      // Deciding Set Deuce at 14-14
      const set5Deuce = evaluateVolleyballScore(14, 14, 5, 'best-of-5', homeSets, awaySets);
      expect(set5Deuce.isDeuce).toBe(true);
      expect(set5Deuce.currentTarget).toBe(16);
      expect(set5Deuce.pointSpecialBadge).toBe('DEUCE');

      // Home takes 15-14 lead (Match Point!)
      const matchPoint = evaluateVolleyballScore(15, 14, 5, 'best-of-5', homeSets, awaySets);
      expect(matchPoint.isSetWon).toBe(false);
      expect(matchPoint.pointSpecialBadge).toBe('MATCH POINT');
      expect(matchPoint.currentTarget).toBe(16);

      // Home seals the match at 16-14 (Win by 2)
      const set5Final = evaluateVolleyballScore(16, 14, 5, 'best-of-5', homeSets, awaySets);
      expect(set5Final.isSetWon).toBe(true);
      expect(set5Final.setWinner).toBe('home');
      expect(set5Final.isMatchWon).toBe(true);
      expect(set5Final.matchWinner).toBe('home');
    });
  });

  describe('Full Basketball Tournament Regulation & Overtime Simulation', () => {
    it('simulates regulation tie, mandatory overtime, and foul penalty bonus', () => {
      // Q1
      let period = 'Q1';
      expect(getNextBasketballPeriod(period).nextPeriod).toBe('Q2');
      period = 'Q2';
      expect(getNextBasketballPeriod(period).nextPeriod).toBe('Q3');
      period = 'Q3';
      expect(getNextBasketballPeriod(period).nextPeriod).toBe('Q4');
      period = 'Q4';

      // Team foul penalty bonus test
      expect(evaluateBonusStatus(4).isBonus).toBe(false);
      expect(evaluateBonusStatus(5).isBonus).toBe(true);
      expect(evaluateBonusStatus(5).label).toContain('PENALTY BONUS');

      // End of Q4 tied at 95-95 -> Mandates Overtime
      expect(requiresOvertime(95, 95, period)).toBe(true);
      const otTransition = getNextBasketballPeriod('Q4');
      expect(otTransition.nextPeriod).toBe('OT1');

      // In OT1, not tied at 106-102 -> Match Concludes
      period = 'OT1';
      expect(requiresOvertime(106, 102, period)).toBe(false);
      const finalTransition = getNextBasketballPeriod(period);
      expect(finalTransition.isFinal).toBe(false); // OT2 if tied, else ends
    });
  });
});
