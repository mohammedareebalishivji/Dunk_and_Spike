import { describe, it, expect, beforeEach } from 'vitest';
import { realtimeDB } from './realtimeDatabase';
import { Match } from '../types';

describe('RealtimeDatabase Offline Resilience & Mutation Queue', () => {
  const dummyMatch: Match = {
    id: 'offline-queue-match-1',
    sport: 'basketball',
    title: 'Offline Queue Championship Match',
    division: "Men's D1",
    status: 'LIVE',
    court: 'Court 1',
    venue: 'Center Arena',
    homeTeam: { id: 'h1', name: 'Spartans', shortName: 'SPA', logoColor: '#0284c7', accentColor: '#38bdf8', record: '0-0', score: 10 },
    awayTeam: { id: 'a1', name: 'Tigers', shortName: 'TIG', logoColor: '#f97316', accentColor: '#fb923c', record: '0-0', score: 8 },
  };

  beforeEach(() => {
    // Clear storage and queue before each test
    realtimeDB.clearPendingQueue();
  });

  it('queues mutations when WebSocket connection is offline', () => {
    expect(realtimeDB.getPendingQueueCount()).toBe(0);

    // Dispatch a score update while offline
    realtimeDB.scorePoint({
      ...dummyMatch,
      homeTeam: { ...dummyMatch.homeTeam, score: 12 },
    }, {
      id: 'offline-p1',
      matchId: dummyMatch.id,
      timestamp: '08:30',
      period: 'Q1',
      team: 'home',
      type: 'SCORE',
      description: '2pt Field Goal',
    });

    // Should have 1 queued action
    expect(realtimeDB.getPendingQueueCount()).toBe(1);
    const queue = realtimeDB.getPendingQueue();
    expect(queue[0].type).toBe('SCORE_POINT');
    expect(queue[0].payload.match.id).toBe(dummyMatch.id);
  });

  it('clears queue when requested', () => {
    realtimeDB.updateMatch(dummyMatch);
    expect(realtimeDB.getPendingQueueCount()).toBeGreaterThan(0);

    realtimeDB.clearPendingQueue();
    expect(realtimeDB.getPendingQueueCount()).toBe(0);
  });
});
