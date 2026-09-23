import { Sport, Match, BracketMatchNode, TournamentBracket, MatchStatus } from '../types';

/**
 * Generates initial championship bracket nodes for an 8-team single-elimination tournament
 * with semifinals, bronze match (3rd place), and grand final.
 */
export function generateInitialBracket(sport: Sport): TournamentBracket {
  const isBasketball = sport === 'basketball';

  const defaultTeams = isBasketball
    ? [
        { name: 'Spartans', seed: 1 },
        { name: 'Titans', seed: 8 },
        { name: 'Cardinals', seed: 4 },
        { name: 'Hawks', seed: 5 },
        { name: 'Tigers', seed: 2 },
        { name: 'Bears', seed: 7 },
        { name: 'Wolverines', seed: 3 },
        { name: 'Eagles', seed: 6 },
      ]
    : [
        { name: 'Phoenix VBC', seed: 1 },
        { name: 'Lightning Spike', seed: 8 },
        { name: 'Volley Hawks', seed: 4 },
        { name: 'Thunder Spikers', seed: 5 },
        { name: 'Apex Volleyball', seed: 2 },
        { name: 'Coastal Wave', seed: 7 },
        { name: 'Blaze VBC', seed: 3 },
        { name: 'Storm Volleyball', seed: 6 },
      ];

  const nodes: BracketMatchNode[] = [
    // --- QUARTERFINALS (4 matches) ---
    {
      id: `${sport}-qf-1`,
      round: 'quarterfinals',
      roundLabel: 'Quarterfinal 1',
      matchNumber: 1,
      sport,
      homeTeamName: defaultTeams[0].name,
      homeTeamSeed: defaultTeams[0].seed,
      awayTeamName: defaultTeams[1].name,
      awayTeamSeed: defaultTeams[1].seed,
      status: 'UPCOMING',
      court: 'Court 1 - Hardwood Arena',
      nextMatchId: `${sport}-sf-1`,
    },
    {
      id: `${sport}-qf-2`,
      round: 'quarterfinals',
      roundLabel: 'Quarterfinal 2',
      matchNumber: 2,
      sport,
      homeTeamName: defaultTeams[2].name,
      homeTeamSeed: defaultTeams[2].seed,
      awayTeamName: defaultTeams[3].name,
      awayTeamSeed: defaultTeams[3].seed,
      status: 'UPCOMING',
      court: 'Court 2 - Fieldhouse',
      nextMatchId: `${sport}-sf-1`,
    },
    {
      id: `${sport}-qf-3`,
      round: 'quarterfinals',
      roundLabel: 'Quarterfinal 3',
      matchNumber: 3,
      sport,
      homeTeamName: defaultTeams[4].name,
      homeTeamSeed: defaultTeams[4].seed,
      awayTeamName: defaultTeams[5].name,
      awayTeamSeed: defaultTeams[5].seed,
      status: 'UPCOMING',
      court: 'Court 1 - Hardwood Arena',
      nextMatchId: `${sport}-sf-2`,
    },
    {
      id: `${sport}-qf-4`,
      round: 'quarterfinals',
      roundLabel: 'Quarterfinal 4',
      matchNumber: 4,
      sport,
      homeTeamName: defaultTeams[6].name,
      homeTeamSeed: defaultTeams[6].seed,
      awayTeamName: defaultTeams[7].name,
      awayTeamSeed: defaultTeams[7].seed,
      status: 'UPCOMING',
      court: 'Court 3 - Volleyball Pavilion',
      nextMatchId: `${sport}-sf-2`,
    },

    // --- SEMIFINALS (2 matches) ---
    {
      id: `${sport}-sf-1`,
      round: 'semifinals',
      roundLabel: 'Semifinal 1',
      matchNumber: 5,
      sport,
      homeTeamName: 'Winner QF1',
      awayTeamName: 'Winner QF2',
      status: 'UPCOMING',
      court: 'Court 1 - Hardwood Arena',
      nextMatchId: `${sport}-finals`,
      loserNextMatchId: `${sport}-third-place`,
    },
    {
      id: `${sport}-sf-2`,
      round: 'semifinals',
      roundLabel: 'Semifinal 2',
      matchNumber: 6,
      sport,
      homeTeamName: 'Winner QF3',
      awayTeamName: 'Winner QF4',
      status: 'UPCOMING',
      court: 'Court 1 - Hardwood Arena',
      nextMatchId: `${sport}-finals`,
      loserNextMatchId: `${sport}-third-place`,
    },

    // --- 3RD PLACE / BRONZE MEDAL ---
    {
      id: `${sport}-third-place`,
      round: 'third_place',
      roundLabel: 'Bronze Medal Game',
      matchNumber: 7,
      sport,
      homeTeamName: 'Loser SF1',
      awayTeamName: 'Loser SF2',
      status: 'UPCOMING',
      court: 'Court 2 - Fieldhouse',
    },

    // --- CHAMPIONSHIP FINAL (Gold / Silver) ---
    {
      id: `${sport}-finals`,
      round: 'finals',
      roundLabel: 'Championship Final',
      matchNumber: 8,
      sport,
      homeTeamName: 'Winner SF1',
      awayTeamName: 'Winner SF2',
      status: 'UPCOMING',
      court: 'Court 1 - Hardwood Arena',
    },
  ];

  return {
    sport,
    nodes,
  };
}

/**
 * Synchronizes the bracket with the latest live matches in the tournament database.
 * If a match in the tournament matches a node, updates scores, winner, and advances teams.
 */
export function synchronizeBracketWithMatches(
  bracket: TournamentBracket,
  matches: Match[]
): TournamentBracket {
  const nodesMap = new Map<string, BracketMatchNode>(bracket.nodes.map((n) => [n.id, { ...n }]));

  // First pass: Match linking & direct score update
  for (const node of nodesMap.values()) {
    // Try matching by exact node matchId or by team names
    const matchedMatch = matches.find((m) => {
      if (m.id === node.matchId) return true;
      if (m.sport !== node.sport) return false;
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

      const isVolleyball = matchedMatch.sport === 'volleyball';
      if (isVolleyball) {
        node.homeScore = matchedMatch.homeTeam.setsWon ?? 0;
        node.awayScore = matchedMatch.awayTeam.setsWon ?? 0;
      } else {
        node.homeScore = matchedMatch.homeTeam.score ?? 0;
        node.awayScore = matchedMatch.awayTeam.score ?? 0;
      }

      if (matchedMatch.status === 'FINAL') {
        const homeWon = (node.homeScore ?? 0) >= (node.awayScore ?? 0);
        node.winner = homeWon ? 'home' : 'away';
      }
    }
  }

  // Second pass: Propagation of winners and losers
  // Advance QF -> SF
  propagateAdvancement(nodesMap.get(`${bracket.sport}-qf-1`), nodesMap.get(`${bracket.sport}-sf-1`), 'home');
  propagateAdvancement(nodesMap.get(`${bracket.sport}-qf-2`), nodesMap.get(`${bracket.sport}-sf-1`), 'away');
  propagateAdvancement(nodesMap.get(`${bracket.sport}-qf-3`), nodesMap.get(`${bracket.sport}-sf-2`), 'home');
  propagateAdvancement(nodesMap.get(`${bracket.sport}-qf-4`), nodesMap.get(`${bracket.sport}-sf-2`), 'away');

  // Advance SF -> Finals & Bronze
  const sf1 = nodesMap.get(`${bracket.sport}-sf-1`);
  const sf2 = nodesMap.get(`${bracket.sport}-sf-2`);
  const finals = nodesMap.get(`${bracket.sport}-finals`);
  const bronze = nodesMap.get(`${bracket.sport}-third-place`);

  propagateAdvancement(sf1, finals, 'home');
  propagateAdvancement(sf2, finals, 'away');
  propagateLoser(sf1, bronze, 'home');
  propagateLoser(sf2, bronze, 'away');

  // Third pass: Determine podium finishers (Gold, Silver, Bronze)
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
    sport: bracket.sport,
    nodes: Array.from(nodesMap.values()),
    champion,
    runnerUp,
    thirdPlace,
  };
}

function propagateAdvancement(
  source: BracketMatchNode | undefined,
  target: BracketMatchNode | undefined,
  targetSlot: 'home' | 'away'
): void {
  if (!source || !target) return;

  if (source.status === 'FINAL' && source.winner) {
    const winnerName = source.winner === 'home' ? source.homeTeamName : source.awayTeamName;
    const winnerSeed = source.winner === 'home' ? source.homeTeamSeed : source.awayTeamSeed;

    if (targetSlot === 'home') {
      target.homeTeamName = winnerName;
      target.homeTeamSeed = winnerSeed;
    } else {
      target.awayTeamName = winnerName;
      target.awayTeamSeed = winnerSeed;
    }
  }
}

function propagateLoser(
  source: BracketMatchNode | undefined,
  target: BracketMatchNode | undefined,
  targetSlot: 'home' | 'away'
): void {
  if (!source || !target) return;

  if (source.status === 'FINAL' && source.winner) {
    const loserName = source.winner === 'home' ? source.awayTeamName : source.homeTeamName;
    const loserSeed = source.winner === 'home' ? source.awayTeamSeed : source.homeTeamSeed;

    if (targetSlot === 'home') {
      target.homeTeamName = loserName;
      target.homeTeamSeed = loserSeed;
    } else {
      target.awayTeamName = loserName;
      target.awayTeamSeed = loserSeed;
    }
  }
}

/**
 * Advances a node directly when an admin sets a score or winner manually.
 */
export function advanceBracketMatch(
  bracket: TournamentBracket,
  nodeId: string,
  winner: 'home' | 'away',
  homeScore: number,
  awayScore: number
): TournamentBracket {
  const updatedNodes = bracket.nodes.map((n) => {
    if (n.id === nodeId) {
      return {
        ...n,
        status: 'FINAL' as MatchStatus,
        winner,
        homeScore,
        awayScore,
      };
    }
    return n;
  });

  return synchronizeBracketWithMatches(
    { ...bracket, nodes: updatedNodes },
    []
  );
}
