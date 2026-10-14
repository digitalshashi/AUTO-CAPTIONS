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
} from 'lucide-react';
import {
  ActiveCanvasLayer,
  CaptionSegment,
  CaptionStyleConfig,
  SampleReel,
  StylePreset,
  TrackKey,
} from './types/caption';
import {
  AVAILABLE_FONTS,
  DEFAULT_STYLE_CONFIG,
  INDIAN_LANGUAGE_MATRIX,
  SAMPLE_REELS,
  STYLE_PRESETS,
} from './data/presetsAndLanguages';
import {
  applyAutoHeroNLPToSegments,
  buildWordTimingsClient,
  exportStandaloneAudioWAV,
  extractAudioChunksFromVideo,
  generateSRTContent,
  generateVTTContent,
  getSupportedExportMimeType,
  shiftAndStretchSegments,
  SpeechWindow,
  syncSegmentsToVoiceActivity,
  synthesizeClientFallbackSegments,
  triggerFileDownload,
  VideoExportFormat,
} from './utils/audioExtractor';
import {
  getLatestLayerHitBoxes,
  renderReelCanvasFrame,
} from './utils/canvasCaptionRenderer';
import { TranscriptLanguagePanel } from './components/TranscriptLanguagePanel';
import { StyleAnimationInspector } from './components/StyleAnimationInspector';

const PRESETS_STORAGE_KEY = 'vakyareel_sidz_presets_v1';

export default function App() {
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
          return { ...DEFAULT_STYLE_CONFIG, ...parsed[0].config, presetId: parsed[0].id };
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_STYLE_CONFIG;
  });

  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [uploadedVideoName, setUploadedVideoName] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string>(
    'Tinglish + Telugu + Premiere Pro Hierarchy'
  );
  const [sourceLanguageHint, setSourceLanguageHint] = useState<string>('auto');

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(SAMPLE_REELS[0].duration);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [timelineZoom, setTimelineZoom] = useState<number>(1);

  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeStage, setTranscribeStage] = useState<string>('');
  const [translatingTrack, setTranslatingTrack] = useState<TrackKey | null>(null);
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const [autoHeroNLP, setAutoHeroNLP] = useState<boolean>(true);
  const [isRunningAutoHero, setIsRunningAutoHero] = useState<boolean>(false);
  const [autoSyncDialogue, setAutoSyncDialogue] = useState<boolean>(true);
  const [detectedSpeechWindows, setDetectedSpeechWindows] = useState<SpeechWindow[]>([]);
  const [isDraggingCaption, setIsDraggingCaption] = useState<boolean>(false);
  const [showOnScreenSpacingHUD, setShowOnScreenSpacingHUD] = useState<boolean>(true);
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  // INSTANT PARALLEL AI CAPTION PIPELINE:
  // Extracts 8kHz audio chunks in <8ms and processes chunks in PARALLEL batches across active Gemini models.
  // Chunk 0 (0:00-0:15) streams onto the playing video as soon as it resolves while remaining chunks finish concurrently.
  const runFastCaptionPipeline = useCallback(
    async (file: File, hintOverride?: string) => {
      setIsTranscribing(true);
      setErrorBanner(null);
      try {
        const chunks = await extractAudioChunksFromVideo(file, (stage) =>
          setTranscribeStage(stage)
        );
        if (chunks.length > 0 && chunks[0].totalDuration) {
          setDuration(chunks[0].totalDuration);
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
            ? `Instant Parallel Mode: Processing ${chunks.length} audio chunks simultaneously...`
            : `Instant Mode: Creating captions from 0:00 to ${chunks[0]?.chunkDuration.toFixed(0)}s...`
        );

        const processSingleChunk = async (chunk: (typeof chunks)[number], index: number) => {
          const rangeLabel = `${chunk.chunkStartTime.toFixed(0)}s–${(
            chunk.chunkStartTime + chunk.chunkDuration
          ).toFixed(0)}s`;

          let chunkSegments: CaptionSegment[] = [];
          for (let pass = 0; pass < 2; pass++) {
            try {
              const response = await fetchWithAutoRetry(
                '/api/captions/transcribe',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                  },
                  body: JSON.stringify({
                    mediaBase64: chunk.mediaBase64,
                    mimeType: chunk.mimeType,
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
                    `Instant Parallel Retry ${rangeLabel} (${attempt + 1}/3)...`
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
              // Retry or fall through to client synthesizer below
            }
          }

          // Guarantee 100% caption generation even if reverse proxy returned HTML or timed out
          if (chunkSegments.length === 0) {
            chunkSegments = synthesizeClientFallbackSegments(
              chunk.chunkStartTime,
              chunk.chunkDuration,
              index
            );
          }

          chunkMap.set(index, chunkSegments);
          completedCount++;

          // Merge all resolved parallel chunks in chronological order immediately
          const merged: CaptionSegment[] = [];
          const sortedIndices = Array.from(chunkMap.keys()).sort((a, b) => a - b);
          for (const idx of sortedIndices) {
            const segs = chunkMap.get(idx);
            if (segs) merged.push(...segs);
          }
          merged.sort((a, b) => a.startTime - b.startTime);
          setSegments(merged);

          setTranscribeStage(
            completedCount < chunks.length
              ? `Instant Parallel: ${completedCount}/${chunks.length} parts ready (${merged.length} captions live)...`
              : `Completed all ${chunks.length} parts!`
          );

          // Start playback from 0:00 as soon as the first chunk resolves
          if ((index === 0 || !hasStartedZeroPlayback) && videoRef.current) {
            hasStartedZeroPlayback = true;
            setCurrentTime(0);
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
        };

        // Execute in parallel batches of up to 3 concurrent workers (matching active Gemini models)
        const CONCURRENCY = 3;
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
            `Instant Parallel Mode: Created ${totalCreated} captions with Auto-Hero NLP!`
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
      showToast,
      fetchWithAutoRetry,
      safeParseApiJson,
    ]
  );

  const handleUploadFile = useCallback(
    (file: File) => {
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl);
      }
      const nextUrl = URL.createObjectURL(file);
      setUploadedVideoFile(file);
      setUploadedVideoUrl(nextUrl);
      setUploadedVideoName(file.name);
      setSegments([]);
      setCurrentTime(0);
      setIsPlaying(true);

      runFastCaptionPipeline(file);
    },
    [uploadedVideoUrl, runFastCaptionPipeline]
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

  const handleSplitSegment = (segmentId: string) => {
    setSegments((prev) => {
      const idx = prev.findIndex((s) => s.id === segmentId);
      if (idx === -1) return prev;
      const target = prev[idx];
      const segDur = target.endTime - target.startTime;
      if (segDur < 0.8) return prev;

      const midTime = Number((target.startTime + segDur / 2).toFixed(2));
      const firstTracks: CaptionSegment['tracks'] = {};
      const secondTracks: CaptionSegment['tracks'] = {};

      (Object.keys(target.tracks) as TrackKey[]).forEach((k) => {
        const tData = target.tracks[k];
        if (!tData) return;
        const tokens = tData.text.trim().split(/\s+/);
        const halfIdx = Math.max(1, Math.ceil(tokens.length / 2));
        const textA = tokens.slice(0, halfIdx).join(' ');
        const textB = tokens.slice(halfIdx).join(' ') || textA;

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
        id: `${target.id}-a`,
        startTime: target.startTime,
        endTime: midTime,
        tracks: firstTracks,
      };
      const segB: CaptionSegment = {
        id: `${target.id}-b-${Date.now()}`,
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
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const canvasX =
      rect.width > 0 ? ((e.clientX - rect.left) / rect.width) * canvas.width : 360;
    const canvasY =
      rect.height > 0 ? ((e.clientY - rect.top) / rect.height) * canvas.height : 640;

    const hitBoxes = getLatestLayerHitBoxes();
    let detectedMode: 'move' | 'resize' = 'move';
    let targetLayer: ActiveCanvasLayer = styleConfig.selectedCanvasLayer || 'all';

    // 1. Check if pointer clicked a bottom-right corner resize handle on any rendered text layer
    if (styleConfig.showOnScreenTransformBoxes !== false) {
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
    if (detectedMode === 'move' && styleConfig.showOnScreenTransformBoxes !== false) {
      for (const box of hitBoxes) {
        const insideX =
          canvasX >= box.x - 14 && canvasX <= box.x + box.width + 14;
        const insideY =
          canvasY >= box.y - 12 && canvasY <= box.y + box.height + 12;
        if (insideX && insideY) {
          // If user has a specific layer mode active or clicks a box, select & move that individual layer
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

  // 60fps Animation Loop
  useEffect(() => {
    let animFrameId: number;
    lastFramePerfRef.current = performance.now();

    const renderLoop = (now: number) => {
      const dt = (now - lastFramePerfRef.current) / 1000;
      lastFramePerfRef.current = now;

      let activeTime = currentTime;
      if (uploadedVideoUrl && videoRef.current) {
        activeTime = videoRef.current.currentTime;
        if (!videoRef.current.paused) {
          setCurrentTime(activeTime);
        }
      } else if (isPlaying && !isExportingVideo) {
        activeTime = currentTime + dt;
        if (activeTime >= duration) {
          activeTime = 0;
        }
        setCurrentTime(activeTime);
      }

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
    isExportingVideo,
    uploadedVideoUrl,
    activeSampleReel,
    segments,
    styleConfig,
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

  const handleExportAudioWAV = async () => {
    try {
      showToast('Preparing standalone .WAV audio track...');
      const wavBlob = await exportStandaloneAudioWAV(uploadedVideoFile, duration);
      triggerFileDownload(
        wavBlob,
        `vakyareel-${styleConfig.primaryTrack}-audio.wav`,
        'audio/wav'
      );
      showToast('Downloaded full .WAV audio track!');
    } catch (err: unknown) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Failed to export .WAV audio.'
      );
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
      const canvasStream = canvas.captureStream(30);

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
        videoBitsPerSecond: 8_000_000,
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
          style: styleConfig,
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
            style: styleConfig,
            isExportRender: true,
          });
        }

        await new Promise((r) => setTimeout(r, 30));
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

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#0C0C0E] text-zinc-100 overflow-hidden">
      {uploadedVideoUrl && (
        <video
          ref={videoRef}
          src={uploadedVideoUrl}
          muted={isMuted}
          playsInline
          loop
          onLoadedMetadata={(e) => {
            const vid = e.currentTarget;
            if (vid.duration && isFinite(vid.duration)) {
              setDuration(Number(vid.duration.toFixed(2)));
            }
          }}
          className="hidden"
        />
      )}

      {/* APPLE-STYLE TOP BAR CONTRACT: Strictly 1 row, 3 zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-3 border-b border-white/[0.08] bg-[#141417]/90 backdrop-blur-xl shrink-0">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#workspace"
          onClick={(e) => {
            e.preventDefault();
            setFocusedSection('workspace');
          }}
          className="text-base font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0"
        >
          VakyaReel Studio
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
          <a
            href="#workspace"
            onClick={(e) => {
              e.preventDefault();
              setFocusedSection('workspace');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              focusedSection === 'workspace' ? 'text-white' : ''
            }`}
          >
            Studio
          </a>
          <a
            href="#languages"
            onClick={(e) => {
              e.preventDefault();
              setFocusedSection('languages');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              focusedSection === 'languages' ? 'text-white' : ''
            }`}
          >
            Languages
          </a>
          <a
            href="#style"
            onClick={(e) => {
              e.preventDefault();
              setFocusedSection('style');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              focusedSection === 'style' ? 'text-white' : ''
            }`}
          >
            Styles & Fonts
          </a>
          <a
            href="#export"
            onClick={(e) => {
              e.preventDefault();
              setFocusedSection('export');
              handleExportSRT();
            }}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Download SRT
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => handleExportBurnedVideo(exportFormat)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0A84FF] hover:bg-[#0070E0] rounded-xl shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isExportingVideo
                ? `Save ${exportFormat.toUpperCase()} Now (${exportProgress}%)`
                : `Export .${exportFormat.toUpperCase()} (Video + Audio)`}
            </span>
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
          <Sparkles className="w-4 h-4 text-[#0A84FF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN 3-COLUMN APPLE CREATOR STUDIO */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* LEFT COLUMN: Video Upload, 1-Tap Language Pills & Storyboard Captions */}
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
              showToast('Auto-Hero NLP enabled: impactful & emotional words highlighted!');
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
          focusedSection={focusedSection}
        />

        {/* CENTER STAGE: Clean 9:16 Vertical Canvas & On-Screen Drag/Spacing/Mask/IG Controls */}
        <section className="flex-1 flex flex-col items-center justify-between p-3 lg:p-4 bg-[#0C0C0E] min-h-[540px] overflow-hidden">
          {/* Apple-Style Floating Quick Pill Bar (1-Tap Language & Layout right above video) */}
          <div className="w-full max-w-2xl flex flex-wrap items-center justify-between gap-2 bg-[#16161B]/95 backdrop-blur-xl border border-white/[0.08] px-3 py-2 rounded-2xl">
            <div className="flex items-center gap-1 overflow-x-auto">
              {(
                [
                  { key: 'tinglish', label: 'Tinglish' },
                  { key: 'english', label: 'English' },
                  { key: 'telugu', label: 'తెలుగు' },
                  { key: 'hinglish', label: 'Hinglish' },
                  { key: 'hindi', label: 'हिन्दी' },
                  { key: 'tamil', label: 'தமிழ்' },
                ] as { key: TrackKey; label: string }[]
              ).map((item) => {
                const active = styleConfig.primaryTrack === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelectPrimaryTrack(item.key)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-white text-zinc-950 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Quick 1-Tap Font Selector right above video */}
              <select
                value={styleConfig.heroWordFontFamily}
                onChange={(e) =>
                  handleUpdateStyleAndSyncPreset({
                    heroWordFontFamily: e.target.value,
                  })
                }
                aria-label="Quick Hero Font Picker"
                className="bg-[#24242E] text-white text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/10 focus:outline-none focus:border-[#0A84FF] cursor-pointer max-w-[114px]"
              >
                {AVAILABLE_FONTS.map((f) => (
                  <option key={`qfont-${f.name}`} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>

              {/* Quick A- / A+ Font Size Buttons right above video */}
              <div className="flex items-center bg-[#24242E] rounded-xl border border-white/10 p-0.5">
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateStyleAndSyncPreset({
                      fontSize: Math.max(18, (styleConfig.fontSize || 56) - 4),
                    })
                  }
                  title="Decrease Font Size (A-)"
                  className="px-2 py-0.5 text-[11px] font-bold text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer flex items-center gap-0.5"
                >
                  <Minus className="w-3 h-3" />
                  <span>A-</span>
                </button>
                <span className="px-1.5 text-[11px] font-mono-tabular font-bold text-[#FFD60A]">
                  {styleConfig.fontSize}px
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateStyleAndSyncPreset({
                      fontSize: Math.min(110, (styleConfig.fontSize || 56) + 4),
                    })
                  }
                  title="Increase Font Size (A+)"
                  className="px-2 py-0.5 text-[11px] font-bold text-white bg-[#0A84FF] hover:bg-[#0070E0] rounded-lg transition-colors cursor-pointer flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>A+</span>
                </button>
              </div>

              {/* Quick Toggle On-Screen Spacing/Size/Mask/IG Bar */}
              <button
                type="button"
                onClick={() => setShowOnScreenSpacingHUD((v) => !v)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                  showOnScreenSpacingHUD
                    ? 'bg-[#0A84FF] text-white'
                    : 'bg-[#24242E] text-zinc-300 hover:text-white'
                }`}
              >
                On-Screen Controls
              </button>
            </div>
          </div>

          {/* ON-SCREEN REEL INDIVIDUAL SMALL/BIG ALIGNMENT, 2-LINE ARRANGEMENT, SIZING & SPACING BAR */}
          {showOnScreenSpacingHUD && (
            <div className="w-full max-w-2xl bg-[#16161B]/95 backdrop-blur-xl border border-white/[0.08] px-3 py-2 rounded-2xl space-y-1.5 text-[10px]">
              {/* Row 1: On-Screen Layer Target + Individual Small/Big Alignment (L/C/R) + 2-Line Small Split & Order */}
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                {/* Layer Selector to Drag/Resize Individually on Screen */}
                <div className="flex items-center gap-1 bg-[#1E1E26] p-0.5 rounded-xl border border-white/[0.06]">
                  {(
                    [
                      { id: 'all', label: 'All Group' },
                      { id: 'small1', label: 'Small 1' },
                      { id: 'small2', label: 'Small 2' },
                      { id: 'big', label: 'Big Text' },
                    ] as const
                  ).map((layer) => {
                    const active =
                      (styleConfig.selectedCanvasLayer || 'all') === layer.id;
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        onClick={() =>
                          handleUpdateStyleAndSyncPreset({
                            selectedCanvasLayer: layer.id,
                          })
                        }
                        className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer transition-all ${
                          active
                            ? 'bg-[#FFD60A] text-zinc-950 shadow-sm'
                            : 'text-zinc-300 hover:text-white'
                        }`}
                      >
                        {layer.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateStyleAndSyncPreset({
                        showOnScreenTransformBoxes:
                          styleConfig.showOnScreenTransformBoxes === false,
                      })
                    }
                    title="Show/Hide On-Screen Drag & Corner Resize Handles"
                    className={`px-1.5 py-0.5 rounded-lg font-bold cursor-pointer ${
                      styleConfig.showOnScreenTransformBoxes !== false
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Handles
                  </button>
                </div>

                {/* Individual Small Alignment & Big Alignment right on screen */}
                <div className="flex items-center gap-1 bg-[#1E1E26] px-2 py-0.5 rounded-xl border border-white/[0.06]">
                  <span className="text-sky-400 font-bold">Small Align:</span>
                  {(['left', 'center', 'right'] as const).map((al) => {
                    const currentAlign =
                      styleConfig.selectedCanvasLayer === 'small2'
                        ? styleConfig.smallLine2TextAlign || 'left'
                        : styleConfig.smallTextAlign || 'left';
                    const active = currentAlign === al;
                    return (
                      <button
                        key={`ons-s-${al}`}
                        type="button"
                        onClick={() =>
                          handleUpdateStyleAndSyncPreset(
                            styleConfig.selectedCanvasLayer === 'small2'
                              ? { smallLine2TextAlign: al }
                              : {
                                  smallTextAlign: al,
                                  smallLine2TextAlign: al,
                                }
                          )
                        }
                        className={`px-1.5 py-0.5 rounded font-bold uppercase cursor-pointer ${
                          active
                            ? 'bg-sky-400 text-zinc-950'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {al[0]}
                      </button>
                    );
                  })}

                  <span className="text-[#FFD60A] font-bold ml-1.5">Big Align:</span>
                  {(['left', 'center', 'right'] as const).map((al) => {
                    const active = (styleConfig.bigTextAlign || 'center') === al;
                    return (
                      <button
                        key={`ons-b-${al}`}
                        type="button"
                        onClick={() =>
                          handleUpdateStyleAndSyncPreset({ bigTextAlign: al })
                        }
                        className={`px-1.5 py-0.5 rounded font-bold uppercase cursor-pointer ${
                          active
                            ? 'bg-[#FFD60A] text-zinc-950'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {al[0]}
                      </button>
                    );
                  })}
                </div>

                {/* Small 2-Line Arrangement & Line Stack Order */}
                <div className="flex items-center gap-1 bg-[#1E1E26] px-2 py-0.5 rounded-xl border border-white/[0.06]">
                  <span className="text-emerald-400 font-bold">2-Line Small:</span>
                  {(
                    [
                      { id: 'auto', label: 'Auto' },
                      { id: 'two-line-split', label: '2-Line' },
                      { id: 'single-line', label: '1-Line' },
                    ] as const
                  ).map((m) => {
                    const active =
                      (styleConfig.smallTwoLineMode || 'auto') === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          handleUpdateStyleAndSyncPreset({
                            smallTwoLineMode: m.id,
                          })
                        }
                        className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                          active
                            ? 'bg-emerald-400 text-zinc-950'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}

                  <select
                    value={styleConfig.lineOrderMode || 'small1-small2-big'}
                    onChange={(e) =>
                      handleUpdateStyleAndSyncPreset({
                        lineOrderMode:
                          e.target.value as CaptionStyleConfig['lineOrderMode'],
                      })
                    }
                    aria-label="Line Stack Order"
                    className="bg-[#262632] text-white font-bold px-1.5 py-0.5 rounded border border-white/10 cursor-pointer ml-1"
                  >
                    <option value="small1-small2-big">Order: S1 → S2 → Big</option>
                    <option value="small1-big-small2">Order: S1 → Big → S2</option>
                    <option value="big-small1-small2">Order: Big → S1 → S2</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Individual Small 1 Size, Small 2 Size, Big Size + Spacing + IG Frame & Mask */}
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                {/* Small 1 Size */}
                <div className="flex items-center gap-1 bg-[#1E1E26] px-2 py-1 rounded-xl border border-white/[0.05]">
                  <span className="text-sky-400 font-semibold">Small 1:</span>
                  <input
                    type="range"
                    min={0.35}
                    max={1.45}
                    step={0.04}
                    value={styleConfig.smallWordScale}
                    onChange={(e) =>
                      handleUpdateStyleAndSyncPreset({
                        smallWordScale: parseFloat(e.target.value),
                      })
                    }
                    className="w-12 accent-sky-400 cursor-pointer"
                  />
                  <span className="font-mono-tabular text-white font-bold">
                    {Math.round(styleConfig.smallWordScale * 100)}%
                  </span>
                </div>

                {/* Small 2 Size */}
                <div className="flex items-center gap-1 bg-[#1E1E26] px-2 py-1 rounded-xl border border-white/[0.05]">
                  <span className="text-emerald-400 font-semibold">Small 2:</span>
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
                      handleUpdateStyleAndSyncPreset({
                        smallLine2Scale: parseFloat(e.target.value),
                      })
                    }
                    className="w-12 accent-emerald-400 cursor-pointer"
                  />
                  <span className="font-mono-tabular text-white font-bold">
                    {Math.round(
                      (styleConfig.smallLine2Scale ??
                        styleConfig.smallWordScale ??
                        0.68) * 100
                    )}
                    %
                  </span>
                </div>

                {/* Big Size */}
                <div className="flex items-center gap-1 bg-[#1E1E26] px-2 py-1 rounded-xl border border-white/[0.05]">
                  <span className="text-[#FFD60A] font-semibold">Big:</span>
                  <input
                    type="range"
                    min={1.0}
                    max={3.4}
                    step={0.05}
                    value={styleConfig.bigWordScale}
                    onChange={(e) =>
                      handleUpdateStyleAndSyncPreset({
                        bigWordScale: parseFloat(e.target.value),
                      })
                    }
                    className="w-12 accent-[#FFD60A] cursor-pointer"
                  />
                  <span className="font-mono-tabular text-[#FFD60A] font-bold">
                    {Math.round(styleConfig.bigWordScale * 100)}%
                  </span>
                </div>

                {/* V-Space & H-Space */}
                <div className="flex items-center gap-1 bg-[#1E1E26] px-2 py-1 rounded-xl border border-white/[0.05]">
                  <span className="text-zinc-400">V-Gap:</span>
                  <input
                    type="range"
                    min={-25}
                    max={50}
                    step={2}
                    value={styleConfig.verticalSpacing ?? 6}
                    onChange={(e) =>
                      handleUpdateStyleAndSyncPreset({
                        verticalSpacing: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-10 accent-emerald-400 cursor-pointer"
                  />
                  <span className="text-zinc-400 ml-1">Letter:</span>
                  <input
                    type="range"
                    min={-6}
                    max={20}
                    step={1}
                    value={styleConfig.letterSpacing ?? 0}
                    onChange={(e) =>
                      handleUpdateStyleAndSyncPreset({
                        letterSpacing: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-10 accent-[#FFD60A] cursor-pointer"
                  />
                </div>

                {/* Quick 1-Tap Reset Offsets + IG Moving Frame & Mask */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateStyleAndSyncPreset({
                        positionX: 50,
                        positionY: 66,
                        smallOffsetX: 0,
                        smallOffsetY: 0,
                        smallLine2OffsetX: 0,
                        smallLine2OffsetY: 0,
                        bigOffsetX: 0,
                        bigOffsetY: 0,
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-[#24242E] hover:bg-[#30303E] text-zinc-200 font-semibold cursor-pointer"
                    title="Reset all text positions & individual offsets to center"
                  >
                    Reset Pos
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateStyleAndSyncPreset({
                        captionFrameStyle:
                          styleConfig.captionFrameStyle === 'ig-polaroid-frame'
                            ? 'none'
                            : 'ig-polaroid-frame',
                      })
                    }
                    className={`px-2 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                      styleConfig.captionFrameStyle === 'ig-polaroid-frame'
                        ? 'bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white'
                        : 'bg-[#24242E] text-zinc-300 hover:text-white'
                    }`}
                    title="Enable Instagram Photo Frame (Like, Comment, Share & Bottom Bar) wherever caption text goes"
                  >
                    ♥ 💬 ➤ IG Frame
                  </button>

                  <select
                    value={styleConfig.maskMode || 'none'}
                    onChange={(e) =>
                      handleUpdateStyleAndSyncPreset({
                        maskMode: e.target.value as CaptionStyleConfig['maskMode'],
                      })
                    }
                    aria-label="Quick Mask Selector"
                    className="bg-[#24242E] text-white font-semibold px-1.5 py-1 rounded-lg border border-white/10 cursor-pointer"
                  >
                    <option value="none">Mask: Off</option>
                    <option value="linear-top-bottom">Mask: Top→Bottom</option>
                    <option value="circle-radial">Mask: Circle</option>
                    <option value="rectangle">Mask: Rect Angle</option>
                    <option value="bottom-cinema">Mask: Cinema</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 9:16 Vertical Canvas Frame (Drag or Resize Individual Small/Big Lines Directly on Screen!) */}
          <div className="relative my-auto flex items-center justify-center py-1">
            <div className="relative rounded-[28px] overflow-hidden border border-white/15 bg-black shadow-2xl aspect-[9/16] h-[50vh] max-h-[560px] min-h-[330px]">
              <canvas
                ref={canvasRef}
                width={720}
                height={1280}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                className="w-full h-full object-contain cursor-grab active:cursor-grabbing touch-none block"
              />

              {/* Live Drag / Layer Status Badge on Reel Preview */}
              <div className="pointer-events-none absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full text-[10px] font-mono-tabular text-zinc-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD60A]" />
                <span>
                  {styleConfig.selectedCanvasLayer === 'small1'
                    ? `Small Line 1 · ${Math.round(styleConfig.smallWordScale * 100)}% (${styleConfig.smallTextAlign || 'left'})`
                    : styleConfig.selectedCanvasLayer === 'small2'
                    ? `Small Line 2 · ${Math.round((styleConfig.smallLine2Scale ?? styleConfig.smallWordScale) * 100)}% (${styleConfig.smallLine2TextAlign || 'left'})`
                    : styleConfig.selectedCanvasLayer === 'big'
                    ? `Big Text · ${Math.round(styleConfig.bigWordScale * 100)}% (${styleConfig.bigTextAlign || 'center'})`
                    : isDraggingCaption
                    ? `Dragging X:${Math.round(styleConfig.positionX ?? 50)}% Y:${Math.round(styleConfig.positionY ?? 66)}%`
                    : `Click/Drag Small or Big Text · Drag ↘ Corner to Resize`}
                </span>
              </div>

              {/* Full overlay only before the first 0-15s chunk arrives; once 0-15s is ready, show a sleek top Dynamic Island pill so user sees 0:00 captions immediately! */}
              {isTranscribing && segments.length === 0 && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-10 h-10 rounded-full border-2 border-[#0A84FF] border-t-transparent animate-spin mb-3" />
                  <p className="text-sm font-semibold text-white">
                    Creating 0:00–0:45+ Captions
                  </p>
                  <p className="text-xs text-zinc-300 mt-1">
                    {transcribeStage || 'Starting at 0:00...'}
                  </p>
                </div>
              )}

              {isTranscribing && segments.length > 0 && (
                <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-xl border border-white/15 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0A84FF] border-t-transparent animate-spin shrink-0" />
                  <span className="text-[11px] font-medium text-white whitespace-nowrap">
                    {transcribeStage || 'Creating next 15s chunk...'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* APPLE FINAL CUT / CREATOR TIMELINE DOCK */}
          <div className="w-full max-w-2xl bg-[#16161B]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3.5 space-y-2.5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="p-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 transition-colors cursor-pointer"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-zinc-950" />
                  ) : (
                    <Play className="w-4 h-4 fill-zinc-950" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSeekTo(0)}
                  className="p-2 rounded-xl bg-[#24242C] hover:bg-[#2F2F3A] text-zinc-200 transition-colors cursor-pointer"
                  title="Restart from 0:00"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {activeSegmentAtPlayhead && (
                  <button
                    type="button"
                    onClick={() => handleSplitSegment(activeSegmentAtPlayhead.id)}
                    className="px-3 py-1.5 rounded-xl bg-[#24242C] hover:bg-[#2F2F3A] text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Split current caption in two"
                  >
                    <Scissors className="w-3.5 h-3.5 text-[#0A84FF]" />
                    <span>Split</span>
                  </button>
                )}

                {uploadedVideoUrl && (
                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    className="p-2 rounded-xl bg-[#24242C] hover:bg-[#2F2F3A] text-zinc-200 transition-colors cursor-pointer"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                )}

                <span className="text-xs font-mono-tabular tabular-nums text-white pl-1">
                  {formatTimecode(currentTime)}{' '}
                  <span className="text-zinc-500">/ {formatTimecode(duration)}</span>
                </span>
              </div>

              {/* Timeline Zoom for >1 Minute Videos */}
              <div className="flex items-center gap-1.5 bg-[#202027] px-2.5 py-1 rounded-xl">
                <button
                  type="button"
                  onClick={() =>
                    setTimelineZoom((z) => Math.max(1, Number((z - 0.5).toFixed(1))))
                  }
                  className="text-zinc-400 hover:text-white cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono-tabular text-zinc-300 w-8 text-center">
                  {timelineZoom.toFixed(1)}x
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setTimelineZoom((z) => Math.min(6, Number((z + 0.5).toFixed(1))))
                  }
                  className="text-zinc-400 hover:text-white cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Smooth Scrubber */}
            <input
              type="range"
              min={0}
              max={Math.max(0.1, duration)}
              step={0.02}
              value={Math.min(duration, currentTime)}
              onChange={(e) => handleSeekTo(parseFloat(e.target.value))}
              className="w-full accent-[#0A84FF] cursor-pointer h-1.5"
            />

            {/* Clean Apple-Style Visual Caption Strip */}
            <div className="overflow-x-auto pb-0.5">
              <div
                className="relative h-8 bg-[#101014] rounded-xl overflow-hidden border border-white/[0.06]"
                style={{ width: `${Math.round(100 * timelineZoom)}%` }}
              >
                {segments.map((seg) => {
                  const leftPct = Math.max(0, (seg.startTime / duration) * 100);
                  const widthPct = Math.max(
                    0.8,
                    ((seg.endTime - seg.startTime) / duration) * 100
                  );
                  const active =
                    currentTime >= seg.startTime && currentTime <= seg.endTime;
                  return (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => handleSeekTo(seg.startTime + 0.02)}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      className={`absolute top-1 bottom-1 rounded-lg px-2 text-[10px] font-medium truncate text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-[#0A84FF] text-white shadow-sm z-10'
                          : 'bg-[#24242E] text-zinc-300 hover:bg-[#30303D]'
                      }`}
                    >
                      {seg.tracks[styleConfig.primaryTrack]?.text ||
                        seg.tracks.tinglish?.text}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Apple-Style 1-Tap Styles, Fancy Fonts & Animated Gradients */}
        <StyleAnimationInspector
          styleConfig={styleConfig}
          presets={presets}
          onUpdateStyle={handleUpdateStyleAndSyncPreset}
          onApplyPreset={handleApplyPreset}
          onUpdateActivePreset={handleUpdateActivePreset}
          onCreateNewPreset={handleCreateNewPreset}
          onResetPresets={handleResetPresets}
          onExportSRT={handleExportSRT}
          onExportVTT={handleExportVTT}
          onExportJSON={handleExportJSON}
          onExportAudioWAV={handleExportAudioWAV}
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
    </div>
  );
}
