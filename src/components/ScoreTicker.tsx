import React from 'react';
import { Match, Sport } from '../types';
import { Radio, ChevronRight } from 'lucide-react';

interface ScoreTickerProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  activeSport: Sport;
}

export const ScoreTicker: React.FC<ScoreTickerProps> = ({
  matches,
  onSelectMatch,
  activeSport,
}) => {
  return (
    <div className="w-full bg-[#0b0e14] border-b border-white/5 py-2 px-4 overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto flex items-center gap-3 min-w-max">
        <div className="flex items-center gap-1.5 pr-3 border-r border-white/10 text-xs font-black uppercase tracking-wider text-[#94a3b8]">
          <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-ping" />
          <span className="text-[#ff5451]">LIVE COURTS</span>
        </div>

        {matches.length === 0 ? (
          <div className="text-xs text-[#94a3b8] font-medium tracking-wide flex items-center gap-2">
            <span>TOURNAMENT ARENA READY · STANDBY FOR NEXT SCHEDULED MATCH</span>
          </div>
        ) : (
          matches.map((m) => {
            const isSelectedSport = m.sport === activeSport;
            const isLive = m.status === 'LIVE';

            return (
              <div
                key={m.id}
                onClick={() => onSelectMatch(m)}
                className={`cursor-pointer px-3.5 py-1.5 rounded-lg border transition-all flex items-center gap-3 text-xs ${
                  isSelectedSport
                    ? 'bg-[#121824] border-white/15 hover:border-[#38bdf8]/50 shadow-sm'
                    : 'bg-[#10131a]/60 border-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                {/* Sport icon & status */}
                <div className="flex items-center gap-1 font-heading uppercase text-[11px] font-bold">
                  {isLive ? (
                    <span className="text-[#ff5451] flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5" />
                      {m.statusDetail}
                    </span>
                  ) : (
                    <span className="text-[#94a3b8]">{m.statusDetail}</span>
                  )}
                </div>

                {/* Matchup */}
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="font-bold text-white flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: m.homeTeam.logoColor }}
                    />
                    {m.homeTeam.shortName}
                    <span className="font-black text-sm text-[#f8fafc]">{m.homeTeam.score}</span>
                  </span>
                  <span className="text-white/30 text-[10px]">vs</span>
                  <span className="font-bold text-white flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: m.awayTeam.logoColor }}
                    />
                    {m.awayTeam.shortName}
                    <span className="font-black text-sm text-[#f8fafc]">{m.awayTeam.score}</span>
                  </span>
                </div>

                <ChevronRight className="w-3 h-3 text-[#94a3b8]" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
