import React, { useState, useEffect } from 'react';
import { Sport, Match } from '../types';
import { Flame, Zap, Calendar, ShieldCheck, ChevronRight, Timer, MapPin, Radio } from 'lucide-react';

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

  // Live dynamic tournament countdown clock
  const [countdown, setCountdown] = useState({
    days: 4,
    hours: 18,
    minutes: 32,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="relative w-full my-6 space-y-6">
      {/* Main Stitch Hero Container */}
      <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-[#131317] shadow-2xl">
        {/* Dynamic Vignette & Arena Spotlights Gradients from Stitch */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#131317] via-[#131317]/70 to-[#0e0e12]/85 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e12]/90 via-transparent to-[#0e0e12]/90 pointer-events-none" />
        
        {/* Ambient Neon Spotlights */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-[#1e6bff]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-[500px] h-[260px] bg-[#ff7a00]/15 rounded-full blur-[150px] pointer-events-none" />

        {/* Atmospheric Court Floor Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14 flex flex-col lg:flex-row items-center justify-between gap-10">
          
          {/* Left Column: Stitch Hero Content Architecture */}
          <div className="max-w-2xl flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
            
            {/* Top Athletic Meta Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1f1f23]/90 border border-white/10 backdrop-blur-md shadow-md">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff7a00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff7a00]"></span>
              </span>
              <span className="font-heading font-black text-xs text-[#ff7a00] tracking-widest uppercase">
                The Premier Inter-Collegiate Clash
              </span>
              <span className="text-white/30 text-xs">•</span>
              <span className="font-scoreboard text-xs text-[#38bdf8] font-bold">
                {isBasketball ? 'NCAA DIV-I SANCTIONED' : 'AVCA / FIVB COMPLIANT'}
              </span>
            </div>

            {/* Main Display Headline with Dual-Sport Gradient */}
            <div className="space-y-1">
              <h1 className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight uppercase leading-none bg-gradient-to-br from-[#1e6bff] via-[#93ccff] to-[#ff7a00] bg-clip-text text-transparent drop-shadow-2xl">
                DUNK &amp; SPIKE
              </h1>
              <div className="font-heading text-sm sm:text-base uppercase tracking-[0.25em] text-[#e0c0af] font-black">
                2026 Dual-Court Championship
              </div>
            </div>

            {/* Subtitle & Tagline */}
            <p className="font-heading text-base sm:text-lg font-bold text-white italic tracking-wide">
              “Where Legends Rise and Rivals Fall”
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm text-[#e0c0af]">
              <span className="flex items-center gap-1 text-[#ff7a00]">
                <Calendar className="w-4 h-4" />
                March 24–29, 2026
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1 text-[#38bdf8]">
                <MapPin className="w-4 h-4" />
                Metro Sports Arena &amp; Fieldhouse
              </span>
            </div>

            {/* Action Stadium Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={onViewSchedule}
                className="px-6 py-3.5 rounded-full bg-[#ff7a00] hover:bg-[#ea580c] text-white font-heading text-sm font-bold uppercase tracking-wider shadow-xl shadow-[#ff7a00]/25 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 group"
              >
                <span>Explore Matches</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenAdmin}
                className="px-6 py-3.5 rounded-full bg-[#1f1f23]/80 hover:bg-[#2a292e] text-[#38bdf8] border border-white/10 font-heading text-sm font-bold uppercase tracking-wider backdrop-blur-md shadow-lg active:scale-95 transition-all duration-200 flex items-center gap-2"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef4444] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ef4444]"></span>
                </span>
                <span>Court Scorer Console</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>

            {/* Live Glassmorphic Countdown Clock Pod from Stitch */}
            <div className="w-full max-w-lg glass-panel rounded-2xl p-4 shadow-2xl relative overflow-hidden mt-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-[#ff7a00] font-heading font-black">
                  <Timer className="w-4 h-4" /> Official Opening Jump
                </span>
                <span className="text-[#38bdf8] font-scoreboard font-bold">UTC-05:00 METRO EAST</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-[#0e0e12]/80 rounded-xl p-2.5 border border-white/5 flex flex-col justify-center">
                  <span className="font-scoreboard text-2xl sm:text-3xl text-white font-black tabular-nums">
                    {pad(countdown.days)}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-white/50 mt-0.5">Days</span>
                </div>
                <div className="bg-[#0e0e12]/80 rounded-xl p-2.5 border border-white/5 flex flex-col justify-center">
                  <span className="font-scoreboard text-2xl sm:text-3xl text-white font-black tabular-nums">
                    {pad(countdown.hours)}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-white/50 mt-0.5">Hours</span>
                </div>
                <div className="bg-[#0e0e12]/80 rounded-xl p-2.5 border border-white/5 flex flex-col justify-center">
                  <span className="font-scoreboard text-2xl sm:text-3xl text-[#ff7a00] font-black tabular-nums">
                    {pad(countdown.minutes)}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-white/50 mt-0.5">Minutes</span>
                </div>
                <div className="bg-[#0e0e12]/80 rounded-xl p-2.5 border border-white/5 flex flex-col justify-center">
                  <span className="font-scoreboard text-2xl sm:text-3xl text-[#38bdf8] font-black tabular-nums">
                    {pad(countdown.seconds)}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-white/50 mt-0.5">Seconds</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Featured Arena Match Card */}
          {featuredMatch && (
            <div 
              onClick={onOpenAdmin}
              className="w-full lg:w-96 glass-panel-elevated p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden cursor-pointer hover:border-white/30 transition-all group"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="text-xs font-heading font-black tracking-widest uppercase text-[#e0c0af] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#ff7a00]" />
                  FEATURED ARENA MATCH
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#e63946]/20 text-[#ff7576] border border-[#e63946]/40 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e63946]" />
                  {featuredMatch.statusDetail}
                </span>
              </div>

              <div className="py-5 space-y-4">
                {/* Home Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-heading font-black text-lg text-white shadow-md overflow-hidden relative shrink-0"
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
                      <span className="text-[11px] text-[#e0c0af]">
                        {featuredMatch.homeTeam.record} {featuredMatch.homeTeam.seed ? `· No. ${featuredMatch.homeTeam.seed} Seed` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-scoreboard font-black text-3xl tabular-nums text-white">
                      {featuredMatch.homeTeam.score}
                    </span>
                    {featuredMatch.homeTeam.setsWon !== undefined && (
                      <span className="block text-[10px] font-bold text-[#38bdf8] uppercase">
                        Sets: {featuredMatch.homeTeam.setsWon}
                      </span>
                    )}
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-heading font-black text-lg text-white shadow-md overflow-hidden relative shrink-0"
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
                      <span className="text-[11px] text-[#e0c0af]">
                        {featuredMatch.awayTeam.record} {featuredMatch.awayTeam.seed ? `· No. ${featuredMatch.awayTeam.seed} Seed` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-scoreboard font-black text-3xl tabular-nums text-white">
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

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#e0c0af]">
                <span className="flex items-center gap-1 truncate max-w-[200px]">
                  <span className="text-white font-semibold">Venue:</span> {featuredMatch.venue}
                </span>
                <span className="font-scoreboard text-[11px] text-[#38bdf8] font-bold shrink-0">
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

      {/* Athletic Numbers Milestone Counters Strip from Stitch */}
      <div className="w-full bg-[#0e0e12]/90 backdrop-blur-md py-4 px-6 rounded-2xl border border-white/5 shadow-xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
          
          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-baseline gap-1">
              <span className="font-scoreboard text-2xl sm:text-3xl text-[#ff7a00] font-black">32</span>
            </div>
            <span className="font-heading text-xs text-white uppercase font-bold tracking-wider">Elite Colleges</span>
            <span className="text-[10px] text-[#e0c0af]">Qualified Nationwide</span>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-baseline gap-1">
              <span className="font-scoreboard text-2xl sm:text-3xl text-[#38bdf8] font-black">48</span>
            </div>
            <span className="font-heading text-xs text-white uppercase font-bold tracking-wider">High-Octane Matches</span>
            <span className="text-[10px] text-[#e0c0af]">6 Double Sessions</span>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-baseline gap-1">
              <span className="font-scoreboard text-2xl sm:text-3xl text-white font-black">380+</span>
            </div>
            <span className="font-heading text-xs text-white uppercase font-bold tracking-wider">Student Athletes</span>
            <span className="text-[10px] text-[#e0c0af]">Dual Discipline Rosters</span>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-baseline gap-1">
              <span className="font-scoreboard text-2xl sm:text-3xl text-[#ff7576] font-black">2</span>
              <span className="font-heading text-xs text-[#ff7576] font-black">ARENAS</span>
            </div>
            <span className="font-heading text-xs text-white uppercase font-bold tracking-wider">Hoops &amp; Volleyball</span>
            <span className="text-[10px] text-[#e0c0af]">Simultaneous Telemetry</span>
          </div>

          <div className="col-span-2 sm:col-span-1 flex flex-col items-center sm:items-start bg-[#1f1f23]/60 p-2.5 rounded-xl border border-white/5">
            <div className="flex items-baseline gap-1">
              <span className="font-scoreboard text-2xl sm:text-3xl text-[#ffdbc8] font-black">$30K</span>
            </div>
            <span className="font-heading text-xs text-[#ff7a00] uppercase font-bold tracking-wider">Combined Prize Pool</span>
            <span className="text-[10px] text-[#e0c0af]">Plus NIL MVP Endorsements</span>
          </div>

        </div>
      </div>
    </div>
  );
};
