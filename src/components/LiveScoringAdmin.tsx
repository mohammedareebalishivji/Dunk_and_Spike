import React, { useState, useEffect } from 'react';
import { Match, PlayEvent, Sport, VolleyballMatchFormat, Player, Team } from '../types';
import { 
  ShieldCheck, 
  Play, 
  Pause, 
  Flame, 
  Zap, 
  Radio, 
  AlertCircle, 
  CheckCircle2, 
  ListPlus, 
  Tv, 
  ArrowRight, 
  ArrowLeft,
  RotateCcw, 
  Info, 
  Award, 
  Scale, 
  Unlock, 
  Lock, 
  ArrowLeftRight, 
  Volume2, 
  VolumeX, 
  FileText, 
  Timer, 
  Undo2, 
  AlertTriangle, 
  Trash2,
  Shirt,
  UserPlus,
  Star,
  PlusCircle,
  Settings,
  Users,
  Flag
} from 'lucide-react';
import { isDecidingSetNumber, getBaseTargetPoints, needsCourtSwitch } from '../utils/volleyballRules';
import { evaluateBonusStatus } from '../utils/basketballRules';
import { arenaSounds } from '../utils/audioFeedback';
import { OfficialScoresheetModal } from './OfficialScoresheetModal';
import { PlayerScorerModal } from './PlayerScorerModal';
import { SubstitutionModal } from './SubstitutionModal';
import { VolleyballSetEditModal } from './VolleyballSetEditModal';
import { executeSubstitution, MAX_VOLLEYBALL_SUBS_PER_SET } from '../utils/substitutionManager';
import { getChampionshipRules } from '../utils/rulesManager';

interface LiveScoringAdminProps {
  matches: Match[];
  selectedMatchId?: string;
  onSelectMatchId?: (matchId: string) => void;
  onUpdateMatchScore: (
    matchId: string, 
    team: 'home' | 'away', 
    points: number, 
    reason: string,
    eventType: 'SCORE' | 'FOUL' | 'TIMEOUT' | 'BLOCK' | 'ACE' | 'SPIKE' | 'REBOUND' | 'ASSIST' | 'STEAL' | 'TURNOVER',
    playerId?: string,
    playerName?: string,
    playerNumber?: number
  ) => void;
  onAddPlayerToMatchTeam?: (matchId: string, team: 'home' | 'away', player: Player) => void;
  onUpdateTeam?: (matchId: string, team: 'home' | 'away', updatedTeam: Team, playEvent?: PlayEvent) => void;
  onOpenTeamModal?: (team: Team, sport: Sport) => void;
  onFormatChange?: (matchId: string, format: VolleyballMatchFormat) => void;
  onAdvanceBasketballPeriod?: (matchId: string) => void;
  onAdvanceVolleyballSet?: (matchId: string) => void;
  onEditVolleyballSetScore?: (
    matchId: string, 
    setNumber: number, 
    homeScore: number, 
    awayScore: number, 
    continueFromSet: boolean
  ) => void;
  onResetMatch?: (matchId: string) => void;
  onEndMatch?: (matchId: string) => void;
  onToggleClock: (matchId: string) => void;
  onResetShotClock: (matchId: string, seconds: number) => void;
  onOpenRulebook?: () => void;
  onOpenRulesEditor?: () => void;
  onOpenCreateMatch?: () => void;
  onLoadTemplateSchedule?: () => void;
  onClearAllData?: () => void;
  onDeleteMatch?: (matchId: string) => void;
  onBackToSchedule?: () => void;
  onNavigateToTeams?: () => void;
  onOpenRegisterTeam?: () => void;
}

export const LiveScoringAdmin: React.FC<LiveScoringAdminProps> = ({
  matches,
  selectedMatchId,
  onSelectMatchId,
  onUpdateMatchScore,
  onAddPlayerToMatchTeam,
  onUpdateTeam,
  onOpenTeamModal,
  onFormatChange,
  onAdvanceBasketballPeriod,
  onAdvanceVolleyballSet,
  onEditVolleyballSetScore,
  onResetMatch,
  onEndMatch,
  onOpenRulebook,
  onOpenRulesEditor,
  onOpenCreateMatch,
  onLoadTemplateSchedule,
  onClearAllData,
  onDeleteMatch,
  onBackToSchedule,
  onNavigateToTeams,
  onOpenRegisterTeam,
}) => {
  const [currentMatchId, setCurrentMatchId] = useState<string>(
    selectedMatchId || matches[0]?.id
  );
  const [isScoringUnlocked, setIsScoringUnlocked] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [isScoresheetOpen, setIsScoresheetOpen] = useState<boolean>(false);
  const [isVolleyballSetEditOpen, setIsVolleyballSetEditOpen] = useState<boolean>(false);
  const [setEditInitialNum, setSetEditInitialNum] = useState<number>(1);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number | null>(null);
  const [playFilter, setPlayFilter] = useState<'ALL' | 'SCORE' | 'FOUL' | 'TIMEOUT' | 'SUB'>('ALL');

  // Player Scorer Attribution Modal State
  const [pendingScore, setPendingScore] = useState<{
    team: 'home' | 'away';
    points: number;
    label: string;
    type: 'SCORE' | 'FOUL' | 'TIMEOUT' | 'BLOCK' | 'ACE' | 'SPIKE' | 'REBOUND' | 'ASSIST' | 'STEAL' | 'TURNOVER';
  } | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);

  // Substitution Modal State
  const [subModalTeam, setSubModalTeam] = useState<'home' | 'away' | null>(null);
  const [subModalPlayerOutId, setSubModalPlayerOutId] = useState<string | undefined>(undefined);

  // Quick inline add player state
  const [quickAddTeam, setQuickAddTeam] = useState<'home' | 'away' | null>(null);
  const [quickPlayerName, setQuickPlayerName] = useState<string>('');
  const [quickPlayerNumber, setQuickPlayerNumber] = useState<number>(10);
  const [quickPlayerPos, setQuickPlayerPos] = useState<string>('Starter');

  // Game clock for basketball (seconds remaining, default 10 min = 600s)
  const [gameClockSeconds, setGameClockSeconds] = useState<number>(600); // 10:00
  const [isGameClockRunning, setIsGameClockRunning] = useState<boolean>(false);

  useEffect(() => {
    if (selectedMatchId) {
      setCurrentMatchId(selectedMatchId);
    } else if (matches[0]?.id) {
      setCurrentMatchId(matches[0].id);
    }
  }, [selectedMatchId, matches]);

  useEffect(() => {
    setIsScoringUnlocked(false);
    setTimeoutSeconds(null);
    setSubModalTeam(null);
    setSubModalPlayerOutId(undefined);
  }, [currentMatchId]);

  const match = matches.find((m) => m.id === currentMatchId) || matches[0];
  const isBasketball = match?.sport === 'basketball';
  const isVolleyball = match?.sport === 'volleyball';
  const isFinal = match?.status === 'FINAL';
  const isScoringDisabled = isFinal && !isScoringUnlocked;

  const championshipRules = getChampionshipRules();
  const maxSubsAllowed = isVolleyball 
    ? (championshipRules.volleyball?.maxSubstitutionsPerSet ?? MAX_VOLLEYBALL_SUBS_PER_SET) 
    : 999;

  const format: VolleyballMatchFormat = match?.volleyballFormat || 'best-of-5';
  const currentSet = match?.currentSetNumber || 1;
  const isDeciding = isDecidingSetNumber(currentSet, format);
  const baseTarget = getBaseTargetPoints(currentSet, format);
  const currentTarget = match?.targetPoints || baseTarget;
  const courtSwitchAlert = isVolleyball && isDeciding && needsCourtSwitch(currentSet, format, match?.homeTeam?.score || 0, match?.awayTeam?.score || 0);

  const homeBonus = evaluateBonusStatus(match?.homeTeam?.fouls || 0);
  const awayBonus = evaluateBonusStatus(match?.awayTeam?.fouls || 0);

  const handleConfirmEndMatch = () => {
    if (!match || !onEndMatch) return;
    const homeSets = match.homeTeam.setsWon ?? 0;
    const awaySets = match.awayTeam.setsWon ?? 0;
    const homeScore = match.homeTeam.score ?? 0;
    const awayScore = match.awayTeam.score ?? 0;

    let winnerName = match.homeTeam.name;
    if (isVolleyball) {
      if (homeSets > awaySets) winnerName = match.homeTeam.name;
      else if (awaySets > homeSets) winnerName = match.awayTeam.name;
      else winnerName = homeScore >= awayScore ? match.homeTeam.name : match.awayTeam.name;
    } else {
      if (homeSets > awaySets) winnerName = match.homeTeam.name;
      else if (awaySets > homeSets) winnerName = match.awayTeam.name;
      else winnerName = homeScore >= awayScore ? match.homeTeam.name : match.awayTeam.name;
    }

    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const ok = window.confirm(
        `End official match "${match.homeTeam.name} vs ${match.awayTeam.name}"?\n\n` +
        `• Team with most set wins (${winnerName}) will be declared the winner.\n` +
        `• +1 point will be awarded to ${winnerName} for scoreboard and standings.\n` +
        `• Match status will be officially concluded as FINAL.`
      );
      if (!ok) return;
    }
    onEndMatch(match.id);
  };

  // Sound mute sync
  const toggleSound = () => {
    const next = !isSoundMuted;
    setIsSoundMuted(next);
    arenaSounds.setSoundEnabled(!next);
  };

  // Local simulated play log (clean initial state, zero preloaded fake plays)
  const [playEvents, setPlayEvents] = useState<PlayEvent[]>([]);

  const [isShotClockRunning, setIsShotClockRunning] = useState<boolean>(false);
  const [shotClock, setShotClock] = useState<number>(match?.shotClock || 24);

  // Sync shot clock when match changes
  useEffect(() => {
    if (match?.shotClock) {
      setShotClock(match.shotClock);
    }
  }, [match?.id, match?.shotClock]);

  // Shot clock timer simulation for basketball
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isShotClockRunning && isBasketball && shotClock > 0 && !isFinal) {
      timer = setInterval(() => {
        setShotClock((prev) => {
          if (prev <= 1) {
            arenaSounds.playBuzzer();
            return 24;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isShotClockRunning, isBasketball, shotClock, isFinal]);

  // Game clock countdown for basketball
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGameClockRunning && isBasketball && gameClockSeconds > 0 && !isFinal) {
      timer = setInterval(() => {
        setGameClockSeconds((prev) => {
          if (prev <= 1) {
            setIsGameClockRunning(false);
            arenaSounds.playBuzzer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isGameClockRunning, isBasketball, gameClockSeconds, isFinal]);

  // Official 30s Timeout countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeoutSeconds !== null && timeoutSeconds > 0) {
      timer = setInterval(() => {
        setTimeoutSeconds((prev) => {
          if (prev !== null && prev <= 1) {
            arenaSounds.playBuzzer();
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeoutSeconds]);

  const formatGameClock = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleScore = (
    team: 'home' | 'away', 
    points: number, 
    label: string, 
    type: 'SCORE' | 'FOUL' | 'TIMEOUT' | 'BLOCK' | 'ACE' | 'SPIKE' | 'REBOUND' | 'ASSIST' | 'STEAL' | 'TURNOVER'
  ) => {
    if (isScoringDisabled) return;

    if (points > 0 || type === 'REBOUND' || type === 'ASSIST' || type === 'STEAL') {
      // User requested: for each point or key stat ask which playing player scored/earned it
      setPendingScore({ team, points, label, type });
      setIsPlayerModalOpen(true);
    } else {
      commitScore(team, points, label, type);
    }
  };

  const commitScore = (
    team: 'home' | 'away', 
    points: number, 
    label: string, 
    type: 'SCORE' | 'FOUL' | 'TIMEOUT' | 'BLOCK' | 'ACE' | 'SPIKE' | 'REBOUND' | 'ASSIST' | 'STEAL' | 'TURNOVER',
    player?: Player
  ) => {
    if (isScoringDisabled) return;

    // Trigger audio cues
    if (points > 0) {
      arenaSounds.playScoreDing();
    } else if (type === 'TIMEOUT' || type === 'FOUL') {
      arenaSounds.playWhistle();
    }

    if (type === 'TIMEOUT') {
      setTimeoutSeconds(30);
    }

    onUpdateMatchScore(
      match.id, 
      team, 
      points, 
      label, 
      type,
      player?.id,
      player?.name,
      player?.number
    );
    
    // Add to play event log with player name & jersey number
    const teamName = team === 'home' ? match.homeTeam.name : match.awayTeam.name;
    const playerText = player ? ` (${player.name} #${player.number})` : '';
    const newEvent: PlayEvent = {
      id: `e-${Date.now()}`,
      matchId: match.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      period: isBasketball ? (match.basketballPeriod || 'Q3') : `Set ${currentSet}`,
      team,
      type,
      description: `${teamName}: ${label}${playerText}`,
      scoreChange: points !== 0 ? (points > 0 ? `+${points}` : `${points}`) : undefined,
      playerId: player?.id,
      playerName: player?.name,
      playerNumber: player?.number,
    };
    setPlayEvents(prev => [newEvent, ...prev]);
    
    if (isBasketball && points > 0) {
      setShotClock(24);
    }
  };

  const handleSelectScorer = (player?: Player) => {
    if (!pendingScore) return;
    commitScore(
      pendingScore.team, 
      pendingScore.points, 
      pendingScore.label, 
      pendingScore.type, 
      player
    );
    setIsPlayerModalOpen(false);
    setPendingScore(null);
  };

  const handleQuickAddPlayerModal = (name: string, number: number, position: string) => {
    if (!pendingScore) return;
    const newP: Player = {
      id: `p-${Date.now()}`,
      name,
      number,
      position,
      points: 0,
      kills: 0,
      aces: 0,
      blocks: 0,
      twoPointers: 0,
      threePointers: 0,
      freeThrows: 0,
      rebounds: 0,
      assists: 0,
      fouls: 0,
      steals: 0,
    };
    onAddPlayerToMatchTeam?.(match.id, pendingScore.team, newP);
    // Attribute the point to the newly created player immediately
    commitScore(
      pendingScore.team,
      pendingScore.points,
      pendingScore.label,
      pendingScore.type,
      newP
    );
    setIsPlayerModalOpen(false);
    setPendingScore(null);
  };

  const handleDirectPlayerScore = (
    team: 'home' | 'away',
    player: Player,
    points: number,
    label: string,
    type: 'SCORE' | 'SPIKE' | 'ACE' | 'BLOCK' | 'REBOUND' | 'ASSIST' | 'STEAL' | 'TURNOVER' | 'FOUL'
  ) => {
    commitScore(team, points, label, type, player);
  };

  const handleQuickAddPlayerSubmit = (team: 'home' | 'away') => {
    if (!quickPlayerName.trim()) return;
    const newP: Player = {
      id: `p-${Date.now()}`,
      name: quickPlayerName.trim(),
      number: quickPlayerNumber,
      position: quickPlayerPos,
      points: 0,
      kills: 0,
      aces: 0,
      blocks: 0,
      twoPointers: 0,
      threePointers: 0,
      freeThrows: 0,
    };
    onAddPlayerToMatchTeam?.(match.id, team, newP);
    setQuickAddTeam(null);
    setQuickPlayerName('');
    setQuickPlayerNumber(prev => prev + 1);
  };

  const handleConfirmSubstitution = (playerOut: Player, playerIn: Player) => {
    if (!subModalTeam || !match) return;
    const targetTeam = subModalTeam === 'home' ? match.homeTeam : match.awayTeam;
    const result = executeSubstitution(
      targetTeam,
      playerOut.id,
      playerIn,
      match.sport,
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );

    if (!result.success) {
      alert(result.error || 'Failed to execute substitution.');
      return;
    }

    arenaSounds.playWhistle();

    const newEvent: PlayEvent = {
      id: `e-sub-${Date.now()}`,
      matchId: match.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      period: isBasketball ? (match.basketballPeriod || 'Q3') : `Set ${currentSet}`,
      team: subModalTeam,
      type: 'SUB',
      description: result.eventDescription,
    };

    setPlayEvents(prev => [newEvent, ...prev]);

    if (onUpdateTeam) {
      onUpdateTeam(match.id, subModalTeam, result.updatedTeam, newEvent);
    }

    setSubModalTeam(null);
    setSubModalPlayerOutId(undefined);
  };

  // FIVB Rule 21: Referee Sanction Handlers
  const handleFIVBSanction = (team: 'home' | 'away', sanctionType: 'YELLOW' | 'RED') => {
    if (isScoringDisabled) return;
    arenaSounds.playWhistle();
    const teamName = team === 'home' ? match.homeTeam.name : match.awayTeam.name;

    if (sanctionType === 'YELLOW') {
      // Formal warning - no point penalty
      const newEvent: PlayEvent = {
        id: `e-sanction-${Date.now()}`,
        matchId: match.id,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        period: `Set ${currentSet}`,
        team,
        type: 'FOUL',
        description: `FIVB Rule 21.1: YELLOW CARD Formal Warning to ${teamName}`,
      };
      setPlayEvents(prev => [newEvent, ...prev]);
    } else {
      // RED CARD Penalty: Opponent is awarded +1 point and service!
      const receivingTeam = team === 'home' ? 'away' : 'home';
      onUpdateMatchScore(match.id, receivingTeam, 1, `FIVB Rule 21.3.1: RED CARD Penalty to ${teamName} (+1 point to opponent)`, 'FOUL');
      arenaSounds.playScoreDing();
      const newEvent: PlayEvent = {
        id: `e-sanction-${Date.now()}`,
        matchId: match.id,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        period: `Set ${currentSet}`,
        team: receivingTeam,
        type: 'FOUL',
        description: `FIVB Rule 21.3.1: RED CARD PENALTY against ${teamName}. +1 Point & Service to ${receivingTeam === 'home' ? match.homeTeam.name : match.awayTeam.name}.`,
        scoreChange: '+1',
      };
      setPlayEvents(prev => [newEvent, ...prev]);
    }
  };

  const handleUndoLastEvent = () => {
    if (playEvents.length === 0) return;
    const lastEvent = playEvents[0];
    if (lastEvent.scoreChange && (lastEvent.scoreChange === '+1' || lastEvent.scoreChange === '+2' || lastEvent.scoreChange === '+3')) {
      const ptsToDeduct = parseInt(lastEvent.scoreChange.replace('+', ''));
      onUpdateMatchScore(
        match.id, 
        lastEvent.team, 
        -ptsToDeduct, 
        'Referee Undo Correction', 
        'SCORE',
        lastEvent.playerId,
        lastEvent.playerName,
        lastEvent.playerNumber
      );
    }
    setPlayEvents(prev => prev.slice(1));
  };

  const handleCourtChange = (newMatchId: string) => {
    setCurrentMatchId(newMatchId);
    onSelectMatchId?.(newMatchId);
  };

  const filteredPlayEvents = playEvents.filter(evt => {
    if (playFilter === 'ALL') return true;
    if (playFilter === 'SCORE') return evt.type === 'SCORE' || evt.type === 'SPIKE' || evt.type === 'ACE' || evt.type === 'BLOCK';
    if (playFilter === 'FOUL') return evt.type === 'FOUL';
    if (playFilter === 'TIMEOUT') return evt.type === 'TIMEOUT';
    if (playFilter === 'SUB') return evt.type === 'SUB';
    return true;
  });

  const homePlayers = match?.homeTeam?.players || [];
  const homeMaxPoints = homePlayers.reduce((max, p) => Math.max(max, p.points || 0), 0);
  const awayPlayers = match?.awayTeam?.players || [];
  const awayMaxPoints = awayPlayers.reduce((max, p) => Math.max(max, p.points || 0), 0);

  if (!match) {
    return (
      <div className="space-y-6">
        <div className="glass-panel text-center py-20 p-8 rounded-3xl border border-white/10 max-w-xl mx-auto space-y-6 my-8">
          <div className="w-16 h-16 rounded-2xl bg-[#0284c7]/20 border border-[#0284c7]/40 flex items-center justify-center text-[#38bdf8] mx-auto shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-heading font-black text-3xl uppercase tracking-wider text-white">
              Tournament Schedule is Clean
            </h2>
            <p className="text-xs text-[#94a3b8] leading-relaxed max-w-md mx-auto">
              Preloaded mock matches and demo scores have been cleared. Create your first official match or load a clean 0-0 tournament template to begin.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onOpenRegisterTeam && (
              <button
                onClick={onOpenRegisterTeam}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg glow-blue transition-all flex items-center justify-center gap-1.5"
              >
                <Users className="w-4 h-4 text-cyan-200" />
                <span>+ Register New Team</span>
              </button>
            )}
            {onOpenCreateMatch && (
              <button
                onClick={onOpenCreateMatch}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg glow-blue transition-all"
              >
                + Create New Match
              </button>
            )}
            {onLoadTemplateSchedule && (
              <button
                onClick={onLoadTemplateSchedule}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 font-heading font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Load Clean 0-0 Template
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Navigation Breadcrumb Bar */}
      {onBackToSchedule && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToSchedule}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white border border-white/10 hover:border-[#38bdf8]/40 text-xs font-heading font-bold uppercase tracking-wider transition-all active:scale-95 group shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-[#38bdf8]" />
            <span>Back to Tournament Schedule</span>
          </button>
          
          <div className="flex items-center gap-2">
            {onOpenRegisterTeam && (
              <button
                onClick={onOpenRegisterTeam}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400 text-xs font-heading font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm"
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ Register Team</span>
              </button>
            )}
            {onNavigateToTeams && (
              <button
                onClick={onNavigateToTeams}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400 text-xs font-heading font-bold uppercase tracking-wider transition-all active:scale-95"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Edit Teams &amp; Rosters</span>
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#94a3b8]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider">Live Scorer Connected</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Console Status Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0284c7]/20 border border-[#0284c7]/40 flex items-center justify-center text-[#38bdf8]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-black text-xl tracking-wide uppercase text-white">
                Live Court Scoring &amp; Admin Center
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isFinal 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {isFinal ? 'MATCH OFFICIAL FINAL' : 'OFFICIAL SESSION ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-[#94a3b8]">
              Authorized Court Scorer Console · Sanctioned FIVB / VNL &amp; FIBA / NCAA Rules
            </p>
          </div>
        </div>

        {/* Console Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Audio Mute Toggle */}
          <button
            onClick={toggleSound}
            title={isSoundMuted ? 'Unmute Arena Audio' : 'Mute Arena Audio'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white border border-white/15 transition-colors"
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Printable Scoresheet Modal Trigger */}
          <button
            onClick={() => setIsScoresheetOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-[#38bdf8]" />
            Official Scoresheet
          </button>

          {/* Court Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Court:</label>
            <select
              value={currentMatchId}
              onChange={(e) => handleCourtChange(e.target.value)}
              className="bg-[#0b0e14] border border-white/15 text-white text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-[#38bdf8]"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.court} — {m.homeTeam.shortName} vs {m.awayTeam.shortName} ({m.sport.toUpperCase()}) {m.status === 'FINAL' ? '[FINAL]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Volleyball Format Selector */}
          {isVolleyball && onFormatChange && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#38bdf8]">Format:</label>
              <select
                value={format}
                onChange={(e) => onFormatChange(match.id, e.target.value as VolleyballMatchFormat)}
                className="bg-[#0284c7]/20 border border-[#0284c7]/40 text-[#38bdf8] text-xs font-bold rounded-xl px-3 py-2 outline-none"
              >
                <option value="best-of-5">Best of 5 Sets (Sets 1-4 to 25 · Set 5 to 15)</option>
                <option value="best-of-3">Best of 3 Sets (Sets 1-2 to 25 · Set 3 to 15)</option>
              </select>
            </div>
          )}

          {/* Register New Team */}
          {onOpenRegisterTeam && (
            <button
              onClick={onOpenRegisterTeam}
              title="Register a new championship team"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ Team</span>
            </button>
          )}

          {/* Add New Match */}
          {onOpenCreateMatch && (
            <button
              onClick={onOpenCreateMatch}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white text-xs font-bold uppercase tracking-wider shadow glow-blue transition-all"
            >
              <ListPlus className="w-3.5 h-3.5" />
              + Match
            </button>
          )}

          {/* Reset Match Button */}
          {onResetMatch && (
            <button
              onClick={() => onResetMatch(match.id)}
              title="Reset match score to start from 0-0"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white border border-white/15 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset (0-0)
            </button>
          )}

          {/* End Match Button */}
          {onEndMatch && match && !isFinal && (
            <button
              onClick={handleConfirmEndMatch}
              title="Conclude match: team with most set wins is declared winner and awarded +1 point"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border border-amber-400/40 text-xs font-bold uppercase tracking-wider shadow glow-amber transition-all active:scale-95"
            >
              <Flag className="w-3.5 h-3.5" />
              End Match
            </button>
          )}

          {/* Delete Current Match (Admin) */}
          {onDeleteMatch && match && (
            <button
              onClick={() => {
                if (window.confirm(`Delete match "${match.homeTeam.name} vs ${match.awayTeam.name}" (${match.court}) from tournament schedule?`)) {
                  onDeleteMatch(match.id);
                }
              }}
              title="Delete this match from tournament schedule"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Delete Match
            </button>
          )}

          {/* Clear Preloaded Data / Wipe All Matches */}
          {onClearAllData && (
            <button
              onClick={() => {
                if (window.confirm('Clear all preloaded tournament matches and reset the database?')) {
                  onClearAllData();
                }
              }}
              title="Clear all matches and wipe database"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Clear Data
            </button>
          )}

          {/* Rulebook Quick Access */}
          {onOpenRulebook && (
            <button
              onClick={onOpenRulebook}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Scale className="w-3.5 h-3.5 text-[#38bdf8]" />
              Official Rules
            </button>
          )}

          {/* Championship Rules Configuration */}
          {onOpenRulesEditor && (
            <button
              onClick={onOpenRulesEditor}
              title="Configure Championship Rules & Scoring Settings (Admin)"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              Rules
            </button>
          )}
        </div>
      </div>

      {/* 30-Second Timeout Countdown Banner */}
      {timeoutSeconds !== null && (
        <div className="p-4 rounded-2xl bg-amber-500/25 border-2 border-amber-400/60 shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/30 border border-amber-400 flex items-center justify-center text-amber-300">
              <Timer className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-300 block">
                OFFICIAL 30-SECOND TEAM TIMEOUT IN PROGRESS
              </span>
              <p className="text-xs text-white/90 font-medium">
                Teams consulting benches. Play resumes upon buzzer signal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="font-mono text-3xl sm:text-4xl font-black text-amber-300 tabular-nums">
              00:{timeoutSeconds.toString().padStart(2, '0')}
            </span>
            <button
              onClick={() => setTimeoutSeconds(null)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Resume Play
            </button>
          </div>
        </div>
      )}

      {/* Final Match Lock Notification Banner */}
      {isFinal && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-emerald-500/20 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-heading font-black text-lg text-white uppercase tracking-wide flex items-center gap-2">
                <span>OFFICIAL MATCH CONCLUDED — FINAL SCORE RECORDED</span>
              </div>
              <p className="text-xs text-[#94a3b8]">
                Winner: <strong className="text-white">
                  {isVolleyball
                    ? ((match.homeTeam.setsWon ?? 0) > (match.awayTeam.setsWon ?? 0)
                        ? match.homeTeam.name
                        : (match.awayTeam.setsWon ?? 0) > (match.homeTeam.setsWon ?? 0)
                        ? match.awayTeam.name
                        : (match.homeTeam.score >= match.awayTeam.score ? match.homeTeam.name : match.awayTeam.name))
                    : (match.homeTeam.score >= match.awayTeam.score
                        ? match.homeTeam.name
                        : match.awayTeam.name)}
                </strong>. Live scoring controls are locked to protect data integrity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isScoringUnlocked ? (
              <button
                onClick={() => setIsScoringUnlocked(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold uppercase tracking-wider transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                Re-Lock Scoring
              </button>
            ) : (
              <button
                onClick={() => setIsScoringUnlocked(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all"
              >
                <Unlock className="w-3.5 h-3.5" />
                Unlock for Official Correction
              </button>
            )}
          </div>
        </div>
      )}

      {/* Official VNL Rules Banner for Volleyball */}
      {isVolleyball && (
        <div className="bg-[#121824] p-3.5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#94a3b8]">
            <Info className="w-4 h-4 text-[#38bdf8] shrink-0" />
            <span>
              <strong className="text-white uppercase font-heading tracking-wide">FIVB / VNL Tournament Guidelines:</strong>{' '}
              {format === 'best-of-5' ? (
                <>Sets 1–4 are played to <strong>25 points</strong>. Deciding 5th set is played to <strong>15 points</strong>.</>
              ) : (
                <>Sets 1–2 are played to <strong>25 points</strong>. Deciding 3rd set is played to <strong>15 points</strong>.</>
              )}{' '}
              Must win by <strong>2 points</strong> (Deuce at 24-24 or 14-14; target advances e.g. 26, 27...).
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-heading font-black text-xs uppercase tracking-wider text-white">
              {isDeciding ? 'DECIDING TIEBREAK SET (TO 15)' : `SET ${currentSet} OF ${format === 'best-of-3' ? 3 : 5}`}
            </span>
          </div>
        </div>
      )}

      {/* FIVB Rule 18.2: Deciding Set Court Switch Alert */}
      {courtSwitchAlert && (
        <div className="p-3.5 rounded-2xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-2.5 text-xs text-white">
            <ArrowLeftRight className="w-4 h-4 text-[#38bdf8] shrink-0" />
            <span>
              <strong className="font-heading uppercase font-black text-[#38bdf8] tracking-wider">FIVB Rule 18.2 Court Switch:</strong>{' '}
              A team has reached 8 points in the deciding set. Teams change courts immediately without player rotation changes.
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-[#0284c7] text-white font-heading font-black text-xs uppercase tracking-wider shrink-0">
            SWITCH SIDES
          </span>
        </div>
      )}

      {/* Deuce / Set Point / Match Point Alert Strip */}
      {isVolleyball && (match.isDeuce || match.pointSpecialBadge) && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-300 ${
          match.isDeuce
            ? 'bg-[#ef4444]/20 border-[#ef4444]/50 shadow-lg glow-crimson animate-pulse'
            : match.pointSpecialBadge === 'MATCH POINT'
            ? 'bg-[#f97316]/20 border-[#f97316]/50 shadow-lg glow-orange'
            : 'bg-[#0284c7]/20 border-[#0284c7]/50 shadow-lg glow-blue'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center">
              {match.isDeuce ? <Flame className="w-4 h-4 text-[#ff5451]" /> : <Award className="w-4 h-4 text-white" />}
            </div>
            <div>
              <div className="font-heading font-black text-base uppercase tracking-wider text-white flex items-center gap-2">
                <span>{match.isDeuce ? 'DEUCE! WIN BY 2 POINTS REQUIRED' : match.pointSpecialBadge}</span>
                <span className="text-xs font-mono font-bold text-white/80">
                  · Target Score: {currentTarget} PTS
                </span>
              </div>
              <p className="text-xs text-white/70">
                {match.isDeuce
                  ? `Score is tied at ${match.homeTeam.score}-${match.awayTeam.score}. Next team must establish a 2-point margin to win this set.`
                  : `${match.homeTeam.score > match.awayTeam.score ? match.homeTeam.name : match.awayTeam.name} leads by 1 point at ${match.homeTeam.score}-${match.awayTeam.score}.`}
              </p>
            </div>
          </div>

          <div className="hidden sm:block font-heading font-black text-xl text-white uppercase tabular-nums">
            TARGET: {currentTarget}
          </div>
        </div>
      )}

      {/* Volleyball Set Won & Intermission Option Banner */}
      {isVolleyball && match.completedSetPendingAdvance !== undefined && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-[#0284c7]/25 via-[#38bdf8]/15 to-[#0284c7]/25 border-2 border-[#38bdf8]/60 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] flex items-center justify-center text-white shadow-xl text-2xl font-heading font-black shrink-0">
                🏆
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#38bdf8] bg-[#38bdf8]/20 px-2.5 py-0.5 rounded-full border border-[#38bdf8]/40">
                    FIVB OFFICIAL SET {match.completedSetPendingAdvance} COMPLETED
                  </span>
                  <span className="text-[10px] text-amber-300 font-bold uppercase flex items-center gap-1">
                    <span>⏱️</span> 3-Min Intermission
                  </span>
                </div>
                <h3 className="font-heading font-black text-2xl text-white uppercase mt-1">
                  Set {match.completedSetPendingAdvance} Won ({match.homeTeam.score} - {match.awayTeam.score})
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {!isFinal && onAdvanceVolleyballSet && (
                <button
                  onClick={() => onAdvanceVolleyballSet(match.id)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg glow-emerald flex items-center gap-2 transition-all active:scale-95"
                >
                  <span>Continue to Set {match.completedSetPendingAdvance + 1}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  setSetEditInitialNum(match.completedSetPendingAdvance || currentSet);
                  setIsVolleyballSetEditOpen(true);
                }}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs uppercase tracking-wider border border-white/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <span>✏️ Change Score / Continue Set {match.completedSetPendingAdvance}</span>
              </button>
              {!isFinal && onEndMatch && (
                <button
                  onClick={handleConfirmEndMatch}
                  className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-600/30 to-amber-500/20 hover:from-amber-600/50 hover:to-amber-500/30 text-amber-300 font-heading font-black text-xs uppercase tracking-wider border border-amber-500/40 flex items-center gap-2 transition-all active:scale-95 shadow-md"
                  title="Conclude match now. Team with most set wins is declared winner and awarded +1 point."
                >
                  <Flag className="w-4 h-4 text-amber-400" />
                  <span>End Match</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-[#94a3b8] pt-2 border-t border-white/10">
            <span>
              💡 If a challenge or referee correction overturned the call, click <strong>"Change Score / Continue Set"</strong> or press <strong>-1</strong> on the winning team to revert the set win and continue play immediately.
            </span>
          </div>
        </div>
      )}

      {/* Volleyball Dedicated Mid-Set Substitution Control Bar */}
      {isVolleyball && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0284c7]/15 via-emerald-500/10 to-[#0284c7]/15 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-xs uppercase text-emerald-400">
                  Volleyball Mid-Set Squad Substitution
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-white/10 text-white border border-white/15">
                  Set {currentSet}
                </span>
                <span className="text-[10px] font-mono text-emerald-300">
                  (Rule 15 · Max {maxSubsAllowed}/set)
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8]">
                Swap on-court starters with registered squad bench members at any dead-ball stoppage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
            <button
              disabled={isScoringDisabled || (match.homeTeam.substitutionsUsed || 0) >= maxSubsAllowed}
              onClick={() => {
                setSubModalPlayerOutId(undefined);
                setSubModalTeam('home');
              }}
              title={`Mid-set substitution for ${match.homeTeam.name}`}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white/10 hover:bg-emerald-500/20 text-white hover:text-emerald-300 text-xs font-heading font-bold uppercase border border-white/15 hover:border-emerald-500/40 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: match.homeTeam.logoColor }} />
              <span>Sub {match.homeTeam.shortName} ({match.homeTeam.substitutionsUsed || 0}/{maxSubsAllowed})</span>
            </button>

            <button
              disabled={isScoringDisabled || (match.awayTeam.substitutionsUsed || 0) >= maxSubsAllowed}
              onClick={() => {
                setSubModalPlayerOutId(undefined);
                setSubModalTeam('away');
              }}
              title={`Mid-set substitution for ${match.awayTeam.name}`}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white/10 hover:bg-emerald-500/20 text-white hover:text-emerald-300 text-xs font-heading font-bold uppercase border border-white/15 hover:border-emerald-500/40 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: match.awayTeam.logoColor }} />
              <span>Sub {match.awayTeam.shortName} ({match.awayTeam.substitutionsUsed || 0}/{maxSubsAllowed})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Digital Scoreboard Centerpiece */}
      <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden">
        
        {/* Subtle sport lighting glow */}
        <div 
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isBasketball ? 'bg-[#f97316]' : 'bg-[#0284c7]'
          }`} 
        />

        {/* Header Match info */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-white/10 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-sm uppercase tracking-wider text-white/70">
              {match.title}
            </span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-[#94a3b8]">{match.venue}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase border ${
              isFinal
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-[#ef4444]/20 text-[#ff5451] border-[#ef4444]/40 animate-pulse'
            }`}>
              <Radio className="w-3.5 h-3.5" />
              {match.statusDetail}
            </span>
            <span className="text-xs font-mono text-[#94a3b8]">
              COURT: {match.court.split(' - ')[0]}
            </span>
          </div>
        </div>

        {/* Live Score Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 items-center py-8">
          
          {/* Home Team Box (Left, 3 Cols) */}
          <div className="lg:col-span-3 bg-[#10131a]/80 p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-heading font-black text-2xl text-white shadow-xl border border-white/20 overflow-hidden relative shrink-0"
                  style={{ backgroundColor: match.homeTeam.logoColor }}
                >
                  {match.homeTeam.logoUrl ? (
                    <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-full h-full object-contain p-1.5 bg-black/40" />
                  ) : (
                    match.homeTeam.shortName
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#f97316] uppercase tracking-wider">HOME TEAM</span>
                    {homeBonus.isBonus && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase animate-pulse">
                        BONUS
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-black text-2xl text-white tracking-wide uppercase">
                    {match.homeTeam.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
                    <span>{match.homeTeam.record}</span>
                    {isBasketball && (
                      <>
                        <span>·</span>
                        <span>Fouls: <strong className="text-white">{match.homeTeam.fouls || 0}</strong></span>
                        <span>·</span>
                        <span>TO: <strong className="text-white">{match.homeTeam.timeoutsLeft ?? 4}</strong></span>
                        <span>·</span>
                        <span>Subs: <strong className="text-white">{match.homeTeam.substitutionsUsed || 0}</strong></span>
                      </>
                    )}
                    {isVolleyball && (
                      <>
                        <span>·</span>
                        <span>Subs: <strong className={(match.homeTeam.substitutionsUsed || 0) >= maxSubsAllowed ? 'text-rose-400 font-bold' : 'text-white'}>{match.homeTeam.substitutionsUsed || 0}/{maxSubsAllowed}</strong></span>
                        <span>·</span>
                        <span>TO: <strong className="text-white">{match.homeTeam.timeoutsLeft ?? 2}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-heading font-black text-6xl sm:text-7xl tabular-nums text-white drop-shadow-md">
                  {match.homeTeam.score}
                </span>
                {match.homeTeam.setsWon !== undefined && (
                  <span className="block text-xs font-bold text-[#38bdf8] uppercase mt-1">
                    Sets Won: <strong className="text-white text-base">{match.homeTeam.setsWon}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Increment Controls for Home */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2">
              {isBasketball ? (
                <>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('home', 1, 'Free Throw Made', 'SCORE')}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 text-white font-heading font-bold text-sm tracking-wider uppercase border border-white/10 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +1 FT
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('home', 2, '2-Point Field Goal', 'SCORE')}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#f97316]/20 hover:bg-[#f97316]/30 text-[#fb923c] font-heading font-bold text-sm tracking-wider uppercase border border-[#f97316]/40 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +2 FG
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('home', 3, '3-Pointer Drained', 'SCORE')}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white font-heading font-bold text-sm tracking-wider uppercase shadow-lg glow-orange transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +3 3PT
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('home', -1, 'Score Correction (-1)', 'SCORE')}
                    title="Undo 1 point"
                    className="py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold uppercase border border-rose-500/20 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    -1
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('home', 0, 'Team Foul Committed', 'FOUL')}
                    title="Record Foul"
                    className="py-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold uppercase border border-amber-500/20 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +Foul
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('home', 0, 'Assist Credited', 'ASSIST')}
                    title="Record Assist"
                    className="py-2 px-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold uppercase border border-purple-500/20 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +AST
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('home', 0, 'Rebound Secured', 'REBOUND')}
                    title="Record Rebound"
                    className="py-2 px-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-bold uppercase border border-teal-500/20 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +REB
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('home', 0, 'Charged Timeout', 'TIMEOUT')}
                    title="Call Timeout"
                    className="py-2 px-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-bold uppercase border border-sky-500/20 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    TO
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => {
                      setSubModalPlayerOutId(undefined);
                      setSubModalTeam('home');
                    }}
                    title={`Official Substitution (${match.homeTeam.substitutionsUsed || 0} used)`}
                    className="py-2 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/20 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Sub</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('home', 1, 'Rally Point Scored', 'SCORE')}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-heading font-bold text-sm tracking-wider uppercase shadow-lg glow-blue transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +1 Point
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('home', 1, 'Spike Kill Winner', 'SPIKE')}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 text-[#38bdf8] font-heading font-bold text-sm tracking-wider uppercase border border-[#38bdf8]/40 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Spike Kill
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('home', 1, 'Service Ace', 'ACE')}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-sm tracking-wider uppercase border border-white/15 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Ace
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('home', 1, 'Solo Block Kill', 'BLOCK')}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 text-white font-heading font-bold text-sm tracking-wider uppercase border border-white/10 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Block
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('home', 0, 'Charged 30s Timeout', 'TIMEOUT')}
                    title="Call 30s Timeout"
                    className="py-2 px-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-bold uppercase border border-sky-500/20 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    TO
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('home', -1, 'Score Correction (-1)', 'SCORE')}
                    title="Undo 1 point"
                    className="py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold uppercase border border-rose-500/20 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    -1
                  </button>
                  <button
                    disabled={isScoringDisabled || (match.homeTeam.substitutionsUsed || 0) >= maxSubsAllowed}
                    onClick={() => {
                      setSubModalPlayerOutId(undefined);
                      setSubModalTeam('home');
                    }}
                    title={`Official Substitution (${match.homeTeam.substitutionsUsed || 0}/${maxSubsAllowed} used)`}
                    className="py-2 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/20 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Sub ({match.homeTeam.substitutionsUsed || 0}/{maxSubsAllowed})</span>
                  </button>
                  {/* FIVB Sanctions Dropdown */}
                  <div className="flex items-center gap-1">
                    <button
                      disabled={isScoringDisabled}
                      onClick={() => handleFIVBSanction('home', 'YELLOW')}
                      title="FIVB Yellow Card (Formal Warning)"
                      className="py-2 px-2 rounded-xl bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 text-xs font-bold border border-yellow-400/40 disabled:opacity-30"
                    >
                      🟨
                    </button>
                    <button
                      disabled={isScoringDisabled}
                      onClick={() => handleFIVBSanction('home', 'RED')}
                      title="FIVB Red Card (Penalty Point to Opponent)"
                      className="py-2 px-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 disabled:opacity-30"
                    >
                      🟥
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Live Individual Player Scoreboard Table for Home */}
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5 text-[#f97316]" />
                  <span className="font-heading font-black text-[11px] uppercase tracking-wider text-white">
                    Player Box Score ({homePlayers.length})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={isScoringDisabled || (isVolleyball && (match.homeTeam.substitutionsUsed || 0) >= maxSubsAllowed)}
                    onClick={() => {
                      setSubModalPlayerOutId(undefined);
                      setSubModalTeam('home');
                    }}
                    className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1 border border-emerald-500/30 transition-colors disabled:opacity-30"
                    title="Make a player substitution"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Sub {isVolleyball ? `(${match.homeTeam.substitutionsUsed || 0}/${maxSubsAllowed})` : ''}</span>
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => setQuickAddTeam(quickAddTeam === 'home' ? null : 'home')}
                    className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase text-[#38bdf8] flex items-center gap-1 border border-white/10 transition-colors disabled:opacity-30"
                  >
                    <UserPlus className="w-3 h-3" />
                    {quickAddTeam === 'home' ? 'Cancel' : '+ Player'}
                  </button>
                  {onOpenTeamModal && (
                    <button
                      onClick={() => onOpenTeamModal(match.homeTeam, match.sport)}
                      className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase text-[#94a3b8] hover:text-white border border-white/10 transition-colors"
                    >
                      Roster
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Quick Add Form for Home */}
              {quickAddTeam === 'home' && (
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    handleQuickAddPlayerSubmit('home'); 
                  }} 
                  className="p-2.5 rounded-xl bg-black/50 border border-[#38bdf8]/40 space-y-2 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-white">
                    <span>Add Player to {match.homeTeam.name}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <input
                      type="text"
                      value={quickPlayerName}
                      onChange={(e) => setQuickPlayerName(e.target.value)}
                      placeholder="Player Name"
                      className="col-span-2 px-2 py-1 bg-[#121824] border border-white/15 rounded text-[11px] text-white outline-none focus:border-[#38bdf8]"
                      required
                    />
                    <input
                      type="number"
                      value={quickPlayerNumber}
                      onChange={(e) => setQuickPlayerNumber(Number(e.target.value))}
                      placeholder="#"
                      className="px-2 py-1 bg-[#121824] border border-white/15 rounded text-[11px] text-white outline-none focus:border-[#38bdf8]"
                      min={0}
                      max={99}
                      required
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 rounded bg-[#0284c7] hover:bg-[#38bdf8] text-white font-heading font-bold text-[10px] uppercase"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}

              {/* Player Scoreboard List */}
              {homePlayers.length > 0 ? (
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1 no-scrollbar">
                  {homePlayers.map((player) => {
                    const isLeader = homeMaxPoints > 0 && player.points === homeMaxPoints;
                    const isOnCourt = player.isOnCourt !== false;
                    const fouls = player.fouls || 0;
                    const isFouledOut = isBasketball && fouls >= 5;
                    const isFoulTrouble = isBasketball && fouls === 4;

                    return (
                      <div
                        key={player.id}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          isLeader
                            ? 'bg-[#f97316]/10 border-[#f97316]/40'
                            : 'bg-black/30 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.name} className="w-6 h-6 rounded-md object-cover border border-white/20 shrink-0" />
                          ) : (
                            <span 
                              className="w-6 h-6 rounded-md flex items-center justify-center font-mono font-black text-[10px] text-white shrink-0"
                              style={{ backgroundColor: match.homeTeam.logoColor }}
                            >
                              #{player.number}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-heading font-bold text-xs text-white truncate block">
                                {player.name}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                                isOnCourt
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-white/5 text-[#94a3b8] border border-white/10'
                              }`}>
                                {isOnCourt ? 'COURT' : 'BENCH'}
                              </span>
                              {isLeader && (
                                <span className="px-1 py-0.2 rounded text-[8px] font-black uppercase bg-[#f97316]/30 text-[#fb923c] border border-[#f97316]/40 shrink-0">
                                  ★ LEADER
                                </span>
                              )}
                              {isFouledOut && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 animate-pulse">
                                  🚨 5 PF (OUT)
                                </span>
                              )}
                              {isFoulTrouble && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                                  ⚠️ 4 PF
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-[#94a3b8] block truncate">
                              {isBasketball
                                ? `${player.twoPointers || 0} 2P · ${player.threePointers || 0} 3P · ${player.freeThrows || 0} FT · ${player.rebounds || 0} REB · ${player.assists || 0} AST${fouls > 0 && !isFouledOut && !isFoulTrouble ? ` · ${fouls} PF` : ''}`
                                : `${player.kills || 0} Kills · ${player.aces || 0} Aces · ${player.blocks || 0} Blk`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Individual Player Score Badge */}
                          <div className="text-right">
                            <span className="font-heading font-black text-base text-white tabular-nums">
                              {player.points}
                            </span>
                            <span className="text-[9px] font-bold text-[#94a3b8] ml-0.5">PTS</span>
                          </div>

                          {/* Direct Quick-Score Buttons for this player */}
                          <div className="flex items-center gap-0.5">
                            {isBasketball ? (
                              <>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('home', player, 1, `${player.name}: FT Made`, 'SCORE')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 hover:bg-white/15 text-[#e1e2eb] border border-white/10 disabled:opacity-30"
                                  title={`+1 Free Throw to ${player.name}`}
                                >
                                  +1
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('home', player, 2, `${player.name}: 2PT FG`, 'SCORE')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f97316]/20 hover:bg-[#f97316]/30 text-[#fb923c] border border-[#f97316]/40 disabled:opacity-30"
                                  title={`+2 FG to ${player.name}`}
                                >
                                  +2
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('home', player, 3, `${player.name}: 3-Pointer`, 'SCORE')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f97316] hover:bg-[#ea580c] text-white disabled:opacity-30 shadow"
                                  title={`+3 3PT to ${player.name}`}
                                >
                                  +3
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('home', player, 0, `${player.name}: Assist`, 'ASSIST')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 disabled:opacity-30"
                                  title={`Record Assist for ${player.name}`}
                                >
                                  +Ast
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('home', player, 0, `${player.name}: Rebound`, 'REBOUND')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 disabled:opacity-30"
                                  title={`Record Rebound for ${player.name}`}
                                >
                                  +Reb
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('home', player, 0, `${player.name}: Personal Foul`, 'FOUL')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 disabled:opacity-30"
                                  title={`Record Personal Foul on ${player.name}`}
                                >
                                  +Foul
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('home', player, 1, `${player.name}: Point`, 'SCORE')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 hover:bg-white/15 text-[#e1e2eb] border border-white/10 disabled:opacity-30"
                                  title={`+1 Point to ${player.name}`}
                                >
                                  +1
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('home', player, 1, `${player.name}: Spike Kill`, 'SPIKE')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 text-[#38bdf8] border border-[#38bdf8]/40 disabled:opacity-30"
                                  title={`Spike Kill by ${player.name}`}
                                >
                                  Spk
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('home', player, 1, `${player.name}: Ace`, 'ACE')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 disabled:opacity-30"
                                  title={`Service Ace by ${player.name}`}
                                >
                                  Ace
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('home', player, 1, `${player.name}: Block`, 'BLOCK')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 disabled:opacity-30"
                                  title={`Block Kill by ${player.name}`}
                                >
                                  Blk
                                </button>
                              </>
                            )}
                            <button
                              disabled={isScoringDisabled || (isVolleyball && (match.homeTeam.substitutionsUsed || 0) >= maxSubsAllowed)}
                              onClick={() => {
                                setSubModalPlayerOutId(player.id);
                                setSubModalTeam('home');
                              }}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 disabled:opacity-30"
                              title={`Substitute ${player.name}`}
                            >
                              <ArrowLeftRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-black/20 border border-dashed border-white/10 text-center">
                  <p className="text-[11px] text-[#94a3b8]">No players on roster yet. Click "+ Player" to add.</p>
                </div>
              )}
            </div>
          </div>

          {/* Central Telemetry (Center, 1 Col) */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center space-y-4 text-center">
            
            {/* Target Points Display */}
            <div className="w-full bg-[#0b0e14] p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] block mb-1">
                {isVolleyball ? 'SET TARGET' : 'PERIOD'}
              </span>
              <span className="font-heading text-3xl font-black tabular-nums text-white block">
                {isVolleyball ? currentTarget : (match.basketballPeriod || 'Q3')}
              </span>
              <span className="text-[10px] font-mono text-[#38bdf8] font-bold block mt-0.5">
                {isVolleyball ? (isDeciding ? 'TIEBREAK (15)' : 'STANDARD (25)') : (isFinal ? 'FINAL' : 'REGULATION')}
              </span>
            </div>

            {/* Basketball Game Clock */}
            {isBasketball && (
              <div className="w-full bg-[#0b0e14] p-3 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">
                    GAME CLOCK
                  </span>
                  <button
                    onClick={() => setIsGameClockRunning(!isGameClockRunning)}
                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-white"
                    title={isGameClockRunning ? 'Pause Game Clock' : 'Start Game Clock'}
                  >
                    {isGameClockRunning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                  </button>
                </div>
                <span className="font-mono text-2xl font-black tabular-nums text-white block">
                  {formatGameClock(gameClockSeconds)}
                </span>
                <div className="flex items-center gap-1 mt-1.5">
                  <button
                    onClick={() => setGameClockSeconds(prev => Math.min(600, prev + 15))}
                    className="flex-1 py-0.5 text-[9px] font-bold bg-white/5 hover:bg-white/15 rounded text-[#94a3b8]"
                  >
                    +15s
                  </button>
                  <button
                    onClick={() => setGameClockSeconds(prev => Math.max(0, prev - 15))}
                    className="flex-1 py-0.5 text-[9px] font-bold bg-white/5 hover:bg-white/15 rounded text-[#94a3b8]"
                  >
                    -15s
                  </button>
                </div>
              </div>
            )}

            {/* Basketball Period Advance Button */}
            {isBasketball && onAdvanceBasketballPeriod && !isFinal && (
              <button
                onClick={() => onAdvanceBasketballPeriod(match.id)}
                className="w-full py-2 px-2 rounded-xl bg-[#f97316]/20 hover:bg-[#f97316]/30 text-[#fb923c] border border-[#f97316]/40 text-[11px] font-heading font-black uppercase tracking-wider transition-all"
              >
                Advance Period ➔
              </button>
            )}

            {/* Quick End Match Button */}
            {!isFinal && onEndMatch && (
              <button
                onClick={handleConfirmEndMatch}
                className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/40 text-[11px] font-heading font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                title="Conclude match now. Team with most set wins is declared winner and awarded +1 point."
              >
                <Flag className="w-3 h-3 text-amber-400" />
                End Match
              </button>
            )}

            {/* Shot Clock (If Basketball) */}
            {isBasketball && (
              <div className="w-full bg-[#0b0e14] p-3 rounded-2xl border border-[#f97316]/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#fb923c]">
                    SHOT CLOCK
                  </span>
                  <button
                    onClick={() => setIsShotClockRunning(!isShotClockRunning)}
                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-white"
                    title={isShotClockRunning ? 'Pause Shot Clock' : 'Resume Shot Clock'}
                  >
                    {isShotClockRunning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                  </button>
                </div>
                <span className="font-mono text-3xl font-black tabular-nums text-[#f97316] block">
                  {shotClock}s
                </span>
                <div className="flex items-center gap-1 mt-2">
                  <button
                    onClick={() => setShotClock(24)}
                    className="flex-1 py-1 text-[10px] font-bold bg-white/5 hover:bg-white/15 rounded text-[#e1e2eb] transition-colors"
                    title="Full 24-Second Shot Clock Reset"
                  >
                    24s Reset
                  </button>
                  <button
                    onClick={() => setShotClock(14)}
                    className="flex-1 py-1 text-[10px] font-bold bg-[#f97316]/20 hover:bg-[#f97316]/30 text-[#fb923c] rounded border border-[#f97316]/40 transition-colors"
                    title="FIBA 14-Second Reset (Offensive Rebound / Defensive Foul)"
                  >
                    14s (Off Reb)
                  </button>
                </div>
              </div>
            )}

            <div className="text-xs font-heading font-bold text-[#94a3b8] uppercase">
              {isVolleyball ? `SET ${currentSet}` : (match.basketballPeriod || 'QUARTER 3')}
            </div>
          </div>

          {/* Away Team Box (Right, 3 Cols) */}
          <div className="lg:col-span-3 bg-[#10131a]/80 p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-heading font-black text-2xl text-white shadow-xl border border-white/20 overflow-hidden relative shrink-0"
                  style={{ backgroundColor: match.awayTeam.logoColor }}
                >
                  {match.awayTeam.logoUrl ? (
                    <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-full h-full object-contain p-1.5 bg-black/40" />
                  ) : (
                    match.awayTeam.shortName
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#38bdf8] uppercase tracking-wider">AWAY TEAM</span>
                    {awayBonus.isBonus && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase animate-pulse">
                        BONUS
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-black text-2xl text-white tracking-wide uppercase">
                    {match.awayTeam.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
                    <span>{match.awayTeam.record}</span>
                    {isBasketball && (
                      <>
                        <span>·</span>
                        <span>Fouls: <strong className="text-white">{match.awayTeam.fouls || 0}</strong></span>
                        <span>·</span>
                        <span>TO: <strong className="text-white">{match.awayTeam.timeoutsLeft ?? 4}</strong></span>
                        <span>·</span>
                        <span>Subs: <strong className="text-white">{match.awayTeam.substitutionsUsed || 0}</strong></span>
                      </>
                    )}
                    {isVolleyball && (
                      <>
                        <span>·</span>
                        <span>Subs: <strong className={(match.awayTeam.substitutionsUsed || 0) >= maxSubsAllowed ? 'text-rose-400 font-bold' : 'text-white'}>{match.awayTeam.substitutionsUsed || 0}/{maxSubsAllowed}</strong></span>
                        <span>·</span>
                        <span>TO: <strong className="text-white">{match.awayTeam.timeoutsLeft ?? 2}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-heading font-black text-6xl sm:text-7xl tabular-nums text-white drop-shadow-md">
                  {match.awayTeam.score}
                </span>
                {match.awayTeam.setsWon !== undefined && (
                  <span className="block text-xs font-bold text-[#38bdf8] uppercase mt-1">
                    Sets Won: <strong className="text-white text-base">{match.awayTeam.setsWon}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Increment Controls for Away */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2">
              {isBasketball ? (
                <>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('away', 1, 'Free Throw Made', 'SCORE')}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 text-white font-heading font-bold text-sm tracking-wider uppercase border border-white/10 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +1 FT
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('away', 2, '2-Point Field Goal', 'SCORE')}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#0284c7]/20 hover:bg-[#0284c7]/30 text-[#38bdf8] font-heading font-bold text-sm tracking-wider uppercase border border-[#0284c7]/40 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +2 FG
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('away', 3, '3-Pointer Drained', 'SCORE')}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-heading font-bold text-sm tracking-wider uppercase shadow-lg glow-blue transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +3 3PT
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('away', -1, 'Score Correction (-1)', 'SCORE')}
                    title="Undo 1 point"
                    className="py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold uppercase border border-rose-500/20 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    -1
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('away', 0, 'Team Foul Committed', 'FOUL')}
                    title="Record Foul"
                    className="py-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold uppercase border border-amber-500/20 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +Foul
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('away', 0, 'Assist Credited', 'ASSIST')}
                    title="Record Assist"
                    className="py-2 px-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold uppercase border border-purple-500/20 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +AST
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('away', 0, 'Rebound Secured', 'REBOUND')}
                    title="Record Rebound"
                    className="py-2 px-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-bold uppercase border border-teal-500/20 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +REB
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('away', 0, 'Charged Timeout', 'TIMEOUT')}
                    title="Call Timeout"
                    className="py-2 px-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-bold uppercase border border-sky-500/20 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    TO
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => {
                      setSubModalPlayerOutId(undefined);
                      setSubModalTeam('away');
                    }}
                    title={`Official Substitution (${match.awayTeam.substitutionsUsed || 0} used)`}
                    className="py-2 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/20 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Sub</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('away', 1, 'Rally Point Scored', 'SCORE')}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white font-heading font-bold text-sm tracking-wider uppercase shadow-lg glow-orange transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +1 Point
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('away', 1, 'Spike Kill Winner', 'SPIKE')}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#f97316]/20 hover:bg-[#f97316]/30 text-[#fb923c] font-heading font-bold text-sm tracking-wider uppercase border border-[#f97316]/40 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Spike Kill
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('away', 1, 'Service Ace', 'ACE')}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-sm tracking-wider uppercase border border-white/15 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Ace
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('away', 1, 'Solo Block Kill', 'BLOCK')}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 text-white font-heading font-bold text-sm tracking-wider uppercase border border-white/10 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Block
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('away', 0, 'Charged 30s Timeout', 'TIMEOUT')}
                    title="Call 30s Timeout"
                    className="py-2 px-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-bold uppercase border border-sky-500/20 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    TO
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => handleScore('away', -1, 'Score Correction (-1)', 'SCORE')}
                    title="Undo 1 point"
                    className="py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold uppercase border border-rose-500/20 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    -1
                  </button>
                  <button
                    disabled={isScoringDisabled || (match.awayTeam.substitutionsUsed || 0) >= maxSubsAllowed}
                    onClick={() => {
                      setSubModalPlayerOutId(undefined);
                      setSubModalTeam('away');
                    }}
                    title={`Official Substitution (${match.awayTeam.substitutionsUsed || 0}/${maxSubsAllowed} used)`}
                    className="py-2 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/20 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Sub ({match.awayTeam.substitutionsUsed || 0}/{maxSubsAllowed})</span>
                  </button>
                  {/* FIVB Sanctions Dropdown */}
                  <div className="flex items-center gap-1">
                    <button
                      disabled={isScoringDisabled}
                      onClick={() => handleFIVBSanction('away', 'YELLOW')}
                      title="FIVB Yellow Card (Formal Warning)"
                      className="py-2 px-2 rounded-xl bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 text-xs font-bold border border-yellow-400/40 disabled:opacity-30"
                    >
                      🟨
                    </button>
                    <button
                      disabled={isScoringDisabled}
                      onClick={() => handleFIVBSanction('away', 'RED')}
                      title="FIVB Red Card (Penalty Point to Opponent)"
                      className="py-2 px-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 disabled:opacity-30"
                    >
                      🟥
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Live Individual Player Scoreboard Table for Away */}
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span className="font-heading font-black text-[11px] uppercase tracking-wider text-white">
                    Player Box Score ({awayPlayers.length})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={isScoringDisabled || (isVolleyball && (match.awayTeam.substitutionsUsed || 0) >= maxSubsAllowed)}
                    onClick={() => {
                      setSubModalPlayerOutId(undefined);
                      setSubModalTeam('away');
                    }}
                    className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1 border border-emerald-500/30 transition-colors disabled:opacity-30"
                    title="Make a player substitution"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Sub {isVolleyball ? `(${match.awayTeam.substitutionsUsed || 0}/${maxSubsAllowed})` : ''}</span>
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => setQuickAddTeam(quickAddTeam === 'away' ? null : 'away')}
                    className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase text-[#38bdf8] flex items-center gap-1 border border-white/10 transition-colors disabled:opacity-30"
                  >
                    <UserPlus className="w-3 h-3" />
                    {quickAddTeam === 'away' ? 'Cancel' : '+ Player'}
                  </button>
                  {onOpenTeamModal && (
                    <button
                      onClick={() => onOpenTeamModal(match.awayTeam, match.sport)}
                      className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase text-[#94a3b8] hover:text-white border border-white/10 transition-colors"
                    >
                      Roster
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Quick Add Form for Away */}
              {quickAddTeam === 'away' && (
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    handleQuickAddPlayerSubmit('away'); 
                  }} 
                  className="p-2.5 rounded-xl bg-black/50 border border-[#38bdf8]/40 space-y-2 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-white">
                    <span>Add Player to {match.awayTeam.name}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <input
                      type="text"
                      value={quickPlayerName}
                      onChange={(e) => setQuickPlayerName(e.target.value)}
                      placeholder="Player Name"
                      className="col-span-2 px-2 py-1 bg-[#121824] border border-white/15 rounded text-[11px] text-white outline-none focus:border-[#38bdf8]"
                      required
                    />
                    <input
                      type="number"
                      value={quickPlayerNumber}
                      onChange={(e) => setQuickPlayerNumber(Number(e.target.value))}
                      placeholder="#"
                      className="px-2 py-1 bg-[#121824] border border-white/15 rounded text-[11px] text-white outline-none focus:border-[#38bdf8]"
                      min={0}
                      max={99}
                      required
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 rounded bg-[#0284c7] hover:bg-[#38bdf8] text-white font-heading font-bold text-[10px] uppercase"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}

              {/* Player Scoreboard List for Away */}
              {awayPlayers.length > 0 ? (
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1 no-scrollbar">
                  {awayPlayers.map((player) => {
                    const isLeader = awayMaxPoints > 0 && player.points === awayMaxPoints;
                    const isOnCourt = player.isOnCourt !== false;
                    const fouls = player.fouls || 0;
                    const isFouledOut = isBasketball && fouls >= 5;
                    const isFoulTrouble = isBasketball && fouls === 4;

                    return (
                      <div
                        key={player.id}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          isLeader
                            ? 'bg-[#0284c7]/10 border-[#38bdf8]/40'
                            : 'bg-black/30 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.name} className="w-6 h-6 rounded-md object-cover border border-white/20 shrink-0" />
                          ) : (
                            <span 
                              className="w-6 h-6 rounded-md flex items-center justify-center font-mono font-black text-[10px] text-white shrink-0"
                              style={{ backgroundColor: match.awayTeam.logoColor }}
                            >
                              #{player.number}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-heading font-bold text-xs text-white truncate block">
                                {player.name}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                                isOnCourt
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-white/5 text-[#94a3b8] border border-white/10'
                              }`}>
                                {isOnCourt ? 'COURT' : 'BENCH'}
                              </span>
                              {isLeader && (
                                <span className="px-1 py-0.2 rounded text-[8px] font-black uppercase bg-[#0284c7]/30 text-[#38bdf8] border border-[#0284c7]/40 shrink-0">
                                  ★ LEADER
                                </span>
                              )}
                              {isFouledOut && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 animate-pulse">
                                  🚨 5 PF (OUT)
                                </span>
                              )}
                              {isFoulTrouble && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                                  ⚠️ 4 PF
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-[#94a3b8] block truncate">
                              {isBasketball
                                ? `${player.twoPointers || 0} 2P · ${player.threePointers || 0} 3P · ${player.freeThrows || 0} FT · ${player.rebounds || 0} REB · ${player.assists || 0} AST${fouls > 0 && !isFouledOut && !isFoulTrouble ? ` · ${fouls} PF` : ''}`
                                : `${player.kills || 0} Kills · ${player.aces || 0} Aces · ${player.blocks || 0} Blk`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Individual Player Score Badge */}
                          <div className="text-right">
                            <span className="font-heading font-black text-base text-white tabular-nums">
                              {player.points}
                            </span>
                            <span className="text-[9px] font-bold text-[#94a3b8] ml-0.5">PTS</span>
                          </div>

                          {/* Direct Quick-Score Buttons for this player */}
                          <div className="flex items-center gap-0.5">
                            {isBasketball ? (
                              <>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('away', player, 1, `${player.name}: FT Made`, 'SCORE')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 hover:bg-white/15 text-[#e1e2eb] border border-white/10 disabled:opacity-30"
                                  title={`+1 Free Throw to ${player.name}`}
                                >
                                  +1
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('away', player, 2, `${player.name}: 2PT FG`, 'SCORE')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0284c7]/20 hover:bg-[#0284c7]/30 text-[#38bdf8] border border-[#0284c7]/40 disabled:opacity-30"
                                  title={`+2 FG to ${player.name}`}
                                >
                                  +2
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('away', player, 3, `${player.name}: 3-Pointer`, 'SCORE')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white disabled:opacity-30 shadow"
                                  title={`+3 3PT to ${player.name}`}
                                >
                                  +3
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('away', player, 0, `${player.name}: Assist`, 'ASSIST')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 disabled:opacity-30"
                                  title={`Record Assist for ${player.name}`}
                                >
                                  +Ast
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('away', player, 0, `${player.name}: Rebound`, 'REBOUND')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 disabled:opacity-30"
                                  title={`Record Rebound for ${player.name}`}
                                >
                                  +Reb
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('away', player, 0, `${player.name}: Personal Foul`, 'FOUL')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 disabled:opacity-30"
                                  title={`Record Personal Foul on ${player.name}`}
                                >
                                  +Foul
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('away', player, 1, `${player.name}: Point`, 'SCORE')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 hover:bg-white/15 text-[#e1e2eb] border border-white/10 disabled:opacity-30"
                                  title={`+1 Point to ${player.name}`}
                                >
                                  +1
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('away', player, 1, `${player.name}: Spike Kill`, 'SPIKE')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f97316]/20 hover:bg-[#f97316]/30 text-[#fb923c] border border-[#f97316]/40 disabled:opacity-30"
                                  title={`Spike Kill by ${player.name}`}
                                >
                                  Spk
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('away', player, 1, `${player.name}: Ace`, 'ACE')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 disabled:opacity-30"
                                  title={`Service Ace by ${player.name}`}
                                >
                                  Ace
                                </button>
                                <button
                                  disabled={isScoringDisabled}
                                  onClick={() => handleDirectPlayerScore('away', player, 1, `${player.name}: Block`, 'BLOCK')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 disabled:opacity-30"
                                  title={`Block Kill by ${player.name}`}
                                >
                                  Blk
                                </button>
                              </>
                            )}
                            <button
                              disabled={isScoringDisabled || (isVolleyball && (match.awayTeam.substitutionsUsed || 0) >= maxSubsAllowed)}
                              onClick={() => {
                                setSubModalPlayerOutId(player.id);
                                setSubModalTeam('away');
                              }}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 disabled:opacity-30"
                              title={`Substitute ${player.name}`}
                            >
                              <ArrowLeftRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-black/20 border border-dashed border-white/10 text-center">
                  <p className="text-[11px] text-[#94a3b8]">No players on roster yet. Click "+ Player" to add.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Set History Breakdown for Volleyball */}
        {isVolleyball && match.setScores && match.setScores.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-heading font-bold uppercase text-[#94a3b8]">
                Match Sets Progression ({match.volleyballFormat?.toUpperCase()}):
              </span>
              <span className="text-[11px] text-[#38bdf8] font-bold">
                {match.homeTeam.name} {match.homeTeam.setsWon ?? 0} - {match.awayTeam.setsWon ?? 0} {match.awayTeam.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              {match.setScores.map((s) => (
                <div
                  key={s.set}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center ${
                    s.isCompleted
                      ? 'bg-[#10131a] border-white/10 text-white'
                      : 'bg-[#0284c7]/20 border-[#0284c7]/50 text-[#38bdf8] shadow-sm animate-pulse'
                  }`}
                >
                  <span className="text-[10px] text-[#94a3b8] uppercase font-bold">
                    {s.isDecidingSet ? 'SET 5 (TIEBREAK)' : `SET ${s.set}`}
                  </span>
                  <span className="font-bold text-sm tabular-nums mt-0.5">
                    {s.homeScore} - {s.awayScore}
                  </span>
                  {s.isCompleted ? (
                    <span className="text-[9px] text-emerald-400 font-bold uppercase">
                      Won by {s.winner === 'home' ? match.homeTeam.shortName : match.awayTeam.shortName}
                    </span>
                  ) : (
                    <span className="text-[9px] text-[#38bdf8] font-bold uppercase">
                      Live (To {s.targetPoints})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSetEditInitialNum(s.set);
                      setIsVolleyballSetEditOpen(true);
                    }}
                    className="mt-1.5 px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[9px] font-heading font-bold uppercase tracking-wider border border-white/15 flex items-center gap-1 transition-all active:scale-95"
                    title={`Change score or continue from Set ${s.set}`}
                  >
                    <span>✏️ Change Score / Continue</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quarter Breakdown for Basketball */}
        {isBasketball && match.homeTeam.quarterScores && match.homeTeam.quarterScores.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-heading font-bold uppercase text-[#94a3b8]">
                Quarter By Quarter Scoring:
              </span>
              <span className="text-[11px] text-[#fb923c] font-bold">
                Total: {match.homeTeam.score} - {match.awayTeam.score}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-xs font-mono">
              {match.homeTeam.quarterScores.map((hq, idx) => {
                const aq = match.awayTeam.quarterScores?.[idx] ?? 0;
                const periodName = idx < 4 ? `Q${idx + 1}` : `OT${idx - 3}`;
                return (
                  <div key={idx} className="p-2 rounded-xl bg-[#10131a] border border-white/10 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-[#94a3b8] uppercase font-bold">{periodName}</span>
                    <span className="font-bold text-sm tabular-nums mt-0.5 text-white">{hq} - {aq}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Live Play-by-Play Event Logger */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-[#38bdf8]" />
            <h3 className="font-heading font-bold text-lg text-white uppercase">
              Official Play-by-Play Stream
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-[#0b0e14] p-1 rounded-xl border border-white/10 text-[10px] font-bold uppercase">
              {(['ALL', 'SCORE', 'FOUL', 'TIMEOUT', 'SUB'] as const).map(flt => (
                <button
                  key={flt}
                  onClick={() => setPlayFilter(flt)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    playFilter === flt
                      ? 'bg-white/15 text-white'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {flt}
                </button>
              ))}
            </div>

            {/* Undo Last Event */}
            <button
              onClick={handleUndoLastEvent}
              disabled={playEvents.length === 0 || isScoringDisabled}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase text-[#94a3b8] hover:text-rose-400 border border-white/10 disabled:opacity-30 transition-colors"
              title="Undo last registered play"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
          </div>
        </div>

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-2">
          {filteredPlayEvents.map((evt) => (
            <div
              key={evt.id}
              className="flex items-center justify-between bg-[#10131a] p-3 rounded-xl border border-white/5 text-xs text-[#e1e2eb]"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[#94a3b8]">{evt.timestamp}</span>
                <span className={`px-2 py-0.5 rounded font-heading font-bold uppercase text-[10px] ${
                  evt.type === 'SUB'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : evt.type === 'FOUL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : evt.type === 'TIMEOUT'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'bg-white/10 text-white'
                }`}>
                  {evt.type === 'SUB' ? '🔄 SUB' : evt.period}
                </span>
                <span className="font-medium text-white">{evt.description}</span>
              </div>
              {evt.scoreChange && (
                <span className="font-heading font-black text-sm text-[#38bdf8] tabular-nums">
                  {evt.scoreChange}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Official Sanctioned Printable Scoresheet Modal */}
      <OfficialScoresheetModal
        match={match}
        isOpen={isScoresheetOpen}
        onClose={() => setIsScoresheetOpen(false)}
      />

      {/* Official Player Substitution Modal */}
      {subModalTeam && (
        <SubstitutionModal
          isOpen={true}
          onClose={() => {
            setSubModalTeam(null);
            setSubModalPlayerOutId(undefined);
          }}
          team={subModalTeam}
          teamData={subModalTeam === 'home' ? match.homeTeam : match.awayTeam}
          sport={match.sport}
          currentPeriod={isBasketball ? (match.basketballPeriod || 'Q3') : `Set ${currentSet}`}
          initialPlayerOutId={subModalPlayerOutId}
          onConfirmSubstitution={handleConfirmSubstitution}
        />
      )}

      {/* Player Scorer Attribution Prompt Modal */}
      {pendingScore && (
        <PlayerScorerModal
          isOpen={isPlayerModalOpen}
          onClose={() => {
            setIsPlayerModalOpen(false);
            setPendingScore(null);
          }}
          team={pendingScore.team}
          teamName={pendingScore.team === 'home' ? match.homeTeam.name : match.awayTeam.name}
          teamColor={pendingScore.team === 'home' ? match.homeTeam.logoColor : match.awayTeam.logoColor}
          points={pendingScore.points}
          label={pendingScore.label}
          eventType={pendingScore.type}
          players={(pendingScore.team === 'home' ? match.homeTeam.players : match.awayTeam.players) || []}
          sport={match.sport}
          onSelectPlayer={handleSelectScorer}
          onQuickAddPlayer={handleQuickAddPlayerModal}
        />
      )}

      {/* Volleyball Set Score Editor & Continue Set Modal */}
      {isVolleyball && isVolleyballSetEditOpen && (
        <VolleyballSetEditModal
          isOpen={isVolleyballSetEditOpen}
          onClose={() => setIsVolleyballSetEditOpen(false)}
          match={match}
          initialSetNumber={setEditInitialNum}
          onApplyEdit={(matchId, setNumber, homeScore, awayScore, continueFromSet) => {
            if (onEditVolleyballSetScore) {
              onEditVolleyballSetScore(matchId, setNumber, homeScore, awayScore, continueFromSet);
            }
          }}
          onAdvanceSet={onAdvanceVolleyballSet}
          onOpenSubstitution={(team) => {
            setIsVolleyballSetEditOpen(false);
            setSubModalPlayerOutId(undefined);
            setSubModalTeam(team);
          }}
        />
      )}

    </div>
  );
};
