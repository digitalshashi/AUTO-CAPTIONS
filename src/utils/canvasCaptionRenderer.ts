import {
  AIBRollSlot,
  BRollDisplayLayout,
  BRollMagicalEffect,
  BRollMotionPreset,
  CaptionSegment,
  CaptionStyleConfig,
  SampleReel,
  VideoAspectRatio,
  WordTiming,
} from '../types/caption';
import {
  getCachedBRollImageElement,
  synthesizeStudioBRollArtworkDataUrl,
} from './aiBRollGenerator';
import {
  renderForegroundSubjectCutoutLayer,
  updateVideoSubjectDepthMatte,
} from './depthSubjectSegmentation';
import {
  isRomanTrack,
  transliterateIndicToRoman,
} from './indicRomanTransliterator';
import {
  stripEmojisFromText,
  stripPunctuationFromText,
} from '../data/kalakarOptionsData';

let lastValidVideoFrameCanvas: HTMLCanvasElement | null = null;
let lastValidVideoSrc = '';

export function clearCachedVideoFrame() {
  lastValidVideoFrameCanvas = null;
  lastValidVideoSrc = '';
}

// Feature Flag: Behind-the-Head AI Cutout Module (Disabled for now per user request; preserved intact for future activation)
export const BEHIND_THE_HEAD_MODULE_ENABLED = false;

function hexToRgba(hex: string, alpha: number): string {
  const clean = (hex || '#000000').replace('#', '');
  const bigint = parseInt(
    clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function transformWord(word: string, mode: CaptionStyleConfig['textTransform']): string {
  if (mode === 'uppercase') return word.toUpperCase();
  if (mode === 'lowercase') return word.toLowerCase();
  if (mode === 'capitalize') {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  return word;
}

function getWordFontStack(family: string): string {
  return `"${family}", "Noto Sans Arabic", "Noto Sans Telugu", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Kannada", "Noto Sans Malayalam", "Plus Jakarta Sans", sans-serif`;
}

function applyCanvasLetterSpacing(ctx: CanvasRenderingContext2D, px: number | undefined) {
  const val = Number(px || 0);
  if ('letterSpacing' in ctx) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${val}px`;
  }
}

function addMultiStopColors(
  grad: CanvasGradient,
  style: CaptionStyleConfig,
  shimmer = 0,
  customStops?: { color: string; position: number }[]
) {
  const stopsToUse =
    customStops && customStops.length >= 2
      ? customStops
      : style.gradientStops && style.gradientStops.length >= 2
      ? style.gradientStops
      : null;

  if (stopsToUse) {
    const sorted = [...stopsToUse].sort((a, b) => a.position - b.position);
    sorted.forEach((s, idx) => {
      const basePos = Math.max(0, Math.min(1, s.position / 100));
      const shiftedPos =
        idx === 0 || idx === sorted.length - 1
          ? basePos
          : Math.max(0.02, Math.min(0.98, basePos + shimmer * 0.4));
      grad.addColorStop(shiftedPos, s.color || '#FFFFFF');
    });
    return;
  }

  const c1 = style.gradientStart || '#FFFFFF';
  const c2 = style.gradientMid || '#FDE047';
  const c3 = style.gradientEnd || '#EAB308';
  const c4 = style.gradientFourth;

  if (c4) {
    grad.addColorStop(0, c1);
    grad.addColorStop(Math.max(0.12, Math.min(0.55, 0.33 + shimmer)), c2);
    grad.addColorStop(Math.max(0.45, Math.min(0.88, 0.68 + shimmer)), c3);
    grad.addColorStop(1, c4);
  } else {
    grad.addColorStop(0, c1);
    grad.addColorStop(Math.max(0.15, Math.min(0.85, 0.48 + shimmer)), c2);
    grad.addColorStop(1, c3);
  }
}

/**
 * Creates a live 60fps animated linear gradient (horizontal/diagonal/vertical) for standard kinetic modes.
 */
function createAnimatedWordGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  fontSize: number,
  currentTime: number,
  style: CaptionStyleConfig
): string | CanvasGradient {
  if (!style.useGradient) {
    return style.highlightColor;
  }

  const speed = style.gradientSpeed || 1.5;
  const phase = (currentTime * speed) % 2;
  const shift = Math.sin(phase * Math.PI) * (width * 0.35);
  const shimmer = 0.07 * Math.sin(currentTime * speed * 2.2);

  const effectiveSpanW =
    style.gradientLevel === 'char' ? Math.max(24, fontSize * 0.72) : width;

  if (style.gradientAngle !== undefined || (style.gradientStops && style.gradientStops.length >= 2)) {
    const cssAngle = style.gradientAngle ?? 90;
    const rad = ((cssAngle - 90) * Math.PI) / 180;
    const rx = (Math.cos(rad) * effectiveSpanW) / 2;
    const ry = (Math.sin(rad) * fontSize) / 2;
    const grad = ctx.createLinearGradient(-rx + shift * 0.3, -ry, rx + shift * 0.3, ry);
    addMultiStopColors(grad, style, shimmer);
    return grad;
  }

  const dir = style.gradientDirection || 'vertical';
  if (dir === 'vertical') {
    const grad = ctx.createLinearGradient(0, -fontSize * 0.54, 0, fontSize * 0.5);
    addMultiStopColors(grad, style, shimmer);
    return grad;
  }
  if (dir === 'radial') {
    const r = Math.max(20, Math.max(effectiveSpanW, fontSize) * 0.65);
    const grad = ctx.createRadialGradient(shift * 0.2, 0, 2, 0, 0, r);
    addMultiStopColors(grad, style, shimmer);
    return grad;
  }
  if (dir === 'horizontal') {
    const grad = ctx.createLinearGradient(
      -effectiveSpanW / 2 + shift,
      0,
      effectiveSpanW / 2 + shift,
      0
    );
    addMultiStopColors(grad, style, shimmer);
    return grad;
  }

  const angleRad = ((style.gradientAngle ?? 45) * Math.PI) / 180;
  const rx = (Math.cos(angleRad) * effectiveSpanW) / 2;
  const ry = (Math.sin(angleRad) * fontSize) / 2;
  const grad = ctx.createLinearGradient(-rx + shift, -ry, rx + shift, ry);
  addMultiStopColors(grad, style, shimmer);
  return grad;
}

/**
 * Creates the signature SIDZ / Merupify luminous multi-stop gradient (supports up to 5 stops, custom Angle 0-360°, and Word/Char level).
 */
function createSidzVerticalGradient(
  ctx: CanvasRenderingContext2D,
  fontSize: number,
  currentTime: number,
  style: CaptionStyleConfig,
  textWidth = 240
): string | CanvasGradient {
  if (!style.useGradient) {
    return style.highlightColor;
  }
  const speed = style.gradientSpeed || 1.5;
  const shimmer = 0.08 * Math.sin(currentTime * speed * 2.4);
  const spanWidth =
    style.gradientLevel === 'char' ? Math.max(28, fontSize * 0.72) : Math.max(60, textWidth);

  if (style.gradientAngle !== undefined || (style.gradientStops && style.gradientStops.length >= 2)) {
    const cssAngle = style.gradientAngle ?? 90;
    const rad = ((cssAngle - 90) * Math.PI) / 180;
    const halfW = spanWidth * 0.5;
    const halfH = fontSize * 0.54;
    const grad = ctx.createLinearGradient(
      -Math.cos(rad) * halfW,
      -Math.sin(rad) * halfH,
      Math.cos(rad) * halfW,
      Math.sin(rad) * halfH
    );
    addMultiStopColors(grad, style, shimmer);
    return grad;
  }

  const dir = style.gradientDirection || 'vertical';

  if (dir === 'horizontal') {
    const halfW = spanWidth * 0.5;
    const grad = ctx.createLinearGradient(-halfW, 0, halfW, 0);
    addMultiStopColors(grad, style, shimmer);
    return grad;
  }
  if (dir === 'diagonal') {
    const angleRad = ((style.gradientAngle ?? 135) * Math.PI) / 180;
    const halfW = spanWidth * 0.45;
    const halfH = fontSize * 0.52;
    const grad = ctx.createLinearGradient(
      -Math.cos(angleRad) * halfW,
      -Math.sin(angleRad) * halfH,
      Math.cos(angleRad) * halfW,
      Math.sin(angleRad) * halfH
    );
    addMultiStopColors(grad, style, shimmer);
    return grad;
  }
  if (dir === 'radial') {
    const r = Math.max(40, Math.max(spanWidth * 0.5, fontSize * 0.7));
    const grad = ctx.createRadialGradient(0, -fontSize * 0.1, 4, 0, 0, r);
    addMultiStopColors(grad, style, shimmer);
    return grad;
  }

  const topY = -fontSize * 0.54;
  const botY = fontSize * 0.5;
  const grad = ctx.createLinearGradient(0, topY, 0, botY);
  addMultiStopColors(grad, style, shimmer);
  return grad;
}

/**
 * Creates the Base Text fill style (either solid primaryColor OR multi-stop baseGradientStops when COLOR -> Gradient is active).
 */
function createBaseTextFill(
  ctx: CanvasRenderingContext2D,
  fontSize: number,
  currentTime: number,
  style: CaptionStyleConfig,
  textWidth = 200
): string | CanvasGradient {
  if (!style.useBaseGradient) {
    return style.primaryColor || '#FFFFFF';
  }
  const speed = style.gradientSpeed || 1.5;
  const shimmer = 0.06 * Math.sin(currentTime * speed * 2.0);
  const spanWidth =
    style.baseGradientLevel === 'char'
      ? Math.max(26, fontSize * 0.72)
      : Math.max(60, textWidth);
  const cssAngle = style.baseGradientAngle ?? 90;
  const rad = ((cssAngle - 90) * Math.PI) / 180;
  const halfW = spanWidth * 0.5;
  const halfH = fontSize * 0.54;
  const grad = ctx.createLinearGradient(
    -Math.cos(rad) * halfW,
    -Math.sin(rad) * halfH,
    Math.cos(rad) * halfW,
    Math.sin(rad) * halfH
  );
  const baseStops =
    style.baseGradientStops && style.baseGradientStops.length >= 2
      ? style.baseGradientStops
      : [
          { id: 'b1', color: '#9A6515', position: 0 },
          { id: 'b2', color: '#DFB249', position: 42 },
          { id: 'b3', color: '#FFF6C3', position: 52 },
          { id: 'b4', color: '#8C5811', position: 100 },
        ];
  addMultiStopColors(grad, style, shimmer, baseStops);
  return grad;
}

/**
 * Draws the dynamic Instagram / CapCut / Premiere Pro frame that moves with the caption block
 * wherever the text is positioned on screen.
 */
function drawCaptionDynamicFrame(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  blockWidth: number,
  blockHeight: number,
  style: CaptionStyleConfig
) {
  const frameMode = style.captionFrameStyle || 'none';
  if (frameMode === 'none') return;

  const padX = 28;
  const padY = 20;
  const x = centerX - blockWidth / 2 - padX;
  const y = centerY - blockHeight / 2 - padY;
  const w = blockWidth + padX * 2;
  const h = blockHeight + padY * 2;

  ctx.save();

  if (frameMode === 'ig-glass-pill') {
    ctx.fillStyle = 'rgba(12, 14, 22, 0.72)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 22;
    drawRoundedRect(ctx, x, y, w, h, 24);
    ctx.fill();

    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.stroke();

    // Small Instagram pill header tag on top-left of the caption frame
    const tagW = 104;
    const tagH = 20;
    const tagGrad = ctx.createLinearGradient(x + 14, y - 10, x + 14 + tagW, y + 10);
    tagGrad.addColorStop(0, '#F58529');
    tagGrad.addColorStop(0.5, '#DD2A7B');
    tagGrad.addColorStop(1, '#8134AF');
    ctx.fillStyle = tagGrad;
    drawRoundedRect(ctx, x + 16, y - 10, tagW, tagH, 10);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('● REEL CAPTION', x + 16 + tagW / 2, y);
  } else if (frameMode === 'ig-story-card') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 24;
    drawRoundedRect(ctx, x, y, w, h, 20);
    ctx.fill();

    const borderGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    borderGrad.addColorStop(0, style.gradientStart || '#FF1E96');
    borderGrad.addColorStop(0.5, style.gradientMid || '#FFD700');
    borderGrad.addColorStop(1, style.gradientEnd || '#56E0FF');
    ctx.lineWidth = 3;
    ctx.strokeStyle = borderGrad;
    ctx.stroke();
  } else if (frameMode === 'ig-polaroid-frame') {
    const topBarH = 34;
    const bottomBarH = 54;
    const frameX = x - 10;
    const frameY = y - topBarH - 6;
    const frameW = Math.max(w + 20, 290);
    const alignedX = centerX - frameW / 2;
    const totalFrameH = topBarH + h + bottomBarH + 12;

    // Outer Instagram Photo Frame Card
    ctx.fillStyle = 'rgba(14, 15, 22, 0.88)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 28;
    drawRoundedRect(ctx, alignedX, frameY, frameW, totalFrameH, 18);
    ctx.fill();

    // Instagram gradient border
    const igGrad = ctx.createLinearGradient(
      alignedX,
      frameY,
      alignedX + frameW,
      frameY + totalFrameH
    );
    igGrad.addColorStop(0, '#F58529');
    igGrad.addColorStop(0.35, '#DD2A7B');
    igGrad.addColorStop(0.7, '#8134AF');
    igGrad.addColorStop(1, '#515BD4');
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = igGrad;
    ctx.stroke();

    // Top Instagram Header Strip inside the moving frame
    const headerCenterY = frameY + topBarH / 2 + 2;
    ctx.beginPath();
    ctx.arc(alignedX + 20, headerCenterY, 9, 0, Math.PI * 2);
    ctx.fillStyle = igGrad;
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('vakyareel.studio  •  Follow', alignedX + 35, headerCenterY);

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textAlign = 'right';
    ctx.fillText('•••', alignedX + frameW - 14, headerCenterY);

    // Subtle divider below header
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(alignedX + 8, frameY + topBarH + 2);
    ctx.lineTo(alignedX + frameW - 8, frameY + topBarH + 2);
    ctx.stroke();

    // Divider above bottom Instagram Share / Comment / Like bar
    const botTopY = y + h + 4;
    ctx.beginPath();
    ctx.moveTo(alignedX + 8, botTopY);
    ctx.lineTo(alignedX + frameW - 8, botTopY);
    ctx.stroke();

    const iconRowY = botTopY + 18;
    // 1. Red Heart (Like)
    ctx.fillStyle = '#FF3040';
    ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('♥', alignedX + 14, iconRowY);

    // 2. Vector Comment Bubble
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(alignedX + 44, iconRowY - 1, 7, 0.25 * Math.PI, 1.95 * Math.PI);
    ctx.lineTo(alignedX + 51, iconRowY + 6);
    ctx.lineTo(alignedX + 46, iconRowY + 5);
    ctx.closePath();
    ctx.stroke();

    // 3. Vector Paper Plane (Share)
    ctx.beginPath();
    ctx.moveTo(alignedX + 64, iconRowY - 6);
    ctx.lineTo(alignedX + 78, iconRowY - 1);
    ctx.lineTo(alignedX + 69, iconRowY + 2);
    ctx.lineTo(alignedX + 67, iconRowY + 7);
    ctx.closePath();
    ctx.stroke();

    // 4. Carousel Dots in center
    ctx.fillStyle = '#0A84FF';
    ctx.beginPath();
    ctx.arc(centerX - 6, iconRowY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(centerX + 2, iconRowY, 2, 0, Math.PI * 2);
    ctx.arc(centerX + 9, iconRowY, 2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Vector Bookmark (Save) on right
    const bmX = alignedX + frameW - 24;
    ctx.beginPath();
    ctx.moveTo(bmX, iconRowY - 7);
    ctx.lineTo(bmX + 11, iconRowY - 7);
    ctx.lineTo(bmX + 11, iconRowY + 7);
    ctx.lineTo(bmX + 5.5, iconRowY + 2.5);
    ctx.lineTo(bmX, iconRowY + 7);
    ctx.closePath();
    ctx.stroke();

    // Bottom likes & comments caption bar inside the moving frame
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Liked by creators and 28.4K others · View comments', alignedX + 14, botTopY + 39);
  } else if (frameMode === 'ig-neon-border') {
    const neonGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    neonGrad.addColorStop(0, style.gradientStart || '#00E5FF');
    neonGrad.addColorStop(0.5, style.gradientMid || '#FF1E96');
    neonGrad.addColorStop(1, style.gradientEnd || '#FFE066');
    ctx.shadowColor = style.gradientMid || '#FF1E96';
    ctx.shadowBlur = 24;
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = neonGrad;
    drawRoundedRect(ctx, x, y, w, h, 18);
    ctx.stroke();
  } else if (frameMode === 'premiere-bounding-box') {
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // 8 Transform Handles (Corners + Midpoints like Premiere Pro / CapCut)
    const pts = [
      [x, y],
      [x + w / 2, y],
      [x + w, y],
      [x + w, y + h / 2],
      [x + w, y + h],
      [x + w / 2, y + h],
      [x, y + h],
      [x, y + h / 2],
    ];
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1.5;
    for (const [px, py] of pts) {
      ctx.fillRect(px - 4.5, py - 4.5, 9, 9);
      ctx.strokeRect(px - 4.5, py - 4.5, 9, 9);
    }
  }

  ctx.restore();
}

/**
 * Draws clean sentence-case text with the signature After Effects RGB Chromatic Aberration edge
 * (subtle red-orange left shift + cyan right shift + soft dark drop shadow + pure white fill)
 * seen on "There are", "I have a", "and that they are gonna be", and "understand it,".
 */
function drawChromaticSmallPhrase(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fontFamily: string,
  align: CanvasTextAlign,
  primaryColor: string,
  letterSpacing = 0
) {
  if (!text) return;
  ctx.save();
  ctx.font = `500 ${fontSize}px ${getWordFontStack(fontFamily)}`;
  applyCanvasLetterSpacing(ctx, letterSpacing);
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  // 1. Deep soft ambient shadow for legibility over bright white shirts or studio backgrounds
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.92)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.strokeText(text, x, y);
  ctx.restore();

  // 2. Warm Red/Orange Chromatic Left Fringe
  ctx.fillStyle = 'rgba(255, 68, 42, 0.78)';
  ctx.fillText(text, x - 1.8, y - 0.5);

  // 3. Electric Cyan Chromatic Right Fringe
  ctx.fillStyle = 'rgba(0, 228, 255, 0.78)';
  ctx.fillText(text, x + 1.8, y + 0.5);

  // 4. Crisp Pure White Core Text
  ctx.fillStyle = primaryColor || '#FFFFFF';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Draws the overlapping cursive script tail word (e.g., "product" in "I have a / 20,000 / product")
 * with warm chromatic edge & deep drop shadow.
 */
function drawSidzScriptTailPhrase(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  scriptFontFamily: string,
  letterSpacing = 0
) {
  if (!text) return;
  ctx.save();
  ctx.font = `700 ${fontSize}px "${scriptFontFamily}", "Kaushan Script", "Pacifico", cursive, sans-serif`;
  applyCanvasLetterSpacing(ctx, letterSpacing);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  // Soft dark shadow + thin dark edge
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.82)';
  ctx.strokeText(text, x, y);
  ctx.restore();

  // Subtle warm orange + cyan chromatic fringe on script tail
  ctx.fillStyle = 'rgba(255, 90, 31, 0.8)';
  ctx.fillText(text, x - 1.6, y + 0.8);
  ctx.fillStyle = 'rgba(0, 225, 255, 0.75)';
  ctx.fillText(text, x + 1.6, y - 0.6);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(text, x, y);
  ctx.restore();
}

let latestRenderedLayerHitBoxes: import('../types/caption').LayerHitBox[] = [];

export function getLatestLayerHitBoxes(): import('../types/caption').LayerHitBox[] {
  return latestRenderedLayerHitBoxes;
}

function clampHorizontalCenter(
  desiredX: number,
  textWidth: number,
  align: 'left' | 'center' | 'right',
  canvasWidth: number
): number {
  // Allow full horizontal placement across the screen while keeping at least 15% of text visible on screen
  const minEdge = -textWidth * 0.35;
  const maxEdge = canvasWidth + textWidth * 0.35;
  if (align === 'center') {
    return Math.max(canvasWidth * 0.03, Math.min(canvasWidth * 0.97, desiredX));
  }
  if (align === 'left') {
    return Math.max(minEdge, Math.min(canvasWidth * 0.95, desiredX));
  }
  return Math.max(canvasWidth * 0.05, Math.min(maxEdge, desiredX));
}

interface TransitionTransformResult {
  dx: number;
  dy: number;
  scaleX: number;
  scaleY: number;
  rotationRad: number;
  alpha: number;
}

/**
 * Computes live Entrance (IN), Hold (HOLD), and Exit (OUT) animation transforms
 * so any selected transition from the Transitions tab animates every template on screen.
 */
function computeTransitionTransform(
  currentTime: number,
  segStart: number,
  segEnd: number,
  style: CaptionStyleConfig
): TransitionTransformResult {
  const speed = Math.max(0.4, style.animationSpeed || 1);
  const segElapsed = Math.max(0, currentTime - segStart);
  const segRemaining = Math.max(0, segEnd - currentTime);
  const inDur = Math.min(0.38, Math.max(0.16, 0.28 / speed));
  const outDur = Math.min(0.32, Math.max(0.14, 0.22 / speed));

  let dx = 0;
  let dy = 0;
  let scaleX = 1;
  let scaleY = 1;
  let rotationRad = 0;
  let alpha = 1;

  const transIn = style.transitionIn || 'None';
  if (transIn !== 'None' && segElapsed < inDur) {
    const p = Math.max(0, Math.min(1, segElapsed / inDur));
    const easeOut = 1 - Math.pow(1 - p, 3);
    const inv = 1 - easeOut;
    switch (transIn) {
      case 'Slide Up':
        dy += inv * 46;
        alpha *= easeOut;
        break;
      case 'Slide Down':
        dy -= inv * 46;
        alpha *= easeOut;
        break;
      case 'Slide Left':
        dx += inv * 68;
        alpha *= easeOut;
        break;
      case 'Slide Right':
        dx -= inv * 68;
        alpha *= easeOut;
        break;
      case 'Fade':
      case 'Blur':
        alpha *= easeOut;
        break;
      case 'Pop':
      case 'Zoom':
      case 'Scale': {
        const s = 0.65 + 0.35 * easeOut + 0.08 * Math.sin(p * Math.PI);
        scaleX *= s;
        scaleY *= s;
        alpha *= Math.min(1, p * 2.2);
        break;
      }
      case 'Punch': {
        const slam = 1.45 - 0.45 * easeOut;
        scaleX *= slam;
        scaleY *= slam;
        alpha *= Math.min(1, p * 2.5);
        break;
      }
      case 'Stretch':
        scaleX *= 0.55 + 0.45 * easeOut;
        scaleY *= 1.35 - 0.35 * easeOut;
        alpha *= easeOut;
        break;
      case 'Spin':
        rotationRad += inv * -0.45;
        scaleX *= 0.7 + 0.3 * easeOut;
        scaleY *= 0.7 + 0.3 * easeOut;
        alpha *= easeOut;
        break;
      case 'Flip':
        scaleY *= Math.max(0.1, easeOut);
        alpha *= easeOut;
        break;
      case 'Wobble':
        rotationRad += Math.sin(p * Math.PI * 3) * 0.14 * inv;
        break;
      case 'Glitch':
        dx += (Math.sin(segElapsed * 90) > 0 ? 1 : -1) * inv * 14;
        break;
      case 'Flicker':
        alpha *= Math.abs(Math.sin(p * Math.PI * 4)) * 0.5 + 0.5 * easeOut;
        break;
    }
  }

  const transHold = style.transitionHold || 'None';
  if (transHold !== 'None') {
    const t = currentTime * speed;
    switch (transHold) {
      case 'Float':
        dy += Math.sin(t * 3.2) * 6;
        break;
      case 'Pulse': {
        const pulse = 1 + Math.sin(t * 5.5) * 0.045;
        scaleX *= pulse;
        scaleY *= pulse;
        break;
      }
      case 'Breathe': {
        const br = 1 + Math.sin(t * 2.6) * 0.03;
        scaleX *= br;
        scaleY *= br;
        break;
      }
      case 'Shake':
        dx += Math.sin(t * 22) * 3.5;
        dy += Math.cos(t * 19) * 2.5;
        break;
      case 'Wave':
        dy += Math.sin(t * 4.5) * 7;
        rotationRad += Math.cos(t * 4.5) * 0.025;
        break;
      case 'Swing':
        rotationRad += Math.sin(t * 3.6) * 0.045;
        break;
      case 'Flicker':
        alpha *= 0.82 + 0.18 * Math.sin(t * 18);
        break;
      case 'Jitter':
        dx += Math.sin(t * 34) * 2.2;
        rotationRad += Math.cos(t * 28) * 0.018;
        break;
    }
  }

  const transOut = style.transitionOut || 'None';
  if (transOut !== 'None' && segRemaining < outDur) {
    const p = Math.max(0, Math.min(1, 1 - segRemaining / outDur));
    const easeIn = p * p;
    switch (transOut) {
      case 'Slide Up':
        dy -= easeIn * 44;
        alpha *= 1 - easeIn;
        break;
      case 'Slide Down':
        dy += easeIn * 44;
        alpha *= 1 - easeIn;
        break;
      case 'Slide Left':
        dx -= easeIn * 64;
        alpha *= 1 - easeIn;
        break;
      case 'Slide Right':
        dx += easeIn * 64;
        alpha *= 1 - easeIn;
        break;
      case 'Fade':
      case 'Blur':
        alpha *= 1 - easeIn;
        break;
      case 'Pop':
      case 'Zoom':
      case 'Scale':
      case 'Punch': {
        const s = Math.max(0.2, 1 - easeIn * 0.45);
        scaleX *= s;
        scaleY *= s;
        alpha *= 1 - easeIn;
        break;
      }
      case 'Stretch':
        scaleX *= 1 + easeIn * 0.45;
        scaleY *= Math.max(0.15, 1 - easeIn * 0.65);
        alpha *= 1 - easeIn;
        break;
      case 'Spin':
        rotationRad += easeIn * 0.45;
        alpha *= 1 - easeIn;
        break;
      case 'Flip':
        scaleY *= Math.max(0.08, 1 - easeIn);
        alpha *= 1 - easeIn;
        break;
      case 'Wobble':
        rotationRad += Math.sin(p * Math.PI * 3) * 0.12;
        alpha *= 1 - easeIn;
        break;
      case 'Glitch':
        dx += (Math.sin(currentTime * 90) > 0 ? 1 : -1) * easeIn * 14;
        alpha *= 1 - easeIn;
        break;
      case 'Flicker':
        alpha *= (1 - easeIn) * (Math.abs(Math.sin(p * Math.PI * 4)) * 0.6 + 0.4);
        break;
    }
  }

  return { dx, dy, scaleX, scaleY, rotationRad, alpha };
}

function drawInteractiveLayerBoundingBox(
  ctx: CanvasRenderingContext2D,
  hitBox: import('../types/caption').LayerHitBox,
  isSelected: boolean,
  label: string
) {
  ctx.save();
  const padX = 10;
  const padY = 6;
  const bx = hitBox.x - padX;
  const by = hitBox.y - padY;
  const bw = hitBox.width + padX * 2;
  const bh = hitBox.height + padY * 2;

  ctx.strokeStyle = isSelected ? '#FDE047' : 'rgba(255, 255, 255, 0.38)';
  ctx.lineWidth = isSelected ? 2 : 1.2;
  ctx.setLineDash(isSelected ? [] : [5, 4]);
  drawRoundedRect(ctx, bx, by, bw, bh, 8);
  ctx.stroke();
  ctx.setLineDash([]);

  // Update handle coordinates to bottom-right of padded box
  hitBox.handleX = bx + bw;
  hitBox.handleY = by + bh;

  if (isSelected) {
    // Top-left label tag
    ctx.font = '700 10px "JetBrains Mono", monospace';
    const tagW = ctx.measureText(label).width + 12;
    const tagH = 18;
    const tagX = Math.max(6, Math.min(ctx.canvas.width - tagW - 6, bx));
    const tagY = Math.max(6, by - tagH - 4);

    ctx.fillStyle = '#FDE047';
    drawRoundedRect(ctx, tagX, tagY, tagW, tagH, 5);
    ctx.fill();

    ctx.fillStyle = '#090A0F';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, tagX + 6, tagY + tagH / 2);

    // Corner resize handle circle (bottom-right)
    ctx.fillStyle = '#FDE047';
    ctx.strokeStyle = '#090A0F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hitBox.handleX, hitBox.handleY, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renders the exact "Lala" (Paritosh Anand) Handwritten Caption Style:
 * - Line 1 (Top): Smaller handwritten script ("Arey Maalik, mein houn") in deep petrol-teal ink (#1C434C)
 * - Line 2 (Bottom Hero): Large bold handwritten script ("Paritosh Anand") in deep petrol-teal ink (#1C434C)
 * - Hand-drawn multi-stroke red-orange marker underline swoosh (#EB4823) beneath the Hero phrase
 * - Warm cream paper banner backdrop (#FAF6E8) with organic red-orange brush edge when backgroundOpacity > 0.05,
 *   or crisp cream sticker outline when floating directly over raw video.
 */
/**
 * Splits a CaptionSegment into Line 1, Line 2, and optional Line 3,
 * honoring explicit user overrides (`customLine1Text`, `customLine2Text`, `customLine3Text`)
 * and `maxLines` (1, 2, or 3).
 */
export function splitSegmentIntoTwoLines(
  seg: CaptionSegment | string,
  trackKey?: import('../types/caption').TrackKey | number,
  maxLines: number = 2
): { line1Text: string; line2Text: string; line3Text: string } {
  if (typeof seg === 'string' || !seg || !seg.tracks) {
    const rawStr = typeof seg === 'string' ? seg.trim() : '';
    if (!rawStr) {
      return { line1Text: '', line2Text: '', line3Text: '' };
    }
    const tokens = rawStr.split(/\s+/).filter(Boolean);
    if (tokens.length <= 1) {
      return { line1Text: rawStr, line2Text: '', line3Text: '' };
    }
    const mid = Math.max(1, Math.ceil(tokens.length / 2));
    return {
      line1Text: tokens.slice(0, mid).join(' '),
      line2Text: tokens.slice(mid).join(' '),
      line3Text: '',
    };
  }

  const resolvedTrackKey: import('../types/caption').TrackKey =
    typeof trackKey === 'string' ? trackKey : 'tinglish';
  const tr =
    seg.tracks[resolvedTrackKey] ||
    seg.tracks.tinglish ||
    seg.tracks.english ||
    Object.values(seg.tracks)[0];
  const words = tr?.words || [];
  const enforceRoman = isRomanTrack(resolvedTrackKey);
  const effectiveLines = seg.maxLines ?? seg.linesCountOverride ?? maxLines ?? 2;

  if (
    seg.customLine1Text !== undefined ||
    seg.customLine2Text !== undefined ||
    seg.customLine3Text !== undefined
  ) {
    const rawL1 = seg.customLine1Text ?? '';
    const rawL2 = seg.customLine2Text ?? '';
    const rawL3 = seg.customLine3Text ?? '';
    return {
      line1Text: enforceRoman ? transliterateIndicToRoman(rawL1) : rawL1,
      line2Text: enforceRoman ? transliterateIndicToRoman(rawL2) : rawL2,
      line3Text: enforceRoman ? transliterateIndicToRoman(rawL3) : rawL3,
    };
  }

  if (words.length === 0) {
    const fallbackTxt = tr?.text || '';
    const cleanTxt = enforceRoman ? transliterateIndicToRoman(fallbackTxt) : fallbackTxt;
    return {
      line1Text: effectiveLines === 1 ? cleanTxt : '',
      line2Text: effectiveLines === 1 ? '' : cleanTxt,
      line3Text: '',
    };
  }

  const cleanWords = words.map((w) => ({
    ...w,
    word: enforceRoman ? transliterateIndicToRoman(w.word) : w.word,
  }));

  if (effectiveLines === 1) {
    return {
      line1Text: cleanWords.map((w) => w.word).join(' '),
      line2Text: '',
      line3Text: '',
    };
  }

  if (effectiveLines >= 3 && cleanWords.length >= 3) {
    const n = cleanWords.length;
    const c1 = Math.max(1, Math.floor(n / 3));
    const c2 = Math.max(c1 + 1, Math.floor((2 * n) / 3));
    return {
      line1Text: cleanWords.slice(0, c1).map((w) => w.word).join(' '),
      line2Text: cleanWords.slice(c1, c2).map((w) => w.word).join(' '),
      line3Text: cleanWords.slice(c2).map((w) => w.word).join(' '),
    };
  }

  if (cleanWords.length === 1) {
    return { line1Text: '', line2Text: cleanWords[0].word, line3Text: '' };
  }

  const heroIndices: number[] = [];
  cleanWords.forEach((w, idx) => {
    if (w.isHero) heroIndices.push(idx);
  });

  if (heroIndices.length > 0) {
    const firstHero = heroIndices[0];
    const lastHero = heroIndices[heroIndices.length - 1];
    if (firstHero > 0) {
      const candidateTop = cleanWords.slice(0, firstHero).map((w) => w.word);
      const candidateBottom = cleanWords.slice(firstHero).map((w) => w.word);
      if (
        cleanWords.length >= 3 &&
        candidateBottom.length === 1 &&
        candidateBottom[0].replace(/[^a-zA-Z0-9]/g, '').length <= 2
      ) {
        const splitIdx = Math.max(1, Math.floor(cleanWords.length / 2));
        return {
          line1Text: cleanWords.slice(0, splitIdx).map((w) => w.word).join(' '),
          line2Text: cleanWords.slice(splitIdx).map((w) => w.word).join(' '),
          line3Text: '',
        };
      }
      return {
        line1Text: candidateTop.join(' '),
        line2Text: candidateBottom.join(' '),
        line3Text: '',
      };
    } else if (lastHero < cleanWords.length - 1) {
      return {
        line1Text: cleanWords.slice(0, lastHero + 1).map((w) => w.word).join(' '),
        line2Text: cleanWords.slice(lastHero + 1).map((w) => w.word).join(' '),
        line3Text: '',
      };
    }
  }

  const splitIdx = Math.max(1, Math.floor(cleanWords.length / 2));
  return {
    line1Text: cleanWords.slice(0, splitIdx).map((w) => w.word).join(' '),
    line2Text: cleanWords.slice(splitIdx).map((w) => w.word).join(' '),
    line3Text: '',
  };
}

/**
 * Creates an animated metallic/gold/emerald specular shimmer gradient for words or lines with `isShine: true`.
 */
function createWordShineGradient(
  ctx: CanvasRenderingContext2D,
  fontSize: number,
  currentTime: number,
  wordWidth: number,
  accentColor = '#FDE047'
): CanvasGradient {
  const halfW = Math.max(24, wordWidth / 2);
  const halfH = Math.max(16, fontSize * 0.55);
  const grad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
  const sweep = ((currentTime * 1.35) % 1 + 1) % 1;
  const bandStart = Math.max(0.05, Math.min(0.65, sweep * 0.7));
  const bandMid = Math.min(0.85, bandStart + 0.15);
  const bandEnd = Math.min(0.96, bandMid + 0.15);

  grad.addColorStop(0, accentColor);
  grad.addColorStop(bandStart, '#FDE047');
  grad.addColorStop(bandMid, '#FFFFFF');
  grad.addColorStop(bandEnd, '#6EE7B7');
  grad.addColorStop(1, accentColor);
  return grad;
}

/**
 * Draws a crisp 4-point sparkle star glint on words with `isShine: true`.
 */
function drawWordShineSparkle(
  ctx: CanvasRenderingContext2D,
  wordWidth: number,
  fontSize: number,
  currentTime: number
) {
  ctx.save();
  const pulse = 0.55 + 0.45 * Math.abs(Math.sin(currentTime * 6.5));
  const sx = wordWidth * 0.44;
  const sy = -fontSize * 0.36;
  const arm = Math.max(4, fontSize * 0.15) * pulse;
  ctx.strokeStyle = `rgba(255, 253, 220, ${0.92 * pulse})`;
  ctx.fillStyle = `rgba(253, 224, 71, ${0.95 * pulse})`;
  ctx.lineWidth = 1.8;
  ctx.shadowColor = '#FDE047';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(sx - arm, sy);
  ctx.lineTo(sx + arm, sy);
  ctx.moveTo(sx, sy - arm);
  ctx.lineTo(sx, sy + arm);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(sx, sy, Math.max(1.5, arm * 0.28), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Maps custom line strings back to WordTiming objects while preserving existing per-word styles (isBold, isItalic, isShine, customColor, customScale, isUnderlined).
 */
function matchWordsWithStyles(
  lineTokens: string[],
  sourceWords: WordTiming[],
  startIndexOffset: number,
  defaultIsHero: boolean,
  segStart: number,
  segEnd: number,
  totalCount: number
): WordTiming[] {
  const usedIndices = new Set<number>();
  const dur = Math.max(0.25, segEnd - segStart);
  const step = dur / Math.max(1, totalCount);

  return lineTokens.map((tok, localIdx) => {
    const globalIdx = startIndexOffset + localIdx;
    const cleanTok = tok.replace(/[*!?,.:;'"()]/g, '').toLowerCase();
    let matched: WordTiming | undefined = sourceWords[globalIdx];
    if (!matched || matched.word.replace(/[*!?,.:;'"()]/g, '').toLowerCase() !== cleanTok) {
      const foundIdx = sourceWords.findIndex(
        (sw, sIdx) =>
          !usedIndices.has(sIdx) &&
          sw.word.replace(/[*!?,.:;'"()]/g, '').toLowerCase() === cleanTok
      );
      if (foundIdx !== -1) {
        matched = sourceWords[foundIdx];
        usedIndices.add(foundIdx);
      }
    } else {
      usedIndices.add(globalIdx);
    }

    return {
      ...(matched || {}),
      word: tok,
      startTime: matched?.startTime ?? segStart + globalIdx * step,
      endTime: matched?.endTime ?? segStart + (globalIdx + 1) * step,
      isHero: matched?.isHero !== undefined ? matched.isHero : defaultIsHero,
    };
  });
}

/**
 * Renders a line of WordTiming tokens with full support for per-word & per-line Bold, Italic, Shine, Scale, Underline, and Color.
 */
function drawRichWordTokensOnLine(params: {
  ctx: CanvasRenderingContext2D;
  lineWords: WordTiming[];
  anchorX: number;
  lineY: number;
  baseFontSize: number;
  fontFamily: string;
  baseWeight: number;
  letterSpace: number;
  wordGap: number;
  textTransform: CaptionStyleConfig['textTransform'];
  defaultFill: string | CanvasGradient;
  strokeColor: string;
  strokeWidth: number;
  hasPaperCard: boolean;
  currentTime: number;
  style: CaptionStyleConfig;
  lineBold?: boolean;
  lineItalic?: boolean;
  lineShine?: boolean;
  lineColor?: string;
}) {
  const {
    ctx,
    lineWords,
    anchorX,
    lineY,
    baseFontSize,
    fontFamily,
    baseWeight,
    letterSpace,
    wordGap,
    textTransform,
    defaultFill,
    strokeColor,
    strokeWidth,
    hasPaperCard,
    currentTime,
    style,
    lineBold,
    lineItalic,
    lineShine,
    lineColor,
  } = params;

  if (lineWords.length === 0) return { totalWidth: 0 };

  const measured = lineWords.map((w) => {
    const isWordBold = Boolean(w.isBold || lineBold);
    const isWordItalic = Boolean(w.isItalic || lineItalic || style.italicText);
    const isWordShine = Boolean(w.isShine || lineShine);
    const wordScale = Math.max(0.5, Math.min(2.5, (w.customScale ?? 1) * (isWordBold ? 1.05 : 1)));
    const fSize = Math.max(16, Math.round(baseFontSize * wordScale));
    const fWeight = isWordBold ? 900 : baseWeight;
    const fStyle = isWordItalic ? 'italic ' : '';
    const chosenFont = w.customFontFamily || fontFamily;
    const display = transformWord(w.word, textTransform || 'none');

    ctx.font = `${fStyle}${fWeight} ${fSize}px ${getWordFontStack(chosenFont)}`;
    applyCanvasLetterSpacing(ctx, letterSpace);
    const width = ctx.measureText(display).width;
    return {
      raw: w,
      display,
      width,
      fSize,
      fWeight,
      fStyle,
      chosenFont,
      isWordBold,
      isWordItalic,
      isWordShine,
    };
  });

  const totalWidth =
    measured.reduce((acc, m) => acc + m.width, 0) +
    Math.max(0, measured.length - 1) * wordGap;

  let cursorX = anchorX - totalWidth / 2;

  measured.forEach((m) => {
    const wordCenterX = cursorX + m.width / 2;
    ctx.save();
    ctx.translate(wordCenterX, lineY);
    ctx.font = `${m.fStyle}${m.fWeight} ${m.fSize}px ${getWordFontStack(m.chosenFont)}`;
    applyCanvasLetterSpacing(ctx, letterSpace);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (style.depth3DEnabled) {
      const depthPx = Math.max(2, Math.min(20, style.depth3DDepth ?? 6));
      const angleRad = ((style.depth3DAngle ?? 135) * Math.PI) / 180;
      const dx3d = Math.cos(angleRad);
      const dy3d = Math.sin(angleRad);
      ctx.save();
      ctx.fillStyle = style.depth3DColor || style.highlightColor || '#EB4823';
      for (let d = depthPx; d >= 1; d -= 1.5) {
        ctx.fillText(m.display, dx3d * d, dy3d * d);
      }
      ctx.restore();
    }

    if (!hasPaperCard && strokeWidth > 0) {
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.lineWidth = m.isWordBold ? Math.round(strokeWidth * 1.18) : strokeWidth;
      ctx.strokeStyle = strokeColor;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 14;
      ctx.strokeText(m.display, 0, 0);
      ctx.shadowBlur = 0;
    } else if (style.strokeWidth > 0) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = m.isWordBold ? Math.round(style.strokeWidth * 1.18) : style.strokeWidth;
      ctx.strokeStyle = style.strokeColor || '#000000';
      ctx.strokeText(m.display, 0, 0);
    }

    if (m.isWordShine) {
      ctx.shadowColor = '#FDE047';
      ctx.shadowBlur = Math.max(22, (style.glowSpread || 16) * 1.35);
    } else if (style.glowEnabled) {
      ctx.shadowColor = style.glowColor || style.highlightColor || '#FDE047';
      ctx.shadowBlur = style.glowSpread || 16;
    }

    if (m.isWordShine) {
      ctx.fillStyle = createWordShineGradient(
        ctx,
        m.fSize,
        currentTime,
        m.width,
        m.raw.customColor || lineColor || style.highlightColor || '#FDE047'
      );
    } else if (m.raw.customColor) {
      ctx.fillStyle = m.raw.customColor;
    } else if (lineColor) {
      ctx.fillStyle = lineColor;
    } else {
      ctx.fillStyle = defaultFill;
    }

    ctx.fillText(m.display, 0, 0);

    if (m.raw.isUnderlined) {
      ctx.beginPath();
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = Math.max(2, m.fSize * 0.07);
      ctx.moveTo(-m.width / 2, m.fSize * 0.45);
      ctx.lineTo(m.width / 2, m.fSize * 0.45);
      ctx.stroke();
    }

    if (m.isWordShine) {
      drawWordShineSparkle(ctx, m.width, m.fSize, currentTime);
    }

    ctx.restore();
    cursorX += m.width + wordGap;
  });

  return { totalWidth };
}

function renderLalaHandwrittenCaption(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  currentTime: number,
  segStart: number,
  segEnd: number,
  words: WordTiming[],
  style: CaptionStyleConfig,
  isExportRender = false,
  customLine1Text?: string,
  customLine2Text?: string,
  customLine3Text?: string
) {
  if (words.length === 0 && !customLine1Text && !customLine2Text && !customLine3Text) return;
  ctx.save();

  const segElapsed = Math.max(0, currentTime - segStart);
  const segDuration = Math.max(0.3, segEnd - segStart);
  const entranceProgress = Math.min(
    1,
    segElapsed / (0.22 / Math.max(0.5, style.animationSpeed || 1))
  );
  const swooshProgress = Math.min(
    1,
    Math.max(0.15, segElapsed / (0.34 / Math.max(0.5, style.animationSpeed || 1)))
  );
  const entranceSpring = 0.94 + 0.06 * Math.sin(entranceProgress * (Math.PI / 2));

  const targetLinesCount = style.maxLinesPerCaption ?? 2;

  // Partition words into Top Small Handwritten Line, Bottom Giant Handwritten Hero Line, and optional Line 3
  let topWordObjs: WordTiming[] = [];
  let heroWordObjs: WordTiming[] = [];
  let line3WordObjs: WordTiming[] = [];

  if (
    customLine1Text !== undefined ||
    customLine2Text !== undefined ||
    customLine3Text !== undefined
  ) {
    const l1Tokens = (customLine1Text ?? '').trim().split(/\s+/).filter(Boolean);
    const l2Tokens = (customLine2Text ?? '').trim().split(/\s+/).filter(Boolean);
    const l3Tokens = (customLine3Text ?? '').trim().split(/\s+/).filter(Boolean);
    const totalToks = l1Tokens.length + l2Tokens.length + l3Tokens.length;

    topWordObjs = matchWordsWithStyles(l1Tokens, words, 0, false, segStart, segEnd, totalToks);
    heroWordObjs = matchWordsWithStyles(
      l2Tokens,
      words,
      l1Tokens.length,
      true,
      segStart,
      segEnd,
      totalToks
    );
    line3WordObjs = matchWordsWithStyles(
      l3Tokens,
      words,
      l1Tokens.length + l2Tokens.length,
      false,
      segStart,
      segEnd,
      totalToks
    );

    if (heroWordObjs.length === 0 && topWordObjs.length > 0 && targetLinesCount === 1) {
      heroWordObjs = topWordObjs;
      topWordObjs = [];
    }
  } else if (targetLinesCount === 1) {
    topWordObjs = [];
    heroWordObjs = words;
  } else if (targetLinesCount >= 3 && words.length >= 3) {
    const c1 = Math.max(1, Math.floor(words.length / 3));
    const c2 = Math.max(c1 + 1, Math.floor((2 * words.length) / 3));
    topWordObjs = words.slice(0, c1);
    heroWordObjs = words.slice(c1, c2);
    line3WordObjs = words.slice(c2);
  } else {
    const heroIndices: number[] = [];
    words.forEach((w, idx) => {
      if (w.isHero) heroIndices.push(idx);
    });

    if (words.length === 1) {
      topWordObjs = [];
      heroWordObjs = [words[0]];
    } else if (heroIndices.length > 0) {
      const firstHero = heroIndices[0];
      const lastHero = heroIndices[heroIndices.length - 1];
      if (firstHero > 0) {
        const candidateTop = words.slice(0, firstHero);
        const candidateBottom = words.slice(firstHero);
        if (
          words.length >= 3 &&
          candidateBottom.length === 1 &&
          candidateBottom[0].word.replace(/[^a-zA-Z0-9]/g, '').length <= 2
        ) {
          const splitIdx = Math.max(1, Math.floor(words.length / 2));
          topWordObjs = words.slice(0, splitIdx);
          heroWordObjs = words.slice(splitIdx);
        } else {
          topWordObjs = candidateTop;
          heroWordObjs = candidateBottom;
        }
      } else if (lastHero < words.length - 1) {
        topWordObjs = words.slice(0, lastHero + 1);
        heroWordObjs = words.slice(lastHero + 1);
      } else {
        const splitIdx = Math.max(1, Math.floor(words.length / 2));
        topWordObjs = words.slice(0, splitIdx);
        heroWordObjs = words.slice(splitIdx);
      }
    } else {
      const splitIdx = Math.max(1, Math.floor(words.length / 2));
      topWordObjs = words.slice(0, splitIdx);
      heroWordObjs = words.slice(splitIdx);
    }
  }

  const topWords = topWordObjs.map((w) => w.word);
  const heroWords = heroWordObjs.map((w) => w.word);
  const line3Words = line3WordObjs.map((w) => w.word);

  const baseCenterX = ((style.positionX ?? 50) / 100) * canvasWidth;
  const baseCenterY = ((style.positionY ?? 68) / 100) * canvasHeight;
  const vertGap = Number(style.verticalSpacing ?? 0);
  const letterSpace = Number(style.letterSpacing ?? 0);

  const aspectFontScale =
    canvasHeight <= 760 ? (canvasWidth > canvasHeight ? 0.85 : 0.9) : 1.0;
  const effectiveBaseFontSize = Math.round((style.fontSize || 48) * aspectFontScale);

  const smallFontSize = Math.max(
    18,
    style.line1FontSizePx
      ? Math.round(style.line1FontSizePx * aspectFontScale)
      : Math.round(effectiveBaseFontSize * (style.smallWordScale || 0.78))
  );
  const rawBigFontSize = Math.max(
    22,
    style.line2FontSizePx
      ? Math.round(style.line2FontSizePx * aspectFontScale)
      : Math.round(effectiveBaseFontSize * (style.bigWordScale || 1.95))
  );
  const line3FontSize = Math.max(
    18,
    style.line3FontSizePx
      ? Math.round(style.line3FontSizePx * aspectFontScale)
      : smallFontSize
  );

  const trans = computeTransitionTransform(currentTime, segStart, segEnd, style);
  const weight = style.fontWeight || 700;
  const lalaFontFamily = style.fontFamily || 'Caveat';
  const lalaHeroFontFamily =
    style.heroWordFontFamily || style.fontFamily || 'Caveat';

  const topText = transformWord(topWords.join(' '), style.textTransform || 'none');
  const rawBottomText = transformWord(
    heroWords.join(' '),
    style.textTransform || 'none'
  );
  const rawLine3Text = transformWord(
    line3Words.join(' '),
    style.textTransform || 'none'
  );

  // Measure and fit Giant Bottom Line within 88% of canvas width
  ctx.font = `${weight} ${rawBigFontSize}px ${getWordFontStack(lalaHeroFontFamily)}`;
  applyCanvasLetterSpacing(ctx, letterSpace);
  const measuredRawBigW = ctx.measureText(rawBottomText).width;
  const maxAllowedW = canvasWidth * 0.88;
  const fitRatio =
    measuredRawBigW > maxAllowedW
      ? Math.max(0.42, maxAllowedW / measuredRawBigW)
      : 1;
  const bigFontSize = Math.max(20, Math.round(rawBigFontSize * fitRatio));

  ctx.font = `${weight} ${bigFontSize}px ${getWordFontStack(lalaHeroFontFamily)}`;
  const bigTextWidth = Math.min(maxAllowedW, ctx.measureText(rawBottomText).width);

  ctx.font = `${Math.max(500, weight - 100)} ${smallFontSize}px ${getWordFontStack(lalaFontFamily)}`;
  const topTextWidth = topText
    ? Math.min(maxAllowedW, ctx.measureText(topText).width)
    : 0;

  ctx.font = `${Math.max(500, weight - 100)} ${line3FontSize}px ${getWordFontStack(lalaFontFamily)}`;
  const line3TextWidth = rawLine3Text
    ? Math.min(maxAllowedW, ctx.measureText(rawLine3Text).width)
    : 0;

  const small1OffsetX = ((style.smallOffsetX ?? 0) / 100) * canvasWidth;
  const small1OffsetY = ((style.smallOffsetY ?? 0) / 100) * canvasHeight;
  const bigOffsetX = ((style.bigOffsetX ?? 0) / 100) * canvasWidth;
  const bigOffsetY = ((style.bigOffsetY ?? 0) / 100) * canvasHeight;

  // Unrestricted Horizontal (X) and Vertical (Y) placement across the screen
  const centerX = Math.max(
    canvasWidth * 0.03,
    Math.min(canvasWidth * 0.97, baseCenterX + bigOffsetX + trans.dx)
  );
  const centerY = Math.max(
    canvasHeight * 0.04,
    Math.min(canvasHeight * 0.96, baseCenterY + bigOffsetY + trans.dy)
  );

  // Honor user's chosen Primary Color, Highlight Color, and Background Color
  const inkColor = style.primaryColor || '#1C434C';
  const swooshColor = style.highlightColor || '#EB4823';
  const paperColor = style.backgroundColor || '#FAF6E8';
  const hasPaperCard =
    style.backgroundEnabled !== false &&
    (style.backgroundOpacity === undefined || style.backgroundOpacity > 0.05);

  const smallAlign = style.smallTextAlign || style.bigTextAlign || 'center';
  const bigAlign = style.bigTextAlign || 'center';

  const contentWidth = Math.max(bigTextWidth, topTextWidth, line3TextWidth, 210);
  const topY = topText
    ? centerY - bigFontSize * 0.56 - smallFontSize * 0.35 - vertGap * 0.5 + small1OffsetY
    : centerY;
  const bigY = topText ? centerY + smallFontSize * 0.16 : centerY;
  const line3Y = rawLine3Text
    ? bigY + bigFontSize * 0.58 + line3FontSize * 0.42 + vertGap * 0.5
    : bigY;
  const swooshY = (rawLine3Text ? line3Y + line3FontSize * 0.4 : bigY + bigFontSize * 0.42);

  ctx.globalAlpha = trans.alpha;

  // Optional dynamic frame from Edit tab
  drawCaptionDynamicFrame(
    ctx,
    centerX,
    centerY,
    contentWidth,
    bigFontSize + smallFontSize + (rawLine3Text ? line3FontSize : 0) + Math.abs(vertGap),
    style
  );

  // 1. Warm Cream Paper Card with Brush Accent on Right (Customizable color, padding, radius & opacity)
  if (hasPaperCard) {
    ctx.save();
    const userPad = style.backgroundPaddingPx ?? 0;
    const padX = Math.max(28, bigFontSize * 0.55 + userPad);
    const padTop = (topText ? Math.max(22, smallFontSize * 0.6) : 20) + userPad * 0.5;
    const padBot = Math.max(26, bigFontSize * 0.5) + userPad * 0.5;
    const cardW = Math.min(canvasWidth * 0.94, contentWidth + padX * 2);
    const cardTop =
      (topText ? topY - smallFontSize * 0.55 : bigY - bigFontSize * 0.55) -
      padTop * 0.45;
    const cardBot = swooshY + padBot * 0.65;
    const cardH = Math.max(78, cardBot - cardTop);
    const cardX = centerX - cardW / 2;
    const cardRadius = style.backgroundRadiusPx ?? 20;

    ctx.translate(centerX, cardTop + cardH / 2);
    if (trans.rotationRad !== 0) ctx.rotate(trans.rotationRad);
    ctx.scale(trans.scaleX, trans.scaleY);
    ctx.translate(-centerX, -(cardTop + cardH / 2));

    if (style.dropShadowEnabled ?? true) {
      ctx.shadowColor = style.dropShadowColor || 'rgba(0, 0, 0, 0.52)';
      ctx.shadowBlur = style.shadowBlur ?? 24;
      ctx.shadowOffsetX = style.dropShadowX ?? 0;
      ctx.shadowOffsetY = style.dropShadowY ?? 6;
    }
    ctx.fillStyle = hexToRgba(paperColor, style.backgroundOpacity ?? 0.96);
    drawRoundedRect(ctx, cardX, cardTop, cardW, cardH, cardRadius);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Subtle organic brush accent strip on the right edge of the paper card
    ctx.save();
    drawRoundedRect(ctx, cardX, cardTop, cardW, cardH, cardRadius);
    ctx.clip();
    ctx.fillStyle = swooshColor;
    ctx.beginPath();
    const accentLeft = cardX + cardW - Math.max(22, cardW * 0.075);
    ctx.moveTo(accentLeft + 6, cardTop - 2);
    ctx.lineTo(cardX + cardW + 4, cardTop - 2);
    ctx.lineTo(cardX + cardW + 4, cardTop + cardH + 2);
    ctx.lineTo(accentLeft + 10, cardTop + cardH + 2);
    ctx.lineTo(accentLeft + 2, cardTop + cardH * 0.72);
    ctx.lineTo(accentLeft + 8, cardTop + cardH * 0.45);
    ctx.lineTo(accentLeft, cardTop + cardH * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // 2. Render Top Line (Line 1) with full per-word and per-line Bold, Italic, Shine, Scale, and Color support
  if (topWordObjs.length > 0) {
    ctx.save();
    const topAnchorX =
      smallAlign === 'left'
        ? centerX - contentWidth / 2 + topTextWidth / 2 + small1OffsetX
        : smallAlign === 'right'
        ? centerX + contentWidth / 2 - topTextWidth / 2 + small1OffsetX
        : centerX + small1OffsetX;
    ctx.translate(topAnchorX, topY);
    if (trans.rotationRad !== 0) ctx.rotate(trans.rotationRad);
    ctx.scale(entranceSpring * trans.scaleX, entranceSpring * trans.scaleY);

    const topDefaultFill = style.useBaseGradient
      ? createBaseTextFill(ctx, smallFontSize, currentTime, style, topTextWidth)
      : inkColor;

    drawRichWordTokensOnLine({
      ctx,
      lineWords: topWordObjs,
      anchorX: 0,
      lineY: 0,
      baseFontSize: smallFontSize,
      fontFamily: lalaFontFamily,
      baseWeight: Math.max(500, weight - 100),
      letterSpace: letterSpace * 0.5,
      wordGap: Math.max(6, smallFontSize * 0.22),
      textTransform: style.textTransform || 'none',
      defaultFill: topDefaultFill,
      strokeColor: style.strokeWidth > 0 ? style.strokeColor : '#FAF6E8',
      strokeWidth: Math.max(4, style.strokeWidth || smallFontSize * 0.16),
      hasPaperCard,
      currentTime,
      style,
      lineBold: style.line1Bold,
      lineItalic: style.line1Italic,
      lineShine: style.line1Shine,
      lineColor: style.line1Color,
    });
    ctx.restore();

    const hitSmall: import('../types/caption').LayerHitBox = {
      layer: 'small1',
      x: topAnchorX - topTextWidth / 2,
      y: topY - smallFontSize * 0.55,
      width: Math.max(60, topTextWidth),
      height: smallFontSize * 1.1,
      handleX: topAnchorX + topTextWidth / 2,
      handleY: topY + smallFontSize * 0.55,
    };
    latestRenderedLayerHitBoxes.push(hitSmall);
  }

  // 3. Render Bottom Giant Hero Line (Line 2) with full per-word and per-line Bold, Italic, Shine, Scale, and Color support
  const isHeroSpoken = words.some(
    (w) => currentTime >= w.startTime && currentTime <= w.endTime + 0.1
  );
  const heroBounce = isHeroSpoken
    ? 1.0 + 0.03 * Math.sin(((currentTime - segStart) / segDuration) * Math.PI * 2)
    : 1.0;

  const bigAnchorX =
    bigAlign === 'left'
      ? centerX - contentWidth / 2 + bigTextWidth / 2
      : bigAlign === 'right'
      ? centerX + contentWidth / 2 - bigTextWidth / 2
      : centerX;

  if (heroWordObjs.length > 0) {
    ctx.save();
    ctx.translate(bigAnchorX, bigY);
    if (trans.rotationRad !== 0) ctx.rotate(trans.rotationRad);
    ctx.scale(
      entranceSpring * heroBounce * trans.scaleX,
      entranceSpring * heroBounce * trans.scaleY
    );

    const heroDefaultFill = style.useGradient
      ? createSidzVerticalGradient(ctx, bigFontSize, currentTime, style, bigTextWidth)
      : style.emphasisMode === 'spotlight'
      ? swooshColor
      : inkColor;

    drawRichWordTokensOnLine({
      ctx,
      lineWords: heroWordObjs,
      anchorX: 0,
      lineY: 0,
      baseFontSize: bigFontSize,
      fontFamily: lalaHeroFontFamily,
      baseWeight: weight,
      letterSpace,
      wordGap: Math.max(8, bigFontSize * 0.22),
      textTransform: style.textTransform || 'none',
      defaultFill: heroDefaultFill,
      strokeColor: style.strokeWidth > 0 ? style.strokeColor : '#FAF6E8',
      strokeWidth: Math.max(6, style.strokeWidth || bigFontSize * 0.15),
      hasPaperCard,
      currentTime,
      style,
      lineBold: style.line2Bold,
      lineItalic: style.line2Italic,
      lineShine: style.line2Shine,
      lineColor: style.line2Color,
    });
    ctx.restore();
  }

  // 3.5 Optional Line 3 (when 3 lines are enabled)
  if (line3WordObjs.length > 0) {
    ctx.save();
    ctx.translate(centerX, line3Y);
    if (trans.rotationRad !== 0) ctx.rotate(trans.rotationRad);
    ctx.scale(entranceSpring * trans.scaleX, entranceSpring * trans.scaleY);

    drawRichWordTokensOnLine({
      ctx,
      lineWords: line3WordObjs,
      anchorX: 0,
      lineY: 0,
      baseFontSize: line3FontSize,
      fontFamily: lalaFontFamily,
      baseWeight: Math.max(500, weight - 100),
      letterSpace: letterSpace * 0.5,
      wordGap: Math.max(6, line3FontSize * 0.22),
      textTransform: style.textTransform || 'none',
      defaultFill: inkColor,
      strokeColor: style.strokeWidth > 0 ? style.strokeColor : '#FAF6E8',
      strokeWidth: Math.max(4, style.strokeWidth || line3FontSize * 0.15),
      hasPaperCard,
      currentTime,
      style,
      lineBold: style.line3Bold,
      lineItalic: style.line3Italic,
      lineShine: style.line3Shine,
      lineColor: style.line3Color,
    });
    ctx.restore();
  }

  // 4. Render Hand-Drawn Marker Underline Swoosh
  if (style.underlineText !== false) {
    ctx.save();
    const swooshSpan = Math.max(90, bigTextWidth * 0.78) * swooshProgress;
    const halfSpan = Math.max(45, bigTextWidth * 0.39);
    const startX = bigAnchorX - halfSpan;
    const endX = startX + swooshSpan;
    const midX = (startX + endX) / 2;
    const archLift = Math.max(5, bigFontSize * 0.11);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = swooshColor;

    if (!hasPaperCard) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 8;
    }

    // Stroke 1: Upper arched marker sweep
    ctx.lineWidth = Math.max(3.2, bigFontSize * 0.068);
    ctx.beginPath();
    ctx.moveTo(startX + swooshSpan * 0.04, swooshY);
    ctx.quadraticCurveTo(midX, swooshY - archLift, endX - swooshSpan * 0.02, swooshY - 1);
    ctx.stroke();

    // Stroke 2: Secondary slightly lower wider marker sweep
    ctx.lineWidth = Math.max(2.6, bigFontSize * 0.055);
    ctx.beginPath();
    ctx.moveTo(startX, swooshY + Math.max(4, bigFontSize * 0.075));
    ctx.quadraticCurveTo(
      midX + swooshSpan * 0.03,
      swooshY - archLift * 0.45,
      endX + swooshSpan * 0.02,
      swooshY + Math.max(2.5, bigFontSize * 0.05)
    );
    ctx.stroke();

    // Stroke 3: Subtle third inner marker tail
    ctx.globalAlpha = trans.alpha * 0.85;
    ctx.lineWidth = Math.max(1.8, bigFontSize * 0.038);
    ctx.beginPath();
    ctx.moveTo(startX + swooshSpan * 0.16, swooshY + Math.max(6.5, bigFontSize * 0.11));
    ctx.quadraticCurveTo(
      midX + swooshSpan * 0.05,
      swooshY + 1.5,
      endX - swooshSpan * 0.08,
      swooshY + Math.max(5, bigFontSize * 0.09)
    );
    ctx.stroke();

    ctx.restore();
  }

  const hitBig: import('../types/caption').LayerHitBox = {
    layer: 'big',
    x: bigAnchorX - bigTextWidth / 2,
    y: bigY - bigFontSize * 0.5,
    width: Math.max(80, bigTextWidth),
    height: bigFontSize * 1.15,
    handleX: bigAnchorX + bigTextWidth / 2,
    handleY: bigY + bigFontSize * 0.65,
  };
  latestRenderedLayerHitBoxes.push(hitBig);

  if (!isExportRender && style.showOnScreenTransformBoxes) {
    drawInteractiveLayerBoundingBox(
      ctx,
      hitBig,
      style.selectedCanvasLayer === 'big',
      `HERO · ${Math.round((style.bigWordScale || 1.95) * 100)}%`
    );
  }

  ctx.restore();
}

/**
 * Renders the 4 signature SIDZ_<NAME> Composite Caption Layouts matching the user's reference screenshots,
 * upgraded with:
 * - Individual Small Line 1, Small Line 2, and Big Hero Text horizontal alignment (left / center / right)
 * - Independent X/Y offsets and individual font scales for Small Line 1, Small Line 2, and Big Hero Text
 * - Flexible 2-line small text splitting & custom vertical stack ordering
 * - Automatic horizontal safe-margin clamping so long words never clip off the right/left screen edge
 */
function renderSidzCompositeCaption(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  currentTime: number,
  segStart: number,
  segEnd: number,
  words: WordTiming[],
  style: CaptionStyleConfig,
  isExportRender = false,
  customLine1Text?: string,
  customLine2Text?: string,
  customLine3Text?: string,
  segmentMaxLines?: 1 | 2 | 3
) {
  if (words.length === 0 && !customLine1Text && !customLine2Text && !customLine3Text) return;
  ctx.save();

  const segElapsed = Math.max(0, currentTime - segStart);
  const segDuration = Math.max(0.3, segEnd - segStart);
  const entranceProgress = Math.min(1, segElapsed / (0.22 / Math.max(0.5, style.animationSpeed)));
  const entranceSpring = 0.92 + 0.08 * Math.sin(entranceProgress * (Math.PI / 2));

  const effectiveMaxLines: 1 | 2 | 3 =
    segmentMaxLines ??
    style.maxLines ??
    (customLine3Text && customLine3Text.trim().length > 0 ? 3 : 2);

  // Partition segment words into Small Line 1, Big Hero Line 2, and Small Line 3 (with WordTiming preservation)
  const heroIndices: number[] = [];
  words.forEach((w, idx) => {
    if (w.isHero) heroIndices.push(idx);
  });

  if (heroIndices.length === 0 && words.length > 0) {
    let bestIdx = words.length - 1;
    let maxLen = -1;
    words.forEach((w, idx) => {
      if (w.word.length > maxLen) {
        maxLen = w.word.length;
        bestIdx = idx;
      }
    });
    heroIndices.push(bestIdx);
  }

  const firstHeroIdx = heroIndices[0] ?? 0;
  const lastHeroIdx = heroIndices[heroIndices.length - 1] ?? Math.max(0, words.length - 1);

  const buildWordObjsForCustomTokens = (
    tokens: string[],
    startIdxOffset: number,
    totalCount: number,
    defaultHero: boolean
  ): WordTiming[] => {
    const dur = Math.max(0.25, segEnd - segStart);
    const step = dur / Math.max(1, totalCount);
    return tokens.map((tok, i) => {
      const globalIdx = startIdxOffset + i;
      const existing =
        words[globalIdx] ||
        words.find((w) => w.word.toLowerCase() === tok.toLowerCase());
      return {
        ...(existing || {}),
        word: tok,
        startTime: existing?.startTime ?? segStart + globalIdx * step,
        endTime: existing?.endTime ?? segStart + (globalIdx + 1) * step,
        isHero: existing?.isHero ?? defaultHero,
      };
    });
  };

  let smallLine1WordObjs: WordTiming[] = [];
  let heroWordObjs: WordTiming[] = [];
  let smallLine2WordObjs: WordTiming[] = [];

  if (
    customLine1Text !== undefined ||
    customLine2Text !== undefined ||
    customLine3Text !== undefined
  ) {
    const t1 = (customLine1Text ?? '').trim().split(/\s+/).filter(Boolean);
    const t2 = (customLine2Text ?? '').trim().split(/\s+/).filter(Boolean);
    const t3 = (customLine3Text ?? '').trim().split(/\s+/).filter(Boolean);
    const totalToks = Math.max(1, t1.length + t2.length + t3.length);

    if (effectiveMaxLines === 1) {
      const merged = [...t1, ...t2, ...t3];
      heroWordObjs = buildWordObjsForCustomTokens(merged, 0, merged.length, true);
    } else if (effectiveMaxLines === 3) {
      smallLine1WordObjs = buildWordObjsForCustomTokens(t1, 0, totalToks, false);
      heroWordObjs = buildWordObjsForCustomTokens(t2, t1.length, totalToks, true);
      smallLine2WordObjs = buildWordObjsForCustomTokens(
        t3,
        t1.length + t2.length,
        totalToks,
        false
      );
    } else {
      smallLine1WordObjs = buildWordObjsForCustomTokens(t1, 0, totalToks, false);
      heroWordObjs = buildWordObjsForCustomTokens(
        [...t2, ...t3],
        t1.length,
        totalToks,
        true
      );
      if (heroWordObjs.length === 0 && smallLine1WordObjs.length > 0) {
        heroWordObjs = smallLine1WordObjs;
        smallLine1WordObjs = [];
      }
    }
  } else if (effectiveMaxLines === 1) {
    heroWordObjs = words;
  } else if (effectiveMaxLines === 3 && words.length >= 3) {
    const c1 = Math.max(1, Math.round(words.length / 3));
    const c2 = Math.max(c1 + 1, Math.round((words.length * 2) / 3));
    smallLine1WordObjs = words.slice(0, c1);
    heroWordObjs = words.slice(c1, c2);
    smallLine2WordObjs = words.slice(c2);
  } else {
    let leadWords = words.slice(0, firstHeroIdx);
    heroWordObjs = words.slice(firstHeroIdx, lastHeroIdx + 1);
    let tailWords = words.slice(lastHeroIdx + 1);

    if (style.hierarchyMode === 'sidz-truly-flame') {
      if (leadWords.length > 0 && tailWords.length === 0) {
        const splitAt = Math.min(2, Math.max(1, Math.floor(words.length / 2)));
        heroWordObjs = words.slice(0, splitAt);
        tailWords = words.slice(splitAt);
        leadWords = [];
      } else if (tailWords.length === 0 && heroWordObjs.length > 1) {
        tailWords = heroWordObjs.slice(1);
        heroWordObjs = [heroWordObjs[0]];
      }
    } else {
      if (leadWords.length === 0 && tailWords.length > 0 && style.hierarchyMode !== 'sidz-20k-script') {
        leadWords = heroWordObjs;
        heroWordObjs = tailWords;
        tailWords = [];
      }
    }

    const twoLineMode = style.smallTwoLineMode || 'single-line';
    const combinedSmall = [...leadWords, ...tailWords];
    if (twoLineMode === 'two-line-split' && combinedSmall.length >= 5) {
      const mid = Math.ceil(combinedSmall.length / 2);
      smallLine1WordObjs = combinedSmall.slice(0, mid);
      smallLine2WordObjs = combinedSmall.slice(mid);
    } else {
      smallLine1WordObjs = combinedSmall;
      smallLine2WordObjs = [];
    }
  }

  const smallLine1Words = smallLine1WordObjs.map((w) => w.word);
  const heroWords = heroWordObjs.map((w) => w.word);
  const smallLine2Words = smallLine2WordObjs.map((w) => w.word);

  const baseCenterX = ((style.positionX ?? 50) / 100) * canvasWidth;
  const baseCenterY = ((style.positionY ?? 66) / 100) * canvasHeight;
  const vertGap = Number(style.verticalSpacing ?? 8);
  const horizGap = Math.max(0, Number(style.horizontalSpacing ?? 14));
  const letterSpace = Number(style.letterSpacing ?? 0);
  const lineSpaceMult = Number(style.lineSpacing ?? 1.18);

  const aspectFontScale =
    canvasHeight <= 760 ? (canvasWidth > canvasHeight ? 0.84 : 0.88) : 1.0;
  const effectiveBaseFontSize = Math.round(style.fontSize * aspectFontScale);

  const small1FontSize = Math.max(
    18,
    style.line1FontSizePx
      ? Math.round(style.line1FontSizePx * aspectFontScale)
      : Math.round(effectiveBaseFontSize * Math.max(0.68, style.smallWordScale || 0.76))
  );
  const small2FontSize = Math.max(
    18,
    style.line3FontSizePx
      ? Math.round(style.line3FontSizePx * aspectFontScale)
      : style.line1FontSizePx
      ? Math.round(style.line1FontSizePx * aspectFontScale)
      : Math.round(
          effectiveBaseFontSize *
            Math.max(0.68, style.smallLine2Scale ?? style.smallWordScale ?? 0.76)
        )
  );
  const rawGiantFontSize = Math.max(
    22,
    style.line2FontSizePx
      ? Math.round(style.line2FontSizePx * aspectFontScale)
      : Math.round(effectiveBaseFontSize * (style.bigWordScale || 1.95))
  );

  const isHeroCurrentlySpoken = heroWordObjs.some(
    (w) => currentTime >= w.startTime && currentTime <= w.endTime + 0.15
  );
  const heroPopScale = isHeroCurrentlySpoken
    ? 1.0 + 0.045 * Math.sin(((currentTime - segStart) / segDuration) * Math.PI * 2)
    : 1.0;

  const wordJoiner = horizGap > 22 ? '  ' : ' ';
  const rawHeroString = heroWords.join(wordJoiner);
  const heroText =
    style.hierarchyMode === 'sidz-truly-flame' && style.textTransform === 'none'
      ? rawHeroString.toLowerCase()
      : transformWord(rawHeroString, style.textTransform);

  const small1Text = smallLine1Words.join(wordJoiner);
  const small2Text = smallLine2Words.join(wordJoiner);

  const isTallCondensedMode = style.hierarchyMode !== 'sidz-truly-flame';
  const userScaleBoost = Math.max(
    0.75,
    Math.min(1.65, (style.fontSize / 56) * ((style.bigWordScale || 2.15) / 2.15))
  );
  const verticalStretch = (isTallCondensedMode ? 1.16 : 1.04) * (0.88 + 0.12 * userScaleBoost);

  // Measure and fit Giant Hero Text within 90% of canvas width so it NEVER clips at screen edges
  ctx.font = `${style.fontWeight} ${rawGiantFontSize}px ${getWordFontStack(style.heroWordFontFamily)}`;
  applyCanvasLetterSpacing(ctx, letterSpace);
  const measuredRawHeroW = ctx.measureText(heroText).width;
  const maxAllowedWidth = canvasWidth * 0.90;
  const fitRatio =
    measuredRawHeroW > maxAllowedWidth
      ? Math.max(0.42, maxAllowedWidth / measuredRawHeroW)
      : 1;
  const giantFontSize = Math.max(22, Math.round(rawGiantFontSize * fitRatio));

  ctx.font = `${style.fontWeight} ${giantFontSize}px ${getWordFontStack(style.heroWordFontFamily)}`;
  applyCanvasLetterSpacing(ctx, letterSpace);
  const giantWidth = Math.min(maxAllowedWidth, ctx.measureText(heroText).width);
  const giantVisualHeight = giantFontSize * verticalStretch * (lineSpaceMult / 1.18);

  // Measure Small Line 1 & Small Line 2 widths
  ctx.font = `700 ${small1FontSize}px ${getWordFontStack(style.fontFamily)}`;
  applyCanvasLetterSpacing(ctx, letterSpace * 0.6);
  const small1Width = small1Text ? ctx.measureText(small1Text).width : 0;

  ctx.font = `700 ${small2FontSize}px ${getWordFontStack(style.fontFamily)}`;
  applyCanvasLetterSpacing(ctx, letterSpace * 0.6);
  const small2Width = small2Text ? ctx.measureText(small2Text).width : 0;

  const defaultSmall1Align: 'left' | 'center' | 'right' =
    style.hierarchyMode === 'sidz-valuing-wide' ? 'center' : 'center';
  const defaultSmall2Align: 'left' | 'center' | 'right' =
    style.hierarchyMode === 'sidz-truly-flame' || style.hierarchyMode === 'sidz-20k-script'
      ? 'right'
      : 'center';

  const small1Align = style.smallTextAlign || defaultSmall1Align;
  const small2Align = style.smallLine2TextAlign || defaultSmall2Align;
  const bigAlign = style.bigTextAlign || 'center';

  const defaultOrder =
    effectiveMaxLines === 3
      ? 'small1-big-small2'
      : style.hierarchyMode === 'sidz-truly-flame'
      ? 'big-small1-small2'
      : 'small1-small2-big';
  const lineOrder = effectiveMaxLines === 3 ? 'small1-big-small2' : style.lineOrderMode || defaultOrder;

  const cleanGap = Math.max(6, vertGap);

  let baseSmall1Y = baseCenterY - giantVisualHeight * 0.62 - small1FontSize * 0.65 - cleanGap;
  let baseSmall2Y = baseCenterY + giantVisualHeight * 0.58 + small2FontSize * 0.55 + cleanGap;
  let baseBigY = baseCenterY;

  if (lineOrder === 'small1-small2-big') {
    baseBigY = baseCenterY + (small1Text || small2Text ? small1FontSize * 0.48 : 0);
    if (small1Text && small2Text) {
      baseSmall2Y = baseBigY - giantVisualHeight * 0.62 - small2FontSize * 0.65 - cleanGap * 0.6;
      baseSmall1Y =
        baseSmall2Y - small2FontSize * lineSpaceMult - small1FontSize * 0.45 - cleanGap * 0.4;
    } else {
      baseSmall1Y = baseBigY - giantVisualHeight * 0.62 - small1FontSize * 0.65 - cleanGap;
      baseSmall2Y = baseSmall1Y;
    }
  } else if (lineOrder === 'big-small1-small2') {
    baseBigY = baseCenterY - giantVisualHeight * 0.24 - cleanGap * 0.4;
    baseSmall1Y = baseBigY + giantVisualHeight * 0.62 + small1FontSize * 0.62 + cleanGap * 0.6;
    baseSmall2Y = small1Text
      ? baseSmall1Y + small1FontSize * lineSpaceMult + small2FontSize * 0.42 + cleanGap * 0.4
      : baseSmall1Y;
  } else {
    // 'small1-big-small2'
    baseBigY = baseCenterY + (small1Text ? small1FontSize * 0.28 : 0);
    baseSmall1Y = baseBigY - giantVisualHeight * 0.62 - small1FontSize * 0.65 - cleanGap;
    baseSmall2Y = baseBigY + giantVisualHeight * 0.58 + small2FontSize * 0.55 + cleanGap;
  }

  const small1OffsetX = ((style.smallOffsetX ?? 0) / 100) * canvasWidth;
  const small1OffsetY = ((style.smallOffsetY ?? 0) / 100) * canvasHeight;
  const small2OffsetX = ((style.smallLine2OffsetX ?? 0) / 100) * canvasWidth;
  const small2OffsetY = ((style.smallLine2OffsetY ?? 0) / 100) * canvasHeight;
  const bigOffsetX = ((style.bigOffsetX ?? 0) / 100) * canvasWidth;
  const bigOffsetY = ((style.bigOffsetY ?? 0) / 100) * canvasHeight;

  const trans = computeTransitionTransform(currentTime, segStart, segEnd, style);
  ctx.globalAlpha = trans.alpha;

  const blockHalfSpan = Math.max(giantWidth / 2, 90);
  const rawBigAnchorX =
    bigAlign === 'left'
      ? baseCenterX - blockHalfSpan + bigOffsetX + trans.dx
      : bigAlign === 'right'
      ? baseCenterX + blockHalfSpan + bigOffsetX + trans.dx
      : baseCenterX + bigOffsetX + trans.dx;
  const clampedBigAnchorX = clampHorizontalCenter(
    rawBigAnchorX,
    giantWidth,
    bigAlign,
    canvasWidth
  );
  const finalBigCenterX =
    bigAlign === 'left'
      ? clampedBigAnchorX + giantWidth / 2
      : bigAlign === 'right'
      ? clampedBigAnchorX - giantWidth / 2
      : clampedBigAnchorX;
  const finalBigCenterY = Math.max(
    canvasHeight * 0.04,
    Math.min(canvasHeight * 0.96, baseBigY + bigOffsetY + trans.dy)
  );

  const totalStackH =
    giantVisualHeight +
    (small1Text ? small1FontSize * 1.3 : 0) +
    (small2Text ? small2FontSize * 1.3 : 0) +
    Math.abs(vertGap);
  const maxStackW = Math.max(giantWidth, small1Width, small2Width, 180);

  if (style.backgroundEnabled && (style.backgroundOpacity ?? 0) > 0.04) {
    ctx.save();
    const pad = style.backgroundPaddingPx ?? 18;
    const rad = style.backgroundRadiusPx ?? 16;
    ctx.fillStyle = hexToRgba(
      style.backgroundColor || '#090A0F',
      style.backgroundOpacity ?? 0.85
    );
    drawRoundedRect(
      ctx,
      finalBigCenterX - maxStackW / 2 - pad,
      finalBigCenterY - totalStackH / 2 - pad * 0.6,
      maxStackW + pad * 2,
      totalStackH + pad * 1.2,
      rad
    );
    ctx.fill();
    ctx.restore();
  }

  drawCaptionDynamicFrame(
    ctx,
    finalBigCenterX,
    finalBigCenterY,
    maxStackW,
    totalStackH,
    style
  );

  // 1. Draw Small Line 1 (if present)
  if (smallLine1WordObjs.length > 0 && small1Text) {
    const rawSmall1X =
      small1Align === 'left'
        ? finalBigCenterX - giantWidth / 2 + 4 + small1OffsetX
        : small1Align === 'right'
        ? finalBigCenterX + giantWidth / 2 - 4 + small1OffsetX
        : finalBigCenterX + small1OffsetX;
    const clampedSmall1X = clampHorizontalCenter(
      rawSmall1X,
      small1Width,
      small1Align,
      canvasWidth
    );
    const finalSmall1Y = Math.max(
      18,
      Math.min(canvasHeight - 18, baseSmall1Y + small1OffsetY + trans.dy)
    );

    const hasCustomWordOrLineStyle1 =
      Boolean(style.line1Bold || style.line1Italic || style.line1Shine || style.line1Color) ||
      smallLine1WordObjs.some(
        (w) =>
          w.isBold !== undefined ||
          w.isItalic !== undefined ||
          w.isShine ||
          w.customColor ||
          (w.scaleMultiplier && w.scaleMultiplier !== 1)
      );

    if (hasCustomWordOrLineStyle1) {
      const centerLine1X =
        small1Align === 'left'
          ? clampedSmall1X + small1Width / 2
          : small1Align === 'right'
          ? clampedSmall1X - small1Width / 2
          : clampedSmall1X;
      drawRichWordTokensOnLine({
        ctx,
        lineWords: smallLine1WordObjs,
        anchorX: centerLine1X,
        lineY: finalSmall1Y,
        baseFontSize: small1FontSize,
        fontFamily: style.fontFamily,
        baseWeight: 700,
        letterSpace: letterSpace * 0.6,
        wordGap: Math.max(6, horizGap * 0.75),
        textTransform: style.textTransform || 'none',
        defaultFill: style.line1Color || style.primaryColor,
        strokeColor: 'rgba(0, 0, 0, 0.92)',
        strokeWidth: Math.max(2.5, small1FontSize * 0.12),
        hasPaperCard: false,
        currentTime,
        style,
        lineBold: style.line1Bold,
        lineItalic: style.line1Italic,
        lineShine: style.line1Shine,
        lineColor: style.line1Color,
      });
    } else {
      drawChromaticSmallPhrase(
        ctx,
        small1Text,
        clampedSmall1X,
        finalSmall1Y,
        small1FontSize,
        style.fontFamily,
        small1Align,
        style.line1Color || style.primaryColor,
        letterSpace * 0.6
      );
    }

    const boxLeft =
      small1Align === 'left'
        ? clampedSmall1X
        : small1Align === 'right'
        ? clampedSmall1X - small1Width
        : clampedSmall1X - small1Width / 2;
    const hit1: import('../types/caption').LayerHitBox = {
      layer: 'small1',
      x: boxLeft,
      y: finalSmall1Y - small1FontSize * 0.6,
      width: Math.max(44, small1Width),
      height: small1FontSize * 1.2,
      handleX: boxLeft + Math.max(44, small1Width),
      handleY: finalSmall1Y + small1FontSize * 0.6,
    };
    latestRenderedLayerHitBoxes.push(hit1);

    if (!isExportRender && style.showOnScreenTransformBoxes) {
      drawInteractiveLayerBoundingBox(
        ctx,
        hit1,
        style.selectedCanvasLayer === 'small1',
        `SMALL 1 · ${Math.round((style.smallWordScale || 0.68) * 100)}%`
      );
    }
  }

  // 2. Draw GIANT Hero Word(s) (Line 2) with per-word and per-line Bold, Italic, Shine, Scale, and Color support
  ctx.save();
  ctx.translate(finalBigCenterX, finalBigCenterY);
  if (trans.rotationRad !== 0) ctx.rotate(trans.rotationRad);
  ctx.scale(
    entranceSpring * heroPopScale * trans.scaleX,
    entranceSpring * heroPopScale * verticalStretch * trans.scaleY
  );

  const hasPerWordHeroOverrides = heroWordObjs.some(
    (w) =>
      w.isBold !== undefined ||
      w.isItalic !== undefined ||
      w.isShine ||
      w.customColor ||
      w.isUnderlined ||
      (w.scaleMultiplier && w.scaleMultiplier !== 1)
  );

  if (
    hasPerWordHeroOverrides ||
    style.line2Bold !== undefined ||
    style.line2Italic !== undefined ||
    style.line2Shine ||
    style.line2Color
  ) {
    const heroDefaultFill = style.line2Color
      ? style.line2Color
      : createSidzVerticalGradient(ctx, giantFontSize, currentTime, style, giantWidth);
    drawRichWordTokensOnLine({
      ctx,
      lineWords: heroWordObjs,
      anchorX: 0,
      lineY: 0,
      baseFontSize: giantFontSize,
      fontFamily: style.heroWordFontFamily || style.fontFamily,
      baseWeight: style.fontWeight || 800,
      letterSpace,
      wordGap: Math.max(8, horizGap),
      textTransform:
        style.hierarchyMode === 'sidz-truly-flame' && style.textTransform === 'none'
          ? 'lowercase'
          : style.textTransform || 'none',
      defaultFill: heroDefaultFill,
      strokeColor: style.strokeColor || 'rgba(5, 5, 10, 0.92)',
      strokeWidth: Math.max(2.5, style.strokeWidth || 3),
      hasPaperCard: false,
      currentTime,
      style,
      lineBold: style.line2Bold,
      lineItalic: style.line2Italic,
      lineShine: style.line2Shine,
      lineColor: style.line2Color,
    });
  } else {
    const heroItalicPrefix = style.italicText ? 'italic ' : '';
    ctx.font = `${heroItalicPrefix}${style.fontWeight} ${giantFontSize}px ${getWordFontStack(style.heroWordFontFamily)}`;
    applyCanvasLetterSpacing(ctx, letterSpace);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (style.depth3DEnabled) {
      const depthPx = Math.max(2, Math.min(20, style.depth3DDepth ?? 8));
      const angleRad = ((style.depth3DAngle ?? 135) * Math.PI) / 180;
      const dx3d = Math.cos(angleRad);
      const dy3d = Math.sin(angleRad);
      ctx.save();
      ctx.fillStyle = style.depth3DColor || style.highlightColor || '#FF5722';
      for (let d = depthPx; d >= 1; d -= 1.5) {
        ctx.fillText(heroText, dx3d * d, dy3d * d);
      }
      ctx.restore();
    }

    if (style.glowEnabled ?? true) {
      ctx.save();
      ctx.shadowColor = hexToRgba(
        style.glowColor || style.gradientMid || style.highlightColor || '#FDE047',
        0.65
      );
      ctx.shadowBlur = Math.max(18, style.glowSpread || style.shadowBlur * 1.2);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillText(heroText, 0, 0);
      ctx.restore();
    }

    if ((style.dropShadowEnabled ?? true) || style.strokeWidth > 0) {
      ctx.save();
      if (style.dropShadowEnabled ?? true) {
        ctx.shadowColor = style.dropShadowColor || 'rgba(0, 0, 0, 0.92)';
        ctx.shadowBlur = style.shadowBlur ?? 20;
        ctx.shadowOffsetX = style.dropShadowX ?? 0;
        ctx.shadowOffsetY = style.dropShadowY ?? 5;
      }
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.lineWidth = Math.max(2.5, style.strokeWidth || 3);
      ctx.strokeStyle = style.strokeColor || 'rgba(5, 5, 10, 0.92)';
      ctx.strokeText(heroText, 0, 0);
      ctx.restore();
    }

    ctx.fillStyle = createSidzVerticalGradient(ctx, giantFontSize, currentTime, style, giantWidth);
    ctx.fillText(heroText, 0, 0);

    if (style.underlineText) {
      ctx.beginPath();
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = Math.max(2.5, giantFontSize * 0.065);
      ctx.moveTo(-giantWidth / 2, giantFontSize * 0.46);
      ctx.lineTo(giantWidth / 2, giantFontSize * 0.46);
      ctx.stroke();
    }
  }
  ctx.restore();

  const hitBig: import('../types/caption').LayerHitBox = {
    layer: 'big',
    x: finalBigCenterX - giantWidth / 2,
    y: finalBigCenterY - giantVisualHeight * 0.46,
    width: Math.max(60, giantWidth),
    height: giantVisualHeight * 0.92,
    handleX: finalBigCenterX + giantWidth / 2,
    handleY: finalBigCenterY + giantVisualHeight * 0.46,
  };
  latestRenderedLayerHitBoxes.push(hitBig);

  if (!isExportRender && style.showOnScreenTransformBoxes) {
    drawInteractiveLayerBoundingBox(
      ctx,
      hitBig,
      style.selectedCanvasLayer === 'big',
      `BIG TEXT · ${Math.round((style.bigWordScale || 2.15) * 100)}%`
    );
  }

  // 3. Draw Small Line 2 / Line 3 or Overlapping Script Tail (if present)
  if (smallLine2WordObjs.length > 0 && small2Text) {
    const rawSmall2X =
      small2Align === 'left'
        ? finalBigCenterX - giantWidth / 2 + 4 + small2OffsetX
        : small2Align === 'right'
        ? finalBigCenterX + giantWidth / 2 - 4 + small2OffsetX
        : finalBigCenterX + small2OffsetX;
    const clampedSmall2X = clampHorizontalCenter(
      rawSmall2X,
      small2Width,
      small2Align,
      canvasWidth
    );
    const finalSmall2Y = Math.max(
      24,
      Math.min(canvasHeight - 24, baseSmall2Y + small2OffsetY)
    );

    const hasCustomWordOrLineStyle3 =
      Boolean(style.line3Bold || style.line3Italic || style.line3Shine || style.line3Color) ||
      smallLine2WordObjs.some(
        (w) =>
          w.isBold !== undefined ||
          w.isItalic !== undefined ||
          w.isShine ||
          w.customColor ||
          (w.scaleMultiplier && w.scaleMultiplier !== 1)
      );

    if (hasCustomWordOrLineStyle3) {
      const centerLine3X =
        small2Align === 'left'
          ? clampedSmall2X + small2Width / 2
          : small2Align === 'right'
          ? clampedSmall2X - small2Width / 2
          : clampedSmall2X;
      drawRichWordTokensOnLine({
        ctx,
        lineWords: smallLine2WordObjs,
        anchorX: centerLine3X,
        lineY: finalSmall2Y,
        baseFontSize: small2FontSize,
        fontFamily: style.fontFamily,
        baseWeight: 700,
        letterSpace: letterSpace * 0.6,
        wordGap: Math.max(6, horizGap * 0.75),
        textTransform: style.textTransform || 'none',
        defaultFill: style.line3Color || style.primaryColor,
        strokeColor: 'rgba(0, 0, 0, 0.92)',
        strokeWidth: Math.max(2.5, small2FontSize * 0.12),
        hasPaperCard: false,
        currentTime,
        style,
        lineBold: style.line3Bold,
        lineItalic: style.line3Italic,
        lineShine: style.line3Shine,
        lineColor: style.line3Color,
      });
    } else if (style.hierarchyMode === 'sidz-20k-script' && style.smallTwoLineMode !== 'two-line-split') {
      const scriptFontSize = Math.max(18, Math.round(small2FontSize * 1.28));
      drawSidzScriptTailPhrase(
        ctx,
        small2Text,
        clampedSmall2X,
        finalSmall2Y,
        scriptFontSize,
        style.accentScriptFontFamily || 'Kaushan Script',
        letterSpace * 0.5
      );
    } else {
      drawChromaticSmallPhrase(
        ctx,
        small2Text,
        clampedSmall2X,
        finalSmall2Y,
        small2FontSize,
        style.fontFamily,
        small2Align,
        style.line3Color || style.primaryColor,
        letterSpace * 0.6
      );
    }

    const box2Left =
      small2Align === 'left'
        ? clampedSmall2X
        : small2Align === 'right'
        ? clampedSmall2X - small2Width
        : clampedSmall2X - small2Width / 2;
    const hit2: import('../types/caption').LayerHitBox = {
      layer: 'small2',
      x: box2Left,
      y: finalSmall2Y - small2FontSize * 0.6,
      width: Math.max(44, small2Width),
      height: small2FontSize * 1.2,
      handleX: box2Left + Math.max(44, small2Width),
      handleY: finalSmall2Y + small2FontSize * 0.6,
    };
    latestRenderedLayerHitBoxes.push(hit2);

    if (!isExportRender && style.showOnScreenTransformBoxes) {
      drawInteractiveLayerBoundingBox(
        ctx,
        hit2,
        style.selectedCanvasLayer === 'small2',
        `SMALL 2 · ${Math.round((style.smallLine2Scale ?? style.smallWordScale ?? 0.68) * 100)}%`
      );
    }
  }

  ctx.restore();
}

function drawSampleReelBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  sampleReel: SampleReel,
  includeForegroundSubject = true
) {
  ctx.save();

  // 1. Deep charcoal pleated studio acoustic curtains background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#2A2E35');
  bgGrad.addColorStop(0.5, '#1D2026');
  bgGrad.addColorStop(1, '#101216');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle vertical curtain folds
  for (let i = 0; i < 9; i++) {
    const foldX = (width / 9) * i;
    const foldW = width / 9;
    const foldGrad = ctx.createLinearGradient(foldX, 0, foldX + foldW, 0);
    foldGrad.addColorStop(0, 'rgba(0, 0, 0, 0.28)');
    foldGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.04)');
    foldGrad.addColorStop(1, 'rgba(0, 0, 0, 0.34)');
    ctx.fillStyle = foldGrad;
    ctx.fillRect(foldX, 0, foldW, height);
  }

  // 2. Warm glowing studio table lamp on the right (matching screenshot)
  const lampX = width * 0.85;
  const lampY = height * 0.36;
  const haloGrad = ctx.createRadialGradient(
    lampX,
    lampY,
    width * 0.04,
    lampX,
    lampY,
    width * 0.62
  );
  haloGrad.addColorStop(0, 'rgba(255, 244, 196, 0.88)');
  haloGrad.addColorStop(0.22, 'rgba(251, 191, 36, 0.34)');
  haloGrad.addColorStop(0.58, 'rgba(245, 158, 11, 0.09)');
  haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = haloGrad;
  ctx.fillRect(0, 0, width, height);

  // Lamp brass stand & cream drum shade
  ctx.fillStyle = '#B45309';
  ctx.fillRect(lampX - 4, lampY + 52, 8, height * 0.25);
  ctx.fillStyle = '#78350F';
  drawRoundedRect(ctx, lampX - 18, lampY + 64, 36, 12, 4);
  ctx.fill();

  const shadeGrad = ctx.createLinearGradient(lampX - 65, lampY - 58, lampX + 65, lampY + 58);
  shadeGrad.addColorStop(0, '#FFFBEB');
  shadeGrad.addColorStop(0.5, '#FEF3C7');
  shadeGrad.addColorStop(1, '#FDE68A');
  ctx.fillStyle = shadeGrad;
  ctx.shadowColor = 'rgba(251, 191, 36, 0.65)';
  ctx.shadowBlur = 32;
  drawRoundedRect(ctx, lampX - 64, lampY - 62, 138, 116, 10);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 3. Lush tropical indoor palm fronds in top-left corner (matching screenshot)
  ctx.save();
  const sway = Math.sin(currentTime * 1.4) * 3;
  ctx.translate(-10, height * 0.04 + sway);
  const frondAngles = [-0.45, -0.22, 0.02, 0.26, 0.5, 0.75];
  frondAngles.forEach((ang, idx) => {
    ctx.save();
    ctx.rotate(ang);
    // Main stem
    ctx.strokeStyle = idx % 2 === 0 ? '#65A30D' : '#4D7C0F';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(width * 0.16, -18, width * 0.34, 14);
    ctx.stroke();

    // Leaflets along the stem
    for (let l = 1; l <= 11; l++) {
      const lx = (width * 0.32 * l) / 11;
      const ly = -8 + (l - 5) * 1.8;
      ctx.fillStyle = l % 2 === 0 ? '#84CC16' : '#4D7C0F';
      ctx.beginPath();
      ctx.ellipse(lx, ly - 16, 26, 5.5, -0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(lx, ly + 16, 26, 5.5, 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
  ctx.restore();

  // 4. Dark charcoal studio armchair behind the creator
  const chairCenterX = width * 0.48;
  const chairTopY = height * 0.53;
  const chairGrad = ctx.createLinearGradient(0, chairTopY, 0, height);
  chairGrad.addColorStop(0, '#2C313A');
  chairGrad.addColorStop(0.5, '#1F232A');
  chairGrad.addColorStop(1, '#12151A');
  ctx.fillStyle = chairGrad;
  // Chair backrest
  drawRoundedRect(ctx, width * 0.08, chairTopY, width * 0.78, height * 0.46, 36);
  ctx.fill();
  // Left & right plush armrests
  ctx.fillStyle = '#252932';
  drawRoundedRect(ctx, width * 0.02, height * 0.67, width * 0.22, height * 0.33, 28);
  ctx.fill();
  drawRoundedRect(ctx, width * 0.72, height * 0.68, width * 0.24, height * 0.32, 28);
  ctx.fill();

  if (includeForegroundSubject) {
    drawSampleReelForegroundSubject(ctx, width, height, currentTime);
  }
  ctx.restore();
}

function drawSampleReelForegroundSubject(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number
) {
  ctx.save();
  const chairCenterX = width * 0.48;
  // 5. Podcast Creator Subject (Seated in center, black hoodie, glasses, beard, speaking gesture)
  const headX = chairCenterX - width * 0.02;
  const headY = height * 0.45 + Math.sin(currentTime * 3.2) * 2.5;
  const headW = width * 0.19;
  const headH = height * 0.135;

  // Ambient depth shadow cast onto any behind-head captions
  ctx.shadowColor = 'rgba(0, 0, 0, 0.58)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = -2;

  // Black hoodie shoulders & torso
  const hoodieGrad = ctx.createLinearGradient(
    headX - width * 0.28,
    height * 0.54,
    headX + width * 0.28,
    height * 0.94
  );
  hoodieGrad.addColorStop(0, '#181A20');
  hoodieGrad.addColorStop(0.6, '#101216');
  hoodieGrad.addColorStop(1, '#090A0D');
  ctx.fillStyle = hoodieGrad;
  ctx.beginPath();
  ctx.moveTo(headX - width * 0.28, height * 0.96);
  ctx.quadraticCurveTo(headX - width * 0.27, height * 0.56, headX - width * 0.09, height * 0.54);
  ctx.lineTo(headX + width * 0.11, height * 0.54);
  ctx.quadraticCurveTo(headX + width * 0.29, height * 0.56, headX + width * 0.3, height * 0.96);
  ctx.closePath();
  ctx.fill();

  // Subtle gold LOKESH chest emblem on hoodie
  ctx.fillStyle = '#EAB308';
  ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LOKESH', headX + width * 0.1, height * 0.64);

  // Neck
  ctx.fillStyle = '#C68B63';
  drawRoundedRect(ctx, headX - width * 0.045, headY + headH * 0.55, width * 0.09, height * 0.06, 10);
  ctx.fill();

  // Voluminous dark wavy hair
  ctx.fillStyle = '#111317';
  ctx.beginPath();
  ctx.ellipse(headX, headY - headH * 0.14, headW * 0.66, headH * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();

  // Face contour with warm studio key light
  const skinGrad = ctx.createLinearGradient(headX - headW * 0.5, headY, headX + headW * 0.5, headY);
  skinGrad.addColorStop(0, '#B87A52');
  skinGrad.addColorStop(0.65, '#D99B72');
  skinGrad.addColorStop(1, '#E6AE86');
  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.ellipse(headX, headY, headW * 0.52, headH * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();

  // Full groomed beard & mustache
  ctx.fillStyle = '#181A1F';
  ctx.beginPath();
  ctx.arc(headX, headY + headH * 0.08, headW * 0.51, 0.12 * Math.PI, 0.88 * Math.PI);
  ctx.closePath();
  ctx.fill();

  // Animated speaking mouth inside beard
  const mouthOpen = 3 + Math.abs(Math.sin(currentTime * 9.5)) * 7;
  ctx.fillStyle = '#7F1D1D';
  drawRoundedRect(ctx, headX - 11, headY + headH * 0.22, 22, mouthOpen, 4);
  ctx.fill();

  // Rectangular dark-frame glasses with subtle warm lamp reflection
  ctx.strokeStyle = '#111318';
  ctx.lineWidth = 3.2;
  drawRoundedRect(ctx, headX - headW * 0.42, headY - headH * 0.14, headW * 0.36, headH * 0.22, 5);
  ctx.stroke();
  drawRoundedRect(ctx, headX + headW * 0.06, headY - headH * 0.14, headW * 0.36, headH * 0.22, 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(headX - headW * 0.06, headY - headH * 0.04);
  ctx.lineTo(headX + headW * 0.06, headY - headH * 0.04);
  ctx.stroke();

  // Expressive gesturing hand in center-front (matching screenshot)
  const handY = height * 0.61 + Math.sin(currentTime * 4.5) * 4;
  ctx.fillStyle = '#D99B72';
  drawRoundedRect(ctx, headX - 14, handY, 38, 48, 14);
  ctx.fill();

  // 6. Studio Condenser Podcast Microphone & Boom Arm on right
  const micX = width * 0.65;
  const micY = height * 0.55;
  ctx.strokeStyle = '#1E2028';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(width * 0.96, height * 0.72);
  ctx.lineTo(micX + 18, micY + 42);
  ctx.stroke();

  ctx.save();
  ctx.translate(micX, micY);
  ctx.rotate(-0.35);
  ctx.fillStyle = '#181A20';
  ctx.strokeStyle = '#3F4454';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, -18, -38, 36, 76, 16);
  ctx.fill();
  ctx.stroke();
  // Mic mesh grille lines
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  for (let m = -28; m <= 0; m += 6) {
    ctx.beginPath();
    ctx.moveTo(-14, m);
    ctx.lineTo(14, m);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

export function renderReelCanvasFrame(params: {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  videoElement: HTMLVideoElement | null;
  hasUploadedVideo: boolean;
  sampleReel: SampleReel;
  currentTime: number;
  segments: CaptionSegment[];
  style: CaptionStyleConfig;
  isExportRender?: boolean;
  transparentAlphaOnly?: boolean;
  isVideo1Visible?: boolean;
  isCaptionsVisible?: boolean;
  isDraggingCaption?: boolean;
  activeTimelineBroll?: {
    label: string;
    startTime: number;
    endTime: number;
    brollPrompt?: string;
    brollEffect?: string;
  } | null;
  activeTimelineVideo2?: {
    label: string;
    startTime: number;
    endTime: number;
  } | null;
  aiBRollSlots?: AIBRollSlot[];
}) {
  const {
    ctx,
    canvasWidth,
    canvasHeight,
    videoElement,
    hasUploadedVideo,
    sampleReel,
    currentTime,
    segments,
    style,
    isExportRender = false,
    transparentAlphaOnly = false,
    isVideo1Visible = true,
    isCaptionsVisible = true,
    isDraggingCaption = false,
    activeTimelineBroll = null,
    activeTimelineVideo2 = null,
    aiBRollSlots = [],
  } = params;

  if (!isExportRender) {
    latestRenderedLayerHitBoxes = [];
  }

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Uniform logical coordinate space for 9:16 (720x1280), 16:9 (1280x720), and 1:1 (720x720)
  // Prevents any horizontal/vertical aspect ratio stretching!
  const uniformScale = Math.min(canvasWidth, canvasHeight) / 720;
  const logicalW = Math.round(canvasWidth / uniformScale);
  const logicalH = Math.round(canvasHeight / uniformScale);
  const scaleX = canvasWidth / logicalW;
  const scaleY = canvasHeight / logicalH;

  // 1. Draw Video Frame at Full Physical Resolution (with Section 11 VideoClipEdit Transform/Crop/Opacity) or Sample Reel Backdrop
  if (!transparentAlphaOnly) {
    if (!isVideo1Visible) {
      // Video 1 is cut/deleted at this timestamp or hidden via Eye toggle while Audio 1 may still play
      ctx.save();
      ctx.fillStyle = '#07080C';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.scale(scaleX, scaleY);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VIDEO 1 CUT / HIDDEN AT PLAYHEAD', logicalW / 2, logicalH * 0.42);
      ctx.restore();
    } else {
      const clipEdit = style.videoClipEdit;
      const cropL = Math.max(0, Math.min(45, Number(clipEdit?.cropLeft) || 0));
      const cropR = Math.max(0, Math.min(45, Number(clipEdit?.cropRight) || 0));
      const cropT = Math.max(0, Math.min(45, Number(clipEdit?.cropTop) || 0));
      const cropB = Math.max(0, Math.min(45, Number(clipEdit?.cropBottom) || 0));
      const cropRound = Math.max(0, Number(clipEdit?.cropRounded) || 0);
      const hasActiveCrop =
        cropL > 0 || cropR > 0 || cropT > 0 || cropB > 0 || cropRound > 0;

      ctx.save();
      if (clipEdit) {
        ctx.globalAlpha = Math.max(0.05, Math.min(1, (clipEdit.opacity ?? 100) / 100));
        if (hasActiveCrop) {
          const cl = (cropL / 100) * canvasWidth;
          const cr = (cropR / 100) * canvasWidth;
          const ct = (cropT / 100) * canvasHeight;
          const cb = (cropB / 100) * canvasHeight;
          const cw = Math.max(40, canvasWidth - cl - cr);
          const ch = Math.max(40, canvasHeight - ct - cb);
          drawRoundedRect(ctx, cl, ct, cw, ch, cropRound);
          ctx.clip();
        }
        const posX = Number(clipEdit.positionX) || 0;
        const posY = Number(clipEdit.positionY) || 0;
        const rot = Number(clipEdit.rotation) || 0;
        const rawZoomX = Math.max(50, Math.min(250, Number(clipEdit.zoomX) || 100));
        const rawZoomY =
          clipEdit.zoomLinked !== false
            ? rawZoomX
            : Math.max(50, Math.min(250, Number(clipEdit.zoomY) || 100));

        ctx.translate(canvasWidth / 2 + posX, canvasHeight / 2 + posY);
        if (rot) {
          ctx.rotate((rot * Math.PI) / 180);
        }
        const sx = (rawZoomX / 100) * (clipEdit.flipHorizontal ? -1 : 1);
        const sy = (rawZoomY / 100) * (clipEdit.flipVertical ? -1 : 1);
        ctx.scale(sx, sy);
        ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
      }

      if (hasUploadedVideo && videoElement) {
        if (videoElement.readyState >= 2 && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
          const vw = videoElement.videoWidth;
          const vh = videoElement.videoHeight;
          const canvasRatio = canvasWidth / canvasHeight;
          const videoRatio = vw / vh;

          // Always fill 100% of the canvas background edge-to-edge using the video itself
          // so there are NEVER black pillarbox/letterbox bars in preview or exported video!
          let coverW = canvasWidth;
          let coverH = canvasHeight;
          if (videoRatio > canvasRatio) {
            coverH = canvasHeight;
            coverW = canvasHeight * videoRatio;
          } else {
            coverW = canvasWidth;
            coverH = canvasWidth / videoRatio;
          }
          const coverX = (canvasWidth - coverW) / 2;
          const coverY = (canvasHeight - coverH) / 2;

          if (Math.abs(videoRatio - canvasRatio) <= 0.24) {
            // Same orientation (e.g. 9:16 portrait video on portrait canvas):
            // Draw edge-to-edge full-bleed cover so zero black bars appear on left/right/top/bottom!
            ctx.drawImage(videoElement, coverX, coverY, coverW, coverH);
          } else {
            // Cross-orientation (e.g. 9:16 video on 16:9 canvas):
            // 1. Draw full-opacity blurred edge-to-edge video backdrop (never solid black!)
            ctx.save();
            ctx.filter = 'blur(26px) brightness(0.68)';
            ctx.drawImage(
              videoElement,
              coverX - canvasWidth * 0.04,
              coverY - canvasHeight * 0.04,
              coverW + canvasWidth * 0.08,
              coverH + canvasHeight * 0.08
            );
            ctx.restore();

            // 2. Draw crisp uncropped video centered on top
            let drawW = canvasWidth;
            let drawH = canvasHeight;
            let offsetX = 0;
            let offsetY = 0;
            if (videoRatio > canvasRatio) {
              drawW = canvasWidth;
              drawH = canvasWidth / videoRatio;
              offsetY = (canvasHeight - drawH) / 2;
            } else {
              drawH = canvasHeight;
              drawW = canvasHeight * videoRatio;
              offsetX = (canvasWidth - drawW) / 2;
            }
            ctx.drawImage(videoElement, offsetX, offsetY, drawW, drawH);
          }

          // Cache the UNCLIPPED decoded video frame so resetting crop while paused or seeking immediately restores 100% full video
          if (typeof document !== 'undefined') {
            if (
              !lastValidVideoFrameCanvas ||
              lastValidVideoFrameCanvas.width !== canvasWidth ||
              lastValidVideoFrameCanvas.height !== canvasHeight
            ) {
              lastValidVideoFrameCanvas = document.createElement('canvas');
              lastValidVideoFrameCanvas.width = canvasWidth;
              lastValidVideoFrameCanvas.height = canvasHeight;
            }
            const cacheCtx = lastValidVideoFrameCanvas.getContext('2d');
            if (cacheCtx) {
              cacheCtx.clearRect(0, 0, canvasWidth, canvasHeight);
              cacheCtx.drawImage(videoElement, coverX, coverY, coverW, coverH);
              lastValidVideoSrc = videoElement.currentSrc || videoElement.src || 'uploaded';
            }
          }
        } else if (
          lastValidVideoFrameCanvas &&
          lastValidVideoSrc === (videoElement.currentSrc || videoElement.src || 'uploaded')
        ) {
          // While HTMLVideoElement is mid-seek, keep displaying the last decoded uncropped video frame (never black!)
          ctx.drawImage(lastValidVideoFrameCanvas, 0, 0, canvasWidth, canvasHeight);
        } else {
          ctx.fillStyle = '#10141E';
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
      } else {
        ctx.save();
        ctx.scale(scaleX, scaleY);
        // When Depth Mask is ON, draw only the background plate in Layer 1; the creator subject renders in Layer 3 on top of captions!
        drawSampleReelBackdrop(
          ctx,
          logicalW,
          logicalH,
          currentTime,
          sampleReel,
          !(BEHIND_THE_HEAD_MODULE_ENABLED && style.captionDepthBehindSubject)
        );
        ctx.restore();
      }
      ctx.restore();
    }
  }

  ctx.save();
  ctx.scale(scaleX, scaleY);

  // 1.5 Draw Timeline B-Roll 1 / Video 2 Cutaway Card when active on the Multi-Track Timeline
  const effectiveTimelineBroll = Boolean(style.brollEnabled) ? activeTimelineBroll : null;
  if (!transparentAlphaOnly && (effectiveTimelineBroll || activeTimelineVideo2)) {
    const clip = effectiveTimelineBroll || activeTimelineVideo2;
    if (clip) {
      ctx.save();
      const prog = Math.max(
        0,
        Math.min(
          1,
          (currentTime - clip.startTime) / Math.max(0.3, clip.endTime - clip.startTime)
        )
      );
      const isBroll = Boolean(effectiveTimelineBroll);
      const cardW = logicalW * 0.84;
      const cardH = logicalH * 0.16;
      const cardX = (logicalW - cardW) / 2;
      const cardY = logicalH * 0.11;

      const zoomScale = 1 + Math.sin(prog * Math.PI) * 0.035;
      ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
      ctx.scale(zoomScale, zoomScale);
      ctx.translate(-(cardX + cardW / 2), -(cardY + cardH / 2));

      ctx.fillStyle = 'rgba(15, 18, 26, 0.92)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 22;
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 18);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = isBroll
        ? 'rgba(245, 158, 11, 0.8)'
        : 'rgba(168, 85, 247, 0.8)';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.fillStyle = isBroll ? '#F59E0B' : '#C084FC';
      ctx.font = '800 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        isBroll
          ? `🎬 B-ROLL 1 TRACK · ${(activeTimelineBroll?.brollEffect || 'KEN-BURNS').toUpperCase()}`
          : '🎞️ VIDEO 2 OVERLAY TRACK · PIP CUTAWAY',
        cardX + 20,
        cardY + cardH * 0.34
      );

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 21px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(clip.label, cardX + 20, cardY + cardH * 0.64);

      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      drawRoundedRect(ctx, cardX + 20, cardY + cardH * 0.83, cardW - 40, 5, 3);
      ctx.fill();
      ctx.fillStyle = isBroll ? '#F59E0B' : '#C084FC';
      drawRoundedRect(
        ctx,
        cardX + 20,
        cardY + cardH * 0.83,
        (cardW - 40) * prog,
        5,
        3
      );
      ctx.fill();
      ctx.restore();
    }
  }

  // 2. Measured Contrast Scrim
  if (style.showScrim && !transparentAlphaOnly) {
    const scrimGrad = ctx.createLinearGradient(0, logicalH * 0.44, 0, logicalH);
    scrimGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    scrimGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.38)');
    scrimGrad.addColorStop(1, 'rgba(0, 0, 0, 0.82)');
    ctx.fillStyle = scrimGrad;
    ctx.fillRect(0, logicalH * 0.44, logicalW, logicalH * 0.56);
  }

  // 2.5 CapCut / Premiere Pro / Photoshop Mask Studio Layer
  if (style.maskMode && style.maskMode !== 'none' && !transparentAlphaOnly) {
    drawCapCutPremiereMask(ctx, logicalW, logicalH, style);
  }

  // 3. Find Active Segment
  const activeSegment = isCaptionsVisible
    ? segments.find((s) => currentTime >= s.startTime && currentTime <= s.endTime + 0.05)
    : undefined;

  // 3.1 Render Active AI B-Roll Scene (3-Image Studio + Per-Caption B-Roll + Magical Effects)
  // Strictly gated by Boolean(style.brollEnabled) so disabling the toggle hides all B-Roll everywhere
  if (!transparentAlphaOnly && Boolean(style.brollEnabled)) {
    const matchedSlot =
      (activeSegment?.aiBrollSlotId
        ? aiBRollSlots.find(
            (slot) => slot.id === activeSegment.aiBrollSlotId && slot.enabled
          )
        : undefined) ||
      (activeSegment
        ? aiBRollSlots.find(
            (slot) => slot.enabled && slot.linkedSegmentId === activeSegment.id
          )
        : undefined) ||
      aiBRollSlots.find(
        (slot) =>
          slot.enabled &&
          currentTime >= slot.startTime &&
          currentTime <= slot.endTime + 0.05
      );

    const hasSegmentCustomBroll =
      activeSegment &&
      (Boolean(activeSegment.brollImageUrl) ||
        (activeSegment.brollTheme && activeSegment.brollTheme !== 'none'));

    if (matchedSlot || hasSegmentCustomBroll) {
      const slotStart = matchedSlot
        ? matchedSlot.startTime
        : activeSegment?.startTime || 0;
      const slotEnd = matchedSlot
        ? matchedSlot.endTime
        : activeSegment?.endTime || slotStart + 2.5;
      const prog = Math.max(
        0,
        Math.min(1, (currentTime - slotStart) / Math.max(0.35, slotEnd - slotStart))
      );

      const effectiveRatio: VideoAspectRatio =
        activeSegment?.aiBrollAspectRatio ||
        matchedSlot?.aspectRatio ||
        style.aspectRatio ||
        '9:16';

      const effectiveLayout: BRollDisplayLayout =
        activeSegment?.aiBrollDisplayLayout ||
        matchedSlot?.displayLayout ||
        style.aiBrollLayout ||
        (style.brollDisplayMode === 'fullscreen' ? 'cutaway' : 'pip_card');

      const effectiveMotion: BRollMotionPreset =
        activeSegment?.aiBrollMotionPreset ||
        matchedSlot?.motionPreset ||
        style.aiBrollMotionPreset ||
        'ken_burns_zoom';

      const effectiveMagic: BRollMagicalEffect =
        activeSegment?.aiBrollMagicalEffect ||
        matchedSlot?.magicalEffect ||
        style.aiBrollMagicalEffect ||
        'all_magic';

      const titleLabel =
        matchedSlot?.title ||
        activeSegment?.brollTitle ||
        `AI B-Roll (${effectiveRatio})`;

      let imageDataUrl =
        activeSegment?.brollImageUrl || matchedSlot?.imageDataUrl;
      if (!imageDataUrl && activeSegment) {
        imageDataUrl = synthesizeStudioBRollArtworkDataUrl(
          activeSegment.aiBrollPrompt ||
            activeSegment.brollTitle ||
            activeSegment.brollTheme ||
            'Cinematic visual',
          effectiveRatio,
          matchedSlot?.slotNumber || 1,
          titleLabel
        );
      }

      const imgEl = getCachedBRollImageElement(imageDataUrl);

      ctx.save();

      // Determine target frame rectangle on logical canvas (logicalW x logicalH)
      let boxX = 0;
      let boxY = 0;
      let boxW = logicalW;
      let boxH = logicalH;
      let cornerRadius = 0;

      const targetNumRatio =
        effectiveRatio === '9:16'
          ? 9 / 16
          : effectiveRatio === '1:1'
          ? 1
          : 16 / 9;

      if (effectiveLayout === 'cutaway') {
        // Full-Screen Cutaway: Fill background + frame image in exact selected aspect ratio
        boxX = 0;
        boxY = 0;
        boxW = logicalW;
        boxH = logicalH;
        cornerRadius = 0;
      } else if (effectiveLayout === 'split_backdrop') {
        // Upper Split Backdrop (top 50% of screen)
        boxW = logicalW * 0.94;
        boxH = logicalH * 0.44;
        boxX = (logicalW - boxW) / 2;
        boxY = logicalH * 0.04;
        cornerRadius = 22;
      } else {
        // Floating Picture-in-Picture (PiP) Card shaped to exact selected aspect ratio ('9:16', '1:1', '16:9')
        if (effectiveRatio === '9:16') {
          boxW = logicalW * 0.42;
          boxH = Math.min(logicalH * 0.48, boxW / targetNumRatio);
        } else if (effectiveRatio === '1:1') {
          boxW = logicalW * 0.56;
          boxH = boxW;
        } else {
          boxW = logicalW * 0.84;
          boxH = boxW / targetNumRatio;
        }
        boxX = (logicalW - boxW) / 2;
        boxY = logicalH * 0.08;
        cornerRadius = 22;
      }

      // Entrance & Exit Envelope + 3D Motion Preset
      const enterEnv = Math.min(1, prog / 0.14);
      const exitEnv = Math.min(1, (1 - prog) / 0.12);
      const alphaEnv = Math.max(0.15, Math.min(1, Math.min(enterEnv, exitEnv)));

      let portalScale = 1;
      if (effectiveMotion === 'portal_pop') {
        // Elastic spring pop-in
        const t = Math.min(1, prog / 0.22);
        portalScale =
          t < 1
            ? 0.72 + Math.sin(t * Math.PI * 0.85) * 0.34
            : 1 + Math.sin(prog * Math.PI) * 0.02;
      }

      ctx.globalAlpha = alphaEnv;

      const centerX = boxX + boxW / 2;
      const centerY = boxY + boxH / 2;
      ctx.translate(centerX, centerY);
      ctx.scale(portalScale, portalScale);
      ctx.translate(-centerX, -centerY);

      // Outer Magical Glowing Aura Burst (behind card)
      if (effectiveMagic === 'aura_burst' || effectiveMagic === 'all_magic') {
        ctx.save();
        const pulse = 0.65 + 0.35 * Math.sin(currentTime * 5.2);
        const auraGrad = ctx.createRadialGradient(
          centerX,
          centerY,
          Math.min(boxW, boxH) * 0.18,
          centerX,
          centerY,
          Math.max(boxW, boxH) * 0.72
        );
        auraGrad.addColorStop(0, `rgba(253, 224, 71, ${0.42 * pulse})`);
        auraGrad.addColorStop(0.5, `rgba(43, 174, 102, ${0.28 * pulse})`);
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = auraGrad;
        ctx.fillRect(
          boxX - 60,
          boxY - 60,
          boxW + 120,
          boxH + 120
        );
        ctx.restore();
      }

      // Clip to B-Roll container
      ctx.save();
      if (cornerRadius > 0) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.82)';
        ctx.shadowBlur = 28;
        drawRoundedRect(ctx, boxX, boxY, boxW, boxH, cornerRadius);
        ctx.fillStyle = '#0D1017';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.clip();
      } else {
        ctx.beginPath();
        ctx.rect(boxX, boxY, boxW, boxH);
        ctx.clip();
      }

      // Draw the AI B-Roll Image with 3D Ken Burns Zoom or Pan-Glide
      if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
        const iw = imgEl.naturalWidth;
        const ih = imgEl.naturalHeight;
        const imgRatio = iw / ih;
        const containerRatio = boxW / boxH;

        // First fill any aspect difference with a soft-blurred ambient backdrop
        ctx.save();
        let bgW = boxW;
        let bgH = boxH;
        if (imgRatio > containerRatio) {
          bgH = boxH;
          bgW = boxH * imgRatio;
        } else {
          bgW = boxW;
          bgH = boxW / imgRatio;
        }
        ctx.drawImage(
          imgEl,
          boxX + (boxW - bgW) / 2,
          boxY + (boxH - bgH) / 2,
          bgW,
          bgH
        );
        ctx.restore();

        // Compute motion transform (3D Ken Burns Zoom or Pan-Glide)
        ctx.save();
        const zoomFactor =
          effectiveMotion === 'ken_burns_zoom'
            ? 1.02 + prog * 0.16
            : effectiveMotion === 'pan_glide'
            ? 1.12
            : 1.04 + Math.sin(prog * Math.PI) * 0.06;
        const panX =
          effectiveMotion === 'pan_glide'
            ? (prog - 0.5) * boxW * 0.09
            : Math.sin(prog * Math.PI) * boxW * 0.02;
        const panY =
          effectiveMotion === 'ken_burns_zoom'
            ? (0.5 - prog) * boxH * 0.04
            : 0;

        ctx.translate(centerX + panX, centerY + panY);
        ctx.scale(zoomFactor, zoomFactor);
        ctx.translate(-centerX, -centerY);

        // Frame image according to its aspect ratio inside container
        let drawW = boxW;
        let drawH = boxH;
        if (Math.abs(imgRatio - containerRatio) <= 0.2) {
          drawW = boxW;
          drawH = boxH;
        } else if (imgRatio > containerRatio) {
          drawH = boxH;
          drawW = boxH * imgRatio;
        } else {
          drawW = boxW;
          drawH = boxW / imgRatio;
        }
        ctx.drawImage(
          imgEl,
          boxX + (boxW - drawW) / 2,
          boxY + (boxH - drawH) / 2,
          drawW,
          drawH
        );
        ctx.restore();
      } else {
        // Rich gradient fallback while image element decodes
        const fallbackGrad = ctx.createLinearGradient(
          boxX,
          boxY,
          boxX + boxW,
          boxY + boxH
        );
        fallbackGrad.addColorStop(0, '#0F291E');
        fallbackGrad.addColorStop(0.5, '#162436');
        fallbackGrad.addColorStop(1, '#261C0E');
        ctx.fillStyle = fallbackGrad;
        ctx.fillRect(boxX, boxY, boxW, boxH);
      }

      // Magical Effect 1: Cinematic Anamorphic Light Leaks
      if (effectiveMagic === 'light_leaks' || effectiveMagic === 'all_magic') {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const sweepX = boxX + ((prog * 1.35 - 0.15) * boxW);
        const leakGrad = ctx.createLinearGradient(
          sweepX - boxW * 0.45,
          boxY,
          sweepX + boxW * 0.45,
          boxY + boxH
        );
        leakGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        leakGrad.addColorStop(0.35, 'rgba(253, 224, 71, 0.24)');
        leakGrad.addColorStop(0.55, 'rgba(52, 211, 153, 0.22)');
        leakGrad.addColorStop(0.75, 'rgba(245, 158, 11, 0.18)');
        leakGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = leakGrad;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.restore();
      }

      // Magical Effect 2: Floating Gold & Emerald Sparkle Particles
      if (
        effectiveMagic === 'gold_emerald_particles' ||
        effectiveMagic === 'all_magic'
      ) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const particleCount = 26;
        for (let i = 0; i < particleCount; i++) {
          const seedX = ((Math.sin(i * 19.37 + 1.7) * 43758.5453) % 1 + 1) % 1;
          const seedY = ((Math.cos(i * 43.11 + 3.1) * 19283.412) % 1 + 1) % 1;
          const driftX =
            Math.sin(currentTime * (1.2 + (i % 4) * 0.35) + i) * 18;
          const upwardY =
            ((seedY - currentTime * (0.08 + (i % 3) * 0.03)) % 1 + 1) % 1;
          const px = boxX + seedX * boxW + driftX;
          const py = boxY + upwardY * boxH;
          const twinkle =
            0.35 + 0.65 * Math.abs(Math.sin(currentTime * 3.8 + i * 1.3));
          const radius = (2.2 + (i % 4) * 1.6) * twinkle;
          const isGold = i % 2 === 0;

          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fillStyle = isGold
            ? `rgba(253, 224, 71, ${0.82 * twinkle})`
            : `rgba(52, 211, 153, ${0.82 * twinkle})`;
          ctx.shadowColor = isGold ? '#FDE047' : '#34D399';
          ctx.shadowBlur = 14;
          ctx.fill();

          // 4-point magical star glint on every 4th particle
          if (i % 4 === 0) {
            ctx.strokeStyle = isGold
              ? `rgba(255, 250, 205, ${0.85 * twinkle})`
              : `rgba(167, 243, 208, ${0.85 * twinkle})`;
            ctx.lineWidth = 1.3;
            const arm = radius * 2.7;
            ctx.beginPath();
            ctx.moveTo(px - arm, py);
            ctx.lineTo(px + arm, py);
            ctx.moveTo(px, py - arm);
            ctx.lineTo(px, py + arm);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // If Full-Screen Cutaway, add a subtle bottom contrast gradient so captions pop clearly
      if (effectiveLayout === 'cutaway') {
        const brollScrim = ctx.createLinearGradient(
          0,
          logicalH * 0.42,
          0,
          logicalH
        );
        brollScrim.addColorStop(0, 'rgba(0, 0, 0, 0.05)');
        brollScrim.addColorStop(0.6, 'rgba(0, 0, 0, 0.42)');
        brollScrim.addColorStop(1, 'rgba(0, 0, 0, 0.78)');
        ctx.fillStyle = brollScrim;
        ctx.fillRect(0, logicalH * 0.42, logicalW, logicalH * 0.58);
      }

      ctx.restore(); // end clip

      // Glowing Magical Frame Border for PiP Card & Split Backdrop
      if (cornerRadius > 0) {
        ctx.save();
        drawRoundedRect(ctx, boxX, boxY, boxW, boxH, cornerRadius);
        const borderGrad = ctx.createLinearGradient(
          boxX,
          boxY,
          boxX + boxW,
          boxY + boxH
        );
        borderGrad.addColorStop(0, 'rgba(253, 224, 71, 0.88)');
        borderGrad.addColorStop(0.5, 'rgba(43, 174, 102, 0.88)');
        borderGrad.addColorStop(1, 'rgba(56, 189, 248, 0.75)');
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 2.6;
        ctx.shadowColor = 'rgba(253, 224, 71, 0.45)';
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }
  }

  let activePrimaryText = '';

  if (activeSegment) {

    const rawPrimaryTrackData =
      activeSegment.tracks[style.primaryTrack] ||
      activeSegment.tracks.tinglish ||
      activeSegment.tracks.english;

    const enforceRomanOnCanvas = isRomanTrack(style.primaryTrack);
    const shouldStripEmojis = style.removeEmojis !== false;
    const shouldStripPunct = Boolean(style.removePunctuation);
    const sanitizeCanvasString = (val: string) => {
      let out = enforceRomanOnCanvas ? transliterateIndicToRoman(val) : val;
      if (shouldStripEmojis) out = stripEmojisFromText(out);
      if (shouldStripPunct) out = stripPunctuationFromText(out);
      return out;
    };

    const primaryTrackData = rawPrimaryTrackData
      ? {
          text: sanitizeCanvasString(rawPrimaryTrackData.text),
          words: (rawPrimaryTrackData.words || [])
            .map((w) => ({
              ...w,
              word: sanitizeCanvasString(w.word),
            }))
            .filter((w) => w.word.trim().length > 0),
        }
      : undefined;

    const rawSecondaryTrackData =
      style.displayMode === 'dual-stacked'
        ? activeSegment.tracks[style.secondaryTrack]
        : undefined;
    const secondaryTrackData = rawSecondaryTrackData
      ? {
          ...rawSecondaryTrackData,
          text: shouldStripEmojis
            ? stripEmojisFromText(
                shouldStripPunct
                  ? stripPunctuationFromText(rawSecondaryTrackData.text)
                  : rawSecondaryTrackData.text
              )
            : shouldStripPunct
            ? stripPunctuationFromText(rawSecondaryTrackData.text)
            : rawSecondaryTrackData.text,
        }
      : undefined;

    if (primaryTrackData && primaryTrackData.words.length > 0) {
      activePrimaryText = primaryTrackData.text;
      // Merge per-line overrides (Section 5.1 & 5.2)
      const override = activeSegment.lineStyleOverride;
      const effectiveFontFamily = override?.fontFamily || style.fontFamily;
      const effectiveBgEnabled =
        override?.backgroundEnabled !== undefined
          ? override.backgroundEnabled
          : style.backgroundEnabled;
      const effectiveStyle: CaptionStyleConfig = {
        ...style,
        presetId: override?.templateId || style.presetId,
        kalakarTemplateId:
          override?.templateId || style.kalakarTemplateId || style.presetId,
        fontFamily: effectiveFontFamily,
        heroWordFontFamily:
          override?.fontFamily || style.heroWordFontFamily || effectiveFontFamily,
        accentScriptFontFamily:
          override?.fontFamily ||
          style.accentScriptFontFamily ||
          effectiveFontFamily,
        fontFace: override?.fontFace || style.fontFace,
        fontWeight:
          override?.fontFace === 'Regular'
            ? 400
            : override?.fontFace === 'Medium'
            ? 500
            : override?.fontFace === 'SemiBold' ||
              override?.fontFace === 'Semi Bold (600)'
            ? 600
            : override?.fontFace === 'Bold' || override?.fontFace === 'Bold (700)'
            ? 700
            : override?.fontFace === 'Black' || override?.fontFace === 'Black (900)'
            ? 900
            : style.fontWeight,
        fontSize: override?.fontSize || style.fontSize,
        line1FontSizePx:
          activeSegment.line1FontSizePx ??
          override?.line1FontSizePx ??
          style.line1FontSizePx,
        line2FontSizePx:
          activeSegment.line2FontSizePx ??
          override?.line2FontSizePx ??
          style.line2FontSizePx,
        line3FontSizePx:
          activeSegment.line3FontSizePx ??
          override?.line3FontSizePx ??
          style.line3FontSizePx,
        line1Bold:
          activeSegment.line1Bold ?? override?.line1Bold ?? style.line1Bold,
        line1Italic:
          activeSegment.line1Italic ?? override?.line1Italic ?? style.line1Italic,
        line1Shine:
          activeSegment.line1Shine ?? override?.line1Shine ?? style.line1Shine,
        line1Color:
          activeSegment.line1Color ?? override?.line1Color ?? style.line1Color,
        line2Bold:
          activeSegment.line2Bold ?? override?.line2Bold ?? style.line2Bold,
        line2Italic:
          activeSegment.line2Italic ?? override?.line2Italic ?? style.line2Italic,
        line2Shine:
          activeSegment.line2Shine ?? override?.line2Shine ?? style.line2Shine,
        line2Color:
          activeSegment.line2Color ?? override?.line2Color ?? style.line2Color,
        line3Bold:
          activeSegment.line3Bold ?? override?.line3Bold ?? style.line3Bold,
        line3Italic:
          activeSegment.line3Italic ?? override?.line3Italic ?? style.line3Italic,
        line3Shine:
          activeSegment.line3Shine ?? override?.line3Shine ?? style.line3Shine,
        line3Color:
          activeSegment.line3Color ?? override?.line3Color ?? style.line3Color,
        maxLines:
          activeSegment.maxLines ?? override?.maxLines ?? style.maxLines,
        primaryColor: override?.primaryColor || style.primaryColor,
        highlightColor: override?.secondaryColor || style.highlightColor,
        positionX: override?.positionX ?? style.positionX,
        positionY: override?.positionY ?? style.positionY,
        backgroundEnabled: effectiveBgEnabled,
        backgroundOpacity:
          override?.backgroundEnabled !== undefined
            ? override.backgroundEnabled
              ? Math.max(0.85, style.backgroundOpacity || 0.92)
              : 0
            : style.backgroundOpacity,
        arcEnabled:
          activeSegment.arcCurveDeg !== undefined
            ? activeSegment.arcCurveDeg !== 0
            : Boolean(style.arcEnabled && style.arcCurveDeg),
        arcCurveDeg:
          activeSegment.arcCurveDeg !== undefined
            ? activeSegment.arcCurveDeg
            : style.arcEnabled
            ? style.arcCurveDeg || 0
            : 0,
        horizontalSpacing: activeSegment.spreadWords
          ? Math.max(28, (style.horizontalSpacing || 12) * 2.4)
          : style.horizontalSpacing,
      };

      // When Depth Mask (Placed caption behind subject) is ON and module is enabled, automatically anchor the caption
      // in the Behind-Head Zone so the speaker's head/hair overlaps the lower portion of the giant hook text!
      const isBehindHeadActive =
        BEHIND_THE_HEAD_MODULE_ENABLED &&
        Boolean(effectiveStyle.captionDepthBehindSubject);
      let autoBehindHeadY = effectiveStyle.positionY;
      if (isBehindHeadActive) {
        if (hasUploadedVideo && videoElement && videoElement.readyState >= 2) {
          const tracked = updateVideoSubjectDepthMatte(videoElement, 0.68);
          if (autoBehindHeadY > 42) {
            autoBehindHeadY = tracked.recommendedCaptionYPercent;
          }
        } else if (autoBehindHeadY > 44) {
          autoBehindHeadY = 36;
        }
      }

      const depthAdjustedStyle: CaptionStyleConfig = isBehindHeadActive
        ? {
            ...effectiveStyle,
            positionY: autoBehindHeadY,
            bigWordScale: Math.max(1.85, (effectiveStyle.bigWordScale || 1.65) * 1.14),
          }
        : effectiveStyle;

      const customL1 =
        activeSegment.customLine1Text !== undefined
          ? sanitizeCanvasString(activeSegment.customLine1Text)
          : undefined;
      const customL2 =
        activeSegment.customLine2Text !== undefined
          ? sanitizeCanvasString(activeSegment.customLine2Text)
          : undefined;
      const customL3 =
        activeSegment.customLine3Text !== undefined
          ? sanitizeCanvasString(activeSegment.customLine3Text)
          : undefined;
      const segMaxLines =
        activeSegment.maxLines ?? override?.maxLines ?? style.maxLines;

      const isLalaMode =
        depthAdjustedStyle.hierarchyMode === 'lala-handwritten' ||
        depthAdjustedStyle.presetId === 'kalakar-lala';

      const isSidzMode =
        depthAdjustedStyle.hierarchyMode === 'sidz-vairagya' ||
        depthAdjustedStyle.hierarchyMode === 'sidz-20k-script' ||
        depthAdjustedStyle.hierarchyMode === 'sidz-valuing-wide' ||
        depthAdjustedStyle.hierarchyMode === 'sidz-truly-flame';

      if (isLalaMode && !depthAdjustedStyle.arcEnabled) {
        renderLalaHandwrittenCaption(
          ctx,
          logicalW,
          logicalH,
          currentTime,
          activeSegment.startTime,
          activeSegment.endTime,
          primaryTrackData.words,
          depthAdjustedStyle,
          isExportRender,
          customL1,
          customL2,
          customL3,
          segMaxLines
        );
      } else if (
        isSidzMode &&
        depthAdjustedStyle.animationType === 'premiere-pro' &&
        !depthAdjustedStyle.arcEnabled
      ) {
        renderSidzCompositeCaption(
          ctx,
          logicalW,
          logicalH,
          currentTime,
          activeSegment.startTime,
          activeSegment.endTime,
          primaryTrackData.words,
          depthAdjustedStyle,
          isExportRender,
          customL1,
          customL2,
          customL3,
          segMaxLines
        );
      } else {
        renderAnimatedPrimaryCaption(
          ctx,
          logicalW,
          logicalH,
          currentTime,
          activeSegment.startTime,
          activeSegment.endTime,
          primaryTrackData.words,
          depthAdjustedStyle,
          isExportRender,
          customL1,
          customL2,
          customL3,
          segMaxLines
        );
      }
    }

    if (
      style.displayMode === 'dual-stacked' &&
      secondaryTrackData &&
      secondaryTrackData.text &&
      style.secondaryTrack !== style.primaryTrack
    ) {
      renderSecondaryStackedCaption(
        ctx,
        logicalW,
        logicalH,
        secondaryTrackData.text,
        style
      );
    }
  }

  // 3.5 Layer 3: Real-Time Foreground Subject Cutout (Placed ON TOP of Behind-Head Captions when Depth Mask is ON!)
  if (
    BEHIND_THE_HEAD_MODULE_ENABLED &&
    style.captionDepthBehindSubject &&
    !transparentAlphaOnly &&
    isVideo1Visible
  ) {
    if (hasUploadedVideo && videoElement && videoElement.readyState >= 2) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      renderForegroundSubjectCutoutLayer({
        ctx,
        canvasWidth,
        canvasHeight,
        videoElement,
        hasUploadedVideo,
        sensitivity: 0.68,
        showMatteRimGuide: Boolean(style.showSafeZones && !isExportRender),
      });
      ctx.restore();
    } else {
      drawSampleReelForegroundSubject(ctx, logicalW, logicalH, currentTime);
    }
  }

  // 4. Optional Authentic Instagram Reels Frame Overlay (NEVER rendered during video export unless explicitly enabled)
  if (style.showInstagramFrame && !isExportRender) {
    drawInstagramReelsFrameOverlay(
      ctx,
      logicalW,
      logicalH,
      sampleReel,
      activePrimaryText,
      currentTime
    );
  }

  // 5. Combined Horizontal & Vertical Center-Centric Guidelines (Moves dynamically according to the caption text; Editor-Only, NEVER exported!)
  if (!isExportRender && !transparentAlphaOnly && (isDraggingCaption || style.showSafeZones)) {
    const activePosX = activeSegment?.lineStyleOverride?.positionX ?? style.positionX ?? 50;
    const activePosY = activeSegment?.lineStyleOverride?.positionY ?? style.positionY ?? 72;
    const activeLayerOffsetX =
      style.selectedCanvasLayer === 'small1'
        ? style.smallOffsetX ?? 0
        : style.selectedCanvasLayer === 'small2'
        ? style.smallLine2OffsetX ?? 0
        : style.bigOffsetX ?? 0;
    const activeLayerOffsetY =
      style.selectedCanvasLayer === 'small1'
        ? style.smallOffsetY ?? 0
        : style.selectedCanvasLayer === 'small2'
        ? style.smallLine2OffsetY ?? 0
        : style.bigOffsetY ?? 0;

    const captionCenterX = Math.max(
      24,
      Math.min(logicalW - 24, ((activePosX + activeLayerOffsetX) / 100) * logicalW)
    );
    const captionCenterY = Math.max(
      24,
      Math.min(logicalH - 24, ((activePosY + activeLayerOffsetY) / 100) * logicalH)
    );

    drawSafeZonesGuide(
      ctx,
      logicalW,
      logicalH,
      style,
      captionCenterX,
      captionCenterY,
      isDraggingCaption
    );
  }

  ctx.restore();
}

interface MeasuredWordToken {
  raw: WordTiming;
  display: string;
  width: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  isItalic: boolean;
  isShine: boolean;
  isBigHero: boolean;
  localIdx: number;
  assignedLineIndex?: number;
}

function renderAnimatedPrimaryCaption(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  currentTime: number,
  segStart: number,
  _segEnd: number,
  words: WordTiming[],
  style: CaptionStyleConfig,
  isExportRender = false,
  customLine1Text?: string,
  customLine2Text?: string,
  customLine3Text?: string,
  segmentMaxLines?: 1 | 2 | 3
) {
  ctx.save();

  const hasCustomLineTexts =
    customLine1Text !== undefined ||
    customLine2Text !== undefined ||
    customLine3Text !== undefined;
  const effectiveMaxLines: 1 | 2 | 3 | undefined =
    segmentMaxLines ??
    style.maxLines ??
    (customLine3Text && customLine3Text.trim().length > 0 ? 3 : undefined);

  let effectiveWords: (WordTiming & { _assignedLine?: number })[] = words.map((w) => ({
    ...w,
  }));

  if (hasCustomLineTexts) {
    const l1Tokens = (customLine1Text ?? '').trim().split(/\s+/).filter(Boolean);
    const l2Tokens = (customLine2Text ?? '').trim().split(/\s+/).filter(Boolean);
    const l3Tokens = (customLine3Text ?? '').trim().split(/\s+/).filter(Boolean);
    const allGroups =
      effectiveMaxLines === 1
        ? [[...l1Tokens, ...l2Tokens, ...l3Tokens]]
        : effectiveMaxLines === 3
        ? [l1Tokens, l2Tokens, l3Tokens]
        : [l1Tokens, [...l2Tokens, ...l3Tokens]];

    const flatEntries: { text: string; lineIdx: number; isHeroLine: boolean }[] = [];
    allGroups.forEach((grp, gIdx) => {
      grp.forEach((tok) => {
        flatEntries.push({
          text: tok,
          lineIdx: gIdx,
          isHeroLine: allGroups.length === 1 || gIdx === 1,
        });
      });
    });

    if (flatEntries.length > 0) {
      const segDur = Math.max(0.25, _segEnd - segStart);
      const step = segDur / flatEntries.length;
      effectiveWords = flatEntries.map((entry, idx) => {
        const existing =
          words[idx] ||
          words.find((w) => w.word.toLowerCase() === entry.text.toLowerCase());
        return {
          ...(existing || {}),
          word: entry.text,
          startTime: existing?.startTime ?? segStart + idx * step,
          endTime: existing?.endTime ?? segStart + (idx + 1) * step,
          isHero: existing?.isHero ?? entry.isHeroLine,
          _assignedLine: entry.lineIdx,
        };
      });
    }
  } else if (effectiveMaxLines === 1) {
    effectiveWords = words.map((w) => ({ ...w, _assignedLine: 0 }));
  } else if (effectiveMaxLines === 2 && words.length >= 2) {
    const splitPt = Math.max(1, Math.floor(words.length / 2));
    effectiveWords = words.map((w, idx) => ({
      ...w,
      _assignedLine: idx < splitPt ? 0 : 1,
    }));
  } else if (effectiveMaxLines === 3 && words.length >= 3) {
    const c1 = Math.max(1, Math.round(words.length / 3));
    const c2 = Math.max(c1 + 1, Math.round((words.length * 2) / 3));
    effectiveWords = words.map((w, idx) => ({
      ...w,
      _assignedLine: idx < c1 ? 0 : idx < c2 ? 1 : 2,
    }));
  }

  let activeWordIdx = effectiveWords.findIndex(
    (w) => currentTime >= w.startTime && currentTime <= w.endTime
  );
  if (activeWordIdx === -1) {
    if (effectiveWords.length === 0 || currentTime < effectiveWords[0].startTime) {
      activeWordIdx = 0;
    } else {
      activeWordIdx = effectiveWords.length - 1;
    }
  }

  const configuredWordsPerLine =
    hasCustomLineTexts || effectiveMaxLines !== undefined
      ? Math.max(1, effectiveWords.length)
      : style.wordsPerLine && style.wordsPerLine > 0
      ? style.wordsPerLine
      : Math.max(1, effectiveWords.length);

  const chunkSize =
    style.animationType === 'stomp' && !hasCustomLineTexts && effectiveMaxLines === undefined
      ? Math.min(2, configuredWordsPerLine)
      : Math.max(1, configuredWordsPerLine);

  const pageIndex = Math.floor(activeWordIdx / chunkSize);
  const pageWords = effectiveWords.slice(pageIndex * chunkSize, (pageIndex + 1) * chunkSize);
  const localActiveIdx = activeWordIdx - pageIndex * chunkSize;

  const hasExplicitHeroInPage = pageWords.some((w) => w.isHero);
  let fallbackHeroLocalIdx = localActiveIdx;
  if (!hasExplicitHeroInPage && pageWords.length > 0) {
    let maxLen = -1;
    pageWords.forEach((w, idx) => {
      if (w.word.length > maxLen) {
        maxLen = w.word.length;
        fallbackHeroLocalIdx = idx;
      }
    });
  }

  const maxLineWidth = canvasWidth * (canvasWidth > canvasHeight ? 0.82 : 0.88);
  const aspectFontScale =
    canvasHeight <= 760 ? (canvasWidth > canvasHeight ? 0.84 : 0.88) : 1.0;

  const tokens: MeasuredWordToken[] = pageWords.map((w, idx) => {
    const isSpoken = idx === localActiveIdx;
    const isHeroWord = hasExplicitHeroInPage ? Boolean(w.isHero) : idx === fallbackHeroLocalIdx;
    const isMixedScale = style.hierarchyMode !== 'uniform';
    const assignedLine = w._assignedLine;

    const useBigScale =
      isMixedScale && (isHeroWord || (style.animationType === 'premiere-pro' && isSpoken));
    const scaleFactor = isMixedScale
      ? useBigScale
        ? Math.min(2.25, style.bigWordScale || 1.45)
        : Math.max(0.68, style.smallWordScale || 0.75)
      : 1.0;

    const lineExplicitPx =
      assignedLine === 0
        ? style.line1FontSizePx
        : assignedLine === 1
        ? style.line2FontSizePx
        : assignedLine === 2
        ? style.line3FontSizePx
        : useBigScale
        ? style.line2FontSizePx
        : style.line1FontSizePx;

    const wordScaleMult = Math.max(0.45, Math.min(2.5, w.scaleMultiplier ?? 1));
    let computedFontSize = Math.round(
      (lineExplicitPx
        ? lineExplicitPx * aspectFontScale
        : style.fontSize * aspectFontScale * scaleFactor) * wordScaleMult
    );

    const lineBoldFlag =
      assignedLine === 0
        ? style.line1Bold
        : assignedLine === 1
        ? style.line2Bold
        : assignedLine === 2
        ? style.line3Bold
        : undefined;
    const lineItalicFlag =
      assignedLine === 0
        ? style.line1Italic
        : assignedLine === 1
        ? style.line2Italic
        : assignedLine === 2
        ? style.line3Italic
        : undefined;
    const lineShineFlag =
      assignedLine === 0
        ? style.line1Shine
        : assignedLine === 1
        ? style.line2Shine
        : assignedLine === 2
        ? style.line3Shine
        : undefined;

    const isBold =
      w.isBold !== undefined
        ? w.isBold
        : lineBoldFlag !== undefined
        ? lineBoldFlag
        : undefined;
    const tokenWeight =
      isBold === true
        ? Math.max(800, style.fontWeight || 700)
        : isBold === false
        ? 400
        : style.fontWeight || 700;
    const isItalic =
      w.isItalic !== undefined
        ? w.isItalic
        : lineItalicFlag !== undefined
        ? lineItalicFlag
        : Boolean(style.italicText);
    const isShine = Boolean(w.isShine || lineShineFlag);

    const chosenFamily =
      w.customFontFamily ||
      (useBigScale && style.heroWordFontFamily ? style.heroWordFontFamily : style.fontFamily);
    const effectiveTransform =
      useBigScale && style.emphasisTransform && style.emphasisTransform !== 'none'
        ? style.emphasisTransform
        : style.textTransform;
    const display = transformWord(w.word, effectiveTransform);

    const italicPrefix = isItalic ? 'italic ' : '';
    ctx.font = `${italicPrefix}${tokenWeight} ${computedFontSize}px ${getWordFontStack(chosenFamily)}`;
    applyCanvasLetterSpacing(ctx, style.letterSpacing ?? 0);
    let width = ctx.measureText(display).width;

    // Auto-fit single long words so they never overflow the horizontal safe zone
    if (width > maxLineWidth) {
      const fitRatio = Math.max(0.45, maxLineWidth / width);
      computedFontSize = Math.max(18, Math.round(computedFontSize * fitRatio));
      ctx.font = `${italicPrefix}${tokenWeight} ${computedFontSize}px ${getWordFontStack(chosenFamily)}`;
      applyCanvasLetterSpacing(ctx, style.letterSpacing ?? 0);
      width = ctx.measureText(display).width;
    }

    return {
      raw: w,
      display,
      width,
      fontSize: computedFontSize,
      fontFamily: chosenFamily,
      fontWeight: tokenWeight,
      isItalic,
      isShine,
      isBigHero: useBigScale,
      localIdx: idx,
      assignedLineIndex: assignedLine,
    };
  });

  const baseWordGap = Math.max(4, Number(style.horizontalSpacing ?? style.fontSize * 0.25));
  const lines: MeasuredWordToken[][] = [];

  if (tokens.some((t) => t.assignedLineIndex !== undefined)) {
    const grouped: MeasuredWordToken[][] = [[], [], []];
    tokens.forEach((t) => {
      const idx = Math.max(0, Math.min(2, t.assignedLineIndex ?? 0));
      grouped[idx].push(t);
    });
    grouped.forEach((grp) => {
      if (grp.length > 0) lines.push(grp);
    });
  } else if (style.hierarchyMode === 'stacked-hero-callout' && tokens.length > 1) {
    let currentLine: MeasuredWordToken[] = [];
    let currentWidth = 0;

    for (const token of tokens) {
      if (token.isBigHero) {
        if (currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = [];
          currentWidth = 0;
        }
        lines.push([token]);
      } else {
        const projected =
          currentLine.length === 0 ? token.width : currentWidth + baseWordGap + token.width;
        if (projected > maxLineWidth && currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = [token];
          currentWidth = token.width;
        } else {
          currentLine.push(token);
          currentWidth = projected;
        }
      }
    }
    if (currentLine.length > 0) lines.push(currentLine);
  } else {
    let currentLine: MeasuredWordToken[] = [];
    let currentWidth = 0;

    for (const token of tokens) {
      const projected =
        currentLine.length === 0 ? token.width : currentWidth + baseWordGap + token.width;
      if (projected > maxLineWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [token];
        currentWidth = token.width;
      } else {
        currentLine.push(token);
        currentWidth = projected;
      }
    }
    if (currentLine.length > 0) lines.push(currentLine);
  }

  // If smallTwoLineMode === 'two-line-split', split any multi-word small line into 2 lines
  if (
    style.smallTwoLineMode === 'two-line-split' &&
    !hasCustomLineTexts &&
    effectiveMaxLines === undefined
  ) {
    const expandedLines: MeasuredWordToken[][] = [];
    for (const line of lines) {
      const isAllSmall = line.every((t) => !t.isBigHero);
      if (isAllSmall && line.length >= 2) {
        const mid = Math.ceil(line.length / 2);
        expandedLines.push(line.slice(0, mid));
        expandedLines.push(line.slice(mid));
      } else {
        expandedLines.push(line);
      }
    }
    lines.length = 0;
    lines.push(...expandedLines);
  }

  // Auto-shrink any line that exceeds maxLineWidth so explicit 1/2/3 line splits always fit cleanly
  lines.forEach((line) => {
    const rawLineW =
      line.reduce((acc, t) => acc + t.width, 0) +
      Math.max(0, line.length - 1) * baseWordGap;
    if (rawLineW > maxLineWidth && line.length > 0) {
      const shrink = Math.max(0.45, maxLineWidth / rawLineW);
      line.forEach((t) => {
        t.fontSize = Math.max(16, Math.round(t.fontSize * shrink));
        const italicPrefix = t.isItalic ? 'italic ' : '';
        ctx.font = `${italicPrefix}${t.fontWeight} ${t.fontSize}px ${getWordFontStack(t.fontFamily)}`;
        applyCanvasLetterSpacing(ctx, style.letterSpacing ?? 0);
        t.width = ctx.measureText(t.display).width;
      });
    }
  });

  const isArcActive = Boolean(
    style.arcEnabled && style.arcCurveDeg && Math.abs(style.arcCurveDeg) > 0
  );
  const arcDeg = isArcActive
    ? Math.max(-360, Math.min(360, Number(style.arcCurveDeg || 0)))
    : 0;

  if (isArcActive && Math.abs(arcDeg) >= 75 && tokens.length > 0) {
    const unifiedFontSize = Math.round(
      style.fontSize * aspectFontScale * (Math.abs(arcDeg) >= 180 ? 0.92 : 1.0)
    );
    const harmonizedTokens = tokens.map((t) => {
      const targetSize = Math.round(
        (t.isBigHero ? unifiedFontSize * 1.12 : unifiedFontSize) *
          Math.max(0.5, Math.min(2.2, t.raw.scaleMultiplier ?? 1))
      );
      const italicPrefix = t.isItalic ? 'italic ' : '';
      ctx.font = `${italicPrefix}${t.fontWeight} ${targetSize}px ${getWordFontStack(t.fontFamily)}`;
      applyCanvasLetterSpacing(ctx, style.letterSpacing ?? 0);
      const w = ctx.measureText(t.display).width;
      return {
        ...t,
        fontSize: targetSize,
        width: w,
      };
    });
    lines.length = 0;
    lines.push(harmonizedTokens);
  }

  const trans = computeTransitionTransform(currentTime, segStart, _segEnd, style);
  const lineSpaceMult = Number(style.lineSpacing ?? 1.24);
  const vertGap = Number(style.verticalSpacing ?? 0);
  const lineHeights = lines.map((line) => {
    const maxFontInLine = Math.max(...line.map((t) => t.fontSize), style.fontSize);
    return maxFontInLine * lineSpaceMult + vertGap * 0.35;
  });
  const totalBlockHeight = lineHeights.reduce((acc, h) => acc + h, 0);
  const baseCenterX = ((style.positionX ?? 50) / 100) * canvasWidth + trans.dx;
  const baseCenterY = ((style.positionY ?? 66) / 100) * canvasHeight + trans.dy;

  const lineWidths = lines.map(
    (line) =>
      line.reduce((acc, t) => acc + t.width, 0) +
      Math.max(0, line.length - 1) * baseWordGap
  );
  const maxRenderedLineWidth = Math.max(...lineWidths, 40);

  drawCaptionDynamicFrame(
    ctx,
    baseCenterX,
    baseCenterY,
    maxRenderedLineWidth,
    totalBlockHeight,
    style
  );

  if (
    style.backgroundEnabled !== false &&
    style.backgroundOpacity > 0.02 &&
    !isArcActive
  ) {
    const padX = style.backgroundPaddingPx ?? 26;
    const padY = Math.round((style.backgroundPaddingPx ?? 26) * 0.7);
    const boxX = baseCenterX - maxRenderedLineWidth / 2 - padX;
    const boxY = baseCenterY - totalBlockHeight / 2 - padY;
    const boxW = maxRenderedLineWidth + padX * 2;
    const boxH = totalBlockHeight + padY * 2;

    ctx.fillStyle = hexToRgba(style.backgroundColor, style.backgroundOpacity * trans.alpha);
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, style.backgroundRadiusPx ?? 18);
    ctx.fill();
  }

  const segElapsed = Math.max(0, currentTime - segStart);
  const segFadeAlpha =
    style.animationType === 'cinema-fade'
      ? Math.min(1, segElapsed / (0.28 / style.animationSpeed))
      : 1;

  let runningY = baseCenterY - totalBlockHeight / 2;
  let smallLineCounter = 0;

  lines.forEach((line, lineIndex) => {
    const lineH = lineHeights[lineIndex];
    const baseLineY = runningY + lineH / 2;
    runningY += lineH;

    const lineW = lineWidths[lineIndex];
    const isBigLine = line.some((t) => t.isBigHero);
    const layerKey: 'small1' | 'small2' | 'big' = isBigLine
      ? 'big'
      : smallLineCounter++ === 0
      ? 'small1'
      : 'small2';

    const lineCustomColor =
      lineIndex === 0
        ? style.line1Color
        : lineIndex === 1
        ? style.line2Color
        : lineIndex === 2
        ? style.line3Color
        : undefined;
    const lineShineOverride =
      lineIndex === 0
        ? style.line1Shine
        : lineIndex === 1
        ? style.line2Shine
        : lineIndex === 2
        ? style.line3Shine
        : false;
    const lineBoldOverride =
      lineIndex === 0
        ? style.line1Bold
        : lineIndex === 1
        ? style.line2Bold
        : lineIndex === 2
        ? style.line3Bold
        : undefined;
    const lineItalicOverride =
      lineIndex === 0
        ? style.line1Italic
        : lineIndex === 1
        ? style.line2Italic
        : lineIndex === 2
        ? style.line3Italic
        : undefined;

    const layerAlign =
      layerKey === 'big'
        ? style.bigTextAlign || 'center'
        : layerKey === 'small1'
        ? style.smallTextAlign || 'center'
        : style.smallLine2TextAlign || 'center';

    const layerOffsetX =
      ((layerKey === 'big'
        ? style.bigOffsetX ?? 0
        : layerKey === 'small1'
        ? style.smallOffsetX ?? 0
        : style.smallLine2OffsetX ?? 0) /
        100) *
      canvasWidth;

    const layerOffsetY =
      ((layerKey === 'big'
        ? style.bigOffsetY ?? 0
        : layerKey === 'small1'
        ? style.smallOffsetY ?? 0
        : style.smallLine2OffsetY ?? 0) /
        100) *
      canvasHeight;

    const alignedStartX =
      layerAlign === 'left'
        ? baseCenterX - maxRenderedLineWidth / 2 + layerOffsetX
        : layerAlign === 'right'
        ? baseCenterX + maxRenderedLineWidth / 2 - lineW + layerOffsetX
        : baseCenterX - lineW / 2 + layerOffsetX;

    let cursorX = Math.max(
      -lineW * 0.4,
      Math.min(canvasWidth - lineW * 0.6, alignedStartX)
    );
    const lineStartX = cursorX;
    const lineY = Math.max(16, Math.min(canvasHeight - 16, baseLineY + layerOffsetY));

    const absDeg = Math.min(360, Math.max(1, Math.abs(arcDeg)));
    const thetaTotal = (absDeg * Math.PI) / 180;
    const halfTheta = thetaTotal / 2;
    const maxFontInLine = Math.max(...line.map((t) => t.fontSize), style.fontSize);
    const closingGap =
      absDeg > 260 ? baseWordGap * 1.8 * ((absDeg - 260) / 100) : 0;
    const totalArcSpanPx = Math.max(60, lineW + closingGap);
    const naturalR = totalArcSpanPx / Math.max(0.05, thetaTotal);
    const minCanvasDim = Math.min(canvasWidth, canvasHeight);
    const maxR =
      absDeg >= 165
        ? minCanvasDim * 0.34
        : Math.max(
            minCanvasDim * 0.34,
            (canvasWidth * 0.42) /
              Math.max(0.12, Math.sin(Math.min(Math.PI / 2, halfTheta)))
          );
    const minR =
      absDeg >= 240
        ? Math.max(92, maxFontInLine * 1.55)
        : Math.max(74, maxFontInLine * 1.2);
    const circleR = Math.max(minR, Math.min(maxR, naturalR));
    const arcFontFitScale = isArcActive
      ? Math.min(1, Math.max(0.45, (circleR * thetaTotal) / totalArcSpanPx))
      : 1;
    const arcSagitta = circleR * (1 - Math.cos(Math.min(Math.PI, halfTheta)));
    const arcCenterX = Math.max(
      circleR * 0.65,
      Math.min(canvasWidth - circleR * 0.65, baseCenterX + layerOffsetX)
    );
    const arcMidY = Math.max(
      circleR * 0.65,
      Math.min(canvasHeight - circleR * 0.65, lineY)
    );
    const circleCenterY =
      arcDeg >= 0
        ? arcMidY - arcSagitta / 2 + circleR
        : arcMidY + arcSagitta / 2 - circleR;

    if (
      isArcActive &&
      style.backgroundEnabled !== false &&
      style.backgroundOpacity > 0.02
    ) {
      ctx.save();
      const padY = Math.round((style.backgroundPaddingPx ?? 22) * 0.65);
      ctx.beginPath();
      if (absDeg >= 350) {
        ctx.arc(arcCenterX, circleCenterY, circleR, 0, Math.PI * 2);
      } else if (arcDeg > 0) {
        ctx.arc(
          arcCenterX,
          circleCenterY,
          circleR,
          -Math.PI / 2 - halfTheta,
          -Math.PI / 2 + halfTheta
        );
      } else {
        ctx.arc(
          arcCenterX,
          circleCenterY,
          circleR,
          Math.PI / 2 - halfTheta,
          Math.PI / 2 + halfTheta
        );
      }
      ctx.strokeStyle = hexToRgba(
        style.backgroundColor,
        style.backgroundOpacity * trans.alpha
      );
      ctx.lineWidth = maxFontInLine * arcFontFitScale + padY * 1.6;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    line.forEach((token) => {
      const isSpoken = token.localIdx === localActiveIdx;
      const isPast = token.localIdx < localActiveIdx;
      const wordDuration = Math.max(0.12, token.raw.endTime - token.raw.startTime);
      const wordProgress = Math.max(
        0,
        Math.min(1, (currentTime - token.raw.startTime) / wordDuration)
      );

      if (style.animationType === 'typewriter' && !isPast && !isSpoken) {
        cursorX += token.width + baseWordGap;
        return;
      }

      const effectiveIsItalic =
        token.raw.isItalic !== undefined
          ? token.raw.isItalic
          : lineItalicOverride !== undefined
          ? lineItalicOverride
          : token.isItalic;
      const effectiveIsBold =
        token.raw.isBold !== undefined
          ? token.raw.isBold
          : lineBoldOverride !== undefined
          ? lineBoldOverride
          : undefined;
      const effectiveWeight =
        effectiveIsBold === true
          ? Math.max(800, token.fontWeight)
          : effectiveIsBold === false
          ? 400
          : token.fontWeight;
      const effectiveIsShine = Boolean(token.isShine || lineShineOverride);
      const italicPrefix = effectiveIsItalic ? 'italic ' : '';

      const applyTransToWord =
        style.transitionScope !== 'emphasized' || token.isBigHero || isSpoken;
      const wordCenterX = cursorX + token.width / 2;
      let wordCenterY = lineY;
      let scale = 1;
      let rotationRad = applyTransToWord ? trans.rotationRad : 0;
      let radialPopOffset = 0;
      let alpha = segFadeAlpha * (applyTransToWord ? trans.alpha : 1);

      if (style.animationType === 'premiere-pro') {
        if (isSpoken) {
          const popSpring = Math.sin(
            Math.min(1, wordProgress * 1.45 * style.animationSpeed) * Math.PI
          );
          scale = 1.06 + 0.14 * popSpring;
          wordCenterY -= 6 * popSpring;
          radialPopOffset = 6 * popSpring;
          if (token.isBigHero) {
            rotationRad += -0.025 * Math.sin(wordProgress * Math.PI);
          }
        } else if (!isPast && !token.isBigHero) {
          alpha *= 0.85;
        }
      } else if (style.animationType === 'karaoke' && isSpoken) {
        scale = 1 + 0.1 * Math.sin(wordProgress * Math.PI);
      } else if (style.animationType === 'pop') {
        if (isSpoken) {
          const spring = Math.sin(
            Math.min(1, wordProgress * 1.6 * style.animationSpeed) * Math.PI
          );
          scale = 1 + 0.18 * spring;
          wordCenterY -= 8 * spring;
          radialPopOffset = 8 * spring;
        } else if (!isPast) {
          alpha *= 0.75;
        }
      } else if (style.animationType === 'stomp') {
        if (isSpoken) {
          const slam = Math.max(0, 1 - wordProgress * 2.5 * style.animationSpeed);
          scale = 1.14 + slam * 0.25;
        }
      } else if (style.animationType === 'wave') {
        const waveOffset =
          Math.sin(currentTime * 8 * style.animationSpeed + token.localIdx * 0.9) * 7;
        wordCenterY += isSpoken ? waveOffset * 1.4 : waveOffset * 0.5;
        radialPopOffset = isSpoken ? -waveOffset * 1.2 : -waveOffset * 0.4;
        if (isSpoken) scale = 1.08;
      } else if (style.animationType === 'cinema-fade') {
        wordCenterY += (1 - segFadeAlpha) * 14;
      }

      let renderedText = token.display;
      if (style.animationType === 'typewriter' && isSpoken) {
        const charCount = Math.max(1, Math.ceil(token.display.length * wordProgress));
        renderedText = token.display.slice(0, charCount);
      }

      const shouldColorWithGradient =
        Boolean(token.raw.customColor || lineCustomColor || effectiveIsShine) ||
        isSpoken ||
        (token.isBigHero && !style.removeEmphasis) ||
        (isPast && style.animationType === 'karaoke');

      // Polar Circular Arc Rendering (-360° to +360°: 180° arch, -180° reversed valley, 360° full ring, etc.)
      if (isArcActive) {
        const chars = Array.from(renderedText);
        const tokenLinearStart = cursorX - lineStartX;
        const effectiveTokenFontSize = Math.max(
          14,
          Math.round(token.fontSize * arcFontFitScale)
        );

        ctx.save();
        ctx.font = `${italicPrefix}${effectiveWeight} ${token.fontSize}px ${getWordFontStack(token.fontFamily)}`;
        applyCanvasLetterSpacing(ctx, style.letterSpacing ?? 0);
        const rawCharWidths = chars.map((ch) => Math.max(4, ctx.measureText(ch).width));
        const rawCharSum = rawCharWidths.reduce((a, b) => a + b, 0) || 1;
        const normFactor = token.width / rawCharSum;
        ctx.restore();

        let charLinearOffset = tokenLinearStart;

        chars.forEach((ch, chIdx) => {
          const chW = rawCharWidths[chIdx] * normFactor;
          const charLinearCenter = charLinearOffset + chW / 2;
          charLinearOffset += chW;

          const u = charLinearCenter / totalArcSpanPx - 0.5;
          const alphaAngle = u * thetaTotal;
          const effectiveR = circleR + (arcDeg >= 0 ? radialPopOffset : -radialPopOffset);

          const chX = arcCenterX + effectiveR * Math.sin(alphaAngle);
          const chY =
            arcDeg >= 0
              ? circleCenterY - effectiveR * Math.cos(alphaAngle)
              : circleCenterY + effectiveR * Math.cos(alphaAngle);
          const chRot =
            (arcDeg >= 0 ? alphaAngle : -alphaAngle) + rotationRad;

          ctx.save();
          ctx.translate(chX, chY);
          ctx.rotate(chRot);
          ctx.scale(
            scale * (applyTransToWord ? trans.scaleX : 1),
            scale * (applyTransToWord ? trans.scaleY : 1)
          );
          ctx.globalAlpha = alpha;

          ctx.font = `${italicPrefix}${effectiveWeight} ${effectiveTokenFontSize}px ${getWordFontStack(token.fontFamily)}`;
          applyCanvasLetterSpacing(ctx, 0);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (style.depth3DEnabled) {
            const depthPx = Math.max(2, Math.min(20, style.depth3DDepth ?? 8));
            const angleRad3d = ((style.depth3DAngle ?? 135) * Math.PI) / 180;
            const dx = Math.cos(angleRad3d);
            const dy = Math.sin(angleRad3d);
            ctx.save();
            ctx.fillStyle = style.depth3DColor || '#FF5722';
            for (let d = depthPx; d >= 1; d -= 1.5) {
              ctx.fillText(ch, dx * d, dy * d);
            }
            ctx.restore();
          }

          if (
            effectiveIsShine ||
            style.glowEnabled ||
            (style.animationType === 'neon-glow' && isSpoken) ||
            (style.animationType === 'premiere-pro' && (isSpoken || token.isBigHero))
          ) {
            ctx.shadowColor = effectiveIsShine
              ? 'rgba(253, 224, 71, 0.92)'
              : style.glowColor ||
                style.emphasisGlowColor ||
                (style.useGradient ? style.gradientMid : style.highlightColor);
            ctx.shadowBlur = effectiveIsShine
              ? 22
              : Math.max(16, style.glowSpread || style.shadowBlur * 1.25);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;
          } else if ((style.dropShadowEnabled ?? true) && style.shadowBlur > 0) {
            ctx.shadowColor = style.dropShadowColor || 'rgba(0, 0, 0, 0.88)';
            ctx.shadowBlur = style.shadowBlur;
            ctx.shadowOffsetX = style.dropShadowX ?? 0;
            ctx.shadowOffsetY = style.dropShadowY ?? 4;
          }

          if (style.strokeWidth > 0) {
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.lineWidth = token.isBigHero
              ? Math.round(style.strokeWidth * 1.1)
              : Math.max(2, Math.round(style.strokeWidth * 0.8));
            ctx.strokeStyle = style.strokeColor;
            ctx.strokeText(ch, 0, 0);
          }

          const charActiveColor = effectiveIsShine
            ? createWordShineGradient(
                ctx,
                chW * 2,
                effectiveTokenFontSize,
                currentTime,
                token.raw.customColor || lineCustomColor || style.highlightColor
              )
            : token.raw.customColor || lineCustomColor
            ? (token.raw.customColor || lineCustomColor)!
            : createSidzVerticalGradient(
                ctx,
                effectiveTokenFontSize,
                currentTime,
                style,
                chW * 2
              );

          ctx.fillStyle = shouldColorWithGradient
            ? charActiveColor
            : createBaseTextFill(
                ctx,
                effectiveTokenFontSize,
                currentTime,
                style,
                chW * 2
              );
          ctx.fillText(ch, 0, 0);
          ctx.restore();
        });

        cursorX += token.width + baseWordGap;
        return;
      }

      ctx.save();
      ctx.translate(wordCenterX, wordCenterY);
      if (rotationRad !== 0) ctx.rotate(rotationRad);
      ctx.scale(
        scale * (applyTransToWord ? trans.scaleX : 1),
        scale * (applyTransToWord ? trans.scaleY : 1)
      );
      ctx.globalAlpha = alpha;

      ctx.font = `${italicPrefix}${effectiveWeight} ${token.fontSize}px ${getWordFontStack(token.fontFamily)}`;
      applyCanvasLetterSpacing(ctx, style.letterSpacing ?? 0);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Section 7.7: 3D Depth Extrusion
      if (style.depth3DEnabled) {
        const depthPx = Math.max(2, Math.min(20, style.depth3DDepth ?? 8));
        const angleRad = ((style.depth3DAngle ?? 135) * Math.PI) / 180;
        const dx = Math.cos(angleRad);
        const dy = Math.sin(angleRad);
        ctx.save();
        ctx.fillStyle = style.depth3DColor || '#FF5722';
        for (let d = depthPx; d >= 1; d -= 1.5) {
          ctx.fillText(token.display, dx * d, dy * d);
        }
        ctx.restore();
      }

      if (style.animationType === 'box-slide' && isSpoken) {
        const pillPadX = 14;
        const pillPadY = 7;
        ctx.fillStyle = createAnimatedWordGradient(
          ctx,
          token.width + pillPadX * 2,
          token.fontSize,
          currentTime,
          style
        );
        drawRoundedRect(
          ctx,
          -token.width / 2 - pillPadX,
          -token.fontSize / 2 - pillPadY,
          token.width + pillPadX * 2,
          token.fontSize + pillPadY * 2,
          12
        );
        ctx.fill();
      }

      if (
        effectiveIsShine ||
        style.glowEnabled ||
        (style.animationType === 'neon-glow' && isSpoken) ||
        (style.animationType === 'premiere-pro' && (isSpoken || token.isBigHero))
      ) {
        ctx.shadowColor = effectiveIsShine
          ? 'rgba(253, 224, 71, 0.92)'
          : style.glowColor ||
            style.emphasisGlowColor ||
            (style.useGradient ? style.gradientMid : style.highlightColor);
        ctx.shadowBlur = effectiveIsShine
          ? Math.max(22, token.fontSize * 0.42)
          : Math.max(18, style.glowSpread || style.shadowBlur * 1.35);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;
      } else if ((style.dropShadowEnabled ?? true) && style.shadowBlur > 0) {
        ctx.shadowColor = style.dropShadowColor || 'rgba(0, 0, 0, 0.88)';
        ctx.shadowBlur = style.shadowBlur;
        ctx.shadowOffsetX = style.dropShadowX ?? 0;
        ctx.shadowOffsetY = style.dropShadowY ?? 4;
      }

      if (style.strokeWidth > 0 && style.animationType !== 'box-slide') {
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.lineWidth = token.isBigHero
          ? Math.round(style.strokeWidth * 1.15)
          : Math.max(2, Math.round(style.strokeWidth * 0.8));
        ctx.strokeStyle = style.strokeColor;
        ctx.strokeText(renderedText, 0, 0);
      }

      const activeGradientOrColor = effectiveIsShine
        ? createWordShineGradient(
            ctx,
            token.width,
            token.fontSize,
            currentTime,
            token.raw.customColor || lineCustomColor || style.highlightColor
          )
        : token.raw.customColor || lineCustomColor
        ? (token.raw.customColor || lineCustomColor)!
        : createSidzVerticalGradient(
            ctx,
            token.fontSize,
            currentTime,
            style,
            token.width
          );

      if (style.animationType === 'box-slide' && isSpoken) {
        ctx.fillStyle = '#090A0F';
        ctx.fillText(renderedText, 0, 0);
      } else if (style.animationType === 'karaoke' && isSpoken) {
        ctx.fillStyle = lineCustomColor || style.primaryColor;
        ctx.fillText(renderedText, 0, 0);

        ctx.save();
        ctx.beginPath();
        ctx.rect(
          -token.width / 2,
          -token.fontSize,
          token.width * Math.min(1, wordProgress * 1.15),
          token.fontSize * 2
        );
        ctx.clip();
        ctx.fillStyle = activeGradientOrColor;
        ctx.fillText(renderedText, 0, 0);
        ctx.restore();
      } else {
        ctx.fillStyle = shouldColorWithGradient
          ? activeGradientOrColor
          : lineCustomColor || createBaseTextFill(ctx, token.fontSize, currentTime, style, token.width);
        ctx.fillText(renderedText, 0, 0);
      }

      if (effectiveIsShine) {
        drawWordShineSparkles(ctx, 0, 0, token.width, token.fontSize, currentTime);
      }

      if (
        style.underlineText ||
        token.raw.isUnderlined ||
        (token.isBigHero && style.emphasisUnderline)
      ) {
        ctx.beginPath();
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = Math.max(2, token.fontSize * 0.07);
        ctx.moveTo(-token.width / 2, token.fontSize * 0.46);
        ctx.lineTo(token.width / 2, token.fontSize * 0.46);
        ctx.stroke();
      }

      ctx.restore();
      cursorX += token.width + baseWordGap;
    });

    const hitLine: import('../types/caption').LayerHitBox = {
      layer: layerKey,
      x: lineStartX,
      y: lineY - lineH * 0.42,
      width: Math.max(48, lineW),
      height: lineH * 0.84,
      handleX: lineStartX + Math.max(48, lineW),
      handleY: lineY + lineH * 0.42,
    };
    latestRenderedLayerHitBoxes.push(hitLine);

    if (!isExportRender && style.showOnScreenTransformBoxes) {
      drawInteractiveLayerBoundingBox(
        ctx,
        hitLine,
        style.selectedCanvasLayer === layerKey,
        layerKey === 'big'
          ? `BIG TEXT · ${Math.round((style.bigWordScale || 2.15) * 100)}%`
          : layerKey === 'small1'
          ? `SMALL 1 · ${Math.round((style.smallWordScale || 0.68) * 100)}%`
          : `SMALL 2 · ${Math.round((style.smallLine2Scale ?? style.smallWordScale ?? 0.68) * 100)}%`
      );
    }
  });

  ctx.restore();
}

function renderSecondaryStackedCaption(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  secondaryText: string,
  style: CaptionStyleConfig
) {
  ctx.save();
  const secFontStack = `"${style.secondaryFontFamily}", "Noto Sans Telugu", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Bengali", "Plus Jakarta Sans", sans-serif`;
  const secFontSize = style.secondaryFontSize;
  ctx.font = `700 ${secFontSize}px ${secFontStack}`;
  applyCanvasLetterSpacing(ctx, (style.letterSpacing ?? 0) * 0.5);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const baseCenterX = ((style.positionX ?? 50) / 100) * canvasWidth;
  const baseCenterY = ((style.positionY ?? 66) / 100) * canvasHeight;
  const secY = Math.min(
    canvasHeight - 46,
    baseCenterY + style.fontSize * 2.15 + Number(style.verticalSpacing ?? 0)
  );

  const metrics = ctx.measureText(secondaryText);
  const textW = Math.min(canvasWidth * 0.88, metrics.width);

  const padX = 16;
  const padY = 8;
  ctx.fillStyle = 'rgba(9, 10, 15, 0.82)';
  drawRoundedRect(
    ctx,
    baseCenterX - textW / 2 - padX,
    secY - secFontSize / 2 - padY,
    textW + padX * 2,
    secFontSize + padY * 2,
    10
  );
  ctx.fill();

  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000000';
  ctx.strokeText(secondaryText, baseCenterX, secY, canvasWidth * 0.88);

  ctx.fillStyle = style.secondaryColor;
  ctx.fillText(secondaryText, baseCenterX, secY, canvasWidth * 0.88);

  ctx.restore();
}

/**
 * CapCut / Premiere Pro / Photoshop Mask Studio Renderer:
 * Supports Linear Top-to-Bottom (with angle), Bottom Cinema Vignette, Top-Bottom Split,
 * Rectangle Mask (with angle & feather), and Circle/Radial Ellipse Mask (with feather & invert).
 */
function drawCapCutPremiereMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: CaptionStyleConfig
) {
  const mode = style.maskMode || 'none';
  if (mode === 'none') return;

  const maskHex = style.maskColor || '#000000';
  const opacity = Math.max(0, Math.min(1, style.maskOpacity ?? 0.78));
  const feather = Math.max(1, Math.min(100, style.maskFeather ?? 55)) / 100;
  const angleDeg = Number(style.maskAngle ?? 180);
  const cx = ((style.maskCenterX ?? 50) / 100) * width;
  const cy = ((style.maskCenterY ?? 65) / 100) * height;
  const rx = Math.max(20, ((style.maskRadiusX ?? 44) / 100) * width);
  const ry = Math.max(20, ((style.maskRadiusY ?? 32) / 100) * height);
  const invert = Boolean(style.maskInvert);

  ctx.save();

  if (mode === 'linear-top-bottom') {
    const rad = (angleDeg * Math.PI) / 180;
    const diag = Math.hypot(width, height) * 0.6;
    const x1 = cx - Math.sin(rad) * diag;
    const y1 = cy - Math.cos(rad) * diag;
    const x2 = cx + Math.sin(rad) * diag;
    const y2 = cy + Math.cos(rad) * diag;

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    const startStop = Math.max(0, 0.5 - feather * 0.5);
    const endStop = Math.min(1, 0.5 + feather * 0.5);
    if (invert) {
      grad.addColorStop(0, hexToRgba(maskHex, 0));
      grad.addColorStop(startStop, hexToRgba(maskHex, 0));
      grad.addColorStop(endStop, hexToRgba(maskHex, opacity));
      grad.addColorStop(1, hexToRgba(maskHex, opacity));
    } else {
      grad.addColorStop(0, hexToRgba(maskHex, opacity));
      grad.addColorStop(startStop, hexToRgba(maskHex, opacity));
      grad.addColorStop(endStop, hexToRgba(maskHex, 0));
      grad.addColorStop(1, hexToRgba(maskHex, 0));
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (mode === 'bottom-cinema') {
    const startY = Math.max(0, cy - height * feather * 0.6);
    const grad = ctx.createLinearGradient(0, startY, 0, height);
    grad.addColorStop(0, hexToRgba(maskHex, 0));
    grad.addColorStop(0.55, hexToRgba(maskHex, opacity * 0.65));
    grad.addColorStop(1, hexToRgba(maskHex, opacity));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (mode === 'top-bottom-split') {
    const topH = height * (0.22 + feather * 0.28);
    const topGrad = ctx.createLinearGradient(0, 0, 0, topH);
    topGrad.addColorStop(0, hexToRgba(maskHex, opacity));
    topGrad.addColorStop(1, hexToRgba(maskHex, 0));
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, width, topH);

    const botH = height * (0.3 + feather * 0.32);
    const botGrad = ctx.createLinearGradient(0, height - botH, 0, height);
    botGrad.addColorStop(0, hexToRgba(maskHex, 0));
    botGrad.addColorStop(1, hexToRgba(maskHex, opacity));
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, height - botH, width, botH);
  } else if (mode === 'circle-radial') {
    ctx.translate(cx, cy);
    const scaleY = ry / Math.max(1, rx);
    ctx.scale(1, scaleY);
    const innerR = rx * Math.max(0.08, 1 - feather * 0.78);
    const outerR = rx * (1 + feather * 0.65);
    const radGrad = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
    if (invert) {
      radGrad.addColorStop(0, hexToRgba(maskHex, opacity));
      radGrad.addColorStop(1, hexToRgba(maskHex, 0));
    } else {
      radGrad.addColorStop(0, hexToRgba(maskHex, 0));
      radGrad.addColorStop(1, hexToRgba(maskHex, opacity));
    }
    ctx.fillStyle = radGrad;
    const maxDim = Math.max(width, height) * 3;
    ctx.fillRect(-maxDim, -maxDim, maxDim * 2, maxDim * 2);
  } else if (mode === 'rectangle') {
    // Rotatable / angled Rectangle Gradient Mask like Premiere Pro & CapCut
    ctx.translate(cx, cy);
    ctx.rotate(((angleDeg - 180) * Math.PI) / 180);

    if (invert) {
      // Darken inside rectangle with feathered edge
      const steps = 14;
      for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const expandX = rx + t * feather * 110;
        const expandY = ry + t * feather * 110;
        const alphaStep = (opacity / (steps + 1)) * 1.45;
        ctx.fillStyle = hexToRgba(maskHex, alphaStep);
        drawRoundedRect(ctx, -expandX, -expandY, expandX * 2, expandY * 2, 28 + t * 24);
        ctx.fill();
      }
    } else {
      // Darken outside rectangle (spotlight inside rectangle) with feathered falloff
      const vGrad = ctx.createRadialGradient(
        0,
        0,
        Math.min(rx, ry) * Math.max(0.15, 1 - feather * 0.7),
        0,
        0,
        Math.max(width, height) * 0.95
      );
      vGrad.addColorStop(0, hexToRgba(maskHex, 0));
      vGrad.addColorStop(0.55, hexToRgba(maskHex, opacity * 0.72));
      vGrad.addColorStop(1, hexToRgba(maskHex, opacity));
      ctx.fillStyle = vGrad;
      const maxDim = Math.max(width, height) * 2.5;
      ctx.fillRect(-maxDim, -maxDim, maxDim * 2, maxDim * 2);
    }
  }

  ctx.restore();
}

/**
 * Draws the authentic Instagram Reels UI Frame Overlay:
 * - Top Reels header + Camera icon
 * - Right-side Like (Heart), Comment, Share (Paper Plane), Bookmark, More (•••), Spinning Audio Disc
 * - Bottom Creator Handle (@sidz_creator), Follow button, Caption preview, and Audio ticker
 */
function drawInstagramReelsFrameOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sampleReel: SampleReel,
  activeCaptionText: string,
  currentTime: number
) {
  ctx.save();

  // Subtle top & bottom Instagram UI legibility gradient
  const topGrad = ctx.createLinearGradient(0, 0, 0, 110);
  topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.52)');
  topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, 110);

  const botGrad = ctx.createLinearGradient(0, height - 220, 0, height);
  botGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  botGrad.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, height - 220, width, 220);

  // 1. Top Instagram "Reels" Bar
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Reels', 24, 44);

  // Top-right Camera outline icon
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.2;
  drawRoundedRect(ctx, width - 52, 32, 28, 22, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(width - 38, 43, 5.5, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Right-side Instagram Action Stack (Like, Comment, Share, Save, Audio Disc)
  const rightX = width - 38;
  let iconY = height - 340;

  // Heart (Like)
  ctx.save();
  ctx.fillStyle = '#FF3040';
  ctx.font = '26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('♥', rightX, iconY);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('48.2K', rightX, iconY + 22);
  ctx.restore();

  // Comment Bubble
  iconY += 62;
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(rightX, iconY - 2, 12, 0.2 * Math.PI, 1.85 * Math.PI);
  ctx.lineTo(rightX + 11, iconY + 9);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('1,420', rightX, iconY + 22);
  ctx.restore();

  // Share (Paper Plane)
  iconY += 62;
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(rightX - 11, iconY - 8);
  ctx.lineTo(rightX + 12, iconY - 8);
  ctx.lineTo(rightX - 1, iconY + 11);
  ctx.lineTo(rightX - 3, iconY);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('9,840', rightX, iconY + 22);
  ctx.restore();

  // Save (Bookmark)
  iconY += 56;
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(rightX - 9, iconY - 11);
  ctx.lineTo(rightX + 9, iconY - 11);
  ctx.lineTo(rightX + 9, iconY + 11);
  ctx.lineTo(rightX, iconY + 4);
  ctx.lineTo(rightX - 9, iconY + 11);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Spinning Music Disc at Bottom-Right
  iconY += 54;
  ctx.save();
  ctx.translate(rightX, iconY);
  ctx.rotate(currentTime * 1.8);
  ctx.fillStyle = '#18181B';
  drawRoundedRect(ctx, -15, -15, 30, 30, 8);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fillStyle = sampleReel.accentColor || '#FDE047';
  ctx.fill();
  ctx.restore();

  // 3. Bottom-Left Creator Profile, Follow Pill, Caption Line & Audio Pill
  const botLeftX = 22;
  const profileY = height - 112;

  // Creator Avatar Circle with Instagram Story Gradient Ring
  const ringGrad = ctx.createLinearGradient(botLeftX, profileY - 18, botLeftX + 36, profileY + 18);
  ringGrad.addColorStop(0, '#F58529');
  ringGrad.addColorStop(0.5, '#DD2A7B');
  ringGrad.addColorStop(1, '#8134AF');
  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(botLeftX + 18, profileY, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#090A0F';
  ctx.beginPath();
  ctx.arc(botLeftX + 18, profileY, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SIDZ', botLeftX + 18, profileY + 1);

  // Creator Handle
  const handleText = (sampleReel.creator || '@sidz_studio').replace(/\s+/g, '_').toLowerCase();
  ctx.textAlign = 'left';
  ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(handleText.startsWith('@') ? handleText : `@${handleText}`, botLeftX + 46, profileY);

  // Follow Pill
  const followX = botLeftX + 178;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, followX, profileY - 12, 62, 24, 7);
  ctx.stroke();
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Follow', followX + 31, profileY + 1);

  // Bottom Caption Snippet
  ctx.textAlign = 'left';
  ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  const previewLine = activeCaptionText
    ? `${activeCaptionText.slice(0, 38)}... more`
    : `${sampleReel.title} ✨ #reels #sidz`;
  ctx.fillText(previewLine, botLeftX, height - 74);

  // Scrolling Original Audio Pill
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  drawRoundedRect(ctx, botLeftX, height - 52, 235, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`♫ Original audio · ${sampleReel.dialect || 'VakyaReel'}`, botLeftX + 12, height - 38);

  // Home Indicator Bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  drawRoundedRect(ctx, width / 2 - 58, height - 12, 116, 4.5, 3);
  ctx.fill();

  ctx.restore();
}

function drawSafeZonesGuide(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style?: CaptionStyleConfig,
  captionCenterX?: number,
  captionCenterY?: number,
  isDraggingCaption = false
) {
  ctx.save();
  const opacity = Math.max(0.45, Math.min(1, style?.safeZoneOpacity ?? 0.94));
  ctx.globalAlpha = opacity;

  const preset = style?.safeZonePreset || 'instagram-reels';
  const showSafeZoneMask = Boolean(style?.showSafeZones);

  if (showSafeZoneMask) {
    const fillDeepEmerald = 'rgba(15, 58, 41, 0.86)';
    const fillRightEmerald = 'rgba(18, 70, 49, 0.78)';
    const skeletonFill = 'rgba(148, 166, 157, 0.88)';
    const skeletonMuted = 'rgba(148, 166, 157, 0.65)';
    const frameBorderStroke = 'rgba(43, 174, 102, 0.28)';

    const fillCircle = (cx: number, cy: number, r: number, color = skeletonFill) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };

    const fillPill = (
      x: number,
      y: number,
      w: number,
      h: number,
      rx: number,
      color = skeletonFill
    ) => {
      ctx.fillStyle = color;
      drawRoundedRect(ctx, x, y, w, h, rx);
      ctx.fill();
    };

    if (preset === 'instagram-story') {
      // =======================================================================
      // INSTAGRAM STORY SAFE ZONE & SAFE ZONE FRAME
      // Top Story progress bars + Avatar/Username header + Bottom "Send message" & Heart/Share
      // =======================================================================
      const topH = height * 0.125;
      const botY = height * 0.855;
      const sideW = width * 0.045;

      // Top unsafe band
      ctx.fillStyle = fillDeepEmerald;
      ctx.fillRect(0, 0, width, topH);
      // Bottom unsafe band
      ctx.fillRect(0, botY, width, height - botY);
      // Left & Right safe margin strips
      ctx.fillRect(0, topH, sideW, botY - topH);
      ctx.fillRect(width - sideW, topH, sideW, botY - topH);

      // Safe zone inner border
      ctx.strokeStyle = frameBorderStroke;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sideW, topH, width - sideW * 2, botY - topH);

      // Top Story 3-segment progress bars
      const segGap = width * 0.015;
      const segW = (width - width * 0.08 - segGap * 2) / 3;
      for (let i = 0; i < 3; i++) {
        fillPill(
          width * 0.04 + i * (segW + segGap),
          height * 0.02,
          segW,
          height * 0.005,
          3,
          i === 0 ? skeletonFill : skeletonMuted
        );
      }

      // Story Avatar circle + Username bar on top-left
      fillCircle(width * 0.08, height * 0.068, width * 0.028);
      fillPill(width * 0.125, height * 0.056, width * 0.25, height * 0.022, 6);

      // Top-right Story menu & close circles
      fillCircle(width * 0.835, height * 0.068, width * 0.022);
      fillCircle(width * 0.918, height * 0.068, width * 0.026);

      // Bottom Story "Send message" pill + Heart & Share circles
      fillPill(
        width * 0.04,
        height * 0.912,
        width * 0.685,
        height * 0.038,
        height * 0.019
      );
      fillCircle(width * 0.815, height * 0.931, width * 0.026);
      fillCircle(width * 0.912, height * 0.931, width * 0.026);
    } else if (preset === 'tiktok-foryou') {
      // =======================================================================
      // TIKTOK SAFE ZONE & SAFE ZONE FRAME
      // Top Following/For You tabs + Search + Right 6-icon stack + Bottom caption & music ticker
      // =======================================================================
      const topH = height * 0.118;
      const botY = height * 0.835;
      const leftW = width * 0.048;
      const rightStripX = width * 0.802;
      const rightStripTopY = height * 0.42;
      const rightMarginW = width * 0.065;

      ctx.fillStyle = fillDeepEmerald;
      // Top band
      ctx.fillRect(0, 0, width, topH);
      // Bottom band
      ctx.fillRect(0, botY, width, height - botY);
      // Left margin
      ctx.fillRect(0, topH, leftW, botY - topH);
      // Upper-right margin
      ctx.fillRect(width - rightMarginW, topH, rightMarginW, rightStripTopY - topH);
      // Right-side TikTok action strip
      ctx.fillStyle = fillRightEmerald;
      ctx.fillRect(rightStripX, rightStripTopY, width - rightStripX, botY - rightStripTopY);

      // Top TikTok "LIVE" pill (left), "Following | For You" pills (center), Search circle (right)
      fillPill(width * 0.04, height * 0.052, width * 0.1, height * 0.024, 6, skeletonMuted);
      fillPill(width * 0.31, height * 0.052, width * 0.17, height * 0.024, 6, skeletonMuted);
      fillPill(width * 0.51, height * 0.052, width * 0.17, height * 0.024, 6, skeletonFill);
      fillCircle(width * 0.915, height * 0.064, width * 0.028);

      // Right-side 6 TikTok circles (Creator Avatar + Heart + Comment + Bookmark + Share + Spinning Disc)
      const rightCx = width * 0.892;
      const startCy = height * 0.468;
      const stepCy = height * 0.064;
      for (let i = 0; i < 6; i++) {
        fillCircle(
          rightCx,
          startCy + i * stepCy,
          i === 0 || i === 5 ? width * 0.034 : width * 0.03
        );
      }

      // Bottom-left @username + 3 caption/hashtag bars + scrolling music bar
      fillPill(width * 0.038, height * 0.848, width * 0.29, height * 0.016, 4);
      fillPill(width * 0.038, height * 0.871, width * 0.54, height * 0.015, 4);
      fillPill(width * 0.038, height * 0.893, width * 0.41, height * 0.015, 4);
      // Bottom comment / navigation bar + 2 right circles
      fillPill(
        width * 0.038,
        height * 0.93,
        width * 0.69,
        height * 0.035,
        height * 0.0175
      );
      fillCircle(width * 0.822, height * 0.948, width * 0.024);
      fillCircle(width * 0.915, height * 0.948, width * 0.024);
    } else if (preset === 'youtube-shorts') {
      // =======================================================================
      // YOUTUBE SHORTS SAFE ZONE & SAFE ZONE FRAME
      // =======================================================================
      const topH = height * 0.112;
      const botY = height * 0.84;
      const leftW = width * 0.048;
      const rightStripX = width * 0.804;
      const rightStripTopY = height * 0.45;
      const rightMarginW = width * 0.065;

      ctx.fillStyle = fillDeepEmerald;
      ctx.fillRect(0, 0, width, topH);
      ctx.fillRect(0, botY, width, height - botY);
      ctx.fillRect(0, topH, leftW, botY - topH);
      ctx.fillRect(width - rightMarginW, topH, rightMarginW, rightStripTopY - topH);
      ctx.fillStyle = fillRightEmerald;
      ctx.fillRect(rightStripX, rightStripTopY, width - rightStripX, botY - rightStripTopY);

      // Top-left Shorts pill + Top-right Search & Menu circles
      fillPill(width * 0.04, height * 0.052, width * 0.16, height * 0.025, 6);
      fillCircle(width * 0.825, height * 0.064, width * 0.025);
      fillCircle(width * 0.915, height * 0.064, width * 0.025);

      // Right-side 5 Shorts action circles + bottom square audio thumb
      const rightCx = width * 0.892;
      for (let i = 0; i < 5; i++) {
        fillCircle(rightCx, height * 0.51 + i * (height * 0.062), width * 0.03);
      }

      // Bottom Channel avatar + handle + Subscribe pill + caption lines
      fillPill(width * 0.038, height * 0.854, width * 0.3, height * 0.016, 4);
      fillPill(width * 0.038, height * 0.876, width * 0.52, height * 0.015, 4);
      fillPill(width * 0.038, height * 0.898, width * 0.38, height * 0.015, 4);
      fillPill(
        width * 0.038,
        height * 0.932,
        width * 0.695,
        height * 0.034,
        height * 0.017
      );
      fillCircle(width * 0.822, height * 0.949, width * 0.024);
      fillCircle(width * 0.915, height * 0.949, width * 0.024);
    } else if (preset === 'instagram-feed') {
      // =======================================================================
      // INSTAGRAM FEED SAFE ZONE & SAFE ZONE FRAME
      // =======================================================================
      const topH = height * 0.11;
      const botY = height * 0.85;
      const sideW = width * 0.05;

      ctx.fillStyle = fillDeepEmerald;
      ctx.fillRect(0, 0, width, topH);
      ctx.fillRect(0, botY, width, height - botY);
      ctx.fillRect(0, topH, sideW, botY - topH);
      ctx.fillRect(width - sideW, topH, sideW, botY - topH);

      // Top Feed header
      fillCircle(width * 0.08, height * 0.058, width * 0.026);
      fillPill(width * 0.125, height * 0.047, width * 0.24, height * 0.022, 5);
      fillCircle(width * 0.915, height * 0.058, width * 0.024);

      // Bottom Feed interaction bar + caption lines
      fillPill(width * 0.038, height * 0.862, width * 0.28, height * 0.015, 4);
      fillPill(width * 0.038, height * 0.884, width * 0.51, height * 0.015, 4);
      fillPill(
        width * 0.038,
        height * 0.928,
        width * 0.69,
        height * 0.034,
        height * 0.017
      );
      fillCircle(width * 0.822, height * 0.945, width * 0.024);
      fillCircle(width * 0.915, height * 0.945, width * 0.024);
    } else {
      // =======================================================================
      // INSTAGRAM REELS SAFE ZONE & SAFE ZONE FRAME (EXACT MATCH TO IMAGE 2!)
      // Top band (left rounded rectangle + right circle)
      // Right vertical column starting mid-frame with 5 vertical grey circles
      // Bottom band with 3 stacked grey caption bars + wide message pill + 2 right circles
      // =======================================================================
      const topH = height * 0.118;
      const botY = height * 0.844;
      const leftMarginW = width * 0.052;
      const rightUpperMarginW = width * 0.068;
      const rightStripX = width * 0.802;
      const rightStripTopY = height * 0.468;

      // 1. Top Unsafe Header Band
      ctx.fillStyle = fillDeepEmerald;
      ctx.fillRect(0, 0, width, topH);

      // 2. Bottom Unsafe Caption & Comment Band
      ctx.fillRect(0, botY, width, height - botY);

      // 3. Left Safe Margin Strip
      ctx.fillRect(0, topH, leftMarginW, botY - topH);

      // 4. Upper-Right Safe Margin Strip (above the 5-icon column)
      ctx.fillRect(
        width - rightUpperMarginW,
        topH,
        rightUpperMarginW,
        rightStripTopY - topH
      );

      // 5. Lower-Right Vertical Action Strip (contains the 5 vertical grey circles!)
      ctx.fillStyle = fillRightEmerald;
      ctx.fillRect(
        rightStripX,
        rightStripTopY,
        width - rightStripX,
        botY - rightStripTopY
      );

      // Top-left rounded rectangle pill + Top-right circle (Exact Image 2 match)
      fillPill(width * 0.036, height * 0.055, width * 0.142, height * 0.024, 5);
      fillCircle(width * 0.918, height * 0.067, width * 0.028);

      // Right-side 5 vertical grey action circles (Exact Image 2 match)
      const rightIconCx = width * 0.888;
      const firstIconCy = height * 0.592;
      const iconStepY = height * 0.052;
      for (let i = 0; i < 5; i++) {
        fillCircle(rightIconCx, firstIconCy + i * iconStepY, width * 0.031);
      }

      // Bottom-left 3 stacked horizontal grey skeleton bars (Exact Image 2 match)
      fillPill(width * 0.036, height * 0.854, width * 0.275, height * 0.015, 4);
      fillPill(width * 0.036, height * 0.876, width * 0.512, height * 0.015, 4);
      fillPill(width * 0.036, height * 0.898, width * 0.366, height * 0.015, 4);

      // Bottom-most wide rounded pill + 2 right circles (Exact Image 2 match)
      fillPill(
        width * 0.036,
        height * 0.931,
        width * 0.695,
        height * 0.035,
        height * 0.0175
      );
      fillCircle(width * 0.822, height * 0.949, width * 0.024);
      fillCircle(width * 0.915, height * 0.949, width * 0.024);
    }
  }

  // If the user is actively dragging a caption on the canvas, show subtle alignment crosshairs
  if (isDraggingCaption) {
    const targetX = captionCenterX ?? width / 2;
    const targetY = captionCenterY ?? height * 0.68;
    const isHorizCentered = Math.abs(targetX - width / 2) <= width * 0.018;
    const isVertCentered = Math.abs(targetY - height / 2) <= height * 0.018;

    ctx.save();
    ctx.strokeStyle = isHorizCentered ? '#24B47E' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = isHorizCentered ? 2.2 : 1.2;
    ctx.setLineDash(isHorizCentered ? [] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(targetX, 0);
    ctx.lineTo(targetX, height);
    ctx.stroke();

    ctx.strokeStyle = isVertCentered ? '#24B47E' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = isVertCentered ? 2.2 : 1.2;
    ctx.setLineDash(isVertCentered ? [] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, targetY);
    ctx.lineTo(width, targetY);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}


