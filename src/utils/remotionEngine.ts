import { AIBRollSlot, CaptionSegment, CaptionStyleConfig, TrackKey } from '../types/caption';
import { TimelineClip } from '../components/PremiereMultiTrackTimeline';

export interface RemotionSpringConfig {
  damping: number;
  stiffness: number;
  mass: number;
  overshootClamping: boolean;
}

export interface RemotionInterpolateConfig {
  enterFrames: number;
  exitFrames: number;
  startYOffsetPx: number;
  startScale: number;
  activeWordScale: number;
  startOpacity: number;
  rotationDeg: number;
  highlightBoxGlow: number;
}

export type RemotionCaptionPagingMode =
  | 'tiktok-pages'
  | 'single-word-slam'
  | 'karaoke-fill'
  | 'two-line-split';

export interface RemotionCaptionToken {
  text: string;
  fromMs: number;
  toMs: number;
  fromFrame: number;
  toFrame: number;
  isHero: boolean;
  segmentId: string;
  wordIndex: number;
}

export interface RemotionCaptionPage {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
  fromFrame: number;
  durationInFrames: number;
  tokens: RemotionCaptionToken[];
  segmentId: string;
}

export interface RemotionSequenceItem {
  id: string;
  name: string;
  layer: 'captions' | 'broll' | 'video' | 'audio' | 'kinetic-title';
  from: number;
  durationInFrames: number;
  premountFor: number;
  enabled: boolean;
  color: string;
  textPreview?: string;
  mediaUrl?: string;
  effect?: string;
  segmentId?: string;
}

export interface RemotionCompositionConfig {
  compositionId: string;
  fps: 24 | 30 | 60;
  width: number;
  height: number;
  springConfig: RemotionSpringConfig;
  interpolateConfig: RemotionInterpolateConfig;
  captionPagingMode: RemotionCaptionPagingMode;
  combineTokensWithinMilliseconds: number;
  loopPlayback: boolean;
  inFrame: number;
  outFrame: number | null;
}

export const DEFAULT_REMOTION_CONFIG: RemotionCompositionConfig = {
  compositionId: 'MerupifyViralReel',
  fps: 30,
  width: 1080,
  height: 1920,
  springConfig: {
    damping: 12,
    stiffness: 180,
    mass: 0.8,
    overshootClamping: false,
  },
  interpolateConfig: {
    enterFrames: 8,
    exitFrames: 5,
    startYOffsetPx: 28,
    startScale: 0.72,
    activeWordScale: 1.24,
    startOpacity: 0.0,
    rotationDeg: -4,
    highlightBoxGlow: 18,
  },
  captionPagingMode: 'tiktok-pages',
  combineTokensWithinMilliseconds: 1200,
  loopPlayback: true,
  inFrame: 0,
  outFrame: null,
};

export const REMOTION_SPRING_PRESETS: {
  id: string;
  name: string;
  badge: string;
  config: RemotionSpringConfig;
  interpolatePartial?: Partial<RemotionInterpolateConfig>;
}[] = [
  {
    id: 'remotion-default',
    name: 'Remotion Standard',
    badge: 'd:10 s:100 m:1.0',
    config: { damping: 10, stiffness: 100, mass: 1.0, overshootClamping: false },
    interpolatePartial: { activeWordScale: 1.18, startYOffsetPx: 20, rotationDeg: 0 },
  },
  {
    id: 'snappy-viral',
    name: 'Snappy Viral Pop',
    badge: 'd:14 s:220 m:0.6',
    config: { damping: 14, stiffness: 220, mass: 0.6, overshootClamping: false },
    interpolatePartial: { activeWordScale: 1.28, startYOffsetPx: 28, rotationDeg: -4 },
  },
  {
    id: 'bouncy-hormozi',
    name: 'Bouncy Hormozi',
    badge: 'd:8 s:190 m:0.85',
    config: { damping: 8, stiffness: 190, mass: 0.85, overshootClamping: false },
    interpolatePartial: { activeWordScale: 1.35, startYOffsetPx: 36, rotationDeg: -6 },
  },
  {
    id: 'smooth-editorial',
    name: 'Smooth Editorial',
    badge: 'd:26 s:120 m:1.1',
    config: { damping: 26, stiffness: 120, mass: 1.1, overshootClamping: true },
    interpolatePartial: { activeWordScale: 1.1, startYOffsetPx: 14, rotationDeg: 0 },
  },
  {
    id: 'heavy-slam',
    name: 'Heavy Kinetic Slam',
    badge: 'd:11 s:320 m:1.6',
    config: { damping: 11, stiffness: 320, mass: 1.6, overshootClamping: false },
    interpolatePartial: { activeWordScale: 1.42, startYOffsetPx: 44, rotationDeg: 5 },
  },
];

/**
 * Authentic analytical solver for Remotion's `spring({ frame, fps, config, from, to, durationInFrames })`
 * Solves the second-order differential equation: m * x'' + c * x' + k * x = 0
 */
export function remotionSpring({
  frame,
  fps,
  config = DEFAULT_REMOTION_CONFIG.springConfig,
  from = 0,
  to = 1,
  durationInFrames,
}: {
  frame: number;
  fps: number;
  config?: Partial<RemotionSpringConfig>;
  from?: number;
  to?: number;
  durationInFrames?: number;
}): number {
  if (frame <= 0) return from;

  const damping = Math.max(0.1, config.damping ?? 10);
  const stiffness = Math.max(1, config.stiffness ?? 100);
  const mass = Math.max(0.05, config.mass ?? 1);
  const overshootClamping = Boolean(config.overshootClamping);

  const effectiveFrame =
    durationInFrames && durationInFrames > 0
      ? (frame / durationInFrames) * (fps * 0.65)
      : frame;
  const t = effectiveFrame / Math.max(1, fps);

  const c = damping;
  const k = stiffness;
  const m = mass;

  const omega0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));

  let normalized = 1;

  if (zeta < 1) {
    // Underdamped harmonic oscillator
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * omega0 * t);
    normalized =
      1 -
      envelope *
        (Math.cos(omegaD * t) +
          ((zeta * omega0) / omegaD) * Math.sin(omegaD * t));
  } else if (Math.abs(zeta - 1) < 1e-5) {
    // Critically damped
    normalized = 1 - (1 + omega0 * t) * Math.exp(-omega0 * t);
  } else {
    // Overdamped
    const s1 = -omega0 * (zeta - Math.sqrt(zeta * zeta - 1));
    const s2 = -omega0 * (zeta + Math.sqrt(zeta * zeta - 1));
    normalized =
      1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
  }

  if (overshootClamping) {
    normalized = Math.max(0, Math.min(1, normalized));
  }

  return from + normalized * (to - from);
}

/**
 * Samples the spring curve across `numFrames` for live SVG plotting in the Remotion Inspector
 */
export function sampleSpringCurve(
  config: RemotionSpringConfig,
  fps: number = 30,
  numFrames: number = 45
): { frame: number; value: number }[] {
  const points: { frame: number; value: number }[] = [];
  for (let f = 0; f <= numFrames; f++) {
    points.push({
      frame: f,
      value: remotionSpring({ frame: f, fps, config, from: 0, to: 1 }),
    });
  }
  return points;
}

/**
 * Authentic implementation of Remotion's `interpolate(input, inputRange, outputRange, options)`
 */
export function remotionInterpolate(
  input: number,
  inputRange: [number, number] | number[],
  outputRange: [number, number] | number[],
  options?: {
    extrapolateLeft?: 'clamp' | 'extend';
    extrapolateRight?: 'clamp' | 'extend';
  }
): number {
  if (inputRange.length < 2 || outputRange.length < 2) {
    return outputRange[0] ?? 0;
  }

  const extrapolateLeft = options?.extrapolateLeft ?? 'clamp';
  const extrapolateRight = options?.extrapolateRight ?? 'clamp';

  if (input <= inputRange[0]) {
    if (extrapolateLeft === 'clamp') return outputRange[0];
    const slope =
      (outputRange[1] - outputRange[0]) /
      Math.max(1e-6, inputRange[1] - inputRange[0]);
    return outputRange[0] + (input - inputRange[0]) * slope;
  }

  const lastIdx = inputRange.length - 1;
  if (input >= inputRange[lastIdx]) {
    if (extrapolateRight === 'clamp') return outputRange[lastIdx];
    const slope =
      (outputRange[lastIdx] - outputRange[lastIdx - 1]) /
      Math.max(1e-6, inputRange[lastIdx] - inputRange[lastIdx - 1]);
    return outputRange[lastIdx] + (input - inputRange[lastIdx]) * slope;
  }

  // Find active segment
  for (let i = 0; i < lastIdx; i++) {
    const inStart = inputRange[i];
    const inEnd = inputRange[i + 1];
    if (input >= inStart && input <= inEnd) {
      const progress = (input - inStart) / Math.max(1e-6, inEnd - inStart);
      return outputRange[i] + progress * (outputRange[i + 1] - outputRange[i]);
    }
  }

  return outputRange[lastIdx];
}

/**
 * Authentic implementation of `@remotion/captions` `createTikTokStyleCaptions()`
 * Splits or groups word-level tokens within `combineTokensWithinMilliseconds` into frame-accurate pages.
 */
export function createTikTokStyleCaptions(
  segments: CaptionSegment[],
  trackKey: TrackKey,
  combineTokensWithinMilliseconds: number = 1200,
  fps: number = 30
): RemotionCaptionPage[] {
  const allTokens: RemotionCaptionToken[] = [];

  segments.forEach((seg) => {
    const track = seg.tracks[trackKey] || seg.tracks.tinglish || seg.tracks.english;
    const rawText = track?.text?.trim() || '';
    if (!rawText) return;

    const segStartMs = Math.round(seg.startTime * 1000);
    const segEndMs = Math.max(segStartMs + 120, Math.round(seg.endTime * 1000));

    if (track?.words && track.words.length > 0) {
      track.words.forEach((w, wIdx) => {
        const fromMs = Math.round(w.startTime * 1000);
        const toMs = Math.max(fromMs + 80, Math.round(w.endTime * 1000));
        allTokens.push({
          text: w.word,
          fromMs,
          toMs,
          fromFrame: Math.max(0, Math.round((fromMs / 1000) * fps)),
          toFrame: Math.max(1, Math.round((toMs / 1000) * fps)),
          isHero: Boolean(w.isHero),
          segmentId: seg.id,
          wordIndex: wIdx,
        });
      });
    } else {
      const words = rawText.split(/\s+/).filter(Boolean);
      const durPerWord = (segEndMs - segStartMs) / Math.max(1, words.length);
      words.forEach((word, wIdx) => {
        const fromMs = Math.round(segStartMs + wIdx * durPerWord);
        const toMs = Math.round(fromMs + durPerWord);
        allTokens.push({
          text: word,
          fromMs,
          toMs,
          fromFrame: Math.max(0, Math.round((fromMs / 1000) * fps)),
          toFrame: Math.max(1, Math.round((toMs / 1000) * fps)),
          isHero: wIdx === words.length - 1,
          segmentId: seg.id,
          wordIndex: wIdx,
        });
      });
    }
  });

  if (allTokens.length === 0) return [];

  const pages: RemotionCaptionPage[] = [];
  let currentTokens: RemotionCaptionToken[] = [];

  allTokens.forEach((token, idx) => {
    if (currentTokens.length === 0) {
      currentTokens.push(token);
      return;
    }

    const pageStartMs = currentTokens[0].fromMs;
    const elapsedMs = token.toMs - pageStartMs;
    const sameSegment = token.segmentId === currentTokens[0].segmentId;

    if (
      elapsedMs <= combineTokensWithinMilliseconds &&
      sameSegment &&
      currentTokens.length < 6
    ) {
      currentTokens.push(token);
    } else {
      const startMs = currentTokens[0].fromMs;
      const endMs = currentTokens[currentTokens.length - 1].toMs;
      const fromFrame = Math.max(0, Math.round((startMs / 1000) * fps));
      const endFrame = Math.max(fromFrame + 2, Math.round((endMs / 1000) * fps));
      pages.push({
        id: `remotion-page-${pages.length + 1}-${idx}`,
        text: currentTokens.map((t) => t.text).join(' '),
        startMs,
        endMs,
        fromFrame,
        durationInFrames: Math.max(2, endFrame - fromFrame),
        tokens: currentTokens,
        segmentId: currentTokens[0].segmentId,
      });
      currentTokens = [token];
    }
  });

  if (currentTokens.length > 0) {
    const startMs = currentTokens[0].fromMs;
    const endMs = currentTokens[currentTokens.length - 1].toMs;
    const fromFrame = Math.max(0, Math.round((startMs / 1000) * fps));
    const endFrame = Math.max(fromFrame + 2, Math.round((endMs / 1000) * fps));
    pages.push({
      id: `remotion-page-${pages.length + 1}-final`,
      text: currentTokens.map((t) => t.text).join(' '),
      startMs,
      endMs,
      fromFrame,
      durationInFrames: Math.max(2, endFrame - fromFrame),
      tokens: currentTokens,
      segmentId: currentTokens[0].segmentId,
    });
  }

  return pages;
}

/**
 * Builds the multi-layer Remotion `<Sequence>` stack from project state
 */
export function buildRemotionSequencesFromProject({
  segments,
  trackKey,
  brollSlots,
  brollClips,
  musicClips,
  durationSec,
  fps,
  combineTokensMs,
}: {
  segments: CaptionSegment[];
  trackKey: TrackKey;
  brollSlots: AIBRollSlot[];
  brollClips: TimelineClip[];
  musicClips: TimelineClip[];
  durationSec: number;
  fps: number;
  combineTokensMs: number;
}): RemotionSequenceItem[] {
  const totalFrames = Math.max(30, Math.round(durationSec * fps));
  const items: RemotionSequenceItem[] = [];

  // 1. Primary Video Base Sequence
  items.push({
    id: 'seq-primary-video',
    name: '<OffthreadVideo name="PrimaryReel" />',
    layer: 'video',
    from: 0,
    durationInFrames: totalFrames,
    premountFor: fps,
    enabled: true,
    color: '#6366F1',
    textPreview: `Full Base Video Track (0f → ${totalFrames}f)`,
  });

  // 2. Caption Pages Sequences (@remotion/captions)
  const pages = createTikTokStyleCaptions(
    segments,
    trackKey,
    combineTokensMs,
    fps
  );
  pages.forEach((page, idx) => {
    items.push({
      id: `seq-cap-${page.id}`,
      name: `<Sequence name="CaptionPage_${idx + 1}" />`,
      layer: 'captions',
      from: page.fromFrame,
      durationInFrames: page.durationInFrames,
      premountFor: Math.round(fps * 0.25),
      enabled: true,
      color: '#10B981',
      textPreview: page.text,
      segmentId: page.segmentId,
    });
  });

  // 3. AI B-Roll Cutaway Sequences
  brollSlots.forEach((slot, idx) => {
    if (!slot.enabled && !slot.imageDataUrl) return;
    const fromFrame = Math.max(0, Math.round(slot.startTime * fps));
    const endFrame = Math.max(fromFrame + 10, Math.round(slot.endTime * fps));
    items.push({
      id: `seq-broll-slot-${slot.id}`,
      name: `<Sequence name="AIBRoll_${idx + 1}_${slot.aspectRatio}" />`,
      layer: 'broll',
      from: fromFrame,
      durationInFrames: endFrame - fromFrame,
      premountFor: Math.round(fps * 0.5),
      enabled: slot.enabled,
      color: '#0B84F3',
      textPreview: slot.prompt || `AI B-Roll Cutaway #${idx + 1}`,
      mediaUrl: slot.imageDataUrl || undefined,
      effect: slot.magicalEffect,
    });
  });

  brollClips.forEach((clip, idx) => {
    const fromFrame = Math.max(0, Math.round(clip.startTime * fps));
    const endFrame = Math.max(fromFrame + 10, Math.round(clip.endTime * fps));
    items.push({
      id: `seq-broll-clip-${clip.id}`,
      name: `<Sequence name="CutawayClip_${idx + 1}" />`,
      layer: 'broll',
      from: fromFrame,
      durationInFrames: endFrame - fromFrame,
      premountFor: Math.round(fps * 0.5),
      enabled: !clip.hidden,
      color: '#0B84F3',
      textPreview: clip.label,
      mediaUrl: clip.brollImageUrl || clip.customMediaUrl,
      effect: clip.brollEffect,
    });
  });

  // 4. Audio & SFX Sequences
  musicClips.forEach((mClip, idx) => {
    const fromFrame = Math.max(0, Math.round(mClip.startTime * fps));
    const endFrame = Math.max(fromFrame + 6, Math.round(mClip.endTime * fps));
    items.push({
      id: `seq-audio-${mClip.id}`,
      name: `<Sequence name="AudioCue_${idx + 1}" />`,
      layer: 'audio',
      from: fromFrame,
      durationInFrames: endFrame - fromFrame,
      premountFor: Math.round(fps * 0.2),
      enabled: !mClip.muted,
      color: '#F59E0B',
      textPreview: mClip.label,
    });
  });

  return items;
}

/**
 * Generates a complete, runnable `remotion-dev/remotion` TypeScript project bundle
 */
export function generateRemotionProjectCode({
  remotionConfig,
  styleConfig,
  segments,
  brollSlots,
  durationSec,
  videoFileName,
}: {
  remotionConfig: RemotionCompositionConfig;
  styleConfig: CaptionStyleConfig;
  segments: CaptionSegment[];
  brollSlots: AIBRollSlot[];
  durationSec: number;
  videoFileName: string;
}): {
  rootTsx: string;
  compositionTsx: string;
  subtitlesPageTsx: string;
  captionsJson: string;
  packageJson: string;
} {
  const fps = remotionConfig.fps;
  const durationInFrames = Math.max(30, Math.round(durationSec * fps));
  const pages = createTikTokStyleCaptions(
    segments,
    styleConfig.primaryTrack,
    remotionConfig.combineTokensWithinMilliseconds,
    fps
  );

  const { damping, stiffness, mass, overshootClamping } =
    remotionConfig.springConfig;
  const {
    enterFrames,
    startYOffsetPx,
    startScale,
    activeWordScale,
    rotationDeg,
  } = remotionConfig.interpolateConfig;

  const rootTsx = `import React from 'react';
import { Composition } from 'remotion';
import { MerupifyComposition } from './MerupifyComposition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="${remotionConfig.compositionId}"
        component={MerupifyComposition}
        durationInFrames={${durationInFrames}}
        fps={${fps}}
        width={${remotionConfig.width}}
        height={${remotionConfig.height}}
        defaultProps={{
          videoSrc: '${videoFileName || 'input-reel.mp4'}',
          combineTokensWithinMilliseconds: ${remotionConfig.combineTokensWithinMilliseconds},
          primaryColor: '${styleConfig.primaryColor || '#FFFFFF'}',
          highlightColor: '${styleConfig.highlightColor || '#10B981'}',
          fontFamily: '${styleConfig.fontFamily || 'Plus Jakarta Sans'}',
        }}
      />
    </>
  );
};
`;

  const brollSequencesCode = brollSlots
    .filter((s) => s.enabled || s.imageDataUrl)
    .map((s, i) => {
      const fromF = Math.max(0, Math.round(s.startTime * fps));
      const durF = Math.max(15, Math.round((s.endTime - s.startTime) * fps));
      return `      {/* AI B-Roll Cutaway Sequence #${i + 1} (${s.aspectRatio}) */}
      <Sequence from={${fromF}} durationInFrames={${durF}} premountFor={${Math.round(fps * 0.5)}} name="AIBRoll_${i + 1}">
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Img
            src={staticFile('broll-${i + 1}.jpg')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: \`scale(\${interpolate(frame - ${fromF}, [0, ${durF}], [1, 1.14], { extrapolateRight: 'clamp' })})\`,
            }}
          />
        </AbsoluteFill>
      </Sequence>`;
    })
    .join('\n\n');

  const compositionTsx = `import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { createTikTokStyleCaptions, Caption } from '@remotion/captions';
import { SubtitlesPage } from './SubtitlesPage';
import rawCaptions from '../public/captions.json';

export interface MerupifyCompositionProps {
  videoSrc: string;
  combineTokensWithinMilliseconds: number;
  primaryColor: string;
  highlightColor: string;
  fontFamily: string;
}

export const MerupifyComposition: React.FC<MerupifyCompositionProps> = ({
  videoSrc,
  combineTokensWithinMilliseconds = ${remotionConfig.combineTokensWithinMilliseconds},
  primaryColor = '${styleConfig.primaryColor || '#FFFFFF'}',
  highlightColor = '${styleConfig.highlightColor || '#10B981'}',
  fontFamily = '${styleConfig.fontFamily || 'Plus Jakarta Sans'}',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Group word tokens into TikTok-style pages using @remotion/captions
  const { pages } = useMemo(() => {
    return createTikTokStyleCaptions({
      captions: rawCaptions as Caption[],
      combineTokensWithinMilliseconds,
    });
  }, [combineTokensWithinMilliseconds]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0B0B0D' }}>
      {/* Layer 1: Primary Base Video Track */}
      <Sequence from={0} durationInFrames={${durationInFrames}} premountFor={fps} name="PrimaryVideo">
        <OffthreadVideo
          src={staticFile(videoSrc)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Sequence>

${brollSequencesCode || '      {/* Layer 2: Optional AI B-Roll Cutaway Sequences */}'}

      {/* Layer 3: Frame-Accurate @remotion/captions Sequences */}
      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const startFrame = Math.round((page.startMs / 1000) * fps);
        const endFrame = Math.round(
          ((nextPage ? Math.min(nextPage.startMs, page.startMs + combineTokensWithinMilliseconds) : page.startMs + combineTokensWithinMilliseconds) / 1000) * fps
        );
        const durationInFrames = Math.max(1, endFrame - startFrame);

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationInFrames}
            name={\`CaptionPage_\${index + 1}\`}
          >
            <SubtitlesPage
              page={page}
              primaryColor={primaryColor}
              highlightColor={highlightColor}
              fontFamily={fontFamily}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
`;

  const subtitlesPageTsx = `import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { TikTokPage } from '@remotion/captions';

export const SubtitlesPage: React.FC<{
  page: TikTokPage;
  primaryColor: string;
  highlightColor: string;
  fontFamily: string;
}> = ({ page, primaryColor, highlightColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Page entrance spring physics from remotion
  const enterProgress = spring({
    frame,
    fps,
    config: {
      damping: ${damping},
      stiffness: ${stiffness},
      mass: ${mass},
      overshootClamping: ${overshootClamping},
    },
  });

  const translateY = interpolate(
    frame,
    [0, ${enterFrames}],
    [${startYOffsetPx}, 0],
    { extrapolateRight: 'clamp' }
  );

  const currentTimeMs = page.startMs + (frame / fps) * 1000;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 260,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px 16px',
          maxWidth: '86%',
          transform: \`translateY(\${translateY}px) scale(\${interpolate(enterProgress, [0, 1], [${startScale}, 1])})\`,
        }}
      >
        {page.tokens.map((token, i) => {
          const isActive =
            currentTimeMs >= token.fromMs && currentTimeMs <= token.toMs;
          const tokenStartFrame = Math.max(
            0,
            Math.round(((token.fromMs - page.startMs) / 1000) * fps)
          );
          const wordSpring = spring({
            frame: Math.max(0, frame - tokenStartFrame),
            fps,
            config: {
              damping: ${damping},
              stiffness: ${stiffness},
              mass: ${mass},
            },
          });

          const wordScale = isActive
            ? interpolate(wordSpring, [0, 1], [1, ${activeWordScale}])
            : 1;
          const wordRotate = isActive
            ? interpolate(wordSpring, [0, 1], [${rotationDeg}, 0])
            : 0;

          return (
            <span
              key={\`\${token.fromMs}-\${i}\`}
              style={{
                fontFamily,
                fontSize: ${styleConfig.fontSize || 64},
                fontWeight: 800,
                color: isActive ? highlightColor : primaryColor,
                display: 'inline-block',
                transform: \`scale(\${wordScale}) rotate(\${wordRotate}deg)\`,
                textShadow: '0 6px 24px rgba(0,0,0,0.85)',
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
`;

  const remotionCaptionsArray = pages.flatMap((p) =>
    p.tokens.map((t) => ({
      text: ` ${t.text}`,
      startMs: t.fromMs,
      endMs: t.toMs,
      timestampMs: Math.round((t.fromMs + t.toMs) / 2),
      confidence: 0.99,
    }))
  );

  const captionsJson = JSON.stringify(remotionCaptionsArray, null, 2);

  const packageJson = JSON.stringify(
    {
      name: 'merupify-remotion-video',
      version: '1.0.0',
      description: 'Remotion programmatic video & caption composition generated by Merupify Studio',
      scripts: {
        start: 'remotion studio',
        build: `remotion render ${remotionConfig.compositionId} out/video.mp4`,
        upgrade: 'remotion upgrade',
      },
      dependencies: {
        '@remotion/captions': '^4.0.240',
        '@remotion/cli': '^4.0.240',
        '@remotion/player': '^4.0.240',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        remotion: '^4.0.240',
      },
    },
    null,
    2
  );

  return {
    rootTsx,
    compositionTsx,
    subtitlesPageTsx,
    captionsJson,
    packageJson,
  };
}
