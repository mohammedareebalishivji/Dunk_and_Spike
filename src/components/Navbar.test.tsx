import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Navbar } from './Navbar';

describe('Navbar Component Navigation Test', () => {
  const defaultProps = {
    currentSport: 'volleyball' as const,
    onSportChange: vi.fn(),
    currentView: 'schedule' as const,
    onViewChange: vi.fn(),
    isAdminLoggedIn: false,
    onOpenLogin: vi.fn(),
    onLogout: vi.fn(),
    onOpenRulebook: vi.fn(),
    onOpenRulesEditor: vi.fn(),
    liveMatchesCount: 2,
    currentResolution: 'responsive' as const,
    onResolutionChange: vi.fn(),
    isAutoRotateActive: false,
    onToggleAutoRotate: vi.fn(),
    rotationInterval: 10,
    onIntervalChange: vi.fn(),
    secondsRemaining: 10,
    onOpenTeamModal: vi.fn(),
    onToggleSideMenu: vi.fn(),
  };

  it('renders top navigation brand, sport capsule, view tabs, rulebook, and Admin / Login button', () => {
    const html = renderToString(React.createElement(Navbar, defaultProps));
    expect(html).toContain('DUNK');
    expect(html).toContain('SPIKE');
    expect(html).toContain('VOLLEYBALL');
    expect(html).toContain('BASKETBALL');
    expect(html).toContain('Scores');
    expect(html).toContain('Standings');
    expect(html).toContain('Sponsors');
    expect(html).toContain('Teams');
    expect(html).toContain('Console');
    expect(html).toContain('Rulebook');
    expect(html).toContain('Menu');
    // Admin / Login in navigation bar
    expect(html).toContain('Admin / Login');
  });

  it('renders active Admin badge and logout in navigation bar when logged in', () => {
    const htmlLoggedIn = renderToString(React.createElement(Navbar, {
      ...defaultProps,
      isAdminLoggedIn: true,
    }));
    expect(htmlLoggedIn).toContain('Admin');
    expect(htmlLoggedIn).toContain('Log Out Admin');
  });

  it('renders + Register Team quick action in top navigation bar for logged in admin', () => {
    const html = renderToString(React.createElement(Navbar, {
      ...defaultProps,
      isAdminLoggedIn: true,
    }));
    expect(html).toContain('+ Register Team');
  });
});
