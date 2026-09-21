import React, { useState, useEffect } from 'react';
import { Team, Player, Sport } from '../types';
import { 
  X, 
  Users, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Sparkles, 
  Shirt, 
  Trophy,
  Camera,
  Upload,
  Image as ImageIcon,
  ArrowRightLeft,
  CheckCircle2
} from 'lucide-react';
import { normalizeTeamPlayers, getStoredTeams, saveStoredTeams, PreexistingTeam } from '../data/preexistingTeams';

interface TeamRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sport: Sport;
  onSaveTeam: (team: Team) => void;
  initialTeam?: Team;
}

const COLOR_OPTIONS = [
  { label: 'Orange', hex: '#f97316', accent: '#fb923c' },
  { label: 'Sky Blue', hex: '#0284c7', accent: '#38bdf8' },
  { label: 'Crimson', hex: '#e11d48', accent: '#f43f5e' },
  { label: 'Purple', hex: '#8b5cf6', accent: '#a78bfa' },
  { label: 'Emerald', hex: '#10b981', accent: '#34d399' },
  { label: 'Gold', hex: '#eab308', accent: '#facc15' },
];

const getDefaultSquad = (targetSport: Sport): Player[] => {
  const ts = Date.now();
  if (targetSport === 'volleyball') {
    return [
      { id: `p-${ts}-1`, name: 'Elena Rostova', number: 7, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: `p-${ts}-2`, name: 'Maya Lindqvist', number: 14, position: 'Middle Blocker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: `p-${ts}-3`, name: 'Chloe Dubois', number: 3, position: 'Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: `p-${ts}-4`, name: 'Aaliyah Washington', number: 10, position: 'Opposite Spiker', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: `p-${ts}-5`, name: 'Sofia Hernandez', number: 5, position: 'Outside Hitter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: `p-${ts}-6`, name: 'Kira Novak', number: 1, position: 'Libero', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: true, isStarter: true },
      { id: `p-${ts}-7`, name: 'Hannah Scott', number: 18, position: 'Defensive Specialist', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
      { id: `p-${ts}-8`, name: 'Zoe Martinez', number: 22, position: 'Backup Setter', points: 0, kills: 0, aces: 0, blocks: 0, isOnCourt: false, isStarter: false },
    ];
  } else {
    return [
      { id: `p-${ts}-1`, name: 'Marcus Vance', number: 23, position: 'Shooting Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: `p-${ts}-2`, name: 'Devon Sterling', number: 11, position: 'Point Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: `p-${ts}-3`, name: 'Jaxon Hayes', number: 34, position: 'Power Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: `p-${ts}-4`, name: 'Trevor Campbell', number: 55, position: 'Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: `p-${ts}-5`, name: 'Malik Turner', number: 8, position: 'Small Forward', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: true, isStarter: true },
      { id: `p-${ts}-6`, name: 'Zion Brooks', number: 24, position: 'Sixth Man Guard', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
      { id: `p-${ts}-7`, name: 'Kobe Walker', number: 4, position: 'Reserve Wing', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
      { id: `p-${ts}-8`, name: 'Dante Cole', number: 15, position: 'Backup Center', points: 0, twoPointers: 0, threePointers: 0, freeThrows: 0, isOnCourt: false, isStarter: false },
    ];
  }
};

export const TeamRosterModal: React.FC<TeamRosterModalProps> = ({
  isOpen,
  onClose,
  sport,
  onSaveTeam,
  initialTeam,
}) => {
  const [modalSport, setModalSport] = useState<Sport>((initialTeam as any)?.sport || sport);
  const isBasketball = modalSport === 'basketball';
  const MAX_ROSTER_PLAYERS = 8;
  const maxOnCourt = isBasketball ? 5 : 6;

  const [teamName, setTeamName] = useState(initialTeam?.name || '');
  const [shortName, setShortName] = useState(initialTeam?.shortName || '');
  const [seed, setSeed] = useState(initialTeam?.seed || 1);
  const [logoUrl, setLogoUrl] = useState<string>(initialTeam?.logoUrl || '');
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(
    COLOR_OPTIONS.find(c => c.hex.toLowerCase() === initialTeam?.logoColor?.toLowerCase()) || COLOR_OPTIONS[0]
  );

  const [players, setPlayers] = useState<Player[]>(() => {
    if (initialTeam?.players && initialTeam.players.length > 0) {
      return normalizeTeamPlayers(initialTeam.players, (initialTeam as any)?.sport || sport);
    }
    return getDefaultSquad((initialTeam as any)?.sport || sport);
  });

  // New Player Inputs
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState<number>(12);
  const [newPlayerPos, setNewPlayerPos] = useState(
    modalSport === 'volleyball' ? 'Outside Hitter' : 'Forward'
  );
  const [newPlayerPhoto, setNewPlayerPhoto] = useState<string>('');

  // Re-synchronize when modal is opened or target team/sport changes
  useEffect(() => {
    if (isOpen) {
      const activeSport = (initialTeam as any)?.sport || sport;
      setModalSport(activeSport);
      if (initialTeam) {
        setTeamName(initialTeam.name || '');
        setShortName(initialTeam.shortName || '');
        setSeed(initialTeam.seed || 1);
        setLogoUrl(initialTeam.logoUrl || '');
        setLogoUrlInput('');
        setSelectedColor(
          COLOR_OPTIONS.find(c => c.hex.toLowerCase() === initialTeam.logoColor?.toLowerCase()) || COLOR_OPTIONS[0]
        );
        if (initialTeam.players && initialTeam.players.length > 0) {
          setPlayers(normalizeTeamPlayers(initialTeam.players, activeSport));
        } else {
          setPlayers(getDefaultSquad(activeSport));
        }
      } else {
        setTeamName('');
        setShortName('');
        setSeed(1);
        setLogoUrl('');
        setLogoUrlInput('');
        setSelectedColor(COLOR_OPTIONS[0]);
        setPlayers(getDefaultSquad(activeSport));
      }
      setNewPlayerName('');
      setNewPlayerPhoto('');
      setNewPlayerNumber(12);
      setNewPlayerPos(activeSport === 'volleyball' ? 'Outside Hitter' : 'Point Guard');
    }
  }, [isOpen, initialTeam, sport]);

  const handleSportChange = (newSport: Sport) => {
    setModalSport(newSport);
    setNewPlayerPos(newSport === 'volleyball' ? 'Outside Hitter' : 'Point Guard');
    setPlayers(prev => normalizeTeamPlayers(prev, newSport));
  };

  if (!isOpen) return null;

  // Image upload helper
  const handleImageUpload = (file: File | undefined, callback: (url: string) => void) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        callback(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    if (players.length >= MAX_ROSTER_PLAYERS) {
      alert(`Limit reached: Maximum ${MAX_ROSTER_PLAYERS} squad members allowed per team.`);
      return;
    }

    const currentCourt = players.filter(p => p.isOnCourt !== false).length;
    const shouldBeOnCourt = currentCourt < maxOnCourt;

    const newPlayer: Player = {
      id: `p-${Date.now()}`,
      name: newPlayerName.trim(),
      number: newPlayerNumber,
      position: newPlayerPos.trim(),
      points: 0,
      kills: 0,
      aces: 0,
      blocks: 0,
      twoPointers: 0,
      threePointers: 0,
      freeThrows: 0,
      isOnCourt: shouldBeOnCourt,
      isStarter: shouldBeOnCourt,
      photoUrl: newPlayerPhoto.trim() || undefined,
    };

    setPlayers(prev => (prev.length >= MAX_ROSTER_PLAYERS ? prev : [...prev, newPlayer]));
    setNewPlayerName('');
    setNewPlayerPhoto('');
    setNewPlayerNumber(prev => (prev + 1) % 100);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  const handleToggleCourtStatus = (playerId: string) => {
    setPlayers(prev => {
      const target = prev.find(p => p.id === playerId);
      if (!target) return prev;
      const isCurrentlyCourt = target.isOnCourt !== false;

      if (!isCurrentlyCourt) {
        const courtCount = prev.filter(p => p.isOnCourt !== false).length;
        if (courtCount >= maxOnCourt) {
          alert(`Regulation limit: Only ${maxOnCourt} players allowed on court simultaneously in ${modalSport}. Move an on-court player to bench first.`);
          return prev;
        }
      }

      return prev.map(p => {
        if (p.id !== playerId) return p;
        const newCourtState = !isCurrentlyCourt;
        return {
          ...p,
          isOnCourt: newCourtState,
          isStarter: newCourtState,
        };
      });
    });
  };

  const handlePlayerPhotoChange = (playerId: string, file: File | undefined) => {
    handleImageUpload(file, (url) => {
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, photoUrl: url } : p));
    });
  };

  const handleRemovePlayerPhoto = (playerId: string) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, photoUrl: undefined } : p));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      alert('Please enter a team name.');
      return;
    }

    if (players.length === 0) {
      alert('Please add at least 1 player to the team roster.');
      return;
    }

    const cleanShort = (shortName.trim() || teamName.slice(0, 3)).toUpperCase();
    const finalPlayers = normalizeTeamPlayers(players, modalSport);

    const newTeam: Team = {
      id: initialTeam?.id || `team-${Date.now()}`,
      name: teamName.trim(),
      shortName: cleanShort,
      sport: modalSport,
      seed,
      logoColor: selectedColor.hex,
      accentColor: selectedColor.accent,
      record: initialTeam?.record || '0-0',
      score: initialTeam?.score || 0,
      setsWon: initialTeam?.setsWon || 0,
      quarterScores: initialTeam?.quarterScores || [0],
      timeoutsLeft: initialTeam?.timeoutsLeft || (modalSport === 'volleyball' ? 2 : 4),
      fouls: initialTeam?.fouls || 0,
      logoUrl: logoUrl.trim() || undefined,
      players: finalPlayers,
    };

    // Save to championship registry
    try {
      const stored = getStoredTeams();
      const existingIdx = stored.findIndex(t => t.id === newTeam.id || t.name.toLowerCase() === newTeam.name.toLowerCase());
      const presetTeam: PreexistingTeam = {
        id: newTeam.id,
        name: newTeam.name,
        shortName: newTeam.shortName,
        sport: modalSport,
        seed: newTeam.seed,
        logoColor: newTeam.logoColor,
        accentColor: newTeam.accentColor,
        record: newTeam.record,
        logoUrl: newTeam.logoUrl,
        players: finalPlayers,
      };

      if (existingIdx >= 0) {
        stored[existingIdx] = presetTeam;
      } else {
        stored.unshift(presetTeam);
      }
      saveStoredTeams(stored);
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Failed to sync team with registry', err);
    }

    onSaveTeam(newTeam);
    onClose();
  };

  const onCourtCount = players.filter(p => p.isOnCourt !== false).length;
  const benchCount = players.filter(p => p.isOnCourt === false).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 mb-6 pb-4 border-b border-white/10 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#f97316] p-0.5">
              <div className="w-full h-full bg-[#10131a] rounded-[10px] flex items-center justify-center text-white">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="font-heading font-black text-2xl text-white uppercase tracking-wider">
                {initialTeam ? 'Edit Team & Player Roster' : 'Register New Championship Team'}
              </h3>
              <p className="text-xs text-[#94a3b8]">
                8-player squad limit ({maxOnCourt} on court, {MAX_ROSTER_PLAYERS - maxOnCourt} bench) · Custom logos &amp; athlete photos
              </p>
            </div>
          </div>

          {/* Sport Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#0b0e14] rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => handleSportChange('volleyball')}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-black uppercase tracking-wider transition-all ${
                modalSport === 'volleyball'
                  ? 'bg-[#0284c7] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Volleyball (6 Court)
            </button>
            <button
              type="button"
              onClick={() => handleSportChange('basketball')}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-black uppercase tracking-wider transition-all ${
                modalSport === 'basketball'
                  ? 'bg-[#f97316] text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Basketball (5 Court)
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Team Logo & Info Section */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-start gap-4">
              {/* Logo Preview */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div 
                  className="w-16 h-16 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-black/40 relative group"
                  style={{ borderColor: selectedColor.hex }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Team Logo" className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <span className="font-heading font-black text-lg" style={{ color: selectedColor.hex }}>
                      {(shortName || teamName || 'TM').slice(0, 3).toUpperCase()}
                    </span>
                  )}
                  <label
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white"
                    title="Upload Team Logo"
                  >
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        handleImageUpload(file, (url) => setLogoUrl(url));
                      }}
                    />
                  </label>
                </div>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Remove Logo
                  </button>
                )}
              </div>

              {/* Names & Seed */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
                    Team Full Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Pacific Surge"
                    className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-[#38bdf8] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
                    Short Tag (3-4 Letters)
                  </label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value.toUpperCase().slice(0, 4))}
                    placeholder="SUR"
                    maxLength={4}
                    className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white uppercase focus:border-[#38bdf8] outline-none"
                  />
                </div>

                {/* Team Logo URL / Upload mode */}
                <div className="sm:col-span-3 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-white/70 uppercase">Team Crest / Logo</span>
                    <div className="flex gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setLogoInputMode('upload')}
                        className={`font-semibold ${logoInputMode === 'upload' ? 'text-cyan-400 underline' : 'text-white/40'}`}
                      >
                        Upload Image
                      </button>
                      <span className="text-white/20">|</span>
                      <button
                        type="button"
                        onClick={() => setLogoInputMode('url')}
                        className={`font-semibold ${logoInputMode === 'url' ? 'text-cyan-400 underline' : 'text-white/40'}`}
                      >
                        Enter Web URL
                      </button>
                    </div>
                  </div>

                  {logoInputMode === 'upload' ? (
                    <label className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 cursor-pointer text-xs text-white/80 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Select Logo File (PNG, JPG, SVG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          handleImageUpload(file, (url) => setLogoUrl(url));
                        }}
                      />
                    </label>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={logoUrlInput}
                        onChange={(e) => setLogoUrlInput(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="flex-1 px-3 py-1.5 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (logoUrlInput.trim()) {
                            setLogoUrl(logoUrlInput.trim());
                            setLogoUrlInput('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Team Brand Color
              </label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`w-7 h-7 rounded-xl transition-all ${
                      selectedColor.hex === col.hex
                        ? 'ring-2 ring-white scale-110 shadow-lg'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Players Roster Section */}
          <div className="border-t border-white/10 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-black text-sm uppercase text-white tracking-wider flex items-center gap-1.5">
                    <Shirt className="w-4 h-4 text-[#38bdf8]" />
                    Squad Roster ({players.length}/{MAX_ROSTER_PLAYERS} Members)
                  </h4>
                  <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    {onCourtCount}/{maxOnCourt} On Court · {benchCount} Bench
                  </span>
                </div>
                <p className="text-[11px] text-[#94a3b8]">
                  Only {maxOnCourt} players are allowed on court in {modalSport}. Click &apos;Court&apos; / &apos;Bench&apos; to substitute starters.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlayers(getDefaultSquad(modalSport))}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-bold text-white flex items-center gap-1 transition-colors"
                  title={`Load standard 8-player squad (${maxOnCourt} on court, ${MAX_ROSTER_PLAYERS - maxOnCourt} bench)`}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  {`Auto 8 Squad (${maxOnCourt}+${MAX_ROSTER_PLAYERS - maxOnCourt})`}
                </button>
                <button
                  type="button"
                  onClick={() => setPlayers([])}
                  className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-400 border border-white/10 transition-colors"
                  title="Clear Roster"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Existing Players List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
              {players.map((p, idx) => {
                const isOnCourt = p.isOnCourt !== false;
                return (
                  <div 
                    key={p.id} 
                    className={`p-2 rounded-xl flex items-center justify-between border transition-all ${
                      isOnCourt 
                        ? 'bg-emerald-950/20 border-emerald-500/30' 
                        : 'bg-[#0b0e14] border-white/10 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Court Status Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleCourtStatus(p.id)}
                        className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border transition-colors ${
                          isOnCourt 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40' 
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40'
                        }`}
                        title={isOnCourt ? 'Click to move to bench' : 'Click to promote to on court'}
                      >
                        <ArrowRightLeft className="w-2.5 h-2.5" />
                        <span>{isOnCourt ? 'COURT' : 'BENCH'}</span>
                      </button>

                      {/* Photo or Jersey # */}
                      <div className="relative group shrink-0">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.name} className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0" />
                        ) : (
                          <span 
                            className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-[11px] text-white shrink-0"
                            style={{ backgroundColor: selectedColor.hex }}
                          >
                            #{p.number}
                          </span>
                        )}
                        <label
                          className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center cursor-pointer shadow opacity-80 group-hover:opacity-100"
                          title="Upload athlete photo"
                        >
                          <Camera className="w-2 h-2" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePlayerPhotoChange(p.id, e.target.files?.[0])}
                          />
                        </label>
                      </div>

                      <div className="min-w-0">
                        <span className="font-heading font-bold text-xs text-white truncate block">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-[#94a3b8] block">
                          #{p.number} · {p.position}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {p.photoUrl && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlayerPhoto(p.id)}
                          className="text-[10px] text-rose-400 hover:underline px-1"
                          title="Remove photo"
                        >
                          No Photo
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(p.id)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Remove player"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Player Form */}
            {players.length < MAX_ROSTER_PLAYERS ? (
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#38bdf8] block">
                  + Add Player to Squad ({MAX_ROSTER_PLAYERS - players.length} slots left)
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Photo input preview */}
                  <div className="relative group shrink-0">
                    {newPlayerPhoto ? (
                      <img src={newPlayerPhoto} alt="New Athlete" className="w-8 h-8 rounded-full object-cover border border-cyan-400" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/50">
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
                        onChange={(e) => handleImageUpload(e.target.files?.[0], (url) => setNewPlayerPhoto(url))}
                      />
                    </label>
                  </div>
                  {newPlayerPhoto && (
                    <button
                      type="button"
                      onClick={() => setNewPlayerPhoto('')}
                      className="text-[10px] text-rose-400 hover:underline px-1"
                    >
                      Clear
                    </button>
                  )}

                  <input
                    type="number"
                    value={newPlayerNumber}
                    onChange={(e) => setNewPlayerNumber(Number(e.target.value))}
                    placeholder="#"
                    className="w-14 px-2 py-1.5 bg-[#0b0e14] border border-white/15 rounded-lg text-xs font-mono font-bold text-center text-white outline-none focus:border-[#38bdf8]"
                    min={0}
                    max={99}
                  />

                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Player Full Name"
                    className="flex-1 min-w-[140px] px-3 py-1.5 bg-[#0b0e14] border border-white/15 rounded-lg text-xs text-white outline-none focus:border-[#38bdf8]"
                  />

                  <input
                    type="text"
                    value={newPlayerPos}
                    onChange={(e) => setNewPlayerPos(e.target.value)}
                    placeholder="Position"
                    className="w-28 px-2.5 py-1.5 bg-[#0b0e14] border border-white/15 rounded-lg text-xs text-white outline-none focus:border-[#38bdf8]"
                  />

                  <button
                    type="button"
                    onClick={handleAddPlayer}
                    disabled={!newPlayerName.trim()}
                    className="px-4 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#38bdf8] disabled:opacity-40 disabled:cursor-not-allowed text-white font-heading font-bold text-xs uppercase transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-300 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  Roster full: 8 players configured ({maxOnCourt} court, {MAX_ROSTER_PLAYERS - maxOnCourt} bench)
                </span>
                <span className="text-[10px] text-white/50">Delete a player to swap</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="text-[11px] text-white/50 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Saves to Championship Registry &amp; Local DB</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white font-heading font-bold text-xs uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg glow-blue transition-all active:scale-95 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Team &amp; Roster</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
