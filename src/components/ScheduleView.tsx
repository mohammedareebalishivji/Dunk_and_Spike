import React, { useState } from 'react';
import { Match, Sport } from '../types';
import { MatchCard } from './MatchCard';
import { Calendar, Plus, Sparkles, ShieldCheck } from 'lucide-react';

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

  return (
    <div id="schedule-section" className="space-y-6">
      
      {/* Subheader & Filter Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
        
        {/* Day Selector Pills */}
        <div className="flex items-center gap-1.5 bg-[#0b0e14] p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedDay('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedDay === 'TODAY'
                ? 'bg-white/15 text-white shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Today · Matchday 1
          </button>
          <button
            onClick={() => setSelectedDay('TOMORROW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedDay === 'TOMORROW'
                ? 'bg-white/15 text-white shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Tomorrow · Semifinals
          </button>
          <button
            onClick={() => setSelectedDay('FINALS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedDay === 'FINALS'
                ? 'bg-white/15 text-white shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Championship Sunday
          </button>
        </div>

        {/* Right Actions: Filters & Add Match */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filters (All, Live, Upcoming, Final) */}
          <div className="flex items-center gap-1.5">
            {(['ALL', 'LIVE', 'UPCOMING', 'FINAL'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                  selectedStatus === status
                    ? 'bg-[#38bdf8]/15 border-[#38bdf8]/40 text-[#38bdf8]'
                    : 'bg-transparent border-white/5 text-[#94a3b8] hover:text-white hover:border-white/20'
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md glow-blue transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule Match
            </button>
          )}
        </div>

      </div>

      {/* Matches Grid or Clean Empty State */}
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
          <div className="w-14 h-14 rounded-2xl bg-[#0284c7]/20 border border-[#0284c7]/40 flex items-center justify-center text-[#38bdf8] mx-auto shadow-lg">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading text-2xl font-black text-white uppercase tracking-wider">
              Tournament Schedule is Clean
            </h3>
            <p className="text-xs text-[#94a3b8] max-w-md mx-auto leading-relaxed">
              Preloaded mock data has been cleared. Add real matches to the schedule or initialize with a clean 0-0 template.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onOpenCreateMatch && (
              <button
                onClick={onOpenCreateMatch}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg glow-blue transition-all"
              >
                + Schedule First Match
              </button>
            )}
            {onLoadTemplateSchedule && (
              <button
                onClick={onLoadTemplateSchedule}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 font-heading font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Load Clean 0-0 Template
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-panel text-center py-16 rounded-2xl border border-white/10 space-y-3">
          <Calendar className="w-10 h-10 text-[#94a3b8] mx-auto opacity-50" />
          <h3 className="font-heading text-xl font-bold text-white uppercase">
            No matches found for this filter
          </h3>
          <p className="text-xs text-[#94a3b8]">
            Reset your filter to view all scheduled tournament matchups.
          </p>
          <button
            onClick={() => setSelectedStatus('ALL')}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Show All Games
          </button>
        </div>
      )}

    </div>
  );
};
