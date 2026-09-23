import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TournamentDatabase } from './db';
import { Match, PlayEvent } from '../src/types';

describe('TournamentDatabase (Native node:sqlite WAL Engine)', () => {
  let db: TournamentDatabase;

  const sampleMatch: Match = {
    id: 'test-match-1',
    sport: 'volleyball',
    title: 'Surge vs Spikers Championship',
    division: "Women's Division I",
    status: 'LIVE',
    court: 'Court 1',
    venue: 'Main Pavilion',
    volleyballFormat: 'best-of-5',
    currentSetNumber: 1,
    targetPoints: 25,
    isDeuce: false,
    statusDetail: 'SET 1 (14-12)',
    homeTeam: {
      id: 'h1',
      name: 'Pacific Surge',
      shortName: 'SUR',
      logoColor: '#0284c7',
      accentColor: '#38bdf8',
      record: '0-0',
      score: 14,
      setsWon: 0,
      players: [
        { id: 'p1', name: 'Elena Rostova', number: 7, position: 'Outside Hitter', points: 5 },
      ],
    },
    awayTeam: {
      id: 'a1',
      name: 'Peak Spikers',
      shortName: 'SPK',
      logoColor: '#f97316',
      accentColor: '#fb923c',
      record: '0-0',
      score: 12,
      setsWon: 0,
    },
  };

  beforeEach(() => {
    db = new TournamentDatabase({ inMemory: true });
  });

  afterEach(() => {
    db.close();
  });

  it('initializes with empty matches and default sponsors', () => {
    const matches = db.getAllMatches();
    expect(matches).toEqual([]);
    const sponsors = db.getAllSponsors();
    expect(sponsors.length).toBeGreaterThan(0);
  });

  it('upserts and retrieves a match with full player telemetry', () => {
    db.upsertMatch(sampleMatch);
    const retrieved = db.getMatchById('test-match-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('test-match-1');
    expect(retrieved?.homeTeam.score).toBe(14);
    expect(retrieved?.homeTeam.players?.[0].name).toBe('Elena Rostova');

    // Update match score
    const updated: Match = {
      ...sampleMatch,
      homeTeam: {
        ...sampleMatch.homeTeam,
        score: 15,
      },
    };
    db.upsertMatch(updated);
    const afterUpdate = db.getMatchById('test-match-1');
    expect(afterUpdate?.homeTeam.score).toBe(15);
  });

  it('deletes a match by id', () => {
    db.upsertMatch(sampleMatch);
    expect(db.getAllMatches().length).toBe(1);

    db.deleteMatch('test-match-1');
    expect(db.getAllMatches().length).toBe(0);
    expect(db.getMatchById('test-match-1')).toBeNull();
  });

  it('clears all matches and logs', () => {
    db.upsertMatch(sampleMatch);
    db.upsertMatch({ ...sampleMatch, id: 'test-match-2' });
    expect(db.getAllMatches().length).toBe(2);

    db.clearAllMatches();
    expect(db.getAllMatches().length).toBe(0);
  });

  it('loads template matches cleanly', () => {
    db.loadTemplateMatches([sampleMatch]);
    const matches = db.getAllMatches();
    expect(matches.length).toBe(1);
    expect(matches[0].id).toBe('test-match-1');
  });

  it('logs and retrieves play-by-play events in correct order', () => {
    const play1: PlayEvent = {
      id: 'ev-1',
      matchId: 'test-match-1',
      timestamp: '10:00',
      period: 'Set 1',
      team: 'home',
      type: 'SPIKE',
      description: 'Elena Rostova spike winner down the line',
      playerId: 'p1',
      playerName: 'Elena Rostova',
      playerNumber: 7,
    };
    const play2: PlayEvent = {
      id: 'ev-2',
      matchId: 'test-match-1',
      timestamp: '10:01',
      period: 'Set 1',
      team: 'away',
      type: 'FOUL',
      description: 'Peak Spikers net touch fault',
    };

    db.logPlayEvent(play1);
    db.logPlayEvent(play2);

    const plays = db.getPlayEvents('test-match-1');
    expect(plays.length).toBe(2);
    expect(plays[0].id).toBe('ev-1');
    expect(plays[1].id).toBe('ev-2');
  });

  it('stores and retrieves server metadata keys', () => {
    db.setMeta('court_rotation_interval', '15');
    expect(db.getMeta('court_rotation_interval')).toBe('15');
  });

  it('exports and restores a complete tournament snapshot database', () => {
    // Populate match and event
    db.upsertMatch(sampleMatch);
    const play1: PlayEvent = {
      id: 'snap-ev-1',
      matchId: 'test-match-1',
      timestamp: '12:00',
      period: 'Set 1',
      team: 'home',
      type: 'SPIKE',
      description: 'Point surge',
    };
    db.logPlayEvent(play1);

    // Export
    const snapshot = db.exportSnapshot();
    expect(snapshot.version).toBe(1);
    expect(snapshot.matches).toHaveLength(1);
    expect(snapshot.matches[0].id).toBe('test-match-1');
    expect(snapshot.sponsors.length).toBeGreaterThan(0);
    expect(snapshot.playEvents).toHaveLength(1);

    // Create a fresh clean database and restore snapshot
    const db2 = new TournamentDatabase({ inMemory: true });
    expect(db2.getAllMatches()).toHaveLength(0);

    const restoreResult = db2.restoreSnapshot(snapshot);
    expect(restoreResult.success).toBe(true);
    expect(restoreResult.matchCount).toBe(1);

    const restoredMatches = db2.getAllMatches();
    expect(restoredMatches).toHaveLength(1);
    expect(restoredMatches[0].id).toBe('test-match-1');
    expect(restoredMatches[0].homeTeam.name).toBe('Pacific Surge');

    const restoredPlays = db2.getPlayEvents('test-match-1');
    expect(restoredPlays).toHaveLength(1);
    expect(restoredPlays[0].id).toBe('snap-ev-1');

    db2.close();
  });
});
