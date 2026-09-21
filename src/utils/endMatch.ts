import { Match, SetScore } from '../types';

export interface EndMatchResult {
  updatedMatch: Match;
  winnerSide: 'home' | 'away';
  winnerName: string;
}

/**
 * Concludes a match:
 * 1. The team with the most set wins is declared the winner.
 *    (If sets are tied, the team leading the score or home team wins the deciding set).
 * 2. +1 point is awarded to the winning team on the scoreboard and standings.
 * 3. Status is set to 'FINAL', clearing deuce and pending set advance flags.
 */
export function endMatchWithWinner(match: Match): EndMatchResult {
  const homeSets = match.homeTeam.setsWon ?? 0;
  const awaySets = match.awayTeam.setsWon ?? 0;
  const homeScore = match.homeTeam.score ?? 0;
  const awayScore = match.awayTeam.score ?? 0;

  let winnerSide: 'home' | 'away';

  if (match.sport === 'volleyball') {
    if (homeSets > awaySets) {
      winnerSide = 'home';
    } else if (awaySets > homeSets) {
      winnerSide = 'away';
    } else {
      // Sets are tied: team with higher current score (or home if tied) wins
      winnerSide = homeScore >= awayScore ? 'home' : 'away';
    }
  } else {
    // Basketball: if sets are tracked and unequal, team with most sets wins;
    // otherwise team with higher score (or home if tied) wins
    if (homeSets > awaySets) {
      winnerSide = 'home';
    } else if (awaySets > homeSets) {
      winnerSide = 'away';
    } else {
      winnerSide = homeScore >= awayScore ? 'home' : 'away';
    }
  }

  // Ensure winning team has strictly more set wins ("team with most set win is the winner")
  let newHomeSets = homeSets;
  let newAwaySets = awaySets;
  if (homeSets === awaySets) {
    if (winnerSide === 'home') {
      newHomeSets = homeSets + 1;
    } else {
      newAwaySets = awaySets + 1;
    }
  }

  // Award +1 point to the winning team for scoreboard and standings
  let newHomeScore = homeScore;
  let newAwayScore = awayScore;

  if (winnerSide === 'home') {
    newHomeScore = homeScore + 1;
  } else {
    newAwayScore = awayScore + 1;
  }

  // For basketball, ensure winner's score is strictly higher than loser's
  if (match.sport === 'basketball') {
    if (winnerSide === 'home' && newHomeScore <= newAwayScore) {
      newHomeScore = newAwayScore + 1;
    } else if (winnerSide === 'away' && newAwayScore <= newHomeScore) {
      newAwayScore = newHomeScore + 1;
    }
  }

  // Update setScores for volleyball so rally points reflect in standings
  const currentSet = match.currentSetNumber || 1;
  const updatedSetScores: SetScore[] = match.setScores ? match.setScores.map(s => ({ ...s })) : [];

  if (match.sport === 'volleyball') {
    const setIdx = updatedSetScores.findIndex(s => s.set === currentSet);
    if (setIdx >= 0) {
      const curSet = updatedSetScores[setIdx];
      updatedSetScores[setIdx] = {
        ...curSet,
        homeScore: winnerSide === 'home' ? (curSet.homeScore || 0) + 1 : curSet.homeScore,
        awayScore: winnerSide === 'away' ? (curSet.awayScore || 0) + 1 : curSet.awayScore,
        isCompleted: true,
        winner: winnerSide,
      };
    } else {
      updatedSetScores.push({
        set: currentSet,
        homeScore: winnerSide === 'home' ? newHomeScore : homeScore,
        awayScore: winnerSide === 'away' ? newAwayScore : awayScore,
        isCompleted: true,
        targetPoints: match.targetPoints || 25,
        isDecidingSet: currentSet === 5 || (match.volleyballFormat === 'best-of-3' && currentSet === 3),
        winner: winnerSide,
      });
    }
  }

  // Update quarterScores for basketball if applicable
  let newHomeQuarterScores = match.homeTeam.quarterScores ? [...match.homeTeam.quarterScores] : undefined;
  let newAwayQuarterScores = match.awayTeam.quarterScores ? [...match.awayTeam.quarterScores] : undefined;
  if (match.sport === 'basketball') {
    if (winnerSide === 'home' && newHomeQuarterScores && newHomeQuarterScores.length > 0) {
      newHomeQuarterScores[newHomeQuarterScores.length - 1] += (newHomeScore - homeScore);
    } else if (winnerSide === 'away' && newAwayQuarterScores && newAwayQuarterScores.length > 0) {
      newAwayQuarterScores[newAwayQuarterScores.length - 1] += (newAwayScore - awayScore);
    }
  }

  // Update player points if roster exists: give the +1 point to on-court player or highest scorer
  let updatedHomePlayers = match.homeTeam.players ? [...match.homeTeam.players] : undefined;
  let updatedAwayPlayers = match.awayTeam.players ? [...match.awayTeam.players] : undefined;

  if (winnerSide === 'home' && updatedHomePlayers && updatedHomePlayers.length > 0) {
    const activePlayer = updatedHomePlayers.find(p => p.isOnCourt) || updatedHomePlayers[0];
    if (activePlayer) {
      updatedHomePlayers = updatedHomePlayers.map(p =>
        p.id === activePlayer.id ? { ...p, points: (p.points || 0) + 1 } : p
      );
    }
  } else if (winnerSide === 'away' && updatedAwayPlayers && updatedAwayPlayers.length > 0) {
    const activePlayer = updatedAwayPlayers.find(p => p.isOnCourt) || updatedAwayPlayers[0];
    if (activePlayer) {
      updatedAwayPlayers = updatedAwayPlayers.map(p =>
        p.id === activePlayer.id ? { ...p, points: (p.points || 0) + 1 } : p
      );
    }
  }

  const winnerName = winnerSide === 'home' ? match.homeTeam.name : match.awayTeam.name;

  const statusDetail = match.sport === 'volleyball'
    ? `FINAL (${newHomeSets}-${newAwaySets} · ${winnerName.toUpperCase()} WINS)`
    : `FINAL (${newHomeScore}-${newAwayScore} · ${winnerName.toUpperCase()} WINS)`;

  const updatedMatch: Match = {
    ...match,
    status: 'FINAL',
    statusDetail,
    basketballPeriod: match.sport === 'basketball' ? 'FINAL' : match.basketballPeriod,
    isDeuce: false,
    pointSpecialBadge: undefined,
    completedSetPendingAdvance: undefined,
    homeTeam: {
      ...match.homeTeam,
      score: newHomeScore,
      setsWon: newHomeSets,
      quarterScores: newHomeQuarterScores,
      players: updatedHomePlayers,
    },
    awayTeam: {
      ...match.awayTeam,
      score: newAwayScore,
      setsWon: newAwaySets,
      quarterScores: newAwayQuarterScores,
      players: updatedAwayPlayers,
    },
    setScores: match.sport === 'volleyball' ? updatedSetScores : match.setScores,
  };

  return { updatedMatch, winnerSide, winnerName };
}
