import React, { useState, useEffect } from 'react';
import { DisplayResolution } from '../types';
import { 
  Monitor, 
  Tv, 
  Tablet, 
  Smartphone, 
  RotateCw, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2, 
  Settings2,
  Sparkles,
  Timer
} from 'lucide-react';

interface ResolutionControllerProps {
  currentResolution: DisplayResolution;
  onResolutionChange: (resolution: DisplayResolution) => void;
  isAutoRotateActive: boolean;
  onToggleAutoRotate: () => void;
  rotationInterval: number; // in seconds
  onIntervalChange: (interval: number) => void;
  currentView: string;
  secondsRemaining: number;
  dropdownAlign?: 'left' | 'right';
  className?: string;
}

const RESOLUTION_OPTIONS: { id: DisplayResolution; label: string; shortLabel: string; width: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'responsive', label: 'Auto Responsive', shortLabel: 'Auto', width: '100%', icon: <Monitor className="w-3.5 h-3.5" />, desc: 'Fluid 100% viewport width' },
  { id: '1080p', label: '1080p Broadcast', shortLabel: '1080p', width: '1920px', icon: <Tv className="w-3.5 h-3.5" />, desc: '1920 × 1080 Full HD Broadcast' },
  { id: '4k', label: '4K Jumbotron', shortLabel: '4K', width: '2560px', icon: <Monitor className="w-3.5 h-3.5 text-amber-400" />, desc: 'Stadium Video Wall / Jumbotron Scale' },
  { id: 'tablet', label: 'Court Tablet', shortLabel: 'Tablet', width: '1024px', icon: <Tablet className="w-3.5 h-3.5" />, desc: '1024 × 768 Table Scorer Station' },
  { id: 'mobile', label: 'Mobile Referee', shortLabel: 'Mobile', width: '420px', icon: <Smartphone className="w-3.5 h-3.5" />, desc: 'Compact 420px Handheld Official' },
];

export const ResolutionController: React.FC<ResolutionControllerProps> = ({
  currentResolution,
  onResolutionChange,
  isAutoRotateActive,
  onToggleAutoRotate,
  rotationInterval,
  onIntervalChange,
  currentView,
  secondsRemaining,
  dropdownAlign = 'right',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const currentResConfig = RESOLUTION_OPTIONS.find(r => r.id === currentResolution) || RESOLUTION_OPTIONS[0];

  return (
    <div className={`relative ${className || ''}`}>
      {/* Compact Quick-Bar Trigger */}
      <div className="flex items-center gap-1 bg-[#0b0e14] p-1 rounded-xl border border-white/10 text-xs">
        {/* Resolution selector button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-heading font-bold uppercase tracking-wider transition-all text-xs ${
            isOpen ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40' : 'text-[#94a3b8] hover:text-white'
          }`}
          title="Adjust Stadium Resolution & Layout Scale"
        >
          {currentResConfig.icon}
          <span className="inline font-bold">{currentResConfig.shortLabel}</span>
        </button>

        {/* Auto-Rotation Quick Toggle & Indicator */}
        <button
          onClick={onToggleAutoRotate}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg font-heading font-bold uppercase tracking-wider transition-all text-xs ${
            isAutoRotateActive
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-[#94a3b8] hover:text-white'
          }`}
          title={isAutoRotateActive ? `Auto-Rotation Active (${secondsRemaining}s): Click to pause` : 'Enable Automated Screen Rotation'}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isAutoRotateActive ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          {isAutoRotateActive && (
            <span className="text-[11px] font-mono font-bold tabular-nums">
              {secondsRemaining}s
            </span>
          )}
          {isAutoRotateActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>

        {/* Fullscreen Button (Desktops & Tablets) */}
        <button
          onClick={toggleFullscreen}
          className="hidden sm:inline-flex p-1 rounded-lg text-[#94a3b8] hover:text-white transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Stadium Mode'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Floating Resolution & Automation Configuration Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={`absolute ${dropdownAlign === 'left' ? 'left-0' : 'right-0'} top-full mt-2 w-80 sm:w-96 glass-panel-elevated p-4 rounded-2xl border border-white/20 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4`}>
            
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#38bdf8]" />
                <h4 className="font-heading font-black text-sm uppercase text-white tracking-wider">
                  Display Resolution &amp; Kiosk Controls
                </h4>
              </div>
              <span className="text-[10px] text-[#94a3b8] font-mono uppercase">Kinetic v2.0</span>
            </div>

            {/* Resolution Selector Buttons */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
                Simulated Screen Resolution
              </label>
              <div className="space-y-1.5">
                {RESOLUTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onResolutionChange(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                      currentResolution === opt.id
                        ? 'bg-[#0284c7]/20 border border-[#38bdf8]/40 text-white shadow-sm'
                        : 'bg-white/5 border border-white/5 text-[#94a3b8] hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1 rounded-lg bg-black/40 text-white">
                        {opt.icon}
                      </div>
                      <div className="text-left">
                        <span className="font-heading font-bold uppercase block text-[11px] text-white">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-[#94a3b8] block">
                          {opt.desc}
                        </span>
                      </div>
                    </div>
                    {currentResolution === opt.id && (
                      <span className="text-[10px] font-mono text-[#38bdf8] font-bold">ACTIVE</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Automated Rotation Settings */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-heading font-bold text-xs uppercase text-white block">
                    Automate Screen Rotation
                  </span>
                  <p className="text-[10px] text-[#94a3b8]">
                    Auto-cycles Scores → Scorer → Standings → Sponsors
                  </p>
                </div>

                <button
                  onClick={onToggleAutoRotate}
                  className={`px-3 py-1.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    isAutoRotateActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'bg-white/10 text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {isAutoRotateActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {isAutoRotateActive ? 'Active' : 'Start'}
                </button>
              </div>

              {/* Interval Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                  Rotation Interval (Seconds per View)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 15, 30].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => onIntervalChange(sec)}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        rotationInterval === sec
                          ? 'bg-[#38bdf8] text-white shadow-sm'
                          : 'bg-[#0b0e14] border border-white/10 text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Status indicator */}
              {isAutoRotateActive && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-400 font-medium">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Timer className="w-3.5 h-3.5 animate-pulse" />
                    Next rotation in <strong className="font-mono text-white">{secondsRemaining}s</strong>
                  </span>
                  <span className="text-[10px] uppercase font-bold text-white/70">
                    Current: {currentView.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
};
