import React, { useRef, useState } from 'react';
import {
  Upload,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Scissors,
  Search,
  Loader2,
  Layers,
  X,
  ArrowUp,
  ArrowDown,
  Type as TypeIcon,
  FolderOpen,
  UserCheck,
  Subtitles,
  RotateCcw,
  Smile,
  ChevronDown,
  ChevronUp,
  Settings,
  Move,
  LayoutGrid,
  Edit3,
  Volume2,
  Wrench,
  FileText,
  Clock,
  Columns,
  Copy,
} from 'lucide-react';
import {
  CaptionSegment,
  CaptionStyleConfig,
  LineStyleOverride,
  SampleReel,
  StylePreset,
  TrackKey,
  WordTiming,
} from '../types/caption';
import {
  AVAILABLE_FONTS,
  INDIAN_LANGUAGE_MATRIX,
  SAMPLE_REELS,
} from '../data/presetsAndLanguages';
import {
  KALAKAR_48_BUILT_IN_PRESETS,
  KALAKAR_FONT_FACES,
} from '../data/kalakarOptionsData';
import { KalakarShellView } from './KalakarAppShellModals';
import { playOpenSourceSoundEffect } from '../utils/soundEffectsEngine';

export type LeftRailTool = 'captions' | 'masking' | 'custom-fonts' | 'library';

export type CaptionToolBulkAction =
  | 'remove-punctuation'
  | 'restore-punctuation'
  | 'remove-emphasis'
  | 'restore-emphasis'
  | 'remove-gaps'
  | 'restore-gaps'
  | 'remove-emojis'
  | 'auto-add-emojis'
  | 'regroup-words';

interface TranscriptLanguagePanelProps {
  segments: CaptionSegment[];
  currentTime: number;
  duration: number;
  styleConfig: CaptionStyleConfig;
  activeSampleReel: SampleReel;
  uploadedVideoName: string | null;
  detectedLanguage: string;
  isTranscribing: boolean;
  transcribeStage?: string;
  translatingTrack: TrackKey | null;
  isRewriting: boolean;
  sourceLanguageHint: string;
  onSourceLanguageHintChange: (hint: string) => void;
  onUploadFile: (file: File, openPrepareDialog?: boolean) => void;
  onStartCameraRecord: () => void;
  onSelectSampleReel: (sample: SampleReel) => void;
  onGenerateCaptionsNow: () => void;
  onSelectPrimaryTrack: (track: TrackKey) => void;
  onSelectSecondaryTrack: (track: TrackKey) => void;
  onToggleDisplayMode: (mode: 'single' | 'dual-stacked') => void;
  onSeekTo: (time: number) => void;
  onUpdateSegmentText: (segmentId: string, track: TrackKey, newText: string) => void;
  onToggleWordHero: (segmentId: string, track: TrackKey, wordIndex: number) => void;
  onSetSegmentHeroMode?: (
    segmentId: string,
    track: TrackKey,
    mode: 'longest' | 'last' | 'first' | 'all' | 'clear'
  ) => void;
  onMoveSegmentOrder?: (segmentId: string, direction: 'up' | 'down') => void;
  onDuplicateSegment?: (segmentId: string) => void;
  onQuickScreenPosition?: (posX: number, posY: number) => void;
  onUpdateSegmentTiming: (segmentId: string, startTime: number, endTime: number) => void;
  onSplitSegment: (segmentId: string) => void;
  onAddSegment: () => void;
  onDeleteSegment: (segmentId: string) => void;
  onRewriteTrackTone: (toneInstruction: string) => void;
  autoHeroNLP: boolean;
  onToggleAutoHeroNLP: () => void;
  isRunningAutoHero: boolean;
  onRunAutoHeroNLP: () => void;
  autoSyncDialogue: boolean;
  onToggleAutoSyncDialogue: () => void;
  onSyncToVoiceNow: () => void;
  onTapSyncActiveToPlayhead: () => void;
  onNudgeDialogueTiming: (offsetSeconds: number, speedScale?: number) => void;
  onUpdateSegmentMeta?: (segmentId: string, partial: Partial<CaptionSegment>) => void;
  onUpdateWordStyle?: (
    segmentId: string,
    track: TrackKey,
    wordIndex: number,
    partial: Partial<WordTiming>
  ) => void;
  onApplyCaptionToolAction?: (
    action: CaptionToolBulkAction,
    payload?: { wordsPerLine?: number; maxCharsPerLine?: number }
  ) => void;
  onUpdateStyle?: (partial: Partial<CaptionStyleConfig>) => void;
  presets?: StylePreset[];
  customFonts?: string[];
  onUploadCustomFont?: (file: File) => void;
  onOpenPrepareMedia?: () => void;
  onOpenShellHub?: (view: KalakarShellView) => void;
  focusedSection?: 'workspace' | 'languages' | 'style' | 'export';
}

export const TranscriptLanguagePanel: React.FC<TranscriptLanguagePanelProps> = ({
  segments,
  currentTime,
  styleConfig,
  activeSampleReel,
  uploadedVideoName,
  translatingTrack,
  onUploadFile,
  onSelectSampleReel,
  onSelectPrimaryTrack,
  onSeekTo,
  onUpdateSegmentText,
  onToggleWordHero,
  onSplitSegment,
  onAddSegment,
  onDeleteSegment,
  onNudgeDialogueTiming,
  onUpdateSegmentMeta,
  onUpdateWordStyle,
  onApplyCaptionToolAction,
  onUpdateStyle,
  presets = [],
  customFonts = [],
  onUploadCustomFont,
  onOpenPrepareMedia,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fontInputRef = useRef<HTMLInputElement | null>(null);
  const captionsScrollRef = useRef<HTMLDivElement | null>(null);

  const [activeRailTool, setActiveRailTool] = useState<LeftRailTool>('captions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isCaptionToolsOpen, setIsCaptionToolsOpen] = useState<boolean>(false);
  const [isLanguagePopoverOpen, setIsLanguagePopoverOpen] = useState<boolean>(false);
  const [isCaptionsSectionMinimized, setIsCaptionsSectionMinimized] =
    useState<boolean>(false);

  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [lineStylePopupSegId, setLineStylePopupSegId] = useState<string | null>(null);
  const [lineTemplateSearch, setLineTemplateSearch] = useState<string>('');
  const [selectedWordRef, setSelectedWordRef] = useState<{
    segmentId: string;
    wordIndex: number;
  } | null>(null);
  const [contextMenuState, setContextMenuState] = useState<{
    x: number;
    y: number;
    segmentId?: string;
    wordIndex?: number;
  } | null>(null);
  const [wordsPerLineSelectValue, setWordsPerLineSelectValue] =
    useState<string>('default');

  const scrollCaptionsList = (deltaY: number) => {
    if (captionsScrollRef.current) {
      captionsScrollRef.current.scrollBy({ top: deltaY, behavior: 'smooth' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file, true);
    }
    e.target.value = '';
  };

  const handleFontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadCustomFont) {
      onUploadCustomFont(file);
    }
    e.target.value = '';
  };

  const primaryMeta =
    INDIAN_LANGUAGE_MATRIX.find((l) => l.key === styleConfig.primaryTrack) ||
    INDIAN_LANGUAGE_MATRIX[0];

  const filteredSegments = segments.filter((seg) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const pText = seg.tracks[styleConfig.primaryTrack]?.text?.toLowerCase() || '';
    const eText = seg.tracks.english?.text?.toLowerCase() || '';
    return pText.includes(q) || eText.includes(q);
  });

  const allTemplates = [...presets, ...KALAKAR_48_BUILT_IN_PRESETS];
  const filteredLineTemplates = allTemplates.filter((t) =>
    t.name.toLowerCase().includes(lineTemplateSearch.toLowerCase())
  );

  return (
    <div className="flex-1 min-h-0 flex gap-2 p-2 pb-1.5 select-none overflow-hidden bg-[#0A0A0D]">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/*,audio/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={fontInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        onChange={handleFontFileChange}
        className="hidden"
      />

      {/* LEFT VERTICAL TOOL RAIL (Exact Kalakar Studio Rail: Captions, Masking, Custom Fonts, Library) */}
      <div className="w-[72px] shrink-0 bg-[#141418] border border-white/[0.06] rounded-xl py-2.5 px-1.5 flex flex-col items-center gap-2">
        {(
          [
            { id: 'captions', label: 'Captions', icon: Subtitles },
            { id: 'masking', label: 'Masking', icon: UserCheck },
            { id: 'custom-fonts', label: 'Custom\nFonts', icon: TypeIcon },
            { id: 'library', label: 'Library', icon: FolderOpen },
          ] as { id: LeftRailTool; label: string; icon: React.ElementType }[]
        ).map((item) => {
          const Icon = item.icon;
          const active = activeRailTool === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveRailTool(item.id)}
              className={`w-full py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                active
                  ? 'bg-[#172A21] text-[#2BAE66] border border-[#2BAE66]/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-medium leading-tight text-center whitespace-pre-line">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* MAIN LEFT PANEL CONTAINER */}
      <div className="flex-1 min-w-0 bg-[#121216] border border-white/[0.06] rounded-xl flex flex-col overflow-hidden relative">
        {/* RAIL VIEW: MASKING */}
        {activeRailTool === 'masking' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Depth Masking (Put Captions Behind Subject)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Place large hero words behind the speaker or apply studio gradient vignettes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveRailTool('captions')}
                className="px-2.5 py-1 rounded-lg bg-[#1E1E24] text-zinc-300 hover:text-white text-[11px] cursor-pointer"
              >
                Back to Captions
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'none', label: 'No Mask (Standard)' },
                  { id: 'bottom-cinema', label: 'Bottom Cinema Fade' },
                  { id: 'linear-top-bottom', label: 'Linear Top → Bottom' },
                  { id: 'circle-radial', label: 'Radial Subject Spotlight' },
                ] as const
              ).map((m) => {
                const isOn = (styleConfig.maskMode || 'none') === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onUpdateStyle?.({ maskMode: m.id })}
                    className={`p-3 rounded-xl border text-left font-semibold cursor-pointer transition-all ${
                      isOn
                        ? 'bg-[#152C21] border-[#2BAE66] text-[#34D399]'
                        : 'bg-[#18181E] border-white/[0.06] text-zinc-300 hover:border-white/15'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* RAIL VIEW: CUSTOM FONTS */}
        {activeRailTool === 'custom-fonts' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Custom Brand Fonts</h3>
                <p className="text-[11px] text-zinc-400">
                  Upload .TTF, .OTF, or .WOFF2 fonts for Telugu, Hindi, or English titles
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveRailTool('captions')}
                className="px-2.5 py-1 rounded-lg bg-[#1E1E24] text-zinc-300 hover:text-white text-[11px] cursor-pointer"
              >
                Back to Captions
              </button>
            </div>

            <button
              type="button"
              onClick={() => fontInputRef.current?.click()}
              className="w-full py-6 rounded-xl border border-dashed border-[#2BAE66]/50 bg-[#15261E]/40 hover:bg-[#15261E]/70 text-white font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Upload className="w-5 h-5 text-[#34D399]" />
              <span>Upload Font File (.TTF, .OTF, .WOFF2)</span>
            </button>

            {customFonts.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-zinc-400">
                  Uploaded Fonts ({customFonts.length})
                </div>
                {customFonts.map((fn) => (
                  <div
                    key={fn}
                    className="p-2.5 rounded-xl bg-[#18181E] border border-white/[0.06] flex items-center justify-between"
                  >
                    <span className="text-white font-semibold">{fn}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStyle?.({
                          fontFamily: fn,
                          heroWordFontFamily: fn,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#2BAE66] text-white text-[10px] font-semibold cursor-pointer"
                    >
                      Apply Font
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RAIL VIEW: LIBRARY (Upload Video, Switch Sample Reels, 101 Languages) */}
        {activeRailTool === 'library' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Media Library &amp; 101 Languages
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Upload MP4/MOV video or switch built-in sample reels
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveRailTool('captions')}
                className="px-2.5 py-1 rounded-lg bg-[#1E1E24] text-zinc-300 hover:text-white text-[11px] cursor-pointer"
              >
                Back to Captions
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 rounded-xl bg-[#2BAE66] hover:bg-[#249657] text-white font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Video (MP4/MOV)</span>
              </button>
              {onOpenPrepareMedia && (
                <button
                  type="button"
                  onClick={onOpenPrepareMedia}
                  className="p-3.5 rounded-xl bg-[#1C1C22] hover:bg-[#25252E] border border-white/10 text-zinc-100 font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#34D399]" />
                  <span>Prepare Media (101 Langs)</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold text-zinc-400">
                Built-In Sample Videos
              </div>
              {SAMPLE_REELS.map((s) => {
                const isSelected = !uploadedVideoName && activeSampleReel.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onSelectSampleReel(s);
                      setActiveRailTool('captions');
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#152C21] border-[#2BAE66] text-white'
                        : 'bg-[#18181E] border-white/[0.06] text-zinc-300 hover:border-white/15'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white">{s.title}</div>
                      <div className="text-[10px] text-[#34D399]">{s.dialect}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#34D399]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* RAIL VIEW: CAPTIONS (Exact Kalakar Minimal Header + Single-Row Numbered Lines) */}
        {activeRailTool === 'captions' && (
          <>
            {/* TOP HEADER BAR: "Captions" on left | Search Circle + "Caption Tools v" Pill on right */}
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between gap-2 shrink-0 relative">
              <div className="flex items-center gap-2.5 min-w-0">
                <h2 className="text-[17px] font-bold text-white tracking-tight">
                  Captions
                </h2>

                {/* Subtle Language Switcher Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setIsLanguagePopoverOpen((v) => !v);
                    setIsCaptionToolsOpen(false);
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#1C1C22] hover:bg-[#25252D] border border-white/[0.08] text-[11px] font-medium text-zinc-300 flex items-center gap-1 cursor-pointer"
                  title="Switch Caption Language / Script (21+ Desi Languages)"
                >
                  <span>{primaryMeta.shortLabel}</span>
                  {translatingTrack && (
                    <Loader2 className="w-3 h-3 animate-spin text-[#34D399]" />
                  )}
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Scroll Up / Down Quick Buttons + Minimize */}
                {!isCaptionsSectionMinimized && (
                  <div className="hidden sm:flex items-center gap-1 mr-1">
                    <button
                      type="button"
                      onClick={() => scrollCaptionsList(-200)}
                      title="Scroll Captions Up"
                      className="w-7 h-7 rounded-full bg-[#1B1B21] hover:bg-[#25252E] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCaptionsList(200)}
                      title="Scroll Captions Down"
                      className="w-7 h-7 rounded-full bg-[#1B1B21] hover:bg-[#25252E] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Search Circle Icon Button (Exact match to screenshot) */}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen((v) => !v)}
                  title="Search captions"
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                    isSearchOpen || searchQuery
                      ? 'bg-[#172A21] border-[#2BAE66]/50 text-[#34D399]'
                      : 'bg-[#1B1B21] hover:bg-[#25252D] border-white/[0.08] text-zinc-300'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                </button>

                {/* "Caption Tools v" Rounded Pill Button (Exact match to screenshot — supports left-click & right-click) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCaptionToolsOpen((v) => !v);
                    setContextMenuState(null);
                    setIsLanguagePopoverOpen(false);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsCaptionToolsOpen(true);
                    setContextMenuState(null);
                    setIsLanguagePopoverOpen(false);
                  }}
                  title="Click or Right-Click for Caption Tools & Options"
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCaptionToolsOpen
                      ? 'bg-[#172A21] border-[#2BAE66]/60 text-white shadow-sm'
                      : 'bg-[#1B1B21] hover:bg-[#25252D] border-white/[0.08] text-zinc-200'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5 text-[#2BAE66]" />
                  <span>Caption Tools</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {/* Minimize / Expand Captions List Button */}
                <button
                  type="button"
                  onClick={() => setIsCaptionsSectionMinimized((v) => !v)}
                  title={
                    isCaptionsSectionMinimized
                      ? 'Expand Captions List'
                      : 'Minimize Captions List'
                  }
                  className="w-7 h-7 rounded-full bg-[#1B1B21] hover:bg-[#25252D] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                >
                  {isCaptionsSectionMinimized ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* POPOVER 1: LANGUAGE SWITCHER (21+ Desi Languages + Roman vs Native Script) */}
              {isLanguagePopoverOpen && (
                <div className="absolute top-12 left-4 z-40 w-80 p-3 rounded-2xl bg-[#18181E] border border-white/15 shadow-2xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="font-bold text-white">
                      Select Caption Language / Script
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLanguagePopoverOpen(false)}
                      className="text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 max-h-52 overflow-y-auto pr-1">
                    {INDIAN_LANGUAGE_MATRIX.map((lang) => {
                      const active = styleConfig.primaryTrack === lang.key;
                      return (
                        <button
                          key={lang.key}
                          type="button"
                          onClick={() => {
                            onSelectPrimaryTrack(lang.key);
                            setIsLanguagePopoverOpen(false);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium truncate cursor-pointer border ${
                            active
                              ? 'bg-[#172A21] border-[#2BAE66] text-[#34D399] font-semibold'
                              : 'bg-[#121216] border-white/[0.06] text-zinc-300 hover:text-white'
                          }`}
                        >
                          {lang.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                  {onOpenPrepareMedia && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsLanguagePopoverOpen(false);
                        onOpenPrepareMedia();
                      }}
                      className="w-full py-1.5 rounded-lg bg-[#2BAE66] text-white font-semibold text-[11px] cursor-pointer"
                    >
                      Open All 101 Languages &amp; Script Settings
                    </button>
                  )}
                </div>
              )}

              {/* POPOVER 2: KALAKAR "CAPTION TOOLS" MENU (Exact match to Image 2: Screenshot 2026-10-15 at 12.08.45 PM.png) */}
              {(isCaptionToolsOpen || contextMenuState !== null) && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-12 right-3 z-50 w-[340px] max-h-[calc(100vh-140px)] overflow-y-auto p-4 rounded-2xl bg-[#18181F] border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.85)] space-y-3.5 text-xs"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-[#2BAE66]" />
                        <span className="text-sm font-bold text-white">
                          Caption Tools
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Customize how captions appear and behave
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCaptionToolsOpen(false);
                        setContextMenuState(null);
                      }}
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Contextual Line / Word Quick Actions when Right-Clicked on a Caption Line */}
                  {contextMenuState?.segmentId && (() => {
                    const targetSeg = segments.find(
                      (s) => s.id === contextMenuState.segmentId
                    );
                    if (!targetSeg) return null;
                    const segNum =
                      targetSeg.displayLineNumber ??
                      segments.findIndex((s) => s.id === targetSeg.id) + 1;
                    return (
                      <div className="p-2.5 rounded-xl bg-[#13261D] border border-[#2BAE66]/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#34D399]">
                            Line #{segNum} Quick Actions
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {targetSeg.startTime.toFixed(1)}s – {targetSeg.endTime.toFixed(1)}s
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSegmentId(targetSeg.id);
                              setContextMenuState(null);
                              setIsCaptionToolsOpen(false);
                            }}
                            className="px-2 py-1.5 rounded-lg bg-[#1C1C24] hover:bg-[#2BAE66] text-white text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Text</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSplitSegment(targetSeg.id);
                              setContextMenuState(null);
                            }}
                            className="px-2 py-1.5 rounded-lg bg-[#1C1C24] hover:bg-[#2BAE66] text-white text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Scissors className="w-3 h-3" />
                            <span>Split Line</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteSegment(targetSeg.id);
                              setContextMenuState(null);
                            }}
                            className="px-2 py-1.5 rounded-lg bg-[#2A171B] hover:bg-rose-600 text-rose-200 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Section 1: DISPLAY SETTINGS (Words dropdown, Max Chars input + reset, Lines dropdown) */}
                  <div className="space-y-2.5">
                    <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
                      DISPLAY SETTINGS
                    </div>

                    {/* Words dropdown: Default, 1 Word, 2 Words, 3 Words, 4 Words, 5 Words */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-zinc-200">
                        <FileText className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs font-medium">Words</span>
                      </div>
                      <select
                        value={wordsPerLineSelectValue}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setWordsPerLineSelectValue(raw);
                          const numericWords =
                            raw === 'default' ? 4 : parseInt(raw, 10) || 4;
                          onUpdateStyle?.({ wordsPerLine: numericWords });
                          onApplyCaptionToolAction?.('regroup-words', {
                            wordsPerLine: numericWords,
                            maxCharsPerLine: styleConfig.maxCharsPerLine ?? 24,
                          });
                        }}
                        className="w-36 bg-[#22222A] hover:bg-[#282832] text-white text-xs font-medium px-2.5 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#2BAE66] cursor-pointer"
                      >
                        <option value="default">Default</option>
                        <option value="1">1 Word</option>
                        <option value="2">2 Words</option>
                        <option value="3">3 Words</option>
                        <option value="4">4 Words</option>
                        <option value="5">5 Words</option>
                      </select>
                    </div>

                    {/* Max Chars number input (default 24) + Reset button */}
                    <div className="flex items-center justify-between gap-2 pl-5">
                      <span className="text-xs font-medium text-zinc-200">
                        Max Chars
                      </span>
                      <div className="flex items-center gap-1.5 w-36">
                        <input
                          type="number"
                          min={8}
                          max={60}
                          value={styleConfig.maxCharsPerLine ?? 24}
                          onChange={(e) => {
                            const nextChars = Math.max(
                              8,
                              parseInt(e.target.value, 10) || 24
                            );
                            onUpdateStyle?.({ maxCharsPerLine: nextChars });
                            onApplyCaptionToolAction?.('regroup-words', {
                              wordsPerLine: styleConfig.wordsPerLine ?? 4,
                              maxCharsPerLine: nextChars,
                            });
                          }}
                          className="flex-1 min-w-0 bg-[#22222A] text-white text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#2BAE66]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateStyle?.({ maxCharsPerLine: 24 });
                            onApplyCaptionToolAction?.('regroup-words', {
                              wordsPerLine: styleConfig.wordsPerLine ?? 4,
                              maxCharsPerLine: 24,
                            });
                          }}
                          className="p-1.5 rounded-lg bg-[#22222A] hover:bg-[#2B2B35] border border-white/10 text-zinc-400 hover:text-white cursor-pointer shrink-0"
                          title="Reset Max Chars to 24"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Lines dropdown: 1 Line, 2 Lines, 3 Lines, 4 Lines, 5 Lines */}
                    <div className="flex items-center justify-between gap-2 pl-5">
                      <span className="text-xs font-medium text-zinc-200">Lines</span>
                      <select
                        value={styleConfig.maxLinesPerCaption ?? 1}
                        onChange={(e) => {
                          const ln = parseInt(e.target.value, 10) || 1;
                          onUpdateStyle?.({
                            maxLinesPerCaption: ln,
                            smallTwoLineMode:
                              ln === 1 ? 'single-line' : 'two-line-split',
                          });
                        }}
                        className="w-36 bg-[#22222A] hover:bg-[#282832] text-white text-xs font-medium px-2.5 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#2BAE66] cursor-pointer"
                      >
                        <option value={1}>1 Line</option>
                        <option value={2}>2 Lines</option>
                        <option value={3}>3 Lines</option>
                        <option value={4}>4 Lines</option>
                        <option value={5}>5 Lines</option>
                      </select>
                    </div>
                  </div>

                  {/* Section 2: ACTIONS (4 Kalakar Action Cards with Descriptions & Toggles) */}
                  <div className="space-y-2 pt-3 border-t border-white/[0.08]">
                    <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
                      ACTIONS
                    </div>

                    {(
                      [
                        {
                          key: 'removePunctuation',
                          onAction: 'remove-punctuation' as CaptionToolBulkAction,
                          offAction: 'restore-punctuation' as CaptionToolBulkAction,
                          label: 'Remove Punctuation',
                          desc: 'Strip all punctuation for a minimal look',
                          icon: TypeIcon,
                        },
                        {
                          key: 'removeEmphasis',
                          onAction: 'remove-emphasis' as CaptionToolBulkAction,
                          offAction: 'restore-emphasis' as CaptionToolBulkAction,
                          label: 'Remove Emphasis',
                          desc: 'Remove all text emphasis for uniform appearance',
                          icon: Sparkles,
                        },
                        {
                          key: 'removeGaps',
                          onAction: 'remove-gaps' as CaptionToolBulkAction,
                          offAction: 'restore-gaps' as CaptionToolBulkAction,
                          label: 'Remove Gaps in Captions',
                          desc: 'Eliminate gaps between captions for seamless flow',
                          icon: Columns,
                        },
                        {
                          key: 'removeEmojis',
                          onAction: 'remove-emojis' as CaptionToolBulkAction,
                          offAction: 'auto-add-emojis' as CaptionToolBulkAction,
                          label: 'Remove Emojis',
                          desc: 'Remove all emojis from captions',
                          icon: Smile,
                        },
                      ] as const
                    ).map((item) => {
                      const Icon = item.icon;
                      const isOn = Boolean(styleConfig[item.key]);
                      return (
                        <div
                          key={item.key}
                          onClick={() => {
                            const nextState = !isOn;
                            onUpdateStyle?.({ [item.key]: nextState });
                            onApplyCaptionToolAction?.(
                              nextState ? item.onAction : item.offAction
                            );
                          }}
                          className="p-2.5 rounded-xl bg-[#202028] hover:bg-[#25252F] border border-white/[0.06] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#16161C] border border-white/[0.06] flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white leading-snug">
                                {item.label}
                              </div>
                              <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                                {item.desc}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextState = !isOn;
                              onUpdateStyle?.({ [item.key]: nextState });
                              onApplyCaptionToolAction?.(
                                nextState ? item.onAction : item.offAction
                              );
                            }}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                              isOn ? 'bg-[#2BAE66]' : 'bg-zinc-700'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                isOn ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}

                    {/* AI Subject Depth Mask Card (Place Captions Behind Speaker's Head) */}
                    <div
                      onClick={() => {
                        const nextDepth = !styleConfig.captionDepthBehindSubject;
                        onUpdateStyle?.({
                          captionDepthBehindSubject: nextDepth,
                          ...(nextDepth ? { positionY: 31 } : {}),
                        });
                      }}
                      className="p-2.5 rounded-xl bg-[#162720] hover:bg-[#1B3128] border border-[#2BAE66]/40 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#111F19] border border-[#2BAE66]/40 flex items-center justify-center text-[#34D399] shrink-0 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white leading-snug">
                            Placed Caption Behind Subject (Depth Mask)
                          </div>
                          <div className="text-[10px] text-[#34D399]/90 leading-tight mt-0.5">
                            Real-time AI person cutout places text behind speaker&apos;s head
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextDepth = !styleConfig.captionDepthBehindSubject;
                          onUpdateStyle?.({
                            captionDepthBehindSubject: nextDepth,
                            ...(nextDepth ? { positionY: 31 } : {}),
                          });
                        }}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                          styleConfig.captionDepthBehindSubject
                            ? 'bg-[#2BAE66]'
                            : 'bg-zinc-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            styleConfig.captionDepthBehindSubject
                              ? 'translate-x-4'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Section 3: TIMING — Caption Delay Control (-5s to +5s) */}
                  <div className="space-y-2 pt-3 border-t border-white/[0.08]">
                    <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
                      TIMING
                    </div>

                    <div className="p-3 rounded-xl bg-[#202028] border border-white/[0.06] space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Clock className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-white leading-tight">
                              Caption Delay Control
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                              Shift all captions earlier or later
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#15151B] border border-white/10 font-mono tabular-nums text-[10px] text-zinc-300 shrink-0">
                          {Math.abs(styleConfig.captionDelaySeconds || 0) < 0.05
                            ? 'No delay'
                            : `${(styleConfig.captionDelaySeconds || 0) > 0 ? '+' : ''}${(
                                styleConfig.captionDelaySeconds || 0
                              ).toFixed(1)}s`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-mono text-zinc-500">
                          -5s
                        </span>
                        <input
                          type="range"
                          min={-5}
                          max={5}
                          step={0.1}
                          value={styleConfig.captionDelaySeconds ?? 0}
                          onChange={(e) => {
                            const nextDelay = parseFloat(e.target.value);
                            const prevDelay =
                              styleConfig.captionDelaySeconds ?? 0;
                            const delta = nextDelay - prevDelay;
                            onUpdateStyle?.({ captionDelaySeconds: nextDelay });
                            if (Math.abs(delta) > 0.01) {
                              onNudgeDialogueTiming(delta, 1);
                            }
                          }}
                          className="flex-1 accent-[#2BAE66] cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-zinc-500">
                          +5s
                        </span>
                      </div>

                      {Math.abs(styleConfig.captionDelaySeconds || 0) >= 0.05 && (
                        <button
                          type="button"
                          onClick={() => {
                            const prevDelay =
                              styleConfig.captionDelaySeconds ?? 0;
                            onUpdateStyle?.({ captionDelaySeconds: 0 });
                            if (Math.abs(prevDelay) > 0.01) {
                              onNudgeDialogueTiming(-prevDelay, 1);
                            }
                          }}
                          className="w-full py-1.5 rounded-lg bg-[#16161C] hover:bg-[#2BAE66] text-zinc-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset caption delay</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* OPTIONAL SEARCH BAR (Shown when Search icon is clicked) */}
            {isSearchOpen && (
              <div className="px-4 py-2 bg-[#16161B] border-b border-white/[0.06] flex items-center gap-2 shrink-0">
                <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search captions by word..."
                  autoFocus
                  className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* SCROLLABLE SINGLE-ROW NUMBERED CAPTION LINES (Exact match to Screenshot 2026-10-15 at 10.10.29 AM.png) */}
            {isCaptionsSectionMinimized ? (
              <div className="p-4 flex items-center justify-between text-xs text-zinc-400">
                <span>Captions list minimized ({filteredSegments.length} lines)</span>
                <button
                  type="button"
                  onClick={() => setIsCaptionsSectionMinimized(false)}
                  className="px-3 py-1 rounded-lg bg-[#2BAE66] text-white font-semibold cursor-pointer"
                >
                  Expand
                </button>
              </div>
            ) : (
              <div
                className="relative flex-1 min-h-0 flex flex-col overflow-hidden"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setIsCaptionToolsOpen(true);
                  setContextMenuState({
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
              >
                <div
                  ref={captionsScrollRef}
                  className="flex-1 min-h-0 overflow-y-auto scroll-smooth divide-y divide-white/[0.06] px-2"
                >
                  {filteredSegments.map((seg, idx) => {
                    const isActive =
                      currentTime >= seg.startTime && currentTime <= seg.endTime;
                    const primaryTrackObj =
                      seg.tracks[styleConfig.primaryTrack] || seg.tracks.tinglish;
                    const primaryText = primaryTrackObj?.text || '';
                    const primaryWords = primaryTrackObj?.words || [];
                    const displayNum = seg.displayLineNumber ?? idx + 48;
                    const isLineStyleOpen = lineStylePopupSegId === seg.id;
                    const isEditingLine = editingSegmentId === seg.id;
                    const curArcDeg = seg.arcCurveDeg || 0;
                    const lineOverride: LineStyleOverride = seg.lineStyleOverride || {};

                    return (
                      <div
                        key={seg.id}
                        onClick={() => onSeekTo(seg.startTime + 0.02)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsCaptionToolsOpen(true);
                          setContextMenuState({
                            x: e.clientX,
                            y: e.clientY,
                            segmentId: seg.id,
                          });
                        }}
                        title="Click to seek · Right-click for Caption Tools & Line Options"
                        className={`py-2.5 px-2.5 transition-colors cursor-pointer ${
                          isActive ? 'bg-white/[0.03]' : 'hover:bg-white/[0.015]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* LEFT: Circular Numbered Line Badge (48, 49, 50, 51...) + Word Chips */}
                          <div className="flex items-center gap-3.5 min-w-0 flex-1 flex-wrap">
                            <span
                              className={`w-6 h-6 rounded-full text-[11px] font-mono tabular-nums flex items-center justify-center shrink-0 transition-colors ${
                                isActive
                                  ? 'bg-[#26262E] text-white font-semibold'
                                  : 'bg-[#1B1B22] text-zinc-400'
                              }`}
                            >
                              {displayNum}
                            </span>

                            {/* Inline Edit Input OR Kalakar Word Chips */}
                            {isEditingLine ? (
                              <div
                                className="flex items-center gap-1.5 flex-1 min-w-[180px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={primaryText}
                                  autoFocus
                                  onChange={(e) =>
                                    onUpdateSegmentText(
                                      seg.id,
                                      styleConfig.primaryTrack,
                                      e.target.value
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setEditingSegmentId(null);
                                  }}
                                  className="flex-1 bg-[#1B1B22] text-white text-sm px-2.5 py-1 rounded-lg border border-[#2BAE66] focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditingSegmentId(null)}
                                  className="px-2 py-1 rounded-lg bg-[#2BAE66] text-white text-xs font-semibold cursor-pointer"
                                >
                                  Done
                                </button>
                              </div>
                            ) : (
                              <div
                                className="flex flex-wrap items-center gap-1.5 min-w-0"
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSegmentId(seg.id);
                                }}
                              >
                                {primaryWords.map((w, wIdx) => {
                                  const isWordSelected =
                                    selectedWordRef?.segmentId === seg.id &&
                                    selectedWordRef?.wordIndex === wIdx;
                                  const isHighlightedGreen = Boolean(w.isHero);

                                  return (
                                    <button
                                      key={`${seg.id}-w-${wIdx}`}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSeekTo(seg.startTime + 0.02);
                                        onToggleWordHero(
                                          seg.id,
                                          styleConfig.primaryTrack,
                                          wIdx
                                        );
                                        setSelectedWordRef({
                                          segmentId: seg.id,
                                          wordIndex: wIdx,
                                        });
                                        if (styleConfig.autoSfxEnabled) {
                                          playOpenSourceSoundEffect(
                                            seg.sfxType && seg.sfxType !== 'none'
                                              ? seg.sfxType
                                              : 'pop',
                                            styleConfig.sfxVolume ?? 0.4
                                          );
                                        }
                                      }}
                                      title="Click to toggle green emphasis · Double-click row to edit text"
                                      className={`text-[14px] leading-snug transition-all cursor-pointer ${
                                        isActive && isHighlightedGreen
                                          ? 'px-2.5 py-0.5 rounded-md bg-[#163326] text-white border border-white/85 font-medium shadow-sm'
                                          : isHighlightedGreen
                                          ? 'px-2 py-0.5 rounded-md bg-[#132E22] text-[#34D399] border border-[#2BAE66]/40 font-medium'
                                          : isWordSelected
                                          ? 'px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/40'
                                          : 'px-1 py-0.5 rounded text-zinc-100 hover:bg-white/[0.06]'
                                      }`}
                                      style={
                                        w.customColor ? { color: w.customColor } : undefined
                                      }
                                    >
                                      {w.word}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* RIGHT: 4 Minimal Kalakar Per-Line Action Icons (Arch ⌒, Move/Spread ✥, Behind Subject 🧍, Template ⊞) */}
                          <div
                            className="flex items-center gap-1.5 text-zinc-400 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* 1. Curve into an arch (⌒) */}
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateSegmentMeta?.(seg.id, {
                                  arcCurveDeg: curArcDeg !== 0 ? 0 : 22,
                                })
                              }
                              title={
                                curArcDeg !== 0
                                  ? 'Flatten this line'
                                  : 'Curve into an arch'
                              }
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                curArcDeg !== 0
                                  ? 'text-[#34D399] bg-[#163326]'
                                  : 'hover:text-white hover:bg-white/[0.06]'
                              }`}
                            >
                              <span className="text-xs font-bold leading-none">⌒</span>
                            </button>

                            {/* 2. Spread / Move words across line (✥) */}
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateSegmentMeta?.(seg.id, {
                                  spreadWords: !seg.spreadWords,
                                })
                              }
                              title="Spread the words across the line"
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                seg.spreadWords
                                  ? 'text-[#34D399] bg-[#163326]'
                                  : 'hover:text-white hover:bg-white/[0.06]'
                              }`}
                            >
                              <Move className="w-3.5 h-3.5" />
                            </button>

                            {/* 3. Put behind the subject (🧍) */}
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = !seg.behindSubject;
                                onUpdateSegmentMeta?.(seg.id, {
                                  behindSubject: nextVal,
                                });
                                if (nextVal && !styleConfig.captionDepthBehindSubject) {
                                  onUpdateStyle?.({
                                    captionDepthBehindSubject: true,
                                    positionY: 31,
                                  });
                                }
                              }}
                              title="Placed caption behind subject (Depth Mask ON — Auto behind-head placement)"
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                seg.behindSubject || styleConfig.captionDepthBehindSubject
                                  ? 'text-[#34D399] bg-[#163326]'
                                  : 'hover:text-white hover:bg-white/[0.06]'
                              }`}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>

                            {/* 4. Apply a different template on this line (⊞) */}
                            <button
                              type="button"
                              onClick={() =>
                                setLineStylePopupSegId((prev) =>
                                  prev === seg.id ? null : seg.id
                                )
                              }
                              title="Apply a different template or edit this line"
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                isLineStyleOpen || lineOverride.templateId
                                  ? 'text-[#34D399] bg-[#163326]'
                                  : 'hover:text-white hover:bg-white/[0.06]'
                              }`}
                            >
                              <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* INLINE LINE STYLING & EDIT POPUP (Opened when clicking ⊞ on a row) */}
                        {isLineStyleOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2.5 p-3 rounded-xl bg-[#18181F] border border-[#2BAE66]/40 space-y-2.5 text-[11px]"
                          >
                            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                              <span className="font-bold text-[#34D399]">
                                Line #{displayNum} Options &amp; Template Override
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingSegmentId(seg.id)}
                                  className="px-2 py-0.5 rounded bg-[#252530] text-white flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit Text</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    playOpenSourceSoundEffect(
                                      seg.sfxType && seg.sfxType !== 'none'
                                        ? seg.sfxType
                                        : 'whoosh',
                                      styleConfig.sfxVolume ?? 0.45
                                    );
                                  }}
                                  className="px-2 py-0.5 rounded bg-[#163326] text-[#34D399] flex items-center gap-1 cursor-pointer"
                                >
                                  <Volume2 className="w-3 h-3" />
                                  <span>SFX: {seg.sfxType || 'whoosh'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setLineStylePopupSegId(null)}
                                  className="text-zinc-400 hover:text-white cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] text-zinc-400 block mb-0.5">
                                  Font Family
                                </label>
                                <select
                                  value={lineOverride.fontFamily || styleConfig.fontFamily}
                                  onChange={(e) =>
                                    onUpdateSegmentMeta?.(seg.id, {
                                      lineStyleOverride: {
                                        ...lineOverride,
                                        fontFamily: e.target.value,
                                      },
                                    })
                                  }
                                  className="w-full bg-[#121216] text-white text-[10px] px-2 py-1 rounded border border-white/10"
                                >
                                  {AVAILABLE_FONTS.map((f) => (
                                    <option key={f.name} value={f.name}>
                                      {f.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-zinc-400 block mb-0.5">
                                  Line SFX Trigger
                                </label>
                                <select
                                  value={seg.sfxType || 'whoosh'}
                                  onChange={(e) => {
                                    const nextSfx = e.target
                                      .value as CaptionSegment['sfxType'];
                                    onUpdateSegmentMeta?.(seg.id, { sfxType: nextSfx });
                                    if (nextSfx && nextSfx !== 'none') {
                                      playOpenSourceSoundEffect(nextSfx, 0.45);
                                    }
                                  }}
                                  className="w-full bg-[#121216] text-[#34D399] text-[10px] px-2 py-1 rounded border border-white/10"
                                >
                                  <option value="whoosh">Whoosh Swipe</option>
                                  <option value="bell">Crystal Bell</option>
                                  <option value="pop">Bubble Pop</option>
                                  <option value="cash">Cash Register</option>
                                  <option value="riser">Cinema Riser</option>
                                  <option value="impact">Bass Impact</option>
                                  <option value="none">No SFX</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-zinc-400 block mb-0.5">
                                  AI B-Roll Cutaway
                                </label>
                                <select
                                  value={seg.brollTheme || 'none'}
                                  onChange={(e) => {
                                    const val = e.target
                                      .value as CaptionSegment['brollTheme'];
                                    onUpdateSegmentMeta?.(seg.id, {
                                      brollTheme: val,
                                      brollTitle:
                                        val === 'wealth'
                                          ? 'Wealth & Compounding Visual'
                                          : val === 'community'
                                          ? 'Creator Community Cutaway'
                                          : val === 'mindset'
                                          ? 'High-Focus Studio Cutaway'
                                          : undefined,
                                    });
                                    if (val !== 'none') {
                                      onUpdateStyle?.({ brollEnabled: true });
                                    }
                                  }}
                                  className="w-full bg-[#121216] text-amber-300 text-[10px] px-2 py-1 rounded border border-white/10"
                                >
                                  <option value="none">No B-Roll</option>
                                  <option value="wealth">Wealth / Revenue B-Roll</option>
                                  <option value="mindset">Mindset / Focus B-Roll</option>
                                  <option value="community">Community / Team B-Roll</option>
                                </select>
                              </div>
                            </div>

                            {/* Quick Per-Line Templates */}
                            <div className="grid grid-cols-4 gap-1 max-h-20 overflow-y-auto">
                              {filteredLineTemplates.slice(0, 12).map((tpl) => (
                                <button
                                  key={`lt-${tpl.id}`}
                                  type="button"
                                  onClick={() =>
                                    onUpdateSegmentMeta?.(seg.id, {
                                      lineStyleOverride: {
                                        ...lineOverride,
                                        templateId: tpl.id,
                                        fontFamily: tpl.config.fontFamily,
                                        primaryColor: tpl.config.primaryColor,
                                        secondaryColor: tpl.config.highlightColor,
                                      },
                                    })
                                  }
                                  className={`px-2 py-1 rounded text-[10px] font-medium truncate cursor-pointer border ${
                                    lineOverride.templateId === tpl.id
                                      ? 'bg-[#2BAE66] text-white border-[#2BAE66]'
                                      : 'bg-[#121216] text-zinc-300 border-white/5 hover:border-white/20'
                                  }`}
                                >
                                  {tpl.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Subtle Floating Scroll Up / Down Arrows on Bottom Right */}
                <div className="absolute right-2.5 bottom-2.5 flex flex-col gap-1 z-20">
                  <button
                    type="button"
                    onClick={() => scrollCaptionsList(-220)}
                    title="Scroll Up"
                    className="w-6 h-6 rounded-full bg-[#1E1E24]/90 hover:bg-[#2BAE66] text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center cursor-pointer shadow-md"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCaptionsList(220)}
                    title="Scroll Down"
                    className="w-6 h-6 rounded-full bg-[#1E1E24]/90 hover:bg-[#2BAE66] text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center cursor-pointer shadow-md"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
