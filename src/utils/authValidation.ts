/**
 * Administrator Authentication & Authorization Rules
 * Enforces strict administrator-only access. Public registration is disabled.
 */

export interface AuthValidationResult {
  isValid: boolean;
  error?: string;
  role?: string;
}

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
