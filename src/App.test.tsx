import { describe, it, expect, beforeAll } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';

describe('App Root Component Routing & Scorer Screen Test', () => {
  beforeAll(() => {
    // Mock localStorage in Node
    const storage: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, val: string) => { storage[key] = String(val); },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    };
  });

  it('renders without crashing when navigating to #scorer without login', () => {
    (globalThis as any).window = {
      location: { hash: '#scorer' },
      addEventListener: () => {},
      removeEventListener: () => {},
      history: { replaceState: () => {} },
    };

    const html = renderToString(React.createElement(App));
    expect(html).toBeTruthy();
    expect(html).toContain('Admin Authentication Required');
    expect(html).toContain('Authenticate as Administrator');
  });

  it('renders LiveScoringAdmin console when admin session is active on #scorer', () => {
    (globalThis as any).localStorage.setItem('dunk_spike_admin_session', 'true');
    (globalThis as any).window = {
      location: { hash: '#scorer' },
      addEventListener: () => {},
      removeEventListener: () => {},
      history: { replaceState: () => {} },
    };

    const html = renderToString(React.createElement(App));
    expect(html).toBeTruthy();
    expect(html).not.toContain('Admin Authentication Required');
    // Either Live Scorer Connected or Tournament Schedule is Clean
    const hasConsoleOrClean = html.includes('Live Scorer Connected') || html.includes('Tournament Schedule is Clean');
    expect(hasConsoleOrClean).toBe(true);
  });

  it('renders TournamentBracketView when navigating to #bracket', () => {
    (globalThis as any).window = {
      location: { hash: '#bracket' },
      addEventListener: () => {},
      removeEventListener: () => {},
      history: { replaceState: () => {} },
    };

    const html = renderToString(React.createElement(App));
    expect(html).toContain('OFFICIAL CHAMPIONSHIP PLAYOFF BRACKET');
    expect(html).toContain('Quarterfinals');
    expect(html).toContain('Championship Final');
  });

  it('renders BroadcastOverlayView when navigating to #overlay or #jumbotron', () => {
    (globalThis as any).window = {
      location: { hash: '#overlay' },
      addEventListener: () => {},
      removeEventListener: () => {},
      history: { replaceState: () => {} },
    };

    const overlayHtml = renderToString(React.createElement(App));
    expect(overlayHtml).toContain('Transparent (OBS)');
    expect(overlayHtml).toContain('Championship Partner');

    (globalThis as any).window = {
      location: { hash: '#jumbotron' },
      addEventListener: () => {},
      removeEventListener: () => {},
      history: { replaceState: () => {} },
    };

    const jumbotronHtml = renderToString(React.createElement(App));
    expect(jumbotronHtml).toContain('ARENA JUMBOTRON LED DISPLAY ACTIVE');
    expect(jumbotronHtml).toContain('Return to Portal');
  });
});


