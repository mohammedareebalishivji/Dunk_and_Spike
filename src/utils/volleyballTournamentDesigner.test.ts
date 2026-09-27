import { describe, it, expect, beforeEach } from 'vitest';
import {
  getVolleyballTournamentConfig,
  saveVolleyballTournamentConfig,
  resetVolleyballTournamentConfig,
  generateVolleyballLeagueFixtures,
  calculateVolleyballLeagueStandings,
  generateCustomVolleyballBracket,
  DEFAULT_VOLLEYBALL_CONFIG,
  VOLLEYBALL_CONFIG_KEY,
} from './volleyballTournamentDesigner';
import { Match, LeagueFixture } from '../types';

describe('VolleyballTournamentDesigner (Admin Playoff & League Engine)', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {}
  });

  it('loads default tournament configuration when nothing is stored', () => {
    const config = getVolleyballTournamentConfig();
    expect(config.sport).toBe('volleyball');
    expect(config.format).toBe('knockout');
    expect(config.bracketSize).toBe(8);
    expect(config.customTeams.length).toBe(8);
  });

  it('persists admin configuration updates (Knockout vs League and custom teams)', () => {
    const saved = saveVolleyballTournamentConfig({
      format: 'league',
      leagueTeams: ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta'],
    });

    expect(saved.format).toBe('league');
    expect(saved.designedByAdmin).toBe(true);
    expect(saved.leagueTeams?.length).toBe(4);

    const reloaded = getVolleyballTournamentConfig();
    expect(reloaded.format).toBe('league');
    expect(reloaded.leagueTeams).toContain('Team Alpha');
  });

  it('resets tournament configuration to default baseline', () => {
    saveVolleyballTournamentConfig({ format: 'league' });
    const reset = resetVolleyballTournamentConfig();
    expect(reset.format).toBe('knockout');
    expect(reset.bracketSize).toBe(8);
  });

  it('generates round-robin league fixtures for participating teams', () => {
    const teams = ['Phoenix VBC', 'Apex Volleyball', 'Blaze VBC', 'Volley Hawks'];
    const fixtures = generateVolleyballLeagueFixtures(teams);

    // 4 teams -> 3 rounds, 2 matches per round = 6 matches total
    expect(fixtures.length).toBe(6);
    expect(fixtures[0].round).toBe(1);
    expect(fixtures[0].homeTeamName).toBeTruthy();
    expect(fixtures[0].awayTeamName).toBeTruthy();
    expect(fixtures[0].status).toBe('UPCOMING');
  });

  it('calculates official FIVB 3-2-1-0 points table accurately', () => {
    const teams = ['Phoenix VBC', 'Apex Volleyball'];
    const mockFixtures: LeagueFixture[] = [
      {
        id: 'fix-1',
        round: 1,
        matchNumber: 1,
        homeTeamName: 'Phoenix VBC',
        awayTeamName: 'Apex Volleyball',
        homeSetsWon: 3,
        awaySetsWon: 0, // 3-0 win: 3 points to Phoenix, 0 to Apex
        court: 'Court 1',
        status: 'FINAL',
        winner: 'home',
      },
      {
        id: 'fix-2',
        round: 2,
        matchNumber: 2,
        homeTeamName: 'Apex Volleyball',
        awayTeamName: 'Phoenix VBC',
        homeSetsWon: 3,
        awaySetsWon: 2, // 3-2 win: 2 points to Apex, 1 point to Phoenix
        court: 'Court 1',
        status: 'FINAL',
        winner: 'home',
      },
    ];

    const standings = calculateVolleyballLeagueStandings(teams, mockFixtures);
    expect(standings.length).toBe(2);

    const phoenix = standings.find((r) => r.teamName === 'Phoenix VBC')!;
    const apex = standings.find((r) => r.teamName === 'Apex Volleyball')!;

    // Phoenix: 1 win, 1 loss (2-3), 3 + 1 = 4 points
    expect(phoenix.points).toBe(4);
    expect(phoenix.won).toBe(1);
    expect(phoenix.lost).toBe(1);
    expect(phoenix.setsWon).toBe(5);
    expect(phoenix.setsLost).toBe(3);

    // Apex: 1 win (3-2), 1 loss (0-3), 2 + 0 = 2 points
    expect(apex.points).toBe(2);
    expect(apex.won).toBe(1);
    expect(apex.lost).toBe(1);
    expect(apex.setsWon).toBe(3);
    expect(apex.setsLost).toBe(5);

    // Phoenix is Rank 1, Apex is Rank 2
    expect(phoenix.rank).toBe(1);
    expect(apex.rank).toBe(2);
  });

  it('generates a 4-team bracket with Semifinals, Bronze, and Finals when bracketSize is 4', () => {
    const config = {
      ...DEFAULT_VOLLEYBALL_CONFIG,
      bracketSize: 4 as const,
      customTeams: [
        { name: 'Seed1 Team', seed: 1 },
        { name: 'Seed4 Team', seed: 4 },
        { name: 'Seed2 Team', seed: 2 },
        { name: 'Seed3 Team', seed: 3 },
      ],
    };

    const bracket = generateCustomVolleyballBracket(config);
    expect(bracket.nodes.length).toBe(4); // 2 SFs, 1 Bronze, 1 Final

    const qfs = bracket.nodes.filter((n) => n.round === 'quarterfinals');
    const sfs = bracket.nodes.filter((n) => n.round === 'semifinals');
    const bronze = bracket.nodes.find((n) => n.round === 'third_place');
    const finals = bracket.nodes.find((n) => n.round === 'finals');

    expect(qfs.length).toBe(0);
    expect(sfs.length).toBe(2);
    expect(bronze).toBeDefined();
    expect(finals).toBeDefined();

    expect(sfs[0].homeTeamName).toBe('Seed1 Team');
    expect(sfs[0].awayTeamName).toBe('Seed4 Team');
    expect(sfs[1].homeTeamName).toBe('Seed2 Team');
    expect(sfs[1].awayTeamName).toBe('Seed3 Team');
  });
});
