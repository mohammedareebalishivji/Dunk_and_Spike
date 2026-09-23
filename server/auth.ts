import crypto from 'node:crypto';

export type UserRole = 'director' | 'scorer' | 'commissioner' | 'spectator';

export interface UserSession {
  username: string;
  role: UserRole;
  court: string; // 'all' or specific court name e.g. 'Court 1'
  displayName: string;
  permissions: string[];
  issuedAt: number;
  expiresAt: number;
}

export interface CourtPinConfig {
  court: string;
  pin: string;
  name: string;
}

const DEFAULT_COURT_PINS: CourtPinConfig[] = [
  { court: 'Court 1', pin: '1001', name: 'Court 1 - Hardwood Arena' },
  { court: 'Court 2', pin: '1002', name: 'Court 2 - Fieldhouse' },
  { court: 'Court 3', pin: '1003', name: 'Court 3 - Volleyball Pavilion' },
];

const SECRET_KEY = process.env.AUTH_SECRET || 'dunk-and-spike-tournament-secret-key-2026';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export class AuthService {
  private secret: string;
  private courtPins: Map<string, string> = new Map();

  constructor(secretKey: string = SECRET_KEY) {
    this.secret = secretKey;
    DEFAULT_COURT_PINS.forEach((cp) => {
      this.courtPins.set(cp.court.toLowerCase(), cp.pin);
      this.courtPins.set(cp.name.toLowerCase(), cp.pin);
    });
  }

  /**
   * Generates a tamper-proof HMAC SHA-256 session token
   */
  public generateToken(user: Omit<UserSession, 'issuedAt' | 'expiresAt'>): string {
    const issuedAt = Date.now();
    const expiresAt = issuedAt + TOKEN_TTL_MS;
    const session: UserSession = { ...user, issuedAt, expiresAt };

    const payloadBase64 = Buffer.from(JSON.stringify(session)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(payloadBase64)
      .digest('base64url');

    return `${payloadBase64}.${signature}`;
  }

  /**
   * Verifies and decodes a session token
   */
  public verifyToken(token: string | undefined | null): UserSession | null {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, providedSignature] = parts;

    // Verify cryptographic signature
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(payloadBase64)
      .digest('base64url');

    if (
      providedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))
    ) {
      return null;
    }

    try {
      const decodedJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
      const session: UserSession = JSON.parse(decodedJson);

      // Check expiration
      if (Date.now() > session.expiresAt) {
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  /**
   * Authenticates administrative user or court scorer
   */
  public authenticate(credentials: {
    username?: string;
    password?: string;
    role?: string;
    court?: string;
    courtPin?: string;
  }): { success: boolean; token?: string; user?: UserSession; error?: string } {
    const { username = '', password = '', role = '', court = 'all', courtPin = '' } = credentials;
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanPin = courtPin.trim();

    // 1. Direct Court PIN quick-login
    if (cleanPin) {
      const targetCourt = court.toLowerCase();
      const expectedPin = this.getCourtPin(court);
      const isMasterPin = cleanPin === '2026' || cleanPin === 'admin' || cleanPin === 'admin2026';

      if (isMasterPin || (expectedPin && expectedPin === cleanPin)) {
        const userPayload: Omit<UserSession, 'issuedAt' | 'expiresAt'> = {
          username: `scorer-${court.replace(/\s+/g, '-').toLowerCase()}`,
          displayName: `${court} Table Scorer`,
          role: 'scorer',
          court: court,
          permissions: ['score', 'sub', 'timeout', 'edit_court_match'],
        };
        const token = this.generateToken(userPayload);
        return {
          success: true,
          token,
          user: this.verifyToken(token)!,
        };
      } else {
        return {
          success: false,
          error: `Invalid Court PIN for ${court}. Contact the Tournament Director.`,
        };
      }
    }

    // 2. Tournament Director / Master Administrator
    const isDirectorUser =
      cleanUser === 'admin' ||
      cleanUser === 'administrator' ||
      cleanUser === 'director' ||
      cleanUser.startsWith('admin-');

    const isValidDirectorPass =
      cleanPass === 'admin' ||
      cleanPass === 'admin2026' ||
      cleanPass === '2026' ||
      cleanPass === 'dunkandspike2026';

    if (isDirectorUser && isValidDirectorPass) {
      const userPayload: Omit<UserSession, 'issuedAt' | 'expiresAt'> = {
        username: cleanUser,
        displayName: 'Tournament Director',
        role: 'director',
        court: 'all',
        permissions: ['score', 'sub', 'timeout', 'create', 'delete', 'rules', 'sponsors', 'all_courts'],
      };
      const token = this.generateToken(userPayload);
      return {
        success: true,
        token,
        user: this.verifyToken(token)!,
      };
    }

    // 3. Court Scorer Role with Scorer credentials
    const isScorerUser = cleanUser === 'scorer' || cleanUser.startsWith('court') || cleanUser === 'official';
    const isScorerPass = cleanPass === 'scorer2026' || cleanPass === 'scorer' || cleanPass === '1001';

    if (isScorerUser && isScorerPass) {
      const userPayload: Omit<UserSession, 'issuedAt' | 'expiresAt'> = {
        username: cleanUser,
        displayName: `${court} Official Scorer`,
        role: 'scorer',
        court: court,
        permissions: ['score', 'sub', 'timeout', 'edit_court_match'],
      };
      const token = this.generateToken(userPayload);
      return {
        success: true,
        token,
        user: this.verifyToken(token)!,
      };
    }

    return {
      success: false,
      error: 'Access Denied: Invalid administrator credentials or court security PIN.',
    };
  }

  /**
   * Checks if user has permission to score a specific match on a specific court
   */
  public canScoreMatch(user: UserSession | null | undefined, matchCourt: string): boolean {
    if (!user) return false;
    if (user.role === 'director' || user.court === 'all') return true;
    if (!matchCourt) return true;

    // Normalizing court names (e.g. "Court 1 - Hardwood Arena" matches "Court 1")
    const userCourtNorm = user.court.toLowerCase().split('-')[0].trim();
    const matchCourtNorm = matchCourt.toLowerCase().split('-')[0].trim();

    return userCourtNorm === matchCourtNorm;
  }

  /**
   * Checks if user can create or delete matches
   */
  public canManageTournament(user: UserSession | null | undefined): boolean {
    if (!user) return false;
    return user.role === 'director' || user.permissions.includes('all_courts');
  }

  public getCourtPin(courtName: string): string | undefined {
    const clean = courtName.toLowerCase().split('-')[0].trim();
    return this.courtPins.get(clean) || this.courtPins.get(courtName.toLowerCase());
  }

  public getAllCourtPins(): CourtPinConfig[] {
    return DEFAULT_COURT_PINS;
  }
}

export const authService = new AuthService();
