import React, { useState, useEffect } from 'react';
import { Sport, DisplayResolution } from '../types';
import { ViewType, VIEW_TO_HASH } from '../utils/navigationRoutes';
import { 
  X, 
  ChevronDown, 
  ChevronRight, 
  Trophy, 
  Award, 
  HeartHandshake, 
  Users, 
  ShieldCheck, 
  Scale, 
  Settings, 
  Tv, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Radio, 
  Flame, 
  Zap, 
  Lock, 
  LogOut, 
  Play, 
  Pause, 
  Sparkles, 
  RotateCw,
  Plus,
  Command,
  HelpCircle,
  FolderOpen,
  Layers
} from 'lucide-react';

import { RealtimeBadge } from './RealtimeBadge';
import { ResolutionController } from './ResolutionController';

interface SideDropdownNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentSport: Sport;
  onSportChange: (sport: Sport) => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isAdminLoggedIn: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenRulebook: () => void;
  onOpenRulesEditor?: () => void;
  onOpenCreateMatch?: () => void;
  onOpenTeamModal?: () => void;
  liveMatchesCount: number;
  currentResolution: DisplayResolution;
  onResolutionChange: (resolution: DisplayResolution) => void;
  isAutoRotateActive: boolean;
  onToggleAutoRotate: () => void;
  rotationInterval: number;
  onIntervalChange: (interval: number) => void;
  secondsRemaining: number;
}

const RESOLUTION_OPTIONS: { id: DisplayResolution; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'responsive', label: 'Auto Responsive', icon: <Monitor className="w-3.5 h-3.5" />, desc: 'Fluid 100% viewport width' },
  { id: '1080p', label: '1080p Broadcast', icon: <Tv className="w-3.5 h-3.5 text-[#38bdf8]" />, desc: 'Full HD 1920×1080 display' },
  { id: '4k', label: '4K Jumbotron', icon: <Monitor className="w-3.5 h-3.5 text-amber-400" />, desc: 'Stadium Video Wall scale' },
  { id: 'tablet', label: 'Table Tablet', icon: <Tablet className="w-3.5 h-3.5 text-emerald-400" />, desc: '1024×768 table scorer' },
  { id: 'mobile', label: 'Mobile Referee', icon: <Smartphone className="w-3.5 h-3.5 text-purple-400" />, desc: 'Compact handheld screen' },
];

export const SideDropdownNav: React.FC<SideDropdownNavProps> = ({
  isOpen,
  onClose,
  currentSport,
  onSportChange,
  currentView,
  onViewChange,
  isAdminLoggedIn,
  onOpenLogin,
  onLogout,
  onOpenRulebook,
  onOpenRulesEditor,
  onOpenCreateMatch,
  onOpenTeamModal,
  liveMatchesCount,
  currentResolution,
  onResolutionChange,
  isAutoRotateActive,
  onToggleAutoRotate,
  rotationInterval,
  onIntervalChange,
  secondsRemaining,
}) => {
  // Collapsible dropdown accordion sections state
  const [openSections, setOpenSections] = useState<{
    navigation: boolean;
    disciplines: boolean;
    rules: boolean;
    admin: boolean;
    broadcast: boolean;
    system: boolean;
  }>({
    navigation: true, // Primary views expanded by default
    disciplines: true, // Sport selector expanded
    rules: true, // Rulebooks expanded
    admin: true, // Admin tools expanded
    broadcast: false,
    system: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isVolleyball = currentSport === 'volleyball';
  const themeGlow = isVolleyball ? 'bg-[#0284c7]' : 'bg-[#f97316]';
  const accentColor = isVolleyball ? 'text-[#38bdf8]' : 'text-[#f97316]';
  const activeBgClass = isVolleyball 
    ? 'bg-[#0284c7]/20 border-[#0284c7]/50 text-white' 
    : 'bg-[#f97316]/20 border-[#f97316]/50 text-white';

  const handleNavigate = (view: ViewType) => {
    onViewChange(view);
    onClose();
  };

  const navLinks: { view: ViewType; label: string; desc: string; icon: React.ReactNode; badge?: string; adminOnly?: boolean }[] = [
    {
      view: 'schedule',
      label: 'Scores & Match Schedule',
      desc: 'Realtime court action, sets & box scores',
      icon: <Trophy className="w-4 h-4 text-[#38bdf8]" />,
      badge: liveMatchesCount > 0 ? `${liveMatchesCount} LIVE` : undefined,
    },
    {
      view: 'standings',
      label: 'Standings & Leaderboards',
      desc: 'Points table, set diffs & tournament seeds',
      icon: <Award className="w-4 h-4 text-amber-400" />,
    },
    {
      view: 'bracket',
      label: 'Playoff Brackets',
      desc: 'Quarterfinals, semifinals, bronze & finals tree',
      icon: <Layers className="w-4 h-4 text-[#38bdf8]" />,
    },
    {
      view: 'sponsors',

      label: 'Boosters & Sponsors',
      desc: 'Partners, pledge pool & booster tiers',
      icon: <HeartHandshake className="w-4 h-4 text-pink-400" />,
    },
    {
      view: 'teams',
      label: 'Teams & Rosters',
      desc: '8-player squads, starting line-ups & bench',
      icon: <Users className="w-4 h-4 text-cyan-400" />,
    },
    {
      view: 'admin',
      label: 'Court Scorer Console',
      desc: 'Live referee desk, timeout clock & whistle',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      badge: isAdminLoggedIn ? 'Admin' : 'Restricted',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Side Slide-Over Dropdown Drawer */}
      <aside 
        className="fixed inset-y-0 left-0 z-50 w-84 sm:w-96 max-w-[90vw] bg-[#0b0e14]/95 backdrop-blur-2xl border-r border-white/10 shadow-[25px_0_60px_rgba(0,0,0,0.85)] flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-300 ease-out text-[#e1e2eb]"
        role="dialog"
        aria-modal="true"
        aria-label="Tournament Side Navigation Menu"
      >
        {/* Dynamic Corner Lighting Glow */}
        <div 
          className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-500 ${themeGlow}`}
        />

        {/* ================= DRAWER HEADER ================= */}
        <div className="p-5 border-b border-white/10 bg-[#0d1118]/80 shrink-0 relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Brand Logo */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f97316] via-[#fb923c] to-[#0284c7] p-0.5 shadow-md shadow-black/50 shrink-0">
                <div className="w-full h-full bg-[#10131a] rounded-[9px] flex items-center justify-center font-heading font-black text-xs tracking-tighter">
                  <span className="text-[#f97316]">D</span>
                  <span className="text-white text-[8px] mx-0.5">&amp;</span>
                  <span className="text-[#38bdf8]">S</span>
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-heading font-black text-sm sm:text-base text-white tracking-wide uppercase truncate">
                    DUNK <span className="text-[#f97316]">&amp;</span> <span className="text-[#38bdf8]">SPIKE</span>
                  </h2>
                </div>
                <p className="text-[10px] text-[#94a3b8] font-mono truncate">
                  Side Dropdown Navigation · v2.0
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Close Menu (Esc)"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white border border-white/10 hover:border-white/20 transition-colors shrink-0"
              aria-label="Close Navigation Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sport Discipline Quick Toggle Capsule inside Side Menu */}
          <div className="mt-3.5 p-1 bg-[#07090e] rounded-xl border border-white/10 flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSportChange('volleyball')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-heading text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                currentSport === 'volleyball'
                  ? 'bg-[#0284c7] text-white shadow-md glow-blue'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Volleyball (VNL)</span>
            </button>
            <button
              type="button"
              onClick={() => onSportChange('basketball')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-heading text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                currentSport === 'basketball'
                  ? 'bg-[#f97316] text-white shadow-md glow-orange'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Basketball (FIBA)</span>
            </button>
          </div>

          {/* ================= ARENA TELEMETRY, DISPLAY & QUICK CONTROLS ================= */}
          <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
            {/* 1. LIVE COURTS Capsule */}
            <button
              type="button"
              onClick={() => handleNavigate('schedule')}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-[#ef4444]/15 via-[#f97316]/10 to-[#ef4444]/5 hover:from-[#ef4444]/25 hover:to-[#f97316]/20 border border-[#ef4444]/30 hover:border-[#ef4444]/60 transition-all group shadow-sm text-left"
              title="Click to view live courts & match telemetry"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ff5451] shrink-0">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-black text-xs uppercase tracking-wider text-[#ff5451]">
                      LIVE COURTS
                    </span>
                    {liveMatchesCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-ping" />
                    )}
                  </div>
                  <span className="text-[10px] text-[#94a3b8] font-mono block truncate">
                    {liveMatchesCount > 0
                      ? `${liveMatchesCount} active match${liveMatchesCount > 1 ? 'es' : ''} in arena`
                      : 'Standby · Ready for next game'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-[#ef4444]/20 text-[#ff5451] border border-[#ef4444]/30 shrink-0">
                <span>{liveMatchesCount > 0 ? `${liveMatchesCount} LIVE` : '0 LIVE'}</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* 2. LIVE DB & Auto Display Bar */}
            <div className="flex items-center justify-between gap-1.5">
              {/* LIVE DB */}
              <div className="flex-1 min-w-0">
                <RealtimeBadge 
                  forceShowDetails={true}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#07090e] border border-white/10 hover:border-white/20 text-xs text-[#94a3b8] hover:text-white transition-all shadow-sm group truncate"
                />
              </div>

              {/* Auto (Resolution Controller) */}
              <div className="shrink-0">
                <ResolutionController
                  currentResolution={currentResolution}
                  onResolutionChange={onResolutionChange}
                  isAutoRotateActive={isAutoRotateActive}
                  onToggleAutoRotate={onToggleAutoRotate}
                  rotationInterval={rotationInterval}
                  onIntervalChange={onIntervalChange}
                  currentView={currentView}
                  secondsRemaining={secondsRemaining}
                  dropdownAlign="left"
                />
              </div>
            </div>

            {/* 3. Quick Action Row: + Team & Admin */}
            <div className="flex items-center gap-1.5">
              {/* + Team Button */}
              {onOpenTeamModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTeamModal();
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-300 hover:text-white font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                  title="Create or Manage Team Rosters & Players (+ Team)"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>+ Team</span>
                </button>
              )}

              {/* Admin Button */}
              {isAdminLoggedIn ? (
                <div className="flex-1 flex items-center justify-between bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-xs font-heading font-bold text-emerald-300 uppercase tracking-wider truncate">
                      Admin
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    title="Log Out Admin Session"
                    className="p-1 rounded text-[#94a3b8] hover:text-rose-400 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[#e1e2eb] hover:text-white font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                  title="Admin Sign In"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= SCROLLABLE DROPDOWN BODY ================= */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 pr-2 no-scrollbar relative z-10 text-xs">

          {/* DROPDOWN 1: Tournament Views & Pages */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('navigation')}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-2 font-heading font-black text-xs uppercase tracking-wider text-white">
                <FolderOpen className="w-4 h-4 text-[#38bdf8]" />
                <span>Primary Navigation</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#94a3b8]">
                <span className="text-[10px] font-mono">5 Pages</span>
                {openSections.navigation ? (
                  <ChevronDown className="w-3.5 h-3.5 transition-transform" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 transition-transform" />
                )}
              </div>
            </button>

            {openSections.navigation && (
              <div className="p-2 pt-0 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150 border-t border-white/5">
                {navLinks.map((link) => {
                  const isActive = currentView === link.view;
                  return (
                    <button
                      key={link.view}
                      type="button"
                      onClick={() => handleNavigate(link.view)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                        isActive
                          ? activeBgClass
                          : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10 text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-1.5 rounded-lg border shrink-0 ${
                          isActive 
                            ? 'bg-white/10 border-white/20 text-white' 
                            : 'bg-black/30 border-white/5 group-hover:border-white/15 text-[#94a3b8]'
                        }`}>
                          {link.icon}
                        </div>
                        <div className="min-w-0">
                          <span className={`font-heading font-bold text-xs uppercase tracking-wide block truncate ${
                            isActive ? 'text-white' : 'text-[#e1e2eb]'
                          }`}>
                            {link.label}
                          </span>
                          <span className="text-[10px] text-[#94a3b8] block truncate">
                            {link.desc}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {link.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                            link.badge.includes('LIVE')
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {link.badge}
                          </span>
                        )}
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* DROPDOWN 2: Rules & Championship Settings */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('rules')}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-2 font-heading font-black text-xs uppercase tracking-wider text-amber-400">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Rules &amp; Regulations</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#94a3b8]">
                <span className="text-[10px] font-mono">FIVB · FIBA</span>
                {openSections.rules ? (
                  <ChevronDown className="w-3.5 h-3.5 transition-transform" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 transition-transform" />
                )}
              </div>
            </button>

            {openSections.rules && (
              <div className="p-2 pt-0 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150 border-t border-white/5">
                {/* Official Rulebook */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRulebook();
                  }}
                  className="w-full p-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 text-left transition-all flex items-center justify-between text-[#e1e2eb] group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-black/30 border border-white/5 text-[#38bdf8]">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-heading font-bold text-xs uppercase block text-white">
                        Official Championship Rulebook
                      </span>
                      <span className="text-[10px] text-[#94a3b8] block">
                        FIVB deuce rules, 24s shot clock, &amp; violations
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8] group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Admin Rules & Engine Configuration */}
                {onOpenRulesEditor && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRulesEditor();
                    }}
                    className="w-full p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-left transition-all flex items-center justify-between text-[#e1e2eb] group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-bold text-xs uppercase block text-white">
                            Customize Rules (Admin)
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                            Admin
                          </span>
                        </div>
                        <span className="text-[10px] text-[#94a3b8] block">
                          Set targets (25/15), subs/set (6), fouls &amp; timeouts
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* DROPDOWN 3: Quick Admin Operations */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('admin')}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-2 font-heading font-black text-xs uppercase tracking-wider text-cyan-400">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Admin Quick Actions</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#94a3b8]">
                <span className="text-[10px] font-mono">Tools</span>
                {openSections.admin ? (
                  <ChevronDown className="w-3.5 h-3.5 transition-transform" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 transition-transform" />
                )}
              </div>
            </button>

            {openSections.admin && (
              <div className="p-2 pt-0 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150 border-t border-white/5">
                {/* Create New Official Match */}
                {onOpenCreateMatch && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCreateMatch();
                    }}
                    className="w-full p-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 text-left transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-black/30 border border-white/5 text-cyan-400">
                        <Plus className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-heading font-bold text-xs uppercase block text-white">
                          Schedule New Match
                        </span>
                        <span className="text-[10px] text-[#94a3b8] block">
                          Create match with pre-existing team limit
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Create or Edit Team Rosters */}
                {onOpenTeamModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTeamModal();
                    }}
                    className="w-full p-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 text-left transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-black/30 border border-white/5 text-[#38bdf8]">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-heading font-bold text-xs uppercase block text-white">
                          Manage Team Rosters
                        </span>
                        <span className="text-[10px] text-[#94a3b8] block">
                          Add players, jersey numbers, &amp; positions
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Scorer Console Station */}
                <button
                  type="button"
                  onClick={() => handleNavigate('admin')}
                  className="w-full p-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 text-left transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-black/30 border border-white/5 text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-heading font-bold text-xs uppercase block text-white">
                        Scorer Station
                      </span>
                      <span className="text-[10px] text-[#94a3b8] block">
                        Live match control &amp; whistle system
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* DROPDOWN 4: Stadium Display & TV Broadcast */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('broadcast')}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-2 font-heading font-black text-xs uppercase tracking-wider text-[#38bdf8]">
                <Tv className="w-4 h-4 text-[#38bdf8]" />
                <span>Stadium Display &amp; Broadcast</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#94a3b8]">
                <span className="text-[10px] font-mono capitalize">{currentResolution}</span>
                {openSections.broadcast ? (
                  <ChevronDown className="w-3.5 h-3.5 transition-transform" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 transition-transform" />
                )}
              </div>
            </button>

            {openSections.broadcast && (
              <div className="p-3 pt-0 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150 border-t border-white/5">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#94a3b8] block mb-1.5">
                    Display Output Mode:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {RESOLUTION_OPTIONS.map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => onResolutionChange(res.id)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          currentResolution === res.id
                            ? 'bg-[#0284c7]/25 border-[#0284c7] text-white shadow'
                            : 'bg-black/30 border-white/5 text-[#94a3b8] hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {res.icon}
                        <span className="font-heading font-bold text-[11px] truncate">
                          {res.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specialized Arena Feeds */}
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-[#94a3b8] block mb-1">
                    Specialized Arena Feeds:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleNavigate('overlay')}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#38bdf8]/40 text-left transition-all"
                    >
                      <span className="font-heading font-black text-[11px] text-white block uppercase flex items-center gap-1">
                        <Radio className="w-3 h-3 text-[#38bdf8]" /> OBS Overlay
                      </span>
                      <span className="text-[9px] text-[#94a3b8] block">Transparent stream bug</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigate('jumbotron')}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 text-left transition-all"
                    >
                      <span className="font-heading font-black text-[11px] text-white block uppercase flex items-center gap-1">
                        <Tv className="w-3 h-3 text-emerald-400" /> Jumbotron
                      </span>
                      <span className="text-[9px] text-[#94a3b8] block">Stadium LED display</span>
                    </button>
                  </div>
                </div>

                {/* Automated Kiosk View Rotation */}

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-heading font-bold text-xs text-white block">
                      Auto-Rotate Views
                    </span>
                    <span className="text-[10px] text-[#94a3b8]">
                      {isAutoRotateActive ? `Cycling views (${secondsRemaining}s left)` : 'Paused (static)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleAutoRotate}
                    className={`px-3 py-1.5 rounded-xl border font-heading font-bold text-xs uppercase flex items-center gap-1.5 transition-all ${
                      isAutoRotateActive
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-white/5 text-[#94a3b8] border-white/10 hover:text-white'
                    }`}
                  >
                    {isAutoRotateActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{isAutoRotateActive ? 'Active' : 'Start'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DROPDOWN 5: Keyboard Shortcuts Guide */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('system')}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-2 font-heading font-black text-xs uppercase tracking-wider text-[#94a3b8] group-hover:text-white">
                <Command className="w-4 h-4 text-[#94a3b8]" />
                <span>Keyboard Shortcuts</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#94a3b8]">
                <span className="text-[10px] font-mono">Hotkeys</span>
                {openSections.system ? (
                  <ChevronDown className="w-3.5 h-3.5 transition-transform" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 transition-transform" />
                )}
              </div>
            </button>

            {openSections.system && (
              <div className="p-3 pt-0 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150 border-t border-white/5 text-[11px]">
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span>Side Menu</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/15 text-white font-mono text-[10px]">M</kbd>
                </div>
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span>Scores / Standings / Boosters</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/15 text-white font-mono text-[10px]">1 / 2 / 3</kbd>
                </div>
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span>Console / Teams</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/15 text-white font-mono text-[10px]">4 / 5</kbd>
                </div>
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span>Basketball / Volleyball</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/15 text-white font-mono text-[10px]">B / V</kbd>
                </div>
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span>Rulebook Modal</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/15 text-white font-mono text-[10px]">R or ?</kbd>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ================= DRAWER FOOTER: AUTH & STATUS ================= */}
        <div className="p-4 border-t border-white/10 bg-[#0d1118]/90 shrink-0 relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isAdminLoggedIn ? 'bg-emerald-400 animate-pulse' : 'bg-[#64748b]'}`} />
              <span className="font-heading font-bold text-xs uppercase text-white">
                {isAdminLoggedIn ? 'Administrator' : 'Public Observer'}
              </span>
            </div>

            {isAdminLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-heading font-bold uppercase transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Log Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-[11px] font-heading font-bold uppercase transition-colors flex items-center gap-1 shadow"
              >
                <Lock className="w-3 h-3 text-[#38bdf8]" />
                <span>Admin Login</span>
              </button>
            )}
          </div>

          <div className="text-[10px] text-[#64748b] text-center pt-1 border-t border-white/5">
            Dunk &amp; Spike Championship System · FIVB &amp; FIBA Sanctioned
          </div>
        </div>

      </aside>
    </div>
  );
};
