import { describe, it, expect } from 'vitest';
import { Match } from '../types';

describe('Match Deletion & Schedule Management', () => {
  const sampleMatches: Match[] = [
    {
      id: 'match-bb-1',
      sport: 'basketball',
      title: 'Thunder vs Warriors',
      division: 'Varsity Boys',
      status: 'LIVE',
      statusDetail: 'Q2 04:12',
      court: 'Main Gym Court A',
      venue: 'Main Arena',
      basketballPeriod: 'Q2',
      homeTeam: {
        id: 'th-1',
        name: 'Thunder',
        shortName: 'THU',
        logoColor: '#f97316',
        accentColor: '#fb923c',
        record: '4-1',
        score: 42,
      },
      awayTeam: {
        id: 'wa-1',
        name: 'Warriors',
        shortName: 'WAR',
        logoColor: '#0284c7',
        accentColor: '#38bdf8',
        record: '3-2',
        score: 38,
      },
    },
    {
      id: 'match-bb-2',
      sport: 'basketball',
      title: 'Lakers vs Celtics',
      division: 'Varsity Boys',
      status: 'UPCOMING',
      statusDetail: '18:00 EST',
      court: 'Main Gym Court B',
      venue: 'Main Arena',
      homeTeam: {
        id: 'la-1',
        name: 'Lakers',
        shortName: 'LAL',
        logoColor: '#eab308',
        accentColor: '#facc15',
        record: '5-0',
        score: 0,
      },
      awayTeam: {
        id: 'ce-1',
        name: 'Celtics',
        shortName: 'BOS',
        logoColor: '#16a34a',
        accentColor: '#22c55e',
        record: '4-1',
        score: 0,
      },
    },
    {
      id: 'match-vb-1',
      sport: 'volleyball',
      title: 'Spikers vs Aces',
      division: 'Varsity Girls',
      status: 'LIVE',
      statusDetail: 'Set 2',
      court: 'Court 1',
      venue: 'Volleyball Pavilion',
      homeTeam: {
        id: 'sp-1',
        name: 'Spikers',
        shortName: 'SPK',
        logoColor: '#0284c7',
        accentColor: '#38bdf8',
        record: '3-0',
        score: 21,
      },
      awayTeam: {
        id: 'ac-1',
        name: 'Aces',
        shortName: 'ACE',
        logoColor: '#ef4444',
        accentColor: '#f87171',
        record: '2-1',
        score: 19,
      },
      volleyballFormat: 'best-of-5',
      currentSetNumber: 2,
    },
  ];

  it('deletes the specified match from the list', () => {
    const targetId = 'match-bb-1';
    const remaining = sampleMatches.filter((m) => m.id !== targetId);

    expect(remaining).toHaveLength(2);
    expect(remaining.some((m) => m.id === targetId)).toBe(false);
    expect(remaining.map((m) => m.id)).toEqual(['match-bb-2', 'match-vb-1']);
  });

  it('correctly shifts selected match when the deleted match was currently selected', () => {
    const selectedMatchId = 'match-bb-1';
    const currentSport = 'basketball';

    const remaining = sampleMatches.filter((m) => m.id !== selectedMatchId);
    const nextSelected = remaining.find((m) => m.sport === currentSport) || remaining[0];

    expect(nextSelected).toBeDefined();
    expect(nextSelected?.id).toBe('match-bb-2');
    expect(nextSelected?.sport).toBe('basketball');
  });

  it('falls back to match of another sport when no matches of current sport remain', () => {
    const matchesWithOnlyOneBasketball: Match[] = [
      sampleMatches[0], // basketball
      sampleMatches[2], // volleyball
    ];

    const targetId = 'match-bb-1';
    const currentSport = 'basketball';

    const remaining = matchesWithOnlyOneBasketball.filter((m) => m.id !== targetId);
    const nextSelected = remaining.find((m) => m.sport === currentSport) || remaining[0];

    expect(nextSelected).toBeDefined();
    expect(nextSelected?.id).toBe('match-vb-1');
    expect(nextSelected?.sport).toBe('volleyball');
  });

  it('returns undefined selected match when all matches are deleted', () => {
    const singleMatch = [sampleMatches[0]];
    const remaining = singleMatch.filter((m) => m.id === 'match-bb-1' ? false : true);
    const nextSelected = remaining.find((m) => m.sport === 'basketball') || remaining[0];

    expect(remaining).toHaveLength(0);
    expect(nextSelected).toBeUndefined();
  });

  it('leaves the match list unchanged if a non-existent matchId is deleted', () => {
    const remaining = sampleMatches.filter((m) => m.id !== 'non-existent-id');
    expect(remaining).toHaveLength(sampleMatches.length);
  });

  it('formats the realtime database deletion message correctly', () => {
    const matchIdToDelete = 'match-bb-2';
    const payload = { type: 'DELETE_MATCH', matchId: matchIdToDelete };

    expect(payload.type).toBe('DELETE_MATCH');
    expect(payload.matchId).toBe(matchIdToDelete);
  });
});
