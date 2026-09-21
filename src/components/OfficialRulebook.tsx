import React, { useState } from 'react';
import { Sport } from '../types';
import { 
  BookOpen, 
  X, 
  Zap, 
  Flame, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Scale, 
  Award, 
  ArrowRight,
  HelpCircle,
  Settings,
  ArrowLeftRight
} from 'lucide-react';
import { getChampionshipRules } from '../utils/rulesManager';

interface OfficialRulebookProps {
  isOpen: boolean;
  onClose: () => void;
  initialSport?: Sport;
  isAdminLoggedIn?: boolean;
  onOpenRulesEditor?: () => void;
}

export const OfficialRulebook: React.FC<OfficialRulebookProps> = ({
  isOpen,
  onClose,
  initialSport = 'volleyball',
  isAdminLoggedIn,
  onOpenRulesEditor,
}) => {
  const [activeSport, setActiveSport] = useState<Sport>(initialSport);
  const rules = getChampionshipRules();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] glass-panel-elevated rounded-3xl border border-white/20 shadow-2xl flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Corner Lighting */}
        <div 
          className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-500 ${
            activeSport === 'volleyball' ? 'bg-[#0284c7]' : 'bg-[#f97316]'
          }`} 
        />

        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4 shrink-0 bg-[#0b0e14]/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#0284c7] p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#10131a] rounded-[14px] flex items-center justify-center">
                <Scale className="w-6 h-6 text-[#38bdf8]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-2xl text-white uppercase tracking-wide">
                  Official Championship Rulebook
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30">
                  FIVB · VNL · FIBA · NCAA
                </span>
              </div>
              <p className="text-xs text-[#94a3b8]">
                Sanctioned scoring guidelines, tiebreak rules, and penalty structures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenRulesEditor && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRulesEditor();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-heading font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow"
                title="Configure Championship Rules (Admin)"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <span>⚙️ Configure Rules (Admin)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sport Switcher Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-2 border-b border-white/5 bg-[#10131a]">
          <button
            onClick={() => setActiveSport('volleyball')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading text-sm font-bold uppercase tracking-wider transition-all ${
              activeSport === 'volleyball'
                ? 'bg-[#0284c7] text-white shadow-lg glow-blue'
                : 'text-[#94a3b8] hover:text-white bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4" />
            VOLLEYBALL (FIVB / VNL GUIDELINES)
          </button>
          <button
            onClick={() => setActiveSport('basketball')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading text-sm font-bold uppercase tracking-wider transition-all ${
              activeSport === 'basketball'
                ? 'bg-[#f97316] text-white shadow-lg glow-orange'
                : 'text-[#94a3b8] hover:text-white bg-white/5'
            }`}
          >
            <Flame className="w-4 h-4" />
            BASKETBALL (FIBA / NCAA GUIDELINES)
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1 text-sm text-[#e1e2eb]">
          
          {/* ================= VOLLEYBALL RULES ================= */}
          {activeSport === 'volleyball' && (
            <div className="space-y-8">
              
              {/* Section 1: Match Formats & Sets */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#38bdf8]">
                  <Award className="w-5 h-5" />
                  <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                    1. Match Formats &amp; Set Structure
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#10131a] p-5 rounded-2xl border border-white/10 space-y-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/40">
                      VNL Official Standard
                    </span>
                    <h4 className="font-heading font-bold text-lg text-white uppercase">Best-of-5 Sets Format</h4>
                    <ul className="text-xs text-[#94a3b8] space-y-1.5 list-disc list-inside">
                      <li>First team to win <strong>3 sets</strong> wins the match.</li>
                      <li><strong>Sets 1 to 4:</strong> Played to <strong>{rules.volleyball.regularSetTargetPoints} points</strong> {rules.volleyball.winByTwoPoints ? '(win by 2)' : ''}.</li>
                      <li><strong>Deciding Set 5 (Tiebreak):</strong> Played to <strong>{rules.volleyball.decidingSetTargetPoints} points</strong> {rules.volleyball.winByTwoPoints ? '(win by 2)' : ''}.</li>
                      <li>Teams switch courts in Set 5 when either team reaches <strong>{rules.volleyball.courtSwitchAtPoints} points</strong>.</li>
                    </ul>
                  </div>

                  <div className="bg-[#10131a] p-5 rounded-2xl border border-white/10 space-y-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-white/10 text-white border border-white/20">
                      Tournament / Invitational
                    </span>
                    <h4 className="font-heading font-bold text-lg text-white uppercase">Best-of-3 Sets Format</h4>
                    <ul className="text-xs text-[#94a3b8] space-y-1.5 list-disc list-inside">
                      <li>First team to win <strong>2 sets</strong> wins the match.</li>
                      <li><strong>Sets 1 to 2:</strong> Played to <strong>{rules.volleyball.regularSetTargetPoints} points</strong> {rules.volleyball.winByTwoPoints ? '(win by 2)' : ''}.</li>
                      <li><strong>Deciding Set 3 (Tiebreak):</strong> Played to <strong>{rules.volleyball.decidingSetTargetPoints} points</strong> {rules.volleyball.winByTwoPoints ? '(win by 2)' : ''}.</li>
                      <li>Teams switch courts in Set 3 when either team reaches <strong>{rules.volleyball.courtSwitchAtPoints} points</strong>.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 2: Scoring System & The "Win by 2" Deuce Rule */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#38bdf8]">
                  <Zap className="w-5 h-5" />
                  <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                    2. Rally Scoring &amp; The "Win by 2" Deuce Rule
                  </h3>
                </div>
                <div className="bg-[#10131a] p-5 rounded-2xl border border-white/10 space-y-4">
                  <div className="text-xs text-[#94a3b8] leading-relaxed">
                    Volleyball uses the <strong>Rally Point System</strong>. Every single rally results in a point awarded to the winner, whether serving or receiving. When the receiving team wins a rally, they gain both the point and the right to serve (Sideout), rotating clockwise one position.
                  </div>

                  {/* Deuce Flowchart / Example */}
                  <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#0284c7]/30 space-y-3">
                    <div className="flex items-center justify-between text-xs font-heading font-bold uppercase text-[#38bdf8]">
                      <span>Deuce Progression Example (Official VNL Guideline):</span>
                      <span className="text-[#ff5451] animate-pulse">NO SCORE CEILING</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-[10px] text-[#94a3b8] uppercase block">Threshold</span>
                        <span className="font-mono text-base font-bold text-white">24 - 24</span>
                        <span className="text-[10px] text-[#ff5451] font-bold block mt-1">DEUCE! (Target 26)</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-[10px] text-[#94a3b8] uppercase block">Set Point</span>
                        <span className="font-mono text-base font-bold text-[#38bdf8]">25 - 24</span>
                        <span className="text-[10px] text-[#38bdf8] font-bold block mt-1">Team A Set Point</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-[10px] text-[#94a3b8] uppercase block">Deuce Extended</span>
                        <span className="font-mono text-base font-bold text-white">25 - 25</span>
                        <span className="text-[10px] text-[#ff5451] font-bold block mt-1">DEUCE! (Target 27)</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <span className="text-[10px] text-emerald-400 uppercase block">Set Concluded</span>
                        <span className="font-mono text-base font-bold text-emerald-400">27 - 25</span>
                        <span className="text-[10px] text-emerald-400 font-bold block mt-1">Team A Wins (+2 lead)</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-[#94a3b8]">
                    <strong>Deciding Set ({rules.volleyball.decidingSetTargetPoints} pts):</strong> Deuce triggers at <strong>{rules.volleyball.decidingSetTargetPoints - 1}–{rules.volleyball.decidingSetTargetPoints - 1}</strong>. Target advances by 2 points until a 2-point margin is established.
                  </div>
                </div>
              </div>

              {/* Section 3: Contact & Playing Faults */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#38bdf8]">
                  <ShieldAlert className="w-5 h-5" />
                  <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                    3. Contact Limits &amp; Match Faults
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#10131a] p-4 rounded-xl border border-white/10">
                    <strong className="text-white block font-heading text-sm uppercase mb-1">Max 3 Contacts</strong>
                    <p className="text-[#94a3b8]">Each team is allowed maximum 3 hits to return the ball. A block contact does NOT count as one of the 3 touches.</p>
                  </div>
                  <div className="bg-[#10131a] p-4 rounded-xl border border-white/10">
                    <strong className="text-white block font-heading text-sm uppercase mb-1">Net Contact Fault</strong>
                    <p className="text-[#94a3b8]">Contact with the net between the antennae during action of playing the ball is a fault, conceding the rally.</p>
                  </div>
                  <div className="bg-[#10131a] p-4 rounded-xl border border-white/10">
                    <strong className="text-white block font-heading text-sm uppercase mb-1">Libero Rules</strong>
                    <p className="text-[#94a3b8]">Designated defensive specialist wearing contrasting jersey. Cannot attack above the net, block, or serve (FIVB).</p>
                  </div>
                </div>
              </div>

              {/* Section 4: Mid-Set & Squad Substitutions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ArrowLeftRight className="w-5 h-5" />
                  <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                    4. Mid-Set &amp; Mid-Match Squad Substitutions (FIVB Rule 15)
                  </h3>
                </div>
                <div className="bg-[#10131a] p-5 rounded-2xl border border-emerald-500/20 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-black/30 border border-white/10">
                      <strong className="text-emerald-400 font-heading uppercase block mb-1">Max Substitutions / Set</strong>
                      <span className="font-mono text-2xl font-black text-white block mb-1">
                        {rules.volleyball.maxSubstitutionsPerSet} Subs
                      </span>
                      <p className="text-[#94a3b8]">Each team may make up to {rules.volleyball.maxSubstitutionsPerSet} substitutions per set. Sub count resets at the beginning of each new set.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/30 border border-white/10">
                      <strong className="text-emerald-400 font-heading uppercase block mb-1">Mid-Set Timing</strong>
                      <span className="font-mono text-base font-bold text-white block mb-1">
                        Dead-Ball Stoppage
                      </span>
                      <p className="text-[#94a3b8]">Substitutions may be requested at any dead-ball interval before the referee's whistle for service. Play resumes immediately with no timeout charge.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/30 border border-white/10">
                      <strong className="text-emerald-400 font-heading uppercase block mb-1">Squad Roster Bench</strong>
                      <span className="font-mono text-base font-bold text-white block mb-1">
                        Existing Team Members
                      </span>
                      <p className="text-[#94a3b8]">6 active players on court, with 2 reserve squad members available on the bench. Swapping players updates official box scores and rotation cards.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= BASKETBALL RULES ================= */}
          {activeSport === 'basketball' && (
            <div className="space-y-8">
              
              {/* Section 1: Period Length & Quarters */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#f97316]">
                  <Clock className="w-5 h-5" />
                  <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                    1. Period Structure &amp; Overtime
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#10131a] p-5 rounded-2xl border border-white/10 space-y-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/40">
                      Championship Active Format
                    </span>
                    <h4 className="font-heading font-bold text-lg text-white uppercase">
                      4 Quarters of {rules.basketball.quarterDurationMinutes} Minutes
                    </h4>
                    <ul className="text-xs text-[#94a3b8] space-y-1.5 list-disc list-inside">
                      <li>Regulation play: {rules.basketball.quarterDurationMinutes * 4} minutes total (four {rules.basketball.quarterDurationMinutes}-minute quarters).</li>
                      <li>Halftime interval: 15 minutes between Quarter 2 and 3.</li>
                      <li>Overtime: <strong>{rules.basketball.overtimeDurationMinutes} minutes</strong> per period if tied at regulation.</li>
                      <li>Additional {rules.basketball.overtimeDurationMinutes}-minute OT periods until a winner is determined.</li>
                    </ul>
                  </div>

                  <div className="bg-[#10131a] p-5 rounded-2xl border border-white/10 space-y-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-white/10 text-white border border-white/20">
                      Roster &amp; Bench Regulation
                    </span>
                    <h4 className="font-heading font-bold text-lg text-white uppercase">5 on Court · 3 Benched</h4>
                    <ul className="text-xs text-[#94a3b8] space-y-1.5 list-disc list-inside">
                      <li>Roster Limit: Strictly <strong>8 players registered</strong> per team.</li>
                      <li>Court Limit: Exactly <strong>5 active players</strong> on court during live play.</li>
                      <li>Bench: Remaining 3 players are available for dead-ball substitutions.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 2: Point Values & Shot Clock */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#f97316]">
                  <Flame className="w-5 h-5" />
                  <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                    2. Point Values &amp; Shot Clock Telemetry
                  </h3>
                </div>
                <div className="bg-[#10131a] p-5 rounded-2xl border border-white/10 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="bg-[#0b0e14] p-4 rounded-xl border border-white/10">
                      <span className="text-[10px] font-bold text-[#94a3b8] uppercase block">Free Throw</span>
                      <span className="font-heading font-black text-3xl text-white">1 POINT</span>
                      <span className="text-[11px] text-[#94a3b8] block mt-1">From the 15ft foul line without contest</span>
                    </div>
                    <div className="bg-[#0b0e14] p-4 rounded-xl border border-white/10">
                      <span className="text-[10px] font-bold text-[#94a3b8] uppercase block">Field Goal</span>
                      <span className="font-heading font-black text-3xl text-[#f97316]">2 POINTS</span>
                      <span className="text-[11px] text-[#94a3b8] block mt-1">Any basket made inside the 3PT perimeter arc</span>
                    </div>
                    <div className="bg-[#0b0e14] p-4 rounded-xl border border-white/10">
                      <span className="text-[10px] font-bold text-[#94a3b8] uppercase block">Beyond the Arc</span>
                      <span className="font-heading font-black text-3xl text-[#38bdf8]">3 POINTS</span>
                      <span className="text-[11px] text-[#94a3b8] block mt-1">Shot released behind the 6.75m / 22' 1.75" arc</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#f97316]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                    <div>
                      <strong className="text-white uppercase font-heading text-sm block mb-1">
                        Shot Clock Rules: {rules.basketball.shotClockSeconds} Seconds / 14 Seconds
                      </strong>
                      <p className="text-[#94a3b8]">
                        Full {rules.basketball.shotClockSeconds}-second shot clock upon gaining possession in backcourt. Resets to <strong>14 seconds</strong> on an offensive rebound after the ball strikes the rim.
                      </p>
                    </div>
                    <span className="font-mono text-2xl font-black text-[#f97316] tabular-nums shrink-0">
                      {rules.basketball.shotClockSeconds}s / 14s
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Fouls, Penalty Bonus, & Disqualification */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#f97316]">
                  <ShieldAlert className="w-5 h-5" />
                  <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                    3. Fouls, Penalty Bonus &amp; Disqualification
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#10131a] p-4 rounded-xl border border-white/10 space-y-1.5">
                    <strong className="text-white font-heading text-sm uppercase block">
                      {rules.basketball.playerFoulOutLimit} Personal Fouls (Foul Out)
                    </strong>
                    <p className="text-[#94a3b8]">
                      Under official championship rules, any player committing <strong>{rules.basketball.playerFoulOutLimit} personal fouls</strong> is disqualified from the game for the remaining duration.
                    </p>
                  </div>
                  <div className="bg-[#10131a] p-4 rounded-xl border border-white/10 space-y-1.5">
                    <strong className="text-white font-heading text-sm uppercase block">
                      Team Foul Penalty (Bonus at {rules.basketball.teamFoulsBonusThreshold} Fouls)
                    </strong>
                    <p className="text-[#94a3b8]">
                      Once a team commits <strong>{rules.basketball.teamFoulsBonusThreshold} team fouls in a single quarter</strong>, the opposing team enters the penalty bonus and is awarded 2 free throws on subsequent non-shooting fouls.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-white/10 bg-[#0b0e14]/90 flex items-center justify-between text-xs text-[#94a3b8]">
          <span>Verified against official FIVB/VNL 2026 and FIBA/NCAA 2025-2026 rule editions.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold uppercase tracking-wider"
          >
            Close Rulebook
          </button>
        </div>

      </div>
    </div>
  );
};
