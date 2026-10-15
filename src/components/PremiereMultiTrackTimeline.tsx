import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Combine,
  Eye,
  EyeOff,
  Film,
  Layers,
  Link2,
  Lock,
  Magnet,
  Maximize2,
  Minimize2,
  Minus,
  Music,
  PersonStanding,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
  Unlink2,
  Unlock,
  Upload,
  Video,
  Volume2,
  VolumeX,
  Wand2,
  Wind,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { CaptionSegment, CaptionStyleConfig, TrackKey } from '../types/caption';
import {
  OPEN_SOURCE_SFX_LIBRARY,
  playOpenSourceSoundEffect,
  SoundEffectType,
} from '../utils/soundEffectsEngine';
import {
  buildMusicAndWhooshWaveform,
  buildSyllabicDialogueWaveform,
  HighDensityWaveformData,
  WhooshMarker,
} from '../utils/audioWaveformAnalyzer';

export type TrackId = 'captions' | 'broll' | 'video1' | 'video2' | 'audio1' | 'music';

export interface TimelineClip {
  id: string;
  trackId: 'broll' | 'video1' | 'video2' | 'audio1' | 'music';
  label: string;
  startTime: number;
  endTime: number;
  sourceStart: number;
  muted?: boolean;
  hidden?: boolean;
  brollPrompt?: string;
  brollEffect?: 'zoom-in' | 'pan-left' | 'ken-burns' | 'flash-cut' | ' cine-glow';
  brollImageUrl?: string;
  sfxType?: SoundEffectType;
  customMediaUrl?: string;
  colorAccent?: string;
  isWhooshTransient?: boolean;
}

export interface TrackConfig {
  id: TrackId;
  label: string;
  enabled: boolean;
  visible: boolean;
  muted: boolean;
  locked: boolean;
}

/**
 * High-DPI Premiere Pro Sub-Pixel Waveform Canvas
 * Renders ultra-fine 1px vertical needle peaks + inner RMS core + Whoosh SFX envelopes
 * (replaces coarse block bars with authentic broadcast NLE wavelengths).
 */
const PremiereHighDensityWaveformCanvas: React.FC<{
  waveformData: HighDensityWaveformData;
  clipStartTime: number;
  clipEndTime: number;
  totalDuration: number;
  variant: 'dialogue-audio1' | 'music-whoosh';
  whooshMarkers?: WhooshMarker[];
}> = ({
  waveformData,
  clipStartTime,
  clipEndTime,
  totalDuration,
  variant,
  whooshMarkers = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderWaveform = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(60, Math.floor(rect.width));
      const height = Math.max(24, Math.floor(rect.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerY = height / 2;
      const maxAmpHeight = height * 0.46;
      const safeDur = Math.max(0.5, totalDuration);

      // 1. Subtle Premiere Pro dB Reference Hairlines (-6dB, 0dB center, -6dB bottom)
      ctx.strokeStyle =
        variant === 'dialogue-audio1'
          ? 'rgba(52, 211, 153, 0.14)'
          : 'rgba(167, 139, 250, 0.14)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, centerY - maxAmpHeight * 0.55);
      ctx.lineTo(width, centerY - maxAmpHeight * 0.55);
      ctx.moveTo(0, centerY + maxAmpHeight * 0.55);
      ctx.lineTo(width, centerY + maxAmpHeight * 0.55);
      ctx.stroke();

      // Center 0dB axis line
      ctx.strokeStyle =
        variant === 'dialogue-audio1'
          ? 'rgba(52, 211, 153, 0.35)'
          : 'rgba(192, 132, 252, 0.35)';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // 2. High-density 1px vertical needle peaks every 2px horizontally
      const { peaks, rms, sampleCount } = waveformData;
      const stepPx = 2; // Fine 1px needle + 1px gap for authentic Premiere Pro density

      for (let x = 0; x < width; x += stepPx) {
        const clipRatio = x / Math.max(1, width);
        const absTime = clipStartTime + clipRatio * Math.max(0.1, clipEndTime - clipStartTime);
        const globalRatio = Math.max(0, Math.min(0.999, absTime / safeDur));
        const bucketIdx = Math.floor(globalRatio * sampleCount);

        const peakVal = peaks[bucketIdx] ?? 0.15;
        const rmsVal = rms[bucketIdx] ?? peakVal * 0.6;

        // Check if this timestamp falls inside a Whoosh / Wash SFX transient on the Music track
        let isWhooshZone = false;
        let whooshBoost = 0;
        if (variant === 'music-whoosh' && whooshMarkers.length > 0) {
          for (const w of whooshMarkers) {
            const halfW = Math.max(0.16, w.duration * 0.5);
            const dist = Math.abs(absTime - w.time);
            if (dist <= halfW) {
              isWhooshZone = true;
              whooshBoost = Math.max(whooshBoost, (1 - dist / halfW) * w.intensity);
            }
          }
        }

        const effectivePeak = isWhooshZone
          ? Math.min(0.98, Math.max(peakVal, whooshBoost * 0.95))
          : peakVal;
        const effectiveRms = isWhooshZone
          ? Math.min(0.82, Math.max(rmsVal, whooshBoost * 0.68))
          : rmsVal;

        const peakHalfH = Math.max(1.2, effectivePeak * maxAmpHeight);
        const rmsHalfH = Math.max(0.8, effectiveRms * maxAmpHeight);

        // Outer transient peak needle (1px wide)
        if (variant === 'dialogue-audio1') {
          ctx.fillStyle = effectivePeak > 0.78 ? '#34D399' : '#10B981';
        } else if (isWhooshZone) {
          // Whoosh / Wash SFX transient highlighted in luminous Amber-Cyan
          ctx.fillStyle = whooshBoost > 0.55 ? '#FBBF24' : '#38BDF8';
        } else {
          // Stereo Music Bed wavelength in fine Indigo-Violet
          ctx.fillStyle = effectivePeak > 0.7 ? '#C084FC' : '#818CF8';
        }

        ctx.fillRect(x, centerY - peakHalfH, 1, peakHalfH * 2);

        // Inner RMS energy core (brighter center spine)
        if (variant === 'dialogue-audio1') {
          ctx.fillStyle = '#A7F3D0';
        } else if (isWhooshZone) {
          ctx.fillStyle = '#FEF08A';
        } else {
          ctx.fillStyle = '#E9D5FF';
        }
        ctx.fillRect(x, centerY - rmsHalfH, 1, rmsHalfH * 2);
      }

      // 3. Draw Continuous Envelope Curve & Whoosh Diamond Markers for Music & Whoosh Track
      if (variant === 'music-whoosh' && whooshMarkers.length > 0) {
        for (const w of whooshMarkers) {
          if (w.time < clipStartTime || w.time > clipEndTime) continue;
          const relX =
            ((w.time - clipStartTime) / Math.max(0.1, clipEndTime - clipStartTime)) * width;
          const halfPx =
            ((w.duration * 0.5) / Math.max(0.1, clipEndTime - clipStartTime)) * width;

          // Subtle glowing Whoosh wash envelope fan
          const grad = ctx.createRadialGradient(
            relX,
            centerY,
            1,
            relX,
            centerY,
            Math.max(12, halfPx)
          );
          grad.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
          grad.addColorStop(0.6, 'rgba(56, 189, 248, 0.12)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(relX - halfPx, 0, halfPx * 2, height);
        }
      }

      ctx.restore();
    };

    renderWaveform();
    const observer = new ResizeObserver(renderWaveform);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [waveformData, clipStartTime, clipEndTime, totalDuration, variant, whooshMarkers]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block pointer-events-none"
    />
  );
};

interface PremiereMultiTrackTimelineProps {
  segments: CaptionSegment[];
  currentTime: number;
  duration: number;
  styleConfig: CaptionStyleConfig;
  timelineZoom: number;
  timelineGranularity: 'word' | 'line';
  audioWaveformBars: number[];
  highDensityWaveform?: HighDensityWaveformData | null;
  uploadedVideoUrl: string | null;
  uploadedVideoName: string | null;
  videoClips: TimelineClip[];
  audioClips: TimelineClip[];
  brollClips: TimelineClip[];
  video2Clips: TimelineClip[];
  musicClips: TimelineClip[];
  tracksConfig: Record<TrackId, TrackConfig>;
  isVideoAudioLinked: boolean;
  onChangeZoom: (zoom: number) => void;
  onChangeGranularity: (mode: 'word' | 'line') => void;
  onToggleVideoAudioLinked: () => void;
  onUpdateTracksConfig: (next: Record<TrackId, TrackConfig>) => void;
  onUpdateVideoClips: (clips: TimelineClip[]) => void;
  onUpdateAudioClips: (clips: TimelineClip[]) => void;
  onUpdateBrollClips: (clips: TimelineClip[]) => void;
  onUpdateVideo2Clips: (clips: TimelineClip[]) => void;
  onUpdateMusicClips: (clips: TimelineClip[]) => void;
  onSeekTo: (seconds: number) => void;
  onAddWordOrSegment: () => void;
  onDeleteSegment: (segId: string) => void;
  onDeleteWordInSegment: (segId: string, wordIdx: number) => void;
  onSplitSegmentAtTime: (segId: string, splitTime?: number) => void;
  onMergeSegmentWithNext: (segId: string) => void;
  onNudgeSegmentTiming: (segId: string, deltaSec: number) => void;
  onToggleBehindSubject: (segId: string) => void;
  onUpdateStyle: (partial: Partial<CaptionStyleConfig>) => void;
  onGenerateAiBroll: () => void;
  onShowToast: (msg: string) => void;
}

function formatRulerMillisecondTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const ms = Math.round((safe - Math.floor(safe)) * 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(
    ms % 1000
  ).padStart(3, '0')}`;
}

export const PremiereMultiTrackTimeline: React.FC<PremiereMultiTrackTimelineProps> = ({
  segments,
  currentTime,
  duration,
  styleConfig,
  timelineZoom,
  timelineGranularity,
  highDensityWaveform,
  uploadedVideoUrl,
  videoClips,
  audioClips,
  brollClips,
  video2Clips,
  musicClips,
  tracksConfig,
  isVideoAudioLinked,
  onChangeZoom,
  onChangeGranularity,
  onToggleVideoAudioLinked,
  onUpdateTracksConfig,
  onUpdateVideoClips,
  onUpdateAudioClips,
  onUpdateBrollClips,
  onUpdateVideo2Clips,
  onUpdateMusicClips,
  onSeekTo,
  onAddWordOrSegment,
  onDeleteSegment,
  onDeleteWordInSegment,
  onSplitSegmentAtTime,
  onMergeSegmentWithNext,
  onNudgeSegmentTiming,
  onToggleBehindSubject,
  onUpdateStyle,
  onGenerateAiBroll,
  onShowToast,
}) => {
  const [selectedItem, setSelectedItem] = useState<{
    type: 'caption-seg' | 'caption-word' | 'clip';
    id: string;
    trackId: TrackId;
    segId?: string;
    wordIdx?: number;
  } | null>(null);

  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [isExpandedHeight, setIsExpandedHeight] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showTrackSelectorMenu, setShowTrackSelectorMenu] = useState<boolean>(false);
  const [extractedFrames, setExtractedFrames] = useState<
    { time: number; dataUrl: string; aspect: '9:16' | '16:9' | '1:1' }[]
  >([]);
  const [detectedVideoAspect, setDetectedVideoAspect] = useState<'9:16' | '16:9' | '1:1' | null>(
    null
  );
  const [hoverPreviewState, setHoverPreviewState] = useState<{
    time: number;
    leftPct: number;
  } | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState<boolean>(false);
  const [draggingClipEdge, setDraggingClipEdge] = useState<{
    clipId: string;
    trackId: 'broll' | 'video1' | 'video2' | 'audio1' | 'music';
    edge: 'start' | 'end' | 'move';
    initialX: number;
    initialStart: number;
    initialEnd: number;
  } | null>(null);

  // Whoosh / Wash SFX transient markers synced with hook segments & B-rolls + user-added Whooshes
  const [customWhooshMarkers, setCustomWhooshMarkers] = useState<WhooshMarker[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const innerTrackCanvasRef = useRef<HTMLDivElement | null>(null);
  const secondaryVideoInputRef = useRef<HTMLInputElement | null>(null);
  const musicAudioInputRef = useRef<HTMLInputElement | null>(null);
  const customBrollInputRef = useRef<HTMLInputElement | null>(null);

  // Compute high-density dialogue waveform (real decoded PCM if available, else high-density syllabic envelope)
  const dialogueWaveformData = useMemo(() => {
    if (highDensityWaveform && highDensityWaveform.sampleCount > 0) {
      return highDensityWaveform;
    }
    return buildSyllabicDialogueWaveform(duration || 12, segments, 1600);
  }, [highDensityWaveform, duration, segments]);

  // Compute combined Whoosh / Wash SFX markers from segments, B-rolls, and user-added Whoosh cues
  const allWhooshMarkers = useMemo<WhooshMarker[]>(() => {
    const autoMarkers: WhooshMarker[] = [];
    // Place automatic Whoosh/Wash transition spikes at key caption hooks & B-roll entrances
    segments.forEach((seg, idx) => {
      if (idx === 0 || idx % 2 === 1 || seg.sfxType) {
        autoMarkers.push({
          id: `auto-whoosh-${seg.id}`,
          time: Number(Math.max(0.18, seg.startTime).toFixed(2)),
          duration: 0.48,
          label: seg.sfxType ? seg.sfxType.toUpperCase() : idx === 0 ? 'HOOK WHOOSH' : 'WASH SWISH',
          intensity: idx === 0 ? 0.96 : 0.84,
        });
      }
    });
    brollClips.forEach((b) => {
      autoMarkers.push({
        id: `broll-whoosh-${b.id}`,
        time: b.startTime,
        duration: 0.52,
        label: 'B-ROLL WHOOSH',
        intensity: 0.92,
      });
    });
    return [...autoMarkers, ...customWhooshMarkers].sort((a, b) => a.time - b.time);
  }, [segments, brollClips, customWhooshMarkers]);

  // Compute high-density Music + Whoosh SFX dual-envelope waveform
  const musicAndWhooshWaveformData = useMemo(() => {
    return buildMusicAndWhooshWaveform(duration || 12, allWhooshMarkers, 1600);
  }, [duration, allWhooshMarkers]);

  // Extract true second-by-second video frames in the video's native aspect ratio (9:16, 16:9, or 1:1)
  useEffect(() => {
    if (!uploadedVideoUrl) {
      setExtractedFrames([]);
      setDetectedVideoAspect(null);
      return;
    }
    let cancelled = false;
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'auto';
    tempVideo.muted = true;
    tempVideo.playsInline = true;
    tempVideo.crossOrigin = 'anonymous';

    const generateSecondBySecondFrames = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          const onReady = () => {
            tempVideo.removeEventListener('loadeddata', onReady);
            resolve();
          };
          tempVideo.addEventListener('loadeddata', onReady);
          tempVideo.onerror = () => reject();
          tempVideo.src = uploadedVideoUrl;
          tempVideo.load();
          setTimeout(resolve, 3000);
        });
        if (cancelled) return;

        const vidDur =
          tempVideo.duration && isFinite(tempVideo.duration) && tempVideo.duration > 0.2
            ? tempVideo.duration
            : Math.max(1, duration || 12);

        const vw = tempVideo.videoWidth || 1080;
        const vh = tempVideo.videoHeight || 1920;
        const ratio = vw / Math.max(1, vh);
        const nativeAspect: '9:16' | '16:9' | '1:1' =
          ratio > 1.15 ? '16:9' : ratio < 0.85 ? '9:16' : '1:1';

        setDetectedVideoAspect(nativeAspect);

        // Preserve exact native aspect ratio in offscreen frame capture so 9:16 and 16:9 frames are never cropped!
        const offCanvas = document.createElement('canvas');
        if (nativeAspect === '9:16') {
          offCanvas.width = 90;
          offCanvas.height = 160;
        } else if (nativeAspect === '16:9') {
          offCanvas.width = 160;
          offCanvas.height = 90;
        } else {
          offCanvas.width = 112;
          offCanvas.height = 112;
        }
        const ctx = offCanvas.getContext('2d');

        // Sample second-by-second (every 0.5s for short reels <= 15s, or ~24-32 frames across longer reels)
        const stepSec = vidDur <= 16 ? 0.5 : Math.max(0.5, vidDur / 28);
        const totalSamples = Math.min(36, Math.max(6, Math.ceil(vidDur / stepSec)));
        const collected: { time: number; dataUrl: string; aspect: '9:16' | '16:9' | '1:1' }[] = [];

        for (let i = 0; i < totalSamples; i++) {
          if (cancelled) break;
          const targetT = Math.min(
            Math.max(0, vidDur - 0.04),
            Number(((i / Math.max(1, totalSamples - 1)) * (vidDur - 0.08)).toFixed(2))
          );

          await new Promise<void>((r) => {
            let resolved = false;
            const finish = () => {
              if (resolved) return;
              resolved = true;
              tempVideo.removeEventListener('seeked', onSeeked);
              requestAnimationFrame(() => r());
            };
            const onSeeked = () => finish();
            tempVideo.addEventListener('seeked', onSeeked);
            tempVideo.currentTime = targetT;
            setTimeout(finish, 420);
          });

          if (cancelled) break;
          if (ctx && tempVideo.readyState >= 2) {
            ctx.fillStyle = '#06070B';
            ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);

            // Fit full uncropped frame inside offCanvas according to its true aspect ratio
            const cRatio = offCanvas.width / offCanvas.height;
            let dW = offCanvas.width;
            let dH = offCanvas.height;
            let oX = 0;
            let oY = 0;
            if (ratio > cRatio) {
              dW = offCanvas.width;
              dH = offCanvas.width / ratio;
              oY = (offCanvas.height - dH) / 2;
            } else {
              dH = offCanvas.height;
              dW = offCanvas.height * ratio;
              oX = (offCanvas.width - dW) / 2;
            }
            ctx.drawImage(tempVideo, oX, oY, dW, dH);

            collected.push({
              time: targetT,
              dataUrl: offCanvas.toDataURL('image/jpeg', 0.76),
              aspect: nativeAspect,
            });

            // Stream progressive updates so user sees second-by-second frames immediately
            if (collected.length === 1 || collected.length % 4 === 0 || i === totalSamples - 1) {
              setExtractedFrames([...collected]);
            }
          }
        }
      } catch {
        // Fallback to stylized second-by-second frames if browser blocks offscreen seek
      }
    };

    generateSecondBySecondFrames();
    return () => {
      cancelled = true;
      tempVideo.src = '';
    };
  }, [uploadedVideoUrl, duration]);

  const effectiveAspect: '9:16' | '16:9' | '1:1' =
    detectedVideoAspect || styleConfig.aspectRatio || '9:16';

  const getFrameForSecond = (targetSec: number) => {
    if (extractedFrames.length === 0) return null;
    let best = extractedFrames[0];
    let bestDiff = Math.abs(best.time - targetSec);
    for (let i = 1; i < extractedFrames.length; i++) {
      const d = Math.abs(extractedFrames[i].time - targetSec);
      if (d < bestDiff) {
        best = extractedFrames[i];
        bestDiff = d;
      }
    }
    return best;
  };

  // Flatten all words for WORD granularity mode
  const allTimedWords = useMemo(() => {
    const list: {
      id: string;
      word: string;
      startTime: number;
      endTime: number;
      isHero?: boolean;
      segId: string;
      wordIdx: number;
    }[] = [];
    const activeKey: TrackKey = styleConfig.primaryTrack || 'tinglish';

    segments.forEach((seg) => {
      const tr =
        seg.tracks[activeKey] ||
        seg.tracks.tinglish ||
        seg.tracks.english ||
        Object.values(seg.tracks)[0];
      if (tr && tr.words.length > 0) {
        tr.words.forEach((w, wIdx) => {
          list.push({
            id: `${seg.id}-word-${wIdx}`,
            word: w.word,
            startTime: w.startTime,
            endTime: w.endTime,
            isHero: w.isHero,
            segId: seg.id,
            wordIdx: wIdx,
          });
        });
      }
    });
    return list;
  }, [segments, styleConfig.primaryTrack]);

  // Active segment at current playhead
  const activeSegment = useMemo(() => {
    return (
      segments.find((s) => currentTime >= s.startTime && currentTime <= s.endTime) ||
      segments.find((s) => s.id === selectedItem?.segId) ||
      segments[0] ||
      null
    );
  }, [segments, currentTime, selectedItem]);

  // Convert clientX pointer coordinate to timeline seconds
  const clientXToSeconds = (clientX: number): number => {
    const el = innerTrackCanvasRef.current;
    if (!el) return currentTime;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    let rawSec = ratio * Math.max(0.5, duration);

    if (snapEnabled) {
      // Snap within 0.08s to existing clip cuts or segment boundaries
      const snapTargets: number[] = [0, duration];
      videoClips.forEach((c) => snapTargets.push(c.startTime, c.endTime));
      audioClips.forEach((c) => snapTargets.push(c.startTime, c.endTime));
      segments.forEach((s) => snapTargets.push(s.startTime, s.endTime));
      for (const target of snapTargets) {
        if (Math.abs(rawSec - target) < 0.07) {
          rawSec = target;
          break;
        }
      }
    }
    return Number(rawSec.toFixed(3));
  };

  // Handle global pointer move for playhead scrubbing & clip edge trimming
  useEffect(() => {
    if (!isDraggingPlayhead && !draggingClipEdge) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (isDraggingPlayhead) {
        const nextSec = clientXToSeconds(e.clientX);
        onSeekTo(nextSec);
        return;
      }

      if (draggingClipEdge && innerTrackCanvasRef.current) {
        const rect = innerTrackCanvasRef.current.getBoundingClientRect();
        const deltaPixels = e.clientX - draggingClipEdge.initialX;
        const deltaSeconds = (deltaPixels / Math.max(1, rect.width)) * Math.max(1, duration);

        const updateClipList = (list: TimelineClip[]): TimelineClip[] =>
          list.map((clip) => {
            if (clip.id !== draggingClipEdge.clipId) return clip;
            if (draggingClipEdge.edge === 'start') {
              const newStart = Number(
                Math.max(
                  0,
                  Math.min(clip.endTime - 0.25, draggingClipEdge.initialStart + deltaSeconds)
                ).toFixed(2)
              );
              const diff = newStart - clip.startTime;
              return {
                ...clip,
                startTime: newStart,
                sourceStart: Math.max(0, Number((clip.sourceStart + diff).toFixed(2))),
              };
            }
            if (draggingClipEdge.edge === 'end') {
              const newEnd = Number(
                Math.min(
                  duration,
                  Math.max(clip.startTime + 0.25, draggingClipEdge.initialEnd + deltaSeconds)
                ).toFixed(2)
              );
              return { ...clip, endTime: newEnd };
            }
            // Move whole clip
            const clipDur = draggingClipEdge.initialEnd - draggingClipEdge.initialStart;
            const newStart = Number(
              Math.max(
                0,
                Math.min(duration - clipDur, draggingClipEdge.initialStart + deltaSeconds)
              ).toFixed(2)
            );
            return {
              ...clip,
              startTime: newStart,
              endTime: Number((newStart + clipDur).toFixed(2)),
            };
          });

        if (draggingClipEdge.trackId === 'video1') {
          onUpdateVideoClips(updateClipList(videoClips));
          if (isVideoAudioLinked) {
            onUpdateAudioClips(updateClipList(audioClips));
          }
        } else if (draggingClipEdge.trackId === 'audio1') {
          onUpdateAudioClips(updateClipList(audioClips));
          if (isVideoAudioLinked) {
            onUpdateVideoClips(updateClipList(videoClips));
          }
        } else if (draggingClipEdge.trackId === 'broll') {
          onUpdateBrollClips(updateClipList(brollClips));
        } else if (draggingClipEdge.trackId === 'video2') {
          onUpdateVideo2Clips(updateClipList(video2Clips));
        } else if (draggingClipEdge.trackId === 'music') {
          onUpdateMusicClips(updateClipList(musicClips));
        }
      }
    };

    const handleWindowPointerUp = () => {
      setIsDraggingPlayhead(false);
      setDraggingClipEdge(null);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [
    isDraggingPlayhead,
    draggingClipEdge,
    duration,
    isVideoAudioLinked,
    videoClips,
    audioClips,
    brollClips,
    video2Clips,
    musicClips,
  ]);

  // ============================================================================
  // PREMIERE PRO RAZOR / SPLIT AT PLAYHEAD (Supports Linked OR Separated Video & Audio!)
  // ============================================================================
  const handleRazorSplitAtPlayhead = () => {
    const cutTime = Number(currentTime.toFixed(2));
    if (cutTime <= 0.12 || cutTime >= duration - 0.12) {
      onShowToast('Move the green playhead inside a clip to split/cut at that timestamp.');
      return;
    }

    const splitClipsArray = (
      clips: TimelineClip[],
      labelPrefix: string
    ): { updated: TimelineClip[]; didSplit: boolean; newRightClipId?: string } => {
      let didSplit = false;
      let newRightClipId: string | undefined;
      const result: TimelineClip[] = [];

      for (const clip of clips) {
        if (cutTime > clip.startTime + 0.15 && cutTime < clip.endTime - 0.15) {
          didSplit = true;
          const elapsedInClip = cutTime - clip.startTime;
          const leftClip: TimelineClip = {
            ...clip,
            id: `${clip.id}-L-${Date.now().toString().slice(-3)}`,
            endTime: cutTime,
          };
          const rightId = `${clip.id}-R-${Date.now().toString().slice(-3)}`;
          newRightClipId = rightId;
          const rightClip: TimelineClip = {
            ...clip,
            id: rightId,
            label: labelPrefix,
            startTime: Number((cutTime + 0.04).toFixed(2)), // Subtle 40ms visual razor seam like Premiere
            endTime: clip.endTime,
            sourceStart: Number((clip.sourceStart + elapsedInClip).toFixed(2)),
          };
          result.push(leftClip, rightClip);
        } else {
          result.push(clip);
        }
      }
      return { updated: result, didSplit, newRightClipId };
    };

    const targetTrack = selectedItem?.trackId;

    if (!isVideoAudioLinked && targetTrack === 'video1') {
      if (tracksConfig.video1.locked) {
        onShowToast('Video 1 track is locked.');
        return;
      }
      const { updated, didSplit, newRightClipId } = splitClipsArray(videoClips, 'Video 1');
      if (didSplit) {
        onUpdateVideoClips(updated);
        if (newRightClipId) {
          setSelectedItem({ type: 'clip', id: newRightClipId, trackId: 'video1' });
        }
        onShowToast(
          `✂️ Cut Video 1 at ${formatRulerMillisecondTime(cutTime)} (Audio 1 kept intact — Separated Mode)`
        );
        return;
      }
    }

    if (!isVideoAudioLinked && targetTrack === 'audio1') {
      if (tracksConfig.audio1.locked) {
        onShowToast('Audio 1 track is locked.');
        return;
      }
      const { updated, didSplit, newRightClipId } = splitClipsArray(audioClips, 'Audio 1');
      if (didSplit) {
        onUpdateAudioClips(updated);
        if (newRightClipId) {
          setSelectedItem({ type: 'clip', id: newRightClipId, trackId: 'audio1' });
        }
        onShowToast(
          `✂️ Cut Audio 1 at ${formatRulerMillisecondTime(cutTime)} (Video 1 kept intact — Separated Mode)`
        );
        return;
      }
    }

    if (targetTrack === 'broll') {
      const { updated, didSplit, newRightClipId } = splitClipsArray(brollClips, 'B-Roll');
      if (didSplit) {
        onUpdateBrollClips(updated);
        if (newRightClipId) {
          setSelectedItem({ type: 'clip', id: newRightClipId, trackId: 'broll' });
        }
        onShowToast(`✂️ Split B-Roll clip at ${formatRulerMillisecondTime(cutTime)}`);
        return;
      }
    }

    if (targetTrack === 'video2') {
      const { updated, didSplit } = splitClipsArray(video2Clips, 'Video 2');
      if (didSplit) {
        onUpdateVideo2Clips(updated);
        onShowToast(`✂️ Split Video 2 overlay at ${formatRulerMillisecondTime(cutTime)}`);
        return;
      }
    }

    if (targetTrack === 'music') {
      const { updated, didSplit } = splitClipsArray(musicClips, 'Music & Whoosh');
      if (didSplit) {
        onUpdateMusicClips(updated);
        onShowToast(`✂️ Split Music & Whoosh track at ${formatRulerMillisecondTime(cutTime)}`);
        return;
      }
    }

    if (targetTrack === 'captions' && activeSegment) {
      onSplitSegmentAtTime(activeSegment.id, cutTime);
      return;
    }

    let anySplit = false;
    if (!tracksConfig.video1.locked) {
      const vRes = splitClipsArray(videoClips, 'Video 1');
      if (vRes.didSplit) {
        onUpdateVideoClips(vRes.updated);
        anySplit = true;
        if (vRes.newRightClipId) {
          setSelectedItem({ type: 'clip', id: vRes.newRightClipId, trackId: 'video1' });
        }
      }
    }

    if (isVideoAudioLinked && !tracksConfig.audio1.locked) {
      const aRes = splitClipsArray(audioClips, 'Audio 1');
      if (aRes.didSplit) {
        onUpdateAudioClips(aRes.updated);
        anySplit = true;
      }
    }

    if (anySplit) {
      onShowToast(
        isVideoAudioLinked
          ? `✂️ Split Video 1 & Audio 1 at ${formatRulerMillisecondTime(cutTime)}`
          : `✂️ Split Video 1 at ${formatRulerMillisecondTime(cutTime)} (Separated from Audio 1)`
      );
    } else if (activeSegment) {
      onSplitSegmentAtTime(activeSegment.id, cutTime);
    }
  };

  // ============================================================================
  // DELETE SELECTED CLIP OR CAPTION WORD / LINE
  // ============================================================================
  const handleDeleteSelected = () => {
    if (!selectedItem) {
      if (activeSegment) {
        onDeleteSegment(activeSegment.id);
        onShowToast('Deleted caption line at playhead');
      }
      return;
    }

    if (
      selectedItem.type === 'caption-word' &&
      selectedItem.segId !== undefined &&
      selectedItem.wordIdx !== undefined
    ) {
      onDeleteWordInSegment(selectedItem.segId, selectedItem.wordIdx);
      setSelectedItem(null);
      return;
    }

    if (selectedItem.type === 'caption-seg') {
      onDeleteSegment(selectedItem.id);
      setSelectedItem(null);
      return;
    }

    if (selectedItem.type === 'clip') {
      if (selectedItem.trackId === 'video1') {
        const targetClip = videoClips.find((c) => c.id === selectedItem.id);
        onUpdateVideoClips(videoClips.filter((c) => c.id !== selectedItem.id));
        if (isVideoAudioLinked && targetClip) {
          onUpdateAudioClips(
            audioClips.filter(
              (a) =>
                !(
                  Math.abs(a.startTime - targetClip.startTime) < 0.15 &&
                  Math.abs(a.endTime - targetClip.endTime) < 0.15
                )
            )
          );
          onShowToast('Deleted split Video 1 + Linked Audio 1 clip segment');
        } else {
          onShowToast('Deleted Video 1 clip segment (Audio 1 preserved!)');
        }
      } else if (selectedItem.trackId === 'audio1') {
        const targetClip = audioClips.find((c) => c.id === selectedItem.id);
        onUpdateAudioClips(audioClips.filter((c) => c.id !== selectedItem.id));
        if (isVideoAudioLinked && targetClip) {
          onUpdateVideoClips(
            videoClips.filter(
              (v) =>
                !(
                  Math.abs(v.startTime - targetClip.startTime) < 0.15 &&
                  Math.abs(v.endTime - targetClip.endTime) < 0.15
                )
            )
          );
          onShowToast('Deleted Audio 1 + Linked Video 1 clip segment');
        } else {
          onShowToast('Deleted Audio 1 clip segment (Video 1 preserved!)');
        }
      } else if (selectedItem.trackId === 'broll') {
        onUpdateBrollClips(brollClips.filter((c) => c.id !== selectedItem.id));
        onShowToast('Removed B-Roll cutaway clip from timeline');
      } else if (selectedItem.trackId === 'video2') {
        onUpdateVideo2Clips(video2Clips.filter((c) => c.id !== selectedItem.id));
        onShowToast('Removed Video 2 overlay clip');
      } else if (selectedItem.trackId === 'music') {
        onUpdateMusicClips(musicClips.filter((c) => c.id !== selectedItem.id));
        onShowToast('Removed Music/Whoosh clip');
      }
      setSelectedItem(null);
    }
  };

  // ============================================================================
  // RIPPLE DELETE (]🗑[ Icon): Deletes selected clip & closes timeline gap!
  // ============================================================================
  const handleRippleDelete = () => {
    if (selectedItem?.type === 'clip') {
      const closeGapInClips = (clips: TimelineClip[], removeId: string): TimelineClip[] => {
        const target = clips.find((c) => c.id === removeId);
        if (!target) return clips;
        const gapDur = target.endTime - target.startTime;
        return clips
          .filter((c) => c.id !== removeId)
          .map((c) =>
            c.startTime >= target.endTime - 0.05
              ? {
                  ...c,
                  startTime: Number(Math.max(0, c.startTime - gapDur).toFixed(2)),
                  endTime: Number(Math.max(0.2, c.endTime - gapDur).toFixed(2)),
                }
              : c
          );
      };

      if (selectedItem.trackId === 'video1') {
        onUpdateVideoClips(closeGapInClips(videoClips, selectedItem.id));
        if (isVideoAudioLinked && audioClips.length > 1) {
          const matchingAudio = audioClips.find((a) =>
            videoClips.some(
              (v) =>
                v.id === selectedItem.id && Math.abs(v.startTime - a.startTime) < 0.2
            )
          );
          if (matchingAudio) {
            onUpdateAudioClips(closeGapInClips(audioClips, matchingAudio.id));
          }
        }
        onShowToast('Ripple-deleted clip & closed gap on timeline!');
        setSelectedItem(null);
        return;
      }

      if (selectedItem.trackId === 'audio1') {
        onUpdateAudioClips(closeGapInClips(audioClips, selectedItem.id));
        onShowToast('Ripple-deleted Audio 1 segment & closed gap!');
        setSelectedItem(null);
        return;
      }
    }

    handleDeleteSelected();
  };

  // Add a B-Roll cutaway clip at the current playhead and un-minimize B-Roll 1 track
  const handleAddBrollClipAtPlayhead = () => {
    const start = Number(Math.max(0, Math.min(duration - 1.5, currentTime)).toFixed(2));
    const end = Number(Math.min(duration, start + 2.4).toFixed(2));
    const activeTxt =
      activeSegment?.tracks[styleConfig.primaryTrack]?.text ||
      activeSegment?.tracks.tinglish?.text ||
      'Cinematic Cutaway';
    const effects = ['zoom-in', 'pan-left', 'ken-burns', 'flash-cut'] as const;
    const chosenEffect = effects[brollClips.length % effects.length];

    const newClip: TimelineClip = {
      id: `broll-${Date.now()}`,
      trackId: 'broll',
      label: `B-Roll: ${activeTxt.slice(0, 18)}`,
      startTime: start,
      endTime: end,
      sourceStart: 0,
      brollPrompt: activeTxt,
      brollEffect: chosenEffect,
      sfxType: 'whoosh',
    };
    onUpdateBrollClips([...brollClips, newClip]);
    onUpdateStyle({ brollEnabled: true });
    onUpdateTracksConfig({
      ...tracksConfig,
      broll: { ...tracksConfig.broll, enabled: true, visible: true },
    });
    if (styleConfig.autoSfxEnabled !== false) {
      playOpenSourceSoundEffect('whoosh', styleConfig.sfxVolume ?? 0.45);
    }
    onShowToast(
      `Added B-Roll Cutaway (${chosenEffect.toUpperCase()}) at ${formatRulerMillisecondTime(start)}!`
    );
  };

  // Show/Restore Video 2 Track & add an overlay clip or open file picker
  const handleEnableAndAddVideo2Track = () => {
    if (video2Clips.length === 0) {
      const start = Number(Math.max(0, Math.min(duration - 2.0, currentTime)).toFixed(2));
      const end = Number(Math.min(duration, start + 3.2).toFixed(2));
      onUpdateVideo2Clips([
        {
          id: `vid2-${Date.now()}`,
          trackId: 'video2',
          label: 'Video 2 Overlay Cutaway',
          startTime: start,
          endTime: Math.max(start + 1.2, end),
          sourceStart: 0,
        },
      ]);
    }
    onUpdateTracksConfig({
      ...tracksConfig,
      video2: { ...tracksConfig.video2, enabled: true, visible: true },
    });
    onShowToast('Enabled Video 2 Track on Timeline! (Click — on track header anytime to minimize)');
  };

  // Add or Restore Music & Whoosh SFX Track with full-density stereo music bed + Whoosh spikes
  const handleAddMusicOrWhooshAtPlayhead = (sfx: SoundEffectType = 'whoosh') => {
    const safeDur = Math.max(2, duration);
    const playheadTime = Number(Math.max(0.15, Math.min(safeDur - 0.2, currentTime)).toFixed(2));

    // Always ensure a full-length Music & Whoosh master bed exists when enabling the track
    if (musicClips.length === 0) {
      const masterMusicClip: TimelineClip = {
        id: `music-bed-master`,
        trackId: 'music',
        label: '🎵 Studio Music Bed + Whoosh Wash SFX',
        startTime: 0,
        endTime: safeDur,
        sourceStart: 0,
        sfxType: sfx,
      };
      onUpdateMusicClips([masterMusicClip]);
    }

    // Also drop a distinct Whoosh / Wash transient spike right at the playhead
    const sfxMeta = OPEN_SOURCE_SFX_LIBRARY.find((s) => s.id === sfx);
    const newWhoosh: WhooshMarker = {
      id: `whoosh-${Date.now()}`,
      time: playheadTime,
      duration: 0.52,
      label: sfxMeta ? sfxMeta.name.toUpperCase() : 'WHOOSH WASH',
      intensity: 0.96,
    };
    setCustomWhooshMarkers((prev) => [...prev, newWhoosh]);

    onUpdateTracksConfig({
      ...tracksConfig,
      music: { ...tracksConfig.music, enabled: true, visible: true },
    });
    playOpenSourceSoundEffect(sfx, styleConfig.sfxVolume ?? 0.5);
    onShowToast(
      `Added ${newWhoosh.label} transient spike at ${formatRulerMillisecondTime(playheadTime)} on Music & Whoosh Track!`
    );
  };

  const toggleTrackProp = (
    trackId: TrackId,
    prop: 'enabled' | 'visible' | 'muted' | 'locked'
  ) => {
    const curr = tracksConfig[trackId];
    const nextVal = !curr[prop];
    onUpdateTracksConfig({
      ...tracksConfig,
      [trackId]: {
        ...curr,
        [prop]: nextVal,
      },
    });
  };

  const minimizeTrack = (trackId: TrackId) => {
    const curr = tracksConfig[trackId];
    onUpdateTracksConfig({
      ...tracksConfig,
      [trackId]: {
        ...curr,
        enabled: false,
      },
    });
    onShowToast(`Minimized "${curr.label}" track — click + ${curr.label} in toolbar to restore anytime.`);
  };

  // Compute millisecond ruler ticks
  const rulerTicks = useMemo(() => {
    const safeDur = Math.max(2, Math.ceil(duration));
    const step = safeDur <= 20 ? 1 : safeDur <= 45 ? 2 : 5;
    const ticks: number[] = [];
    for (let t = 0; t <= safeDur; t += step) {
      ticks.push(t);
    }
    return ticks;
  }, [duration]);

  const activeTrackCount = useMemo(
    () => Object.values(tracksConfig).filter((t) => t.enabled).length,
    [tracksConfig]
  );

  if (isMinimized) {
    return (
      <div className="h-10 shrink-0 bg-[#121316] border-t border-white/[0.08] px-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3 text-xs text-zinc-300">
          <span className="font-semibold text-white">Multi-Track NLE Timeline</span>
          <span className="text-zinc-500">·</span>
          <span className="font-mono tabular-nums text-[#34D399]">
            {formatRulerMillisecondTime(currentTime)} / {formatRulerMillisecondTime(duration)}
          </span>
          <span className="text-zinc-500">·</span>
          <span className="text-[11px] text-zinc-400">
            {activeTrackCount} Active Tracks ({isVideoAudioLinked ? 'Linked' : 'V/A Separated'})
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="px-3 py-1 rounded-lg bg-[#1E2028] hover:bg-[#282B36] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 text-[#34D399]" />
          <span>Expand Timeline</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`${
        isExpandedHeight ? 'h-[350px]' : activeTrackCount > 3 ? 'h-[268px]' : 'h-[218px]'
      } shrink-0 bg-[#111215] border-t border-white/[0.08] flex flex-col select-none transition-all duration-150 relative`}
    >
      {/* Hidden File Inputs for Importing Additional Video 2, Custom B-Roll, or Music Tracks */}
      <input
        ref={secondaryVideoInputRef}
        type="file"
        accept="video/*,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            const url = URL.createObjectURL(f);
            const start = Number(currentTime.toFixed(2));
            const end = Number(Math.min(duration, start + 5.0).toFixed(2));
            onUpdateVideo2Clips([
              ...video2Clips,
              {
                id: `vid2-${Date.now()}`,
                trackId: 'video2',
                label: f.name,
                startTime: start,
                endTime: Math.max(start + 1.5, end),
                sourceStart: 0,
                customMediaUrl: url,
              },
            ]);
            onUpdateTracksConfig({
              ...tracksConfig,
              video2: { ...tracksConfig.video2, enabled: true, visible: true },
            });
            onShowToast(`Imported "${f.name}" onto Video 2 Overlay Track!`);
          }
          e.target.value = '';
        }}
      />
      <input
        ref={customBrollInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            const url = URL.createObjectURL(f);
            const start = Number(currentTime.toFixed(2));
            const end = Number(Math.min(duration, start + 3.0).toFixed(2));
            onUpdateBrollClips([
              ...brollClips,
              {
                id: `broll-custom-${Date.now()}`,
                trackId: 'broll',
                label: f.name,
                startTime: start,
                endTime: Math.max(start + 1.2, end),
                sourceStart: 0,
                brollImageUrl: url,
                brollEffect: 'zoom-in',
              },
            ]);
            onUpdateTracksConfig({
              ...tracksConfig,
              broll: { ...tracksConfig.broll, enabled: true, visible: true },
            });
            onUpdateStyle({ brollEnabled: true });
            onShowToast(`Imported custom B-Roll "${f.name}" onto B-Roll Track!`);
          }
          e.target.value = '';
        }}
      />
      <input
        ref={musicAudioInputRef}
        type="file"
        accept="audio/*,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            const url = URL.createObjectURL(f);
            onUpdateMusicClips([
              ...musicClips,
              {
                id: `bgm-${Date.now()}`,
                trackId: 'music',
                label: `🎵 ${f.name} + Whoosh SFX`,
                startTime: 0,
                endTime: duration,
                sourceStart: 0,
                customMediaUrl: url,
              },
            ]);
            onUpdateTracksConfig({
              ...tracksConfig,
              music: { ...tracksConfig.music, enabled: true, visible: true },
            });
            onShowToast(`Added "${f.name}" to Music & Whoosh SFX Track!`);
          }
          e.target.value = '';
        }}
      />

      {/* =====================================================================
          TOP NLE TIMELINE TOOLBAR (Default 3 Tracks + 1-Click Add/Minimize Optional Tracks)
         ===================================================================== */}
      <div className="h-10 px-3 border-b border-white/[0.07] bg-[#141519] flex items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* WORD | LINE Segmented Pill */}
          <div className="flex items-center bg-[#22242A] p-0.5 rounded-lg border border-white/[0.07]">
            <button
              type="button"
              onClick={() => {
                onChangeGranularity('word');
                onChangeZoom(Math.max(2.6, timelineZoom));
              }}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                timelineGranularity === 'word'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              WORD
            </button>
            <button
              type="button"
              onClick={() => onChangeGranularity('line')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                timelineGranularity === 'line'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              LINE
            </button>
          </div>

          <div className="h-4 w-px bg-white/[0.08] mx-0.5" />

          {/* + Word Button */}
          <button
            type="button"
            onClick={onAddWordOrSegment}
            className="px-2.5 py-1 rounded-lg bg-[#22242A] hover:bg-[#2C2F37] border border-white/[0.07] text-zinc-100 text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
            title="Insert new word or caption at playhead"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Word</span>
          </button>

          {/* Merge / Group Caption Line Icon */}
          <button
            type="button"
            onClick={() => {
              if (activeSegment) {
                onMergeSegmentWithNext(activeSegment.id);
              }
            }}
            title="Merge current caption line with next line"
            className="p-1.5 rounded-lg hover:bg-white/[0.07] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <Combine className="w-3.5 h-3.5" />
          </button>

          {/* Nudge Left (←) */}
          <button
            type="button"
            onClick={() => {
              if (activeSegment) {
                onNudgeSegmentTiming(activeSegment.id, -0.1);
              } else {
                onSeekTo(Math.max(0, currentTime - 0.5));
              }
            }}
            title="Nudge timing earlier (-0.10s)"
            className="p-1.5 rounded-lg hover:bg-white/[0.07] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          {/* Nudge Right (→) */}
          <button
            type="button"
            onClick={() => {
              if (activeSegment) {
                onNudgeSegmentTiming(activeSegment.id, 0.1);
              } else {
                onSeekTo(Math.min(duration, currentTime + 0.5));
              }
            }}
            title="Nudge timing later (+0.10s)"
            className="p-1.5 rounded-lg hover:bg-white/[0.07] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Person / Place Caption Behind Subject (Depth Mask ON/OFF) */}
          <button
            type="button"
            onClick={() => {
              const nextDepth = !styleConfig.captionDepthBehindSubject;
              onUpdateStyle({
                captionDepthBehindSubject: nextDepth,
                positionY: nextDepth ? 30 : 68,
              });
              onShowToast(
                nextDepth
                  ? '✨ Placed Caption Behind Subject (Depth Mask ON — Auto Behind-Head Cutout Active!)'
                  : 'Caption Depth Mask OFF (Standard Foreground Layer)'
              );
            }}
            title="Place caption behind subject's head (Real-Time AI Depth Mask ON/OFF)"
            className={`px-2 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              styleConfig.captionDepthBehindSubject
                ? 'bg-[#152E23] border-[#34D399]/60 text-[#34D399]'
                : 'bg-[#1C1E24] border-white/[0.07] text-zinc-300 hover:text-white'
            }`}
          >
            <PersonStanding className="w-3.5 h-3.5" />
            <span>{styleConfig.captionDepthBehindSubject ? 'Behind Head: ON' : 'Behind Head'}</span>
          </button>

          {/* Delete Selected Clip / Word / Line (Trash) */}
          <button
            type="button"
            onClick={handleDeleteSelected}
            title="Delete selected video cut, audio cut, B-roll, or caption word"
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-white/[0.08] mx-0.5" />

          {/* ✂️ RAZOR / SPLIT AT PLAYHEAD */}
          <button
            type="button"
            onClick={handleRazorSplitAtPlayhead}
            title="Razor Cut / Split clip at playhead"
            className="px-2 py-1 rounded-lg bg-[#1F242D] hover:bg-[#2B323F] border border-sky-500/30 text-sky-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold">Cut</span>
          </button>

          {/* ]🗑[ RIPPLE DELETE / TRIM GAP */}
          <button
            type="button"
            onClick={handleRippleDelete}
            title="Ripple Delete: Remove selected clip segment and close gap"
            className="px-1.5 py-1 rounded-lg hover:bg-white/[0.07] text-zinc-400 hover:text-white font-mono text-[10px] flex items-center gap-0.5 transition-colors cursor-pointer shrink-0"
          >
            <span>]</span>
            <Trash2 className="w-3 h-3" />
            <span>[</span>
          </button>

          {/* Magnet Snap Toggle */}
          <button
            type="button"
            onClick={() => {
              setSnapEnabled((s) => !s);
              onShowToast(!snapEnabled ? 'Timeline Magnetic Snapping ON' : 'Magnetic Snapping OFF');
            }}
            title="Toggle Magnetic Snapping"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              snapEnabled ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>

          {/* LINK / UNLINK VIDEO & AUDIO */}
          <button
            type="button"
            onClick={onToggleVideoAudioLinked}
            title={
              isVideoAudioLinked
                ? 'Click to Separate (Unlink) Video 1 and Audio 1'
                : 'Video 1 & Audio 1 are Separated! Click to re-link them'
            }
            className={`px-2 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              !isVideoAudioLinked
                ? 'bg-amber-500/15 border-amber-400/50 text-amber-300'
                : 'bg-[#1B222C] border-white/[0.08] text-zinc-300 hover:text-white'
            }`}
          >
            {isVideoAudioLinked ? (
              <>
                <Link2 className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Linked</span>
              </>
            ) : (
              <>
                <Unlink2 className="w-3.5 h-3.5 text-amber-400" />
                <span>V/A Separated</span>
              </>
            )}
          </button>

          <div className="h-4 w-px bg-white/[0.08] mx-0.5" />

          {/* 1-CLICK ADD / UN-MINIMIZE OPTIONAL TRACKS (B-Roll 1, Video 2, Music & Whoosh) */}
          <button
            type="button"
            onClick={handleAddBrollClipAtPlayhead}
            className={`px-2 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1 cursor-pointer shrink-0 ${
              tracksConfig.broll.enabled
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                : 'bg-[#181B22] hover:bg-[#222630] border-amber-500/30 text-amber-300'
            }`}
            title="Show B-Roll 1 Track & Add Cutaway Clip at Playhead"
          >
            <Sparkles className="w-3 h-3" />
            <span>+ B-Roll</span>
          </button>

          <button
            type="button"
            onClick={handleEnableAndAddVideo2Track}
            className={`px-2 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1 cursor-pointer shrink-0 ${
              tracksConfig.video2.enabled
                ? 'bg-purple-500/20 border-purple-400/50 text-purple-200'
                : 'bg-[#181B22] hover:bg-[#222630] border-purple-500/30 text-purple-300'
            }`}
            title="Show Video 2 Overlay Track (Minimize anytime when not required)"
          >
            <Film className="w-3 h-3" />
            <span>+ Video 2</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddMusicOrWhooshAtPlayhead('whoosh')}
            className={`px-2 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1 cursor-pointer shrink-0 ${
              tracksConfig.music.enabled
                ? 'bg-indigo-500/25 border-indigo-400/60 text-indigo-200'
                : 'bg-[#181B22] hover:bg-[#222630] border-indigo-500/35 text-indigo-300'
            }`}
            title="Show Music & Whoosh SFX Track with high-density wavelengths & Whoosh spikes"
          >
            <Wind className="w-3 h-3 text-amber-300" />
            <span>+ Music &amp; Whoosh</span>
          </button>

          {/* Restore pills if user minimized any of the 3 core tracks (Captions, Video 1, Audio 1) */}
          {(!tracksConfig.captions.enabled ||
            !tracksConfig.video1.enabled ||
            !tracksConfig.audio1.enabled) && (
            <button
              type="button"
              onClick={() =>
                onUpdateTracksConfig({
                  ...tracksConfig,
                  captions: { ...tracksConfig.captions, enabled: true },
                  video1: { ...tracksConfig.video1, enabled: true },
                  audio1: { ...tracksConfig.audio1, enabled: true },
                })
              }
              className="px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-semibold cursor-pointer shrink-0"
              title="Restore default Captions, Video 1 & Audio 1 tracks"
            >
              Restore Core Tracks
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowTrackSelectorMenu((v) => !v)}
            className={`px-2 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1 cursor-pointer shrink-0 ${
              showTrackSelectorMenu
                ? 'bg-white text-zinc-950 border-white'
                : 'bg-[#22242A] hover:bg-[#2B2E36] border-white/[0.08] text-zinc-200'
            }`}
            title="Manage Visible & Minimized Tracks"
          >
            <Layers className="w-3 h-3" />
            <span>Tracks ({activeTrackCount})</span>
          </button>
        </div>

        {/* Right Zoom Slider & Expand/Minimize Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChangeZoom(Math.max(1, Number((timelineZoom - 0.5).toFixed(1))))}
            className="text-zinc-400 hover:text-white cursor-pointer p-1"
            title="Zoom Out Timeline"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min={1}
            max={8}
            step={0.2}
            value={timelineZoom}
            onChange={(e) => onChangeZoom(parseFloat(e.target.value))}
            className="w-24 accent-[#2BAE66] cursor-pointer h-1.5 bg-[#1F3A2D] rounded-lg"
          />

          <button
            type="button"
            onClick={() => onChangeZoom(Math.min(8, Number((timelineZoom + 0.5).toFixed(1))))}
            className="text-zinc-400 hover:text-white cursor-pointer p-1"
            title="Zoom In Timeline"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-white/[0.08] mx-0.5" />

          <button
            type="button"
            onClick={() => setIsExpandedHeight((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-white/[0.07] text-zinc-400 hover:text-white cursor-pointer"
            title={isExpandedHeight ? 'Restore Standard Timeline Height' : 'Expand Multi-Track View'}
          >
            {isExpandedHeight ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* =====================================================================
          MULTI-TRACK MANAGER POPOVER (Show/Minimize Tracks & Reset to 3 Default Tracks)
         ===================================================================== */}
      {showTrackSelectorMenu && (
        <div className="absolute top-11 left-72 z-50 w-80 bg-[#181920] border border-white/15 rounded-2xl p-3.5 shadow-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <span className="font-bold text-white block">Track Visibility Manager</span>
              <span className="text-[10px] text-zinc-400">
                Uncheck or click – on any track to minimize it
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowTrackSelectorMenu(false)}
              className="text-zinc-400 hover:text-white cursor-pointer text-[11px] font-semibold"
            >
              Done
            </button>
          </div>

          <div className="space-y-1.5">
            {(Object.keys(tracksConfig) as TrackId[]).map((tId) => {
              const tr = tracksConfig[tId];
              const isCore = tId === 'captions' || tId === 'video1' || tId === 'audio1';
              return (
                <div
                  key={tId}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#111217] border border-white/[0.06]"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tr.enabled}
                      onChange={() => toggleTrackProp(tId, 'enabled')}
                      className="accent-[#2BAE66] rounded cursor-pointer"
                    />
                    <span className="font-semibold text-zinc-200">{tr.label}</span>
                    {isCore && (
                      <span className="text-[9px] text-emerald-400/80 font-mono">DEFAULT</span>
                    )}
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleTrackProp(tId, 'visible')}
                      className={`p-1 rounded cursor-pointer ${
                        tr.visible ? 'text-[#34D399]' : 'text-zinc-600'
                      }`}
                      title="Toggle Canvas Visibility"
                    >
                      {tr.visible ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTrackProp(tId, 'muted')}
                      className={`p-1 rounded cursor-pointer ${
                        tr.muted ? 'text-rose-400' : 'text-zinc-400'
                      }`}
                      title="Mute Track"
                    >
                      {tr.muted ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTrackProp(tId, 'locked')}
                      className={`p-1 rounded cursor-pointer ${
                        tr.locked ? 'text-amber-400' : 'text-zinc-500'
                      }`}
                      title="Lock Track"
                    >
                      {tr.locked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                onUpdateTracksConfig({
                  captions: { ...tracksConfig.captions, enabled: true, visible: true },
                  video1: { ...tracksConfig.video1, enabled: true, visible: true },
                  audio1: { ...tracksConfig.audio1, enabled: true, visible: true },
                  broll: { ...tracksConfig.broll, enabled: false },
                  video2: { ...tracksConfig.video2, enabled: false },
                  music: { ...tracksConfig.music, enabled: false },
                });
                onShowToast('Reset to 3 Default Tracks: Captions, Video 1, and Audio 1');
                setShowTrackSelectorMenu(false);
              }}
              className="text-[11px] text-amber-300 hover:underline font-semibold cursor-pointer"
            >
              Reset to 3 Default Tracks Only
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                onGenerateAiBroll();
                onUpdateTracksConfig({
                  ...tracksConfig,
                  broll: { ...tracksConfig.broll, enabled: true, visible: true },
                });
                setShowTrackSelectorMenu(false);
              }}
              className="py-1.5 px-2.5 rounded-lg bg-[#152E23] text-[#34D399] font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
            >
              <Wand2 className="w-3 h-3" />
              <span>Auto AI B-Rolls</span>
            </button>
            <button
              type="button"
              onClick={() => {
                customBrollInputRef.current?.click();
                setShowTrackSelectorMenu(false);
              }}
              className="py-1.5 px-2.5 rounded-lg bg-white/10 text-white font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>Import B-Roll</span>
            </button>
            <button
              type="button"
              onClick={() => {
                secondaryVideoInputRef.current?.click();
                setShowTrackSelectorMenu(false);
              }}
              className="py-1.5 px-2.5 rounded-lg bg-sky-500/20 text-sky-300 font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
            >
              <Video className="w-3 h-3" />
              <span>+ Video 2 Clip</span>
            </button>
            <button
              type="button"
              onClick={() => {
                musicAudioInputRef.current?.click();
                setShowTrackSelectorMenu(false);
              }}
              className="py-1.5 px-2.5 rounded-lg bg-purple-500/20 text-purple-300 font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
            >
              <Music className="w-3 h-3" />
              <span>+ Import Music</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MAIN TIMELINE BODY: Left Track Headers + Right Millisecond Canvas
         ===================================================================== */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT COLUMN: TRACK HEADERS (With 1-Click Minimize "–" Button on Every Track!) */}
        <div className="w-40 shrink-0 bg-[#141519] border-r border-white/[0.07] flex flex-col">
          {/* Top-left corner spacer matching ruler height */}
          <div className="h-7 border-b border-white/[0.06] px-2.5 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <span>TRACKS ({activeTrackCount})</span>
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="text-zinc-400 hover:text-white cursor-pointer"
              title="Minimize Entire Timeline Dock"
            >
              ▾
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05]">
            {/* Track Header 1: Captions (Default Track #1) */}
            {tracksConfig.captions.enabled && (
              <div className="h-11 px-2.5 flex items-center justify-between hover:bg-white/[0.02]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-serif italic font-bold text-[#D4A853] text-xs">I</span>
                  <span className="text-[11px] font-medium text-zinc-200 truncate">Captions</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleTrackProp('captions', 'visible')}
                    title={tracksConfig.captions.visible ? 'Hide Captions on Video' : 'Show Captions'}
                    className={`p-1 rounded cursor-pointer ${
                      tracksConfig.captions.visible ? 'text-zinc-400 hover:text-white' : 'text-rose-400'
                    }`}
                  >
                    {tracksConfig.captions.visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTrackProp('captions', 'locked')}
                    className={`p-1 rounded cursor-pointer ${
                      tracksConfig.captions.locked ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                    title="Lock Captions Track"
                  >
                    {tracksConfig.captions.locked ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => minimizeTrack('captions')}
                    title="Minimize / Hide Captions Track from Timeline"
                    className="p-1 rounded text-zinc-500 hover:text-rose-300 hover:bg-white/[0.06] cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Track Header 2: B-Roll 1 Track (Optional — Minimize when not required!) */}
            {tracksConfig.broll.enabled && (
              <div className="h-10 px-2.5 flex items-center justify-between hover:bg-white/[0.02] bg-amber-500/[0.03]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-medium text-amber-200 truncate">B-Roll 1</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={handleAddBrollClipAtPlayhead}
                    title="Add B-Roll cutaway at playhead"
                    className="p-0.5 rounded bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toggleTrackProp('broll', 'visible');
                      onUpdateStyle({ brollEnabled: !tracksConfig.broll.visible });
                    }}
                    title="Toggle B-Roll Visibility on Canvas"
                    className={`p-1 rounded cursor-pointer ${
                      tracksConfig.broll.visible ? 'text-[#34D399]' : 'text-zinc-600'
                    }`}
                  >
                    {tracksConfig.broll.visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => minimizeTrack('broll')}
                    title="Minimize B-Roll 1 Track (Hide from timeline)"
                    className="p-1 rounded text-zinc-400 hover:text-rose-300 hover:bg-white/[0.06] cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Track Header 3: Video 2 Track (Optional — Minimize when not required!) */}
            {tracksConfig.video2.enabled && (
              <div className="h-10 px-2.5 flex items-center justify-between hover:bg-white/[0.02] bg-purple-500/[0.03]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Film className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="text-[11px] font-medium text-purple-200 truncate">Video 2</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => secondaryVideoInputRef.current?.click()}
                    title="Import overlay video clip onto Video 2"
                    className="p-0.5 rounded bg-purple-500/15 text-purple-300 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTrackProp('video2', 'visible')}
                    title="Toggle Video 2 Visibility"
                    className={`p-1 rounded cursor-pointer ${
                      tracksConfig.video2.visible ? 'text-purple-300' : 'text-zinc-600'
                    }`}
                  >
                    {tracksConfig.video2.visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => minimizeTrack('video2')}
                    title="Minimize Video 2 Track (Hide from timeline)"
                    className="p-1 rounded text-zinc-400 hover:text-rose-300 hover:bg-white/[0.06] cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Track Header 4: Video 1 (Default Track #2 — Main Reel with Aspect Badge) */}
            {tracksConfig.video1.enabled && (
              <div className="h-14 px-2.5 flex items-center justify-between hover:bg-white/[0.02]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Video className="w-3.5 h-3.5 text-[#0EA5E9] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium text-zinc-200 block truncate leading-tight">
                      Video 1
                    </span>
                    <span className="text-[8px] font-mono text-[#38BDF8] block truncate leading-none mt-0.5">
                      {effectiveAspect} ORIGINAL
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleTrackProp('video1', 'visible')}
                    title="Toggle Video 1 Visibility"
                    className={`p-1 rounded cursor-pointer ${
                      tracksConfig.video1.visible ? 'text-zinc-400 hover:text-white' : 'text-rose-400'
                    }`}
                  >
                    {tracksConfig.video1.visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTrackProp('video1', 'locked')}
                    className={`p-1 rounded cursor-pointer ${
                      tracksConfig.video1.locked ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                    title="Lock Video 1 Track"
                  >
                    {tracksConfig.video1.locked ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => minimizeTrack('video1')}
                    title="Minimize Video 1 Track (Use when editing Video 2 or Audio only)"
                    className="p-1 rounded text-zinc-500 hover:text-rose-300 hover:bg-white/[0.06] cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Track Header 5: Audio 1 (Default Track #3 — High-Density Dialogue Waveform) */}
            {tracksConfig.audio1.enabled && (
              <div className="h-12 px-2.5 flex items-center justify-between hover:bg-white/[0.02]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#2BAE66] font-bold text-xs leading-none">〰</span>
                  <span className="text-[11px] font-medium text-zinc-200 truncate">Audio 1</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleTrackProp('audio1', 'muted')}
                    title={tracksConfig.audio1.muted ? 'Unmute Audio 1' : 'Mute Audio 1'}
                    className={`p-1 rounded cursor-pointer ${
                      tracksConfig.audio1.muted ? 'text-rose-400' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tracksConfig.audio1.muted ? (
                      <VolumeX className="w-3 h-3" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTrackProp('audio1', 'locked')}
                    className={`p-1 rounded cursor-pointer ${
                      tracksConfig.audio1.locked ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                    title="Lock Audio 1 Track"
                  >
                    {tracksConfig.audio1.locked ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => minimizeTrack('audio1')}
                    title="Minimize Audio 1 Track"
                    className="p-1 rounded text-zinc-500 hover:text-rose-300 hover:bg-white/[0.06] cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Track Header 6: Music & Whoosh SFX Track (Detailed Wavelengths + Whoosh Envelopes) */}
            {tracksConfig.music.enabled && (
              <div className="h-12 px-2.5 flex items-center justify-between hover:bg-white/[0.02] bg-indigo-500/[0.04]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Wind className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-indigo-200 block truncate leading-tight">
                      Music &amp; Whoosh
                    </span>
                    <span className="text-[8px] font-mono text-amber-300/90 block truncate leading-none">
                      WAVELENGTH + SFX
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleAddMusicOrWhooshAtPlayhead('whoosh')}
                    title="Drop Whoosh / Wash SFX Spike at Playhead"
                    className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[9px] font-bold cursor-pointer"
                  >
                    +Whoosh
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTrackProp('music', 'muted')}
                    className={`p-1 rounded cursor-pointer ${
                      tracksConfig.music.muted ? 'text-rose-400' : 'text-zinc-400'
                    }`}
                    title="Mute Music & Whoosh Track"
                  >
                    {tracksConfig.music.muted ? (
                      <VolumeX className="w-3 h-3" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => minimizeTrack('music')}
                    title="Minimize Music & Whoosh Track (Hide from timeline)"
                    className="p-1 rounded text-zinc-400 hover:text-rose-300 hover:bg-white/[0.06] cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================
            RIGHT SCROLLABLE & ZOOMABLE MULTI-TRACK TIMELINE CANVAS
           =================================================================== */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#0E0F12]"
        >
          <div
            ref={innerTrackCanvasRef}
            style={{ width: `${Math.max(100, timelineZoom * 100)}%` }}
            className="min-h-full flex flex-col relative"
          >
            {/* Vertical Second Grid Lines Across All Tracks */}
            <div className="pointer-events-none absolute inset-0 z-0">
              {rulerTicks.map((t) => {
                const leftPct = (t / Math.max(0.1, duration)) * 100;
                if (leftPct > 99.8) return null;
                return (
                  <div
                    key={t}
                    style={{ left: `${leftPct}%` }}
                    className="absolute top-0 bottom-0 w-px bg-white/[0.04]"
                  />
                );
              })}
            </div>

            {/* MILLISECOND TIME RULER ROW (e.g. 00:01.000, 00:02.000, 00:03.000) */}
            <div
              onPointerDown={(e) => {
                setIsDraggingPlayhead(true);
                onSeekTo(clientXToSeconds(e.clientX));
              }}
              className="h-7 border-b border-white/[0.07] bg-[#141519]/90 relative cursor-ew-resize shrink-0 z-10"
            >
              {rulerTicks.map((t) => {
                const leftPct = (t / Math.max(0.1, duration)) * 100;
                if (leftPct > 98) return null;
                return (
                  <span
                    key={t}
                    style={{ left: `${leftPct}%` }}
                    className="absolute top-1.5 -translate-x-1/2 text-[10px] font-mono tabular-nums text-zinc-400 select-none"
                  >
                    {formatRulerMillisecondTime(t)}
                  </span>
                );
              })}
            </div>

            {/* EMERALD-GREEN PLAYHEAD LINE WITH PENTAGON HEAD */}
            <div
              style={{
                left: `${Math.min(
                  99.6,
                  Math.max(0.1, (currentTime / Math.max(0.1, duration)) * 100)
                )}%`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsDraggingPlayhead(true);
              }}
              className="absolute top-0 bottom-0 z-40 flex flex-col items-center -translate-x-1/2 cursor-ew-resize"
            >
              <div
                className="w-3.5 h-4 bg-[#2BAE66] shadow-md"
                style={{
                  clipPath: 'polygon(0% 0%, 100% 0%, 100% 65%, 50% 100%, 0% 65%)',
                }}
              />
              <div className="w-[2px] flex-1 bg-[#2BAE66] shadow-[0_0_8px_rgba(43,174,102,0.8)]" />
            </div>

            {/* TRACK ROWS CONTAINER */}
            <div className="flex-1 divide-y divide-white/[0.05] relative z-10">
              {/* =============================================================
                  ROW 1: CAPTIONS TRACK (Olive/Gold 2-Row Cards: Word + "I Text")
                 ============================================================= */}
              {tracksConfig.captions.enabled && (
                <div
                  className={`relative h-11 bg-[#121317] ${
                    !tracksConfig.captions.visible ? 'opacity-40' : ''
                  }`}
                >
                  {timelineGranularity === 'word'
                    ? allTimedWords.map((item, wIdx) => {
                        const safeDur = Math.max(0.1, duration);
                        const leftPct = Math.max(0, (item.startTime / safeDur) * 100);
                        const nextStart =
                          wIdx < allTimedWords.length - 1
                            ? allTimedWords[wIdx + 1].startTime
                            : safeDur;
                        const clampedEnd = Math.min(item.endTime, nextStart);
                        const widthPct = Math.max(
                          0.45,
                          ((clampedEnd - item.startTime) / safeDur) * 100 - 0.1
                        );
                        const isCurrent =
                          currentTime >= item.startTime && currentTime <= item.endTime;
                        const isSelected =
                          selectedItem?.type === 'caption-word' && selectedItem.id === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            title={`${item.word} (${formatRulerMillisecondTime(
                              item.startTime
                            )} – ${formatRulerMillisecondTime(item.endTime)})`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem({
                                type: 'caption-word',
                                id: item.id,
                                trackId: 'captions',
                                segId: item.segId,
                                wordIdx: item.wordIdx,
                              });
                              onSeekTo(item.startTime + 0.02);
                            }}
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            className={`absolute top-1 bottom-1 rounded-md px-1.5 flex flex-col justify-between text-left overflow-hidden transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#9E8B56] border-2 border-white z-20 shadow-md'
                                : isCurrent
                                ? 'bg-[#8F7D4C] border-2 border-[#2BAE66] z-10'
                                : 'bg-[#7D6E44]/90 hover:bg-[#8C7B4D] border border-[#A3905B]/50'
                            }`}
                          >
                            <span className="text-[10px] font-bold text-white truncate leading-tight">
                              {item.word}
                            </span>
                            <span className="text-[9px] text-amber-100/80 truncate leading-none flex items-center gap-1">
                              <span className="font-serif italic font-bold">I</span>
                              <span>Text</span>
                            </span>
                          </button>
                        );
                      })
                    : segments.map((seg, idx) => {
                        const safeDur = Math.max(0.1, duration);
                        const leftPct = Math.max(0, (seg.startTime / safeDur) * 100);
                        const nextSegStart =
                          idx < segments.length - 1 ? segments[idx + 1].startTime : safeDur;
                        const clampedEnd = Math.min(seg.endTime, nextSegStart);
                        const widthPct = Math.max(
                          0.7,
                          ((clampedEnd - seg.startTime) / safeDur) * 100 - 0.12
                        );
                        const isCurrent =
                          currentTime >= seg.startTime && currentTime <= seg.endTime;
                        const isSelected =
                          selectedItem?.type === 'caption-seg' && selectedItem.id === seg.id;
                        const txt =
                          seg.tracks[styleConfig.primaryTrack]?.text ||
                          seg.tracks.tinglish?.text ||
                          seg.tracks.english?.text ||
                          '';

                        return (
                          <button
                            key={seg.id}
                            type="button"
                            title={`${txt} (${formatRulerMillisecondTime(
                              seg.startTime
                            )} – ${formatRulerMillisecondTime(seg.endTime)})`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem({
                                type: 'caption-seg',
                                id: seg.id,
                                trackId: 'captions',
                                segId: seg.id,
                              });
                              onSeekTo(seg.startTime + 0.03);
                            }}
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            className={`absolute top-1 bottom-1 rounded-md px-2 flex flex-col justify-between text-left overflow-hidden transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#9E8B56] border-2 border-white z-20 shadow-md'
                                : isCurrent
                                ? 'bg-[#8F7D4C] border-2 border-[#2BAE66] z-10'
                                : 'bg-[#7D6E44]/90 hover:bg-[#8C7B4D] border border-[#A3905B]/50'
                            }`}
                          >
                            <span className="text-[10px] font-bold text-white truncate leading-tight">
                              {txt}
                            </span>
                            <span className="text-[9px] text-amber-100/80 truncate leading-none flex items-center gap-1">
                              <span className="font-serif italic font-bold">I</span>
                              <span>Text</span>
                            </span>
                          </button>
                        );
                      })}
                </div>
              )}

              {/* =============================================================
                  ROW 2: B-ROLL 1 TRACK (Optional — Minimized by default)
                 ============================================================= */}
              {tracksConfig.broll.enabled && (
                <div
                  className={`relative h-10 bg-[#14131A] ${
                    !tracksConfig.broll.visible ? 'opacity-40' : ''
                  }`}
                >
                  {brollClips.length === 0 ? (
                    <div className="h-full flex items-center justify-between px-3 text-[10px] text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span>B-Roll 1 Track Active —</span>
                        <button
                          type="button"
                          onClick={handleAddBrollClipAtPlayhead}
                          className="text-amber-300 hover:underline font-semibold cursor-pointer"
                        >
                          + Add B-Roll at Playhead
                        </button>
                        <span>or</span>
                        <button
                          type="button"
                          onClick={onGenerateAiBroll}
                          className="text-[#34D399] hover:underline font-semibold cursor-pointer"
                        >
                          Auto-Generate AI B-Rolls
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => minimizeTrack('broll')}
                        className="text-zinc-500 hover:text-zinc-300 text-[10px] cursor-pointer"
                      >
                        Minimize Track (–)
                      </button>
                    </div>
                  ) : (
                    brollClips.map((clip) => {
                      const safeDur = Math.max(0.1, duration);
                      const leftPct = Math.max(0, (clip.startTime / safeDur) * 100);
                      const widthPct = Math.max(
                        1.2,
                        ((clip.endTime - clip.startTime) / safeDur) * 100
                      );
                      const isSelected =
                        selectedItem?.type === 'clip' && selectedItem.id === clip.id;

                      return (
                        <div
                          key={clip.id}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem({
                              type: 'clip',
                              id: clip.id,
                              trackId: 'broll',
                            });
                            onSeekTo(clip.startTime + 0.05);
                          }}
                          className={`absolute top-1 bottom-1 rounded-md overflow-hidden flex items-center justify-between px-2 cursor-pointer select-none ${
                            isSelected
                              ? 'bg-amber-500/35 border-2 border-white z-20'
                              : 'bg-gradient-to-r from-amber-600/30 via-orange-500/25 to-amber-700/30 border border-amber-400/60 hover:border-amber-300'
                          }`}
                        >
                          <div
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setDraggingClipEdge({
                                clipId: clip.id,
                                trackId: 'broll',
                                edge: 'start',
                                initialX: e.clientX,
                                initialStart: clip.startTime,
                                initialEnd: clip.endTime,
                              });
                            }}
                            className="w-1.5 h-full -ml-2 cursor-ew-resize bg-amber-300/40 hover:bg-white shrink-0"
                          />
                          <div className="truncate text-[10px] font-semibold text-amber-100 flex items-center gap-1">
                            <span>🎬</span>
                            <span className="truncate">{clip.label}</span>
                            {clip.brollEffect && (
                              <span className="text-[8px] px-1 rounded bg-black/40 text-amber-300 uppercase">
                                {clip.brollEffect}
                              </span>
                            )}
                          </div>
                          <div
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setDraggingClipEdge({
                                clipId: clip.id,
                                trackId: 'broll',
                                edge: 'end',
                                initialX: e.clientX,
                                initialStart: clip.startTime,
                                initialEnd: clip.endTime,
                              });
                            }}
                            className="w-1.5 h-full -mr-2 cursor-ew-resize bg-amber-300/40 hover:bg-white shrink-0"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* =============================================================
                  ROW 3: VIDEO 2 OVERLAY TRACK (Optional — Minimized by default)
                 ============================================================= */}
              {tracksConfig.video2.enabled && (
                <div
                  className={`relative h-10 bg-[#14121B] ${
                    !tracksConfig.video2.visible ? 'opacity-40' : ''
                  }`}
                >
                  {video2Clips.length === 0 ? (
                    <div className="h-full flex items-center justify-between px-3 text-[10px] text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span>Video 2 Overlay Track —</span>
                        <button
                          type="button"
                          onClick={() => secondaryVideoInputRef.current?.click()}
                          className="text-purple-300 hover:underline font-semibold cursor-pointer"
                        >
                          + Import Video / PIP Clip
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => minimizeTrack('video2')}
                        className="text-zinc-500 hover:text-zinc-300 text-[10px] cursor-pointer"
                      >
                        Minimize Track (–)
                      </button>
                    </div>
                  ) : (
                    video2Clips.map((clip) => {
                      const safeDur = Math.max(0.1, duration);
                      const leftPct = (clip.startTime / safeDur) * 100;
                      const widthPct = Math.max(
                        1.5,
                        ((clip.endTime - clip.startTime) / safeDur) * 100
                      );
                      const isSelected =
                        selectedItem?.type === 'clip' && selectedItem.id === clip.id;
                      return (
                        <div
                          key={clip.id}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem({
                              type: 'clip',
                              id: clip.id,
                              trackId: 'video2',
                            });
                          }}
                          className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-purple-500/40 border-2 border-white z-20'
                              : 'bg-purple-600/25 border border-purple-400/60'
                          }`}
                        >
                          <div
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setDraggingClipEdge({
                                clipId: clip.id,
                                trackId: 'video2',
                                edge: 'start',
                                initialX: e.clientX,
                                initialStart: clip.startTime,
                                initialEnd: clip.endTime,
                              });
                            }}
                            className="w-1.5 h-full -ml-2 cursor-ew-resize bg-purple-300/40 hover:bg-white shrink-0"
                          />
                          <span className="text-[10px] font-semibold text-purple-100 truncate">
                            📹 {clip.label}
                          </span>
                          <div
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setDraggingClipEdge({
                                clipId: clip.id,
                                trackId: 'video2',
                                edge: 'end',
                                initialX: e.clientX,
                                initialStart: clip.startTime,
                                initialEnd: clip.endTime,
                              });
                            }}
                            className="w-1.5 h-full -mr-2 cursor-ew-resize bg-purple-300/40 hover:bg-white shrink-0"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* =============================================================
                  ROW 4: VIDEO 1 TRACK (Default Track #2 — Second-by-Second Original Aspect Filmstrip)
                 ============================================================= */}
              {tracksConfig.video1.enabled && (
                <div
                  onClick={(e) => {
                    onSeekTo(clientXToSeconds(e.clientX));
                  }}
                  onPointerMove={(e) => {
                    const sec = clientXToSeconds(e.clientX);
                    const pct = Math.max(2, Math.min(98, (sec / Math.max(0.1, duration)) * 100));
                    setHoverPreviewState({ time: sec, leftPct: pct });
                  }}
                  onPointerLeave={() => setHoverPreviewState(null)}
                  className={`relative h-14 bg-[#101216] cursor-pointer ${
                    !tracksConfig.video1.visible ? 'opacity-40' : ''
                  }`}
                >
                  {/* Floating Second-by-Second Original Video Frame Preview Monitor on Hover/Scrub */}
                  {hoverPreviewState && (
                    <div
                      style={{ left: `${hoverPreviewState.leftPct}%` }}
                      className="absolute -top-[108px] -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center"
                    >
                      <div
                        className={`rounded-lg overflow-hidden border-2 border-[#0EA5E9] bg-[#07090E] shadow-2xl flex items-center justify-center relative ${
                          effectiveAspect === '9:16'
                            ? 'w-[54px] h-[92px]'
                            : effectiveAspect === '16:9'
                              ? 'w-[128px] h-[72px]'
                              : 'w-[76px] h-[76px]'
                        }`}
                      >
                        {(() => {
                          const frameObj = getFrameForSecond(hoverPreviewState.time);
                          if (frameObj) {
                            return (
                              <img
                                src={frameObj.dataUrl}
                                alt=""
                                className="w-full h-full object-contain"
                              />
                            );
                          }
                          return (
                            <div className="w-full h-full bg-gradient-to-b from-[#33271F] via-[#1E1917] to-[#121010] flex flex-col items-center justify-center">
                              <span className="text-[9px] font-mono text-sky-300 font-bold">
                                {effectiveAspect}
                              </span>
                            </div>
                          );
                        })()}
                        <span className="absolute bottom-0.5 inset-x-0.5 text-center bg-black/80 rounded text-[8px] font-mono font-bold text-[#38BDF8] py-0.2">
                          {hoverPreviewState.time.toFixed(2)}s
                        </span>
                      </div>
                    </div>
                  )}

                  {videoClips.map((clip) => {
                    const safeDur = Math.max(0.1, duration);
                    const clipDur = Math.max(0.1, clip.endTime - clip.startTime);
                    const leftPct = Math.max(0, (clip.startTime / safeDur) * 100);
                    const widthPct = Math.max(0.8, (clipDur / safeDur) * 100);
                    const isSelected =
                      selectedItem?.type === 'clip' && selectedItem.id === clip.id;

                    // Create 1 tile per second (or proportional to zoom & aspect ratio) so moving second-by-second shows every second's original frame!
                    const baseTilesBySec = Math.ceil(clipDur);
                    const maxTiles = effectiveAspect === '9:16' ? 28 : 20;
                    const numTiles = Math.max(
                      4,
                      Math.min(maxTiles, Math.round(baseTilesBySec * Math.max(1, timelineZoom * 0.75)))
                    );

                    return (
                      <div
                        key={clip.id}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem({
                            type: 'clip',
                            id: clip.id,
                            trackId: 'video1',
                          });
                          // Seek directly to the exact second clicked by the user (NEVER reset to 0.05s!)
                          onSeekTo(clientXToSeconds(e.clientX));
                        }}
                        className={`absolute top-1 bottom-1 rounded-md overflow-hidden flex items-stretch select-none transition-shadow ${
                          isSelected
                            ? 'border-2 border-white ring-2 ring-[#0EA5E9] z-20 shadow-lg'
                            : 'border-[1.5px] border-[#0EA5E9] hover:border-sky-300 z-10'
                        }`}
                      >
                        <div
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setDraggingClipEdge({
                              clipId: clip.id,
                              trackId: 'video1',
                              edge: 'start',
                              initialX: e.clientX,
                              initialStart: clip.startTime,
                              initialEnd: clip.endTime,
                            });
                          }}
                          className="w-1.5 bg-[#0EA5E9]/60 hover:bg-white cursor-ew-resize z-20 shrink-0"
                          title="Drag to trim Video 1 start"
                        />

                        <span className="absolute top-0.5 left-2 z-20 px-1.5 py-0.2 rounded bg-black/75 text-[9px] font-semibold text-white pointer-events-none flex items-center gap-1.5">
                          <span>{clip.label}</span>
                          <span className="text-[8px] font-mono text-[#38BDF8]">
                            {effectiveAspect}
                          </span>
                        </span>

                        <div
                          style={{
                            gridTemplateColumns: `repeat(${numTiles}, minmax(0, 1fr))`,
                          }}
                          className="flex-1 grid gap-px bg-[#080A0F] overflow-hidden"
                        >
                          {Array.from({ length: numTiles }).map((_, tIdx) => {
                            const tileTimelineSec =
                              clip.startTime + (tIdx / Math.max(1, numTiles)) * clipDur;
                            const tileEndSec =
                              clip.startTime + ((tIdx + 1) / Math.max(1, numTiles)) * clipDur;
                            const tileSourceSec =
                              (clip.sourceStart || 0) +
                              ((tIdx + 0.35) / Math.max(1, numTiles)) * clipDur;
                            const frameObj = getFrameForSecond(tileSourceSec);
                            const isPlayheadInTile =
                              currentTime >= tileTimelineSec && currentTime < tileEndSec;

                            return (
                              <div
                                key={tIdx}
                                className={`relative h-full w-full overflow-hidden flex items-center justify-center bg-[#0B0E14] ${
                                  isPlayheadInTile
                                    ? 'ring-1 ring-inset ring-[#34D399] bg-[#101C18]'
                                    : ''
                                }`}
                              >
                                {frameObj ? (
                                  <>
                                    {/* Subtle ambient background fill so 9:16 portrait frames have zero harsh black bars */}
                                    {effectiveAspect === '9:16' && (
                                      <img
                                        src={frameObj.dataUrl}
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover opacity-30 blur-[2px] pointer-events-none"
                                      />
                                    )}
                                    {/* Full Original Uncropped Video Preview Frame (9:16 Portrait, 16:9 Landscape, or 1:1 Square) */}
                                    <img
                                      src={frameObj.dataUrl}
                                      alt=""
                                      className={`relative z-10 h-full pointer-events-none ${
                                        effectiveAspect === '9:16'
                                          ? 'w-auto aspect-[9/16] object-contain shadow-sm border-x border-white/10'
                                          : effectiveAspect === '16:9'
                                            ? 'w-full h-full object-contain'
                                            : 'w-auto aspect-square object-contain'
                                      }`}
                                    />
                                  </>
                                ) : (
                                  <div
                                    className={`h-full flex flex-col items-center justify-center relative overflow-hidden ${
                                      effectiveAspect === '9:16'
                                        ? 'aspect-[9/16] border-x border-white/10 bg-gradient-to-b from-[#2A221E] via-[#1A1615] to-[#0F0D0E]'
                                        : 'w-full bg-gradient-to-b from-[#2A221E] via-[#1A1615] to-[#0F0D0E]'
                                    }`}
                                  >
                                    <div
                                      style={{
                                        transform: `translateX(${Math.sin(tileSourceSec * 1.7) * 3}px)`,
                                      }}
                                      className="w-3.5 h-3.5 rounded-full bg-[#E5984B]/55 -mt-1.5"
                                    />
                                    <div className="w-5 h-4 rounded-t-xl bg-zinc-800/90 absolute bottom-0" />
                                  </div>
                                )}

                                {/* Second-by-Second Timestamp Badge on each frame tile */}
                                <span
                                  className={`absolute bottom-0.5 right-1 z-20 px-1 rounded text-[7px] font-mono tabular-nums pointer-events-none ${
                                    isPlayheadInTile
                                      ? 'bg-[#2BAE66] text-zinc-950 font-extrabold'
                                      : 'bg-black/65 text-zinc-300'
                                  }`}
                                >
                                  {tileTimelineSec.toFixed(1)}s
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setDraggingClipEdge({
                              clipId: clip.id,
                              trackId: 'video1',
                              edge: 'end',
                              initialX: e.clientX,
                              initialStart: clip.startTime,
                              initialEnd: clip.endTime,
                            });
                          }}
                          className="w-1.5 bg-[#0EA5E9]/60 hover:bg-white cursor-ew-resize z-20 shrink-0"
                          title="Drag to trim Video 1 end"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* =============================================================
                  ROW 5: AUDIO 1 TRACK (Default Track #3 — Fine High-Density Premiere Pro Waveform Peaks)
                 ============================================================= */}
              {tracksConfig.audio1.enabled && (
                <div
                  onClick={(e) => {
                    onSeekTo(clientXToSeconds(e.clientX));
                  }}
                  className={`relative h-12 bg-[#091310] cursor-pointer ${
                    tracksConfig.audio1.muted ? 'opacity-40' : ''
                  }`}
                >
                  {audioClips.map((clip) => {
                    const safeDur = Math.max(0.1, duration);
                    const leftPct = Math.max(0, (clip.startTime / safeDur) * 100);
                    const widthPct = Math.max(
                      0.8,
                      ((clip.endTime - clip.startTime) / safeDur) * 100
                    );
                    const isSelected =
                      selectedItem?.type === 'clip' && selectedItem.id === clip.id;

                    return (
                      <div
                        key={clip.id}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem({
                            type: 'clip',
                            id: clip.id,
                            trackId: 'audio1',
                          });
                          // Seek directly to the exact second clicked by the user!
                          onSeekTo(clientXToSeconds(e.clientX));
                        }}
                        className={`absolute top-1 bottom-1 rounded-md overflow-hidden bg-[#0A231A] flex items-center select-none ${
                          isSelected
                            ? 'border-2 border-white ring-2 ring-[#2BAE66] z-20'
                            : 'border border-[#2BAE66]/75 hover:border-[#34D399] z-10'
                        }`}
                      >
                        <div
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setDraggingClipEdge({
                              clipId: clip.id,
                              trackId: 'audio1',
                              edge: 'start',
                              initialX: e.clientX,
                              initialStart: clip.startTime,
                              initialEnd: clip.endTime,
                            });
                          }}
                          className="w-1.5 h-full bg-[#2BAE66]/60 hover:bg-white cursor-ew-resize z-20 shrink-0"
                          title="Drag to trim Audio 1 start"
                        />

                        <span className="absolute top-0.5 left-2 z-20 px-1.5 py-0.2 rounded bg-black/65 text-[9px] font-semibold text-emerald-200 pointer-events-none flex items-center gap-1">
                          <span>{clip.label}</span>
                          <span className="text-[8px] font-mono text-emerald-400/80">
                            48kHz PCM
                          </span>
                        </span>

                        {/* High-Density 1px Premiere Pro Waveform Canvas */}
                        <div className="flex-1 h-full relative">
                          <PremiereHighDensityWaveformCanvas
                            waveformData={dialogueWaveformData}
                            clipStartTime={clip.startTime}
                            clipEndTime={clip.endTime}
                            totalDuration={safeDur}
                            variant="dialogue-audio1"
                          />
                        </div>

                        <div
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setDraggingClipEdge({
                              clipId: clip.id,
                              trackId: 'audio1',
                              edge: 'end',
                              initialX: e.clientX,
                              initialStart: clip.startTime,
                              initialEnd: clip.endTime,
                            });
                          }}
                          className="w-1.5 h-full bg-[#2BAE66]/60 hover:bg-white cursor-ew-resize z-20 shrink-0"
                          title="Drag to trim Audio 1 end"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* =============================================================
                  ROW 6: MUSIC & WHOOSH SFX TRACK (High-Density Music Wavelengths + Whoosh Spikes)
                 ============================================================= */}
              {tracksConfig.music.enabled && (
                <div
                  onClick={(e) => {
                    onSeekTo(clientXToSeconds(e.clientX));
                  }}
                  className={`relative h-12 bg-[#0D0E1A] cursor-pointer ${
                    tracksConfig.music.muted ? 'opacity-40' : ''
                  }`}
                >
                  {musicClips.length === 0 ? (
                    <div className="relative h-full w-full">
                      {/* Render full-width Music & Whoosh wavelength preview with 1-click activation */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddMusicOrWhooshAtPlayhead('whoosh');
                        }}
                        className="absolute inset-1 rounded-md overflow-hidden bg-[#131428] border border-indigo-400/60 hover:border-amber-300 flex items-center"
                      >
                        <span className="absolute top-0.5 left-2 z-20 px-1.5 py-0.2 rounded bg-black/70 text-[9px] font-semibold text-indigo-200 pointer-events-none flex items-center gap-1.5">
                          <span>🎵 Music Bed + 💨 Whoosh / Wash SFX Track</span>
                          <span className="text-amber-300 font-mono text-[8px]">
                            ({allWhooshMarkers.length} WHOOSH SPIKES)
                          </span>
                        </span>

                        <div className="flex-1 h-full relative">
                          <PremiereHighDensityWaveformCanvas
                            waveformData={musicAndWhooshWaveformData}
                            clipStartTime={0}
                            clipEndTime={Math.max(1, duration)}
                            totalDuration={Math.max(1, duration)}
                            variant="music-whoosh"
                            whooshMarkers={allWhooshMarkers}
                          />

                          {/* Whoosh Transient Callout Flags along the Music & Whoosh Track */}
                          {allWhooshMarkers.map((wm) => {
                            const leftPct =
                              (wm.time / Math.max(0.5, duration)) * 100;
                            if (leftPct < 1 || leftPct > 98) return null;
                            return (
                              <button
                                key={wm.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSeekTo(wm.time);
                                  playOpenSourceSoundEffect(
                                    'whoosh',
                                    styleConfig.sfxVolume ?? 0.5
                                  );
                                }}
                                style={{ left: `${leftPct}%` }}
                                title={`${wm.label} at ${formatRulerMillisecondTime(wm.time)} (Click to audition)`}
                                className="absolute bottom-0.5 -translate-x-1/2 z-20 px-1 py-0.2 rounded bg-amber-500/90 text-zinc-950 font-mono font-extrabold text-[7px] leading-tight shadow cursor-pointer hover:bg-amber-300"
                              >
                                ⚡ {wm.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    musicClips.map((clip) => {
                      const safeDur = Math.max(0.1, duration);
                      const leftPct = (clip.startTime / safeDur) * 100;
                      const widthPct = Math.max(
                        1.5,
                        ((clip.endTime - clip.startTime) / safeDur) * 100
                      );
                      const isSelected =
                        selectedItem?.type === 'clip' && selectedItem.id === clip.id;
                      return (
                        <div
                          key={clip.id}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem({
                              type: 'clip',
                              id: clip.id,
                              trackId: 'music',
                            });
                            if (clip.sfxType) {
                              playOpenSourceSoundEffect(
                                clip.sfxType,
                                styleConfig.sfxVolume ?? 0.5
                              );
                            }
                          }}
                          className={`absolute top-1 bottom-1 rounded-md overflow-hidden bg-[#131428] flex items-center select-none ${
                            isSelected
                              ? 'border-2 border-white ring-2 ring-indigo-400 z-20'
                              : 'border border-indigo-400/70 hover:border-amber-300 z-10'
                          }`}
                        >
                          <div
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setDraggingClipEdge({
                                clipId: clip.id,
                                trackId: 'music',
                                edge: 'start',
                                initialX: e.clientX,
                                initialStart: clip.startTime,
                                initialEnd: clip.endTime,
                              });
                            }}
                            className="w-1.5 h-full bg-indigo-400/60 hover:bg-white cursor-ew-resize z-20 shrink-0"
                          />

                          <span className="absolute top-0.5 left-2 z-20 px-1.5 py-0.2 rounded bg-black/70 text-[9px] font-semibold text-indigo-100 pointer-events-none flex items-center gap-1.5">
                            <span>{clip.label}</span>
                            <span className="text-amber-300 font-mono text-[8px]">
                              MUSIC WAVELENGTH + WHOOSH SFX
                            </span>
                          </span>

                          {/* High-Density Stereo Music Wavelength + Golden Whoosh Envelopes */}
                          <div className="flex-1 h-full relative">
                            <PremiereHighDensityWaveformCanvas
                              waveformData={musicAndWhooshWaveformData}
                              clipStartTime={clip.startTime}
                              clipEndTime={clip.endTime}
                              totalDuration={safeDur}
                              variant="music-whoosh"
                              whooshMarkers={allWhooshMarkers}
                            />

                            {allWhooshMarkers
                              .filter(
                                (wm) =>
                                  wm.time >= clip.startTime && wm.time <= clip.endTime
                              )
                              .map((wm) => {
                                const relPct =
                                  ((wm.time - clip.startTime) /
                                    Math.max(0.1, clip.endTime - clip.startTime)) *
                                  100;
                                return (
                                  <button
                                    key={wm.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSeekTo(wm.time);
                                      playOpenSourceSoundEffect(
                                        'whoosh',
                                        styleConfig.sfxVolume ?? 0.5
                                      );
                                    }}
                                    style={{ left: `${relPct}%` }}
                                    className="absolute bottom-0.5 -translate-x-1/2 z-20 px-1 py-0.2 rounded bg-amber-400 text-zinc-950 font-mono font-extrabold text-[7px] leading-tight shadow cursor-pointer hover:bg-white"
                                  >
                                    💨 {wm.label}
                                  </button>
                                );
                              })}
                          </div>

                          <div
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setDraggingClipEdge({
                                clipId: clip.id,
                                trackId: 'music',
                                edge: 'end',
                                initialX: e.clientX,
                                initialStart: clip.startTime,
                                initialEnd: clip.endTime,
                              });
                            }}
                            className="w-1.5 h-full bg-indigo-400/60 hover:bg-white cursor-ew-resize z-20 shrink-0"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

