import { 
  Sport, 
  Match, 
  TournamentBracket, 
  BracketMatchNode, 
  VolleyballTournamentConfig, 
  LeagueFixture, 
  LeagueStandingRow, 
  TournamentFormat 
} from '../types';

export const VOLLEYBALL_CONFIG_KEY = 'fivb_volleyball_tournament_config_v1';

export const DEFAULT_VOLLEYBALL_TEAMS = [
  { name: 'Phoenix VBC', seed: 1, court: 'Court 1 - Hardwood Arena' },
  { name: 'Lightning Spike', seed: 8, court: 'Court 1 - Hardwood Arena' },
  { name: 'Volley Hawks', seed: 4, court: 'Court 2 - Fieldhouse' },
  { name: 'Thunder Spikers', seed: 5, court: 'Court 2 - Fieldhouse' },
  { name: 'Apex Volleyball', seed: 2, court: 'Court 1 - Hardwood Arena' },
  { name: 'Coastal Wave', seed: 7, court: 'Court 1 - Hardwood Arena' },
  { name: 'Blaze VBC', seed: 3, court: 'Court 3 - Volleyball Pavilion' },
  { name: 'Storm Volleyball', seed: 6, court: 'Court 3 - Volleyball Pavilion' },
];

export const DEFAULT_LEAGUE_TEAMS = [
  'Phoenix VBC',
  'Apex Volleyball',
  'Blaze VBC',
  'Volley Hawks',
  'Thunder Spikers',
  'Coastal Wave',
];

export const DEFAULT_VOLLEYBALL_CONFIG: VolleyballTournamentConfig = {
  sport: 'volleyball',
  format: 'knockout',
  bracketSize: 8,
  customTeams: DEFAULT_VOLLEYBALL_TEAMS,
  leagueTeams: DEFAULT_LEAGUE_TEAMS,
  designedByAdmin: false,
};

let inMemoryConfig: VolleyballTournamentConfig | null = null;

/**
 * Loads the saved FIVB Volleyball Tournament Configuration from localStorage
 * or returns the default configuration.
 */
export function getVolleyballTournamentConfig(): VolleyballTournamentConfig {
  if (inMemoryConfig) {
    return inMemoryConfig;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(VOLLEYBALL_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_VOLLEYBALL_CONFIG,
          ...parsed,
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse volleyball tournament config:', e);
  }
  return DEFAULT_VOLLEYBALL_CONFIG;
}

/**
 * Saves the FIVB Volleyball Tournament Configuration to localStorage
 */
export function saveVolleyballTournamentConfig(
  config: Partial<VolleyballTournamentConfig>
): VolleyballTournamentConfig {
  const current = getVolleyballTournamentConfig();
  const updated: VolleyballTournamentConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
    designedByAdmin: true,
  };

  inMemoryConfig = updated;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(VOLLEYBALL_CONFIG_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('Failed to save volleyball tournament config:', e);
  }
  return updated;
}

/**
 * Resets tournament config to official FIVB baseline
 */
export function resetVolleyballTournamentConfig(): VolleyballTournamentConfig {
  inMemoryConfig = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(VOLLEYBALL_CONFIG_KEY);
    }
  } catch {}
  return DEFAULT_VOLLEYBALL_CONFIG;
}

/**
 * Generates an FIVB Volleyball round-robin league schedule across participating teams
 */
export function generateVolleyballLeagueFixtures(
  teams: string[] = DEFAULT_LEAGUE_TEAMS,
  matches: Match[] = []
): LeagueFixture[] {
  const validTeams = teams.filter((t) => t.trim().length > 0);
  if (validTeams.length < 2) return [];

  // Round-robin pairing
  const teamList = [...validTeams];
  if (teamList.length % 2 !== 0) {
    teamList.push('BYE');
  }

  const numTeams = teamList.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  const fixtures: LeagueFixture[] = [];
  let matchNumber = 1;

  for (let round = 0; round < numRounds; round++) {
    for (let matchIdx = 0; matchIdx < matchesPerRound; matchIdx++) {
      const homeIdx = (round + matchIdx) % (numTeams - 1);
      let awayIdx = (numTeams - 1 - matchIdx + round) % (numTeams - 1);

      if (matchIdx === 0) {
        awayIdx = numTeams - 1;
      }

      const homeTeam = teamList[homeIdx];
      const awayTeam = teamList[awayIdx];

      // Skip byes
      if (homeTeam === 'BYE' || awayTeam === 'BYE') continue;

      const fixtureId = `fivb-league-r${round + 1}-m${matchNumber}`;
      const court = matchIdx % 2 === 0 ? 'Court 1 - Main Arena' : 'Court 2 - Fieldhouse';

      // Check if there is an existing live or final match in the system matching this fixture
      let homeSetsWon: number | undefined = undefined;
      let awaySetsWon: number | undefined = undefined;
      let status: 'UPCOMING' | 'LIVE' | 'FINAL' = 'UPCOMING';
      let matchId: string | undefined = undefined;
      let winner: 'home' | 'away' | undefined = undefined;

      const matchedMatch = matches.find((m) => {
        if (m.sport !== 'volleyball') return false;
        const hName = m.homeTeam.name.toLowerCase();
        const aName = m.awayTeam.name.toLowerCase();
        const fHome = homeTeam.toLowerCase();
        const fAway = awayTeam.toLowerCase();
        return (
          (hName.includes(fHome) || fHome.includes(hName)) &&
          (aName.includes(fAway) || fAway.includes(aName))
        );
      });

      if (matchedMatch) {
        matchId = matchedMatch.id;
        status = matchedMatch.status;
        homeSetsWon = matchedMatch.homeTeam.setsWon ?? 0;
        awaySetsWon = matchedMatch.awayTeam.setsWon ?? 0;
        if (matchedMatch.status === 'FINAL') {
          winner = (homeSetsWon >= awaySetsWon) ? 'home' : 'away';
        }
      }

      fixtures.push({
        id: fixtureId,
        round: round + 1,
        matchNumber,
        homeTeamName: homeTeam,
        awayTeamName: awayTeam,
        homeSetsWon,
        awaySetsWon,
        court,
        status,
        matchId,
        winner,
      });

      matchNumber++;
    }
  }

  return fixtures;
}

/**
 * Calculates official FIVB Volleyball League Points Table
 * Standard FIVB Points Distribution:
 * - 3-0 or 3-1 win: Winner 3 pts, Loser 0 pts
 * - 3-2 win: Winner 2 pts, Loser 1 pt
 */
export function calculateVolleyballLeagueStandings(
  teams: string[],
  fixtures: LeagueFixture[]
): LeagueStandingRow[] {
  const standingsMap = new Map<string, LeagueStandingRow>();

  for (const team of teams) {
    if (!team || team === 'BYE') continue;
    standingsMap.set(team, {
      rank: 0,
      teamName: team,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      setsWon: 0,
      setsLost: 0,
      setRatio: 0,
      pointsWon: 0,
      pointsLost: 0,
    });
  }

  for (const f of fixtures) {
    if (f.status !== 'FINAL' || f.homeSetsWon === undefined || f.awaySetsWon === undefined) {
      continue;
    }

    const home = standingsMap.get(f.homeTeamName);
    const away = standingsMap.get(f.awayTeamName);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.setsWon += f.homeSetsWon;
    home.setsLost += f.awaySetsWon;
    away.setsWon += f.awaySetsWon;
    away.setsLost += f.homeSetsWon;

    const homeWon = f.homeSetsWon > f.awaySetsWon;
    const setsDiff = Math.abs(f.homeSetsWon - f.awaySetsWon);

    if (homeWon) {
      home.won += 1;
      away.lost += 1;
      // 3-0 or 3-1 win = 3 pts
      // 3-2 win = 2 pts for winner, 1 pt for loser
      if (f.awaySetsWon === 2) {
        home.points += 2;
        away.points += 1;
      } else {
        home.points += 3;
      }
    } else {
      away.won += 1;
      home.lost += 1;
      if (f.homeSetsWon === 2) {
        away.points += 2;
        home.points += 1;
      } else {
        away.points += 3;
      }
    }
  }

  // Calculate set ratios and sort
  const rows = Array.from(standingsMap.values()).map((row) => {
    const ratio = row.setsLost === 0 ? (row.setsWon > 0 ? row.setsWon : 0) : row.setsWon / row.setsLost;
    return {
      ...row,
      setRatio: parseFloat(ratio.toFixed(3)),
    };
  });

  // Sort according to FIVB official criteria:
  // 1. Matches Won
  // 2. Points
  // 3. Set Ratio
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    if (b.setRatio !== a.setRatio) return b.setRatio - a.setRatio;
    return b.setsWon - a.setsWon;
  });

  // Assign 1-indexed ranks
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

/**
 * Generates custom FIVB Volleyball Playoff Tree (4-team or 8-team) based on Admin design
 */
export function generateCustomVolleyballBracket(
  config: VolleyballTournamentConfig,
  matches: Match[] = []
): TournamentBracket {
  const is4Team = config.bracketSize === 4;
  const teams = config.customTeams || DEFAULT_VOLLEYBALL_TEAMS;

  const nodes: BracketMatchNode[] = [];

  if (is4Team) {
    // 4-Team Semifinals -> Finals & Bronze
    const t1 = teams[0] || { name: 'Phoenix VBC', seed: 1 };
    const t2 = teams[1] || { name: 'Thunder Spikers', seed: 4 };
    const t3 = teams[2] || { name: 'Apex Volleyball', seed: 2 };
    const t4 = teams[3] || { name: 'Blaze VBC', seed: 3 };

    nodes.push(
      {
        id: 'volleyball-sf-1',
        round: 'semifinals',
        roundLabel: 'Semifinal 1',
        matchNumber: 1,
        sport: 'volleyball',
        homeTeamName: t1.name,
        homeTeamSeed: t1.seed,
        awayTeamName: t2.name,
        awayTeamSeed: t2.seed,
        status: 'UPCOMING',
        court: t1.court || 'Court 1 - Main Arena',
        nextMatchId: 'volleyball-finals',
        loserNextMatchId: 'volleyball-third-place',
      },
      {
        id: 'volleyball-sf-2',
        round: 'semifinals',
        roundLabel: 'Semifinal 2',
        matchNumber: 2,
        sport: 'volleyball',
        homeTeamName: t3.name,
        homeTeamSeed: t3.seed,
        awayTeamName: t4.name,
        awayTeamSeed: t4.seed,
        status: 'UPCOMING',
        court: t3.court || 'Court 2 - Fieldhouse',
        nextMatchId: 'volleyball-finals',
        loserNextMatchId: 'volleyball-third-place',
      },
      {
        id: 'volleyball-third-place',
        round: 'third_place',
        roundLabel: 'Bronze Medal Game',
        matchNumber: 3,
        sport: 'volleyball',
        homeTeamName: 'Loser SF1',
        awayTeamName: 'Loser SF2',
        status: 'UPCOMING',
        court: 'Court 2 - Fieldhouse',
      },
      {
        id: 'volleyball-finals',
        round: 'finals',
        roundLabel: 'Championship Final',
        matchNumber: 4,
        sport: 'volleyball',
        homeTeamName: 'Winner SF1',
        awayTeamName: 'Winner SF2',
        status: 'UPCOMING',
        court: 'Court 1 - Main Arena',
      }
    );
  } else {
    // 8-Team Quarterfinals -> Semifinals -> Finals & Bronze
    const safeTeam = (idx: number, defName: string, defSeed: number) => {
      return teams[idx] || { name: defName, seed: defSeed };
    };

    const qfTeams = [
      [safeTeam(0, 'Phoenix VBC', 1), safeTeam(1, 'Lightning Spike', 8)],
      [safeTeam(2, 'Volley Hawks', 4), safeTeam(3, 'Thunder Spikers', 5)],
      [safeTeam(4, 'Apex Volleyball', 2), safeTeam(5, 'Coastal Wave', 7)],
      [safeTeam(6, 'Blaze VBC', 3), safeTeam(7, 'Storm Volleyball', 6)],
    ];

    qfTeams.forEach(([home, away], i) => {
      nodes.push({
        id: `volleyball-qf-${i + 1}`,
        round: 'quarterfinals',
        roundLabel: `Quarterfinal ${i + 1}`,
        matchNumber: i + 1,
        sport: 'volleyball',
        homeTeamName: home.name,
        homeTeamSeed: home.seed,
        awayTeamName: away.name,
        awayTeamSeed: away.seed,
        status: 'UPCOMING',
        court: home.court || (i % 2 === 0 ? 'Court 1 - Main Arena' : 'Court 2 - Fieldhouse'),
        nextMatchId: i < 2 ? 'volleyball-sf-1' : 'volleyball-sf-2',
      });
    });

    nodes.push(
      {
        id: 'volleyball-sf-1',
        round: 'semifinals',
        roundLabel: 'Semifinal 1',
        matchNumber: 5,
        sport: 'volleyball',
        homeTeamName: 'Winner QF1',
        awayTeamName: 'Winner QF2',
        status: 'UPCOMING',
        court: 'Court 1 - Main Arena',
        nextMatchId: 'volleyball-finals',
        loserNextMatchId: 'volleyball-third-place',
      },
      {
        id: 'volleyball-sf-2',
        round: 'semifinals',
        roundLabel: 'Semifinal 2',
        matchNumber: 6,
        sport: 'volleyball',
        homeTeamName: 'Winner QF3',
        awayTeamName: 'Winner QF4',
        status: 'UPCOMING',
        court: 'Court 1 - Main Arena',
        nextMatchId: 'volleyball-finals',
        loserNextMatchId: 'volleyball-third-place',
      },
      {
        id: 'volleyball-third-place',
        round: 'third_place',
        roundLabel: 'Bronze Medal Game',
        matchNumber: 7,
        sport: 'volleyball',
        homeTeamName: 'Loser SF1',
        awayTeamName: 'Loser SF2',
        status: 'UPCOMING',
        court: 'Court 2 - Fieldhouse',
      },
      {
        id: 'volleyball-finals',
        round: 'finals',
        roundLabel: 'Championship Final',
        matchNumber: 8,
        sport: 'volleyball',
        homeTeamName: 'Winner SF1',
        awayTeamName: 'Winner SF2',
        status: 'UPCOMING',
        court: 'Court 1 - Main Arena',
      }
    );
  }

  const baseBracket: TournamentBracket = {
    sport: 'volleyball',
    nodes,
  };

  // Synchronize with any existing matches
  return synchronizeBracketNodesWithMatches(baseBracket, matches);
}

/**
 * Helper to sync custom bracket with matches
 */
function synchronizeBracketNodesWithMatches(
  bracket: TournamentBracket,
  matches: Match[]
): TournamentBracket {
  const nodesMap = new Map<string, BracketMatchNode>(bracket.nodes.map((n) => [n.id, { ...n }]));

  for (const node of nodesMap.values()) {
    const matchedMatch = matches.find((m) => {
      if (m.id === node.matchId) return true;
      if (m.sport !== 'volleyball') return false;
      const mHome = m.homeTeam.name.toLowerCase();
      const mAway = m.awayTeam.name.toLowerCase();
      const nHome = node.homeTeamName.toLowerCase();
      const nAway = node.awayTeamName.toLowerCase();
      return (
        (mHome.includes(nHome) || nHome.includes(mHome)) &&
        (mAway.includes(nAway) || nAway.includes(mAway))
      );
    });

    if (matchedMatch) {
      node.matchId = matchedMatch.id;
      node.status = matchedMatch.status;
      node.court = matchedMatch.court;
      node.homeScore = matchedMatch.homeTeam.setsWon ?? 0;
      node.awayScore = matchedMatch.awayTeam.setsWon ?? 0;

      if (matchedMatch.status === 'FINAL') {
        node.winner = (node.homeScore >= node.awayScore) ? 'home' : 'away';
      }
    }
  }

  // Advance QFs to SFs if 8-team
  if (nodesMap.has('volleyball-qf-1')) {
    propagateMatch(nodesMap.get('volleyball-qf-1'), nodesMap.get('volleyball-sf-1'), 'home');
    propagateMatch(nodesMap.get('volleyball-qf-2'), nodesMap.get('volleyball-sf-1'), 'away');
    propagateMatch(nodesMap.get('volleyball-qf-3'), nodesMap.get('volleyball-sf-2'), 'home');
    propagateMatch(nodesMap.get('volleyball-qf-4'), nodesMap.get('volleyball-sf-2'), 'away');
  }

  // Advance SFs to Finals & Bronze
  const sf1 = nodesMap.get('volleyball-sf-1');
  const sf2 = nodesMap.get('volleyball-sf-2');
  const finals = nodesMap.get('volleyball-finals');
  const bronze = nodesMap.get('volleyball-third-place');

  propagateMatch(sf1, finals, 'home');
  propagateMatch(sf2, finals, 'away');
  propagateLoserMatch(sf1, bronze, 'home');
  propagateLoserMatch(sf2, bronze, 'away');

  let champion: string | undefined;
  let runnerUp: string | undefined;
  let thirdPlace: string | undefined;

  if (finals && finals.status === 'FINAL' && finals.winner) {
    champion = finals.winner === 'home' ? finals.homeTeamName : finals.awayTeamName;
    runnerUp = finals.winner === 'home' ? finals.awayTeamName : finals.homeTeamName;
  }

  if (bronze && bronze.status === 'FINAL' && bronze.winner) {
    thirdPlace = bronze.winner === 'home' ? bronze.homeTeamName : bronze.awayTeamName;
  }

  return {
    sport: 'volleyball',
    nodes: Array.from(nodesMap.values()),
    champion,
    runnerUp,
    thirdPlace,
  };
}

function propagateMatch(
  src: BracketMatchNode | undefined,
  dst: BracketMatchNode | undefined,
  slot: 'home' | 'away'
) {
  if (!src || !dst || src.status !== 'FINAL' || !src.winner) return;
  const name = src.winner === 'home' ? src.homeTeamName : src.awayTeamName;
  const seed = src.winner === 'home' ? src.homeTeamSeed : src.awayTeamSeed;
  if (slot === 'home') {
    dst.homeTeamName = name;
    dst.homeTeamSeed = seed;
  } else {
    dst.awayTeamName = name;
    dst.awayTeamSeed = seed;
  }
}

function propagateLoserMatch(
  src: BracketMatchNode | undefined,
  dst: BracketMatchNode | undefined,
  slot: 'home' | 'away'
) {
  if (!src || !dst || src.status !== 'FINAL' || !src.winner) return;
  const name = src.winner === 'home' ? src.awayTeamName : src.homeTeamName;
  const seed = src.winner === 'home' ? src.awayTeamSeed : src.homeTeamSeed;
  if (slot === 'home') {
    dst.homeTeamName = name;
    dst.homeTeamSeed = seed;
  } else {
    dst.awayTeamName = name;
    dst.awayTeamSeed = seed;
  }
}
