import React, { useState, useEffect } from 'react';
import { Match, SetScore, VolleyballMatchFormat } from '../types';
import { 
  X, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Save, 
  Trophy, 
  ArrowRight, 
  Plus, 
  Minus,
  Sparkles,
  ArrowLeftRight
} from 'lucide-react';
import { 
  evaluateVolleyballScore, 
  getBaseTargetPoints, 
  isDecidingSetNumber, 
  getSetsToWin 
} from '../utils/volleyballRules';

interface VolleyballSetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  initialSetNumber?: number;
  onApplyEdit: (
    matchId: string, 
    setNumber: number, 
    homeScore: number, 
    awayScore: number, 
    continueFromSet: boolean
  ) => void;
  onAdvanceSet?: (matchId: string) => void;
  onOpenSubstitution?: (team: 'home' | 'away') => void;
}

export const VolleyballSetEditModal: React.FC<VolleyballSetEditModalProps> = ({
  isOpen,
  onClose,
  match,
  initialSetNumber,
  onApplyEdit,
  onAdvanceSet,
  onOpenSubstitution,
}) => {
  const format: VolleyballMatchFormat = match.volleyballFormat || 'best-of-5';
  const totalMaxSets = format === 'best-of-3' ? 3 : 5;
  const currentLiveSet = match.currentSetNumber || 1;

  const [selectedSet, setSelectedSet] = useState<number>(initialSetNumber || currentLiveSet);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);

  // Sync state when modal opens or selected set changes
  useEffect(() => {
    const setToLoad = initialSetNumber || match.currentSetNumber || 1;
    setSelectedSet(setToLoad);
    loadScoresForSet(setToLoad);
  }, [isOpen, initialSetNumber, match.id]);

  const loadScoresForSet = (setNum: number) => {
    setSelectedSet(setNum);
    const existing = match.setScores?.find(s => s.set === setNum);
    if (existing) {
      setHomeScore(existing.homeScore);
      setAwayScore(existing.awayScore);
    } else if (setNum === match.currentSetNumber) {
      setHomeScore(match.homeTeam.score);
      setAwayScore(match.awayTeam.score);
    } else {
      setHomeScore(0);
      setAwayScore(0);
    }
  };

  if (!isOpen) return null;

  // Calculate prior sets won strictly before selectedSet
  const completedBefore = (match.setScores || []).filter(s => s.set < selectedSet && s.isCompleted);
  const homeSetsBefore = completedBefore.filter(s => s.winner === 'home').length;
  const awaySetsBefore = completedBefore.filter(s => s.winner === 'away').length;

  // Evaluate candidate score with official FIVB rules
  const evalResult = evaluateVolleyballScore(
    homeScore,
    awayScore,
    selectedSet,
    format,
    homeSetsBefore,
    awaySetsBefore
  );

  const isDeciding = isDecidingSetNumber(selectedSet, format);
  const baseTarget = getBaseTargetPoints(selectedSet, format);

  const handleApply = (continueFromSet: boolean) => {
    onApplyEdit(match.id, selectedSet, homeScore, awayScore, continueFromSet);
    onClose();
  };

  const handleAdvanceToNext = () => {
    if (onAdvanceSet) {
      onAdvanceSet(match.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-20 bg-[#0284c7] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0284c7] flex items-center justify-center text-white shadow-md font-heading font-black text-lg">
              🏐
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-[#38bdf8] block">
                VOLLEYBALL SCORE &amp; SET PROGRESSION
              </span>
              <h3 className="font-heading font-black text-2xl text-white uppercase tracking-wider">
                Change Score or Continue Set
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

        {/* Set Selection Tabs */}
        <div className="my-5 relative z-10">
          <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block mb-2">
            Select Set to Modify:
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {Array.from({ length: totalMaxSets }, (_, i) => i + 1).map((setNum) => {
              const existingRecord = match.setScores?.find(s => s.set === setNum);
              const isSelected = selectedSet === setNum;
              const isCurrent = match.currentSetNumber === setNum;
              const isComp = existingRecord?.isCompleted;

              return (
                <button
                  key={setNum}
                  type="button"
                  onClick={() => loadScoresForSet(setNum)}
                  className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-[#0284c7] border-[#38bdf8] text-white shadow-lg glow-blue scale-[1.02]'
                      : 'bg-black/30 border-white/10 text-[#94a3b8] hover:bg-white/5 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider block">
                    {setNum === totalMaxSets && (format === 'best-of-5' || format === 'best-of-3')
                      ? `SET ${setNum} (TB)`
                      : `SET ${setNum}`}
                  </span>
                  <span className="text-xs font-mono font-black tabular-nums mt-0.5 block">
                    {existingRecord ? `${existingRecord.homeScore}-${existingRecord.awayScore}` : isCurrent ? `${match.homeTeam.score}-${match.awayTeam.score}` : '0-0'}
                  </span>
                  {isComp ? (
                    <span className="text-[8px] text-emerald-400 font-bold uppercase mt-0.5">
                      ✓ Completed
                    </span>
                  ) : isCurrent ? (
                    <span className="text-[8px] text-[#38bdf8] font-bold uppercase mt-0.5">
                      ● Active
                    </span>
                  ) : (
                    <span className="text-[8px] text-[#64748b] font-bold uppercase mt-0.5">
                      Pending
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Score Adjuster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 relative z-10">
          {/* Home Team Box */}
          <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <span 
                className="w-3.5 h-3.5 rounded-full inline-block" 
                style={{ backgroundColor: match.homeTeam.logoColor }} 
              />
              <span className="font-heading font-black text-white text-sm uppercase truncate">
                {match.homeTeam.name}
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setHomeScore(prev => Math.max(0, prev - 5))}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-[#94a3b8] hover:text-white font-mono text-xs font-bold transition-all"
                  title="Subtract 5"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => setHomeScore(prev => Math.max(0, prev - 1))}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-[#94a3b8] hover:text-white flex items-center justify-center transition-all"
                  title="Subtract 1"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <input
                type="number"
                min={0}
                max={99}
                value={homeScore}
                onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 text-center font-heading font-black text-3xl text-white bg-transparent outline-none tabular-nums"
              />

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setHomeScore(prev => prev + 1)}
                  className="w-8 h-8 rounded-lg bg-[#0284c7]/30 hover:bg-[#0284c7]/50 text-[#38bdf8] flex items-center justify-center transition-all"
                  title="Add 1"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setHomeScore(prev => prev + 5)}
                  className="w-8 h-8 rounded-lg bg-[#0284c7]/30 hover:bg-[#0284c7]/50 text-[#38bdf8] font-mono text-xs font-bold transition-all"
                  title="Add 5"
                >
                  +5
                </button>
              </div>
            </div>
          </div>

          {/* Away Team Box */}
          <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <span 
                className="w-3.5 h-3.5 rounded-full inline-block" 
                style={{ backgroundColor: match.awayTeam.logoColor }} 
              />
              <span className="font-heading font-black text-white text-sm uppercase truncate">
                {match.awayTeam.name}
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAwayScore(prev => Math.max(0, prev - 5))}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-[#94a3b8] hover:text-white font-mono text-xs font-bold transition-all"
                  title="Subtract 5"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => setAwayScore(prev => Math.max(0, prev - 1))}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-[#94a3b8] hover:text-white flex items-center justify-center transition-all"
                  title="Subtract 1"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <input
                type="number"
                min={0}
                max={99}
                value={awayScore}
                onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 text-center font-heading font-black text-3xl text-white bg-transparent outline-none tabular-nums"
              />

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAwayScore(prev => prev + 1)}
                  className="w-8 h-8 rounded-lg bg-[#f97316]/30 hover:bg-[#f97316]/50 text-[#fb923c] flex items-center justify-center transition-all"
                  title="Add 1"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAwayScore(prev => prev + 5)}
                  className="w-8 h-8 rounded-lg bg-[#f97316]/30 hover:bg-[#f97316]/50 text-[#fb923c] font-mono text-xs font-bold transition-all"
                  title="Add 5"
                >
                  +5
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Rule Outcome Callout */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs relative z-10 mb-6 ${
          evalResult.isSetWon
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : evalResult.isDeuce
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : evalResult.pointSpecialBadge
            ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
            : 'bg-white/5 border-white/10 text-[#94a3b8]'
        }`}>
          <div className="flex items-center gap-2">
            {evalResult.isSetWon ? (
              <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : evalResult.isDeuce ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#38bdf8] shrink-0" />
            )}
            <div>
              <strong className="text-white block font-heading uppercase">
                {evalResult.isSetWon
                  ? `SET ${selectedSet} WON BY ${evalResult.setWinner === 'home' ? match.homeTeam.name : match.awayTeam.name}!`
                  : evalResult.isDeuce
                  ? `DEUCE ACTIVE (Must win by 2 points · Target: ${evalResult.currentTarget})`
                  : evalResult.pointSpecialBadge
                  ? `${evalResult.pointSpecialBadge} (${homeScore > awayScore ? match.homeTeam.name : match.awayTeam.name} leads)`
                  : `SET IN PROGRESS (Target: ${baseTarget} pts · ${isDeciding ? 'Deciding Set to 15' : 'Standard to 25'})`}
              </strong>
              <span className="text-[11px] opacity-80">
                {evalResult.isSetWon
                  ? evalResult.isMatchWon 
                    ? 'This set win clinches the entire match!' 
                    : 'Set is complete. You can continue match from this set or advance to next set.'
                  : 'Playing this set will continue live action with this exact score.'}
              </span>
            </div>
          </div>

          <span className="font-mono font-bold text-xs tabular-nums text-white bg-black/40 px-2.5 py-1 rounded-lg shrink-0">
            Target: {evalResult.currentTarget}
          </span>
        </div>

        {/* Mid-Set Squad Substitution Trigger */}
        {onOpenSubstitution && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-white font-bold block">Mid-Set Squad Substitution:</span>
                <span className="text-[11px] text-[#94a3b8]">Swap on-court starters with bench squad members</span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSubstitution('home');
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/20 text-white hover:text-emerald-300 text-[11px] font-heading font-bold uppercase border border-white/15 hover:border-emerald-500/30 flex items-center gap-1.5 transition-all"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: match.homeTeam.logoColor }} />
                <span>Sub {match.homeTeam.shortName}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSubstitution('away');
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/20 text-white hover:text-emerald-300 text-[11px] font-heading font-bold uppercase border border-white/15 hover:border-emerald-500/30 flex items-center gap-1.5 transition-all"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: match.awayTeam.logoColor }} />
                <span>Sub {match.awayTeam.shortName}</span>
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-white/10 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white font-heading font-bold text-xs uppercase transition-colors"
          >
            Cancel
          </button>

          {/* Option: Save Score for this set record only (e.g. historical correction) */}
          <button
            type="button"
            onClick={() => handleApply(false)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs uppercase border border-white/15 flex items-center justify-center gap-1.5 transition-all"
            title="Update this set's record without changing the active live set"
          >
            <Save className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Update Set {selectedSet} Record Only</span>
          </button>

          {/* Option: Continue / Resume Match from this Set */}
          <button
            type="button"
            onClick={() => handleApply(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg glow-emerald flex items-center justify-center gap-2 transition-all"
            title="Set this score and continue playing the match from this set"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Continue from Set {selectedSet}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
