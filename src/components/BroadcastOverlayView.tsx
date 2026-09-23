import React, { useState, useEffect } from 'react';
import { Match, Sport } from '../types';
import { 
  Tv, 
  Maximize2, 
  ArrowLeft, 
  Flame, 
  Zap, 
  Radio, 
  Clock, 
  Timer, 
  Layers, 
  Shield, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface BroadcastOverlayViewProps {
  matches: Match[];
  mode: 'overlay' | 'jumbotron';
  onBackToPortal: () => void;
  defaultCourt?: string;
}

export const BroadcastOverlayView: React.FC<BroadcastOverlayViewProps> = ({
  matches,
  mode,
  onBackToPortal,
  defaultCourt = 'Court 1 - Hardwood Arena',
}) => {
  const [selectedCourt, setSelectedCourt] = useState<string>(defaultCourt);
  const [backgroundMode, setBackgroundMode] = useState<'transparent' | 'chroma-green' | 'dark'>('transparent');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Filter matches for the selected court
  const activeMatch = matches.find((m) => {
    const courtClean = m.court.toLowerCase().split('-')[0].trim();
    const selClean = selectedCourt.toLowerCase().split('-')[0].trim();
    return courtClean === selClean || m.court === selectedCourt;
  }) || matches.find(m => m.status === 'LIVE') || matches[0];

  const isBasketball = activeMatch?.sport === 'basketball';
  const isVolleyball = activeMatch?.sport === 'volleyball';
  const isLive = activeMatch?.status === 'LIVE';

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const courts = Array.from(new Set(matches.map((m) => m.court).filter(Boolean)));
  if (courts.length === 0) {
    courts.push('Court 1 - Hardwood Arena', 'Court 2 - Fieldhouse', 'Court 3 - Volleyball Pavilion');
  }

  // --- OBS / VMIX STREAM OVERLAY MODE ---
  if (mode === 'overlay') {
    const bgClass =
      backgroundMode === 'chroma-green'
        ? 'bg-[#00FF00]'
        : backgroundMode === 'dark'
        ? 'bg-[#0b0e14]'
        : 'bg-transparent';

    return (
      <div className={`min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-6 transition-colors select-none ${bgClass}`}>
        
        {/* Floating Operator Controls (hover to reveal) */}
        <div className="absolute top-2 right-2 opacity-15 hover:opacity-100 transition-opacity z-50 flex items-center gap-2 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-white/20 text-xs">
          <select
            value={selectedCourt}
            onChange={(e) => setSelectedCourt(e.target.value)}
            className="bg-[#121620] text-white px-2 py-1 rounded-lg border border-white/10 outline-none text-[11px]"
          >
            {courts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={backgroundMode}
            onChange={(e) => setBackgroundMode(e.target.value as any)}
            className="bg-[#121620] text-white px-2 py-1 rounded-lg border border-white/10 outline-none text-[11px]"
          >
            <option value="transparent">Transparent (OBS)</option>
            <option value="chroma-green">Chroma Green</option>
            <option value="dark">Dark Stadium</option>
          </select>

          <button
            onClick={onBackToPortal}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px]"
          >
            Exit
          </button>
        </div>

        {/* TOP BROADCAST SCOREBUG (OBS Stream Source) */}
        <div className="w-full max-w-4xl mx-auto">
          {activeMatch ? (
            <div className="glass-panel-elevated bg-[#0b0f19]/95 border-2 border-white/20 rounded-2xl shadow-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 text-white">
              
              {/* Home Team */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-heading font-black text-sm text-white shadow-md shrink-0"
                  style={{ backgroundColor: activeMatch.homeTeam.logoColor || '#0284c7' }}
                >
                  {activeMatch.homeTeam.shortName || activeMatch.homeTeam.name.substring(0, 3).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    {activeMatch.possession === 'home' && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    )}
                    <span className="font-heading font-black text-sm sm:text-base tracking-wide uppercase truncate">
                      {activeMatch.homeTeam.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#94a3b8] font-mono">
                    {isVolleyball ? `Sets: ${activeMatch.homeTeam.setsWon ?? 0}` : `Fouls: ${activeMatch.homeTeam.fouls ?? 0}`}
                  </div>
                </div>
              </div>

              {/* Central Live Scoreboard Core */}
              <div className="flex items-center gap-2 sm:gap-4 shrink-0 px-3 py-1 rounded-xl bg-black/60 border border-white/10 text-center">
                <span className="font-mono text-2xl sm:text-4xl font-black tabular-nums text-white">
                  {activeMatch.homeTeam.score}
                </span>

                <div className="flex flex-col items-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    isLive ? 'bg-red-600 text-white animate-pulse' : 'bg-white/10 text-[#94a3b8]'
                  }`}>
                    {activeMatch.basketballPeriod || (isVolleyball ? `SET ${activeMatch.currentSetNumber || 1}` : activeMatch.status)}
                  </span>
                  {activeMatch.timeRemaining && (
                    <span className="font-mono text-xs text-amber-300 font-bold mt-0.5">
                      {activeMatch.timeRemaining}
                    </span>
                  )}
                  {activeMatch.shotClock !== undefined && activeMatch.shotClock > 0 && (
                    <span className="font-mono text-xs font-black text-rose-400">
                      :{activeMatch.shotClock.toString().padStart(2, '0')}
                    </span>
                  )}
                </div>

                <span className="font-mono text-2xl sm:text-4xl font-black tabular-nums text-white">
                  {activeMatch.awayTeam.score}
                </span>
              </div>

              {/* Away Team */}
              <div className="flex items-center justify-end gap-3 flex-1 min-w-0 text-right">
                <div className="truncate">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-heading font-black text-sm sm:text-base tracking-wide uppercase truncate">
                      {activeMatch.awayTeam.name}
                    </span>
                    {activeMatch.possession === 'away' && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-[#94a3b8] font-mono">
                    {isVolleyball ? `Sets: ${activeMatch.awayTeam.setsWon ?? 0}` : `Fouls: ${activeMatch.awayTeam.fouls ?? 0}`}
                  </div>
                </div>
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-heading font-black text-sm text-white shadow-md shrink-0"
                  style={{ backgroundColor: activeMatch.awayTeam.logoColor || '#f97316' }}
                >
                  {activeMatch.awayTeam.shortName || activeMatch.awayTeam.name.substring(0, 3).toUpperCase()}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel p-4 text-center text-white/60">
              No live match scheduled for this court.
            </div>
          )}
        </div>

        {/* Bottom Sponsor Bug */}
        <div className="w-full flex justify-between items-end text-xs">
          <div className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white/70 font-mono text-[11px]">
            {activeMatch?.court || selectedCourt} · Official Championship Telemetry
          </div>
          <div className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
            <span className="text-[10px] text-white/50 uppercase font-heading font-bold">Championship Partner</span>
            <span className="font-heading font-black text-xs text-[#38bdf8]">OMEGA ATHLETICS</span>
          </div>
        </div>

      </div>
    );
  }

  // --- ARENA JUMBOTRON / STADIUM LED FULLSCREEN MODE ---
  return (
    <div className="min-h-screen w-full bg-[#05070a] text-white flex flex-col justify-between p-4 sm:p-8 select-none">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-white/15 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPortal}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-2 text-xs font-heading font-black uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portal</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-heading font-black text-xs sm:text-sm tracking-wider uppercase text-emerald-400">
              ARENA JUMBOTRON LED DISPLAY ACTIVE
            </span>
          </div>
        </div>

        {/* Court Switcher & Fullscreen Button */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCourt}
            onChange={(e) => setSelectedCourt(e.target.value)}
            className="bg-[#121824] text-white px-3 py-2 rounded-xl border border-white/20 font-heading font-bold text-xs uppercase tracking-wider outline-none"
          >
            {courts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Toggle Fullscreen (F11)"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Jumbotron Stadium Display */}
      {activeMatch ? (
        <div className="my-auto py-8">
          
          {/* Tournament Division & Venue */}
          <div className="text-center mb-6">
            <span className="px-4 py-1 rounded-full bg-white/10 border border-white/20 text-xs sm:text-sm font-black font-heading uppercase tracking-widest text-[#38bdf8]">
              {activeMatch.division || 'SANCTIONED CHAMPIONSHIP ATHLETICS'} · {activeMatch.court}
            </span>
          </div>

          {/* Huge Scoreboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center max-w-7xl mx-auto">
            
            {/* Home Team Board (cols 5) */}
            <div className="lg:col-span-5 flex flex-col items-center p-6 sm:p-10 rounded-3xl bg-[#0c111a] border-2 border-white/15 shadow-2xl relative overflow-hidden">
              <div 
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center font-heading font-black text-3xl sm:text-4xl text-white shadow-2xl mb-4"
                style={{ backgroundColor: activeMatch.homeTeam.logoColor || '#0284c7' }}
              >
                {activeMatch.homeTeam.shortName || activeMatch.homeTeam.name.substring(0, 3).toUpperCase()}
              </div>

              <h2 className="font-heading font-black text-3xl sm:text-5xl uppercase tracking-wider text-center text-white mb-2">
                {activeMatch.homeTeam.name}
              </h2>

              <div className="text-xs sm:text-sm text-[#94a3b8] font-mono uppercase mb-4">
                {isVolleyball ? `Sets Won: ${activeMatch.homeTeam.setsWon ?? 0}` : `Team Fouls: ${activeMatch.homeTeam.fouls ?? 0} · TO: ${activeMatch.homeTeam.timeoutsLeft ?? 3}`}
              </div>

              {/* Massive Score */}
              <div className="font-mono text-7xl sm:text-9xl font-black text-white tracking-tight tabular-nums mt-2">
                {activeMatch.homeTeam.score}
              </div>
            </div>

            {/* Central Clock & Telemetry (cols 2) */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center space-y-4">
              <div className="px-4 py-1.5 rounded-xl bg-red-600 text-white font-heading font-black text-sm uppercase tracking-widest animate-pulse">
                {activeMatch.basketballPeriod || (isVolleyball ? `SET ${activeMatch.currentSetNumber || 1}` : activeMatch.status)}
              </div>

              {/* Shot Clock (Basketball) */}
              {isBasketball && (
                <div className="p-4 sm:p-6 rounded-3xl bg-black border-2 border-rose-500/60 text-center shadow-2xl glow-red">
                  <div className="text-[10px] font-heading font-bold text-rose-400 uppercase tracking-widest mb-1">
                    SHOT CLOCK
                  </div>
                  <div className="font-mono text-5xl sm:text-6xl font-black text-rose-500 tabular-nums">
                    {activeMatch.shotClock !== undefined ? activeMatch.shotClock.toString().padStart(2, '0') : '24'}
                  </div>
                </div>
              )}

              {/* Game Clock / Set Points (Volleyball) */}
              {isVolleyball && activeMatch.targetPoints && (
                <div className="p-4 rounded-2xl bg-black/80 border border-white/20 text-center">
                  <div className="text-[10px] font-heading font-bold text-[#38bdf8] uppercase tracking-wider">
                    TARGET POINTS
                  </div>
                  <div className="font-mono text-3xl font-black text-white tabular-nums">
                    {activeMatch.targetPoints}
                  </div>
                </div>
              )}

              {activeMatch.timeRemaining && (
                <div className="font-mono text-2xl sm:text-3xl font-black text-amber-300">
                  {activeMatch.timeRemaining}
                </div>
              )}
            </div>

            {/* Away Team Board (cols 5) */}
            <div className="lg:col-span-5 flex flex-col items-center p-6 sm:p-10 rounded-3xl bg-[#0c111a] border-2 border-white/15 shadow-2xl relative overflow-hidden">
              <div 
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center font-heading font-black text-3xl sm:text-4xl text-white shadow-2xl mb-4"
                style={{ backgroundColor: activeMatch.awayTeam.logoColor || '#f97316' }}
              >
                {activeMatch.awayTeam.shortName || activeMatch.awayTeam.name.substring(0, 3).toUpperCase()}
              </div>

              <h2 className="font-heading font-black text-3xl sm:text-5xl uppercase tracking-wider text-center text-white mb-2">
                {activeMatch.awayTeam.name}
              </h2>

              <div className="text-xs sm:text-sm text-[#94a3b8] font-mono uppercase mb-4">
                {isVolleyball ? `Sets Won: ${activeMatch.awayTeam.setsWon ?? 0}` : `Team Fouls: ${activeMatch.awayTeam.fouls ?? 0} · TO: ${activeMatch.awayTeam.timeoutsLeft ?? 3}`}
              </div>

              {/* Massive Score */}
              <div className="font-mono text-7xl sm:text-9xl font-black text-white tracking-tight tabular-nums mt-2">
                {activeMatch.awayTeam.score}
              </div>
            </div>

          </div>

          {/* Volleyball Set History Table if available */}
          {isVolleyball && activeMatch.setScores && activeMatch.setScores.length > 0 && (
            <div className="max-w-2xl mx-auto mt-8 p-4 rounded-2xl bg-black/60 border border-white/15">
              <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#94a3b8] mb-2 text-center">
                Official Set Breakdown
              </div>
              <div className="flex justify-center gap-4 text-xs font-mono">
                {activeMatch.setScores.map((s) => (
                  <div key={s.set} className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="text-[10px] text-white/50 mb-0.5">SET {s.set}</div>
                    <div className="font-bold text-white">{s.homeScore} - {s.awayScore}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="text-center py-20 text-white/50 font-heading text-xl">
          NO MATCH DATA AVAILABLE FOR THIS COURT
        </div>
      )}

      {/* Arena Footer */}
      <div className="border-t border-white/15 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#94a3b8] gap-2">
        <span>FIVB / VNL &amp; FIBA / NCAA Certified Arena Telemetry Feed</span>
        <span>Court Display Refresh: Live WebSockets Active</span>
      </div>

    </div>
  );
};
