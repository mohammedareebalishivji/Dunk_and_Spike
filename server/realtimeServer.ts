import http from 'node:http';
import { URL } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { TournamentDatabase } from './db.ts';
import type { Match, PlayEvent, SponsorTier, Team } from '../src/types.ts';

export interface RealtimeServerOptions {
  port?: number;
  host?: string;
  db?: TournamentDatabase;
  inMemoryDb?: boolean;
}

export class RealtimeServer {
  private server: http.Server;
  private wss: WebSocketServer;
  private db: TournamentDatabase;
  private port: number;
  private host: string;
  private clients: Set<WebSocket> = new Set();
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(options: RealtimeServerOptions = {}) {
    this.port = options.port || Number(process.env.REALTIME_PORT || process.env.PORT_REALTIME) || 3001;
    this.host = options.host || '0.0.0.0';
    this.db = options.db || new TournamentDatabase({ inMemory: options.inMemoryDb });

    this.server = http.createServer((req, res) => this.handleHttpRequest(req, res));
    this.wss = new WebSocketServer({ noServer: true });

    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    // Handle HTTP Upgrade to WebSocket
    this.server.on('upgrade', (request, socket, head) => {
      const { pathname } = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
      if (pathname === '/ws' || pathname === '/') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
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

  private handleClientMessage(sender: WebSocket, message: any): void {
    switch (message.type) {
      case 'PING':
        sender.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        break;

      case 'UPDATE_MATCH': {
        const match: Match = message.match;
        if (match && match.id) {
          this.db.upsertMatch(match);
          this.broadcast({ type: 'MATCH_UPDATED', match }, sender);
        }
        break;
      }

      case 'SCORE_POINT': {
        const { match, playEvent } = message;
        if (match && match.id) {
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
          this.db.upsertMatch(match);
          this.broadcast({ type: 'MATCH_CREATED', match });
        }
        break;
      }

      case 'DELETE_MATCH': {
        const matchId: string = message.matchId;
        if (matchId) {
          this.db.deleteMatch(matchId);
          this.broadcast({ type: 'MATCH_DELETED', matchId });
        }
        break;
      }

      case 'CLEAR_MATCHES': {
        this.db.clearAllMatches();
        this.broadcast({ type: 'MATCHES_SYNC', matches: [] });
        break;
      }

      case 'LOAD_TEMPLATE': {
        const matches: Match[] = message.matches || [];
        this.db.loadTemplateMatches(matches);
        this.broadcast({ type: 'MATCHES_SYNC', matches: this.db.getAllMatches() });
        break;
      }

      case 'UPDATE_SPONSORS': {
        const sponsors: SponsorTier[] = message.sponsors || [];
        this.db.saveSponsors(sponsors);
        this.broadcast({ type: 'SPONSORS_UPDATED', sponsors }, sender);
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

      // GET /api/matches
      if (pathname === '/api/matches' && req.method === 'GET') {
        const matches = this.db.getAllMatches();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(matches));
        return;
      }

      // POST /api/matches (Create Match)
      if (pathname === '/api/matches' && req.method === 'POST') {
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
        this.db.upsertMatch(match);
        this.broadcast({ type: 'MATCH_UPDATED', match });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(match));
        return;
      }

      // DELETE /api/matches/:id
      if (pathname.startsWith('/api/matches/') && req.method === 'DELETE') {
        const id = pathname.replace('/api/matches/', '');
        this.db.deleteMatch(id);
        this.broadcast({ type: 'MATCH_DELETED', matchId: id });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, id }));
        return;
      }

      // POST /api/matches/clear
      if (pathname === '/api/matches/clear' && req.method === 'POST') {
        this.db.clearAllMatches();
        this.broadcast({ type: 'MATCHES_SYNC', matches: [] });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: 0 }));
        return;
      }

      // POST /api/matches/template
      if (pathname === '/api/matches/template' && req.method === 'POST') {
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
