import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { BroadcastOverlayView } from './BroadcastOverlayView';
import { INITIAL_MATCHES } from '../data/mockData';

describe('BroadcastOverlayView Rendering', () => {
  it('renders OBS stream overlay mode with scorebug and sponsor bug', () => {
    const html = renderToString(
      React.createElement(BroadcastOverlayView, {
        matches: INITIAL_MATCHES,
        mode: 'overlay',
        onBackToPortal: vi.fn(),
      })
    );

    expect(html).toBeTruthy();
    expect(html).toContain('Transparent (OBS)');
    expect(html).toContain('OMEGA ATHLETICS');
  });

  it('renders stadium arena jumbotron mode with massive scoreboard', () => {
    const html = renderToString(
      React.createElement(BroadcastOverlayView, {
        matches: INITIAL_MATCHES,
        mode: 'jumbotron',
        onBackToPortal: vi.fn(),
      })
    );

    expect(html).toBeTruthy();
    expect(html).toContain('ARENA JUMBOTRON LED DISPLAY ACTIVE');
    expect(html).toContain('Return to Portal');
  });
});
