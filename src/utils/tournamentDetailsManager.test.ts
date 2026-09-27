import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  getTournamentDetails,
  saveTournamentDetails,
  resetTournamentDetails,
  DEFAULT_TOURNAMENT_DETAILS,
} from './tournamentDetailsManager';

describe('tournamentDetailsManager', () => {
  beforeAll(() => {
    const storage: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, val: string) => { storage[key] = String(val); },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    };
  });

  beforeEach(() => {
    (globalThis as any).localStorage.clear();
    resetTournamentDetails();
  });

  it('provides default tournament details without cash prizes', () => {
    const details = getTournamentDetails();
    expect(details.name).toBe('DUNK & SPIKE');
    expect(details.basketballAward).toBe('Championship Banner & Gold Trophy');
    expect(details.volleyballAward).toBe('National Cup & Gold Trophy');
    
    // Explicitly verify no commercial cash prize strings exist in awards
    expect(details.basketballAward).not.toContain('$');
    expect(details.basketballAward.toLowerCase()).not.toContain('cash');
    expect(details.volleyballAward).not.toContain('$');
    expect(details.volleyballAward.toLowerCase()).not.toContain('cash');
  });

  it('persists customized tournament details and retrieves them', () => {
    const customized = {
      ...DEFAULT_TOURNAMENT_DETAILS,
      name: 'NATIONAL COLLEGIATE CHAMPIONSHIP',
      venue: 'Olympic Indoor Stadium',
      basketballAward: 'Presidential Trophy & Gold Medallions',
    };

    saveTournamentDetails(customized);
    const loaded = getTournamentDetails();

    expect(loaded.name).toBe('NATIONAL COLLEGIATE CHAMPIONSHIP');
    expect(loaded.venue).toBe('Olympic Indoor Stadium');
    expect(loaded.basketballAward).toBe('Presidential Trophy & Gold Medallions');
  });

  it('resets tournament details to collegiate default honors', () => {
    saveTournamentDetails({
      ...DEFAULT_TOURNAMENT_DETAILS,
      name: 'Temporary Modified Name',
    });

    const reset = resetTournamentDetails();
    expect(reset.name).toBe('DUNK & SPIKE');
    expect(getTournamentDetails().name).toBe('DUNK & SPIKE');
  });
});
