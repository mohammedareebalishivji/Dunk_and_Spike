import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { EditTournamentDetailsModal } from './EditTournamentDetailsModal';
import { getTournamentDetails, resetTournamentDetails, saveTournamentDetails, DEFAULT_TOURNAMENT_DETAILS } from '../utils/tournamentDetailsManager';

describe('EditTournamentDetailsModal', () => {
  beforeAll(() => {
    const storage: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, val: string) => { storage[key] = String(val); },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    };
  });

  beforeEach(() => {
    (globalThis as any).localStorage.clear();
    resetTournamentDetails();
  });

  it('renders nothing when isOpen is false', () => {
    const html = renderToString(
      React.createElement(EditTournamentDetailsModal, {
        isOpen: false,
        onClose: vi.fn(),
      })
    );
    expect(html).toBe('');
  });

  it('renders tournament fields and collegiate honors when isOpen is true', () => {
    const html = renderToString(
      React.createElement(EditTournamentDetailsModal, {
        isOpen: true,
        onClose: vi.fn(),
      })
    );

    expect(html).toContain('Edit Tournament Details');
    expect(html).toContain('DUNK &amp; SPIKE');
    expect(html).toContain('Metro Sports Arena &amp; Fieldhouse');
    expect(html).toContain('Championship Banner &amp; Gold Trophy');
    expect(html).toContain('Save Tournament Details');
  });

  it('loads updated tournament details into the modal fields when details change', () => {
    saveTournamentDetails({
      ...DEFAULT_TOURNAMENT_DETAILS,
      name: 'GRAND INTERCOLLEGIATE SLAM 2026',
      venue: 'Metropolitan Dome',
    });

    const html = renderToString(
      React.createElement(EditTournamentDetailsModal, {
        isOpen: true,
        onClose: vi.fn(),
      })
    );

    expect(html).toContain('GRAND INTERCOLLEGIATE SLAM 2026');
    expect(html).toContain('Metropolitan Dome');
  });
});
