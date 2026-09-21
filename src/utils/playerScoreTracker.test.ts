import { describe, it, expect } from 'vitest';
import { updatePlayersWithPoints } from './playerScoreTracker';
import { Player } from '../types';

describe('playerScoreTracker', () => {
  const initialPlayers: Player[] = [
    {
      id: 'p-1',
      name: 'Elena Rostova',
      number: 7,
      position: 'Outside Hitter',
      points: 4,
      kills: 3,
      aces: 1,
      blocks: 0,
    },
    {
      id: 'p-2',
      name: 'Marcus Vance',
      number: 23,
      position: 'Guard',
      points: 10,
      twoPointers: 2,
      threePointers: 2,
      freeThrows: 0,
    }
  ];

  it('updates volleyball player points and kills for spike', () => {
    const updated = updatePlayersWithPoints(
      initialPlayers,
      'p-1',
      'Elena Rostova',
      7,
      1,
      'SPIKE',
      'Spike Kill Winner',
      'volleyball'
    );

    const elena = updated.find(p => p.id === 'p-1');
    expect(elena?.points).toBe(5);
    expect(elena?.kills).toBe(4);
    expect(elena?.aces).toBe(1);
  });

  it('updates basketball player points and 3-pointer stats', () => {
    const updated = updatePlayersWithPoints(
      initialPlayers,
      'p-2',
      'Marcus Vance',
      23,
      3,
      'SCORE',
      '3-Pointer Drained',
      'basketball'
    );

    const marcus = updated.find(p => p.id === 'p-2');
    expect(marcus?.points).toBe(13);
    expect(marcus?.threePointers).toBe(3);
  });

  it('adds player dynamically if not in initial roster', () => {
    const updated = updatePlayersWithPoints(
      initialPlayers,
      'p-new',
      'Chloe Dubois',
      3,
      1,
      'ACE',
      'Service Ace',
      'volleyball'
    );

    const chloe = updated.find(p => p.id === 'p-new');
    expect(chloe).toBeDefined();
    expect(chloe?.points).toBe(1);
    expect(chloe?.aces).toBe(1);
  });

  it('handles negative points for undo/correction cleanly without below zero', () => {
    const updated = updatePlayersWithPoints(
      initialPlayers,
      'p-1',
      'Elena Rostova',
      7,
      -2,
      'SCORE',
      'Score Correction',
      'volleyball'
    );

    const elena = updated.find(p => p.id === 'p-1');
    expect(elena?.points).toBe(2);
  });
});
