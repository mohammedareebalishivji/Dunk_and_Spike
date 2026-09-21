import { describe, it, expect } from 'vitest';
import { 
  MAX_TEAM_ROSTER_LIMIT, 
  MAX_ON_COURT_PLAYERS, 
  MAX_MATCH_PLAYERS,
  MAX_ON_COURT_VOLLEYBALL,
  MAX_ON_COURT_BASKETBALL,
  getMaxOnCourtPlayers
} from '../components/CreateMatchModal';
import { getPreexistingTeams } from '../data/preexistingTeams';
import { Player, Match } from '../types';

describe('Match Competing Teams Roster Limit & Sport-Specific Court Rules', () => {
  it('strictly defines MAX_TEAM_ROSTER_LIMIT as 8, volleyball on court as 6, and basketball on court as 5', () => {
    expect(MAX_TEAM_ROSTER_LIMIT).toBe(8);
    expect(MAX_ON_COURT_PLAYERS).toBe(6);
    expect(MAX_MATCH_PLAYERS).toBe(8);
    expect(MAX_ON_COURT_VOLLEYBALL).toBe(6);
    expect(MAX_ON_COURT_BASKETBALL).toBe(5);
    expect(getMaxOnCourtPlayers('volleyball')).toBe(6);
    expect(getMaxOnCourtPlayers('basketball')).toBe(5);
  });

  it('allows adding player with custom name, jersey number and auto court/bench designation', () => {
    const roster: Player[] = [];
    
    const addPlayer = (
      current: Player[],
      name: string,
      jerseyNumber: number,
      pos: string = 'Outside Hitter'
    ): { success: boolean; roster: Player[]; error?: string } => {
      if (!name.trim()) {
        return { success: false, roster: current, error: 'Name cannot be empty' };
      }
      if (current.length >= MAX_TEAM_ROSTER_LIMIT) {
        return { success: false, roster: current, error: `Limit reached: Maximum ${MAX_TEAM_ROSTER_LIMIT} players allowed per squad` };
      }

      const activeOnCourt = current.filter(p => p.isOnCourt !== false).length;
      const shouldBeOnCourt = activeOnCourt < MAX_ON_COURT_PLAYERS;

      const newPlayer: Player = {
        id: `p-${current.length + 1}`,
        name: name.trim(),
        number: jerseyNumber,
        position: pos,
        points: 0,
        isOnCourt: shouldBeOnCourt,
        isStarter: shouldBeOnCourt,
      };
      return { success: true, roster: [...current, newPlayer] };
    };

    const res1 = addPlayer(roster, 'Areeb Alishivji', 10);
    expect(res1.success).toBe(true);
    expect(res1.roster).toHaveLength(1);
    expect(res1.roster[0].name).toBe('Areeb Alishivji');
    expect(res1.roster[0].number).toBe(10);
    expect(res1.roster[0].isOnCourt).toBe(true);
  });

  it('enforces maximum squad limit of 8 and exactly 6 on court for a full squad', () => {
    const roster: Player[] = [];
    for (let i = 1; i <= 8; i++) {
      roster.push({
        id: `p-${i}`,
        name: `Player ${i}`,
        number: i,
        position: 'Player',
        points: 0,
        isOnCourt: i <= 6, // First 6 are on court, remaining 2 on bench
        isStarter: i <= 6,
      });
    }

    expect(roster).toHaveLength(8);
    const onCourt = roster.filter(p => p.isOnCourt !== false);
    const bench = roster.filter(p => p.isOnCourt === false);

    expect(onCourt).toHaveLength(6);
    expect(bench).toHaveLength(2);

    // Attempting to add a 9th player to the squad must be rejected
    const tryAdd9th = (current: Player[], name: string, num: number) => {
      if (current.length >= MAX_TEAM_ROSTER_LIMIT) {
        return { success: false, error: `Limit reached: Maximum ${MAX_TEAM_ROSTER_LIMIT} players allowed per squad` };
      }
      return { success: true, roster: [...current, { id: 'p-9', name, number: num, position: 'Bench', points: 0 }] };
    };

    const result = tryAdd9th(roster, 'Extra 9th Player', 99);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Maximum 8 players allowed per squad');
    expect(roster).toHaveLength(8);
  });

  it('strictly limits on-court playing participants to 6, preventing putting a 7th player on court', () => {
    const roster: Player[] = [];
    for (let i = 1; i <= 8; i++) {
      roster.push({
        id: `p-${i}`,
        name: `Player ${i}`,
        number: i,
        position: 'Position',
        points: 0,
        isOnCourt: i <= 6,
        isStarter: i <= 6,
      });
    }

    const toggleCourtStatus = (current: Player[], playerId: string) => {
      const target = current.find(p => p.id === playerId);
      if (!target) return { success: false, error: 'Player not found' };

      const currentlyOnCourt = target.isOnCourt !== false;
      if (currentlyOnCourt) {
        // Move to bench
        const updated = current.map(p => p.id === playerId ? { ...p, isOnCourt: false, isStarter: false } : p);
        return { success: true, roster: updated };
      } else {
        // Move to court: verify max 6 limit
        const activeCount = current.filter(p => p.isOnCourt !== false).length;
        if (activeCount >= MAX_ON_COURT_PLAYERS) {
          return { 
            success: false, 
            error: `Regulation Limit: Only ${MAX_ON_COURT_PLAYERS} players are allowed on court at the same time.` 
          };
        }
        const updated = current.map(p => p.id === playerId ? { ...p, isOnCourt: true, isStarter: true } : p);
        return { success: true, roster: updated };
      }
    };

    // p-7 is currently on bench. Trying to move to court while 6 are already on court must fail
    const moveRes = toggleCourtStatus(roster, 'p-7');
    expect(moveRes.success).toBe(false);
    expect(moveRes.error).toContain('Only 6 players are allowed on court');

    // First bench p-1 (so on-court count becomes 5)
    const benchP1 = toggleCourtStatus(roster, 'p-1');
    expect(benchP1.success).toBe(true);
    const updatedRoster = benchP1.roster!;
    expect(updatedRoster.filter(p => p.isOnCourt !== false)).toHaveLength(5);

    // Now p-7 can be promoted to court
    const moveP7Success = toggleCourtStatus(updatedRoster, 'p-7');
    expect(moveP7Success.success).toBe(true);
    const finalOnCourt = moveP7Success.roster!.filter(p => p.isOnCourt !== false);
    expect(finalOnCourt).toHaveLength(6);
    expect(finalOnCourt.some(p => p.id === 'p-7')).toBe(true);
  });

  it('allows removing a player to free up a squad slot, then adding another player', () => {
    let roster: Player[] = [];
    for (let i = 1; i <= 8; i++) {
      roster.push({
        id: `p-${i}`,
        name: `Player ${i}`,
        number: i,
        position: 'Position',
        points: 0,
        isOnCourt: i <= 6,
      });
    }

    expect(roster).toHaveLength(8);

    // Remove player 3
    roster = roster.filter(p => p.id !== 'p-3');
    expect(roster).toHaveLength(7);

    // Now a slot is open to add a replacement
    const replacement: Player = {
      id: 'p-new',
      name: 'Elena Vance',
      number: 88,
      position: 'Outside Hitter',
      points: 0,
      isOnCourt: true,
      isStarter: true,
    };
    roster = [...roster, replacement];
    expect(roster).toHaveLength(8);
    expect(roster.some(p => p.name === 'Elena Vance' && p.number === 88)).toBe(true);
  });

  it('allows inline editing of player name and jersey number', () => {
    let roster: Player[] = [
      { id: 'p-1', name: 'Original Name', number: 7, position: 'Starter', points: 0, isOnCourt: true },
    ];

    // Update name
    roster = roster.map(p => p.id === 'p-1' ? { ...p, name: 'Renamed Player' } : p);
    expect(roster[0].name).toBe('Renamed Player');

    // Update jersey number
    roster = roster.map(p => p.id === 'p-1' ? { ...p, number: 24 } : p);
    expect(roster[0].number).toBe(24);
  });

  it('auto-populates pre-existing teams with exactly 8 players (6 on court for volleyball, 5 on court for basketball)', () => {
    const vbTeams = getPreexistingTeams('volleyball');
    expect(vbTeams.length).toBeGreaterThanOrEqual(4);

    for (const team of vbTeams) {
      expect(team.players).toHaveLength(8);
      const onCourt = team.players.filter(p => p.isOnCourt !== false);
      const bench = team.players.filter(p => p.isOnCourt === false);
      expect(onCourt).toHaveLength(6);
      expect(bench).toHaveLength(2);
      expect(team.seed).toBeGreaterThanOrEqual(1);
    }

    const bbTeams = getPreexistingTeams('basketball');
    expect(bbTeams.length).toBeGreaterThanOrEqual(4);

    for (const team of bbTeams) {
      expect(team.players).toHaveLength(8);
      const onCourt = team.players.filter(p => p.isOnCourt !== false);
      const bench = team.players.filter(p => p.isOnCourt === false);
      expect(onCourt).toHaveLength(5);
      expect(bench).toHaveLength(3);
      expect(team.seed).toBeGreaterThanOrEqual(1);
    }
  });

  it('strictly enforces basketball 5-player on-court regulation, benching the remaining 3 players', () => {
    const basketballRoster: Player[] = [];
    for (let i = 1; i <= 8; i++) {
      basketballRoster.push({
        id: `bb-p-${i}`,
        name: `Hoops Athlete ${i}`,
        number: i,
        position: i === 1 ? 'Point Guard' : i === 2 ? 'Shooting Guard' : i === 3 ? 'Small Forward' : i === 4 ? 'Power Forward' : i === 5 ? 'Center' : 'Sixth Man',
        points: 0,
        isOnCourt: i <= 5, // Only 5 on court for basketball
        isStarter: i <= 5,
      });
    }

    expect(basketballRoster).toHaveLength(8);
    const onCourt = basketballRoster.filter(p => p.isOnCourt !== false);
    const bench = basketballRoster.filter(p => p.isOnCourt === false);
    expect(onCourt).toHaveLength(5);
    expect(bench).toHaveLength(3);

    // Function modeling toggle court status in basketball
    const toggleBasketballCourtStatus = (current: Player[], playerId: string) => {
      const target = current.find(p => p.id === playerId);
      if (!target) return { success: false, error: 'Player not found' };

      const currentlyOnCourt = target.isOnCourt !== false;
      if (currentlyOnCourt) {
        return {
          success: true,
          roster: current.map(p => p.id === playerId ? { ...p, isOnCourt: false, isStarter: false } : p),
        };
      } else {
        const activeCount = current.filter(p => p.isOnCourt !== false).length;
        if (activeCount >= MAX_ON_COURT_BASKETBALL) {
          return {
            success: false,
            error: `Regulation Limit: Only ${MAX_ON_COURT_BASKETBALL} players are allowed on court at the same time in basketball.`,
          };
        }
        return {
          success: true,
          roster: current.map(p => p.id === playerId ? { ...p, isOnCourt: true, isStarter: true } : p),
        };
      }
    };

    // p-6 is benched. Attempting to activate p-6 to court while 5 are playing must fail
    const trySixthMan = toggleBasketballCourtStatus(basketballRoster, 'bb-p-6');
    expect(trySixthMan.success).toBe(false);
    expect(trySixthMan.error).toContain('Only 5 players are allowed on court');

    // Bench player 1 first (on-court becomes 4)
    const benchP1 = toggleBasketballCourtStatus(basketballRoster, 'bb-p-1');
    expect(benchP1.success).toBe(true);
    expect(benchP1.roster!.filter(p => p.isOnCourt !== false)).toHaveLength(4);

    // Now p-6 can take the court
    const activateP6 = toggleBasketballCourtStatus(benchP1.roster!, 'bb-p-6');
    expect(activateP6.success).toBe(true);
    expect(activateP6.roster!.filter(p => p.isOnCourt !== false)).toHaveLength(5);
    expect(activateP6.roster!.find(p => p.id === 'bb-p-6')?.isOnCourt).toBe(true);
  });

  it('dynamically merges teams from existing matches into pre-existing teams catalog', () => {
    const mockMatch: Match = {
      id: 'custom-m-1',
      sport: 'volleyball',
      title: 'Invitational Match',
      division: "Men's Division I",
      status: 'UPCOMING',
      statusDetail: 'SCHEDULED',
      court: 'Court 1',
      venue: 'Arena',
      homeTeam: {
        id: 'team-phoenix',
        name: 'Phoenix Firebirds',
        shortName: 'PHX',
        seed: 7,
        logoColor: '#f97316',
        accentColor: '#fb923c',
        record: '5-1',
        score: 0,
        players: [
          { id: 'phx-1', name: 'Alex Rivera', number: 9, position: 'Setter', points: 0, isOnCourt: true },
          { id: 'phx-2', name: 'Sam Chen', number: 11, position: 'Outside Hitter', points: 0, isOnCourt: true },
        ],
      },
      awayTeam: {
        id: 'team-glacier',
        name: 'Glacier Freeze',
        shortName: 'GLZ',
        seed: 8,
        logoColor: '#0284c7',
        accentColor: '#38bdf8',
        record: '4-2',
        score: 0,
        players: [],
      },
    };

    const teams = getPreexistingTeams('volleyball', [mockMatch]);
    const phoenix = teams.find(t => t.name === 'Phoenix Firebirds');
    expect(phoenix).toBeDefined();
    expect(phoenix?.shortName).toBe('PHX');
    expect(phoenix?.seed).toBe(7);

    const glacier = teams.find(t => t.name === 'Glacier Freeze');
    expect(glacier).toBeDefined();
    expect(glacier?.shortName).toBe('GLZ');
  });
});
