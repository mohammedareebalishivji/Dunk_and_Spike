import React from 'react';
import { Sport, Match } from '../types';
import { Flame, Zap, Play, Calendar, ShieldCheck, ChevronRight } from 'lucide-react';

interface HeroBannerProps {
  currentSport: Sport;
  featuredMatch?: Match;
  onOpenAdmin: () => void;
  onViewSchedule: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  currentSport,
  featuredMatch,
  onOpenAdmin,
  onViewSchedule,
}) => {
  const isBasketball = currentSport === 'basketball';

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0b0e14] my-6 shadow-2xl">
      {/* Dynamic Ambient Stadium Radial Glows */}
      <div 
        className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-30 transition-all duration-700 pointer-events-none ${
          isBasketball ? 'bg-[#f97316]' : 'bg-[#0284c7]'
        }`} 
      />
      <div 
        className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-25 transition-all duration-700 pointer-events-none ${
          isBasketball ? 'bg-[#ef4444]' : 'bg-[#38bdf8]'
        }`} 
      />

      {/* Atmospheric Court Floor Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 flex flex-col lg:flex-row items-center justify-between gap-10">
        
        {/* Left Content */}
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            {isBasketball ? (
              <span className="flex items-center gap-1.5 text-xs font-heading font-black tracking-wider uppercase text-[#f97316]">
                <Flame className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">NCAA DIVISION I BASKETBALL CHAMPIONSHIP</span>
                <span className="sm:hidden">NCAA BASKETBALL FINALS</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-heading font-black tracking-wider uppercase text-[#38bdf8]">
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AVCA NATIONAL COLLEGIATE VOLLEYBALL FINALS</span>
                <span className="sm:hidden">AVCA VOLLEYBALL FINALS</span>
              </span>
            )}
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-6xl lg:text-7xl tracking-tight leading-[0.95] uppercase text-white">
            {isBasketball ? (
              <>
                EXPLOSIVE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f97316] via-[#fb923c] to-[#ef4444]">DUNKS.</span><br />
                CHAMPIONSHIP HARDWOOD.
              </>
            ) : (
              <>
                THUNDEROUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#0284c7] to-[#93ccff]">SPIKES.</span><br />
                UNTOUCHABLE DEFENSE.
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-[#94a3b8] max-w-xl font-normal leading-relaxed">
            {isBasketball
              ? 'Real-time live shot-clock analytics, fast-break scoring telemetry, player box scores, and instant tournament bracket transitions.'
              : 'Precision set telemetry, spike velocity radars, rally hit percentages, block tallies, and live collegiate volleyball broadcasting.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onViewSchedule}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-heading text-base font-bold uppercase tracking-wider text-white shadow-xl transition-all duration-200 active:scale-95 ${
                isBasketball
                  ? 'bg-gradient-to-r from-[#f97316] to-[#ea580c] glow-orange hover:from-[#fb923c] hover:to-[#f97316]'
                  : 'bg-gradient-to-r from-[#0284c7] to-[#0369a1] glow-blue hover:from-[#38bdf8] hover:to-[#0284c7]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Explore Match Schedule
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-heading text-base font-bold uppercase tracking-wider bg-[#121824] hover:bg-[#1d2026] text-white border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
              Court Scorer Console
            </button>
          </div>
        </div>

        {/* Right Feature Card - Live Highlight / Quick Game Stat */}
        {featuredMatch && (
          <div 
            onClick={onOpenAdmin}
            className="w-full lg:w-96 glass-panel-elevated p-6 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden cursor-pointer hover:border-white/25 transition-all group"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-xs font-heading font-black tracking-widest uppercase text-[#94a3b8]">
                FEATURED ARENA MATCH
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#ef4444]/20 text-[#ff5451] border border-[#ef4444]/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                {featuredMatch.statusDetail}
              </span>
            </div>

            <div className="py-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-black text-lg text-white shadow-md overflow-hidden relative shrink-0"
                    style={{ backgroundColor: featuredMatch.homeTeam.logoColor }}
                  >
                    {featuredMatch.homeTeam.logoUrl ? (
                      <img src={featuredMatch.homeTeam.logoUrl} alt={featuredMatch.homeTeam.name} className="w-full h-full object-contain p-1 bg-black/40" />
                    ) : (
                      featuredMatch.homeTeam.shortName
                    )}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-white text-base leading-tight group-hover:text-[#38bdf8] transition-colors">
                      {featuredMatch.homeTeam.name}
                    </h4>
                    <span className="text-[11px] text-[#94a3b8]">
                      {featuredMatch.homeTeam.record} {featuredMatch.homeTeam.seed ? `· No. ${featuredMatch.homeTeam.seed} Seed` : ''}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-heading font-black text-3xl tabular-nums text-white">
                    {featuredMatch.homeTeam.score}
                  </span>
                  {featuredMatch.homeTeam.setsWon !== undefined && (
                    <span className="block text-[10px] font-bold text-[#38bdf8] uppercase">
                      Sets: {featuredMatch.homeTeam.setsWon}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-black text-lg text-white shadow-md overflow-hidden relative shrink-0"
                    style={{ backgroundColor: featuredMatch.awayTeam.logoColor }}
                  >
                    {featuredMatch.awayTeam.logoUrl ? (
                      <img src={featuredMatch.awayTeam.logoUrl} alt={featuredMatch.awayTeam.name} className="w-full h-full object-contain p-1 bg-black/40" />
                    ) : (
                      featuredMatch.awayTeam.shortName
                    )}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-white text-base leading-tight group-hover:text-[#38bdf8] transition-colors">
                      {featuredMatch.awayTeam.name}
                    </h4>
                    <span className="text-[11px] text-[#94a3b8]">
                      {featuredMatch.awayTeam.record} {featuredMatch.awayTeam.seed ? `· No. ${featuredMatch.awayTeam.seed} Seed` : ''}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-heading font-black text-3xl tabular-nums text-white">
                    {featuredMatch.awayTeam.score}
                  </span>
                  {featuredMatch.awayTeam.setsWon !== undefined && (
                    <span className="block text-[10px] font-bold text-[#38bdf8] uppercase">
                      Sets: {featuredMatch.awayTeam.setsWon}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#94a3b8]">
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <span className="text-white font-semibold">Venue:</span> {featuredMatch.venue}
              </span>
              <span className="font-mono text-[11px] text-[#38bdf8] font-bold shrink-0">
                {featuredMatch.sport === 'volleyball' 
                  ? (featuredMatch.isDeuce ? 'DEUCE (+2)' : `TARGET: ${featuredMatch.targetPoints || 25} PTS`)
                  : `SHOT CLK: ${featuredMatch.shotClock || 24}s`
                }
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
