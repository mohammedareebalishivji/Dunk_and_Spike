import React, { useState } from 'react';
import { Sport, Match } from '../types';
import { 
  Trophy, 
  Award, 
  Medal, 
  Flame, 
  Zap, 
  TrendingUp, 
  Target, 
  Shield, 
  ArrowUpRight,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { calculateBasketballStandings, getBasketballPlayerLeaders } from '../utils/basketballStandings';
import { calculateVolleyballStandings, getVolleyballPlayerLeaders } from '../utils/volleyballStandings';

interface StandingsTableProps {
  currentSport: Sport;
  matches?: Match[];
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ currentSport: initialSport, matches = [] }) => {
  const [selectedSport, setSelectedSport] = useState<Sport>(initialSport);
  const isBasketball = selectedSport === 'basketball';

  // Basketball leaderboards category
  const [basketballCategory, setBasketballCategory] = useState<'points' | 'threes' | 'assists' | 'rebounds'>('points');

  // Volleyball leaderboards category
  const [volleyballCategory, setVolleyballCategory] = useState<'points' | 'kills' | 'aces' | 'blocks'>('points');

  // Compute live standings and leaders
  const bbStandings = calculateBasketballStandings(matches);
  const bbLeaders = getBasketballPlayerLeaders(matches);

  const vbStandings = calculateVolleyballStandings(matches);
  const vbLeaders = getVolleyballPlayerLeaders(matches);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header & Sport Toggle Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className={`w-5 h-5 ${isBasketball ? 'text-[#f97316]' : 'text-[#38bdf8]'}`} />
            <span className={`text-[11px] font-black uppercase tracking-widest ${isBasketball ? 'text-[#f97316]' : 'text-[#38bdf8]'}`}>
              OFFICIAL TOURNAMENT RANKINGS
            </span>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
            {isBasketball ? 'Hardwood Basketball Leaderboard' : 'FIVB Volleyball Leaderboard'}
          </h2>
        </div>

        {/* Sport Switcher Tabs */}
        <div className="flex items-center bg-[#090d14] p-1 rounded-2xl border border-white/10 shadow-inner self-start sm:self-auto">
          <button
            onClick={() => setSelectedSport('basketball')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-heading text-xs font-bold tracking-wider transition-all duration-200 ${
              isBasketball
                ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-md glow-orange'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>BASKETBALL</span>
          </button>
          <button
            onClick={() => setSelectedSport('volleyball')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-heading text-xs font-bold tracking-wider transition-all duration-200 ${
              !isBasketball
                ? 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white shadow-md glow-blue'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>VOLLEYBALL</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. BASKETBALL LEADERBOARD SECTION                         */}
      {/* ========================================================= */}
      {isBasketball && (
        <div className="space-y-10">

          {/* Basketball Player Leaders Spotlight */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#f97316]" />
                <h3 className="font-heading font-black text-xl text-white uppercase tracking-wide">
                  Basketball Individual Leaders
                </h3>
              </div>

              {/* Basketball Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#0b0e14] p-1 rounded-xl border border-white/10 text-xs font-heading font-bold uppercase">
                <button
                  onClick={() => setBasketballCategory('points')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    basketballCategory === 'points'
                      ? 'bg-[#f97316] text-white shadow glow-orange'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  🏀 Scoring (PTS)
                </button>
                <button
                  onClick={() => setBasketballCategory('threes')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    basketballCategory === 'threes'
                      ? 'bg-[#f97316] text-white shadow glow-orange'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  🎯 3-Pointers (3PM)
                </button>
                <button
                  onClick={() => setBasketballCategory('assists')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    basketballCategory === 'assists'
                      ? 'bg-[#f97316] text-white shadow glow-orange'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  🪄 Assists (AST)
                </button>
                <button
                  onClick={() => setBasketballCategory('rebounds')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    basketballCategory === 'rebounds'
                      ? 'bg-[#f97316] text-white shadow glow-orange'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  🛡️ Rebounds (REB)
                </button>
              </div>
            </div>

            {/* Current Active Category List */}
            {(() => {
              const list = 
                basketballCategory === 'points' ? bbLeaders.scoringLeaders :
                basketballCategory === 'threes' ? bbLeaders.threePointLeaders :
                basketballCategory === 'assists' ? bbLeaders.assistLeaders :
                bbLeaders.reboundLeaders;

              const metricLabel = 
                basketballCategory === 'points' ? 'PTS' :
                basketballCategory === 'threes' ? '3PM' :
                basketballCategory === 'assists' ? 'AST' : 'REB';

              const getMetricValue = (p: typeof list[0]) => {
                if (basketballCategory === 'points') return p.points;
                if (basketballCategory === 'threes') return p.threePointers;
                if (basketballCategory === 'assists') return p.assists;
                return p.rebounds;
              };

              const topPlayer = list[0];

              if (!topPlayer || getMetricValue(topPlayer) === 0) {
                return (
                  <div className="glass-panel text-center py-10 px-4 rounded-2xl border border-white/10 space-y-2">
                    <Flame className="w-8 h-8 text-[#f97316] mx-auto opacity-40" />
                    <p className="text-sm font-heading font-bold uppercase text-white tracking-wider">
                      No Basketball Telemetry Logged Yet
                    </p>
                    <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
                      Points, 3-pointers, assists, and rebounds recorded in the Live Scorer will populate this leaderboard in real time.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                  {/* #1 Leader Showcase Card */}
                  <div className="lg:col-span-1 glass-panel-elevated p-6 rounded-3xl border border-[#f97316]/30 bg-gradient-to-br from-[#f97316]/10 to-[#0b0e14] relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#f97316] text-white shadow glow-orange">
                        ★ #1 LEADER
                      </span>
                      <span className="font-mono text-xs font-bold text-[#f97316]">
                        {topPlayer.teamName}
                      </span>
                    </div>

                    <div className="py-6 text-center space-y-2">
                      <div 
                        className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center font-heading font-black text-2xl text-white shadow-xl border-2 border-white/20 overflow-hidden relative"
                        style={{ backgroundColor: topPlayer.logoColor }}
                      >
                        {topPlayer.photoUrl ? (
                          <img src={topPlayer.photoUrl} alt={topPlayer.name} className="w-full h-full object-cover" />
                        ) : (
                          `#${topPlayer.number}`
                        )}
                      </div>
                      <div>
                        <h4 className="font-heading font-black text-2xl text-white uppercase">
                          {topPlayer.name}
                        </h4>
                        <span className="text-xs text-[#94a3b8] uppercase font-bold">
                          {topPlayer.position}
                        </span>
                      </div>
                      <div className="pt-2">
                        <span className="font-heading font-black text-5xl text-[#f97316] tabular-nums">
                          {getMetricValue(topPlayer)}
                        </span>
                        <span className="font-heading font-bold text-base text-white ml-1.5 uppercase">
                          {metricLabel}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 text-center text-xs">
                      <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#94a3b8] block">2PM</span>
                        <span className="font-heading font-bold text-white text-sm">{topPlayer.twoPointers}</span>
                      </div>
                      <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#94a3b8] block">3PM</span>
                        <span className="font-heading font-bold text-white text-sm">{topPlayer.threePointers}</span>
                      </div>
                      <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#94a3b8] block">FTM</span>
                        <span className="font-heading font-bold text-white text-sm">{topPlayer.freeThrows}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top 5 Contenders Ranking List */}
                  <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs text-[#94a3b8] uppercase font-bold">
                      <span>Top 5 {metricLabel} Leaders</span>
                      <span>Total {metricLabel}</span>
                    </div>

                    <div className="space-y-2">
                      {list.map((player, idx) => {
                        const val = getMetricValue(player);
                        const maxVal = getMetricValue(topPlayer) || 1;
                        const pct = Math.min(100, Math.round((val / maxVal) * 100));

                        return (
                          <div 
                            key={player.id}
                            className="p-3 rounded-2xl bg-[#0b0e14]/80 border border-white/5 flex items-center justify-between gap-4 hover:border-white/20 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="font-heading font-black text-sm text-[#94a3b8] w-5 text-center">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                              </span>
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs text-white shrink-0 overflow-hidden relative"
                                style={{ backgroundColor: player.logoColor }}
                              >
                                {player.photoUrl ? (
                                  <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                                ) : (
                                  `#${player.number}`
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-heading font-bold text-sm text-white truncate block">
                                    {player.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#94a3b8] truncate">
                                    {player.teamName}
                                  </span>
                                </div>
                                {/* Progress Bar */}
                                <div className="w-full bg-white/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-[#ea580c] to-[#f97316] rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-heading font-black text-lg text-white tabular-nums">
                                {val}
                              </span>
                              <span className="text-[10px] text-[#94a3b8] uppercase font-bold ml-1">
                                {metricLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* FIBA Hardwood Championship Standings Table */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#f97316]" />
                <h3 className="font-heading font-black text-xl text-white uppercase tracking-wide">
                  FIBA / Hardwood Division Standings
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Seeds 1-4: Championship Playoffs
                </span>
              </div>
            </div>

            {bbStandings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[#94a3b8] uppercase font-heading font-bold tracking-wider">
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-3 text-center">GP</th>
                      <th className="py-3 px-3 text-center">W</th>
                      <th className="py-3 px-3 text-center">L</th>
                      <th className="py-3 px-3 text-right font-mono text-white">WIN%</th>
                      <th className="py-3 px-3 text-right font-mono">GB</th>
                      <th className="py-3 px-3 text-right font-mono">PF</th>
                      <th className="py-3 px-3 text-right font-mono">PA</th>
                      <th className="py-3 px-4 text-right font-mono">DIFF (+/-)</th>
                      <th className="py-3 px-3 text-center">STREAK</th>
                      <th className="py-3 px-4 text-center">FORM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {bbStandings.map((row) => (
                      <tr key={row.teamName} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 font-heading font-bold text-white text-sm">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                            row.rank <= 4 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-white/5 text-[#94a3b8]'
                          }`}>
                            {row.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span 
                              className="w-7 h-7 rounded-lg flex items-center justify-center font-heading font-black text-xs text-white shrink-0 shadow overflow-hidden relative"
                              style={{ backgroundColor: row.logoColor }}
                            >
                              {row.logoUrl ? (
                                <img src={row.logoUrl} alt={row.teamName} className="w-full h-full object-contain p-0.5 bg-black/40" />
                              ) : (
                                row.teamShortName
                              )}
                            </span>
                            <span className="font-heading font-bold text-sm text-white">
                              {row.teamName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center tabular-nums text-white">{row.gp}</td>
                        <td className="py-3 px-3 text-center tabular-nums font-bold text-emerald-400">{row.wins}</td>
                        <td className="py-3 px-3 text-center tabular-nums text-[#94a3b8]">{row.losses}</td>
                        <td className="py-3 px-3 text-right tabular-nums font-mono font-bold text-white text-sm">
                          {row.winPctString}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums font-mono text-[#94a3b8]">{row.gb}</td>
                        <td className="py-3 px-3 text-right tabular-nums font-mono text-white">{row.ptsFor}</td>
                        <td className="py-3 px-3 text-right tabular-nums font-mono text-[#94a3b8]">{row.ptsAgainst}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-mono font-bold">
                          <span className={row.diff > 0 ? 'text-emerald-400' : row.diff < 0 ? 'text-rose-400' : 'text-white'}>
                            {row.diff > 0 ? `+${row.diff}` : row.diff}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.streak.startsWith('W') 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : row.streak.startsWith('L')
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-white/5 text-[#94a3b8]'
                          }`}>
                            {row.streak}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {row.form.length > 0 ? (
                              row.form.map((res, i) => (
                                <span 
                                  key={i}
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                                    res === 'W' 
                                      ? 'bg-emerald-500 text-black font-bold' 
                                      : 'bg-rose-500 text-white'
                                  }`}
                                >
                                  {res}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#94a3b8]">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 space-y-2">
                <Trophy className="w-8 h-8 text-[#94a3b8] mx-auto opacity-40" />
                <p className="text-sm font-heading font-bold uppercase text-white tracking-wider">
                  No Basketball Matches Finalized Yet
                </p>
                <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
                  Games will calculate win percentage, points differential (+/-), and playoff seeding once marked Final.
                </p>
              </div>
            )}

            {/* Basketball Standing Rule Footnote */}
            <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-[#94a3b8]">
              <Info className="w-3.5 h-3.5 text-[#f97316] shrink-0" />
              <span>
                <strong>Basketball Seeding Rule:</strong> Teams are ranked by Win Percentage (WIN%). Tiebreakers are decided by Head-to-Head record and Point Differential (DIFF).
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 2. VOLLEYBALL LEADERBOARD SECTION                         */}
      {/* ========================================================= */}
      {!isBasketball && (
        <div className="space-y-10">

          {/* Volleyball Player Leaders Spotlight */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#38bdf8]" />
                <h3 className="font-heading font-black text-xl text-white uppercase tracking-wide">
                  Volleyball Spikers &amp; Skill Leaders
                </h3>
              </div>

              {/* Volleyball Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#0b0e14] p-1 rounded-xl border border-white/10 text-xs font-heading font-bold uppercase">
                <button
                  onClick={() => setVolleyballCategory('points')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    volleyballCategory === 'points'
                      ? 'bg-[#0284c7] text-white shadow glow-blue'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  ⚡ Total Points (PTS)
                </button>
                <button
                  onClick={() => setVolleyballCategory('kills')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    volleyballCategory === 'kills'
                      ? 'bg-[#0284c7] text-white shadow glow-blue'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  💥 Spike Kills
                </button>
                <button
                  onClick={() => setVolleyballCategory('aces')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    volleyballCategory === 'aces'
                      ? 'bg-[#0284c7] text-white shadow glow-blue'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  🎯 Service Aces
                </button>
                <button
                  onClick={() => setVolleyballCategory('blocks')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    volleyballCategory === 'blocks'
                      ? 'bg-[#0284c7] text-white shadow glow-blue'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  🧱 Kill Blocks
                </button>
              </div>
            </div>

            {/* Current Active Category List for Volleyball */}
            {(() => {
              const list = 
                volleyballCategory === 'points' ? vbLeaders.scoringLeaders :
                volleyballCategory === 'kills' ? vbLeaders.killLeaders :
                volleyballCategory === 'aces' ? vbLeaders.aceLeaders :
                vbLeaders.blockLeaders;

              const metricLabel = 
                volleyballCategory === 'points' ? 'PTS' :
                volleyballCategory === 'kills' ? 'Kills' :
                volleyballCategory === 'aces' ? 'Aces' : 'Blocks';

              const getMetricValue = (p: typeof list[0]) => {
                if (volleyballCategory === 'points') return p.points;
                if (volleyballCategory === 'kills') return p.kills;
                if (volleyballCategory === 'aces') return p.aces;
                return p.blocks;
              };

              const topPlayer = list[0];

              if (!topPlayer || getMetricValue(topPlayer) === 0) {
                return (
                  <div className="glass-panel text-center py-10 px-4 rounded-2xl border border-white/10 space-y-2">
                    <Zap className="w-8 h-8 text-[#38bdf8] mx-auto opacity-40" />
                    <p className="text-sm font-heading font-bold uppercase text-white tracking-wider">
                      No Volleyball Telemetry Logged Yet
                    </p>
                    <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
                      Spike kills, service aces, and blocks recorded in the Live Scorer will populate this leaderboard in real time.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                  {/* #1 Leader Showcase Card */}
                  <div className="lg:col-span-1 glass-panel-elevated p-6 rounded-3xl border border-[#0284c7]/30 bg-gradient-to-br from-[#0284c7]/10 to-[#0b0e14] relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#0284c7] text-white shadow glow-blue">
                        ★ #1 LEADER
                      </span>
                      <span className="font-mono text-xs font-bold text-[#38bdf8]">
                        {topPlayer.teamName}
                      </span>
                    </div>

                    <div className="py-6 text-center space-y-2">
                      <div 
                        className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center font-heading font-black text-2xl text-white shadow-xl border-2 border-white/20 overflow-hidden relative"
                        style={{ backgroundColor: topPlayer.logoColor }}
                      >
                        {topPlayer.photoUrl ? (
                          <img src={topPlayer.photoUrl} alt={topPlayer.name} className="w-full h-full object-cover" />
                        ) : (
                          `#${topPlayer.number}`
                        )}
                      </div>
                      <div>
                        <h4 className="font-heading font-black text-2xl text-white uppercase">
                          {topPlayer.name}
                        </h4>
                        <span className="text-xs text-[#94a3b8] uppercase font-bold">
                          {topPlayer.position}
                        </span>
                      </div>
                      <div className="pt-2">
                        <span className="font-heading font-black text-5xl text-[#38bdf8] tabular-nums">
                          {getMetricValue(topPlayer)}
                        </span>
                        <span className="font-heading font-bold text-base text-white ml-1.5 uppercase">
                          {metricLabel}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 text-center text-xs">
                      <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#94a3b8] block">Kills</span>
                        <span className="font-heading font-bold text-white text-sm">{topPlayer.kills}</span>
                      </div>
                      <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#94a3b8] block">Aces</span>
                        <span className="font-heading font-bold text-white text-sm">{topPlayer.aces}</span>
                      </div>
                      <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#94a3b8] block">Blocks</span>
                        <span className="font-heading font-bold text-white text-sm">{topPlayer.blocks}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top 5 Contenders Ranking List */}
                  <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs text-[#94a3b8] uppercase font-bold">
                      <span>Top 5 {metricLabel} Leaders</span>
                      <span>Total {metricLabel}</span>
                    </div>

                    <div className="space-y-2">
                      {list.map((player, idx) => {
                        const val = getMetricValue(player);
                        const maxVal = getMetricValue(topPlayer) || 1;
                        const pct = Math.min(100, Math.round((val / maxVal) * 100));

                        return (
                          <div 
                            key={player.id}
                            className="p-3 rounded-2xl bg-[#0b0e14]/80 border border-white/5 flex items-center justify-between gap-4 hover:border-white/20 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="font-heading font-black text-sm text-[#94a3b8] w-5 text-center">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                              </span>
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs text-white shrink-0 overflow-hidden relative"
                                style={{ backgroundColor: player.logoColor }}
                              >
                                {player.photoUrl ? (
                                  <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                                ) : (
                                  `#${player.number}`
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-heading font-bold text-sm text-white truncate block">
                                    {player.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#94a3b8] truncate">
                                    {player.teamName}
                                  </span>
                                </div>
                                {/* Progress Bar */}
                                <div className="w-full bg-white/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8] rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-heading font-black text-lg text-white tabular-nums">
                                {val}
                              </span>
                              <span className="text-[10px] text-[#94a3b8] uppercase font-bold ml-1">
                                {metricLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* FIVB / VNL Championship Standings Table */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#38bdf8]" />
                <h3 className="font-heading font-black text-xl text-white uppercase tracking-wide">
                  FIVB / VNL World Tour Standings
                </h3>
              </div>
              <span className="text-xs text-[#94a3b8] uppercase font-bold">
                Official FIVB 3-2-1-0 Points System
              </span>
            </div>

            {vbStandings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[#94a3b8] uppercase font-heading font-bold tracking-wider">
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-3 text-center">MP</th>
                      <th className="py-3 px-3 text-center">W</th>
                      <th className="py-3 px-3 text-center">L</th>
                      <th className="py-3 px-3 text-center font-bold text-[#38bdf8] bg-white/5 rounded-lg">FIVB PTS</th>
                      <th className="py-3 px-3 text-center">SW</th>
                      <th className="py-3 px-3 text-center">SL</th>
                      <th className="py-3 px-3 text-right font-mono">SET RATIO</th>
                      <th className="py-3 px-3 text-right font-mono">PW</th>
                      <th className="py-3 px-3 text-right font-mono">PL</th>
                      <th className="py-3 px-3 text-right font-mono">PT RATIO</th>
                      <th className="py-3 px-3 text-center">STREAK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {vbStandings.map((row) => (
                      <tr key={row.teamName} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 font-heading font-bold text-white text-sm">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                            row.rank <= 3 
                              ? 'bg-[#0284c7]/25 text-[#38bdf8] border border-[#0284c7]/40' 
                              : 'bg-white/5 text-[#94a3b8]'
                          }`}>
                            {row.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span 
                              className="w-7 h-7 rounded-lg flex items-center justify-center font-heading font-black text-xs text-white shrink-0 shadow overflow-hidden relative"
                              style={{ backgroundColor: row.logoColor }}
                            >
                              {row.logoUrl ? (
                                <img src={row.logoUrl} alt={row.teamName} className="w-full h-full object-contain p-0.5 bg-black/40" />
                              ) : (
                                row.teamShortName
                              )}
                            </span>
                            <span className="font-heading font-bold text-sm text-white">
                              {row.teamName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center tabular-nums text-white">{row.mp}</td>
                        <td className="py-3 px-3 text-center tabular-nums font-bold text-emerald-400">{row.wins}</td>
                        <td className="py-3 px-3 text-center tabular-nums text-[#94a3b8]">{row.losses}</td>
                        <td className="py-3 px-3 text-center tabular-nums font-mono font-black text-[#38bdf8] text-base bg-white/5">
                          {row.fivbPoints}
                        </td>
                        <td className="py-3 px-3 text-center tabular-nums text-white">{row.setsWon}</td>
                        <td className="py-3 px-3 text-center tabular-nums text-[#94a3b8]">{row.setsLost}</td>
                        <td className="py-3 px-3 text-right tabular-nums font-mono text-white font-semibold">
                          {row.setRatio}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums font-mono text-[#94a3b8]">{row.ptsWon}</td>
                        <td className="py-3 px-3 text-right tabular-nums font-mono text-[#94a3b8]">{row.ptsLost}</td>
                        <td className="py-3 px-3 text-right tabular-nums font-mono text-[#38bdf8]">
                          {row.ptRatio}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.streak.startsWith('W') 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : row.streak.startsWith('L')
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-white/5 text-[#94a3b8]'
                          }`}>
                            {row.streak}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 space-y-2">
                <Trophy className="w-8 h-8 text-[#94a3b8] mx-auto opacity-40" />
                <p className="text-sm font-heading font-bold uppercase text-white tracking-wider">
                  No Volleyball Matches Finalized Yet
                </p>
                <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
                  Sets won, FIVB tournament points (3, 2, 1, 0), and set ratio calculate dynamically once matches are finalized.
                </p>
              </div>
            )}

            {/* FIVB Standing Rule Footnote */}
            <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-[#94a3b8]">
              <Info className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
              <span>
                <strong>Official FIVB / VNL Tiebreak Priority:</strong> 1. Total Matches Won · 2. FIVB Points (3 pts for 3-0/3-1 win, 2 pts for 3-2 win, 1 pt for 2-3 loss, 0 pts for 0-3/1-3 loss) · 3. Set Ratio (SW/SL) · 4. Point Ratio (PW/PL).
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
