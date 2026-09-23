import { describe, it, expect } from 'vitest';
import { parseRosterCsv, exportRosterToCsv, generateRosterCsvTemplate } from './rosterCsv';
import { MAX_TEAM_ROSTER_LIMIT } from '../components/CreateMatchModal';

describe('Roster CSV Import and Export Utility', () => {
  it('generates standard CSV templates for volleyball and basketball', () => {
    const vbTemplate = generateRosterCsvTemplate('volleyball');
    expect(vbTemplate).toContain('Name,Number,Position,Starter');
    expect(vbTemplate).toContain('Elena Rostova');
    expect(vbTemplate).toContain('Outside Hitter');

    const bbTemplate = generateRosterCsvTemplate('basketball');
    expect(bbTemplate).toContain('Name,Number,Position,Starter');
    expect(bbTemplate).toContain('Marcus Vance');
    expect(bbTemplate).toContain('Shooting Guard');
  });

  it('correctly parses a standard CSV with comma separation and headers', () => {
    const csv = `
Name,Number,Position,Starter
Alex Morgan,13,Forward,true
Megan Rapinoe,15,Winger,true
Rose Lavelle,16,Midfielder,true
Julie Ertz,8,Defensive Mid,true
Becky Sauerbrunn,4,Defender,true
Alyssa Naeher,1,Goalkeeper,true
Carli Lloyd,10,Forward,false
Tobin Heath,17,Winger,false
    `.trim();

    const result = parseRosterCsv(csv, 'volleyball');
    expect(result.errors).toHaveLength(0);
    expect(result.validCount).toBe(8);
    expect(result.players).toHaveLength(8);

    const first = result.players[0];
    expect(first.name).toBe('Alex Morgan');
    expect(first.number).toBe(13);
    expect(first.position).toBe('Forward');
    expect(first.isStarter).toBe(true);
    expect(first.isOnCourt).toBe(true);

    const sub = result.players[6];
    expect(sub.name).toBe('Carli Lloyd');
    expect(sub.number).toBe(10);
    expect(sub.isStarter).toBe(false);
    expect(sub.isOnCourt).toBe(false);
  });

  it('handles semicolon and tab delimited CSV lines seamlessly', () => {
    const semiCsv = `
Name;Number;Position;Starter
Kobe Bryant;24;Shooting Guard;true
Shaquille O'Neal;34;Center;true
Derek Fisher;2;Point Guard;true
Rick Fox;17;Small Forward;true
Robert Horry;5;Power Forward;true
Brian Shaw;20;Guard;false
    `.trim();

    const semiResult = parseRosterCsv(semiCsv, 'basketball');
    expect(semiResult.errors).toHaveLength(0);
    expect(semiResult.players).toHaveLength(6);
    expect(semiResult.players[0].name).toBe('Kobe Bryant');
    expect(semiResult.players[0].number).toBe(24);

    const tabCsv = [
      'Name\tNumber\tPosition\tStarter',
      'Player One\t1\tOutside Hitter\ttrue',
      'Player Two\t2\tSetter\ttrue',
    ].join('\n');

    const tabResult = parseRosterCsv(tabCsv, 'volleyball');
    expect(tabResult.errors).toHaveLength(0);
    expect(tabResult.players).toHaveLength(2);
    expect(tabResult.players[0].name).toBe('Player One');
  });

  it('handles quoted names with commas without breaking column positions', () => {
    const csv = `
Name,Number,Position,Starter
"Smith, John",23,Guard,true
"O'Connor, Liam",7,Forward,true
    `.trim();

    const result = parseRosterCsv(csv, 'basketball');
    expect(result.errors).toHaveLength(0);
    expect(result.players).toHaveLength(2);
    expect(result.players[0].name).toBe('Smith, John');
    expect(result.players[0].number).toBe(23);
  });

  it('reports missing name errors and handles invalid jersey numbers gracefully', () => {
    const csv = `
Name,Number,Position,Starter
,10,Setter,true
Valid Player,invalid-number,Middle,true
    `.trim();

    const result = parseRosterCsv(csv, 'volleyball');
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors[0]).toContain('Athlete Name is missing');

    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings[0]).toContain('Invalid jersey number');
    expect(result.players).toHaveLength(1);
    expect(result.players[0].name).toBe('Valid Player');
  });

  it(`enforces MAX_TEAM_ROSTER_LIMIT (${MAX_TEAM_ROSTER_LIMIT}) and caps rosters exceeding the limit`, () => {
    const lines = ['Name,Number,Position,Starter'];
    for (let i = 1; i <= 15; i++) {
      lines.push(`Athlete ${i},${i},Position,${i <= 6}`);
    }
    const csv = lines.join('\n');

    const result = parseRosterCsv(csv, 'volleyball');
    expect(result.players.length).toBe(MAX_TEAM_ROSTER_LIMIT);
    expect(result.warnings.some(w => w.includes(`exceeded tournament maximum of ${MAX_TEAM_ROSTER_LIMIT}`))).toBe(true);
  });

  it('exports players cleanly to CSV format matching input specification', () => {
    const players = [
      { id: 'p1', name: 'John Doe', number: 10, position: 'Setter', points: 15, isStarter: true, isOnCourt: true },
      { id: 'p2', name: 'Jane, Jr.', number: 22, position: 'Libero', points: 0, isStarter: false, isOnCourt: false },
    ];

    const exported = exportRosterToCsv(players);
    expect(exported).toContain('Name,Number,Position,Starter,Points');
    expect(exported).toContain('John Doe,10,Setter,true,15');
    expect(exported).toContain('"Jane, Jr.",22,Libero,false,0');
  });
});
