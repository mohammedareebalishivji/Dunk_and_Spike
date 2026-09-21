import React from 'react';
import { Sport, DisplayResolution } from '../types';
import { ViewType } from '../utils/navigationRoutes';
import { Trophy, ShieldCheck, Flame, Zap, Scale, Users, Award, HeartHandshake, Settings, Menu, LogOut } from 'lucide-react';

interface NavbarProps {
  currentSport: Sport;
  onSportChange: (sport: Sport) => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isAdminLoggedIn: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenRulebook: () => void;
  onOpenRulesEditor?: () => void;
  liveMatchesCount: number;
  currentResolution: DisplayResolution;
  onResolutionChange: (resolution: DisplayResolution) => void;
  isAutoRotateActive: boolean;
  onToggleAutoRotate: () => void;
  rotationInterval: number;
  onIntervalChange: (interval: number) => void;
  secondsRemaining: number;
  onOpenTeamModal?: () => void;
  onToggleSideMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSport,
  onSportChange,
  currentView,
  onViewChange,
  isAdminLoggedIn,
  onOpenLogin,
  onLogout,
  onOpenRulebook,
  onOpenRulesEditor,
  liveMatchesCount,
  currentResolution,
  onResolutionChange,
  isAutoRotateActive,
  onToggleAutoRotate,
  rotationInterval,
  onIntervalChange,
  secondsRemaining,
  onOpenTeamModal,
  onToggleSideMenu,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 bg-[#0d1117]/95 backdrop-blur-xl transition-all">
      <div className="w-full max-w-[1600px] mx-auto px-2.5 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-2 lg:gap-3 flex-nowrap">
        
        {/* Left: Side Dropdown Menu Trigger, Brand Logo & Sport Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Side Dropdown Menu Trigger Button */}
          <button
            type="button"
            onClick={onToggleSideMenu}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-[#38bdf8]/40 transition-all duration-200 group active:scale-95 shadow-sm shrink-0"
            title="Open Side Dropdown Menu (Key: M)"
            aria-label="Open Side Dropdown Navigation Menu"
          >
            <Menu className="w-4 h-4 text-[#38bdf8] group-hover:scale-110 transition-transform duration-200" />
            <span className="hidden md:inline font-heading font-black text-xs uppercase tracking-wider text-white">
              Menu
            </span>
          </button>

          {/* Brand Logo & Title */}
          <div 
            onClick={() => onViewChange('schedule')}
            className="flex items-center gap-2 cursor-pointer group shrink-0 select-none"
            title="Dunk & Spike Championship Portal"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f97316] via-[#fb923c] to-[#0284c7] p-0.5 shadow-md shadow-black/40 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <div className="w-full h-full bg-[#10131a] rounded-[9px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f97316]/20 to-[#0284c7]/20" />
                <div className="flex items-center justify-center font-heading font-black text-xs tracking-tighter">
                  <span className="text-[#f97316]">D</span>
                  <span className="text-white text-[8px] mx-0.5">&amp;</span>
                  <span className="text-[#38bdf8]">S</span>
                </div>
              </div>
            </div>
            
            <div className="shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-sm sm:text-base xl:text-lg font-black tracking-wide text-white whitespace-nowrap">
                  DUNK <span className="text-[#f97316]">&amp;</span> <span className="text-[#38bdf8]">SPIKE</span>
                </span>
              </div>
            </div>
          </div>

          {/* Central Sport Switcher Capsule */}
          <div className="flex items-center bg-[#0b0e14] p-0.5 sm:p-1 rounded-full border border-white/10 shadow-inner shrink-0">
            <button
              onClick={() => onSportChange('basketball')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full font-heading text-[11px] sm:text-xs font-bold tracking-wider transition-all duration-200 ${
                currentSport === 'basketball'
                  ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-md glow-orange scale-[1.02]'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Basketball View (Key: B)"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden md:inline">BASKETBALL</span>
              <span className="hidden sm:inline md:hidden">HOOPS</span>
            </button>
            <button
              onClick={() => onSportChange('volleyball')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full font-heading text-[11px] sm:text-xs font-bold tracking-wider transition-all duration-200 ${
                currentSport === 'volleyball'
                  ? 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white shadow-md glow-blue scale-[1.02]'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Volleyball View (Key: V)"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden md:inline">VOLLEYBALL</span>
              <span className="hidden sm:inline md:hidden">VOLLEY</span>
            </button>
          </div>
        </div>

        {/* Center: Primary View Tabs (Desktop & Laptop) */}
        <nav 
          role="tablist"
          aria-label="Tournament View Navigation"
          className="hidden lg:flex items-center bg-[#090d14]/80 p-1 rounded-xl border border-white/10 shadow-inner shrink-0"
        >
          {/* Scores & Schedule Tab */}
          <button
            role="tab"
            aria-selected={currentView === 'schedule'}
            onClick={() => onViewChange('schedule')}
            title="Scores & Match Schedule (Key: 1 or S)"
            className={`px-2.5 xl:px-3 py-1 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              currentView === 'schedule'
                ? currentSport === 'basketball'
                  ? 'bg-[#f97316]/20 text-white border border-[#f97316]/50 shadow-sm'
                  : 'bg-[#0284c7]/25 text-white border border-[#0284c7]/50 shadow-sm'
                : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Scores</span>
          </button>

          {/* Standings Tab */}
          <button
            role="tab"
            aria-selected={currentView === 'standings'}
            onClick={() => onViewChange('standings')}
            title="Standings & Team Leaderboards (Key: 2 or T)"
            className={`px-2.5 xl:px-3 py-1 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              currentView === 'standings'
                ? currentSport === 'basketball'
                  ? 'bg-[#f97316]/20 text-white border border-[#f97316]/50 shadow-sm'
                  : 'bg-[#0284c7]/25 text-white border border-[#0284c7]/50 shadow-sm'
                : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Standings</span>
          </button>

          {/* Sponsors Tab */}
          <button
            role="tab"
            aria-selected={currentView === 'sponsors'}
            onClick={() => onViewChange('sponsors')}
            title="Tournament Sponsors & Boosters (Key: 3 or P)"
            className={`px-2.5 xl:px-3 py-1 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              currentView === 'sponsors'
                ? currentSport === 'basketball'
                  ? 'bg-[#f97316]/20 text-white border border-[#f97316]/50 shadow-sm'
                  : 'bg-[#0284c7]/25 text-white border border-[#0284c7]/50 shadow-sm'
                : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-pink-400" />
            <span>Sponsors</span>
          </button>

          {/* Teams Registry Tab */}
          <button
            role="tab"
            aria-selected={currentView === 'teams'}
            onClick={() => onViewChange('teams')}
            title="Manage Championship Teams & Rosters (Key: 5 or T)"
            className={`px-2.5 xl:px-3 py-1 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              currentView === 'teams'
                ? currentSport === 'basketball'
                  ? 'bg-[#f97316]/20 text-white border border-[#f97316]/50 shadow-sm'
                  : 'bg-[#0284c7]/25 text-white border border-[#0284c7]/50 shadow-sm'
                : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Teams</span>
          </button>

          {/* Scorer Console Tab */}
          <button
            role="tab"
            aria-selected={currentView === 'admin'}
            onClick={() => onViewChange('admin')}
            title="Live Court Scorer Console (Key: 4 or C)"
            className={`px-2.5 xl:px-3 py-1 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              currentView === 'admin'
                ? 'bg-[#0284c7]/25 text-[#38bdf8] border border-[#0284c7]/50 font-black shadow-sm'
                : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Console</span>
          </button>
        </nav>

        {/* Right: Quick Rules Access */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Rules Quick Access */}
          <button
            onClick={onOpenRulebook}
            title="Official FIVB & FIBA Rules (Key: R or ?)"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#38bdf8] hover:text-white border border-white/10 hover:border-[#38bdf8]/40 text-xs font-heading font-bold uppercase tracking-wider transition-all shrink-0 shadow-sm"
          >
            <Scale className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rulebook</span>
          </button>

          {/* Championship Rules Configuration (Admin) */}
          {isAdminLoggedIn && onOpenRulesEditor && (
            <button
              onClick={onOpenRulesEditor}
              title="Configure Championship Rules & Scoring Settings (Admin)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-heading font-bold uppercase tracking-wider transition-all shrink-0 shadow-sm"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Rules Editor</span>
            </button>
          )}

          {/* Admin Register Team Button */}
          {isAdminLoggedIn && onOpenTeamModal && (
            <button
              onClick={onOpenTeamModal}
              title="Register New Championship Team & Roster (Admin)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400 text-xs font-heading font-bold uppercase tracking-wider transition-all shrink-0 shadow-sm active:scale-95"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">+ Register Team</span>
              <span className="sm:hidden">+ Team</span>
            </button>
          )}

          {/* Admin / Login in Navigation Bar */}
          {isAdminLoggedIn ? (
            <div className="flex items-center gap-1.5 bg-[#151921] px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-500/30 shrink-0 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white font-heading uppercase tracking-wider">
                Admin
              </span>
              <button
                onClick={onLogout}
                title="Log Out Admin"
                className="text-[#94a3b8] hover:text-rose-400 p-0.5 rounded transition-colors ml-0.5"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-[#38bdf8]/40 transition-all active:scale-95 shrink-0 shadow-sm group"
              title="Admin Login to Scorer Station"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#38bdf8] group-hover:scale-110 transition-transform" />
              <span>Admin / Login</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
