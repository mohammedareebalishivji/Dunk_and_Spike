import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  ShieldAlert, 
  Eye, 
  EyeOff,
  Radio,
  Sparkles
} from 'lucide-react';
import { realtimeDB } from '../services/realtimeDatabase';
import { PROVISIONED_COURTS } from '../utils/authValidation';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: string, court: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'director' | 'courtPin'>('director');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin2026');
  const [court, setCourt] = useState('Court 1 - Hardwood Arena');
  const [courtPin, setCourtPin] = useState('');
  const [role, setRole] = useState('Tournament Director / Master Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsAuthenticating(true);

    try {
      let res;
      if (authMode === 'courtPin') {
        res = await realtimeDB.verifyCourtPin(court, courtPin);
      } else {
        res = await realtimeDB.login({
          username,
          password,
          role,
          court,
        });
      }

      setIsAuthenticating(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user.displayName || role, res.user.court || court);
        onClose();
      } else {
        setErrorMessage(res.error || 'Access Denied: Invalid credentials.');
      }
    } catch {
      setIsAuthenticating(false);
      setErrorMessage('Authentication request failed. Please check network connection.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#0284c7] rounded-full blur-3xl opacity-25 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-[#f97316] rounded-full blur-3xl opacity-20 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#0284c7] p-0.5 shadow-lg">
            <div className="w-full h-full bg-[#10131a] rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#38bdf8]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-black text-2xl text-white uppercase tracking-wide">
                Admin Authentication
              </h3>
            </div>
            <p className="text-xs text-[#94a3b8]">
              Sanctioned Scorer &amp; Tournament Administration
            </p>
          </div>
        </div>

        {/* Auth Mode Switcher */}
        <div className="flex p-1 bg-[#090d14] rounded-2xl border border-white/10 mb-4">
          <button
            type="button"
            onClick={() => {
              setAuthMode('director');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
              authMode === 'director'
                ? 'bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white shadow-md'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Tournament Director
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('courtPin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
              authMode === 'courtPin'
                ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-md'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Court Scorer PIN
          </button>
        </div>

        {/* Security Warning Notice */}
        <div className="mb-5 p-3 rounded-xl bg-[#0b0e14] border border-amber-500/30 flex items-start gap-2.5 text-xs text-[#94a3b8]">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block uppercase font-heading tracking-wider">
              {authMode === 'director' ? 'Master Admin Verification' : 'Court Jurisdiction Isolation Active'}
            </strong>
            <span>
              {authMode === 'director'
                ? 'Certified officials only. Passcodes are cryptographically authenticated by the server.'
                : 'Scorers are locked to their assigned court to prevent accidental cross-court score tampering.'}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-200 animate-in shake duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'director' ? (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                  Administrator Username / ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Enter admin ID"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                  Admin Passcode / Security Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Enter passcode"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#94a3b8] hover:text-white transition-colors"
                    title={showPassword ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                  Admin Role Level
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none font-medium"
                >
                  <option value="Tournament Director / Master Admin">Tournament Director / Master Admin</option>
                  <option value="Head Court Scorer Administrator">Head Court Scorer Administrator</option>
                  <option value="Sanctioned League Commissioner">Sanctioned League Commissioner</option>
                  <option value="Lead Broadcast Stats Official">Lead Broadcast Stats Official</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                  Target Court Terminal
                </label>
                <select
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none font-medium"
                >
                  {PROVISIONED_COURTS.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                  4-Digit Court Security PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    maxLength={8}
                    value={courtPin}
                    onChange={(e) => {
                      setCourtPin(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Enter Court PIN (e.g. 1001 for Court 1)"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#f97316] outline-none font-mono tracking-widest text-center"
                    required
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-[#94a3b8]">
                  <span>Court 1 PIN: <code className="text-[#f97316] font-mono">1001</code></span>
                  <span>Court 2: <code className="text-[#f97316] font-mono">1002</code></span>
                  <span>Court 3: <code className="text-[#f97316] font-mono">1003</code></span>
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isAuthenticating}
              className={`w-full py-3 px-4 rounded-xl font-heading font-black text-sm uppercase tracking-wider text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 ${
                authMode === 'director'
                  ? 'bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] glow-blue'
                  : 'bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#ea580c] glow-orange'
              }`}
            >
              <Lock className="w-4 h-4" />
              {isAuthenticating ? 'Verifying Session...' : authMode === 'director' ? 'Authenticate Director' : 'Unlock Court Scoring'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Security Policy Statement */}
        <div className="mt-5 pt-4 border-t border-white/10 space-y-2 text-center">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-[#94a3b8]">
            <span>Master Credentials: <code className="text-[#38bdf8] font-mono font-bold">admin</code> / <code className="text-[#38bdf8] font-mono font-bold">admin2026</code></span>
            <button
              type="button"
              onClick={() => {
                if (authMode === 'courtPin') {
                  setCourtPin('1001');
                } else {
                  setUsername('admin');
                  setPassword('admin2026');
                }
              }}
              className="text-xs text-[#38bdf8] hover:text-white font-bold uppercase tracking-wider underline cursor-pointer"
            >
              Auto Fill
            </button>
          </div>
          <p className="text-[11px] text-[#94a3b8] leading-relaxed">
            Public user registration is disabled. Scorer sessions are tracked and audited for match legitimacy.
          </p>
        </div>

      </div>
    </div>
  );
};
