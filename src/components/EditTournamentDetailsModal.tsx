import React, { useState, useEffect } from 'react';
import { 
  TournamentDetails, 
  getTournamentDetails, 
  saveTournamentDetails, 
  resetTournamentDetails 
} from '../utils/tournamentDetailsManager';
import { Settings, Save, RotateCcw, X, Check, Trophy, Calendar, MapPin, Shield } from 'lucide-react';

interface EditTournamentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (details: TournamentDetails) => void;
}

export const EditTournamentDetailsModal: React.FC<EditTournamentDetailsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [details, setDetails] = useState<TournamentDetails>(() => getTournamentDetails());
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDetails(getTournamentDetails());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = saveTournamentDetails(details);
    setSuccess(true);
    if (onSaved) onSaved(updated);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1000);
  };

  const handleReset = () => {
    const reset = resetTournamentDetails();
    setDetails(reset);
    setSuccess(true);
    if (onSaved) onSaved(reset);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl glass-panel-elevated rounded-3xl border border-white/20 p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff7a00]/20 border border-[#ff7a00]/40 flex items-center justify-center text-[#ff7a00]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                Edit Tournament Details
              </h3>
              <p className="text-xs text-[#e0c0af]">
                Admin Full Control: update brand title, dates, venue, accreditation, and awards.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Tournament Name & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-heading font-black uppercase tracking-wider text-white mb-1">
                Tournament Name
              </label>
              <input
                type="text"
                value={details.name}
                onChange={(e) => setDetails({ ...details, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ff7a00] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-black uppercase tracking-wider text-white mb-1">
                Edition Subtitle
              </label>
              <input
                type="text"
                value={details.subheadline}
                onChange={(e) => setDetails({ ...details, subheadline: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ff7a00] outline-none"
              />
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-xs font-heading font-black uppercase tracking-wider text-white mb-1">
              Championship Tagline
            </label>
            <input
              type="text"
              value={details.tagline}
              onChange={(e) => setDetails({ ...details, tagline: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ff7a00] outline-none"
            />
          </div>

          {/* Dates & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-heading font-black uppercase tracking-wider text-white mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#ff7a00]" />
                Tournament Dates
              </label>
              <input
                type="text"
                value={details.dates}
                onChange={(e) => setDetails({ ...details, dates: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ff7a00] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-black uppercase tracking-wider text-white mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#38bdf8]" />
                Arena / Venue Location
              </label>
              <input
                type="text"
                value={details.venue}
                onChange={(e) => setDetails({ ...details, venue: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#38bdf8] outline-none"
              />
            </div>
          </div>

          {/* Sanctioning & Accreditation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-heading font-black uppercase tracking-wider text-white mb-1">
                Basketball Sanctioning
              </label>
              <input
                type="text"
                value={details.sanctionBasketball}
                onChange={(e) => setDetails({ ...details, sanctionBasketball: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ff7a00] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-black uppercase tracking-wider text-white mb-1">
                Volleyball Sanctioning
              </label>
              <input
                type="text"
                value={details.sanctionVolleyball}
                onChange={(e) => setDetails({ ...details, sanctionVolleyball: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#38bdf8] outline-none"
              />
            </div>
          </div>

          {/* Awards & Honors (Strictly No Cash Prizes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-heading font-black uppercase tracking-wider text-white mb-1 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-[#ff7a00]" />
                Basketball Grand Award
              </label>
              <input
                type="text"
                value={details.basketballAward}
                onChange={(e) => setDetails({ ...details, basketballAward: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ff7a00] outline-none"
                placeholder="e.g. Championship Banner & Gold Trophy"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-black uppercase tracking-wider text-white mb-1 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-[#38bdf8]" />
                Volleyball Grand Award
              </label>
              <input
                type="text"
                value={details.volleyballAward}
                onChange={(e) => setDetails({ ...details, volleyballAward: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#38bdf8] outline-none"
                placeholder="e.g. National Cup & Gold Trophy"
              />
            </div>
          </div>

          {/* Tournament Desk Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-heading font-bold uppercase text-white/70 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={details.contactEmail}
                onChange={(e) => setDetails({ ...details, contactEmail: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold uppercase text-white/70 mb-1">
                Helpline Phone
              </label>
              <input
                type="text"
                value={details.contactPhone}
                onChange={(e) => setDetails({ ...details, contactPhone: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold uppercase text-white/70 mb-1">
                Arena Gate / Location
              </label>
              <input
                type="text"
                value={details.arenaGate}
                onChange={(e) => setDetails({ ...details, arenaGate: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ea580c] hover:from-[#fb923c] hover:to-[#ff7a00] text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg glow-orange flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {success ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Tournament Details</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
