import React from 'react';
import { Sport } from '../types';
import { ViewType } from '../utils/navigationRoutes';
import { Trophy, Award, HeartHandshake, ShieldCheck, Scale, Users } from 'lucide-react';

interface BottomNavProps {
  currentSport: Sport;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isAdminLoggedIn: boolean;
  onOpenRulebook: () => void;
  onOpenTeamModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentSport,
  currentView,
  onViewChange,
  isAdminLoggedIn,
  onOpenRulebook,
  onOpenTeamModal,
}) => {
  const isBasketball = currentSport === 'basketball';
  const activeColorClass = isBasketball ? 'text-[#f97316]' : 'text-[#38bdf8]';
  const activeBgClass = isBasketball ? 'bg-[#f97316]/15' : 'bg-[#0284c7]/20';
  const activeDotClass = isBasketball ? 'bg-[#f97316]' : 'bg-[#38bdf8]';

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel-elevated border-t border-white/10 bg-[#0b0e14]/95 backdrop-blur-2xl px-2 py-1.5 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)] safe-area-pb"
    >
      <div className="max-w-md mx-auto flex items-center justify-around gap-1">
        
        {/* Scores & Schedule Tab */}
        <button
          onClick={() => onViewChange('schedule')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 relative ${
            currentView === 'schedule'
              ? `${activeColorClass} ${activeBgClass} font-black`
              : 'text-[#94a3b8] hover:text-white'
          }`}
          aria-label="Scores and Match Schedule"
          aria-selected={currentView === 'schedule'}
        >
          <Trophy className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider leading-none">
            Scores
          </span>
          {currentView === 'schedule' && (
            <span className={`w-1 h-1 rounded-full ${activeDotClass} absolute -top-0.5 animate-ping`} />
          )}
        </button>

        {/* Standings Tab */}
        <button
          onClick={() => onViewChange('standings')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 relative ${
            currentView === 'standings'
              ? `${activeColorClass} ${activeBgClass} font-black`
              : 'text-[#94a3b8] hover:text-white'
          }`}
          aria-label="Championship Standings"
          aria-selected={currentView === 'standings'}
        >
          <Award className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider leading-none">
            Standings
          </span>
          {currentView === 'standings' && (
            <span className={`w-1 h-1 rounded-full ${activeDotClass} absolute -top-0.5 animate-ping`} />
          )}
        </button>

        {/* Sponsors Tab */}
        <button
          onClick={() => onViewChange('sponsors')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 relative ${
            currentView === 'sponsors'
              ? `${activeColorClass} ${activeBgClass} font-black`
              : 'text-[#94a3b8] hover:text-white'
          }`}
          aria-label="Tournament Sponsors and Boosters"
          aria-selected={currentView === 'sponsors'}
        >
          <HeartHandshake className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider leading-none">
            Sponsors
          </span>
          {currentView === 'sponsors' && (
            <span className={`w-1 h-1 rounded-full ${activeDotClass} absolute -top-0.5 animate-ping`} />
          )}
        </button>

        {/* Teams Tab */}
        <button
          onClick={() => onViewChange('teams')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 relative ${
            currentView === 'teams'
              ? `${activeColorClass} ${activeBgClass} font-black`
              : 'text-[#94a3b8] hover:text-white'
          }`}
          aria-label="Championship Teams & Rosters"
          aria-selected={currentView === 'teams'}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider leading-none">
            Teams
          </span>
          {currentView === 'teams' && (
            <span className={`w-1 h-1 rounded-full ${activeDotClass} absolute -top-0.5 animate-ping`} />
          )}
        </button>

        {/* Scorer Console Tab */}
        <button
          onClick={() => onViewChange('admin')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 relative ${
            currentView === 'admin'
              ? 'text-[#f97316] bg-[#f97316]/20 font-black'
              : 'text-[#94a3b8] hover:text-white'
          }`}
          aria-label="Court Scorer Console"
          aria-selected={currentView === 'admin'}
        >
          <ShieldCheck className="w-4 h-4 mb-0.5 text-[#38bdf8]" />
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider leading-none">
            Scorer
          </span>
          {currentView === 'admin' && (
            <span className="w-1 h-1 rounded-full bg-[#f97316] absolute -top-0.5 animate-ping" />
          )}
        </button>

        {/* Official Rules Modal Trigger */}
        <button
          onClick={onOpenRulebook}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[#38bdf8] hover:text-white transition-all duration-200"
          aria-label="Official Rulebook"
        >
          <Scale className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider leading-none">
            Rules
          </span>
        </button>

        {/* Create Team Roster Button */}
        {onOpenTeamModal && (
          <button
            onClick={onOpenTeamModal}
            className="flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all duration-200 active:scale-95"
            aria-label="Create Team and Player Roster"
            title="Create Team & Roster"
          >
            <Users className="w-4 h-4 mb-0.5 text-[#38bdf8]" />
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider leading-none">
              + Team
            </span>
          </button>
        )}

      </div>
    </nav>
  );
};
