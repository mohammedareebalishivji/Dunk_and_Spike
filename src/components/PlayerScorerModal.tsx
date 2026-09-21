import React, { useState } from 'react';
import { Player, Sport } from '../types';
import { 
  X, 
  UserCheck, 
  Flame, 
  Zap, 
  Trophy, 
  PlusCircle, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface PlayerScorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: 'home' | 'away';
  teamName: string;
  teamColor: string;
  points: number;
  label: string;
  eventType: 'SCORE' | 'FOUL' | 'TIMEOUT' | 'BLOCK' | 'ACE' | 'SPIKE' | 'REBOUND' | 'ASSIST' | 'STEAL' | 'TURNOVER';
  players: Player[];
  sport: Sport;
  onSelectPlayer: (player?: Player) => void;
  onQuickAddPlayer?: (name: string, number: number, position: string) => void;
}

export const PlayerScorerModal: React.FC<PlayerScorerModalProps> = ({
  isOpen,
  onClose,
  team,
  teamName,
  teamColor,
  points,
  label,
  eventType,
  players,
  sport,
  onSelectPlayer,
  onQuickAddPlayer,
}) => {
  const isBasketball = sport === 'basketball';
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState(7);
  const [newPosition, setNewPosition] = useState(
    isBasketball ? 'Point Guard' : 'Outside Hitter'
  );

  if (!isOpen) return null;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !onQuickAddPlayer) return;
    onQuickAddPlayer(newName.trim(), newNumber, newPosition);
    setIsAddingNew(false);
    setNewName('');
  };

  // Sort players: on-court players first, then bench players
  const sortedPlayers = [...players].sort((a, b) => {
    const aOn = a.isOnCourt !== false;
    const bOn = b.isOnCourt !== false;
    if (aOn && !bOn) return -1;
    if (!aOn && bOn) return 1;
    return a.number - b.number;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div 
          className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: teamColor }}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md font-heading font-black text-lg"
              style={{ backgroundColor: teamColor }}
            >
              {isBasketball ? <Flame className="w-5 h-5 text-amber-300" /> : <Zap className="w-5 h-5 text-[#38bdf8]" />}
            </div>
            <div>
              <span className={`text-[11px] font-black uppercase tracking-widest block ${isBasketball ? 'text-[#fb923c]' : 'text-[#38bdf8]'}`}>
                {isBasketball ? '🏀 OFFICIAL BASKETBALL SCORER ATTRIBUTION' : '🏐 OFFICIAL FIVB SCORER ATTRIBUTION'}
              </span>
              <h3 className="font-heading font-black text-2xl text-white uppercase tracking-wider">
                {isBasketball ? 'Who scored this basket?' : 'Which player scored this point?'}
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

        {/* Action Details Badge */}
        <div className="my-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full inline-block" 
              style={{ backgroundColor: teamColor }} 
            />
            <span className="font-heading font-black uppercase text-white text-sm">
              {teamName}
            </span>
          </div>
          <span className={`px-3 py-1 rounded-full font-heading font-bold text-xs uppercase border ${
            isBasketball 
              ? 'bg-[#f97316]/20 text-[#fb923c] border-[#f97316]/30' 
              : 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]/30'
          }`}>
            {isBasketball ? (
              points === 3 ? `+3 3-POINTER · ${label}` :
              points === 2 ? `+2 FIELD GOAL · ${label}` :
              points === 1 ? `+1 FREE THROW · ${label}` :
              `${points > 0 ? `+${points}` : points} · ${label}`
            ) : (
              `+${points} · ${label}`
            )}
          </span>
        </div>

        {/* Players Roster Grid */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between text-xs text-[#94a3b8]">
            <span className="font-bold uppercase tracking-wider">
              Playing Roster ({players.length} Players)
            </span>
            {onQuickAddPlayer && (
              <button
                onClick={() => setIsAddingNew(!isAddingNew)}
                className={`text-xs font-bold hover:underline flex items-center gap-1 ${isBasketball ? 'text-[#fb923c]' : 'text-[#38bdf8]'}`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {isAddingNew ? 'Cancel' : '+ Add Player to Roster'}
              </button>
            )}
          </div>

          {/* Inline Add Player Form */}
          {isAddingNew && (
            <form onSubmit={handleQuickAdd} className={`p-3 bg-[#0b0e14] border rounded-xl space-y-2.5 animate-in fade-in duration-150 ${isBasketball ? 'border-[#f97316]/40' : 'border-[#38bdf8]/40'}`}>
              <span className="text-[11px] font-bold text-white uppercase block">
                Quick Register Player:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Player Full Name"
                  className="px-3 py-1.5 bg-[#121824] border border-white/15 rounded-lg text-xs text-white outline-none focus:border-[#38bdf8]"
                  required
                />
                <input
                  type="number"
                  value={newNumber}
                  onChange={(e) => setNewNumber(Number(e.target.value))}
                  placeholder="Jersey #"
                  className="px-3 py-1.5 bg-[#121824] border border-white/15 rounded-lg text-xs text-white outline-none focus:border-[#38bdf8]"
                  min={0}
                  max={99}
                  required
                />
                <select
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  className="px-3 py-1.5 bg-[#121824] border border-white/15 rounded-lg text-xs text-white outline-none focus:border-[#38bdf8]"
                >
                  {isBasketball ? (
                    <>
                      <option value="Point Guard">Point Guard (PG)</option>
                      <option value="Shooting Guard">Shooting Guard (SG)</option>
                      <option value="Small Forward">Small Forward (SF)</option>
                      <option value="Power Forward">Power Forward (PF)</option>
                      <option value="Center">Center (C)</option>
                    </>
                  ) : (
                    <>
                      <option value="Outside Hitter">Outside Hitter (OH)</option>
                      <option value="Opposite Hitter">Opposite Hitter (OPP)</option>
                      <option value="Middle Blocker">Middle Blocker (MB)</option>
                      <option value="Setter">Setter (S)</option>
                      <option value="Libero">Libero (L)</option>
                    </>
                  )}
                </select>
              </div>
              <button
                type="submit"
                className={`px-4 py-1.5 rounded-lg text-white font-heading font-bold text-xs uppercase ${
                  isBasketball
                    ? 'bg-gradient-to-r from-[#ea580c] to-[#c2410c]'
                    : 'bg-gradient-to-r from-[#0284c7] to-[#0369a1]'
                }`}
              >
                Save &amp; Add Player
              </button>
            </form>
          )}

          {/* Players Selection Cards */}
          {sortedPlayers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 no-scrollbar">
              {sortedPlayers.map((p) => {
                const isOnCourt = p.isOnCourt !== false;
                const fouls = p.fouls || 0;
                const isFouledOut = isBasketball && fouls >= 5;
                const isFoulTrouble = isBasketball && fouls === 4;

                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPlayer(p)}
                    className="p-3 rounded-2xl bg-[#0b0e14] border border-white/10 hover:border-[#38bdf8] hover:bg-[#121824] transition-all flex items-center justify-between text-left group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-sm text-white shadow"
                        style={{ backgroundColor: `${teamColor}30`, borderColor: teamColor, borderWidth: 1 }}
                      >
                        #{p.number}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-bold text-sm text-white block group-hover:text-[#38bdf8] transition-colors truncate">
                            {p.name}
                          </span>
                          {isFouledOut && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                              🚨 5 FOULS
                            </span>
                          )}
                          {isFoulTrouble && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                              ⚠️ 4 FOULS
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-[#94a3b8]">
                            {p.position}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                            isOnCourt
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-white/5 text-[#94a3b8] border border-white/10'
                          }`}>
                            {isOnCourt ? 'ON COURT' : 'BENCH'}
                          </span>
                          {isBasketball && fouls > 0 && !isFouledOut && !isFoulTrouble && (
                            <span className="text-[8px] font-mono font-bold text-[#94a3b8]">
                              {fouls} PF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-heading font-black text-base text-white tabular-nums block">
                        {p.points} <span className="text-[10px] text-[#94a3b8]">PTS</span>
                      </span>
                      <span className={`text-[9px] font-mono block ${isBasketball ? 'text-[#fb923c]' : 'text-[#38bdf8]'}`}>
                        {isBasketball 
                          ? `${p.threePointers || 0} 3PT · ${p.assists || 0} AST` 
                          : `${p.kills || 0} K · ${p.blocks || 0} B`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-white/5 border border-dashed border-white/15 space-y-2">
              <AlertCircle className="w-8 h-8 text-[#94a3b8] mx-auto opacity-50" />
              <p className="text-xs text-[#94a3b8]">
                No players registered yet on this team's roster.
              </p>
            </div>
          )}

          {/* Unassisted / Team Basket Option */}
          <div className="pt-2">
            <button
              onClick={() => onSelectPlayer(undefined)}
              className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[#e1e2eb] hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-heading font-bold uppercase tracking-wider"
            >
              <UserCheck className={`w-4 h-4 ${isBasketball ? 'text-[#fb923c]' : 'text-[#38bdf8]'}`} />
              {isBasketball ? '🏀 Team Basket / Fast Break / Putback (Unassisted)' : '🏐 Team Point / Unassisted / Opponent Error'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
