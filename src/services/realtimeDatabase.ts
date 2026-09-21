import { Match, SponsorTier, PlayEvent } from '../types';

export type ConnectionStatus = 'connected' | 'connecting' | 'offline';

export interface RealtimeState {
  status: ConnectionStatus;
  peerCount: number;
  pingMs: number;
  dbEngine: string;
  lastSyncTime: number;
}

type StatusListener = (state: RealtimeState) => void;
type MatchesListener = (matches: Match[]) => void;
type SponsorsListener = (sponsors: SponsorTier[]) => void;
type ScoreEventListener = (event: { match: Match; playEvent?: PlayEvent }) => void;

const BROADCAST_CHANNEL_NAME = 'dunk_spike_realtime_channel_v1';
const STORAGE_KEY_MATCHES = 'dunk_spike_matches_v2';
const STORAGE_KEY_SPONSORS = 'dunk_spike_sponsors_v2';

class RealtimeDatabaseService {
  private ws: WebSocket | null = null;
  private channel: BroadcastChannel | null = null;
  private statusListeners: Set<StatusListener> = new Set();
  private matchesListeners: Set<MatchesListener> = new Set();
  private sponsorsListeners: Set<SponsorsListener> = new Set();
  private scoreEventListeners: Set<ScoreEventListener> = new Set();

  private state: RealtimeState = {
    status: 'offline',
    peerCount: 1,
    pingMs: 0,
    dbEngine: 'Local SQLite / Cache',
    lastSyncTime: Date.now(),
  };

  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private pingSentAt = 0;
  private isInitialized = false;

  constructor() {
    // Setup BroadcastChannel for immediate cross-tab sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.handleBroadcastMessage(event.data);
        };
      } catch (e) {
        console.warn('[RealtimeDB] BroadcastChannel not supported:', e);
      }
    }
  }

  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;
    this.connect();
  }

  private getWebSocketUrl(): string {
    const isHttps = window.location.protocol === 'https:';
    const wsProto = isHttps ? 'wss:' : 'ws:';
    const host = window.location.hostname || '127.0.0.1';
    
    // In local dev, connect directly to backend port 3001 for instant zero-latency sync
    if (window.location.port === '3000' || host === 'localhost' || host === '127.0.0.1') {
      return `${wsProto}//${host}:3001/ws`;
    }
    return `${wsProto}//${window.location.host}/ws`;
  }

  private connect(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.updateState({ status: 'connecting' });

    try {
      const url = this.getWebSocketUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateState({
          status: 'connected',
          dbEngine: 'SQLite 3 (WAL mode) · node:sqlite',
          lastSyncTime: Date.now(),
        });

        this.startPingInterval();

        // Request latest sync snapshot
        this.send({ type: 'GET_SYNC' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (err) {
          console.error('[RealtimeDB] Error handling WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        this.cleanupConnection();
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        // Handled in onclose
      };
    } catch (e) {
      this.cleanupConnection();
      this.scheduleReconnect();
    }
  }

  private cleanupConnection(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.ws = null;
    this.updateState({
      status: 'offline',
      peerCount: 1,
      pingMs: 0,
      dbEngine: 'Local Cache / Offline',
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startPingInterval(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.pingSentAt = performance.now();
        this.send({ type: 'PING' });
      }
    }, 10000);
  }

  private handleServerMessage(data: any): void {
    switch (data.type) {
      case 'INIT_STATE': {
        const { matches, sponsors, peerCount, dbEngine } = data.payload;
        if (Array.isArray(matches)) {
          this.notifyMatches(matches);
        }
        if (Array.isArray(sponsors)) {
          this.notifySponsors(sponsors);
        }
        this.updateState({
          peerCount: peerCount || 1,
          dbEngine: dbEngine || this.state.dbEngine,
          lastSyncTime: Date.now(),
        });
        break;
      }

      case 'PONG': {
        if (this.pingSentAt > 0) {
          const latency = Math.round(performance.now() - this.pingSentAt);
          this.updateState({ pingMs: latency, lastSyncTime: Date.now() });
        }
        break;
      }

      case 'PEERS_COUNT': {
        this.updateState({ peerCount: data.count || 1 });
        break;
      }

      case 'MATCHES_SYNC': {
        if (Array.isArray(data.matches)) {
          this.notifyMatches(data.matches);
        }
        break;
      }

      case 'MATCH_UPDATED':
      case 'MATCH_CREATED': {
        if (data.match) {
          this.applySingleMatchUpdate(data.match);
        }
        break;
      }

      case 'SCORE_POINT': {
        if (data.match) {
          this.applySingleMatchUpdate(data.match);
        }
        this.scoreEventListeners.forEach((cb) => cb(data));
        break;
      }

      case 'MATCH_DELETED': {
        if (data.matchId) {
          this.applyMatchDeletion(data.matchId);
        }
        break;
      }

      case 'SPONSORS_UPDATED': {
        if (Array.isArray(data.sponsors)) {
          this.notifySponsors(data.sponsors);
        }
        break;
      }
    }
  }

  // Handle cross-tab sync via BroadcastChannel
  private handleBroadcastMessage(data: any): void {
    if (!data) return;
    switch (data.type) {
      case 'MATCH_UPDATED':
      case 'MATCH_CREATED':
        if (data.match) this.applySingleMatchUpdate(data.match, false);
        break;
      case 'MATCH_DELETED':
        if (data.matchId) this.applyMatchDeletion(data.matchId, false);
        break;
      case 'MATCHES_SYNC':
        if (Array.isArray(data.matches)) this.notifyMatches(data.matches, false);
        break;
      case 'SPONSORS_UPDATED':
        if (Array.isArray(data.sponsors)) this.notifySponsors(data.sponsors, false);
        break;
    }
  }

  private broadcastToLocalTabs(payload: any): void {
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch {}
    }
  }

  private send(payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  // --- PUBLIC ACTIONS (DISPATCH TO REALTIME DB) ---

  public updateMatch(match: Match): void {
    this.applySingleMatchUpdate(match);
    this.send({ type: 'UPDATE_MATCH', match });
    this.broadcastToLocalTabs({ type: 'MATCH_UPDATED', match });
  }

  public scorePoint(match: Match, playEvent?: PlayEvent): void {
    this.applySingleMatchUpdate(match);
    this.send({ type: 'SCORE_POINT', match, playEvent });
    this.broadcastToLocalTabs({ type: 'SCORE_POINT', match, playEvent });
  }

  public createMatch(match: Match): void {
    this.applySingleMatchUpdate(match);
    this.send({ type: 'CREATE_MATCH', match });
    this.broadcastToLocalTabs({ type: 'MATCH_CREATED', match });
  }

  public deleteMatch(matchId: string): void {
    this.applyMatchDeletion(matchId);
    this.send({ type: 'DELETE_MATCH', matchId });
    this.broadcastToLocalTabs({ type: 'MATCH_DELETED', matchId });
  }

  public clearAllMatches(): void {
    this.notifyMatches([]);
    this.send({ type: 'CLEAR_MATCHES' });
    this.broadcastToLocalTabs({ type: 'MATCHES_SYNC', matches: [] });
  }

  public loadTemplate(matches: Match[]): void {
    this.notifyMatches(matches);
    this.send({ type: 'LOAD_TEMPLATE', matches });
    this.broadcastToLocalTabs({ type: 'MATCHES_SYNC', matches });
  }

  public updateSponsors(sponsors: SponsorTier[]): void {
    this.notifySponsors(sponsors);
    this.send({ type: 'UPDATE_SPONSORS', sponsors });
    this.broadcastToLocalTabs({ type: 'SPONSORS_UPDATED', sponsors });
  }

  public forceResync(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'GET_SYNC' });
    } else {
      this.connect();
    }
  }

  // --- CACHE & NOTIFICATION HELPERS ---

  private applySingleMatchUpdate(match: Match, shouldBroadcastTab = true): void {
    try {
      const current = this.getCachedMatches();
      const exists = current.some((m) => m.id === match.id);
      const updated = exists
        ? current.map((m) => (m.id === match.id ? match : m))
        : [match, ...current];
      this.notifyMatches(updated, shouldBroadcastTab);
    } catch (e) {
      console.error(e);
    }
  }

  private applyMatchDeletion(matchId: string, shouldBroadcastTab = true): void {
    try {
      const current = this.getCachedMatches();
      const updated = current.filter((m) => m.id !== matchId);
      this.notifyMatches(updated, shouldBroadcastTab);
    } catch (e) {
      console.error(e);
    }
  }

  public getCachedMatches(): Match[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MATCHES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  public getCachedSponsors(): SponsorTier[] | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SPONSORS);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  private notifyMatches(matches: Match[], broadcastTab = true): void {
    try {
      localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(matches));
    } catch {}
    this.matchesListeners.forEach((cb) => cb(matches));
    if (broadcastTab) {
      this.broadcastToLocalTabs({ type: 'MATCHES_SYNC', matches });
    }
  }

  private notifySponsors(sponsors: SponsorTier[], broadcastTab = true): void {
    try {
      localStorage.setItem(STORAGE_KEY_SPONSORS, JSON.stringify(sponsors));
    } catch {}
    this.sponsorsListeners.forEach((cb) => cb(sponsors));
    if (broadcastTab) {
      this.broadcastToLocalTabs({ type: 'SPONSORS_UPDATED', sponsors });
    }
  }

  private updateState(partial: Partial<RealtimeState>): void {
    this.state = { ...this.state, ...partial };
    this.statusListeners.forEach((cb) => cb(this.state));
  }

  // --- SUBSCRIPTIONS ---

  public onStatusChange(callback: StatusListener): () => void {
    this.statusListeners.add(callback);
    callback(this.state);
    return () => this.statusListeners.delete(callback);
  }

  public onMatchesChange(callback: MatchesListener): () => void {
    this.matchesListeners.add(callback);
    return () => this.matchesListeners.delete(callback);
  }

  public onSponsorsChange(callback: SponsorsListener): () => void {
    this.sponsorsListeners.add(callback);
    return () => this.sponsorsListeners.delete(callback);
  }

  public onScoreEvent(callback: ScoreEventListener): () => void {
    this.scoreEventListeners.add(callback);
    return () => this.scoreEventListeners.delete(callback);
  }

  public getState(): RealtimeState {
    return this.state;
  }
}

export const realtimeDB = new RealtimeDatabaseService();
