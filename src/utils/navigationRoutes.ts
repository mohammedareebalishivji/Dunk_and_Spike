export type ViewType = 'schedule' | 'admin' | 'standings' | 'sponsors' | 'teams';

export const VIEW_TO_HASH: Record<ViewType, string> = {
  schedule: '#scores',
  standings: '#standings',
  sponsors: '#sponsors',
  admin: '#scorer',
  teams: '#teams',
};

export const HASH_TO_VIEW: Record<string, ViewType> = {
  '#scores': 'schedule',
  '#schedule': 'schedule',
  '#standings': 'standings',
  '#sponsors': 'sponsors',
  '#scorer': 'admin',
  '#admin': 'admin',
  '#teams': 'teams',
};

/**
 * Resolves a normalized ViewType from a browser URL hash.
 * Defaults to 'schedule' (#scores) if hash is unrecognized.
 */
export function resolveViewFromHash(hash: string | undefined | null): ViewType {
  if (!hash) return 'schedule';
  const clean = hash.toLowerCase().trim();
  return HASH_TO_VIEW[clean] || 'schedule';
}

/**
 * Returns the canonical URL hash for a given view.
 */
export function resolveHashFromView(view: ViewType): string {
  return VIEW_TO_HASH[view] || '#scores';
}

/**
 * Computes the next view in the automated kiosk rotation loop.
 * Bypasses the administrative console and teams page for public audiences if admin is not logged in.
 */
export function getNextRotationView(current: ViewType, isAdmin: boolean): ViewType {
  const views: ViewType[] = isAdmin
    ? ['schedule', 'admin', 'standings', 'sponsors']
    : ['schedule', 'standings', 'sponsors'];
  const currentIndex = views.indexOf(current);
  if (currentIndex === -1) return 'schedule';
  const nextIndex = (currentIndex + 1) % views.length;
  return views[nextIndex];
}
