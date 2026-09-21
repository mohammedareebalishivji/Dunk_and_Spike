import { describe, it, expect } from 'vitest';
import { 
  evaluateVolleyballScore, 
  getBaseTargetPoints, 
  isDecidingSetNumber, 
  getSetsToWin,
  needsCourtSwitch
} from './volleyballRules';

describe('Volleyball FIVB / VNL Tournament Rules Engine', () => {
  describe('Format & Base Targets', () => {
    it('sets correct targets for Best-of-5 matches', () => {
      expect(getBaseTargetPoints(1, 'best-of-5')).toBe(25);
      expect(getBaseTargetPoints(2, 'best-of-5')).toBe(25);
      expect(getBaseTargetPoints(3, 'best-of-5')).toBe(25);
      expect(getBaseTargetPoints(4, 'best-of-5')).toBe(25);
      expect(getBaseTargetPoints(5, 'best-of-5')).toBe(15); // Deciding set
      expect(getSetsToWin('best-of-5')).toBe(3);
    });

    it('sets correct targets for Best-of-3 matches', () => {
      expect(getBaseTargetPoints(1, 'best-of-3')).toBe(25);
      expect(getBaseTargetPoints(2, 'best-of-3')).toBe(25);
      expect(getBaseTargetPoints(3, 'best-of-3')).toBe(15); // Deciding set
      expect(getSetsToWin('best-of-3')).toBe(2);
    });

    it('correctly identifies deciding sets', () => {
      expect(isDecidingSetNumber(5, 'best-of-5')).toBe(true);
      expect(isDecidingSetNumber(4, 'best-of-5')).toBe(false);
      expect(isDecidingSetNumber(3, 'best-of-3')).toBe(true);
      expect(isDecidingSetNumber(2, 'best-of-3')).toBe(false);
    });
  });

  describe('Standard Set Scoring & Win-by-2', () => {
    it('awards set win when reaching 25 with at least 2-point lead', () => {
      const res = evaluateVolleyballScore(25, 20, 1, 'best-of-5', 0, 0);
      expect(res.isSetWon).toBe(true);
      expect(res.setWinner).toBe('home');
      expect(res.isMatchWon).toBe(false);
    });

    it('does NOT award set win at 25-24 (requires 2-point lead)', () => {
      const res = evaluateVolleyballScore(25, 24, 1, 'best-of-5', 0, 0);
      expect(res.isSetWon).toBe(false);
      expect(res.pointSpecialBadge).toBe('SET POINT');
      expect(res.currentTarget).toBe(26);
    });

    it('awards set win at 26-24 following deuce', () => {
      const res = evaluateVolleyballScore(26, 24, 1, 'best-of-5', 0, 0);
      expect(res.isSetWon).toBe(true);
      expect(res.setWinner).toBe('home');
    });

    it('handles prolonged deuce up to 32-30', () => {
      // 28-28 tied
      const tied = evaluateVolleyballScore(28, 28, 2, 'best-of-5', 1, 0);
      expect(tied.isDeuce).toBe(true);
      expect(tied.currentTarget).toBe(30);

      // 30-29 advantage
      const adv = evaluateVolleyballScore(30, 29, 2, 'best-of-5', 1, 0);
      expect(adv.isSetWon).toBe(false);
      expect(adv.currentTarget).toBe(31);
      expect(adv.pointSpecialBadge).toBe('SET POINT');

      // 32-30 win
      const won = evaluateVolleyballScore(32, 30, 2, 'best-of-5', 1, 0);
      expect(won.isSetWon).toBe(true);
      expect(won.setWinner).toBe('home');
    });
  });

  describe('Deciding 5th Set (15 points tiebreak)', () => {
    it('awards deciding set win at 15-12 with 2-point lead', () => {
      const res = evaluateVolleyballScore(15, 12, 5, 'best-of-5', 2, 2);
      expect(res.isSetWon).toBe(true);
      expect(res.isMatchWon).toBe(true);
      expect(res.matchWinner).toBe('home');
    });

    it('triggers deuce at 14-14 in deciding set', () => {
      const res = evaluateVolleyballScore(14, 14, 5, 'best-of-5', 2, 2);
      expect(res.isDeuce).toBe(true);
      expect(res.currentTarget).toBe(16);
      expect(res.pointSpecialBadge).toBe('DEUCE');
    });

    it('flags MATCH POINT in deciding set when leading by 1', () => {
      const res = evaluateVolleyballScore(15, 14, 5, 'best-of-5', 2, 2);
      expect(res.isSetWon).toBe(false);
      expect(res.pointSpecialBadge).toBe('MATCH POINT');
      expect(res.currentTarget).toBe(16);
    });

    it('completes match at 17-15 in deciding set', () => {
      const res = evaluateVolleyballScore(17, 15, 5, 'best-of-5', 2, 2);
      expect(res.isSetWon).toBe(true);
      expect(res.isMatchWon).toBe(true);
      expect(res.matchWinner).toBe('home');
    });
  });

  describe('Best-of-3 Format Tests', () => {
    it('completes match when a team wins 2 sets', () => {
      // Team A wins set 2 to go 2-0
      const res = evaluateVolleyballScore(25, 21, 2, 'best-of-3', 1, 0);
      expect(res.isSetWon).toBe(true);
      expect(res.isMatchWon).toBe(true);
      expect(res.matchWinner).toBe('home');
    });

    it('enters deciding Set 3 played to 15 points if 1-1', () => {
      expect(getBaseTargetPoints(3, 'best-of-3')).toBe(15);
      const res = evaluateVolleyballScore(14, 14, 3, 'best-of-3', 1, 1);
      expect(res.isDeuce).toBe(true);
      expect(res.currentTarget).toBe(16);
    });
  });

  describe('FIVB Court Switch Rule 18.2', () => {
    it('flags court switch at 8 points in deciding set', () => {
      expect(needsCourtSwitch(5, 'best-of-5', 8, 5)).toBe(true);
      expect(needsCourtSwitch(5, 'best-of-5', 4, 8)).toBe(true);
      expect(needsCourtSwitch(3, 'best-of-3', 8, 7)).toBe(true);
      expect(needsCourtSwitch(3, 'best-of-3', 7, 7)).toBe(false);
      // Non-deciding sets do not switch at 8
      expect(needsCourtSwitch(1, 'best-of-5', 8, 5)).toBe(false);
    });
  });
});
