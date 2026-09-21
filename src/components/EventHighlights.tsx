import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Camera, 
  X, 
  CheckCircle2, 
  RotateCcw,
  Tag,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { EventHighlight } from '../types';

export const EVENT_HIGHLIGHTS_STORAGE_KEY = 'dunk_spike_event_highlights_v1';

export const DEFAULT_EVENT_HIGHLIGHTS: EventHighlight[] = [
  {
    id: 'highlight-1',
    title: 'Elena Rostova Clutch Spike Over Double Block',
    caption: 'Thunder Spikers captain delivers a 104 km/h spike off the tape to force set point in Game 3.',
    imageUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1400&q=80',
    tag: 'VNL Volleyball',
    date: 'Set 4 · 24-23',
  },
  {
    id: 'highlight-2',
    title: 'Marcus Vance 360° Breakaway Windmill Dunk',
    caption: 'Transition fast-break dunk electrifies the crowd as Boston Titans extend their 4th quarter lead.',
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1400&q=80',
    tag: 'FIBA Basketball',
    date: 'Q4 · 02:14',
  },
  {
    id: 'highlight-3',
    title: 'Championship Trophy Unveiled at Center Court',
    caption: 'Official 2026 Gold Cup unveiled under stadium floodlights ahead of tonight’s final showdown.',
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1400&q=80',
    tag: 'Ceremony',
    date: 'Center Stage',
  },
  {
    id: 'highlight-4',
    title: 'Tremendous Monster Block at Deuce',
    caption: 'Sofia Hernandez shuts down the opposite smash with single-handed roof block at 26-26.',
    imageUrl: 'https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=1400&q=80',
    tag: 'Defensive Play',
    date: 'Set 2 · Deuce',
  },
  {
    id: 'highlight-5',
    title: 'Packed Arena Booster Section Celebrates Victory',
    caption: 'Over 8,500 collegiate fans erupt in unison following the decisive 5th set tiebreak rally.',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1400&q=80',
    tag: 'Fan Zone',
    date: 'Arena 1',
  },
];

export function getStoredHighlights(): EventHighlight[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(EVENT_HIGHLIGHTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse highlights from localStorage', e);
  }
  return DEFAULT_EVENT_HIGHLIGHTS;
}

export function saveStoredHighlights(highlights: EventHighlight[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(EVENT_HIGHLIGHTS_STORAGE_KEY, JSON.stringify(highlights));
    }
  } catch (e) {
    console.error('Failed to save highlights to localStorage', e);
  }
}

interface EventHighlightsProps {
  isAdminLoggedIn?: boolean;
  onOpenLogin?: () => void;
}

export const EventHighlights: React.FC<EventHighlightsProps> = ({
  isAdminLoggedIn = false,
  onOpenLogin,
}) => {
  const [highlights, setHighlights] = useState<EventHighlight[]>(() => getStoredHighlights());
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [loopIntervalMs, setLoopIntervalMs] = useState<number>(4500);

  // Admin Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHighlight, setEditingHighlight] = useState<EventHighlight | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formTag, setFormTag] = useState('Championship');
  const [formDate, setFormDate] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Auto-advance loop
  useEffect(() => {
    if (!isPlaying || highlights.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % highlights.length);
    }, loopIntervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, highlights.length, loopIntervalMs]);

  // Ensure index is in bounds
  useEffect(() => {
    if (currentIndex >= highlights.length && highlights.length > 0) {
      setCurrentIndex(0);
    }
  }, [highlights.length, currentIndex]);

  const handleNext = () => {
    if (highlights.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % highlights.length);
  };

  const handlePrev = () => {
    if (highlights.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + highlights.length) % highlights.length);
  };

  const handleOpenAdd = () => {
    if (!isAdminLoggedIn && onOpenLogin) {
      onOpenLogin();
      return;
    }
    setEditingHighlight(null);
    setFormTitle('');
    setFormCaption('');
    setFormImageUrl('');
    setFormTag('Championship Highlight');
    setFormDate(new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: EventHighlight) => {
    if (!isAdminLoggedIn && onOpenLogin) {
      onOpenLogin();
      return;
    }
    setEditingHighlight(h);
    setFormTitle(h.title);
    setFormCaption(h.caption || '');
    setFormImageUrl(h.imageUrl);
    setFormTag(h.tag || 'Highlight');
    setFormDate(h.date || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, title: string) => {
    if (!isAdminLoggedIn && onOpenLogin) {
      onOpenLogin();
      return;
    }
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (!window.confirm(`Delete photo highlight "${title}"?`)) return;
    }
    const updated = highlights.filter((h) => h.id !== id);
    setHighlights(updated);
    saveStoredHighlights(updated);
    showToast('Photo highlight removed from gallery.');
  };

  const handleResetDefaults = () => {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (!window.confirm('Reset event highlights back to default tournament photos?')) return;
    }
    setHighlights(DEFAULT_EVENT_HIGHLIGHTS);
    saveStoredHighlights(DEFAULT_EVENT_HIGHLIGHTS);
    setCurrentIndex(0);
    showToast('Default event highlights restored.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo is too large (max 5MB). Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setFormImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formImageUrl.trim()) {
      alert('Please upload an image file or paste an image URL.');
      return;
    }
    if (!formTitle.trim()) {
      alert('Please enter a title for the highlight photo.');
      return;
    }

    if (editingHighlight) {
      // Update existing
      const updatedList = highlights.map((h) =>
        h.id === editingHighlight.id
          ? {
              ...h,
              title: formTitle.trim(),
              caption: formCaption.trim() || undefined,
              imageUrl: formImageUrl.trim(),
              tag: formTag.trim() || undefined,
              date: formDate.trim() || undefined,
            }
          : h
      );
      setHighlights(updatedList);
      saveStoredHighlights(updatedList);
      showToast(`Highlight photo updated!`);
    } else {
      // Add new
      const newH: EventHighlight = {
        id: `hl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: formTitle.trim(),
        caption: formCaption.trim() || undefined,
        imageUrl: formImageUrl.trim(),
        tag: formTag.trim() || 'Highlight',
        date: formDate.trim() || new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      };
      const updatedList = [newH, ...highlights];
      setHighlights(updatedList);
      saveStoredHighlights(updatedList);
      setCurrentIndex(0);
      showToast(`New highlight photo added to the live loop!`);
    }

    setIsModalOpen(false);
  };

  const activeHighlight = highlights[currentIndex] || highlights[0];

  return (
    <section className="space-y-4 my-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl backdrop-blur-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-[#f97316] p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#10131a] rounded-[10px] flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-black text-xl sm:text-2xl text-white uppercase tracking-wider">
                Event Highlights &amp; Gallery
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                {isPlaying ? 'LOOP ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-[#94a3b8]">
              Official championship action photography, clutch spikes, and court celebrations
            </p>
          </div>
        </div>

        {/* Carousel & Admin Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Loop Play/Pause */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-colors active:scale-95"
            title={isPlaying ? 'Pause auto-rotating photo loop' : 'Resume auto-rotating photo loop'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Admin Add Photo */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white text-xs font-bold uppercase tracking-wider shadow glow-blue transition-all active:scale-95"
            title="Upload and add new highlight photo to carousel"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>

          {isAdminLoggedIn && (
            <button
              type="button"
              onClick={handleResetDefaults}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 text-xs transition-colors"
              title="Reset to Championship Photo Defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Highlights Showcase Box */}
      {highlights.length === 0 ? (
        <div className="glass-panel text-center py-16 p-6 rounded-3xl border border-white/10 space-y-3">
          <ImageIcon className="w-12 h-12 text-white/30 mx-auto" />
          <h3 className="font-heading font-black text-xl text-white uppercase">No Highlights Uploaded Yet</h3>
          <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
            Upload tournament photos, action captures, and court memories to start the auto-advancing showcase loop.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase"
          >
            + Upload First Highlight
          </button>
        </div>
      ) : (
        <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/15 shadow-2xl group">
          {/* Main Visual Display */}
          <div className="relative h-72 sm:h-96 md:h-[420px] w-full bg-black/60 overflow-hidden">
            <img
              src={activeHighlight.imageUrl}
              alt={activeHighlight.title}
              className="w-full h-full object-cover object-center transition-all duration-700 transform scale-100 group-hover:scale-105"
            />

            {/* Gradient Overlays for Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] via-[#0b0e14]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e14]/70 via-transparent to-transparent hidden sm:block" />

            {/* Top Badge Info */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <span className="px-3 py-1 rounded-full text-[11px] font-heading font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-amber-400 border border-amber-400/40 shadow-lg flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-amber-400" />
                  {activeHighlight.tag || 'Highlight'}
                </span>
                {activeHighlight.date && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono text-white/80 bg-black/50 backdrop-blur-md border border-white/10 hidden sm:inline-flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {activeHighlight.date}
                  </span>
                )}
              </div>

              {/* Slide Counter */}
              <div className="px-3 py-1 rounded-full text-[11px] font-mono font-bold text-white bg-black/70 backdrop-blur-md border border-white/20">
                {currentIndex + 1} / {highlights.length}
              </div>
            </div>

            {/* Left & Right Navigation Arrows */}
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 hover:border-cyan-400 flex items-center justify-center transition-all active:scale-90 shadow-xl opacity-80 group-hover:opacity-100 z-10"
              title="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 hover:border-cyan-400 flex items-center justify-center transition-all active:scale-90 shadow-xl opacity-80 group-hover:opacity-100 z-10"
              title="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Caption & Title Bottom Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 z-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <h3 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-white uppercase tracking-wide drop-shadow-md">
                    {activeHighlight.title}
                  </h3>
                  {activeHighlight.caption && (
                    <p className="text-xs sm:text-sm text-white/90 leading-relaxed drop-shadow-sm font-medium">
                      {activeHighlight.caption}
                    </p>
                  )}
                </div>

                {/* Admin Quick Modification Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(activeHighlight)}
                    className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-heading font-bold uppercase tracking-wider border border-white/30 flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                    title="Edit or change this photo"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Change Image</span>
                  </button>

                  <button
                    onClick={() => handleDelete(activeHighlight.id, activeHighlight.title)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 backdrop-blur-md text-rose-200 text-xs font-heading font-bold uppercase tracking-wider border border-rose-500/40 flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                    title="Remove this photo"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filmstrip Thumbnails & Slide Indicators */}
          <div className="p-3 sm:p-4 bg-[#0b0e14]/90 border-t border-white/10 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {highlights.map((h, idx) => (
                <button
                  key={h.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-7 bg-gradient-to-r from-amber-400 to-[#f97316]'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  title={`Jump to photo ${idx + 1}: ${h.title}`}
                />
              ))}
            </div>

            {/* Thumbnail preview row */}
            <div className="flex items-center gap-2">
              {highlights.map((h, idx) => (
                <button
                  key={h.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-12 sm:w-14 h-8 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    idx === currentIndex
                      ? 'border-[#38bdf8] scale-105 shadow-md shadow-cyan-500/30'
                      : 'border-white/15 opacity-60 hover:opacity-90'
                  }`}
                  title={h.title}
                >
                  <img src={h.imageUrl} alt={h.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Upload / Edit Photo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg glass-panel-elevated p-6 rounded-3xl border border-white/20 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#f97316] p-0.5">
                <div className="w-full h-full bg-[#10131a] rounded-[10px] flex items-center justify-center text-white">
                  <Camera className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                  {editingHighlight ? 'Change / Edit Highlight Photo' : 'Upload New Event Photo'}
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Add or update images for the live looping home showcase
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveHighlight} className="space-y-4">
              {/* Image Upload Area & Preview */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                  Photo Source (File Upload or Web URL) *
                </label>

                {formImageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-white/20 h-44 bg-black/50 mb-3 group">
                    <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold uppercase"
                      >
                        Replace File
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 text-xs font-bold uppercase"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 hover:border-cyan-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white/5 hover:bg-white/10 mb-3"
                  >
                    <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <span className="text-xs font-bold text-white block uppercase">Click to upload photo from device</span>
                    <span className="text-[11px] text-[#94a3b8] block mt-1">PNG, JPG, WebP up to 5MB</span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Direct URL Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="Or paste direct image URL (https://...)"
                    className="flex-1 px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-cyan-400 outline-none font-mono"
                  />
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="px-2.5 py-2 rounded-xl bg-white/5 text-white/50 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                  Highlight Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Elena Rostova Game-Winning Spike"
                  className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white font-bold focus:border-cyan-400 outline-none"
                  required
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                  Description / Caption
                </label>
                <textarea
                  rows={2}
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  placeholder="Brief description of the play or celebration..."
                  className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-cyan-400 outline-none"
                />
              </div>

              {/* Category Tag & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                    Event Tag
                  </label>
                  <select
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-cyan-400 outline-none"
                  >
                    <option value="VNL Volleyball">VNL Volleyball</option>
                    <option value="FIBA Basketball">FIBA Basketball</option>
                    <option value="Championship Point">Championship Point</option>
                    <option value="Monster Block">Monster Block</option>
                    <option value="Slam Dunk">Slam Dunk</option>
                    <option value="Trophy Celebration">Trophy Celebration</option>
                    <option value="Fan Zone">Fan Zone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                    Period / Time / Stage
                  </label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="e.g. Set 5 · 15-14"
                    className="w-full px-3 py-2 bg-[#0b0e14] border border-white/15 rounded-xl text-xs text-white focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white text-xs font-heading font-black uppercase tracking-wider shadow-lg glow-blue transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingHighlight ? 'Save Photo Changes' : 'Upload to Loop'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
