import { Match, SponsorTier, PlayEvent } from '../types';
import { validateAdminLogin, validateCourtPin, canUserScoreCourt } from '../utils/authValidation';

export type ConnectionStatus = 'connected' | 'connecting' | 'offline';

export interface RealtimeState {
  status: ConnectionStatus;
  peerCount: number;
  pingMs: number;
  dbEngine: string;
  lastSyncTime: number;
}

export interface AuthUser {
  username: string;
  role: 'director' | 'scorer' | 'commissioner' | 'spectator';
  court: string;
  displayName: string;
  permissions: string[];
  token?: string;
}

export interface QueuedMutation {
  id: string;
  type: string;
  payload: any;
  queuedAt: number;
}

type StatusListener = (state: RealtimeState) => void;
type MatchesListener = (matches: Match[]) => void;
type SponsorsListener = (sponsors: SponsorTier[]) => void;
type ScoreEventListener = (event: { match: Match; playEvent?: PlayEvent }) => void;
type AuthListener = (user: AuthUser | null) => void;
type AuthErrorListener = (error: string) => void;
type QueueListener = (count: number) => void;

const BROADCAST_CHANNEL_NAME = 'dunk_spike_realtime_channel_v1';
const STORAGE_KEY_MATCHES = 'dunk_spike_matches_v2';
const STORAGE_KEY_SPONSORS = 'dunk_spike_sponsors_v2';
const STORAGE_KEY_AUTH = 'dunk_spike_auth_session_v1';
const STORAGE_KEY_QUEUE = 'dunk_spike_offline_queue_v1';

class RealtimeDatabaseService {
  private ws: WebSocket | null = null;
  private channel: BroadcastChannel | null = null;
  private statusListeners: Set<StatusListener> = new Set();
  private matchesListeners: Set<MatchesListener> = new Set();
  private sponsorsListeners: Set<SponsorsListener> = new Set();
  private scoreEventListeners: Set<ScoreEventListener> = new Set();
  private authListeners: Set<AuthListener> = new Set();
  private authErrorListeners: Set<AuthErrorListener> = new Set();
  private queueListeners: Set<QueueListener> = new Set();

  private authUser: AuthUser | null = null;
  private mutationQueue: QueuedMutation[] = [];

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

    // Load persisted auth user if exists
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_AUTH);
        if (saved) {
          this.authUser = JSON.parse(saved);
        }
      } catch {}

      try {
        const savedQueue = localStorage.getItem(STORAGE_KEY_QUEUE);
        if (savedQueue) {
          this.mutationQueue = JSON.parse(savedQueue);
        }
      } catch {}
    }
  }

  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;
    this.connect();
  }

  private getApiBaseUrl(): string {
    if (typeof window === 'undefined') return 'http://127.0.0.1:3001';
    const host = window.location.hostname || '127.0.0.1';
    if (window.location.port === '3000' || host === 'localhost' || host === '127.0.0.1') {
      return `http://${host}:3001`;
    }
    return window.location.origin;
  }

  private getWebSocketUrl(): string {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const wsProto = isHttps ? 'wss:' : 'ws:';
    const host = (typeof window !== 'undefined' && window.location.hostname) || '127.0.0.1';
    
    // In local dev, connect directly to backend port 3001 for instant zero-latency sync
    let base = `${wsProto}//${window.location.host}/ws`;
    if (typeof window !== 'undefined' && (window.location.port === '3000' || host === 'localhost' || host === '127.0.0.1')) {
      base = `${wsProto}//${host}:3001/ws`;
    }

    if (this.authUser?.token) {
      base += `?token=${encodeURIComponent(this.authUser.token)}`;
    }

    return base;
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

        // Authenticate if token exists
        if (this.authUser?.token) {
          this.send({ type: 'AUTHENTICATE', token: this.authUser.token });
        }

        // Replay any pending offline mutations
        this.replayPendingQueue();

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

      this.ws.onerror = () => {
        // Handled in onclose
      };
    } catch {
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

      case 'AUTHENTICATED': {
        if (data.user) {
          this.setAuthUser({ ...data.user, token: this.authUser?.token });
        }
        break;
      }

      case 'AUTH_ERROR': {
        const msg = data.message || 'Authorization rejected by server.';
        this.authErrorListeners.forEach((cb) => cb(msg));
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
      case 'AUTH_CHANGED':
        this.authUser = data.user || null;
        this.authListeners.forEach((cb) => cb(this.authUser));
        break;
      case 'QUEUE_UPDATED':
        this.queueListeners.forEach((cb) => cb(data.count || 0));
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

  private send(payload: any, isMutating = false): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.authUser?.token && typeof payload === 'object' && !payload.token) {
        payload = { ...payload, token: this.authUser.token };
      }
      this.ws.send(JSON.stringify(payload));
    } else if (isMutating) {
      // Queue offline mutation
      const item: QueuedMutation = {
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: payload.type || 'MUTATION',
        payload,
        queuedAt: Date.now(),
      };
      this.mutationQueue.push(item);
      this.persistQueue();
      this.notifyQueue();
    }
  }

  private persistQueue(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(this.mutationQueue));
      } catch {}
    }
  }

  private notifyQueue(): void {
    const count = this.mutationQueue.length;
    this.queueListeners.forEach((cb) => cb(count));
    this.broadcastToLocalTabs({ type: 'QUEUE_UPDATED', count });
  }

  public getPendingQueueCount(): number {
    return this.mutationQueue.length;
  }

  public getPendingQueue(): QueuedMutation[] {
    return [...this.mutationQueue];
  }

  public onQueueChange(callback: QueueListener): () => void {
    this.queueListeners.add(callback);
    callback(this.mutationQueue.length);
    return () => this.queueListeners.delete(callback);
  }

  public clearPendingQueue(): void {
    this.mutationQueue = [];
    this.persistQueue();
    this.notifyQueue();
  }

  public replayPendingQueue(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.mutationQueue.length === 0) return;
    const items = [...this.mutationQueue];
    this.mutationQueue = [];
    this.persistQueue();
    this.notifyQueue();

    for (const item of items) {
      this.send(item.payload, false);
    }
  }

  // --- AUTHENTICATION & ROLE MANAGEMENT ---

  public async login(credentials: {
    username?: string;
    password?: string;
    role?: string;
    court?: string;
    courtPin?: string;
  }): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (data.success && data.token) {
        const user: AuthUser = { ...data.user, token: data.token };
        this.setAuthUser(user);
        this.send({ type: 'AUTHENTICATE', token: data.token });
        return { success: true, user };
      } else {
        return { success: false, error: data.error || 'Authentication denied.' };
      }
    } catch {
      // Offline fallback
      if (credentials.courtPin) {
        const pinRes = validateCourtPin(credentials.court || 'Court 1', credentials.courtPin);
        if (pinRes.isValid) {
          const user: AuthUser = {
            username: `scorer-local`,
            role: 'scorer',
            court: credentials.court || 'Court 1',
            displayName: `${credentials.court || 'Court 1'} Scorer (Offline)`,
            permissions: ['score', 'sub', 'timeout'],
          };
          this.setAuthUser(user);
          return { success: true, user };
        }
        return { success: false, error: pinRes.error };
      }

      const adminRes = validateAdminLogin(
        credentials.username || '',
        credentials.password || '',
        credentials.role
      );
      if (adminRes.isValid) {
        const user: AuthUser = {
          username: credentials.username || 'admin',
          role: 'director',
          court: credentials.court || 'all',
          displayName: credentials.role || 'Tournament Director (Offline)',
          permissions: ['score', 'create', 'delete', 'rules', 'sponsors', 'all_courts'],
        };
        this.setAuthUser(user);
        return { success: true, user };
      }
      return { success: false, error: adminRes.error };
    }
  }

  public async verifyCourtPin(
    court: string, 
    pin: string
  ): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    return this.login({ court, courtPin: pin });
  }

  public setAuthUser(user: AuthUser | null): void {
    this.authUser = user;
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
        localStorage.setItem('dunk_spike_admin_session', 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH);
        localStorage.removeItem('dunk_spike_admin_session');
      }
    } catch {}
    this.authListeners.forEach((cb) => cb(user));
    this.broadcastToLocalTabs({ type: 'AUTH_CHANGED', user });
  }

  public logout(): void {
    this.setAuthUser(null);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'AUTHENTICATE', token: '' });
    }
  }

  public getCurrentUser(): AuthUser | null {
    return this.authUser;
  }

  public canScoreMatch(matchCourt?: string): boolean {
    if (!this.authUser) return false;
    return canUserScoreCourt(this.authUser.court, matchCourt);
  }

  public canManageTournament(): boolean {
    if (!this.authUser) return false;
    return this.authUser.role === 'director' || this.authUser.permissions.includes('all_courts');
  }

  public onAuthChange(callback: AuthListener): () => void {
    this.authListeners.add(callback);
    callback(this.authUser);
    return () => this.authListeners.delete(callback);
  }

  public onAuthError(callback: AuthErrorListener): () => void {
    this.authErrorListeners.add(callback);
    return () => this.authErrorListeners.delete(callback);
  }

  // --- PUBLIC ACTIONS (DISPATCH TO REALTIME DB) ---

  public updateMatch(match: Match): void {
    this.applySingleMatchUpdate(match);
    this.send({ type: 'UPDATE_MATCH', match }, true);
    this.broadcastToLocalTabs({ type: 'MATCH_UPDATED', match });
  }

  public scorePoint(match: Match, playEvent?: PlayEvent): void {
    this.applySingleMatchUpdate(match);
    this.send({ type: 'SCORE_POINT', match, playEvent }, true);
    this.broadcastToLocalTabs({ type: 'SCORE_POINT', match, playEvent });
  }

  public createMatch(match: Match): void {
    this.applySingleMatchUpdate(match);
    this.send({ type: 'CREATE_MATCH', match }, true);
    this.broadcastToLocalTabs({ type: 'MATCH_CREATED', match });
  }

  public deleteMatch(matchId: string): void {
    this.applyMatchDeletion(matchId);
    this.send({ type: 'DELETE_MATCH', matchId }, true);
    this.broadcastToLocalTabs({ type: 'MATCH_DELETED', matchId });
  }

  public clearAllMatches(): void {
    this.notifyMatches([]);
    this.send({ type: 'CLEAR_MATCHES' }, true);
    this.broadcastToLocalTabs({ type: 'MATCHES_SYNC', matches: [] });
  }

  public loadTemplate(matches: Match[]): void {
    this.notifyMatches(matches);
    this.send({ type: 'LOAD_TEMPLATE', matches }, true);
    this.broadcastToLocalTabs({ type: 'MATCHES_SYNC', matches });
  }

  public updateSponsors(sponsors: SponsorTier[]): void {
    this.notifySponsors(sponsors);
    this.send({ type: 'UPDATE_SPONSORS', sponsors }, true);
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

  public async exportSnapshot(): Promise<any> {
    try {
      const res = await fetch('/api/database/snapshot');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback to local snapshot
    }

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      matches: this.getCachedMatches(),
      sponsors: this.getCachedSponsors() || [],
      teams: typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('dunk_spike_custom_teams_v1') || '[]') : [],
    };
  }

  public async restoreSnapshot(snapshot: any): Promise<{ success: boolean; result?: any }> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.authUser?.token) {
        headers['Authorization'] = `Bearer ${this.authUser.token}`;
      }
      const res = await fetch('/api/database/restore', {
        method: 'POST',
        headers,
        body: JSON.stringify(snapshot),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, result: data.result };
      }
    } catch {
      // Fallback to local restore
    }

    if (snapshot && typeof snapshot === 'object') {
      if (Array.isArray(snapshot.matches)) {
        this.notifyMatches(snapshot.matches, true);
      }
      if (Array.isArray(snapshot.sponsors)) {
        this.notifySponsors(snapshot.sponsors, true);
      }
      if (Array.isArray(snapshot.teams) && typeof localStorage !== 'undefined') {
        localStorage.setItem('dunk_spike_custom_teams_v1', JSON.stringify(snapshot.teams));
        window.dispatchEvent(new Event('storage'));
      }
      return { success: true, result: { matchCount: snapshot.matches?.length || 0, restoredLocally: true } };
    }

    throw new Error('Invalid snapshot object');
  }

  public getState(): RealtimeState {
    return this.state;
  }
}

export const realtimeDB = new RealtimeDatabaseService();
