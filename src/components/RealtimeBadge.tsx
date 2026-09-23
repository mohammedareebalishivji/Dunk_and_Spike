import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Database, 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Monitor, 
  CheckCircle2, 
  X, 
  Server,
  Zap
} from 'lucide-react';
import { useRealtimeDatabase } from '../hooks/useRealtimeDatabase';

interface RealtimeBadgeProps {
  className?: string;
  forceShowDetails?: boolean;
}

export const RealtimeBadge: React.FC<RealtimeBadgeProps> = ({
  className,
  forceShowDetails = false,
}) => {
  const { 
    status, 
    peerCount, 
    pingMs, 
    dbEngine, 
    lastSyncTime, 
    forceResync,
    pendingQueueCount,
    replayPendingQueue,
    clearPendingQueue
  } = useRealtimeDatabase();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isResyncing, setIsResyncing] = useState(false);

  const handleManualResync = () => {
    setIsResyncing(true);
    forceResync();
    setTimeout(() => setIsResyncing(false), 600);
  };

  // Support #diagnostics hash routing
  React.useEffect(() => {
    const handleHash = () => {
      if (typeof window !== 'undefined' && window.location.hash.toLowerCase() === '#diagnostics') {
        setIsModalOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHash);
    if (typeof window !== 'undefined' && window.location.hash.toLowerCase() === '#diagnostics') {
      setIsModalOpen(true);
    }
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-400 text-emerald-400 border-emerald-500/30';
      case 'connecting':
        return 'bg-amber-400 text-amber-400 border-amber-500/30';
      case 'offline':
      default:
        return 'bg-slate-400 text-slate-400 border-white/10';
    }
  };

  return (
    <>
      {/* Realtime Indicator Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={className || "hidden md:inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#0b0e14]/80 border border-white/10 hover:border-white/20 text-xs text-[#94a3b8] hover:text-white transition-all shadow-sm group"}
        title="Click to view Realtime Database & Court Sync telemetry"
      >
        <div className="relative flex items-center justify-center">
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'connected'
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : status === 'connecting'
                ? 'bg-amber-400 animate-ping'
                : 'bg-slate-400'
            }`}
          />
          {status === 'connected' && (
            <span className="absolute w-2 h-2 rounded-full bg-emerald-400/50 animate-ping" />
          )}
        </div>

        <span className="font-mono text-[11px] uppercase font-bold tracking-wider text-[#cbd5e1] group-hover:text-white whitespace-nowrap">
          {status === 'connected' ? 'LIVE DB' : status === 'connecting' ? 'SYNCING' : 'LOCAL CACHE'}
        </span>

        {status === 'connected' && (
          <span className={`${forceShowDetails ? 'inline-flex' : 'hidden xl:inline-flex'} items-center gap-1 text-[10px] font-mono text-[#94a3b8] bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5 whitespace-nowrap`}>
            <Monitor className="w-2.5 h-2.5 text-[#38bdf8]" />
            {peerCount} {peerCount === 1 ? 'screen' : 'screens'}
            {pingMs > 0 && <span className="text-emerald-400 ml-0.5">· {pingMs}ms</span>}
          </span>
        )}

        {pendingQueueCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[9px] border border-amber-500/40">
            {pendingQueueCount} queued
          </span>
        )}
      </button>


      {/* Diagnostics Modal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="glass-panel-elevated w-full max-w-md rounded-3xl border border-white/10 p-6 space-y-5 shadow-2xl relative my-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0284c7]/20 border border-[#0284c7]/40 flex items-center justify-center text-[#38bdf8]">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg text-white uppercase tracking-wider">
                    Realtime Tournament DB
                  </h3>
                  <p className="text-xs text-[#94a3b8]">
                    Sub-millisecond WebSocket &amp; SQLite Telemetry
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#94a3b8] hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Telemetry Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-[#94a3b8] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#38bdf8]" /> Connection Status
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  status === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : status === 'connecting'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-current'
                  }`} />
                  {status.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-[#94a3b8] flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-[#38bdf8]" /> Connected Court Screens
                </span>
                <span className="font-mono font-bold text-sm text-white">
                  {peerCount} {peerCount === 1 ? 'Display Active' : 'Displays Synchronized'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-[#94a3b8] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#f97316]" /> WebSocket Latency
                </span>
                <span className="font-mono font-bold text-sm text-emerald-400">
                  {status === 'connected' ? `${pingMs || 2} ms` : 'N/A (Offline)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-[#94a3b8] flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#a855f7]" /> Database Engine
                </span>
                <span className="font-mono text-xs font-semibold text-[#cbd5e1]">
                  {dbEngine}
                </span>
              </div>

              {pendingQueueCount > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-heading font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Offline Action Queue ({pendingQueueCount})
                    </span>
                    <button
                      onClick={clearPendingQueue}
                      className="text-[10px] text-rose-400 hover:text-rose-300 underline font-mono cursor-pointer"
                    >
                      Discard
                    </button>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Actions recorded offline are stored safely on this device and will replay automatically once the connection is restored.
                  </p>
                  <button
                    onClick={replayPendingQueue}
                    disabled={status !== 'connected'}
                    className="w-full py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold uppercase tracking-wider border border-amber-500/40 disabled:opacity-40"
                  >
                    Replay Actions Now
                  </button>
                </div>
              )}
            </div>

            {/* Architecture Explainer */}

            <div className="p-3.5 rounded-2xl bg-[#0284c7]/10 border border-[#0284c7]/20 text-[11px] text-[#94a3b8] space-y-1">
              <div className="font-bold text-[#38bdf8] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> High-Availability Realtime Sync
              </div>
              <p className="leading-relaxed">
                Scores, player points, timeouts, and sponsors sync in real-time across all arena scoreboards, scorer tablets, and fan phones using native WebSockets backed by SQLite WAL persistence.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handleManualResync}
                disabled={isResyncing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-heading font-bold text-xs uppercase tracking-wider border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResyncing ? 'animate-spin text-[#38bdf8]' : ''}`} />
                {isResyncing ? 'Resyncing...' : 'Force Resync'}
              </button>

              <button
                onClick={() => setIsModalOpen(false)}
                className="py-2.5 px-5 rounded-xl bg-[#0284c7] hover:bg-[#38bdf8] text-white font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                Close
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
};
