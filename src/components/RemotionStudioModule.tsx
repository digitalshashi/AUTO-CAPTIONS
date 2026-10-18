import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Code2,
  Layers,
  Sliders,
  Download,
  Copy,
  Check,
  Repeat,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Film,
  Sparkles,
  Volume2,
  VolumeX,
  Terminal,
  FileCode,
  FileJson,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import {
  AIBRollSlot,
  CaptionSegment,
  CaptionStyleConfig,
  TrackKey,
} from '../types/caption';
import { VideoExportFormat } from '../utils/audioExtractor';
import { TimelineClip } from './PremiereMultiTrackTimeline';
import {
  DEFAULT_REMOTION_CONFIG,
  REMOTION_SPRING_PRESETS,
  RemotionCaptionPagingMode,
  RemotionCompositionConfig,
  RemotionSequenceItem,
  buildRemotionSequencesFromProject,
  createTikTokStyleCaptions,
  generateRemotionProjectCode,
  remotionInterpolate,
  remotionSpring,
  sampleSpringCurve,
} from '../utils/remotionEngine';

interface RemotionStudioModuleProps {
  segments: CaptionSegment[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isMuted: boolean;
  styleConfig: CaptionStyleConfig;
  uploadedVideoUrl: string | null;
  uploadedVideoName: string | null;
  aiBRollSlots: AIBRollSlot[];
  brollClips: TimelineClip[];
  musicClips: TimelineClip[];
  isExportingVideo: boolean;
  exportProgress: number;
  exportFormat: VideoExportFormat;
  onSeekTo: (timeSec: number) => void;
  onTogglePlayPause: () => void;
  onToggleMute: () => void;
  onUpdateSegmentText: (segId: string, track: TrackKey, text: string) => void;
  onToggleWordHero: (segId: string, track: TrackKey, wordIdx: number) => void;
  onUpdateStyle: (partial: Partial<CaptionStyleConfig>) => void;
  onExportBurnedVideo: (format: VideoExportFormat) => void;
  onExportSRT: () => void;
  onSwitchToStandardStudio: () => void;
  onShowToast: (msg: string) => void;
}

export const RemotionStudioModule: React.FC<RemotionStudioModuleProps> = ({
  segments,
  currentTime,
  duration,
  isPlaying,
  isMuted,
  styleConfig,
  uploadedVideoUrl,
  uploadedVideoName,
  aiBRollSlots,
  brollClips,
  musicClips,
  isExportingVideo,
  exportProgress,
  exportFormat,
  onSeekTo,
  onTogglePlayPause,
  onToggleMute,
  onUpdateSegmentText,
  onToggleWordHero,
  onUpdateStyle,
  onExportBurnedVideo,
  onExportSRT,
  onSwitchToStandardStudio,
  onShowToast,
}) => {
  const [remotionConfig, setRemotionConfig] = useState<RemotionCompositionConfig>(
    () => ({
      ...DEFAULT_REMOTION_CONFIG,
      width:
        styleConfig.aspectRatio === '16:9'
          ? 1920
          : styleConfig.aspectRatio === '1:1'
          ? 1080
          : 1080,
      height:
        styleConfig.aspectRatio === '16:9'
          ? 1080
          : styleConfig.aspectRatio === '1:1'
          ? 1080
          : 1920,
    })
  );

  // Left Explorer Sub-Tab: 'tiktok-pages' | 'sequences' | 'composition'
  const [leftTab, setLeftTab] = useState<
    'tiktok-pages' | 'sequences' | 'composition'
  >('tiktok-pages');

  // Right Inspector Sub-Tab: 'physics' | 'tsx-code' | 'render'
  const [rightTab, setRightTab] = useState<'physics' | 'tsx-code' | 'render'>(
    'physics'
  );

  // Selected TSX Code file tab
  const [activeCodeFile, setActiveCodeFile] = useState<
    'composition' | 'subtitles' | 'root' | 'captionsJson' | 'packageJson'
  >('composition');

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);
  const [editingPageSegId, setEditingPageSegId] = useState<string | null>(null);

  // Custom user-added <Sequence> overlays (e.g. Kinetic Title / Lower Thirds)
  const [customSequences, setCustomSequences] = useState<RemotionSequenceItem[]>(
    () => [
      {
        id: 'seq-custom-hook-banner',
        name: '<Sequence name="KineticHookBadge" />',
        layer: 'kinetic-title',
        from: 0,
        durationInFrames: 75,
        premountFor: 15,
        enabled: true,
        color: '#EC4899',
        textPreview: 'REMOTION SPRING KINETIC ENGINE',
      },
    ]
  );

  // Disabled sequence IDs map
  const [disabledSeqIds, setDisabledSeqIds] = useState<Record<string, boolean>>(
    {}
  );

  // Selected sequence ID for fine frame trimming
  const [selectedSeqId, setSelectedSeqId] = useState<string | null>(null);

  // Frame timeline scrub ref
  const timelineTrackRef = useRef<HTMLDivElement | null>(null);
  const isScrubbingTimelineRef = useRef<boolean>(false);

  const fps = remotionConfig.fps;
  const safeDuration = Math.max(1, duration || 15);
  const totalFrames = Math.max(30, Math.round(safeDuration * fps));
  const currentFrame = Math.min(
    totalFrames - 1,
    Math.max(0, Math.round(currentTime * fps))
  );

  // Generate @remotion/captions TikTok-style pages
  const tiktokPages = useMemo(
    () =>
      createTikTokStyleCaptions(
        segments,
        styleConfig.primaryTrack,
        remotionConfig.combineTokensWithinMilliseconds,
        fps
      ),
    [
      segments,
      styleConfig.primaryTrack,
      remotionConfig.combineTokensWithinMilliseconds,
      fps,
    ]
  );

  // Build all multi-layer <Sequence> blocks
  const allSequences = useMemo(() => {
    const base = buildRemotionSequencesFromProject({
      segments,
      trackKey: styleConfig.primaryTrack,
      brollSlots: aiBRollSlots,
      brollClips,
      musicClips,
      durationSec: safeDuration,
      fps,
      combineTokensMs: remotionConfig.combineTokensWithinMilliseconds,
    });
    return [...customSequences, ...base].map((seq) => ({
      ...seq,
      enabled: disabledSeqIds[seq.id] ? false : seq.enabled,
    }));
  }, [
    segments,
    styleConfig.primaryTrack,
    aiBRollSlots,
    brollClips,
    musicClips,
    safeDuration,
    fps,
    remotionConfig.combineTokensWithinMilliseconds,
    customSequences,
    disabledSeqIds,
  ]);

  // Active sequences at currentFrame
  const activeSequencesAtFrame = useMemo(
    () =>
      allSequences.filter(
        (s) =>
          s.enabled &&
          currentFrame >= s.from &&
          currentFrame < s.from + s.durationInFrames
      ),
    [allSequences, currentFrame]
  );

  // Active TikTok caption page at currentFrame
  const activeCaptionPage = useMemo(
    () =>
      tiktokPages.find(
        (p) =>
          currentFrame >= p.fromFrame &&
          currentFrame < p.fromFrame + p.durationInFrames
      ) || null,
    [tiktokPages, currentFrame]
  );

  // Active B-Roll sequence at currentFrame
  const activeBRollSequence = useMemo(
    () =>
      activeSequencesAtFrame.find(
        (s) => s.layer === 'broll' && Boolean(s.mediaUrl)
      ) || null,
    [activeSequencesAtFrame]
  );

  // Active custom kinetic title sequence at currentFrame
  const activeKineticTitleSeq = useMemo(
    () =>
      activeSequencesAtFrame.find((s) => s.layer === 'kinetic-title') || null,
    [activeSequencesAtFrame]
  );

  // Sample the spring curve for the SVG visualizer (45 frames)
  const springCurvePoints = useMemo(
    () => sampleSpringCurve(remotionConfig.springConfig, fps, 45),
    [remotionConfig.springConfig, fps]
  );

  // Generate live Remotion TSX project files
  const generatedCode = useMemo(
    () =>
      generateRemotionProjectCode({
        remotionConfig,
        styleConfig,
        segments,
        brollSlots: aiBRollSlots,
        durationSec: safeDuration,
        videoFileName: uploadedVideoName || 'merupify-reel.mp4',
      }),
    [
      remotionConfig,
      styleConfig,
      segments,
      aiBRollSlots,
      safeDuration,
      uploadedVideoName,
    ]
  );

  // Seek to specific frame
  const seekToFrame = (targetFrame: number) => {
    const clamped = Math.max(0, Math.min(totalFrames - 1, Math.round(targetFrame)));
    const timeSec = clamped / fps;
    onSeekTo(Number(timeSec.toFixed(4)));
  };

  // Enforce In/Out frame loop when playing
  useEffect(() => {
    if (!isPlaying) return;
    const outF = remotionConfig.outFrame ?? totalFrames - 1;
    if (currentFrame >= outF && remotionConfig.loopPlayback) {
      seekToFrame(remotionConfig.inFrame);
    }
  }, [
    currentFrame,
    isPlaying,
    remotionConfig.outFrame,
    remotionConfig.inFrame,
    remotionConfig.loopPlayback,
    totalFrames,
  ]);

  const handleTimelinePointer = (clientX: number) => {
    const el = timelineTrackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / Math.max(1, rect.width))
    );
    const frame = Math.round(ratio * (totalFrames - 1));
    seekToFrame(frame);
  };

  const activeCodeContent =
    activeCodeFile === 'composition'
      ? generatedCode.compositionTsx
      : activeCodeFile === 'subtitles'
      ? generatedCode.subtitlesPageTsx
      : activeCodeFile === 'root'
      ? generatedCode.rootTsx
      : activeCodeFile === 'captionsJson'
      ? generatedCode.captionsJson
      : generatedCode.packageJson;

  const activeCodeFilename =
    activeCodeFile === 'composition'
      ? 'MerupifyComposition.tsx'
      : activeCodeFile === 'subtitles'
      ? 'SubtitlesPage.tsx'
      : activeCodeFile === 'root'
      ? 'Root.tsx'
      : activeCodeFile === 'captionsJson'
      ? 'captions.json'
      : 'package.json';

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(activeCodeContent);
    setCopiedCode(true);
    onShowToast(`Copied ${activeCodeFilename} to clipboard`);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleDownloadCodeFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(`Downloaded ${filename}`);
  };

  const handleDownloadAllRemotionBundle = () => {
    const bundleText = `// ============================================================================
// MERUPIFY x REMOTION (remotion-dev/remotion) FULL PROJECT BUNDLE
// Composition ID: ${remotionConfig.compositionId} | ${remotionConfig.width}x${remotionConfig.height} @ ${remotionConfig.fps}fps
// ============================================================================

// --- FILE 1: package.json ---
${generatedCode.packageJson}

// --- FILE 2: src/Root.tsx ---
${generatedCode.rootTsx}

// --- FILE 3: src/MerupifyComposition.tsx ---
${generatedCode.compositionTsx}

// --- FILE 4: src/SubtitlesPage.tsx ---
${generatedCode.subtitlesPageTsx}

// --- FILE 5: public/captions.json ---
${generatedCode.captionsJson}
`;
    handleDownloadCodeFile(
      `${remotionConfig.compositionId}-remotion-bundle.tsx`,
      bundleText
    );
  };

  const handleAddCustomSequence = () => {
    const startF = currentFrame;
    const durF = Math.min(90, Math.max(24, totalFrames - startF));
    const newSeq: RemotionSequenceItem = {
      id: `seq-custom-${Date.now()}`,
      name: `<Sequence name="OverlayCallout_${customSequences.length + 1}" />`,
      layer: 'kinetic-title',
      from: startF,
      durationInFrames: durF,
      premountFor: 10,
      enabled: true,
      color: '#EC4899',
      textPreview: `KEY TAKEAWAY #${customSequences.length + 1}`,
    };
    setCustomSequences((prev) => [...prev, newSeq]);
    setSelectedSeqId(newSeq.id);
    onShowToast(
      `Added <Sequence from={${startF}} durationInFrames={${durF}}> at Frame ${startF}`
    );
  };

  // Build SVG path for the spring curve visualizer
  const svgWidth = 290;
  const svgHeight = 92;
  const baselineY = 30; // value = 1.0 line
  const zeroY = 78; // value = 0.0 line
  const springPolyline = springCurvePoints
    .map((pt) => {
      const x = (pt.frame / 45) * (svgWidth - 16) + 8;
      const y = zeroY - pt.value * (zeroY - baselineY);
      return `${x.toFixed(1)},${Math.max(6, Math.min(svgHeight - 4, y)).toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-56px)] overflow-y-auto lg:overflow-hidden bg-[#0B0B0D] text-[#E5E1E4] select-none">
      {/* =====================================================================
          COLUMN 1 (LEFT): REMOTION COMPOSITION & SEQUENCE EXPLORER
         ===================================================================== */}
      <aside className="order-3 lg:order-1 w-full lg:w-[430px] shrink-0 border-t lg:border-t-0 lg:border-r border-white/[0.06] bg-[#131315] flex flex-col min-h-[440px] lg:min-h-0 lg:h-full overflow-hidden">
        {/* Top Module Header & Back to Standard Studio */}
        <div className="px-3.5 py-2.5 border-b border-white/[0.06] flex items-center justify-between gap-2 bg-[#131315]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-[#0B84F3]/15 border border-[#0B84F3]/40 flex items-center justify-center text-[#0B84F3] shrink-0">
              <Code2 className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-white tracking-tight">
                Remotion Studio Engine
              </span>
              <span className="ml-2 text-[10px] font-mono text-[#94a3b8]">
                @remotion/captions
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSwitchToStandardStudio}
            className="px-2.5 py-1 rounded-md bg-[#1c1c1f] hover:bg-[#26262a] border border-white/[0.08] text-[11px] font-semibold text-[#E5E1E4] flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
            title="Return to Standard Merupify Studio"
          >
            <ArrowLeft className="w-3 h-3 text-[#10b981]" />
            <span>Standard Studio</span>
          </button>
        </div>

        {/* Left Sub-Navigation Tabs */}
        <div className="grid grid-cols-3 p-1.5 m-2.5 mb-1 bg-[#1c1c1f] rounded-lg border border-white/[0.06] shrink-0">
          {(
            [
              { id: 'tiktok-pages', label: 'TikTok Pages' },
              { id: 'sequences', label: 'Sequences' },
              { id: 'composition', label: 'Composition' },
            ] as const
          ).map((tab) => {
            const active = leftTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLeftTab(tab.id)}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#26262a] text-[#10b981] shadow-sm'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* LEFT TAB 1: @remotion/captions TikTok-Style Pages & Token Editor */}
        {leftTab === 'tiktok-pages' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* combineTokensWithinMilliseconds Control Bar */}
            <div className="px-3.5 py-2.5 border-b border-white/[0.06] bg-[#161619] space-y-2 shrink-0">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#E5E1E4]">
                  combineTokensWithinMilliseconds
                </span>
                <span className="font-mono font-bold text-[#10b981] tabular-nums">
                  {remotionConfig.combineTokensWithinMilliseconds} ms ·{' '}
                  {tiktokPages.length} pages
                </span>
              </div>
              <input
                type="range"
                min={300}
                max={2500}
                step={50}
                value={remotionConfig.combineTokensWithinMilliseconds}
                onChange={(e) =>
                  setRemotionConfig((prev) => ({
                    ...prev,
                    combineTokensWithinMilliseconds: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#10b981] h-1.5 bg-[#26262a] rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-[#94a3b8]">
                <span>300ms (Fast 1–2 word cuts)</span>
                <span>1200ms (TikTok default)</span>
                <span>2500ms (Full sentences)</span>
              </div>
            </div>

            {/* Scrollable Frame-Indexed Page List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {tiktokPages.map((page, pageIdx) => {
                const isPageActive = activeCaptionPage?.id === page.id;
                const isEditingSeg = editingPageSegId === page.segmentId;
                const parentSeg = segments.find((s) => s.id === page.segmentId);

                return (
                  <div
                    key={page.id}
                    onClick={() => seekToFrame(page.fromFrame)}
                    className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                      isPageActive
                        ? 'bg-[#172A21]/85 border-[#10b981]/50'
                        : 'bg-[#18181b] border-white/[0.06] hover:border-white/[0.14]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums">
                        <span
                          className={`font-bold ${
                            isPageActive ? 'text-[#10b981]' : 'text-[#94a3b8]'
                          }`}
                        >
                          Page #{String(pageIdx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[#94a3b8]">·</span>
                        <span className="text-[#0B84F3]">
                          from={page.fromFrame}f
                        </span>
                        <span className="text-[#94a3b8]">·</span>
                        <span className="text-[#94a3b8]">
                          dur={page.durationInFrames}f
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPageSegId(
                            isEditingSeg ? null : page.segmentId
                          );
                        }}
                        className="px-2 py-0.5 rounded bg-[#26262a] hover:bg-[#323238] text-[10px] font-medium text-[#E5E1E4] cursor-pointer"
                      >
                        {isEditingSeg ? 'Done' : 'Edit Text'}
                      </button>
                    </div>

                    {isEditingSeg && parentSeg ? (
                      <input
                        type="text"
                        value={
                          parentSeg.tracks[styleConfig.primaryTrack]?.text || ''
                        }
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          onUpdateSegmentText(
                            parentSeg.id,
                            styleConfig.primaryTrack,
                            e.target.value
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-[#0B0B0D] border border-[#10b981] text-xs text-white focus:outline-none"
                      />
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {page.tokens.map((tok, tIdx) => {
                          const isTokenNow =
                            currentFrame >= tok.fromFrame &&
                            currentFrame <= tok.toFrame;
                          return (
                            <button
                              key={`${tok.fromMs}-${tIdx}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                seekToFrame(tok.fromFrame);
                                onToggleWordHero(
                                  tok.segmentId,
                                  styleConfig.primaryTrack,
                                  tok.wordIndex
                                );
                              }}
                              title={`Frame ${tok.fromFrame} → ${tok.toFrame} · Click to toggle Hero Spring Emphasis`}
                              className={`px-2 py-0.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                                isTokenNow
                                  ? 'bg-[#10b981] text-[#032b1d] scale-105 shadow-sm'
                                  : tok.isHero
                                  ? 'bg-[#0B84F3]/20 text-[#60a5fa] border border-[#0B84F3]/40'
                                  : 'bg-[#222226] text-[#E5E1E4] hover:bg-[#2c2c32]'
                              }`}
                            >
                              {tok.text}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LEFT TAB 2: MULTI-LAYER <Sequence> STACK INSPECTOR */}
        {leftTab === 'sequences' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-white/[0.06] flex items-center justify-between bg-[#161619] shrink-0">
              <span className="text-xs font-semibold text-[#E5E1E4]">
                Multi-Layer &lt;Sequence&gt; Stack ({allSequences.length})
              </span>
              <button
                type="button"
                onClick={handleAddCustomSequence}
                className="px-2.5 py-1 rounded-md bg-[#10b981] hover:bg-[#34d399] text-[#032b1d] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add &lt;Sequence&gt;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {allSequences.map((seq) => {
                const isSeqActive =
                  seq.enabled &&
                  currentFrame >= seq.from &&
                  currentFrame < seq.from + seq.durationInFrames;
                const isSelected = selectedSeqId === seq.id;
                const isCustom = seq.layer === 'kinetic-title';

                return (
                  <div
                    key={seq.id}
                    onClick={() => {
                      setSelectedSeqId(seq.id);
                      seekToFrame(seq.from);
                    }}
                    className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1c1c22] border-[#0B84F3]'
                        : isSeqActive
                        ? 'bg-[#18181c] border-white/[0.16]'
                        : 'bg-[#161619] border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          style={{ backgroundColor: seq.color }}
                          className="w-2 h-2 rounded-full shrink-0"
                        />
                        <span className="text-xs font-mono font-semibold text-white truncate">
                          {seq.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDisabledSeqIds((prev) => ({
                              ...prev,
                              [seq.id]: !prev[seq.id],
                            }));
                          }}
                          className="p-1 rounded hover:bg-white/10 text-[#94a3b8] hover:text-white cursor-pointer"
                          title={
                            seq.enabled ? 'Disable Sequence' : 'Enable Sequence'
                          }
                        >
                          {seq.enabled ? (
                            <Eye className="w-3.5 h-3.5 text-[#10b981]" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                        </button>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomSequences((prev) =>
                                prev.filter((item) => item.id !== seq.id)
                              );
                            }}
                            className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer"
                            title="Delete Custom Sequence"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {seq.textPreview && (
                      <p className="text-[11px] text-[#94a3b8] truncate mt-1">
                        {seq.textPreview}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#94a3b8] tabular-nums">
                      <span>from={'{' + seq.from + '}'}</span>
                      <span>
                        durationInFrames={'{' + seq.durationInFrames + '}'}
                      </span>
                      <span>premountFor={'{' + seq.premountFor + '}'}</span>
                    </div>

                    {/* Editable controls for custom sequences */}
                    {isCustom && isSelected && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2.5 pt-2.5 border-t border-white/[0.06] space-y-2"
                      >
                        <input
                          type="text"
                          value={seq.textPreview || ''}
                          onChange={(e) =>
                            setCustomSequences((prev) =>
                              prev.map((item) =>
                                item.id === seq.id
                                  ? { ...item, textPreview: e.target.value }
                                  : item
                              )
                            )
                          }
                          placeholder="Overlay Kinetic Text..."
                          className="w-full px-2 py-1 rounded bg-[#0B0B0D] border border-white/15 text-xs text-white"
                        />
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <label className="space-y-1">
                            <span className="text-[#94a3b8]">
                              Start Frame (from)
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={totalFrames - 5}
                              value={seq.from}
                              onChange={(e) =>
                                setCustomSequences((prev) =>
                                  prev.map((item) =>
                                    item.id === seq.id
                                      ? {
                                          ...item,
                                          from: Math.max(
                                            0,
                                            Number(e.target.value)
                                          ),
                                        }
                                      : item
                                  )
                                )
                              }
                              className="w-full px-2 py-1 rounded bg-[#0B0B0D] border border-white/15 font-mono text-white"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-[#94a3b8]">
                              Duration (Frames)
                            </span>
                            <input
                              type="number"
                              min={5}
                              max={totalFrames}
                              value={seq.durationInFrames}
                              onChange={(e) =>
                                setCustomSequences((prev) =>
                                  prev.map((item) =>
                                    item.id === seq.id
                                      ? {
                                          ...item,
                                          durationInFrames: Math.max(
                                            5,
                                            Number(e.target.value)
                                          ),
                                        }
                                      : item
                                  )
                                )
                              }
                              className="w-full px-2 py-1 rounded bg-[#0B0B0D] border border-white/15 font-mono text-white"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LEFT TAB 3: REMOTION <Composition> SETTINGS */}
        {leftTab === 'composition' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#94a3b8]">
                &lt;Composition id=&quot;...&quot; /&gt;
              </label>
              <input
                type="text"
                value={remotionConfig.compositionId}
                onChange={(e) =>
                  setRemotionConfig((prev) => ({
                    ...prev,
                    compositionId:
                      e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') ||
                      'MerupifyViralReel',
                  }))
                }
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c1f] border border-white/[0.08] font-mono text-xs text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#94a3b8]">
                Frame Rate (useVideoConfig().fps)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([24, 30, 60] as const).map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() =>
                      setRemotionConfig((prev) => ({ ...prev, fps: rate }))
                    }
                    className={`py-2 rounded-lg font-mono text-xs font-bold border cursor-pointer transition-colors ${
                      remotionConfig.fps === rate
                        ? 'bg-[#10b981]/15 border-[#10b981] text-[#10b981]'
                        : 'bg-[#1c1c1f] border-white/[0.06] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {rate} FPS
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#94a3b8]">
                Composition Dimensions (width × height)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { label: '9:16 Vertical', w: 1080, h: 1920, ratio: '9:16' },
                    { label: '1:1 Square', w: 1080, h: 1080, ratio: '1:1' },
                    { label: '16:9 Wide', w: 1920, h: 1080, ratio: '16:9' },
                  ] as const
                ).map((dim) => {
                  const active =
                    remotionConfig.width === dim.w &&
                    remotionConfig.height === dim.h;
                  return (
                    <button
                      key={dim.label}
                      type="button"
                      onClick={() => {
                        setRemotionConfig((prev) => ({
                          ...prev,
                          width: dim.w,
                          height: dim.h,
                        }));
                        onUpdateStyle({ aspectRatio: dim.ratio });
                      }}
                      className={`p-2 rounded-lg border text-center cursor-pointer transition-colors ${
                        active
                          ? 'bg-[#0B84F3]/15 border-[#0B84F3] text-white'
                          : 'bg-[#1c1c1f] border-white/[0.06] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{dim.label}</div>
                      <div className="text-[10px] font-mono opacity-80">
                        {dim.w}×{dim.h}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#18181b] border border-white/[0.06] space-y-2 font-mono text-[11px] tabular-nums">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">durationInFrames:</span>
                <span className="text-white font-bold">{totalFrames} frames</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Duration (Seconds):</span>
                <span className="text-white">{safeDuration.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Active Track:</span>
                <span className="text-[#10b981] uppercase">
                  {styleConfig.primaryTrack}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* =====================================================================
          COLUMN 2 (CENTER): FRAME-ACCURATE @remotion/player + SEQUENCE TIMELINE
         ===================================================================== */}
      <section className="order-1 lg:order-2 flex-1 min-w-0 flex flex-col min-h-[440px] lg:min-h-0 lg:h-full bg-[#0B0B0D] overflow-hidden shrink-0 lg:shrink">
        {/* Top Frame Telemetry Bar */}
        <div className="h-10 px-4 border-b border-white/[0.06] bg-[#131315] flex items-center justify-between gap-3 text-xs font-mono tabular-nums shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[#0B84F3] font-bold">
              FRAME {String(currentFrame).padStart(4, '0')} /{' '}
              {String(totalFrames).padStart(4, '0')}
            </span>
            <span className="text-white/20">·</span>
            <span className="text-[#10b981] font-semibold">{fps} FPS</span>
            <span className="text-white/20">·</span>
            <span className="text-[#94a3b8]">
              {currentTime.toFixed(2)}s / {safeDuration.toFixed(2)}s
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-[#94a3b8]">
              {remotionConfig.width}×{remotionConfig.height}
            </span>
            <span className="text-white/20">·</span>
            <span className="text-[#E5E1E4]">
              Active &lt;Sequence&gt;:{' '}
              <strong className="text-[#10b981]">
                {activeSequencesAtFrame.length}
              </strong>
            </span>
          </div>
        </div>

        {/* Center <AbsoluteFill> Remotion Composition Stage */}
        <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-hidden relative">
          <div
            className={`relative overflow-hidden bg-[#050507] border border-white/15 shadow-2xl flex items-center justify-center ${
              remotionConfig.width > remotionConfig.height
                ? 'w-full max-w-[660px] aspect-video'
                : remotionConfig.width === remotionConfig.height
                ? 'h-full max-h-[420px] aspect-square'
                : 'h-full max-h-[470px] aspect-[9/16]'
            }`}
          >
            {/* LAYER 1: Base Video or Studio Backdrop */}
            {uploadedVideoUrl ? (
              <video
                src={uploadedVideoUrl}
                muted
                playsInline
                ref={(el) => {
                  if (el && Math.abs(el.currentTime - currentTime) > 0.08) {
                    el.currentTime = currentTime;
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-[#111827] via-[#0B0B0D] to-[#050507] flex flex-col items-center justify-center p-6">
                <div className="w-24 h-24 rounded-full bg-[#10b981]/10 border border-[#10b981]/25 flex items-center justify-center mb-3">
                  <Film className="w-10 h-10 text-[#10b981]" />
                </div>
                <span className="text-[11px] font-mono text-[#94a3b8]">
                  &lt;AbsoluteFill&gt; · {remotionConfig.compositionId}
                </span>
              </div>
            )}

            {/* LAYER 2: Active AI B-Roll Cutaway <Sequence> with interpolate() Ken Burns */}
            {activeBRollSequence && activeBRollSequence.mediaUrl && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {(() => {
                  const localF = Math.max(
                    0,
                    currentFrame - activeBRollSequence.from
                  );
                  const scale = remotionInterpolate(
                    localF,
                    [0, activeBRollSequence.durationInFrames],
                    [1.0, 1.15]
                  );
                  const opacity = remotionInterpolate(
                    localF,
                    [
                      0,
                      5,
                      Math.max(6, activeBRollSequence.durationInFrames - 5),
                      activeBRollSequence.durationInFrames,
                    ],
                    [0, 1, 1, 0]
                  );
                  return (
                    <img
                      src={activeBRollSequence.mediaUrl}
                      alt={activeBRollSequence.name}
                      referrerPolicy="no-referrer"
                      style={{
                        transform: `scale(${scale.toFixed(3)})`,
                        opacity,
                      }}
                      className="w-full h-full object-cover"
                    />
                  );
                })()}
              </div>
            )}

            {/* Contrast Scrim for Caption Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

            {/* LAYER 3: Custom Kinetic Title <Sequence> */}
            {activeKineticTitleSeq && (
              <div className="absolute top-6 inset-x-4 flex justify-center pointer-events-none">
                {(() => {
                  const localF = Math.max(
                    0,
                    currentFrame - activeKineticTitleSeq.from
                  );
                  const sp = remotionSpring({
                    frame: localF,
                    fps,
                    config: remotionConfig.springConfig,
                  });
                  const y = remotionInterpolate(sp, [0, 1], [-24, 0]);
                  return (
                    <div
                      style={{
                        transform: `translateY(${y.toFixed(1)}px) scale(${sp.toFixed(3)})`,
                      }}
                      className="px-3.5 py-1.5 rounded-md bg-[#0B0B0D]/90 border border-[#10b981]/50 text-[11px] font-bold tracking-wider text-[#10b981] shadow-lg"
                    >
                      {activeKineticTitleSeq.textPreview}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* LAYER 4: @remotion/captions Kinetic Subtitle <Sequence> with spring() & interpolate() */}
            {activeCaptionPage && (
              <div className="absolute inset-x-4 bottom-12 flex flex-col items-center justify-center pointer-events-none">
                {(() => {
                  const pageLocalFrame = Math.max(
                    0,
                    currentFrame - activeCaptionPage.fromFrame
                  );
                  const pageSpring = remotionSpring({
                    frame: pageLocalFrame,
                    fps,
                    config: remotionConfig.springConfig,
                  });
                  const pageTranslateY = remotionInterpolate(
                    pageLocalFrame,
                    [0, remotionConfig.interpolateConfig.enterFrames],
                    [remotionConfig.interpolateConfig.startYOffsetPx, 0]
                  );
                  const pageScale = remotionInterpolate(
                    pageSpring,
                    [0, 1],
                    [remotionConfig.interpolateConfig.startScale, 1]
                  );

                  // Mode: Single-Word Slam
                  if (remotionConfig.captionPagingMode === 'single-word-slam') {
                    const currentToken =
                      activeCaptionPage.tokens.find(
                        (t) =>
                          currentFrame >= t.fromFrame &&
                          currentFrame <= t.toFrame
                      ) || activeCaptionPage.tokens[0];
                    const wordLocalFrame = Math.max(
                      0,
                      currentFrame - currentToken.fromFrame
                    );
                    const wordSp = remotionSpring({
                      frame: wordLocalFrame,
                      fps,
                      config: remotionConfig.springConfig,
                    });
                    const slamScale = remotionInterpolate(
                      wordSp,
                      [0, 1],
                      [
                        remotionConfig.interpolateConfig.startScale,
                        remotionConfig.interpolateConfig.activeWordScale,
                      ]
                    );
                    const slamRot = remotionInterpolate(
                      wordSp,
                      [0, 1],
                      [remotionConfig.interpolateConfig.rotationDeg, 0]
                    );

                    return (
                      <div
                        style={{
                          transform: `translateY(${pageTranslateY.toFixed(1)}px) scale(${slamScale.toFixed(3)}) rotate(${slamRot.toFixed(1)}deg)`,
                          fontFamily:
                            styleConfig.fontFamily || 'Plus Jakarta Sans',
                          color: currentToken.isHero
                            ? styleConfig.highlightColor || '#10b981'
                            : styleConfig.primaryColor || '#FFFFFF',
                        }}
                        className="text-3xl font-extrabold uppercase tracking-tight drop-shadow-[0_6px_24px_rgba(0,0,0,0.95)] text-center px-3"
                      >
                        {currentToken.text}
                      </div>
                    );
                  }

                  // Mode: TikTok Pages / Karaoke Fill / Two-Line Split
                  return (
                    <div
                      style={{
                        transform: `translateY(${pageTranslateY.toFixed(1)}px) scale(${pageScale.toFixed(3)})`,
                      }}
                      className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 max-w-[92%] text-center"
                    >
                      {activeCaptionPage.tokens.map((token, idx) => {
                        const isWordCurrent =
                          currentFrame >= token.fromFrame &&
                          currentFrame <= token.toFrame;
                        const isWordSpoken = currentFrame >= token.fromFrame;
                        const tokenLocalFrame = Math.max(
                          0,
                          currentFrame - token.fromFrame
                        );
                        const wordSpring = remotionSpring({
                          frame: tokenLocalFrame,
                          fps,
                          config: remotionConfig.springConfig,
                        });
                        const wordScale = isWordCurrent
                          ? remotionInterpolate(
                              wordSpring,
                              [0, 1],
                              [
                                1,
                                remotionConfig.interpolateConfig.activeWordScale,
                              ]
                            )
                          : 1;
                        const wordRotate = isWordCurrent
                          ? remotionInterpolate(
                              wordSpring,
                              [0, 1],
                              [remotionConfig.interpolateConfig.rotationDeg, 0]
                            )
                          : 0;

                        const activeColor =
                          styleConfig.highlightColor || '#10b981';
                        const baseColor = styleConfig.primaryColor || '#FFFFFF';

                        const textColor =
                          remotionConfig.captionPagingMode === 'karaoke-fill'
                            ? isWordSpoken
                              ? activeColor
                              : 'rgba(255,255,255,0.42)'
                            : isWordCurrent || token.isHero
                            ? activeColor
                            : baseColor;

                        return (
                          <span
                            key={`${token.fromMs}-${idx}`}
                            style={{
                              fontFamily:
                                styleConfig.fontFamily || 'Plus Jakarta Sans',
                              color: textColor,
                              transform: `scale(${wordScale.toFixed(3)}) rotate(${wordRotate.toFixed(1)}deg)`,
                              backgroundColor:
                                isWordCurrent &&
                                remotionConfig.captionPagingMode ===
                                  'tiktok-pages'
                                  ? 'rgba(16, 185, 129, 0.18)'
                                  : 'transparent',
                            }}
                            className={`inline-block px-1.5 py-0.5 rounded font-extrabold tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] ${
                              token.isHero &&
                              remotionConfig.captionPagingMode ===
                                'two-line-split'
                                ? 'text-2xl w-full'
                                : 'text-xl'
                            }`}
                          >
                            {token.text}
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Frame-Accurate Remotion Player Transport Controls */}
        <div className="h-12 px-4 border-t border-white/[0.06] bg-[#131315] flex items-center justify-between gap-2 text-xs shrink-0">
          {/* Left: In / Out Loop Range Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setRemotionConfig((prev) => ({
                  ...prev,
                  inFrame: currentFrame,
                }))
              }
              className="px-2 py-1 rounded bg-[#1c1c1f] hover:bg-[#26262a] border border-white/[0.06] font-mono text-[11px] text-[#94a3b8] hover:text-white cursor-pointer tabular-nums"
              title="Set Loop In Frame at current playhead"
            >
              In: {remotionConfig.inFrame}f
            </button>
            <button
              type="button"
              onClick={() =>
                setRemotionConfig((prev) => ({
                  ...prev,
                  outFrame: currentFrame,
                }))
              }
              className="px-2 py-1 rounded bg-[#1c1c1f] hover:bg-[#26262a] border border-white/[0.06] font-mono text-[11px] text-[#94a3b8] hover:text-white cursor-pointer tabular-nums"
              title="Set Loop Out Frame at current playhead"
            >
              Out: {remotionConfig.outFrame ?? totalFrames - 1}f
            </button>
            <button
              type="button"
              onClick={() =>
                setRemotionConfig((prev) => ({
                  ...prev,
                  inFrame: 0,
                  outFrame: null,
                }))
              }
              className="p-1.5 rounded bg-[#1c1c1f] hover:bg-[#26262a] text-[#94a3b8] hover:text-white cursor-pointer"
              title="Reset In/Out Frame Range"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Center: Step -10f | Step -1f | Play/Pause | Step +1f | Step +10f */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => seekToFrame(currentFrame - 10)}
              className="px-2 py-1 rounded bg-[#1c1c1f] hover:bg-[#26262a] font-mono text-[11px] text-[#94a3b8] hover:text-white cursor-pointer"
              title="Back 10 Frames"
            >
              -10f
            </button>
            <button
              type="button"
              onClick={() => seekToFrame(currentFrame - 1)}
              className="p-1.5 rounded bg-[#1c1c1f] hover:bg-[#26262a] text-[#E5E1E4] cursor-pointer"
              title="Step Back 1 Frame"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onTogglePlayPause}
              className="w-8 h-8 rounded-full bg-[#10b981] hover:bg-[#34d399] text-[#032b1d] flex items-center justify-center shadow-md cursor-pointer transition-transform"
              title={isPlaying ? 'Pause' : 'Play Remotion Composition'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-[#032b1d]" />
              ) : (
                <Play className="w-4 h-4 fill-[#032b1d] ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => seekToFrame(currentFrame + 1)}
              className="p-1.5 rounded bg-[#1c1c1f] hover:bg-[#26262a] text-[#E5E1E4] cursor-pointer"
              title="Step Forward 1 Frame"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => seekToFrame(currentFrame + 10)}
              className="px-2 py-1 rounded bg-[#1c1c1f] hover:bg-[#26262a] font-mono text-[11px] text-[#94a3b8] hover:text-white cursor-pointer"
              title="Forward 10 Frames"
            >
              +10f
            </button>
          </div>

          {/* Right: Mute & Loop Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              className="p-1.5 rounded bg-[#1c1c1f] hover:bg-[#26262a] text-[#94a3b8] hover:text-white cursor-pointer"
              title="Mute / Unmute"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                setRemotionConfig((prev) => ({
                  ...prev,
                  loopPlayback: !prev.loopPlayback,
                }))
              }
              className={`px-2.5 py-1 rounded border text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                remotionConfig.loopPlayback
                  ? 'bg-[#10b981]/15 border-[#10b981]/50 text-[#10b981]'
                  : 'bg-[#1c1c1f] border-white/[0.06] text-[#94a3b8]'
              }`}
              title="Toggle Loop Playback"
            >
              <Repeat className="w-3 h-3" />
              <span>Loop</span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            BOTTOM MULTI-LAYER <Sequence> FRAME TIMELINE
           =================================================================== */}
        <div className="h-[195px] border-t border-white/[0.08] bg-[#111215] flex flex-col shrink-0">
          {/* Frame Ruler Header */}
          <div
            ref={timelineTrackRef}
            onMouseDown={(e) => {
              isScrubbingTimelineRef.current = true;
              handleTimelinePointer(e.clientX);
              const onMove = (me: MouseEvent) => {
                if (isScrubbingTimelineRef.current) {
                  handleTimelinePointer(me.clientX);
                }
              };
              const onUp = () => {
                isScrubbingTimelineRef.current = false;
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
            className="flex-1 flex flex-col relative cursor-pointer overflow-hidden px-3 py-2 space-y-1.5"
          >
            {/* Frame Tick Marks */}
            <div className="h-5 border-b border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[#94a3b8] tabular-nums select-none">
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((pct) => {
                const f = Math.round(pct * (totalFrames - 1));
                return <span key={pct}>{f}f</span>;
              })}
            </div>

            {/* 4 Multi-Layer <Sequence> Tracks */}
            {(
              [
                {
                  layer: 'captions',
                  label: 'Seq 1 · @remotion/captions',
                  color: '#10B981',
                },
                {
                  layer: 'broll',
                  label: 'Seq 2 · AI B-Roll & Overlays',
                  color: '#0B84F3',
                },
                {
                  layer: 'video',
                  label: 'Seq 3 · OffthreadVideo',
                  color: '#6366F1',
                },
                {
                  layer: 'audio',
                  label: 'Seq 4 · Audio & SFX',
                  color: '#F59E0B',
                },
              ] as const
            ).map((row) => {
              const rowSeqs = allSequences.filter((s) =>
                row.layer === 'broll'
                  ? s.layer === 'broll' || s.layer === 'kinetic-title'
                  : s.layer === row.layer
              );

              return (
                <div
                  key={row.layer}
                  className="h-7 rounded bg-[#18191E] border border-white/[0.05] relative flex items-center overflow-hidden"
                >
                  <span className="z-10 pl-2 pr-3 text-[10px] font-mono font-semibold text-white/75 pointer-events-none shrink-0">
                    {row.label}
                  </span>

                  <div className="absolute inset-0">
                    {rowSeqs.map((seq) => {
                      const leftPct = (seq.from / Math.max(1, totalFrames)) * 100;
                      const widthPct = Math.max(
                        1.5,
                        (seq.durationInFrames / Math.max(1, totalFrames)) * 100
                      );
                      return (
                        <div
                          key={seq.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSeqId(seq.id);
                            seekToFrame(seq.from);
                          }}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            backgroundColor: seq.enabled
                              ? `${seq.color}38`
                              : 'rgba(255,255,255,0.05)',
                            borderColor: seq.enabled
                              ? seq.color
                              : 'rgba(255,255,255,0.12)',
                          }}
                          className="absolute inset-y-0.5 rounded border px-1.5 flex items-center overflow-hidden hover:brightness-125 transition-all"
                          title={`${seq.name} (from=${seq.from}f, durationInFrames=${seq.durationInFrames}f)`}
                        >
                          <span className="text-[9px] font-mono text-white truncate">
                            {seq.textPreview || seq.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Frame Playhead Vertical Line */}
            <div
              style={{
                left: `calc(12px + ${(currentFrame / Math.max(1, totalFrames - 1)) * 100}% * 0.96)`,
              }}
              className="absolute inset-y-0 w-0.5 bg-[#0B84F3] pointer-events-none z-20"
            >
              <div className="w-3 h-3 -ml-[5px] rounded-full bg-[#0B84F3] shadow" />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          COLUMN 3 (RIGHT): SPRING PHYSICS, INTERPOLATE & LIVE TSX CODE
         ===================================================================== */}
      <aside className="order-2 lg:order-3 w-full lg:w-[410px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-[#131315] flex flex-col min-h-[440px] lg:min-h-0 lg:h-full overflow-hidden">
        {/* Top Segmented Mode Switcher */}
        <div className="grid grid-cols-3 p-1.5 m-2.5 mb-1 bg-[#1c1c1f] rounded-lg border border-white/[0.06] shrink-0">
          {(
            [
              { id: 'physics', label: 'Spring & Motion' },
              { id: 'tsx-code', label: 'Live TSX Code' },
              { id: 'render', label: 'Render & Export' },
            ] as const
          ).map((t) => {
            const active = rightTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setRightTab(t.id)}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#26262a] text-[#10b981] shadow-sm'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* RIGHT TAB 1: SPRING() PHYSICS & INTERPOLATE() KEYFRAMES */}
        {rightTab === 'physics' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
            {/* Live SVG Spring Response Curve */}
            <div className="p-3 rounded-lg bg-[#18181b] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  spring() Response Curve
                </span>
                <span className="text-[10px] font-mono text-[#0B84F3] tabular-nums">
                  d:{remotionConfig.springConfig.damping} · s:
                  {remotionConfig.springConfig.stiffness} · m:
                  {remotionConfig.springConfig.mass}
                </span>
              </div>

              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-24 bg-[#0B0B0D] rounded border border-white/[0.06]"
              >
                {/* Target 1.0 dashed line */}
                <line
                  x1={0}
                  y1={baselineY}
                  x2={svgWidth}
                  y2={baselineY}
                  stroke="rgba(16, 185, 129, 0.35)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                {/* Spring trajectory */}
                <polyline
                  fill="none"
                  stroke="#0B84F3"
                  strokeWidth={2.2}
                  points={springPolyline}
                />
              </svg>
            </div>

            {/* 1-Click Remotion Spring Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#94a3b8]">
                Remotion Spring Presets
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {REMOTION_SPRING_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setRemotionConfig((prev) => ({
                        ...prev,
                        springConfig: { ...preset.config },
                        interpolateConfig: {
                          ...prev.interpolateConfig,
                          ...(preset.interpolatePartial || {}),
                        },
                      }));
                      onShowToast(`Applied Remotion preset: ${preset.name}`);
                    }}
                    className="p-2 rounded-lg bg-[#1c1c1f] hover:bg-[#26262a] border border-white/[0.06] text-left cursor-pointer transition-colors"
                  >
                    <div className="text-xs font-semibold text-white truncate">
                      {preset.name}
                    </div>
                    <div className="text-[10px] font-mono text-[#10b981] tabular-nums">
                      {preset.badge}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Spring Config Sliders */}
            <div className="p-3 rounded-lg bg-[#18181b] border border-white/[0.06] space-y-3">
              <div className="text-xs font-bold text-white">
                spring(&#123; frame, fps, config &#125;)
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#94a3b8]">damping (friction)</span>
                  <span className="font-mono text-white tabular-nums">
                    {remotionConfig.springConfig.damping}
                  </span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={60}
                  step={1}
                  value={remotionConfig.springConfig.damping}
                  onChange={(e) =>
                    setRemotionConfig((prev) => ({
                      ...prev,
                      springConfig: {
                        ...prev.springConfig,
                        damping: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-[#0B84F3] h-1.5 bg-[#26262a] rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#94a3b8]">stiffness (tension)</span>
                  <span className="font-mono text-white tabular-nums">
                    {remotionConfig.springConfig.stiffness}
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={400}
                  step={5}
                  value={remotionConfig.springConfig.stiffness}
                  onChange={(e) =>
                    setRemotionConfig((prev) => ({
                      ...prev,
                      springConfig: {
                        ...prev.springConfig,
                        stiffness: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-[#0B84F3] h-1.5 bg-[#26262a] rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#94a3b8]">mass (weight)</span>
                  <span className="font-mono text-white tabular-nums">
                    {remotionConfig.springConfig.mass.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={3.5}
                  step={0.05}
                  value={remotionConfig.springConfig.mass}
                  onChange={(e) =>
                    setRemotionConfig((prev) => ({
                      ...prev,
                      springConfig: {
                        ...prev.springConfig,
                        mass: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-[#0B84F3] h-1.5 bg-[#26262a] rounded-lg cursor-pointer"
                />
              </div>

              <label className="flex items-center justify-between pt-1 cursor-pointer">
                <span className="text-[11px] text-[#94a3b8]">
                  overshootClamping
                </span>
                <input
                  type="checkbox"
                  checked={remotionConfig.springConfig.overshootClamping}
                  onChange={(e) =>
                    setRemotionConfig((prev) => ({
                      ...prev,
                      springConfig: {
                        ...prev.springConfig,
                        overshootClamping: e.target.checked,
                      },
                    }))
                  }
                  className="accent-[#10b981] w-4 h-4 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* interpolate() Keyframe Controls & Paging Mode */}
            <div className="p-3 rounded-lg bg-[#18181b] border border-white/[0.06] space-y-3">
              <div className="text-xs font-bold text-white">
                interpolate() &amp; @remotion/captions Mode
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'tiktok-pages', label: 'TikTok Pages' },
                    { id: 'single-word-slam', label: 'Single-Word Slam' },
                    { id: 'karaoke-fill', label: 'Karaoke Fill' },
                    { id: 'two-line-split', label: 'Two-Line Split' },
                  ] as { id: RemotionCaptionPagingMode; label: string }[]
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() =>
                      setRemotionConfig((prev) => ({
                        ...prev,
                        captionPagingMode: mode.id,
                      }))
                    }
                    className={`py-1.5 px-2 rounded text-[11px] font-semibold border cursor-pointer transition-colors ${
                      remotionConfig.captionPagingMode === mode.id
                        ? 'bg-[#10b981]/15 border-[#10b981] text-[#10b981]'
                        : 'bg-[#1c1c1f] border-white/[0.06] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#94a3b8]">Active Word Pop Scale</span>
                  <span className="font-mono text-white tabular-nums">
                    {remotionConfig.interpolateConfig.activeWordScale.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={1.65}
                  step={0.02}
                  value={remotionConfig.interpolateConfig.activeWordScale}
                  onChange={(e) =>
                    setRemotionConfig((prev) => ({
                      ...prev,
                      interpolateConfig: {
                        ...prev.interpolateConfig,
                        activeWordScale: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-[#10b981] h-1.5 bg-[#26262a] rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#94a3b8]">Entrance Y Offset (px)</span>
                  <span className="font-mono text-white tabular-nums">
                    {remotionConfig.interpolateConfig.startYOffsetPx}px
                  </span>
                </div>
                <input
                  type="range"
                  min={-60}
                  max={60}
                  step={2}
                  value={remotionConfig.interpolateConfig.startYOffsetPx}
                  onChange={(e) =>
                    setRemotionConfig((prev) => ({
                      ...prev,
                      interpolateConfig: {
                        ...prev.interpolateConfig,
                        startYOffsetPx: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-[#10b981] h-1.5 bg-[#26262a] rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#94a3b8]">Spring Tilt Rotation (°)</span>
                  <span className="font-mono text-white tabular-nums">
                    {remotionConfig.interpolateConfig.rotationDeg}°
                  </span>
                </div>
                <input
                  type="range"
                  min={-20}
                  max={20}
                  step={1}
                  value={remotionConfig.interpolateConfig.rotationDeg}
                  onChange={(e) =>
                    setRemotionConfig((prev) => ({
                      ...prev,
                      interpolateConfig: {
                        ...prev.interpolateConfig,
                        rotationDeg: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-[#10b981] h-1.5 bg-[#26262a] rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* RIGHT TAB 2: LIVE REMOTION REACT TSX CODE GENERATOR */}
        {rightTab === 'tsx-code' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 space-y-2.5">
            {/* File Selector Tabs */}
            <div className="flex flex-wrap gap-1 shrink-0">
              {(
                [
                  { id: 'composition', label: 'MerupifyComposition.tsx' },
                  { id: 'subtitles', label: 'SubtitlesPage.tsx' },
                  { id: 'root', label: 'Root.tsx' },
                  { id: 'captionsJson', label: 'captions.json' },
                  { id: 'packageJson', label: 'package.json' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveCodeFile(f.id)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-semibold cursor-pointer border transition-colors ${
                    activeCodeFile === f.id
                      ? 'bg-[#0B84F3]/20 border-[#0B84F3] text-white'
                      : 'bg-[#1c1c1f] border-white/[0.06] text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Action Buttons: Copy & Download */}
            <div className="flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex-1 py-1.5 px-3 rounded-lg bg-[#1c1c1f] hover:bg-[#26262a] border border-white/[0.08] text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10b981]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#94a3b8]" />
                    <span>Copy {activeCodeFilename}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadAllRemotionBundle}
                className="py-1.5 px-3 rounded-lg bg-[#10b981] hover:bg-[#34d399] text-[#032b1d] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Bundle</span>
              </button>
            </div>

            {/* Monospace Code Viewer */}
            <pre className="flex-1 min-h-0 overflow-auto p-3 rounded-lg bg-[#0B0B0D] border border-white/[0.08] font-mono text-[11px] leading-relaxed text-[#E5E1E4] select-text">
              <code>{activeCodeContent}</code>
            </pre>
          </div>
        )}

        {/* RIGHT TAB 3: REMOTION RENDER & EXPORT */}
        {rightTab === 'render' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#18181b] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#0B84F3]" />
                  <span>Remotion CLI Render Command</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `npx remotion render ${remotionConfig.compositionId} out/video.mp4 --codec=h264`
                    );
                    setCopiedCli(true);
                    onShowToast('Copied Remotion CLI command');
                    setTimeout(() => setCopiedCli(false), 1800);
                  }}
                  className="px-2 py-0.5 rounded bg-[#26262a] hover:bg-[#323238] text-[10px] font-semibold text-white cursor-pointer"
                >
                  {copiedCli ? 'Copied' : 'Copy CLI'}
                </button>
              </div>
              <div className="p-2.5 rounded bg-[#0B0B0D] border border-white/[0.06] font-mono text-[11px] text-[#10b981] select-all">
                npx remotion render {remotionConfig.compositionId} out/video.mp4
                --codec=h264
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#18181b] border border-white/[0.06] space-y-2.5">
              <div className="font-bold text-white">
                Direct Browser &amp; Code Exports
              </div>

              <button
                type="button"
                onClick={() => onExportBurnedVideo(exportFormat)}
                className="w-full py-2.5 px-4 rounded-lg bg-[#10b981] hover:bg-[#34d399] text-[#032b1d] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExportingVideo
                    ? `Rendering Frame Video (${exportProgress}%)...`
                    : `Render Burned Video (${exportFormat.toUpperCase()})`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadAllRemotionBundle}
                className="w-full py-2 px-3 rounded-lg bg-[#1c1c1f] hover:bg-[#26262a] border border-white/[0.08] text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-[#0B84F3]" />
                <span>Download Full Remotion Project (.tsx)</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadCodeFile(
                      'captions.json',
                      generatedCode.captionsJson
                    )
                  }
                  className="py-2 px-2.5 rounded-lg bg-[#1c1c1f] hover:bg-[#26262a] border border-white/[0.06] text-[#E5E1E4] font-medium text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>captions.json</span>
                </button>
                <button
                  type="button"
                  onClick={onExportSRT}
                  className="py-2 px-2.5 rounded-lg bg-[#1c1c1f] hover:bg-[#26262a] border border-white/[0.06] text-[#E5E1E4] font-medium text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#94a3b8]" />
                  <span>Subtitles (.SRT)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
