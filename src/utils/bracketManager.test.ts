import { describe, it, expect } from 'vitest';
import { 
  generateInitialBracket, 
  synchronizeBracketWithMatches, 
  advanceBracketMatch 
} from './bracketManager';
import { Match } from '../types';

describe('BracketManager (Playoff Engine & Progression)', () => {
  it('generates an 8-team bracket with QF, SF, 3rd place, and Finals for basketball and volleyball', () => {
    const bbBracket = generateInitialBracket('basketball');
    expect(bbBracket.nodes.length).toBe(8);

    const qfs = bbBracket.nodes.filter(n => n.round === 'quarterfinals');
    const sfs = bbBracket.nodes.filter(n => n.round === 'semifinals');
    const bronze = bbBracket.nodes.filter(n => n.round === 'third_place');
    const finals = bbBracket.nodes.filter(n => n.round === 'finals');

    expect(qfs.length).toBe(4);
    expect(sfs.length).toBe(2);
    expect(bronze.length).toBe(1);
    expect(finals.length).toBe(1);

    expect(qfs[0].homeTeamName).toBe('Spartans');
    expect(qfs[0].awayTeamName).toBe('Titans');

    const vbBracket = generateInitialBracket('volleyball');
    expect(vbBracket.nodes.length).toBe(8);
    expect(vbBracket.nodes[0].homeTeamName).toBe('Phoenix VBC');
  });

  it('automatically advances QF winners into Semifinal slots', () => {
    let bracket = generateInitialBracket('basketball');

    // Simulate QF 1: Spartans beat Titans (100 - 90)
    bracket = advanceBracketMatch(bracket, 'basketball-qf-1', 'home', 100, 90);

    // Simulate QF 2: Cardinals beat Hawks (85 - 80)
    bracket = advanceBracketMatch(bracket, 'basketball-qf-2', 'home', 85, 80);

    const sf1 = bracket.nodes.find(n => n.id === 'basketball-sf-1')!;
    expect(sf1.homeTeamName).toBe('Spartans');
    expect(sf1.homeTeamSeed).toBe(1);
    expect(sf1.awayTeamName).toBe('Cardinals');
    expect(sf1.awayTeamSeed).toBe(4);
  });

  it('automatically routes SF losers to Bronze game and SF winners to Finals', () => {
    let bracket = generateInitialBracket('basketball');

    // Complete all QFs
    bracket = advanceBracketMatch(bracket, 'basketball-qf-1', 'home', 100, 80); // Spartans
    bracket = advanceBracketMatch(bracket, 'basketball-qf-2', 'home', 90, 75);  // Cardinals
    bracket = advanceBracketMatch(bracket, 'basketball-qf-3', 'home', 88, 80);  // Tigers
    bracket = advanceBracketMatch(bracket, 'basketball-qf-4', 'home', 95, 82);  // Wolverines

    // Semifinal 1: Spartans defeat Cardinals
    bracket = advanceBracketMatch(bracket, 'basketball-sf-1', 'home', 98, 92);

    // Semifinal 2: Tigers defeat Wolverines
    bracket = advanceBracketMatch(bracket, 'basketball-sf-2', 'home', 89, 85);

    const finals = bracket.nodes.find(n => n.id === 'basketball-finals')!;
    const bronze = bracket.nodes.find(n => n.id === 'basketball-third-place')!;

    // Finals should be Spartans vs Tigers
    expect(finals.homeTeamName).toBe('Spartans');
    expect(finals.awayTeamName).toBe('Tigers');

    // Bronze game should be Cardinals vs Wolverines
    expect(bronze.homeTeamName).toBe('Cardinals');
    expect(bronze.awayTeamName).toBe('Wolverines');
  });

  it('awards Champion, Runner-Up (Silver), and 3rd Place (Bronze) when finals conclude', () => {
    let bracket = generateInitialBracket('volleyball');

    // Complete QFs
    bracket = advanceBracketMatch(bracket, 'volleyball-qf-1', 'home', 3, 0); // Phoenix VBC
    bracket = advanceBracketMatch(bracket, 'volleyball-qf-2', 'away', 1, 3); // Thunder Spikers
    bracket = advanceBracketMatch(bracket, 'volleyball-qf-3', 'home', 3, 1); // Apex Volleyball
    bracket = advanceBracketMatch(bracket, 'volleyball-qf-4', 'home', 3, 0); // Blaze VBC

    // Complete SFs
    bracket = advanceBracketMatch(bracket, 'volleyball-sf-1', 'home', 3, 2); // Phoenix VBC wins, Thunder Spikers loses
    bracket = advanceBracketMatch(bracket, 'volleyball-sf-2', 'away', 2, 3); // Blaze VBC wins, Apex Volleyball loses

    // Complete Bronze
    bracket = advanceBracketMatch(bracket, 'volleyball-third-place', 'home', 3, 1); // Thunder Spikers wins Bronze

    // Complete Finals
    bracket = advanceBracketMatch(bracket, 'volleyball-finals', 'home', 3, 2); // Phoenix VBC wins Gold

    expect(bracket.champion).toBe('Phoenix VBC');
    expect(bracket.runnerUp).toBe('Blaze VBC');
    expect(bracket.thirdPlace).toBe('Thunder Spikers');
  });

  it('synchronizes bracket with actual live match telemetry from database', () => {
    const bracket = generateInitialBracket('basketball');

    const liveMatch: Match = {
      id: 'm-live-qf-1',
      sport: 'basketball',
      title: 'Quarterfinal 1',
      division: "Men's D1",
      status: 'LIVE',
      court: 'Court 1 - Hardwood Arena',
      venue: 'Main Arena',
      homeTeam: { id: 'h1', name: 'Spartans', shortName: 'SPA', logoColor: '#0284c7', accentColor: '#38bdf8', record: '0-0', score: 48 },
      awayTeam: { id: 'a1', name: 'Titans', shortName: 'TIT', logoColor: '#f97316', accentColor: '#fb923c', record: '0-0', score: 42 },
    };

    const synced = synchronizeBracketWithMatches(bracket, [liveMatch]);
    const qf1 = synced.nodes.find(n => n.id === 'basketball-qf-1')!;

    expect(qf1.status).toBe('LIVE');
    expect(qf1.homeScore).toBe(48);
    expect(qf1.awayScore).toBe(42);
  });
});
