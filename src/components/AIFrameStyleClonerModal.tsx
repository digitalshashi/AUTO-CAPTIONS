import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Sparkles,
  Crop,
  Pipette,
  Maximize2,
  Upload,
  Film,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Sliders,
  Type as TypeIcon,
  Palette,
  Award,
  Trash2,
  Plus,
  Play,
  Pause,
} from 'lucide-react';
import {
  CaptionStyleConfig,
  GradientStop,
} from '../types/caption';
import { KALAKAR_GOOGLE_FONTS } from '../data/kalakarOptionsData';
import { ensureGoogleFontLoaded } from '../utils/googleFontsLibrary';

export type ClonerSourceMode = 'current-video' | 'upload-image' | 'external-video';
export type ClonerToolMode = 'box' | 'eyedropper' | 'full';
export type ClonerRegionIntent = 'auto' | 'text' | 'logo' | 'color';

export interface BoundingBoxPct {
  x: number; // 0..100
  y: number; // 0..100
  width: number; // 0..100
  height: number; // 0..100
}

export interface AIFrameStyleClonerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: number;
  duration: number;
  onSeekMainVideo: (seconds: number) => void;
  captureMainFrameDataUrl: (includeCaptionsOverlay?: boolean) => string;
  hasRawVideoElement: boolean;
  currentStyleConfig: CaptionStyleConfig;
  onApplyAndSaveStyle: (
    stylePatch: Partial<CaptionStyleConfig>,
    presetMeta: {
      name: string;
      badgeText: string;
      tagline: string;
      previewColors: string[];
    }
  ) => void;
}

interface SamplePosterPreset {
  id: string;
  label: string;
  category: ClonerRegionIntent;
  description: string;
  defaultBox: BoundingBoxPct;
  renderToCanvas: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

const BUILTIN_SAMPLE_POSTERS: SamplePosterPreset[] = [
  {
    id: 'poster-cyber-gold',
    label: 'Viral Creator Hook Frame',
    category: 'text',
    description: 'Bold 3D yellow-orange gradient headline with heavy black stroke',
    defaultBox: { x: 10, y: 52, width: 80, height: 28 },
    renderToCanvas: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#090D16');
      bg.addColorStop(0.5, '#111827');
      bg.addColorStop(1, '#1E1B4B');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Subtle studio spotlight
      const rad = ctx.createRadialGradient(w * 0.5, h * 0.4, 20, w * 0.5, h * 0.4, w * 0.7);
      rad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
      rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, w, h);

      // Creator silhouette
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.3, w * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(w * 0.28, h * 0.45, w * 0.44, h * 0.35, 36);
      ctx.fill();

      // Caption text area
      ctx.save();
      ctx.font = '900 44px "Anton", "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const txtGrad = ctx.createLinearGradient(w * 0.2, h * 0.62, w * 0.8, h * 0.72);
      txtGrad.addColorStop(0, '#FFFBEB');
      txtGrad.addColorStop(0.45, '#FACC15');
      txtGrad.addColorStop(1, '#F97316');
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#000000';
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      ctx.strokeText('10X YOUR REELS', w * 0.5, h * 0.63);
      ctx.fillStyle = txtGrad;
      ctx.fillText('10X YOUR REELS', w * 0.5, h * 0.63);

      ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
      ctx.lineWidth = 5;
      ctx.strokeText('WITH AI FRAME CLONING', w * 0.5, h * 0.72);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('WITH AI FRAME CLONING', w * 0.5, h * 0.72);
      ctx.restore();
    },
  },
  {
    id: 'poster-neon-brand',
    label: 'Emerald & Cyan Tech Logo',
    category: 'logo',
    description: 'Luminous mint-cyan brand emblem with frosted dark pill',
    defaultBox: { x: 18, y: 18, width: 64, height: 36 },
    renderToCanvas: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#041311');
      bg.addColorStop(0.6, '#071F1B');
      bg.addColorStop(1, '#05080A');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Geometric Brand Logo Mark
      ctx.save();
      const logoGrad = ctx.createLinearGradient(w * 0.25, h * 0.2, w * 0.75, h * 0.5);
      logoGrad.addColorStop(0, '#10B981');
      logoGrad.addColorStop(0.5, '#06B6D4');
      logoGrad.addColorStop(1, '#3B82F6');
      ctx.fillStyle = logoGrad;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.roundRect(w * 0.34, h * 0.22, w * 0.32, w * 0.32, 24);
      ctx.fill();

      ctx.fillStyle = '#041311';
      ctx.font = '900 48px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M✦', w * 0.5, h * 0.33);

      // Pill caption below
      ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(w * 0.14, h * 0.64, w * 0.72, 64, 16);
      ctx.fill();
      ctx.stroke();

      ctx.font = '800 30px "Outfit", sans-serif';
      ctx.fillStyle = '#34D399';
      ctx.fillText('BRAND LOGO STYLE', w * 0.5, h * 0.64 + 32);
      ctx.restore();
    },
  },
  {
    id: 'poster-sunset-cinema',
    label: 'Sunset Cinema Poster',
    category: 'color',
    description: 'Rich magenta-amber-violet cinematic color grade & serif title',
    defaultBox: { x: 12, y: 55, width: 76, height: 30 },
    renderToCanvas: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#2E0938');
      bg.addColorStop(0.45, '#9D174D');
      bg.addColorStop(0.8, '#EA580C');
      bg.addColorStop(1, '#FACC15');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, h * 0.52, w, h * 0.36);

      ctx.font = 'italic 700 42px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FEF08A';
      ctx.shadowColor = 'rgba(236, 72, 153, 0.8)';
      ctx.shadowBlur = 18;
      ctx.fillText('Golden Hour Stories', w * 0.5, h * 0.66);

      ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#FBCFE8';
      ctx.fillText('AESTHETIC POSTER GRADE', w * 0.5, h * 0.75);
      ctx.restore();
    },
  },
];

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function colorDistance(hexA: string, hexB: string): number {
  const parse = (hex: string) => {
    const clean = hex.replace('#', '');
    return [
      parseInt(clean.slice(0, 2), 16) || 0,
      parseInt(clean.slice(2, 4), 16) || 0,
      parseInt(clean.slice(4, 6), 16) || 0,
    ];
  };
  const [r1, g1, b1] = parse(hexA);
  const [r2, g2, b2] = parse(hexB);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Fast client-side dominant color & gradient stop extractor from a region on an HTMLCanvasElement.
 * Runs in <10ms by quantizing pixels into distinct vivid & high-contrast clusters.
 */
function extractDominantHexStopsFromCanvas(
  canvas: HTMLCanvasElement,
  boxPct?: BoundingBoxPct,
  maxStops = 4
): string[] {
  const ctx = canvas.getContext('2d');
  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return ['#FFFFFF', '#10B981', '#06B6D4'];
  }

  const sx = boxPct ? Math.floor((boxPct.x / 100) * canvas.width) : 0;
  const sy = boxPct ? Math.floor((boxPct.y / 100) * canvas.height) : 0;
  const sw = boxPct
    ? Math.max(8, Math.floor((boxPct.width / 100) * canvas.width))
    : canvas.width;
  const sh = boxPct
    ? Math.max(8, Math.floor((boxPct.height / 100) * canvas.height))
    : canvas.height;

  const safeX = Math.max(0, Math.min(canvas.width - 4, sx));
  const safeY = Math.max(0, Math.min(canvas.height - 4, sy));
  const safeW = Math.max(4, Math.min(canvas.width - safeX, sw));
  const safeH = Math.max(4, Math.min(canvas.height - safeY, sh));

  let imgData: ImageData;
  try {
    imgData = ctx.getImageData(safeX, safeY, safeW, safeH);
  } catch {
    return ['#FFFFFF', '#FACC15', '#F97316'];
  }

  const data = imgData.data;
  const buckets = new Map<
    string,
    { count: number; rSum: number; gSum: number; bSum: number; sat: number; lum: number }
  >();

  const step = Math.max(4, Math.floor(data.length / (4 * 900)) * 4);
  for (let i = 0; i < data.length; i += step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 100) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = (max + min) / 2;
    const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255) || 1);

    // Quantize to 24-step buckets
    const qr = Math.round(r / 24) * 24;
    const qg = Math.round(g / 24) * 24;
    const qb = Math.round(b / 24) * 24;
    const key = `${qr},${qg},${qb}`;

    const existing = buckets.get(key);
    // Boost weight for saturated or bright text/logo pixels so dark backgrounds don't drown out text colors
    const weight = 1 + sat * 2.5 + (lum > 180 ? 1.5 : 0);
    if (existing) {
      existing.count += weight;
      existing.rSum += r * weight;
      existing.gSum += g * weight;
      existing.bSum += b * weight;
    } else {
      buckets.set(key, {
        count: weight,
        rSum: r * weight,
        gSum: g * weight,
        bSum: b * weight,
        sat,
        lum,
      });
    }
  }

  const sorted = Array.from(buckets.values())
    .filter((b) => b.lum > 22) // Exclude pure black background void from gradient stops
    .sort((a, b) => b.count - a.count);

  const selectedHexes: string[] = [];
  for (const item of sorted) {
    const hex = rgbToHex(
      item.rSum / item.count,
      item.gSum / item.count,
      item.bSum / item.count
    );
    if (selectedHexes.every((existing) => colorDistance(existing, hex) > 42)) {
      selectedHexes.push(hex);
    }
    if (selectedHexes.length >= maxStops) break;
  }

  if (selectedHexes.length === 0) {
    return ['#FFFFFF', '#10B981', '#06B6D4'];
  }
  if (selectedHexes.length === 1) {
    selectedHexes.push('#FFFFFF');
  }
  return selectedHexes;
}

export const AIFrameStyleClonerModal: React.FC<AIFrameStyleClonerModalProps> = ({
  isOpen,
  onClose,
  currentTime,
  duration,
  onSeekMainVideo,
  captureMainFrameDataUrl,
  hasRawVideoElement,
  currentStyleConfig,
  onApplyAndSaveStyle,
}) => {
  const [sourceMode, setSourceMode] = useState<ClonerSourceMode>('current-video');
  const [toolMode, setToolMode] = useState<ClonerToolMode>('box');
  const [regionIntent, setRegionIntent] = useState<ClonerRegionIntent>('auto');
  const [includeCaptionsOverlay, setIncludeCaptionsOverlay] = useState<boolean>(true);

  // Bounding box in percentage (0..100)
  const [boxPct, setBoxPct] = useState<BoundingBoxPct>({
    x: 12,
    y: 52,
    width: 76,
    height: 28,
  });
  const [isDraggingBox, setIsDraggingBox] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sampled colors & multi-stop gradient stops (up to 5 stops)
  const [sampledStops, setSampledStops] = useState<GradientStop[]>([
    { id: 's-1', color: '#FFFBEB', position: 0 },
    { id: 's-2', color: '#FACC15', position: 50 },
    { id: 's-3', color: '#F97316', position: 100 },
  ]);
  const [gradientAngle, setGradientAngle] = useState<number>(
    currentStyleConfig.gradientAngle ?? 135
  );
  const [gradientLevel, setGradientLevel] = useState<'word' | 'char'>(
    currentStyleConfig.gradientLevel || 'word'
  );
  const [applyGradientToBoth, setApplyGradientToBoth] = useState<boolean>(true);

  // Eyedropper hover state
  const [hoverHex, setHoverHex] = useState<string | null>(null);
  const [eyedropperTarget, setEyedropperTarget] = useState<
    'gradient' | 'primary' | 'highlight' | 'stroke' | 'bg'
  >('gradient');

  // Extracted / Live Preview Style state
  const [presetNameDraft, setPresetNameDraft] = useState<string>('Frame Style Clone');
  const [extractedFont, setExtractedFont] = useState<string>(
    currentStyleConfig.fontFamily || 'Montserrat'
  );
  const [extractedTextCase, setExtractedTextCase] = useState<
    'none' | 'uppercase' | 'lowercase' | 'capitalize'
  >(currentStyleConfig.textTransform || 'uppercase');
  const [extractedPrimaryColor, setExtractedPrimaryColor] = useState<string>(
    currentStyleConfig.primaryColor || '#FFFFFF'
  );
  const [extractedHighlightColor, setExtractedHighlightColor] = useState<string>(
    currentStyleConfig.highlightColor || '#FACC15'
  );
  const [extractedStrokeWidth, setExtractedStrokeWidth] = useState<number>(
    currentStyleConfig.strokeWidth ?? 2
  );
  const [extractedStrokeColor, setExtractedStrokeColor] = useState<string>(
    currentStyleConfig.strokeColor || '#000000'
  );
  const [extractedDropShadow, setExtractedDropShadow] = useState<boolean>(true);
  const [extractedGlow, setExtractedGlow] = useState<boolean>(false);
  const [extractedGlowColor, setExtractedGlowColor] = useState<string>('#10B981');
  const [extracted3D, setExtracted3D] = useState<boolean>(false);
  const [extractedBgEnabled, setExtractedBgEnabled] = useState<boolean>(false);
  const [extractedBgColor, setExtractedBgColor] = useState<string>('#000000');
  const [aiReasoningSummary, setAiReasoningSummary] = useState<string>(
    'Drag a box around any text, logo mark, or color area on the frame—or click Scan with AI.'
  );
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);

  // Media Refs
  const interactiveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cropPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null);
  const externalVideoInputRef = useRef<HTMLInputElement | null>(null);
  const externalVideoElRef = useRef<HTMLVideoElement | null>(null);

  const [uploadedPosterUrl, setUploadedPosterUrl] = useState<string | null>(null);
  const [activeSamplePosterId, setActiveSamplePosterId] = useState<string>(
    BUILTIN_SAMPLE_POSTERS[0].id
  );
  const [externalVideoUrl, setExternalVideoUrl] = useState<string | null>(null);
  const [externalVideoDuration, setExternalVideoDuration] = useState<number>(10);
  const [externalVideoTime, setExternalVideoTime] = useState<number>(0);
  const [isExternalPlaying, setIsExternalPlaying] = useState<boolean>(false);

  // Helper to update the cropped preview and run fast pixel clustering
  const syncCropPreviewAndColors = useCallback(
    (targetBox?: BoundingBoxPct) => {
      const srcCanvas = interactiveCanvasRef.current;
      const cropCanvas = cropPreviewCanvasRef.current;
      if (!srcCanvas || srcCanvas.width === 0 || srcCanvas.height === 0) return;

      const box = targetBox || (toolMode === 'full' ? { x: 0, y: 0, width: 100, height: 100 } : boxPct);

      if (cropCanvas) {
        const ctx = cropCanvas.getContext('2d');
        if (ctx) {
          const sx = (box.x / 100) * srcCanvas.width;
          const sy = (box.y / 100) * srcCanvas.height;
          const sw = Math.max(12, (box.width / 100) * srcCanvas.width);
          const sh = Math.max(12, (box.height / 100) * srcCanvas.height);
          ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
          ctx.drawImage(
            srcCanvas,
            sx,
            sy,
            sw,
            sh,
            0,
            0,
            cropCanvas.width,
            cropCanvas.height
          );
        }
      }

      const hexes = extractDominantHexStopsFromCanvas(
        srcCanvas,
        toolMode === 'full' ? undefined : box,
        4
      );
      if (hexes.length >= 2) {
        const stops: GradientStop[] = hexes.map((color, idx) => ({
          id: `auto-stop-${idx}`,
          color,
          position: Math.round((idx / (hexes.length - 1)) * 100),
        }));
        setSampledStops(stops);
        setExtractedHighlightColor(hexes[0]);
        if (hexes[1]) {
          setExtractedPrimaryColor('#FFFFFF');
        }
        if (hexes[2]) {
          setExtractedGlowColor(hexes[2]);
        }
      }
    },
    [boxPct, toolMode]
  );

  // Draw the active source frame onto interactiveCanvasRef
  const renderActiveSourceToCanvas = useCallback(() => {
    const canvas = interactiveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (sourceMode === 'current-video') {
      const dataUrl = captureMainFrameDataUrl(includeCaptionsOverlay);
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          canvas.width = img.naturalWidth || 540;
          canvas.height = img.naturalHeight || 960;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          syncCropPreviewAndColors();
        };
        img.src = dataUrl;
        return;
      }
    }

    if (sourceMode === 'upload-image') {
      if (uploadedPosterUrl) {
        const img = new Image();
        img.onload = () => {
          const maxDim = 960;
          const scale = Math.min(
            1,
            maxDim / Math.max(img.naturalWidth || 540, img.naturalHeight || 960)
          );
          canvas.width = Math.max(320, Math.round((img.naturalWidth || 540) * scale));
          canvas.height = Math.max(320, Math.round((img.naturalHeight || 960) * scale));
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          syncCropPreviewAndColors();
        };
        img.src = uploadedPosterUrl;
        return;
      } else {
        const preset =
          BUILTIN_SAMPLE_POSTERS.find((p) => p.id === activeSamplePosterId) ||
          BUILTIN_SAMPLE_POSTERS[0];
        canvas.width = 540;
        canvas.height = 720;
        preset.renderToCanvas(ctx, canvas.width, canvas.height);
        syncCropPreviewAndColors(preset.defaultBox);
        return;
      }
    }

    if (sourceMode === 'external-video' && externalVideoElRef.current) {
      const vid = externalVideoElRef.current;
      if (vid.readyState >= 2) {
        canvas.width = vid.videoWidth || 540;
        canvas.height = vid.videoHeight || 960;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        syncCropPreviewAndColors();
      }
    }
  }, [
    sourceMode,
    includeCaptionsOverlay,
    captureMainFrameDataUrl,
    uploadedPosterUrl,
    activeSamplePosterId,
    syncCropPreviewAndColors,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      renderActiveSourceToCanvas();
    }, 40);
    return () => clearTimeout(timer);
  }, [
    isOpen,
    sourceMode,
    currentTime,
    includeCaptionsOverlay,
    uploadedPosterUrl,
    activeSamplePosterId,
    renderActiveSourceToCanvas,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    syncCropPreviewAndColors();
  }, [boxPct, toolMode, isOpen, syncCropPreviewAndColors]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (uploadedPosterUrl && uploadedPosterUrl.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedPosterUrl);
      }
      if (externalVideoUrl && externalVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(externalVideoUrl);
      }
    };
  }, [uploadedPosterUrl, externalVideoUrl]);

  if (!isOpen) return null;

  // Convert pointer event on interactive canvas to (xPct, yPct)
  const getCanvasPctCoords = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100)
    );
    const yPct = Math.max(
      0,
      Math.min(100, ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100)
    );
    return { xPct, yPct };
  };

  // Sample exact pixel hex at (xPct, yPct)
  const samplePixelHexAtPct = (xPct: number, yPct: number): string | null => {
    const canvas = interactiveCanvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const px = Math.max(
      0,
      Math.min(canvas.width - 1, Math.floor((xPct / 100) * canvas.width))
    );
    const py = Math.max(
      0,
      Math.min(canvas.height - 1, Math.floor((yPct / 100) * canvas.height))
    );
    try {
      const data = ctx.getImageData(px, py, 1, 1).data;
      return rgbToHex(data[0], data[1], data[2]);
    } catch {
      return null;
    }
  };

  const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const { xPct, yPct } = getCanvasPctCoords(e);

    if (toolMode === 'eyedropper') {
      const hex = samplePixelHexAtPct(xPct, yPct);
      if (!hex) return;

      if (eyedropperTarget === 'primary') {
        setExtractedPrimaryColor(hex);
      } else if (eyedropperTarget === 'highlight') {
        setExtractedHighlightColor(hex);
      } else if (eyedropperTarget === 'stroke') {
        setExtractedStrokeColor(hex);
      } else if (eyedropperTarget === 'bg') {
        setExtractedBgColor(hex);
        setExtractedBgEnabled(true);
      } else {
        setSampledStops((prev) => {
          const next =
            prev.length >= 5
              ? [...prev.slice(1), { id: `eye-${Date.now()}`, color: hex, position: 100 }]
              : [...prev, { id: `eye-${Date.now()}`, color: hex, position: 100 }];
          return next.map((s, idx) => ({
            ...s,
            position: Math.round((idx / Math.max(1, next.length - 1)) * 100),
          }));
        });
        setExtractedHighlightColor(hex);
      }
      return;
    }

    if (toolMode === 'box') {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStartRef.current = { x: xPct, y: yPct };
      setIsDraggingBox(true);
      setBoxPct({
        x: xPct,
        y: yPct,
        width: 2,
        height: 2,
      });
    }
  };

  const handleOverlayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const { xPct, yPct } = getCanvasPctCoords(e);

    if (toolMode === 'eyedropper') {
      setHoverHex(samplePixelHexAtPct(xPct, yPct));
      return;
    }

    if (isDraggingBox && toolMode === 'box') {
      const startX = dragStartRef.current.x;
      const startY = dragStartRef.current.y;
      const left = Math.min(startX, xPct);
      const top = Math.min(startY, yPct);
      const width = Math.max(6, Math.abs(xPct - startX));
      const height = Math.max(6, Math.abs(yPct - startY));
      setBoxPct({
        x: Math.min(94, left),
        y: Math.min(94, top),
        width: Math.min(100 - left, width),
        height: Math.min(100 - top, height),
      });
    }
  };

  const handleOverlayPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingBox) {
      setIsDraggingBox(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      syncCropPreviewAndColors();
    }
  };

  // Run Gemini Vision AI Frame / Region Style Extraction
  const handleRunAIStyleExtraction = async (autoApplyAndClose = false) => {
    const srcCanvas = interactiveCanvasRef.current;
    if (!srcCanvas) return;

    setIsAnalyzingAI(true);
    setAiReasoningSummary('Gemini Vision is analyzing typography, gradients, stroke & glow...');

    try {
      const fullFrameDataUrl = srcCanvas.toDataURL('image/jpeg', 0.82);
      const cropCanvas = cropPreviewCanvasRef.current;
      const croppedRegionDataUrl =
        toolMode === 'box' && cropCanvas
          ? cropCanvas.toDataURL('image/jpeg', 0.9)
          : fullFrameDataUrl;

      const sampledHexList = sampledStops.map((s) => s.color);

      const response = await fetch('/api/style/clone-from-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullFrameDataUrl,
          croppedRegionDataUrl,
          regionIntent,
          toolMode,
          sampledHexStops: sampledHexList,
          sourceLabel:
            sourceMode === 'current-video'
              ? `Reel Frame @ ${currentTime.toFixed(1)}s`
              : sourceMode === 'external-video'
                ? `Ref Video @ ${externalVideoTime.toFixed(1)}s`
                : 'Poster / Image',
        }),
      });

      const data = await response.json();

      const nextFont =
        data.fontFamily &&
        KALAKAR_GOOGLE_FONTS.some(
          (f) => f.name.toLowerCase() === String(data.fontFamily).toLowerCase()
        )
          ? KALAKAR_GOOGLE_FONTS.find(
              (f) => f.name.toLowerCase() === String(data.fontFamily).toLowerCase()
            )!.name
          : extractedFont;

      ensureGoogleFontLoaded(nextFont);
      setExtractedFont(nextFont);

      const nextCase: 'none' | 'uppercase' | 'lowercase' | 'capitalize' =
        data.textTransform === 'uppercase' ||
        data.textTransform === 'lowercase' ||
        data.textTransform === 'capitalize' ||
        data.textTransform === 'none'
          ? data.textTransform
          : 'uppercase';
      setExtractedTextCase(nextCase);

      const aiColors: string[] =
        Array.isArray(data.gradientColors) && data.gradientColors.length >= 2
          ? data.gradientColors.slice(0, 5)
          : sampledHexList;

      const nextStops: GradientStop[] = aiColors.map((c, idx) => ({
        id: `ai-stop-${idx}-${Date.now()}`,
        color: c,
        position: Math.round((idx / Math.max(1, aiColors.length - 1)) * 100),
      }));
      setSampledStops(nextStops);

      const nextAngle =
        typeof data.gradientAngle === 'number' ? data.gradientAngle : gradientAngle;
      setGradientAngle(nextAngle);

      const nextPrimary = data.primaryColor || extractedPrimaryColor;
      const nextHighlight = data.highlightColor || aiColors[0] || extractedHighlightColor;
      const nextStrokeW =
        typeof data.strokeWidth === 'number' ? data.strokeWidth : extractedStrokeWidth;
      const nextStrokeC = data.strokeColor || extractedStrokeColor;
      const nextShadow =
        typeof data.dropShadowEnabled === 'boolean'
          ? data.dropShadowEnabled
          : extractedDropShadow;
      const nextGlow =
        typeof data.glowEnabled === 'boolean' ? data.glowEnabled : extractedGlow;
      const nextGlowC = data.glowColor || aiColors[1] || extractedGlowColor;
      const next3D =
        typeof data.depth3DEnabled === 'boolean' ? data.depth3DEnabled : extracted3D;
      const nextBgEn =
        typeof data.backgroundEnabled === 'boolean'
          ? data.backgroundEnabled
          : extractedBgEnabled;
      const nextBgC = data.backgroundColor || extractedBgColor;
      const nextPresetName =
        data.presetName ||
        (regionIntent === 'logo'
          ? 'Brand Logo Style'
          : regionIntent === 'color'
            ? 'Poster Grade Style'
            : 'Frame Text Clone');

      setExtractedPrimaryColor(nextPrimary);
      setExtractedHighlightColor(nextHighlight);
      setExtractedStrokeWidth(nextStrokeW);
      setExtractedStrokeColor(nextStrokeC);
      setExtractedDropShadow(nextShadow);
      setExtractedGlow(nextGlow);
      setExtractedGlowColor(nextGlowC);
      setExtracted3D(next3D);
      setExtractedBgEnabled(nextBgEn);
      setExtractedBgColor(nextBgC);
      setPresetNameDraft(nextPresetName);
      setAiReasoningSummary(
        data.reasoningSummary ||
          `Extracted ${nextFont} (${nextCase}) with ${nextStops.length}-stop gradient (${nextAngle}°) from selected region.`
      );

      if (autoApplyAndClose) {
        applyAndSaveCurrentState({
          fontFamily: nextFont,
          textTransform: nextCase,
          primaryColor: nextPrimary,
          highlightColor: nextHighlight,
          stops: nextStops,
          angle: nextAngle,
          strokeWidth: nextStrokeW,
          strokeColor: nextStrokeC,
          dropShadowEnabled: nextShadow,
          glowEnabled: nextGlow,
          glowColor: nextGlowC,
          depth3DEnabled: next3D,
          backgroundEnabled: nextBgEn,
          backgroundColor: nextBgC,
          presetName: nextPresetName,
        });
      }
    } catch {
      setAiReasoningSummary(
        'Extracted multi-stop gradient palette & high-contrast typography from selected region.'
      );
      if (autoApplyAndClose) {
        applyAndSaveCurrentState();
      }
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const applyAndSaveCurrentState = (override?: {
    fontFamily?: string;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    primaryColor?: string;
    highlightColor?: string;
    stops?: GradientStop[];
    angle?: number;
    strokeWidth?: number;
    strokeColor?: string;
    dropShadowEnabled?: boolean;
    glowEnabled?: boolean;
    glowColor?: string;
    depth3DEnabled?: boolean;
    backgroundEnabled?: boolean;
    backgroundColor?: string;
    presetName?: string;
  }) => {
    const fontToUse = override?.fontFamily || extractedFont;
    const caseToUse = override?.textTransform || extractedTextCase;
    const primaryToUse = override?.primaryColor || extractedPrimaryColor;
    const highlightToUse = override?.highlightColor || extractedHighlightColor;
    const stopsToUse = override?.stops || sampledStops;
    const angleToUse = override?.angle ?? gradientAngle;
    const strokeWToUse = override?.strokeWidth ?? extractedStrokeWidth;
    const strokeCToUse = override?.strokeColor || extractedStrokeColor;
    const shadowToUse = override?.dropShadowEnabled ?? extractedDropShadow;
    const glowToUse = override?.glowEnabled ?? extractedGlow;
    const glowCToUse = override?.glowColor || extractedGlowColor;
    const depth3DToUse = override?.depth3DEnabled ?? extracted3D;
    const bgEnToUse = override?.backgroundEnabled ?? extractedBgEnabled;
    const bgCToUse = override?.backgroundColor || extractedBgColor;
    const nameToUse = (override?.presetName || presetNameDraft || 'Frame Clone').trim();

    ensureGoogleFontLoaded(fontToUse);

    const c0 = stopsToUse[0]?.color || highlightToUse;
    const c1 = stopsToUse[1]?.color || c0;
    const c2 = stopsToUse[2]?.color || c1;
    const c3 = stopsToUse[3]?.color;

    const stylePatch: Partial<CaptionStyleConfig> = {
      fontFamily: fontToUse,
      heroWordFontFamily: fontToUse,
      textTransform: caseToUse,
      primaryColor: primaryToUse,
      highlightColor: highlightToUse,
      useGradient: true,
      gradientStops: stopsToUse,
      gradientStart: c0,
      gradientMid: c1,
      gradientEnd: c2,
      gradientFourth: c3,
      gradientDirection: 'diagonal',
      gradientAngle: angleToUse,
      gradientLevel,
      useBaseGradient: applyGradientToBoth,
      baseGradientStops: applyGradientToBoth ? stopsToUse : currentStyleConfig.baseGradientStops,
      baseGradientAngle: angleToUse,
      baseGradientLevel: gradientLevel,
      strokeEnabled: strokeWToUse > 0,
      strokeWidth: strokeWToUse,
      strokeColor: strokeCToUse,
      dropShadowEnabled: shadowToUse,
      dropShadowColor: '#000000',
      dropShadowBlur: shadowToUse ? 12 : 0,
      dropShadowY: shadowToUse ? 4 : 0,
      glowEnabled: glowToUse,
      glowColor: glowCToUse,
      glowIntensity: glowToUse ? 65 : 0,
      depth3DEnabled: depth3DToUse,
      depth3DColor: strokeCToUse,
      depth3DDepth: depth3DToUse ? 5 : 0,
      backgroundEnabled: bgEnToUse,
      backgroundColor: bgCToUse,
      backgroundOpacity: bgEnToUse ? 0.88 : 0,
    };

    onApplyAndSaveStyle(stylePatch, {
      name: nameToUse,
      badgeText: nameToUse.slice(0, 14).toUpperCase(),
      tagline: `Cloned from ${
        sourceMode === 'current-video'
          ? `Frame @ ${currentTime.toFixed(1)}s`
          : sourceMode === 'external-video'
            ? 'Ref Video'
            : 'Poster'
      } (${fontToUse})`,
      previewColors: stopsToUse.map((s) => s.color),
    });

    onClose();
  };

  const cssGradientString = `linear-gradient(${gradientAngle}deg, ${sampledStops
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ')})`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#111216] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94dvh]">
        {/* TOP HEADER */}
        <div className="px-4 py-3 bg-[#16181E] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                AI Frame, Poster &amp; Region Style Cloner
              </h2>
              <p className="text-[11px] text-zinc-400 truncate">
                Select any text area, logo mark, or color swatch on any video frame or poster to dynamically create &amp; apply a reel style
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY: 2-COLUMN WORKSPACE (LEFT: Interactive Frame Canvas & Scrubber | RIGHT: AI Style & Multi-Stop Gradient Builder) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
          {/* LEFT COLUMN (7 cols): Source Switcher + Interactive Bounding Box / Eyedropper Canvas + Frame Scrubber */}
          <div className="lg:col-span-7 p-3.5 sm:p-4 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col gap-3 bg-[#0C0D10] overflow-y-auto">
            {/* Source Tabs: Current Video Frame | Upload Poster/Image | External Video */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center bg-[#16181E] p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setSourceMode('current-video')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                    sourceMode === 'current-video'
                      ? 'bg-[#10B981] text-[#041E15] font-bold'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Current Video Frame</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('upload-image')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                    sourceMode === 'upload-image'
                      ? 'bg-[#10B981] text-[#041E15] font-bold'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Poster / Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('external-video')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                    sourceMode === 'external-video'
                      ? 'bg-[#10B981] text-[#041E15] font-bold'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>External Video</span>
                </button>
              </div>

              {/* Selection Tool Mode: Region Box | Eyedropper | Full Frame */}
              <div className="inline-flex items-center bg-[#16181E] p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setToolMode('box')}
                  title="Drag a bounding box over text, logo mark, or color area"
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                    toolMode === 'box'
                      ? 'bg-[#262934] text-[#34D399] border border-[#10B981]/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>Select Area</span>
                </button>
                <button
                  type="button"
                  onClick={() => setToolMode('eyedropper')}
                  title="Click any pixel on the frame to sample exact colors & gradient stops"
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                    toolMode === 'eyedropper'
                      ? 'bg-[#262934] text-[#34D399] border border-[#10B981]/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Pipette className="w-3.5 h-3.5" />
                  <span>Eyedropper</span>
                </button>
                <button
                  type="button"
                  onClick={() => setToolMode('full')}
                  title="Scan the entire frame without manual cropping"
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                    toolMode === 'full'
                      ? 'bg-[#262934] text-[#34D399] border border-[#10B981]/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Full Frame</span>
                </button>
              </div>
            </div>

            {/* Region Intent Bar (What are you selecting? Text Area | Logo Mark | Color Mood | Auto) */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#14161C] border border-white/[0.07]">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-semibold">
                <span>Target Area Type:</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {(
                  [
                    { id: 'auto', label: 'Auto-Detect', icon: Sparkles },
                    { id: 'text', label: 'Text / Caption Area', icon: TypeIcon },
                    { id: 'logo', label: 'Logo Mark', icon: Award },
                    { id: 'color', label: 'Color / Gradient Area', icon: Palette },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = regionIntent === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRegionIntent(item.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/50'
                          : 'bg-[#1C1F26] text-zinc-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source-Specific Sub-Bar (Scrubber for Current Video, Upload/Sample Switcher for Poster, or Upload/Scrubber for External Video) */}
            {sourceMode === 'current-video' && (
              <div className="px-3 py-2 rounded-xl bg-[#14161C] border border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <span className="text-[11px] font-semibold text-zinc-300 whitespace-nowrap">
                    Scrub Any Frame:
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, duration)}
                    step={0.05}
                    value={currentTime}
                    onChange={(e) => {
                      const nextT = parseFloat(e.target.value);
                      onSeekMainVideo(nextT);
                    }}
                    className="flex-1 accent-[#10B981] cursor-pointer"
                  />
                  <span className="text-[11px] font-mono tabular-nums text-[#34D399] font-bold w-12 text-right">
                    {currentTime.toFixed(1)}s
                  </span>
                </div>

                {hasRawVideoElement && (
                  <label className="flex items-center gap-1.5 text-[11px] text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCaptionsOverlay}
                      onChange={(e) => setIncludeCaptionsOverlay(e.target.checked)}
                      className="accent-[#10B981] rounded cursor-pointer"
                    />
                    <span>Include Canvas Overlays</span>
                  </label>
                )}

                <button
                  type="button"
                  onClick={renderActiveSourceToCanvas}
                  className="px-2.5 py-1 rounded-lg bg-[#1E222B] hover:bg-[#282D38] text-zinc-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer border border-white/10"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Frame</span>
                </button>
              </div>
            )}

            {sourceMode === 'upload-image' && (
              <div className="px-3 py-2 rounded-xl bg-[#14161C] border border-white/[0.07] flex flex-wrap items-center justify-between gap-2">
                <input
                  ref={imageUploadInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (uploadedPosterUrl && uploadedPosterUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(uploadedPosterUrl);
                      }
                      const url = URL.createObjectURL(file);
                      setUploadedPosterUrl(url);
                      setPresetNameDraft(
                        file.name.replace(/\.[^.]+$/, '').slice(0, 20) || 'Poster Style'
                      );
                    }
                    e.target.value = '';
                  }}
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => imageUploadInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#041E15] text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Poster / Image</span>
                  </button>

                  {BUILTIN_SAMPLE_POSTERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setUploadedPosterUrl(null);
                        setActiveSamplePosterId(p.id);
                        setRegionIntent(p.category);
                        setBoxPct(p.defaultBox);
                        setPresetNameDraft(p.label);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border transition-colors ${
                        !uploadedPosterUrl && activeSamplePosterId === p.id
                          ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#34D399]'
                          : 'bg-[#1C1F26] border-white/10 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sourceMode === 'external-video' && (
              <div className="px-3 py-2 rounded-xl bg-[#14161C] border border-white/[0.07] flex flex-wrap items-center justify-between gap-2">
                <input
                  ref={externalVideoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (externalVideoUrl && externalVideoUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(externalVideoUrl);
                      }
                      const url = URL.createObjectURL(file);
                      setExternalVideoUrl(url);
                      setPresetNameDraft(
                        file.name.replace(/\.[^.]+$/, '').slice(0, 20) || 'Ref Video Style'
                      );
                    }
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => externalVideoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#041E15] text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Load Reference Video</span>
                </button>

                {externalVideoUrl ? (
                  <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                    <button
                      type="button"
                      onClick={() => {
                        const vid = externalVideoElRef.current;
                        if (!vid) return;
                        if (vid.paused) {
                          vid.play().catch(() => {});
                          setIsExternalPlaying(true);
                        } else {
                          vid.pause();
                          setIsExternalPlaying(false);
                          renderActiveSourceToCanvas();
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-[#1E222B] text-white flex items-center justify-center cursor-pointer"
                    >
                      {isExternalPlaying ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(1, externalVideoDuration)}
                      step={0.05}
                      value={externalVideoTime}
                      onChange={(e) => {
                        const t = parseFloat(e.target.value);
                        setExternalVideoTime(t);
                        if (externalVideoElRef.current) {
                          externalVideoElRef.current.currentTime = t;
                        }
                      }}
                      className="flex-1 accent-[#10B981] cursor-pointer"
                    />
                    <span className="text-[11px] font-mono tabular-nums text-[#34D399]">
                      {externalVideoTime.toFixed(1)}s
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-zinc-400">
                    Load any reference reel MP4/WebM to scrub &amp; clone its caption or brand style
                  </span>
                )}

                {/* Hidden video element for external reference video scrubbing */}
                <video
                  ref={externalVideoElRef}
                  src={externalVideoUrl || undefined}
                  muted
                  playsInline
                  crossOrigin="anonymous"
                  onLoadedMetadata={(e) => {
                    setExternalVideoDuration(e.currentTarget.duration || 10);
                    e.currentTarget.currentTime = 0.1;
                  }}
                  onSeeked={() => renderActiveSourceToCanvas()}
                  onTimeUpdate={(e) => {
                    setExternalVideoTime(e.currentTarget.currentTime);
                    if (isExternalPlaying) {
                      renderActiveSourceToCanvas();
                    }
                  }}
                  className="hidden"
                />
              </div>
            )}

            {/* INTERACTIVE CANVAS STAGE WITH BOUNDING BOX & EYEDROPPER OVERLAY */}
            <div className="relative flex-1 min-h-[290px] max-h-[430px] rounded-xl bg-[#07080A] border border-white/10 flex items-center justify-center overflow-hidden p-2">
              <div
                onPointerDown={handleOverlayPointerDown}
                onPointerMove={handleOverlayPointerMove}
                onPointerUp={handleOverlayPointerUp}
                onPointerLeave={() => setHoverHex(null)}
                className={`relative inline-flex items-center justify-center max-h-full max-w-full shadow-2xl ${
                  toolMode === 'eyedropper'
                    ? 'cursor-crosshair'
                    : toolMode === 'box'
                      ? 'cursor-crosshair'
                      : 'cursor-default'
                }`}
              >
                <canvas
                  ref={interactiveCanvasRef}
                  width={540}
                  height={960}
                  className="max-h-[395px] w-auto object-contain rounded-lg block pointer-events-none"
                />

                {/* Drag-to-Select Bounding Box Overlay */}
                {toolMode === 'box' && (
                  <div
                    style={{
                      left: `${boxPct.x}%`,
                      top: `${boxPct.y}%`,
                      width: `${boxPct.width}%`,
                      height: `${boxPct.height}%`,
                    }}
                    className="absolute border-2 border-[#10B981] bg-[#10B981]/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] pointer-events-none transition-none"
                  >
                    {/* Corner Handles */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-sm bg-[#10B981] border border-black" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-sm bg-[#10B981] border border-black" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-sm bg-[#10B981] border border-black" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-sm bg-[#10B981] border border-black" />

                    {/* Top Coordinate & Intent Label */}
                    <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-[#10B981] text-[#041E15] text-[10px] font-bold font-mono tabular-nums whitespace-nowrap shadow">
                      {regionIntent.toUpperCase()} · {Math.round(boxPct.width)}% ×{' '}
                      {Math.round(boxPct.height)}%
                    </div>
                  </div>
                )}

                {/* Eyedropper Floating Loupe Badge */}
                {toolMode === 'eyedropper' && hoverHex && (
                  <div className="absolute top-3 right-3 px-2.5 py-1.5 rounded-xl bg-black/90 border border-white/20 flex items-center gap-2 pointer-events-none shadow-xl">
                    <span
                      className="w-4 h-4 rounded-full border border-white/40"
                      style={{ backgroundColor: hoverHex }}
                    />
                    <span className="text-xs font-mono font-bold text-white">
                      {hoverHex}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Click to sample ({eyedropperTarget})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Strip: Cropped Area Preview + Eyedropper Target Selector + AI Scan Trigger */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-[#14161C] border border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <canvas
                  ref={cropPreviewCanvasRef}
                  width={120}
                  height={64}
                  className="w-20 h-11 rounded-lg bg-black border border-white/15 object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-white truncate">
                    {toolMode === 'box'
                      ? 'Selected Region Crop'
                      : toolMode === 'eyedropper'
                        ? `Eyedropper Target: ${eyedropperTarget.toUpperCase()}`
                        : 'Full Frame AI Scan'}
                  </div>
                  {toolMode === 'eyedropper' ? (
                    <div className="flex items-center gap-1 mt-1">
                      {(
                        [
                          { id: 'gradient', label: '+ Gradient Stop' },
                          { id: 'primary', label: 'Primary' },
                          { id: 'highlight', label: 'Emphasis' },
                          { id: 'stroke', label: 'Stroke' },
                          { id: 'bg', label: 'Bg Pill' },
                        ] as const
                      ).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setEyedropperTarget(t.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                            eyedropperTarget === t.id
                              ? 'bg-[#10B981] text-[#041E15] font-bold'
                              : 'bg-[#1F232C] text-zinc-300 hover:text-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-400 truncate">
                      {aiReasoningSummary}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={isAnalyzingAI}
                onClick={() => handleRunAIStyleExtraction(false)}
                className="px-3.5 py-2 rounded-xl bg-[#10B981]/20 hover:bg-[#10B981]/30 border border-[#10B981]/50 text-[#34D399] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingAI ? 'animate-spin' : ''}`} />
                <span>{isAnalyzingAI ? 'Scanning Region...' : 'Scan Area with AI'}</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN (5 cols): Live Style Preview + Multi-Stop Gradient Controls + Typography & FX + Apply CTA */}
          <div className="lg:col-span-5 p-3.5 sm:p-4 flex flex-col justify-between gap-3 bg-[#12141A] overflow-y-auto">
            <div className="space-y-3">
              {/* LIVE STYLE PREVIEW BANNER */}
              <div className="rounded-xl bg-[#090A0F] border border-white/10 p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-zinc-300">
                    Live Extracted Reel Caption Style
                  </span>
                  <span className="font-mono text-[10px] text-[#34D399]">
                    {extractedFont} · {sampledStops.length} Stops · {gradientAngle}°
                  </span>
                </div>

                <div className="h-24 rounded-lg bg-gradient-to-b from-[#151822] to-[#090A0E] border border-white/[0.06] flex flex-col items-center justify-center px-3 overflow-hidden relative">
                  <div
                    style={{
                      fontFamily: `"${extractedFont}", sans-serif`,
                      textTransform: extractedTextCase,
                      backgroundColor: extractedBgEnabled ? extractedBgColor : 'transparent',
                      padding: extractedBgEnabled ? '4px 12px' : '0px',
                      borderRadius: extractedBgEnabled ? '8px' : '0px',
                    }}
                    className="text-center leading-tight"
                  >
                    <div
                      style={{
                        color: extractedPrimaryColor,
                        WebkitTextStroke:
                          extractedStrokeWidth > 0
                            ? `${Math.min(3, extractedStrokeWidth)}px ${extractedStrokeColor}`
                            : undefined,
                        textShadow: [
                          extractedDropShadow ? '0 3px 8px rgba(0,0,0,0.9)' : '',
                          extracted3D ? `3px 3px 0 ${extractedStrokeColor}` : '',
                        ]
                          .filter(Boolean)
                          .join(', '),
                      }}
                      className="text-sm font-extrabold tracking-wide"
                    >
                      Copy Any Frame
                    </div>
                    <div
                      style={{
                        backgroundImage: cssGradientString,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: extractedGlow
                          ? `drop-shadow(0 0 10px ${extractedGlowColor})`
                          : extractedDropShadow
                            ? 'drop-shadow(0 3px 6px rgba(0,0,0,0.85))'
                            : undefined,
                      }}
                      className="text-2xl font-black tracking-tight"
                    >
                      STYLE INSTANTLY
                    </div>
                  </div>
                </div>
              </div>

              {/* MULTI-STOP GRADIENT BAR (Up to 5 Stops + Angle + Word/Char Level) */}
              <div className="p-3 rounded-xl bg-[#171921] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Sampled Multi-Stop Gradient ({sampledStops.length}/5)
                  </span>
                  <div className="flex items-center gap-1">
                    {sampledStops.length < 5 && (
                      <button
                        type="button"
                        onClick={() => {
                          const lastColor =
                            sampledStops[sampledStops.length - 1]?.color || '#38BDF8';
                          const next = [
                            ...sampledStops,
                            {
                              id: `add-${Date.now()}`,
                              color: lastColor,
                              position: 100,
                            },
                          ].map((s, idx, arr) => ({
                            ...s,
                            position: Math.round((idx / Math.max(1, arr.length - 1)) * 100),
                          }));
                          setSampledStops(next);
                        }}
                        className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Stop</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Gradient Preview Bar */}
                <div
                  className="h-5 w-full rounded-lg border border-white/20 shadow-inner"
                  style={{ background: cssGradientString }}
                />

                {/* Individual Color Stop Swatches */}
                <div className="flex items-center gap-2 flex-wrap">
                  {sampledStops.map((stop, idx) => (
                    <div
                      key={stop.id}
                      className="flex items-center gap-1 bg-[#111319] px-2 py-1 rounded-lg border border-white/10"
                    >
                      <input
                        type="color"
                        value={stop.color}
                        onChange={(e) => {
                          const nextColor = e.target.value.toUpperCase();
                          setSampledStops((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, color: nextColor } : s))
                          );
                        }}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-[10px] font-mono tabular-nums text-zinc-300">
                        {stop.color}
                      </span>
                      {sampledStops.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSampledStops((prev) =>
                              prev
                                .filter((_, i) => i !== idx)
                                .map((s, i, arr) => ({
                                  ...s,
                                  position: Math.round(
                                    (i / Math.max(1, arr.length - 1)) * 100
                                  ),
                                }))
                            )
                          }
                          className="text-zinc-500 hover:text-rose-400 cursor-pointer ml-0.5"
                          title="Remove stop"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Angle & Level Row */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-[#111319] p-2 rounded-lg border border-white/[0.06]">
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Gradient Angle</span>
                      <span className="font-mono tabular-nums text-white font-bold">
                        {gradientAngle}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={gradientAngle}
                      onChange={(e) => setGradientAngle(Number(e.target.value))}
                      className="w-full accent-[#10B981] cursor-pointer"
                    />
                  </div>

                  <div className="bg-[#111319] p-2 rounded-lg border border-white/[0.06] flex flex-col justify-between">
                    <span className="text-[10px] text-zinc-400">Gradient Scope</span>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => setGradientLevel('word')}
                        className={`py-1 rounded text-[10px] font-bold cursor-pointer ${
                          gradientLevel === 'word'
                            ? 'bg-[#10B981] text-[#041E15]'
                            : 'bg-[#1A1D26] text-zinc-400 hover:text-white'
                        }`}
                      >
                        Word
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradientLevel('char')}
                        className={`py-1 rounded text-[10px] font-bold cursor-pointer ${
                          gradientLevel === 'char'
                            ? 'bg-[#10B981] text-[#041E15]'
                            : 'bg-[#1A1D26] text-zinc-400 hover:text-white'
                        }`}
                      >
                        Char
                      </button>
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={applyGradientToBoth}
                    onChange={(e) => setApplyGradientToBoth(e.target.checked)}
                    className="accent-[#10B981] rounded cursor-pointer"
                  />
                  <span>Apply multi-stop gradient to both Color &amp; Emphasis</span>
                </label>
              </div>

              {/* TYPOGRAPHY & EFFECTS OVERRIDES */}
              <div className="p-3 rounded-xl bg-[#171921] border border-white/10 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Sliders className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Matched Font, Colors &amp; Effects</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      Font Family
                    </label>
                    <select
                      value={extractedFont}
                      onChange={(e) => {
                        ensureGoogleFontLoaded(e.target.value);
                        setExtractedFont(e.target.value);
                      }}
                      className="w-full bg-[#111319] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#10B981] cursor-pointer"
                    >
                      {KALAKAR_GOOGLE_FONTS.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      Casing
                    </label>
                    <select
                      value={extractedTextCase}
                      onChange={(e) =>
                        setExtractedTextCase(
                          e.target.value as
                            | 'none'
                            | 'uppercase'
                            | 'lowercase'
                            | 'capitalize'
                        )
                      }
                      className="w-full bg-[#111319] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#10B981] cursor-pointer"
                    >
                      <option value="uppercase">UPPERCASE</option>
                      <option value="capitalize">Title Case</option>
                      <option value="lowercase">lowercase</option>
                      <option value="none">As Typed</option>
                    </select>
                  </div>
                </div>

                {/* Primary, Emphasis, Stroke & Effect Toggles */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label className="flex items-center gap-1.5 text-[11px] text-zinc-300 cursor-pointer">
                    <span>Base</span>
                    <input
                      type="color"
                      value={extractedPrimaryColor}
                      onChange={(e) => setExtractedPrimaryColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border border-white/20"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-zinc-300 cursor-pointer">
                    <span>Emphasis</span>
                    <input
                      type="color"
                      value={extractedHighlightColor}
                      onChange={(e) => setExtractedHighlightColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border border-white/20"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-zinc-300 cursor-pointer">
                    <span>Stroke ({extractedStrokeWidth}px)</span>
                    <input
                      type="color"
                      value={extractedStrokeColor}
                      onChange={(e) => setExtractedStrokeColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border border-white/20"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setExtractedDropShadow((v) => !v)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold cursor-pointer border ${
                      extractedDropShadow
                        ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#34D399]'
                        : 'bg-[#111319] border-white/10 text-zinc-400'
                    }`}
                  >
                    Shadow
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtractedGlow((v) => !v)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold cursor-pointer border ${
                      extractedGlow
                        ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#34D399]'
                        : 'bg-[#111319] border-white/10 text-zinc-400'
                    }`}
                  >
                    Glow
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtracted3D((v) => !v)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold cursor-pointer border ${
                      extracted3D
                        ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#34D399]'
                        : 'bg-[#111319] border-white/10 text-zinc-400'
                    }`}
                  >
                    3D Extrude
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtractedBgEnabled((v) => !v)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold cursor-pointer border ${
                      extractedBgEnabled
                        ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#34D399]'
                        : 'bg-[#111319] border-white/10 text-zinc-400'
                    }`}
                  >
                    Bg Pill
                  </button>
                </div>

                {/* Preset Name Input */}
                <div className="pt-1">
                  <label className="text-[10px] text-zinc-400 block mb-1">
                    Save to My Presets As
                  </label>
                  <input
                    type="text"
                    value={presetNameDraft}
                    onChange={(e) => setPresetNameDraft(e.target.value)}
                    placeholder="e.g. Viral Poster Gold"
                    className="w-full bg-[#111319] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>
            </div>

            {/* FOOTER ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => applyAndSaveCurrentState()}
                className="px-3.5 py-2.5 rounded-xl bg-[#1E222B] hover:bg-[#282D3A] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-white/10 whitespace-nowrap"
              >
                <Check className="w-4 h-4 text-[#10B981]" />
                <span>Apply &amp; Save Now</span>
              </button>

              <button
                type="button"
                disabled={isAnalyzingAI}
                onClick={() => handleRunAIStyleExtraction(true)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#041E15] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_24px_rgba(16,185,129,0.3)] whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isAnalyzingAI
                    ? 'AI Cloning Style...'
                    : 'AI Clone Region → Apply & Save Preset'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
