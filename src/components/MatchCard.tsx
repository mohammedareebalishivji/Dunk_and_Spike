import React, { useState } from 'react';
import { Match, Sport } from '../types';
import { Radio, ArrowRight, ShieldCheck, Clock, MapPin, Tv, Zap, Award, Trash2 } from 'lucide-react';

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
            onClick={() => onOpenScorer(match)}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-white hover:text-[#38bdf8] transition-colors py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#38bdf8]" />
            Scorer Console
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

    </div>
  );
};
