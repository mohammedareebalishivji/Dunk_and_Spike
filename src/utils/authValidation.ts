/**
 * Administrator Authentication & Authorization Rules
 * Enforces strict administrator-only access and court scorer jurisdiction isolation.
 */

export interface AuthValidationResult {
  isValid: boolean;
  error?: string;
  role?: string;
  court?: string;
}

export interface CourtConfig {
  id: string;
  name: string;
  courtKey: string;
  defaultPin: string;
  sport: 'basketball' | 'volleyball' | 'multi';
}

export const PROVISIONED_COURTS: CourtConfig[] = [
  { id: 'c1', name: 'Court 1 - Hardwood Arena', courtKey: 'Court 1', defaultPin: '1001', sport: 'basketball' },
  { id: 'c2', name: 'Court 2 - Fieldhouse', courtKey: 'Court 2', defaultPin: '1002', sport: 'multi' },
  { id: 'c3', name: 'Court 3 - Volleyball Pavilion', courtKey: 'Court 3', defaultPin: '1003', sport: 'volleyball' },
];

export function validateAdminLogin(
  username: string, 
  passcode: string, 
  role: string = 'Tournament Director / Master Admin'
): AuthValidationResult {
  const cleanUser = username?.trim().toLowerCase() || '';
  const cleanPass = passcode?.trim() || '';

  if (!cleanUser || !cleanPass) {
    return {
      isValid: false,
      error: 'Username and passcode are both required.',
    };
  }

  // Admin user check (only designated admin identities permitted)
  const isAdminUser = cleanUser === 'admin' || cleanUser === 'administrator' || cleanUser.startsWith('admin-');
  
  // Valid passcodes for provisioned tournament administrators
  const isValidPass = cleanPass === 'admin' || cleanPass === 'admin2026' || cleanPass === '2026' || cleanPass === '••••';

  if (!isAdminUser || !isValidPass) {
    return {
      isValid: false,
      error: 'Access Denied: Only certified administrators are authorized. Self-registration is strictly disabled for tournament security.',
    };
  }

  return {
    isValid: true,
    role,
  };
}

/**
 * Validates a quick Court PIN for courtside table scorers.
 */
export function validateCourtPin(courtName: string, pin: string): AuthValidationResult {
  const cleanPin = pin?.trim() || '';
  if (!cleanPin) {
    return { isValid: false, error: 'Court PIN is required.' };
  }

  // Master override PINs
  if (cleanPin === '2026' || cleanPin === 'admin' || cleanPin === 'admin2026') {
    return {
      isValid: true,
      role: 'Master Court Administrator',
      court: courtName,
    };
  }

  const cleanCourt = courtName.toLowerCase().split('-')[0].trim();
  const matched = PROVISIONED_COURTS.find(
    (c) => c.courtKey.toLowerCase() === cleanCourt || c.name.toLowerCase() === courtName.toLowerCase()
  );

  if (matched && matched.defaultPin === cleanPin) {
    return {
      isValid: true,
      role: 'Head Court Scorer Administrator',
      court: matched.name,
    };
  }

  return {
    isValid: false,
    error: `Invalid Court PIN for ${courtName}. Enter the 4-digit code provided on the official table badge.`,
  };
}

/**
 * Verifies if a user assigned to userCourt is authorized to score matchCourt.
 * Tournament Directors / 'all' can score any court.
 */
export function canUserScoreCourt(userCourt: string | undefined | null, matchCourt: string | undefined | null): boolean {
  if (!userCourt || userCourt === 'all' || userCourt.toLowerCase().includes('master')) return true;
  if (!matchCourt) return true;

  const userKey = userCourt.toLowerCase().split('-')[0].trim();
  const matchKey = matchCourt.toLowerCase().split('-')[0].trim();

  return userKey === matchKey;
}
