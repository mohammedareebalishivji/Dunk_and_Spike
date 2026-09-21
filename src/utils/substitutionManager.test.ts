import { describe, it, expect } from 'vitest';
import { 
  getOnCourtPlayers, 
  getBenchPlayers, 
  executeSubstitution, 
  resetSetSubstitutions,
  MAX_VOLLEYBALL_SUBS_PER_SET
} from './substitutionManager';
import { Team, Player } from '../types';

const createMockTeam = (numPlayers = 8, sport: 'volleyball' | 'basketball' = 'volleyball', subsUsed = 0): Team => {
  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    id: `p-${i + 1}`,
    name: `Player ${i + 1}`,
    number: (i + 1) * 2,
    position: i === 0 ? 'Setter' : 'Spiker',
    points: 0,
    isOnCourt: i < (sport === 'volleyball' ? 6 : 5),
  }));

  return {
    id: 'team-1',
    name: 'Thunder Spikers',
    shortName: 'THU',
    logoColor: '#f97316',
    accentColor: '#fb923c',
    record: '0-0',
    score: 0,
    players,
    substitutionsUsed: subsUsed,
  };
};

describe('substitutionManager', () => {
  describe('getOnCourtPlayers & getBenchPlayers', () => {
    it('returns on-court and bench players based on explicit isOnCourt property', () => {
      const team = createMockTeam(8, 'volleyball');
      const onCourt = getOnCourtPlayers(team.players, 'volleyball');
      const bench = getBenchPlayers(team.players, 'volleyball');

      expect(onCourt.length).toBe(6);
      expect(bench.length).toBe(2);
      expect(onCourt.every(p => p.isOnCourt === true)).toBe(true);
      expect(bench.every(p => p.isOnCourt === false)).toBe(true);
    });

    it('falls back to default slice if isOnCourt is not explicitly defined', () => {
      const untaggedPlayers: Player[] = Array.from({ length: 8 }, (_, i) => ({
        id: `p-${i + 1}`,
        name: `Player ${i + 1}`,
        number: i + 1,
        position: 'Guard',
        points: 0,
      }));

      const onCourtVolleyball = getOnCourtPlayers(untaggedPlayers, 'volleyball');
      expect(onCourtVolleyball.length).toBe(6);

      const onCourtBasketball = getOnCourtPlayers(untaggedPlayers, 'basketball');
      expect(onCourtBasketball.length).toBe(5);

      const benchBasketball = getBenchPlayers(untaggedPlayers, 'basketball');
      expect(benchBasketball.length).toBe(3);
    });
  });

  describe('executeSubstitution', () => {
    it('executes substitution and updates player states and substitution count', () => {
      const team = createMockTeam(8, 'volleyball', 0);
      const playerOutId = team.players![0].id; // Player 1
      const playerIn = team.players![6]; // Player 7 from bench

      const result = executeSubstitution(team, playerOutId, playerIn, 'volleyball', '10:00');

      expect(result.success).toBe(true);
      expect(result.updatedTeam.substitutionsUsed).toBe(1);

      const updatedOut = result.updatedTeam.players?.find(p => p.id === playerOutId);
      const updatedIn = result.updatedTeam.players?.find(p => p.id === playerIn.id);

      expect(updatedOut?.isOnCourt).toBe(false);
      expect(updatedOut?.subbedOutAt).toBe('10:00');

      expect(updatedIn?.isOnCourt).toBe(true);
      expect(updatedIn?.subbedInAt).toBe('10:00');

      expect(result.eventDescription).toContain('Player 7');
      expect(result.eventDescription).toContain('Player 1');
      expect(result.eventDescription).toContain('Subs: 1/6');
    });

    it('prevents substituting a player for themselves', () => {
      const team = createMockTeam(8, 'volleyball');
      const player = team.players![0];

      const result = executeSubstitution(team, player.id, player, 'volleyball');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot substitute a player for themselves');
    });

    it('enforces FIVB Rule 15.6 limit of 6 substitutions per set for volleyball', () => {
      const team = createMockTeam(8, 'volleyball', MAX_VOLLEYBALL_SUBS_PER_SET);
      const playerOutId = team.players![0].id;
      const playerIn = team.players![6];

      const result = executeSubstitution(team, playerOutId, playerIn, 'volleyball');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Limit Reached');
      expect(result.error).toContain('Maximum 6 substitutions');
      expect(result.updatedTeam.substitutionsUsed).toBe(6);
    });

    it('allows substitutions beyond 6 for basketball', () => {
      const team = createMockTeam(8, 'basketball', 10);
      const playerOutId = team.players![0].id;
      const playerIn = team.players![6];

      const result = executeSubstitution(team, playerOutId, playerIn, 'basketball');
      expect(result.success).toBe(true);
      expect(result.updatedTeam.substitutionsUsed).toBe(11);
    });

    it('handles substituting in a new substitute who is not yet in the team roster', () => {
      const team = createMockTeam(6, 'volleyball', 1);
      const newSub: Player = {
        id: 'p-new-sub',
        name: 'New Registered Sub',
        number: 99,
        position: 'Libero',
        points: 0,
      };

      const result = executeSubstitution(team, team.players![0].id, newSub, 'volleyball');
      expect(result.success).toBe(true);
      expect(result.updatedTeam.players?.length).toBe(7);
      const added = result.updatedTeam.players?.find(p => p.id === 'p-new-sub');
      expect(added).toBeDefined();
      expect(added?.isOnCourt).toBe(true);
    });
  });

  describe('resetSetSubstitutions', () => {
    it('resets substitutionsUsed to 0 for a new set', () => {
      const team = createMockTeam(8, 'volleyball', 5);
      expect(team.substitutionsUsed).toBe(5);

      const reset = resetSetSubstitutions(team);
      expect(reset.substitutionsUsed).toBe(0);
    });
  });
});
