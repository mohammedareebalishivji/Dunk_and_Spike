import { VolleyballMatchFormat } from '../types';

export interface VolleyballRules {
  matchFormat: VolleyballMatchFormat; // 'best-of-3' | 'best-of-5'
  regularSetTargetPoints: number; // default: 25
  decidingSetTargetPoints: number; // default: 15
  winByTwoPoints: boolean; // default: true (must lead by 2 points)
  courtSwitchAtPoints: number; // default: 8 in deciding set
  maxSubstitutionsPerSet: number; // default: 6 (FIVB Rule 15.6)
  timeoutsPerSet: number; // default: 2
  allowMidSetSubstitutions: boolean; // default: true
}

export interface BasketballRules {
  quarterDurationMinutes: number; // default: 10 (FIBA) or 12 (NBA)
  overtimeDurationMinutes: number; // default: 5
  shotClockSeconds: number; // default: 24 (FIBA) or 30 (NCAA)
  teamFoulsBonusThreshold: number; // default: 5 (FIBA)
  teamFoulsDoubleBonusThreshold: number; // default: 10
  playerFoulOutLimit: number; // default: 5 (FIBA/NCAA) or 6 (NBA)
  timeoutsPerGame: number; // default: 4
  maxPlayersOnCourt: number; // strictly: 5
}

export interface ChampionshipRules {
  volleyball: VolleyballRules;
  basketball: BasketballRules;
}

export const DEFAULT_VOLLEYBALL_RULES: VolleyballRules = {
  matchFormat: 'best-of-5',
  regularSetTargetPoints: 25,
  decidingSetTargetPoints: 15,
  winByTwoPoints: true,
  courtSwitchAtPoints: 8,
  maxSubstitutionsPerSet: 6,
  timeoutsPerSet: 2,
  allowMidSetSubstitutions: true,
};

export const DEFAULT_BASKETBALL_RULES: BasketballRules = {
  quarterDurationMinutes: 10,
  overtimeDurationMinutes: 5,
  shotClockSeconds: 24,
  teamFoulsBonusThreshold: 5,
  teamFoulsDoubleBonusThreshold: 10,
  playerFoulOutLimit: 5,
  timeoutsPerGame: 4,
  maxPlayersOnCourt: 5,
};

export const DEFAULT_CHAMPIONSHIP_RULES: ChampionshipRules = {
  volleyball: DEFAULT_VOLLEYBALL_RULES,
  basketball: DEFAULT_BASKETBALL_RULES,
};

export const RULES_STORAGE_KEY = 'dunk_spike_rules_v1';

type RulesChangeListener = (rules: ChampionshipRules) => void;
const listeners: Set<RulesChangeListener> = new Set();

/**
 * Retrieves the current official championship rules from localStorage,
 * or returns the sanctioned defaults.
 */
export function getChampionshipRules(): ChampionshipRules {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(RULES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          volleyball: {
            ...DEFAULT_VOLLEYBALL_RULES,
            ...(parsed.volleyball || {}),
          },
          basketball: {
            ...DEFAULT_BASKETBALL_RULES,
            ...(parsed.basketball || {}),
            maxPlayersOnCourt: 5, // Strictly 5 on court for basketball regulation
          },
        };
      }
    }
  } catch (e) {
    console.error('Failed to load championship rules from localStorage', e);
  }
  return {
    volleyball: { ...DEFAULT_VOLLEYBALL_RULES },
    basketball: { ...DEFAULT_BASKETBALL_RULES },
  };
}

/**
 * Saves customized championship rules to storage and notifies all active listeners.
 */
export function saveChampionshipRules(rules: ChampionshipRules): void {
  const sanitized: ChampionshipRules = {
    volleyball: {
      ...rules.volleyball,
      regularSetTargetPoints: Math.max(10, Math.min(50, rules.volleyball.regularSetTargetPoints || 25)),
      decidingSetTargetPoints: Math.max(5, Math.min(30, rules.volleyball.decidingSetTargetPoints || 15)),
      courtSwitchAtPoints: Math.max(3, Math.min(20, rules.volleyball.courtSwitchAtPoints || 8)),
      maxSubstitutionsPerSet: Math.max(1, Math.min(30, rules.volleyball.maxSubstitutionsPerSet || 6)),
      timeoutsPerSet: Math.max(1, Math.min(5, rules.volleyball.timeoutsPerSet || 2)),
    },
    basketball: {
      ...rules.basketball,
      quarterDurationMinutes: Math.max(1, Math.min(20, rules.basketball.quarterDurationMinutes || 10)),
      overtimeDurationMinutes: Math.max(1, Math.min(10, rules.basketball.overtimeDurationMinutes || 5)),
      shotClockSeconds: Math.max(10, Math.min(45, rules.basketball.shotClockSeconds || 24)),
      teamFoulsBonusThreshold: Math.max(2, Math.min(10, rules.basketball.teamFoulsBonusThreshold || 5)),
      teamFoulsDoubleBonusThreshold: Math.max(5, Math.min(15, rules.basketball.teamFoulsDoubleBonusThreshold || 10)),
      playerFoulOutLimit: Math.max(3, Math.min(8, rules.basketball.playerFoulOutLimit || 5)),
      timeoutsPerGame: Math.max(1, Math.min(10, rules.basketball.timeoutsPerGame || 4)),
      maxPlayersOnCourt: 5,
    },
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(sanitized));
    }
  } catch (e) {
    console.error('Failed to save championship rules to localStorage', e);
  }

  listeners.forEach(fn => {
    try {
      fn(sanitized);
    } catch (err) {
      console.error('Error notifying rules listener', err);
    }
  });
}

/**
 * Resets championship rules to official factory defaults.
 */
export function resetChampionshipRules(): ChampionshipRules {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(RULES_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to reset championship rules', e);
  }

  const defaults = {
    volleyball: { ...DEFAULT_VOLLEYBALL_RULES },
    basketball: { ...DEFAULT_BASKETBALL_RULES },
  };

  listeners.forEach(fn => {
    try {
      fn(defaults);
    } catch (err) {
      console.error('Error notifying rules listener', err);
    }
  });

  return defaults;
}

/**
 * Subscribes a callback to rules changes. Returns an unsubscribe function.
 */
export function subscribeRulesChange(listener: RulesChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
