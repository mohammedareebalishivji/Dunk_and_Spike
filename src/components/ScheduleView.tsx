import React, { useState } from 'react';
import { Match, Sport } from '../types';
import { MatchCard } from './MatchCard';
import { Calendar, Plus, ShieldCheck, ChevronLeft, ChevronRight, Activity, Flame, Zap, Trophy, Timer, Radio, Search, RotateCcw } from 'lucide-react';

interface ScheduleViewProps {
  matches: Match[];
  currentSport: Sport;
  onOpenScorer: (match: Match) => void;
  onOpenCreateMatch?: () => void;
  onLoadTemplateSchedule?: () => void;
  isAdminLoggedIn?: boolean;
  onDeleteMatch?: (matchId: string) => void;
  onEditMatch?: (match: Match) => void;
  onSportChange?: (sport: Sport) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  matches,
  currentSport,
  onOpenScorer,
  onOpenCreateMatch,
  onLoadTemplateSchedule,
  isAdminLoggedIn,
  onDeleteMatch,
  onEditMatch,
  onSportChange,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'FINAL'>('ALL');
  const [selectedDay, setSelectedDay] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'FINALS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const sportMatches = matches.filter((m) => m.sport === currentSport);

  const filteredMatches = sportMatches.filter((m) => {
    if (selectedStatus !== 'ALL' && m.status !== selectedStatus) return false;

    if (selectedDay === 'TODAY') {
      const isToday = m.status === 'LIVE' || 
        m.statusDetail.toUpperCase().includes('TODAY') || 
        m.statusDetail.toUpperCase().includes('SET') || 
        m.statusDetail.toUpperCase().includes('Q');
      if (!isToday) return false;
    } else if (selectedDay === 'TOMORROW') {
      const isTomorrow = m.statusDetail.toUpperCase().includes('TOMORROW') || 
        (m.status === 'UPCOMING' && !m.title.toUpperCase().includes('FINAL'));
      if (!isTomorrow) return false;
    } else if (selectedDay === 'FINALS') {
      const isFinal = m.title.toUpperCase().includes('FINAL') || 
        m.title.toUpperCase().includes('CHAMPIONSHIP');
      if (!isFinal) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchText = `${m.title} ${m.homeTeam.name} ${m.homeTeam.shortName} ${m.awayTeam.name} ${m.awayTeam.shortName} ${m.court} ${m.division}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

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
      {/* 1. STITCH LIVE & UPCOMING MATCHES HORIZONTAL SCHEDULE STRIP (ISOLATED)    */}
      {/* ========================================================================= */}
      {sportMatches.length > 0 && (
        <section className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-heading font-black text-xs uppercase tracking-wider mb-1">
                <Activity className={`w-3.5 h-3.5 ${currentSport === 'basketball' ? 'text-[#ff7a00]' : 'text-[#38bdf8]'}`} />
                <span className={currentSport === 'basketball' ? 'text-[#ff7a00]' : 'text-[#38bdf8]'}>
                  NMIMS HYDERABAD • {currentSport === 'basketball' ? 'COURT 1' : 'COURT 2'}
                </span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase text-white tracking-wide">
                {currentSport === 'basketball' ? 'Basketball Schedule' : 'Volleyball Schedule'}
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
            {sportMatches.map((m) => {
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
                      {m.venue || 'NMIMS Hyderabad (NMIMS HYD)'}
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
      {/* 2. DEDICATED SPORT SHOWCASE & DISCIPLINE RULES (ISOLATED SCREENS)         */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. DEDICATED SPORT SHOWCASE STRIP (ISOLATED SCREENS)                      */}
      {/* ========================================================================= */}
      <section className="w-full">
        {currentSport === 'basketball' ? (
          <div className="glass-panel-elevated rounded-2xl p-4 sm:p-5 shadow-lg border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#ff7a00]/20 flex items-center justify-center text-[#ff7a00] shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-base sm:text-lg font-bold uppercase text-white">
                    Hardwood Basketball Championship
                  </h3>
                  <span className="text-[10px] font-scoreboard text-[#ff7a00] font-black px-2 py-0.5 rounded-full bg-[#ff7a00]/15 border border-[#ff7a00]/30">
                    Court 1 • NMIMS HYD
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#e0c0af] mt-0.5">
                  <span>16 Teams</span>
                  <span className="text-white/20">•</span>
                  <span>4 Pools → Knockouts</span>
                  <span className="text-white/20">•</span>
                  <span>24s Shot Clock</span>
                  <span className="text-white/20">•</span>
                  <span className="text-[#ff7a00]">FIBA / NCAA Sanctioned</span>
                </div>
              </div>
            </div>

            {onSportChange && (
              <button
                type="button"
                onClick={() => onSportChange('volleyball')}
                className="self-start md:self-auto px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#38bdf8] hover:text-white border border-[#38bdf8]/30 text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Switch to Volleyball Screen</span>
              </button>
            )}
          </div>
        ) : (
          <div className="glass-panel-elevated rounded-2xl p-4 sm:p-5 shadow-lg border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#1e6bff]/20 flex items-center justify-center text-[#38bdf8] shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-base sm:text-lg font-bold uppercase text-white">
                    High-Altitude Spike Championship
                  </h3>
                  <span className="text-[10px] font-scoreboard text-[#38bdf8] font-black px-2 py-0.5 rounded-full bg-[#1e6bff]/15 border border-[#1e6bff]/30">
                    Court 2 • NMIMS HYD
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#e0c0af] mt-0.5">
                  <span>16 Teams</span>
                  <span className="text-white/20">•</span>
                  <span>Pool Stage &amp; Finals</span>
                  <span className="text-white/20">•</span>
                  <span>Best of 5 Sets</span>
                  <span className="text-white/20">•</span>
                  <span className="text-[#38bdf8]">FIVB / VNL Compliant</span>
                </div>
              </div>
            </div>

            {onSportChange && (
              <button
                type="button"
                onClick={() => onSportChange('basketball')}
                className="self-start md:self-auto px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#ff7a00] hover:text-white border border-[#ff7a00]/30 text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Switch to Basketball Screen</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. SCHEDULE SUBHEADER & FILTER ROW                                        */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
            {/* Search & Quick Lookup */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${currentSport} matches...`}
                className="w-full pl-9 pr-7 py-1.5 bg-[#0e0e12] border border-white/10 rounded-full text-xs text-white placeholder-white/40 focus:border-[#38bdf8] outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Day Selector Pills */}
            <div className="flex items-center gap-1 bg-[#0e0e12] p-1 rounded-full border border-white/10 overflow-x-auto no-scrollbar">
              {(['ALL', 'TODAY', 'TOMORROW', 'FINALS'] as const).map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedDay === day
                      ? 'bg-white/20 text-white shadow'
                      : 'text-[#e0c0af] hover:text-white'
                  }`}
                >
                  {day === 'ALL' ? 'All Days' : day === 'TODAY' ? 'Today' : day === 'TOMORROW' ? 'Tomorrow' : 'Finals'}
                </button>
              ))}
            </div>
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
                      ? currentSport === 'basketball'
                        ? 'bg-[#ff7a00] text-white shadow-md'
                        : 'bg-[#0284c7] text-white shadow-md'
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
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 ${
                  currentSport === 'basketball'
                    ? 'bg-[#ff7a00] hover:bg-[#ea580c] shadow-[#ff7a00]/25'
                    : 'bg-[#0284c7] hover:bg-[#0369a1] shadow-[#0284c7]/25'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Schedule Match
              </button>
            )}
          </div>

        </div>

        {/* Active Filter Status & Match Counter */}
        <div className="flex items-center justify-between text-xs text-[#94a3b8] px-1">
          <span className="font-medium">
            Showing <span className="font-bold text-white">{filteredMatches.length}</span> of <span className="font-bold text-white">{sportMatches.length}</span> {currentSport} games at NMIMS Hyderabad
          </span>
          {(selectedStatus !== 'ALL' || selectedDay !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatus('ALL');
                setSelectedDay('ALL');
                setSearchQuery('');
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-[#ff7a00] hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
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
              onEditMatch={onEditMatch}
            />
          ))}
        </div>
      ) : matches.length === 0 || sportMatches.length === 0 ? (
        <div className="glass-panel text-center py-16 px-6 rounded-3xl border border-white/10 space-y-5 max-w-xl mx-auto">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-lg ${
            currentSport === 'basketball'
              ? 'bg-[#ff7a00]/20 border border-[#ff7a00]/40 text-[#ff7a00]'
              : 'bg-[#0284c7]/20 border border-[#0284c7]/40 text-[#38bdf8]'
          }`}>
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading text-2xl font-black text-white uppercase tracking-wider">
              {currentSport === 'basketball' ? 'Basketball Schedule is Clean' : 'Volleyball Schedule is Clean'}
            </h3>
            <p className="text-xs text-[#e0c0af] max-w-md mx-auto leading-relaxed">
              No {currentSport} matches scheduled at NMIMS Hyderabad. Add real matches or initialize with a clean template.
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
        <div className="glass-panel text-center py-14 px-4 rounded-2xl border border-white/10 space-y-3">
          <Calendar className="w-8 h-8 text-[#94a3b8] mx-auto opacity-50" />
          <p className="text-sm font-heading font-bold uppercase text-white tracking-wider">
            No {currentSport} matches found matching your filters
          </p>
          <p className="text-xs text-[#94a3b8]">
            Try adjusting your status filter, day selection, or search query.
          </p>
          <div>
            <button
              onClick={() => {
                setSelectedStatus('ALL');
                setSelectedDay('ALL');
                setSearchQuery('');
              }}
              className={`mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-heading font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md ${
                currentSport === 'basketball'
                  ? 'bg-[#ff7a00] hover:bg-[#ea580c]'
                  : 'bg-[#0284c7] hover:bg-[#0369a1]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Show All {currentSport} Games</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
