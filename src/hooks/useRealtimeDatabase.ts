import { useState, useEffect } from 'react';
import { realtimeDB, RealtimeState } from '../services/realtimeDatabase';
import { Match, SponsorTier, PlayEvent } from '../types';

export function useRealtimeDatabase() {
  const [realtimeState, setRealtimeState] = useState<RealtimeState>(() => realtimeDB.getState());

  useEffect(() => {
    realtimeDB.init();
    const unsub = realtimeDB.onStatusChange(setRealtimeState);
    return unsub;
  }, []);

  return {
    ...realtimeState,
    updateMatch: (match: Match) => realtimeDB.updateMatch(match),
    scorePoint: (match: Match, playEvent?: PlayEvent) => realtimeDB.scorePoint(match, playEvent),
    createMatch: (match: Match) => realtimeDB.createMatch(match),
    deleteMatch: (matchId: string) => realtimeDB.deleteMatch(matchId),
    clearAllMatches: () => realtimeDB.clearAllMatches(),
    loadTemplate: (matches: Match[]) => realtimeDB.loadTemplate(matches),
    updateSponsors: (sponsors: SponsorTier[]) => realtimeDB.updateSponsors(sponsors),
    forceResync: () => realtimeDB.forceResync(),
  };
}
