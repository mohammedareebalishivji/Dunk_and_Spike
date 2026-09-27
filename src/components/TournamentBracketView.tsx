import React, { useState, useEffect } from 'react';
import { 
  Sport, 
  Match, 
  TournamentBracket, 
  BracketMatchNode, 
  VolleyballTournamentConfig, 
  LeagueFixture, 
  LeagueStandingRow, 
  TournamentFormat 
} from '../types';
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
  ChevronRight,
  Lock,
  Unlock,
  Settings2,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Calendar,
  Grid,
  Radio,
  Info,
  Sliders,
  Check
} from 'lucide-react';
import { 
  generateInitialBracket, 
  synchronizeBracketWithMatches, 
  advanceBracketMatch 
} from '../utils/bracketManager';
import {
  getVolleyballTournamentConfig,
  saveVolleyballTournamentConfig,
  resetVolleyballTournamentConfig,
  generateVolleyballLeagueFixtures,
  calculateVolleyballLeagueStandings,
  generateCustomVolleyballBracket,
  DEFAULT_VOLLEYBALL_TEAMS,
  DEFAULT_LEAGUE_TEAMS,
} from '../utils/volleyballTournamentDesigner';

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

  // Volleyball Tournament Configuration (Admin Designed)
  const [vbConfig, setVbConfig] = useState<VolleyballTournamentConfig>(() => {
    return getVolleyballTournamentConfig();
  });

  // Admin Designer Modal / Panel Toggle
  const [isDesignerOpen, setIsDesignerOpen] = useState<boolean>(false);
  const [designerFormat, setDesignerFormat] = useState<TournamentFormat>(vbConfig.format);
  const [designerBracketSize, setDesignerBracketSize] = useState<4 | 8>(vbConfig.bracketSize);
  const [designerTeams, setDesignerTeams] = useState(vbConfig.customTeams);
  const [designerLeagueTeams, setDesignerLeagueTeams] = useState<string[]>(
    vbConfig.leagueTeams || DEFAULT_LEAGUE_TEAMS
  );
  const [newLeagueTeamInput, setNewLeagueTeamInput] = useState<string>('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  // Tournament Bracket State
  const [bracket, setBracket] = useState<TournamentBracket>(() => {
    if (selectedSport === 'volleyball') {
      return generateCustomVolleyballBracket(vbConfig, matches);
    }
    return generateInitialBracket('basketball');
  });

  // Volleyball League Fixtures & Standings
  const [leagueFixtures, setLeagueFixtures] = useState<LeagueFixture[]>(() => {
    return generateVolleyballLeagueFixtures(vbConfig.leagueTeams || DEFAULT_LEAGUE_TEAMS, matches);
  });

  const [leagueStandings, setLeagueStandings] = useState<LeagueStandingRow[]>(() => {
    return calculateVolleyballLeagueStandings(
      vbConfig.leagueTeams || DEFAULT_LEAGUE_TEAMS,
      leagueFixtures
    );
  });

  // Re-sync bracket & league whenever matches change or config updates
  useEffect(() => {
    if (selectedSport === 'volleyball') {
      const updatedBracket = generateCustomVolleyballBracket(vbConfig, matches);
      setBracket(updatedBracket);

      const fixtures = generateVolleyballLeagueFixtures(
        vbConfig.leagueTeams || DEFAULT_LEAGUE_TEAMS,
        matches
      );
      setLeagueFixtures(fixtures);
      setLeagueStandings(
        calculateVolleyballLeagueStandings(
          vbConfig.leagueTeams || DEFAULT_LEAGUE_TEAMS,
          fixtures
        )
      );
    } else {
      setBracket((prev) => {
        const base = prev.sport === 'basketball' ? prev : generateInitialBracket('basketball');
        return synchronizeBracketWithMatches(base, matches);
      });
    }
  }, [matches, selectedSport, vbConfig]);

  // Handle Admin Saving Volleyball Tournament Design
  const handleSaveTournamentDesign = () => {
    const updated = saveVolleyballTournamentConfig({
      format: designerFormat,
      bracketSize: designerBracketSize,
      customTeams: designerTeams,
      leagueTeams: designerLeagueTeams,
    });
    setVbConfig(updated);
    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
      setIsDesignerOpen(false);
    }, 1200);
  };

  // Handle Admin Resetting Volleyball Tournament Design
  const handleResetTournamentDesign = () => {
    const res = resetVolleyballTournamentConfig();
    setVbConfig(res);
    setDesignerFormat(res.format);
    setDesignerBracketSize(res.bracketSize);
    setDesignerTeams(res.customTeams);
    setDesignerLeagueTeams(res.leagueTeams || DEFAULT_LEAGUE_TEAMS);
    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
      setIsDesignerOpen(false);
    }, 1000);
  };

  const handleSimulateAdvance = (node: BracketMatchNode, winner: 'home' | 'away') => {
    const homeScore = winner === 'home' ? (isBasketball ? 95 : 3) : (isBasketball ? 84 : 1);
    const awayScore = winner === 'away' ? (isBasketball ? 95 : 3) : (isBasketball ? 84 : 1);
    setBracket((prev) => advanceBracketMatch(prev, node.id, winner, homeScore, awayScore));
  };

  const qfNodes = bracket.nodes.filter((n) => n.round === 'quarterfinals');
  const sfNodes = bracket.nodes.filter((n) => n.round === 'semifinals');
  const bronzeNode = bracket.nodes.find((n) => n.round === 'third_place');
  const finalsNode = bracket.nodes.find((n) => n.round === 'finals');

  const renderNodeCard = (node: BracketMatchNode, isHighlighted = false) => {
    const isLive = node.status === 'LIVE';
    const isFinal = node.status === 'FINAL';
    const homeWon = node.winner === 'home';
    const awayWon = node.winner === 'away';

    const linkedMatch = matches.find((m) => m.id === node.matchId);

    return (
      <div 
        key={node.id}
        className={`relative p-3.5 rounded-2xl border transition-all duration-200 ${
          isHighlighted
            ? 'bg-gradient-to-br from-[#101928] to-[#0c1017] border-[#38bdf8]/50 shadow-xl'
            : isLive
            ? 'bg-gradient-to-br from-[#121620] to-[#090d14] border-emerald-500/40 shadow-lg'
            : isFinal
            ? 'bg-[#0b0e14]/90 border-white/10'
            : 'bg-[#080b11]/80 border-white/10 hover:border-white/20'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/10 text-[10px]">
          <span className="font-heading font-black uppercase tracking-wider text-[#e0c0af] flex items-center gap-1">
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
              <span className="w-4 h-4 rounded bg-white/10 text-[10px] font-scoreboard font-bold flex items-center justify-center text-[#ff7a00]">
                {node.homeTeamSeed}
              </span>
            )}
            <span className={`text-xs font-heading font-black tracking-wide truncate ${
              homeWon ? 'text-white' : node.winner ? 'text-[#94a3b8]' : 'text-white'
            }`}>
              {node.homeTeamName}
            </span>
          </div>
          <span className={`font-scoreboard text-sm font-black tabular-nums ml-2 ${
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
              <span className="w-4 h-4 rounded bg-white/10 text-[10px] font-scoreboard font-bold flex items-center justify-center text-[#ff7a00]">
                {node.awayTeamSeed}
              </span>
            )}
            <span className={`text-xs font-heading font-black tracking-wide truncate ${
              awayWon ? 'text-white' : node.winner ? 'text-[#94a3b8]' : 'text-white'
            }`}>
              {node.awayTeamName}
            </span>
          </div>
          <span className={`font-scoreboard text-sm font-black tabular-nums ml-2 ${
            awayWon ? 'text-emerald-400' : 'text-white'
          }`}>
            {node.awayScore ?? (isFinal ? 0 : '-')}
          </span>
        </div>

        {/* Court and Actions */}
        <div className="mt-2.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px] text-[#e0c0af]">
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
                  className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[9px] text-[#38bdf8] font-scoreboard uppercase"
                >
                  W1
                </button>
                <button
                  onClick={() => handleSimulateAdvance(node, 'away')}
                  title={`Advance ${node.awayTeamName}`}
                  className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[9px] text-[#ff7a00] font-scoreboard uppercase"
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
            <Trophy className={`w-5 h-5 ${isBasketball ? 'text-[#ff7a00]' : 'text-[#38bdf8]'}`} />
            <span className={`text-[11px] font-black uppercase tracking-widest ${isBasketball ? 'text-[#ff7a00]' : 'text-[#38bdf8]'}`}>
              OFFICIAL CHAMPIONSHIP PLAYOFF BRACKET
            </span>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
            {isBasketball 
              ? 'Hardwood Basketball Championship Bracket' 
              : vbConfig.format === 'league' 
                ? 'FIVB Volleyball League System & Fixtures' 
                : 'FIVB Volleyball Playoff Tree'}
          </h2>
        </div>

        {/* Sport Switcher Tabs & Admin Design Trigger */}
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* Admin-Only FIVB Tournament Designer Trigger Button */}
          {!isBasketball && isAdminLoggedIn && (
            <button
              onClick={() => {
                setDesignerFormat(vbConfig.format);
                setDesignerBracketSize(vbConfig.bracketSize);
                setDesignerTeams(vbConfig.customTeams);
                setDesignerLeagueTeams(vbConfig.leagueTeams || DEFAULT_LEAGUE_TEAMS);
                setIsDesignerOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ea580c] hover:from-[#fb923c] hover:to-[#ff7a00] text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg glow-orange flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Settings2 className="w-4 h-4" />
              <span>Design Volleyball Playoff Tree</span>
            </button>
          )}

          <div className="flex items-center bg-[#090d14] p-1 rounded-2xl border border-white/10 shadow-inner">
            <button
              onClick={() => setSelectedSport('basketball')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-heading text-xs font-bold tracking-wider transition-all duration-200 ${
                isBasketball
                  ? 'bg-gradient-to-r from-[#ea580c] to-[#ff7a00] text-white shadow-md glow-orange'
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
      </div>

      {/* Admin Notice or Read-Only Shield Indicator */}
      {!isBasketball && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0e0e12] border border-white/10 text-xs">
          <div className="flex items-center gap-2 text-[#e0c0af]">
            <Shield className="w-4 h-4 text-[#38bdf8]" />
            <span>
              <strong>FIVB Volleyball System:</strong>{' '}
              {vbConfig.format === 'knockout' 
                ? `Single-Elimination Knockout (${vbConfig.bracketSize}-Team Playoff Tree)` 
                : 'Round-Robin League Matches with FIVB Point System'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isAdminLoggedIn ? (
              <span className="px-2.5 py-0.5 rounded-full bg-[#ff7a00]/20 text-[#ff7a00] border border-[#ff7a00]/30 font-heading font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Unlock className="w-3 h-3" />
                Admin Design Access Enabled
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-[#e0c0af] border border-white/10 font-heading font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#ff7a00]" />
                Admin Protected · Official Layout
              </span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADMIN-ONLY FIVB VOLLEYBALL PLAYOFF TREE & TOURNAMENT DESIGNER MODAL       */}
      {/* ========================================================================= */}
      {isDesignerOpen && isAdminLoggedIn && !isBasketball && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl glass-panel-elevated rounded-3xl border border-white/20 p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ff7a00]/20 border border-[#ff7a00]/40 flex items-center justify-center text-[#ff7a00]">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                    FIVB Tournament Format Designer
                  </h3>
                  <p className="text-xs text-[#e0c0af]">
                    Restricted to tournament administrators. Configure Knockout vs. League structure.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDesignerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* FORMAT SELECTOR: KNOCKOUT VS LEAGUE */}
            <div className="space-y-3">
              <label className="block font-heading font-black text-xs uppercase tracking-wider text-white">
                Select Tournament Competition Model
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Knockout Option */}
                <div
                  onClick={() => setDesignerFormat('knockout')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    designerFormat === 'knockout'
                      ? 'bg-[#ff7a00]/15 border-[#ff7a00] shadow-lg shadow-[#ff7a00]/20 ring-1 ring-[#ff7a00]'
                      : 'bg-[#0e0e12] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading font-black text-sm uppercase text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[#ff7a00]" />
                      Knockout Playoff Tree
                    </span>
                    {designerFormat === 'knockout' && (
                      <CheckCircle2 className="w-4 h-4 text-[#ff7a00]" />
                    )}
                  </div>
                  <p className="text-xs text-[#e0c0af] leading-relaxed">
                    Single elimination sudden-death bracket with Quarterfinals, Semifinals, Bronze Medal game, and Grand Final.
                  </p>
                </div>

                {/* League Option */}
                <div
                  onClick={() => setDesignerFormat('league')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    designerFormat === 'league'
                      ? 'bg-[#1e6bff]/15 border-[#1e6bff] shadow-lg shadow-[#1e6bff]/20 ring-1 ring-[#1e6bff]'
                      : 'bg-[#0e0e12] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading font-black text-sm uppercase text-white flex items-center gap-2">
                      <Grid className="w-4 h-4 text-[#38bdf8]" />
                      Round-Robin League Matches
                    </span>
                    {designerFormat === 'league' && (
                      <CheckCircle2 className="w-4 h-4 text-[#38bdf8]" />
                    )}
                  </div>
                  <p className="text-xs text-[#e0c0af] leading-relaxed">
                    All teams play against each other with official FIVB 3-2-1-0 standings, set ratios, and round fixtures.
                  </p>
                </div>
              </div>
            </div>

            {/* KNOCKOUT CONFIGURATION OPTIONS */}
            {designerFormat === 'knockout' && (
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="font-heading font-black text-xs uppercase tracking-wider text-white">
                    Bracket Tree Size
                  </label>
                  <div className="flex items-center gap-2 bg-[#0e0e12] p-1 rounded-full border border-white/10">
                    <button
                      onClick={() => setDesignerBracketSize(8)}
                      className={`px-3 py-1 rounded-full font-heading text-xs font-bold uppercase transition-all ${
                        designerBracketSize === 8
                          ? 'bg-[#ff7a00] text-white shadow'
                          : 'text-[#e0c0af] hover:text-white'
                      }`}
                    >
                      8 Teams (Quarterfinals)
                    </button>
                    <button
                      onClick={() => setDesignerBracketSize(4)}
                      className={`px-3 py-1 rounded-full font-heading text-xs font-bold uppercase transition-all ${
                        designerBracketSize === 4
                          ? 'bg-[#ff7a00] text-white shadow'
                          : 'text-[#e0c0af] hover:text-white'
                      }`}
                    >
                      4 Teams (Semifinals)
                    </button>
                  </div>
                </div>

                {/* Team Seeds & Matchups Editor */}
                <div className="space-y-2">
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-[#e0c0af] block">
                    Custom Seeds &amp; Team Allocations
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {Array.from({ length: designerBracketSize }).map((_, idx) => {
                      const team = designerTeams[idx] || { name: `Team ${idx + 1}`, seed: idx + 1, court: 'Court 1' };
                      return (
                        <div key={idx} className="p-3 rounded-xl bg-[#0e0e12] border border-white/5 flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-[#ff7a00]/20 text-[#ff7a00] font-scoreboard text-xs font-bold flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={team.name}
                            onChange={(e) => {
                              const updated = [...designerTeams];
                              updated[idx] = { ...team, name: e.target.value, seed: idx + 1 };
                              setDesignerTeams(updated);
                            }}
                            placeholder={`Seed ${idx + 1} Team Name`}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-white/30 focus:border-[#ff7a00] outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* LEAGUE CONFIGURATION OPTIONS */}
            {designerFormat === 'league' && (
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="font-heading font-black text-xs uppercase tracking-wider text-white">
                    League Participating Teams ({designerLeagueTeams.length} Teams)
                  </label>
                  <span className="text-[11px] text-[#38bdf8] font-scoreboard">
                    Berger Round-Robin Pairing
                  </span>
                </div>

                {/* Add new team input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newLeagueTeamInput}
                    onChange={(e) => setNewLeagueTeamInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLeagueTeamInput.trim()) {
                        setDesignerLeagueTeams([...designerLeagueTeams, newLeagueTeamInput.trim()]);
                        setNewLeagueTeamInput('');
                      }
                    }}
                    placeholder="Enter team name and press Add..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#38bdf8] outline-none"
                  />
                  <button
                    onClick={() => {
                      if (newLeagueTeamInput.trim()) {
                        setDesignerLeagueTeams([...designerLeagueTeams, newLeagueTeamInput.trim()]);
                        setNewLeagueTeamInput('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-heading font-bold text-xs uppercase tracking-wider"
                  >
                    + Add Team
                  </button>
                </div>

                {/* Team Badges List */}
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {designerLeagueTeams.map((team, idx) => (
                    <div 
                      key={idx} 
                      className="px-3 py-1.5 rounded-xl bg-[#0e0e12] border border-white/10 flex items-center gap-2 text-xs text-white"
                    >
                      <span className="font-heading font-bold">{team}</span>
                      <button
                        onClick={() => {
                          setDesignerLeagueTeams(designerLeagueTeams.filter((_, i) => i !== idx));
                        }}
                        className="text-white/40 hover:text-rose-400"
                        title="Remove team"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save & Reset Actions */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={handleResetTournamentDesign}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Baseline
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsDesignerOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-heading font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTournamentDesign}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ea580c] hover:from-[#fb923c] hover:to-[#ff7a00] text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg glow-orange flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  {saveSuccessNotice ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Design Applied!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Apply Tournament Design</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VOLLEYBALL LEAGUE MODE VIEW (IF DESIGNED BY ADMIN AS LEAGUE)              */}
      {/* ========================================================================= */}
      {!isBasketball && vbConfig.format === 'league' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* FIVB League Official Points Standings Table */}
          <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#ff7a00]" />
                <h3 className="font-heading font-black text-xl text-white uppercase tracking-wide">
                  Official FIVB Volleyball League Table
                </h3>
              </div>
              <span className="font-scoreboard text-xs text-[#38bdf8] font-bold">
                FIVB 3-2-1-0 Points Model
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-md text-xs sm:text-sm border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-[#0e0e12]/80 text-[#e0c0af] font-heading text-xs uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-lg">Rank</th>
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-3 text-center">Played</th>
                    <th className="py-2.5 px-3 text-center">Won</th>
                    <th className="py-2.5 px-3 text-center">Lost</th>
                    <th className="py-2.5 px-3 text-center">Sets (W-L)</th>
                    <th className="py-2.5 px-3 text-center">Set Ratio</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leagueStandings.map((row) => (
                    <tr key={row.teamName} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`w-6 h-6 rounded-full font-heading font-bold text-xs inline-flex items-center justify-center shadow-md ${
                          row.rank === 1
                            ? 'bg-[#FFD700] text-black font-black'
                            : row.rank === 2
                            ? 'bg-[#C0C0C0] text-black font-black'
                            : row.rank === 3
                            ? 'bg-[#CD7F32] text-white font-black'
                            : 'bg-white/10 text-white'
                        }`}>
                          {row.rank}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-heading font-bold text-white">
                        {row.teamName}
                      </td>
                      <td className="py-3 px-3 text-center font-scoreboard">{row.played}</td>
                      <td className="py-3 px-3 text-center font-scoreboard text-emerald-400 font-bold">{row.won}</td>
                      <td className="py-3 px-3 text-center font-scoreboard text-white/50">{row.lost}</td>
                      <td className="py-3 px-3 text-center font-scoreboard">
                        {row.setsWon}-{row.setsLost}
                      </td>
                      <td className="py-3 px-3 text-center font-scoreboard text-[#38bdf8]">
                        {row.setRatio}
                      </td>
                      <td className="py-3 px-3 text-right font-scoreboard text-base font-black text-[#ff7a00]">
                        {row.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-[#e0c0af]">
              <Info className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
              <span>
                <strong>FIVB Points Key:</strong> 3-0 or 3-1 win = 3 pts · 3-2 win = 2 pts · 2-3 loss = 1 pt · 0-3 or 1-3 loss = 0 pts.
              </span>
            </div>
          </div>

          {/* FIVB Round-Robin League Fixtures */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#38bdf8]" />
                <h3 className="font-heading font-black text-xl text-white uppercase tracking-wide">
                  League Fixtures &amp; Scheduled Matches
                </h3>
              </div>
              <span className="text-xs text-[#e0c0af] font-scoreboard">
                {leagueFixtures.length} Total Fixtures
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leagueFixtures.map((f) => {
                const isLive = f.status === 'LIVE';
                const isFinal = f.status === 'FINAL';

                return (
                  <div
                    key={f.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isLive 
                        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg' 
                        : isFinal
                        ? 'bg-[#0e0e12] border-white/10'
                        : 'bg-[#0e0e12]/70 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px]">
                      <span className="font-heading font-bold uppercase text-[#e0c0af]">
                        Round {f.round} · Match {f.matchNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                        isLive ? 'bg-emerald-500/20 text-emerald-400' : isFinal ? 'bg-white/10 text-white' : 'bg-white/5 text-[#94a3b8]'
                      }`}>
                        {f.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-heading font-bold ${f.winner === 'home' ? 'text-white' : 'text-white/80'}`}>
                          {f.homeTeamName}
                        </span>
                        <span className="font-scoreboard font-black text-sm text-white">
                          {f.homeSetsWon ?? '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-heading font-bold ${f.winner === 'away' ? 'text-white' : 'text-white/80'}`}>
                          {f.awayTeamName}
                        </span>
                        <span className="font-scoreboard font-black text-sm text-white">
                          {f.awaySetsWon ?? '-'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-[#e0c0af]">
                      <span>{f.court}</span>
                      {f.matchId && onSelectMatchToScore && (
                        <button
                          onClick={() => onSelectMatchToScore(f.matchId!)}
                          className="text-[#38bdf8] font-bold uppercase hover:underline"
                        >
                          View Console →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* KNOCKOUT PLAYOFF TREE VIEW (FOR BASKETBALL OR VOLLEYBALL KNOCKOUT)        */
        /* ========================================================================= */
        <>
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
            <div className={`min-w-[900px] grid ${qfNodes.length > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-8`}>

              {/* COLUMN 1: QUARTERFINALS (If 8-team bracket) */}
              {qfNodes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="font-heading font-black text-sm uppercase tracking-wider text-[#e0c0af] flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#38bdf8]" />
                      Quarterfinals (Best of 8)
                    </span>
                    <span className="text-[10px] text-white/40 uppercase font-scoreboard">Round 1</span>
                  </div>

                  <div className="space-y-6">
                    {qfNodes.map((node) => renderNodeCard(node))}
                  </div>
                </div>
              )}

              {/* COLUMN 2: SEMIFINALS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-heading font-black text-sm uppercase tracking-wider text-[#e0c0af] flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-[#ff7a00]" />
                    Semifinals (Final Four)
                  </span>
                  <span className="text-[10px] text-white/40 uppercase font-scoreboard">Round 2</span>
                </div>

                <div className={`space-y-16 ${qfNodes.length > 0 ? 'pt-8' : 'pt-2'}`}>
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
                    <span className="text-[10px] text-amber-400/60 uppercase font-scoreboard">Gold / Silver</span>
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
                    <span className="text-[10px] text-amber-600/60 uppercase font-scoreboard">3rd Place</span>
                  </div>

                  {bronzeNode && renderNodeCard(bronzeNode)}
                </div>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
};
