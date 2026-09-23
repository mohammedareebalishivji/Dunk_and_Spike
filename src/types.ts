export type Sport = 'basketball' | 'volleyball';

export type MatchStatus = 'LIVE' | 'UPCOMING' | 'FINAL';

export type VolleyballMatchFormat = 'best-of-3' | 'best-of-5';

export interface SetScore {
  set: number;
  homeScore: number;
  awayScore: number;
  isCompleted: boolean;
  targetPoints: number; // 25 (or 15 for deciding set)
  isDecidingSet: boolean;
  winner?: 'home' | 'away';
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  points: number; // Current live individual points
  // Volleyball specific stats
  kills?: number;
  aces?: number;
  blocks?: number;
  digs?: number;
  // Basketball specific stats
  twoPointers?: number;
  threePointers?: number;
  freeThrows?: number;
  fouls?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  turnovers?: number;
  isOnCourt?: boolean;
  isStarter?: boolean;
  subbedOutAt?: string;
  subbedInAt?: string;
  photoUrl?: string; // Player photo / avatar image URL or data URL
}

export type DisplayResolution = 'responsive' | '1080p' | '4k' | 'tablet' | 'mobile';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  sport?: Sport;
  seed?: number;
  logoColor: string;
  accentColor: string;
  record: string;
  score: number; // Current quarter score for basketball, or current set score for volleyball
  logoUrl?: string; // Team logo or photo image URL or data URL
  setsWon?: number;
  quarterScores?: number[];
  timeoutsLeft?: number;
  fouls?: number;
  substitutionsUsed?: number; // Total substitutions used in current set (volleyball) or game (basketball)
  players?: Player[]; // Live individual roster with scoreboard stats
}

export interface Match {
  id: string;
  sport: Sport;
  title: string;
  division: string;
  status: MatchStatus;
  statusDetail: string; // e.g. "Q3 04:12" or "Set 4 24-24 (DEUCE)"
  timeRemaining?: string;
  shotClock?: number;
  court: string;
  homeTeam: Team;
  awayTeam: Team;
  possession?: 'home' | 'away';
  isSuddenDeath?: boolean;
  venue: string;
  broadcast?: string;
  highlightsUrl?: string;
  streamUrl?: string; // YouTube, Twitch, or HLS livestream embed URL
  basketballPeriod?: string; // 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'OT1' | 'FINAL'

  // Official VNL / Volleyball Specific Rules & Telemetry
  volleyballFormat?: VolleyballMatchFormat; // 'best-of-3' (first to 2) or 'best-of-5' (first to 3)
  currentSetNumber?: number; // 1 to 3 or 1 to 5
  setScores?: SetScore[];
  isDeuce?: boolean;
  pointSpecialBadge?: 'DEUCE' | 'SET POINT' | 'MATCH POINT' | 'SET WON';
  targetPoints?: number; // current target points to win this set (e.g. 25, 26, 15, 16...)
  completedSetPendingAdvance?: number; // When set X is won, pending admin advancing or changing score
}

export interface PlayEvent {
  id: string;
  matchId: string;
  timestamp: string;
  period: string;
  team: 'home' | 'away';
  type: 'SCORE' | 'FOUL' | 'TIMEOUT' | 'BLOCK' | 'ACE' | 'SPIKE' | 'SUB' | 'SET_WON' | 'MATCH_WON' | 'REBOUND' | 'ASSIST' | 'STEAL' | 'TURNOVER';
  description: string;
  scoreChange?: string;
  playerId?: string;
  playerName?: string;
  playerNumber?: number;
}

export interface PlayerStat {
  id: string;
  name: string;
  number: number;
  teamName: string;
  sport: Sport;
  position: string;
  avatar: string;
  primaryMetricName: string;
  primaryMetricValue: string;
  secondaryMetrics: { label: string; value: string }[];
  isPlayerOfTheMatch?: boolean;
}

export interface SponsorTier {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  investmentLevel: string;
  color: string;
  perks: string[];
  sponsors: {
    name: string;
    logoText: string;
    subtext: string;
    since: string;
    industry: string;
  }[];
}

export interface EventHighlight {
  id: string;
  title: string;
  caption?: string;
  imageUrl: string;
  tag?: string; // e.g. "Championship Dunk", "VNL Match Point", "Court 1 Action"
  date?: string;
}

export type BracketRound = 'quarterfinals' | 'semifinals' | 'third_place' | 'finals';

export interface BracketMatchNode {
  id: string;
  round: BracketRound;
  roundLabel: string;
  matchNumber: number;
  sport: Sport;
  matchId?: string;
  homeTeamSeed?: number;
  awayTeamSeed?: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  winner?: 'home' | 'away';
  status: MatchStatus;
  court?: string;
  nextMatchId?: string;
  loserNextMatchId?: string;
}

export interface TournamentBracket {
  sport: Sport;
  nodes: BracketMatchNode[];
  champion?: string;
  runnerUp?: string;
  thirdPlace?: string;
}

