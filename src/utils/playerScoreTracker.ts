import { Player, Sport } from '../types';

/**
 * Updates a team's player roster when points or statistics are scored or corrected.
 * Attributes points, kills, aces, blocks (volleyball) or 2PT, 3PT, FT, REB, AST, FOUL (basketball).
 */
export const updatePlayersWithPoints = (
  players: Player[] = [],
  playerId?: string,
  playerName?: string,
  playerNumber?: number,
  points: number = 0,
  eventType: 'SCORE' | 'FOUL' | 'TIMEOUT' | 'BLOCK' | 'ACE' | 'SPIKE' | 'REBOUND' | 'ASSIST' | 'STEAL' | 'TURNOVER' = 'SCORE',
  reason: string = '',
  sport: Sport = 'volleyball'
): Player[] => {
  // If points === 0 and no basketball stat event type, and no player target, return
  const isBasketballStat = sport === 'basketball' && (
    eventType === 'FOUL' || 
    eventType === 'REBOUND' || 
    eventType === 'ASSIST' || 
    eventType === 'STEAL' || 
    eventType === 'TURNOVER' ||
    reason.toLowerCase().includes('rebound') ||
    reason.toLowerCase().includes('assist') ||
    reason.toLowerCase().includes('foul')
  );

  if (points === 0 && !isBasketballStat && !playerId && !playerName) return players;

  const pIndex = players.findIndex(p =>
    (playerId && p.id === playerId) ||
    (playerName && p.name.toLowerCase().trim() === playerName.toLowerCase().trim()) ||
    (playerNumber !== undefined && playerNumber !== null && p.number === playerNumber)
  );

  const lowerReason = reason.toLowerCase();

  if (pIndex >= 0) {
    const p = players[pIndex];
    const newPts = Math.max(0, (p.points || 0) + points);
    
    // Volleyball specific telemetry
    const isSpike = eventType === 'SPIKE' || lowerReason.includes('spike') || lowerReason.includes('kill');
    const isAce = eventType === 'ACE' || lowerReason.includes('ace');
    const isBlock = eventType === 'BLOCK' || lowerReason.includes('block');

    // Basketball specific telemetry
    const is3Pt = sport === 'basketball' && (points === 3 || points === -3 || lowerReason.includes('3-pointer') || lowerReason.includes('3pt'));
    const is2Pt = sport === 'basketball' && (points === 2 || points === -2 || lowerReason.includes('2-point') || lowerReason.includes('fg'));
    const isFT = sport === 'basketball' && (points === 1 || points === -1) && (lowerReason.includes('free throw') || lowerReason.includes('ft'));
    
    const isRebound = sport === 'basketball' && (eventType === 'REBOUND' || lowerReason.includes('rebound'));
    const isAssist = sport === 'basketball' && (eventType === 'ASSIST' || lowerReason.includes('assist'));
    const isFoul = sport === 'basketball' && (eventType === 'FOUL' || lowerReason.includes('foul'));
    const isSteal = sport === 'basketball' && (eventType === 'STEAL' || lowerReason.includes('steal'));

    const updated: Player = {
      ...p,
      points: newPts,
      kills: isSpike 
        ? Math.max(0, (p.kills || 0) + (points > 0 ? 1 : -1)) 
        : p.kills,
      aces: isAce 
        ? Math.max(0, (p.aces || 0) + (points > 0 ? 1 : -1)) 
        : p.aces,
      blocks: isBlock 
        ? Math.max(0, (p.blocks || 0) + (points > 0 ? 1 : -1)) 
        : p.blocks,
      threePointers: is3Pt 
        ? Math.max(0, (p.threePointers || 0) + (points > 0 ? 1 : -1)) 
        : p.threePointers,
      twoPointers: is2Pt 
        ? Math.max(0, (p.twoPointers || 0) + (points > 0 ? 1 : -1)) 
        : p.twoPointers,
      freeThrows: isFT 
        ? Math.max(0, (p.freeThrows || 0) + (points > 0 ? 1 : -1)) 
        : p.freeThrows,
      rebounds: isRebound
        ? Math.max(0, (p.rebounds || 0) + 1)
        : p.rebounds,
      assists: isAssist
        ? Math.max(0, (p.assists || 0) + 1)
        : p.assists,
      fouls: isFoul
        ? Math.max(0, (p.fouls || 0) + 1)
        : p.fouls,
      steals: isSteal
        ? Math.max(0, (p.steals || 0) + 1)
        : p.steals,
    };

    const next = [...players];
    next[pIndex] = updated;
    return next;
  } else if (playerName && (points > 0 || isBasketballStat)) {
    // Player wasn't in original list, dynamically add them to active roster
    const newPlayer: Player = {
      id: playerId || `p-${Date.now()}`,
      name: playerName,
      number: playerNumber || 10,
      position: sport === 'volleyball' ? 'Spiker' : 'Guard',
      points: points,
      kills: (eventType === 'SPIKE' || lowerReason.includes('spike')) ? 1 : 0,
      aces: (eventType === 'ACE' || lowerReason.includes('ace')) ? 1 : 0,
      blocks: (eventType === 'BLOCK' || lowerReason.includes('block')) ? 1 : 0,
      threePointers: points === 3 ? 1 : 0,
      twoPointers: points === 2 ? 1 : 0,
      freeThrows: points === 1 ? 1 : 0,
      rebounds: eventType === 'REBOUND' || lowerReason.includes('rebound') ? 1 : 0,
      assists: eventType === 'ASSIST' || lowerReason.includes('assist') ? 1 : 0,
      fouls: eventType === 'FOUL' || lowerReason.includes('foul') ? 1 : 0,
      steals: eventType === 'STEAL' || lowerReason.includes('steal') ? 1 : 0,
    };
    return [...players, newPlayer];
  }

  return players;
};
