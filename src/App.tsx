import React, { useState, useEffect } from 'react';
import { Sport, Match, VolleyballMatchFormat, SetScore, DisplayResolution, Player, Team, PlayEvent } from './types';
import { INITIAL_MATCHES, CLEAN_TEMPLATE_MATCHES } from './data/mockData';
import { Navbar } from './components/Navbar';
import { ScoreTicker } from './components/ScoreTicker';
import { HeroBanner } from './components/HeroBanner';
import { ScheduleView } from './components/ScheduleView';
import { LiveScoringAdmin } from './components/LiveScoringAdmin';
import { StandingsTable } from './components/StandingsTable';
import { SponsorsView } from './components/SponsorsView';
import { AdminTeamsView } from './components/AdminTeamsView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CreateMatchModal } from './components/CreateMatchModal';
import { TeamRosterModal } from './components/TeamRosterModal';
import { OfficialRulebook } from './components/OfficialRulebook';
import { RulesEditorModal } from './components/RulesEditorModal';
import { SideDropdownNav } from './components/SideDropdownNav';
import { EventHighlights } from './components/EventHighlights';
import { updatePlayersWithPoints } from './utils/playerScoreTracker';
import { 
  evaluateVolleyballScore, 
  getBaseTargetPoints, 
  isDecidingSetNumber,
  getSetsToWin
} from './utils/volleyballRules';
import { 
  getNextBasketballPeriod, 
  requiresOvertime 
} from './utils/basketballRules';
import { BottomNav } from './components/BottomNav';
import { realtimeDB } from './services/realtimeDatabase';
import { Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { endMatchWithWinner } from './utils/endMatch';

import { 
  ViewType, 
  resolveViewFromHash, 
  resolveHashFromView, 
  getNextRotationView 
} from './utils/navigationRoutes';

const getInitialView = (): ViewType => {
  if (typeof window !== 'undefined' && window.location.hash) {
    return resolveViewFromHash(window.location.hash);
  }
  return 'schedule';
};

const STORAGE_KEY = 'dunk_spike_matches_v2';

export const App: React.FC = () => {
  const [currentSport, setCurrentSport] = useState<Sport>('volleyball');
  const [currentView, setCurrentView] = useState<ViewType>(getInitialView);
  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MATCHES;
  });

  // Realtime Tournament Database subscription (multi-screen & multi-device sync)
  useEffect(() => {
    realtimeDB.init();
    const unsub = realtimeDB.onMatchesChange((remoteMatches) => {
      setMatches(remoteMatches);
    });
    return unsub;
  }, []);

  const [selectedMatch, setSelectedMatch] = useState<Match | undefined>(() => {
    return matches.find(m => m.sport === currentSport && m.status === 'LIVE') || matches[0];
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dunk_spike_admin_session') === 'true';
    } catch {
      return false;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState<boolean>(false);
  const [isRulebookOpen, setIsRulebookOpen] = useState<boolean>(false);
  const [isRulesEditorOpen, setIsRulesEditorOpen] = useState<boolean>(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);

  // Stadium Display Resolution & Automated Rotation States
  const [currentResolution, setCurrentResolution] = useState<DisplayResolution>('responsive');
  const [isAutoRotateActive, setIsAutoRotateActive] = useState<boolean>(false);
  const [rotationInterval, setRotationInterval] = useState<number>(10);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(10);

  // Team & Player Roster Creation Modal States
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);
  const [teamModalTeam, setTeamModalTeam] = useState<Team | undefined>(undefined);

  // Global Toast Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const liveMatchesCount = matches.filter(m => m.status === 'LIVE').length;

  // Automated View Rotation Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoRotateActive) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setCurrentView((current) => {
              const nextView = getNextRotationView(current, isAdminLoggedIn);
              const targetHash = resolveHashFromView(nextView);
              if (targetHash && window.location.hash !== targetHash) {
                window.history.replaceState(null, '', targetHash);
              }
              return nextView;
            });
            return rotationInterval;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAutoRotateActive, rotationInterval, isAdminLoggedIn]);

  const handleUpdateMatchScore = (
    matchId: string,
    team: 'home' | 'away',
    points: number,
    reason: string,
    eventType: 'SCORE' | 'FOUL' | 'TIMEOUT' | 'BLOCK' | 'ACE' | 'SPIKE' | 'REBOUND' | 'ASSIST' | 'STEAL' | 'TURNOVER',
    playerId?: string,
    playerName?: string,
    playerNumber?: number
  ) => {
    let updatedTargetMatch: Match | undefined;

    setMatches(prev =>
      prev.map(m => {
        if (m.id !== matchId) return m;

        // --- VOLLEYBALL VNL SCORING LOGIC ---
        if (m.sport === 'volleyball') {
          const format: VolleyballMatchFormat = m.volleyballFormat || 'best-of-5';
          const currentSet = m.currentSetNumber || 1;

          // Calculate prior sets won strictly before currentSet
          const completedBefore = (m.setScores || []).filter(s => s.set < currentSet && s.isCompleted);
          const homeSetsBefore = completedBefore.filter(s => s.winner === 'home').length;
          const awaySetsBefore = completedBefore.filter(s => s.winner === 'away').length;

          const newHomeScore = team === 'home' ? Math.max(0, m.homeTeam.score + points) : m.homeTeam.score;
          const newAwayScore = team === 'away' ? Math.max(0, m.awayTeam.score + points) : m.awayTeam.score;

          // Update individual player scores & stats
          const updatedHomePlayers = team === 'home'
            ? updatePlayersWithPoints(m.homeTeam.players || [], playerId, playerName, playerNumber, points, eventType, reason, 'volleyball')
            : (m.homeTeam.players || []);
          const updatedAwayPlayers = team === 'away'
            ? updatePlayersWithPoints(m.awayTeam.players || [], playerId, playerName, playerNumber, points, eventType, reason, 'volleyball')
            : (m.awayTeam.players || []);

          const evalResult = evaluateVolleyballScore(
            newHomeScore,
            newAwayScore,
            currentSet,
            format,
            homeSetsBefore,
            awaySetsBefore
          );

          if (evalResult.isSetWon) {
            // Set Won! Record the completed set
            const updatedSetScores: SetScore[] = [...(m.setScores || [])];
            const currentSetIdx = updatedSetScores.findIndex(s => s.set === currentSet);
            const setRecord: SetScore = {
              set: currentSet,
              homeScore: newHomeScore,
              awayScore: newAwayScore,
              isCompleted: true,
              targetPoints: evalResult.currentTarget,
              isDecidingSet: evalResult.isDecidingSet,
              winner: evalResult.setWinner,
            };

            if (currentSetIdx >= 0) {
              updatedSetScores[currentSetIdx] = setRecord;
            } else {
              updatedSetScores.push(setRecord);
            }

            const newHomeSetsWon = evalResult.setWinner === 'home' ? homeSetsBefore + 1 : homeSetsBefore;
            const newAwaySetsWon = evalResult.setWinner === 'away' ? awaySetsBefore + 1 : awaySetsBefore;

            if (evalResult.isMatchWon) {
              // Entire Match is Complete
              const result: Match = {
                ...m,
                status: 'FINAL',
                statusDetail: `FINAL (${newHomeSetsWon}-${newAwaySetsWon})`,
                homeTeam: { ...m.homeTeam, score: newHomeScore, setsWon: newHomeSetsWon, players: updatedHomePlayers },
                awayTeam: { ...m.awayTeam, score: newAwayScore, setsWon: newAwaySetsWon, players: updatedAwayPlayers },
                setScores: updatedSetScores,
                isDeuce: false,
                pointSpecialBadge: undefined,
                completedSetPendingAdvance: currentSet,
              };
              updatedTargetMatch = result;
              return result;
            } else {
              // Set Won: Keep score at final set score (e.g. 25-22), allow admin to change score, continue set, or advance to next set
              const result: Match = {
                ...m,
                status: 'LIVE',
                currentSetNumber: currentSet,
                statusDetail: `SET ${currentSet} WON (${newHomeScore}-${newAwayScore})`,
                homeTeam: { ...m.homeTeam, score: newHomeScore, setsWon: newHomeSetsWon, players: updatedHomePlayers },
                awayTeam: { ...m.awayTeam, score: newAwayScore, setsWon: newAwaySetsWon, players: updatedAwayPlayers },
                setScores: updatedSetScores,
                isDeuce: false,
                pointSpecialBadge: 'SET WON',
                completedSetPendingAdvance: currentSet,
              };
              updatedTargetMatch = result;
              return result;
            }
          } else {
            // Normal Score increment or decrement/correction within set
            // If the set was previously marked completed, it reopens automatically!
            const updatedSetScores: SetScore[] = [...(m.setScores || [])];
            const currentSetIdx = updatedSetScores.findIndex(s => s.set === currentSet);
            if (currentSetIdx >= 0) {
              updatedSetScores[currentSetIdx] = {
                ...updatedSetScores[currentSetIdx],
                homeScore: newHomeScore,
                awayScore: newAwayScore,
                isCompleted: false,
                winner: undefined,
                targetPoints: evalResult.currentTarget,
              };
            } else {
              updatedSetScores.push({
                set: currentSet,
                homeScore: newHomeScore,
                awayScore: newAwayScore,
                isCompleted: false,
                targetPoints: evalResult.currentTarget,
                isDecidingSet: evalResult.isDecidingSet,
              });
            }

            const result: Match = {
              ...m,
              status: 'LIVE',
              homeTeam: { ...m.homeTeam, score: newHomeScore, setsWon: homeSetsBefore, players: updatedHomePlayers },
              awayTeam: { ...m.awayTeam, score: newAwayScore, setsWon: awaySetsBefore, players: updatedAwayPlayers },
              isDeuce: evalResult.isDeuce,
              pointSpecialBadge: evalResult.pointSpecialBadge,
              targetPoints: evalResult.currentTarget,
              statusDetail: evalResult.statusText,
              setScores: updatedSetScores,
              completedSetPendingAdvance: undefined,
            };
            updatedTargetMatch = result;
            return result;
          }
        }

        // --- BASKETBALL SCORING & EVENT LOGIC ---
        const updatedMatch = { ...m };
        if (team === 'home') {
          const newScore = Math.max(0, updatedMatch.homeTeam.score + points);
          const qScores = [...(updatedMatch.homeTeam.quarterScores || [updatedMatch.homeTeam.score])];
          if (points !== 0 && qScores.length > 0) {
            qScores[qScores.length - 1] = Math.max(0, qScores[qScores.length - 1] + points);
          }
          const updatedHomePlayers = updatePlayersWithPoints(
            updatedMatch.homeTeam.players || [],
            playerId,
            playerName,
            playerNumber,
            points,
            eventType,
            reason,
            'basketball'
          );
          updatedMatch.homeTeam = {
            ...updatedMatch.homeTeam,
            score: newScore,
            quarterScores: qScores,
            players: updatedHomePlayers,
            fouls: eventType === 'FOUL' ? (updatedMatch.homeTeam.fouls || 0) + 1 : updatedMatch.homeTeam.fouls,
            timeoutsLeft: eventType === 'TIMEOUT' ? Math.max(0, (updatedMatch.homeTeam.timeoutsLeft ?? 4) - 1) : updatedMatch.homeTeam.timeoutsLeft,
          };
        } else {
          const newScore = Math.max(0, updatedMatch.awayTeam.score + points);
          const qScores = [...(updatedMatch.awayTeam.quarterScores || [updatedMatch.awayTeam.score])];
          if (points !== 0 && qScores.length > 0) {
            qScores[qScores.length - 1] = Math.max(0, qScores[qScores.length - 1] + points);
          }
          const updatedAwayPlayers = updatePlayersWithPoints(
            updatedMatch.awayTeam.players || [],
            playerId,
            playerName,
            playerNumber,
            points,
            eventType,
            reason,
            'basketball'
          );
          updatedMatch.awayTeam = {
            ...updatedMatch.awayTeam,
            score: newScore,
            quarterScores: qScores,
            players: updatedAwayPlayers,
            fouls: eventType === 'FOUL' ? (updatedMatch.awayTeam.fouls || 0) + 1 : updatedMatch.awayTeam.fouls,
            timeoutsLeft: eventType === 'TIMEOUT' ? Math.max(0, (updatedMatch.awayTeam.timeoutsLeft ?? 4) - 1) : updatedMatch.awayTeam.timeoutsLeft,
          };
        }

        const currentPeriod = updatedMatch.basketballPeriod || 'Q3';
        updatedMatch.statusDetail = `LIVE ${currentPeriod} (${updatedMatch.homeTeam.score}-${updatedMatch.awayTeam.score})`;
        updatedTargetMatch = updatedMatch;
        return updatedMatch;
      })
    );

    if (updatedTargetMatch) {
      const matchToBroadcast: Match = updatedTargetMatch;
      const playEvent: PlayEvent = {
        id: `play-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        matchId,
        timestamp: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
        period: matchToBroadcast.sport === 'volleyball' ? `Set ${matchToBroadcast.currentSetNumber || 1}` : (matchToBroadcast.basketballPeriod || 'Q1'),
        team,
        type: eventType,
        description: `${team === 'home' ? matchToBroadcast.homeTeam.name : matchToBroadcast.awayTeam.name}: ${reason}`,
        scoreChange: points !== 0 ? `${points > 0 ? '+' : ''}${points} PTS` : undefined,
        playerId,
        playerName,
        playerNumber,
      };
      realtimeDB.scorePoint(matchToBroadcast, playEvent);
    }
  };

  const handleAdvanceBasketballPeriod = (matchId: string) => {
    let updatedMatch: Match | undefined;
    setMatches(prev =>
      prev.map(m => {
        if (m.id !== matchId || m.sport !== 'basketball') return m;
        const currentPeriod = m.basketballPeriod || 'Q3';
        
        // Check for tied score at end of Q4 / Overtime
        if (requiresOvertime(m.homeTeam.score, m.awayTeam.score, currentPeriod)) {
          const nextOT = currentPeriod.startsWith('OT') ? `OT${parseInt(currentPeriod.replace('OT', '')) + 1}` : 'OT1';
          const res: Match = {
            ...m,
            basketballPeriod: nextOT,
            statusDetail: `OVERTIME ${nextOT} (${m.homeTeam.score}-${m.awayTeam.score})`,
            homeTeam: { ...m.homeTeam, fouls: 0, quarterScores: [...(m.homeTeam.quarterScores || []), 0] },
            awayTeam: { ...m.awayTeam, fouls: 0, quarterScores: [...(m.awayTeam.quarterScores || []), 0] },
          };
          updatedMatch = res;
          return res;
        }

        const { nextPeriod, isFinal } = getNextBasketballPeriod(currentPeriod);
        if (isFinal || (currentPeriod === 'Q4' && m.homeTeam.score !== m.awayTeam.score)) {
          const res: Match = {
            ...m,
            status: 'FINAL',
            basketballPeriod: 'FINAL',
            statusDetail: `FINAL (${m.homeTeam.score}-${m.awayTeam.score})`,
          };
          updatedMatch = res;
          return res;
        }

        const res: Match = {
          ...m,
          basketballPeriod: nextPeriod,
          statusDetail: `LIVE ${nextPeriod} 10:00`,
          homeTeam: { ...m.homeTeam, fouls: 0, quarterScores: [...(m.homeTeam.quarterScores || []), 0] },
          awayTeam: { ...m.awayTeam, fouls: 0, quarterScores: [...(m.awayTeam.quarterScores || []), 0] },
        };
        updatedMatch = res;
        return res;
      })
    );
    if (updatedMatch) {
      realtimeDB.updateMatch(updatedMatch);
    }
  };

  const handleResetMatch = (matchId: string) => {
    let resetMatch: Match | undefined;
    setMatches(prev =>
      prev.map(m => {
        if (m.id !== matchId) return m;
        if (m.sport === 'volleyball') {
          const format = m.volleyballFormat || 'best-of-5';
          const res: Match = {
            ...m,
            status: 'LIVE',
            currentSetNumber: 1,
            targetPoints: 25,
            isDeuce: false,
            pointSpecialBadge: undefined,
            statusDetail: 'SET 1 (0-0 · FIRST SERVE)',
            homeTeam: { ...m.homeTeam, score: 0, setsWon: 0, timeoutsLeft: 2, substitutionsUsed: 0 },
            awayTeam: { ...m.awayTeam, score: 0, setsWon: 0, timeoutsLeft: 2, substitutionsUsed: 0 },
            setScores: [{ set: 1, homeScore: 0, awayScore: 0, isCompleted: false, targetPoints: 25, isDecidingSet: false }],
          };
          resetMatch = res;
          return res;
        } else {
          const res: Match = {
            ...m,
            status: 'LIVE',
            basketballPeriod: 'Q1',
            statusDetail: 'LIVE Q1 10:00',
            homeTeam: { ...m.homeTeam, score: 0, fouls: 0, timeoutsLeft: 4, substitutionsUsed: 0, quarterScores: [0] },
            awayTeam: { ...m.awayTeam, score: 0, fouls: 0, timeoutsLeft: 4, substitutionsUsed: 0, quarterScores: [0] },
          };
          resetMatch = res;
          return res;
        }
      })
    );
    if (resetMatch) {
      realtimeDB.updateMatch(resetMatch);
    }
  };

  const handleEndMatch = (matchId: string) => {
    let concludedMatch: Match | undefined;
    let winningSide: 'home' | 'away' | undefined;
    let winningName: string | undefined;

    setMatches(prev =>
      prev.map(m => {
        if (m.id !== matchId) return m;
        const result = endMatchWithWinner(m);
        concludedMatch = result.updatedMatch;
        winningSide = result.winnerSide;
        winningName = result.winnerName;
        return result.updatedMatch;
      })
    );

    if (concludedMatch) {
      const matchToBroadcast: Match = concludedMatch;
      const playEvent: PlayEvent = {
        id: `play-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        matchId,
        timestamp: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
        period: matchToBroadcast.sport === 'volleyball'
          ? `Set ${matchToBroadcast.currentSetNumber || 1}`
          : (matchToBroadcast.basketballPeriod || 'FINAL'),
        team: winningSide || 'home',
        type: 'MATCH_WON',
        description: `OFFICIAL MATCH CONCLUDED: ${winningName || 'Winning team'} wins the match! (+1 point awarded to winner for scoreboard & standings)`,
        scoreChange: '+1 PTS',
      };
      realtimeDB.scorePoint(matchToBroadcast, playEvent);
    }
  };

  const handleFormatChange = (matchId: string, newFormat: VolleyballMatchFormat) => {
    let changedMatch: Match | undefined;
    setMatches(prev =>
      prev.map(m => {
        if (m.id !== matchId || m.sport !== 'volleyball') return m;
        const currentSet = m.currentSetNumber || 1;
        const target = getBaseTargetPoints(currentSet, newFormat);
        
        // If switched to Best-of-3 and a team already won 2 sets, match is complete!
        const homeWon = m.homeTeam.setsWon || 0;
        const awayWon = m.awayTeam.setsWon || 0;
        if (newFormat === 'best-of-3' && (homeWon >= 2 || awayWon >= 2)) {
          const res: Match = {
            ...m,
            volleyballFormat: newFormat,
            status: 'FINAL',
            statusDetail: `FINAL (${homeWon}-${awayWon} · VNL BO3)`,
            targetPoints: target,
          };
          changedMatch = res;
          return res;
        }

        const res: Match = {
          ...m,
          volleyballFormat: newFormat,
          targetPoints: target,
          statusDetail: `SET ${currentSet} (${m.homeTeam.score}-${m.awayTeam.score} · ${newFormat.toUpperCase()})`,
        };
        changedMatch = res;
        return res;
      })
    );
    if (changedMatch) {
      realtimeDB.updateMatch(changedMatch);
    }
  };

  const handleAdvanceVolleyballSet = (matchId: string) => {
    let updatedMatch: Match | undefined;
    setMatches(prev =>
      prev.map(m => {
        if (m.id !== matchId || m.sport !== 'volleyball') return m;
        const format = m.volleyballFormat || 'best-of-5';
        const currentSet = m.currentSetNumber || 1;
        const nextSet = currentSet + 1;
        const nextTarget = getBaseTargetPoints(nextSet, format);
        const isNextDeciding = isDecidingSetNumber(nextSet, format);

        const updatedSetScores: SetScore[] = [...(m.setScores || [])];
        const nextSetIdx = updatedSetScores.findIndex(s => s.set === nextSet);
        const newSetRecord: SetScore = {
          set: nextSet,
          homeScore: 0,
          awayScore: 0,
          isCompleted: false,
          targetPoints: nextTarget,
          isDecidingSet: isNextDeciding,
        };
        if (nextSetIdx >= 0) {
          updatedSetScores[nextSetIdx] = newSetRecord;
        } else {
          updatedSetScores.push(newSetRecord);
        }

        const res: Match = {
          ...m,
          status: 'LIVE',
          currentSetNumber: nextSet,
          targetPoints: nextTarget,
          isDeuce: false,
          pointSpecialBadge: undefined,
          completedSetPendingAdvance: undefined,
          statusDetail: `SET ${nextSet} (0-0 · ${isNextDeciding ? 'DECIDING SET TO 15' : 'TO 25'})`,
          homeTeam: { ...m.homeTeam, score: 0, substitutionsUsed: 0 },
          awayTeam: { ...m.awayTeam, score: 0, substitutionsUsed: 0 },
          setScores: updatedSetScores,
        };
        updatedMatch = res;
        return res;
      })
    );
    if (updatedMatch) {
      realtimeDB.updateMatch(updatedMatch);
    }
  };

  const handleEditVolleyballSetScore = (
    matchId: string,
    setNumber: number,
    homeScore: number,
    awayScore: number,
    continueFromSet: boolean
  ) => {
    let updatedMatch: Match | undefined;
    setMatches(prev =>
      prev.map(m => {
        if (m.id !== matchId || m.sport !== 'volleyball') return m;
        const format = m.volleyballFormat || 'best-of-5';
        const setsToWin = getSetsToWin(format);

        // 1. Calculate sets won strictly before setNumber
        const existingSetScores: SetScore[] = [...(m.setScores || [])];
        const setsBefore = existingSetScores.filter(s => s.set < setNumber && s.isCompleted);
        const homeSetsBefore = setsBefore.filter(s => s.winner === 'home').length;
        const awaySetsBefore = setsBefore.filter(s => s.winner === 'away').length;

        // 2. Evaluate the new score for setNumber
        const evalResult = evaluateVolleyballScore(
          homeScore,
          awayScore,
          setNumber,
          format,
          homeSetsBefore,
          awaySetsBefore
        );

        const targetPoints = evalResult.currentTarget;
        const isDeciding = isDecidingSetNumber(setNumber, format);

        const updatedSetScores: SetScore[] = continueFromSet
          ? existingSetScores.filter(s => s.set <= setNumber)
          : [...existingSetScores];

        const setIdx = updatedSetScores.findIndex(s => s.set === setNumber);
        const setRecord: SetScore = {
          set: setNumber,
          homeScore,
          awayScore,
          isCompleted: evalResult.isSetWon,
          targetPoints,
          isDecidingSet: isDeciding,
          winner: evalResult.setWinner,
        };

        if (setIdx >= 0) {
          updatedSetScores[setIdx] = setRecord;
        } else {
          updatedSetScores.push(setRecord);
        }

        if (continueFromSet) {
          // Admin wants to resume playing the match from this set!
          const newHomeSetsWon = evalResult.isSetWon && evalResult.setWinner === 'home'
            ? homeSetsBefore + 1
            : homeSetsBefore;
          const newAwaySetsWon = evalResult.isSetWon && evalResult.setWinner === 'away'
            ? awaySetsBefore + 1
            : awaySetsBefore;

          const isMatchNowFinal = evalResult.isMatchWon;

          const res: Match = {
            ...m,
            status: isMatchNowFinal ? 'FINAL' : 'LIVE',
            currentSetNumber: setNumber,
            targetPoints,
            isDeuce: evalResult.isDeuce,
            pointSpecialBadge: evalResult.pointSpecialBadge || (evalResult.isSetWon ? 'SET WON' : undefined),
            completedSetPendingAdvance: evalResult.isSetWon && !isMatchNowFinal ? setNumber : undefined,
            statusDetail: isMatchNowFinal
              ? `FINAL (${newHomeSetsWon}-${newAwaySetsWon})`
              : evalResult.isSetWon
              ? `SET ${setNumber} WON (${homeScore}-${awayScore})`
              : evalResult.statusText,
            homeTeam: {
              ...m.homeTeam,
              score: homeScore,
              setsWon: newHomeSetsWon,
              substitutionsUsed: 0,
            },
            awayTeam: {
              ...m.awayTeam,
              score: awayScore,
              setsWon: newAwaySetsWon,
              substitutionsUsed: 0,
            },
            setScores: updatedSetScores,
          };
          updatedMatch = res;
          return res;
        } else {
          // Update historical set score only without jumping back
          const allCompleted = updatedSetScores.filter(s => s.isCompleted);
          const totalHomeSets = allCompleted.filter(s => s.winner === 'home').length;
          const totalAwaySets = allCompleted.filter(s => s.winner === 'away').length;
          const isMatchWon = totalHomeSets >= setsToWin || totalAwaySets >= setsToWin;

          const res: Match = {
            ...m,
            status: isMatchWon ? 'FINAL' : m.status,
            homeTeam: {
              ...m.homeTeam,
              setsWon: totalHomeSets,
            },
            awayTeam: {
              ...m.awayTeam,
              setsWon: totalAwaySets,
            },
            setScores: updatedSetScores,
            statusDetail: isMatchWon ? `FINAL (${totalHomeSets}-${totalAwaySets})` : m.statusDetail,
          };
          updatedMatch = res;
          return res;
        }
      })
    );
    if (updatedMatch) {
      realtimeDB.updateMatch(updatedMatch);
    }
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
    } catch (e) {
      console.error(e);
    }
  }, [matches]);

  // Keep selectedMatch synchronized
  useEffect(() => {
    if (selectedMatch && !matches.find(m => m.id === selectedMatch.id)) {
      setSelectedMatch(matches.find(m => m.sport === currentSport) || matches[0]);
    } else if (!selectedMatch && matches.length > 0) {
      setSelectedMatch(matches.find(m => m.sport === currentSport) || matches[0]);
    }
  }, [matches, selectedMatch, currentSport]);

  const handleCreateMatch = (newMatch: Match) => {
    setMatches(prev => [newMatch, ...prev]);
    setSelectedMatch(newMatch);
    setCurrentSport(newMatch.sport);
    realtimeDB.createMatch(newMatch);
  };

  const handleDeleteMatch = (matchId: string) => {
    setMatches(prev => {
      const remaining = prev.filter(m => m.id !== matchId);
      if (selectedMatch?.id === matchId) {
        const next = remaining.find(m => m.sport === currentSport) || remaining[0];
        setSelectedMatch(next);
      }
      return remaining;
    });
    realtimeDB.deleteMatch(matchId);
  };

  const handleClearAllData = () => {
    setMatches([]);
    setSelectedMatch(undefined);
    realtimeDB.clearAllMatches();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadTemplateSchedule = () => {
    setMatches(CLEAN_TEMPLATE_MATCHES);
    setSelectedMatch(CLEAN_TEMPLATE_MATCHES[0]);
    setCurrentSport(CLEAN_TEMPLATE_MATCHES[0].sport);
    realtimeDB.loadTemplate(CLEAN_TEMPLATE_MATCHES);
  };

  const handleSportChange = (sport: Sport) => {
    setCurrentSport(sport);
    const firstMatch = matches.find(m => m.sport === sport && m.status === 'LIVE') || matches.find(m => m.sport === sport);
    if (firstMatch) {
      setSelectedMatch(firstMatch);
    }
  };

  const handleViewChange = (view: ViewType) => {
    if (view === 'admin' && !isAdminLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    setCurrentView(view);
    const targetHash = resolveHashFromView(view);
    if (targetHash && window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
  };

  const handleOpenScorerForMatch = (match: Match) => {
    setSelectedMatch(match);
    setCurrentSport(match.sport);
    if (!isAdminLoggedIn) {
      setIsLoginModalOpen(true);
    } else {
      handleViewChange('admin');
    }
  };

  // Browser hash synchronization (Back / Forward history)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#rules') {
        setIsRulebookOpen(true);
      } else {
        const targetView = resolveViewFromHash(hash);
        if (targetView === 'admin' && !isAdminLoggedIn) {
          setIsLoginModalOpen(true);
        } else {
          setCurrentView(targetView);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash.toLowerCase() === '#rules') {
      setIsRulebookOpen(true);
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAdminLoggedIn]);

  // Tournament Operator Keyboard Navigation Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        setIsLoginModalOpen(false);
        setIsCreateMatchOpen(false);
        setIsTeamModalOpen(false);
        setIsRulebookOpen(false);
        setIsRulesEditorOpen(false);
        setIsSideMenuOpen(false);
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        if (!e.metaKey && !e.ctrlKey) {
          setIsSideMenuOpen(prev => !prev);
        }
      }

      if (e.key === '1') {
        handleViewChange('schedule');
      } else if (e.key === '2') {
        handleViewChange('standings');
      } else if (e.key === '3') {
        handleViewChange('sponsors');
      } else if (e.key === '4') {
        if (!isAdminLoggedIn) {
          setIsLoginModalOpen(true);
        } else {
          handleViewChange('admin');
        }
      } else if (e.key === '5') {
        if (!isAdminLoggedIn) {
          setIsLoginModalOpen(true);
        } else {
          handleViewChange('teams');
        }
      } else if (e.key === 'b' || e.key === 'B') {
        handleSportChange('basketball');
      } else if (e.key === 'v' || e.key === 'V') {
        handleSportChange('volleyball');
      } else if (e.key === '?' || e.key === 'r' || e.key === 'R') {
        if (!e.metaKey && !e.ctrlKey) {
          setIsRulebookOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminLoggedIn, matches]);

  const handleAddPlayerToMatchTeam = (matchId: string, team: 'home' | 'away', player: Player) => {
    let updatedMatch: Match | undefined;
    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m;
      if (team === 'home') {
        const res: Match = {
          ...m,
          homeTeam: {
            ...m.homeTeam,
            players: [...(m.homeTeam.players || []), player],
          }
        };
        updatedMatch = res;
        return res;
      } else {
        const res: Match = {
          ...m,
          awayTeam: {
            ...m.awayTeam,
            players: [...(m.awayTeam.players || []), player],
          }
        };
        updatedMatch = res;
        return res;
      }
    }));
    if (updatedMatch) {
      realtimeDB.updateMatch(updatedMatch);
    }
  };

  const handleUpdateMatchTeam = (
    matchId: string, 
    team: 'home' | 'away', 
    updatedTeam: Team, 
    playEvent?: PlayEvent
  ) => {
    let updatedMatch: Match | undefined;
    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m;
      const res: Match = {
        ...m,
        homeTeam: team === 'home' ? updatedTeam : m.homeTeam,
        awayTeam: team === 'away' ? updatedTeam : m.awayTeam,
      };
      updatedMatch = res;
      return res;
    }));
    if (updatedMatch) {
      if (playEvent) {
        realtimeDB.scorePoint(updatedMatch, playEvent);
      } else {
        realtimeDB.updateMatch(updatedMatch);
      }
    }
  };

  const handleSaveTeam = (savedTeam: Team) => {
    const teamSport: Sport = savedTeam.sport || currentSport;
    if (teamSport !== currentSport) {
      handleSportChange(teamSport);
    }
    showToast(`Team "${savedTeam.name}" registered and tournament squad synchronized!`);

    setMatches(prev => {
      let teamFound = false;
      let updatedMatchedMatch: Match | undefined;
      const updated = prev.map(m => {
        let matchChanged = false;
        let home = m.homeTeam;
        let away = m.awayTeam;

        if (m.homeTeam.id === savedTeam.id || m.homeTeam.name.toLowerCase() === savedTeam.name.toLowerCase()) {
          home = {
            ...m.homeTeam,
            name: savedTeam.name,
            shortName: savedTeam.shortName,
            logoColor: savedTeam.logoColor,
            accentColor: savedTeam.accentColor,
            logoUrl: savedTeam.logoUrl,
            players: savedTeam.players,
          };
          matchChanged = true;
          teamFound = true;
        }

        if (m.awayTeam.id === savedTeam.id || m.awayTeam.name.toLowerCase() === savedTeam.name.toLowerCase()) {
          away = {
            ...m.awayTeam,
            name: savedTeam.name,
            shortName: savedTeam.shortName,
            logoColor: savedTeam.logoColor,
            accentColor: savedTeam.accentColor,
            logoUrl: savedTeam.logoUrl,
            players: savedTeam.players,
          };
          matchChanged = true;
          teamFound = true;
        }

        if (matchChanged) {
          const res = { ...m, homeTeam: home, awayTeam: away };
          updatedMatchedMatch = res;
          realtimeDB.updateMatch(res);
          return res;
        }
        return m;
      });

      if (!teamFound) {
        // Create an exhibition tournament showcase featuring this team and roster
        const isVb = teamSport === 'volleyball';
        const ts = Date.now();
        const opponent: Team = isVb ? {
          id: `opp-${ts}`,
          name: 'Peak Spikers',
          shortName: 'SPK',
          seed: 2,
          logoColor: '#f97316',
          accentColor: '#fb923c',
          record: '13-3',
          score: 0,
          setsWon: 0,
          timeoutsLeft: 2,
          players: [
            { id: `opp-p-${ts}-1`, name: 'Maya Lindqvist', number: 14, position: 'Middle Blocker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
            { id: `opp-p-${ts}-2`, name: 'Tara Davis', number: 8, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
            { id: `opp-p-${ts}-3`, name: 'Ananya Sharma', number: 4, position: 'Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
            { id: `opp-p-${ts}-4`, name: 'Camila Rossi', number: 9, position: 'Opposite Spiker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
            { id: `opp-p-${ts}-5`, name: 'Elena Petrova', number: 16, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
            { id: `opp-p-${ts}-6`, name: 'Yuki Takahashi', number: 2, position: 'Libero', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
            { id: `opp-p-${ts}-7`, name: 'Brooke Collins', number: 11, position: 'Middle Blocker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
            { id: `opp-p-${ts}-8`, name: 'Lily Vance', number: 6, position: 'Defensive Specialist', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
          ]
        } : {
          id: `opp-${ts}`,
          name: 'Coastal Spartans',
          shortName: 'CST',
          seed: 2,
          logoColor: '#0284c7',
          accentColor: '#38bdf8',
          record: '15-2',
          score: 0,
          quarterScores: [0],
          timeoutsLeft: 4,
          fouls: 0,
          players: [
            { id: `opp-p-${ts}-1`, name: 'Devon Sterling', number: 11, position: 'Point Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
            { id: `opp-p-${ts}-2`, name: 'Zion Brooks', number: 24, position: 'Shooting Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
            { id: `opp-p-${ts}-3`, name: 'Kobe Walker', number: 4, position: 'Small Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
            { id: `opp-p-${ts}-4`, name: 'Dante Cole', number: 15, position: 'Power Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
            { id: `opp-p-${ts}-5`, name: 'Tyler Reed', number: 33, position: 'Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
            { id: `opp-p-${ts}-6`, name: 'Brandon Scott', number: 1, position: 'Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
            { id: `opp-p-${ts}-7`, name: 'Carlos Mendez', number: 8, position: 'Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
            { id: `opp-p-${ts}-8`, name: 'Austin Miller', number: 42, position: 'Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
          ]
        };

        const newMatch: Match = {
          id: `match-team-${Date.now()}`,
          sport: teamSport,
          title: `${savedTeam.name} Championship Showcase`,
          division: "Men's Division I",
          status: 'LIVE',
          court: 'Court 1 - Main Arena',
          venue: 'Grand Central Athletics Center',
          homeTeam: savedTeam,
          awayTeam: opponent,
          volleyballFormat: 'best-of-5',
          currentSetNumber: 1,
          targetPoints: 25,
          isDeuce: false,
          statusDetail: isVb ? 'SET 1 (0-0 · FIRST SERVE)' : 'LIVE Q1 10:00',
          timeRemaining: isVb ? 'Set 1' : '10:00',
          shotClock: 24,
          basketballPeriod: 'Q1',
          setScores: isVb ? [{ set: 1, homeScore: 0, awayScore: 0, isCompleted: false, targetPoints: 25, isDecidingSet: false }] : undefined,
        };

        setSelectedMatch(newMatch);
        realtimeDB.createMatch(newMatch);
        return [newMatch, ...updated];
      }

      return updated;
    });
  };

  const handleUpdateTeamInMatches = (savedTeam: Team, sport: Sport) => {
    setMatches(prev => {
      const updated = prev.map(m => {
        if (m.sport !== sport) return m;

        let home = m.homeTeam;
        let away = m.awayTeam;
        let mChanged = false;

        if (m.homeTeam.id === savedTeam.id || m.homeTeam.name.toLowerCase() === savedTeam.name.toLowerCase()) {
          home = {
            ...m.homeTeam,
            name: savedTeam.name,
            shortName: savedTeam.shortName,
            seed: savedTeam.seed ?? m.homeTeam.seed,
            logoColor: savedTeam.logoColor,
            accentColor: savedTeam.accentColor,
            record: savedTeam.record || m.homeTeam.record,
            logoUrl: savedTeam.logoUrl ?? m.homeTeam.logoUrl,
            players: savedTeam.players,
          };
          mChanged = true;
        }

        if (m.awayTeam.id === savedTeam.id || m.awayTeam.name.toLowerCase() === savedTeam.name.toLowerCase()) {
          away = {
            ...m.awayTeam,
            name: savedTeam.name,
            shortName: savedTeam.shortName,
            seed: savedTeam.seed ?? m.awayTeam.seed,
            logoColor: savedTeam.logoColor,
            accentColor: savedTeam.accentColor,
            record: savedTeam.record || m.awayTeam.record,
            logoUrl: savedTeam.logoUrl ?? m.awayTeam.logoUrl,
            players: savedTeam.players,
          };
          mChanged = true;
        }

        if (mChanged) {
          const res = { ...m, homeTeam: home, awayTeam: away };
          realtimeDB.updateMatch(res);
          return res;
        }
        return m;
      });

      return updated;
    });
  };

  const getResolutionContainerClass = () => {
    switch (currentResolution) {
      case '1080p':
        return 'max-w-[1920px] mx-auto border-x border-white/10 shadow-2xl transition-all duration-300';
      case '4k':
        return 'max-w-[2560px] mx-auto border-x border-amber-500/20 shadow-2xl transition-all duration-300';
      case 'tablet':
        return 'max-w-[1024px] mx-auto border-x border-sky-500/20 shadow-2xl transition-all duration-300';
      case 'mobile':
        return 'max-w-[430px] mx-auto border-x border-orange-500/20 shadow-2xl my-4 rounded-3xl overflow-hidden transition-all duration-300';
      case 'responsive':
      default:
        return 'w-full transition-all duration-300';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#10131a] text-[#e1e2eb] selection:bg-[#0284c7]/30 selection:text-white w-full overflow-x-hidden">
      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 rounded-2xl backdrop-blur-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
      
      {/* Top Navigation */}
      <Navbar
        currentSport={currentSport}
        onSportChange={handleSportChange}
        currentView={currentView}
        onViewChange={handleViewChange}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={() => {
          setIsAdminLoggedIn(false);
          try {
            localStorage.removeItem('dunk_spike_admin_session');
          } catch {}
          if (currentView === 'admin') {
            setCurrentView('schedule');
          }
        }}
        onOpenRulebook={() => setIsRulebookOpen(true)}
        onOpenRulesEditor={() => setIsRulesEditorOpen(true)}
        liveMatchesCount={liveMatchesCount}
        currentResolution={currentResolution}
        onResolutionChange={setCurrentResolution}
        isAutoRotateActive={isAutoRotateActive}
        onToggleAutoRotate={() => setIsAutoRotateActive(!isAutoRotateActive)}
        rotationInterval={rotationInterval}
        onIntervalChange={(interval) => {
          setRotationInterval(interval);
          setSecondsRemaining(interval);
        }}
        secondsRemaining={secondsRemaining}
        onOpenTeamModal={() => {
          setTeamModalTeam(undefined);
          setIsTeamModalOpen(true);
        }}
        onToggleSideMenu={() => setIsSideMenuOpen(prev => !prev)}
      />

      {/* Simulated Display Resolution Notice */}
      {currentResolution !== 'responsive' && (
        <div className="bg-[#0b0e14] border-b border-white/10 py-1.5 px-4 text-center text-xs text-[#94a3b8] flex items-center justify-center gap-3">
          <span>
            Simulated Display Active: <strong className="text-white uppercase font-bold">{currentResolution.toUpperCase()}</strong>
          </span>
          <button
            onClick={() => setCurrentResolution('responsive')}
            className="text-[10px] font-bold uppercase text-[#38bdf8] hover:underline"
          >
            Reset to Auto Responsive
          </button>
        </div>
      )}

      {/* Resolution Viewport Shell */}
      <div className={getResolutionContainerClass()}>
        {/* Live Court Ticker */}
        <ScoreTicker
          matches={matches}
          onSelectMatch={handleOpenScorerForMatch}
          activeSport={currentSport}
        />

        {/* Main Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
          
          {/* If on Schedule View, display Hero Banner */}
          {currentView === 'schedule' && (
            <HeroBanner
              currentSport={currentSport}
              featuredMatch={matches.find(m => m.sport === currentSport && m.status === 'LIVE') || matches.find(m => m.sport === currentSport)}
              onOpenAdmin={() => {
                if (!isAdminLoggedIn) {
                  setIsLoginModalOpen(true);
                } else {
                  handleViewChange('admin');
                }
              }}
              onViewSchedule={() => {
                handleViewChange('schedule');
                const el = document.getElementById('schedule-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.scrollTo({ top: 500, behavior: 'smooth' });
                }
              }}
            />
          )}

          {/* View Routing */}
          {currentView === 'schedule' && (
            <div className="space-y-12">
              <ScheduleView
                matches={matches}
                currentSport={currentSport}
                onOpenScorer={handleOpenScorerForMatch}
                onOpenCreateMatch={() => {
                  if (!isAdminLoggedIn) {
                    setIsLoginModalOpen(true);
                  } else {
                    setIsCreateMatchOpen(true);
                  }
                }}
                onLoadTemplateSchedule={handleLoadTemplateSchedule}
                isAdminLoggedIn={isAdminLoggedIn}
                onDeleteMatch={handleDeleteMatch}
              />
              <EventHighlights
                isAdminLoggedIn={isAdminLoggedIn}
                onOpenLogin={() => setIsLoginModalOpen(true)}
              />
              <StandingsTable currentSport={currentSport} matches={matches} />
            </div>
          )}

          {currentView === 'admin' && (
            isAdminLoggedIn ? (
              <LiveScoringAdmin
                matches={matches}
                selectedMatchId={selectedMatch?.id}
                onSelectMatchId={(id) => {
                  const m = matches.find(match => match.id === id);
                  if (m) setSelectedMatch(m);
                }}
                onBackToSchedule={() => handleViewChange('schedule')}
                onUpdateMatchScore={handleUpdateMatchScore}
                onAddPlayerToMatchTeam={handleAddPlayerToMatchTeam}
                onUpdateTeam={handleUpdateMatchTeam}
                onOpenTeamModal={(team, sport) => {
                  setTeamModalTeam(team);
                  setIsTeamModalOpen(true);
                }}
                onFormatChange={handleFormatChange}
                onAdvanceBasketballPeriod={handleAdvanceBasketballPeriod}
                onAdvanceVolleyballSet={handleAdvanceVolleyballSet}
                onEditVolleyballSetScore={handleEditVolleyballSetScore}
                onResetMatch={handleResetMatch}
                onEndMatch={handleEndMatch}
                onToggleClock={() => {}}
                onResetShotClock={() => {}}
                onOpenRulebook={() => setIsRulebookOpen(true)}
                onOpenRulesEditor={() => setIsRulesEditorOpen(true)}
                onOpenCreateMatch={() => setIsCreateMatchOpen(true)}
                onLoadTemplateSchedule={handleLoadTemplateSchedule}
                onClearAllData={handleClearAllData}
                onDeleteMatch={handleDeleteMatch}
                onNavigateToTeams={() => handleViewChange('teams')}
                onOpenRegisterTeam={() => {
                  setTeamModalTeam(undefined);
                  setIsTeamModalOpen(true);
                }}
              />
            ) : (
              <div className="glass-panel text-center py-20 p-8 rounded-3xl border border-white/10 max-w-xl mx-auto space-y-4 my-8">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="font-heading font-black text-3xl uppercase tracking-wider text-white">
                  Admin Authentication Required
                </h2>
                <p className="text-xs text-[#94a3b8] leading-relaxed max-w-md mx-auto">
                  The Live Court Scorer &amp; Tournament Administration Center is restricted to verified administrators. Public registration is prohibited.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white font-heading font-black text-sm uppercase tracking-wider shadow-lg glow-blue transition-all active:scale-95 inline-flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Authenticate as Administrator
                  </button>
                </div>
              </div>
            )
          )}

          {currentView === 'standings' && (
            <StandingsTable currentSport={currentSport} matches={matches} />
          )}

          {currentView === 'sponsors' && (
            <SponsorsView isAdminLoggedIn={isAdminLoggedIn} />
          )}

          {currentView === 'teams' && (
            <AdminTeamsView
              isAdminLoggedIn={isAdminLoggedIn}
              onOpenLogin={() => setIsLoginModalOpen(true)}
              matches={matches}
              onUpdateTeamInMatches={handleUpdateTeamInMatches}
              onRegisterTeam={(savedTeam, sport) => handleSaveTeam(savedTeam)}
              currentSport={currentSport}
              onNavigateToScorer={() => handleViewChange('admin')}
              onNavigateToSchedule={() => handleViewChange('schedule')}
            />
          )}

        </main>
      </div>

      {/* Create Match Modal */}
      <CreateMatchModal
        isOpen={isCreateMatchOpen}
        onClose={() => setIsCreateMatchOpen(false)}
        onCreateMatch={handleCreateMatch}
        defaultSport={currentSport}
        matches={matches}
      />

      {/* Team & Player Roster Manager Modal */}
      <TeamRosterModal
        isOpen={isTeamModalOpen}
        onClose={() => {
          setIsTeamModalOpen(false);
          setTeamModalTeam(undefined);
        }}
        sport={currentSport}
        onSaveTeam={handleSaveTeam}
        initialTeam={teamModalTeam}
      />

      {/* Official Court Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(role, court) => {
          setIsAdminLoggedIn(true);
          try {
            localStorage.setItem('dunk_spike_admin_session', 'true');
          } catch {}
          if (currentView !== 'teams' && currentView !== 'sponsors') {
            handleViewChange('admin');
          }
        }}
      />

      {/* Official Rulebook Modal */}
      <OfficialRulebook
        isOpen={isRulebookOpen}
        onClose={() => setIsRulebookOpen(false)}
        initialSport={currentSport}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenRulesEditor={() => setIsRulesEditorOpen(true)}
      />

      {/* Admin Championship Rules & Scoring Settings Modal */}
      <RulesEditorModal
        isOpen={isRulesEditorOpen}
        onClose={() => setIsRulesEditorOpen(false)}
        initialSport={currentSport}
      />

      {/* Side Dropdown Menu Navigation System */}
      <SideDropdownNav
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        currentSport={currentSport}
        onSportChange={handleSportChange}
        currentView={currentView}
        onViewChange={handleViewChange}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={() => {
          setIsAdminLoggedIn(false);
          try {
            localStorage.removeItem('dunk_spike_admin_session');
          } catch {}
          if (currentView === 'admin') {
            setCurrentView('schedule');
          }
        }}
        onOpenRulebook={() => setIsRulebookOpen(true)}
        onOpenRulesEditor={() => setIsRulesEditorOpen(true)}
        onOpenCreateMatch={() => {
          if (!isAdminLoggedIn) {
            setIsLoginModalOpen(true);
          } else {
            setIsCreateMatchOpen(true);
          }
        }}
        onOpenTeamModal={() => {
          setTeamModalTeam(undefined);
          setIsTeamModalOpen(true);
        }}
        liveMatchesCount={liveMatchesCount}
        currentResolution={currentResolution}
        onResolutionChange={setCurrentResolution}
        isAutoRotateActive={isAutoRotateActive}
        onToggleAutoRotate={() => setIsAutoRotateActive(!isAutoRotateActive)}
        rotationInterval={rotationInterval}
        onIntervalChange={(interval) => {
          setRotationInterval(interval);
          setSecondsRemaining(interval);
        }}
        secondsRemaining={secondsRemaining}
      />

      {/* Mobile / Tablet Ergonomic Bottom Navigation Bar */}
      <BottomNav
        currentSport={currentSport}
        currentView={currentView}
        onViewChange={handleViewChange}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenRulebook={() => setIsRulebookOpen(true)}
        onOpenTeamModal={() => {
          setTeamModalTeam(undefined);
          setIsTeamModalOpen(true);
        }}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 bg-[#0b0e14] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f97316] to-[#0284c7] p-0.5">
              <div className="w-full h-full bg-[#10131a] rounded-[10px] flex items-center justify-center font-heading font-black text-white">
                DS
              </div>
            </div>
            <div>
              <span className="font-heading font-black text-lg text-white uppercase tracking-wider">
                Dunk <span className="text-[#f97316]">&amp;</span> <span className="text-[#38bdf8]">Spike</span> Sports Portal
              </span>
              <p className="text-xs text-[#94a3b8]">
                FIVB / VNL Tournament Rules Compliant · Kinetic Stadium v2.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
            <button onClick={() => handleViewChange('schedule')} className="hover:text-white">Scores</button>
            <button onClick={() => handleViewChange('standings')} className="hover:text-white">Standings</button>
            <button onClick={() => handleViewChange('sponsors')} className="hover:text-white">Boosters</button>
            <button onClick={() => handleViewChange('teams')} className="hover:text-white">Teams</button>
            <button onClick={() => handleViewChange('admin')} className="hover:text-white">Console</button>
          </div>

          <div className="text-xs text-[#94a3b8]">
            © 2026 Collegiate Athletics · VNL Official Rules
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
