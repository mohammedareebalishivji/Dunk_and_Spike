import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Zap, 
  Flame, 
  ShieldCheck, 
  HelpCircle,
  Sliders,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  ChampionshipRules, 
  getChampionshipRules, 
  saveChampionshipRules, 
  resetChampionshipRules,
  DEFAULT_VOLLEYBALL_RULES,
  DEFAULT_BASKETBALL_RULES
} from '../utils/rulesManager';
import { VolleyballMatchFormat, Sport } from '../types';

interface RulesEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSport?: Sport;
}

export const RulesEditorModal: React.FC<RulesEditorModalProps> = ({
  isOpen,
  onClose,
  initialSport = 'volleyball',
}) => {
  const [activeTab, setActiveTab] = useState<Sport>(initialSport);
  const [rules, setRules] = useState<ChampionshipRules>(getChampionshipRules());
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setRules(getChampionshipRules());
      setActiveTab(initialSport);
      setSaveSuccess(false);
    }
  }, [isOpen, initialSport]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveChampionshipRules(rules);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  const handleReset = () => {
    if (window.confirm('Reset all championship rules to sanctioned FIVB / FIBA official defaults?')) {
      const reset = resetChampionshipRules();
      setRules(reset);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    }
  };

  const applyVolleyballPreset = (preset: 'vnl' | 'ncaa' | 'blitz') => {
    if (preset === 'vnl') {
      setRules(prev => ({
        ...prev,
        volleyball: { ...DEFAULT_VOLLEYBALL_RULES },
      }));
    } else if (preset === 'ncaa') {
      setRules(prev => ({
        ...prev,
        volleyball: {
          ...prev.volleyball,
          matchFormat: 'best-of-5',
          regularSetTargetPoints: 25,
          decidingSetTargetPoints: 15,
          courtSwitchAtPoints: 8,
          maxSubstitutionsPerSet: 12, // NCAA allows 12 substitutions per set
          timeoutsPerSet: 2,
          winByTwoPoints: true,
          allowMidSetSubstitutions: true,
        },
      }));
    } else if (preset === 'blitz') {
      setRules(prev => ({
        ...prev,
        volleyball: {
          ...prev.volleyball,
          matchFormat: 'best-of-3',
          regularSetTargetPoints: 15,
          decidingSetTargetPoints: 11,
          courtSwitchAtPoints: 6,
          maxSubstitutionsPerSet: 4,
          timeoutsPerSet: 1,
          winByTwoPoints: true,
          allowMidSetSubstitutions: true,
        },
      }));
    }
  };

  const applyBasketballPreset = (preset: 'fiba' | 'nba' | 'college') => {
    if (preset === 'fiba') {
      setRules(prev => ({
        ...prev,
        basketball: { ...DEFAULT_BASKETBALL_RULES },
      }));
    } else if (preset === 'nba') {
      setRules(prev => ({
        ...prev,
        basketball: {
          ...prev.basketball,
          quarterDurationMinutes: 12,
          overtimeDurationMinutes: 5,
          shotClockSeconds: 24,
          teamFoulsBonusThreshold: 5,
          playerFoulOutLimit: 6,
          timeoutsPerGame: 7,
          maxPlayersOnCourt: 5,
        },
      }));
    } else if (preset === 'college') {
      setRules(prev => ({
        ...prev,
        basketball: {
          ...prev.basketball,
          quarterDurationMinutes: 10,
          overtimeDurationMinutes: 5,
          shotClockSeconds: 30, // NCAA 30s shot clock
          teamFoulsBonusThreshold: 7, // 1-and-1 at 7
          teamFoulsDoubleBonusThreshold: 10,
          playerFoulOutLimit: 5,
          timeoutsPerGame: 4,
          maxPlayersOnCourt: 5,
        },
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Lighting */}
        <div 
          className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-300 ${
            activeTab === 'volleyball' ? 'bg-[#0284c7]' : 'bg-[#f97316]'
          }`} 
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#f97316] flex items-center justify-center text-white shadow-md">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                  ADMINISTRATION CONFIGURATION
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/15">
                  Live Engine
                </span>
              </div>
              <h3 className="font-heading font-black text-2xl text-white uppercase tracking-wider">
                Official Rules &amp; Scoring Settings
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sport Switcher Tabs */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-white/5 shrink-0">
          <button
            onClick={() => setActiveTab('volleyball')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'volleyball'
                ? 'bg-[#0284c7] text-white shadow-lg glow-blue'
                : 'text-[#94a3b8] hover:text-white bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4" />
            Volleyball Rules &amp; Subs
          </button>
          <button
            onClick={() => setActiveTab('basketball')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'basketball'
                ? 'bg-[#f97316] text-white shadow-lg glow-orange'
                : 'text-[#94a3b8] hover:text-white bg-white/5'
            }`}
          >
            <Flame className="w-4 h-4" />
            Basketball Rules &amp; Clocks
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="py-5 overflow-y-auto space-y-6 flex-1 pr-1 no-scrollbar">

          {/* ================= VOLLEYBALL RULES CONFIG ================= */}
          {activeTab === 'volleyball' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Quick Preset Selector */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                    Standard Presets
                  </span>
                  <span className="text-[10px] text-[#94a3b8]">Quick-fill sanctioned profiles</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyVolleyballPreset('vnl')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-[#0284c7]/20 border border-white/10 hover:border-[#38bdf8] text-left transition-all"
                  >
                    <span className="font-heading font-bold text-xs text-white block">FIVB / VNL</span>
                    <span className="text-[10px] text-[#94a3b8] block">25 pts · 6 subs/set</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyVolleyballPreset('ncaa')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-[#0284c7]/20 border border-white/10 hover:border-[#38bdf8] text-left transition-all"
                  >
                    <span className="font-heading font-bold text-xs text-white block">NCAA College</span>
                    <span className="text-[10px] text-[#94a3b8] block">25 pts · 12 subs/set</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyVolleyballPreset('blitz')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-[#0284c7]/20 border border-white/10 hover:border-[#38bdf8] text-left transition-all"
                  >
                    <span className="font-heading font-bold text-xs text-white block">Fast Blitz</span>
                    <span className="text-[10px] text-[#94a3b8] block">15 pts · 4 subs/set</span>
                  </button>
                </div>
              </div>

              {/* Set Target Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-heading font-bold uppercase text-white">
                      Regular Set Target Points
                    </label>
                    <span className="font-mono font-black text-sm text-[#38bdf8]">
                      {rules.volleyball.regularSetTargetPoints} PTS
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    step={1}
                    value={rules.volleyball.regularSetTargetPoints}
                    onChange={(e) => setRules(prev => ({
                      ...prev,
                      volleyball: { ...prev.volleyball, regularSetTargetPoints: Number(e.target.value) }
                    }))}
                    className="w-full accent-[#0284c7] cursor-pointer"
                  />
                  <p className="text-[10px] text-[#94a3b8]">
                    Sets 1 through 4 (standard FIVB: 25 points).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-heading font-bold uppercase text-white">
                      Deciding Set Target Points
                    </label>
                    <span className="font-mono font-black text-sm text-[#38bdf8]">
                      {rules.volleyball.decidingSetTargetPoints} PTS
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={25}
                    step={1}
                    value={rules.volleyball.decidingSetTargetPoints}
                    onChange={(e) => setRules(prev => ({
                      ...prev,
                      volleyball: { ...prev.volleyball, decidingSetTargetPoints: Number(e.target.value) }
                    }))}
                    className="w-full accent-[#0284c7] cursor-pointer"
                  />
                  <p className="text-[10px] text-[#94a3b8]">
                    Tiebreak set (Set 5 in best-of-5, Set 3 in best-of-3; standard: 15 points).
                  </p>
                </div>
              </div>

              {/* Substitutions & Mid-Set Substitution Config */}
              <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div>
                    <span className="text-xs font-heading font-black uppercase text-emerald-400 block">
                      Mid-Set &amp; Squad Substitution Rules
                    </span>
                    <span className="text-[10px] text-[#94a3b8]">
                      Regulates bench substitutions during sets from preexisting team members
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    FIVB Rule 15
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-heading font-bold uppercase text-white">
                        Max Substitutions Per Set
                      </label>
                      <span className="font-mono font-black text-sm text-emerald-400">
                        {rules.volleyball.maxSubstitutionsPerSet} / Team
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={rules.volleyball.maxSubstitutionsPerSet}
                      onChange={(e) => setRules(prev => ({
                        ...prev,
                        volleyball: { ...prev.volleyball, maxSubstitutionsPerSet: Number(e.target.value) }
                      }))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <p className="text-[10px] text-[#94a3b8] mt-1">
                      FIVB standard is 6 per set. High school/college allows up to 12.
                    </p>
                  </div>

                  <div className="flex flex-col justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Allow Mid-Set Substitutions</span>
                      <input
                        type="checkbox"
                        checked={rules.volleyball.allowMidSetSubstitutions}
                        onChange={(e) => setRules(prev => ({
                          ...prev,
                          volleyball: { ...prev.volleyball, allowMidSetSubstitutions: e.target.checked }
                        }))}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-[#94a3b8] mt-1.5">
                      Permits coaches to swap players on court with registered team bench members at any point during a live set.
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Volleyball Rules (Win-By-Two, Court Switch, Timeouts) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-bold uppercase text-white">Win By 2 Points</span>
                    <input
                      type="checkbox"
                      checked={rules.volleyball.winByTwoPoints}
                      onChange={(e) => setRules(prev => ({
                        ...prev,
                        volleyball: { ...prev.volleyball, winByTwoPoints: e.target.checked }
                      }))}
                      className="w-4 h-4 accent-[#0284c7] rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-[#94a3b8]">
                    Requires 2-point margin; triggers deuce when tied near target.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-bold uppercase text-white">Court Switch Point</span>
                    <span className="font-mono font-bold text-xs text-[#38bdf8]">
                      {rules.volleyball.courtSwitchAtPoints} PTS
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={12}
                    step={1}
                    value={rules.volleyball.courtSwitchAtPoints}
                    onChange={(e) => setRules(prev => ({
                      ...prev,
                      volleyball: { ...prev.volleyball, courtSwitchAtPoints: Number(e.target.value) }
                    }))}
                    className="w-full accent-[#0284c7] cursor-pointer"
                  />
                  <p className="text-[10px] text-[#94a3b8]">
                    In deciding set, switch sides at this score (FIVB: 8 pts).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-bold uppercase text-white">Timeouts / Set</span>
                    <span className="font-mono font-bold text-xs text-[#38bdf8]">
                      {rules.volleyball.timeoutsPerSet} TOs
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={4}
                    step={1}
                    value={rules.volleyball.timeoutsPerSet}
                    onChange={(e) => setRules(prev => ({
                      ...prev,
                      volleyball: { ...prev.volleyball, timeoutsPerSet: Number(e.target.value) }
                    }))}
                    className="w-full accent-[#0284c7] cursor-pointer"
                  />
                  <p className="text-[10px] text-[#94a3b8]">
                    Charged 30s timeouts allocated per team per set (FIVB: 2).
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* ================= BASKETBALL RULES CONFIG ================= */}
          {activeTab === 'basketball' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Quick Presets */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#f97316]" />
                    Standard Presets
                  </span>
                  <span className="text-[10px] text-[#94a3b8]">Quick-fill sanctioned profiles</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyBasketballPreset('fiba')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-[#f97316]/20 border border-white/10 hover:border-[#f97316] text-left transition-all"
                  >
                    <span className="font-heading font-bold text-xs text-white block">FIBA Standard</span>
                    <span className="text-[10px] text-[#94a3b8] block">10m Qtr · 24s · 5 Fouls</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBasketballPreset('nba')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-[#f97316]/20 border border-white/10 hover:border-[#f97316] text-left transition-all"
                  >
                    <span className="font-heading font-bold text-xs text-white block">Pro 12-Min</span>
                    <span className="text-[10px] text-[#94a3b8] block">12m Qtr · 24s · 6 Fouls</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBasketballPreset('college')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-[#f97316]/20 border border-white/10 hover:border-[#f97316] text-left transition-all"
                  >
                    <span className="font-heading font-bold text-xs text-white block">NCAA Format</span>
                    <span className="text-[10px] text-[#94a3b8] block">10m Qtr · 30s Clock</span>
                  </button>
                </div>
              </div>

              {/* Quarter & Overtime Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-heading font-bold uppercase text-white">Quarter Length</label>
                    <span className="font-mono font-black text-sm text-[#f97316]">
                      {rules.basketball.quarterDurationMinutes} MIN
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={15}
                    step={1}
                    value={rules.basketball.quarterDurationMinutes}
                    onChange={(e) => setRules(prev => ({
                      ...prev,
                      basketball: { ...prev.basketball, quarterDurationMinutes: Number(e.target.value) }
                    }))}
                    className="w-full accent-[#f97316] cursor-pointer"
                  />
                  <p className="text-[10px] text-[#94a3b8]">
                    Standard FIBA: 10 minutes; NBA: 12 minutes.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-heading font-bold uppercase text-white">Overtime Length</label>
                    <span className="font-mono font-black text-sm text-[#f97316]">
                      {rules.basketball.overtimeDurationMinutes} MIN
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={10}
                    step={1}
                    value={rules.basketball.overtimeDurationMinutes}
                    onChange={(e) => setRules(prev => ({
                      ...prev,
                      basketball: { ...prev.basketball, overtimeDurationMinutes: Number(e.target.value) }
                    }))}
                    className="w-full accent-[#f97316] cursor-pointer"
                  />
                  <p className="text-[10px] text-[#94a3b8]">
                    Duration of extra periods when tied in Q4 (standard: 5m).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-heading font-bold uppercase text-white">Shot Clock</label>
                    <span className="font-mono font-black text-sm text-[#f97316]">
                      {rules.basketball.shotClockSeconds} SEC
                    </span>
                  </div>
                  <input
                    type="range"
                    min={14}
                    max={35}
                    step={1}
                    value={rules.basketball.shotClockSeconds}
                    onChange={(e) => setRules(prev => ({
                      ...prev,
                      basketball: { ...prev.basketball, shotClockSeconds: Number(e.target.value) }
                    }))}
                    className="w-full accent-[#f97316] cursor-pointer"
                  />
                  <p className="text-[10px] text-[#94a3b8]">
                    Possession countdown (FIBA: 24s, NCAA: 30s).
                  </p>
                </div>
              </div>

              {/* Fouls, Bonus & On-Court Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-heading font-bold uppercase text-white">Team Bonus Fouls</label>
                    <span className="font-mono font-black text-sm text-amber-400">
                      {rules.basketball.teamFoulsBonusThreshold} Fouls
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={8}
                    step={1}
                    value={rules.basketball.teamFoulsBonusThreshold}
                    onChange={(e) => setRules(prev => ({
                      ...prev,
                      basketball: { ...prev.basketball, teamFoulsBonusThreshold: Number(e.target.value) }
                    }))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-[#94a3b8]">
                    Team fouls in a quarter before penalty free throws are awarded (standard: 5).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-heading font-bold uppercase text-white">Player Foul Out</label>
                    <span className="font-mono font-black text-sm text-rose-400">
                      {rules.basketball.playerFoulOutLimit} Fouls
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={6}
                    step={1}
                    value={rules.basketball.playerFoulOutLimit}
                    onChange={(e) => setRules(prev => ({
                      ...prev,
                      basketball: { ...prev.basketball, playerFoulOutLimit: Number(e.target.value) }
                    }))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-[#94a3b8]">
                    Personal fouls before a player is disqualified (FIBA: 5, NBA: 6).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-heading font-bold uppercase text-white">Court Players</label>
                    <span className="font-mono font-black text-sm text-emerald-400">
                      Strictly 5 Players
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300">
                    Regulation basketball strictly enforces exactly 5 active players on court at all times. Other 3 players on the 8-player roster remain benched.
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Feedback Banner */}
        {saveSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-between text-emerald-300 text-xs animate-in zoom-in-95 duration-150 shrink-0">
            <div className="flex items-center gap-2 font-heading font-bold uppercase">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Championship Rules Successfully Saved &amp; Applied!</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">Syncing with live engine...</span>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white text-xs font-heading font-bold uppercase transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Official Defaults</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white text-xs font-heading font-bold uppercase transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] via-[#38bdf8] to-[#0284c7] hover:brightness-110 text-white text-xs font-heading font-black uppercase tracking-wider shadow-lg glow-blue flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Apply Rules</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
