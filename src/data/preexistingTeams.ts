import { Player, Sport, Match } from '../types';

export interface PreexistingTeam {
  id: string;
  name: string;
  shortName: string;
  sport: Sport;
  seed: number;
  logoColor: string;
  accentColor: string;
  record?: string;
  logoUrl?: string; // Team logo image URL or base64 data URL
  players: Player[];
}

export const TEAMS_STORAGE_KEY = 'dunk_spike_custom_teams_v1';

export const VOLLEYBALL_PREEXISTING_TEAMS: PreexistingTeam[] = [
  {
    id: 'sur-preset',
    name: 'Pacific Surge',
    shortName: 'SUR',
    sport: 'volleyball',
    seed: 1,
    logoColor: '#0284c7',
    accentColor: '#38bdf8',
    record: '14-2',
    players: [
      { id: 'sur-p1', name: 'Elena Rostova', number: 7, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'sur-p2', name: 'Chloe Dubois', number: 3, position: 'Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'sur-p3', name: 'Sofia Hernandez', number: 12, position: 'Middle Blocker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'sur-p4', name: 'Aaliyah Washington', number: 10, position: 'Opposite Spiker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'sur-p5', name: 'Mia Chen', number: 5, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'sur-p6', name: 'Kira Novak', number: 1, position: 'Libero', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'sur-p7', name: 'Hannah Scott', number: 18, position: 'Defensive Specialist', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
      { id: 'sur-p8', name: 'Zoe Martinez', number: 22, position: 'Backup Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
    ],
  },
  {
    id: 'spk-preset',
    name: 'Peak Spikers',
    shortName: 'SPK',
    sport: 'volleyball',
    seed: 2,
    logoColor: '#f97316',
    accentColor: '#fb923c',
    record: '13-3',
    players: [
      { id: 'spk-p1', name: 'Maya Lindqvist', number: 14, position: 'Middle Blocker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'spk-p2', name: 'Tara Davis', number: 8, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'spk-p3', name: 'Ananya Sharma', number: 4, position: 'Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'spk-p4', name: 'Camila Rossi', number: 9, position: 'Opposite Spiker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'spk-p5', name: 'Elena Petrova', number: 16, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'spk-p6', name: 'Yuki Takahashi', number: 2, position: 'Libero', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'spk-p7', name: 'Brooke Collins', number: 11, position: 'Middle Blocker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
      { id: 'spk-p8', name: 'Lily Vance', number: 6, position: 'Defensive Specialist', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
    ],
  },
  {
    id: 'nca-preset',
    name: 'North Coast Aces',
    shortName: 'NCA',
    sport: 'volleyball',
    seed: 3,
    logoColor: '#0ea5e9',
    accentColor: '#38bdf8',
    record: '11-5',
    players: [
      { id: 'nca-p1', name: 'Jordan Taylor', number: 10, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'nca-p2', name: 'Samantha Bell', number: 15, position: 'Middle Blocker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'nca-p3', name: 'Clara Dupont', number: 7, position: 'Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'nca-p4', name: 'Morgan Hayes', number: 21, position: 'Opposite', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'nca-p5', name: 'Chloe Zhang', number: 4, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'nca-p6', name: 'Nina Petrova', number: 1, position: 'Libero', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'nca-p7', name: 'Rachel Kim', number: 18, position: 'Defensive Specialist', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
      { id: 'nca-p8', name: 'Vanessa Reed', number: 9, position: 'Backup Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
    ],
  },
  {
    id: 'cas-preset',
    name: 'Cascadia Storm',
    shortName: 'CAS',
    sport: 'volleyball',
    seed: 4,
    logoColor: '#f43f5e',
    accentColor: '#fb7185',
    record: '10-6',
    players: [
      { id: 'cas-p1', name: 'Scarlett Johansson', number: 11, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'cas-p2', name: 'Astrid Lindgren', number: 5, position: 'Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'cas-p3', name: 'Freja Larsen', number: 23, position: 'Middle Blocker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'cas-p4', name: 'Natasha Romanoff', number: 17, position: 'Opposite', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'cas-p5', name: 'Laura Croft', number: 8, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'cas-p6', name: 'Ingrid Bergman', number: 3, position: 'Libero', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'cas-p7', name: 'Emma Watson', number: 14, position: 'Defensive Specialist', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
      { id: 'cas-p8', name: 'Sienna Brooks', number: 19, position: 'Middle Blocker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
    ],
  },
  {
    id: 'vlk-preset',
    name: 'Valkyrie Spikers',
    shortName: 'VLK',
    sport: 'volleyball',
    seed: 5,
    logoColor: '#8b5cf6',
    accentColor: '#a78bfa',
    record: '9-7',
    players: [
      { id: 'vlk-p1', name: 'Valeria Ramos', number: 13, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'vlk-p2', name: 'Natasha Blake', number: 9, position: 'Middle Blocker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'vlk-p3', name: 'Harper Lee', number: 2, position: 'Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'vlk-p4', name: 'Camille Dupont', number: 15, position: 'Opposite', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'vlk-p5', name: 'Jessica Alba', number: 8, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'vlk-p6', name: 'Maya Lin', number: 6, position: 'Libero', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'vlk-p7', name: 'Diana Prince', number: 20, position: 'Defensive Specialist', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
      { id: 'vlk-p8', name: 'Raven Darkholme', number: 24, position: 'Backup Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
    ],
  },
  {
    id: 'ttn-preset',
    name: 'Titan Smashers',
    shortName: 'TTN',
    sport: 'volleyball',
    seed: 6,
    logoColor: '#10b981',
    accentColor: '#34d399',
    record: '8-8',
    players: [
      { id: 'ttn-p1', name: 'Hector Troy', number: 17, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'ttn-p2', name: 'Leonidas Sparta', number: 4, position: 'Middle Blocker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'ttn-p3', name: 'Achilles Thessaly', number: 10, position: 'Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'ttn-p4', name: 'Ajax Salamis', number: 22, position: 'Opposite', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'ttn-p5', name: 'Perseus Argos', number: 8, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'ttn-p6', name: 'Odysseas Ithaca', number: 1, position: 'Libero', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: 'ttn-p7', name: 'Castor Lacon', number: 14, position: 'Defensive Specialist', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
      { id: 'ttn-p8', name: 'Pollux Amyclae', number: 25, position: 'Backup Middle', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
    ],
  },
];

export const BASKETBALL_PREEXISTING_TEAMS: PreexistingTeam[] = [
  {
    id: 'apx-preset',
    name: 'Apex Thunder',
    shortName: 'APX',
    sport: 'basketball',
    seed: 1,
    logoColor: '#f97316',
    accentColor: '#fb923c',
    record: '18-2',
    players: [
      { id: 'apx-p1', name: 'Marcus Vance', number: 23, position: 'Shooting Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'apx-p2', name: 'Jaxon Hayes', number: 11, position: 'Power Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'apx-p3', name: 'Cole Henderson', number: 5, position: 'Point Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'apx-p4', name: 'Malik Turner', number: 34, position: 'Small Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'apx-p5', name: 'Trevor Campbell', number: 55, position: 'Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'apx-p6', name: 'Devon Wright', number: 15, position: 'Sixth Man', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
      { id: 'apx-p7', name: 'Jordan Hayes', number: 2, position: 'Backup Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
      { id: 'apx-p8', name: 'Dominic Reed', number: 44, position: 'Backup Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
    ],
  },
  {
    id: 'cst-preset',
    name: 'Coastal Spartans',
    shortName: 'CST',
    sport: 'basketball',
    seed: 2,
    logoColor: '#0284c7',
    accentColor: '#38bdf8',
    record: '16-4',
    players: [
      { id: 'cst-p1', name: 'Devon Sterling', number: 11, position: 'Point Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'cst-p2', name: 'Zion Brooks', number: 24, position: 'Shooting Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'cst-p3', name: 'Andre Miller', number: 33, position: 'Small Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'cst-p4', name: 'Dominic Reed', number: 42, position: 'Power Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'cst-p5', name: 'Kareem Vance', number: 15, position: 'Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'cst-p6', name: 'Tariq Johnson', number: 8, position: 'Sixth Man', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
      { id: 'cst-p7', name: 'Mason Clark', number: 3, position: 'Backup Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
      { id: 'cst-p8', name: 'Isaac Newton', number: 50, position: 'Backup Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
    ],
  },
  {
    id: 'ich-preset',
    name: 'Iron City Hawks',
    shortName: 'ICH',
    sport: 'basketball',
    seed: 3,
    logoColor: '#e11d48',
    accentColor: '#f43f5e',
    record: '14-6',
    players: [
      { id: 'ich-p1', name: 'Damian Lillard', number: 3, position: 'Point Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'ich-p2', name: 'Ja Morant', number: 12, position: 'Shooting Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'ich-p3', name: 'Jimmy Butler', number: 22, position: 'Small Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'ich-p4', name: 'Jayson Tatum', number: 0, position: 'Power Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'ich-p5', name: 'Bam Adebayo', number: 13, position: 'Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'ich-p6', name: 'Jaylen Brown', number: 7, position: 'Sixth Man', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
      { id: 'ich-p7', name: 'Tyler Herro', number: 14, position: 'Backup Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
      { id: 'ich-p8', name: 'Al Horford', number: 42, position: 'Backup Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
    ],
  },
  {
    id: 'mwc-preset',
    name: 'Metro Wildcats',
    shortName: 'MWC',
    sport: 'basketball',
    seed: 4,
    logoColor: '#8b5cf6',
    accentColor: '#a78bfa',
    record: '13-7',
    players: [
      { id: 'mwc-p1', name: 'Stephen Curry', number: 30, position: 'Point Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'mwc-p2', name: 'Klay Thompson', number: 11, position: 'Shooting Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'mwc-p3', name: 'Andrew Wiggins', number: 22, position: 'Small Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'mwc-p4', name: 'Draymond Green', number: 23, position: 'Power Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'mwc-p5', name: 'Kevon Looney', number: 5, position: 'Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'mwc-p6', name: 'Jonathan Kuminga', number: 0, position: 'Sixth Man', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
      { id: 'mwc-p7', name: 'Jordan Poole', number: 3, position: 'Backup Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
      { id: 'mwc-p8', name: 'Moses Moody', number: 32, position: 'Backup Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
    ],
  },
  {
    id: 'vgd-preset',
    name: 'Vanguard Lions',
    shortName: 'VGD',
    sport: 'basketball',
    seed: 5,
    logoColor: '#10b981',
    accentColor: '#34d399',
    record: '11-9',
    players: [
      { id: 'vgd-p1', name: 'Chris Paul', number: 3, position: 'Point Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'vgd-p2', name: 'Devin Booker', number: 1, position: 'Shooting Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'vgd-p3', name: 'Mikal Bridges', number: 25, position: 'Small Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'vgd-p4', name: 'Kevin Durant', number: 7, position: 'Power Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'vgd-p5', name: 'Deandre Ayton', number: 22, position: 'Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'vgd-p6', name: 'Cameron Payne', number: 15, position: 'Sixth Man', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
      { id: 'vgd-p7', name: 'Torrey Craig', number: 8, position: 'Backup Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
      { id: 'vgd-p8', name: 'Jock Landale', number: 11, position: 'Backup Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
    ],
  },
  {
    id: 'blz-preset',
    name: 'Empire Blaze',
    shortName: 'BLZ',
    sport: 'basketball',
    seed: 6,
    logoColor: '#eab308',
    accentColor: '#facc15',
    record: '10-10',
    players: [
      { id: 'blz-p1', name: 'Luka Doncic', number: 77, position: 'Point Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'blz-p2', name: 'Kyrie Irving', number: 11, position: 'Shooting Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'blz-p3', name: 'Tim Hardaway Jr', number: 10, position: 'Small Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'blz-p4', name: 'PJ Washington', number: 25, position: 'Power Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'blz-p5', name: 'Daniel Gafford', number: 21, position: 'Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: 'blz-p6', name: 'Dereck Lively', number: 2, position: 'Sixth Man', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
      { id: 'blz-p7', name: 'Josh Green', number: 8, position: 'Backup Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
      { id: 'blz-p8', name: 'Maxi Kleber', number: 42, position: 'Backup Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
    ],
  },
];

export function getAllDefaultTeams(): PreexistingTeam[] {
  return [...VOLLEYBALL_PREEXISTING_TEAMS, ...BASKETBALL_PREEXISTING_TEAMS];
}

/**
 * Normalizes players so that squad does not exceed 8, and on-court players
 * do not exceed sport limits: 5 for basketball, 6 for volleyball.
 * All excess players are placed on the bench (isOnCourt: false).
 */
export function normalizeTeamPlayers(players: Player[] = [], sport: Sport): Player[] {
  const maxCourt = sport === 'volleyball' ? 6 : 5;
  let courtCount = 0;
  return players.slice(0, 8).map((p, idx) => {
    let onCourt = p.isOnCourt !== undefined ? p.isOnCourt : idx < maxCourt;
    if (onCourt) {
      if (courtCount < maxCourt) {
        courtCount++;
      } else {
        onCourt = false;
      }
    }
    return {
      ...p,
      isOnCourt: onCourt,
      isStarter: p.isStarter !== undefined ? p.isStarter : onCourt,
    };
  });
}

export function getStoredTeams(): PreexistingTeam[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(TEAMS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t: PreexistingTeam) => ({
            ...t,
            players: normalizeTeamPlayers(t.players, t.sport),
          }));
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse stored teams from localStorage', e);
  }
  return getAllDefaultTeams();
}

export function saveStoredTeams(teams: PreexistingTeam[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    }
  } catch (e) {
    console.error('Failed to save teams to localStorage', e);
  }
}

/**
 * Returns available pre-existing teams for a sport, combining stored/edited presets
 * and any teams dynamically discovered from existing matches.
 */
export function getPreexistingTeams(sport: Sport, matches?: Match[]): PreexistingTeam[] {
  const allStored = getStoredTeams();
  const sportTeams = allStored.filter(t => t.sport === sport);

  const baseTeams = sportTeams.length > 0 
    ? sportTeams 
    : (sport === 'volleyball' ? VOLLEYBALL_PREEXISTING_TEAMS : BASKETBALL_PREEXISTING_TEAMS);

  if (!matches || matches.length === 0) {
    return baseTeams;
  }

  const customTeams: PreexistingTeam[] = [];
  const seenNames = new Set(baseTeams.map(t => t.name.toLowerCase()));

  for (const match of matches) {
    if (match.sport !== sport) continue;

    for (const team of [match.homeTeam, match.awayTeam]) {
      if (!team || !team.name) continue;
      const lower = team.name.toLowerCase();
      if (seenNames.has(lower)) continue;
      seenNames.add(lower);

      const rawPlayers = team.players || [];
      const formattedPlayers = normalizeTeamPlayers(rawPlayers, sport);

      customTeams.push({
        id: team.id || `preset-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: team.name,
        shortName: team.shortName || team.name.substring(0, 3).toUpperCase(),
        sport,
        seed: team.seed || (baseTeams.length + customTeams.length + 1),
        logoColor: team.logoColor || '#0284c7',
        accentColor: team.accentColor || '#38bdf8',
        record: team.record || '0-0',
        logoUrl: team.logoUrl,
        players: formattedPlayers,
      });
    }
  }
  return [...baseTeams, ...customTeams];
}
