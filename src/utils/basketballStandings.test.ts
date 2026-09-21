import { describe, it, expect } from 'vitest';
import { calculateBasketballStandings, getBasketballPlayerLeaders } from './basketballStandings';
import { Match } from '../types';

describe('basketballStandings', () => {
  const createMatch = (
    id: string,
    homeName: string,
    awayName: string,
    homeScore: number,
    awayScore: number,
    isFinal: boolean = true
  ): Match => ({
    id,
    sport: 'basketball',
    title: `${homeName} vs ${awayName}`,
    division: 'Varsity Boys',
    venue: 'Main Arena',
    court: 'Court 1',
    status: isFinal ? 'FINAL' : 'LIVE',
    statusDetail: isFinal ? `FINAL (${homeScore}-${awayScore})` : 'Q3',
    homeTeam: {
      id: homeName.toLowerCase().replace(/\s+/g, '-'),
      name: homeName,
      shortName: homeName.substring(0, 3).toUpperCase(),
      logoColor: '#f97316',
      accentColor: '#fb923c',
      record: '0-0',
      score: homeScore,
      players: [
        {
          id: `p-${homeName}-1`,
          name: `${homeName} Star`,
          number: 23,
          position: 'Point Guard',
          points: Math.floor(homeScore * 0.4),
          twoPointers: Math.floor(homeScore * 0.1),
          threePointers: 4,
          freeThrows: 2,
          assists: 8,
          rebounds: 5,
        },
      ],
    },
    awayTeam: {
      id: awayName.toLowerCase().replace(/\s+/g, '-'),
      name: awayName,
      shortName: awayName.substring(0, 3).toUpperCase(),
      logoColor: '#0284c7',
      accentColor: '#38bdf8',
      record: '0-0',
      score: awayScore,
      players: [
        {
          id: `p-${awayName}-1`,
          name: `${awayName} Shooter`,
          number: 30,
          position: 'Shooting Guard',
          points: Math.floor(awayScore * 0.4),
          twoPointers: Math.floor(awayScore * 0.1),
          threePointers: 6,
          freeThrows: 1,
          assists: 4,
          rebounds: 7,
        },
      ],
    },
  });

  it('calculates win percentage and sorts basketball standings accordingly', () => {
    const matches: Match[] = [
      createMatch('m1', 'Warriors', 'Celtics', 105, 95),
      createMatch('m2', 'Warriors', 'Lakers', 110, 100),
      createMatch('m3', 'Lakers', 'Celtics', 98, 92),
    ];

    const standings = calculateBasketballStandings(matches);
    expect(standings.length).toBe(3);

    // Warriors: 2-0 (1.000)
    expect(standings[0].teamName).toBe('Warriors');
    expect(standings[0].wins).toBe(2);
    expect(standings[0].losses).toBe(0);
    expect(standings[0].winPctString).toBe('1.000');
    expect(standings[0].gb).toBe('-');

    // Lakers: 1-1 (.500)
    expect(standings[1].teamName).toBe('Lakers');
    expect(standings[1].wins).toBe(1);
    expect(standings[1].losses).toBe(1);
    expect(standings[1].winPctString).toBe('.500');
    expect(standings[1].gb).toBe('1');

    // Celtics: 0-2 (.000)
    expect(standings[2].teamName).toBe('Celtics');
    expect(standings[2].wins).toBe(0);
    expect(standings[2].losses).toBe(2);
    expect(standings[2].winPctString).toBe('.000');
    expect(standings[2].gb).toBe('2');
  });

  it('handles point differential tiebreakers when win percentages are identical', () => {
    const matches: Match[] = [
      createMatch('m1', 'Bulls', 'Hawks', 110, 90), // Bulls +20
      createMatch('m2', 'Nets', 'Hawks', 100, 95),  // Nets +5
    ];

    const standings = calculateBasketballStandings(matches);
    expect(standings[0].teamName).toBe('Bulls');
    expect(standings[0].diff).toBe(20);
    expect(standings[1].teamName).toBe('Nets');
    expect(standings[1].diff).toBe(5);
  });

  it('ignores live or upcoming matches from official standing record calculation', () => {
    const matches: Match[] = [
      createMatch('m1', 'Spurs', 'Rockets', 102, 98, true),
      createMatch('m2', 'Rockets', 'Spurs', 85, 80, false), // LIVE match
    ];

    const standings = calculateBasketballStandings(matches);
    const spurs = standings.find(s => s.teamName === 'Spurs');
    expect(spurs?.gp).toBe(1);
    expect(spurs?.wins).toBe(1);
  });

  it('identifies top player leaders in points, 3-pointers, assists, and rebounds', () => {
    const matches: Match[] = [
      createMatch('m1', 'Warriors', 'Celtics', 105, 95),
    ];

    const leaders = getBasketballPlayerLeaders(matches);
    expect(leaders.scoringLeaders.length).toBeGreaterThan(0);
    expect(leaders.threePointLeaders.length).toBeGreaterThan(0);
    expect(leaders.assistLeaders.length).toBeGreaterThan(0);
    expect(leaders.reboundLeaders.length).toBeGreaterThan(0);

    // Shooter from Celtics had 6 three-pointers
    expect(leaders.threePointLeaders[0].threePointers).toBe(6);
    // Star from Warriors had 8 assists
    expect(leaders.assistLeaders[0].assists).toBe(8);
  });
});
