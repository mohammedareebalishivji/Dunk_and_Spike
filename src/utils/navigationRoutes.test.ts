import { describe, it, expect } from 'vitest';
import {
  resolveViewFromHash,
  resolveHashFromView,
  getNextRotationView,
  VIEW_TO_HASH,
  HASH_TO_VIEW,
} from './navigationRoutes';

describe('Navigation Routing & Browser Hash Utilities', () => {
  describe('Hash to View Resolution', () => {
    it('resolves #scores to schedule view', () => {
      expect(resolveViewFromHash('#scores')).toBe('schedule');
      expect(resolveViewFromHash('#Scores')).toBe('schedule');
    });

    it('resolves legacy alias #schedule to schedule view', () => {
      expect(resolveViewFromHash('#schedule')).toBe('schedule');
    });

    it('resolves #standings to standings view', () => {
      expect(resolveViewFromHash('#standings')).toBe('standings');
      expect(resolveViewFromHash('#STANDINGS')).toBe('standings');
    });

    it('resolves #sponsors to sponsors view', () => {
      expect(resolveViewFromHash('#sponsors')).toBe('sponsors');
    });

    it('resolves #scorer and #admin to admin view', () => {
      expect(resolveViewFromHash('#scorer')).toBe('admin');
      expect(resolveViewFromHash('#admin')).toBe('admin');
    });

    it('resolves #teams to teams view', () => {
      expect(resolveViewFromHash('#teams')).toBe('teams');
      expect(resolveViewFromHash('#TEAMS')).toBe('teams');
    });

    it('resolves #bracket and #playoffs to bracket view', () => {
      expect(resolveViewFromHash('#bracket')).toBe('bracket');
      expect(resolveViewFromHash('#playoffs')).toBe('bracket');
    });

    it('resolves #overlay, #broadcast, #obs, #jumbotron, #display', () => {
      expect(resolveViewFromHash('#overlay')).toBe('overlay');
      expect(resolveViewFromHash('#broadcast')).toBe('overlay');
      expect(resolveViewFromHash('#obs')).toBe('overlay');
      expect(resolveViewFromHash('#jumbotron')).toBe('jumbotron');
      expect(resolveViewFromHash('#display')).toBe('jumbotron');
    });

    it('falls back to schedule for empty or unknown hashes', () => {
      expect(resolveViewFromHash('')).toBe('schedule');
      expect(resolveViewFromHash(null)).toBe('schedule');
      expect(resolveViewFromHash(undefined)).toBe('schedule');
      expect(resolveViewFromHash('#unknown-hash')).toBe('schedule');
    });
  });

  describe('View to Hash Canonical Mapping', () => {
    it('returns canonical hashes for all views', () => {
      expect(resolveHashFromView('schedule')).toBe('#scores');
      expect(resolveHashFromView('standings')).toBe('#standings');
      expect(resolveHashFromView('bracket')).toBe('#bracket');
      expect(resolveHashFromView('sponsors')).toBe('#sponsors');
      expect(resolveHashFromView('admin')).toBe('#scorer');
      expect(resolveHashFromView('teams')).toBe('#teams');
      expect(resolveHashFromView('overlay')).toBe('#overlay');
      expect(resolveHashFromView('jumbotron')).toBe('#jumbotron');
    });
  });


  describe('Automated Kiosk Rotation Progression', () => {
    it('cycles through public views in order when admin is not logged in', () => {
      expect(getNextRotationView('schedule', false)).toBe('standings');
      expect(getNextRotationView('standings', false)).toBe('bracket');
      expect(getNextRotationView('bracket', false)).toBe('sponsors');
      expect(getNextRotationView('sponsors', false)).toBe('schedule');
    });

    it('includes admin view in rotation only when admin is logged in', () => {
      expect(getNextRotationView('schedule', true)).toBe('admin');
      expect(getNextRotationView('admin', true)).toBe('standings');
      expect(getNextRotationView('standings', true)).toBe('bracket');
      expect(getNextRotationView('bracket', true)).toBe('sponsors');
      expect(getNextRotationView('sponsors', true)).toBe('schedule');
    });

    it('recovers to schedule if current view is not recognized', () => {
      expect(getNextRotationView('unknown' as any, false)).toBe('schedule');
      expect(getNextRotationView('teams', false)).toBe('schedule');
    });
  });
});

