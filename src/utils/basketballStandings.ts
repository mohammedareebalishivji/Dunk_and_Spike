import { Match, Player } from '../types';

export interface BasketballTeamStanding {
  rank: number;
  teamId: string;
  teamName: string;
  teamShortName: string;
  logoColor: string;
  logoUrl?: string;
  gp: number; // Games Played
  wins: number;
  losses: number;
  winPct: number;
  winPctString: string;
  gb: string; // Games Behind leader
  ptsFor: number;
  ptsAgainst: number;
  diff: number;
  homeRecord: string;
  awayRecord: string;
  streak: string;
  form: ('W' | 'L')[];
  playoffStatus: 'Playoff Clinched' | 'In Contention' | 'Bubble';
}

export interface BasketballPlayerLeader {
  id: string;
  name: string;
  number: number;
  teamName: string;
  logoColor: string;
  logoUrl?: string;
  photoUrl?: string;
  position: string;
  points: number;
  twoPointers: number;
  threePointers: number;
  freeThrows: number;
  rebounds: number;
  assists: number;
  steals: number;
  fouls: number;
}

/**
 * Calculates official FIBA / Hardwood Basketball Standings from match results.
 */
export function calculateBasketballStandings(matches: Match[] = []): BasketballTeamStanding[] {
  const basketballMatches = matches.filter(m => m.sport === 'basketball');
  const completedMatches = basketballMatches.filter(m => m.status === 'FINAL');

  interface InternalTeamRecord {
    teamId: string;
    teamName: string;
    teamShortName: string;
    logoColor: string;
    logoUrl?: string;
    wins: number;
    losses: number;
    ptsFor: number;
    ptsAgainst: number;
    homeWins: number;
    homeLosses: number;
    awayWins: number;
    awayLosses: number;
    recentResults: ('W' | 'L')[];
  }

  const teamMap = new Map<string, InternalTeamRecord>();

  // Initialize all competing teams from matches
  basketballMatches.forEach(m => {
    if (!teamMap.has(m.homeTeam.name)) {
      teamMap.set(m.homeTeam.name, {
        teamId: m.homeTeam.id,
        teamName: m.homeTeam.name,
        teamShortName: m.homeTeam.shortName || m.homeTeam.name.substring(0, 3).toUpperCase(),
        logoColor: m.homeTeam.logoColor || '#f97316',
        logoUrl: m.homeTeam.logoUrl,
        wins: 0,
        losses: 0,
        ptsFor: 0,
        ptsAgainst: 0,
        homeWins: 0,
        homeLosses: 0,
        awayWins: 0,
        awayLosses: 0,
        recentResults: [],
      });
    }
    if (!teamMap.has(m.awayTeam.name)) {
      teamMap.set(m.awayTeam.name, {
        teamId: m.awayTeam.id,
        teamName: m.awayTeam.name,
        teamShortName: m.awayTeam.shortName || m.awayTeam.name.substring(0, 3).toUpperCase(),
        logoColor: m.awayTeam.logoColor || '#0284c7',
        logoUrl: m.awayTeam.logoUrl,
        wins: 0,
        losses: 0,
        ptsFor: 0,
        ptsAgainst: 0,
        homeWins: 0,
        homeLosses: 0,
        awayWins: 0,
        awayLosses: 0,
        recentResults: [],
      });
    }
  });

  // Tally scores and match outcomes
  completedMatches.forEach(m => {
    const home = teamMap.get(m.homeTeam.name);
    const away = teamMap.get(m.awayTeam.name);
    if (!home || !away) return;

    const homeScore = m.homeTeam.score || 0;
    const awayScore = m.awayTeam.score || 0;

    home.ptsFor += homeScore;
    home.ptsAgainst += awayScore;
    away.ptsFor += awayScore;
    away.ptsAgainst += homeScore;

    if (homeScore > awayScore) {
      home.wins += 1;
      home.homeWins += 1;
      home.recentResults.unshift('W');

      away.losses += 1;
      away.awayLosses += 1;
      away.recentResults.unshift('L');
    } else if (awayScore > homeScore) {
      away.wins += 1;
      away.awayWins += 1;
      away.recentResults.unshift('W');

      home.losses += 1;
      home.homeLosses += 1;
      home.recentResults.unshift('L');
    } else {
      // Fallback: tied score in final match - grant win to home
      home.wins += 1;
      home.homeWins += 1;
      home.recentResults.unshift('W');

      away.losses += 1;
      away.awayLosses += 1;
      away.recentResults.unshift('L');
    }
  });

  // Calculate Win % and sort
  const teamList = Array.from(teamMap.values()).map(t => {
    const gp = t.wins + t.losses;
    const winPct = gp > 0 ? t.wins / gp : 0;
    const winPctString = gp > 0 ? winPct.toFixed(3).replace('0.', '.') : '.000';
    const diff = t.ptsFor - t.ptsAgainst;

    // Determine current streak
    let streak = '-';
    if (t.recentResults.length > 0) {
      const first = t.recentResults[0];
      let count = 0;
      for (const res of t.recentResults) {
        if (res === first) count++;
        else break;
      }
      streak = `${first}${count}`;
    }

    return {
      ...t,
      gp,
      winPct,
      winPctString,
      diff,
      streak,
      homeRecord: `${t.homeWins}-${t.homeLosses}`,
      awayRecord: `${t.awayWins}-${t.awayLosses}`,
      form: t.recentResults.slice(0, 5),
    };
  });

  // Sort by Win % desc, then diff desc, then ptsFor desc
  teamList.sort((a, b) => {
    if (b.winPct !== a.winPct) return b.winPct - a.winPct;
    if (b.diff !== a.diff) return b.diff - a.diff;
    return b.ptsFor - a.ptsFor;
  });

  // Leader record for Games Behind calculation
  const leader = teamList[0];
  const leaderWins = leader?.wins || 0;
  const leaderLosses = leader?.losses || 0;

  return teamList.map((t, idx) => {
    const rank = idx + 1;
    let gb = '-';
    if (idx > 0 && leader) {
      const diffWins = leaderWins - t.wins;
      const diffLosses = t.losses - leaderLosses;
      const gbVal = (diffWins + diffLosses) / 2;
      gb = gbVal > 0 ? gbVal.toFixed(1).replace('.0', '') : '-';
    }

    const playoffStatus: 'Playoff Clinched' | 'In Contention' | 'Bubble' = 
      rank <= 4 ? 'Playoff Clinched' : rank <= 6 ? 'In Contention' : 'Bubble';

    return {
      rank,
      teamId: t.teamId,
      teamName: t.teamName,
      teamShortName: t.teamShortName,
      logoColor: t.logoColor,
      gp: t.gp,
      wins: t.wins,
      losses: t.losses,
      winPct: t.winPct,
      winPctString: t.winPctString,
      gb,
      ptsFor: t.ptsFor,
      ptsAgainst: t.ptsAgainst,
      diff: t.diff,
      homeRecord: t.homeRecord,
      awayRecord: t.awayRecord,
      streak: t.streak,
      form: t.form,
      playoffStatus,
    };
  });
}

/**
 * Aggregates all basketball players and returns sorted leaders across skill categories.
 */
export function getBasketballPlayerLeaders(matches: Match[] = []): {
  scoringLeaders: BasketballPlayerLeader[];
  threePointLeaders: BasketballPlayerLeader[];
  assistLeaders: BasketballPlayerLeader[];
  reboundLeaders: BasketballPlayerLeader[];
} {
  const basketballMatches = matches.filter(m => m.sport === 'basketball');
  const playerMap = new Map<string, BasketballPlayerLeader>();

  basketballMatches.forEach(m => {
    const processTeam = (teamName: string, logoColor: string, logoUrl?: string, players: Player[] = []) => {
      players.forEach(p => {
        const key = `${p.name}-${teamName}`.toLowerCase();
        const existing = playerMap.get(key);
        if (existing) {
          existing.points += p.points || 0;
          existing.twoPointers += p.twoPointers || 0;
          existing.threePointers += p.threePointers || 0;
          existing.freeThrows += p.freeThrows || 0;
          existing.rebounds += p.rebounds || 0;
          existing.assists += p.assists || 0;
          existing.steals += p.steals || 0;
          existing.fouls += p.fouls || 0;
          if (p.photoUrl && !existing.photoUrl) existing.photoUrl = p.photoUrl;
        } else {
          playerMap.set(key, {
            id: p.id,
            name: p.name,
            number: p.number,
            teamName,
            logoColor,
            logoUrl,
            photoUrl: p.photoUrl,
            position: p.position || 'Guard',
            points: p.points || 0,
            twoPointers: p.twoPointers || 0,
            threePointers: p.threePointers || 0,
            freeThrows: p.freeThrows || 0,
            rebounds: p.rebounds || 0,
            assists: p.assists || 0,
            steals: p.steals || 0,
            fouls: p.fouls || 0,
          });
        }
      });
    };

    processTeam(m.homeTeam.name, m.homeTeam.logoColor, m.homeTeam.logoUrl, m.homeTeam.players);
    processTeam(m.awayTeam.name, m.awayTeam.logoColor, m.awayTeam.logoUrl, m.awayTeam.players);
  });

  const all = Array.from(playerMap.values());

  const scoringLeaders = [...all]
    .sort((a, b) => b.points - a.points || b.threePointers - a.threePointers)
    .slice(0, 5);

  const threePointLeaders = [...all]
    .sort((a, b) => b.threePointers - a.threePointers || b.points - a.points)
    .slice(0, 5);

  const assistLeaders = [...all]
    .sort((a, b) => b.assists - a.assists || b.points - a.points)
    .slice(0, 5);

  const reboundLeaders = [...all]
    .sort((a, b) => b.rebounds - a.rebounds || b.points - a.points)
    .slice(0, 5);

  return {
    scoringLeaders,
    threePointLeaders,
    assistLeaders,
    reboundLeaders,
  };
}
