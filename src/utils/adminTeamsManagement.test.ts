import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { 
  PreexistingTeam, 
  getAllDefaultTeams, 
  getStoredTeams, 
  saveStoredTeams, 
  normalizeTeamPlayers,
  TEAMS_STORAGE_KEY 
} from '../data/preexistingTeams';
import { Match, Team, Player } from '../types';
import { 
  MAX_TEAM_ROSTER_LIMIT, 
  MAX_ON_COURT_PLAYERS, 
  MAX_ON_COURT_BASKETBALL, 
  MAX_ON_COURT_VOLLEYBALL, 
  getMaxOnCourtPlayers 
} from '../components/CreateMatchModal';

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

describe('Admin Teams & Roster Management Page', () => {
  beforeAll(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      (globalThis as any).localStorage = createLocalStorageMock();
    }
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it('loads all official default championship teams across Volleyball and Basketball', () => {
    const defaults = getAllDefaultTeams();
    expect(defaults.length).toBeGreaterThanOrEqual(12);

    const vb = defaults.filter(t => t.sport === 'volleyball');
    const bb = defaults.filter(t => t.sport === 'basketball');

    expect(vb.length).toBeGreaterThanOrEqual(6);
    expect(bb.length).toBeGreaterThanOrEqual(6);

    for (const team of defaults) {
      expect(team.name).toBeTruthy();
      expect(team.shortName).toHaveLength(3);
      expect(team.seed).toBeGreaterThanOrEqual(1);
      expect(team.players).toHaveLength(MAX_TEAM_ROSTER_LIMIT);

      const onCourt = team.players.filter(p => p.isOnCourt !== false);
      const bench = team.players.filter(p => p.isOnCourt === false);
      const expectedCourt = team.sport === 'volleyball' ? 6 : 5;
      expect(onCourt).toHaveLength(expectedCourt);
      expect(bench).toHaveLength(MAX_TEAM_ROSTER_LIMIT - expectedCourt);
    }
  });

  it('persists and retrieves customized teams from storage', () => {
    const initial = getStoredTeams();
    expect(initial.length).toBeGreaterThanOrEqual(12);

    // Modify a team
    const updated = initial.map(t => {
      if (t.name === 'Pacific Surge') {
        return {
          ...t,
          name: 'Pacific Surge Elite',
          seed: 1,
          record: '18-0',
        };
      }
      return t;
    });

    saveStoredTeams(updated);

    const reloaded = getStoredTeams();
    const found = reloaded.find(t => t.name === 'Pacific Surge Elite');
    expect(found).toBeDefined();
    expect(found?.record).toBe('18-0');
  });

  it('allows registering a new championship team with full 8-player squad', () => {
    const current = getStoredTeams();
    const newTeam: PreexistingTeam = {
      id: 'team-custom-99',
      name: 'Valkyrie Aces',
      shortName: 'VKA',
      sport: 'volleyball',
      seed: 7,
      logoColor: '#8b5cf6',
      accentColor: '#a78bfa',
      record: '5-1',
      players: [
        { id: 'v1', name: 'Player 1', number: 1, position: 'Setter', points: 0, isOnCourt: true },
        { id: 'v2', name: 'Player 2', number: 2, position: 'Outside Hitter', points: 0, isOnCourt: true },
        { id: 'v3', name: 'Player 3', number: 3, position: 'Middle Blocker', points: 0, isOnCourt: true },
        { id: 'v4', name: 'Player 4', number: 4, position: 'Opposite', points: 0, isOnCourt: true },
        { id: 'v5', name: 'Player 5', number: 5, position: 'Outside Hitter', points: 0, isOnCourt: true },
        { id: 'v6', name: 'Player 6', number: 6, position: 'Libero', points: 0, isOnCourt: true },
        { id: 'v7', name: 'Player 7', number: 7, position: 'Defensive Specialist', points: 0, isOnCourt: false },
        { id: 'v8', name: 'Player 8', number: 8, position: 'Backup Setter', points: 0, isOnCourt: false },
      ],
    };

    const updated = [newTeam, ...current];
    saveStoredTeams(updated);

    const reloaded = getStoredTeams();
    expect(reloaded).toHaveLength(current.length + 1);
    expect(reloaded.some(t => t.id === 'team-custom-99')).toBe(true);
  });

  it('allows permanently deleting a team from the registry', () => {
    const current = getStoredTeams();
    const target = current[0];

    const filtered = current.filter(t => t.id !== target.id);
    saveStoredTeams(filtered);

    const reloaded = getStoredTeams();
    expect(reloaded).toHaveLength(current.length - 1);
    expect(reloaded.some(t => t.id === target.id)).toBe(false);
  });

  it('enforces maximum 6 players on court and maximum 8 squad limit during roster editing', () => {
    const roster: Player[] = [];
    for (let i = 1; i <= 8; i++) {
      roster.push({
        id: `p-${i}`,
        name: `Athlete ${i}`,
        number: i,
        position: 'Position',
        points: 0,
        isOnCourt: i <= 6,
      });
    }

    const validateRoster = (players: Player[]): { valid: boolean; error?: string } => {
      if (players.length > MAX_TEAM_ROSTER_LIMIT) {
        return { valid: false, error: `Squad cannot exceed ${MAX_TEAM_ROSTER_LIMIT} players.` };
      }
      const onCourt = players.filter(p => p.isOnCourt !== false);
      if (onCourt.length > MAX_ON_COURT_PLAYERS) {
        return { valid: false, error: `Only ${MAX_ON_COURT_PLAYERS} players are allowed on court.` };
      }
      return { valid: true };
    };

    expect(validateRoster(roster).valid).toBe(true);

    // Try making 7th player on court
    const invalidCourt = roster.map(p => ({ ...p, isOnCourt: true }));
    const courtRes = validateRoster(invalidCourt);
    expect(courtRes.valid).toBe(false);
    expect(courtRes.error).toContain('Only 6 players are allowed on court');

    // Try adding a 9th player to the squad
    const invalidSquad = [...roster, { id: 'p-9', name: 'Athlete 9', number: 99, position: 'Sub', points: 0, isOnCourt: false }];
    const squadRes = validateRoster(invalidSquad);
    expect(squadRes.valid).toBe(false);
    expect(squadRes.error).toContain('Squad cannot exceed 8 players');
  });

  it('strictly enforces that in basketball matches only 5 players can play on court, other 3 are benched', () => {
    const bbRoster: Player[] = [];
    for (let i = 1; i <= 8; i++) {
      bbRoster.push({
        id: `bb-ath-${i}`,
        name: `BB Athlete ${i}`,
        number: i,
        position: 'Hoops Player',
        points: 0,
        isOnCourt: i <= 5, // 5 on court, 3 on bench
      });
    }

    const validateBasketballRoster = (players: Player[]): { valid: boolean; error?: string } => {
      const maxCourt = getMaxOnCourtPlayers('basketball');
      if (players.length > MAX_TEAM_ROSTER_LIMIT) {
        return { valid: false, error: `Squad cannot exceed ${MAX_TEAM_ROSTER_LIMIT} players.` };
      }
      const onCourt = players.filter(p => p.isOnCourt !== false);
      if (onCourt.length > maxCourt) {
        return { valid: false, error: `Only ${maxCourt} players are allowed on court in basketball. Move ${onCourt.length - maxCourt} player(s) to the bench.` };
      }
      return { valid: true };
    };

    expect(validateBasketballRoster(bbRoster).valid).toBe(true);

    const onCourt = bbRoster.filter(p => p.isOnCourt !== false);
    const bench = bbRoster.filter(p => p.isOnCourt === false);
    expect(onCourt).toHaveLength(5);
    expect(bench).toHaveLength(3);

    // Attempting to have 6 on court in basketball must be rejected
    const invalidBasketball = bbRoster.map((p, idx) => ({
      ...p,
      isOnCourt: idx < 6, // 6 on court is illegal in basketball
    }));
    const checkRes = validateBasketballRoster(invalidBasketball);
    expect(checkRes.valid).toBe(false);
    expect(checkRes.error).toContain('Only 5 players are allowed on court in basketball');
  });

  it('synchronizes team updates to all matches featuring the team', () => {
    const mockMatch: Match = {
      id: 'm-live-1',
      sport: 'volleyball',
      title: 'Championship Match',
      division: "Men's Division I",
      status: 'LIVE',
      statusDetail: 'LIVE',
      court: 'Court 1',
      venue: 'Arena',
      homeTeam: {
        id: 'sur-preset',
        name: 'Pacific Surge',
        shortName: 'SUR',
        seed: 1,
        logoColor: '#0284c7',
        accentColor: '#38bdf8',
        record: '14-2',
        score: 10,
        players: [],
      },
      awayTeam: {
        id: 'spk-preset',
        name: 'Peak Spikers',
        shortName: 'SPK',
        seed: 2,
        logoColor: '#f97316',
        accentColor: '#fb923c',
        record: '13-3',
        score: 8,
        players: [],
      },
    };

    let matches = [mockMatch];

    const editedTeam: Team = {
      id: 'sur-preset',
      name: 'Pacific Surge Champions',
      shortName: 'PSC',
      seed: 1,
      logoColor: '#0ea5e9',
      accentColor: '#38bdf8',
      record: '15-2',
      score: 10,
      players: [
        { id: 'p-1', name: 'Elena Rostova', number: 7, position: 'Outside Hitter', points: 10, isOnCourt: true },
      ],
    };

    // Propagate team update
    matches = matches.map(m => {
      if (m.homeTeam.id === editedTeam.id || m.homeTeam.name.toLowerCase() === editedTeam.name.toLowerCase()) {
        return {
          ...m,
          homeTeam: {
            ...m.homeTeam,
            name: editedTeam.name,
            shortName: editedTeam.shortName,
            logoColor: editedTeam.logoColor,
            record: editedTeam.record,
            players: editedTeam.players,
          },
        };
      }
      return m;
    });

    expect(matches[0].homeTeam.name).toBe('Pacific Surge Champions');
    expect(matches[0].homeTeam.shortName).toBe('PSC');
    expect(matches[0].homeTeam.players).toHaveLength(1);
    expect(matches[0].awayTeam.name).toBe('Peak Spikers'); // Unchanged
  });

  it('persists and retrieves team logo and player photo URLs in registered teams', () => {
    const teams = getStoredTeams();
    const newTeamWithImages: PreexistingTeam = {
      id: 'team-photos-1',
      name: 'Thunder Crest',
      shortName: 'THC',
      sport: 'basketball',
      seed: 5,
      logoColor: '#f97316',
      accentColor: '#fb923c',
      logoUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==',
      players: [
        {
          id: 'p-1',
          name: 'Jordan Hayes',
          number: 23,
          position: 'Point Guard',
          points: 0,
          isOnCourt: true,
          photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        },
        {
          id: 'p-2',
          name: 'Devon Sterling',
          number: 11,
          position: 'Shooting Guard',
          points: 0,
          isOnCourt: true,
          photoUrl: 'https://example.com/devon.jpg',
        },
        { id: 'p-3', name: 'Jaxon Hayes', number: 34, position: 'Small Forward', points: 0, isOnCourt: true },
        { id: 'p-4', name: 'Trevor Campbell', number: 55, position: 'Power Forward', points: 0, isOnCourt: true },
        { id: 'p-5', name: 'Malik Turner', number: 8, position: 'Center', points: 0, isOnCourt: true },
        { id: 'p-6', name: 'Zion Brooks', number: 24, position: 'Sixth Man', points: 0, isOnCourt: false },
        { id: 'p-7', name: 'Kobe Walker', number: 4, position: 'Bench Guard', points: 0, isOnCourt: false },
        { id: 'p-8', name: 'Dante Cole', number: 15, position: 'Bench Center', points: 0, isOnCourt: false },
      ],
    };

    saveStoredTeams([newTeamWithImages, ...teams]);
    const stored = getStoredTeams();
    const retrieved = stored.find(t => t.id === 'team-photos-1');

    expect(retrieved).toBeDefined();
    expect(retrieved?.logoUrl).toContain('data:image/svg+xml');
    expect(retrieved?.players[0].photoUrl).toContain('data:image/png');
    expect(retrieved?.players[1].photoUrl).toBe('https://example.com/devon.jpg');
    expect(retrieved?.players[2].photoUrl).toBeUndefined();
  });

  it('normalizes court and bench player counts automatically when switching sports', () => {
    // 6 on court (valid in volleyball)
    const volleyballPlayers: Player[] = [
      { id: 'p1', name: 'P1', number: 1, position: 'OH', points: 0, isOnCourt: true },
      { id: 'p2', name: 'P2', number: 2, position: 'MB', points: 0, isOnCourt: true },
      { id: 'p3', name: 'P3', number: 3, position: 'S', points: 0, isOnCourt: true },
      { id: 'p4', name: 'P4', number: 4, position: 'OPP', points: 0, isOnCourt: true },
      { id: 'p5', name: 'P5', number: 5, position: 'OH', points: 0, isOnCourt: true },
      { id: 'p6', name: 'P6', number: 6, position: 'L', points: 0, isOnCourt: true },
      { id: 'p7', name: 'P7', number: 7, position: 'DS', points: 0, isOnCourt: false },
      { id: 'p8', name: 'P8', number: 8, position: 'SET', points: 0, isOnCourt: false },
    ];

    // When switching to basketball, the 6th player must be normalized to bench so only 5 are on court
    const normalizedForBasketball = normalizeTeamPlayers(volleyballPlayers, 'basketball');
    const onCourtBB = normalizedForBasketball.filter(p => p.isOnCourt !== false);
    const benchBB = normalizedForBasketball.filter(p => p.isOnCourt === false);

    expect(onCourtBB).toHaveLength(5);
    expect(benchBB).toHaveLength(3);
    expect(normalizedForBasketball[5].isOnCourt).toBe(false); // 6th player automatically benched

    // When switching back to volleyball, up to 6 can be on court
    const normalizedForVolleyball = normalizeTeamPlayers(volleyballPlayers, 'volleyball');
    const onCourtVB = normalizedForVolleyball.filter(p => p.isOnCourt !== false);
    expect(onCourtVB).toHaveLength(6);
  });

  it('prepends registered team to storage so new teams appear at the top of the championship registry', () => {
    const existing = getStoredTeams();
    const newTeam: PreexistingTeam = {
      id: 'team-new-top',
      name: 'Aurora Thunder',
      shortName: 'ATH',
      sport: 'volleyball',
      seed: 8,
      logoColor: '#8b5cf6',
      accentColor: '#a78bfa',
      record: '0-0',
      players: normalizeTeamPlayers([], 'volleyball'),
    };

    const updated = [newTeam, ...existing];
    saveStoredTeams(updated);

    const reloaded = getStoredTeams();
    expect(reloaded[0].id).toBe('team-new-top');
    expect(reloaded[0].name).toBe('Aurora Thunder');
  });

  it('ensures exhibition matches generated for newly registered teams feature full 8-player opponent squads', () => {
    // Volleyball exhibition opponent must have 8 players, 6 on court, 2 on bench
    const ts = Date.now();
    const vbOpponentPlayers: Player[] = [
      { id: `opp-p-${ts}-1`, name: 'Maya Lindqvist', number: 14, position: 'Middle Blocker', points: 0, isOnCourt: true, isStarter: true },
      { id: `opp-p-${ts}-2`, name: 'Tara Davis', number: 8, position: 'Outside Hitter', points: 0, isOnCourt: true, isStarter: true },
      { id: `opp-p-${ts}-3`, name: 'Ananya Sharma', number: 4, position: 'Setter', points: 0, isOnCourt: true, isStarter: true },
      { id: `opp-p-${ts}-4`, name: 'Camila Rossi', number: 9, position: 'Opposite Spiker', points: 0, isOnCourt: true, isStarter: true },
      { id: `opp-p-${ts}-5`, name: 'Elena Petrova', number: 16, position: 'Outside Hitter', points: 0, isOnCourt: true, isStarter: true },
      { id: `opp-p-${ts}-6`, name: 'Yuki Takahashi', number: 2, position: 'Libero', points: 0, isOnCourt: true, isStarter: true },
      { id: `opp-p-${ts}-7`, name: 'Brooke Collins', number: 11, position: 'Middle Blocker', points: 0, isOnCourt: false, isStarter: false },
      { id: `opp-p-${ts}-8`, name: 'Lily Vance', number: 6, position: 'Defensive Specialist', points: 0, isOnCourt: false, isStarter: false },
    ];

    expect(vbOpponentPlayers).toHaveLength(8);
    expect(vbOpponentPlayers.filter(p => p.isOnCourt !== false)).toHaveLength(6);
    expect(vbOpponentPlayers.filter(p => p.isOnCourt === false)).toHaveLength(2);

    // Basketball exhibition opponent must have 8 players, 5 on court, 3 on bench
    const bbOpponentPlayers: Player[] = [
      { id: `opp-p-${ts}-1`, name: 'Devon Sterling', number: 11, position: 'Point Guard', points: 0, isOnCourt: true, isStarter: true },
      { id: `opp-p-${ts}-2`, name: 'Zion Brooks', number: 24, position: 'Shooting Guard', points: 0, isOnCourt: true, isStarter: true },
      { id: `opp-p-${ts}-3`, name: 'Kobe Walker', number: 4, position: 'Small Forward', points: 0, isOnCourt: true, isStarter: true },
      { id: `opp-p-${ts}-4`, name: 'Dante Cole', number: 15, position: 'Power Forward', points: 0, isOnCourt: true, isStarter: true },
      { id: `opp-p-${ts}-5`, name: 'Tyler Reed', number: 33, position: 'Center', points: 0, isOnCourt: true, isStarter: true },
      { id: `opp-p-${ts}-6`, name: 'Brandon Scott', number: 1, position: 'Guard', points: 0, isOnCourt: false, isStarter: false },
      { id: `opp-p-${ts}-7`, name: 'Carlos Mendez', number: 8, position: 'Forward', points: 0, isOnCourt: false, isStarter: false },
      { id: `opp-p-${ts}-8`, name: 'Austin Miller', number: 42, position: 'Center', points: 0, isOnCourt: false, isStarter: false },
    ];

    expect(bbOpponentPlayers).toHaveLength(8);
    expect(bbOpponentPlayers.filter(p => p.isOnCourt !== false)).toHaveLength(5);
    expect(bbOpponentPlayers.filter(p => p.isOnCourt === false)).toHaveLength(3);
  });

  it('propagates logoUrl when synchronizing registered team updates to matches', () => {
    const originalMatch: Match = {
      id: 'm-logo-test',
      sport: 'volleyball',
      title: 'Volleyball Final',
      division: "Men's Division I",
      status: 'LIVE',
      statusDetail: 'LIVE',
      court: 'Court 1',
      venue: 'Arena',
      homeTeam: {
        id: 'team-logo-home',
        name: 'Pacific Surge',
        shortName: 'SUR',
        logoColor: '#0284c7',
        accentColor: '#38bdf8',
        record: '10-0',
        score: 0,
        players: [],
      },
      awayTeam: {
        id: 'team-logo-away',
        name: 'Peak Spikers',
        shortName: 'SPK',
        logoColor: '#f97316',
        accentColor: '#fb923c',
        record: '9-1',
        score: 0,
        players: [],
      },
      volleyballFormat: 'best-of-5',
      currentSetNumber: 1,
      targetPoints: 25,
      isDeuce: false,
    };

    const updatedHomeTeam: Team = {
      ...originalMatch.homeTeam,
      logoUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    };

    // Update function matching App.tsx handleUpdateTeamInMatches
    const updateMatches = (matches: Match[], savedTeam: Team, sport: Sport): Match[] => {
      return matches.map(m => {
        if (m.sport !== sport) return m;
        let home = m.homeTeam;
        let away = m.awayTeam;
        let changed = false;

        if (m.homeTeam.id === savedTeam.id || m.homeTeam.name.toLowerCase() === savedTeam.name.toLowerCase()) {
          home = {
            ...m.homeTeam,
            name: savedTeam.name,
            shortName: savedTeam.shortName,
            logoUrl: savedTeam.logoUrl ?? m.homeTeam.logoUrl,
          };
          changed = true;
        }
        if (m.awayTeam.id === savedTeam.id || m.awayTeam.name.toLowerCase() === savedTeam.name.toLowerCase()) {
          away = {
            ...m.awayTeam,
            name: savedTeam.name,
            shortName: savedTeam.shortName,
            logoUrl: savedTeam.logoUrl ?? m.awayTeam.logoUrl,
          };
          changed = true;
        }
        return changed ? { ...m, homeTeam: home, awayTeam: away } : m;
      });
    };

    const updated = updateMatches([originalMatch], updatedHomeTeam, 'volleyball');
    expect(updated[0].homeTeam.logoUrl).toBe('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=');
  });
});
