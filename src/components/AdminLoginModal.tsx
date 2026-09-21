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
  CheckCircle2
} from 'lucide-react';
import { validateAdminLogin } from '../utils/authValidation';

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [court, setCourt] = useState('Court 1 - Hardwood Arena');
  const [role, setRole] = useState('Tournament Director / Master Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsAuthenticating(true);

    setTimeout(() => {
      setIsAuthenticating(false);
      const result = validateAdminLogin(username, password, role);
      if (result.isValid) {
        onLoginSuccess(role, court);
        onClose();
      } else {
        setErrorMessage(result.error || 'Access Denied: Only certified administrators are authorized.');
      }
    }, 350);
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
                Admin Portal Login
              </h3>
            </div>
            <p className="text-xs text-[#94a3b8]">
              Restricted Scorer &amp; Tournament Administration Console
            </p>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="mb-5 p-3 rounded-xl bg-[#0b0e14] border border-amber-500/30 flex items-start gap-2.5 text-xs text-[#94a3b8]">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block uppercase font-heading tracking-wider">
              Restricted Access · Authorized Admins Only
            </strong>
            <span>
              Public registration and guest sign-ups are prohibited. Only provisioned tournament administrators can access this system.
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
              Admin Passcode / Security PIN
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Assigned Court Jurisdiction
            </label>
            <select
              value={court}
              onChange={(e) => setCourt(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none font-medium"
            >
              <option value="Court 1 - Hardwood Arena">Court 1 - Hardwood Arena (Basketball Main)</option>
              <option value="Court 2 - Fieldhouse">Court 2 - Fieldhouse (Basketball &amp; Multi-sport)</option>
              <option value="Court 3 - Volleyball Pavilion">Court 3 - Volleyball Pavilion (AVCA Championship)</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 px-4 rounded-xl font-heading font-black text-sm uppercase tracking-wider text-white bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] shadow-lg glow-blue transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {isAuthenticating ? 'Authenticating Admin...' : 'Authenticate & Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Security Policy Statement (Explicitly stating no public registration) */}
        <div className="mt-5 pt-4 border-t border-white/10 space-y-2 text-center">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-[#94a3b8]">
            <span>Admin ID: <code className="text-[#38bdf8] font-mono font-bold">admin</code> · Pass: <code className="text-[#38bdf8] font-mono font-bold">admin</code></span>
            <button
              type="button"
              onClick={() => {
                setUsername('admin');
                setPassword('admin');
              }}
              className="text-xs text-[#38bdf8] hover:text-white font-bold uppercase tracking-wider underline cursor-pointer"
            >
              Quick Fill
            </button>
          </div>
          <p className="text-[11px] text-[#94a3b8] leading-relaxed">
            Public user registration is disabled on this terminal. For credentials, contact the Athletic Operations Committee.
          </p>
        </div>

      </div>
    </div>
  );
};
