import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { MatchCard } from './MatchCard';
import { CreateMatchModal } from './CreateMatchModal';
import { CLEAN_TEMPLATE_MATCHES } from '../data/mockData';
import { Match } from '../types';

describe('Admin Match Editing Workflow', () => {
  beforeAll(() => {
    const storage: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, val: string) => { storage[key] = String(val); },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    };
  });

  const sampleMatch: Match = CLEAN_TEMPLATE_MATCHES[0];

  it('renders Edit button on MatchCard when admin is logged in', () => {
    const html = renderToString(
      React.createElement(MatchCard, {
        match: sampleMatch,
        onOpenScorer: vi.fn(),
        isAdminLoggedIn: true,
        onEditMatch: vi.fn(),
      })
    );

    expect(html).toContain('title="Admin: Edit match details"');
    expect(html).toContain('Edit');
  });

  it('does not render Edit button on MatchCard when admin is NOT logged in', () => {
    const html = renderToString(
      React.createElement(MatchCard, {
        match: sampleMatch,
        onOpenScorer: vi.fn(),
        isAdminLoggedIn: false,
        onEditMatch: vi.fn(),
      })
    );

    expect(html).not.toContain('title="Admin: Edit match details"');
  });

  it('renders CreateMatchModal in edit mode with initialMatch values and updated title/button', () => {
    const html = renderToString(
      React.createElement(CreateMatchModal, {
        isOpen: true,
        onClose: vi.fn(),
        onCreateMatch: vi.fn(),
        onUpdateMatch: vi.fn(),
        initialMatch: sampleMatch,
      })
    );

    expect(html).toContain('Edit Match &amp; Rosters');
    expect(html).toContain('Save &amp; Update Match');
    expect(html).toContain(sampleMatch.homeTeam.name);
    expect(html).toContain(sampleMatch.awayTeam.name);
  });
});
