import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { TournamentDatabase } from './db.ts';
import { authService, AuthService, UserSession } from './auth.ts';
import type { Match, PlayEvent, SponsorTier, Team } from '../src/types.ts';

export interface RealtimeServerOptions {
  port?: number;
  host?: string;
  db?: TournamentDatabase;
  inMemoryDb?: boolean;
  auth?: AuthService;
}

export class RealtimeServer {
  private server: http.Server;
  private wss: WebSocketServer;
  private db: TournamentDatabase;
  private auth: AuthService;
  private port: number;
  private host: string;
  private clients: Set<WebSocket> = new Set();
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(options: RealtimeServerOptions = {}) {
    this.port = options.port || Number(process.env.REALTIME_PORT || process.env.PORT_REALTIME) || 3001;
    this.host = options.host || '0.0.0.0';
    this.db = options.db || new TournamentDatabase({ inMemory: options.inMemoryDb });
    this.auth = options.auth || authService;

    this.server = http.createServer((req, res) => this.handleHttpRequest(req, res));
    this.wss = new WebSocketServer({ noServer: true });

    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    // Handle HTTP Upgrade to WebSocket
    this.server.on('upgrade', (request, socket, head) => {
      const urlObj = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
      const pathname = urlObj.pathname;

      if (pathname === '/ws' || pathname === '/') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          // Check for token in query parameter during handshake
          const token = urlObj.searchParams.get('token');
          if (token) {
            const user = this.auth.verifyToken(token);
            if (user) {
              (ws as any).user = user;
            }
          }
          this.wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws: WebSocket) => {
      // Setup heartbeat
      (ws as any).isAlive = true;
      ws.on('pong', () => {
        (ws as any).isAlive = true;
      });

      this.clients.add(ws);
      this.broadcastPeerCount();

      // Send initial state snapshot to new client
      const initialPayload = {
        type: 'INIT_STATE',
        payload: {
          matches: this.db.getAllMatches(),
          sponsors: this.db.getAllSponsors(),
          peerCount: this.clients.size,
          dbEngine: 'sqlite-native-wal',
          serverTime: Date.now(),
          authenticatedUser: (ws as any).user || null,
        },
      };
      ws.send(JSON.stringify(initialPayload));

      // Handle incoming messages
      ws.on('message', (raw: string) => {
        try {
          const data = JSON.parse(raw.toString());
          this.handleClientMessage(ws, data);
        } catch (err) {
          console.error('[RealtimeServer] Error parsing message:', err);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        this.broadcastPeerCount();
      });

      ws.on('error', (err) => {
        console.error('[RealtimeServer] WebSocket error:', err);
        this.clients.delete(ws);
        this.broadcastPeerCount();
      });
    });

    // 15-second heartbeat to detect dead connections
    this.heartbeatTimer = setInterval(() => {
      for (const ws of this.clients) {
        if ((ws as any).isAlive === false) {
          this.clients.delete(ws);
          ws.terminate();
          continue;
        }
        (ws as any).isAlive = false;
        ws.ping();
      }
    }, 15000);
  }

  private getEffectiveUser(sender: WebSocket, message: any): UserSession | null {
    if (message.token) {
      const verified = this.auth.verifyToken(message.token);
      if (verified) return verified;
    }
    return (sender as any).user || null;
  }

  private handleClientMessage(sender: WebSocket, message: any): void {
    const user = this.getEffectiveUser(sender, message);

    switch (message.type) {
      case 'PING':
        sender.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        break;

      case 'AUTHENTICATE': {
        const verified = this.auth.verifyToken(message.token);
        if (verified) {
          (sender as any).user = verified;
          sender.send(JSON.stringify({ type: 'AUTHENTICATED', user: verified }));
        } else {
          sender.send(JSON.stringify({ type: 'AUTH_ERROR', message: 'Invalid or expired session token.' }));
        }
        break;
      }

      case 'UPDATE_MATCH': {
        const match: Match = message.match;
        if (match && match.id) {
          if (user && !this.auth.canScoreMatch(user, match.court)) {
            sender.send(JSON.stringify({
              type: 'AUTH_ERROR',
              message: `Unauthorized: User is restricted to ${user.court}, cannot edit ${match.court || 'this match'}.`,
            }));
            return;
          }
          this.db.upsertMatch(match);
          this.broadcast({ type: 'MATCH_UPDATED', match }, sender);
        }
        break;
      }

      case 'SCORE_POINT': {
        const { match, playEvent } = message;
        if (match && match.id) {
          if (user && !this.auth.canScoreMatch(user, match.court)) {
            sender.send(JSON.stringify({
              type: 'AUTH_ERROR',
              message: `Unauthorized: Scorer is restricted to ${user.court}.`,
            }));
            return;
          }
          this.db.upsertMatch(match);
        }
        if (playEvent && playEvent.id) {
          this.db.logPlayEvent(playEvent);
        }
        this.broadcast({
          type: 'SCORE_POINT',
          match,
          playEvent,
        }, sender);
        break;
      }

      case 'CREATE_MATCH': {
        const match: Match = message.match;
        if (match && match.id) {
          if (user && !this.auth.canManageTournament(user)) {
            sender.send(JSON.stringify({
              type: 'AUTH_ERROR',
              message: 'Forbidden: Creating matches requires Tournament Director authorization.',
            }));
            return;
          }
          this.db.upsertMatch(match);
          this.broadcast({ type: 'MATCH_CREATED', match });
        }
        break;
      }

      case 'DELETE_MATCH': {
        const matchId: string = message.matchId;
        if (matchId) {
          if (user && !this.auth.canManageTournament(user)) {
            sender.send(JSON.stringify({
              type: 'AUTH_ERROR',
              message: 'Forbidden: Deleting matches requires Tournament Director authorization.',
            }));
            return;
          }
          this.db.deleteMatch(matchId);
          this.broadcast({ type: 'MATCH_DELETED', matchId });
        }
        break;
      }

      case 'CLEAR_MATCHES': {
        if (user && !this.auth.canManageTournament(user)) {
          sender.send(JSON.stringify({
            type: 'AUTH_ERROR',
            message: 'Forbidden: Clearing tournament matches requires Master Administrator authorization.',
          }));
          return;
        }
        this.db.clearAllMatches();
        this.broadcast({ type: 'MATCHES_SYNC', matches: [] });
        break;
      }

      case 'LOAD_TEMPLATE': {
        if (user && !this.auth.canManageTournament(user)) {
          sender.send(JSON.stringify({
            type: 'AUTH_ERROR',
            message: 'Forbidden: Loading template schedules requires Tournament Director authorization.',
          }));
          return;
        }
        const matches: Match[] = message.matches || [];
        this.db.loadTemplateMatches(matches);
        this.broadcast({ type: 'MATCHES_SYNC', matches: this.db.getAllMatches() });
        break;
      }

      case 'UPDATE_SPONSORS': {
        if (user && !this.auth.canManageTournament(user)) {
          sender.send(JSON.stringify({
            type: 'AUTH_ERROR',
            message: 'Forbidden: Managing sponsor tiers requires Tournament Director authorization.',
          }));
          return;
        }
        const sponsors: SponsorTier[] = message.sponsors || [];
        this.db.saveSponsors(sponsors);
        this.broadcast({ type: 'SPONSORS_UPDATED', sponsors }, sender);
        break;
      }

      case 'RESTORE_DATABASE': {
        if (user && !this.auth.canManageTournament(user)) {
          sender.send(JSON.stringify({
            type: 'AUTH_ERROR',
            message: 'Forbidden: Restoring tournament database requires Tournament Director authorization.',
          }));
          return;
        }
        if (message.snapshot) {
          const result = this.db.restoreSnapshot(message.snapshot);
          this.broadcast({ type: 'MATCHES_SYNC', matches: this.db.getAllMatches() });
          this.broadcast({ type: 'SPONSORS_UPDATED', sponsors: this.db.getAllSponsors() });
          sender.send(JSON.stringify({ type: 'DATABASE_RESTORED', result }));
        }
        break;
      }

      case 'GET_SYNC': {
        sender.send(JSON.stringify({
          type: 'MATCHES_SYNC',
          matches: this.db.getAllMatches(),
        }));
        sender.send(JSON.stringify({
          type: 'SPONSORS_UPDATED',
          sponsors: this.db.getAllSponsors(),
        }));
        break;
      }
    }
  }

  public broadcast(payload: object, exclude?: WebSocket): void {
    const data = JSON.stringify(payload);
    for (const client of this.clients) {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  private broadcastPeerCount(): void {
    const payload = JSON.stringify({
      type: 'PEERS_COUNT',
      count: this.clients.size,
    });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  // --- HTTP REST API HANDLER ---

  private getRequestUser(req: http.IncomingMessage, searchParams: URLSearchParams): UserSession | null {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      return this.auth.verifyToken(token);
    }
    const tokenQuery = searchParams.get('token');
    if (tokenQuery) {
      return this.auth.verifyToken(tokenQuery);
    }
    return null;
  }

  private async handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // Setup CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const { pathname, searchParams } = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const user = this.getRequestUser(req, searchParams);

    try {
      // Health Check
      if (pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          service: 'Dunk & Spike Realtime Tournament Database',
          engine: 'SQLite 3 (WAL mode) · node:sqlite',
          connectedPeers: this.clients.size,
          timestamp: Date.now(),
        }));
        return;
      }

      // POST /api/auth/login
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await this.readRequestBody(req);
        const credentials = JSON.parse(body || '{}');
        const authResult = this.auth.authenticate(credentials);

        if (authResult.success) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(authResult));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: authResult.error }));
        }
        return;
      }

      // GET /api/auth/verify
      if (pathname === '/api/auth/verify' && req.method === 'GET') {
        if (user) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, user }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Unauthorized or token expired' }));
        }
        return;
      }

      // POST /api/auth/verify-court-pin
      if (pathname === '/api/auth/verify-court-pin' && req.method === 'POST') {
        const body = await this.readRequestBody(req);
        const { court, pin } = JSON.parse(body || '{}');
        const authResult = this.auth.authenticate({ court, courtPin: pin });

        if (authResult.success) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(authResult));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(authResult));
        }
        return;
      }

      // GET /api/auth/courts
      if (pathname === '/api/auth/courts' && req.method === 'GET') {
        const courts = this.auth.getAllCourtPins().map((c) => ({
          court: c.court,
          name: c.name,
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ courts }));
        return;
      }

      // GET /api/matches
      if (pathname === '/api/matches' && req.method === 'GET') {
        const matches = this.db.getAllMatches();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(matches));
        return;
      }

      // POST /api/matches (Create Match)
      if (pathname === '/api/matches' && req.method === 'POST') {
        if (user && !this.auth.canManageTournament(user)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden: Requires Tournament Director authorization' }));
          return;
        }
        const body = await this.readRequestBody(req);
        const match: Match = JSON.parse(body);
        this.db.upsertMatch(match);
        this.broadcast({ type: 'MATCH_CREATED', match });
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(match));
        return;
      }

      // PUT /api/matches/:id (Update Match)
      if (pathname.startsWith('/api/matches/') && req.method === 'PUT') {
        const id = pathname.replace('/api/matches/', '');
        const body = await this.readRequestBody(req);
        const match: Match = JSON.parse(body);
        match.id = id;

        if (user && !this.auth.canScoreMatch(user, match.court)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Forbidden: Authorized only for ${user.court}` }));
          return;
        }

        this.db.upsertMatch(match);
        this.broadcast({ type: 'MATCH_UPDATED', match });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(match));
        return;
      }

      // DELETE /api/matches/:id
      if (pathname.startsWith('/api/matches/') && req.method === 'DELETE') {
        if (user && !this.auth.canManageTournament(user)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden: Requires Tournament Director authorization' }));
          return;
        }
        const id = pathname.replace('/api/matches/', '');
        this.db.deleteMatch(id);
        this.broadcast({ type: 'MATCH_DELETED', matchId: id });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, id }));
        return;
      }

      // POST /api/matches/clear
      if (pathname === '/api/matches/clear' && req.method === 'POST') {
        if (user && !this.auth.canManageTournament(user)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden: Requires Tournament Director authorization' }));
          return;
        }
        this.db.clearAllMatches();
        this.broadcast({ type: 'MATCHES_SYNC', matches: [] });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: 0 }));
        return;
      }

      // POST /api/matches/template
      if (pathname === '/api/matches/template' && req.method === 'POST') {
        if (user && !this.auth.canManageTournament(user)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden: Requires Tournament Director authorization' }));
          return;
        }
        const body = await this.readRequestBody(req);
        const { matches } = JSON.parse(body || '{}');
        if (Array.isArray(matches)) {
          this.db.loadTemplateMatches(matches);
          this.broadcast({ type: 'MATCHES_SYNC', matches });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, matches: this.db.getAllMatches() }));
        return;
      }

      // GET /api/sponsors
      if (pathname === '/api/sponsors' && req.method === 'GET') {
        const sponsors = this.db.getAllSponsors();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(sponsors));
        return;
      }

      // PUT /api/sponsors
      if (pathname === '/api/sponsors' && req.method === 'PUT') {
        if (user && !this.auth.canManageTournament(user)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden: Requires Tournament Director authorization' }));
          return;
        }
        const body = await this.readRequestBody(req);
        const sponsors: SponsorTier[] = JSON.parse(body);
        this.db.saveSponsors(sponsors);
        this.broadcast({ type: 'SPONSORS_UPDATED', sponsors });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(sponsors));
        return;
      }

      // GET /api/plays/:matchId
      if (pathname.startsWith('/api/plays/') && req.method === 'GET') {
        const matchId = pathname.replace('/api/plays/', '');
        const limit = Number(searchParams.get('limit') || 50);
        const plays = this.db.getPlayEvents(matchId, limit);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(plays));
        return;
      }

      // GET /api/database/snapshot
      if (pathname === '/api/database/snapshot' && req.method === 'GET') {
        const snapshot = this.db.exportSnapshot();
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="dunk_and_spike_snapshot.json"',
        });
        res.end(JSON.stringify(snapshot, null, 2));
        return;
      }

      // POST /api/database/restore
      if (pathname === '/api/database/restore' && req.method === 'POST') {
        if (user && !this.auth.canManageTournament(user)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden: Requires Tournament Director authorization' }));
          return;
        }
        const body = await this.readRequestBody(req);
        const snapshot = JSON.parse(body || '{}');
        const result = this.db.restoreSnapshot(snapshot);
        this.broadcast({ type: 'MATCHES_SYNC', matches: this.db.getAllMatches() });
        this.broadcast({ type: 'SPONSORS_UPDATED', sponsors: this.db.getAllSponsors() });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, result }));
        return;
      }

      // Serve static frontend assets from dist/ if available in production
      const distDir = path.resolve(process.cwd(), 'dist');
      if (fs.existsSync(distDir)) {
        let reqFile = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
        let filePath = path.join(distDir, reqFile);

        // Fallback to index.html for SPA client-side routes
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(distDir, 'index.html');
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.webp': 'image/webp',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
          };
          const contentType = mimeTypes[ext] || 'application/octet-stream';
          const fileContent = fs.readFileSync(filePath);
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(fileContent);
          return;
        }
      }

      // Default 404
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    } catch (err: any) {
      console.error('[RealtimeServer] HTTP handler error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
    }
  }

  private readRequestBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => {
        data += chunk;
      });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, this.host, () => {
        console.log(`[Realtime Database] Running on http://${this.host}:${this.port} (WebSocket on ws://${this.host}:${this.port}/ws)`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    for (const ws of this.clients) {
      ws.terminate();
    }
    this.clients.clear();
    return new Promise((resolve) => {
      this.wss.close(() => {
        this.server.close(() => {
          this.db.close();
          resolve();
        });
      });
    });
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  public getDatabase(): TournamentDatabase {
    return this.db;
  }

  public getPort(): number {
    return this.port;
  }
}
