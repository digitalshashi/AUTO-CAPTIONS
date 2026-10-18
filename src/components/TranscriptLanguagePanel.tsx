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
  Image as ImageIcon,
  Wand2,
  Sliders,
  Code2,
} from 'lucide-react';
import {
  AIBRollSlot,
  BRollDisplayLayout,
  BRollMagicalEffect,
  CaptionSegment,
  CaptionStyleConfig,
  LineStyleOverride,
  SampleReel,
  StylePreset,
  TrackKey,
  VideoAspectRatio,
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
  stripEmojisFromText,
  stripPunctuationFromText,
} from '../data/kalakarOptionsData';
import { KalakarShellView } from './KalakarAppShellModals';
import { AIBRollStudioPanel } from './AIBRollStudioPanel';
import { KalakarLineStylingPanel } from './KalakarRightPanelTabs';
import { playOpenSourceSoundEffect } from '../utils/soundEffectsEngine';
import {
  isRomanTrack,
  transliterateIndicToRoman,
} from '../utils/indicRomanTransliterator';
import { splitSegmentIntoTwoLines } from '../utils/canvasCaptionRenderer';

export type LeftRailTool =
  | 'captions'
  | 'broll'
  | 'masking'
  | 'custom-fonts'
  | 'library';

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
  // AI Script-to-B-Roll 3-Image Studio props
  aiBRollSlots?: AIBRollSlot[];
  isAnalyzingBRollScript?: boolean;
  onUpdateBRollSlot?: (slotId: string, partial: Partial<AIBRollSlot>) => void;
  onAnalyzeAndGenerateAllThreeBRolls?: (aspectRatio: VideoAspectRatio) => void;
  onRegenerateSingleBRollSlotImage?: (
    slotId: string,
    prompt: string,
    aspectRatio: VideoAspectRatio
  ) => void;
  onLinkBRollSlotToSegment?: (slotId: string, segmentId: string) => void;
  onGenerateSegmentCustomBRoll?: (
    segmentId: string,
    prompt: string,
    aspectRatio: VideoAspectRatio
  ) => void;
  onOpenRightBRollTab?: () => void;
  onAddManualTextPlusAtPlayhead?: (customText?: string) => void;
  onMergeSegmentWithPrev?: (segmentId: string) => void;
  onMergeSegmentWithNext?: (segmentId: string) => void;
  onResetSemanticLineScope?: () => void;
  onCascadeMotherToChildren?: (
    motherSegId: string,
    childCount: number | 'all'
  ) => void;
  onOpenRemotionModule?: () => void;
  onSelectLineForStyling?: (segmentId: string) => void;
}

interface PowerBinFolder {
  id: string;
  name: string;
  scope: 'project' | 'global';
  createdAt: string;
}

interface PowerBinAsset {
  id: string;
  name: string;
  type: 'video' | 'stills' | 'audio';
  scope: 'project' | 'global';
  folderId: string | null;
  durationOrSize: string;
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
  onSyncToVoiceNow,
  onNudgeDialogueTiming,
  onUpdateSegmentMeta,
  onUpdateWordStyle,
  onApplyCaptionToolAction,
  onUpdateStyle,
  presets = [],
  customFonts = [],
  onUploadCustomFont,
  onOpenPrepareMedia,
  aiBRollSlots = [],
  isAnalyzingBRollScript = false,
  onUpdateBRollSlot,
  onAnalyzeAndGenerateAllThreeBRolls,
  onRegenerateSingleBRollSlotImage,
  onLinkBRollSlotToSegment,
  onGenerateSegmentCustomBRoll,
  onOpenRightBRollTab,
  onOpenRemotionModule,
  onSelectLineForStyling,
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

  // Goldox Section 1.2 & 1.3: Scope Mode (Word | Character | Line) & Find/Replace with Match Case
  const [captionScopeTab, setCaptionScopeTab] = useState<'word' | 'char' | 'line'>('word');
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState<boolean>(false);
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [matchCase, setMatchCase] = useState<boolean>(false);

  // Goldox Section 3.3: Mother / Child Line Magic Wand Popover
  const [activeWandSegId, setActiveWandSegId] = useState<string | null>(null);

  // Goldox Section 4.3: Left-Side Drag Resizer Width (px)
  const [leftPanelWidthPx, setLeftPanelWidthPx] = useState<number>(470);
  const isResizingLeftRef = useRef<boolean>(false);

  // Goldox Section 4.1: Project Bins vs Global Power Bins with Folders
  const [powerBinScope, setPowerBinScope] = useState<'project' | 'global'>('project');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<
    'all' | 'video' | 'stills' | 'audio'
  >('all');
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [powerBinFolders, setPowerBinFolders] = useState<PowerBinFolder[]>(() => [
    { id: 'fld-hooks', name: 'Viral Hook B-Rolls', scope: 'global', createdAt: 'Today' },
    { id: 'fld-sfx', name: 'Studio Whoosh & Chimes', scope: 'global', createdAt: 'Today' },
    { id: 'fld-proj-1', name: 'Scene Cutaways', scope: 'project', createdAt: 'Today' },
  ]);
  const [powerBinAssets, setPowerBinAssets] = useState<PowerBinAsset[]>(() => [
    {
      id: 'ast-1',
      name: 'Creator Studio Cutaway 9:16.mp4',
      type: 'video',
      scope: 'project',
      folderId: 'fld-proj-1',
      durationOrSize: '00:04 · 1080p',
    },
    {
      id: 'ast-2',
      name: 'Golden Particle Overlay.png',
      type: 'stills',
      scope: 'global',
      folderId: 'fld-hooks',
      durationOrSize: '1080×1920 · PNG',
    },
    {
      id: 'ast-3',
      name: 'Cinematic Sub Impact + Whoosh.wav',
      type: 'audio',
      scope: 'global',
      folderId: 'fld-sfx',
      durationOrSize: '00:02 · WAV',
    },
  ]);

  const scrollCaptionsList = (deltaY: number) => {
    if (captionsScrollRef.current) {
      captionsScrollRef.current.scrollBy({ top: deltaY, behavior: 'smooth' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file, false);
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

  // Goldox Section 1.3: Find & Replace helper with Match Case
  const findMatchesCount = segments.reduce((acc, seg) => {
    if (!findText) return 0;
    const raw = seg.tracks[styleConfig.primaryTrack]?.text || '';
    if (!raw) return acc;
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, matchCase ? 'g' : 'gi');
    const matches = raw.match(regex);
    return acc + (matches ? matches.length : 0);
  }, 0);

  const handleReplaceInCaptions = (replaceAll: boolean) => {
    if (!findText) return;
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, matchCase ? (replaceAll ? 'g' : '') : replaceAll ? 'gi' : 'i');
    let replacedOnce = false;
    segments.forEach((seg) => {
      if (!replaceAll && replacedOnce) return;
      const raw = seg.tracks[styleConfig.primaryTrack]?.text || '';
      if (regex.test(raw)) {
        const nextText = raw.replace(regex, replaceText);
        onUpdateSegmentText(seg.id, styleConfig.primaryTrack, nextText);
        replacedOnce = true;
      }
    });
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col sm:flex-row gap-1.5 sm:gap-2 p-1.5 sm:p-2 pb-1.5 select-none overflow-hidden bg-[#0B0B0D] relative">
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

      {/* LEFT VERTICAL TOOL RAIL on Desktop / HORIZONTAL BAR on Mobile (Captions, AI B-Roll, Masking, Custom Fonts, Library) */}
      <div className="w-full sm:w-[72px] shrink-0 bg-[#141418] border border-white/[0.06] rounded-xl py-1.5 sm:py-2.5 px-1.5 flex flex-row sm:flex-col items-center gap-1.5 sm:gap-2 overflow-x-auto">
        {(
          [
            { id: 'captions', label: 'Captions', icon: Subtitles },
            { id: 'broll', label: 'AI B-Roll\n(3 Imgs)', icon: ImageIcon },
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
              className={`min-w-[68px] sm:min-w-0 sm:w-full py-1.5 sm:py-2.5 px-2 sm:px-1 rounded-xl flex flex-row sm:flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                active
                  ? 'bg-[#172A21] text-[#2BAE66] border border-[#2BAE66]/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-medium leading-tight text-center sm:whitespace-pre-line whitespace-nowrap">
                {item.label.replace('\n', ' ')}
              </span>
            </button>
          );
        })}

        {/* Dedicated Remotion Engine Module Trigger in Left Rail */}
        {onOpenRemotionModule && (
          <button
            type="button"
            onClick={onOpenRemotionModule}
            title="Switch to Dedicated Remotion Video & Caption Editing Module (remotion-dev/remotion)"
            className="min-w-[72px] sm:min-w-0 sm:w-full py-1.5 sm:py-2.5 px-2 sm:px-1 rounded-xl flex flex-row sm:flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-[#60a5fa] hover:text-white bg-[#0B84F3]/10 hover:bg-[#0B84F3]/25 border border-[#0B84F3]/30 sm:mt-auto shrink-0"
          >
            <Code2 className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-semibold leading-tight text-center whitespace-nowrap">
              Remotion
            </span>
          </button>
        )}
      </div>

      {/* MAIN LEFT PANEL CONTAINER */}
      <div className="flex-1 min-h-0 min-w-0 bg-[#121216] border border-white/[0.06] rounded-xl flex flex-col overflow-hidden relative">
        {/* RAIL VIEW: AI B-ROLL (3 Script-Analyzed Images in 9:16, 1:1, 16:9 + Magical Effects) */}
        {activeRailTool === 'broll' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#FDE047]" />
                  <span>AI Script-to-B-Roll (3 Images)</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Gemini AI script analysis &amp; image generation in 9:16, 1:1, or 16:9
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

            <AIBRollStudioPanel
              segments={segments}
              primaryTrack={styleConfig.primaryTrack}
              styleConfig={styleConfig}
              aiBRollSlots={aiBRollSlots}
              isAnalyzingScript={isAnalyzingBRollScript}
              onUpdateStyle={(p) => onUpdateStyle?.(p)}
              onUpdateSlot={(slotId, partial) => onUpdateBRollSlot?.(slotId, partial)}
              onAnalyzeAndGenerateAllThree={(ratio) =>
                onAnalyzeAndGenerateAllThreeBRolls?.(ratio)
              }
              onRegenerateSingleSlotImage={(slotId, prompt, ratio) =>
                onRegenerateSingleBRollSlotImage?.(slotId, prompt, ratio)
              }
              onLinkSlotToSegment={(slotId, segmentId) =>
                onLinkBRollSlotToSegment?.(slotId, segmentId)
              }
              onSeekTo={onSeekTo}
            />
          </div>
        )}

        {/* RAIL VIEW: MASKING */}
        {activeRailTool === 'masking' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Studio Gradient Vignette &amp; Behind-the-Head Module
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Apply studio gradient vignettes (Behind-the-Head AI Cutout is currently disabled for V2 upgrade)
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

            {/* Disabled Behind-the-Head Module Notice (Preserved, Not Removed) */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center justify-between gap-3 opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-zinc-300">
                    Behind the Head (AI Person Cutout)
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Temporarily disabled — preserved for upcoming V2 Behind-the-Head engine
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono font-bold shrink-0">
                DISABLED
              </span>
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
                    className="p-2.5 rounded-xl bg-[#18181E] border border-white/[0.06] flex items-center justify-between gap-2"
                  >
                    <span className="text-white font-semibold truncate">{fn}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
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
                      <button
                        type="button"
                        onClick={() => {
                          const win = window as unknown as {
                            __merupifyDeleteFont?: (n: string) => void;
                          };
                          win.__merupifyDeleteFont?.(fn);
                        }}
                        title="Delete uploaded custom font"
                        className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RAIL VIEW: LIBRARY & GOLDOX POWER BINS (This Project vs Global Power Bins + Folders + Back Arrow + Asset Filters) */}
        {activeRailTool === 'library' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Media Power Bins &amp; 101 Languages
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Project Bins (this edit) &amp; Global Power Bins (saved across all projects)
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
                className="p-3 rounded-xl bg-[#2BAE66] hover:bg-[#249657] text-white font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Video (MP4/MOV)</span>
              </button>
              {onOpenPrepareMedia && (
                <button
                  type="button"
                  onClick={onOpenPrepareMedia}
                  className="p-3 rounded-xl bg-[#1C1C22] hover:bg-[#25252E] border border-white/10 text-zinc-100 font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#34D399]" />
                  <span>Prepare Media (101 Langs)</span>
                </button>
              )}
            </div>

            {/* GOLDOX SECTION 4.1: PROJECT BINS vs GLOBAL POWER BINS */}
            <div className="p-3 rounded-xl bg-[#16171E] border border-white/[0.08] space-y-2.5">
              {/* Scope Toggle: This Project vs Global Power Bin */}
              <div className="grid grid-cols-2 gap-1.5 bg-[#0F1015] p-1 rounded-lg border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setPowerBinScope('project');
                    setActiveFolderId(null);
                  }}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                    powerBinScope === 'project'
                      ? 'bg-[#2BAE66] text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Media assets for this project only"
                >
                  📁 This Project Bin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPowerBinScope('global');
                    setActiveFolderId(null);
                  }}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                    powerBinScope === 'global'
                      ? 'bg-[#F59E0B] text-zinc-950'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Global Power Bin — reusable across every project"
                >
                  ⚡ Global Power Bin
                </button>
              </div>

              {/* Category Filter Tabs: All | Video | Stills | Audio */}
              <div className="flex items-center justify-between gap-1">
                {(['all', 'video', 'stills', 'audio'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMediaCategoryFilter(cat)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer border ${
                      mediaCategoryFilter === cat
                        ? 'bg-[#172A21] border-[#2BAE66] text-[#34D399]'
                        : 'bg-[#111217] border-white/[0.06] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Folder Creation & Parent Back Arrow (<-) */}
              <div className="flex items-center gap-1.5">
                {activeFolderId && (
                  <button
                    type="button"
                    onClick={() => setActiveFolderId(null)}
                    title="Return to parent folder (<-)"
                    className="px-2.5 py-1.5 rounded-lg bg-[#252630] hover:bg-[#2BAE66] text-white font-mono font-bold text-[11px] cursor-pointer shrink-0"
                  >
                    &lt;- Back
                  </button>
                )}
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder={
                    activeFolderId
                      ? `Inside Folder: ${
                          powerBinFolders.find((f) => f.id === activeFolderId)?.name || ''
                        }`
                      : 'New folder name...'
                  }
                  className="flex-1 bg-[#101116] text-white text-[11px] px-2.5 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#2BAE66]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const clean = newFolderName.trim() || `Folder ${powerBinFolders.length + 1}`;
                    setPowerBinFolders((prev) => [
                      ...prev,
                      {
                        id: `fld-${Date.now()}`,
                        name: clean,
                        scope: powerBinScope,
                        createdAt: 'Just now',
                      },
                    ]);
                    setNewFolderName('');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#2BAE66] text-white text-[11px] font-bold cursor-pointer shrink-0"
                  title="Create a new folder in this bin"
                >
                  + Folder
                </button>
              </div>

              {/* Folders List (Double-click or click to enter, Trash icon to delete) */}
              {!activeFolderId && (
                <div className="space-y-1">
                  {powerBinFolders
                    .filter((f) => f.scope === powerBinScope)
                    .map((folder) => (
                      <div
                        key={folder.id}
                        onDoubleClick={() => setActiveFolderId(folder.id)}
                        onClick={() => setActiveFolderId(folder.id)}
                        title="Double-click or click to open folder"
                        className="p-2 rounded-lg bg-[#111218] hover:bg-[#1B1D26] border border-white/[0.06] flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FolderOpen className="w-3.5 h-3.5 text-[#FDE047] shrink-0" />
                          <span className="font-semibold text-white truncate">
                            {folder.name}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500">
                            (Open →)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPowerBinFolders((prev) =>
                              prev.filter((item) => item.id !== folder.id)
                            );
                          }}
                          title="Delete folder"
                          className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {/* Assets List inside active bin/folder */}
              <div className="space-y-1 pt-1">
                {powerBinAssets
                  .filter(
                    (a) =>
                      a.scope === powerBinScope &&
                      (activeFolderId ? a.folderId === activeFolderId : true) &&
                      (mediaCategoryFilter === 'all' || a.type === mediaCategoryFilter)
                  )
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="p-2 rounded-lg bg-[#12131A] border border-white/[0.05] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-zinc-200 truncate">
                          {asset.name}
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500 uppercase">
                          {asset.type} · {asset.durationOrSize}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPowerBinAssets((prev) =>
                            prev.filter((item) => item.id !== asset.id)
                          )
                        }
                        title="Delete asset from bin"
                        className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
              </div>
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

        {/* RAIL VIEW: CAPTIONS (Exact Stitch Minimal Header + Numbered Lines OR Centered Caption Tools View) */}
        {activeRailTool === 'captions' && (
          <>
            {/* TOP HEADER BAR: "Captions" on left | Search Circle + "Caption Tools v" Pill on right */}
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between gap-2 shrink-0 relative bg-[#131315]">
              <div className="flex items-center gap-2.5 min-w-0">
                <h2 className="text-[15px] font-bold text-white tracking-tight">
                  Captions
                </h2>

                {/* Subtle Language Switcher Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setIsLanguagePopoverOpen((v) => !v);
                  }}
                  className="px-2 py-0.5 rounded-md bg-[#1c1c1f] hover:bg-[#26262a] border border-white/[0.08] text-[11px] font-medium text-zinc-300 flex items-center gap-1 cursor-pointer"
                  title="Switch Caption Language / Script (21+ Desi Languages)"
                >
                  <span>{primaryMeta.shortLabel}</span>
                  {translatingTrack && (
                    <Loader2 className="w-3 h-3 animate-spin text-[#10b981]" />
                  )}
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Direct Emojis OFF/ON Status & Toggle Pill */}
                <button
                  type="button"
                  onClick={() => {
                    const currentlyOff = styleConfig.removeEmojis !== false;
                    if (currentlyOff) {
                      onUpdateStyle?.({ removeEmojis: false });
                      onApplyCaptionToolAction?.('auto-add-emojis');
                    } else {
                      onUpdateStyle?.({ removeEmojis: true });
                      onApplyCaptionToolAction?.('remove-emojis');
                    }
                  }}
                  title={
                    styleConfig.removeEmojis !== false
                      ? 'Emojis are OFF for caption creation & import (Click to turn ON)'
                      : 'Emojis are ON (Click to turn OFF and remove all emojis)'
                  }
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    styleConfig.removeEmojis === false
                      ? 'bg-[#10b981]/15 border-[#10b981]/50 text-[#34D399]'
                      : 'bg-[#1c1c1f] hover:bg-[#26262a] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>Emojis: {styleConfig.removeEmojis === false ? 'ON' : 'OFF'}</span>
                </button>

                {/* Circular Search / Find & Replace Button (Exact Stitch app_home_1.png) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsFindReplaceOpen((v) => !v);
                    setIsSearchOpen(false);
                  }}
                  title="Find & Replace words across all captions (with Match Case)"
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                    isFindReplaceOpen || findText
                      ? 'bg-[#10b981]/15 border-[#10b981]/50 text-[#10b981]'
                      : 'bg-[#1c1c1f] hover:bg-[#26262a] border-white/[0.08] text-zinc-300 hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                </button>

                {/* "⚙ Caption Tools v/^" Rounded Pill Button (Exact match to app_home_1.png & app_captions_options.png) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCaptionToolsOpen((v) => !v);
                    setContextMenuState(null);
                    setIsLanguagePopoverOpen(false);
                  }}
                  title="Open Caption Tools (Display Settings, Actions, Caption Delay Control)"
                  className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCaptionToolsOpen
                      ? 'bg-[#1c1c1f] border-white/20 text-white shadow-sm'
                      : 'bg-[#1c1c1f] hover:bg-[#26262a] border-white/[0.08] text-zinc-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>Caption Tools</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${
                      isCaptionToolsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* POPOVER 1: LANGUAGE SWITCHER (Roman Tinglish Only vs Native Script + 21+ Desi Languages) */}
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

                  {/* Quick Script Mode Bar: Roman (Tinglish) Only vs Native (Telugu) */}
                  <div className="grid grid-cols-2 gap-1.5 bg-[#111115] p-1 rounded-xl border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPrimaryTrack('tinglish');
                        setIsLanguagePopoverOpen(false);
                      }}
                      className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isRomanTrack(styleConfig.primaryTrack)
                          ? 'bg-[#10b981] text-[#032b1d] shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>Roman (Tinglish)</span>
                      {isRomanTrack(styleConfig.primaryTrack) && (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPrimaryTrack('telugu');
                        setIsLanguagePopoverOpen(false);
                      }}
                      className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        !isRomanTrack(styleConfig.primaryTrack)
                          ? 'bg-[#10b981] text-[#032b1d] shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>Native (తెలుగు)</span>
                      {!isRomanTrack(styleConfig.primaryTrack) && (
                        <Check className="w-3 h-3" />
                      )}
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
                              ? 'bg-[#172A21] border-[#10b981] text-[#34D399] font-semibold'
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
                      className="w-full py-1.5 rounded-lg bg-[#10b981] text-[#032b1d] font-bold text-[11px] cursor-pointer"
                    >
                      Open All 101 Languages &amp; Script Settings
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* GOLDOX SECTION 1.3: FIND & REPLACE BAR WITH MATCH CASE */}
            {(isFindReplaceOpen || isSearchOpen) && (
              <div className="px-3.5 py-2.5 bg-[#15161D] border-b border-white/[0.07] space-y-2 shrink-0 text-xs">
                <div className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    value={findText}
                    onChange={(e) => {
                      setFindText(e.target.value);
                      setSearchQuery(e.target.value);
                    }}
                    placeholder="Find word..."
                    className="flex-1 bg-[#0E0F14] text-white text-xs px-2.5 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-[#10b981]"
                  />
                  <button
                    type="button"
                    onClick={() => setMatchCase((v) => !v)}
                    title="Match Case (Aa)"
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold border cursor-pointer ${
                      matchCase
                        ? 'bg-[#10b981] border-[#10b981] text-[#032b1d]'
                        : 'bg-[#121319] border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Aa Match Case
                  </button>
                  <span className="text-[10px] font-mono text-[#34D399] px-1.5">
                    {findMatchesCount} hit{findMatchesCount === 1 ? '' : 's'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFindReplaceOpen(false);
                      setIsSearchOpen(false);
                      setFindText('');
                      setSearchQuery('');
                    }}
                    className="text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder="Replace with..."
                    className="flex-1 bg-[#0E0F14] text-white text-xs px-2.5 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-[#10b981]"
                  />
                  <button
                    type="button"
                    onClick={() => handleReplaceInCaptions(false)}
                    className="px-2.5 py-1 rounded-lg bg-[#1E1F28] hover:bg-[#10b981] text-zinc-200 hover:text-[#032b1d] text-[11px] font-semibold cursor-pointer"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReplaceInCaptions(true)}
                    className="px-2.5 py-1 rounded-lg bg-[#10b981] hover:bg-[#34d399] text-[#032b1d] text-[11px] font-bold cursor-pointer"
                  >
                    Replace All
                  </button>
                </div>
              </div>
            )}

            {/* VIEW A: FULL-PANEL CENTERED "CAPTION TOOLS" VIEW (Exact match to app_captions_options.png & app_captions_settings.png) */}
            {(isCaptionToolsOpen || contextMenuState !== null) ? (
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 bg-[#121216] select-none">
                <div className="max-w-[540px] mx-auto space-y-5">
                  {/* Contextual Line Quick Actions when Right-Clicked on a Caption Line */}
                  {contextMenuState?.segmentId && (() => {
                    const targetSeg = segments.find(
                      (s) => s.id === contextMenuState.segmentId
                    );
                    if (!targetSeg) return null;
                    const segNum =
                      targetSeg.displayLineNumber ??
                      segments.findIndex((s) => s.id === targetSeg.id) + 1;
                    return (
                      <div className="p-2.5 rounded-xl bg-[#13261D] border border-[#10b981]/40 space-y-2">
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
                            className="px-2 py-1.5 rounded-lg bg-[#1C1C24] hover:bg-[#10b981] text-white hover:text-[#032b1d] text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
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
                            className="px-2 py-1.5 rounded-lg bg-[#1C1C24] hover:bg-[#10b981] text-white hover:text-[#032b1d] text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
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

                  {/* SECTION 1: DISPLAY SETTINGS (3-column grid: Words | Max Chars | Lines) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-[1px] flex-1 bg-white/[0.07]" />
                      <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-zinc-500">
                        DISPLAY SETTINGS
                      </span>
                      <div className="h-[1px] flex-1 bg-white/[0.07]" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {/* Col 1: Words */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-zinc-400 block">
                          Words
                        </label>
                        <div className="relative flex items-center bg-[#18181c] border border-white/[0.08] rounded-lg px-2.5 py-2">
                          <span className="text-[11px] font-bold text-zinc-500 mr-2">T</span>
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
                            className="w-full bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
                          >
                            <option value="default" className="bg-[#18181c]">
                              Default
                            </option>
                            <option value="1" className="bg-[#18181c]">
                              1 Word
                            </option>
                            <option value="2" className="bg-[#18181c]">
                              2 Words
                            </option>
                            <option value="3" className="bg-[#18181c]">
                              3 Words
                            </option>
                            <option value="4" className="bg-[#18181c]">
                              4 Words
                            </option>
                            <option value="5" className="bg-[#18181c]">
                              5 Words
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Col 2: Max Chars (24 + Reset) */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-zinc-400 block">
                          Max Chars
                        </label>
                        <div className="flex items-center bg-[#18181c] border border-white/[0.08] rounded-lg px-2.5 py-1.5">
                          <span className="text-[11px] font-bold text-zinc-500 mr-2">T</span>
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
                            className="w-full bg-transparent text-white text-xs font-mono tabular-nums focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateStyle?.({
                                maxCharsPerLine: 24,
                                wordsPerLine: 4,
                              });
                              onApplyCaptionToolAction?.('regroup-words', {
                                wordsPerLine: 4,
                                maxCharsPerLine: 24,
                              });
                            }}
                            title="Reset Max Chars to 24"
                            className="p-1 text-zinc-500 hover:text-white cursor-pointer shrink-0"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Col 3: Lines */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-zinc-400 block">
                          Lines
                        </label>
                        <div className="relative flex items-center bg-[#18181c] border border-white/[0.08] rounded-lg px-2.5 py-2">
                          <Columns className="w-3.5 h-3.5 text-zinc-500 mr-2 shrink-0" />
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
                            className="w-full bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
                          >
                            <option value={1} className="bg-[#18181c]">
                              1 Line
                            </option>
                            <option value={2} className="bg-[#18181c]">
                              2 Lines
                            </option>
                            <option value={3} className="bg-[#18181c]">
                              3 Lines
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: ACTIONS (4 Sleek Dark Cards with Toggle Switches) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-[1px] flex-1 bg-white/[0.07]" />
                      <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-zinc-500">
                        ACTIONS
                      </span>
                      <div className="h-[1px] flex-1 bg-white/[0.07]" />
                    </div>

                    <div className="space-y-2">
                      {(
                        [
                          {
                            key: 'removePunctuation',
                            onAction: 'remove-punctuation' as CaptionToolBulkAction,
                            offAction: 'restore-punctuation' as CaptionToolBulkAction,
                            label: 'Remove Punctuation',
                            desc: 'Strip all punctuation for a cleaner, minimal look',
                            icon: TypeIcon,
                          },
                          {
                            key: 'removeEmphasis',
                            onAction: 'remove-emphasis' as CaptionToolBulkAction,
                            offAction: 'restore-emphasis' as CaptionToolBulkAction,
                            label: 'Restore Emphasis',
                            desc: 'Bring back bold, italic, and highlighted text styling',
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
                            className="p-3 rounded-xl bg-[#17171b] hover:bg-[#1c1c21] border border-white/[0.06] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#202026] border border-white/[0.06] flex items-center justify-center text-zinc-400 shrink-0">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-white leading-snug">
                                  {item.label}
                                </div>
                                <div className="text-[11px] text-zinc-500 leading-tight mt-0.5 truncate">
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
                                isOn ? 'bg-[#10b981]' : 'bg-zinc-700'
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
                    </div>
                  </div>

                  {/* SECTION 3: TIMING — Caption Delay Control (-5s to 0 to +5s) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-[1px] flex-1 bg-white/[0.07]" />
                      <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-zinc-500">
                        TIMING
                      </span>
                      <div className="h-[1px] flex-1 bg-white/[0.07]" />
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#17171b] border border-white/[0.06] space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#202026] border border-white/[0.06] flex items-center justify-center text-zinc-400 shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white leading-tight">
                              Caption Delay Control
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              Shift all captions earlier or later in time
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-md bg-[#202026] border border-white/[0.06] font-mono tabular-nums text-[11px] text-zinc-300">
                            {Math.abs(styleConfig.captionDelaySeconds || 0) < 0.005
                              ? 'No delay'
                              : `${(styleConfig.captionDelaySeconds || 0) > 0 ? '+' : ''}${(
                                  styleConfig.captionDelaySeconds || 0
                                ).toFixed(2)}s`}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const prevDelay =
                                styleConfig.captionDelaySeconds ?? 0;
                              onUpdateStyle?.({ captionDelaySeconds: 0 });
                              if (Math.abs(prevDelay) >= 0.005) {
                                onNudgeDialogueTiming(-prevDelay, 1);
                              }
                            }}
                            title="Reset delay to 0"
                            className="p-1.5 rounded-md bg-[#202026] hover:bg-[#2a2a32] border border-white/[0.06] text-zinc-400 hover:text-white cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <input
                          type="range"
                          min={-5}
                          max={5}
                          step={0.05}
                          value={Math.max(
                            -5,
                            Math.min(5, styleConfig.captionDelaySeconds ?? 0)
                          )}
                          onChange={(e) => {
                            const nextDelay = parseFloat(e.target.value);
                            const prevDelay =
                              styleConfig.captionDelaySeconds ?? 0;
                            const delta = nextDelay - prevDelay;
                            onUpdateStyle?.({ captionDelaySeconds: nextDelay });
                            if (Math.abs(delta) >= 0.005) {
                              onNudgeDialogueTiming(delta, 1);
                            }
                          }}
                          className="w-full accent-[#10b981] cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                          <span>-5s</span>
                          <span>0</span>
                          <span>+5s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                    const enforceRoman = isRomanTrack(styleConfig.primaryTrack);
                    const shouldStripEmojis = styleConfig.removeEmojis !== false;
                    const shouldStripPunct = Boolean(styleConfig.removePunctuation);
                    const sanitizePanelStr = (val: string) => {
                      let out = enforceRoman ? transliterateIndicToRoman(val) : val;
                      if (shouldStripEmojis) out = stripEmojisFromText(out);
                      if (shouldStripPunct) out = stripPunctuationFromText(out);
                      return out;
                    };
                    const rawPrimaryText = primaryTrackObj?.text || '';
                    const primaryText = sanitizePanelStr(rawPrimaryText);
                    const primaryWords = (primaryTrackObj?.words || [])
                      .map((w) => ({
                        ...w,
                        word: sanitizePanelStr(w.word),
                      }))
                      .filter((w) => w.word.trim().length > 0);
                    const displayNum = idx + 1;
                    const isLineStyleOpen = lineStylePopupSegId === seg.id;
                    const isEditingLine = editingSegmentId === seg.id;
                    const curArcDeg = seg.arcCurveDeg || 0;
                    const lineOverride: LineStyleOverride = seg.lineStyleOverride || {};

                    return (
                      <div
                        key={seg.id}
                        onClick={() => {
                          onSeekTo(seg.startTime + 0.02);
                          if (lineStylePopupSegId && lineStylePopupSegId !== seg.id) {
                            setLineStylePopupSegId(null);
                          }
                        }}
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
                        title="Click line to seek · Click ⊞ on the right to open LINE STYLING pop-up"
                        className={`py-2.5 px-2.5 transition-colors cursor-pointer ${
                          isActive || isLineStyleOpen
                            ? 'bg-white/[0.04]'
                            : 'hover:bg-white/[0.015]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* LEFT: Circular Numbered Line Badge (1, 2, 3...) + Word Chips */}
                          <div className="flex items-center gap-3.5 min-w-0 flex-1 flex-wrap">
                            <span
                              className={`w-6 h-6 rounded-full text-[11px] font-mono tabular-nums flex items-center justify-center shrink-0 transition-colors ${
                                isLineStyleOpen
                                  ? 'bg-[#24B47E] text-[#050505] font-bold'
                                  : isActive
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
                                        if (
                                          Boolean(styleConfig.autoSfxEnabled) &&
                                          seg.sfxType &&
                                          seg.sfxType !== 'none'
                                        ) {
                                          playOpenSourceSoundEffect(
                                            seg.sfxType,
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

                          {/* RIGHT: Minimal Kalakar Per-Line Action Icons (Edit ✎, Arch ⌒, Move/Spread ✥, Behind Subject 🧍, Template ⊞) */}
                          <div
                            className="flex items-center gap-1.5 text-zinc-400 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* 0. Edit Line Text (✎) */}
                            <button
                              type="button"
                              onClick={() =>
                                setEditingSegmentId((prev) =>
                                  prev === seg.id ? null : seg.id
                                )
                              }
                              title="Edit words in this caption line"
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                isEditingLine
                                  ? 'text-[#34D399] bg-[#163326]'
                                  : 'hover:text-white hover:bg-white/[0.06]'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
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

                            {/* 3. Behind the Head (Disabled for now per user request — preserved in place for future activation) */}
                            <button
                              type="button"
                              disabled
                              title="Behind the Head (Temporarily disabled — preserved for upcoming update)"
                              className="p-1 rounded-md text-zinc-600 opacity-45 cursor-not-allowed"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>

                            {/* 3.5 AI B-Roll Trigger on this Caption Line (Only visible when B-Roll is enabled) */}
                            {Boolean(styleConfig.brollEnabled) &&
                              (() => {
                                const linkedSlot = aiBRollSlots.find(
                                  (s) =>
                                    (s.id === seg.aiBrollSlotId ||
                                      s.linkedSegmentId === seg.id) &&
                                    s.enabled !== false
                                );
                                const hasBroll = Boolean(
                                  linkedSlot ||
                                    (seg.aiBrollEnabled && seg.aiBrollCustomImageUrl)
                                );
                                return (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLineStylePopupSegId((prev) =>
                                        prev === seg.id ? null : seg.id
                                      )
                                    }
                                    title={
                                      linkedSlot
                                        ? `AI B-Roll #${linkedSlot.slotNumber} (${linkedSlot.aspectRatio}) attached`
                                        : 'Attach AI B-Roll Image to this caption line'
                                    }
                                    className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[9px] font-bold border ${
                                      hasBroll
                                        ? 'text-[#FDE047] bg-[#163326] border-[#2BAE66]/60'
                                        : 'text-zinc-400 border-white/10 hover:text-white hover:bg-white/[0.06]'
                                    }`}
                                  >
                                    <Sparkles className="w-3 h-3 shrink-0" />
                                    <span>
                                      {linkedSlot
                                        ? `B-Roll #${linkedSlot.slotNumber}`
                                        : '+ B-Roll'}
                                    </span>
                                  </button>
                                );
                              })()}

                            {/* 4. Open LINE STYLING Compact Pop-up for this line (⊞) */}
                            <button
                              type="button"
                              onClick={() => {
                                onSeekTo(seg.startTime + 0.02);
                                setLineStylePopupSegId((prev) =>
                                  prev === seg.id ? null : seg.id
                                );
                              }}
                              title="Open LINE STYLING Pop-up (Typography, Background, Position & Visual Templates)"
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

                        {/* GOLDOX SECTION 3.3: MOTHER / CHILD MAGIC WAND CASCADE BAR */}
                        {activeWandSegId === seg.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 p-2.5 rounded-xl bg-[#1A1812] border border-amber-400/40 flex flex-wrap items-center justify-between gap-2 text-[11px]"
                          >
                            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                              <Wand2 className="w-3.5 h-3.5" />
                              <span>
                                Magic Wand: Set Line #{displayNum} as Mother Line &amp; cascade to:
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {[2, 4, 8, 'all'].map((cnt) => (
                                <button
                                  key={`wand-${seg.id}-${cnt}`}
                                  type="button"
                                  onClick={() => {
                                    onUpdateSegmentMeta?.(seg.id, {
                                      lineRole: 'mother',
                                      motherSegmentId: undefined,
                                    });
                                    const startIdx = segments.findIndex(
                                      (s) => s.id === seg.id
                                    );
                                    const limit =
                                      cnt === 'all'
                                        ? segments.length
                                        : startIdx + 1 + Number(cnt);
                                    for (
                                      let k = startIdx + 1;
                                      k < Math.min(segments.length, limit);
                                      k++
                                    ) {
                                      const childSeg = segments[k];
                                      onUpdateSegmentMeta?.(childSeg.id, {
                                        lineRole: 'child',
                                        motherSegmentId: seg.id,
                                        lineStyleOverride: {
                                          ...(seg.lineStyleOverride || {}),
                                        },
                                        line1FontSizePx: seg.line1FontSizePx,
                                        line2FontSizePx: seg.line2FontSizePx,
                                      });
                                    }
                                    setActiveWandSegId(null);
                                  }}
                                  className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[10px] cursor-pointer"
                                >
                                  {cnt === 'all' ? 'All Following' : `Next ${cnt} Lines`}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateSegmentMeta?.(seg.id, {
                                    lineRole: 'none',
                                    motherSegmentId: undefined,
                                  });
                                  setActiveWandSegId(null);
                                }}
                                className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] cursor-pointer"
                              >
                                Unlink
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* COMPACT FLOATING LINE STYLING POP-UP WINDOW (Exact Match to Screenshot 2 — Floats on right side next to ⊞ buttons) */}
                {lineStylePopupSegId &&
                  (() => {
                    const popupSegIndex = segments.findIndex(
                      (s) => s.id === lineStylePopupSegId
                    );
                    const popupSeg =
                      popupSegIndex >= 0 ? segments[popupSegIndex] : undefined;
                    if (!popupSeg) return null;
                    return (
                      <div
                        className="absolute right-8 sm:right-10 top-2 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <KalakarLineStylingPanel
                          segment={popupSeg}
                          lineNumber={popupSegIndex + 1}
                          styleConfig={styleConfig}
                          userPresets={presets}
                          customFonts={customFonts}
                          onUpdateLineOverride={(nextOverride) => {
                            onUpdateSegmentMeta?.(popupSeg.id, {
                              lineStyleOverride: nextOverride,
                            });
                            if (popupSeg.lineRole === 'mother') {
                              segments.forEach((cSeg) => {
                                if (
                                  cSeg.lineRole === 'child' &&
                                  cSeg.motherSegmentId === popupSeg.id
                                ) {
                                  onUpdateSegmentMeta?.(cSeg.id, {
                                    lineStyleOverride: nextOverride,
                                  });
                                }
                              });
                            }
                          }}
                          onUpdateSegmentMeta={(partial) =>
                            onUpdateSegmentMeta?.(popupSeg.id, partial)
                          }
                          onUpdateGlobalStyle={(partial) =>
                            onUpdateStyle?.(partial)
                          }
                          onEditText={() => setEditingSegmentId(popupSeg.id)}
                          onClose={() => setLineStylePopupSegId(null)}
                        />
                      </div>
                    );
                  })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
