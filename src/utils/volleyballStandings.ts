import { Match, Player } from '../types';

export interface VolleyballTeamStanding {
  rank: number;
  teamId: string;
  teamName: string;
  teamShortName: string;
  logoColor: string;
  logoUrl?: string;
  mp: number; // Matches Played
  wins: number;
  losses: number;
  fivbPoints: number; // 3-0/3-1 = 3pts, 3-2 = 2pts, 2-3 = 1pt, 0-3/1-3 = 0pts
  setsWon: number;
  setsLost: number;
  setRatio: string;
  ptsWon: number;
  ptsLost: number;
  ptRatio: string;
  streak: string;
  form: ('W' | 'L')[];
}

export interface VolleyballPlayerLeader {
  id: string;
  name: string;
  number: number;
  teamName: string;
  logoColor: string;
  logoUrl?: string;
  photoUrl?: string;
  position: string;
  points: number;
  kills: number;
  aces: number;
  blocks: number;
  digs: number;
}

/**
 * Calculates official FIVB / VNL Volleyball Standings from match results.
 * FIVB Official Priority:
 * 1. Matches Won
 * 2. FIVB Points (3, 2, 1, 0)
 * 3. Set Ratio (Sets Won / Sets Lost)
 * 4. Point Ratio (Points Won / Points Lost)
 */
export function calculateVolleyballStandings(matches: Match[] = []): VolleyballTeamStanding[] {
  const volleyballMatches = matches.filter(m => m.sport === 'volleyball');
  const completedMatches = volleyballMatches.filter(m => m.status === 'FINAL');

  interface InternalTeamRecord {
    teamId: string;
    teamName: string;
    teamShortName: string;
    logoColor: string;
    logoUrl?: string;
    wins: number;
    losses: number;
    fivbPoints: number;
    setsWon: number;
    setsLost: number;
    ptsWon: number;
    ptsLost: number;
    recentResults: ('W' | 'L')[];
  }

  const teamMap = new Map<string, InternalTeamRecord>();

  volleyballMatches.forEach(m => {
    if (!teamMap.has(m.homeTeam.name)) {
      teamMap.set(m.homeTeam.name, {
        teamId: m.homeTeam.id,
        teamName: m.homeTeam.name,
        teamShortName: m.homeTeam.shortName || m.homeTeam.name.substring(0, 3).toUpperCase(),
        logoColor: m.homeTeam.logoColor || '#0284c7',
        logoUrl: m.homeTeam.logoUrl,
        wins: 0,
        losses: 0,
        fivbPoints: 0,
        setsWon: 0,
        setsLost: 0,
        ptsWon: 0,
        ptsLost: 0,
        recentResults: [],
      });
    }
    if (!teamMap.has(m.awayTeam.name)) {
      teamMap.set(m.awayTeam.name, {
        teamId: m.awayTeam.id,
        teamName: m.awayTeam.name,
        teamShortName: m.awayTeam.shortName || m.awayTeam.name.substring(0, 3).toUpperCase(),
        logoColor: m.awayTeam.logoColor || '#f97316',
        logoUrl: m.awayTeam.logoUrl,
        wins: 0,
        losses: 0,
        fivbPoints: 0,
        setsWon: 0,
        setsLost: 0,
        ptsWon: 0,
        ptsLost: 0,
        recentResults: [],
      });
    }
  });

  completedMatches.forEach(m => {
    const home = teamMap.get(m.homeTeam.name);
    const away = teamMap.get(m.awayTeam.name);
    if (!home || !away) return;

    const homeSets = m.homeTeam.setsWon || 0;
    const awaySets = m.awayTeam.setsWon || 0;

    // Tally sets
    home.setsWon += homeSets;
    home.setsLost += awaySets;
    away.setsWon += awaySets;
    away.setsLost += homeSets;

    // Tally rally points across set scores if recorded
    if (m.setScores && m.setScores.length > 0) {
      m.setScores.forEach(s => {
        home.ptsWon += s.homeScore || 0;
        home.ptsLost += s.awayScore || 0;
        away.ptsWon += s.awayScore || 0;
        away.ptsLost += s.homeScore || 0;
      });
    } else {
      home.ptsWon += m.homeTeam.score || 0;
      home.ptsLost += m.awayTeam.score || 0;
      away.ptsWon += m.awayTeam.score || 0;
      away.ptsLost += m.homeTeam.score || 0;
    }

    // Official FIVB Points Allocation:
    // 3-0 or 3-1: Winner gets 3 pts, Loser gets 0 pts
    // 3-2: Winner gets 2 pts, Loser gets 1 pt
    // 2-0 or 2-1 (best of 3): Winner gets 3 pts (or 2 if 2-1), Loser gets 0 or 1
    if (homeSets > awaySets) {
      home.wins += 1;
      home.recentResults.unshift('W');
      away.losses += 1;
      away.recentResults.unshift('L');

      if (awaySets === homeSets - 1) {
        // Deciding set tiebreaker win (e.g. 3-2 or 2-1)
        home.fivbPoints += 2;
        away.fivbPoints += 1;
      } else {
        // Clear sweep or 4-set win (e.g. 3-0, 3-1, 2-0)
        home.fivbPoints += 3;
        away.fivbPoints += 0;
      }
    } else if (awaySets > homeSets) {
      away.wins += 1;
      away.recentResults.unshift('W');
      home.losses += 1;
      home.recentResults.unshift('L');

      if (homeSets === awaySets - 1) {
        // Deciding set tiebreaker win
        away.fivbPoints += 2;
        home.fivbPoints += 1;
      } else {
        away.fivbPoints += 3;
        home.fivbPoints += 0;
      }
    } else {
      // Fallback: sets tied in final match - decide winner by points scored or home
      const homeWins = home.ptsWon >= away.ptsWon;
      const winner = homeWins ? home : away;
      const loser = homeWins ? away : home;
      winner.wins += 1;
      winner.recentResults.unshift('W');
      loser.losses += 1;
      loser.recentResults.unshift('L');
      winner.fivbPoints += 2;
      loser.fivbPoints += 1;
    }
  });

  const teamList = Array.from(teamMap.values()).map(t => {
    const mp = t.wins + t.losses;
    
    // Set ratio: SW / SL
    let setRatioNum = t.setsLost > 0 ? t.setsWon / t.setsLost : t.setsWon > 0 ? 999 : 0;
    let setRatio = t.setsLost === 0 ? (t.setsWon > 0 ? 'MAX' : '0.000') : (t.setsWon / t.setsLost).toFixed(3);

    // Point ratio: PW / PL
    let ptRatioNum = t.ptsLost > 0 ? t.ptsWon / t.ptsLost : t.ptsWon > 0 ? 999 : 0;
    let ptRatio = t.ptsLost === 0 ? (t.ptsWon > 0 ? 'MAX' : '0.000') : (t.ptsWon / t.ptsLost).toFixed(3);

    // Streak
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
      mp,
      setRatio,
      setRatioNum,
      ptRatio,
      ptRatioNum,
      streak,
      form: t.recentResults.slice(0, 5),
    };
  });

  // FIVB Standings Sorting:
  // 1. Matches Won (wins desc)
  // 2. FIVB Points (fivbPoints desc)
  // 3. Set Ratio (setRatioNum desc)
  // 4. Point Ratio (ptRatioNum desc)
  teamList.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.fivbPoints !== a.fivbPoints) return b.fivbPoints - a.fivbPoints;
    if (b.setRatioNum !== a.setRatioNum) return b.setRatioNum - a.setRatioNum;
    return b.ptRatioNum - a.ptRatioNum;
  });

  return teamList.map((t, idx) => ({
    rank: idx + 1,
    teamId: t.teamId,
    teamName: t.teamName,
    teamShortName: t.teamShortName,
    logoColor: t.logoColor,
    mp: t.mp,
    wins: t.wins,
    losses: t.losses,
    fivbPoints: t.fivbPoints,
    setsWon: t.setsWon,
    setsLost: t.setsLost,
    setRatio: t.setRatio,
    ptsWon: t.ptsWon,
    ptsLost: t.ptsLost,
    ptRatio: t.ptRatio,
    streak: t.streak,
    form: t.form,
  }));
}

/**
 * Aggregates volleyball players and returns sorted leaders across FIVB skill categories.
 */
export function getVolleyballPlayerLeaders(matches: Match[] = []): {
  scoringLeaders: VolleyballPlayerLeader[];
  killLeaders: VolleyballPlayerLeader[];
  aceLeaders: VolleyballPlayerLeader[];
  blockLeaders: VolleyballPlayerLeader[];
} {
  const volleyballMatches = matches.filter(m => m.sport === 'volleyball');
  const playerMap = new Map<string, VolleyballPlayerLeader>();

  volleyballMatches.forEach(m => {
    const processTeam = (teamName: string, logoColor: string, logoUrl?: string, players: Player[] = []) => {
      players.forEach(p => {
        const key = `${p.name}-${teamName}`.toLowerCase();
        const existing = playerMap.get(key);
        if (existing) {
          existing.points += p.points || 0;
          existing.kills += p.kills || 0;
          existing.aces += p.aces || 0;
          existing.blocks += p.blocks || 0;
          existing.digs += p.digs || 0;
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
            position: p.position || 'Outside Hitter',
            points: p.points || 0,
            kills: p.kills || 0,
            aces: p.aces || 0,
            blocks: p.blocks || 0,
            digs: p.digs || 0,
          });
        }
      });
    };

    processTeam(m.homeTeam.name, m.homeTeam.logoColor, m.homeTeam.logoUrl, m.homeTeam.players);
    processTeam(m.awayTeam.name, m.awayTeam.logoColor, m.awayTeam.logoUrl, m.awayTeam.players);
  });

  const all = Array.from(playerMap.values());

  const scoringLeaders = [...all]
    .sort((a, b) => b.points - a.points || b.kills - a.kills)
    .slice(0, 5);

  const killLeaders = [...all]
    .sort((a, b) => b.kills - a.kills || b.points - a.points)
    .slice(0, 5);

  const aceLeaders = [...all]
    .sort((a, b) => b.aces - a.aces || b.points - a.points)
    .slice(0, 5);

  const blockLeaders = [...all]
    .sort((a, b) => b.blocks - a.blocks || b.points - a.points)
    .slice(0, 5);

  return {
    scoringLeaders,
    killLeaders,
    aceLeaders,
    blockLeaders,
  };
}
