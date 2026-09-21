import React, { useState, useEffect, useMemo } from 'react';
import { Player, Team, Sport } from '../types';
import { 
  X, 
  ArrowLeftRight, 
  UserMinus, 
  UserPlus, 
  ShieldCheck, 
  AlertTriangle, 
  Shirt, 
  CheckCircle2, 
  Plus,
  Users,
  Sparkles
} from 'lucide-react';
import { 
  MAX_VOLLEYBALL_SUBS_PER_SET, 
  getOnCourtPlayers, 
  getBenchPlayers 
} from '../utils/substitutionManager';
import { getChampionshipRules } from '../utils/rulesManager';
import { getPreexistingTeams } from '../data/preexistingTeams';

interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: 'home' | 'away';
  teamData: Team;
  sport: Sport;
  currentPeriod: string;
  initialPlayerOutId?: string;
  onConfirmSubstitution: (playerOut: Player, playerIn: Player) => void;
}

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  isOpen,
  onClose,
  team,
  teamData,
  sport,
  currentPeriod,
  initialPlayerOutId,
  onConfirmSubstitution,
}) => {
  const isVolleyball = sport === 'volleyball';
  const rules = getChampionshipRules();
  const maxSubsAllowed = isVolleyball 
    ? (rules.volleyball?.maxSubstitutionsPerSet ?? MAX_VOLLEYBALL_SUBS_PER_SET)
    : 999;
  const allowMidSet = isVolleyball ? (rules.volleyball?.allowMidSetSubstitutions ?? true) : true;

  const players = teamData.players || [];
  const subsUsed = teamData.substitutionsUsed || 0;
  const isMaxReached = isVolleyball && subsUsed >= maxSubsAllowed;

  const onCourtPlayers = getOnCourtPlayers(players, sport);

  // Discover bench players: from team.players first, plus any preexisting team registered members
  const initialBenchPlayers = useMemo(() => {
    let bench = getBenchPlayers(players, sport);
    
    // Ensure all 8 registered squad members are available if this team was created from presets
    if (teamData.name || teamData.id) {
      const presetTeams = getPreexistingTeams(sport);
      const matched = presetTeams.find(t => 
        (teamData.id && t.id === teamData.id) || 
        (teamData.name && t.name.toLowerCase() === teamData.name.toLowerCase())
      );
      if (matched && matched.players) {
        const existingIds = new Set(players.map(p => p.id));
        const existingNames = new Set(players.map(p => p.name.toLowerCase()));
        
        const registeredSquadReserves = matched.players.filter(p => 
          !existingIds.has(p.id) && !existingNames.has(p.name.toLowerCase())
        );

        if (registeredSquadReserves.length > 0) {
          bench = [...bench, ...registeredSquadReserves];
        }
      }
    }
    return bench;
  }, [players, sport, teamData.id, teamData.name]);

  const [extraBench, setExtraBench] = useState<Player[]>([]);
  const allBenchPlayers = useMemo(() => {
    return [...initialBenchPlayers, ...extraBench];
  }, [initialBenchPlayers, extraBench]);

  const [selectedOutId, setSelectedOutId] = useState<string>('');
  const [selectedInId, setSelectedInId] = useState<string>('');

  // Quick Register New Substitute Player State
  const [isAddingNewSub, setIsAddingNewSub] = useState<boolean>(false);
  const [newSubName, setNewSubName] = useState<string>('');
  const [newSubNumber, setNewSubNumber] = useState<number>(14);
  const [newSubPosition, setNewSubPosition] = useState<string>(
    isVolleyball ? 'Setter' : 'Guard'
  );

  // Synchronize state when modal is opened or props change
  useEffect(() => {
    if (isOpen) {
      const court = getOnCourtPlayers(teamData.players || [], sport);
      const defaultOut = (initialPlayerOutId && court.find(p => p.id === initialPlayerOutId))
        ? initialPlayerOutId
        : (court[0]?.id || '');
      
      setSelectedOutId(defaultOut);
      setSelectedInId(allBenchPlayers[0]?.id || '');
      setExtraBench([]);
      setIsAddingNewSub(false);
      setNewSubName('');
    }
  }, [isOpen, teamData.id, initialPlayerOutId, sport, allBenchPlayers.length]);

  if (!isOpen) return null;

  const playerOut = players.find(p => p.id === selectedOutId) || onCourtPlayers[0];
  let playerIn = allBenchPlayers.find(p => p.id === selectedInId);

  const handleCreateAndSelectNewSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const createdSub: Player = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newSubName.trim(),
      number: newSubNumber,
      position: newSubPosition,
      points: 0,
      kills: 0,
      aces: 0,
      blocks: 0,
      twoPointers: 0,
      threePointers: 0,
      freeThrows: 0,
      isOnCourt: false,
    };

    // Auto-select this player as incoming player
    setExtraBench(prev => [...prev, createdSub]);
    setSelectedInId(createdSub.id);
    setIsAddingNewSub(false);
    setNewSubName('');
  };

  const handleConfirm = () => {
    if (!playerOut || (!playerIn && !newSubName.trim())) return;
    if (isMaxReached) {
      alert(`Cannot substitute: Maximum ${maxSubsAllowed} substitutions allowed per set (Championship Rules).`);
      return;
    }

    if (!playerIn && newSubName.trim()) {
      playerIn = {
        id: `p-${Date.now()}`,
        name: newSubName.trim(),
        number: newSubNumber,
        position: newSubPosition,
        points: 0,
        isOnCourt: true,
      };
    }

    if (playerOut && playerIn) {
      onConfirmSubstitution(playerOut, playerIn);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div 
          className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: teamData.logoColor }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-heading font-black text-lg shadow-md border border-white/20"
              style={{ backgroundColor: teamData.logoColor }}
            >
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#38bdf8]">
                  {isVolleyball ? 'MID-SET & MID-MATCH SQUAD SUBSTITUTION' : 'OFFICIAL PLAYER SUBSTITUTION'}
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/15">
                  {currentPeriod}
                </span>
              </div>
              <h3 className="font-heading font-black text-2xl text-white uppercase tracking-wide">
                {teamData.name}
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

        {/* Substitution Count Rule Indicator */}
        <div className="my-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
            <span className="text-white font-semibold">
              {isVolleyball 
                ? `Championship Rule 15: Max ${maxSubsAllowed} substitutions per set` 
                : 'FIBA / NCAA: Unlimited dead-ball substitutions (5 on court)'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#94a3b8] uppercase font-bold">Subs Used:</span>
            <span className={`px-2 py-0.5 rounded-full font-mono font-black text-xs ${
              isMaxReached 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isVolleyball ? `${subsUsed}/${maxSubsAllowed}` : `${subsUsed}`}
            </span>
          </div>
        </div>

        {/* Informational Callout for Volleyball Mid-Set Substitution */}
        {isVolleyball && (
          <div className="mb-4 p-2.5 rounded-xl bg-[#0284c7]/10 border border-[#38bdf8]/30 flex items-center gap-2 text-xs text-[#38bdf8]">
            <Sparkles className="w-4 h-4 shrink-0 text-[#38bdf8]" />
            <span>
              <strong>Mid-Set Substitution:</strong> Select an on-court starter to rotate out and an existing squad member from the bench to enter play.
            </span>
          </div>
        )}

        {isMaxReached && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              <strong>Limit Reached:</strong> All {maxSubsAllowed} substitutions for this set have been exhausted. No further substitutions are permitted until the next set begins.
            </span>
          </div>
        )}

        {/* Substitution Two-Column Selection: OUT vs IN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-4">
          
          {/* Column 1: Player Leaving Court (OUT) */}
          <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-heading font-black text-xs uppercase text-rose-400 flex items-center gap-1.5">
                <UserMinus className="w-4 h-4" />
                Player Leaving Court (OUT)
              </span>
              <span className="text-[10px] text-[#94a3b8] font-mono">
                {onCourtPlayers.length} On Court
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 no-scrollbar">
              {onCourtPlayers.map((p) => {
                const isSelected = p.id === selectedOutId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedOutId(p.id)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? 'bg-rose-500/20 border-rose-500/60 shadow glow-red'
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-rose-400 shrink-0">
                        #{p.number}
                      </span>
                      <div className="min-w-0">
                        <span className="font-heading font-bold text-xs text-white block truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-[#94a3b8] block">
                          {p.position} · {p.points} PTS
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-rose-400 uppercase bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
                        OUT
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Player Entering Court (IN) */}
          <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-heading font-black text-xs uppercase text-emerald-400 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                Player Entering Court (IN)
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNewSub(!isAddingNewSub)}
                className="text-[10px] font-bold text-[#38bdf8] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {isAddingNewSub ? 'Cancel' : '+ Add Sub'}
              </button>
            </div>

            {/* Quick Register Inline Form for Substitute */}
            {isAddingNewSub && (
              <form onSubmit={handleCreateAndSelectNewSub} className="p-2.5 bg-white/5 border border-[#38bdf8]/40 rounded-xl space-y-2 animate-in fade-in duration-150">
                <span className="text-[10px] font-bold uppercase text-white block">
                  Quick Register Substitute:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="Full Name"
                    className="col-span-2 px-2 py-1 bg-[#121824] border border-white/15 rounded text-[11px] text-white outline-none focus:border-[#38bdf8]"
                    required
                  />
                  <input
                    type="number"
                    value={newSubNumber}
                    onChange={(e) => setNewSubNumber(Number(e.target.value))}
                    placeholder="#"
                    min={0}
                    max={99}
                    className="px-2 py-1 bg-[#121824] border border-white/15 rounded text-[11px] text-white font-mono font-bold text-center outline-none focus:border-[#38bdf8]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1 rounded bg-[#0284c7] hover:bg-[#38bdf8] text-white font-heading font-bold text-[10px] uppercase transition-colors"
                >
                  Register &amp; Select
                </button>
              </form>
            )}

            {/* Available Bench Players List (Pre-existing Squad Members) */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 no-scrollbar">
              {allBenchPlayers.length === 0 && !isAddingNewSub ? (
                <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
                  <Users className="w-6 h-6 text-[#94a3b8] mx-auto mb-1 opacity-60" />
                  <p className="text-[11px] text-[#94a3b8]">
                    No bench reserves currently listed.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewSub(true)}
                    className="mt-2 text-xs font-bold text-[#38bdf8] hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Substitute Player
                  </button>
                </div>
              ) : (
                allBenchPlayers.map((p) => {
                  const isSelected = p.id === selectedInId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedInId(p.id)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500/60 shadow glow-green'
                          : 'bg-white/5 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-emerald-400 shrink-0">
                          #{p.number}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading font-bold text-xs text-white block truncate">
                              {p.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/40 uppercase shrink-0">
                              Squad Bench
                            </span>
                          </div>
                          <span className="text-[10px] text-[#94a3b8] block">
                            {p.position} · Registered Member
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          IN
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Summary Bar */}
        {playerOut && playerIn && (
          <div className="p-3.5 rounded-2xl bg-[#121824] border border-white/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="text-rose-400 font-mono font-bold">
                OUT: #{playerOut.number} {playerOut.name}
              </span>
              <ArrowLeftRight className="w-4 h-4 text-[#38bdf8]" />
              <span className="text-emerald-400 font-mono font-bold">
                IN: #{playerIn.number} {playerIn.name}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#94a3b8]">
              {teamData.shortName}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white text-xs font-heading font-bold uppercase transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isMaxReached || !playerOut || (!playerIn && !newSubName.trim())}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-heading font-black uppercase tracking-wider shadow-lg glow-blue transition-all active:scale-95 flex items-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Confirm Official Substitution
          </button>
        </div>
      </div>
    </div>
  );
};
