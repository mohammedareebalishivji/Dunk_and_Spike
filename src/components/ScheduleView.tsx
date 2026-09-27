import React, { useState } from 'react';
import { Match, Sport } from '../types';
import { MatchCard } from './MatchCard';
import { Calendar, Plus, ShieldCheck, ChevronLeft, ChevronRight, Activity, Flame, Zap, Trophy, Timer, Radio } from 'lucide-react';

interface ScheduleViewProps {
  matches: Match[];
  currentSport: Sport;
  onOpenScorer: (match: Match) => void;
  onOpenCreateMatch?: () => void;
  onLoadTemplateSchedule?: () => void;
  isAdminLoggedIn?: boolean;
  onDeleteMatch?: (matchId: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  matches,
  currentSport,
  onOpenScorer,
  onOpenCreateMatch,
  onLoadTemplateSchedule,
  isAdminLoggedIn,
  onDeleteMatch,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'FINAL'>('ALL');
  const [selectedDay, setSelectedDay] = useState<'TODAY' | 'TOMORROW' | 'FINALS'>('TODAY');

  const sportMatches = matches.filter((m) => m.sport === currentSport);

  const filteredMatches = sportMatches.filter((m) => {
    if (selectedStatus !== 'ALL' && m.status !== selectedStatus) return false;
    return true;
  });

  const scrollMatchStrip = (direction: 'left' | 'right') => {
    const el = document.getElementById('stitch-match-strip');
    if (el) {
      el.scrollBy({ left: direction === 'left' ? -360 : 360, behavior: 'smooth' });
    }
  };

  return (
    <div id="schedule-section" className="space-y-10">
      
      {/* ========================================================================= */}
      {/* 1. STITCH LIVE & UPCOMING MATCHES HORIZONTAL SCHEDULE STRIP               */}
      {/* ========================================================================= */}
      {matches.length > 0 && (
        <section className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[#ff7a00] font-heading font-black text-xs uppercase tracking-widest mb-1">
                <Activity className="w-4 h-4" />
                <span>Dynamic Court Telemetry</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase text-white tracking-wide">
                Events &amp; Matches Up Next
              </h2>
            </div>
            
            {/* Scroll Navigation Arrows */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button 
                type="button"
                onClick={() => scrollMatchStrip('left')}
                aria-label="Scroll Matches Left" 
                className="w-9 h-9 rounded-full bg-[#1f1f23] hover:bg-[#2a292e] text-white flex items-center justify-center transition-all shadow-md active:scale-95 border border-white/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={() => scrollMatchStrip('right')}
                aria-label="Scroll Matches Right" 
                className="w-9 h-9 rounded-full bg-[#1f1f23] hover:bg-[#2a292e] text-white flex items-center justify-center transition-all shadow-md active:scale-95 border border-white/10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Carousel */}
          <div 
            id="stitch-match-strip"
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory scroll-smooth"
          >
            {matches.map((m) => {
              const isLive = m.status === 'LIVE';
              const isBasketball = m.sport === 'basketball';

              return (
                <div
                  key={`carousel-${m.id}`}
                  onClick={() => onOpenScorer(m)}
                  className="snap-start shrink-0 w-80 sm:w-96 glass-panel-elevated rounded-2xl p-4 shadow-xl flex flex-col justify-between group hover:border-[#ff7a00]/40 transition-all duration-300 cursor-pointer border border-white/10 relative overflow-hidden"
                >
                  <div>
                    {/* Top status bar */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-heading text-[10px] uppercase font-bold tracking-wider ${
                        isLive 
                          ? 'bg-[#e63946]/20 text-[#ff7576] border border-[#e63946]/40'
                          : 'bg-[#0e0e12] text-[#e0c0af] border border-white/5'
                      }`}>
                        {isLive && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e63946] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e63946]"></span>
                          </span>
                        )}
                        {m.statusDetail}
                      </span>
                      <span className={`font-scoreboard text-[11px] font-bold ${
                        isBasketball ? 'text-[#ff7a00]' : 'text-[#38bdf8]'
                      }`}>
                        {m.court || (isBasketball ? 'COURT 1 (HOOPS)' : 'COURT 2 (VOLLEY)')}
                      </span>
                    </div>

                    {/* Team Matchup */}
                    <div className="space-y-3">
                      {/* Home Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center font-heading text-xs font-black text-white shadow-sm overflow-hidden"
                            style={{ backgroundColor: m.homeTeam.logoColor }}
                          >
                            {m.homeTeam.shortName}
                          </div>
                          <div>
                            <h4 className="font-heading text-sm font-bold text-white leading-tight group-hover:text-[#38bdf8] transition-colors truncate max-w-[150px]">
                              {m.homeTeam.name}
                            </h4>
                            <span className="text-[10px] text-[#e0c0af] block">
                              {m.homeTeam.record || 'Tournament Pool'}
                            </span>
                          </div>
                        </div>
                        <span className="font-scoreboard text-xl font-bold text-white">
                          {m.homeTeam.score}
                        </span>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center font-heading text-xs font-black text-white shadow-sm overflow-hidden"
                            style={{ backgroundColor: m.awayTeam.logoColor }}
                          >
                            {m.awayTeam.shortName}
                          </div>
                          <div>
                            <h4 className="font-heading text-sm font-bold text-white leading-tight group-hover:text-[#38bdf8] transition-colors truncate max-w-[150px]">
                              {m.awayTeam.name}
                            </h4>
                            <span className="text-[10px] text-[#e0c0af] block">
                              {m.awayTeam.record || 'Tournament Pool'}
                            </span>
                          </div>
                        </div>
                        <span className="font-scoreboard text-xl font-bold text-white/60">
                          {m.awayTeam.score}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Telemetry Footer */}
                  <div className="mt-3 pt-2 bg-[#0e0e12]/60 rounded-xl p-2 flex items-center justify-between text-[11px] font-scoreboard border border-white/5">
                    <span className="text-[#e0c0af] truncate max-w-[180px]">
                      {m.venue || 'Metro Center'}
                    </span>
                    <span className="text-[#38bdf8] font-bold">
                      {isBasketball 
                        ? `SHOT CLK: ${m.shotClock || 24}s` 
                        : (m.isDeuce ? 'DEUCE (+2)' : `TARGET: ${m.targetPoints || 25}`)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. DUAL SPORTS SPLIT SHOWCASE CARDS (STITCH LAYOUT)                       */}
      {/* ========================================================================= */}
      <section className="w-full space-y-4">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <span className="font-heading font-black text-xs text-[#ff7a00] uppercase tracking-[0.2em]">
            Two Disciplines • One Crown
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase text-white">
            The Tournament Breakdown
          </h2>
          <p className="text-xs sm:text-sm text-[#e0c0af] leading-relaxed">
            Dunk &amp; Spike unites collegiate basketball powerhouses and premier volleyball programs into an electrifying six-day tournament hosted simultaneously under one roof.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BASKETBALL SHOWCASE CARD */}
          <div className="relative glass-panel-elevated rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden group hover:border-[#ff7a00]/40 transition-all duration-300 border border-white/10">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ff7a00] via-[#fb923c] to-[#ffb68b]"></div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#ff7a00]/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#ff7a00]/20 flex items-center justify-center text-[#ff7a00] shadow-sm">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-heading font-black text-[10px] text-[#ff7a00] uppercase tracking-widest block">
                    Discipline 01
                  </span>
                  <h3 className="font-heading text-xl font-bold uppercase text-white">
                    Hardwood Slam
                  </h3>
                </div>
              </div>
              <span className="font-scoreboard text-sm text-[#ff7a00] font-black">
                16 TEAMS
              </span>
            </div>

            <p className="text-xs text-[#e0c0af] mb-4 leading-relaxed">
              Full-court collegiate regulation basketball governed by high-octane 4-Pool group stages advancing into sudden-death Elite Eight single elimination showdowns.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4 bg-[#0e0e12]/60 p-3.5 rounded-2xl border border-white/5">
              <div>
                <span className="text-[10px] uppercase font-bold text-white/50 block mb-0.5">Tournament Format</span>
                <span className="text-xs font-semibold text-white">4 Pools → Elite 8 Knockouts</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-white/50 block mb-0.5">Grand Championship</span>
                <span className="text-xs font-semibold text-[#ff7a00]">$15,000 + Gold Trophy</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-white/50 block mb-0.5">Feature Award</span>
                <span className="text-xs font-semibold text-white">MVP Dunk Contest Honor</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-white/50 block mb-0.5">Shot Clock &amp; Tempo</span>
                <span className="text-xs font-semibold text-white">24 Sec Pro Clock Rules</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2 text-[#e0c0af]">
                <span className="w-2 h-2 rounded-full bg-[#ff7a00]"></span>
                <span className="font-scoreboard">Court 1 Arena Center</span>
              </div>
              <span className="text-[#ff7a00] font-heading font-black uppercase tracking-wider text-xs">
                FIBA / NCAA Sanctioned
              </span>
            </div>
          </div>

          {/* VOLLEYBALL SHOWCASE CARD */}
          <div className="relative glass-panel-elevated rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden group hover:border-[#1e6bff]/40 transition-all duration-300 border border-white/10">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1e6bff] via-[#38bdf8] to-[#b3c5ff]"></div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#1e6bff]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1e6bff]/20 flex items-center justify-center text-[#38bdf8] shadow-sm">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-heading font-black text-[10px] text-[#38bdf8] uppercase tracking-widest block">
                    Discipline 02
                  </span>
                  <h3 className="font-heading text-xl font-bold uppercase text-white">
                    High-Altitude Spike
                  </h3>
                </div>
              </div>
              <span className="font-scoreboard text-sm text-[#38bdf8] font-black">
                16 TEAMS
              </span>
            </div>

            <p className="text-xs text-[#e0c0af] mb-4 leading-relaxed">
              Official FIVB &amp; VNL international rally scoring with mandatory win-by-2 deuce mechanics, setter rotation tracking, and deciding 15-point 5th set tiebreakers.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4 bg-[#0e0e12]/60 p-3.5 rounded-2xl border border-white/5">
              <div>
                <span className="text-[10px] uppercase font-bold text-white/50 block mb-0.5">Scoring Engine</span>
                <span className="text-xs font-semibold text-white">VNL Win-by-2 Deuce Rules</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-white/50 block mb-0.5">Grand Championship</span>
                <span className="text-xs font-semibold text-[#38bdf8]">$15,000 + Gold Trophy</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-white/50 block mb-0.5">Telemetry Radar</span>
                <span className="text-xs font-semibold text-white">Spike Speed &amp; Hit %</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-white/50 block mb-0.5">Match Format</span>
                <span className="text-xs font-semibold text-white">Best of 5 Sets (Decider to 15)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2 text-[#e0c0af]">
                <span className="w-2 h-2 rounded-full bg-[#1e6bff]"></span>
                <span className="font-scoreboard">Court 2 Arena West</span>
              </div>
              <span className="text-[#38bdf8] font-heading font-black uppercase tracking-wider text-xs">
                FIVB / AVCA Compliant
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SCHEDULE SUBHEADER & FILTER ROW                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
        
        {/* Day Selector Pills */}
        <div className="flex items-center gap-1.5 bg-[#0e0e12] p-1 rounded-full border border-white/10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedDay('TODAY')}
            className={`px-4 py-1.5 rounded-full text-xs font-heading font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedDay === 'TODAY'
                ? 'bg-white/20 text-white shadow'
                : 'text-[#e0c0af] hover:text-white'
            }`}
          >
            Today · Matchday 1
          </button>
          <button
            onClick={() => setSelectedDay('TOMORROW')}
            className={`px-4 py-1.5 rounded-full text-xs font-heading font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedDay === 'TOMORROW'
                ? 'bg-white/20 text-white shadow'
                : 'text-[#e0c0af] hover:text-white'
            }`}
          >
            Tomorrow · Semifinals
          </button>
          <button
            onClick={() => setSelectedDay('FINALS')}
            className={`px-4 py-1.5 rounded-full text-xs font-heading font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedDay === 'FINALS'
                ? 'bg-white/20 text-white shadow'
                : 'text-[#e0c0af] hover:text-white'
            }`}
          >
            Championship Sunday
          </button>
        </div>

        {/* Right Actions: Filters & Add Match */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-[#0e0e12] p-1 rounded-full border border-white/10">
            {(['ALL', 'LIVE', 'UPCOMING', 'FINAL'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                  selectedStatus === status
                    ? 'bg-[#ff7a00] text-white shadow-md'
                    : 'text-[#e0c0af] hover:text-white'
                }`}
              >
                {status === 'ALL' ? 'All Games' : status}
              </button>
            ))}
          </div>

          {/* Schedule Match Button */}
          {onOpenCreateMatch && (
            <button
              onClick={onOpenCreateMatch}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#ff7a00] hover:bg-[#ea580c] text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md shadow-[#ff7a00]/25 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule Match
            </button>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. MATCHES GRID                                                           */}
      {/* ========================================================================= */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              onOpenScorer={onOpenScorer}
              isAdminLoggedIn={isAdminLoggedIn}
              onDeleteMatch={onDeleteMatch}
            />
          ))}
        </div>
      ) : matches.length === 0 || sportMatches.length === 0 ? (
        <div className="glass-panel text-center py-16 px-6 rounded-3xl border border-white/10 space-y-5 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#ff7a00]/20 border border-[#ff7a00]/40 flex items-center justify-center text-[#ff7a00] mx-auto shadow-lg">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading text-2xl font-black text-white uppercase tracking-wider">
              Tournament Schedule is Clean
            </h3>
            <p className="text-xs text-[#e0c0af] max-w-md mx-auto leading-relaxed">
              Preloaded mock data has been cleared. Add real matches to the schedule or initialize with a clean 0-0 template.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onOpenCreateMatch && (
              <button
                onClick={onOpenCreateMatch}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#ff7a00] hover:bg-[#ea580c] text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg shadow-[#ff7a00]/25 transition-all"
              >
                + Schedule First Match
              </button>
            )}
            {onLoadTemplateSchedule && (
              <button
                onClick={onLoadTemplateSchedule}
                className="w-full sm:w-auto px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-heading font-bold text-xs uppercase tracking-wider border border-white/10 transition-all"
              >
                Load Official Template
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-panel text-center py-14 px-4 rounded-2xl border border-white/10">
          <Calendar className="w-8 h-8 text-[#94a3b8] mx-auto mb-2 opacity-50" />
          <p className="text-sm font-heading font-bold uppercase text-white tracking-wider">
            No matches found for filter: {selectedStatus}
          </p>
          <button
            onClick={() => setSelectedStatus('ALL')}
            className="mt-3 text-xs text-[#ff7a00] font-bold uppercase hover:underline"
          >
            Show All Games
          </button>
        </div>
      )}

    </div>
  );
};
