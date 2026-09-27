export interface TournamentDetails {
  name: string;
  subheadline: string;
  tagline: string;
  dates: string;
  venue: string;
  sanctionBasketball: string;
  sanctionVolleyball: string;
  accreditation: string;
  contactEmail: string;
  contactPhone: string;
  arenaGate: string;
  basketballAward: string;
  volleyballAward: string;
}

export const TOURNAMENT_DETAILS_STORAGE_KEY = 'dunk_spike_tournament_details_v2';

export const DEFAULT_TOURNAMENT_DETAILS: TournamentDetails = {
  name: 'DUNK & SPIKE',
  subheadline: '2026 Dual-Court Championship',
  tagline: '“Where Legends Rise and Rivals Fall”',
  dates: 'March 24–29, 2026',
  venue: 'NMIMS Hyderabad (NMIMS HYD)',
  sanctionBasketball: 'NCAA DIV-I SANCTIONED',
  sanctionVolleyball: 'AVCA / FIVB COMPLIANT',
  accreditation: 'SEC-VBL / NCAA DIV-I ACCREDITED EVENT',
  contactEmail: 'contact@dunkandspike2026.edu',
  contactPhone: '+1 (800) 555-DUNK',
  arenaGate: 'Gate 2, NMIMS Hyderabad Campus',
  basketballAward: 'Championship Banner & Gold Trophy',
  volleyballAward: 'National Cup & Gold Trophy',
};

let inMemoryDetails: TournamentDetails | null = null;

export function getTournamentDetails(): TournamentDetails {
  if (inMemoryDetails) {
    return inMemoryDetails;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(TOURNAMENT_DETAILS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_TOURNAMENT_DETAILS,
          ...parsed,
        };
      }
    }
  } catch (e) {
    console.error('Failed to load tournament details:', e);
  }
  return DEFAULT_TOURNAMENT_DETAILS;
}

export function saveTournamentDetails(details: Partial<TournamentDetails>): TournamentDetails {
  const current = getTournamentDetails();
  const updated: TournamentDetails = {
    ...current,
    ...details,
  };
  inMemoryDetails = updated;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOURNAMENT_DETAILS_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    }
  } catch (e) {
    console.error('Failed to save tournament details:', e);
  }
  return updated;
}

export function resetTournamentDetails(): TournamentDetails {
  inMemoryDetails = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOURNAMENT_DETAILS_STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    }
  } catch {}
  return DEFAULT_TOURNAMENT_DETAILS;
}
