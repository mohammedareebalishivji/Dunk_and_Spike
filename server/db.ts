import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import type { Match, SponsorTier, PlayEvent, Team, Sport } from '../src/types.ts';
import { INITIAL_MATCHES, SPONSOR_TIERS } from '../src/data/mockData.ts';

export interface DatabaseOptions {
  dbPath?: string;
  inMemory?: boolean;
}

export class TournamentDatabase {
  private db: DatabaseSync;

  constructor(options: DatabaseOptions = {}) {
    if (options.inMemory) {
      this.db = new DatabaseSync(':memory:');
    } else {
      const dbFile = options.dbPath || path.resolve(process.cwd(), 'data', 'tournament.db');
      const dir = path.dirname(dbFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.db = new DatabaseSync(dbFile);
    }

    this.initialize();
  }

  private initialize(): void {
    // Enable WAL mode for high-throughput concurrent reads and writes
    try {
      this.db.exec('PRAGMA journal_mode = WAL;');
      this.db.exec('PRAGMA synchronous = NORMAL;');
      this.db.exec('PRAGMA foreign_keys = ON;');
    } catch {
      // Memory DB or restricted environments might ignore some pragmas
    }

    // Matches table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        sport TEXT NOT NULL,
        division TEXT,
        status TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_matches_sport ON matches(sport);
      CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    `);

    // Sponsors table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sponsors (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Play-by-play events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS play_events (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_plays_match ON play_events(match_id);
    `);

    // Teams & Rosters table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        sport TEXT NOT NULL,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Server metadata & audit log
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS server_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Populate initial sponsors if table is empty
    this.seedSponsorsIfEmpty();
  }

  private seedSponsorsIfEmpty(): void {
    const metaCheck = this.db.prepare("SELECT value FROM server_meta WHERE key = 'sponsors_initialized'").get() as { value: string } | undefined;
    if (metaCheck) return;

    const check = this.db.prepare('SELECT COUNT(*) as count FROM sponsors');
    const row = check.get() as { count: number } | undefined;
    if (!row || row.count === 0) {
      this.saveSponsors(SPONSOR_TIERS);
    }
  }

  // --- MATCHES CRUD ---

  public getAllMatches(): Match[] {
    const stmt = this.db.prepare('SELECT data FROM matches ORDER BY updated_at DESC');
    const rows = stmt.all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data) as Match);
  }

  public getMatchById(id: string): Match | null {
    const stmt = this.db.prepare('SELECT data FROM matches WHERE id = ?');
    const row = stmt.get(id) as { data: string } | undefined;
    if (!row) return null;
    return JSON.parse(row.data) as Match;
  }

  public upsertMatch(match: Match): void {
    const stmt = this.db.prepare(`
      INSERT INTO matches (id, sport, division, status, data, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        sport = excluded.sport,
        division = excluded.division,
        status = excluded.status,
        data = excluded.data,
        updated_at = excluded.updated_at
    `);
    stmt.run(
      match.id,
      match.sport,
      match.division || '',
      match.status,
      JSON.stringify(match),
      Date.now()
    );
  }

  public deleteMatch(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM matches WHERE id = ?');
    stmt.run(id);
    return true;
  }

  public clearAllMatches(): void {
    this.db.exec('DELETE FROM matches; DELETE FROM play_events;');
  }

  public loadTemplateMatches(matches: Match[]): void {
    this.clearAllMatches();
    const insert = this.db.prepare(`
      INSERT INTO matches (id, sport, division, status, data, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const now = Date.now();
    for (const match of matches) {
      insert.run(
        match.id,
        match.sport,
        match.division || '',
        match.status,
        JSON.stringify(match),
        now
      );
    }
  }

  // --- SPONSORS CRUD ---

  public getAllSponsors(): SponsorTier[] {
    const stmt = this.db.prepare('SELECT data FROM sponsors ORDER BY id ASC');
    const rows = stmt.all() as { data: string }[];
    const metaCheck = this.db.prepare("SELECT value FROM server_meta WHERE key = 'sponsors_initialized'").get() as { value: string } | undefined;
    if (rows.length === 0 && !metaCheck) return SPONSOR_TIERS;
    return rows.map(r => JSON.parse(r.data) as SponsorTier);
  }

  public saveSponsors(tiers: SponsorTier[]): void {
    this.db.exec('DELETE FROM sponsors');
    const insert = this.db.prepare(`
      INSERT INTO sponsors (id, data, updated_at)
      VALUES (?, ?, ?)
    `);
    const now = Date.now();
    for (const tier of tiers) {
      insert.run(tier.id, JSON.stringify(tier), now);
    }
    const setInit = this.db.prepare(`
      INSERT INTO server_meta (key, value, updated_at)
      VALUES ('sponsors_initialized', '1', ?)
      ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at
    `);
    setInit.run(now);
  }

  // --- PLAY-BY-PLAY TELEMETRY ---

  public logPlayEvent(event: PlayEvent): void {
    const stmt = this.db.prepare(`
      INSERT INTO play_events (id, match_id, timestamp, event_type, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      event.id,
      event.matchId,
      event.timestamp,
      event.type,
      JSON.stringify(event),
      Date.now()
    );
  }

  public getPlayEvents(matchId: string, limit: number = 50): PlayEvent[] {
    const stmt = this.db.prepare(`
      SELECT data FROM play_events 
      WHERE match_id = ? 
      ORDER BY rowid ASC 
      LIMIT ?
    `);
    const rows = stmt.all(matchId, limit) as { data: string }[];
    return rows.map(r => JSON.parse(r.data) as PlayEvent);
  }

  // --- TEAMS & ROSTERS ---

  public getAllTeams(): Team[] {
    const stmt = this.db.prepare('SELECT data FROM teams ORDER BY name ASC');
    const rows = stmt.all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data) as Team);
  }

  public upsertTeam(team: Team, sport: Sport): void {
    const stmt = this.db.prepare(`
      INSERT INTO teams (id, sport, name, data, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        sport = excluded.sport,
        name = excluded.name,
        data = excluded.data,
        updated_at = excluded.updated_at
    `);
    stmt.run(team.id, sport, team.name, JSON.stringify(team), Date.now());
  }

  // --- METADATA ---

  public getMeta(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM server_meta WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  public setMeta(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO server_meta (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `);
    stmt.run(key, value, Date.now());
  }

  public close(): void {
    this.db.close();
  }
}
