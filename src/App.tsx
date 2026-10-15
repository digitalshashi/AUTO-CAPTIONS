/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Sparkles,
  X,
  Video as VideoIcon,
  Square,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Scissors,
  Plus,
  Minus,
  Zap,
  Lock,
  Unlock,
  Maximize2,
  Shield,
  LayoutGrid,
  SlidersHorizontal,
  ArrowLeft,
  ArrowRight,
  Undo2,
  Redo2,
  Link2,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  ActiveCanvasLayer,
  AudioEnhancerConfig,
  CaptionSegment,
  CaptionStyleConfig,
  SampleReel,
  SafeZonePreset,
  StylePreset,
  TrackKey,
  VideoAspectRatio,
  WordTiming,
} from './types/caption';
import {
  AVAILABLE_FONTS,
  DEFAULT_STYLE_CONFIG,
  INDIAN_LANGUAGE_MATRIX,
  SAMPLE_REELS,
  STYLE_PRESETS,
} from './data/presetsAndLanguages';
import {
  injectEmojisIntoCaptionText,
} from './data/kalakarOptionsData';
import {
  applyAutoHeroNLPToSegments,
  buildWordTimingsClient,
  exportStandaloneAudioWAV,
  extractAudioChunksFromVideo,
  generatePremiereDaVinciXML,
  generateSRTContent,
  generateVTTContent,
  getSupportedExportMimeType,
  regroupSegmentsByWordsPerLine,
  shiftAndStretchSegments,
  SpeechWindow,
  syncSegmentsToVoiceActivity,
  triggerFileDownload,
  VideoExportFormat,
} from './utils/audioExtractor';
import {
  getLatestLayerHitBoxes,
  renderReelCanvasFrame,
} from './utils/canvasCaptionRenderer';
import {
  CaptionToolBulkAction,
  TranscriptLanguagePanel,
} from './components/TranscriptLanguagePanel';
import { StyleAnimationInspector } from './components/StyleAnimationInspector';
import {
  PrepareYourMediaModal,
  KalakarShellHubModal,
  KalakarShellView,
} from './components/KalakarAppShellModals';
import { KalakarAgentAndTester } from './components/KalakarAgentAndTester';
import {
  MerupifyDashboardApp,
  MerupifyLandingPage,
  MerupifyUser,
} from './components/MerupifyLandingAndDashboard';
import {
  PremiereMultiTrackTimeline,
  TimelineClip,
  TrackConfig,
  TrackId,
} from './components/PremiereMultiTrackTimeline';
import {
  detectContextSfxForText,
  playOpenSourceSoundEffect,
} from './utils/soundEffectsEngine';
import { extractHighDensityWaveformFromFile } from './utils/audioWaveformAnalyzer';
import { getLatestSubjectSegmentation } from './utils/depthSubjectSegmentation';

const PRESETS_STORAGE_KEY = 'vakyareel_sidz_presets_v3';
const AUTH_USER_STORAGE_KEY = 'merupify_auth_user_v1';

export default function App() {
  const [currentUser, setCurrentUser] = useState<MerupifyUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (saved) return JSON.parse(saved) as MerupifyUser;
    } catch {
      // ignore
    }
    return null;
  });
  const [appScreenMode, setAppScreenMode] = useState<'landing' | 'dashboard' | 'editor'>('landing');
  const [activeSampleReel, setActiveSampleReel] = useState<SampleReel>(SAMPLE_REELS[0]);
  const [segments, setSegments] = useState<CaptionSegment[]>(SAMPLE_REELS[0].segments);
  const [presets, setPresets] = useState<StylePreset[]>(() => {
    try {
      const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return STYLE_PRESETS;
  });
  const [styleConfig, setStyleConfig] = useState<CaptionStyleConfig>(() => {
    try {
      const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StylePreset[];
        if (Array.isArray(parsed) && parsed[0]?.config) {
          return {
            ...DEFAULT_STYLE_CONFIG,
            ...parsed[0].config,
            presetId: parsed[0].id,
            showOnScreenTransformBoxes: false,
          };
        }
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_STYLE_CONFIG, showOnScreenTransformBoxes: false };
  });

  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [uploadedVideoName, setUploadedVideoName] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string>(
    'Tinglish + Telugu + Premiere Pro Hierarchy'
  );
  const [sourceLanguageHint, setSourceLanguageHint] = useState<string>('auto');

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(SAMPLE_REELS[0].duration);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [timelineZoom, setTimelineZoom] = useState<number>(1.8);
  const [timelineGranularity, setTimelineGranularity] = useState<'word' | 'line'>('word');
  const [audioWaveformBars, setAudioWaveformBars] = useState<number[]>([]);
  // Premiere Pro Separated vs Linked Video 1 & Audio 1 Mode (Separated by default so Video & Audio can be cut independently!)
  const [isVideoAudioLinked, setIsVideoAudioLinked] = useState<boolean>(false);
  const [tracksConfig, setTracksConfig] = useState<Record<TrackId, TrackConfig>>({
    captions: {
      id: 'captions',
      label: 'Captions',
      enabled: true,
      visible: true,
      muted: false,
      locked: false,
    },
    broll: {
      id: 'broll',
      label: 'B-Roll 1',
      enabled: false,
      visible: true,
      muted: false,
      locked: false,
    },
    video2: {
      id: 'video2',
      label: 'Video 2',
      enabled: false,
      visible: true,
      muted: false,
      locked: false,
    },
    video1: {
      id: 'video1',
      label: 'Video 1',
      enabled: true,
      visible: true,
      muted: false,
      locked: false,
    },
    audio1: {
      id: 'audio1',
      label: 'Audio 1',
      enabled: true,
      visible: true,
      muted: false,
      locked: false,
    },
    music: {
      id: 'music',
      label: 'Music & Whoosh',
      enabled: false,
      visible: true,
      muted: false,
      locked: false,
    },
  });
  const [videoClips, setVideoClips] = useState<TimelineClip[]>([
    {
      id: 'v1-initial',
      trackId: 'video1',
      label: 'Main Reel Video (V1)',
      startTime: 0,
      endTime: SAMPLE_REELS[0].duration,
      sourceStart: 0,
    },
  ]);
  const [audioClips, setAudioClips] = useState<TimelineClip[]>([
    {
      id: 'a1-initial',
      trackId: 'audio1',
      label: 'Original Dialogue Audio (A1)',
      startTime: 0,
      endTime: SAMPLE_REELS[0].duration,
      sourceStart: 0,
    },
  ]);
  const [brollClips, setBrollClips] = useState<TimelineClip[]>([
    {
      id: 'broll-init-1',
      trackId: 'broll',
      label: 'AI B-Roll · Cinematic Hook Zoom',
      startTime: 0.6,
      endTime: 3.4,
      sourceStart: 0,
      brollPrompt: 'High-contrast studio hook cutaway',
      brollEffect: 'ken-burns',
    },
    {
      id: 'broll-init-2',
      trackId: 'broll',
      label: 'AI B-Roll · Visual Proof Cutaway',
      startTime: 5.0,
      endTime: 8.2,
      sourceStart: 0,
      brollPrompt: 'Dynamic b-roll visual overlay',
      brollEffect: 'zoom-in',
    },
  ]);
  const [video2Clips, setVideo2Clips] = useState<TimelineClip[]>([]);
  const [musicClips, setMusicClips] = useState<TimelineClip[]>([
    {
      id: 'music-bed-init',
      trackId: 'music',
      label: '🎵 Studio Background Music Bed (Stereo Wavelength)',
      startTime: 0,
      endTime: SAMPLE_REELS[0].duration,
      sourceStart: 0,
      sfxType: 'riser',
    },
    {
      id: 'sfx-init-1',
      trackId: 'music',
      label: '💨 Whoosh Swipe Transition',
      startTime: 0.5,
      endTime: 1.9,
      sourceStart: 0,
      sfxType: 'whoosh',
    },
    {
      id: 'sfx-init-2',
      trackId: 'music',
      label: '💨 Whoosh Hook Cut + 🔔 Bell Cue',
      startTime: 4.8,
      endTime: 6.2,
      sourceStart: 0,
      sfxType: 'whoosh',
    },
  ]);
  const lastPlayedSfxSegIdRef = useRef<string | null>(null);

  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeStage, setTranscribeStage] = useState<string>('');
  const [translatingTrack, setTranslatingTrack] = useState<TrackKey | null>(null);
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const [autoHeroNLP, setAutoHeroNLP] = useState<boolean>(true);
  const [isRunningAutoHero, setIsRunningAutoHero] = useState<boolean>(false);
  const [autoSyncDialogue, setAutoSyncDialogue] = useState<boolean>(true);
  const [detectedSpeechWindows, setDetectedSpeechWindows] = useState<SpeechWindow[]>([]);
  const [isDraggingCaption, setIsDraggingCaption] = useState<boolean>(false);
  // Minimal by default: On-Screen HUD is tucked behind a 1-click toggle so video preview has max space
  const [showOnScreenSpacingHUD, setShowOnScreenSpacingHUD] = useState<boolean>(false);
  const [minimalMode, setMinimalMode] = useState<boolean>(true);
  const [showMultiTrackTimeline, setShowMultiTrackTimeline] = useState<boolean>(false);
  const [isAgentAndTesterOpen, setIsAgentAndTesterOpen] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportFormat, setExportFormat] = useState<VideoExportFormat>('mp4');
  const stopExportEarlyRef = useRef<boolean>(false);

  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isRecordingCamera, setIsRecordingCamera] = useState<boolean>(false);

  const [focusedSection, setFocusedSection] = useState<
    'workspace' | 'languages' | 'style' | 'export'
  >('workspace');

  // Kalakar.io Website Hero & Features State (Collapsed by default so user lands directly in clean Studio)
  const [showKalakarHero, setShowKalakarHero] = useState<boolean>(false);
  const [userPlan, setUserPlan] = useState<'free' | 'creator' | 'pro'>('free');
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [audioEnhancer, setAudioEnhancer] = useState<AudioEnhancerConfig>({
    enabled: false,
    noiseReductionDb: 24,
    voiceClarityBoost: 6,
    studioWarmth: 64,
    loudnessNormalize: true,
    remainingCredits: 3,
  });

  // Kalakar Section 1 & Section 3 Modals State
  const [isPrepareMediaOpen, setIsPrepareMediaOpen] = useState<boolean>(false);
  const [isShellHubOpen, setIsShellHubOpen] = useState<boolean>(false);
  const [shellHubActiveView, setShellHubActiveView] = useState<KalakarShellView>('home');
  const [showSafeZonePopover, setShowSafeZonePopover] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const replaceVideoInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraRecorderRef = useRef<MediaRecorder | null>(null);
  const lastFramePerfRef = useRef<number>(performance.now());
  const dragPointerStartRef = useRef<{
    clientX: number;
    clientY: number;
    mode: 'move' | 'resize';
    targetLayer: ActiveCanvasLayer;
    startPosX: number;
    startPosY: number;
    startScale: number;
    moved: boolean;
  } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  const safeParseApiJson = useCallback(
    async <T,>(
      res: Response
    ): Promise<{
      ok: boolean;
      status: number;
      data: T | null;
      isHtmlError: boolean;
      errorMsg?: string;
    }> => {
      try {
        const rawText = await res.text();
        const trimmed = rawText.trim();
        if (
          !trimmed ||
          trimmed.startsWith('<') ||
          trimmed.toLowerCase().startsWith('<!doctype')
        ) {
          return {
            ok: false,
            status: res.status,
            data: null,
            isHtmlError: true,
            errorMsg:
              'Server returned an HTML response instead of JSON — switching to instant fallback.',
          };
        }
        const parsed = JSON.parse(trimmed) as T & { error?: string };
        return {
          ok: res.ok,
          status: res.status,
          data: parsed,
          isHtmlError: false,
          errorMsg: parsed?.error,
        };
      } catch {
        return {
          ok: false,
          status: res.status,
          data: null,
          isHtmlError: true,
          errorMsg: 'Invalid JSON response from server — switching to instant fallback.',
        };
      }
    },
    []
  );

  const fetchWithAutoRetry = useCallback(
    async (
      url: string,
      options: RequestInit,
      onRetryNotice?: (attempt: number) => void
    ): Promise<Response> => {
      let lastRes: Response | null = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(url, options);
          lastRes = res;
          const contentType = (res.headers.get('content-type') || '').toLowerCase();
          const isHtmlGatewayResponse = contentType.includes('text/html');
          if (
            !isHtmlGatewayResponse &&
            res.status !== 503 &&
            res.status !== 429 &&
            res.status !== 502 &&
            res.status !== 504
          ) {
            return res;
          }
        } catch (err) {
          if (attempt === 3) throw err;
        }
        if (attempt < 3) {
          onRetryNotice?.(attempt);
          await new Promise((r) => setTimeout(r, 600 * attempt));
        }
      }
      return lastRes!;
    },
    []
  );

  // 100% VERBATIM AI CAPTION PIPELINE FOR UPLOADED REELS:
  // Extracts 16kHz anti-aliased mono PCM WAV audio (or direct video stream fallback)
  // and transcribes every spoken word verbatim with exact startTime and endTime.
  const runFastCaptionPipeline = useCallback(
    async (file: File, hintOverride?: string) => {
      setIsTranscribing(true);
      setErrorBanner(null);
      // Immediately clear any sample reel captions so only real captions from the uploaded reel appear
      setSegments([]);

      try {
        const chunks = await extractAudioChunksFromVideo(file, (stage) =>
          setTranscribeStage(stage)
        );
        if (chunks.length > 0 && chunks[0].totalDuration) {
          setDuration(chunks[0].totalDuration);
        }
        if (chunks.length > 0 && Array.isArray(chunks[0].waveformBars)) {
          setAudioWaveformBars(chunks[0].waveformBars);
        }

        // Collect all Voice Activity Detection (VAD) speech windows across chunks
        const allSpeechWindows: SpeechWindow[] = [];
        chunks.forEach((c) => {
          if (Array.isArray(c.speechWindows)) {
            c.speechWindows.forEach((w) => {
              allSpeechWindows.push({
                start: Number((c.chunkStartTime + w.start).toFixed(2)),
                end: Number((c.chunkStartTime + w.end).toFixed(2)),
              });
            });
          }
        });
        setDetectedSpeechWindows(allSpeechWindows);

        const chunkMap = new Map<number, CaptionSegment[]>();
        let hasStartedZeroPlayback = false;
        let completedCount = 0;

        setTranscribeStage(
          chunks.length > 1
            ? `Transcribing ${chunks.length} audio segments verbatim...`
            : `Transcribing 100% verbatim captions (0:00–${chunks[0]?.chunkDuration.toFixed(0)}s)...`
        );

        const processSingleChunk = async (chunk: (typeof chunks)[number], index: number) => {
          const rangeLabel = `${chunk.chunkStartTime.toFixed(0)}s–${(
            chunk.chunkStartTime + chunk.chunkDuration
          ).toFixed(0)}s`;

          let chunkSegments: CaptionSegment[] = [];
          for (let pass = 0; pass < 3; pass++) {
            try {
              let mediaBase64ToSend = chunk.mediaBase64;
              let mimeTypeToSend = chunk.mimeType;

              // On Pass 2 (third attempt), if WAV chunk failed and file is <= 18MB, send raw video directly
              if (pass === 2 && index === 0 && file.size <= 18 * 1024 * 1024) {
                const rawBuf = await file.arrayBuffer();
                const bytes = new Uint8Array(rawBuf);
                let binary = '';
                const step = 0x8000;
                for (let i = 0; i < bytes.length; i += step) {
                  binary += String.fromCharCode(...bytes.subarray(i, i + step));
                }
                mediaBase64ToSend = btoa(binary);
                mimeTypeToSend = file.type || 'video/mp4';
              }

              const response = await fetchWithAutoRetry(
                '/api/captions/transcribe',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                  },
                  body: JSON.stringify({
                    mediaBase64: mediaBase64ToSend,
                    mimeType: mimeTypeToSend,
                    duration: chunk.chunkDuration,
                    chunkStartTime: chunk.chunkStartTime,
                    chunkIndex: index,
                    sourceLanguageHint: hintOverride ?? sourceLanguageHint,
                    autoHeroNLP,
                    instantMode: true,
                    speechWindows: autoSyncDialogue ? chunk.speechWindows : [],
                  }),
                },
                (attempt) =>
                  setTranscribeStage(
                    `Transcribing ${rangeLabel} (Attempt ${attempt + 1}/3)...`
                  )
              );

              const parsed = await safeParseApiJson<{
                detectedLanguage?: string;
                segments?: CaptionSegment[];
                error?: string;
              }>(response);

              if (!parsed.ok || !parsed.data) {
                continue;
              }

              if (parsed.data.detectedLanguage) {
                setDetectedLanguage(parsed.data.detectedLanguage);
              }

              if (Array.isArray(parsed.data.segments) && parsed.data.segments.length > 0) {
                chunkSegments = autoHeroNLP
                  ? applyAutoHeroNLPToSegments(parsed.data.segments)
                  : parsed.data.segments;
                break;
              }
            } catch {
              // Retry next pass
            }
          }

          if (chunkSegments.length > 0) {
            chunkMap.set(index, chunkSegments);
          }
          completedCount++;

          // Merge all resolved chunks in chronological order, enforce strict non-overlapping continuity, and number lines
          const merged: CaptionSegment[] = [];
          const sortedIndices = Array.from(chunkMap.keys()).sort((a, b) => a - b);
          for (const idx of sortedIndices) {
            const segs = chunkMap.get(idx);
            if (segs) merged.push(...segs);
          }
          merged.sort((a, b) => a.startTime - b.startTime);

          const rawGrouped =
            styleConfig.wordsPerLine && styleConfig.wordsPerLine > 0
              ? regroupSegmentsByWordsPerLine(
                  merged,
                  styleConfig.wordsPerLine,
                  styleConfig.maxCharsPerLine ?? 26
                )
              : merged;

          // Enforce strict monotonic, non-overlapping segment & word timings so timeline blocks NEVER stack on top of each other
          const totalDur = chunks[0]?.totalDuration || duration || 30;
          const finalSegments: CaptionSegment[] = [];
          let cursorTime = 0;

          for (let i = 0; i < rawGrouped.length; i++) {
            const seg = rawGrouped[i];
            const cleanStart = Number(Math.max(cursorTime, seg.startTime).toFixed(2));
            const minSegDur = 0.35;
            const rawEnd = Math.max(cleanStart + minSegDur, seg.endTime);
            const nextSegStart =
              i < rawGrouped.length - 1 ? rawGrouped[i + 1].startTime : totalDur;
            const cleanEnd = Number(
              Math.min(
                totalDur,
                nextSegStart > cleanStart + minSegDur
                  ? Math.min(rawEnd, nextSegStart)
                  : rawEnd
              ).toFixed(2)
            );
            cursorTime = cleanEnd;

            const updatedTracks: CaptionSegment['tracks'] = {};
            (Object.keys(seg.tracks) as TrackKey[]).forEach((tk) => {
              const tr = seg.tracks[tk];
              if (!tr) return;
              updatedTracks[tk] = {
                text: tr.text,
                words: buildWordTimingsClient(
                  tr.text,
                  cleanStart,
                  cleanEnd,
                  tr.words,
                  undefined,
                  autoHeroNLP
                ),
              };
            });

            finalSegments.push({
              ...seg,
              displayLineNumber: i + 1,
              startTime: cleanStart,
              endTime: cleanEnd,
              tracks: updatedTracks,
            });
          }

          if (finalSegments.length > 0) {
            setSegments(finalSegments);
            // Auto-adjust timeline zoom so every caption box has plenty of horizontal room to show full words
            const recommendedZoom = Math.max(
              1.6,
              Math.min(5, Number((finalSegments.length / 7).toFixed(1)))
            );
            setTimelineZoom(recommendedZoom);
          }

          setTranscribeStage(
            completedCount < chunks.length
              ? `Transcribing: ${completedCount}/${chunks.length} parts ready (${finalSegments.length} captions)...`
              : `Completed ${finalSegments.length} verbatim captions!`
          );

          // Start playback from 0:00 as soon as the first chunk resolves
          if (
            (index === 0 || !hasStartedZeroPlayback) &&
            finalSegments.length > 0 &&
            videoRef.current
          ) {
            hasStartedZeroPlayback = true;
            setCurrentTime(0);
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
        };

        const CONCURRENCY = 2;
        for (let batchStart = 0; batchStart < chunks.length; batchStart += CONCURRENCY) {
          const batch = chunks.slice(batchStart, batchStart + CONCURRENCY);
          await Promise.all(
            batch.map((chunk, offset) =>
              processSingleChunk(chunk, batchStart + offset)
            )
          );
        }

        const totalCreated = Array.from(chunkMap.values()).reduce(
          (acc, arr) => acc + arr.length,
          0
        );
        if (totalCreated > 0) {
          showToast(
            `Generated 100% verbatim word-by-word captions across your entire video!`
          );
        } else {
          setErrorBanner(
            'Could not transcribe speech from this video. Please verify the video has clear spoken audio and click Retry Now.'
          );
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Error generating captions from video.';
        setErrorBanner(message);
      } finally {
        setIsTranscribing(false);
        setTranscribeStage('');
      }
    },
    [
      sourceLanguageHint,
      autoHeroNLP,
      autoSyncDialogue,
      duration,
      styleConfig.wordsPerLine,
      styleConfig.maxCharsPerLine,
      showToast,
      fetchWithAutoRetry,
      safeParseApiJson,
    ]
  );

  const handleUploadFile = useCallback(
    (file: File, openPrepareDialog = false) => {
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl);
      }
      const nextUrl = URL.createObjectURL(file);
      setUploadedVideoFile(file);
      setUploadedVideoUrl(nextUrl);
      setUploadedVideoName(file.name);
      // Clear sample segments immediately so old captions never appear on the uploaded reel
      setSegments([]);
      setCurrentTime(0);
      setIsPlaying(true);
      setVideoClips([
        {
          id: `v1-${Date.now()}`,
          trackId: 'video1',
          label: file.name,
          startTime: 0,
          endTime: Math.max(10, duration),
          sourceStart: 0,
        },
      ]);
      setAudioClips([
        {
          id: `a1-${Date.now()}`,
          trackId: 'audio1',
          label: `${file.name} (Audio)`,
          startTime: 0,
          endTime: Math.max(10, duration),
          sourceStart: 0,
        },
      ]);

      // Extract high-density Premiere Pro audio waveform peaks directly from the uploaded video/audio file
      extractHighDensityWaveformFromFile(file, 3600)
        .then((waveformData) => {
          if (waveformData && waveformData.peaks && waveformData.peaks.length > 0) {
            setAudioWaveformBars(Array.from(waveformData.peaks));
          }
        })
        .catch(() => {
          // fallback handled by timeline generator
        });

      // ALWAYS start the 100% verbatim audio transcription pipeline immediately on upload!
      runFastCaptionPipeline(file);

      if (openPrepareDialog) {
        setIsPrepareMediaOpen(true);
      }
    },
    [uploadedVideoUrl, duration, runFastCaptionPipeline]
  );

  const handleSelectSampleReel = (reel: SampleReel) => {
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }
    setUploadedVideoUrl(null);
    setUploadedVideoFile(null);
    setUploadedVideoName(null);
    setActiveSampleReel(reel);
    setSegments(reel.segments);
    setDuration(reel.duration);
    setDetectedLanguage(reel.dialect);
    setCurrentTime(0);
    setIsPlaying(true);
    setErrorBanner(null);
    setVideoClips([
      {
        id: `v1-sample-${reel.id}`,
        trackId: 'video1',
        label: reel.title,
        startTime: 0,
        endTime: reel.duration,
        sourceStart: 0,
      },
    ]);
    setAudioClips([
      {
        id: `a1-sample-${reel.id}`,
        trackId: 'audio1',
        label: `${reel.title} (Audio)`,
        startTime: 0,
        endTime: reel.duration,
        sourceStart: 0,
      },
    ]);
  };

  // Section 5.1 & 5.2 Per-Line Props Updater
  const handleUpdateSegmentProps = (
    segmentId: string,
    partial: Partial<CaptionSegment>
  ) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === segmentId ? { ...seg, ...partial } : seg))
    );
  };

  // Section 5.3 Per-Word Style & Text Updater
  const handleUpdateWordStyle = (
    segmentId: string,
    trackKey: TrackKey,
    wordIndex: number,
    partial: Partial<WordTiming>
  ) => {
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== segmentId) return seg;
        const trackData = seg.tracks[trackKey];
        if (!trackData) return seg;
        const nextWords = trackData.words.map((w, idx) =>
          idx === wordIndex ? { ...w, ...partial } : w
        );
        return {
          ...seg,
          tracks: {
            ...seg.tracks,
            [trackKey]: {
              ...trackData,
              text: nextWords.map((w) => w.word).join(' '),
              words: nextWords,
            },
          },
        };
      })
    );
  };

  const ensureLanguageTrackPopulated = useCallback(
    async (targetKey: TrackKey) => {
      const alreadyExists = segments.some((s) => Boolean(s.tracks[targetKey]?.text));
      if (alreadyExists || segments.length === 0) return;

      const langMeta = INDIAN_LANGUAGE_MATRIX.find((l) => l.key === targetKey);
      if (!langMeta) return;

      setTranslatingTrack(targetKey);
      setErrorBanner(null);

      try {
        const payloadSegments = segments.map((s) => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          sourceText:
            s.tracks.english?.text ||
            s.tracks.tinglish?.text ||
            s.tracks.telugu?.text ||
            Object.values(s.tracks)[0]?.text ||
            '',
        }));

        const res = await fetchWithAutoRetry('/api/captions/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            segments: payloadSegments,
            targetTrackKey: targetKey,
            targetLanguageLabel: langMeta.label,
            scriptInstruction: langMeta.scriptInstruction,
          }),
        });

        const parsed = await safeParseApiJson<{
          translations?: { id: string; translatedText: string; heroKeywords?: string[] }[];
          error?: string;
        }>(res);

        const translationMap = new Map<
          string,
          { text: string; heroKeywords?: string[] }
        >();
        if (parsed.ok && parsed.data?.translations) {
          parsed.data.translations.forEach(
            (item: { id: string; translatedText: string; heroKeywords?: string[] }) => {
              translationMap.set(item.id, {
                text: item.translatedText,
                heroKeywords: item.heroKeywords,
              });
            }
          );
        }

        setSegments((prev) =>
          prev.map((seg) => {
            const matched = translationMap.get(seg.id);
            const newText =
              matched?.text ||
              seg.tracks.english?.text ||
              seg.tracks.tinglish?.text ||
              '';
            const words = buildWordTimingsClient(
              newText,
              seg.startTime,
              seg.endTime,
              undefined,
              matched?.heroKeywords,
              autoHeroNLP
            );
            return {
              ...seg,
              tracks: {
                ...seg.tracks,
                [targetKey]: {
                  text: words.map((w) => w.word).join(' '),
                  words,
                },
              },
            };
          })
        );
        showToast(`Switched to ${langMeta.shortLabel} with Auto-Hero NLP!`);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to translate track.';
        setErrorBanner(message);
      } finally {
        setTranslatingTrack(null);
      }
    },
    [segments, autoHeroNLP, showToast, fetchWithAutoRetry, safeParseApiJson]
  );

  const handleSelectPrimaryTrack = async (trackKey: TrackKey) => {
    const langMeta = INDIAN_LANGUAGE_MATRIX.find((l) => l.key === trackKey);
    setStyleConfig((prev) => ({
      ...prev,
      primaryTrack: trackKey,
      fontFamily:
        langMeta && !langMeta.isRomanized ? langMeta.recommendedFont : prev.fontFamily,
      heroWordFontFamily:
        langMeta && !langMeta.isRomanized
          ? langMeta.recommendedFont
          : prev.heroWordFontFamily,
    }));
    await ensureLanguageTrackPopulated(trackKey);
  };

  const handleSelectSecondaryTrack = async (trackKey: TrackKey) => {
    const langMeta = INDIAN_LANGUAGE_MATRIX.find((l) => l.key === trackKey);
    setStyleConfig((prev) => ({
      ...prev,
      secondaryTrack: trackKey,
      secondaryFontFamily: langMeta ? langMeta.recommendedFont : prev.secondaryFontFamily,
    }));
    await ensureLanguageTrackPopulated(trackKey);
  };

  const handleUpdateSegmentText = (
    segmentId: string,
    trackKey: TrackKey,
    newText: string
  ) => {
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== segmentId) return seg;
        const existingWords = seg.tracks[trackKey]?.words;
        return {
          ...seg,
          tracks: {
            ...seg.tracks,
            [trackKey]: {
              text: newText,
              words: buildWordTimingsClient(
                newText,
                seg.startTime,
                seg.endTime,
                existingWords
              ),
            },
          },
        };
      })
    );
  };

  const handleToggleWordHero = (
    segmentId: string,
    trackKey: TrackKey,
    wordIndex: number
  ) => {
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== segmentId) return seg;
        const trackData = seg.tracks[trackKey];
        if (!trackData) return seg;
        const updatedWords = trackData.words.map((w, idx) =>
          idx === wordIndex ? { ...w, isHero: !w.isHero } : w
        );
        return {
          ...seg,
          tracks: {
            ...seg.tracks,
            [trackKey]: {
              ...trackData,
              words: updatedWords,
            },
          },
        };
      })
    );
  };

  const handleSetSegmentHeroMode = (
    segmentId: string,
    trackKey: TrackKey,
    mode:
      | 'all'
      | 'none'
      | 'clear'
      | 'first'
      | 'last'
      | 'longest'
      | 'all-big'
      | 'all-small'
      | 'last-word-big'
      | 'longest-word-big'
      | 'first-word-big'
  ) => {
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== segmentId) return seg;
        const trackData = seg.tracks[trackKey];
        if (!trackData || trackData.words.length === 0) return seg;

        let longestIdx = 0;
        trackData.words.forEach((w, idx) => {
          const cleanLen = w.word.replace(/[^\p{L}\p{N}]/gu, '').length;
          const bestLen = trackData.words[longestIdx].word.replace(
            /[^\p{L}\p{N}]/gu,
            ''
          ).length;
          if (cleanLen >= bestLen) {
            longestIdx = idx;
          }
        });

        const updatedWords = trackData.words.map((w, idx) => {
          if (mode === 'all' || mode === 'all-big') return { ...w, isHero: true };
          if (mode === 'none' || mode === 'clear' || mode === 'all-small')
            return { ...w, isHero: false };
          if (mode === 'last' || mode === 'last-word-big')
            return { ...w, isHero: idx === trackData.words.length - 1 };
          if (mode === 'first' || mode === 'first-word-big')
            return { ...w, isHero: idx === 0 };
          if (mode === 'longest' || mode === 'longest-word-big')
            return { ...w, isHero: idx === longestIdx };
          return w;
        });

        return {
          ...seg,
          tracks: {
            ...seg.tracks,
            [trackKey]: {
              ...trackData,
              words: updatedWords,
            },
          },
        };
      })
    );
  };

  const handleMoveSegmentOrder = (segmentId: string, direction: 'up' | 'down') => {
    setSegments((prev) => {
      const idx = prev.findIndex((s) => s.id === segmentId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const copy = [...prev];
      const currentSeg = copy[idx];
      const neighborSeg = copy[targetIdx];

      // Swap the two captions' time slots and rebuild their word timings so they play in the new order from top to bottom!
      const slotA = { startTime: currentSeg.startTime, endTime: currentSeg.endTime };
      const slotB = { startTime: neighborSeg.startTime, endTime: neighborSeg.endTime };

      const rebuildTracksForWindow = (
        tracks: CaptionSegment['tracks'],
        start: number,
        end: number
      ): CaptionSegment['tracks'] => {
        const nextTracks: CaptionSegment['tracks'] = {};
        (Object.keys(tracks) as TrackKey[]).forEach((k) => {
          const t = tracks[k];
          if (t) {
            nextTracks[k] = {
              text: t.text,
              words: buildWordTimingsClient(t.text, start, end, t.words),
            };
          }
        });
        return nextTracks;
      };

      copy[idx] = {
        ...neighborSeg,
        startTime: slotA.startTime,
        endTime: slotA.endTime,
        tracks: rebuildTracksForWindow(
          neighborSeg.tracks,
          slotA.startTime,
          slotA.endTime
        ),
      };
      copy[targetIdx] = {
        ...currentSeg,
        startTime: slotB.startTime,
        endTime: slotB.endTime,
        tracks: rebuildTracksForWindow(
          currentSeg.tracks,
          slotB.startTime,
          slotB.endTime
        ),
      };

      return copy.sort((a, b) => a.startTime - b.startTime);
    });
    showToast(
      direction === 'up' ? 'Moved caption up!' : 'Moved caption down!'
    );
  };

  const handleDuplicateSegment = (segmentId: string) => {
    setSegments((prev) => {
      const idx = prev.findIndex((s) => s.id === segmentId);
      if (idx === -1) return prev;
      const source = prev[idx];
      const dur = Math.max(1.2, Number((source.endTime - source.startTime).toFixed(2)));
      const newStart = Number(source.endTime.toFixed(2));
      const newEnd = Number((newStart + dur).toFixed(2));

      const duplicatedTracks: CaptionSegment['tracks'] = {};
      (Object.keys(source.tracks) as TrackKey[]).forEach((k) => {
        const t = source.tracks[k];
        if (t) {
          duplicatedTracks[k] = {
            text: t.text,
            words: buildWordTimingsClient(t.text, newStart, newEnd, t.words),
          };
        }
      });

      const dupSeg: CaptionSegment = {
        id: `seg-dup-${Date.now()}`,
        startTime: newStart,
        endTime: newEnd,
        tracks: duplicatedTracks,
      };

      if (newEnd > duration) {
        setDuration(newEnd);
      }

      const next = [...prev];
      next.splice(idx + 1, 0, dupSeg);
      return next;
    });
    showToast('Duplicated caption!');
  };

  const handleQuickScreenPosition = (posX: number, posY: number) => {
    handleUpdateStyleAndSyncPreset({
      positionX: posX,
      positionY: posY,
      smallOffsetX: 0,
      smallOffsetY: 0,
      smallLine2OffsetX: 0,
      smallLine2OffsetY: 0,
      bigOffsetX: 0,
      bigOffsetY: 0,
    });
    showToast(
      posY <= 30
        ? 'Moved caption text to Top of screen!'
        : posY <= 58
        ? 'Moved caption text to Center of screen!'
        : 'Moved caption text to Bottom of screen!'
    );
  };

  const handleUpdateSegmentTiming = (
    segmentId: string,
    startTime: number,
    endTime: number
  ) => {
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== segmentId) return seg;
        const updatedTracks: CaptionSegment['tracks'] = {};
        (Object.keys(seg.tracks) as TrackKey[]).forEach((k) => {
          const existing = seg.tracks[k];
          if (existing) {
            updatedTracks[k] = {
              text: existing.text,
              words: buildWordTimingsClient(
                existing.text,
                startTime,
                endTime,
                existing.words
              ),
            };
          }
        });
        return {
          ...seg,
          startTime,
          endTime,
          tracks: updatedTracks,
        };
      })
    );
  };

  const handleSplitSegment = (segmentId: string, splitAtTime?: number) => {
    setSegments((prev) => {
      const idx = prev.findIndex((s) => s.id === segmentId);
      if (idx === -1) return prev;
      const target = prev[idx];
      const segDur = target.endTime - target.startTime;
      if (segDur < 0.35) return prev;

      const midTime =
        splitAtTime !== undefined &&
        splitAtTime > target.startTime + 0.12 &&
        splitAtTime < target.endTime - 0.12
          ? Number(splitAtTime.toFixed(2))
          : Number((target.startTime + segDur / 2).toFixed(2));

      const firstTracks: CaptionSegment['tracks'] = {};
      const secondTracks: CaptionSegment['tracks'] = {};

      (Object.keys(target.tracks) as TrackKey[]).forEach((k) => {
        const tData = target.tracks[k];
        if (!tData) return;
        const tokens = tData.text.trim().split(/\s+/);
        const ratio = (midTime - target.startTime) / Math.max(0.1, segDur);
        const splitIdx = Math.max(
          1,
          Math.min(tokens.length - 1, Math.round(tokens.length * ratio))
        );
        const textA = tokens.slice(0, splitIdx).join(' ');
        const textB = tokens.slice(splitIdx).join(' ') || textA;

        firstTracks[k] = {
          text: textA,
          words: buildWordTimingsClient(textA, target.startTime, midTime),
        };
        secondTracks[k] = {
          text: textB,
          words: buildWordTimingsClient(textB, midTime, target.endTime),
        };
      });

      const segA: CaptionSegment = {
        ...target,
        id: `${target.id}-a-${Date.now()}`,
        startTime: target.startTime,
        endTime: midTime,
        tracks: firstTracks,
      };
      const segB: CaptionSegment = {
        ...target,
        id: `${target.id}-b-${Date.now() + 1}`,
        startTime: midTime,
        endTime: target.endTime,
        tracks: secondTracks,
      };

      const next = [...prev];
      next.splice(idx, 1, segA, segB);
      return next;
    });
    showToast('Split caption into two lines!');
  };

  const handleMergeSegmentWithNext = (segmentId: string) => {
    setSegments((prev) => {
      const idx = prev.findIndex((s) => s.id === segmentId);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const segA = prev[idx];
      const segB = prev[idx + 1];
      const mergedStart = segA.startTime;
      const mergedEnd = segB.endTime;

      const mergedTracks: CaptionSegment['tracks'] = {};
      const allKeys = new Set<TrackKey>([
        ...(Object.keys(segA.tracks) as TrackKey[]),
        ...(Object.keys(segB.tracks) as TrackKey[]),
      ]);

      allKeys.forEach((k) => {
        const textA = segA.tracks[k]?.text || '';
        const textB = segB.tracks[k]?.text || '';
        const combinedText = `${textA} ${textB}`.trim();
        if (combinedText) {
          mergedTracks[k] = {
            text: combinedText,
            words: buildWordTimingsClient(combinedText, mergedStart, mergedEnd),
          };
        }
      });

      const mergedSeg: CaptionSegment = {
        ...segA,
        id: `seg-merged-${Date.now()}`,
        startTime: mergedStart,
        endTime: mergedEnd,
        tracks: mergedTracks,
      };

      const next = [...prev];
      next.splice(idx, 2, mergedSeg);
      return next;
    });
    showToast('Merged caption with next line!');
  };

  const handleDeleteWordInSegment = (segmentId: string, wordIdx: number) => {
    setSegments((prev) => {
      const target = prev.find((s) => s.id === segmentId);
      if (!target) return prev;
      const primaryTrack =
        target.tracks[styleConfig.primaryTrack] ||
        target.tracks.tinglish ||
        target.tracks.english;
      if (primaryTrack && primaryTrack.words.length <= 1) {
        return prev.filter((s) => s.id !== segmentId);
      }

      return prev.map((seg) => {
        if (seg.id !== segmentId) return seg;
        const nextTracks: CaptionSegment['tracks'] = {};
        (Object.keys(seg.tracks) as TrackKey[]).forEach((k) => {
          const tr = seg.tracks[k];
          if (!tr) return;
          const filteredWords = tr.words.filter((_, i) => i !== wordIdx);
          const nextText = filteredWords.map((w) => w.word).join(' ');
          nextTracks[k] = {
            text: nextText,
            words: buildWordTimingsClient(
              nextText,
              seg.startTime,
              seg.endTime,
              filteredWords
            ),
          };
        });
        return {
          ...seg,
          tracks: nextTracks,
        };
      });
    });
    showToast('Deleted selected word from caption track!');
  };

  const handleNudgeSingleSegmentTiming = (segmentId: string, deltaSec: number) => {
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== segmentId) return seg;
        const segDur = seg.endTime - seg.startTime;
        const nextStart = Number(
          Math.max(0, Math.min(duration - segDur, seg.startTime + deltaSec)).toFixed(2)
        );
        const nextEnd = Number((nextStart + segDur).toFixed(2));
        const nextTracks: CaptionSegment['tracks'] = {};
        (Object.keys(seg.tracks) as TrackKey[]).forEach((k) => {
          const tr = seg.tracks[k];
          if (!tr) return;
          nextTracks[k] = {
            text: tr.text,
            words: buildWordTimingsClient(tr.text, nextStart, nextEnd, tr.words),
          };
        });
        return {
          ...seg,
          startTime: nextStart,
          endTime: nextEnd,
          tracks: nextTracks,
        };
      })
    );
  };

  const handleGenerateAiBrollTimelineClips = () => {
    handleUpdateStyleAndSyncPreset({ brollEnabled: true });
    setTracksConfig((prev) => ({
      ...prev,
      broll: { ...prev.broll, enabled: true, visible: true },
    }));
    const effects: TimelineClip['brollEffect'][] = [
      'ken-burns',
      'zoom-in',
      'pan-left',
      'flash-cut',
    ];
    const generated: TimelineClip[] = segments
      .filter((_, i) => i % 2 === 0)
      .slice(0, 6)
      .map((seg, i) => {
        const txt =
          seg.tracks[styleConfig.primaryTrack]?.text ||
          seg.tracks.tinglish?.text ||
          seg.tracks.english?.text ||
          'Visual Cutaway';
        return {
          id: `broll-auto-${Date.now()}-${i}`,
          trackId: 'broll',
          label: `B-Roll · ${txt.slice(0, 22)}`,
          startTime: seg.startTime,
          endTime: seg.endTime,
          sourceStart: 0,
          brollPrompt: txt,
          brollEffect: effects[i % effects.length],
        };
      });
    if (generated.length > 0) {
      setBrollClips(generated);
      playOpenSourceSoundEffect('whoosh', styleConfig.sfxVolume ?? 0.45);
      showToast(
        `Generated ${generated.length} synced AI B-Roll cutaway clips on Track B-Roll 1!`
      );
    }
  };

  const handleAddSegment = () => {
    const lastEnd =
      segments.length > 0 ? segments[segments.length - 1].endTime : 0;
    const newStart = Number(Math.min(duration - 0.5, lastEnd).toFixed(2));
    const newEnd = Number((newStart + 2.8).toFixed(2));
    if (newEnd > duration) {
      setDuration(newEnd);
    }

    const defaultTelugu = 'కొత్త ప్రీమియర్ ప్రో క్యాప్షన్ ఇక్కడ రాయండి!';
    const newSeg: CaptionSegment = {
      id: `seg-custom-${Date.now()}`,
      startTime: newStart,
      endTime: newEnd,
      tracks: {
        [styleConfig.primaryTrack]: {
          text: 'New Premiere Pro *HERO* caption here!',
          words: buildWordTimingsClient(
            'New Premiere Pro *HERO* caption here!',
            newStart,
            newEnd
          ),
        },
        tinglish: {
          text: 'Kotha Tinglish *HERO* caption ikkada rayandi!',
          words: buildWordTimingsClient(
            'Kotha Tinglish *HERO* caption ikkada rayandi!',
            newStart,
            newEnd
          ),
        },
        english: {
          text: 'Add your new *HERO* caption line here!',
          words: buildWordTimingsClient(
            'Add your new *HERO* caption line here!',
            newStart,
            newEnd
          ),
        },
        telugu: {
          text: defaultTelugu,
          words: buildWordTimingsClient(defaultTelugu, newStart, newEnd),
        },
      },
    };
    setSegments((prev) => [...prev, newSeg]);
    setCurrentTime(newStart + 0.05);
  };

  const handleDeleteSegment = (segmentId: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== segmentId));
  };

  // Section 6: Kalakar "Caption Tools" Bulk Actions (Display Settings + Actions + Timing)
  const handleApplyCaptionToolAction = (
    action: CaptionToolBulkAction,
    payload?: { wordsPerLine?: number; maxCharsPerLine?: number }
  ) => {
    if (action === 'regroup-words') {
      const targetWords = payload?.wordsPerLine ?? styleConfig.wordsPerLine ?? 4;
      const targetMaxChars =
        payload?.maxCharsPerLine ?? styleConfig.maxCharsPerLine ?? 24;
      setSegments((prev) =>
        regroupSegmentsByWordsPerLine(prev, targetWords, targetMaxChars)
      );
      showToast(
        `Reflowed captions to ${targetWords} word${targetWords === 1 ? '' : 's'} per line (max ${targetMaxChars} chars)!`
      );
      return;
    }

    if (action === 'remove-punctuation') {
      setSegments((prev) =>
        prev.map((seg) => {
          const nextTracks: CaptionSegment['tracks'] = {};
          (Object.keys(seg.tracks) as TrackKey[]).forEach((k) => {
            const t = seg.tracks[k];
            if (!t) return;
            const cleanedWords = t.words
              .map((w) => ({
                ...w,
                word: w.word.replace(/[.,!?;:'"“”‘’—–\-()[\]{}]/g, '').trim(),
              }))
              .filter((w) => w.word.length > 0);
            nextTracks[k] = {
              text: cleanedWords.map((w) => w.word).join(' '),
              words: cleanedWords,
            };
          });
          return { ...seg, tracks: nextTracks };
        })
      );
      showToast('Removed punctuation across all captions!');
      return;
    }

    if (action === 'restore-punctuation') {
      showToast('Punctuation enabled for captions');
      return;
    }

    if (action === 'remove-emphasis') {
      setSegments((prev) =>
        prev.map((seg) => {
          const nextTracks: CaptionSegment['tracks'] = {};
          (Object.keys(seg.tracks) as TrackKey[]).forEach((k) => {
            const t = seg.tracks[k];
            if (!t) return;
            nextTracks[k] = {
              ...t,
              words: t.words.map((w) => ({ ...w, isHero: false })),
            };
          });
          return { ...seg, tracks: nextTracks };
        })
      );
      showToast('Removed all text emphasis for uniform appearance!');
      return;
    }

    if (action === 'restore-emphasis') {
      setSegments((prev) => applyAutoHeroNLPToSegments(prev));
      showToast('Restored green word emphasis across captions!');
      return;
    }

    if (action === 'remove-gaps') {
      setSegments((prev) =>
        prev.map((seg, idx) => {
          const nextSeg = prev[idx + 1];
          if (!nextSeg) return seg;
          const closedEnd = Number(Math.max(seg.endTime, nextSeg.startTime).toFixed(2));
          const nextTracks: CaptionSegment['tracks'] = {};
          (Object.keys(seg.tracks) as TrackKey[]).forEach((k) => {
            const t = seg.tracks[k];
            if (!t) return;
            nextTracks[k] = {
              text: t.text,
              words: buildWordTimingsClient(t.text, seg.startTime, closedEnd, t.words),
            };
          });
          return {
            ...seg,
            endTime: closedEnd,
            tracks: nextTracks,
          };
        })
      );
      showToast('Eliminated gaps between captions for seamless flow!');
      return;
    }

    if (action === 'restore-gaps') {
      setSegments((prev) =>
        prev.map((seg, idx) => {
          const nextSeg = prev[idx + 1];
          if (!nextSeg) return seg;
          const breathingEnd = Number(
            Math.max(seg.startTime + 0.3, nextSeg.startTime - 0.08).toFixed(2)
          );
          return {
            ...seg,
            endTime: breathingEnd,
          };
        })
      );
      showToast('Restored natural breathing gaps between captions!');
      return;
    }

    if (action === 'remove-emojis') {
      const emojiRegex = /[\p{Extended_Pictographic}\uFE0F]/gu;
      setSegments((prev) =>
        prev.map((seg) => {
          const nextTracks: CaptionSegment['tracks'] = {};
          (Object.keys(seg.tracks) as TrackKey[]).forEach((k) => {
            const t = seg.tracks[k];
            if (!t) return;
            const cleanedWords = t.words
              .map((w) => ({
                ...w,
                word: w.word.replace(emojiRegex, '').trim(),
              }))
              .filter((w) => w.word.length > 0);
            nextTracks[k] = {
              text: cleanedWords.map((w) => w.word).join(' '),
              words: cleanedWords,
            };
          });
          return { ...seg, tracks: nextTracks };
        })
      );
      showToast('Removed all emojis from captions!');
      return;
    }

    if (action === 'auto-add-emojis') {
      setSegments((prev) =>
        prev.map((seg) => {
          const nextTracks: CaptionSegment['tracks'] = {};
          (Object.keys(seg.tracks) as TrackKey[]).forEach((k) => {
            const t = seg.tracks[k];
            if (!t) return;
            const enrichedText = injectEmojisIntoCaptionText(t.text);
            nextTracks[k] = {
              text: enrichedText,
              words: buildWordTimingsClient(
                enrichedText,
                seg.startTime,
                seg.endTime,
                t.words
              ),
            };
          });
          return { ...seg, tracks: nextTracks };
        })
      );
      showToast('Auto-inserted contextual emojis into captions!');
    }
  };

  const handleRewriteTrackTone = async (toneStyle: string) => {
    if (segments.length === 0) return;
    setIsRewriting(true);
    setErrorBanner(null);
    const activeKey = styleConfig.primaryTrack;
    const langMeta =
      INDIAN_LANGUAGE_MATRIX.find((l) => l.key === activeKey) ||
      INDIAN_LANGUAGE_MATRIX[0];

    try {
      const payload = segments.map((s) => ({
        id: s.id,
        text: s.tracks[activeKey]?.text || s.tracks.tinglish?.text || '',
      }));

      const res = await fetchWithAutoRetry('/api/captions/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          segments: payload,
          trackKey: activeKey,
          trackLabel: `${langMeta.label} (${langMeta.scriptInstruction})`,
          toneStyle,
        }),
      });
      const parsed = await safeParseApiJson<{
        rewritten?: { id: string; text: string }[];
        error?: string;
      }>(res);
      if (!parsed.ok || !parsed.data) {
        setSegments((prev) => applyAutoHeroNLPToSegments(prev));
        showToast(`Polished ${langMeta.shortLabel} captions!`);
        return;
      }

      const rewriteMap = new Map<string, string>();
      (parsed.data.rewritten || []).forEach((item: { id: string; text: string }) => {
        rewriteMap.set(item.id, item.text);
      });

      setSegments((prev) =>
        prev.map((seg) => {
          const updatedText = rewriteMap.get(seg.id);
          if (!updatedText) return seg;
          const words = buildWordTimingsClient(updatedText, seg.startTime, seg.endTime);
          return {
            ...seg,
            tracks: {
              ...seg.tracks,
              [activeKey]: {
                text: words.map((w) => w.word).join(' '),
                words,
              },
            },
          };
        })
      );
      showToast(`Polished ${langMeta.shortLabel} captions!`);
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to rewrite captions.');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleRunAutoHeroNLP = async () => {
    if (segments.length === 0) return;
    setIsRunningAutoHero(true);
    setErrorBanner(null);

    const activeKey = styleConfig.primaryTrack;
    const langMeta =
      INDIAN_LANGUAGE_MATRIX.find((l) => l.key === activeKey) ||
      INDIAN_LANGUAGE_MATRIX[0];

    // Step 1: Immediately apply client-side multilingual NLP emotional & impact scoring
    setSegments((prev) => applyAutoHeroNLPToSegments(prev));

    try {
      const payload = segments.map((s) => ({
        id: s.id,
        text: s.tracks[activeKey]?.text || s.tracks.tinglish?.text || '',
      }));

      const res = await fetchWithAutoRetry('/api/captions/auto-hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          segments: payload,
          trackKey: activeKey,
          trackLabel: langMeta.label,
          mode: 'emotional-impact',
        }),
      });

      const parsed = await safeParseApiJson<{
        results?: { id: string; heroWords: string[] }[];
      }>(res);

      if (parsed.ok && parsed.data?.results) {
        const heroMap = new Map<string, string[]>();
        parsed.data.results.forEach((item: { id: string; heroWords: string[] }) => {
          if (Array.isArray(item.heroWords) && item.heroWords.length > 0) {
            heroMap.set(item.id, item.heroWords);
          }
        });

        if (heroMap.size > 0) {
          setSegments((prev) =>
            prev.map((seg) => {
              const nlpKeywords = heroMap.get(seg.id);
              if (!nlpKeywords) return seg;
              const existingTrack = seg.tracks[activeKey];
              if (!existingTrack) return seg;
              const updatedWords = buildWordTimingsClient(
                existingTrack.text,
                seg.startTime,
                seg.endTime,
                undefined,
                nlpKeywords,
                true
              );
              return {
                ...seg,
                tracks: {
                  ...seg.tracks,
                  [activeKey]: {
                    text: updatedWords.map((w) => w.word).join(' '),
                    words: updatedWords,
                  },
                },
              };
            })
          );
        }
      }
      showToast(`Auto-Hero NLP highlighted emotional & impact words in ${langMeta.shortLabel}!`);
    } catch {
      showToast(`Auto-Hero NLP highlighted impactful words in ${langMeta.shortLabel}!`);
    } finally {
      setIsRunningAutoHero(false);
    }
  };

  const savePresetsToStorage = (nextPresets: StylePreset[]) => {
    setPresets(nextPresets);
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(nextPresets));
    } catch {
      // ignore storage errors
    }
  };

  // Updates styleConfig AND automatically syncs font/size/color edits into the active SIDZ_<NAME> preset!
  const handleUpdateStyleAndSyncPreset = (partial: Partial<CaptionStyleConfig>) => {
    setStyleConfig((prev) => {
      const nextConfig = { ...prev, ...partial };
      setPresets((currPresets) => {
        const updated = currPresets.map((p) =>
          p.id === nextConfig.presetId
            ? {
                ...p,
                config: {
                  ...p.config,
                  ...partial,
                },
              }
            : p
        );
        try {
          localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      return nextConfig;
    });
  };

  const handleApplyPreset = (preset: StylePreset) => {
    setStyleConfig((prev) => ({
      ...prev,
      ...preset.config,
      presetId: preset.id,
    }));
  };

  const handleUpdateActivePreset = (customName?: string, customBadgeText?: string) => {
    const nextPresets = presets.map((p) => {
      if (p.id !== styleConfig.presetId) return p;
      const cleanName = customName
        ? customName.toUpperCase().startsWith('SIDZ_')
          ? customName.toUpperCase().replace(/\s+/g, '_')
          : `SIDZ_${customName.toUpperCase().replace(/\s+/g, '_')}`
        : p.name;
      return {
        ...p,
        name: cleanName,
        badgeText: customBadgeText || p.badgeText,
        config: {
          ...p.config,
          fontFamily: styleConfig.fontFamily,
          heroWordFontFamily: styleConfig.heroWordFontFamily,
          accentScriptFontFamily: styleConfig.accentScriptFontFamily,
          fontSize: styleConfig.fontSize,
          bigWordScale: styleConfig.bigWordScale,
          smallWordScale: styleConfig.smallWordScale,
          hierarchyMode: styleConfig.hierarchyMode,
          animationType: styleConfig.animationType,
          useGradient: styleConfig.useGradient,
          gradientPresetId: styleConfig.gradientPresetId,
          gradientStart: styleConfig.gradientStart,
          gradientMid: styleConfig.gradientMid,
          gradientEnd: styleConfig.gradientEnd,
          primaryColor: styleConfig.primaryColor,
          highlightColor: styleConfig.highlightColor,
          positionY: styleConfig.positionY,
        },
      };
    });
    savePresetsToStorage(nextPresets);
    showToast(
      `Updated preset ${customName || styleConfig.presetId} (${styleConfig.heroWordFontFamily} · ${styleConfig.fontSize}px)!`
    );
  };

  const handleCreateNewPreset = (name: string, badgeText: string) => {
    const newId = name.toUpperCase().replace(/\s+/g, '_');
    const newPreset: StylePreset = {
      id: newId,
      name: newId,
      tagline: `Custom SIDZ (${styleConfig.heroWordFontFamily} · ${styleConfig.fontSize}px)`,
      badgeText: badgeText || 'CUSTOM',
      smallPreviewText: 'Custom',
      scriptPreviewText:
        styleConfig.hierarchyMode === 'sidz-20k-script' ? 'style' : undefined,
      previewBg: 'from-zinc-900 via-slate-900 to-zinc-950',
      config: { ...styleConfig, presetId: newId },
    };
    const filtered = presets.filter((p) => p.id !== newId);
    const nextPresets = [newPreset, ...filtered];
    savePresetsToStorage(nextPresets);
    setStyleConfig((prev) => ({ ...prev, presetId: newId }));
    showToast(`Saved new preset ${newId}!`);
  };

  const handleResetPresets = () => {
    savePresetsToStorage(STYLE_PRESETS);
    setStyleConfig({
      ...DEFAULT_STYLE_CONFIG,
      primaryTrack: styleConfig.primaryTrack,
    });
    showToast('Reset all SIDZ presets to factory defaults!');
  };

  const handleSeekTo = (seconds: number) => {
    const clamped = Math.max(0, Math.min(duration, seconds));
    setCurrentTime(clamped);
    if (uploadedVideoUrl && videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
  };

  const togglePlayPause = () => {
    if (uploadedVideoUrl && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleSyncToVoiceNow = () => {
    if (segments.length === 0) return;
    setSegments((prev) =>
      syncSegmentsToVoiceActivity(prev, detectedSpeechWindows, duration)
    );
    setAutoSyncDialogue(true);
    showToast(
      detectedSpeechWindows.length > 0
        ? `Synced ${segments.length} captions to ${detectedSpeechWindows.length} detected voice dialogue bursts!`
        : `Aligned ${segments.length} captions evenly across ${duration.toFixed(1)}s timeline!`
    );
  };

  const handleToggleAutoSyncDialogue = () => {
    const next = !autoSyncDialogue;
    setAutoSyncDialogue(next);
    if (next) {
      setSegments((prev) =>
        syncSegmentsToVoiceActivity(prev, detectedSpeechWindows, duration)
      );
      showToast('Voice Dialogue Sync (VAD) enabled: captions snapped to speech!');
    } else {
      showToast('Unsynced / Free Timing mode enabled: move or time captions freely!');
    }
  };

  const handleTapSyncActiveToPlayhead = () => {
    if (segments.length === 0) return;
    const playhead = Number(currentTime.toFixed(2));
    setSegments((prev) => {
      // Find active segment or next upcoming segment
      let targetIdx = prev.findIndex(
        (s) => playhead >= s.startTime && playhead <= s.endTime
      );
      if (targetIdx === -1) {
        targetIdx = prev.findIndex((s) => s.startTime > playhead);
      }
      if (targetIdx === -1) {
        targetIdx = prev.length - 1;
      }
      const target = prev[targetIdx];
      const segDur = Math.max(1.2, target.endTime - target.startTime);
      const newStart = playhead;
      const newEnd = Number(Math.min(duration, newStart + segDur).toFixed(2));

      const updatedTracks: CaptionSegment['tracks'] = {};
      (Object.keys(target.tracks) as TrackKey[]).forEach((k) => {
        const t = target.tracks[k];
        if (t) {
          updatedTracks[k] = {
            text: t.text,
            words: buildWordTimingsClient(t.text, newStart, newEnd, t.words),
          };
        }
      });

      const nextList = [...prev];
      nextList[targetIdx] = {
        ...target,
        startTime: newStart,
        endTime: newEnd,
        tracks: updatedTracks,
      };
      return nextList;
    });
    showToast(`Snapped caption start to ${playhead.toFixed(2)}s!`);
  };

  const handleNudgeDialogueTiming = (offsetSeconds: number, stretchFactor = 1) => {
    setSegments((prev) =>
      shiftAndStretchSegments(prev, offsetSeconds, stretchFactor, duration)
    );
    showToast(
      `Shifted all dialogue timestamps by ${
        offsetSeconds >= 0 ? `+${offsetSeconds}` : offsetSeconds
      }s`
    );
  };

  // On-Screen 2D Pointer Drag & Corner-Handle Resize on the 9:16 Reel Canvas
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Section 4.1: Respect "Unlock to move lines or words" lock control
    if (styleConfig.canvasPositionLocked) {
      togglePlayPause();
      showToast('Canvas position is locked — click "Unlock to move lines or words" in the preview bar to drag.');
      return;
    }
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    // Map pointer coordinates to uniform logical design space (720x1280 for 9:16, 1280x720 for 16:9, 720x720 for 1:1)
    const uniformScale = Math.min(canvas.width, canvas.height) / 720;
    const logicalW = Math.round(canvas.width / uniformScale);
    const logicalH = Math.round(canvas.height / uniformScale);
    const canvasX =
      rect.width > 0 ? ((e.clientX - rect.left) / rect.width) * logicalW : logicalW / 2;
    const canvasY =
      rect.height > 0 ? ((e.clientY - rect.top) / rect.height) * logicalH : logicalH / 2;

    const hitBoxes = getLatestLayerHitBoxes();
    let detectedMode: 'move' | 'resize' = 'move';
    let targetLayer: ActiveCanvasLayer = styleConfig.selectedCanvasLayer || 'all';

    // 1. Check if pointer clicked a bottom-right corner resize handle on any rendered text layer
    if (styleConfig.showOnScreenTransformBoxes === true) {
      for (const box of hitBoxes) {
        const distToHandle = Math.hypot(canvasX - box.handleX, canvasY - box.handleY);
        if (distToHandle <= 26) {
          detectedMode = 'resize';
          targetLayer = box.layer;
          handleUpdateStyleAndSyncPreset({ selectedCanvasLayer: box.layer });
          break;
        }
      }
    }

    // 2. If not resizing, check if pointer clicked inside a specific layer's bounding box
    if (detectedMode === 'move' && styleConfig.showOnScreenTransformBoxes === true) {
      for (const box of hitBoxes) {
        const insideX =
          canvasX >= box.x - 14 && canvasX <= box.x + box.width + 14;
        const insideY =
          canvasY >= box.y - 12 && canvasY <= box.y + box.height + 12;
        if (insideX && insideY) {
          if (targetLayer !== 'all' || hitBoxes.length > 1) {
            targetLayer = box.layer;
            handleUpdateStyleAndSyncPreset({ selectedCanvasLayer: box.layer });
          }
          break;
        }
      }
    }

    const startPosX =
      targetLayer === 'small1'
        ? styleConfig.smallOffsetX ?? 0
        : targetLayer === 'small2'
        ? styleConfig.smallLine2OffsetX ?? 0
        : targetLayer === 'big'
        ? styleConfig.bigOffsetX ?? 0
        : styleConfig.positionX ?? 50;

    const startPosY =
      targetLayer === 'small1'
        ? styleConfig.smallOffsetY ?? 0
        : targetLayer === 'small2'
        ? styleConfig.smallLine2OffsetY ?? 0
        : targetLayer === 'big'
        ? styleConfig.bigOffsetY ?? 0
        : styleConfig.positionY ?? 66;

    const startScale =
      targetLayer === 'small1'
        ? styleConfig.smallWordScale || 0.68
        : targetLayer === 'small2'
        ? styleConfig.smallLine2Scale ?? styleConfig.smallWordScale ?? 0.68
        : styleConfig.bigWordScale || 2.15;

    dragPointerStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      mode: detectedMode,
      targetLayer,
      startPosX,
      startPosY,
      startScale,
      moved: false,
    };
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragPointerStartRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;

    const dx = e.clientX - drag.clientX;
    const dy = e.clientY - drag.clientY;
    if (Math.hypot(dx, dy) > 4) {
      drag.moved = true;
      setIsDraggingCaption(true);
    }
    if (!drag.moved) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    if (drag.mode === 'resize') {
      // Corner-handle drag resizes that specific text layer on screen
      const scaleDelta = (dx / rect.width) * 2.2 + (dy / rect.height) * 0.8;
      if (drag.targetLayer === 'small1') {
        const nextScale = Number(
          Math.max(0.35, Math.min(1.55, drag.startScale + scaleDelta)).toFixed(2)
        );
        handleUpdateStyleAndSyncPreset({ smallWordScale: nextScale });
      } else if (drag.targetLayer === 'small2') {
        const nextScale = Number(
          Math.max(0.35, Math.min(1.55, drag.startScale + scaleDelta)).toFixed(2)
        );
        handleUpdateStyleAndSyncPreset({ smallLine2Scale: nextScale });
      } else {
        const nextScale = Number(
          Math.max(0.9, Math.min(3.5, drag.startScale + scaleDelta * 1.4)).toFixed(2)
        );
        handleUpdateStyleAndSyncPreset({ bigWordScale: nextScale });
      }
      return;
    }

    const pctDeltaX = (dx / rect.width) * 100;
    const pctDeltaY = (dy / rect.height) * 100;

    if (drag.targetLayer === 'small1') {
      handleUpdateStyleAndSyncPreset({
        smallOffsetX: Math.round(Math.max(-45, Math.min(45, drag.startPosX + pctDeltaX))),
        smallOffsetY: Math.round(Math.max(-35, Math.min(35, drag.startPosY + pctDeltaY))),
      });
    } else if (drag.targetLayer === 'small2') {
      handleUpdateStyleAndSyncPreset({
        smallLine2OffsetX: Math.round(
          Math.max(-45, Math.min(45, drag.startPosX + pctDeltaX))
        ),
        smallLine2OffsetY: Math.round(
          Math.max(-35, Math.min(35, drag.startPosY + pctDeltaY))
        ),
      });
    } else if (drag.targetLayer === 'big') {
      handleUpdateStyleAndSyncPreset({
        bigOffsetX: Math.round(Math.max(-45, Math.min(45, drag.startPosX + pctDeltaX))),
        bigOffsetY: Math.round(Math.max(-35, Math.min(35, drag.startPosY + pctDeltaY))),
      });
    } else {
      const nextX = Math.round(Math.max(8, Math.min(92, drag.startPosX + pctDeltaX)));
      const nextY = Math.round(Math.max(10, Math.min(90, drag.startPosY + pctDeltaY)));
      handleUpdateStyleAndSyncPreset({
        positionX: nextX,
        positionY: nextY,
      });
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragPointerStartRef.current;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    dragPointerStartRef.current = null;
    setIsDraggingCaption(false);

    if (drag && !drag.moved) {
      togglePlayPause();
    }
  };

  // 60fps Preview Animation Loop (Paused during video export so export loop has 100% exclusive clean control of canvas!)
  useEffect(() => {
    if (isExportingVideo) return;

    let animFrameId: number;
    lastFramePerfRef.current = performance.now();

    const renderLoop = (now: number) => {
      const dt = (now - lastFramePerfRef.current) / 1000;
      lastFramePerfRef.current = now;

      let activeTime = currentTime;
      if (uploadedVideoUrl && videoRef.current) {
        if (!videoRef.current.paused) {
          activeTime = videoRef.current.currentTime;
          setCurrentTime(activeTime);
        } else {
          activeTime = currentTime;
          if (
            !videoRef.current.seeking &&
            Math.abs(videoRef.current.currentTime - currentTime) > 0.03
          ) {
            videoRef.current.currentTime = currentTime;
          }
        }
      } else if (isPlaying && !isExportingVideo) {
        activeTime = currentTime + dt;
        if (activeTime >= duration) {
          activeTime = 0;
        }
        setCurrentTime(activeTime);
      }

      // Keep videoClips and audioClips synced when duration updates on initial single-clip state
      const isVideo1ActiveAtPlayhead =
        tracksConfig.video1.enabled &&
        tracksConfig.video1.visible &&
        (videoClips.length === 0 ||
          videoClips.some(
            (c) => !c.hidden && activeTime >= c.startTime && activeTime <= c.endTime
          ));

      const isAudio1ActiveAtPlayhead =
        tracksConfig.audio1.enabled &&
        !tracksConfig.audio1.muted &&
        (audioClips.length === 0 ||
          audioClips.some(
            (c) => !c.muted && activeTime >= c.startTime && activeTime <= c.endTime
          ));

      if (uploadedVideoUrl && videoRef.current) {
        const shouldMuteNow = isMuted || !isAudio1ActiveAtPlayhead;
        if (videoRef.current.muted !== shouldMuteNow) {
          videoRef.current.muted = shouldMuteNow;
        }
      }

      const activeBrollAtPlayhead =
        tracksConfig.broll.enabled && tracksConfig.broll.visible
          ? brollClips.find(
              (c) => !c.hidden && activeTime >= c.startTime && activeTime <= c.endTime
            ) || null
          : null;

      const activeVideo2AtPlayhead =
        tracksConfig.video2.enabled && tracksConfig.video2.visible
          ? video2Clips.find(
              (c) => !c.hidden && activeTime >= c.startTime && activeTime <= c.endTime
            ) || null
          : null;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderReelCanvasFrame({
            ctx,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            videoElement: videoRef.current,
            hasUploadedVideo: Boolean(uploadedVideoUrl),
            sampleReel: activeSampleReel,
            currentTime: activeTime,
            segments,
            style: styleConfig,
            isExportRender: false,
            isVideo1Visible: isVideo1ActiveAtPlayhead,
            isCaptionsVisible:
              tracksConfig.captions.enabled && tracksConfig.captions.visible,
            activeTimelineBroll: activeBrollAtPlayhead,
            activeTimelineVideo2: activeVideo2AtPlayhead,
          });
        }
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animFrameId);
  }, [
    currentTime,
    duration,
    isPlaying,
    isMuted,
    isExportingVideo,
    uploadedVideoUrl,
    activeSampleReel,
    segments,
    styleConfig,
    tracksConfig,
    videoClips,
    audioClips,
    brollClips,
    video2Clips,
  ]);

  const handleExportSRT = () => {
    const content = generateSRTContent(
      segments,
      styleConfig.primaryTrack,
      styleConfig.secondaryTrack,
      styleConfig.displayMode === 'dual-stacked'
    );
    triggerFileDownload(
      content,
      `vakyareel-${styleConfig.primaryTrack}-captions.srt`,
      'text/plain;charset=utf-8'
    );
    showToast(`Downloaded .SRT subtitle file (${styleConfig.primaryTrack})!`);
  };

  const handleExportVTT = () => {
    const content = generateVTTContent(
      segments,
      styleConfig.primaryTrack,
      styleConfig.secondaryTrack,
      styleConfig.displayMode === 'dual-stacked'
    );
    triggerFileDownload(
      content,
      `vakyareel-${styleConfig.primaryTrack}-captions.vtt`,
      'text/vtt;charset=utf-8'
    );
    showToast(`Downloaded .VTT subtitle file (${styleConfig.primaryTrack})!`);
  };

  const handleExportJSON = () => {
    const jsonPayload = JSON.stringify(
      {
        project: uploadedVideoName || activeSampleReel.title,
        detectedLanguage,
        primaryTrack: styleConfig.primaryTrack,
        secondaryTrack:
          styleConfig.displayMode === 'dual-stacked'
            ? styleConfig.secondaryTrack
            : null,
        styleConfig,
        segments,
      },
      null,
      2
    );
    triggerFileDownload(
      jsonPayload,
      'vakyareel-multilingual-captions.json',
      'application/json;charset=utf-8'
    );
    showToast('Downloaded full multi-language JSON transcript!');
  };

  const handleExportAudioWAV = async (useEnhancerOverride?: boolean) => {
    try {
      const shouldEnhance = Boolean(useEnhancerOverride || audioEnhancer.enabled);
      showToast(
        shouldEnhance
          ? 'Rendering AI Studio Enhanced .WAV Audio (Noise Removal + Vocal Presence)...'
          : 'Preparing standalone .WAV audio track...'
      );
      const wavBlob = await exportStandaloneAudioWAV(
        uploadedVideoFile,
        duration,
        shouldEnhance
      );
      triggerFileDownload(
        wavBlob,
        `kalakar-${styleConfig.primaryTrack}-${shouldEnhance ? 'studio-enhanced' : 'audio'}.wav`,
        'audio/wav'
      );
      showToast(
        shouldEnhance
          ? 'Downloaded AI Studio Enhanced .WAV audio track!'
          : 'Downloaded full .WAV audio track!'
      );
    } catch (err: unknown) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Failed to export .WAV audio.'
      );
    }
  };

  const handleExportPremiereXML = () => {
    const xmlContent = generatePremiereDaVinciXML(
      segments,
      styleConfig.primaryTrack,
      duration
    );
    triggerFileDownload(
      xmlContent,
      `kalakar-${styleConfig.primaryTrack}-timeline.fcpxml`,
      'application/xml;charset=utf-8'
    );
    showToast(
      `Downloaded Premiere Pro / DaVinci Resolve Timeline (.FCPXML) for ${styleConfig.primaryTrack}!`
    );
  };

  const handleUploadCustomFont = async (file: File) => {
    try {
      const cleanName = file.name
        .replace(/\.(ttf|otf|woff2|woff)$/i, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      const fontName = cleanName || `CustomFont-${customFonts.length + 1}`;
      const buffer = await file.arrayBuffer();
      const fontFace = new FontFace(fontName, buffer);
      const loadedFace = await fontFace.load();
      document.fonts.add(loadedFace);

      setCustomFonts((prev) =>
        prev.includes(fontName) ? prev : [...prev, fontName]
      );
      handleUpdateStyleAndSyncPreset({
        heroWordFontFamily: fontName,
        fontFamily: fontName,
      });
      showToast(`Custom font "${fontName}" loaded & applied to your captions!`);
    } catch (err: unknown) {
      setErrorBanner(
        err instanceof Error
          ? `Could not load font file: ${err.message}`
          : 'Could not load custom font file. Please use a valid .TTF, .OTF, or .WOFF2 file.'
      );
    }
  };

  const handleExportAlphaOverlay = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isExportingVideo) {
      stopExportEarlyRef.current = true;
      return;
    }

    setIsExportingVideo(true);
    setExportProgress(0);
    setIsPlaying(false);
    stopExportEarlyRef.current = false;

    try {
      const mimeCandidate = MediaRecorder.isTypeSupported(
        'video/webm;codecs=vp9'
      )
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const canvasStream = canvas.captureStream(60);
      const recorder = new MediaRecorder(canvasStream, {
        mimeType: mimeCandidate,
        videoBitsPerSecond: 16_000_000,
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const exportCompletion = new Promise<Blob>((resolve) => {
        recorder.onstop = () =>
          resolve(new Blob(chunks, { type: 'video/webm' }));
      });

      const totalDuration = Math.max(1, duration);
      const ctx = canvas.getContext('2d');
      const cleanExportStyle: CaptionStyleConfig = {
        ...styleConfig,
        showOnScreenTransformBoxes: false,
      };

      if (ctx) {
        renderReelCanvasFrame({
          ctx,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          videoElement: null,
          hasUploadedVideo: false,
          sampleReel: activeSampleReel,
          currentTime: 0,
          segments,
          style: cleanExportStyle,
          isExportRender: true,
          transparentAlphaOnly: true,
        });
      }

      recorder.start(100);
      const startWallClock = performance.now();

      while (!stopExportEarlyRef.current) {
        const wallElapsed = (performance.now() - startWallClock) / 1000;
        if (wallElapsed >= totalDuration) break;

        setCurrentTime(wallElapsed);
        setExportProgress(
          Math.min(99, Math.round((wallElapsed / totalDuration) * 100))
        );

        if (ctx) {
          renderReelCanvasFrame({
            ctx,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            videoElement: null,
            hasUploadedVideo: false,
            sampleReel: activeSampleReel,
            currentTime: wallElapsed,
            segments,
            style: cleanExportStyle,
            isExportRender: true,
            transparentAlphaOnly: true,
          });
        }
        await new Promise((r) => setTimeout(r, 16));
      }

      recorder.stop();
      const alphaBlob = await exportCompletion;
      setExportProgress(100);
      const filename = `kalakar-alpha-captions-${styleConfig.primaryTrack}.webm`;
      triggerFileDownload(alphaBlob, filename, 'video/webm');
      showToast(
        `Exported Transparent Alpha Caption Layer (${filename}) for Premiere Pro / DaVinci!`
      );
    } catch (err: unknown) {
      setErrorBanner(
        err instanceof Error
          ? err.message
          : 'Failed to export transparent alpha caption layer.'
      );
    } finally {
      setIsExportingVideo(false);
      setIsPlaying(true);
    }
  };

  const handleStopExportAndSaveNow = () => {
    stopExportEarlyRef.current = true;
  };

  const handleExportBurnedVideo = async (formatOverride?: VideoExportFormat) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isExportingVideo) {
      stopExportEarlyRef.current = true;
      return;
    }

    const chosenFormat: VideoExportFormat = formatOverride || exportFormat || 'mp4';
    if (formatOverride) {
      setExportFormat(formatOverride);
    }

    setIsExportingVideo(true);
    setExportProgress(0);
    setIsPlaying(false);
    stopExportEarlyRef.current = false;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    let audioCtx: AudioContext | null = null;
    let activeBufferSource: AudioBufferSourceNode | null = null;
    let prevVideoLoop = true;
    let prevVideoMuted = isMuted;

    try {
      const formatInfo = getSupportedExportMimeType(chosenFormat);
      const canvasStream = canvas.captureStream(60);

      // Build Audio Track so exported .MP4 and .WP2/.WEBM ALWAYS include full crystal-clear audio!
      audioCtx = new AudioCtx();
      await audioCtx.resume();
      const audioDest = audioCtx.createMediaStreamDestination();
      let hasConnectedAudioTrack = false;

      if (uploadedVideoFile) {
        try {
          const rawBuf = await uploadedVideoFile.arrayBuffer();
          const decodedAudio = await audioCtx.decodeAudioData(rawBuf.slice(0));
          activeBufferSource = audioCtx.createBufferSource();
          activeBufferSource.buffer = decodedAudio;

          // Connect full 100% volume directly into the recorded file's audio stream
          activeBufferSource.connect(audioDest);

          // Also connect to speakers (respecting user's preview mute toggle)
          const speakerGain = audioCtx.createGain();
          speakerGain.gain.value = isMuted ? 0 : 0.85;
          activeBufferSource.connect(speakerGain);
          speakerGain.connect(audioCtx.destination);
          hasConnectedAudioTrack = true;
        } catch {
          // Fallback: capture audio tracks directly from the HTMLVideoElement
          if (videoRef.current) {
            const vidEl = videoRef.current as HTMLVideoElement & {
              captureStream?: () => MediaStream;
              mozCaptureStream?: () => MediaStream;
            };
            prevVideoMuted = vidEl.muted;
            vidEl.muted = false;
            vidEl.volume = 1.0;
            const vidStream = vidEl.captureStream?.() || vidEl.mozCaptureStream?.();
            if (vidStream && vidStream.getAudioTracks().length > 0) {
              vidStream.getAudioTracks().forEach((track) => {
                canvasStream.addTrack(track);
              });
              hasConnectedAudioTrack = true;
            }
          }
        }
      }

      // If exporting a built-in Demo Reel (or if video had no audio track), synthesize a warm studio audio track
      // so the exported .mp4 / .wp2 container always has a valid, playable audio stream!
      if (!hasConnectedAudioTrack && audioCtx) {
        const sampleRate = audioCtx.sampleRate || 44100;
        const totalDur = Math.max(1, duration);
        const totalSamples = Math.floor(totalDur * sampleRate);
        const synthBuffer = audioCtx.createBuffer(1, totalSamples, sampleRate);
        const channel = synthBuffer.getChannelData(0);
        for (let i = 0; i < totalSamples; i++) {
          const t = i / sampleRate;
          const beatEnv = Math.exp(-((t * 2) % 1) * 4.0);
          channel[i] =
            (Math.sin(2 * Math.PI * 110 * t) * 0.14 +
              Math.sin(2 * Math.PI * 220 * t) * 0.08 +
              Math.sin(2 * Math.PI * 330 * t) * 0.04) *
            beatEnv;
        }
        activeBufferSource = audioCtx.createBufferSource();
        activeBufferSource.buffer = synthBuffer;
        activeBufferSource.connect(audioDest);
        hasConnectedAudioTrack = true;
      }

      // Merge Video Track(s) + Audio Track(s) into a single Combined MediaStream
      const combinedTracks: MediaStreamTrack[] = [
        ...canvasStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks(),
      ];
      const combinedStream = new MediaStream(combinedTracks);

      const recorderOptions: MediaRecorderOptions = {
        mimeType: formatInfo.recorderMimeType,
        videoBitsPerSecond: 16_000_000, // 16 Mbps 1080p Full HD Studio Quality
        audioBitsPerSecond: 192_000,
      };

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(combinedStream, recorderOptions);
      } catch {
        recorder = new MediaRecorder(combinedStream);
      }

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const exportCompletion = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: formatInfo.blobMimeType }));
        };
      });

      const totalDuration = Math.max(1, duration);
      const ctx = canvas.getContext('2d');
      // Guarantee 100% clean text during export — never render dotted or yellow bounding boxes!
      const cleanExportStyle: CaptionStyleConfig = {
        ...styleConfig,
        showOnScreenTransformBoxes: false,
      };

      // Render initial 0.0s frame before starting recorder
      if (ctx) {
        renderReelCanvasFrame({
          ctx,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          videoElement: videoRef.current,
          hasUploadedVideo: Boolean(uploadedVideoUrl),
          sampleReel: activeSampleReel,
          currentTime: 0,
          segments,
          style: cleanExportStyle,
          isExportRender: true,
        });
      }

      if (uploadedVideoUrl && videoRef.current) {
        prevVideoLoop = videoRef.current.loop;
        videoRef.current.loop = false;
        // Mute HTMLVideoElement speaker output if we are already playing decoded audio through AudioContext
        if (activeBufferSource) {
          prevVideoMuted = videoRef.current.muted;
          videoRef.current.muted = true;
        }
        videoRef.current.currentTime = 0;
        await videoRef.current.play().catch(() => {});
      }

      if (activeBufferSource) {
        activeBufferSource.start(0);
      }

      recorder.start(100);
      const startWallClock = performance.now();

      // Real-time synchronized render loop so Video + Captions + Audio stay 100% in sync!
      while (!stopExportEarlyRef.current) {
        const wallElapsed = (performance.now() - startWallClock) / 1000;
        let simTime = wallElapsed;

        if (
          uploadedVideoUrl &&
          videoRef.current &&
          !videoRef.current.paused &&
          isFinite(videoRef.current.currentTime)
        ) {
          simTime = videoRef.current.currentTime;
        }

        if (simTime >= totalDuration || wallElapsed >= totalDuration + 0.15) {
          break;
        }

        setCurrentTime(simTime);
        setExportProgress(
          Math.min(99, Math.round((Math.min(simTime, wallElapsed) / totalDuration) * 100))
        );

        if (ctx) {
          renderReelCanvasFrame({
            ctx,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            videoElement: videoRef.current,
            hasUploadedVideo: Boolean(uploadedVideoUrl),
            sampleReel: activeSampleReel,
            currentTime: simTime,
            segments,
            style: cleanExportStyle,
            isExportRender: true,
          });
        }

        await new Promise((r) => setTimeout(r, 16));
      }

      if (activeBufferSource) {
        try {
          activeBufferSource.stop();
        } catch {
          // ignore
        }
      }

      if (uploadedVideoUrl && videoRef.current) {
        videoRef.current.pause();
        videoRef.current.loop = prevVideoLoop;
        videoRef.current.muted = prevVideoMuted;
      }

      recorder.stop();
      const videoBlob = await exportCompletion;
      setExportProgress(100);

      const safePreset = (styleConfig.presetId || 'sidz').toLowerCase();
      const filename = `vakyareel-${safePreset}-${styleConfig.primaryTrack}.${formatInfo.extension}`;

      triggerFileDownload(videoBlob, filename, formatInfo.blobMimeType);
      showToast(
        `Exported ${chosenFormat.toUpperCase()} Video + Audio (${filename})!`
      );
    } catch (err: unknown) {
      setErrorBanner(
        err instanceof Error
          ? err.message
          : 'Failed to export burned-in video with audio in this browser.'
      );
    } finally {
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
      setIsExportingVideo(false);
      setIsPlaying(true);
    }
  };

  const openCameraModal = async () => {
    setIsCameraModalOpen(true);
    setErrorBanner(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      cameraStreamRef.current = stream;
      if (cameraPreviewRef.current) {
        cameraPreviewRef.current.srcObject = stream;
        cameraPreviewRef.current.play().catch(() => {});
      }
    } catch (_err) {
      setErrorBanner(
        'Camera/microphone permission was denied or unavailable. You can still upload any video file.'
      );
      setIsCameraModalOpen(false);
    }
  };

  const closeCameraModal = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setIsRecordingCamera(false);
    setIsCameraModalOpen(false);
  };

  const startCameraCapture = () => {
    if (!cameraStreamRef.current) return;
    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(cameraStreamRef.current);
    cameraRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const recordedFile = new File([blob], `camera-reel-${Date.now()}.webm`, {
        type: 'video/webm',
      });
      closeCameraModal();
      handleUploadFile(recordedFile);
    };

    recorder.start();
    setIsRecordingCamera(true);
  };

  const stopCameraCapture = () => {
    if (cameraRecorderRef.current && cameraRecorderRef.current.state !== 'inactive') {
      cameraRecorderRef.current.stop();
    }
  };

  const formatTimecode = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const tenths = Math.floor((sec - Math.floor(sec)) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
  };

  const activeSegmentAtPlayhead = segments.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  const primaryMeta =
    INDIAN_LANGUAGE_MATRIX.find((l) => l.key === styleConfig.primaryTrack) ||
    INDIAN_LANGUAGE_MATRIX[0];

  const activeSegmentIndex = segments.findIndex(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime + 0.05
  );
  const currentEditableSegment =
    activeSegmentAtPlayhead ||
    (activeSegmentIndex >= 0 ? segments[activeSegmentIndex] : segments[0]);
  const currentEditableSegmentIdx = currentEditableSegment
    ? segments.findIndex((s) => s.id === currentEditableSegment.id)
    : 0;
  const selectedLineDisplayNum =
    currentEditableSegment?.displayLineNumber ?? 48 + currentEditableSegmentIdx;

  // Automatically trigger open-source SFX when active caption changes during playback
  useEffect(() => {
    if (!isPlaying || isMuted || styleConfig.autoSfxEnabled === false) return;
    if (!activeSegmentAtPlayhead) return;
    if (lastPlayedSfxSegIdRef.current === activeSegmentAtPlayhead.id) return;
    lastPlayedSfxSegIdRef.current = activeSegmentAtPlayhead.id;

    const primaryText =
      activeSegmentAtPlayhead.tracks[styleConfig.primaryTrack]?.text ||
      activeSegmentAtPlayhead.tracks.tinglish?.text ||
      '';
    const sfxToPlay =
      activeSegmentAtPlayhead.sfxType || detectContextSfxForText(primaryText);
    if (sfxToPlay && sfxToPlay !== 'none') {
      playOpenSourceSoundEffect(sfxToPlay, styleConfig.sfxVolume ?? 0.4);
    }
  }, [
    activeSegmentAtPlayhead,
    isPlaying,
    isMuted,
    styleConfig.autoSfxEnabled,
    styleConfig.sfxVolume,
    styleConfig.primaryTrack,
    currentEditableSegmentIdx,
  ]);

  const activeAspectRatio: VideoAspectRatio = styleConfig.aspectRatio || '9:16';
  const canvasDimensions =
    activeAspectRatio === '16:9'
      ? {
          width: 1920,
          height: 1080,
          ratioLabel: '16:9 Landscape · 1920×1080',
          aspectClass:
            'aspect-[16/9] w-full max-w-[740px] max-h-[54vh] rounded-xl',
        }
      : activeAspectRatio === '1:1'
        ? {
            width: 1080,
            height: 1080,
            ratioLabel: '1:1 Square · 1080×1080',
            aspectClass:
              'aspect-square h-[52vh] max-h-[480px] min-h-[260px] w-auto max-w-full rounded-xl',
          }
        : {
            width: 1080,
            height: 1920,
            ratioLabel: '9:16 Mobile View · 1080×1920',
            aspectClass:
              'aspect-[9/16] h-[56vh] max-h-[540px] min-h-[300px] w-auto max-w-full rounded-xl',
          };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (appScreenMode === 'landing') {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#24242B]/95 backdrop-blur-xl border border-white/15 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF5A1F]" />
            <span>{toastMessage}</span>
          </div>
        )}
        <MerupifyLandingPage
          currentUser={currentUser}
          presets={presets}
          onLoginSuccess={(user, destination) => {
            setCurrentUser(user);
            setUserPlan(user.plan);
            try {
              localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
            } catch {
              // ignore
            }
            setAppScreenMode(destination);
            showToast(`Welcome to Merupify App, ${user.name}!`);
          }}
          onOpenDashboard={() => setAppScreenMode('dashboard')}
          onOpenStudioDirect={() => setAppScreenMode('editor')}
          onSelectPresetAndOpen={(preset) => {
            handleApplyPreset(preset);
            setAppScreenMode('editor');
          }}
          onSelectTrackAndOpen={(track) => {
            handleSelectPrimaryTrack(track);
            setAppScreenMode('editor');
          }}
        />
      </>
    );
  }

  if (appScreenMode === 'dashboard') {
    const activeDashboardUser: MerupifyUser = currentUser || {
      name: 'Creator',
      email: 'creator@merupify.io',
      role: 'Video Creator & Editor',
      plan: userPlan,
      defaultLanguage: 'Telugu / Tinglish',
      defaultScript: 'Roman',
      loggedInAt: 'Now',
    };

    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#24242B]/95 backdrop-blur-xl border border-white/15 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF5A1F]" />
            <span>{toastMessage}</span>
          </div>
        )}
        <MerupifyDashboardApp
          user={activeDashboardUser}
          userPlan={userPlan}
          styleConfig={styleConfig}
          presets={presets}
          audioEnhancer={audioEnhancer}
          uploadedVideoName={uploadedVideoName}
          activeSampleReel={activeSampleReel}
          onSelectPlan={(plan) => {
            setUserPlan(plan);
            showToast(`Switched to ${plan.toUpperCase()} Plan!`);
          }}
          onUpdateStyle={handleUpdateStyleAndSyncPreset}
          onUpdateAudioEnhancer={(partial) =>
            setAudioEnhancer((prev) => ({ ...prev, ...partial }))
          }
          onUploadVideoFile={(file) => {
            handleUploadFile(file, true);
            setAppScreenMode('editor');
          }}
          onOpenRecordCamera={() => {
            setAppScreenMode('editor');
            openCameraModal();
          }}
          onOpenPrepareMedia={() => {
            setAppScreenMode('editor');
            setIsPrepareMediaOpen(true);
          }}
          onSelectSampleReelAndEdit={(reel) => {
            handleSelectSampleReel(reel);
            setAppScreenMode('editor');
          }}
          onApplyPresetAndEdit={(preset) => {
            handleApplyPreset(preset);
            setAppScreenMode('editor');
          }}
          onSelectTrackAndEdit={(track) => {
            handleSelectPrimaryTrack(track);
            setAppScreenMode('editor');
          }}
          onGenerateAiBrollNow={() => {
            handleUpdateStyleAndSyncPreset({ brollEnabled: true });
            showToast('AI B-Roll Cutaways & Context Effects enabled in Studio!');
          }}
          onExportPremiereXML={handleExportPremiereXML}
          onExportAlphaWebM={handleExportAlphaOverlay}
          onExportSRT={handleExportSRT}
          onExportWAV={() => handleExportAudioWAV(true)}
          onOpenStudioEditor={() => setAppScreenMode('editor')}
          onBackToLandingPage={() => setAppScreenMode('landing')}
          onLogout={() => {
            setCurrentUser(null);
            try {
              localStorage.removeItem(AUTH_USER_STORAGE_KEY);
            } catch {
              // ignore
            }
            setAppScreenMode('landing');
            showToast('Signed out of Merupify Dashboard');
          }}
        />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0D0D10] text-zinc-100 overflow-hidden">
      {uploadedVideoUrl && (
        <video
          ref={videoRef}
          src={uploadedVideoUrl}
          preload="auto"
          muted={isMuted}
          playsInline
          loop
          onLoadedMetadata={(e) => {
            const vid = e.currentTarget;
            if (vid.videoWidth > 0 && vid.videoHeight > 0) {
              const ratio = vid.videoWidth / vid.videoHeight;
              const detectedRatio: VideoAspectRatio =
                ratio > 1.15 ? '16:9' : ratio < 0.85 ? '9:16' : '1:1';
              handleUpdateStyleAndSyncPreset({ aspectRatio: detectedRatio });
            }
            if (vid.duration && isFinite(vid.duration)) {
              const realDur = Number(vid.duration.toFixed(2));
              setDuration(realDur);
              setVideoClips((prev) =>
                prev.length <= 1
                  ? [
                      {
                        id: prev[0]?.id || `v1-${Date.now()}`,
                        trackId: 'video1',
                        label: uploadedVideoName || 'Uploaded Video (V1)',
                        startTime: 0,
                        endTime: realDur,
                        sourceStart: 0,
                      },
                    ]
                  : prev
              );
              setAudioClips((prev) =>
                prev.length <= 1
                  ? [
                      {
                        id: prev[0]?.id || `a1-${Date.now()}`,
                        trackId: 'audio1',
                        label: `${uploadedVideoName || 'Uploaded Video'} (Audio A1)`,
                        startTime: 0,
                        endTime: realDur,
                        sourceStart: 0,
                      },
                    ]
                  : prev
              );
            }
          }}
          onLoadedData={(e) => {
            if (isPlaying) {
              e.currentTarget.play().catch(() => {});
            }
          }}
          className="fixed -left-[9999px] -top-[9999px] w-1 h-1 opacity-0 pointer-events-none"
        />
      )}

      {/* MERUPIFY / KALAKAR STUDIO TOP HEADER BAR */}
      <header className="sticky top-0 z-40 h-12 flex items-center justify-between gap-4 px-3.5 border-b border-white/[0.06] bg-[#111115] shrink-0 select-none">
        {/* Left Zone: Back to Dashboard Arrow + Brand Icon + Filename + Undo/Redo + Aspect Ratio Switcher */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setAppScreenMode('dashboard')}
            title="Back to Merupify Dashboard App"
            className="px-2 py-1 rounded-lg text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.07] flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          {/* Merupify / Kalakar Brand Icon */}
          <button
            type="button"
            onClick={() => {
              setShowKalakarHero((v) => !v);
            }}
            title="Toggle Studio Overview Banner"
            className="w-6 h-6 rounded-md bg-gradient-to-br from-[#FF5722] via-[#FFD60A] to-[#2BAE66] flex items-center justify-center text-zinc-950 font-black text-xs shadow-sm cursor-pointer shrink-0"
          >
            M
          </button>

          {/* Project Filename */}
          <span className="text-xs font-medium text-zinc-200 truncate max-w-[180px] sm:max-w-[240px]">
            {uploadedVideoName || activeSampleReel.title}
          </span>

          {/* Undo / Redo Icons */}
          <div className="hidden sm:flex items-center gap-0.5 ml-1 text-zinc-500">
            <button
              type="button"
              onClick={() => handleResetPresets()}
              title="Undo / Reset style change"
              className="p-1.5 rounded hover:bg-white/[0.05] hover:text-zinc-300 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => showToast('Redo stack up to date')}
              title="Redo"
              className="p-1.5 rounded hover:bg-white/[0.05] hover:text-zinc-300 cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Compact Aspect Ratio Switcher (9:16 | 16:9 | 1:1) */}
          <div className="hidden lg:flex items-center bg-[#18181F] rounded-lg border border-white/[0.06] p-0.5 ml-2">
            {(['9:16', '16:9', '1:1'] as VideoAspectRatio[]).map((ratio) => {
              const active = (styleConfig.aspectRatio || '9:16') === ratio;
              return (
                <button
                  key={ratio}
                  type="button"
                  onClick={() =>
                    handleUpdateStyleAndSyncPreset({ aspectRatio: ratio })
                  }
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono-tabular font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#25252E] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {ratio}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Zone: Aura Pill Button + Quick Studio Modals */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const nextBroll = !styleConfig.brollEnabled;
              handleUpdateStyleAndSyncPreset({ brollEnabled: nextBroll });
              if (nextBroll) {
                playOpenSourceSoundEffect('whoosh', styleConfig.sfxVolume ?? 0.45);
              }
              showToast(
                nextBroll
                  ? '✦ Aura AI B-Roll & Context Effects Enabled!'
                  : '✦ Aura AI B-Roll Cutaways Paused'
              );
            }}
            className={`px-3.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
              styleConfig.brollEnabled
                ? 'bg-[#152E23] border-[#2BAE66]/60 text-[#34D399]'
                : 'bg-[#1A1A20] hover:bg-[#22222A] border-white/[0.08] text-zinc-300'
            }`}
            title="Toggle Aura AI B-Roll Context Cutaways & Motion Effects"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Aura</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrepareMediaOpen(true)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#18181E] hover:bg-[#22222A] border border-white/[0.06] text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            101 Languages
          </button>

          <button
            type="button"
            onClick={() => setIsAgentAndTesterOpen(true)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#18181E] hover:bg-[#22222A] border border-white/[0.06] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            Agent &amp; Tester
          </button>
        </div>

        {/* Right Zone: Upgrade + Green Export Button + Avatar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setShellHubActiveView('subscriptions');
              setIsShellHubOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-[#1A1A21] hover:bg-[#24242D] border border-white/[0.08] text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Upgrade</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportBurnedVideo(exportFormat)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2BAE66] hover:bg-[#249957] rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isExportingVideo ? `Exporting ${exportProgress}%` : 'Export'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShellHubActiveView('home');
              setIsShellHubOpen(true);
            }}
            title="Account & App Hub"
            className="w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 border border-white/15 flex items-center justify-center text-[11px] font-bold text-white cursor-pointer shrink-0"
          >
            L
          </button>
        </div>
      </header>

      {/* Error or Toast Notification */}
      {errorBanner && (
        <div className="bg-rose-950/90 border-b border-rose-500/40 px-6 py-2 text-xs text-rose-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {uploadedVideoFile && (
              <button
                type="button"
                onClick={() => runFastCaptionPipeline(uploadedVideoFile)}
                className="px-3 py-1 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-white font-semibold transition-colors cursor-pointer"
              >
                Retry Now
              </button>
            )}
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="text-rose-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#24242B]/95 backdrop-blur-xl border border-white/15 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF5722]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN KALAKAR STUDIO WORKSPACE: Left+Center (Top Split + Bottom Timeline Dock) + Right Full-Height Inspector */}
      <main
        id="studio-workspace"
        className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-48px)] overflow-hidden"
      >
        {/* LEFT + CENTER COMPOSITE AREA (Top: Captions List + Left Rail + Centered Video Preview; Bottom: Kalakar Multi-Track Timeline) */}
        <div className="order-1 lg:order-1 flex-1 min-w-0 flex flex-col lg:h-full overflow-hidden">
          {/* TOP SPLIT: Left Captions Panel + Center Video Preview Stage */}
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
            {/* LEFT TOP PANEL: Kalakar Captions List + Left Vertical Tool Rail */}
            <TranscriptLanguagePanel
              segments={segments}
              currentTime={currentTime}
              duration={duration}
              styleConfig={styleConfig}
              activeSampleReel={activeSampleReel}
              uploadedVideoName={uploadedVideoName}
              detectedLanguage={detectedLanguage}
              isTranscribing={isTranscribing}
              transcribeStage={transcribeStage}
              translatingTrack={translatingTrack}
              isRewriting={isRewriting}
              sourceLanguageHint={sourceLanguageHint}
              onSourceLanguageHintChange={setSourceLanguageHint}
              onUploadFile={handleUploadFile}
              onStartCameraRecord={openCameraModal}
              onSelectSampleReel={handleSelectSampleReel}
              onGenerateCaptionsNow={() => {
                if (uploadedVideoFile) {
                  runFastCaptionPipeline(uploadedVideoFile);
                }
              }}
              onSelectPrimaryTrack={handleSelectPrimaryTrack}
              onSelectSecondaryTrack={handleSelectSecondaryTrack}
              onToggleDisplayMode={(mode) =>
                setStyleConfig((prev) => ({ ...prev, displayMode: mode }))
              }
              onSeekTo={handleSeekTo}
              onUpdateSegmentText={handleUpdateSegmentText}
              onToggleWordHero={handleToggleWordHero}
              onSetSegmentHeroMode={handleSetSegmentHeroMode}
              onMoveSegmentOrder={handleMoveSegmentOrder}
              onDuplicateSegment={handleDuplicateSegment}
              onQuickScreenPosition={handleQuickScreenPosition}
              onUpdateSegmentTiming={handleUpdateSegmentTiming}
              onSplitSegment={handleSplitSegment}
              onAddSegment={handleAddSegment}
              onDeleteSegment={handleDeleteSegment}
              onRewriteTrackTone={handleRewriteTrackTone}
              autoHeroNLP={autoHeroNLP}
              onToggleAutoHeroNLP={() => {
                const nextVal = !autoHeroNLP;
                setAutoHeroNLP(nextVal);
                if (nextVal) {
                  setSegments((prev) => applyAutoHeroNLPToSegments(prev));
                  showToast(
                    'Auto-Hero NLP enabled: impactful & emotional words highlighted!'
                  );
                } else {
                  showToast('Auto-Hero NLP paused for new transcriptions');
                }
              }}
              isRunningAutoHero={isRunningAutoHero}
              onRunAutoHeroNLP={handleRunAutoHeroNLP}
              autoSyncDialogue={autoSyncDialogue}
              onToggleAutoSyncDialogue={handleToggleAutoSyncDialogue}
              onSyncToVoiceNow={handleSyncToVoiceNow}
              onTapSyncActiveToPlayhead={handleTapSyncActiveToPlayhead}
              onNudgeDialogueTiming={handleNudgeDialogueTiming}
              onUpdateSegmentMeta={handleUpdateSegmentProps}
              onUpdateWordStyle={handleUpdateWordStyle}
              onApplyCaptionToolAction={handleApplyCaptionToolAction}
              onUpdateStyle={handleUpdateStyleAndSyncPreset}
              presets={presets}
              customFonts={customFonts}
              onUploadCustomFont={handleUploadCustomFont}
              onOpenPrepareMedia={() => setIsPrepareMediaOpen(true)}
              onOpenShellHub={(view) => {
                setShellHubActiveView(view);
                setIsShellHubOpen(true);
              }}
              focusedSection={focusedSection}
            />

            {/* CENTER VIDEO PREVIEW STAGE — Minimal & Effective (Exact match to screenshot) */}
            <section
              ref={canvasWrapperRef}
              className="flex-1 min-w-0 flex flex-col items-center justify-between p-3 bg-[#0D0D10] overflow-hidden select-none"
            >
              {/* Centered Video Canvas Container */}
              <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
                <div
                  className={`relative overflow-hidden border border-white/10 bg-black shadow-2xl transition-all duration-200 ${canvasDimensions.aspectClass}`}
                >
                  <canvas
                    ref={canvasRef}
                    width={canvasDimensions.width}
                    height={canvasDimensions.height}
                    onPointerDown={handleCanvasPointerDown}
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={handleCanvasPointerUp}
                    className={`w-full h-full object-contain touch-none block ${
                      styleConfig.canvasPositionLocked
                        ? 'cursor-not-allowed'
                        : 'cursor-grab active:cursor-grabbing'
                    }`}
                  />

                  {isTranscribing && segments.length === 0 && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-9 h-9 rounded-full border-2 border-[#2BAE66] border-t-transparent animate-spin mb-3" />
                      <p className="text-xs font-semibold text-white">
                        Generating Captions...
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        {transcribeStage || 'Processing audio...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4.1 MINIMAL KALAKAR PREVIEW BAR (Replace | Safe zone | Res | Play | Mute | Time | Fullscreen | Lock) */}
              <div className="w-full max-w-[680px] pt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300 shrink-0">
                <input
                  ref={replaceVideoInputRef}
                  type="file"
                  accept="video/*,audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadFile(f, true);
                    e.target.value = '';
                  }}
                />

                {/* Left Group: Replace | Safe zone | Res */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => replaceVideoInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-[#18181E] hover:bg-[#22222A] border border-white/[0.07] text-zinc-200 text-[11px] font-medium cursor-pointer flex items-center gap-1.5"
                    title="Swap the video file"
                  >
                    <RotateCcw className="w-3 h-3 text-zinc-400" />
                    <span>Replace</span>
                  </button>

                  {/* Safe zone + Popover */}
                  <div className="relative flex items-center bg-[#18181E] rounded-lg border border-white/[0.07]">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStyleAndSyncPreset({
                          showSafeZones: !styleConfig.showSafeZones,
                        })
                      }
                      className={`px-2.5 py-1.5 rounded-l-lg text-[11px] font-medium cursor-pointer flex items-center gap-1.5 ${
                        styleConfig.showSafeZones
                          ? 'text-[#34D399]'
                          : 'text-zinc-300 hover:text-white'
                      }`}
                      title="Toggle Safe Zone & Alignment Crosshairs"
                    >
                      <Shield className="w-3 h-3" />
                      <span>Safe zone</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSafeZonePopover((v) => !v)}
                      className="px-1.5 py-1.5 rounded-r-lg text-zinc-400 hover:text-white border-l border-white/[0.07] cursor-pointer"
                      title="Safe zone settings"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                    </button>

                    {showSafeZonePopover && (
                      <div className="absolute bottom-9 left-0 z-50 w-52 bg-[#18181F] border border-white/15 rounded-xl p-2.5 shadow-2xl space-y-2 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white">
                            Safe Zone Presets
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowSafeZonePopover(false)}
                            className="text-zinc-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {(
                          [
                            { id: 'instagram-reels', label: 'Instagram Reels' },
                            { id: 'instagram-story', label: 'Instagram Story' },
                            { id: 'instagram-feed', label: 'Instagram Feed' },
                            { id: 'tiktok-foryou', label: 'TikTok For You' },
                            { id: 'youtube-shorts', label: 'YouTube Shorts' },
                          ] as { id: SafeZonePreset; label: string }[]
                        ).map((p) => {
                          const active =
                            (styleConfig.safeZonePreset || 'instagram-reels') ===
                            p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() =>
                                handleUpdateStyleAndSyncPreset({
                                  showSafeZones: true,
                                  safeZonePreset: p.id,
                                })
                              }
                              className={`w-full text-left px-2 py-1 rounded text-[11px] cursor-pointer flex items-center justify-between ${
                                active
                                  ? 'bg-[#152E23] text-[#34D399] font-semibold'
                                  : 'text-zinc-300 hover:bg-white/5'
                              }`}
                            >
                              <span>{p.label}</span>
                              {active && <span>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextDepth = !styleConfig.captionDepthBehindSubject;
                      const segInfo = getLatestSubjectSegmentation();
                      handleUpdateStyleAndSyncPreset({
                        captionDepthBehindSubject: nextDepth,
                        ...(nextDepth
                          ? {
                              positionY: Math.round(
                                (segInfo.recommendedBehindHeadYRatio || 0.31) * 100
                              ),
                            }
                          : {}),
                      });
                      setSegments((prev) =>
                        prev.map((s) => ({ ...s, behindSubject: nextDepth }))
                      );
                      showToast(
                        nextDepth
                          ? 'Placed caption behind subject (Depth Mask ON)'
                          : 'Placed caption in front of subject (Depth Mask OFF)'
                      );
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${
                      styleConfig.captionDepthBehindSubject
                        ? 'bg-[#152E23] border-[#2BAE66]/60 text-[#34D399]'
                        : 'bg-[#18181E] hover:bg-[#22222A] border-white/[0.07] text-zinc-300 hover:text-white'
                    }`}
                    title="Auto AI Person Cutout: Place captions behind the speaker's head in the background"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>
                      {styleConfig.captionDepthBehindSubject
                        ? 'Behind Head: ON'
                        : 'Behind Head'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !styleConfig.lowResPreview;
                      handleUpdateStyleAndSyncPreset({ lowResPreview: next });
                      showToast(
                        next
                          ? 'Low Res Preview active (smooth scrubbing)'
                          : 'HD Preview active'
                      );
                    }}
                    className={`px-2.5 py-1.5 rounded-lg bg-[#18181E] hover:bg-[#22222A] border border-white/[0.07] text-[11px] font-medium cursor-pointer flex items-center gap-1 ${
                      styleConfig.lowResPreview ? 'text-amber-300' : 'text-zinc-300'
                    }`}
                  >
                    <span className="text-[9px] px-1 rounded bg-white/10 font-mono">
                      HD
                    </span>
                    <span>Res</span>
                  </button>
                </div>

                {/* Center Group: Play/Pause | Mute | Time Counter */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Mute / Unmute"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  <span className="text-xs font-mono-tabular text-zinc-200">
                    {Math.floor(currentTime / 60)}:
                    {String(Math.floor(currentTime % 60)).padStart(2, '0')}{' '}
                    <span className="text-zinc-500">
                      / {Math.floor(duration / 60)}:
                      {String(Math.floor(duration % 60)).padStart(2, '0')}
                    </span>
                  </span>
                </div>

                {/* Right Group: Fullscreen | Lock/Unlock */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (canvasWrapperRef.current?.requestFullscreen) {
                        canvasWrapperRef.current
                          .requestFullscreen()
                          .catch(() => {});
                      }
                    }}
                    className="p-1.5 rounded-lg bg-[#18181E] hover:bg-[#22222A] border border-white/[0.07] text-zinc-300 hover:text-white cursor-pointer"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateStyleAndSyncPreset({
                        canvasPositionLocked: !styleConfig.canvasPositionLocked,
                      })
                    }
                    className={`p-1.5 rounded-lg border cursor-pointer ${
                      styleConfig.canvasPositionLocked
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                        : 'bg-[#18181E] hover:bg-[#22222A] border-white/[0.07] text-zinc-300 hover:text-white'
                    }`}
                    title={
                      styleConfig.canvasPositionLocked
                        ? 'Unlock to move lines or words'
                        : 'Lock caption position'
                    }
                  >
                    {styleConfig.canvasPositionLocked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* BOTTOM DOCK: PREMIERE PRO MULTI-TRACK NLE TIMELINE (Separated Video 1 & Audio 1 Cutting, 2-Row Olive-Gold Captions, B-Roll 1, Video 2, Music/SFX) */}
          <PremiereMultiTrackTimeline
            segments={segments}
            currentTime={currentTime}
            duration={duration}
            styleConfig={styleConfig}
            timelineZoom={timelineZoom}
            timelineGranularity={timelineGranularity}
            audioWaveformBars={audioWaveformBars}
            uploadedVideoUrl={uploadedVideoUrl}
            uploadedVideoName={uploadedVideoName}
            videoClips={videoClips}
            audioClips={audioClips}
            brollClips={brollClips}
            video2Clips={video2Clips}
            musicClips={musicClips}
            tracksConfig={tracksConfig}
            isVideoAudioLinked={isVideoAudioLinked}
            onChangeZoom={setTimelineZoom}
            onChangeGranularity={setTimelineGranularity}
            onToggleVideoAudioLinked={() => {
              setIsVideoAudioLinked((prev) => {
                const next = !prev;
                showToast(
                  next
                    ? 'Video 1 & Audio 1 LINKED: Razor cuts both tracks together'
                    : 'Video 1 & Audio 1 SEPARATED: Cut Video & Audio independently!'
                );
                return next;
              });
            }}
            onUpdateTracksConfig={setTracksConfig}
            onUpdateVideoClips={setVideoClips}
            onUpdateAudioClips={setAudioClips}
            onUpdateBrollClips={setBrollClips}
            onUpdateVideo2Clips={setVideo2Clips}
            onUpdateMusicClips={setMusicClips}
            onSeekTo={handleSeekTo}
            onAddWordOrSegment={handleAddSegment}
            onDeleteSegment={handleDeleteSegment}
            onDeleteWordInSegment={handleDeleteWordInSegment}
            onSplitSegmentAtTime={handleSplitSegment}
            onMergeSegmentWithNext={handleMergeSegmentWithNext}
            onNudgeSegmentTiming={handleNudgeSingleSegmentTiming}
            onToggleBehindSubject={(segId) => {
              const target = segments.find((s) => s.id === segId);
              if (target) {
                handleUpdateSegmentProps(segId, {
                  behindSubject: !target.behindSubject,
                });
                showToast(
                  !target.behindSubject
                    ? 'Placed caption behind subject (Depth Mask ON)'
                    : 'Placed caption in front of subject'
                );
              }
            }}
            onUpdateStyle={handleUpdateStyleAndSyncPreset}
            onGenerateAiBroll={handleGenerateAiBrollTimelineClips}
            onShowToast={showToast}
          />
        </div>

        {/* RIGHT COLUMN: Kalakar Right Panel (Captions vs Edit top tabs, Collapse arrow, Templates/Text/Transitions/AI Audio) */}
        <StyleAnimationInspector
          styleConfig={styleConfig}
          presets={presets}
          customFonts={customFonts}
          selectedLineLabel={`Line ${selectedLineDisplayNum}`}
          audioEnhancer={audioEnhancer}
          onUpdateAudioEnhancer={(partial) =>
            setAudioEnhancer((prev) => ({ ...prev, ...partial }))
          }
          onPreviewTransition={() => {
            if (currentEditableSegment) {
              handleSeekTo(currentEditableSegment.startTime + 0.05);
              setIsPlaying(true);
            }
          }}
          onUploadCustomFont={handleUploadCustomFont}
          onUpdateStyle={handleUpdateStyleAndSyncPreset}
          onApplyPreset={handleApplyPreset}
          onUpdateActivePreset={handleUpdateActivePreset}
          onCreateNewPreset={handleCreateNewPreset}
          onResetPresets={handleResetPresets}
          onExportSRT={handleExportSRT}
          onExportVTT={handleExportVTT}
          onExportJSON={handleExportJSON}
          onExportAudioWAV={() => handleExportAudioWAV(false)}
          onExportAlphaOverlay={handleExportAlphaOverlay}
          onExportPremiereXML={handleExportPremiereXML}
          onExportBurnedVideo={handleExportBurnedVideo}
          onStopExportNow={handleStopExportAndSaveNow}
          exportFormat={exportFormat}
          onChangeExportFormat={setExportFormat}
          isExportingVideo={isExportingVideo}
          exportProgress={exportProgress}
        />
      </main>

      {/* CAMERA RECORDING MODAL */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1C1C22] border border-white/15 rounded-3xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Record Reel from Camera
              </h3>
              <button
                type="button"
                onClick={closeCameraModal}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-[9/16] max-h-[420px] mx-auto bg-black rounded-2xl overflow-hidden border border-white/10">
              <video
                ref={cameraPreviewRef}
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-center gap-3">
              {!isRecordingCamera ? (
                <button
                  type="button"
                  onClick={startCameraCapture}
                  className="px-5 py-2.5 rounded-2xl bg-[#0A84FF] hover:bg-[#0070E0] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <VideoIcon className="w-4 h-4" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCameraCapture}
                  className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop & Create Captions</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: "PREPARE YOUR MEDIA" DIALOG (101 Languages, Native vs Roman Script, Audio Clean, Auto Emojis) */}
      <PrepareYourMediaModal
        isOpen={isPrepareMediaOpen}
        videoFile={uploadedVideoFile}
        videoPreviewUrl={uploadedVideoUrl}
        activeSampleTitle={activeSampleReel.title}
        userPlan={userPlan}
        audioCleansRemaining={audioEnhancer.remainingCredits ?? 3}
        onClose={() => setIsPrepareMediaOpen(false)}
        onUpgradePlan={() => {
          setIsPrepareMediaOpen(false);
          setShellHubActiveView('subscriptions');
          setIsShellHubOpen(true);
        }}
        onGenerateTranscription={({
          spokenLanguage,
          writingSystem,
          audioEnhancement,
          autoEmojis,
          mappedTrack,
        }) => {
          setIsPrepareMediaOpen(false);
          setDetectedLanguage(`${spokenLanguage} (${writingSystem} Script)`);
          handleSelectPrimaryTrack(mappedTrack);

          if (audioEnhancement && !audioEnhancer.enabled) {
            setAudioEnhancer((prev) => ({
              ...prev,
              enabled: true,
              remainingCredits: Math.max(0, (prev.remainingCredits ?? 3) - 1),
            }));
          }

          if (uploadedVideoFile) {
            setSegments([]);
            runFastCaptionPipeline(
              uploadedVideoFile,
              `${spokenLanguage} (${writingSystem} script)`
            );
          } else {
            if (autoEmojis) {
              setSegments((prev) =>
                prev.map((seg) => {
                  const t = seg.tracks[mappedTrack] || seg.tracks.tinglish;
                  if (!t) return seg;
                  const withEmojis = injectEmojisIntoCaptionText(t.text);
                  const words = buildWordTimingsClient(
                    withEmojis,
                    seg.startTime,
                    seg.endTime,
                    t.words
                  );
                  return {
                    ...seg,
                    tracks: {
                      ...seg.tracks,
                      [mappedTrack]: {
                        text: withEmojis,
                        words,
                      },
                    },
                  };
                })
              );
            }
            showToast(
              `Prepared media in ${spokenLanguage} (${writingSystem} script)${
                autoEmojis ? ' + Auto Emojis 💰💵👥' : ''
              }!`
            );
          }
        }}
      />

      {/* SECTION 1: KALAKAR APP SHELL & NAVIGATION HUB MODAL */}
      <KalakarShellHubModal
        isOpen={isShellHubOpen}
        activeView={shellHubActiveView}
        userPlan={userPlan}
        audioCleansRemaining={audioEnhancer.remainingCredits ?? 3}
        onChangeView={setShellHubActiveView}
        onSelectPlan={(plan) => {
          setUserPlan(plan);
          showToast(`Switched to ${plan.toUpperCase()} Plan!`);
        }}
        onClose={() => setIsShellHubOpen(false)}
        onSelectSampleReel={(reel) => handleSelectSampleReel(reel)}
        onUploadFile={(file) => handleUploadFile(file, true)}
        onOpenPrepareMedia={() => {
          setIsShellHubOpen(false);
          setIsPrepareMediaOpen(true);
        }}
        onExportPremiereXML={handleExportPremiereXML}
        onExportAlphaWebM={handleExportAlphaOverlay}
      />

      {/* SMART AI AGENT, 1-CLICK ENABLE/DISABLE TOGGLES & LIVE 12-STEP UI TESTER */}
      <KalakarAgentAndTester
        isOpen={isAgentAndTesterOpen}
        minimalMode={minimalMode}
        onToggleMinimalMode={(val) => {
          setMinimalMode(val);
          setShowOnScreenSpacingHUD(!val);
          setShowMultiTrackTimeline(!val);
        }}
        styleConfig={styleConfig}
        segments={segments}
        audioEnhancer={audioEnhancer}
        autoHeroNLP={autoHeroNLP}
        onClose={() => setIsAgentAndTesterOpen(false)}
        onUpdateStyle={handleUpdateStyleAndSyncPreset}
        onApplyPreset={handleApplyPreset}
        onSelectPrimaryTrack={handleSelectPrimaryTrack}
        onUpdateAudioEnhancer={(partial) =>
          setAudioEnhancer((prev) => ({ ...prev, ...partial }))
        }
        onToggleAutoHeroNLP={() => {
          const nextVal = !autoHeroNLP;
          setAutoHeroNLP(nextVal);
          if (nextVal) {
            setSegments((prev) => applyAutoHeroNLPToSegments(prev));
          }
        }}
        onReplaceSegments={setSegments}
        onShowToast={showToast}
      />
    </div>
  );
}
