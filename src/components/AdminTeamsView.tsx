import React, { useState, useMemo, useEffect } from 'react';
import { Sport, Player, Match, Team } from '../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  Zap, 
  Flame, 
  Search, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRightLeft, 
  Trophy, 
  Shirt, 
  Lock, 
  X,
  ExternalLink,
  Camera,
  Upload,
  Image as ImageIcon,
  Download,
  FileText,
  Database,
  UploadCloud,
  FileUp,
  FileDown
} from 'lucide-react';
import { 
  PreexistingTeam, 
  getStoredTeams, 
  saveStoredTeams, 
  getAllDefaultTeams, 
  normalizeTeamPlayers
} from '../data/preexistingTeams';
import { MAX_TEAM_ROSTER_LIMIT, getMaxOnCourtPlayers } from './CreateMatchModal';
import { 
  parseRosterCsv, 
  exportRosterToCsv, 
  generateRosterCsvTemplate, 
  downloadFile, 
  RosterCsvParseResult 
} from '../utils/rosterCsv';
import { realtimeDB } from '../services/realtimeDatabase';

interface AdminTeamsViewProps {
  isAdminLoggedIn: boolean;
  onOpenLogin: () => void;
  matches: Match[];
  onUpdateTeamInMatches: (savedTeam: Team, sport: Sport) => void;
  onRegisterTeam?: (savedTeam: Team, sport: Sport) => void;
  currentSport: Sport;
  onNavigateToScorer?: () => void;
  onNavigateToSchedule?: () => void;
}

const COLOR_PRESETS = [
  { label: 'Orange', hex: '#f97316', accent: '#fb923c' },
  { label: 'Sky Blue', hex: '#0284c7', accent: '#38bdf8' },
  { label: 'Crimson', hex: '#e11d48', accent: '#f43f5e' },
  { label: 'Purple', hex: '#8b5cf6', accent: '#a78bfa' },
  { label: 'Emerald', hex: '#10b981', accent: '#34d399' },
  { label: 'Gold', hex: '#eab308', accent: '#facc15' },
];

export const AdminTeamsView: React.FC<AdminTeamsViewProps> = ({
  isAdminLoggedIn,
  onOpenLogin,
  matches,
  onUpdateTeamInMatches,
  onRegisterTeam,
  currentSport,
  onNavigateToScorer,
  onNavigateToSchedule,
}) => {
  // Stored teams state
  const [teams, setTeams] = useState<PreexistingTeam[]>(() => getStoredTeams());
  const [selectedSportFilter, setSelectedSportFilter] = useState<'all' | Sport>(currentSport);
  const [searchQuery, setSearchQuery] = useState('');

  // Keep teams synchronized with storage and external updates
  useEffect(() => {
    const syncTeams = () => {
      setTeams(getStoredTeams());
    };
    window.addEventListener('storage', syncTeams);
    return () => window.removeEventListener('storage', syncTeams);
  }, []);

  // Editing state
  const [editingTeam, setEditingTeam] = useState<PreexistingTeam | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states for the modal/drawer
  const [formName, setFormName] = useState('');
  const [formShort, setFormShort] = useState('');
  const [formSport, setFormSport] = useState<Sport>(currentSport);
  const [formSeed, setFormSeed] = useState<number>(1);
  const [formRecord, setFormRecord] = useState('0-0');
  const [formColor, setFormColor] = useState(COLOR_PRESETS[1]);
  const [formPlayers, setFormPlayers] = useState<Player[]>([]);
  const [formLogoUrl, setFormLogoUrl] = useState<string>('');

  // Add player inputs
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState<string>('7');
  const [newPlayerPos, setNewPlayerPos] = useState('Outside Hitter');
  const [newPlayerPhotoUrl, setNewPlayerPhotoUrl] = useState<string>('');

  // Success / notification message
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // CSV Modal state
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [csvParseResult, setCsvParseResult] = useState<RosterCsvParseResult | null>(null);

  // Database Backup & Restore state
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreFileSummary, setRestoreFileSummary] = useState<{
    matchCount: number;
    sponsorCount: number;
    teamCount: number;
    snapshot: any;
  } | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // CSV Import & Export Handlers
  const handleOpenCsvImport = () => {
    setCsvRawText('');
    setCsvParseResult(null);
    setIsCsvModalOpen(true);
  };

  const handleCsvTextChange = (text: string) => {
    setCsvRawText(text);
    if (text.trim()) {
      const result = parseRosterCsv(text, formSport);
      setCsvParseResult(result);
    } else {
      setCsvParseResult(null);
    }
  };

  const handleCsvFileUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setCsvRawText(content);
        const result = parseRosterCsv(content, formSport);
        setCsvParseResult(result);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyCsvRoster = () => {
    if (!csvParseResult || csvParseResult.players.length === 0) return;
    setFormPlayers(csvParseResult.players);
    setIsCsvModalOpen(false);
    showNotification(`Successfully imported ${csvParseResult.players.length} athletes into roster from CSV!`);
  };

  const handleExportRosterCsv = () => {
    if (formPlayers.length === 0) {
      alert('Roster is empty. Add athletes before exporting.');
      return;
    }
    const csvContent = exportRosterToCsv(formPlayers);
    const cleanName = (formName.trim() || 'team').toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadFile(csvContent, `${cleanName}_roster.csv`);
    showNotification(`Exported roster for "${formName || 'Team'}" to CSV.`);
  };

  const handleDownloadTemplate = () => {
    const template = generateRosterCsvTemplate(formSport);
    downloadFile(template, `roster_template_${formSport}.csv`);
  };

  // Database Backup & Restore Handlers
  const handleExportDatabaseBackup = async () => {
    try {
      const snapshot = await realtimeDB.exportSnapshot();
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      downloadFile(JSON.stringify(snapshot, null, 2), `dunk_and_spike_backup_${ts}.json`, 'application/json');
      showNotification('Tournament database backup exported and downloaded successfully!');
    } catch (e: any) {
      alert('Failed to export backup: ' + (e.message || String(e)));
    }
  };

  const handleBackupFileSelect = (file?: File) => {
    if (!file) return;
    setRestoreError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('File does not contain a valid JSON object.');
        }
        if (!Array.isArray(parsed.matches) && !Array.isArray(parsed.sponsors)) {
          throw new Error('File does not appear to be a valid Dunk & Spike tournament database snapshot.');
        }
        setRestoreFileSummary({
          matchCount: Array.isArray(parsed.matches) ? parsed.matches.length : 0,
          sponsorCount: Array.isArray(parsed.sponsors) ? parsed.sponsors.length : 0,
          teamCount: Array.isArray(parsed.teams) ? parsed.teams.length : 0,
          snapshot: parsed,
        });
      } catch (err: any) {
        setRestoreError(err.message || 'Invalid JSON file');
        setRestoreFileSummary(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restoreFileSummary?.snapshot) return;
    setIsRestoring(true);
    try {
      await realtimeDB.restoreSnapshot(restoreFileSummary.snapshot);
      setTeams(getStoredTeams());
      setIsRestoreModalOpen(false);
      setRestoreFileSummary(null);
      showNotification('Tournament database successfully restored from snapshot backup!');
    } catch (e: any) {
      alert('Failed to restore database: ' + (e.message || String(e)));
    } finally {
      setIsRestoring(false);
    }
  };

  // Image Upload helper using FileReader
  const handleImageFileUpload = (file: File | undefined, callback: (dataUrl: string) => void) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit. Please select a smaller photo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        callback(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Player photo upload handler
  const handlePlayerPhotoUpload = (playerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleImageFileUpload(file, (dataUrl) => {
      setFormPlayers(prev => prev.map(p => p.id === playerId ? { ...p, photoUrl: dataUrl } : p));
    });
  };

  // Handle switching sport in form: auto-adjust players to conform to sport court caps
  const handleSportChangeInForm = (newSport: Sport) => {
    setFormSport(newSport);
    setNewPlayerPos(newSport === 'volleyball' ? 'Outside Hitter' : 'Guard');
    setFormPlayers(prev => normalizeTeamPlayers(prev, newSport));
  };

  // Filtered teams list
  const filteredTeams = useMemo(() => {
    return teams.filter(t => {
      const matchesSport = selectedSportFilter === 'all' || t.sport === selectedSportFilter;
      if (!matchesSport) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const nameMatch = t.name.toLowerCase().includes(q);
      const shortMatch = t.shortName.toLowerCase().includes(q);
      const playerMatch = t.players?.some(p => p.name.toLowerCase().includes(q));
      return nameMatch || shortMatch || playerMatch;
    });
  }, [teams, selectedSportFilter, searchQuery]);

  // Telemetry counts
  const totalTeams = teams.length;
  const vbCount = teams.filter(t => t.sport === 'volleyball').length;
  const bbCount = teams.filter(t => t.sport === 'basketball').length;
  const totalAthletes = teams.reduce((acc, t) => acc + (t.players?.length || 0), 0);

  // Open editor for existing team
  const handleOpenEdit = (team: PreexistingTeam) => {
    setEditingTeam(team);
    setIsCreatingNew(false);
    setFormName(team.name);
    setFormShort(team.shortName);
    setFormSport(team.sport);
    setFormSeed(team.seed || 1);
    setFormRecord(team.record || '0-0');
    setFormLogoUrl(team.logoUrl || '');
    setFormColor(
      COLOR_PRESETS.find(c => c.hex.toLowerCase() === team.logoColor.toLowerCase()) || {
        label: 'Custom',
        hex: team.logoColor,
        accent: team.accentColor || team.logoColor,
      }
    );
    setFormPlayers(team.players ? [...team.players] : []);
    setNewPlayerName('');
    setNewPlayerNumber(String((team.players?.length || 0) + 1));
    setNewPlayerPos(team.sport === 'volleyball' ? 'Outside Hitter' : 'Guard');
    setNewPlayerPhotoUrl('');
  };

  // Open editor for creating new team
  const handleOpenCreateNew = () => {
    setEditingTeam(null);
    setIsCreatingNew(true);
    const targetSport = selectedSportFilter === 'all' ? currentSport : selectedSportFilter;
    setFormName('');
    setFormShort('');
    setFormSport(targetSport);
    setFormSeed(teams.filter(t => t.sport === targetSport).length + 1);
    setFormRecord('0-0');
    setFormLogoUrl('');
    setNewPlayerPhotoUrl('');
    setFormColor(COLOR_PRESETS[0]);

    // Initial 8 squad template
    const ts = Date.now();
    const samplePlayers: Player[] = targetSport === 'volleyball'
      ? [
          { id: `p-${ts}-1`, name: 'Elena Rostova', number: 7, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${ts}-2`, name: 'Chloe Dubois', number: 3, position: 'Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${ts}-3`, name: 'Sofia Hernandez', number: 12, position: 'Middle Blocker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${ts}-4`, name: 'Aaliyah Washington', number: 10, position: 'Opposite Spiker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${ts}-5`, name: 'Mia Chen', number: 5, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${ts}-6`, name: 'Kira Novak', number: 1, position: 'Libero', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${ts}-7`, name: 'Hannah Scott', number: 18, position: 'Defensive Specialist', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
          { id: `p-${ts}-8`, name: 'Zoe Martinez', number: 22, position: 'Backup Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
        ]
      : [
          { id: `p-${ts}-1`, name: 'Marcus Vance', number: 23, position: 'Shooting Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${ts}-2`, name: 'Jaxon Hayes', number: 11, position: 'Power Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${ts}-3`, name: 'Cole Henderson', number: 5, position: 'Point Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${ts}-4`, name: 'Malik Turner', number: 34, position: 'Small Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${ts}-5`, name: 'Trevor Campbell', number: 55, position: 'Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${ts}-6`, name: 'Devon Wright', number: 15, position: 'Sixth Man', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
          { id: `p-${ts}-7`, name: 'Jordan Hayes', number: 2, position: 'Backup Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
          { id: `p-${ts}-8`, name: 'Dominic Reed', number: 44, position: 'Backup Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
        ];
    setFormPlayers(samplePlayers);
    setNewPlayerName('');
    setNewPlayerNumber('99');
    setNewPlayerPos(targetSport === 'volleyball' ? 'Outside Hitter' : 'Guard');
  };

  // Close editor
  const handleCloseEditor = () => {
    setEditingTeam(null);
    setIsCreatingNew(false);
  };

  // Populate 8-player squad for the form (6 for volleyball, 5 for basketball)
  const handlePopulateFormSquad = () => {
    const isVb = formSport === 'volleyball';
    const sample: Player[] = isVb
      ? [
          { id: `p-${Date.now()}-1`, name: 'Elena Rostova', number: 7, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-2`, name: 'Chloe Dubois', number: 14, position: 'Middle Blocker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-3`, name: 'Sofia Hernandez', number: 3, position: 'Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-4`, name: 'Mia Chen', number: 10, position: 'Opposite', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-5`, name: 'Kira Novak', number: 1, position: 'Libero', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-6`, name: 'Aaliyah Washington', number: 12, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-7`, name: 'Hannah Scott', number: 18, position: 'Defensive Specialist', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
          { id: `p-${Date.now()}-8`, name: 'Zoe Martinez', number: 22, position: 'Backup Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
        ]
      : [
          { id: `p-${Date.now()}-1`, name: 'Marcus Vance', number: 23, position: 'Shooting Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-2`, name: 'Jaxon Hayes', number: 11, position: 'Power Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-3`, name: 'Cole Henderson', number: 5, position: 'Point Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-4`, name: 'Malik Turner', number: 34, position: 'Small Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-5`, name: 'Trevor Campbell', number: 55, position: 'Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
          { id: `p-${Date.now()}-6`, name: 'Devon Wright', number: 15, position: 'Sixth Man', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
          { id: `p-${Date.now()}-7`, name: 'Jordan Hayes', number: 2, position: 'Backup Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
          { id: `p-${Date.now()}-8`, name: 'Dominic Reed', number: 44, position: 'Backup Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
        ];
    setFormPlayers(sample);
  };

  // Toggle player Court vs Bench status (strictly enforcing sport on-court cap: 5 for basketball, 6 for volleyball)
  const handleTogglePlayerCourtStatus = (playerId: string) => {
    const target = formPlayers.find(p => p.id === playerId);
    if (!target) return;

    const formMaxOnCourt = getMaxOnCourtPlayers(formSport);
    const currentlyOnCourt = target.isOnCourt !== false;
    if (currentlyOnCourt) {
      // Move to bench
      setFormPlayers(prev => prev.map(p => p.id === playerId ? { ...p, isOnCourt: false, isStarter: false } : p));
    } else {
      // Move to court: check on-court cap
      const activeOnCourt = formPlayers.filter(p => p.isOnCourt !== false).length;
      if (activeOnCourt >= formMaxOnCourt) {
        alert(`Regulation Limit: Only ${formMaxOnCourt} players are allowed on court at the same time in ${formSport}. Bench an active court player before moving ${target.name} onto the court.`);
        return;
      }
      setFormPlayers(prev => prev.map(p => p.id === playerId ? { ...p, isOnCourt: true, isStarter: true } : p));
    }
  };

  // Add player to form roster (strictly enforcing squad limit of 8)
  const handleAddPlayerToForm = () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;

    if (formPlayers.length >= MAX_TEAM_ROSTER_LIMIT) {
      alert(`Limit reached: Maximum ${MAX_TEAM_ROSTER_LIMIT} players allowed per squad.`);
      return;
    }

    const formMaxOnCourt = getMaxOnCourtPlayers(formSport);
    const parsedNum = parseInt(newPlayerNumber, 10);
    const validNum = !isNaN(parsedNum) ? Math.max(0, Math.min(99, parsedNum)) : formPlayers.length + 1;

    const currentOnCourt = formPlayers.filter(p => p.isOnCourt !== false).length;
    const shouldBeOnCourt = currentOnCourt < formMaxOnCourt;

    const newP: Player = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      number: validNum,
      position: newPlayerPos || (formSport === 'volleyball' ? 'Outside Hitter' : 'Guard'),
      points: 0,
      kills: 0,
      aces: 0,
      blocks: 0,
      twoPointers: 0,
      threePointers: 0,
      freeThrows: 0,
      isOnCourt: shouldBeOnCourt,
      isStarter: shouldBeOnCourt,
      photoUrl: newPlayerPhotoUrl.trim() || undefined,
    };

    setFormPlayers(prev => [...prev, newP]);
    setNewPlayerName('');
    setNewPlayerPhotoUrl('');
    const nextJersey = (validNum + 1) % 100;
    setNewPlayerNumber(String(nextJersey));
  };

  // Update inline player
  const handleUpdateInlinePlayer = (playerId: string, field: 'name' | 'number' | 'position' | 'photoUrl', val: string | number) => {
    setFormPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      if (field === 'name') return { ...p, name: String(val) };
      if (field === 'position') return { ...p, position: String(val) };
      if (field === 'photoUrl') return { ...p, photoUrl: String(val).trim() || undefined };
      const num = typeof val === 'number' ? val : parseInt(String(val), 10);
      return { ...p, number: isNaN(num) ? 0 : Math.max(0, Math.min(99, num)) };
    }));
  };

  // Remove player from form
  const handleRemoveFormPlayer = (playerId: string) => {
    setFormPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  // Save changes to team
  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Team Name is required.');
      return;
    }

    if (formPlayers.length === 0) {
      alert('Please add at least 1 player to the team roster.');
      return;
    }

    if (formPlayers.length > MAX_TEAM_ROSTER_LIMIT) {
      alert(`Regulation violation: Squad cannot exceed ${MAX_TEAM_ROSTER_LIMIT} players.`);
      return;
    }

    const formMaxOnCourt = getMaxOnCourtPlayers(formSport);
    const normalizedPlayers = normalizeTeamPlayers(formPlayers, formSport);

    const cleanShort = (formShort.trim() || formName.slice(0, 3)).toUpperCase();
    const teamId = editingTeam?.id || `team-custom-${Date.now()}`;

    const updatedTeam: PreexistingTeam = {
      id: teamId,
      name: formName.trim(),
      shortName: cleanShort,
      sport: formSport,
      seed: formSeed,
      logoColor: formColor.hex,
      accentColor: formColor.accent,
      record: formRecord.trim() || '0-0',
      logoUrl: formLogoUrl.trim() || undefined,
      players: normalizedPlayers,
    };

    let updatedList: PreexistingTeam[];
    if (isCreatingNew) {
      updatedList = [updatedTeam, ...teams];
      if (selectedSportFilter !== 'all' && selectedSportFilter !== updatedTeam.sport) {
        setSelectedSportFilter(updatedTeam.sport);
      }
    } else {
      updatedList = teams.map(t => t.id === teamId ? updatedTeam : t);
    }

    setTeams(updatedList);
    saveStoredTeams(updatedList);
    window.dispatchEvent(new Event('storage'));

    // Propagate changes to any active match featuring this team
    const matchTeamFormat: Team = {
      id: updatedTeam.id,
      name: updatedTeam.name,
      shortName: updatedTeam.shortName,
      seed: updatedTeam.seed,
      logoColor: updatedTeam.logoColor,
      accentColor: updatedTeam.accentColor,
      record: updatedTeam.record || '0-0',
      score: 0,
      logoUrl: updatedTeam.logoUrl,
      players: updatedTeam.players,
    };
    if (isCreatingNew && onRegisterTeam) {
      onRegisterTeam(matchTeamFormat, updatedTeam.sport);
    } else {
      onUpdateTeamInMatches(matchTeamFormat, updatedTeam.sport);
    }

    showNotification(isCreatingNew 
      ? `Team "${updatedTeam.name}" registered successfully and added to tournament registry!`
      : `Team "${updatedTeam.name}" updated successfully and synchronized across matches!`
    );
    handleCloseEditor();
  };

  // Delete team
  const handleDeleteTeam = (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the team "${teamName}" from the roster registry?`)) {
      return;
    }

    const updated = teams.filter(t => t.id !== teamId);
    setTeams(updated);
    saveStoredTeams(updated);
    window.dispatchEvent(new Event('storage'));
    showNotification(`Team "${teamName}" removed from tournament registry.`);
  };

  // Reset to default presets
  const handleResetToDefaults = () => {
    if (!confirm('Reset all teams back to the official championship default presets? Any custom modifications will be replaced.')) {
      return;
    }

    const defaults = getAllDefaultTeams();
    setTeams(defaults);
    saveStoredTeams(defaults);
    window.dispatchEvent(new Event('storage'));
    showNotification('Restored all championship team presets to defaults.');
  };

  const handleRegisterClick = () => {
    handleOpenCreateNew();
  };

  const handleEditClick = (team: PreexistingTeam) => {
    handleOpenEdit(team);
  };

  const onCourtPlayers = formPlayers.filter(p => p.isOnCourt !== false);
  const benchPlayers = formPlayers.filter(p => p.isOnCourt === false);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-[#0b0e14]/95 border border-emerald-500/40 text-emerald-300 rounded-2xl backdrop-blur-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
          {onNavigateToScorer && (
            <button
              type="button"
              onClick={onNavigateToScorer}
              className="ml-2 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-black text-[10px] uppercase tracking-wider transition-colors shrink-0 shadow"
            >
              Open in Scorer &rarr;
            </button>
          )}
        </div>
      )}

      {/* Official Registry Notice Banner */}
      {!isAdminLoggedIn && (
        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-cyan-200 text-xs shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Tournament Roster Console:</strong> Register new teams, customize athlete rosters, logos, and kit presets. Log in to authenticate official scoring console privileges.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-heading font-black text-xs uppercase tracking-wider transition-all shrink-0 shadow active:scale-95"
          >
            Admin Login
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#0284c7]/10 to-[#f97316]/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#f97316] p-0.5 shadow-lg shadow-black/50">
              <div className="w-full h-full bg-[#10131a] rounded-[14px] flex items-center justify-center text-white">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
                  Championship Teams Registry
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30">
                  ADMIN CONSOLE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
                  RULE: 8 SQUAD (6 COURT)
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] mt-1">
                Configure team branding, seeds, records, and active 8-player rosters (5 on court for basketball, 6 for volleyball)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRegisterClick}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg glow-blue transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Team</span>
            </button>
            <button
              onClick={handleResetToDefaults}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 hover:border-white/20 font-heading font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
              title="Reset all teams to default championship presets"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
            <button
              onClick={handleExportDatabaseBackup}
              className="px-3.5 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 hover:text-purple-200 border border-purple-500/30 font-heading font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
              title="Download full tournament database snapshot as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Backup DB</span>
            </button>
            <button
              onClick={() => {
                setRestoreFileSummary(null);
                setRestoreError(null);
                setIsRestoreModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 font-heading font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
              title="Restore tournament database from a backup JSON snapshot"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restore DB</span>
            </button>
          </div>
        </div>

        {/* Global Registry Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-left">
          <div className="p-3 rounded-2xl bg-[#0b0e14]/60 border border-white/5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block">Total Teams</span>
            <span className="text-lg font-heading font-black text-white">{totalTeams}</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#0b0e14]/60 border border-white/5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#38bdf8] block">Volleyball Squads</span>
            <span className="text-lg font-heading font-black text-[#38bdf8]">{vbCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#0b0e14]/60 border border-white/5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#fb923c] block">Basketball Teams</span>
            <span className="text-lg font-heading font-black text-[#fb923c]">{bbCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#0b0e14]/60 border border-white/5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-purple-400 block">Registered Athletes</span>
            <span className="text-lg font-heading font-black text-purple-300">{totalAthletes}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Sport Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0b0e14] border border-white/10 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedSportFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedSportFilter === 'all'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            All Sports ({totalTeams})
          </button>
          <button
            onClick={() => setSelectedSportFilter('volleyball')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedSportFilter === 'volleyball'
                ? 'bg-[#0284c7]/30 text-[#38bdf8] border border-[#0284c7]/40 shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Volleyball ({vbCount})
          </button>
          <button
            onClick={() => setSelectedSportFilter('basketball')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedSportFilter === 'basketball'
                ? 'bg-[#f97316]/30 text-[#fb923c] border border-[#f97316]/40 shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Basketball ({bbCount})
          </button>
        </div>

        {/* Search Bar & Reset Defaults */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams or players..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0b0e14] border border-white/10 text-xs text-white placeholder-white/40 focus:border-cyan-400 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={handleResetToDefaults}
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-300 border border-white/10 transition-colors shrink-0"
            title="Reset Catalog to Factory Defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-dashed border-white/15 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-black text-base uppercase text-white tracking-wide">
            No Teams Found
          </h3>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            {searchQuery
              ? `No teams or athletes matching "${searchQuery}" in ${selectedSportFilter} category.`
              : 'No teams registered in this division yet.'}
          </p>
          <button
            onClick={handleOpenCreateNew}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-heading font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTeams.map((team) => {
            const isVb = team.sport === 'volleyball';
            const cardMaxOnCourt = getMaxOnCourtPlayers(team.sport);
            const onCourt = team.players?.filter(p => p.isOnCourt !== false) || [];
            const bench = team.players?.filter(p => p.isOnCourt === false) || [];
            const squadTotal = team.players?.length || 0;

            return (
              <div
                key={team.id}
                className="glass-panel rounded-2xl border border-white/10 overflow-hidden relative hover:border-white/20 transition-all duration-200 flex flex-col group"
              >
                {/* Accent Color Strip */}
                <div 
                  className="h-1.5 w-full"
                  style={{ backgroundColor: team.logoColor }}
                />

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Top Bar: Seed, Sport Badge, Record */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-white/10 text-white border border-white/15">
                        SEED #{team.seed}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                        isVb 
                          ? 'bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/30'
                          : 'bg-[#f97316]/20 text-[#fb923c] border border-[#f97316]/30'
                      }`}>
                        {isVb ? <Zap className="w-2.5 h-2.5" /> : <Flame className="w-2.5 h-2.5" />}
                        {isVb ? 'VNL Volley' : 'FIBA Hoops'}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-white/70 bg-[#0b0e14] border border-white/10">
                      Rec: {team.record || '0-0'}
                    </span>
                  </div>

                  {/* Team Identity */}
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-black text-white text-sm shadow-md shrink-0 ring-2 ring-white/20 overflow-hidden"
                      style={{ backgroundColor: team.logoColor }}
                    >
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                      ) : (
                        team.shortName.slice(0, 3)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-black text-lg text-white uppercase tracking-wide truncate group-hover:text-cyan-300 transition-colors">
                          {team.name}
                        </h3>
                        <span className="text-xs font-mono font-bold text-white/50 uppercase">
                          ({team.shortName})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.logoColor }} />
                        <span className="text-[10px] text-white/50 font-mono">Kit: {team.logoColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Squad Stats Badges */}
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className={`px-2 py-0.5 rounded-md font-mono font-bold ${
                      onCourt.length === cardMaxOnCourt
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : onCourt.length > cardMaxOnCourt
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      Court: {onCourt.length}/{cardMaxOnCourt}
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Bench: {bench.length} Subs
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-mono font-bold ${
                      squadTotal === MAX_TEAM_ROSTER_LIMIT
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-white/10 text-white/70 border border-white/15'
                    }`}>
                      Squad: {squadTotal}/{MAX_TEAM_ROSTER_LIMIT}
                    </span>
                  </div>

                  {/* Roster Athletes Preview */}
                  <div className="p-2.5 rounded-xl bg-[#0b0e14]/80 border border-white/10 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center justify-between">
                      <span>Roster Athletes</span>
                      <span>Jersey &amp; Position</span>
                    </div>

                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                      {team.players && team.players.length > 0 ? (
                        team.players.map((p) => (
                          <div 
                            key={p.id}
                            className="flex items-center justify-between text-xs py-0.5 px-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {p.photoUrl ? (
                                <img src={p.photoUrl} alt={p.name} className="w-4 h-4 rounded-full object-cover shrink-0 border border-white/20" />
                              ) : null}
                              <span className={`px-1 rounded text-[9px] font-mono font-bold ${
                                p.isOnCourt !== false
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {p.isOnCourt !== false ? 'COURT' : 'BENCH'}
                              </span>
                              <span className="font-mono font-bold text-white/70 w-5">#{p.number}</span>
                              <span className="text-white font-medium truncate">{p.name}</span>
                            </div>
                            <span className="text-[10px] text-white/50 shrink-0 ml-2 font-mono">
                              {p.position}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-white/40 italic text-center py-2">
                          No players added yet
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleEditClick(team)}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 text-white font-heading font-bold text-xs uppercase tracking-wider border border-white/10 hover:border-cyan-400/40 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Edit Team &amp; Roster</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 border border-white/10 hover:border-rose-500/40 transition-colors"
                      title="Permanently Delete Team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team & Roster Editor Modal */}
      {(editingTeam || isCreatingNew) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div 
            className="w-[95vw] sm:w-[90vw] md:w-[80vw] max-w-[95vw] md:max-w-[80vw] glass-panel-elevated p-5 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative my-6 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseEditor}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ring-2 ring-white/20"
                style={{ backgroundColor: formColor.hex }}
              >
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-black text-2xl text-white uppercase tracking-wider">
                    {isCreatingNew ? 'Register New Championship Team' : `Edit Team: ${formName || editingTeam?.name}`}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
                    8 SQUAD (6 COURT)
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8]">
                  Set team identity, kit branding, and manage official on-court starters and substitute bench
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-6">
              {/* Team Identity Grid */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h4 className="font-heading font-black text-sm uppercase text-white tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Team Identity &amp; Championship Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      Team Full Name *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Pacific Surge"
                      className="w-full px-3 py-2.5 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white font-bold focus:border-cyan-400 outline-none"
                      required
                    />
                  </div>

                  {/* Short Code */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      Short Code (2-4 Chars)
                    </label>
                    <input
                      type="text"
                      value={formShort}
                      onChange={(e) => setFormShort(e.target.value.toUpperCase().slice(0, 4))}
                      placeholder="e.g. SUR"
                      maxLength={4}
                      className="w-full px-3 py-2.5 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white font-mono uppercase focus:border-cyan-400 outline-none"
                    />
                  </div>

                  {/* Sport */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      Sport Discipline
                    </label>
                    <select
                      value={formSport}
                      onChange={(e) => handleSportChangeInForm(e.target.value as Sport)}
                      className="w-full px-3 py-2.5 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-cyan-400 outline-none"
                    >
                      <option value="volleyball">Volleyball (VNL)</option>
                      <option value="basketball">Basketball (FIBA)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {/* Seed # */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      Tournament Seed (1-32)
                    </label>
                    <input
                      type="number"
                      value={formSeed}
                      onChange={(e) => setFormSeed(Number(e.target.value))}
                      min={1}
                      max={32}
                      className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white font-mono focus:border-cyan-400 outline-none"
                    />
                  </div>

                  {/* Record */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      Tournament Record (W-L)
                    </label>
                    <input
                      type="text"
                      value={formRecord}
                      onChange={(e) => setFormRecord(e.target.value)}
                      placeholder="e.g. 14-2"
                      className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white font-mono focus:border-cyan-400 outline-none"
                    />
                  </div>

                  {/* Kit Color Presets */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      Primary Kit Color
                    </label>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {COLOR_PRESETS.map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setFormColor(col)}
                          className={`w-7 h-7 rounded-full transition-transform ${
                            formColor.hex.toLowerCase() === col.hex.toLowerCase()
                              ? 'scale-125 ring-2 ring-white shadow-md'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Team Logo / Crest Image Upload */}
                <div className="p-3.5 rounded-xl bg-[#0b0e14]/60 border border-white/10 flex flex-col sm:flex-row items-center gap-4 mt-2">
                  <div className="flex items-center gap-3 shrink-0">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-heading font-black text-lg shadow-lg ring-2 ring-white/20 overflow-hidden relative group shrink-0"
                      style={{ backgroundColor: formColor.hex }}
                    >
                      {formLogoUrl ? (
                        <img src={formLogoUrl} alt="Team Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span>{(formShort || formName || 'LOGO').slice(0, 3).toUpperCase()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                        Team Crest / Logo Photo
                      </label>
                      {formLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormLogoUrl('')}
                          className="text-[10px] text-rose-400 hover:underline uppercase font-bold"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs uppercase cursor-pointer border border-white/20 flex items-center gap-1.5 transition-colors shrink-0">
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileUpload(e.target.files?.[0], setFormLogoUrl)}
                        />
                      </label>
                      <input
                        type="url"
                        value={formLogoUrl}
                        onChange={(e) => setFormLogoUrl(e.target.value)}
                        placeholder="Or paste direct image URL (https://...)"
                        className="flex-1 px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white font-mono focus:border-cyan-400 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Roster Management Section */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
                  <div>
                    <h4 className="font-heading font-black text-sm uppercase text-white tracking-wider flex items-center gap-2">
                      <Shirt className="w-4 h-4 text-cyan-400" />
                      Official 8-Player Squad Roster (Max {formMaxOnCourt} On Court)
                    </h4>
                    <p className="text-[11px] text-[#94a3b8]">
                      Enforcing tournament rule: Maximum 8 squad members, strictly {formMaxOnCourt} players allowed on court in {formSport}.
                    </p>
                  </div>

                  {/* Telemetry and Auto Fill */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                      onCourtPlayers.length === formMaxOnCourt
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : onCourtPlayers.length > formMaxOnCourt
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                        : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      Court: {onCourtPlayers.length}/{formMaxOnCourt} PLAYING
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                      formPlayers.length === MAX_TEAM_ROSTER_LIMIT
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-white/10 text-white/80 border border-white/15'
                    }`}>
                      Squad: {formPlayers.length}/{MAX_TEAM_ROSTER_LIMIT}
                    </div>

                    <button
                      type="button"
                      onClick={handlePopulateFormSquad}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-bold text-white flex items-center gap-1 transition-colors"
                      title={`Load standard 8-player squad (${formMaxOnCourt} on court, ${MAX_TEAM_ROSTER_LIMIT - formMaxOnCourt} bench)`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Auto 8 Squad ({formMaxOnCourt}+{MAX_TEAM_ROSTER_LIMIT - formMaxOnCourt})
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenCsvImport}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-[11px] font-bold text-cyan-300 flex items-center gap-1 transition-colors"
                      title="Import athletes from CSV file or clipboard"
                    >
                      <FileUp className="w-3 h-3 text-cyan-400" />
                      Import CSV
                    </button>
                    {formPlayers.length > 0 && (
                      <button
                        type="button"
                        onClick={handleExportRosterCsv}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-bold text-white/80 hover:text-white flex items-center gap-1 transition-colors"
                        title="Download roster as CSV file"
                      >
                        <FileDown className="w-3 h-3 text-white/60" />
                        Export CSV
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setFormPlayers([])}
                      className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-400 border border-white/10 transition-colors"
                      title="Clear Roster"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 1. Active On Court */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-400 px-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Active Players On Court ({onCourtPlayers.length}/{formMaxOnCourt} Playing)
                    </span>
                    <span className="text-[10px] text-white/40 font-normal normal-case">
                      Click "ON COURT" to move to bench
                    </span>
                  </div>

                  {onCourtPlayers.length === 0 ? (
                    <div className="p-3 rounded-xl bg-[#0b0e14]/60 border border-dashed border-white/15 text-center text-xs text-white/50">
                      No active players designated on court. Minimum 1 required (up to {formMaxOnCourt} max).
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {onCourtPlayers.map((p, idx) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 p-1.5 bg-[#0b0e14] rounded-xl border border-emerald-500/30 hover:border-emerald-500/60 transition-colors"
                        >
                          <span className="text-[10px] text-white/40 w-4 font-mono text-center">{idx + 1}</span>

                          {/* Player Photo Avatar */}
                          <div className="relative group shrink-0">
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt={p.name} className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-white/70 shrink-0">
                                #{p.number}
                              </div>
                            )}
                            <label
                              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center cursor-pointer shadow opacity-80 group-hover:opacity-100"
                              title="Upload or change athlete photo"
                            >
                              <Camera className="w-2 h-2" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePlayerPhotoUpload(p.id, e)}
                              />
                            </label>
                          </div>

                          {/* Toggle to bench */}
                          <button
                            type="button"
                            onClick={() => handleTogglePlayerCourtStatus(p.id)}
                            className="px-2 py-1 rounded-md bg-emerald-500/20 hover:bg-amber-500/20 text-emerald-400 hover:text-amber-300 border border-emerald-500/40 hover:border-amber-500/40 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0"
                            title="Click to move player to Bench"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>ON COURT</span>
                          </button>

                          {/* Jersey # */}
                          <input
                            type="number"
                            value={p.number}
                            onChange={(e) => handleUpdateInlinePlayer(p.id, 'number', e.target.value)}
                            min={0}
                            max={99}
                            className="w-12 px-1.5 py-1 bg-white/5 border border-white/10 rounded-lg font-mono font-bold text-center text-xs text-emerald-300 outline-none focus:border-emerald-400"
                            title="Jersey Number"
                          />

                          {/* Name */}
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => handleUpdateInlinePlayer(p.id, 'name', e.target.value)}
                            className="flex-1 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white font-medium outline-none focus:border-emerald-400"
                            placeholder="Player Name"
                          />

                          {/* Position */}
                          <input
                            type="text"
                            value={p.position}
                            onChange={(e) => handleUpdateInlinePlayer(p.id, 'position', e.target.value)}
                            className="w-24 sm:w-32 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] text-white/70 outline-none focus:border-emerald-400 truncate"
                            placeholder="Position"
                          />

                          {/* Remove Photo if present */}
                          {p.photoUrl && (
                            <button
                              type="button"
                              onClick={() => handleUpdateInlinePlayer(p.id, 'photoUrl', '')}
                              className="text-[10px] text-rose-400 hover:underline px-1 shrink-0"
                              title="Remove athlete photo"
                            >
                              No Photo
                            </button>
                          )}

                          {/* Remove Player */}
                          <button
                            type="button"
                            onClick={() => handleRemoveFormPlayer(p.id)}
                            className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors shrink-0"
                            title="Remove player"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Bench Reserves (Max 2) */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-400/90 px-1">
                    <span className="flex items-center gap-1.5">
                      <Shirt className="w-3.5 h-3.5 text-amber-400" />
                      Bench Reserves ({benchPlayers.length} Sub{benchPlayers.length !== 1 ? 's' : ''})
                    </span>
                    <span className="text-[10px] text-white/40 font-normal normal-case">
                      Click "BENCH" to promote to court
                    </span>
                  </div>

                  {benchPlayers.length === 0 ? (
                    <div className="p-2.5 rounded-xl bg-[#0b0e14]/40 border border-white/5 text-center text-xs text-white/40 italic">
                      No bench reserve players. Add players below to populate the substitute bench.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {benchPlayers.map((p, idx) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 p-1.5 bg-[#0b0e14] rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-colors"
                        >
                          <span className="text-[10px] text-white/40 w-4 font-mono text-center">b{idx + 1}</span>

                          {/* Player Photo Avatar */}
                          <div className="relative group shrink-0">
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt={p.name} className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400/80 shrink-0">
                                #{p.number}
                              </div>
                            )}
                            <label
                              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center cursor-pointer shadow opacity-80 group-hover:opacity-100"
                              title="Upload or change athlete photo"
                            >
                              <Camera className="w-2 h-2" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePlayerPhotoUpload(p.id, e)}
                              />
                            </label>
                          </div>

                          {/* Toggle to court */}
                          <button
                            type="button"
                            onClick={() => handleTogglePlayerCourtStatus(p.id)}
                            className="px-2 py-1 rounded-md bg-amber-500/15 hover:bg-emerald-500/20 text-amber-300 hover:text-emerald-400 border border-amber-500/30 hover:border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0"
                            title="Click to promote to Court"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>BENCH</span>
                          </button>

                          {/* Jersey # */}
                          <input
                            type="number"
                            value={p.number}
                            onChange={(e) => handleUpdateInlinePlayer(p.id, 'number', e.target.value)}
                            min={0}
                            max={99}
                            className="w-12 px-1.5 py-1 bg-white/5 border border-white/10 rounded-lg font-mono font-bold text-center text-xs text-amber-300 outline-none focus:border-amber-400"
                            title="Jersey Number"
                          />

                          {/* Name */}
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => handleUpdateInlinePlayer(p.id, 'name', e.target.value)}
                            className="flex-1 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white font-medium outline-none focus:border-amber-400"
                            placeholder="Player Name"
                          />

                          {/* Position */}
                          <input
                            type="text"
                            value={p.position}
                            onChange={(e) => handleUpdateInlinePlayer(p.id, 'position', e.target.value)}
                            className="w-24 sm:w-32 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] text-white/70 outline-none focus:border-amber-400 truncate"
                            placeholder="Position"
                          />

                          {/* Remove Photo if present */}
                          {p.photoUrl && (
                            <button
                              type="button"
                              onClick={() => handleUpdateInlinePlayer(p.id, 'photoUrl', '')}
                              className="text-[10px] text-rose-400 hover:underline px-1 shrink-0"
                              title="Remove athlete photo"
                            >
                              No Photo
                            </button>
                          )}

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => handleRemoveFormPlayer(p.id)}
                            className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors shrink-0"
                            title="Remove player"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Add Player Row (Enforcing Squad Limit of 8) */}
                {formPlayers.length < MAX_TEAM_ROSTER_LIMIT ? (
                  <div className="p-3 rounded-xl bg-[#0b0e14] border border-white/15 space-y-2 pt-3">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span className="font-bold uppercase tracking-wider text-white/80">
                        Add Squad Member ({MAX_TEAM_ROSTER_LIMIT - formPlayers.length} slots left)
                      </span>
                      <span className="text-[10px] text-white/50">
                        {onCourtPlayers.length < formMaxOnCourt ? 'Will join Court (Starter)' : 'Will join Bench (Sub)'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Athlete Photo Upload */}
                      <div className="relative group shrink-0">
                        {newPlayerPhotoUrl ? (
                          <img
                            src={newPlayerPhotoUrl}
                            alt="Athlete"
                            className="w-8 h-8 rounded-full object-cover border-2 border-cyan-400 shrink-0 shadow"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/50 shrink-0">
                            <Camera className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <label
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center cursor-pointer shadow"
                          title="Upload athlete photo"
                        >
                          <Camera className="w-2.5 h-2.5" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handleImageFileUpload(file, (dataUrl) => setNewPlayerPhotoUrl(dataUrl));
                            }}
                          />
                        </label>
                      </div>

                      {newPlayerPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setNewPlayerPhotoUrl('')}
                          className="text-[10px] text-rose-400 hover:underline px-1 shrink-0"
                          title="Clear photo"
                        >
                          Clear
                        </button>
                      )}

                      <input
                        type="number"
                        value={newPlayerNumber}
                        onChange={(e) => setNewPlayerNumber(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPlayerToForm();
                          }
                        }}
                        placeholder="#"
                        min={0}
                        max={99}
                        className="w-14 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono font-bold text-center text-white outline-none focus:border-cyan-400"
                        title="Jersey Number (0-99)"
                      />
                      <input
                        type="text"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPlayerToForm();
                          }
                        }}
                        placeholder="Athlete Name (e.g. Jordan Hayes)"
                        className="flex-1 min-w-[160px] px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400"
                      />
                      <input
                        type="text"
                        value={newPlayerPos}
                        onChange={(e) => setNewPlayerPos(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPlayerToForm();
                          }
                        }}
                        placeholder="Position"
                        className="w-32 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 placeholder-white/30 outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddPlayerToForm}
                        disabled={!newPlayerName.trim()}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] disabled:opacity-30 disabled:cursor-not-allowed text-white font-heading font-bold text-xs uppercase transition-all shrink-0 flex items-center gap-1 shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Player
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 text-xs font-medium">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      Full 8-player squad roster limit reached (6 playing on court, 2 on bench)
                    </span>
                    <span className="text-[10px] text-white/40">Remove a player to swap</span>
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="text-xs text-white/50 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Enforcing 8-player squad limit &amp; 6 on-court regulation</span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseEditor}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white font-heading font-bold text-xs uppercase transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg glow-blue transition-all active:scale-95 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isCreatingNew ? 'Create & Register Team' : 'Save Team Changes'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CSV Roster Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#10131a] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCsvModalOpen(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white p-1 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-black text-white uppercase tracking-wider">
                  Bulk CSV Roster Import
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Quickly import athletes for {formSport} (Max {MAX_TEAM_ROSTER_LIMIT} squad, {formMaxOnCourt} on court)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* File upload & Template controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow active:scale-95">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose CSV File</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => handleCsvFileUpload(e.target.files?.[0])}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download Sample Template</span>
                </button>
              </div>

              {/* Paste or edit CSV text area */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
                  <span>CSV Raw Text</span>
                  <span className="text-[10px] text-white/40 normal-case">Format: Name, Number, Position, Starter</span>
                </div>
                <textarea
                  rows={6}
                  value={csvRawText}
                  onChange={(e) => handleCsvTextChange(e.target.value)}
                  placeholder={`Name,Number,Position,Starter\nElena Rostova,7,Outside Hitter,true\nChloe Dubois,3,Setter,true\nSofia Hernandez,12,Middle Blocker,true`}
                  className="w-full p-3.5 bg-[#0b0e14] border border-white/15 focus:border-cyan-400 rounded-2xl text-xs font-mono text-white outline-none resize-y"
                />
              </div>

              {/* Validation Feedback & Preview */}
              {csvParseResult && (
                <div className="space-y-3">
                  {csvParseResult.errors.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>Parsing Errors:</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-200/80">
                        {csvParseResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {csvParseResult.warnings.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span>Notices:</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-200/80">
                        {csvParseResult.warnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {csvParseResult.players.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-400">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Parsed {csvParseResult.players.length} Athletes (Court: {csvParseResult.players.filter(p => p.isOnCourt).length}/{formMaxOnCourt})
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {csvParseResult.players.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="flex items-center justify-between p-2 rounded-xl bg-[#0b0e14] border border-white/10 text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                                #{p.number}
                              </span>
                              <span className="text-white font-medium truncate">{p.name}</span>
                            </div>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                              p.isOnCourt ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'
                            }`}>
                              {p.isOnCourt ? 'ON COURT' : 'BENCH'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-heading font-bold text-xs uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!csvParseResult || csvParseResult.players.length === 0}
                  onClick={handleApplyCsvRoster}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-heading font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply to Team Roster</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Database Snapshot Restore Modal */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#10131a] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setIsRestoreModalOpen(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white p-1 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-black text-white uppercase tracking-wider">
                  Restore Tournament Backup
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Restore entire tournament database from a JSON snapshot
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs">
                <strong>Caution:</strong> Restoring will overwrite existing matches, teams, and sponsors with the contents of the backup file. Ensure you have backed up your current database before proceeding.
              </div>

              {/* File Select */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-heading font-black text-xs uppercase tracking-wider transition-all shadow active:scale-95">
                  <UploadCloud className="w-4 h-4" />
                  <span>Select Backup File (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => handleBackupFileSelect(e.target.files?.[0])}
                  />
                </label>
                <p className="text-[11px] text-white/40 mt-2">
                  Select a valid <code className="text-amber-300">dunk_and_spike_backup_*.json</code> file
                </p>
              </div>

              {/* Error state */}
              {restoreError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              {/* Backup details summary */}
              {restoreFileSummary && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <span className="text-xs font-bold text-white/80 uppercase tracking-wider block">
                    Backup Snapshot Details:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-[#0b0e14] border border-white/10">
                      <span className="text-[10px] text-white/40 block">Matches</span>
                      <span className="font-bold text-cyan-400 text-sm">{restoreFileSummary.matchCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#0b0e14] border border-white/10">
                      <span className="text-[10px] text-white/40 block">Sponsors</span>
                      <span className="font-bold text-amber-400 text-sm">{restoreFileSummary.sponsorCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#0b0e14] border border-white/10">
                      <span className="text-[10px] text-white/40 block">Teams</span>
                      <span className="font-bold text-purple-400 text-sm">{restoreFileSummary.teamCount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRestoreModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-heading font-bold text-xs uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!restoreFileSummary || isRestoring}
                  onClick={handleExecuteRestore}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 text-white font-heading font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
                >
                  <Database className="w-4 h-4" />
                  <span>{isRestoring ? 'Restoring...' : 'Restore Database'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
