import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { 
  getChampionshipRules, 
  saveChampionshipRules, 
  resetChampionshipRules, 
  subscribeRulesChange,
  DEFAULT_VOLLEYBALL_RULES,
  DEFAULT_BASKETBALL_RULES,
  RULES_STORAGE_KEY
} from './rulesManager';
import { evaluateVolleyballScore, getBaseTargetPoints, needsCourtSwitch } from './volleyballRules';
import { executeSubstitution } from './substitutionManager';
import { Team, Player } from '../types';

// Mock localStorage for Node test runner
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe('Rules Manager & Mid-Set Substitution System', () => {
  beforeAll(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      (globalThis as any).localStorage = createLocalStorageMock();
    }
  });

  beforeEach(() => {
    localStorage.clear();
    resetChampionshipRules();
  });

  describe('Championship Rules Persistence & Defaults', () => {
    it('returns official sanctioned defaults when storage is empty', () => {
      const rules = getChampionshipRules();
      expect(rules.volleyball.regularSetTargetPoints).toBe(25);
      expect(rules.volleyball.decidingSetTargetPoints).toBe(15);
      expect(rules.volleyball.courtSwitchAtPoints).toBe(8);
      expect(rules.volleyball.maxSubstitutionsPerSet).toBe(6);
      expect(rules.volleyball.allowMidSetSubstitutions).toBe(true);

      expect(rules.basketball.quarterDurationMinutes).toBe(10);
      expect(rules.basketball.shotClockSeconds).toBe(24);
      expect(rules.basketball.teamFoulsBonusThreshold).toBe(5);
      expect(rules.basketball.playerFoulOutLimit).toBe(5);
      expect(rules.basketball.maxPlayersOnCourt).toBe(5);
    });

    it('saves customized championship rules and clamps numeric boundaries', () => {
      saveChampionshipRules({
        volleyball: {
          ...DEFAULT_VOLLEYBALL_RULES,
          regularSetTargetPoints: 21,
          decidingSetTargetPoints: 12,
          courtSwitchAtPoints: 6,
          maxSubstitutionsPerSet: 10,
        },
        basketball: {
          ...DEFAULT_BASKETBALL_RULES,
          quarterDurationMinutes: 12,
          shotClockSeconds: 30,
          teamFoulsBonusThreshold: 7,
          playerFoulOutLimit: 6,
        },
      });

      const loaded = getChampionshipRules();
      expect(loaded.volleyball.regularSetTargetPoints).toBe(21);
      expect(loaded.volleyball.decidingSetTargetPoints).toBe(12);
      expect(loaded.volleyball.courtSwitchAtPoints).toBe(6);
      expect(loaded.volleyball.maxSubstitutionsPerSet).toBe(10);

      expect(loaded.basketball.quarterDurationMinutes).toBe(12);
      expect(loaded.basketball.shotClockSeconds).toBe(30);
      expect(loaded.basketball.teamFoulsBonusThreshold).toBe(7);
      expect(loaded.basketball.playerFoulOutLimit).toBe(6);
    });

    it('notifies active subscribers on rule modification', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeRulesChange(listener);

      saveChampionshipRules({
        volleyball: {
          ...DEFAULT_VOLLEYBALL_RULES,
          regularSetTargetPoints: 30,
        },
        basketball: {
          ...DEFAULT_BASKETBALL_RULES,
        },
      });

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('resets customized rules back to official factory defaults', () => {
      saveChampionshipRules({
        volleyball: {
          ...DEFAULT_VOLLEYBALL_RULES,
          regularSetTargetPoints: 20,
        },
        basketball: {
          ...DEFAULT_BASKETBALL_RULES,
          quarterDurationMinutes: 8,
        },
      });

      const reset = resetChampionshipRules();
      expect(reset.volleyball.regularSetTargetPoints).toBe(25);
      expect(reset.basketball.quarterDurationMinutes).toBe(10);

      const loaded = getChampionshipRules();
      expect(loaded.volleyball.regularSetTargetPoints).toBe(25);
    });
  });

  describe('Volleyball Scoring Integration with Admin Rules', () => {
    it('evaluates base target points dynamically based on customized rules', () => {
      saveChampionshipRules({
        volleyball: {
          ...DEFAULT_VOLLEYBALL_RULES,
          regularSetTargetPoints: 21,
          decidingSetTargetPoints: 11,
        },
        basketball: {
          ...DEFAULT_BASKETBALL_RULES,
        },
      });

      expect(getBaseTargetPoints(1, 'best-of-5')).toBe(21);
      expect(getBaseTargetPoints(4, 'best-of-5')).toBe(21);
      expect(getBaseTargetPoints(5, 'best-of-5')).toBe(11);
    });

    it('evaluates court switch alert dynamically with customized courtSwitchAtPoints', () => {
      saveChampionshipRules({
        volleyball: {
          ...DEFAULT_VOLLEYBALL_RULES,
          courtSwitchAtPoints: 6,
        },
        basketball: {
          ...DEFAULT_BASKETBALL_RULES,
        },
      });

      // Deciding Set 5: at 5-4, no switch yet
      expect(needsCourtSwitch(5, 'best-of-5', 5, 4)).toBe(false);
      // At 6-4, switch triggered at 6 points!
      expect(needsCourtSwitch(5, 'best-of-5', 6, 4)).toBe(true);
    });

    it('evaluates set victory using customized target points (e.g. 21-19)', () => {
      saveChampionshipRules({
        volleyball: {
          ...DEFAULT_VOLLEYBALL_RULES,
          regularSetTargetPoints: 21,
        },
        basketball: {
          ...DEFAULT_BASKETBALL_RULES,
        },
      });

      const result = evaluateVolleyballScore(21, 19, 1, 'best-of-5', 0, 0);
      expect(result.isSetWon).toBe(true);
      expect(result.setWinner).toBe('home');
    });

    it('respects winByTwoPoints disabled setting', () => {
      saveChampionshipRules({
        volleyball: {
          ...DEFAULT_VOLLEYBALL_RULES,
          regularSetTargetPoints: 25,
          winByTwoPoints: false,
        },
        basketball: {
          ...DEFAULT_BASKETBALL_RULES,
        },
      });

      // 25-24 wins immediately when winByTwoPoints is disabled
      const result = evaluateVolleyballScore(25, 24, 1, 'best-of-5', 0, 0);
      expect(result.isSetWon).toBe(true);
      expect(result.setWinner).toBe('home');
    });
  });

  describe('Volleyball Mid-Set / Mid-Match Substitution from Existing Members', () => {
    const mockStarters: Player[] = [
      { id: 'p1', name: 'Starter One', number: 1, position: 'OH', points: 4, isOnCourt: true },
      { id: 'p2', name: 'Starter Two', number: 2, position: 'MB', points: 3, isOnCourt: true },
      { id: 'p3', name: 'Starter Three', number: 3, position: 'OPP', points: 2, isOnCourt: true },
      { id: 'p4', name: 'Starter Four', number: 4, position: 'OH', points: 5, isOnCourt: true },
      { id: 'p5', name: 'Starter Five', number: 5, position: 'MB', points: 1, isOnCourt: true },
      { id: 'p6', name: 'Starter Six', number: 6, position: 'S', points: 0, isOnCourt: true },
    ];

    const mockBench: Player[] = [
      { id: 'p7', name: 'Reserve Seven', number: 7, position: 'L', points: 0, isOnCourt: false },
      { id: 'p8', name: 'Reserve Eight', number: 8, position: 'OH', points: 0, isOnCourt: false },
    ];

    const mockTeam: Team = {
      id: 'team-spike',
      name: 'Pacific Spikers',
      shortName: 'PAC',
      score: 18,
      setsWon: 1,
      players: [...mockStarters, ...mockBench],
      substitutionsUsed: 0,
    };

    it('successfully executes mid-set substitution replacing an on-court starter with a bench squad member', () => {
      const result = executeSubstitution(
        mockTeam,
        'p1', // Starter One leaves
        mockBench[0], // Reserve Seven enters
        'volleyball',
        '14:22'
      );

      expect(result.success).toBe(true);
      expect(result.updatedTeam.substitutionsUsed).toBe(1);

      const subbedOut = result.updatedTeam.players?.find(p => p.id === 'p1');
      const subbedIn = result.updatedTeam.players?.find(p => p.id === 'p7');

      expect(subbedOut?.isOnCourt).toBe(false);
      expect(subbedOut?.subbedOutAt).toBe('14:22');

      expect(subbedIn?.isOnCourt).toBe(true);
      expect(subbedIn?.subbedInAt).toBe('14:22');

      expect(result.eventDescription).toContain('🔄 SUB: #7 Reserve Seven (IN) ↔ #1 Starter One (OUT)');
    });

    it('enforces dynamic substitution limits configured by admin', () => {
      // Set max substitutions per set to 8
      saveChampionshipRules({
        volleyball: {
          ...DEFAULT_VOLLEYBALL_RULES,
          maxSubstitutionsPerSet: 8,
        },
        basketball: {
          ...DEFAULT_BASKETBALL_RULES,
        },
      });

      const teamNearLimit: Team = {
        ...mockTeam,
        substitutionsUsed: 7,
      };

      // 8th substitution is permitted under custom limit 8
      const sub8 = executeSubstitution(teamNearLimit, 'p2', mockBench[1], 'volleyball');
      expect(sub8.success).toBe(true);
      expect(sub8.updatedTeam.substitutionsUsed).toBe(8);

      // 9th substitution should fail
      const sub9 = executeSubstitution(sub8.updatedTeam, 'p3', mockBench[0], 'volleyball');
      expect(sub9.success).toBe(false);
      expect(sub9.error).toContain('Maximum 8 substitutions allowed per set');
    });

    it('disallows substituting a player for themselves', () => {
      const result = executeSubstitution(mockTeam, 'p1', mockStarters[0], 'volleyball');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot substitute a player for themselves');
    });
  });
});
