import { describe, it, expect } from 'vitest';
import { endMatchWithWinner } from './endMatch';
import { calculateVolleyballStandings } from './volleyballStandings';
import { calculateBasketballStandings } from './basketballStandings';
import { Match } from '../types';

describe('endMatchWithWinner', () => {
  const baseVolleyballMatch: Match = {
    id: 'match-vb-1',
    sport: 'volleyball',
    title: 'Men\'s Finals',
    division: 'Division 1',
    status: 'LIVE',
    statusDetail: 'LIVE SET 3 (18-16)',
    court: 'Court 1',
    venue: 'Main Arena',
    currentSetNumber: 3,
    targetPoints: 25,
    volleyballFormat: 'best-of-5',
    homeTeam: {
      id: 'team-home',
      name: 'Thunder Spikers',
      shortName: 'THU',
      logoColor: '#0284c7',
      accentColor: '#38bdf8',
      record: '3-0',
      score: 18,
      setsWon: 2,
    },
    awayTeam: {
      id: 'team-away',
      name: 'Viper Smashers',
      shortName: 'VIP',
      logoColor: '#f97316',
      accentColor: '#fb923c',
      record: '2-1',
      score: 16,
      setsWon: 1,
    },
    setScores: [
      { set: 1, homeScore: 25, awayScore: 22, isCompleted: true, targetPoints: 25, isDecidingSet: false, winner: 'home' },
      { set: 2, homeScore: 21, awayScore: 25, isCompleted: true, targetPoints: 25, isDecidingSet: false, winner: 'away' },
      { set: 3, homeScore: 18, awayScore: 16, isCompleted: false, targetPoints: 25, isDecidingSet: false },
    ],
  };

  it('declares team with most set wins as winner and awards +1 point on scoreboard', () => {
    const result = endMatchWithWinner(baseVolleyballMatch);

    expect(result.winnerSide).toBe('home');
    expect(result.winnerName).toBe('Thunder Spikers');
    expect(result.updatedMatch.status).toBe('FINAL');
    expect(result.updatedMatch.statusDetail).toContain('THUNDER SPIKERS WINS');
    
    // Home had 2 sets won, away had 1 set won -> home wins (2-1)
    expect(result.updatedMatch.homeTeam.setsWon).toBe(2);
    expect(result.updatedMatch.awayTeam.setsWon).toBe(1);

    // +1 point awarded to home score on scoreboard (18 + 1 = 19)
    expect(result.updatedMatch.homeTeam.score).toBe(19);
    expect(result.updatedMatch.awayTeam.score).toBe(16);

    // Current set in setScores has the +1 point (18 + 1 = 19)
    const set3 = result.updatedMatch.setScores?.find(s => s.set === 3);
    expect(set3?.homeScore).toBe(19);
    expect(set3?.awayScore).toBe(16);
    expect(set3?.isCompleted).toBe(true);
  });

  it('awards standings win, FIVB points, and +1 point to ptsWon in volleyball standings', () => {
    const result = endMatchWithWinner(baseVolleyballMatch);
    const standings = calculateVolleyballStandings([result.updatedMatch]);

    const homeStanding = standings.find(s => s.teamName === 'Thunder Spikers');
    const awayStanding = standings.find(s => s.teamName === 'Viper Smashers');

    expect(homeStanding).toBeDefined();
    expect(awayStanding).toBeDefined();

    // Home gets the match win
    expect(homeStanding?.wins).toBe(1);
    expect(homeStanding?.losses).toBe(0);
    expect(awayStanding?.wins).toBe(0);
    expect(awayStanding?.losses).toBe(1);

    // Home won 2-1: gets 2 FIVB points, away gets 1
    expect(homeStanding?.fivbPoints).toBe(2);
    expect(awayStanding?.fivbPoints).toBe(1);

    // Home ptsWon includes Set 1 (25) + Set 2 (21) + Set 3 (19) = 65
    expect(homeStanding?.ptsWon).toBe(25 + 21 + 19);
    expect(awayStanding?.ptsWon).toBe(22 + 25 + 16);
  });

  it('handles tied sets by breaking tie with current set score, granting decisive set win and +1 point', () => {
    const tiedSetsMatch: Match = {
      ...baseVolleyballMatch,
      homeTeam: { ...baseVolleyballMatch.homeTeam, setsWon: 1, score: 20 },
      awayTeam: { ...baseVolleyballMatch.awayTeam, setsWon: 1, score: 18 },
      setScores: [
        { set: 1, homeScore: 25, awayScore: 20, isCompleted: true, targetPoints: 25, isDecidingSet: false, winner: 'home' },
        { set: 2, homeScore: 20, awayScore: 25, isCompleted: true, targetPoints: 25, isDecidingSet: false, winner: 'away' },
        { set: 3, homeScore: 20, awayScore: 18, isCompleted: false, targetPoints: 25, isDecidingSet: true },
      ],
    };

    const result = endMatchWithWinner(tiedSetsMatch);

    // Home was leading 20-18 in current set, so home is awarded the set win (setsWon goes from 1 to 2)
    expect(result.winnerSide).toBe('home');
    expect(result.updatedMatch.homeTeam.setsWon).toBe(2);
    expect(result.updatedMatch.awayTeam.setsWon).toBe(1);

    // +1 point awarded to home team (20 + 1 = 21)
    expect(result.updatedMatch.homeTeam.score).toBe(21);
    expect(result.updatedMatch.awayTeam.score).toBe(18);

    const standings = calculateVolleyballStandings([result.updatedMatch]);
    const homeStanding = standings.find(s => s.teamName === 'Thunder Spikers');
    expect(homeStanding?.wins).toBe(1);
    expect(homeStanding?.setsWon).toBe(2);
    expect(homeStanding?.ptsWon).toBe(25 + 20 + 21);
  });

  it('handles basketball match ending with +1 point awarded and reflected in standings', () => {
    const basketballMatch: Match = {
      id: 'match-bb-1',
      sport: 'basketball',
      title: 'City Championship',
      division: 'Varsity',
      status: 'LIVE',
      statusDetail: 'LIVE Q4 (75-72)',
      court: 'Main Court',
      venue: 'Arena Center',
      basketballPeriod: 'Q4',
      homeTeam: {
        id: 'team-celtics',
        name: 'Boston Titans',
        shortName: 'BOS',
        logoColor: '#059669',
        accentColor: '#10b981',
        record: '5-1',
        score: 75,
        quarterScores: [20, 18, 22, 15],
      },
      awayTeam: {
        id: 'team-lakers',
        name: 'LA Dynamos',
        shortName: 'LAD',
        logoColor: '#7c3aed',
        accentColor: '#a855f7',
        record: '4-2',
        score: 72,
        quarterScores: [18, 20, 20, 14],
      },
    };

    const result = endMatchWithWinner(basketballMatch);

    expect(result.winnerSide).toBe('home');
    expect(result.winnerName).toBe('Boston Titans');
    expect(result.updatedMatch.status).toBe('FINAL');
    expect(result.updatedMatch.homeTeam.score).toBe(76); // 75 + 1
    expect(result.updatedMatch.awayTeam.score).toBe(72);
    expect(result.updatedMatch.homeTeam.quarterScores).toEqual([20, 18, 22, 16]); // last quarter + 1

    const standings = calculateBasketballStandings([result.updatedMatch]);
    const homeStanding = standings.find(s => s.teamName === 'Boston Titans');
    expect(homeStanding?.wins).toBe(1);
    expect(homeStanding?.ptsFor).toBe(76);
  });
});
