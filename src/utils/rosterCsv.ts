import { Player, Sport } from '../types';
import { MAX_TEAM_ROSTER_LIMIT, getMaxOnCourtPlayers } from '../components/CreateMatchModal';
import { normalizeTeamPlayers } from '../data/preexistingTeams';

export interface RosterCsvParseResult {
  players: Player[];
  errors: string[];
  warnings: string[];
  validCount: number;
}

/**
 * Generates an empty / sample CSV template for coaches and directors
 */
export function generateRosterCsvTemplate(sport: Sport): string {
  const headers = 'Name,Number,Position,Starter';
  const examples = sport === 'volleyball'
    ? [
        'Elena Rostova,7,Outside Hitter,true',
        'Chloe Dubois,3,Setter,true',
        'Sofia Hernandez,12,Middle Blocker,true',
        'Aaliyah Washington,10,Opposite Spiker,true',
        'Mia Chen,5,Outside Hitter,true',
        'Kira Novak,1,Libero,true',
        'Hannah Scott,18,Defensive Specialist,false',
        'Zoe Martinez,22,Backup Setter,false',
      ]
    : [
        'Marcus Vance,23,Shooting Guard,true',
        'Jaxon Hayes,11,Power Forward,true',
        'Cole Henderson,5,Point Guard,true',
        'Malik Turner,34,Small Forward,true',
        'Trevor Campbell,55,Center,true',
        'Devon Wright,15,Sixth Man,false',
        'Jordan Hayes,2,Backup Guard,false',
        'Dominic Reed,44,Backup Forward,false',
      ];

  return [headers, ...examples].join('\n');
}

/**
 * Exports an existing team player roster to CSV text
 */
export function exportRosterToCsv(players: Player[]): string {
  const header = 'Name,Number,Position,Starter,Points';
  const rows = players.map(p => {
    // Escape quotes and commas in name
    const escapedName = p.name.includes(',') || p.name.includes('"')
      ? `"${p.name.replace(/"/g, '""')}"`
      : p.name;
    const starterStr = p.isStarter ? 'true' : 'false';
    return `${escapedName},${p.number},${p.position},${starterStr},${p.points || 0}`;
  });
  return [header, ...rows].join('\n');
}

/**
 * Triggers a browser download of CSV or JSON data
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;'): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Robust CSV line splitter that respects quoted strings containing delimiters
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses CSV roster string and produces sanitized Player objects
 */
export function parseRosterCsv(csvText: string, sport: Sport): RosterCsvParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rawPlayers: Player[] = [];

  if (!csvText || !csvText.trim()) {
    return { players: [], errors: ['CSV content is empty.'], warnings: [], validCount: 0 };
  }

  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
  if (lines.length === 0) {
    return { players: [], errors: ['No data rows found in CSV.'], warnings: [], validCount: 0 };
  }

  // Detect delimiter: comma, semicolon, tab
  const firstLine = lines[0];
  let delimiter = ',';
  if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = ';';
  } else if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = '\t';
  }

  // Check if first line is a header
  const headerCols = splitCsvLine(firstLine.toLowerCase(), delimiter);
  const isHeaderRow = headerCols.some(col => 
    ['name', 'player', 'number', 'jersey', '#', 'pos', 'position', 'starter'].includes(col)
  );

  const dataRows = isHeaderRow ? lines.slice(1) : lines;

  if (dataRows.length === 0) {
    return { players: [], errors: ['CSV contains only a header row, no athletes provided.'], warnings: [], validCount: 0 };
  }

  // Determine column positions if header exists
  let nameIdx = 0;
  let numberIdx = 1;
  let posIdx = 2;
  let starterIdx = 3;

  if (isHeaderRow) {
    headerCols.forEach((col, idx) => {
      if (col.includes('name') || col.includes('player')) nameIdx = idx;
      else if (col.includes('number') || col.includes('jersey') || col === '#') numberIdx = idx;
      else if (col.includes('pos')) posIdx = idx;
      else if (col.includes('start')) starterIdx = idx;
    });
  }

  const seenNumbers = new Set<number>();
  const defaultPos = sport === 'volleyball' ? 'Outside Hitter' : 'Guard';
  const timestamp = Date.now();

  for (let i = 0; i < dataRows.length; i++) {
    const rowNum = isHeaderRow ? i + 2 : i + 1;
    const row = dataRows[i];
    const cols = splitCsvLine(row, delimiter);

    const nameRaw = cols[nameIdx] !== undefined ? cols[nameIdx] : '';
    const numberRaw = cols[numberIdx] !== undefined ? cols[numberIdx] : '';
    const posRaw = cols[posIdx] !== undefined ? cols[posIdx] : '';
    const starterRaw = cols[starterIdx] !== undefined ? cols[starterIdx] : '';

    if (!nameRaw) {
      errors.push(`Row ${rowNum}: Athlete Name is missing.`);
      continue;
    }

    // Number validation
    let jerseyNumber = parseInt(numberRaw, 10);
    if (isNaN(jerseyNumber) || jerseyNumber < 0 || jerseyNumber > 99) {
      warnings.push(`Row ${rowNum} ("${nameRaw}"): Invalid jersey number "${numberRaw}". Defaulted to ${rawPlayers.length + 1}.`);
      jerseyNumber = rawPlayers.length + 1;
    }

    if (seenNumbers.has(jerseyNumber)) {
      warnings.push(`Row ${rowNum} ("${nameRaw}"): Jersey #${jerseyNumber} is already taken on this roster.`);
    }
    seenNumbers.add(jerseyNumber);

    // Starter boolean determination
    const sLower = starterRaw.toLowerCase();
    const isStarter = ['true', 'yes', '1', 'starter', 'start', 'y'].includes(sLower);

    const player: Player = {
      id: `p-csv-${timestamp}-${i + 1}`,
      name: nameRaw,
      number: jerseyNumber,
      position: posRaw.trim() || defaultPos,
      points: 0,
      isStarter,
      isOnCourt: isStarter,
    };

    if (sport === 'volleyball') {
      player.kills = 0;
      player.aces = 0;
      player.blocks = 0;
      player.digs = 0;
    } else {
      player.twoPointers = 0;
      player.threePointers = 0;
      player.freeThrows = 0;
      player.fouls = 0;
    }

    rawPlayers.push(player);
  }

  if (rawPlayers.length > MAX_TEAM_ROSTER_LIMIT) {
    warnings.push(
      `Roster exceeded tournament maximum of ${MAX_TEAM_ROSTER_LIMIT} athletes (${rawPlayers.length} provided). Squad was capped at the first ${MAX_TEAM_ROSTER_LIMIT} players.`
    );
  }

  // Normalize court limits and starter count using official court regulations
  const normalized = normalizeTeamPlayers(rawPlayers.slice(0, MAX_TEAM_ROSTER_LIMIT), sport);

  return {
    players: normalized,
    errors,
    warnings,
    validCount: normalized.length,
  };
}
