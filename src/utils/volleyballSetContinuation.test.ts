import { describe, it, expect } from 'vitest';
import { 
  evaluateVolleyballScore, 
  getBaseTargetPoints, 
  isDecidingSetNumber, 
  getSetsToWin 
} from './volleyballRules';
import { Match, SetScore } from '../types';

describe('Volleyball Set Completion, Score Adjustment, and Continuation', () => {
  const createMockVolleyballMatch = (): Match => ({
    id: 'match-vb-test',
    sport: 'volleyball',
    title: 'Spikers vs Aces',
    division: 'Varsity Girls',
    venue: 'Volleyball Pavilion',
    court: 'Court 1',
    status: 'LIVE',
    statusDetail: 'SET 1 (25-22)',
    volleyballFormat: 'best-of-5',
    currentSetNumber: 1,
    targetPoints: 25,
    completedSetPendingAdvance: 1,
    homeTeam: {
      id: 'spikers',
      name: 'Spikers',
      shortName: 'SPK',
      logoColor: '#0284c7',
      accentColor: '#38bdf8',
      record: '0-0',
      score: 25,
      setsWon: 1,
      players: [],
    },
    awayTeam: {
      id: 'aces',
      name: 'Aces',
      shortName: 'ACE',
      logoColor: '#f97316',
      accentColor: '#fb923c',
      record: '0-0',
      score: 22,
      setsWon: 0,
      players: [],
    },
    setScores: [
      {
        set: 1,
        homeScore: 25,
        awayScore: 22,
        isCompleted: true,
        targetPoints: 25,
        isDecidingSet: false,
        winner: 'home',
      },
    ],
  });

  it('reopens the set and removes set completion when score is adjusted downwards (e.g. referee correction to 24-22)', () => {
    // Score adjusted downwards to 24-22
    const correctedEval = evaluateVolleyballScore(
      24,
      22,
      1,
      'best-of-5',
      0,
      0
    );

    expect(correctedEval.isSetWon).toBe(false);
    expect(correctedEval.setWinner).toBeUndefined();
    expect(correctedEval.pointSpecialBadge).toBe('SET POINT');
    expect(correctedEval.currentTarget).toBe(25);
  });

  it('correctly transitions to deuce when score is adjusted to 24-24 tie', () => {
    const deuceEval = evaluateVolleyballScore(
      24,
      24,
      1,
      'best-of-5',
      0,
      0
    );

    expect(deuceEval.isSetWon).toBe(false);
    expect(deuceEval.isDeuce).toBe(true);
    expect(deuceEval.pointSpecialBadge).toBe('DEUCE');
    expect(deuceEval.currentTarget).toBe(26); // target dynamically expands by 2
  });

  it('correctly advances to Set 2 when admin confirms continuation to next set', () => {
    const match = createMockVolleyballMatch();
    const currentSet = match.currentSetNumber || 1;
    const nextSet = currentSet + 1;
    const nextTarget = getBaseTargetPoints(nextSet, match.volleyballFormat || 'best-of-5');

    const updatedSetScores: SetScore[] = [
      ...(match.setScores || []),
      {
        set: nextSet,
        homeScore: 0,
        awayScore: 0,
        isCompleted: false,
        targetPoints: nextTarget,
        isDecidingSet: isDecidingSetNumber(nextSet, match.volleyballFormat || 'best-of-5'),
      },
    ];

    const advancedMatch: Match = {
      ...match,
      currentSetNumber: nextSet,
      targetPoints: nextTarget,
      isDeuce: false,
      completedSetPendingAdvance: undefined,
      statusDetail: `SET ${nextSet} (0-0 · TO 25)`,
      homeTeam: { ...match.homeTeam, score: 0 },
      awayTeam: { ...match.awayTeam, score: 0 },
      setScores: updatedSetScores,
    };

    expect(advancedMatch.currentSetNumber).toBe(2);
    expect(advancedMatch.homeTeam.score).toBe(0);
    expect(advancedMatch.awayTeam.score).toBe(0);
    expect(advancedMatch.homeTeam.setsWon).toBe(1);
    expect(advancedMatch.completedSetPendingAdvance).toBeUndefined();
    expect(advancedMatch.setScores?.length).toBe(2);
  });

  it('allows reopening Set 1 from Set 2 with custom score and recalculates sets won', () => {
    // Simulate being in Set 2 with scores 5-3, but admin reopens Set 1 at 24-24
    const format = 'best-of-5';
    const reopenSetNumber = 1;
    const newHomeScore = 24;
    const newAwayScore = 24;

    const evalResult = evaluateVolleyballScore(
      newHomeScore,
      newAwayScore,
      reopenSetNumber,
      format,
      0,
      0
    );

    expect(evalResult.isSetWon).toBe(false);
    expect(evalResult.isDeuce).toBe(true);

    const resumedMatch: Match = {
      ...createMockVolleyballMatch(),
      currentSetNumber: reopenSetNumber,
      status: 'LIVE',
      targetPoints: evalResult.currentTarget,
      isDeuce: evalResult.isDeuce,
      pointSpecialBadge: evalResult.pointSpecialBadge,
      completedSetPendingAdvance: undefined,
      statusDetail: evalResult.statusText,
      homeTeam: {
        id: 'spikers',
        name: 'Spikers',
        shortName: 'SPK',
        logoColor: '#0284c7',
        accentColor: '#38bdf8',
        record: '0-0',
        score: newHomeScore,
        setsWon: 0, // recalculated to 0 because Set 1 is now in progress!
      },
      awayTeam: {
        id: 'aces',
        name: 'Aces',
        shortName: 'ACE',
        logoColor: '#f97316',
        accentColor: '#fb923c',
        record: '0-0',
        score: newAwayScore,
        setsWon: 0,
      },
      setScores: [
        {
          set: 1,
          homeScore: newHomeScore,
          awayScore: newAwayScore,
          isCompleted: false,
          targetPoints: evalResult.currentTarget,
          isDecidingSet: false,
        },
      ],
    };

    expect(resumedMatch.currentSetNumber).toBe(1);
    expect(resumedMatch.homeTeam.score).toBe(24);
    expect(resumedMatch.awayTeam.score).toBe(24);
    expect(resumedMatch.homeTeam.setsWon).toBe(0);
    expect(resumedMatch.isDeuce).toBe(true);
    expect(resumedMatch.targetPoints).toBe(26);
    expect(resumedMatch.status).toBe('LIVE');
  });

  it('re-evaluates match status from FINAL back to LIVE when a deciding set point is overturned', () => {
    // 5-set match where Set 5 was 15-13 (FINAL 3-2), but overturned to 14-14
    const evalResult = evaluateVolleyballScore(
      14,
      14,
      5,
      'best-of-5',
      2, // Home has 2 sets
      2  // Away has 2 sets
    );

    expect(evalResult.isSetWon).toBe(false);
    expect(evalResult.isMatchWon).toBe(false);
    expect(evalResult.isDecidingSet).toBe(true);
    expect(evalResult.isDeuce).toBe(true);
    expect(evalResult.currentTarget).toBe(16); // Deciding set deuce target is 14+2 = 16
  });
});
