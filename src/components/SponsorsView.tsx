import React, { useState, useEffect } from 'react';
import { SponsorTier } from '../types';
import { SPONSOR_TIERS } from '../data/mockData';
import { realtimeDB } from '../services/realtimeDatabase';
import { 
  HeartHandshake, 
  Sparkles, 
  ChevronRight, 
  Check, 
  Trash2, 
  PlusCircle, 
  RotateCcw, 
  ShieldCheck, 
  IndianRupee,
  CheckCircle,
  X
} from 'lucide-react';

interface SponsorsViewProps {
  isAdminLoggedIn?: boolean;
}

const SPONSORS_STORAGE_KEY = 'dunk_spike_sponsors_v2';

export const SponsorsView: React.FC<SponsorsViewProps> = ({ isAdminLoggedIn = false }) => {
  const [tiers, setTiers] = useState<SponsorTier[]>(() => {
    try {
      const saved = localStorage.getItem(SPONSORS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return SPONSOR_TIERS;
  });

  const [pledgeAmount, setPledgeAmount] = useState<number | string>(25000);
  const [donorName, setDonorName] = useState<string>('');
  const [isPledged, setIsPledged] = useState<boolean>(false);

  // Manual Sponsor Management Mode
  const [isManageMode, setIsManageMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('dunk_spike_sponsor_manage');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });
  const canManage = isAdminLoggedIn || isManageMode;

  // Feedback Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Add Sponsor Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [targetTierId, setTargetTierId] = useState<string>('title');
  const [newSponsorName, setNewSponsorName] = useState<string>('');
  const [newSponsorSubtext, setNewSponsorSubtext] = useState<string>('');
  const [newSponsorSince, setNewSponsorSince] = useState<string>('2026');
  const [newSponsorIndustry, setNewSponsorIndustry] = useState<string>('');
  const [customTierName, setCustomTierName] = useState<string>('');
  const [customTierInvestment, setCustomTierInvestment] = useState<string>('₹5,00,000 / Season');

  // Realtime Database subscription
  useEffect(() => {
    realtimeDB.init();
    const unsub = realtimeDB.onSponsorsChange((updatedTiers) => {
      setTiers(updatedTiers);
    });
    return unsub;
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SPONSORS_STORAGE_KEY, JSON.stringify(tiers));
    } catch (e) {
      console.error(e);
    }
  }, [tiers]);

  const handleDeleteSponsor = (tierId: string, sponsorName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete official sponsor "${sponsorName}"? This action cannot be undone.`)) {
      setTiers(prev => {
        const next = prev.map(tier => {
          if (tier.id !== tierId) return tier;
          return {
            ...tier,
            sponsors: tier.sponsors.filter(s => s.name !== sponsorName),
          };
        });
        try {
          localStorage.setItem(SPONSORS_STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        realtimeDB.updateSponsors(next);
        return next;
      });
      showToast(`Official partner "${sponsorName}" was permanently deleted.`);
    }
  };

  const handleDeleteTier = (tierId: string, tierName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete the entire sponsorship tier "${tierName}" and all associated sponsors?`)) {
      setTiers(prev => {
        const next = prev.filter(t => t.id !== tierId);
        try {
          localStorage.setItem(SPONSORS_STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        realtimeDB.updateSponsors(next);
        return next;
      });
      showToast(`Tier "${tierName}" was permanently deleted.`);
    }
  };

  const handleResetSponsors = () => {
    if (window.confirm('Reset all sponsor tiers and official partners back to the original championship configuration?')) {
      setTiers(SPONSOR_TIERS);
      try {
        localStorage.setItem(SPONSORS_STORAGE_KEY, JSON.stringify(SPONSOR_TIERS));
      } catch (e) {
        console.error(e);
      }
      realtimeDB.updateSponsors(SPONSOR_TIERS);
      showToast('Restored default championship sponsors.');
    }
  };

  const handleOpenAddModal = (tierId?: string) => {
    setTargetTierId(tierId || tiers[0]?.id || 'title');
    setNewSponsorName('');
    setNewSponsorSubtext('');
    setNewSponsorSince(new Date().getFullYear().toString());
    setNewSponsorIndustry('Athletics & Sports');
    setCustomTierName('');
    setCustomTierInvestment('₹5,00,000 / Season');
    setIsAddModalOpen(true);
  };

  const handleAddSponsorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newSponsorName.trim();
    if (!trimmedName) return;

    const newPartner = {
      name: trimmedName,
      logoText: trimmedName.toUpperCase(),
      subtext: newSponsorSubtext.trim() || 'Official Tournament Sponsor',
      since: newSponsorSince.trim() || '2026',
      industry: newSponsorIndustry.trim() || 'Athletics & Sports',
    };

    setTiers(prev => {
      let next: SponsorTier[];
      if (targetTierId === 'new_custom_tier') {
        const newTier: SponsorTier = {
          id: `custom-tier-${Date.now()}`,
          name: customTierName.trim() || 'Official Corporate Partner',
          badge: 'CORPORATE PARTNER',
          tagline: 'Supporting Athletics Excellence',
          description: 'Proud regional and national corporate athletic benefactor.',
          investmentLevel: customTierInvestment.trim() || '₹5,00,000 / Season',
          color: '#10b981',
          perks: [
            'Official Website & Scoreboard Logo Presentation',
            'VIP Tournament Access & Reserved Court-side Seating',
            'Digital Livestream Sponsored Replay Branding'
          ],
          sponsors: [newPartner],
        };
        next = [...prev, newTier];
      } else {
        next = prev.map(tier => {
          if (tier.id !== targetTierId) return tier;
          return {
            ...tier,
            sponsors: [...tier.sponsors, newPartner],
          };
        });
      }
      try {
        localStorage.setItem(SPONSORS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      realtimeDB.updateSponsors(next);
      return next;
    });

    setIsAddModalOpen(false);
    showToast(`"${trimmedName}" added permanently to official sponsors.`);
  };

  const handlePledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim()) return;
    const parsed = Number(pledgeAmount);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Please enter a valid pledge amount.');
      return;
    }
    setIsPledged(true);
  };

  return (
    <div className="space-y-12">
      
      {/* Intro Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/30">
          <HeartHandshake className="w-3.5 h-3.5" />
          Championship Athletics Endowment
        </div>
        <h1 className="font-heading font-black text-4xl sm:text-6xl uppercase tracking-tight text-white">
          Sponsors &amp; Athletic Contributors
        </h1>
        <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
          Fueling collegiate basketball and volleyball championships through state-of-the-art court technology, travel endowments, and student-athlete academic scholarships.
        </p>

        {/* Sponsor Management Control Bar */}
        <div className="mt-6 p-4 rounded-2xl bg-[#121824] border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#38bdf8] font-heading font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
            <span>Sponsor Management System</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${canManage ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-[#94a3b8]'}`}>
              {canManage ? 'Management Active' : 'View Mode'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white font-heading font-black text-xs uppercase tracking-wider shadow glow-blue transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              + Add Sponsor
            </button>

            <button
              onClick={() => {
                const next = !isManageMode;
                setIsManageMode(next);
                try {
                  localStorage.setItem('dunk_spike_sponsor_manage', String(next));
                } catch {}
              }}
              className={`px-3 py-2 rounded-xl border font-heading font-bold uppercase tracking-wider transition-colors ${
                canManage 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                  : 'bg-white/5 text-[#94a3b8] border-white/10 hover:text-white'
              }`}
            >
              {canManage ? '✓ Manage Mode ON' : 'Enable Delete Mode'}
            </button>

            <button
              onClick={handleResetSponsors}
              title="Reset all sponsor tiers and partners back to defaults"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white border border-white/15 font-heading font-bold uppercase tracking-wider transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
          </div>
        </div>
      </div>

      {/* Sponsorship Tiers Grid */}
      {tiers.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between relative shadow-2xl overflow-hidden"
            >
              {/* Ambient corner light */}
              <div
                className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl opacity-20 pointer-events-none"
                style={{ backgroundColor: tier.color }}
              />

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-heading font-black tracking-widest uppercase inline-block border"
                      style={{
                        backgroundColor: `${tier.color}15`,
                        color: tier.color,
                        borderColor: `${tier.color}40`,
                      }}
                    >
                      {tier.badge}
                    </span>

                    {/* Delete Tier Button */}
                    {canManage && (
                      <button
                        onClick={() => handleDeleteTier(tier.id, tier.name)}
                        title="Permanently delete this entire sponsorship tier"
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="font-heading font-black text-2xl text-white uppercase">
                    {tier.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 font-mono text-xl font-bold text-white">
                    <IndianRupee className="w-5 h-5 text-emerald-400" />
                    <span>{tier.investmentLevel.replace('$', '₹')}</span>
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-2 leading-relaxed">
                    {tier.description}
                  </p>
                </div>

                {/* Perks List */}
                <div className="space-y-2.5 pt-4 border-t border-white/10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#e1e2eb] block">
                    Tier Privileges:
                  </span>
                  {tier.perks.map((perk, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#94a3b8]">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>

                {/* Current Partners */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                      Current Official Partners ({tier.sponsors.length}):
                    </span>
                    {canManage && (
                      <button
                        onClick={() => handleOpenAddModal(tier.id)}
                        className="text-[11px] font-bold text-[#38bdf8] hover:text-[#0284c7] flex items-center gap-1 uppercase tracking-wider transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Add Partner
                      </button>
                    )}
                  </div>

                  {tier.sponsors.length > 0 ? (
                    tier.sponsors.map((s, idx) => (
                      <div 
                        key={idx} 
                        className="bg-[#10131a] p-3 rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/15 transition-all"
                      >
                        <div className="flex-1 pr-2">
                          <h4 className="font-heading font-bold text-white text-sm uppercase">{s.name}</h4>
                          <p className="text-[10px] text-[#94a3b8]">{s.subtext}</p>
                          <span className="text-[9px] font-mono text-white/50 block mt-0.5">Since {s.since} · {s.industry}</span>
                        </div>

                        {/* Permanent Delete Individual Sponsor Button */}
                        {canManage && (
                          <button
                            onClick={() => handleDeleteSponsor(tier.id, s.name)}
                            title={`Permanently delete ${s.name}`}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all shrink-0 opacity-80 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
                      <p className="text-xs text-[#94a3b8]">No active partners currently enrolled in this tier.</p>
                      {canManage && (
                        <button
                          onClick={() => handleOpenAddModal(tier.id)}
                          className="mt-2 text-xs font-bold text-[#38bdf8] hover:underline inline-flex items-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Enroll First Partner
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }}
                  className="w-full py-3 rounded-xl font-heading font-bold text-sm uppercase tracking-wider text-white border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  Inquire For This Tier
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel text-center py-16 px-6 rounded-3xl border border-white/10 space-y-4 max-w-xl mx-auto">
          <HeartHandshake className="w-12 h-12 text-[#94a3b8] mx-auto opacity-50" />
          <h3 className="font-heading text-2xl font-black text-white uppercase">
            All Sponsor Tiers Cleared
          </h3>
          <p className="text-xs text-[#94a3b8]">
            The sponsorship list is currently empty. As an administrator, you can restore standard tiers anytime.
          </p>
          {isAdminLoggedIn && (
            <button
              onClick={handleResetSponsors}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg glow-blue transition-all"
            >
              Restore Default Sponsor Tiers
            </button>
          )}
        </div>
      )}

      {/* Booster Contribution & Pledge Form (Indian Currency) */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 shadow-2xl max-w-4xl mx-auto relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-md">
            <div className="flex items-center gap-2 text-[#f97316]">
              <Sparkles className="w-5 h-5" />
              <span className="font-heading font-bold uppercase tracking-wider text-sm">
                Athletic Booster Club
              </span>
            </div>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-white uppercase leading-tight">
              Support The Student Athletes of 2026
            </h2>
            <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
              100% of community contributions go directly to travel accommodations, sports equipment, court maintenance, and student-athlete academic scholarships.
            </p>
          </div>

          <div className="w-full md:w-80 bg-[#0b0e14] p-6 rounded-2xl border border-white/10 space-y-4">
            {isPledged ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="font-heading font-black text-xl text-white uppercase">
                  Thank You, {donorName}!
                </h4>
                <p className="text-xs text-[#94a3b8]">
                  Your contribution of <strong className="text-white font-mono">₹{Number(pledgeAmount).toLocaleString('en-IN')}</strong> has been registered on the Official Booster Honor Roll.
                </p>
                <button
                  onClick={() => setIsPledged(false)}
                  className="text-xs font-bold text-[#38bdf8] hover:underline"
                >
                  Make another contribution
                </button>
              </div>
            ) : (
              <form onSubmit={handlePledge} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#94a3b8] mb-1">
                    Your Name / Organization
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="e.g. Mumbai Spikers Club"
                    className="w-full px-3 py-2 bg-[#121824] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#f97316]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#94a3b8] mb-1 flex items-center justify-between">
                    <span>Pledge Amount (₹ INR)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Any Value Allowed</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[10000, 25000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPledgeAmount(amt)}
                        className={`py-1.5 rounded-lg text-[11px] font-mono font-bold transition-colors ${
                          Number(pledgeAmount) === amt
                            ? 'bg-[#f97316] text-white'
                            : 'bg-white/5 text-[#94a3b8] hover:text-white'
                        }`}
                      >
                        ₹{amt >= 100000 ? `${amt / 100000}L` : `${amt / 1000}k`}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
                    <input
                      type="number"
                      value={pledgeAmount}
                      onChange={(e) => setPledgeAmount(e.target.value)}
                      placeholder="Enter any amount (e.g. 500)"
                      className="w-full pl-9 pr-3 py-2 bg-[#121824] border border-white/10 rounded-xl text-xs font-mono text-white outline-none focus:border-[#f97316]"
                      required
                      min="1"
                      step="any"
                    />
                  </div>
                  <p className="text-[10px] text-[#94a3b8] mt-1.5">
                    Enter any custom amount in Indian Rupees (₹) or choose a quick preset above.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-heading font-black text-sm uppercase tracking-wider text-white bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#fb923c] hover:to-[#f97316] shadow-lg glow-orange transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <IndianRupee className="w-4 h-4" />
                  Confirm Booster Pledge
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* Add Sponsor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/10">
              <div className="w-9 h-9 rounded-xl bg-[#0284c7]/20 border border-[#0284c7]/40 flex items-center justify-center text-[#38bdf8]">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                  Manually Add Official Sponsor
                </h3>
                <p className="text-[11px] text-[#94a3b8]">
                  Enrolls a new partner permanently into the tournament database
                </p>
              </div>
            </div>

            <form onSubmit={handleAddSponsorSubmit} className="space-y-4">
              {/* Select Sponsorship Tier */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#94a3b8] mb-1">
                  Assign to Sponsorship Tier
                </label>
                <select
                  value={targetTierId}
                  onChange={(e) => setTargetTierId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none"
                >
                  {tiers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.investmentLevel})
                    </option>
                  ))}
                  <option value="new_custom_tier">+ Create New Custom Tier...</option>
                </select>
              </div>

              {/* If Custom Tier */}
              {targetTierId === 'new_custom_tier' && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <span className="text-[11px] font-bold uppercase text-emerald-400 block">
                    New Tier Specifications
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-[#94a3b8] mb-0.5">Tier Name</label>
                      <input
                        type="text"
                        value={customTierName}
                        onChange={(e) => setCustomTierName(e.target.value)}
                        placeholder="e.g. Regional Silver Partner"
                        className="w-full px-2.5 py-1.5 bg-[#0b0e14] border border-white/15 rounded-lg text-xs text-white outline-none focus:border-emerald-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#94a3b8] mb-0.5">Investment Level (₹ INR)</label>
                      <input
                        type="text"
                        value={customTierInvestment}
                        onChange={(e) => setCustomTierInvestment(e.target.value)}
                        placeholder="e.g. ₹5,00,000 / Season"
                        className="w-full px-2.5 py-1.5 bg-[#0b0e14] border border-white/15 rounded-lg text-xs text-white outline-none focus:border-emerald-400"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#94a3b8] mb-1">
                  Partner / Brand Name
                </label>
                <input
                  type="text"
                  value={newSponsorName}
                  onChange={(e) => setNewSponsorName(e.target.value)}
                  placeholder="e.g. Tata Sports Foundation, Puma, Red Bull"
                  className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#94a3b8] mb-1">
                  Tagline / Sponsorship Subtext
                </label>
                <input
                  type="text"
                  value={newSponsorSubtext}
                  onChange={(e) => setNewSponsorSubtext(e.target.value)}
                  placeholder="e.g. Official Clean Energy & Stadium Nutrition Partner"
                  className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#94a3b8] mb-1">
                    Partner Since (Year)
                  </label>
                  <input
                    type="text"
                    value={newSponsorSince}
                    onChange={(e) => setNewSponsorSince(e.target.value)}
                    placeholder="2026"
                    className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#94a3b8] mb-1">
                    Industry / Sector
                  </label>
                  <input
                    type="text"
                    value={newSponsorIndustry}
                    onChange={(e) => setNewSponsorIndustry(e.target.value)}
                    placeholder="e.g. Sports Tech / Apparel"
                    className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white text-xs font-heading font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white text-xs font-heading font-black uppercase tracking-wider shadow-lg glow-blue transition-all active:scale-95"
                >
                  Save Sponsor Permanently
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#0b0e14]/95 border border-emerald-500/40 text-emerald-400 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-heading font-bold text-white tracking-wide">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-2 text-[#94a3b8] hover:text-white p-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};
