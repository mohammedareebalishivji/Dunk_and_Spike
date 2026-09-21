import { describe, it, expect } from 'vitest';
import { calculateVolleyballStandings, getVolleyballPlayerLeaders } from './volleyballStandings';
import { Match } from '../types';

describe('volleyballStandings', () => {
  const createVolleyballMatch = (
    id: string,
    homeName: string,
    awayName: string,
    homeSets: number,
    awaySets: number,
    setDetails: { homeScore: number; awayScore: number }[],
    isFinal: boolean = true
  ): Match => ({
    id,
    sport: 'volleyball',
    title: `${homeName} vs ${awayName}`,
    division: 'Varsity Girls',
    venue: 'Volleyball Pavilion',
    court: 'Court 1',
    status: isFinal ? 'FINAL' : 'LIVE',
    statusDetail: isFinal ? `FINAL (${homeSets}-${awaySets})` : 'Set 2',
    volleyballFormat: 'best-of-5',
    currentSetNumber: homeSets + awaySets,
    setScores: setDetails.map((s, idx) => ({
      set: idx + 1,
      homeScore: s.homeScore,
      awayScore: s.awayScore,
      isCompleted: true,
      targetPoints: 25,
      isDecidingSet: idx === 4,
    })),
    homeTeam: {
      id: homeName.toLowerCase().replace(/\s+/g, '-'),
      name: homeName,
      shortName: homeName.substring(0, 3).toUpperCase(),
      logoColor: '#0284c7',
      accentColor: '#38bdf8',
      record: '0-0',
      score: setDetails[setDetails.length - 1]?.homeScore || 0,
      setsWon: homeSets,
      players: [
        {
          id: `p-${homeName}-1`,
          name: `${homeName} Spiker`,
          number: 10,
          position: 'Outside Hitter',
          points: 18,
          kills: 14,
          aces: 2,
          blocks: 2,
        },
      ],
    },
    awayTeam: {
      id: awayName.toLowerCase().replace(/\s+/g, '-'),
      name: awayName,
      shortName: awayName.substring(0, 3).toUpperCase(),
      logoColor: '#f97316',
      accentColor: '#fb923c',
      record: '0-0',
      score: setDetails[setDetails.length - 1]?.awayScore || 0,
      setsWon: awaySets,
      players: [
        {
          id: `p-${awayName}-1`,
          name: `${awayName} Blocker`,
          number: 7,
          position: 'Middle Blocker',
          points: 12,
          kills: 6,
          aces: 1,
          blocks: 5,
        },
      ],
    },
  });

  it('allocates 3 FIVB points for a 3-0 or 3-1 victory and 0 points for the loser', () => {
    // 3-1 win for Spikers against Diggers
    const match = createVolleyballMatch(
      'm1',
      'Spikers',
      'Diggers',
      3,
      1,
      [
        { homeScore: 25, awayScore: 20 },
        { homeScore: 25, awayScore: 22 },
        { homeScore: 20, awayScore: 25 },
        { homeScore: 25, awayScore: 18 },
      ]
    );

    const standings = calculateVolleyballStandings([match]);
    const spikers = standings.find(s => s.teamName === 'Spikers');
    const diggers = standings.find(s => s.teamName === 'Diggers');

    expect(spikers?.wins).toBe(1);
    expect(spikers?.fivbPoints).toBe(3);
    expect(diggers?.wins).toBe(0);
    expect(diggers?.fivbPoints).toBe(0);
  });

  it('allocates 2 FIVB points for a 3-2 tiebreak victory and 1 point for the 2-3 loser', () => {
    // 3-2 win for Blockers against Aces
    const match = createVolleyballMatch(
      'm2',
      'Blockers',
      'Aces',
      3,
      2,
      [
        { homeScore: 25, awayScore: 23 },
        { homeScore: 21, awayScore: 25 },
        { homeScore: 25, awayScore: 19 },
        { homeScore: 22, awayScore: 25 },
        { homeScore: 15, awayScore: 13 },
      ]
    );

    const standings = calculateVolleyballStandings([match]);
    const blockers = standings.find(s => s.teamName === 'Blockers');
    const aces = standings.find(s => s.teamName === 'Aces');

    expect(blockers?.wins).toBe(1);
    expect(blockers?.fivbPoints).toBe(2);
    expect(aces?.wins).toBe(0);
    expect(aces?.fivbPoints).toBe(1);
  });

  it('ranks by Matches Won first, then by FIVB Points according to official FIVB regulations', () => {
    // Team A: 1 Win, 3-2 (2 FIVB points)
    const match1 = createVolleyballMatch('m1', 'Team A', 'Team C', 3, 2, [
      { homeScore: 25, awayScore: 20 },
      { homeScore: 20, awayScore: 25 },
      { homeScore: 25, awayScore: 20 },
      { homeScore: 20, awayScore: 25 },
      { homeScore: 15, awayScore: 10 },
    ]);

    // Team B: 1 Win, 3-0 (3 FIVB points)
    const match2 = createVolleyballMatch('m2', 'Team B', 'Team C', 3, 0, [
      { homeScore: 25, awayScore: 15 },
      { homeScore: 25, awayScore: 18 },
      { homeScore: 25, awayScore: 16 },
    ]);

    const standings = calculateVolleyballStandings([match1, match2]);
    // Both have 1 win, Team B has 3 FIVB points vs Team A's 2 FIVB points
    expect(standings[0].teamName).toBe('Team B');
    expect(standings[0].fivbPoints).toBe(3);
    expect(standings[1].teamName).toBe('Team A');
    expect(standings[1].fivbPoints).toBe(2);
  });

  it('calculates volleyball player leaders in kills, aces, blocks, and total points', () => {
    const match = createVolleyballMatch('m1', 'Spikers', 'Blockers', 3, 1, [
      { homeScore: 25, awayScore: 20 },
      { homeScore: 25, awayScore: 22 },
      { homeScore: 20, awayScore: 25 },
      { homeScore: 25, awayScore: 18 },
    ]);

    const leaders = getVolleyballPlayerLeaders([match]);
    expect(leaders.scoringLeaders.length).toBeGreaterThan(0);
    expect(leaders.killLeaders.length).toBeGreaterThan(0);
    expect(leaders.blockLeaders.length).toBeGreaterThan(0);
    expect(leaders.aceLeaders.length).toBeGreaterThan(0);

    // Spiker from Spikers: 14 kills
    expect(leaders.killLeaders[0].kills).toBe(14);
    // Blocker from Blockers: 5 blocks
    expect(leaders.blockLeaders[0].blocks).toBe(5);
  });
});
