import { VolleyballMatchFormat, SetScore } from '../types';
import { getChampionshipRules, VolleyballRules } from './rulesManager';

export interface VolleyballRuleState {
  baseTarget: number;
  currentTarget: number;
  isDecidingSet: boolean;
  isDeuce: boolean;
  pointSpecialBadge?: 'DEUCE' | 'SET POINT' | 'MATCH POINT';
  isSetWon: boolean;
  setWinner?: 'home' | 'away';
  isMatchWon: boolean;
  matchWinner?: 'home' | 'away';
  needsCourtSwitch?: boolean;
  statusText: string;
}

/**
 * Returns the base target points for a given set number based on the match format
 * and current championship rules (or custom rules if supplied).
 * - Standard defaults: Sets 1-4 to 25, Deciding Set to 15.
 */
export function getBaseTargetPoints(
  setNumber: number, 
  format: VolleyballMatchFormat,
  customRules?: VolleyballRules
): number {
  const rules = customRules || getChampionshipRules().volleyball;
  const isDeciding = isDecidingSetNumber(setNumber, format);
  return isDeciding ? rules.decidingSetTargetPoints : rules.regularSetTargetPoints;
}

export function isDecidingSetNumber(setNumber: number, format: VolleyballMatchFormat): boolean {
  return (format === 'best-of-3' && setNumber === 3) || (format === 'best-of-5' && setNumber === 5);
}

export function getSetsToWin(format: VolleyballMatchFormat): number {
  return format === 'best-of-3' ? 2 : 3;
}

/**
 * FIVB Official Rule 18.2: In the deciding set, once the leading team
 * reaches the court switch point (standard: 8 points), the teams change courts
 * without delay and player positions remain the same.
 */
export function needsCourtSwitch(
  setNumber: number,
  format: VolleyballMatchFormat,
  homeScore: number,
  awayScore: number,
  customRules?: VolleyballRules
): boolean {
  if (!isDecidingSetNumber(setNumber, format)) return false;
  const rules = customRules || getChampionshipRules().volleyball;
  const switchTarget = rules.courtSwitchAtPoints ?? 8;
  return homeScore >= switchTarget || awayScore >= switchTarget;
}

/**
 * Evaluates the current volleyball score against official FIVB / championship rules:
 * - Must win by at least 2 points (or by 1 if winByTwoPoints is disabled by admin)
 * - Ties near target trigger DEUCE when winByTwoPoints is enabled
 * - Play continues until one team achieves a 2-point lead
 */
export function evaluateVolleyballScore(
  homeScore: number,
  awayScore: number,
  setNumber: number,
  format: VolleyballMatchFormat,
  homeSetsWon: number,
  awaySetsWon: number,
  customRules?: VolleyballRules
): VolleyballRuleState {
  const rules = customRules || getChampionshipRules().volleyball;
  const baseTarget = getBaseTargetPoints(setNumber, format, rules);
  const isDeciding = isDecidingSetNumber(setNumber, format);
  const setsToWin = getSetsToWin(format);
  const winByTwo = rules.winByTwoPoints ?? true;
  const deuceThreshold = baseTarget - 1;

  const maxScore = Math.max(homeScore, awayScore);
  const minScore = Math.min(homeScore, awayScore);
  const scoreDiff = Math.abs(homeScore - awayScore);

  let currentTarget = baseTarget;
  let isDeuce = false;
  let pointSpecialBadge: 'DEUCE' | 'SET POINT' | 'MATCH POINT' | undefined = undefined;
  let isSetWon = false;
  let setWinner: 'home' | 'away' | undefined = undefined;
  let isMatchWon = false;
  let matchWinner: 'home' | 'away' | undefined = undefined;

  // Has either team achieved a win?
  // If winByTwo is enabled: must reach baseTarget AND lead by >= 2.
  // If winByTwo is disabled: reaching baseTarget with lead >= 1 wins immediately.
  const requiredMargin = winByTwo ? 2 : 1;
  if (maxScore >= baseTarget && scoreDiff >= requiredMargin) {
    isSetWon = true;
    setWinner = homeScore > awayScore ? 'home' : 'away';

    const projectedSetsWon = (setWinner === 'home' ? homeSetsWon : awaySetsWon) + 1;
    if (projectedSetsWon >= setsToWin) {
      isMatchWon = true;
      matchWinner = setWinner;
    }
  } else {
    // In progress: Check for Deuce / Set Point / Match Point
    if (winByTwo && homeScore >= deuceThreshold && awayScore >= deuceThreshold) {
      if (homeScore === awayScore) {
        // Both reached deuce threshold and are tied -> DEUCE!
        isDeuce = true;
        currentTarget = homeScore + 2;
        pointSpecialBadge = 'DEUCE';
      } else if (scoreDiff === 1) {
        // One team is ahead by 1 in deuce -> they are at Set Point / Match Point!
        const leadingTeam = homeScore > awayScore ? 'home' : 'away';
        currentTarget = maxScore + 1;
        const leadingSetsWon = leadingTeam === 'home' ? homeSetsWon : awaySetsWon;
        
        if (leadingSetsWon + 1 >= setsToWin) {
          pointSpecialBadge = 'MATCH POINT';
        } else {
          pointSpecialBadge = 'SET POINT';
        }
      }
    } else {
      // Standard play before deuce threshold
      currentTarget = baseTarget;
      if (maxScore === deuceThreshold && minScore < deuceThreshold) {
        const leadingTeam = homeScore > awayScore ? 'home' : 'away';
        const leadingSetsWon = leadingTeam === 'home' ? homeSetsWon : awaySetsWon;

        if (leadingSetsWon + 1 >= setsToWin) {
          pointSpecialBadge = 'MATCH POINT';
        } else {
          pointSpecialBadge = 'SET POINT';
        }
      }
    }
  }

  // Generate human-readable status detail
  let statusText = `Set ${setNumber} (${homeScore}-${awayScore})`;
  if (isMatchWon) {
    statusText = `MATCH FINAL (${setWinner === 'home' ? homeSetsWon + 1 : homeSetsWon}-${setWinner === 'away' ? awaySetsWon + 1 : awaySetsWon})`;
  } else if (isSetWon) {
    statusText = `Set ${setNumber} Won (${homeScore}-${awayScore})`;
  } else if (isDeuce) {
    statusText = `Set ${setNumber} ${homeScore}-${awayScore} (DEUCE)`;
  } else if (pointSpecialBadge) {
    statusText = `Set ${setNumber} ${homeScore}-${awayScore} (${pointSpecialBadge})`;
  }

  return {
    baseTarget,
    currentTarget,
    isDecidingSet: isDeciding,
    isDeuce,
    pointSpecialBadge,
    isSetWon,
    setWinner,
    isMatchWon,
    matchWinner,
    needsCourtSwitch: needsCourtSwitch(setNumber, format, homeScore, awayScore),
    statusText,
  };
}
