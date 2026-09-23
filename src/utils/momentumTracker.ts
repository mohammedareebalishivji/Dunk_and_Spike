import { Match, PlayEvent } from '../types';

export interface MomentumRun {
  team: 'home' | 'away';
  teamName: string;
  points: number;
  unansweredCount: number;
  isHot: boolean;
  label: string; // e.g. "8-0 Run • Pacific Surge"
}

/**
 * Calculates active scoring momentum run based on chronological play-by-play events
 */
export function calculateMomentumRun(match: Match, events?: PlayEvent[]): MomentumRun | null {
  if (match.status !== 'LIVE') {
    return null;
  }

  // Filter scoring events
  const scoringTypes = new Set(['SCORE', 'SPIKE', 'ACE', 'BLOCK']);
  const scoreEvents = (events || []).filter(e => 
    e.matchId === match.id && scoringTypes.has(e.type)
  );

  if (scoreEvents.length === 0) {
    // Fallback: If match is live and one team has scored >= 3 while opponent is 0 in current period/set
    const homeScore = match.homeTeam.score || 0;
    const awayScore = match.awayTeam.score || 0;

    if (homeScore >= 3 && awayScore === 0) {
      return {
        team: 'home',
        teamName: match.homeTeam.shortName || match.homeTeam.name,
        points: homeScore,
        unansweredCount: homeScore,
        isHot: true,
        label: `${homeScore}-0 Run • ${match.homeTeam.shortName || match.homeTeam.name}`,
      };
    }

    if (awayScore >= 3 && homeScore === 0) {
      return {
        team: 'away',
        teamName: match.awayTeam.shortName || match.awayTeam.name,
        points: awayScore,
        unansweredCount: awayScore,
        isHot: true,
        label: `${awayScore}-0 Run • ${match.awayTeam.shortName || match.awayTeam.name}`,
      };
    }

    return null;
  }

  // Walk backwards from latest score event
  const latest = scoreEvents[scoreEvents.length - 1];
  const hotTeam = latest.team;
  let streakPoints = 0;
  let streakCount = 0;

  for (let i = scoreEvents.length - 1; i >= 0; i--) {
    const ev = scoreEvents[i];
    if (ev.team !== hotTeam) {
      break; // Run broken by opponent score
    }

    // Try extracting points from scoreChange like "+2" or "+3" or "+1", default to 1 for VB, 2 for BB
    let pts = 1;
    if (ev.scoreChange) {
      const matchPts = ev.scoreChange.match(/\+?(\d+)/);
      if (matchPts) pts = parseInt(matchPts[1], 10);
    } else if (match.sport === 'basketball') {
      pts = 2;
    }

    streakPoints += pts;
    streakCount += 1;
  }

  // A momentum run is significant if unanswered points >= 3 or streakCount >= 3
  if (streakPoints >= 3 || streakCount >= 3) {
    const teamObj = hotTeam === 'home' ? match.homeTeam : match.awayTeam;
    const short = teamObj.shortName || teamObj.name;
    return {
      team: hotTeam,
      teamName: short,
      points: streakPoints,
      unansweredCount: streakCount,
      isHot: streakPoints >= 5 || streakCount >= 4,
      label: `${streakPoints}-0 Run • ${short}`,
    };
  }

  return null;
}

/**
 * Transforms standard video livestream links (YouTube, Twitch) into embeddable URLs
 */
export function getEmbedStreamUrl(url?: string): {
  type: 'youtube' | 'twitch' | 'custom' | 'none';
  embedUrl: string | null;
} {
  if (!url || !url.trim()) {
    return { type: 'none', embedUrl: null };
  }

  const clean = url.trim();

  // YouTube Watch or Short URL
  const ytWatch = clean.match(/(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytWatch && ytWatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytWatch[1]}?autoplay=1&mute=1&rel=0`,
    };
  }

  // Twitch Stream
  const twitch = clean.match(/twitch\.tv\/([a-zA-Z0-9_]{3,25})/);
  if (twitch && twitch[1]) {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return {
      type: 'twitch',
      embedUrl: `https://player.twitch.tv/?channel=${twitch[1]}&parent=${hostname}&muted=true`,
    };
  }

  // Direct embed or custom iframe source
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return {
      type: 'custom',
      embedUrl: clean,
    };
  }

  return { type: 'none', embedUrl: null };
}
