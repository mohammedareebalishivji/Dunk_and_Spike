import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { TournamentBracketView } from './TournamentBracketView';
import { INITIAL_MATCHES } from '../data/mockData';

describe('TournamentBracketView Rendering', () => {
  it('renders tournament bracket tree without crashing', () => {
    const html = renderToString(
      React.createElement(TournamentBracketView, {
        currentSport: 'basketball',
        matches: INITIAL_MATCHES,
      })
    );

    expect(html).toContain('OFFICIAL CHAMPIONSHIP PLAYOFF BRACKET');
    expect(html).toContain('Quarterfinals');
    expect(html).toContain('Semifinals');
    expect(html).toContain('Championship Final');
  });

  it('renders volleyball playoff bracket when currentSport is volleyball', () => {
    const html = renderToString(
      React.createElement(TournamentBracketView, {
        currentSport: 'volleyball',
        matches: INITIAL_MATCHES,
      })
    );

    expect(html).toContain('FIVB Volleyball Playoff Tree');
    expect(html).toContain('Phoenix VBC');
  });
});
