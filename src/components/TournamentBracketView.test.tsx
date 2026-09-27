import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { TournamentBracketView } from './TournamentBracketView';
import { INITIAL_MATCHES } from '../data/mockData';
import { saveVolleyballTournamentConfig, resetVolleyballTournamentConfig } from '../utils/volleyballTournamentDesigner';

describe('TournamentBracketView Rendering', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
      resetVolleyballTournamentConfig();
    } catch {}
  });

  it('renders tournament bracket tree without crashing for basketball', () => {
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
    expect(html).toContain('Admin Protected');
  });

  it('shows Design Volleyball Playoff Tree button only when isAdminLoggedIn is true', () => {
    const adminHtml = renderToString(
      React.createElement(TournamentBracketView, {
        currentSport: 'volleyball',
        matches: INITIAL_MATCHES,
        isAdminLoggedIn: true,
      })
    );

    expect(adminHtml).toContain('Design Volleyball Playoff Tree');
    expect(adminHtml).toContain('Admin Design Access Enabled');

    const publicHtml = renderToString(
      React.createElement(TournamentBracketView, {
        currentSport: 'volleyball',
        matches: INITIAL_MATCHES,
        isAdminLoggedIn: false,
      })
    );

    expect(publicHtml).not.toContain('Design Volleyball Playoff Tree');
    expect(publicHtml).toContain('Admin Protected · Official Layout');
  });

  it('renders FIVB Volleyball League format when configured as league by admin', () => {
    saveVolleyballTournamentConfig({
      format: 'league',
      leagueTeams: ['Phoenix VBC', 'Apex Volleyball', 'Blaze VBC', 'Volley Hawks'],
    });

    const html = renderToString(
      React.createElement(TournamentBracketView, {
        currentSport: 'volleyball',
        matches: INITIAL_MATCHES,
        isAdminLoggedIn: false,
      })
    );

    expect(html).toContain('FIVB Volleyball League System &amp; Fixtures');
    expect(html).toContain('Official FIVB Volleyball League Table');
    expect(html).toContain('League Fixtures &amp; Scheduled Matches');
    expect(html).toContain('FIVB 3-2-1-0 Points Model');
  });
});
