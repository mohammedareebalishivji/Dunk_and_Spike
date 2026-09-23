import React, { useState, useEffect } from 'react';
import { Sport, Match, TournamentBracket, BracketMatchNode } from '../types';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Award, 
  Medal, 
  CheckCircle2, 
  Play, 
  Tv, 
  Clock, 
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  generateInitialBracket, 
  synchronizeBracketWithMatches, 
  advanceBracketMatch 
} from '../utils/bracketManager';

interface TournamentBracketViewProps {
  currentSport: Sport;
  matches: Match[];
  isAdminLoggedIn?: boolean;
  onSelectMatchToScore?: (matchId: string) => void;
  onOpenScoresheet?: (match: Match) => void;
}

export const TournamentBracketView: React.FC<TournamentBracketViewProps> = ({
  currentSport: initialSport,
  matches,
  isAdminLoggedIn = false,
  onSelectMatchToScore,
  onOpenScoresheet,
}) => {
  const [selectedSport, setSelectedSport] = useState<Sport>(initialSport);
  const isBasketball = selectedSport === 'basketball';

  const [bracket, setBracket] = useState<TournamentBracket>(() => {
    return generateInitialBracket(initialSport);
  });

  // Re-sync bracket whenever matches change or sport switches
  useEffect(() => {
    setBracket((prev) => {
      const base = prev.sport === selectedSport ? prev : generateInitialBracket(selectedSport);
      return synchronizeBracketWithMatches(base, matches);
    });
  }, [matches, selectedSport]);

  const qfNodes = bracket.nodes.filter((n) => n.round === 'quarterfinals');
  const sfNodes = bracket.nodes.filter((n) => n.round === 'semifinals');
  const bronzeNode = bracket.nodes.find((n) => n.round === 'third_place');
  const finalsNode = bracket.nodes.find((n) => n.round === 'finals');

  const handleSimulateAdvance = (node: BracketMatchNode, winner: 'home' | 'away') => {
    const homeScore = winner === 'home' ? (isBasketball ? 95 : 3) : (isBasketball ? 84 : 1);
    const awayScore = winner === 'away' ? (isBasketball ? 95 : 3) : (isBasketball ? 84 : 1);
    setBracket((prev) => advanceBracketMatch(prev, node.id, winner, homeScore, awayScore));
  };

  const renderNodeCard = (node: BracketMatchNode, isHighlighted = false) => {
    const isLive = node.status === 'LIVE';
    const isFinal = node.status === 'FINAL';
    const homeWon = node.winner === 'home';
    const awayWon = node.winner === 'away';

    // Find real match object if linked
    const linkedMatch = matches.find((m) => m.id === node.matchId);

    return (
      <div 
        key={node.id}
        className={`relative p-3.5 rounded-2xl border transition-all duration-200 ${
          isHighlighted
            ? 'bg-gradient-to-br from-[#101928] to-[#0c1017] border-[#38bdf8]/50 shadow-xl'
            : isLive
            ? 'bg-gradient-to-br from-[#121620] to-[#090d14] border-emerald-500/40 shadow-lg glow-emerald'
            : isFinal
            ? 'bg-[#0b0e14]/90 border-white/10'
            : 'bg-[#080b11]/80 border-white/10 hover:border-white/20'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/10 text-[10px]">
          <span className="font-heading font-black uppercase tracking-wider text-[#94a3b8] flex items-center gap-1">
            <span>{node.roundLabel}</span>
            <span className="text-white/40">· M{node.matchNumber}</span>
          </span>

          <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
            isLive 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
              : isFinal 
              ? 'bg-white/10 text-white/80' 
              : 'bg-white/5 text-[#94a3b8]'
          }`}>
            {node.status}
          </span>
        </div>

        {/* Team 1 (Home) */}
        <div className={`flex items-center justify-between p-2 rounded-xl mb-1 transition-colors ${
          homeWon ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-white/5'
        }`}>
          <div className="flex items-center gap-2 truncate">
            {node.homeTeamSeed && (
              <span className="w-4 h-4 rounded bg-white/10 text-[10px] font-mono font-bold flex items-center justify-center text-[#94a3b8]">
                {node.homeTeamSeed}
              </span>
            )}
            <span className={`text-xs font-heading font-black tracking-wide truncate ${
              homeWon ? 'text-white' : node.winner ? 'text-[#94a3b8]' : 'text-white'
            }`}>
              {node.homeTeamName}
            </span>
          </div>
          <span className={`font-mono text-sm font-black tabular-nums ml-2 ${
            homeWon ? 'text-emerald-400' : 'text-white'
          }`}>
            {node.homeScore ?? (isFinal ? 0 : '-')}
          </span>
        </div>

        {/* Team 2 (Away) */}
        <div className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
          awayWon ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-white/5'
        }`}>
          <div className="flex items-center gap-2 truncate">
            {node.awayTeamSeed && (
              <span className="w-4 h-4 rounded bg-white/10 text-[10px] font-mono font-bold flex items-center justify-center text-[#94a3b8]">
                {node.awayTeamSeed}
              </span>
            )}
            <span className={`text-xs font-heading font-black tracking-wide truncate ${
              awayWon ? 'text-white' : node.winner ? 'text-[#94a3b8]' : 'text-white'
            }`}>
              {node.awayTeamName}
            </span>
          </div>
          <span className={`font-mono text-sm font-black tabular-nums ml-2 ${
            awayWon ? 'text-emerald-400' : 'text-white'
          }`}>
            {node.awayScore ?? (isFinal ? 0 : '-')}
          </span>
        </div>

        {/* Court and Actions */}
        <div className="mt-2.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px] text-[#94a3b8]">
          <span className="truncate text-[10px] text-white/50">{node.court || 'Court 1'}</span>

          <div className="flex items-center gap-1.5 shrink-0">
            {isLive && linkedMatch && onSelectMatchToScore && (
              <button
                onClick={() => onSelectMatchToScore(linkedMatch.id)}
                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                <Play className="w-3 h-3" />
                Score
              </button>
            )}

            {isFinal && linkedMatch && onOpenScoresheet && (
              <button
                onClick={() => onOpenScoresheet(linkedMatch)}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                Sheet
              </button>
            )}

            {/* Quick Admin Simulation controls if not final */}
            {isAdminLoggedIn && !isFinal && !linkedMatch && (
              <div className="flex gap-1">
                <button
                  onClick={() => handleSimulateAdvance(node, 'home')}
                  title={`Advance ${node.homeTeamName}`}
                  className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[9px] text-[#38bdf8] font-mono uppercase"
                >
                  W1
                </button>
                <button
                  onClick={() => handleSimulateAdvance(node, 'away')}
                  title={`Advance ${node.awayTeamName}`}
                  className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[9px] text-[#f97316] font-mono uppercase"
                >
                  W2
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header & Sport Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className={`w-5 h-5 ${isBasketball ? 'text-[#f97316]' : 'text-[#38bdf8]'}`} />
            <span className={`text-[11px] font-black uppercase tracking-widest ${isBasketball ? 'text-[#f97316]' : 'text-[#38bdf8]'}`}>
              OFFICIAL CHAMPIONSHIP PLAYOFF BRACKET
            </span>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
            {isBasketball ? 'Hardwood Basketball Championship Bracket' : 'FIVB Volleyball Playoff Tree'}
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

      {/* Championship Podium Banner */}
      {(bracket.champion || bracket.runnerUp || bracket.thirdPlace) && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-600/20 border border-amber-500/40 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 p-0.5 shadow-xl shrink-0">
                <div className="w-full h-full bg-[#10131a] rounded-[14px] flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black uppercase tracking-widest text-amber-300">
                    PODIUM FINISHERS CROWNED
                  </span>
                </div>
                <h3 className="font-heading font-black text-2xl text-white uppercase tracking-wide mt-0.5">
                  {bracket.champion} — Tournament Champion
                </h3>
              </div>
            </div>

            {/* Medal Badges */}
            <div className="flex items-center gap-3">
              {bracket.champion && (
                <div className="px-4 py-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-center">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1">
                    <Medal className="w-3 h-3" /> Gold Medalist
                  </div>
                  <div className="font-heading font-black text-sm text-white">{bracket.champion}</div>
                </div>
              )}
              {bracket.runnerUp && (
                <div className="px-4 py-2.5 rounded-2xl bg-slate-400/20 border border-slate-400/40 text-center">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center justify-center gap-1">
                    <Medal className="w-3 h-3" /> Silver Medalist
                  </div>
                  <div className="font-heading font-black text-sm text-white">{bracket.runnerUp}</div>
                </div>
              )}
              {bracket.thirdPlace && (
                <div className="px-4 py-2.5 rounded-2xl bg-amber-700/20 border border-amber-700/40 text-center">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 flex items-center justify-center gap-1">
                    <Medal className="w-3 h-3" /> Bronze Medalist
                  </div>
                  <div className="font-heading font-black text-sm text-white">{bracket.thirdPlace}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bracket Tree Columns */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[900px] grid grid-cols-3 gap-8">

          {/* COLUMN 1: QUARTERFINALS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-heading font-black text-sm uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#38bdf8]" />
                Quarterfinals (Best of 8)
              </span>
              <span className="text-[10px] text-white/40 uppercase font-mono">Round 1</span>
            </div>

            <div className="space-y-6">
              {qfNodes.map((node) => renderNodeCard(node))}
            </div>
          </div>

          {/* COLUMN 2: SEMIFINALS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-heading font-black text-sm uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#f97316]" />
                Semifinals (Final Four)
              </span>
              <span className="text-[10px] text-white/40 uppercase font-mono">Round 2</span>
            </div>

            <div className="space-y-20 pt-8">
              {sfNodes.map((node) => renderNodeCard(node))}
            </div>
          </div>

          {/* COLUMN 3: FINALS & BRONZE */}
          <div className="space-y-8">
            {/* Grand Championship Final */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-heading font-black text-sm uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Championship Final
                </span>
                <span className="text-[10px] text-amber-400/60 uppercase font-mono">Gold / Silver</span>
              </div>

              {finalsNode && renderNodeCard(finalsNode, true)}
            </div>

            {/* Bronze Medal Game */}
            <div className="space-y-3 pt-6">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-heading font-black text-sm uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <Medal className="w-4 h-4 text-amber-600" />
                  Bronze Medal Match
                </span>
                <span className="text-[10px] text-amber-600/60 uppercase font-mono">3rd Place</span>
              </div>

              {bronzeNode && renderNodeCard(bronzeNode)}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
