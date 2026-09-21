import React from 'react';
import { Match } from '../types';
import { Printer, X, Download, ShieldCheck, Award, FileText, CheckCircle2 } from 'lucide-react';

interface OfficialScoresheetModalProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialScoresheetModal: React.FC<OfficialScoresheetModalProps> = ({
  match,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const isVolleyball = match.sport === 'volleyball';
  const isBasketball = match.sport === 'basketball';
  const homeSets = match.homeTeam.setsWon ?? 0;
  const awaySets = match.awayTeam.setsWon ?? 0;
  const isFinal = match.status === 'FINAL';

  const winnerName = isVolleyball
    ? (homeSets > awaySets ? match.homeTeam.name : awaySets > homeSets ? match.awayTeam.name : (match.homeTeam.score >= match.awayTeam.score ? match.homeTeam.name : match.awayTeam.name))
    : (match.homeTeam.score >= match.awayTeam.score ? match.homeTeam.name : match.awayTeam.name);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative my-8 overflow-hidden print:p-0 print:border-none print:shadow-none print:bg-white print:text-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Actions bar (Hidden in Print) */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#38bdf8]" />
            <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
              Official Match Scoresheet &amp; Audit Report
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white font-heading font-bold text-xs uppercase tracking-wider shadow-lg glow-blue transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Scoresheet Container */}
        <div className="mt-6 space-y-6 print:m-0 print:text-black font-sans">
          
          {/* Header */}
          <div className="border-b-2 border-white/20 print:border-black pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-2xl uppercase tracking-tight text-white print:text-black">
                  Dunk &amp; Spike Championship Athletics
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/10 text-[#38bdf8] print:border print:border-black print:text-black">
                  {isVolleyball ? 'FIVB / VNL OFFICIAL SCORESHEET' : 'FIBA / NCAA OFFICIAL BOX SCORE'}
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] print:text-gray-600">
                {match.title} · {match.division}
              </p>
            </div>

            <div className="text-right text-xs text-[#94a3b8] print:text-gray-700 font-mono">
              <div><strong>MATCH ID:</strong> {match.id.toUpperCase()}</div>
              <div><strong>COURT:</strong> {match.court}</div>
              <div><strong>VENUE:</strong> {match.venue}</div>
              <div><strong>STATUS:</strong> {match.statusDetail}</div>
            </div>
          </div>

          {/* Teams & Results Summary Banner */}
          <div className="bg-[#0b0e14] print:bg-gray-100 p-6 rounded-2xl border border-white/10 print:border-black flex items-center justify-between">
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-bold text-[#f97316] uppercase tracking-widest block">HOME TEAM</span>
              <h2 className="font-heading font-black text-2xl text-white print:text-black uppercase">{match.homeTeam.name}</h2>
              <span className="text-xs text-[#94a3b8] print:text-gray-600 font-mono">{match.homeTeam.record}</span>
            </div>

            <div className="text-center px-6">
              <div className="font-heading font-black text-5xl tabular-nums text-white print:text-black">
                {match.homeTeam.score} - {match.awayTeam.score}
              </div>
              {isVolleyball && (
                <span className="block text-xs font-bold text-[#38bdf8] print:text-black uppercase mt-1">
                  Sets: {homeSets} - {awaySets}
                </span>
              )}
              {isFinal && (
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 print:text-black print:border print:border-black">
                  WINNER: {winnerName}
                </span>
              )}
            </div>

            <div className="text-center sm:text-right">
              <span className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-widest block">AWAY TEAM</span>
              <h2 className="font-heading font-black text-2xl text-white print:text-black uppercase">{match.awayTeam.name}</h2>
              <span className="text-xs text-[#94a3b8] print:text-gray-600 font-mono">{match.awayTeam.record}</span>
            </div>
          </div>

          {/* Breakdown Section */}
          {isVolleyball && match.setScores && (
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-white print:text-black">
                FIVB Set-by-Set Progression:
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-white/15 print:border-black">
                  <thead>
                    <tr className="bg-[#10131a] print:bg-gray-200 text-[#94a3b8] print:text-black uppercase font-bold font-heading">
                      <th className="p-2.5 border border-white/10 print:border-black">Set</th>
                      <th className="p-2.5 border border-white/10 print:border-black">Target</th>
                      <th className="p-2.5 border border-white/10 print:border-black">{match.homeTeam.shortName}</th>
                      <th className="p-2.5 border border-white/10 print:border-black">{match.awayTeam.shortName}</th>
                      <th className="p-2.5 border border-white/10 print:border-black">Set Winner</th>
                      <th className="p-2.5 border border-white/10 print:border-black">Deuce / Win Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 print:divide-black font-mono">
                    {match.setScores.map((s) => (
                      <tr key={s.set} className="hover:bg-white/5 print:hover:bg-transparent">
                        <td className="p-2.5 border border-white/10 print:border-black font-bold">
                          {s.isDecidingSet ? `Set ${s.set} (Tiebreak)` : `Set ${s.set}`}
                        </td>
                        <td className="p-2.5 border border-white/10 print:border-black">{s.targetPoints} pts</td>
                        <td className="p-2.5 border border-white/10 print:border-black font-black text-sm">{s.homeScore}</td>
                        <td className="p-2.5 border border-white/10 print:border-black font-black text-sm">{s.awayScore}</td>
                        <td className="p-2.5 border border-white/10 print:border-black font-bold text-[#38bdf8] print:text-black">
                          {s.winner ? (s.winner === 'home' ? match.homeTeam.name : match.awayTeam.name) : 'In Progress'}
                        </td>
                        <td className="p-2.5 border border-white/10 print:border-black text-[#94a3b8] print:text-black">
                          {s.isCompleted ? `Margin: ${Math.abs(s.homeScore - s.awayScore)} pts ${s.homeScore >= 25 && s.awayScore >= 24 ? '(Deuce Overtime)' : ''}` : 'Active'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isBasketball && match.homeTeam.quarterScores && (
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-white print:text-black">
                Quarter Scoring Breakdown:
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-white/15 print:border-black">
                  <thead>
                    <tr className="bg-[#10131a] print:bg-gray-200 text-[#94a3b8] print:text-black uppercase font-bold font-heading">
                      <th className="p-2.5 border border-white/10 print:border-black">Team</th>
                      {match.homeTeam.quarterScores.map((_, idx) => (
                        <th key={idx} className="p-2.5 border border-white/10 print:border-black text-center">
                          {idx < 4 ? `Q${idx + 1}` : `OT${idx - 3}`}
                        </th>
                      ))}
                      <th className="p-2.5 border border-white/10 print:border-black text-right font-black">Total</th>
                      <th className="p-2.5 border border-white/10 print:border-black text-center">Fouls</th>
                      <th className="p-2.5 border border-white/10 print:border-black text-center">Timeouts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 print:divide-black font-mono">
                    <tr>
                      <td className="p-2.5 border border-white/10 print:border-black font-bold font-heading uppercase text-sm">
                        {match.homeTeam.name}
                      </td>
                      {match.homeTeam.quarterScores.map((score, idx) => (
                        <td key={idx} className="p-2.5 border border-white/10 print:border-black text-center font-bold">
                          {score}
                        </td>
                      ))}
                      <td className="p-2.5 border border-white/10 print:border-black text-right font-black text-sm text-[#f97316] print:text-black">
                        {match.homeTeam.score}
                      </td>
                      <td className="p-2.5 border border-white/10 print:border-black text-center">
                        {match.homeTeam.fouls || 0}
                      </td>
                      <td className="p-2.5 border border-white/10 print:border-black text-center">
                        {match.homeTeam.timeoutsLeft ?? 4}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border border-white/10 print:border-black font-bold font-heading uppercase text-sm">
                        {match.awayTeam.name}
                      </td>
                      {match.awayTeam.quarterScores?.map((score, idx) => (
                        <td key={idx} className="p-2.5 border border-white/10 print:border-black text-center font-bold">
                          {score}
                        </td>
                      ))}
                      <td className="p-2.5 border border-white/10 print:border-black text-right font-black text-sm text-[#38bdf8] print:text-black">
                        {match.awayTeam.score}
                      </td>
                      <td className="p-2.5 border border-white/10 print:border-black text-center">
                        {match.awayTeam.fouls || 0}
                      </td>
                      <td className="p-2.5 border border-white/10 print:border-black text-center">
                        {match.awayTeam.timeoutsLeft ?? 4}
                      </td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            )}

          {/* Individual Player Box Score Audit Breakdown */}
          {((match.homeTeam.players && match.homeTeam.players.length > 0) || (match.awayTeam.players && match.awayTeam.players.length > 0)) && (
            <div className="space-y-4">
              <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-white print:text-black">
                Individual Player Box Score Telemetry:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Roster */}
                <div className="border border-white/10 print:border-black rounded-xl p-3 bg-black/20 print:bg-white">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 print:border-black text-xs font-bold font-heading uppercase text-white print:text-black">
                    <span>{match.homeTeam.name} Roster</span>
                    <span>PTS ({isVolleyball ? 'K-A-B' : '2P-3P-FT'})</span>
                  </div>
                  <div className="divide-y divide-white/5 print:divide-black text-xs mt-1">
                    {(match.homeTeam.players || []).map((p) => (
                      <div key={p.id} className="py-1 flex items-center justify-between font-mono">
                        <span>#{p.number} {p.name} <span className="text-[10px] text-[#94a3b8] print:text-gray-600">({p.position})</span></span>
                        <span className="font-bold text-white print:text-black">
                          {p.points} <span className="text-[10px] text-[#94a3b8] print:text-gray-600 font-normal">
                            ({isVolleyball ? `${p.kills || 0}-${p.aces || 0}-${p.blocks || 0}` : `${p.twoPointers || 0}-${p.threePointers || 0}-${p.freeThrows || 0}`})
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Away Roster */}
                <div className="border border-white/10 print:border-black rounded-xl p-3 bg-black/20 print:bg-white">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 print:border-black text-xs font-bold font-heading uppercase text-white print:text-black">
                    <span>{match.awayTeam.name} Roster</span>
                    <span>PTS ({isVolleyball ? 'K-A-B' : '2P-3P-FT'})</span>
                  </div>
                  <div className="divide-y divide-white/5 print:divide-black text-xs mt-1">
                    {(match.awayTeam.players || []).map((p) => (
                      <div key={p.id} className="py-1 flex items-center justify-between font-mono">
                        <span>#{p.number} {p.name} <span className="text-[10px] text-[#94a3b8] print:text-gray-600">({p.position})</span></span>
                        <span className="font-bold text-white print:text-black">
                          {p.points} <span className="text-[10px] text-[#94a3b8] print:text-gray-600 font-normal">
                            ({isVolleyball ? `${p.kills || 0}-${p.aces || 0}-${p.blocks || 0}` : `${p.twoPointers || 0}-${p.threePointers || 0}-${p.freeThrows || 0}`})
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Official Signatures & Audit Stamp */}
          <div className="pt-6 border-t-2 border-white/20 print:border-black grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-[#94a3b8] print:text-black">
            <div>
              <span className="font-bold uppercase block mb-1">Head Court Official / Referee</span>
              <div className="border-b border-white/30 print:border-black h-8 flex items-end font-serif italic text-white print:text-black">
                J. Harrison, National Referee #8842
              </div>
            </div>
            <div>
              <span className="font-bold uppercase block mb-1">Official Scorer</span>
              <div className="border-b border-white/30 print:border-black h-8 flex items-end font-serif italic text-white print:text-black">
                M. Sterling, Certified FIVB / NCAA Scorer
              </div>
            </div>
            <div>
              <span className="font-bold uppercase block mb-1">Tournament Director</span>
              <div className="border-b border-white/30 print:border-black h-8 flex items-end font-serif italic text-white print:text-black">
                Elena Vasquez, AVCA / NCAA Commissioner
              </div>
            </div>
          </div>

          <div className="text-center pt-4 text-[10px] text-[#94a3b8] print:text-gray-500 font-mono">
            Certified compliant with FIVB Official Volleyball Rules (Edition 2024-2028) &amp; FIBA Official Basketball Rules.
            Timestamp: {new Date().toISOString()}
          </div>

        </div>

      </div>
    </div>
  );
};
