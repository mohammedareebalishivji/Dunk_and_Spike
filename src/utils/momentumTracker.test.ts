import { describe, it, expect } from 'vitest';
import { calculateMomentumRun, getEmbedStreamUrl } from './momentumTracker';
import { Match, PlayEvent } from '../types';

describe('Momentum Scoring Run Tracker & Stream Embed Helper', () => {
  const baseMatch: Match = {
    id: 'match-101',
    sport: 'volleyball',
    title: 'Surge vs Spikers',
    division: "Women's Division I",
    status: 'LIVE',
    court: 'Court 1',
    venue: 'Main Pavilion',
    homeTeam: { id: 'h1', name: 'Pacific Surge', shortName: 'SUR', logoColor: '#0284c7', accentColor: '#38bdf8', record: '0-0', score: 18 },
    awayTeam: { id: 'a1', name: 'Peak Spikers', shortName: 'SPK', logoColor: '#f97316', accentColor: '#fb923c', record: '0-0', score: 12 },
    statusDetail: 'SET 2',
  };

  it('detects an unanswered scoring run for the home team from play events', () => {
    const events: PlayEvent[] = [
      { id: '1', matchId: 'match-101', timestamp: '12:00', period: 'Set 2', team: 'away', type: 'SPIKE', description: 'Peak spike', scoreChange: '+1' },
      { id: '2', matchId: 'match-101', timestamp: '12:01', period: 'Set 2', team: 'home', type: 'SPIKE', description: 'Surge spike', scoreChange: '+1' },
      { id: '3', matchId: 'match-101', timestamp: '12:02', period: 'Set 2', team: 'home', type: 'ACE', description: 'Surge ace', scoreChange: '+1' },
      { id: '4', matchId: 'match-101', timestamp: '12:03', period: 'Set 2', team: 'home', type: 'BLOCK', description: 'Surge block', scoreChange: '+1' },
      { id: '5', matchId: 'match-101', timestamp: '12:04', period: 'Set 2', team: 'home', type: 'SPIKE', description: 'Surge winner', scoreChange: '+1' },
    ];

    const run = calculateMomentumRun(baseMatch, events);
    expect(run).not.toBeNull();
    expect(run?.team).toBe('home');
    expect(run?.teamName).toBe('SUR');
    expect(run?.points).toBe(4);
    expect(run?.label).toContain('4-0 Run • SUR');
    expect(run?.isHot).toBe(true);
  });

  it('breaks the momentum run as soon as opponent scores', () => {
    const events: PlayEvent[] = [
      { id: '1', matchId: 'match-101', timestamp: '12:00', period: 'Set 2', team: 'home', type: 'SPIKE', description: 'Surge spike', scoreChange: '+1' },
      { id: '2', matchId: 'match-101', timestamp: '12:01', period: 'Set 2', team: 'home', type: 'ACE', description: 'Surge ace', scoreChange: '+1' },
      { id: '3', matchId: 'match-101', timestamp: '12:02', period: 'Set 2', team: 'home', type: 'BLOCK', description: 'Surge block', scoreChange: '+1' },
      { id: '4', matchId: 'match-101', timestamp: '12:03', period: 'Set 2', team: 'away', type: 'SPIKE', description: 'Spikers side out', scoreChange: '+1' },
    ];

    const run = calculateMomentumRun(baseMatch, events);
    // Away has only 1 point, so no run >= 3
    expect(run).toBeNull();
  });

  it('returns null for completed or upcoming matches', () => {
    const finalMatch: Match = { ...baseMatch, status: 'FINAL' };
    const run = calculateMomentumRun(finalMatch);
    expect(run).toBeNull();
  });

  it('correctly calculates basketball multi-point basket runs', () => {
    const basketballMatch: Match = {
      ...baseMatch,
      sport: 'basketball',
      homeTeam: { ...baseMatch.homeTeam, name: 'Spartans', shortName: 'SPA' },
      awayTeam: { ...baseMatch.awayTeam, name: 'Tigers', shortName: 'TIG' },
    };

    const events: PlayEvent[] = [
      { id: '1', matchId: 'match-101', timestamp: '05:00', period: 'Q2', team: 'home', type: 'SCORE', description: '3-Pointer', scoreChange: '+3' },
      { id: '2', matchId: 'match-101', timestamp: '04:30', period: 'Q2', team: 'home', type: 'SCORE', description: 'Fast break dunk', scoreChange: '+2' },
      { id: '3', matchId: 'match-101', timestamp: '04:00', period: 'Q2', team: 'home', type: 'SCORE', description: 'Three point dagger', scoreChange: '+3' },
    ];

    const run = calculateMomentumRun(basketballMatch, events);
    expect(run).not.toBeNull();
    expect(run?.points).toBe(8);
    expect(run?.label).toBe('8-0 Run • SPA');
    expect(run?.isHot).toBe(true);
  });

  it('transforms YouTube and Twitch urls to embeddable player links', () => {
    const ytWatch = getEmbedStreamUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(ytWatch.type).toBe('youtube');
    expect(ytWatch.embedUrl).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');

    const ytShort = getEmbedStreamUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(ytShort.type).toBe('youtube');
    expect(ytShort.embedUrl).toContain('dQw4w9WgXcQ');

    const twitch = getEmbedStreamUrl('https://www.twitch.tv/esl_sc2');
    expect(twitch.type).toBe('twitch');
    expect(twitch.embedUrl).toContain('player.twitch.tv/?channel=esl_sc2');

    const none = getEmbedStreamUrl('');
    expect(none.type).toBe('none');
    expect(none.embedUrl).toBeNull();
  });
});
