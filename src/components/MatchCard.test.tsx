import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MatchCard } from './MatchCard';
import { Match } from '../types';

describe('MatchCard (Fan Experience, Livestream & Momentum)', () => {
  const sampleMatch: Match = {
    id: 'match-fan-1',
    sport: 'volleyball',
    title: 'Pacific Championship',
    division: "Women's Division I",
    status: 'LIVE',
    court: 'Court 1 - Main Arena',
    venue: 'Grand Central Pavilion',
    statusDetail: 'SET 2 (18-12)',
    streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    homeTeam: {
      id: 'h1',
      name: 'Pacific Surge',
      shortName: 'SUR',
      logoColor: '#0284c7',
      accentColor: '#38bdf8',
      record: '14-2',
      score: 18,
      setsWon: 1,
      players: [
        { id: 'p1', name: 'Elena Rostova', number: 7, position: 'Outside Hitter', points: 12, isOnCourt: true, isStarter: true },
        { id: 'p2', name: 'Chloe Dubois', number: 3, position: 'Setter', points: 3, isOnCourt: true, isStarter: true },
      ],
    },
    awayTeam: {
      id: 'a1',
      name: 'Peak Spikers',
      shortName: 'SPK',
      logoColor: '#f97316',
      accentColor: '#fb923c',
      record: '12-4',
      score: 12,
      setsWon: 0,
      players: [
        { id: 'a-p1', name: 'Maya Lindqvist', number: 14, position: 'Middle Blocker', points: 8, isOnCourt: true, isStarter: true },
      ],
    },
  };

  it('renders match scoreboard with teams, court, and status', () => {
    const onOpenScorer = vi.fn();
    const html = renderToString(
      React.createElement(MatchCard, {
        match: sampleMatch,
        onOpenScorer,
      })
    );

    expect(html).toContain('Pacific Surge');
    expect(html).toContain('Peak Spikers');
    expect(html).toContain('Court 1 - Main Arena');
    expect(html).toContain('SET 2 (18-12)');
  });

  it('renders livestream badge and button when streamUrl is provided', () => {
    const onOpenScorer = vi.fn();
    const html = renderToString(
      React.createElement(MatchCard, {
        match: sampleMatch,
        onOpenScorer,
      })
    );

    expect(html).toContain('Live Stream');
  });

  it('renders Fan Center button and Scorer Console action', () => {
    const onOpenScorer = vi.fn();
    const html = renderToString(
      React.createElement(MatchCard, {
        match: sampleMatch,
        onOpenScorer,
      })
    );

    expect(html).toContain('Fan Center');
    expect(html).toContain('Scorer Console');
  });

  it('renders momentum run badge when a team is on an unanswered run', () => {
    const hotMatch: Match = {
      ...sampleMatch,
      homeTeam: {
        ...sampleMatch.homeTeam,
        score: 5,
      },
      awayTeam: {
        ...sampleMatch.awayTeam,
        score: 0,
      },
    };

    const html = renderToString(
      React.createElement(MatchCard, {
        match: hotMatch,
        onOpenScorer: vi.fn(),
      })
    );

    expect(html).toContain('MOMENTUM RUN');
    expect(html).toContain('5-0 Run • SUR');
  });
});
