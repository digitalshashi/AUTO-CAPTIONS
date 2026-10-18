import React, { useRef, useState } from 'react';
import {
  Sparkles,
  Type as TypeIcon,
  Film,
  Download,
  FileText,
  FileCode,
  Shield,
  Sliders,
  Check,
  Wand2,
  Volume2,
  Square,
  Plus,
  Minus,
  RotateCcw,
  Save,
  Palette,
  Move,
  Layers,
  Trash2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import {
  AIBRollSlot,
  AnimationType,
  AudioEnhancerConfig,
  CaptionFrameStyle,
  CaptionSegment,
  CaptionStyleConfig,
  GradientDirection,
  GradientPreset,
  HierarchyMode,
  MaskMode,
  StylePreset,
  VideoAspectRatio,
} from '../types/caption';
import {
  AVAILABLE_FONTS,
  GRADIENT_PRESETS,
  INDIAN_LANGUAGE_MATRIX,
} from '../data/presetsAndLanguages';
import { DEFAULT_VIDEO_CLIP_EDIT } from '../data/kalakarOptionsData';
import {
  KalakarAiAudioTab,
  KalakarLineStylingPanel,
  KalakarTemplatesTab,
  KalakarTextAndEffectsTab,
  KalakarTransitionsTab,
  KalakarVideoEditTab,
} from './KalakarRightPanelTabs';
import { AIBRollStudioPanel } from './AIBRollStudioPanel';
import {
  ExportResolution,
  VideoExportFormat,
  getExportResolutionDimensions,
} from '../utils/audioExtractor';

const CUSTOM_GRADIENTS_STORAGE_KEY = 'vakyareel_custom_gradients_v1';

interface StyleAnimationInspectorProps {
  styleConfig: CaptionStyleConfig;
  presets: StylePreset[];
  customFonts?: string[];
  userPlan?: 'free' | 'creator' | 'pro';
  emphasizedWordCount?: number;
  selectedLineLabel?: string;
  audioEnhancer?: AudioEnhancerConfig;
  audioCleansRemaining?: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onUpdateAudioEnhancer?: (partial: Partial<AudioEnhancerConfig>) => void;
  onUpgradePlan?: () => void;
  onPreviewTransition?: () => void;
  onUploadCustomFont?: (file: File) => void;
  onUpdateStyle: (partial: Partial<CaptionStyleConfig>) => void;
  onApplyPreset: (preset: StylePreset) => void;
  onUpdateActivePreset: (customName?: string, customBadgeText?: string) => void;
  onCreateNewPreset: (name: string, badgeText: string) => void;
  onResetPresets: () => void;
  onExportSRT: () => void;
  onExportVTT: () => void;
  onExportJSON: () => void;
  onExportAudioWAV: () => void;
  onExportAlphaOverlay?: (resolution?: ExportResolution) => void;
  onExportPremiereXML?: () => void;
  onExportPremiereNativeXML?: () => void;
  onExportDaVinciFCPXML?: () => void;
  onExportDaVinciEDL?: () => void;
  onExportBurnedVideo: (
    format?: VideoExportFormat,
    resolution?: ExportResolution
  ) => void;
  onStopExportNow: () => void;
  exportFormat: VideoExportFormat;
  onChangeExportFormat: (format: VideoExportFormat) => void;
  exportResolution?: ExportResolution;
  onChangeExportResolution?: (res: ExportResolution) => void;
  isExportingVideo: boolean;
  exportProgress: number;
  // AI Script-to-B-Roll 3-Image Studio props
  segments?: CaptionSegment[];
  aiBRollSlots?: AIBRollSlot[];
  isAnalyzingBRollScript?: boolean;
  externalOpenBRollCounter?: number;
  onUpdateBRollSlot?: (slotId: string, partial: Partial<AIBRollSlot>) => void;
  onAnalyzeAndGenerateAllThreeBRolls?: (aspectRatio: VideoAspectRatio) => void;
  onRegenerateSingleBRollSlotImage?: (
    slotId: string,
    prompt: string,
    aspectRatio: VideoAspectRatio
  ) => void;
  onLinkBRollSlotToSegment?: (slotId: string, segmentId: string) => void;
  onSeekTo?: (time: number) => void;
  mobileVisible?: boolean;
  activeLineStylingSegmentId?: string | null;
  onCloseLineStyling?: () => void;
  onUpdateSegmentMeta?: (
    segmentId: string,
    partial: Partial<CaptionSegment>
  ) => void;
}

const ANIMATION_ENGINES: {
  id: AnimationType;
  shortName: string;
  name: string;
  desc: string;
}[] = [
  {
    id: 'premiere-pro',
    shortName: 'SIDZ Composite',
    name: 'SIDZ Premiere Composite',
    desc: 'RGB small lead-in + GIANT vertical gradient impact + script tail',
  },
  {
    id: 'karaoke',
    shortName: 'Karaoke Fill',
    name: 'Karaoke Word Fill',
    desc: 'Smooth animated gradient wipe across each spoken word',
  },
  {
    id: 'pop',
    shortName: 'Pop Bounce',
    name: 'Pop-In Bounce',
    desc: 'Elastic upward spring as each word is spoken',
  },
  {
    id: 'box-slide',
    shortName: 'Pill Glider',
    name: 'Gradient Pill Glider',
    desc: 'Rounded gradient pill glides from word to word',
  },
  {
    id: 'stomp',
    shortName: '2-Word Stomp',
    name: '2-Word Mass Stomp',
    desc: 'Big 2-word center slam for fast Tollywood & viral edits',
  },
  {
    id: 'neon-glow',
    shortName: 'Neon Glow',
    name: 'Neon Glow Pulse',
    desc: 'Luminous neon aura lights up the spoken word',
  },
  {
    id: 'wave',
    shortName: 'Rhythm Wave',
    name: 'Rhythm Wave',
    desc: 'Smooth vertical wave synced to voiceover cadence',
  },
  {
    id: 'typewriter',
    shortName: 'Typewriter',
    name: 'Typewriter Reveal',
    desc: 'Clean progressive letter-by-letter reveal',
  },
  {
    id: 'cinema-fade',
    shortName: 'Cinema Fade',
    name: 'Cinema Soft Fade',
    desc: 'Gentle documentary rise and optical fade',
  },
];

const SIDZ_LAYOUT_MODES: { id: HierarchyMode; label: string; sub: string }[] = [
  {
    id: 'lala-handwritten',
    label: 'Lala (Paritosh)',
    sub: 'Caveat Ink + Red Swoosh',
  },
  {
    id: 'sidz-vairagya',
    label: 'MER_VAIRAGYA',
    sub: 'Top-left RGB + Giant Gold',
  },
  {
    id: 'sidz-20k-script',
    label: 'MER_20K_MINT',
    sub: '3-Tier + Script Tail',
  },
  {
    id: 'sidz-valuing-wide',
    label: 'MER_VALUING',
    sub: 'Centered Wide Impact',
  },
  {
    id: 'sidz-truly-flame',
    label: 'MER_TRULY_FLAME',
    sub: 'Top Giant + Tucked Right',
  },
];

const MASK_OPTIONS: { id: MaskMode; label: string; desc: string }[] = [
  { id: 'none', label: 'No Mask', desc: 'Original unmasked video' },
  {
    id: 'linear-top-bottom',
    label: 'Top → Bottom Linear',
    desc: 'CapCut / Premiere linear gradient mask with rotatable angle',
  },
  {
    id: 'circle-radial',
    label: 'Circle / Radial Mask',
    desc: 'Photoshop / Premiere feathered circular radial gradient mask',
  },
  {
    id: 'rectangle',
    label: 'Rectangle Angle Mask',
    desc: 'Rotatable feathered rectangle mask like Premiere Pro & CapCut',
  },
  {
    id: 'bottom-cinema',
    label: 'Bottom Cinema Mask',
    desc: 'Smooth dark studio fade from bottom upward behind captions',
  },
  {
    id: 'top-bottom-split',
    label: 'Split Dual Vignette',
    desc: 'Top & bottom cinematic gradient shutters',
  },
];

const CAPTION_FRAME_OPTIONS: {
  id: CaptionFrameStyle;
  label: string;
  desc: string;
}[] = [
  {
    id: 'none',
    label: 'No Moving Frame',
    desc: 'Clean floating captions without a bounding card',
  },
  {
    id: 'ig-polaroid-frame',
    label: 'Instagram Photo Frame (♥ 💬 ➤)',
    desc: 'Moves wherever text goes! Includes IG header + Like, Comment, Share & bottom bar',
  },
  {
    id: 'ig-glass-pill',
    label: 'Instagram Reel Callout Pill',
    desc: 'Frosted dark glass card with IG gradient badge that follows text',
  },
  {
    id: 'ig-story-card',
    label: 'IG Gradient Story Card',
    desc: 'Translucent story card with live gradient border around captions',
  },
  {
    id: 'ig-neon-border',
    label: 'Neon Glow Frame',
    desc: 'Luminous multi-stop neon border around active caption block',
  },
  {
    id: 'premiere-bounding-box',
    label: 'Premiere Pro Transform Box',
    desc: '8-handle blue NLE bounding box around the movable caption block',
  },
];

export const StyleAnimationInspector: React.FC<StyleAnimationInspectorProps> = ({
  styleConfig,
  presets,
  customFonts = [],
  userPlan = 'free',
  emphasizedWordCount = 6,
  selectedLineLabel = 'Line 51',
  audioEnhancer = {
    enabled: false,
    noiseReductionDb: 24,
    voiceClarityBoost: 6,
  },
  audioCleansRemaining = 3,
  isMuted = false,
  onToggleMute,
  onUpdateAudioEnhancer,
  onUpgradePlan,
  onPreviewTransition,
  onUploadCustomFont,
  onUpdateStyle,
  onApplyPreset,
  onUpdateActivePreset,
  onCreateNewPreset,
  onResetPresets,
  onExportSRT,
  onExportVTT,
  onExportJSON,
  onExportAudioWAV,
  onExportAlphaOverlay,
  onExportPremiereXML,
  onExportPremiereNativeXML,
  onExportDaVinciFCPXML,
  onExportDaVinciEDL,
  onExportBurnedVideo,
  onStopExportNow,
  exportFormat,
  onChangeExportFormat,
  exportResolution = '1080p',
  onChangeExportResolution,
  isExportingVideo,
  exportProgress,
  segments = [],
  aiBRollSlots = [],
  isAnalyzingBRollScript = false,
  externalOpenBRollCounter = 0,
  onUpdateBRollSlot,
  onAnalyzeAndGenerateAllThreeBRolls,
  onRegenerateSingleBRollSlotImage,
  onLinkBRollSlotToSegment,
  onSeekTo,
  mobileVisible = true,
  activeLineStylingSegmentId = null,
  onCloseLineStyling,
  onUpdateSegmentMeta,
}) => {
  // Section 4: Collapse arrow on the panel edge hides or shows the right panel
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  // Section 4 & 11: Two top tabs: Captions and Edit (Video clip inspector)
  const [topPanelMode, setTopPanelMode] = useState<'captions' | 'edit'>('captions');

  const [showProTabs, setShowProTabs] = useState(false);

  const [activeTab, setActiveTab] = useState<
    | 'templates48'
    | 'text-effects'
    | 'transitions'
    | 'broll'
    | 'ai-audio'
    | 'easy'
    | 'gradients'
    | 'spacing'
    | 'mask'
    | 'export'
  >('text-effects');

  React.useEffect(() => {
    if (externalOpenBRollCounter > 0) {
      setIsRightPanelCollapsed(false);
      setTopPanelMode('captions');
      setActiveTab('broll');
    }
  }, [externalOpenBRollCounter]);

  React.useEffect(() => {
    if (activeLineStylingSegmentId) {
      setIsRightPanelCollapsed(false);
    }
  }, [activeLineStylingSegmentId]);

  const activeLineStylingSegIndex = activeLineStylingSegmentId
    ? segments.findIndex((s) => s.id === activeLineStylingSegmentId)
    : -1;
  const activeLineStylingSegment =
    activeLineStylingSegIndex >= 0
      ? segments[activeLineStylingSegIndex]
      : undefined;

  const [customGradients, setCustomGradients] = useState<GradientPreset[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_GRADIENTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [customGradName, setCustomGradName] = useState<string>('');
  const [useFourthStop, setUseFourthStop] = useState<boolean>(
    Boolean(styleConfig.gradientFourth)
  );

  const activePresetObj =
    presets.find((p) => p.id === styleConfig.presetId) || presets[0];

  const [presetNameDraft, setPresetNameDraft] = useState<string>('');
  const [presetBadgeDraft, setPresetBadgeDraft] = useState<string>('');

  const primaryLang =
    INDIAN_LANGUAGE_MATRIX.find((l) => l.key === styleConfig.primaryTrack) ||
    INDIAN_LANGUAGE_MATRIX[0];

  const allGradients = [...customGradients, ...GRADIENT_PRESETS];

  const handleApplyGradientPreset = (gp: GradientPreset) => {
    const fourth = gp.colors[3];
    setUseFourthStop(Boolean(fourth));
    onUpdateStyle({
      useGradient: true,
      gradientPresetId: gp.id,
      gradientStart: gp.colors[0],
      gradientMid: gp.colors[1],
      gradientEnd: gp.colors[2],
      gradientFourth: fourth,
      highlightColor: gp.colors[1],
    });
  };

  const handleSaveCustomGradient = () => {
    const cleanName =
      customGradName.trim() || `Custom #${customGradients.length + 1}`;
    const newGrad: GradientPreset = {
      id: `custom-grad-${Date.now()}`,
      name: cleanName,
      colors: useFourthStop
        ? [
            styleConfig.gradientStart || '#FF1E96',
            styleConfig.gradientMid || '#FFD700',
            styleConfig.gradientEnd || '#00F5D4',
            styleConfig.gradientFourth || '#5CA8FF',
          ]
        : [
            styleConfig.gradientStart || '#FF1E96',
            styleConfig.gradientMid || '#FFD700',
            styleConfig.gradientEnd || '#00F5D4',
          ],
    };
    const updated = [newGrad, ...customGradients];
    setCustomGradients(updated);
    try {
      localStorage.setItem(CUSTOM_GRADIENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setCustomGradName('');
    onUpdateStyle({
      useGradient: true,
      gradientPresetId: newGrad.id,
    });
  };

  const handleDeleteCustomGradient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customGradients.filter((g) => g.id !== id);
    setCustomGradients(updated);
    try {
      localStorage.setItem(CUSTOM_GRADIENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const buildCssGradientPreview = (
    colors: (string | undefined)[],
    dir: GradientDirection = 'vertical',
    angle = 135
  ) => {
    const stops = colors[3]
      ? `${colors[0]} 0%, ${colors[1]} 33%, ${colors[2]} 67%, ${colors[3]} 100%`
      : `${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%`;
    if (dir === 'horizontal') return `linear-gradient(90deg, ${stops})`;
    if (dir === 'diagonal') return `linear-gradient(${angle}deg, ${stops})`;
    if (dir === 'radial') return `radial-gradient(circle, ${stops})`;
    return `linear-gradient(180deg, ${stops})`;
  };

  const adjustBaseFontSize = (delta: number) => {
    const next = Math.max(18, Math.min(110, (styleConfig.fontSize || 56) + delta));
    onUpdateStyle({ fontSize: next });
  };

  const adjustGiantScale = (delta: number) => {
    const next = Number(
      Math.max(1.0, Math.min(3.4, (styleConfig.bigWordScale || 2.15) + delta)).toFixed(2)
    );
    onUpdateStyle({ bigWordScale: next });
  };

  const adjustSmallScale = (delta: number) => {
    const next = Number(
      Math.max(0.35, Math.min(1.35, (styleConfig.smallWordScale || 0.68) + delta)).toFixed(2)
    );
    onUpdateStyle({ smallWordScale: next });
  };

  const [rightPanelWidthPx, setRightPanelWidthPx] = useState<number>(380);
  const isResizingRightRef = useRef<boolean>(false);

  React.useEffect(() => {
    if (mobileVisible) {
      setIsRightPanelCollapsed(false);
    }
  }, [mobileVisible]);

  if (isRightPanelCollapsed) {
    return (
      <aside
        className={`${
          mobileVisible ? 'flex' : 'hidden lg:flex'
        } order-3 lg:order-3 w-full lg:w-11 shrink-0 border-l border-white/[0.08] bg-[#131315] lg:flex-col items-center justify-between lg:justify-start py-2.5 px-3 lg:px-0 lg:py-4 select-none relative z-30 overflow-visible`}
      >
        {/* Middle Left-Edge Expand Toggle Button */}
        <button
          type="button"
          onClick={() => setIsRightPanelCollapsed(false)}
          title="Expand Right Panel"
          className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-50 w-4 h-12 rounded-l-lg bg-[#1C1C22] hover:bg-[#10b981] border border-r-0 border-white/25 items-center justify-center text-[#10b981] hover:text-[#032b1d] cursor-pointer shadow-lg transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={() => setIsRightPanelCollapsed(false)}
          title="Expand Right Inspector Panel"
          className="p-2 rounded-lg bg-[#10b981] text-[#032b1d] hover:bg-[#34d399] cursor-pointer shadow-lg flex items-center gap-1.5 font-bold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="lg:hidden text-xs font-bold">Expand Style &amp; Edit Panel</span>
        </button>
        <span className="hidden lg:block mt-4 text-[10px] font-bold text-[#94a3b8] [writing-mode:vertical-rl] tracking-widest uppercase">
          Captions &amp; Edit Panel
        </span>
      </aside>
    );
  }

  return (
    <aside
      style={{ '--right-panel-w': `${rightPanelWidthPx}px` } as React.CSSProperties}
      className={`${
        mobileVisible ? 'flex' : 'hidden lg:flex'
      } order-3 lg:order-3 w-full lg:w-[var(--right-panel-w)] max-w-full flex-1 lg:flex-initial min-h-0 shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-[#131315] flex-col lg:h-full overflow-visible select-none relative z-30`}
    >
      {/* Dynamic Left-Edge Drag Resizer */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          isResizingRightRef.current = true;
          const startX = e.clientX;
          const startW = rightPanelWidthPx;
          const onMove = (moveEvent: MouseEvent) => {
            if (!isResizingRightRef.current) return;
            const deltaX = startX - moveEvent.clientX;
            const nextW = Math.max(300, Math.min(560, startW + deltaX));
            setRightPanelWidthPx(nextW);
          };
          const onUp = () => {
            isResizingRightRef.current = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
        onDoubleClick={() => setRightPanelWidthPx(380)}
        title="Drag to resize Right Panel · Double-click to reset width"
        className="hidden lg:flex absolute -left-1.5 inset-y-0 z-30 w-3 cursor-col-resize items-center justify-center group"
      >
        <div className="w-[2px] h-full bg-transparent group-hover:bg-[#10b981]/70 transition-colors" />
        <div className="absolute top-1/2 -translate-y-14 w-1 h-8 rounded-full bg-white/20 group-hover:bg-[#10b981] transition-colors" />
      </div>

      {/* Prominent Minimize / Collapse Toggle Button on the Left Edge of Right Panel (Matching Screenshot 1 & 2) */}
      <button
        type="button"
        onClick={() => setIsRightPanelCollapsed(true)}
        title="Minimize / Collapse Right Panel"
        className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-50 w-4 h-12 rounded-l-lg bg-[#1C1C22] hover:bg-[#10b981] border border-r-0 border-white/25 items-center justify-center text-zinc-200 hover:text-[#032b1d] cursor-pointer shadow-lg transition-colors"
      >
        <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      {/* Primary Top Tabs ("Captions" and "Edit") + Quick Minimize Button */}
      <div className="p-2.5 sm:p-3 border-b border-white/[0.06] shrink-0 flex items-center gap-2">
        <div className="flex-1 grid grid-cols-2 p-1 bg-[#1c1c1f] rounded-lg border border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              onCloseLineStyling?.();
              setTopPanelMode('captions');
            }}
            className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              topPanelMode === 'captions'
                ? 'bg-[#26262a] text-white shadow-sm'
                : 'font-medium text-[#94a3b8] hover:text-white'
            }`}
          >
            Captions
          </button>
          <button
            type="button"
            onClick={() => {
              onCloseLineStyling?.();
              setTopPanelMode('edit');
            }}
            className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              topPanelMode === 'edit'
                ? 'bg-[#26262a] text-white shadow-sm'
                : 'font-medium text-[#94a3b8] hover:text-white'
            }`}
          >
            Edit
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsRightPanelCollapsed(true)}
          title="Minimize Right Panel"
          className="hidden lg:flex w-8 h-8 rounded-lg bg-[#1c1c1f] hover:bg-[#10b981] border border-white/10 items-center justify-center text-zinc-300 hover:text-[#032b1d] cursor-pointer transition-colors shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-Tabs inside "Captions" Mode: Text | Templates | Transitions (New) | AI Audio | Position | Colors | Mask | B-Roll | Export */}
      {topPanelMode === 'captions' && (
        <div className="flex items-center overflow-x-auto no-scrollbar border-b border-white/[0.06] px-2 bg-[#131315] shrink-0">
          {(
            [
              { id: 'text-effects', label: 'Text', isNew: false },
              { id: 'templates48', label: 'Templates', isNew: false },
              { id: 'transitions', label: 'Transitions', isNew: true },
              { id: 'ai-audio', label: 'AI Audio', isNew: false },
              { id: 'spacing', label: 'Position', isNew: false },
              { id: 'gradients', label: 'Colors', isNew: false },
              { id: 'mask', label: 'Mask', isNew: false },
              { id: 'broll', label: 'B-Roll', isNew: false },
              { id: 'export', label: 'Export', isNew: false },
            ] as const
          ).map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-2.5 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'font-semibold text-white border-[#24B47E]'
                    : 'text-[#94a3b8] hover:text-white border-transparent'
                }`}
              >
                <span>{t.label}</span>
                {t.isNew && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#132F23] text-[#34D399] border border-[#24B47E]/40 text-[9px] font-bold leading-none">
                    New
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        <>
        {/* TOP MODE 2: EDIT TAB (Section 11 — Video Clip Transform, Crop, Composite, Volume) */}
        {topPanelMode === 'edit' && (
          <KalakarVideoEditTab
            videoClipEdit={styleConfig.videoClipEdit || DEFAULT_VIDEO_CLIP_EDIT}
            isMuted={isMuted}
            onUpdateVideoClipEdit={(partial) =>
              onUpdateStyle({
                videoClipEdit: {
                  ...(styleConfig.videoClipEdit || DEFAULT_VIDEO_CLIP_EDIT),
                  ...partial,
                },
              })
            }
            onToggleMute={() => onToggleMute?.()}
          />
        )}

        {/* TOP MODE 1: CAPTIONS SUB-TABS */}
        {topPanelMode === 'captions' && activeTab === 'templates48' && (
          <KalakarTemplatesTab
            styleConfig={styleConfig}
            userPresets={presets}
            userPlan={userPlan}
            onApplyPreset={onApplyPreset}
            onUpdateStyle={onUpdateStyle}
            onCreateNewPreset={onCreateNewPreset}
            onUpgradePlan={onUpgradePlan}
          />
        )}

        {topPanelMode === 'captions' && activeTab === 'text-effects' && (
          <KalakarTextAndEffectsTab
            styleConfig={styleConfig}
            customFonts={customFonts}
            onUpdateStyle={onUpdateStyle}
          />
        )}

        {topPanelMode === 'captions' && activeTab === 'transitions' && (
          <KalakarTransitionsTab
            styleConfig={styleConfig}
            emphasizedWordCount={emphasizedWordCount}
            selectedLineLabel={selectedLineLabel}
            onUpdateStyle={onUpdateStyle}
            onPreviewTransition={() => onPreviewTransition?.()}
          />
        )}

        {topPanelMode === 'captions' && activeTab === 'broll' && (
          <AIBRollStudioPanel
            segments={segments}
            primaryTrack={styleConfig.primaryTrack}
            styleConfig={styleConfig}
            aiBRollSlots={aiBRollSlots}
            isAnalyzingScript={isAnalyzingBRollScript}
            onUpdateStyle={onUpdateStyle}
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
            onSeekTo={(t) => onSeekTo?.(t)}
          />
        )}

        {topPanelMode === 'captions' && activeTab === 'ai-audio' && (
          <KalakarAiAudioTab
            audioEnhancer={audioEnhancer}
            audioCleansRemaining={audioCleansRemaining}
            styleConfig={styleConfig}
            onUpdateStyle={onUpdateStyle}
            onUpdateAudioEnhancer={(partial) => onUpdateAudioEnhancer?.(partial)}
            onExportEnhancedWAV={onExportAudioWAV}
          />
        )}

        {/* TAB 1: APPLE-STYLE "SIDZ_<NAME>" ALL-IN-ONE CREATOR SHEET */}
        {topPanelMode === 'captions' && activeTab === 'easy' && (
          <div className="space-y-4">
            {/* 1. One-Tap SIDZ_<NAME> Presets (Live-Updatable) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0A84FF]" />
                  <span>1. Select or Update SIDZ_&lt;NAME&gt; Preset</span>
                </h2>
                <button
                  type="button"
                  onClick={onResetPresets}
                  title="Reset all SIDZ presets to factory defaults"
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => {
                  const isSelected = styleConfig.presetId === preset.id;
                  const gStart = preset.config.gradientStart || '#FFFFFF';
                  const gMid = preset.config.gradientMid || '#FDE047';
                  const gEnd = preset.config.gradientEnd || '#EAB308';
                  const isInverted =
                    preset.config.hierarchyMode === 'sidz-truly-flame';
                  const isLala =
                    preset.id === 'kalakar-lala' ||
                    preset.name.toLowerCase() === 'lala' ||
                    preset.config.hierarchyMode === 'lala-handwritten';

                  if (isLala) {
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          onApplyPreset(preset);
                          setPresetNameDraft(preset.name);
                          setPresetBadgeDraft(preset.badgeText);
                        }}
                        className={`col-span-2 rounded-2xl overflow-hidden border-2 text-left transition-all cursor-pointer bg-[#141519] shadow-lg ${
                          isSelected
                            ? 'border-[#2BAE66] ring-2 ring-[#2BAE66]/25'
                            : 'border-white/10 hover:border-[#2BAE66]/60'
                        }`}
                      >
                        <div className="px-3.5 py-2 bg-[#15161A] flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">
                              {preset.name}
                            </span>
                            <svg
                              viewBox="0 0 24 24"
                              className="w-3.5 h-3.5 shrink-0"
                              fill="none"
                            >
                              <circle cx="12" cy="12" r="10" fill="#0095F6" />
                              <path
                                d="M8.5 12.5L10.8 14.8L15.8 9.8"
                                stroke="#FFFFFF"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#2BAE66] flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </span>
                          )}
                        </div>
                        <div className="h-[86px] bg-[#FAF6E8] flex flex-col items-center justify-center px-3">
                          <span
                            className="text-[15px] font-semibold text-[#1C434C] leading-none"
                            style={{ fontFamily: '"Caveat", cursive' }}
                          >
                            {preset.smallPreviewText || 'Arey Maalik, mein houn'}
                          </span>
                          <span
                            className="text-[26px] font-bold text-[#1C434C] leading-none -mt-0.5"
                            style={{ fontFamily: '"Caveat", cursive' }}
                          >
                            {preset.badgeText || 'Paritosh Anand'}
                          </span>
                          <svg
                            viewBox="0 0 210 18"
                            className="w-[130px] h-[13px] -mt-0.5"
                            fill="none"
                          >
                            <path
                              d="M14 9 C 62 2, 138 2, 196 8"
                              stroke="#EB4823"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                            <path
                              d="M6 14 C 64 6, 145 6, 202 12"
                              stroke="#EB4823"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onApplyPreset(preset);
                        setPresetNameDraft(preset.name);
                        setPresetBadgeDraft(preset.badgeText);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-[118px] bg-gradient-to-b ${preset.previewBg} ${
                        isSelected
                          ? 'border-[#0A84FF] ring-2 ring-[#0A84FF]/30'
                          : 'border-white/[0.08] hover:border-white/25'
                      }`}
                    >
                      {/* Top Header: SIDZ_<NAME> + Font Info */}
                      <div className="flex items-center justify-between w-full gap-1">
                        <span className="text-[10px] font-mono-tabular font-bold text-zinc-200 truncate">
                          {preset.name}
                        </span>
                        {isSelected ? (
                          <span className="w-4 h-4 rounded-full bg-[#0A84FF] flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono-tabular text-zinc-400 shrink-0">
                            {preset.config.fontSize || 56}px
                          </span>
                        )}
                      </div>

                      {/* Visual Miniature Preview of the Exact SIDZ Multi-Tier Look */}
                      <div className="my-auto py-0.5 flex flex-col justify-center">
                        {!isInverted && preset.smallPreviewText && (
                          <span
                            className="text-[10px] text-white/95 font-medium leading-none mb-0.5 drop-shadow-[1px_0_0_rgba(0,228,255,0.75)] truncate"
                            style={{
                              fontFamily: preset.config.fontFamily || 'Plus Jakarta Sans',
                            }}
                          >
                            {preset.smallPreviewText}
                          </span>
                        )}

                        <span
                          className="text-lg font-extrabold tracking-tight leading-none block truncate bg-clip-text text-transparent"
                          style={{
                            fontFamily:
                              preset.config.heroWordFontFamily ||
                              preset.config.fontFamily,
                            backgroundImage: `linear-gradient(180deg, ${gStart} 0%, ${gMid} 52%, ${gEnd} 100%)`,
                          }}
                        >
                          {preset.badgeText}
                        </span>

                        {preset.scriptPreviewText && (
                          <span
                            className="text-[11px] text-white self-end -mt-1 pr-1 leading-none"
                            style={{
                              fontFamily:
                                preset.config.accentScriptFontFamily ||
                                'Kaushan Script',
                            }}
                          >
                            {preset.scriptPreviewText}
                          </span>
                        )}

                        {isInverted && preset.smallPreviewText && (
                          <span
                            className="text-[10px] text-white/95 font-medium self-end mt-0.5 leading-none drop-shadow-[1px_0_0_rgba(0,228,255,0.75)] truncate"
                            style={{
                              fontFamily: preset.config.fontFamily || 'Plus Jakarta Sans',
                            }}
                          >
                            {preset.smallPreviewText}
                          </span>
                        )}
                      </div>

                      <div className="text-[9px] text-zinc-400 truncate flex items-center justify-between">
                        <span className="truncate">
                          {preset.config.heroWordFontFamily || 'Anton'}
                        </span>
                        <span className="font-mono-tabular text-[#FFD60A]">
                          {Math.round((preset.config.bigWordScale || 2.15) * 100)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. SIDZ Layout Structure Selector (The 4 Exact Reference Layouts) */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  2. SIDZ Layout Composition
                </span>
                <span className="text-[11px] text-[#FFD60A]">
                  4 Reference Modes
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {SIDZ_LAYOUT_MODES.map((m) => {
                  const active = styleConfig.hierarchyMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        onUpdateStyle({
                          hierarchyMode: m.id,
                          animationType: 'premiere-pro',
                          textTransform:
                            m.id === 'sidz-truly-flame' ? 'none' : 'uppercase',
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-[#0A84FF] border-[#0A84FF] text-white shadow-sm'
                          : 'bg-[#121216] border-white/[0.06] text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      <div className="text-[11px] font-bold font-mono-tabular truncate">
                        {m.label}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          active ? 'text-white/90' : 'text-zinc-400'
                        }`}
                      >
                        {m.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. SIDZ Caption Model: Increase / Decrease Fonts, Edit Fonts & Update Preset */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-[#0A84FF]/35 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    3. Edit {activePresetObj?.name || styleConfig.presetId} Fonts &amp; Sizes
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Adjust small/big size, spacing &amp; update preset
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('spacing')}
                  className="text-[11px] text-[#0A84FF] hover:underline cursor-pointer shrink-0"
                >
                  Spacing &amp; Pos →
                </button>
              </div>

              {/* A- / A+ Font Size Controls (Base Font Size, Giant Hero Scale, Small Text Scale) */}
              <div className="space-y-2.5 bg-[#131318] p-2.5 rounded-xl border border-white/[0.06]">
                {/* Row 1: Overall Base Font Size (A- / A+) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-300 font-medium">
                      Base Font Size
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjustBaseFontSize(-4)}
                        title="Decrease Font Size (A-)"
                        className="px-2 py-0.5 rounded-lg bg-[#24242E] hover:bg-[#323240] text-white font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                        <span>A-</span>
                      </button>
                      <span className="font-mono-tabular font-bold text-[#0A84FF] w-11 text-center">
                        {styleConfig.fontSize}px
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustBaseFontSize(4)}
                        title="Increase Font Size (A+)"
                        className="px-2 py-0.5 rounded-lg bg-[#0A84FF] hover:bg-[#0070E0] text-white font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>A+</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={110}
                    step={2}
                    value={styleConfig.fontSize}
                    onChange={(e) =>
                      onUpdateStyle({ fontSize: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-[#0A84FF] h-1.5 cursor-pointer"
                  />
                </div>

                {/* Row 2: Giant Hero Word Size & Small Lead Text Size */}
                <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-white/[0.05]">
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-zinc-400">Big Size</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => adjustGiantScale(-0.12)}
                          className="w-5 h-5 rounded bg-[#24242E] hover:bg-[#323240] text-white flex items-center justify-center cursor-pointer"
                          title="Decrease Big Word Size"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono-tabular font-bold text-[#FFD60A]">
                          {Math.round(styleConfig.bigWordScale * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustGiantScale(0.12)}
                          className="w-5 h-5 rounded bg-[#24242E] hover:bg-[#323240] text-white flex items-center justify-center cursor-pointer"
                          title="Increase Big Word Size"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={3.4}
                      step={0.05}
                      value={styleConfig.bigWordScale}
                      onChange={(e) =>
                        onUpdateStyle({
                          bigWordScale: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-[#FFD60A] h-1.5 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-zinc-400">Small Size</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => adjustSmallScale(-0.06)}
                          className="w-5 h-5 rounded bg-[#24242E] hover:bg-[#323240] text-white flex items-center justify-center cursor-pointer"
                          title="Decrease Small Text Size"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono-tabular font-bold text-zinc-200">
                          {Math.round(styleConfig.smallWordScale * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustSmallScale(0.06)}
                          className="w-5 h-5 rounded bg-[#24242E] hover:bg-[#323240] text-white flex items-center justify-center cursor-pointer"
                          title="Increase Small Text Size"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0.35}
                      max={1.35}
                      step={0.04}
                      value={styleConfig.smallWordScale}
                      onChange={(e) =>
                        onUpdateStyle({
                          smallWordScale: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-[#0A84FF] h-1.5 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Direct Font Selectors for Giant Hero Font & Small Lead Font + Custom Font Upload */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      Big Hero Font
                    </label>
                    <select
                      value={styleConfig.heroWordFontFamily}
                      onChange={(e) =>
                        onUpdateStyle({ heroWordFontFamily: e.target.value })
                      }
                      className="w-full bg-[#131318] text-xs font-semibold text-white px-2.5 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#0A84FF]"
                    >
                      {customFonts.map((cf) => (
                        <option key={`hero-cf-${cf}`} value={cf}>
                          {cf} (Uploaded Custom)
                        </option>
                      ))}
                      {AVAILABLE_FONTS.map((f) => (
                        <option key={`hero-${f.name}`} value={f.name}>
                          {f.name} ({f.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      Small Lead Font
                    </label>
                    <select
                      value={styleConfig.fontFamily}
                      onChange={(e) => onUpdateStyle({ fontFamily: e.target.value })}
                      className="w-full bg-[#131318] text-xs font-semibold text-white px-2.5 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#0A84FF]"
                    >
                      {customFonts.map((cf) => (
                        <option key={`small-cf-${cf}`} value={cf}>
                          {cf} (Uploaded Custom)
                        </option>
                      ))}
                      {AVAILABLE_FONTS.map((f) => (
                        <option key={`small-${f.name}`} value={f.name}>
                          {f.name} ({f.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {onUploadCustomFont && (
                  <label className="w-full py-1.5 px-3 rounded-xl bg-[#16161F] hover:bg-[#222230] border border-dashed border-[#F59E0B]/40 text-[#F59E0B] text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Custom Font (.TTF / .OTF / .WOFF2)</span>
                    <input
                      type="file"
                      accept=".ttf,.otf,.woff,.woff2"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUploadCustomFont(f);
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Update Active SIDZ_<NAME> Preset or Save as New SIDZ_<NAME> Preset */}
              <div className="pt-2 border-t border-white/[0.08] space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={presetNameDraft || activePresetObj?.name || styleConfig.presetId}
                    onChange={(e) => setPresetNameDraft(e.target.value)}
                    placeholder="SIDZ_CUSTOM"
                    className="bg-[#131318] text-[11px] font-mono-tabular font-bold text-white px-2.5 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#0A84FF]"
                  />
                  <input
                    type="text"
                    value={presetBadgeDraft || activePresetObj?.badgeText || 'VAIRAGYA'}
                    onChange={(e) => setPresetBadgeDraft(e.target.value)}
                    placeholder="Sample Hero Word"
                    className="bg-[#131318] text-[11px] font-semibold text-[#FFD60A] px-2.5 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#0A84FF]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateActivePreset(
                        presetNameDraft.trim() || undefined,
                        presetBadgeDraft.trim() || undefined
                      )
                    }
                    className="py-2 px-2.5 rounded-xl bg-[#30D158]/20 hover:bg-[#30D158]/30 border border-[#30D158]/40 text-[#30D158] font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span className="truncate">
                      Update {activePresetObj?.name || 'Preset'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cleanName = (
                        presetNameDraft.trim() ||
                        `SIDZ_CUSTOM_${presets.length + 1}`
                      )
                        .toUpperCase()
                        .replace(/\s+/g, '_');
                      const finalName = cleanName.startsWith('SIDZ_')
                        ? cleanName
                        : `SIDZ_${cleanName}`;
                      onCreateNewPreset(
                        finalName,
                        presetBadgeDraft.trim() || 'HERO WORD'
                      );
                    }}
                    className="py-2 px-2.5 rounded-xl bg-[#24242E] hover:bg-[#30303E] border border-white/10 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#0A84FF]" />
                    <span className="truncate">Save as New SIDZ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Quick Gradient Preview + Link to All 24+ Gradients */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  4. Gradient Color Combinations ({allGradients.length})
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('gradients')}
                  className="text-[11px] text-[#0A84FF] hover:underline font-semibold cursor-pointer"
                >
                  All {allGradients.length} + Custom →
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 max-h-[195px] overflow-y-auto pr-1">
                {allGradients.slice(0, 12).map((gp) => {
                  const active =
                    styleConfig.useGradient &&
                    styleConfig.gradientPresetId === gp.id;
                  return (
                    <button
                      key={gp.id}
                      type="button"
                      onClick={() => handleApplyGradientPreset(gp)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-[#0A84FF] bg-[#262630] ring-1 ring-[#0A84FF]/40'
                          : 'border-white/[0.06] bg-[#141418] hover:border-white/20'
                      }`}
                    >
                      <div
                        className="h-5 w-full rounded-full mb-1 shadow-inner"
                        style={{
                          background: buildCssGradientPreview(
                            gp.colors,
                            styleConfig.gradientDirection,
                            styleConfig.gradientAngle
                          ),
                        }}
                      />
                      <div className="text-[10px] font-medium text-zinc-200 truncate">
                        {gp.name}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Toggles for Mask & Instagram Frame */}
              <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStyle({
                      captionFrameStyle:
                        styleConfig.captionFrameStyle === 'ig-polaroid-frame'
                          ? 'none'
                          : 'ig-polaroid-frame',
                    })
                  }
                  className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    styleConfig.captionFrameStyle === 'ig-polaroid-frame'
                      ? 'bg-gradient-to-r from-[#F58529]/30 via-[#DD2A7B]/30 to-[#8134AF]/30 border-[#DD2A7B] text-white'
                      : 'bg-[#121216] border-white/10 text-zinc-300 hover:text-white'
                  }`}
                >
                  <span>♥ 💬 ➤ IG Text Frame</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStyle({
                      maskMode:
                        styleConfig.maskMode === 'none'
                          ? 'linear-top-bottom'
                          : 'none',
                    })
                  }
                  className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    styleConfig.maskMode !== 'none'
                      ? 'bg-[#0A84FF]/25 border-[#0A84FF] text-white'
                      : 'bg-[#121216] border-white/10 text-zinc-300 hover:text-white'
                  }`}
                >
                  <span>
                    {styleConfig.maskMode !== 'none'
                      ? `Mask: ${styleConfig.maskMode}`
                      : '+ Black Gradient Mask'}
                  </span>
                </button>
              </div>
            </div>

            {/* 5. Quick 1-Tap Export (.MP4 & .WP2 with Full Audio) */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-[#0A84FF]/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#30D158]" />
                  <span>5. Export Video + Audio</span>
                </span>
                <span className="text-[10px] text-[#30D158] font-medium">
                  Audio Included
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onExportBurnedVideo('mp4')}
                  className="py-2.5 px-3 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>
                    {isExportingVideo && exportFormat === 'mp4'
                      ? `Save .MP4 (${exportProgress}%)`
                      : 'Export .MP4'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onExportBurnedVideo('wp2')}
                  className="py-2.5 px-3 rounded-xl bg-[#262630] hover:bg-[#32323F] border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#5AC8FA]" />
                  <span>
                    {isExportingVideo && exportFormat === 'wp2'
                      ? `Save .WP2 (${exportProgress}%)`
                      : 'Export .WP2'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ALL 24+ REFERENCE GRADIENTS & CUSTOM GRADIENT BUILDER */}
        {activeTab === 'gradients' && (
          <div className="space-y-4">
            {/* Gradient Direction & Angle Selector */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Gradient Direction &amp; Angle
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStyle({ useGradient: !styleConfig.useGradient })
                  }
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    styleConfig.useGradient
                      ? 'bg-[#30D158]/20 text-[#30D158]'
                      : 'bg-[#2A2A32] text-zinc-400'
                  }`}
                >
                  {styleConfig.useGradient ? 'Gradient ON' : 'Solid Color'}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5 bg-[#121216] p-1 rounded-xl">
                {(
                  [
                    { id: 'vertical', label: 'Vertical ↓' },
                    { id: 'horizontal', label: 'Horiz →' },
                    { id: 'diagonal', label: 'Angle ↘' },
                    { id: 'radial', label: 'Radial ◎' },
                  ] as { id: GradientDirection; label: string }[]
                ).map((d) => {
                  const active =
                    (styleConfig.gradientDirection || 'vertical') === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() =>
                        onUpdateStyle({
                          useGradient: true,
                          gradientDirection: d.id,
                        })
                      }
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#0A84FF] text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>

              {styleConfig.gradientDirection === 'diagonal' && (
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Gradient Angle</span>
                    <span className="font-mono-tabular text-[#FFD60A]">
                      {styleConfig.gradientAngle ?? 135}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={5}
                    value={styleConfig.gradientAngle ?? 135}
                    onChange={(e) =>
                      onUpdateStyle({
                        gradientAngle: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-[#0A84FF] h-1.5 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* All 24 Reference Image Pill Gradients + 6 SIDZ Gradients + Saved Custom Gradients */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-white">
                  All {allGradients.length} Gradient Combinations
                </h2>
                <span className="text-[10px] text-zinc-400">
                  Tap any pill to apply
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 max-h-[340px] overflow-y-auto pr-1">
                {allGradients.map((gp) => {
                  const active =
                    styleConfig.useGradient &&
                    styleConfig.gradientPresetId === gp.id;
                  const isCustom = gp.id.startsWith('custom-grad-');
                  return (
                    <button
                      key={gp.id}
                      type="button"
                      onClick={() => handleApplyGradientPreset(gp)}
                      className={`relative p-2 rounded-2xl border text-left transition-all cursor-pointer group ${
                        active
                          ? 'border-[#0A84FF] bg-[#262630] ring-2 ring-[#0A84FF]/30'
                          : 'border-white/[0.07] bg-[#16161C] hover:border-white/25'
                      }`}
                    >
                      <div
                        className="h-7 w-full rounded-full mb-1.5 border border-white/20 shadow-md"
                        style={{
                          background: buildCssGradientPreview(
                            gp.colors,
                            styleConfig.gradientDirection,
                            styleConfig.gradientAngle
                          ),
                        }}
                      />
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold text-zinc-200 truncate">
                          {gp.name}
                        </span>
                        {isCustom && (
                          <span
                            onClick={(e) => handleDeleteCustomGradient(gp.id, e)}
                            title="Delete custom gradient"
                            className="text-zinc-500 hover:text-rose-400 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom 3-Stop / 4-Stop Gradient Combination Builder */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-[#0A84FF]/35 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Custom Gradient Combination Builder
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !useFourthStop;
                    setUseFourthStop(next);
                    onUpdateStyle({
                      gradientFourth: next
                        ? styleConfig.gradientFourth || '#5CA8FF'
                        : undefined,
                    });
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold cursor-pointer ${
                    useFourthStop
                      ? 'bg-[#0A84FF]/25 text-[#5AC8FA] border border-[#0A84FF]/40'
                      : 'bg-[#121216] text-zinc-400 border border-white/10'
                  }`}
                >
                  {useFourthStop ? '4 Color Stops' : '+ Add 4th Stop'}
                </button>
              </div>

              {/* Live Custom Pill Preview */}
              <div
                className="h-9 w-full rounded-full border border-white/25 shadow-lg"
                style={{
                  background: buildCssGradientPreview(
                    [
                      styleConfig.gradientStart || '#FF4500',
                      styleConfig.gradientMid || '#FFD700',
                      styleConfig.gradientEnd || '#F4F8FF',
                      useFourthStop
                        ? styleConfig.gradientFourth || '#5CA8FF'
                        : undefined,
                    ],
                    styleConfig.gradientDirection,
                    styleConfig.gradientAngle
                  ),
                }}
              />

              <div
                className={`grid ${
                  useFourthStop ? 'grid-cols-4' : 'grid-cols-3'
                } gap-2`}
              >
                <label className="bg-[#121216] p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer border border-white/[0.06]">
                  <span className="text-[10px] text-zinc-400">Stop 1</span>
                  <input
                    type="color"
                    value={styleConfig.gradientStart || '#FF4500'}
                    onChange={(e) =>
                      onUpdateStyle({
                        useGradient: true,
                        gradientPresetId: 'custom',
                        gradientStart: e.target.value,
                      })
                    }
                    className="w-8 h-6 rounded bg-transparent border-0 cursor-pointer"
                  />
                  <span className="text-[9px] font-mono-tabular text-zinc-400">
                    {styleConfig.gradientStart}
                  </span>
                </label>

                <label className="bg-[#121216] p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer border border-white/[0.06]">
                  <span className="text-[10px] text-zinc-400">Stop 2</span>
                  <input
                    type="color"
                    value={styleConfig.gradientMid || '#FFD700'}
                    onChange={(e) =>
                      onUpdateStyle({
                        useGradient: true,
                        gradientPresetId: 'custom',
                        gradientMid: e.target.value,
                      })
                    }
                    className="w-8 h-6 rounded bg-transparent border-0 cursor-pointer"
                  />
                  <span className="text-[9px] font-mono-tabular text-zinc-400">
                    {styleConfig.gradientMid}
                  </span>
                </label>

                <label className="bg-[#121216] p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer border border-white/[0.06]">
                  <span className="text-[10px] text-zinc-400">Stop 3</span>
                  <input
                    type="color"
                    value={styleConfig.gradientEnd || '#5CA8FF'}
                    onChange={(e) =>
                      onUpdateStyle({
                        useGradient: true,
                        gradientPresetId: 'custom',
                        gradientEnd: e.target.value,
                      })
                    }
                    className="w-8 h-6 rounded bg-transparent border-0 cursor-pointer"
                  />
                  <span className="text-[9px] font-mono-tabular text-zinc-400">
                    {styleConfig.gradientEnd}
                  </span>
                </label>

                {useFourthStop && (
                  <label className="bg-[#121216] p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer border border-white/[0.06]">
                    <span className="text-[10px] text-zinc-400">Stop 4</span>
                    <input
                      type="color"
                      value={styleConfig.gradientFourth || '#5CA8FF'}
                      onChange={(e) =>
                        onUpdateStyle({
                          useGradient: true,
                          gradientPresetId: 'custom',
                          gradientFourth: e.target.value,
                        })
                      }
                      className="w-8 h-6 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <span className="text-[9px] font-mono-tabular text-zinc-400">
                      {styleConfig.gradientFourth || '#5CA8FF'}
                    </span>
                  </label>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customGradName}
                  onChange={(e) => setCustomGradName(e.target.value)}
                  placeholder="Name custom gradient..."
                  className="flex-1 bg-[#121216] text-xs text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#0A84FF]"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomGradient}
                  className="px-3.5 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Gradient</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ON-SCREEN 2D POSITION, INDIVIDUAL SMALL/BIG ALIGNMENT, 2-LINE ARRANGEMENT & SPACING */}
        {activeTab === 'spacing' && (
          <div className="space-y-4">
            {/* 0. INDIVIDUAL SMALL & BIG TEXT ALIGNMENT + 2-LINE SMALL TEXT ARRANGEMENT STUDIO */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-[#FFD60A]/40 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-semibold text-white">
                    Individual Small &amp; Big Text Alignment &amp; 2-Line Arrangement
                  </h2>
                  <p className="text-[10px] text-zinc-400">
                    Align, resize &amp; arrange Small Line 1, Small Line 2, and Big Text individually on screen
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStyle({
                      smallOffsetX: 0,
                      smallOffsetY: 0,
                      smallLine2OffsetX: 0,
                      smallLine2OffsetY: 0,
                      bigOffsetX: 0,
                      bigOffsetY: 0,
                      smallTextAlign: 'left',
                      smallLine2TextAlign: 'left',
                      bigTextAlign: 'center',
                    })
                  }
                  className="px-2 py-1 rounded-lg bg-[#24242E] hover:bg-[#30303E] text-[10px] font-semibold text-zinc-200 cursor-pointer shrink-0"
                >
                  Reset Offsets
                </button>
              </div>

              {/* On-Screen Active Layer Selector + Transform Bounding Boxes Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-300 font-semibold">
                    Select Layer to Drag / Resize on Screen:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateStyle({
                        showOnScreenTransformBoxes: !styleConfig.showOnScreenTransformBoxes,
                      })
                    }
                    className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-all ${
                      styleConfig.showOnScreenTransformBoxes === true
                        ? 'bg-[#FFD60A]/20 text-[#FFD60A] border border-[#FFD60A]/40'
                        : 'bg-[#121216] text-zinc-400 border border-white/10'
                    }`}
                  >
                    {styleConfig.showOnScreenTransformBoxes === true
                      ? 'Guides: ON'
                      : 'Guides: OFF (Clean Text)'}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1 bg-[#121216] p-1 rounded-xl">
                  {(
                    [
                      { id: 'all', label: 'All Group' },
                      { id: 'small1', label: 'Small Line 1' },
                      { id: 'small2', label: 'Small Line 2' },
                      { id: 'big', label: 'Big Text' },
                    ] as const
                  ).map((layer) => {
                    const active = (styleConfig.selectedCanvasLayer || 'all') === layer.id;
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        onClick={() =>
                          onUpdateStyle({ selectedCanvasLayer: layer.id })
                        }
                        className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer truncate ${
                          active
                            ? 'bg-[#FFD60A] text-zinc-950 shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {layer.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2-Line Small Text Mode & Stack Order Arrangement */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#121216] p-2 rounded-xl space-y-1">
                  <span className="text-[10px] font-semibold text-zinc-400 block">
                    Small 2-Line Text Split:
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: 'auto', label: 'Auto' },
                        { id: 'two-line-split', label: '2-Line' },
                        { id: 'single-line', label: '1-Line' },
                      ] as const
                    ).map((m) => {
                      const active = (styleConfig.smallTwoLineMode || 'auto') === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onUpdateStyle({ smallTwoLineMode: m.id })}
                          className={`py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            active
                              ? 'bg-[#0A84FF] text-white'
                              : 'bg-[#1C1C24] text-zinc-400 hover:text-white'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#121216] p-2 rounded-xl space-y-1">
                  <span className="text-[10px] font-semibold text-zinc-400 block">
                    Line Vertical Order:
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: 'small1-small2-big', label: 'S1·S2·Big' },
                        { id: 'small1-big-small2', label: 'S1·Big·S2' },
                        { id: 'big-small1-small2', label: 'Big·S1·S2' },
                      ] as const
                    ).map((ord) => {
                      const active =
                        (styleConfig.lineOrderMode || 'small1-small2-big') === ord.id;
                      return (
                        <button
                          key={ord.id}
                          type="button"
                          onClick={() => onUpdateStyle({ lineOrderMode: ord.id })}
                          className={`py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all ${
                            active
                              ? 'bg-[#0A84FF] text-white'
                              : 'bg-[#1C1C24] text-zinc-400 hover:text-white'
                          }`}
                        >
                          {ord.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Individual Layer Controls: Small Line 1, Small Line 2, and Big Hero Text */}
              <div className="space-y-2">
                {/* SMALL LINE 1 CARD */}
                <div className="bg-[#121216] p-2.5 rounded-xl border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-sky-400">
                      Small Line 1 (Lead Text)
                    </span>
                    <div className="flex items-center gap-1">
                      {(['left', 'center', 'right'] as const).map((align) => {
                        const active = (styleConfig.smallTextAlign || 'left') === align;
                        return (
                          <button
                            key={`s1-${align}`}
                            type="button"
                            onClick={() => onUpdateStyle({ smallTextAlign: align })}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer transition-all ${
                              active
                                ? 'bg-sky-500 text-zinc-950'
                                : 'bg-[#1E1E26] text-zinc-400 hover:text-white'
                            }`}
                          >
                            {align}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-0.5">
                        <span>Size</span>
                        <span className="font-mono-tabular text-white font-bold">
                          {Math.round((styleConfig.smallWordScale || 0.68) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.35}
                        max={1.45}
                        step={0.04}
                        value={styleConfig.smallWordScale || 0.68}
                        onChange={(e) =>
                          onUpdateStyle({ smallWordScale: parseFloat(e.target.value) })
                        }
                        className="w-full accent-sky-400 h-1.5 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-0.5">
                        <span>X Pos</span>
                        <span className="font-mono-tabular text-white font-bold">
                          {Math.round(styleConfig.smallOffsetX ?? 0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-45}
                        max={45}
                        step={1}
                        value={styleConfig.smallOffsetX ?? 0}
                        onChange={(e) =>
                          onUpdateStyle({ smallOffsetX: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-sky-400 h-1.5 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-0.5">
                        <span>Y Pos</span>
                        <span className="font-mono-tabular text-white font-bold">
                          {Math.round(styleConfig.smallOffsetY ?? 0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-35}
                        max={35}
                        step={1}
                        value={styleConfig.smallOffsetY ?? 0}
                        onChange={(e) =>
                          onUpdateStyle({ smallOffsetY: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-sky-400 h-1.5 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* SMALL LINE 2 CARD */}
                <div className="bg-[#121216] p-2.5 rounded-xl border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-emerald-400">
                      Small Line 2 (2nd Small / Tail Line)
                    </span>
                    <div className="flex items-center gap-1">
                      {(['left', 'center', 'right'] as const).map((align) => {
                        const active =
                          (styleConfig.smallLine2TextAlign || 'left') === align;
                        return (
                          <button
                            key={`s2-${align}`}
                            type="button"
                            onClick={() =>
                              onUpdateStyle({ smallLine2TextAlign: align })
                            }
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer transition-all ${
                              active
                                ? 'bg-emerald-400 text-zinc-950'
                                : 'bg-[#1E1E26] text-zinc-400 hover:text-white'
                            }`}
                          >
                            {align}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-0.5">
                        <span>Size</span>
                        <span className="font-mono-tabular text-white font-bold">
                          {Math.round(
                            (styleConfig.smallLine2Scale ??
                              styleConfig.smallWordScale ??
                              0.68) * 100
                          )}
                          %
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.35}
                        max={1.45}
                        step={0.04}
                        value={
                          styleConfig.smallLine2Scale ??
                          styleConfig.smallWordScale ??
                          0.68
                        }
                        onChange={(e) =>
                          onUpdateStyle({
                            smallLine2Scale: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-0.5">
                        <span>X Pos</span>
                        <span className="font-mono-tabular text-white font-bold">
                          {Math.round(styleConfig.smallLine2OffsetX ?? 0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-45}
                        max={45}
                        step={1}
                        value={styleConfig.smallLine2OffsetX ?? 0}
                        onChange={(e) =>
                          onUpdateStyle({
                            smallLine2OffsetX: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-0.5">
                        <span>Y Pos</span>
                        <span className="font-mono-tabular text-white font-bold">
                          {Math.round(styleConfig.smallLine2OffsetY ?? 0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-35}
                        max={35}
                        step={1}
                        value={styleConfig.smallLine2OffsetY ?? 0}
                        onChange={(e) =>
                          onUpdateStyle({
                            smallLine2OffsetY: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* BIG HERO TEXT CARD */}
                <div className="bg-[#121216] p-2.5 rounded-xl border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#FFD60A]">
                      Big Hero Text (Main Impact Word)
                    </span>
                    <div className="flex items-center gap-1">
                      {(['left', 'center', 'right'] as const).map((align) => {
                        const active = (styleConfig.bigTextAlign || 'center') === align;
                        return (
                          <button
                            key={`big-${align}`}
                            type="button"
                            onClick={() => onUpdateStyle({ bigTextAlign: align })}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer transition-all ${
                              active
                                ? 'bg-[#FFD60A] text-zinc-950'
                                : 'bg-[#1E1E26] text-zinc-400 hover:text-white'
                            }`}
                          >
                            {align}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-0.5">
                        <span>Size</span>
                        <span className="font-mono-tabular text-[#FFD60A] font-bold">
                          {Math.round((styleConfig.bigWordScale || 2.15) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1.0}
                        max={3.4}
                        step={0.05}
                        value={styleConfig.bigWordScale || 2.15}
                        onChange={(e) =>
                          onUpdateStyle({ bigWordScale: parseFloat(e.target.value) })
                        }
                        className="w-full accent-[#FFD60A] h-1.5 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-0.5">
                        <span>X Pos</span>
                        <span className="font-mono-tabular text-white font-bold">
                          {Math.round(styleConfig.bigOffsetX ?? 0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-45}
                        max={45}
                        step={1}
                        value={styleConfig.bigOffsetX ?? 0}
                        onChange={(e) =>
                          onUpdateStyle({ bigOffsetX: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-[#FFD60A] h-1.5 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-0.5">
                        <span>Y Pos</span>
                        <span className="font-mono-tabular text-white font-bold">
                          {Math.round(styleConfig.bigOffsetY ?? 0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-35}
                        max={35}
                        step={1}
                        value={styleConfig.bigOffsetY ?? 0}
                        onChange={(e) =>
                          onUpdateStyle({ bigOffsetY: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-[#FFD60A] h-1.5 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Free 2D On-Screen Group Position (X & Y) + 9-Point Snap Grid */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-[#0A84FF]/35 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold text-white">
                    Move Master Group Position on Screen (X / Y)
                  </h2>
                  <p className="text-[10px] text-zinc-400">
                    Drag directly on the reel preview or use sliders below
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateStyle({ positionX: 50, positionY: 66 })}
                  className="px-2 py-1 rounded-lg bg-[#24242E] hover:bg-[#30303E] text-[10px] font-semibold text-zinc-200 cursor-pointer"
                >
                  Center (50%, 66%)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Horizontal X</span>
                    <span className="font-mono-tabular text-[#0A84FF] font-bold">
                      {Math.round(styleConfig.positionX ?? 50)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    step={1}
                    value={styleConfig.positionX ?? 50}
                    onChange={(e) =>
                      onUpdateStyle({ positionX: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-[#0A84FF] h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Vertical Y</span>
                    <span className="font-mono-tabular text-[#0A84FF] font-bold">
                      {Math.round(styleConfig.positionY ?? 66)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={88}
                    step={1}
                    value={styleConfig.positionY ?? 66}
                    onChange={(e) =>
                      onUpdateStyle({ positionY: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-[#0A84FF] h-1.5 cursor-pointer"
                  />
                </div>
              </div>

              {/* 9-Point Quick Screen Anchor Grid */}
              <div className="grid grid-cols-3 gap-1.5 bg-[#121216] p-2 rounded-xl">
                {(
                  [
                    { label: 'Top Left', x: 28, y: 24 },
                    { label: 'Top Center', x: 50, y: 24 },
                    { label: 'Top Right', x: 72, y: 24 },
                    { label: 'Mid Left', x: 28, y: 50 },
                    { label: 'Center', x: 50, y: 50 },
                    { label: 'Mid Right', x: 72, y: 50 },
                    { label: 'Low Left', x: 28, y: 68 },
                    { label: 'SIDZ Chest', x: 50, y: 66 },
                    { label: 'Bottom', x: 50, y: 78 },
                  ] as const
                ).map((pt) => {
                  const isNear =
                    Math.abs((styleConfig.positionX ?? 50) - pt.x) <= 6 &&
                    Math.abs((styleConfig.positionY ?? 66) - pt.y) <= 6;
                  return (
                    <button
                      key={pt.label}
                      type="button"
                      onClick={() =>
                        onUpdateStyle({ positionX: pt.x, positionY: pt.y })
                      }
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                        isNear
                          ? 'bg-[#0A84FF] text-white'
                          : 'bg-[#1C1C24] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {pt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Line Spacing, Letter Spacing, Vertical Spacing, Horizontal Spacing */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-white">
                  Line, Letter, Vertical &amp; Horizontal Spacing
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStyle({
                      lineSpacing: 1.15,
                      letterSpacing: 0,
                      verticalSpacing: 6,
                      horizontalSpacing: 14,
                    })
                  }
                  className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                >
                  Reset Spacing
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Line Spacing */}
                <div className="bg-[#121216] p-2.5 rounded-xl space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-300">Line Spacing</span>
                    <span className="font-mono-tabular text-[#0A84FF] font-bold">
                      {(styleConfig.lineSpacing ?? 1.15).toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.75}
                    max={2.2}
                    step={0.05}
                    value={styleConfig.lineSpacing ?? 1.15}
                    onChange={(e) =>
                      onUpdateStyle({ lineSpacing: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#0A84FF] h-1.5 cursor-pointer"
                  />
                </div>

                {/* Letter Spacing */}
                <div className="bg-[#121216] p-2.5 rounded-xl space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-300">Letter Spacing</span>
                    <span className="font-mono-tabular text-[#FFD60A] font-bold">
                      {styleConfig.letterSpacing ?? 0}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-6}
                    max={24}
                    step={1}
                    value={styleConfig.letterSpacing ?? 0}
                    onChange={(e) =>
                      onUpdateStyle({
                        letterSpacing: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-[#FFD60A] h-1.5 cursor-pointer"
                  />
                </div>

                {/* Vertical Spacing (Between Small Lead, Giant Hero & Script Tail) */}
                <div className="bg-[#121216] p-2.5 rounded-xl space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-300">Vertical Spacing</span>
                    <span className="font-mono-tabular text-emerald-400 font-bold">
                      {styleConfig.verticalSpacing ?? 6}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-30}
                    max={60}
                    step={2}
                    value={styleConfig.verticalSpacing ?? 6}
                    onChange={(e) =>
                      onUpdateStyle({
                        verticalSpacing: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                  />
                </div>

                {/* Horizontal Spacing (Word Gap / Tier Offset) */}
                <div className="bg-[#121216] p-2.5 rounded-xl space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-300">Horiz. Spacing</span>
                    <span className="font-mono-tabular text-sky-400 font-bold">
                      {styleConfig.horizontalSpacing ?? 14}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-30}
                    max={60}
                    step={2}
                    value={styleConfig.horizontalSpacing ?? 14}
                    onChange={(e) =>
                      onUpdateStyle({
                        horizontalSpacing: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-sky-400 h-1.5 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 3. Small Size, Big Size & All 18 Fancy Fonts */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-white/[0.08] space-y-3">
              <div className="text-xs font-semibold text-white">
                Small Size, Big Size &amp; Typography ({ primaryLang.shortLabel })
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-[#121216] p-2 rounded-xl">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-zinc-400">Small Size</span>
                    <span className="font-mono-tabular text-white font-bold">
                      {Math.round(styleConfig.smallWordScale * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.35}
                    max={1.35}
                    step={0.04}
                    value={styleConfig.smallWordScale}
                    onChange={(e) =>
                      onUpdateStyle({
                        smallWordScale: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-[#0A84FF] h-1.5 cursor-pointer"
                  />
                </div>

                <div className="bg-[#121216] p-2 rounded-xl">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-zinc-400">Big Size</span>
                    <span className="font-mono-tabular text-[#FFD60A] font-bold">
                      {Math.round(styleConfig.bigWordScale * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1.0}
                    max={3.4}
                    step={0.05}
                    value={styleConfig.bigWordScale}
                    onChange={(e) =>
                      onUpdateStyle({
                        bigWordScale: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-[#FFD60A] h-1.5 cursor-pointer"
                  />
                </div>

                <div className="bg-[#121216] p-2 rounded-xl">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-zinc-400">Base px</span>
                    <span className="font-mono-tabular text-[#0A84FF] font-bold">
                      {styleConfig.fontSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={110}
                    step={2}
                    value={styleConfig.fontSize}
                    onChange={(e) =>
                      onUpdateStyle({
                        fontSize: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-[#0A84FF] h-1.5 cursor-pointer"
                  />
                </div>
              </div>

              {/* Animation Engine Selector */}
              <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                <span className="text-[11px] font-semibold text-zinc-300 block">
                  Animation Motion Engine
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {ANIMATION_ENGINES.map((engine) => {
                    const active = styleConfig.animationType === engine.id;
                    return (
                      <button
                        key={engine.id}
                        type="button"
                        onClick={() =>
                          onUpdateStyle({ animationType: engine.id })
                        }
                        className={`py-1.5 px-2 rounded-xl border text-[10px] font-semibold truncate cursor-pointer transition-all ${
                          active
                            ? 'bg-[#0A84FF] border-[#0A84FF] text-white'
                            : 'bg-[#121216] border-white/[0.06] text-zinc-300 hover:text-white'
                        }`}
                      >
                        {engine.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CAPCUT / PREMIERE / PHOTOSHOP MASK STUDIO & INSTAGRAM FRAMING */}
        {activeTab === 'mask' && (
          <div className="space-y-4">
            {/* 0. REAL-TIME AI PERSON CUTOUT & BEHIND-HEAD CAPTION DEPTH MASK */}
            <div className="p-3.5 rounded-2xl bg-[#162720] border border-[#2BAE66]/50 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#34D399]" />
                    <span>AI Person Cutout (Behind-Head Depth Mask)</span>
                  </h2>
                  <p className="text-[10px] text-[#34D399]/90 mt-0.5">
                    Automatically places medical &amp; creator captions in the background behind the speaker&apos;s head
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextDepth = !styleConfig.captionDepthBehindSubject;
                    onUpdateStyle({
                      captionDepthBehindSubject: nextDepth,
                      ...(nextDepth ? { positionY: 31 } : {}),
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    styleConfig.captionDepthBehindSubject
                      ? 'bg-[#2BAE66] text-white shadow-sm'
                      : 'bg-[#111F19] text-zinc-300 hover:text-white border border-white/10'
                  }`}
                >
                  {styleConfig.captionDepthBehindSubject
                    ? 'DEPTH MASK ON'
                    : 'ENABLE DEPTH'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { label: 'Crown (25% Y)', y: 25 },
                    { label: 'Behind Head (31%)', y: 31 },
                    { label: 'Shoulders (42% Y)', y: 42 },
                  ] as const
                ).map((preset) => {
                  const active =
                    styleConfig.captionDepthBehindSubject &&
                    Math.abs((styleConfig.positionY ?? 31) - preset.y) <= 4;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        onUpdateStyle({
                          captionDepthBehindSubject: true,
                          positionY: preset.y,
                        })
                      }
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border ${
                        active
                          ? 'bg-[#2BAE66] border-[#34D399] text-white'
                          : 'bg-[#111F19] border-white/10 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1. Instagram Photo Frame (Moves with Text) & Full Instagram Reels UI Overlay */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-pink-500/35 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold text-white">
                    1. Instagram Framing (Follows Text + Reels UI)
                  </h2>
                  <p className="text-[10px] text-zinc-400">
                    Shows Instagram Share, Comment, Like &amp; Bottom bar wherever text appears
                  </p>
                </div>
              </div>

              {/* Toggle Full-Screen Instagram Reels UI Overlay */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#121216] border border-white/[0.06]">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Full Reel Instagram Overlay (Right Icons + Bottom Bar)
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Shows Like, Comment, Share, Save, Audio Ticker &amp; Bottom Comment bar
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStyle({
                      showInstagramFrame: !styleConfig.showInstagramFrame,
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    styleConfig.showInstagramFrame
                      ? 'bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white shadow-sm'
                      : 'bg-[#24242E] text-zinc-400 hover:text-white'
                  }`}
                >
                  {styleConfig.showInstagramFrame ? 'IG REEL ON' : 'OFF'}
                </button>
              </div>

              {/* Dynamic Caption Frame that Moves Wherever Text Goes */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-zinc-300 block">
                  Moving Caption Photo Frame (Follows Text X/Y Everywhere):
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {CAPTION_FRAME_OPTIONS.map((opt) => {
                    const active =
                      (styleConfig.captionFrameStyle || 'none') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          onUpdateStyle({ captionFrameStyle: opt.id })
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          active
                            ? 'bg-[#262632] border-[#0A84FF] text-white'
                            : 'bg-[#121216] border-white/[0.06] text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">
                            {opt.label}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {opt.desc}
                          </div>
                        </div>
                        {active && (
                          <span className="w-4 h-4 rounded-full bg-[#0A84FF] flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. CapCut / Premiere Pro / Photoshop Mask Studio */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-[#0A84FF]/35 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold text-white">
                    2. CapCut / Premiere / Photoshop Mask Studio
                  </h2>
                  <p className="text-[10px] text-zinc-400">
                    Black or custom gradient mask from top to bottom, circle radial, or rectangle angle
                  </p>
                </div>
                {styleConfig.maskMode !== 'none' && (
                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ maskMode: 'none' })}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Turn Off
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {MASK_OPTIONS.map((m) => {
                  const active = (styleConfig.maskMode || 'none') === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onUpdateStyle({ maskMode: m.id })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-[#0A84FF] border-[#0A84FF] text-white shadow-sm'
                          : 'bg-[#121216] border-white/[0.06] text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      <div className="text-[11px] font-bold truncate">
                        {m.label}
                      </div>
                      <div
                        className={`text-[9px] truncate ${
                          active ? 'text-white/90' : 'text-zinc-400'
                        }`}
                      >
                        {m.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {styleConfig.maskMode && styleConfig.maskMode !== 'none' && (
                <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                  {/* Mask Color (Default Black #000000) & Invert Mask */}
                  <div className="flex items-center justify-between gap-2 bg-[#121216] p-2.5 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="color"
                        value={styleConfig.maskColor || '#000000'}
                        onChange={(e) =>
                          onUpdateStyle({ maskColor: e.target.value })
                        }
                        className="w-7 h-6 rounded bg-transparent border-0 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-white">
                        Mask Color ({styleConfig.maskColor || '#000000'})
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStyle({ maskInvert: !styleConfig.maskInvert })
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        styleConfig.maskInvert
                          ? 'bg-[#FFD60A] text-zinc-950'
                          : 'bg-[#24242E] text-zinc-300'
                      }`}
                    >
                      {styleConfig.maskInvert ? 'Inverted ON' : 'Invert Mask'}
                    </button>
                  </div>

                  {/* Opacity, Feather, Angle */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#121216] p-2 rounded-xl">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-zinc-400">Opacity</span>
                        <span className="font-mono-tabular text-white font-bold">
                          {Math.round((styleConfig.maskOpacity ?? 0.82) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.04}
                        value={styleConfig.maskOpacity ?? 0.82}
                        onChange={(e) =>
                          onUpdateStyle({
                            maskOpacity: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-[#0A84FF] h-1.5 cursor-pointer"
                      />
                    </div>

                    <div className="bg-[#121216] p-2 rounded-xl">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-zinc-400">Feather</span>
                        <span className="font-mono-tabular text-[#0A84FF] font-bold">
                          {styleConfig.maskFeather ?? 45}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={100}
                        step={2}
                        value={styleConfig.maskFeather ?? 45}
                        onChange={(e) =>
                          onUpdateStyle({
                            maskFeather: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-[#0A84FF] h-1.5 cursor-pointer"
                      />
                    </div>

                    <div className="bg-[#121216] p-2 rounded-xl">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-zinc-400">Angle</span>
                        <span className="font-mono-tabular text-[#FFD60A] font-bold">
                          {styleConfig.maskAngle ?? 180}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        step={5}
                        value={styleConfig.maskAngle ?? 180}
                        onChange={(e) =>
                          onUpdateStyle({
                            maskAngle: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-[#FFD60A] h-1.5 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Mask Center X / Y & Size Width / Height */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#121216] p-2 rounded-xl">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-zinc-400">Mask X Center</span>
                        <span className="font-mono-tabular text-white">
                          {styleConfig.maskCenterX ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={95}
                        value={styleConfig.maskCenterX ?? 50}
                        onChange={(e) =>
                          onUpdateStyle({
                            maskCenterX: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-[#0A84FF] h-1.5 cursor-pointer"
                      />
                    </div>

                    <div className="bg-[#121216] p-2 rounded-xl">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-zinc-400">Mask Y Center</span>
                        <span className="font-mono-tabular text-white">
                          {styleConfig.maskCenterY ?? 64}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={95}
                        value={styleConfig.maskCenterY ?? 64}
                        onChange={(e) =>
                          onUpdateStyle({
                            maskCenterY: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-[#0A84FF] h-1.5 cursor-pointer"
                      />
                    </div>

                    <div className="bg-[#121216] p-2 rounded-xl">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-zinc-400">Mask Width</span>
                        <span className="font-mono-tabular text-white">
                          {styleConfig.maskRadiusX ?? 78}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={100}
                        value={styleConfig.maskRadiusX ?? 78}
                        onChange={(e) =>
                          onUpdateStyle({
                            maskRadiusX: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-[#0A84FF] h-1.5 cursor-pointer"
                      />
                    </div>

                    <div className="bg-[#121216] p-2 rounded-xl">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-zinc-400">Mask Height</span>
                        <span className="font-mono-tabular text-white">
                          {styleConfig.maskRadiusY ?? 48}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={100}
                        value={styleConfig.maskRadiusY ?? 48}
                        onChange={(e) =>
                          onUpdateStyle({
                            maskRadiusY: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-[#0A84FF] h-1.5 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: EXPORT (.MP4, .WP2, .WEBM WITH AUDIO + .WAV + SUBTITLES) */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#1C1C22] border border-white/10 space-y-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-white">
                    Export Burned-In Video + Audio
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Exports full video muxed with your original audio track, mask, IG frame, and SIDZ_&lt;NAME&gt; captions.
                  </p>
                </div>
                <Film className="w-5 h-5 text-[#0A84FF] shrink-0" />
              </div>

              {/* Audio Track Verification Badge */}
              <div className="px-3 py-2 rounded-xl bg-[#121216] border border-emerald-500/25 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <Volume2 className="w-4 h-4 shrink-0" />
                  <span>Full Audio Track Muxing Active</span>
                </div>
                <span className="text-[10px] font-mono-tabular text-zinc-400">
                  192kbps Audio
                </span>
              </div>

              {/* Resolution Selector: 720p | 1080p | 4K */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-300">
                    Resolution:
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {
                      getExportResolutionDimensions(
                        exportResolution,
                        styleConfig.aspectRatio || '9:16'
                      ).label
                    }
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 bg-[#121216] p-1 rounded-xl">
                  {(
                    [
                      { id: '720p', label: '720p', sub: 'HD' },
                      { id: '1080p', label: '1080p', sub: 'Full HD' },
                      { id: '4k', label: '4k', sub: 'Ultra HD' },
                    ] as { id: ExportResolution; label: string; sub: string }[]
                  ).map((res) => {
                    const active = exportResolution === res.id;
                    return (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => onChangeExportResolution?.(res.id)}
                        className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer ${
                          active
                            ? 'bg-[#24B47E] text-[#050505] shadow-sm font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold">{res.label}</div>
                        <div
                          className={`text-[9px] ${
                            active ? 'text-[#050505]/80 font-semibold' : 'text-zinc-500'
                          }`}
                        >
                          {res.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format Selector Pills: .MP4 | .MOV | .WEBM */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-zinc-300">
                  Select Video Container Format:
                </span>
                <div className="grid grid-cols-3 gap-1.5 bg-[#121216] p-1 rounded-xl">
                  {(
                    [
                      { id: 'mp4', label: '.MP4', sub: 'H.264 + AAC' },
                      { id: 'mov', label: '.MOV', sub: 'QuickTime HD' },
                      { id: 'webm', label: '.WEBM', sub: 'VP9 + Opus' },
                    ] as { id: VideoExportFormat; label: string; sub: string }[]
                  ).map((fmt) => {
                    const active = exportFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => onChangeExportFormat(fmt.id)}
                        className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer ${
                          active
                            ? 'bg-[#0A84FF] text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold">{fmt.label}</div>
                        <div
                          className={`text-[9px] ${
                            active ? 'text-white/90' : 'text-zinc-500'
                          }`}
                        >
                          {fmt.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {isExportingVideo && (
                <div className="space-y-2 p-3 rounded-xl bg-[#121216] border border-[#24B47E]/40">
                  <div className="flex justify-between text-xs font-mono-tabular">
                    <span className="text-[#34D399]">
                      Rendering {exportResolution.toUpperCase()} .{exportFormat.toUpperCase()}...
                    </span>
                    <span className="text-white font-bold">{exportProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#24B47E] transition-all duration-150"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onStopExportNow}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>
                      Finish &amp; Save {exportResolution.toUpperCase()} .{exportFormat.toUpperCase()} Now ({exportProgress}%)
                    </span>
                  </button>
                </div>
              )}

              {/* Direct Video Export Action Buttons (720p / 1080p / 4K) */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    onExportBurnedVideo(exportFormat, exportResolution)
                  }
                  className="w-full py-2.5 px-4 rounded-xl bg-[#24B47E] hover:bg-[#199A68] text-[#050505] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Film className="w-4 h-4" />
                  <span>
                    Render {exportResolution.toUpperCase()} .{exportFormat.toUpperCase()} Video + Audio
                  </span>
                </button>

                <div className="grid grid-cols-3 gap-1.5">
                  {(['720p', '1080p', '4k'] as ExportResolution[]).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => {
                        onChangeExportResolution?.(res);
                        onExportBurnedVideo(exportFormat, res);
                      }}
                      className="py-1.5 px-2 rounded-lg bg-[#262630] hover:bg-[#32323E] border border-white/10 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-[#34D399]" />
                      <span>{res.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-300">
                Subtitles, Premiere Pro &amp; DaVinci Resolve Files
              </h3>

              <button
                type="button"
                onClick={onExportSRT}
                className="w-full p-3.5 rounded-2xl bg-[#1C1C22] hover:bg-[#25252D] border border-white/[0.06] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <FileText className="w-4 h-4 text-[#0A84FF]" />
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Download .SRT Subtitles
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Imports directly into Premiere Pro, DaVinci &amp; CapCut
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono-tabular text-zinc-400">.srt</span>
              </button>

              {onExportPremiereNativeXML && (
                <button
                  type="button"
                  onClick={onExportPremiereNativeXML}
                  className="w-full p-3.5 rounded-2xl bg-[#1C1C22] hover:bg-[#25252D] border border-purple-500/30 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <FileCode className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Export Adobe Premiere Pro Sequence (.XML)
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Native Premiere Pro XMEML sequence ({exportResolution.toUpperCase()})
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-tabular text-purple-400">.xml</span>
                </button>
              )}

              {onExportPremiereXML && (
                <button
                  type="button"
                  onClick={onExportPremiereXML}
                  className="w-full p-3.5 rounded-2xl bg-[#1C1C22] hover:bg-[#25252D] border border-[#F59E0B]/30 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <FileCode className="w-4 h-4 text-[#F59E0B]" />
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Export Premiere Pro / Final Cut (.FCPXML)
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        NLE timeline with synced subtitle tracks ({exportResolution.toUpperCase()})
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-tabular text-[#F59E0B]">.fcpxml</span>
                </button>
              )}

              {onExportDaVinciFCPXML && (
                <button
                  type="button"
                  onClick={onExportDaVinciFCPXML}
                  className="w-full p-3.5 rounded-2xl bg-[#1C1C22] hover:bg-[#25252D] border border-sky-500/30 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <FileCode className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Export DaVinci Resolve Timeline (.FCPXML)
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        DaVinci Resolve 18/19 timeline &amp; text generators ({exportResolution.toUpperCase()})
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-tabular text-sky-400">.fcpxml</span>
                </button>
              )}

              {onExportDaVinciEDL && (
                <button
                  type="button"
                  onClick={onExportDaVinciEDL}
                  className="w-full p-3.5 rounded-2xl bg-[#1C1C22] hover:bg-[#25252D] border border-sky-500/30 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <FileCode className="w-4 h-4 text-sky-300" />
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Export DaVinci Resolve Markers (.EDL)
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        CMX 3600 EDL timeline &amp; Resolve subtitle markers
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-tabular text-sky-300">.edl</span>
                </button>
              )}

              {onExportAlphaOverlay && (
                <button
                  type="button"
                  onClick={() => onExportAlphaOverlay(exportResolution)}
                  className="w-full p-3.5 rounded-2xl bg-[#1C1C22] hover:bg-[#25252D] border border-[#38BDF8]/30 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <Layers className="w-4 h-4 text-[#38BDF8]" />
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Export Transparent Alpha Overlay (.WEBM)
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Transparent caption track ({exportResolution.toUpperCase()}) for Premiere &amp; DaVinci
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-tabular text-[#38BDF8]">alpha</span>
                </button>
              )}

              <button
                type="button"
                onClick={onExportVTT}
                className="w-full p-3.5 rounded-2xl bg-[#1C1C22] hover:bg-[#25252D] border border-white/[0.06] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <Shield className="w-4 h-4 text-[#30D158]" />
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Download .VTT Captions
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      WebVTT format for YouTube &amp; Instagram
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono-tabular text-zinc-400">.vtt</span>
              </button>

              <button
                type="button"
                onClick={onExportJSON}
                className="w-full p-3.5 rounded-2xl bg-[#1C1C22] hover:bg-[#25252D] border border-white/[0.06] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <FileCode className="w-4 h-4 text-[#FFD60A]" />
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Download Multi-Language .JSON
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      All Indian languages + word timestamps
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono-tabular text-zinc-400">.json</span>
              </button>

              <button
                type="button"
                onClick={onExportAudioWAV}
                className="w-full p-3.5 rounded-2xl bg-[#1C1C22] hover:bg-[#25252D] border border-white/[0.06] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <Volume2 className="w-4 h-4 text-[#30D158]" />
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Download Standalone Audio (.WAV)
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Studio PCM WAV audio track
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono-tabular text-zinc-400">.wav</span>
              </button>
            </div>
          </div>
        )}
        </>
      </div>

      {/* Sticky Bottom Export Bar (Matches Screenshots 1 & 4) */}
      <div className="px-3.5 py-2.5 border-t border-white/[0.06] bg-[#131315] shrink-0 flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            setTopPanelMode('captions');
            setActiveTab('export');
            onExportBurnedVideo(exportFormat, exportResolution);
          }}
          className="px-4 py-1.5 rounded-lg bg-[#389E74] hover:bg-[#2F8A64] text-white text-xs font-bold shadow-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {isExportingVideo ? `Exporting (${exportProgress}%)` : 'Export'}
        </button>
      </div>
    </aside>
  );
};
