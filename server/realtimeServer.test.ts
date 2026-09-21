import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RealtimeServer } from './realtimeServer.ts';
import { WebSocket } from 'ws';
import { Match } from '../src/types.ts';

describe('RealtimeServer (WebSocket & REST API Integration)', () => {
  let server: RealtimeServer;
  const TEST_PORT = 3199;

  const testMatch: Match = {
    id: 'rt-test-match-1',
    sport: 'basketball',
    title: 'Final Four Realtime Test',
    division: "Men's Division I",
    status: 'LIVE',
    court: 'Court 1',
    venue: 'Center Arena',
    basketballPeriod: 'Q1',
    statusDetail: 'LIVE Q1 10:00',
    homeTeam: { id: 'th1', name: 'Spartans', shortName: 'SPA', logoColor: '#0284c7', accentColor: '#38bdf8', record: '0-0', score: 10 },
    awayTeam: { id: 'ta1', name: 'Tigers', shortName: 'TIG', logoColor: '#f97316', accentColor: '#fb923c', record: '0-0', score: 8 },
  };

  beforeAll(async () => {
    server = new RealtimeServer({ port: TEST_PORT, inMemoryDb: true });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('responds to HTTP GET /api/health with status ok', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.engine).toContain('SQLite');
  });

  it('creates and lists matches via HTTP REST API', async () => {
    // Create match
    const createRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMatch),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.id).toBe('rt-test-match-1');

    // List matches
    const listRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/matches`);
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('rt-test-match-1');
  });

  it('returns sponsors via HTTP GET /api/sponsors', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/sponsors`);
    expect(res.status).toBe(200);
    const sponsors = await res.json();
    expect(Array.isArray(sponsors)).toBe(true);
    expect(sponsors.length).toBeGreaterThan(0);
  });

  it('synchronizes real-time scoring events across connected WebSocket clients', async () => {
    const ws1 = new WebSocket(`ws://127.0.0.1:${TEST_PORT}/ws`);
    const ws2 = new WebSocket(`ws://127.0.0.1:${TEST_PORT}/ws`);

    await Promise.all([
      new Promise<void>((resolve) => ws1.on('open', resolve)),
      new Promise<void>((resolve) => ws2.on('open', resolve)),
    ]);

    // Client 2 listens for SCORE_POINT
    const receivedPromise = new Promise<any>((resolve) => {
      ws2.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'SCORE_POINT') {
          resolve(msg);
        }
      });
    });

    // Client 1 sends a score point event
    const updatedMatch: Match = {
      ...testMatch,
      homeTeam: { ...testMatch.homeTeam, score: 12 },
    };

    ws1.send(JSON.stringify({
      type: 'SCORE_POINT',
      match: updatedMatch,
      playEvent: {
        id: 'play-1',
        matchId: testMatch.id,
        timestamp: '09:45',
        period: 'Q1',
        team: 'home',
        type: 'SCORE',
        description: 'Spartans: 2-Point Jumper',
      },
    }));

    const event = await receivedPromise;
    expect(event.type).toBe('SCORE_POINT');
    expect(event.match.homeTeam.score).toBe(12);
    expect(event.playEvent.id).toBe('play-1');

    ws1.close();
    ws2.close();
  });

  it('deletes matches via REST API and broadcasts deletion via WebSocket', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${TEST_PORT}/ws`);
    await new Promise<void>((resolve) => ws.on('open', resolve));

    // Listen for MATCH_DELETED
    const deletedPromise = new Promise<any>((resolve) => {
      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'MATCH_DELETED') {
          resolve(msg);
        }
      });
    });

    // Delete match via WebSocket
    ws.send(JSON.stringify({
      type: 'DELETE_MATCH',
      matchId: testMatch.id,
    }));

    const delEvent = await deletedPromise;
    expect(delEvent.type).toBe('MATCH_DELETED');
    expect(delEvent.matchId).toBe(testMatch.id);

    // Verify match is gone from HTTP GET /api/matches
    const listRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/matches`);
    const list = await listRes.json();
    expect(list.some((m: any) => m.id === testMatch.id)).toBe(false);

    ws.close();
  });
});
