import React, { useState } from 'react';
import { Match, Sport } from '../types';
import { 
  Radio, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Tv, 
  Zap, 
  Award, 
  Trash2, 
  Flame, 
  Video, 
  VideoOff, 
  Activity, 
  X, 
  Users, 
  Trophy 
} from 'lucide-react';
import { calculateMomentumRun, getEmbedStreamUrl } from '../utils/momentumTracker';

interface MatchCardProps {
  match: Match;
  onOpenScorer: (match: Match) => void;
  isAdminLoggedIn?: boolean;
  onDeleteMatch?: (matchId: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onOpenScorer,
  isAdminLoggedIn,
  onDeleteMatch,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showStream, setShowStream] = useState(false);
  const [isFanCenterOpen, setIsFanCenterOpen] = useState(false);

  const isLive = match.status === 'LIVE';
  const isBasketball = match.sport === 'basketball';
  const isHomeLeading = match.homeTeam.score > match.awayTeam.score;
  const isAwayLeading = match.awayTeam.score > match.homeTeam.score;

  const isVolleyball = match.sport === 'volleyball';
  const isDeuce = match.isDeuce;
  const specialBadge = match.pointSpecialBadge;
  const targetPoints = match.targetPoints || (
    isVolleyball && match.currentSetNumber === (match.volleyballFormat === 'best-of-3' ? 3 : 5) ? 15 : 25
  );

  const momentum = calculateMomentumRun(match);
  const streamInfo = getEmbedStreamUrl(match.streamUrl);

  return (
    <div className="group glass-panel hover:glass-panel-elevated rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300 shadow-xl flex flex-col justify-between relative overflow-hidden">
      
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold uppercase tracking-wider text-[#94a3b8]">
            {match.division}
          </span>
          <span className="text-white/20">·</span>
          <span className="text-[#94a3b8] flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {match.court}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Livestream Toggle */}
          {streamInfo.type !== 'none' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowStream(!showStream);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-black uppercase tracking-wider transition-all active:scale-95 ${
                showStream
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              }`}
            >
              {showStream ? <VideoOff className="w-3 h-3" /> : <Video className="w-3 h-3 text-rose-400 animate-pulse" />}
              <span>{showStream ? 'Hide Stream' : 'Live Stream'}</span>
            </button>
          )}

          {/* Volleyball Format Badge */}
          {isVolleyball && match.volleyballFormat && (
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/30">
              {match.volleyballFormat === 'best-of-3' ? 'VNL BO3 (TO 2)' : 'VNL BO5 (TO 3)'}
            </span>
          )}

          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#ef4444]/20 text-[#ff5451] border border-[#ef4444]/40 animate-pulse">
              <Radio className="w-3 h-3" />
              {match.statusDetail}
            </span>
          ) : match.status === 'UPCOMING' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/30">
              <Clock className="w-3 h-3" />
              {match.statusDetail}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 text-[#94a3b8]">
              {match.statusDetail}
            </span>
          )}
        </div>
      </div>

      {/* Embedded Live Video Player */}
      {showStream && streamInfo.embedUrl && (
        <div className="mt-3 rounded-2xl overflow-hidden border border-white/20 aspect-video shadow-2xl bg-black animate-in fade-in">
          <iframe
            src={streamInfo.embedUrl}
            title={`${match.title} Live Stream`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}

      {/* Momentum Scoring Run Badge */}
      {momentum && isLive && (
        <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-orange-500/40 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-1.5 font-heading font-black text-orange-400 uppercase tracking-wider text-[11px]">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-bounce" />
            <span>{momentum.label}</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-orange-300/80">MOMENTUM RUN</span>
        </div>
      )}

      {/* Special Telemetry Bar for Volleyball (Deuce / Set Point / Match Point) */}
      {isVolleyball && isLive && (
        <div className="mt-3 py-1.5 px-3 rounded-xl bg-[#0b0e14]/90 border border-white/10 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 font-heading font-black tracking-wider uppercase">
            {isDeuce ? (
              <span className="px-2 py-0.5 rounded bg-[#ef4444]/20 text-[#ff5451] border border-[#ef4444]/40 flex items-center gap-1 animate-pulse">
                <Zap className="w-3 h-3" />
                DEUCE · WIN BY 2
              </span>
            ) : specialBadge ? (
              <span className="px-2 py-0.5 rounded bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/40 flex items-center gap-1">
                <Award className="w-3 h-3" />
                {specialBadge}
              </span>
            ) : (
              <span className="text-[#38bdf8]">
                SET {match.currentSetNumber} IN PROGRESS
              </span>
            )}
          </div>
          <span className="font-mono text-[10px] font-bold text-[#94a3b8]">
            TARGET: <span className="text-white font-black">{targetPoints} PTS</span>
          </span>
        </div>
      )}

      {/* Main Scoreboard Body */}
      <div className="py-4 space-y-4">
        
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-heading font-black text-lg text-white shadow-md border border-white/20 relative overflow-hidden shrink-0"
              style={{ backgroundColor: match.homeTeam.logoColor }}
            >
              {match.homeTeam.seed && (
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[#0b0e14] text-[9px] font-bold text-[#94a3b8] flex items-center justify-center border border-white/10 z-10">
                  {match.homeTeam.seed}
                </span>
              )}
              {match.homeTeam.logoUrl ? (
                <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-full h-full object-contain p-1 bg-black/40" />
              ) : (
                match.homeTeam.shortName
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-heading text-lg font-bold tracking-wide uppercase ${isHomeLeading ? 'text-white' : 'text-[#e1e2eb]'}`}>
                  {match.homeTeam.name}
                </h3>
                {match.possession === 'home' && isLive && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/40">
                    POSS
                  </span>
                )}
              </div>
              <span className="text-xs text-[#94a3b8]">{match.homeTeam.record}</span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`font-heading font-black text-4xl tabular-nums leading-none tracking-tight ${
                isHomeLeading && isLive
                  ? isBasketball ? 'text-[#f97316] drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]' : 'text-[#38bdf8] drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]'
                  : 'text-white'
              }`}
            >
              {match.homeTeam.score}
            </span>
            {match.homeTeam.setsWon !== undefined && (
              <span className="block text-[11px] font-bold text-[#38bdf8] uppercase mt-0.5">
                Sets Won: <span className="text-white font-black">{match.homeTeam.setsWon}</span>
              </span>
            )}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-heading font-black text-lg text-white shadow-md border border-white/20 relative overflow-hidden shrink-0"
              style={{ backgroundColor: match.awayTeam.logoColor }}
            >
              {match.awayTeam.seed && (
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[#0b0e14] text-[9px] font-bold text-[#94a3b8] flex items-center justify-center border border-white/10 z-10">
                  {match.awayTeam.seed}
                </span>
              )}
              {match.awayTeam.logoUrl ? (
                <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-full h-full object-contain p-1 bg-black/40" />
              ) : (
                match.awayTeam.shortName
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-heading text-lg font-bold tracking-wide uppercase ${isAwayLeading ? 'text-white' : 'text-[#e1e2eb]'}`}>
                  {match.awayTeam.name}
                </h3>
                {match.possession === 'away' && isLive && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/40">
                    POSS
                  </span>
                )}
              </div>
              <span className="text-xs text-[#94a3b8]">{match.awayTeam.record}</span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`font-heading font-black text-4xl tabular-nums leading-none tracking-tight ${
                isAwayLeading && isLive
                  ? isBasketball ? 'text-[#f97316] drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]' : 'text-[#38bdf8] drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]'
                  : 'text-white'
              }`}
            >
              {match.awayTeam.score}
            </span>
            {match.awayTeam.setsWon !== undefined && (
              <span className="block text-[11px] font-bold text-[#38bdf8] uppercase mt-0.5">
                Sets Won: <span className="text-white font-black">{match.awayTeam.setsWon}</span>
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Volleyball Set History Pills */}
      {isVolleyball && match.setScores && match.setScores.length > 0 && (
        <div className="pt-2 pb-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono">
            <span className="text-[#94a3b8] uppercase font-bold text-[9px]">SETS:</span>
            {match.setScores.map((s) => (
              <span
                key={s.set}
                className={`px-1.5 py-0.5 rounded ${
                  s.isCompleted
                    ? 'bg-white/10 text-white font-semibold'
                    : 'bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/40 font-black animate-pulse'
                }`}
              >
                S{s.set}: {s.homeScore}-{s.awayScore}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Basketball Quarter Breakdown Pills */}
      {isBasketball && match.homeTeam.quarterScores && match.homeTeam.quarterScores.length > 0 && (
        <div className="pt-2 pb-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono">
            <span className="text-[#94a3b8] uppercase font-bold text-[9px]">QUARTERS:</span>
            {match.homeTeam.quarterScores.map((hq, idx) => {
              const aq = match.awayTeam.quarterScores?.[idx] ?? 0;
              const periodName = idx < 4 ? `Q${idx + 1}` : `OT${idx - 3}`;
              return (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded bg-white/10 text-white font-semibold"
                >
                  {periodName}: {hq}-{aq}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Info & Quick Actions */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs text-[#94a3b8]">
        <div className="flex items-center gap-2 truncate">
          {match.broadcast && (
            <span className="flex items-center gap-1 text-[11px] text-[#94a3b8]">
              <Tv className="w-3 h-3 text-[#38bdf8]" />
              {match.broadcast}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Admin Delete Action with Inline Safe Confirmation */}
          {isAdminLoggedIn && onDeleteMatch && (
            isConfirmingDelete ? (
              <div className="flex items-center gap-1.5 p-0.5 px-1.5 rounded-lg bg-rose-950/90 border border-rose-500/40 shadow-md animate-in fade-in zoom-in-95 duration-150">
                <span className="text-[10px] text-rose-200 font-black uppercase tracking-wider">
                  Delete?
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMatch(match.id);
                    setIsConfirmingDelete(false);
                  }}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase shadow tracking-wider transition-all active:scale-95"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConfirmingDelete(false);
                  }}
                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[#94a3b8] hover:text-white text-[10px] font-semibold uppercase transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmingDelete(true);
                }}
                title="Admin: Delete scheduled match"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )
          )}

          <button
            onClick={() => setIsFanCenterOpen(true)}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-cyan-300 hover:text-white transition-colors py-1 px-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 active:scale-95 border border-cyan-500/25"
            title="Open Fan Live Match Center"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fan Center</span>
          </button>

          <button
            onClick={() => onOpenScorer(match)}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-white hover:text-[#38bdf8] transition-colors py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#38bdf8]" />
            Scorer Console
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Interactive Fan Match Center Modal */}
      {isFanCenterOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsFanCenterOpen(false)}
        >
          <div 
            className="bg-[#10131a] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-heading font-black text-white uppercase tracking-wider">
                      Fan Live Match Center
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {match.sport.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8] flex items-center gap-2 mt-0.5">
                    <span>{match.division}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {match.court} ({match.venue})</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFanCenterOpen(false)}
                className="text-white/50 hover:text-white p-1 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Video Embed if stream configured */}
            {streamInfo.embedUrl && (
              <div className="rounded-2xl overflow-hidden border border-white/20 aspect-video shadow-2xl bg-black">
                <iframe
                  src={streamInfo.embedUrl}
                  title={`${match.title} Fan Stream`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            )}

            {/* Momentum Alert */}
            {momentum && isLive && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-orange-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-heading font-black text-orange-400 uppercase tracking-wider">
                  <Flame className="w-5 h-5 text-orange-400 fill-orange-400 animate-bounce" />
                  <span>HOT MOMENTUM: {momentum.label}</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-orange-500/30 text-orange-200 font-mono text-xs font-bold">
                  {momentum.points} Consecutive Unanswered Pts
                </span>
              </div>
            )}

            {/* Scoreboard Overview Card */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
              {/* Home Team */}
              <div className="flex-1 flex flex-col items-center text-center space-y-2">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-heading font-black text-2xl text-white shadow-lg border border-white/20"
                  style={{ backgroundColor: match.homeTeam.logoColor }}
                >
                  {match.homeTeam.logoUrl ? (
                    <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    match.homeTeam.shortName
                  )}
                </div>
                <div>
                  <h4 className="font-heading font-black text-lg text-white tracking-wide">{match.homeTeam.name}</h4>
                  <span className="text-xs text-[#94a3b8] font-mono">Seed #{match.homeTeam.seed || 1} • {match.homeTeam.record}</span>
                </div>
              </div>

              {/* Big Score Display */}
              <div className="flex flex-col items-center px-4">
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#38bdf8] mb-1">
                  {match.statusDetail}
                </span>
                <div className="flex items-center gap-4 text-4xl sm:text-5xl font-heading font-black text-white tabular-nums tracking-wider">
                  <span className={isHomeLeading ? 'text-cyan-400' : 'text-white'}>
                    {isVolleyball ? (match.homeTeam.setsWon ?? 0) : match.homeTeam.score}
                  </span>
                  <span className="text-white/30 text-3xl font-light">-</span>
                  <span className={isAwayLeading ? 'text-amber-400' : 'text-white'}>
                    {isVolleyball ? (match.awayTeam.setsWon ?? 0) : match.awayTeam.score}
                  </span>
                </div>
                {isVolleyball && (
                  <span className="text-[11px] font-mono text-white/50 mt-1">
                    Current Set Score: {match.homeTeam.score} - {match.awayTeam.score}
                  </span>
                )}
              </div>

              {/* Away Team */}
              <div className="flex-1 flex flex-col items-center text-center space-y-2">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-heading font-black text-2xl text-white shadow-lg border border-white/20"
                  style={{ backgroundColor: match.awayTeam.logoColor }}
                >
                  {match.awayTeam.logoUrl ? (
                    <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    match.awayTeam.shortName
                  )}
                </div>
                <div>
                  <h4 className="font-heading font-black text-lg text-white tracking-wide">{match.awayTeam.name}</h4>
                  <span className="text-xs text-[#94a3b8] font-mono">Seed #{match.awayTeam.seed || 2} • {match.awayTeam.record}</span>
                </div>
              </div>
            </div>

            {/* Team Roster Lineups */}
            <div className="space-y-4">
              <h4 className="font-heading font-black text-sm uppercase text-white tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Athlete Lineups &amp; Individual Statistics
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Home Roster */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="font-heading font-bold text-xs uppercase text-cyan-300">
                      {match.homeTeam.name} Roster
                    </span>
                    <span className="text-[10px] font-mono text-white/40">
                      {match.homeTeam.players?.length || 0} Athletes
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(match.homeTeam.players || []).map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-1.5 rounded-xl bg-[#0b0e14] text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                            #{p.number}
                          </span>
                          <span className="text-white font-medium truncate">{p.name}</span>
                          <span className="text-[10px] text-white/40">{p.position}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-mono px-1 rounded ${p.isOnCourt ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                            {p.isOnCourt ? 'ON COURT' : 'BENCH'}
                          </span>
                          <span className="font-mono font-bold text-white text-xs">
                            {p.points || 0} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Away Roster */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="font-heading font-bold text-xs uppercase text-amber-300">
                      {match.awayTeam.name} Roster
                    </span>
                    <span className="text-[10px] font-mono text-white/40">
                      {match.awayTeam.players?.length || 0} Athletes
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(match.awayTeam.players || []).map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-1.5 rounded-xl bg-[#0b0e14] text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                            #{p.number}
                          </span>
                          <span className="text-white font-medium truncate">{p.name}</span>
                          <span className="text-[10px] text-white/40">{p.position}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-mono px-1 rounded ${p.isOnCourt ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                            {p.isOnCourt ? 'ON COURT' : 'BENCH'}
                          </span>
                          <span className="font-mono font-bold text-white text-xs">
                            {p.points || 0} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-xs text-[#94a3b8]">
                Broadcast on <strong className="text-white">{match.broadcast || 'Arena Jumbotron'}</strong>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFanCenterOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-heading font-bold text-xs uppercase transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFanCenterOpen(false);
                    onOpenScorer(match);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-heading font-black text-xs uppercase tracking-wider transition-all shadow active:scale-95 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Scorer Console</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
