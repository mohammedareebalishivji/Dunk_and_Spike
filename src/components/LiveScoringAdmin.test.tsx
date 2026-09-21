import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { LiveScoringAdmin } from './LiveScoringAdmin';
import { CLEAN_TEMPLATE_MATCHES } from '../data/mockData';

describe('LiveScoringAdmin Rendering Test', () => {
  const defaultProps = {
    matches: CLEAN_TEMPLATE_MATCHES,
    selectedMatchId: CLEAN_TEMPLATE_MATCHES[0].id,
    onSelectMatchId: vi.fn(),
    onUpdateMatchScore: vi.fn(),
    onAddPlayerToMatchTeam: vi.fn(),
    onUpdateTeam: vi.fn(),
    onOpenTeamModal: vi.fn(),
    onFormatChange: vi.fn(),
    onAdvanceBasketballPeriod: vi.fn(),
    onAdvanceVolleyballSet: vi.fn(),
    onEditVolleyballSetScore: vi.fn(),
    onResetMatch: vi.fn(),
    onToggleClock: vi.fn(),
    onResetShotClock: vi.fn(),
    onOpenRulebook: vi.fn(),
    onOpenRulesEditor: vi.fn(),
    onOpenCreateMatch: vi.fn(),
    onLoadTemplateSchedule: vi.fn(),
    onClearAllData: vi.fn(),
    onDeleteMatch: vi.fn(),
    onBackToSchedule: vi.fn(),
    onNavigateToTeams: vi.fn(),
  };

  it('renders LiveScoringAdmin with volleyball match without crashing', () => {
    const vMatch = CLEAN_TEMPLATE_MATCHES.find(m => m.sport === 'volleyball')!;
    const html = renderToString(React.createElement(LiveScoringAdmin, {
      ...defaultProps,
      selectedMatchId: vMatch.id,
    }));
    expect(html).toBeTruthy();
    expect(html).toContain('Live Scorer Connected');
    expect(html).toContain('Authorized Court Scorer Console');
  });

  it('renders LiveScoringAdmin with basketball match without crashing', () => {
    const bMatch = CLEAN_TEMPLATE_MATCHES.find(m => m.sport === 'basketball')!;
    const html = renderToString(React.createElement(LiveScoringAdmin, {
      ...defaultProps,
      selectedMatchId: bMatch.id,
    }));
    expect(html).toBeTruthy();
    expect(html).toContain('Live Scorer Connected');
    expect(html).toContain('Authorized Court Scorer Console');
  });

  it('renders clean fallback when matches array is empty', () => {
    const html = renderToString(React.createElement(LiveScoringAdmin, {
      ...defaultProps,
      matches: [],
      selectedMatchId: undefined,
    }));
    expect(html).toContain('Tournament Schedule is Clean');
  });

  it('renders "End Match" option when match is LIVE and onEndMatch is provided', () => {
    const liveMatch = CLEAN_TEMPLATE_MATCHES.find(m => m.status === 'LIVE') || CLEAN_TEMPLATE_MATCHES[0];
    const onEndMatch = vi.fn();
    const html = renderToString(React.createElement(LiveScoringAdmin, {
      ...defaultProps,
      selectedMatchId: liveMatch.id,
      onEndMatch,
    }));
    expect(html).toContain('End Match');
  });

  it('does not render "End Match" button when match status is FINAL', () => {
    const finalMatch = {
      ...CLEAN_TEMPLATE_MATCHES[0],
      status: 'FINAL' as const,
    };
    const onEndMatch = vi.fn();
    const html = renderToString(React.createElement(LiveScoringAdmin, {
      ...defaultProps,
      matches: [finalMatch],
      selectedMatchId: finalMatch.id,
      onEndMatch,
    }));
    expect(html).not.toContain('title="Conclude match: team with most set wins is declared winner and awarded +1 point"');
  });

  it('renders "+ Register New Team" button in empty schedule state when onOpenRegisterTeam is provided', () => {
    const onOpenRegisterTeam = vi.fn();
    const html = renderToString(React.createElement(LiveScoringAdmin, {
      ...defaultProps,
      matches: [],
      selectedMatchId: undefined,
      onOpenRegisterTeam,
    }));
    expect(html).toContain('+ Register New Team');
  });

  it('renders "+ Register Team" in breadcrumb bar and "+ Team" in console action bar when onOpenRegisterTeam is provided', () => {
    const onOpenRegisterTeam = vi.fn();
    const html = renderToString(React.createElement(LiveScoringAdmin, {
      ...defaultProps,
      onOpenRegisterTeam,
    }));
    expect(html).toContain('+ Register Team');
    expect(html).toContain('+ Team');
  });
});
