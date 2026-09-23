import { describe, it, expect } from 'vitest';
import { validateAdminLogin, validateCourtPin, canUserScoreCourt } from './authValidation';

describe('Admin Authentication & Registration Prevention Security', () => {
  it('should accept valid admin credentials', () => {
    const result = validateAdminLogin('admin', 'admin2026');
    expect(result.isValid).toBe(true);
    expect(result.role).toBe('Tournament Director / Master Admin');
    expect(result.error).toBeUndefined();
  });

  it('should accept case-insensitive admin usernames with valid passcodes', () => {
    const r1 = validateAdminLogin('ADMIN', 'admin');
    expect(r1.isValid).toBe(true);

    const r2 = validateAdminLogin('Administrator', '2026');
    expect(r2.isValid).toBe(true);

    const r3 = validateAdminLogin('admin-head-official', 'admin2026');
    expect(r3.isValid).toBe(true);
  });

  it('should reject empty or whitespace-only credentials', () => {
    const r1 = validateAdminLogin('', 'admin2026');
    expect(r1.isValid).toBe(false);
    expect(r1.error).toContain('both required');

    const r2 = validateAdminLogin('admin', '   ');
    expect(r2.isValid).toBe(false);
    expect(r2.error).toContain('both required');
  });

  it('should reject non-admin usernames attempting self-registration or guest access', () => {
    const invalidUsers = ['guest', 'player10', 'coach_mike', 'spectator', 'new_user', 'registration'];
    for (const user of invalidUsers) {
      const res = validateAdminLogin(user, 'admin2026');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Access Denied');
      expect(res.error).toContain('Self-registration is strictly disabled');
    }
  });

  it('should reject admin usernames with incorrect passcodes', () => {
    const res = validateAdminLogin('admin', 'wrong_password_123');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Access Denied');
  });

  it('should preserve and assign selected administrative role upon successful auth', () => {
    const customRole = 'FIVB Certified Technical Delegate';
    const res = validateAdminLogin('admin', 'admin2026', customRole);
    expect(res.isValid).toBe(true);
    expect(res.role).toBe(customRole);
  });

  it('validates court-specific table scorer PINs', () => {
    // Correct court PIN
    const r1 = validateCourtPin('Court 1 - Hardwood Arena', '1001');
    expect(r1.isValid).toBe(true);

    // Incorrect court PIN
    const r2 = validateCourtPin('Court 1 - Hardwood Arena', '9999');
    expect(r2.isValid).toBe(false);
    expect(r2.error).toContain('Invalid Court PIN');

    // Master PIN override
    const r3 = validateCourtPin('Court 3 - Volleyball Pavilion', '2026');
    expect(r3.isValid).toBe(true);
  });

  it('correctly assesses court scoring jurisdiction', () => {
    // Master / All jurisdiction
    expect(canUserScoreCourt('all', 'Court 1')).toBe(true);
    expect(canUserScoreCourt('Master Admin', 'Court 2')).toBe(true);

    // Court-specific jurisdiction
    expect(canUserScoreCourt('Court 1 - Hardwood Arena', 'Court 1')).toBe(true);
    expect(canUserScoreCourt('Court 1', 'Court 1 - Hardwood Arena')).toBe(true);
    expect(canUserScoreCourt('Court 1 - Hardwood Arena', 'Court 2 - Fieldhouse')).toBe(false);
  });
});

