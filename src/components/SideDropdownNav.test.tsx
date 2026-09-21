import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SideDropdownNav } from './SideDropdownNav';

describe('SideDropdownNav Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentSport: 'volleyball' as const,
    onSportChange: vi.fn(),
    currentView: 'schedule' as const,
    onViewChange: vi.fn(),
    isAdminLoggedIn: false,
    onOpenLogin: vi.fn(),
    onLogout: vi.fn(),
    onOpenRulebook: vi.fn(),
    onOpenRulesEditor: vi.fn(),
    onOpenCreateMatch: vi.fn(),
    onOpenTeamModal: vi.fn(),
    liveMatchesCount: 2,
    currentResolution: 'responsive' as const,
    onResolutionChange: vi.fn(),
    isAutoRotateActive: false,
    onToggleAutoRotate: vi.fn(),
    rotationInterval: 15,
    onIntervalChange: vi.fn(),
    secondsRemaining: 15,
  };

  it('renders nothing when isOpen is false', () => {
    const html = renderToString(
      React.createElement(SideDropdownNav, {
        ...defaultProps,
        isOpen: false,
      })
    );
    expect(html).toBe('');
  });

  it('renders the dialog and drawer structure when isOpen is true', () => {
    const html = renderToString(React.createElement(SideDropdownNav, defaultProps));
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Tournament Side Navigation Menu"');
    expect(html).toContain('DUNK');
    expect(html).toContain('SPIKE');
  });

  it('renders primary navigation views and live match badge', () => {
    const html = renderToString(React.createElement(SideDropdownNav, defaultProps));
    expect(html).toContain('Scores &amp; Match Schedule');
    expect(html).toContain('Standings &amp; Leaderboards');
    expect(html).toContain('Boosters &amp; Sponsors');
    expect(html).toContain('Teams &amp; Rosters');
    expect(html).toContain('Court Scorer Console');
    // Live badge
    expect(html).toContain('2 LIVE');
  });

  it('renders sport quick switch capsule for both sports', () => {
    const html = renderToString(React.createElement(SideDropdownNav, defaultProps));
    expect(html).toContain('Volleyball (VNL)');
    expect(html).toContain('Basketball (FIBA)');
  });

  it('shows restricted badge when not logged in and admin badge when logged in', () => {
    const htmlNotLoggedIn = renderToString(React.createElement(SideDropdownNav, {
      ...defaultProps,
      isAdminLoggedIn: false,
    }));
    expect(htmlNotLoggedIn).toContain('Restricted');

    const htmlLoggedIn = renderToString(React.createElement(SideDropdownNav, {
      ...defaultProps,
      isAdminLoggedIn: true,
    }));
    expect(htmlLoggedIn).toContain('Admin');
  });

  it('renders accordion section categories', () => {
    const html = renderToString(React.createElement(SideDropdownNav, defaultProps));
    expect(html).toContain('Primary Navigation');
    expect(html).toContain('Rules &amp; Regulations');
    expect(html).toContain('Admin Quick Actions');
    expect(html).toContain('Stadium Display &amp; Broadcast');
    expect(html).toContain('Keyboard Shortcuts');
  });

  it('renders quick action tools for match creation, team rosters, and rules', () => {
    const html = renderToString(React.createElement(SideDropdownNav, defaultProps));
    expect(html).toContain('Official Championship Rulebook');
    expect(html).toContain('Customize Rules (Admin)');
    expect(html).toContain('Schedule New Match');
    expect(html).toContain('Manage Team Rosters');
    expect(html).toContain('Scorer Station');
  });

  it('renders footer with session control button and status', () => {
    const htmlNotLoggedIn = renderToString(React.createElement(SideDropdownNav, {
      ...defaultProps,
      isAdminLoggedIn: false,
    }));
    expect(htmlNotLoggedIn).toContain('Admin Login');
    expect(htmlNotLoggedIn).toContain('Public Observer');

    const htmlLoggedIn = renderToString(React.createElement(SideDropdownNav, {
      ...defaultProps,
      isAdminLoggedIn: true,
    }));
    expect(htmlLoggedIn).toContain('Log Out');
    expect(htmlLoggedIn).toContain('Administrator');
  });

  it('renders LIVE COURTS, LIVE DB telemetry, Auto resolution, + Team, and Admin controls in menu', () => {
    const html = renderToString(React.createElement(SideDropdownNav, defaultProps));
    expect(html).toContain('LIVE COURTS');
    expect(html).toContain('2 LIVE');
    expect(html.includes('LIVE DB') || html.includes('LOCAL CACHE')).toBe(true);
    expect(html).toContain('Auto');
    expect(html).toContain('+ Team');
    expect(html).toContain('Admin');
  });
});
