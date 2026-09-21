import { Team, Player, Sport } from '../types';
import { getChampionshipRules } from './rulesManager';

export const MAX_VOLLEYBALL_SUBS_PER_SET = 6;

export interface SubstitutionResult {
  success: boolean;
  updatedTeam: Team;
  error?: string;
  eventDescription: string;
  playerOut?: Player;
  playerIn?: Player;
}

/**
 * Returns players currently on the court for a team.
 * If isOnCourt is explicitly set, uses it. Otherwise defaults to the first
 * 6 players for volleyball, or first 5 players for basketball.
 */
export function getOnCourtPlayers(players: Player[] = [], sport: Sport): Player[] {
  const maxOnCourt = sport === 'volleyball' ? 6 : 5;
  const explicitOnCourt = players.filter(p => p.isOnCourt === true);
  if (explicitOnCourt.length > 0) {
    return explicitOnCourt;
  }
  // If not explicitly marked, first maxOnCourt are starters on court
  return players.slice(0, maxOnCourt);
}

/**
 * Returns bench reserve players available to be subbed in.
 */
export function getBenchPlayers(players: Player[] = [], sport: Sport): Player[] {
  const maxOnCourt = sport === 'volleyball' ? 6 : 5;
  const explicitBench = players.filter(p => p.isOnCourt === false);
  if (explicitBench.length > 0) {
    return explicitBench;
  }
  // If not explicitly marked, remaining players beyond starters are bench
  return players.slice(maxOnCourt);
}

/**
 * Executes an official player substitution for a team, enforcing FIVB/NCAA/championship rules.
 */
export function executeSubstitution(
  team: Team,
  playerOutId: string,
  playerIn: Player,
  sport: Sport,
  timestamp: string = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  customMaxSubs?: number
): SubstitutionResult {
  const currentSubs = team.substitutionsUsed || 0;
  const maxAllowedSubs = customMaxSubs ?? (getChampionshipRules().volleyball?.maxSubstitutionsPerSet || MAX_VOLLEYBALL_SUBS_PER_SET);

  // Volleyball substitution limit
  if (sport === 'volleyball' && currentSubs >= maxAllowedSubs) {
    return {
      success: false,
      updatedTeam: team,
      error: `Limit Reached: Maximum ${maxAllowedSubs} substitutions allowed per set (Championship Rules).`,
      eventDescription: '',
    };
  }

  const existingPlayers = team.players || [];
  const playerOut = existingPlayers.find(p => p.id === playerOutId);
  if (!playerOut) {
    return {
      success: false,
      updatedTeam: team,
      error: 'Selected player to sub out was not found on the team.',
      eventDescription: '',
    };
  }

  if (playerOut.id === playerIn.id) {
    return {
      success: false,
      updatedTeam: team,
      error: 'Cannot substitute a player for themselves.',
      eventDescription: '',
    };
  }

  let playerInExists = false;
  const updatedPlayers = existingPlayers.map(p => {
    if (p.id === playerOut.id) {
      return { ...p, isOnCourt: false, subbedOutAt: timestamp };
    }
    if (p.id === playerIn.id) {
      playerInExists = true;
      return { ...p, isOnCourt: true, subbedInAt: timestamp };
    }
    return p;
  });

  // If playerIn is a newly added player not yet in team.players
  if (!playerInExists) {
    updatedPlayers.push({
      ...playerIn,
      isOnCourt: true,
      subbedInAt: timestamp,
    });
  }

  const newSubCount = currentSubs + 1;
  const updatedTeam: Team = {
    ...team,
    substitutionsUsed: newSubCount,
    players: updatedPlayers,
  };

  const subBadge = sport === 'volleyball' 
    ? `[Subs: ${newSubCount}/${maxAllowedSubs}]`
    : `[Sub #${newSubCount}]`;

  const eventDescription = `🔄 SUB: #${playerIn.number} ${playerIn.name} (IN) ↔ #${playerOut.number} ${playerOut.name} (OUT) for ${team.name} ${subBadge}`;

  return {
    success: true,
    updatedTeam,
    eventDescription,
    playerOut,
    playerIn,
  };
}

/**
 * Resets the set substitution count when advancing to a new set in volleyball.
 */
export function resetSetSubstitutions(team: Team): Team {
  return {
    ...team,
    substitutionsUsed: 0,
  };
}
