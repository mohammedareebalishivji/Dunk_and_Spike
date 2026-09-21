import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { TeamRosterModal } from './TeamRosterModal';
import { AdminTeamsView } from './AdminTeamsView';
import { CreateMatchModal } from './CreateMatchModal';
import { Team, Player, Sport, Match } from '../types';
import { 
  getStoredTeams, 
  saveStoredTeams, 
  getAllDefaultTeams, 
  normalizeTeamPlayers, 
  getPreexistingTeams,
  PreexistingTeam 
} from '../data/preexistingTeams';

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe('Register New Team Flow & Verification Tests', () => {
  beforeAll(() => {
    if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.setItem) {
      (globalThis as any).localStorage = createLocalStorageMock();
    }
  });

  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {}
  });

  it('renders TeamRosterModal for registering a new team without crashing', () => {
    const html = renderToString(
      React.createElement(TeamRosterModal, {
        isOpen: true,
        onClose: () => {},
        sport: 'volleyball',
        onSaveTeam: () => {},
      })
    );

    expect(html).toContain('Register New Championship Team');
    expect(html).toContain('Volleyball (6 Court)');
    expect(html).toContain('Basketball (5 Court)');
    expect(html).toContain('Team Full Name');
    expect(html).toContain('Short Tag');
    expect(html).toContain('Squad Roster');
    expect(html).toContain('Save Team &amp; Roster');
  });

  it('renders AdminTeamsView with Register New Team action directly accessible', () => {
    const html = renderToString(
      React.createElement(AdminTeamsView, {
        isAdminLoggedIn: false,
        onOpenLogin: () => {},
        matches: [],
        onUpdateTeamInMatches: () => {},
        currentSport: 'volleyball',
      })
    );

    expect(html).toContain('Championship Teams Registry');
    expect(html).toContain('Register New Team');
    expect(html).toContain('Tournament Roster Console');
    // Verifies it lists preexisting teams rather than blocking
    expect(html).toContain('Pacific Surge');
    expect(html).toContain('Peak Spikers');
  });

  it('successfully registers and saves a new Volleyball team to local storage and memory', () => {
    const initialStored = getStoredTeams();
    const initialCount = initialStored.length;

    const newTeam: PreexistingTeam = {
      id: `team-test-${Date.now()}`,
      name: 'Valkyrie Titans',
      shortName: 'VTT',
      sport: 'volleyball',
      seed: 5,
      logoColor: '#0284c7',
      accentColor: '#38bdf8',
      record: '0-0',
      logoUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
      players: [
        { id: 'p1', name: 'Alina Volkova', number: 1, position: 'Setter', points: 0, isOnCourt: true, isStarter: true },
        { id: 'p2', name: 'Maya Sterling', number: 2, position: 'Outside Hitter', points: 0, isOnCourt: true, isStarter: true },
        { id: 'p3', name: 'Chloe Vance', number: 3, position: 'Middle Blocker', points: 0, isOnCourt: true, isStarter: true },
        { id: 'p4', name: 'Sarah Chen', number: 4, position: 'Opposite', points: 0, isOnCourt: true, isStarter: true },
        { id: 'p5', name: 'Elena Rios', number: 5, position: 'Outside Hitter', points: 0, isOnCourt: true, isStarter: true },
        { id: 'p6', name: 'Hannah Cole', number: 6, position: 'Libero', points: 0, isOnCourt: true, isStarter: true },
        { id: 'p7', name: 'Zoe Brooks', number: 7, position: 'Defensive Specialist', points: 0, isOnCourt: false, isStarter: false },
        { id: 'p8', name: 'Kira Diaz', number: 8, position: 'Backup Setter', points: 0, isOnCourt: false, isStarter: false },
      ],
    };

    // Prepend to storage
    const updated = [newTeam, ...initialStored];
    saveStoredTeams(updated);

    const reloaded = getStoredTeams();
    expect(reloaded).toHaveLength(initialCount + 1);

    const registered = reloaded.find(t => t.name === 'Valkyrie Titans');
    expect(registered).toBeDefined();
    expect(registered?.shortName).toBe('VTT');
    expect(registered?.sport).toBe('volleyball');
    expect(registered?.logoUrl).toBe('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=');
    expect(registered?.players).toHaveLength(8);

    const onCourt = registered!.players.filter(p => p.isOnCourt !== false);
    const onBench = registered!.players.filter(p => p.isOnCourt === false);
    expect(onCourt).toHaveLength(6);
    expect(onBench).toHaveLength(2);
  });

  it('successfully registers and saves a new Basketball team with 5 on court and 3 on bench', () => {
    const initialStored = getStoredTeams();
    const initialCount = initialStored.length;

    const newBasketballTeam: PreexistingTeam = {
      id: `bb-test-${Date.now()}`,
      name: 'Skyline Monarchs',
      shortName: 'SKM',
      sport: 'basketball',
      seed: 3,
      logoColor: '#f97316',
      accentColor: '#fb923c',
      record: '0-0',
      players: normalizeTeamPlayers([
        { id: 'bp1', name: 'Devon Wright', number: 10, position: 'Point Guard', points: 0, isOnCourt: true, isStarter: true },
        { id: 'bp2', name: 'Cole Turner', number: 23, position: 'Shooting Guard', points: 0, isOnCourt: true, isStarter: true },
        { id: 'bp3', name: 'Marcus Hayes', number: 34, position: 'Small Forward', points: 0, isOnCourt: true, isStarter: true },
        { id: 'bp4', name: 'Jaxon Campbell', number: 55, position: 'Power Forward', points: 0, isOnCourt: true, isStarter: true },
        { id: 'bp5', name: 'Zion Sterling', number: 15, position: 'Center', points: 0, isOnCourt: true, isStarter: true },
        { id: 'bp6', name: 'Dante Reed', number: 3, position: 'Sixth Man', points: 0, isOnCourt: false, isStarter: false },
        { id: 'bp7', name: 'Trevor Vance', number: 7, position: 'Reserve Guard', points: 0, isOnCourt: false, isStarter: false },
        { id: 'bp8', name: 'Kobe Miller', number: 21, position: 'Reserve Center', points: 0, isOnCourt: false, isStarter: false },
      ], 'basketball'),
    };

    saveStoredTeams([newBasketballTeam, ...initialStored]);

    const reloaded = getStoredTeams();
    expect(reloaded).toHaveLength(initialCount + 1);

    const saved = reloaded.find(t => t.name === 'Skyline Monarchs');
    expect(saved).toBeDefined();
    expect(saved?.sport).toBe('basketball');

    const onCourt = saved!.players.filter(p => p.isOnCourt !== false);
    const onBench = saved!.players.filter(p => p.isOnCourt === false);
    expect(onCourt).toHaveLength(5);
    expect(onBench).toHaveLength(3);
  });

  it('makes newly registered teams immediately discoverable by getPreexistingTeams for match scheduling', () => {
    const newTeam: PreexistingTeam = {
      id: 'team-discoverable-1',
      name: 'Empire Thunder',
      shortName: 'EMP',
      sport: 'volleyball',
      seed: 7,
      logoColor: '#8b5cf6',
      accentColor: '#a78bfa',
      record: '0-0',
      players: normalizeTeamPlayers([], 'volleyball'),
    };

    const stored = getStoredTeams();
    saveStoredTeams([newTeam, ...stored]);

    // getPreexistingTeams should now include Empire Thunder
    const volleyballCatalog = getPreexistingTeams('volleyball');
    const match = volleyballCatalog.find(t => t.name === 'Empire Thunder');
    expect(match).toBeDefined();
    expect(match?.shortName).toBe('EMP');
  });

  it('creates exhibition showcase match with full 8-player opponent when newly registered team is saved', () => {
    const savedTeam: Team = {
      id: 'team-reg-test',
      name: 'Apex Predators',
      shortName: 'APX',
      sport: 'volleyball',
      seed: 1,
      logoColor: '#0284c7',
      accentColor: '#38bdf8',
      record: '0-0',
      score: 0,
      players: normalizeTeamPlayers([], 'volleyball'),
    };

    // Simulated handleSaveTeam logic matching App.tsx
    const createExhibitionMatch = (team: Team): Match => {
      const isVb = team.sport === 'volleyball';
      const ts = Date.now();
      const opponent: Team = isVb ? {
        id: `opp-${ts}`,
        name: 'Peak Spikers',
        shortName: 'SPK',
        seed: 2,
        logoColor: '#f97316',
        accentColor: '#fb923c',
        record: '13-3',
        score: 0,
        players: [
          { id: `opp-1`, name: 'P1', number: 1, position: 'MB', points: 0, isOnCourt: true },
          { id: `opp-2`, name: 'P2', number: 2, position: 'OH', points: 0, isOnCourt: true },
          { id: `opp-3`, name: 'P3', number: 3, position: 'S', points: 0, isOnCourt: true },
          { id: `opp-4`, name: 'P4', number: 4, position: 'OPP', points: 0, isOnCourt: true },
          { id: `opp-5`, name: 'P5', number: 5, position: 'OH', points: 0, isOnCourt: true },
          { id: `opp-6`, name: 'P6', number: 6, position: 'L', points: 0, isOnCourt: true },
          { id: `opp-7`, name: 'P7', number: 7, position: 'DS', points: 0, isOnCourt: false },
          { id: `opp-8`, name: 'P8', number: 8, position: 'SET', points: 0, isOnCourt: false },
        ]
      } : {
        id: `opp-${ts}`,
        name: 'Coastal Spartans',
        shortName: 'CST',
        seed: 2,
        logoColor: '#0284c7',
        accentColor: '#38bdf8',
        record: '15-2',
        score: 0,
        players: [
          { id: `opp-1`, name: 'P1', number: 1, position: 'PG', points: 0, isOnCourt: true },
          { id: `opp-2`, name: 'P2', number: 2, position: 'SG', points: 0, isOnCourt: true },
          { id: `opp-3`, name: 'P3', number: 3, position: 'SF', points: 0, isOnCourt: true },
          { id: `opp-4`, name: 'P4', number: 4, position: 'PF', points: 0, isOnCourt: true },
          { id: `opp-5`, name: 'P5', number: 5, position: 'C', points: 0, isOnCourt: true },
          { id: `opp-6`, name: 'P6', number: 6, position: '6TH', points: 0, isOnCourt: false },
          { id: `opp-7`, name: 'P7', number: 7, position: 'RES', points: 0, isOnCourt: false },
          { id: `opp-8`, name: 'P8', number: 8, position: 'RES', points: 0, isOnCourt: false },
        ]
      };

      return {
        id: `match-team-${ts}`,
        sport: team.sport || 'volleyball',
        title: `${team.name} Championship Showcase`,
        division: "Men's Division I",
        status: 'LIVE',
        court: 'Court 1 - Main Arena',
        venue: 'Grand Central Athletics Center',
        homeTeam: team,
        awayTeam: opponent,
      };
    };

    const match = createExhibitionMatch(savedTeam);
    expect(match.homeTeam.name).toBe('Apex Predators');
    expect(match.awayTeam.players).toHaveLength(8);
    expect(match.awayTeam.players?.filter(p => p.isOnCourt !== false)).toHaveLength(6);
  });

  it('renders Auto 8 Squad button in TeamRosterModal for 1-click roster creation', () => {
    const html = renderToString(
      React.createElement(TeamRosterModal, {
        isOpen: true,
        onClose: () => {},
        sport: 'volleyball',
        onSaveTeam: () => {},
      })
    );

    expect(html).toContain('Auto 8 Squad (6+2)');
    expect(html).toContain('Clear Roster');
  });

  it('renders Auto 8 Squad (5+3) when Basketball discipline is selected', () => {
    const html = renderToString(
      React.createElement(TeamRosterModal, {
        isOpen: true,
        onClose: () => {},
        sport: 'basketball',
        onSaveTeam: () => {},
      })
    );

    expect(html).toContain('Auto 8 Squad (5+3)');
  });

  it('renders AdminTeamsView with onRegisterTeam prop supported', () => {
    const onRegisterTeam = () => {};
    const html = renderToString(
      React.createElement(AdminTeamsView, {
        isAdminLoggedIn: true,
        onOpenLogin: () => {},
        matches: [],
        onUpdateTeamInMatches: () => {},
        onRegisterTeam,
        currentSport: 'volleyball',
        onNavigateToScorer: () => {},
      })
    );

    expect(html).toContain('Championship Teams Registry');
    expect(html).toContain('Register New Team');
  });
});
