import { describe, it, expect } from 'vitest';
import { AuthService } from './auth.ts';

describe('AuthService (Server Token & RBAC)', () => {
  const auth = new AuthService('test-secret-key-12345');

  it('generates and verifies valid HMAC SHA-256 tokens', () => {
    const token = auth.generateToken({
      username: 'admin',
      displayName: 'Tournament Director',
      role: 'director',
      court: 'all',
      permissions: ['all_courts', 'score', 'create', 'delete'],
    });

    expect(token).toBeDefined();
    expect(token.includes('.')).toBe(true);

    const session = auth.verifyToken(token);
    expect(session).not.toBeNull();
    expect(session?.username).toBe('admin');
    expect(session?.role).toBe('director');
    expect(session?.court).toBe('all');
  });

  it('rejects tampered or malformed tokens', () => {
    const token = auth.generateToken({
      username: 'admin',
      displayName: 'Tournament Director',
      role: 'director',
      court: 'all',
      permissions: ['all_courts'],
    });

    const tampered = token.slice(0, -4) + 'abcd';
    expect(auth.verifyToken(tampered)).toBeNull();
    expect(auth.verifyToken('invalid.token.structure')).toBeNull();
    expect(auth.verifyToken('')).toBeNull();
  });

  it('authenticates Tournament Director with valid credentials', () => {
    const res = auth.authenticate({
      username: 'admin',
      password: 'admin2026',
    });

    expect(res.success).toBe(true);
    expect(res.token).toBeDefined();
    expect(res.user?.role).toBe('director');
    expect(res.user?.permissions).toContain('all_courts');
  });

  it('authenticates Court Scorer with Court PIN', () => {
    const res = auth.authenticate({
      court: 'Court 1 - Hardwood Arena',
      courtPin: '1001',
    });

    expect(res.success).toBe(true);
    expect(res.token).toBeDefined();
    expect(res.user?.role).toBe('scorer');
    expect(res.user?.court).toBe('Court 1 - Hardwood Arena');
  });

  it('rejects incorrect court PINs', () => {
    const res = auth.authenticate({
      court: 'Court 1 - Hardwood Arena',
      courtPin: '9999',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid Court PIN');
  });

  it('enforces court-scoped permissions correctly', () => {
    const directorSession = auth.authenticate({
      username: 'admin',
      password: 'admin',
    }).user!;

    const court1ScorerSession = auth.authenticate({
      court: 'Court 1',
      courtPin: '1001',
    }).user!;

    // Director can score any court
    expect(auth.canScoreMatch(directorSession, 'Court 1 - Hardwood Arena')).toBe(true);
    expect(auth.canScoreMatch(directorSession, 'Court 2 - Fieldhouse')).toBe(true);
    expect(auth.canManageTournament(directorSession)).toBe(true);

    // Court 1 Scorer can score Court 1, but NOT Court 2
    expect(auth.canScoreMatch(court1ScorerSession, 'Court 1')).toBe(true);
    expect(auth.canScoreMatch(court1ScorerSession, 'Court 1 - Hardwood Arena')).toBe(true);
    expect(auth.canScoreMatch(court1ScorerSession, 'Court 2 - Fieldhouse')).toBe(false);
    expect(auth.canManageTournament(court1ScorerSession)).toBe(false);
  });
});
