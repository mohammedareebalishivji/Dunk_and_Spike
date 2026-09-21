import React, { useState, useMemo, useEffect } from 'react';
import { Match, Sport, VolleyballMatchFormat, Player } from '../types';
import { 
  X, 
  PlusCircle, 
  Trophy, 
  ShieldCheck, 
  Zap, 
  Flame, 
  Users, 
  Shirt, 
  Trash2, 
  Plus, 
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  ArrowRightLeft
} from 'lucide-react';
import { getPreexistingTeams, PreexistingTeam } from '../data/preexistingTeams';

export const MAX_TEAM_ROSTER_LIMIT = 8;
export const MAX_ON_COURT_VOLLEYBALL = 6;
export const MAX_ON_COURT_BASKETBALL = 5;
export const getMaxOnCourtPlayers = (sport: Sport): number =>
  sport === 'volleyball' ? MAX_ON_COURT_VOLLEYBALL : MAX_ON_COURT_BASKETBALL;

// Backward compatibility alias for tests and external consumers
export const MAX_ON_COURT_PLAYERS = 6;
export const MAX_MATCH_PLAYERS = 8;

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMatch: (match: Match) => void;
  defaultSport?: Sport;
  matches?: Match[];
}

const COLOR_PRESETS = [
  { label: 'Orange', hex: '#f97316', accent: '#fb923c' },
  { label: 'Sky Blue', hex: '#0284c7', accent: '#38bdf8' },
  { label: 'Crimson', hex: '#e11d48', accent: '#f43f5e' },
  { label: 'Purple', hex: '#8b5cf6', accent: '#a78bfa' },
  { label: 'Emerald', hex: '#10b981', accent: '#34d399' },
  { label: 'Gold', hex: '#eab308', accent: '#facc15' },
];

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  onCreateMatch,
  defaultSport = 'volleyball',
  matches = [],
}) => {
  const [sport, setSport] = useState<Sport>(defaultSport);
  const maxOnCourt = getMaxOnCourtPlayers(sport);
  const [title, setTitle] = useState('');
  const [division, setDivision] = useState("Men's Division I");
  const [court, setCourt] = useState('Court 1 - Main Arena');
  const [venue, setVenue] = useState('Grand Central Athletics Center');
  const [volleyballFormat, setVolleyballFormat] = useState<VolleyballMatchFormat>('best-of-5');
  const [status, setStatus] = useState<'UPCOMING' | 'LIVE'>('LIVE');

  const [storageVersion, setStorageVersion] = useState(0);
  useEffect(() => {
    const handleStorageChange = () => setStorageVersion(v => v + 1);
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Pre-existing Teams catalog for the active sport (refreshed on modal open and storage events)
  const existingTeams = useMemo(
    () => getPreexistingTeams(sport, matches), 
    [sport, matches, isOpen, storageVersion]
  );

  // Selected Pre-existing Team Keys
  const [homePresetId, setHomePresetId] = useState<string>('');
  const [awayPresetId, setAwayPresetId] = useState<string>('');

  // Home Team State
  const [homeName, setHomeName] = useState('');
  const [homeShort, setHomeShort] = useState('');
  const [homeSeed, setHomeSeed] = useState<number>(1);
  const [homeColor, setHomeColor] = useState(COLOR_PRESETS[1]);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [homePlayerName, setHomePlayerName] = useState('');
  const [homePlayerNumber, setHomePlayerNumber] = useState<string>('7');
  const [homePlayerPos, setHomePlayerPos] = useState<string>('Outside Hitter');

  // Away Team State
  const [awayName, setAwayName] = useState('');
  const [awayShort, setAwayShort] = useState('');
  const [awaySeed, setAwaySeed] = useState<number>(2);
  const [awayColor, setAwayColor] = useState(COLOR_PRESETS[0]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [awayPlayerName, setAwayPlayerName] = useState('');
  const [awayPlayerNumber, setAwayPlayerNumber] = useState<string>('14');
  const [awayPlayerPos, setAwayPlayerPos] = useState<string>('Middle Blocker');

  // Load initial teams when sport changes or modal opens
  useEffect(() => {
    if (existingTeams.length >= 2) {
      // Auto-populate Home Team with preset 0
      const hPreset = existingTeams[0];
      setHomePresetId(hPreset.id);
      setHomeName(hPreset.name);
      setHomeShort(hPreset.shortName);
      setHomeSeed(hPreset.seed);
      setHomeColor(
        COLOR_PRESETS.find(c => c.hex.toLowerCase() === hPreset.logoColor.toLowerCase()) || {
          label: 'Custom',
          hex: hPreset.logoColor,
          accent: hPreset.accentColor,
        }
      );
      setHomePlayers(hPreset.players.map((p, idx) => ({
        ...p,
        id: `hp-${idx + 1}-${Date.now()}`,
        isOnCourt: p.isOnCourt !== undefined ? p.isOnCourt : idx < maxOnCourt,
        isStarter: p.isStarter !== undefined ? p.isStarter : idx < maxOnCourt,
      })));

      // Auto-populate Away Team with preset 1
      const aPreset = existingTeams[1];
      setAwayPresetId(aPreset.id);
      setAwayName(aPreset.name);
      setAwayShort(aPreset.shortName);
      setAwaySeed(aPreset.seed);
      setAwayColor(
        COLOR_PRESETS.find(c => c.hex.toLowerCase() === aPreset.logoColor.toLowerCase()) || {
          label: 'Custom',
          hex: aPreset.logoColor,
          accent: aPreset.accentColor,
        }
      );
      setAwayPlayers(aPreset.players.map((p, idx) => ({
        ...p,
        id: `ap-${idx + 1}-${Date.now()}`,
        isOnCourt: p.isOnCourt !== undefined ? p.isOnCourt : idx < maxOnCourt,
        isStarter: p.isStarter !== undefined ? p.isStarter : idx < maxOnCourt,
      })));
    }
  }, [sport]);

  if (!isOpen) return null;

  // Handle selecting a pre-existing team
  const handleSelectPreset = (teamType: 'home' | 'away', presetId: string) => {
    if (teamType === 'home') {
      setHomePresetId(presetId);
      if (presetId === 'custom') return;

      const preset = existingTeams.find(t => t.id === presetId);
      if (!preset) return;

      setHomeName(preset.name);
      setHomeShort(preset.shortName);
      setHomeSeed(preset.seed);
      setHomeColor(
        COLOR_PRESETS.find(c => c.hex.toLowerCase() === preset.logoColor.toLowerCase()) || {
          label: 'Preset',
          hex: preset.logoColor,
          accent: preset.accentColor,
        }
      );
      setHomePlayers(preset.players.map((p, idx) => ({
        ...p,
        id: `hp-${idx + 1}-${Date.now()}`,
        isOnCourt: p.isOnCourt !== undefined ? p.isOnCourt : idx < maxOnCourt,
        isStarter: p.isStarter !== undefined ? p.isStarter : idx < maxOnCourt,
      })));
    } else {
      setAwayPresetId(presetId);
      if (presetId === 'custom') return;

      const preset = existingTeams.find(t => t.id === presetId);
      if (!preset) return;

      setAwayName(preset.name);
      setAwayShort(preset.shortName);
      setAwaySeed(preset.seed);
      setAwayColor(
        COLOR_PRESETS.find(c => c.hex.toLowerCase() === preset.logoColor.toLowerCase()) || {
          label: 'Preset',
          hex: preset.logoColor,
          accent: preset.accentColor,
        }
      );
      setAwayPlayers(preset.players.map((p, idx) => ({
        ...p,
        id: `ap-${idx + 1}-${Date.now()}`,
        isOnCourt: p.isOnCourt !== undefined ? p.isOnCourt : idx < maxOnCourt,
        isStarter: p.isStarter !== undefined ? p.isStarter : idx < maxOnCourt,
      })));
    }
  };

  // Populate 8-player full squad (6 on court for volleyball / 5 for basketball, rest on bench)
  const handlePopulateSquad = (team: 'home' | 'away') => {
    const isVb = sport === 'volleyball';
    const isHome = team === 'home';
    const sample: Player[] = isVb
      ? [
          { id: `p-${Date.now()}-1`, name: isHome ? 'Elena Rostova' : 'Maya Lindqvist', number: 7, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-2`, name: isHome ? 'Chloe Dubois' : 'Tara Davis', number: 14, position: 'Middle Blocker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-3`, name: isHome ? 'Sofia Hernandez' : 'Ananya Sharma', number: 3, position: 'Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-4`, name: isHome ? 'Mia Chen' : 'Camila Rossi', number: 10, position: 'Opposite', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-5`, name: isHome ? 'Kira Novak' : 'Elena Petrova', number: 1, position: 'Libero', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-6`, name: isHome ? 'Aaliyah Washington' : 'Yuki Takahashi', number: 12, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-7`, name: isHome ? 'Hannah Scott' : 'Brooke Collins', number: 18, position: 'Defensive Specialist', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
          { id: `p-${Date.now()}-8`, name: isHome ? 'Zoe Martinez' : 'Lily Vance', number: 22, position: 'Backup Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
        ]
      : [
          { id: `p-${Date.now()}-1`, name: isHome ? 'Marcus Vance' : 'Devon Sterling', number: 23, position: 'Shooting Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-2`, name: isHome ? 'Jaxon Hayes' : 'Zion Brooks', number: 11, position: 'Power Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-3`, name: isHome ? 'Cole Henderson' : 'Andre Miller', number: 5, position: 'Point Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-4`, name: isHome ? 'Malik Turner' : 'Dominic Reed', number: 34, position: 'Small Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-5`, name: isHome ? 'Trevor Campbell' : 'Kareem Vance', number: 55, position: 'Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-6`, name: isHome ? 'Devon Wright' : 'Tariq Johnson', number: 15, position: 'Sixth Man', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
          { id: `p-${Date.now()}-7`, name: isHome ? 'Jordan Hayes' : 'Mason Clark', number: 2, position: 'Backup Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
          { id: `p-${Date.now()}-8`, name: isHome ? 'Dominic Reed' : 'Isaac Newton', number: 44, position: 'Backup Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
        ];

    if (isHome) {
      setHomePlayers(sample);
      setHomePresetId('custom');
    } else {
      setAwayPlayers(sample);
      setAwayPresetId('custom');
    }
  };

  // Add individual player (squad limit 8, on-court limit 5 for basketball / 6 for volleyball)
  const handleAddPlayer = (team: 'home' | 'away') => {
    const isHome = team === 'home';
    const name = isHome ? homePlayerName : awayPlayerName;
    const numRaw = isHome ? homePlayerNumber : awayPlayerNumber;
    const pos = isHome ? homePlayerPos : awayPlayerPos;
    const currentList = isHome ? homePlayers : awayPlayers;

    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (currentList.length >= MAX_TEAM_ROSTER_LIMIT) {
      alert(`Limit reached: Maximum ${MAX_TEAM_ROSTER_LIMIT} players allowed per team squad for this match.`);
      return;
    }

    const parsedNum = parseInt(numRaw, 10);
    const validNumber = !isNaN(parsedNum) ? Math.max(0, Math.min(99, parsedNum)) : currentList.length + 1;

    // Check if on-court is under the sport limit
    const onCourtCount = currentList.filter(p => p.isOnCourt !== false).length;
    const shouldBeOnCourt = onCourtCount < maxOnCourt;

    const newPlayer: Player = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      number: validNumber,
      position: pos || (sport === 'volleyball' ? 'Player' : 'Guard'),
      points: 0,
      kills: 0,
      aces: 0,
      blocks: 0,
      twoPointers: 0,
      threePointers: 0,
      freeThrows: 0,
      isOnCourt: shouldBeOnCourt,
      isStarter: shouldBeOnCourt,
    };

    if (isHome) {
      setHomePlayers(prev => (prev.length >= MAX_TEAM_ROSTER_LIMIT ? prev : [...prev, newPlayer]));
      setHomePlayerName('');
      const nextJersey = (validNumber + 1) % 100;
      setHomePlayerNumber(String(nextJersey));
    } else {
      setAwayPlayers(prev => (prev.length >= MAX_TEAM_ROSTER_LIMIT ? prev : [...prev, newPlayer]));
      setAwayPlayerName('');
      const nextJersey = (validNumber + 1) % 100;
      setAwayPlayerNumber(String(nextJersey));
    }
  };

  // Toggle Court vs Bench status for a player (strictly max 5 for basketball, 6 for volleyball)
  const handleToggleCourtStatus = (team: 'home' | 'away', playerId: string) => {
    const isHome = team === 'home';
    const list = isHome ? homePlayers : awayPlayers;
    const setList = isHome ? setHomePlayers : setAwayPlayers;
    const player = list.find(p => p.id === playerId);
    if (!player) return;

    const currentlyOnCourt = player.isOnCourt !== false;
    if (currentlyOnCourt) {
      // Move to Bench
      setList(prev => prev.map(p => p.id === playerId ? { ...p, isOnCourt: false, isStarter: false } : p));
    } else {
      // Move to Court: check on-court cap (5 for basketball, 6 for volleyball)
      const activeOnCourt = list.filter(p => p.isOnCourt !== false).length;
      if (activeOnCourt >= maxOnCourt) {
        alert(`Regulation Limit: Only ${maxOnCourt} players are allowed on court at the same time in ${sport}. Bench an active court player before moving ${player.name} to the court.`);
        return;
      }
      setList(prev => prev.map(p => p.id === playerId ? { ...p, isOnCourt: true, isStarter: true } : p));
    }
  };

  const handleUpdatePlayer = (
    team: 'home' | 'away',
    playerId: string,
    field: 'name' | 'number' | 'position',
    value: string | number
  ) => {
    const updater = (prev: Player[]) =>
      prev.map(p => {
        if (p.id !== playerId) return p;
        if (field === 'name') {
          return { ...p, name: String(value) };
        } else if (field === 'position') {
          return { ...p, position: String(value) };
        } else {
          const num = typeof value === 'number' ? value : parseInt(String(value), 10);
          return { ...p, number: isNaN(num) ? 0 : Math.max(0, Math.min(99, num)) };
        }
      });

    if (team === 'home') setHomePlayers(updater);
    else setAwayPlayers(updater);
  };

  const handleRemovePlayer = (team: 'home' | 'away', id: string) => {
    if (team === 'home') setHomePlayers(prev => prev.filter(p => p.id !== id));
    else setAwayPlayers(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeName.trim() || !awayName.trim()) return;

    if (homePlayers.length === 0 || awayPlayers.length === 0) {
      alert(`Please ensure both teams have at least 1 player (up to ${MAX_TEAM_ROSTER_LIMIT} squad limit, max ${maxOnCourt} on court).`);
      return;
    }

    // Verify On-Court Player Limit: Maximum 5 for basketball, 6 for volleyball
    const homeOnCourt = homePlayers.filter(p => p.isOnCourt !== false);
    const awayOnCourt = awayPlayers.filter(p => p.isOnCourt !== false);

    if (homeOnCourt.length > maxOnCourt) {
      alert(`Regulation Violation: Home team (${homeName}) has ${homeOnCourt.length} players marked On Court. Only ${maxOnCourt} players are allowed to play on the court in ${sport}. Move ${homeOnCourt.length - maxOnCourt} player(s) to the bench.`);
      return;
    }

    if (awayOnCourt.length > maxOnCourt) {
      alert(`Regulation Violation: Away team (${awayName}) has ${awayOnCourt.length} players marked On Court. Only ${maxOnCourt} players are allowed to play on the court in ${sport}. Move ${awayOnCourt.length - maxOnCourt} player(s) to the bench.`);
      return;
    }

    const matchId = `match-${Date.now()}`;
    const cleanHomeShort = (homeShort.trim() || homeName.slice(0, 3)).toUpperCase();
    const cleanAwayShort = (awayShort.trim() || awayName.slice(0, 3)).toUpperCase();
    const matchTitle = title.trim() || `${sport === 'volleyball' ? 'Volleyball' : 'Basketball'} Official Match`;

    const isLive = status === 'LIVE';

    const newMatch: Match = {
      id: matchId,
      sport,
      title: matchTitle,
      division,
      status,
      court,
      venue,
      statusDetail: isLive 
        ? (sport === 'volleyball' ? 'SET 1 (0-0 · FIRST SERVE)' : 'LIVE Q1 10:00')
        : 'UPCOMING · SCHEDULED',
      timeRemaining: isLive ? (sport === 'volleyball' ? 'Set 1' : '10:00') : 'Scheduled',
      possession: 'home',
      homeTeam: {
        id: `team-home-${Date.now()}`,
        name: homeName.trim(),
        shortName: cleanHomeShort,
        seed: homeSeed,
        logoColor: homeColor.hex,
        accentColor: homeColor.accent,
        record: '0-0',
        score: 0,
        setsWon: 0,
        quarterScores: [0],
        timeoutsLeft: sport === 'volleyball' ? 2 : 4,
        fouls: 0,
        players: homePlayers.slice(0, MAX_TEAM_ROSTER_LIMIT).map(p => ({
          ...p,
          isOnCourt: p.isOnCourt !== false,
          isStarter: p.isOnCourt !== false,
        })),
      },
      awayTeam: {
        id: `team-away-${Date.now()}`,
        name: awayName.trim(),
        shortName: cleanAwayShort,
        seed: awaySeed,
        logoColor: awayColor.hex,
        accentColor: awayColor.accent,
        record: '0-0',
        score: 0,
        setsWon: 0,
        quarterScores: [0],
        timeoutsLeft: sport === 'volleyball' ? 2 : 4,
        fouls: 0,
        players: awayPlayers.slice(0, MAX_TEAM_ROSTER_LIMIT).map(p => ({
          ...p,
          isOnCourt: p.isOnCourt !== false,
          isStarter: p.isOnCourt !== false,
        })),
      },
    };

    if (sport === 'volleyball') {
      newMatch.volleyballFormat = volleyballFormat;
      newMatch.currentSetNumber = 1;
      newMatch.targetPoints = 25;
      newMatch.isDeuce = false;
      newMatch.setScores = [
        { set: 1, homeScore: 0, awayScore: 0, isCompleted: false, targetPoints: 25, isDecidingSet: false }
      ];
    } else {
      newMatch.basketballPeriod = 'Q1';
      newMatch.shotClock = 24;
    }

    onCreateMatch(newMatch);
    onClose();
  };

  // Helper renderer for a team roster section (Court vs Bench)
  const renderRosterSection = (
    teamType: 'home' | 'away',
    players: Player[],
    colorHex: string
  ) => {
    const onCourtPlayers = players.filter(p => p.isOnCourt !== false);
    const benchPlayers = players.filter(p => p.isOnCourt === false);
    const totalCount = players.length;
    const isHome = teamType === 'home';

    return (
      <div className="space-y-3">
        {/* Squad Status Overview Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0b0e14]/80 border border-white/10">
          <div className="flex items-center gap-2">
            {/* Court Status Pill */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono tracking-wider ${
              onCourtPlayers.length === maxOnCourt
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : onCourtPlayers.length > maxOnCourt
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Court: {onCourtPlayers.length}/{maxOnCourt} PLAYING</span>
            </div>

            {/* Squad Roster Pill */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono tracking-wider ${
              totalCount === MAX_TEAM_ROSTER_LIMIT
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-white/10 text-white/80 border border-white/15'
            }`}>
              <Users className="w-3.5 h-3.5" />
              <span>Squad: {totalCount}/{MAX_TEAM_ROSTER_LIMIT}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePopulateSquad(teamType)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-bold text-white flex items-center gap-1 transition-colors"
              title={`Load full 8-player squad (${maxOnCourt} on court, ${MAX_TEAM_ROSTER_LIMIT - maxOnCourt} bench)`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              Auto 8 Squad ({maxOnCourt}+{MAX_TEAM_ROSTER_LIMIT - maxOnCourt})
            </button>
            <button
              type="button"
              onClick={() => (isHome ? setHomePlayers([]) : setAwayPlayers([]))}
              className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-400 border border-white/10 transition-colors"
              title="Clear roster"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 1. Active Players On Court */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Active On Court ({onCourtPlayers.length}/{maxOnCourt} Playing)
            </span>
            <span className="text-[10px] text-white/40 normal-case font-normal">
              Click "ON COURT" to move to bench
            </span>
          </div>

          {onCourtPlayers.length === 0 ? (
            <div className="p-3 rounded-xl bg-[#0b0e14]/60 border border-dashed border-white/15 text-center text-xs text-white/50">
              No players currently designated on court. Minimum 1 required (up to 6 max).
            </div>
          ) : (
            <div className="space-y-1">
              {onCourtPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 p-1.5 bg-[#0b0e14] rounded-xl border border-emerald-500/30 hover:border-emerald-500/60 transition-colors group"
                >
                  <span className="text-[10px] text-white/40 w-4 font-mono text-center">
                    {idx + 1}
                  </span>

                  {/* On Court Status Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleCourtStatus(teamType, p.id)}
                    className="px-2 py-1 rounded-md bg-emerald-500/20 hover:bg-amber-500/20 text-emerald-400 hover:text-amber-300 border border-emerald-500/40 hover:border-amber-500/40 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0"
                    title="Click to move this player to the Bench"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>ON COURT</span>
                  </button>

                  {/* Jersey Number */}
                  <input
                    type="number"
                    value={p.number}
                    onChange={(e) => handleUpdatePlayer(teamType, p.id, 'number', e.target.value)}
                    min={0}
                    max={99}
                    className="w-11 px-1.5 py-1 bg-white/5 border border-white/10 rounded-lg font-mono font-bold text-center text-xs text-emerald-300 outline-none focus:border-emerald-400"
                    title="Jersey Number (0-99)"
                  />

                  {/* Player Name */}
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handleUpdatePlayer(teamType, p.id, 'name', e.target.value)}
                    className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white font-medium outline-none focus:border-emerald-400 placeholder-white/30"
                    placeholder="Player Name"
                  />

                  {/* Position Tag / Input */}
                  <input
                    type="text"
                    value={p.position}
                    onChange={(e) => handleUpdatePlayer(teamType, p.id, 'position', e.target.value)}
                    className="w-24 sm:w-28 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] text-white/70 outline-none focus:border-emerald-400 truncate"
                    placeholder="Position"
                    title="Player Position"
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(teamType, p.id)}
                    className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors"
                    title="Remove player from roster"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Bench Reserves (Max 2 when total 8) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-400/90 px-1">
            <span className="flex items-center gap-1.5">
              <Shirt className="w-3 h-3 text-amber-400" />
              Bench Reserves ({benchPlayers.length} Sub{benchPlayers.length !== 1 ? 's' : ''})
            </span>
            <span className="text-[10px] text-white/40 normal-case font-normal">
              Click "BENCH" to promote to court
            </span>
          </div>

          {benchPlayers.length === 0 ? (
            <div className="p-2.5 rounded-xl bg-[#0b0e14]/40 border border-white/5 text-center text-xs text-white/40 italic">
              No bench reserve players yet. Add players below to populate the substitute bench.
            </div>
          ) : (
            <div className="space-y-1">
              {benchPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 p-1.5 bg-[#0b0e14] rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-colors group"
                >
                  <span className="text-[10px] text-white/40 w-4 font-mono text-center">
                    b{idx + 1}
                  </span>

                  {/* Bench Status Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleCourtStatus(teamType, p.id)}
                    className="px-2 py-1 rounded-md bg-amber-500/15 hover:bg-emerald-500/20 text-amber-300 hover:text-emerald-400 border border-amber-500/30 hover:border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0"
                    title="Click to promote this bench player onto the Court (if < 6 on court)"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>BENCH</span>
                  </button>

                  {/* Jersey Number */}
                  <input
                    type="number"
                    value={p.number}
                    onChange={(e) => handleUpdatePlayer(teamType, p.id, 'number', e.target.value)}
                    min={0}
                    max={99}
                    className="w-11 px-1.5 py-1 bg-white/5 border border-white/10 rounded-lg font-mono font-bold text-center text-xs text-amber-300/90 outline-none focus:border-amber-400"
                    title="Jersey Number (0-99)"
                  />

                  {/* Player Name */}
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handleUpdatePlayer(teamType, p.id, 'name', e.target.value)}
                    className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white font-medium outline-none focus:border-amber-400 placeholder-white/30"
                    placeholder="Player Name"
                  />

                  {/* Position Tag / Input */}
                  <input
                    type="text"
                    value={p.position}
                    onChange={(e) => handleUpdatePlayer(teamType, p.id, 'position', e.target.value)}
                    className="w-24 sm:w-28 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] text-white/70 outline-none focus:border-amber-400 truncate"
                    placeholder="Position"
                    title="Player Position"
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(teamType, p.id)}
                    className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors"
                    title="Remove player from roster"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Add Player Row (Enforcing Squad Limit of 8) */}
        {totalCount < MAX_TEAM_ROSTER_LIMIT ? (
          <div className="p-2.5 rounded-xl bg-[#0b0e14] border border-white/15 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-white/60">
              <span className="font-bold uppercase tracking-wider text-white/80">
                Add Player ({MAX_TEAM_ROSTER_LIMIT - totalCount} slots available)
              </span>
              <span className="text-[10px] text-white/50">
                {onCourtPlayers.length < maxOnCourt ? 'Will join Court' : 'Will join Bench'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <input
                type="number"
                value={isHome ? homePlayerNumber : awayPlayerNumber}
                onChange={(e) => isHome ? setHomePlayerNumber(e.target.value) : setAwayPlayerNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPlayer(teamType);
                  }
                }}
                placeholder="#"
                min={0}
                max={99}
                className="w-12 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono font-bold text-center text-white outline-none focus:border-cyan-400"
                title="Jersey Number (0-99)"
              />
              <input
                type="text"
                value={isHome ? homePlayerName : awayPlayerName}
                onChange={(e) => isHome ? setHomePlayerName(e.target.value) : setAwayPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPlayer(teamType);
                  }
                }}
                placeholder="Athlete Full Name (e.g. Jordan Hayes)"
                className="flex-1 min-w-[140px] px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400"
              />
              <input
                type="text"
                value={isHome ? homePlayerPos : awayPlayerPos}
                onChange={(e) => isHome ? setHomePlayerPos(e.target.value) : setAwayPlayerPos(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPlayer(teamType);
                  }
                }}
                placeholder="Position"
                className="w-24 sm:w-28 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 placeholder-white/30 outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => handleAddPlayer(teamType)}
                disabled={!(isHome ? homePlayerName.trim() : awayPlayerName.trim())}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] disabled:opacity-30 disabled:cursor-not-allowed text-white font-heading font-bold text-xs uppercase transition-all shrink-0 flex items-center gap-1 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              Full 8-player tournament roster reached (6 on court, 2 on bench)
            </span>
            <span className="text-[10px] text-white/40">Delete to swap</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-[95vw] sm:w-[90vw] md:w-[80vw] max-w-[95vw] md:max-w-[80vw] glass-panel-elevated p-5 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative my-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#f97316] p-0.5">
            <div className="w-full h-full bg-[#10131a] rounded-[10px] flex items-center justify-center text-white">
              <PlusCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-black text-2xl text-white uppercase tracking-wider">
                Create Official Match
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
                PRO ROSTER 8 (6 COURT)
              </span>
            </div>
            <p className="text-xs text-[#94a3b8]">
              Select pre-existing tournament teams, customize official 8-player squads, and enforce 6-player on-court rules
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Championship Sport Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
              Championship Sport
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSport('volleyball')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-heading font-bold text-sm uppercase transition-all ${
                  sport === 'volleyball'
                    ? 'bg-[#0284c7]/20 border-[#38bdf8] text-[#38bdf8] shadow-lg glow-blue'
                    : 'bg-[#0b0e14] border-white/10 text-[#94a3b8] hover:border-white/20'
                }`}
              >
                <Zap className="w-4 h-4" />
                Volleyball (VNL Rules)
              </button>
              <button
                type="button"
                onClick={() => setSport('basketball')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-heading font-bold text-sm uppercase transition-all ${
                  sport === 'basketball'
                    ? 'bg-[#f97316]/20 border-[#fb923c] text-[#fb923c] shadow-lg glow-orange'
                    : 'bg-[#0b0e14] border-white/10 text-[#94a3b8] hover:border-white/20'
                }`}
              >
                <Flame className="w-4 h-4" />
                Basketball (NCAA/FIBA)
              </button>
            </div>
          </div>

          {/* Volleyball Match Format (if Volleyball) */}
          {sport === 'volleyball' && (
            <div className="p-4 rounded-xl bg-[#0284c7]/10 border border-[#0284c7]/30 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#38bdf8]">
                VNL Match Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVolleyballFormat('best-of-5')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase border transition-all ${
                    volleyballFormat === 'best-of-5'
                      ? 'bg-[#0284c7] border-transparent text-white'
                      : 'bg-[#0b0e14] border-white/15 text-[#94a3b8]'
                  }`}
                >
                  Best-of-5 (Sets 1-4 to 25 · Set 5 to 15)
                </button>
                <button
                  type="button"
                  onClick={() => setVolleyballFormat('best-of-3')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase border transition-all ${
                    volleyballFormat === 'best-of-3'
                      ? 'bg-[#0284c7] border-transparent text-white'
                      : 'bg-[#0b0e14] border-white/15 text-[#94a3b8]'
                  }`}
                >
                  Best-of-3 (Sets 1-2 to 25 · Set 3 to 15)
                </button>
              </div>
            </div>
          )}

          {/* Match Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Match Title / Event
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. National Championship Semifinal"
                className="w-full px-3 py-2.5 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Division / Category
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none"
              >
                <option value="Men's Division I">Men's Division I</option>
                <option value="Women's Division I">Women's Division I</option>
                <option value="Men's Division II">Men's Division II</option>
                <option value="Women's Division II">Women's Division II</option>
                <option value="Collegiate Club Cup">Collegiate Club Cup</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Court Assignment
              </label>
              <input
                type="text"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                placeholder="e.g. Court 1 - Main Arena"
                className="w-full px-3 py-2.5 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'UPCOMING' | 'LIVE')}
                className="w-full px-3 py-2.5 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none"
              >
                <option value="LIVE">LIVE (Ready to score immediately)</option>
                <option value="UPCOMING">UPCOMING (Scheduled for later)</option>
              </select>
            </div>
          </div>

          {/* Professional Competing Teams Section */}
          <div className="border-t border-white/10 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-black text-base uppercase text-white tracking-wider flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Competing Teams &amp; Rosters
              </h4>
              <span className="text-xs text-white/50">
                Rule: Max 8 players in squad · Only 6 allowed on court
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Home Team Card */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 right-0 h-1" 
                  style={{ backgroundColor: homeColor.hex }} 
                />

                {/* Home Team Header & Preset Selector */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: homeColor.hex }} />
                    HOME TEAM
                  </span>
                  <span className="text-[10px] font-mono text-white/60 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    Seed #{homeSeed}
                  </span>
                </div>

                {/* Pre-existing Team Selector Dropdown */}
                <div className="p-2.5 rounded-xl bg-[#0b0e14] border border-[#38bdf8]/30 space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
                    Select Pre-existing Team (Auto-Fills Name &amp; Roster)
                  </label>
                  <select
                    value={homePresetId}
                    onChange={(e) => handleSelectPreset('home', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-lg text-xs text-white font-medium focus:border-[#38bdf8] outline-none"
                  >
                    <option value="custom">-- Custom / Blank Team (Manual Entry) --</option>
                    {existingTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        ★ {t.name} ({t.shortName}) - #{t.seed} Seed · 8 Players
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team Details Inputs */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={homeName}
                    onChange={(e) => {
                      setHomeName(e.target.value);
                      setHomePresetId('custom');
                    }}
                    placeholder="Team Name (e.g. Pacific Surge)"
                    className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white font-bold focus:border-[#38bdf8] outline-none"
                    required
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={homeShort}
                      onChange={(e) => setHomeShort(e.target.value.toUpperCase().slice(0, 4))}
                      placeholder="Short Code (e.g. SUR)"
                      maxLength={4}
                      className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white font-mono uppercase focus:border-[#38bdf8] outline-none"
                    />
                    <input
                      type="number"
                      value={homeSeed}
                      onChange={(e) => setHomeSeed(Number(e.target.value))}
                      placeholder="Seed #"
                      min={1}
                      max={32}
                      className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white font-mono focus:border-[#38bdf8] outline-none"
                    />
                  </div>

                  {/* Color Preset Palette */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold uppercase text-[#94a3b8]">Team Kit:</span>
                    <div className="flex gap-1.5">
                      {COLOR_PRESETS.map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setHomeColor(col)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            homeColor.hex.toLowerCase() === col.hex.toLowerCase()
                              ? 'scale-125 ring-2 ring-white shadow-md'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Home Roster Manager */}
                <div className="pt-3 border-t border-white/10">
                  {renderRosterSection('home', homePlayers, homeColor.hex)}
                </div>
              </div>

              {/* Away Team Card */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 right-0 h-1" 
                  style={{ backgroundColor: awayColor.hex }} 
                />

                {/* Away Team Header & Preset Selector */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase tracking-wider text-[#f97316] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: awayColor.hex }} />
                    AWAY TEAM
                  </span>
                  <span className="text-[10px] font-mono text-white/60 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    Seed #{awaySeed}
                  </span>
                </div>

                {/* Pre-existing Team Selector Dropdown */}
                <div className="p-2.5 rounded-xl bg-[#0b0e14] border border-[#f97316]/30 space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#f97316]">
                    Select Pre-existing Team (Auto-Fills Name &amp; Roster)
                  </label>
                  <select
                    value={awayPresetId}
                    onChange={(e) => handleSelectPreset('away', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-lg text-xs text-white font-medium focus:border-[#f97316] outline-none"
                  >
                    <option value="custom">-- Custom / Blank Team (Manual Entry) --</option>
                    {existingTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        ★ {t.name} ({t.shortName}) - #{t.seed} Seed · 8 Players
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team Details Inputs */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={awayName}
                    onChange={(e) => {
                      setAwayName(e.target.value);
                      setAwayPresetId('custom');
                    }}
                    placeholder="Team Name (e.g. Peak Spikers)"
                    className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white font-bold focus:border-[#f97316] outline-none"
                    required
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={awayShort}
                      onChange={(e) => setAwayShort(e.target.value.toUpperCase().slice(0, 4))}
                      placeholder="Short Code (e.g. SPK)"
                      maxLength={4}
                      className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white font-mono uppercase focus:border-[#f97316] outline-none"
                    />
                    <input
                      type="number"
                      value={awaySeed}
                      onChange={(e) => setAwaySeed(Number(e.target.value))}
                      placeholder="Seed #"
                      min={1}
                      max={32}
                      className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white font-mono focus:border-[#f97316] outline-none"
                    />
                  </div>

                  {/* Color Preset Palette */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold uppercase text-[#94a3b8]">Team Kit:</span>
                    <div className="flex gap-1.5">
                      {COLOR_PRESETS.map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setAwayColor(col)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            awayColor.hex.toLowerCase() === col.hex.toLowerCase()
                              ? 'scale-125 ring-2 ring-white shadow-md'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Away Roster Manager */}
                <div className="pt-3 border-t border-white/10">
                  {renderRosterSection('away', awayPlayers, awayColor.hex)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="text-xs text-white/50 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official rule enforcement: 8 players max squad, 6 players on court.</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white font-heading font-bold text-xs uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg glow-blue transition-all active:scale-95 flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Schedule &amp; Initialize Match (0-0)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
