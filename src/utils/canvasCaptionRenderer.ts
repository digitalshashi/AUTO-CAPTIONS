import { CaptionSegment, CaptionStyleConfig, SampleReel, WordTiming } from '../types/caption';

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
  if (mode === 'capitalize') {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  return word;
}

function getWordFontStack(family: string): string {
  return `"${family}", "Noto Sans Telugu", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Kannada", "Noto Sans Malayalam", "Plus Jakarta Sans", sans-serif`;
}

function applyCanvasLetterSpacing(ctx: CanvasRenderingContext2D, px: number | undefined) {
  const val = Number(px || 0);
  if ('letterSpacing' in ctx) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${val}px`;
  }
}

function addMultiStopColors(grad: CanvasGradient, style: CaptionStyleConfig, shimmer = 0) {
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

  const dir = style.gradientDirection || 'vertical';
  if (dir === 'vertical') {
    const grad = ctx.createLinearGradient(0, -fontSize * 0.54, 0, fontSize * 0.5);
    addMultiStopColors(grad, style, shimmer);
    return grad;
  }
  if (dir === 'radial') {
    const r = Math.max(20, Math.max(width, fontSize) * 0.65);
    const grad = ctx.createRadialGradient(shift * 0.2, 0, 2, 0, 0, r);
    addMultiStopColors(grad, style, shimmer);
    return grad;
  }
  if (dir === 'horizontal') {
    const grad = ctx.createLinearGradient(-width / 2 + shift, 0, width / 2 + shift, 0);
    addMultiStopColors(grad, style, shimmer);
    return grad;
  }

  const angleRad = ((style.gradientAngle ?? 45) * Math.PI) / 180;
  const rx = (Math.cos(angleRad) * width) / 2;
  const ry = (Math.sin(angleRad) * fontSize) / 2;
  const grad = ctx.createLinearGradient(-rx + shift, -ry, rx + shift, ry);
  addMultiStopColors(grad, style, shimmer);
  return grad;
}

/**
 * Creates the signature SIDZ vertical top-to-bottom (or user-selected direction) luminous gradient
 * with 3-stop or 4-stop support and 60fps light shimmer.
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
  const dir = style.gradientDirection || 'vertical';

  if (dir === 'horizontal') {
    const halfW = Math.max(60, textWidth * 0.5);
    const grad = ctx.createLinearGradient(-halfW, 0, halfW, 0);
    addMultiStopColors(grad, style, shimmer);
    return grad;
  }
  if (dir === 'diagonal') {
    const angleRad = ((style.gradientAngle ?? 135) * Math.PI) / 180;
    const halfW = Math.max(60, textWidth * 0.45);
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
    const r = Math.max(40, Math.max(textWidth * 0.5, fontSize * 0.7));
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
  const margin = canvasWidth * 0.04;
  if (align === 'center') {
    const half = textWidth / 2;
    return Math.max(margin + half, Math.min(canvasWidth - margin - half, desiredX));
  }
  if (align === 'left') {
    return Math.max(margin, Math.min(canvasWidth - margin - textWidth, desiredX));
  }
  // align === 'right'
  return Math.max(margin + textWidth, Math.min(canvasWidth - margin, desiredX));
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
  isExportRender = false
) {
  if (words.length === 0) return;
  ctx.save();

  const segElapsed = Math.max(0, currentTime - segStart);
  const segDuration = Math.max(0.3, segEnd - segStart);
  const entranceProgress = Math.min(1, segElapsed / (0.22 / Math.max(0.5, style.animationSpeed)));
  const entranceSpring = 0.92 + 0.08 * Math.sin(entranceProgress * (Math.PI / 2));

  // Partition segment words into Small Line 1, Small Line 2, and Big Hero Words
  const heroIndices: number[] = [];
  words.forEach((w, idx) => {
    if (w.isHero) heroIndices.push(idx);
  });

  if (heroIndices.length === 0) {
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

  const firstHeroIdx = heroIndices[0];
  const lastHeroIdx = heroIndices[heroIndices.length - 1];

  let leadWords = words.slice(0, firstHeroIdx).map((w) => w.word);
  let heroWords = words.slice(firstHeroIdx, lastHeroIdx + 1).map((w) => w.word);
  let tailWords = words.slice(lastHeroIdx + 1).map((w) => w.word);

  if (style.hierarchyMode === 'sidz-truly-flame') {
    if (leadWords.length > 0 && tailWords.length === 0) {
      const splitAt = Math.min(2, Math.max(1, Math.floor(words.length / 2)));
      heroWords = words.slice(0, splitAt).map((w) => w.word);
      tailWords = words.slice(splitAt).map((w) => w.word);
      leadWords = [];
    } else if (tailWords.length === 0 && heroWords.length > 1) {
      tailWords = heroWords.slice(1);
      heroWords = [heroWords[0]];
    }
  } else {
    if (leadWords.length === 0 && tailWords.length > 0 && style.hierarchyMode !== 'sidz-20k-script') {
      leadWords = heroWords;
      heroWords = tailWords;
      tailWords = [];
    }
  }

  // Handle Small 2-Line Mode ('auto' | 'two-line-split' | 'single-line')
  const twoLineMode = style.smallTwoLineMode || 'auto';
  let smallLine1Words: string[] = [];
  let smallLine2Words: string[] = [];

  if (twoLineMode === 'single-line') {
    smallLine1Words = [...leadWords, ...tailWords];
    smallLine2Words = [];
  } else if (twoLineMode === 'two-line-split') {
    if (leadWords.length > 0 && tailWords.length > 0) {
      smallLine1Words = leadWords;
      smallLine2Words = tailWords;
    } else {
      const combinedSmall = [...leadWords, ...tailWords];
      if (combinedSmall.length >= 2) {
        const mid = Math.ceil(combinedSmall.length / 2);
        smallLine1Words = combinedSmall.slice(0, mid);
        smallLine2Words = combinedSmall.slice(mid);
      } else if (combinedSmall.length === 1 && heroWords.length >= 2) {
        smallLine1Words = combinedSmall;
        smallLine2Words = [heroWords[0]];
        heroWords = heroWords.slice(1);
      } else {
        smallLine1Words = combinedSmall;
        smallLine2Words = [];
      }
    }
  } else {
    // 'auto' mode: split into 2 small lines if both lead and tail exist, or if leadWords has > 4 words
    if (leadWords.length > 0 && tailWords.length > 0) {
      smallLine1Words = leadWords;
      smallLine2Words = tailWords;
    } else if (leadWords.length >= 4) {
      const mid = Math.ceil(leadWords.length / 2);
      smallLine1Words = leadWords.slice(0, mid);
      smallLine2Words = leadWords.slice(mid);
    } else if (style.hierarchyMode === 'sidz-truly-flame' && tailWords.length > 0) {
      if (tailWords.length >= 3) {
        const mid = Math.ceil(tailWords.length / 2);
        smallLine1Words = tailWords.slice(0, mid);
        smallLine2Words = tailWords.slice(mid);
      } else {
        smallLine1Words = [];
        smallLine2Words = tailWords;
      }
    } else {
      smallLine1Words = leadWords;
      smallLine2Words = tailWords;
    }
  }

  const baseCenterX = ((style.positionX ?? 50) / 100) * canvasWidth;
  const baseCenterY = ((style.positionY ?? 66) / 100) * canvasHeight;
  const vertGap = Number(style.verticalSpacing ?? 0);
  const horizGap = Math.max(0, Number(style.horizontalSpacing ?? 14));
  const letterSpace = Number(style.letterSpacing ?? 0);
  const lineSpaceMult = Number(style.lineSpacing ?? 1.18);

  const small1FontSize = Math.max(
    13,
    Math.round(style.fontSize * (style.smallWordScale || 0.68))
  );
  const small2FontSize = Math.max(
    13,
    Math.round(style.fontSize * (style.smallLine2Scale ?? style.smallWordScale ?? 0.68))
  );
  const rawGiantFontSize = Math.max(
    26,
    Math.round(style.fontSize * (style.bigWordScale || 2.15))
  );

  const isHeroCurrentlySpoken = words
    .slice(firstHeroIdx, lastHeroIdx + 1)
    .some((w) => currentTime >= w.startTime && currentTime <= w.endTime + 0.15);
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
  const verticalStretch = (isTallCondensedMode ? 1.22 : 1.04) * (0.88 + 0.12 * userScaleBoost);

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

  // Determine default alignments per SIDZ preset, overridden by user's individual alignment settings
  const defaultSmall1Align: 'left' | 'center' | 'right' =
    style.hierarchyMode === 'sidz-valuing-wide' ? 'center' : 'left';
  const defaultSmall2Align: 'left' | 'center' | 'right' =
    style.hierarchyMode === 'sidz-truly-flame' || style.hierarchyMode === 'sidz-20k-script'
      ? 'right'
      : style.hierarchyMode === 'sidz-valuing-wide'
      ? 'center'
      : 'left';

  const small1Align = style.smallTextAlign || defaultSmall1Align;
  const small2Align = style.smallLine2TextAlign || defaultSmall2Align;
  const bigAlign = style.bigTextAlign || 'center';

  // Determine vertical stack order ('small1-small2-big' | 'small1-big-small2' | 'big-small1-small2')
  const defaultOrder =
    style.hierarchyMode === 'sidz-truly-flame'
      ? 'big-small1-small2'
      : small2Text && !twoLineMode.includes('two-line')
      ? 'small1-big-small2'
      : 'small1-small2-big';
  const lineOrder = style.lineOrderMode || defaultOrder;

  // Compute baseline Y positions for each of the 3 layers before individual offsets
  let baseSmall1Y = baseCenterY - giantVisualHeight * 0.56 - small1FontSize * 0.5 - vertGap;
  let baseSmall2Y = baseCenterY + giantVisualHeight * 0.52 + small2FontSize * 0.45 + vertGap;
  let baseBigY = baseCenterY;

  if (lineOrder === 'small1-small2-big') {
    baseBigY = baseCenterY + (small1Text || small2Text ? small1FontSize * 0.45 : 0);
    if (small1Text && small2Text) {
      baseSmall2Y = baseBigY - giantVisualHeight * 0.54 - small2FontSize * 0.5 - vertGap * 0.6;
      baseSmall1Y =
        baseSmall2Y - small2FontSize * lineSpaceMult - small1FontSize * 0.35 - vertGap * 0.4;
    } else {
      baseSmall1Y = baseBigY - giantVisualHeight * 0.56 - small1FontSize * 0.5 - vertGap;
      baseSmall2Y = baseSmall1Y;
    }
  } else if (lineOrder === 'big-small1-small2') {
    baseBigY = baseCenterY - giantVisualHeight * 0.22 - vertGap * 0.4;
    baseSmall1Y = baseBigY + giantVisualHeight * 0.58 + small1FontSize * 0.5 + vertGap * 0.6;
    baseSmall2Y = small1Text
      ? baseSmall1Y + small1FontSize * lineSpaceMult + small2FontSize * 0.35 + vertGap * 0.4
      : baseSmall1Y;
  } else {
    // 'small1-big-small2'
    baseBigY = baseCenterY + (small1Text ? small1FontSize * 0.25 : 0);
    baseSmall1Y = baseBigY - giantVisualHeight * 0.56 - small1FontSize * 0.5 - vertGap;
    baseSmall2Y = baseBigY + giantVisualHeight * 0.48 + small2FontSize * 0.45 + vertGap;
  }

  // Apply individual X/Y percentage offsets
  const small1OffsetX = ((style.smallOffsetX ?? 0) / 100) * canvasWidth;
  const small1OffsetY = ((style.smallOffsetY ?? 0) / 100) * canvasHeight;
  const small2OffsetX = ((style.smallLine2OffsetX ?? 0) / 100) * canvasWidth;
  const small2OffsetY = ((style.smallLine2OffsetY ?? 0) / 100) * canvasHeight;
  const bigOffsetX = ((style.bigOffsetX ?? 0) / 100) * canvasWidth;
  const bigOffsetY = ((style.bigOffsetY ?? 0) / 100) * canvasHeight;

  // Compute Big Hero X anchor & clamp so it never overflows left or right edge
  const blockHalfSpan = Math.max(giantWidth / 2, 90);
  const rawBigAnchorX =
    bigAlign === 'left'
      ? baseCenterX - blockHalfSpan + bigOffsetX
      : bigAlign === 'right'
      ? baseCenterX + blockHalfSpan + bigOffsetX
      : baseCenterX + bigOffsetX;
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
    giantVisualHeight * 0.45,
    Math.min(canvasHeight - giantVisualHeight * 0.45, baseBigY + bigOffsetY)
  );

  // Optional dynamic Instagram / Premiere frame that follows the caption block
  drawCaptionDynamicFrame(
    ctx,
    finalBigCenterX,
    finalBigCenterY,
    Math.max(giantWidth, small1Width, small2Width, 180),
    giantVisualHeight + (small1Text ? small1FontSize * 1.3 : 0) + (small2Text ? small2FontSize * 1.3 : 0) + Math.abs(vertGap),
    style
  );

  // 1. Draw Small Line 1 (if present)
  if (small1Text) {
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
      24,
      Math.min(canvasHeight - 24, baseSmall1Y + small1OffsetY)
    );

    drawChromaticSmallPhrase(
      ctx,
      small1Text,
      clampedSmall1X,
      finalSmall1Y,
      small1FontSize,
      style.fontFamily,
      small1Align,
      style.primaryColor,
      letterSpace * 0.6
    );

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

  // 2. Draw GIANT Hero Word(s)
  ctx.save();
  ctx.translate(finalBigCenterX, finalBigCenterY);
  ctx.scale(entranceSpring * heroPopScale, entranceSpring * heroPopScale * verticalStretch);
  ctx.font = `${style.fontWeight} ${giantFontSize}px ${getWordFontStack(style.heroWordFontFamily)}`;
  applyCanvasLetterSpacing(ctx, letterSpace);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Pass A: Soft colored luminous aura glow
  ctx.save();
  ctx.shadowColor = hexToRgba(style.gradientMid || style.highlightColor || '#FDE047', 0.65);
  ctx.shadowBlur = Math.max(26, style.shadowBlur * 1.2);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillText(heroText, 0, 0);
  ctx.restore();

  // Pass B: Deep dark ambient drop shadow + crisp dark edge
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.92)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 5;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.lineWidth = Math.max(2.5, style.strokeWidth || 3);
  ctx.strokeStyle = 'rgba(5, 5, 10, 0.92)';
  ctx.strokeText(heroText, 0, 0);
  ctx.restore();

  // Pass C: Multi-Stop Vertical/Angled Luminous Gradient Fill
  ctx.fillStyle = createSidzVerticalGradient(ctx, giantFontSize, currentTime, style, giantWidth);
  ctx.fillText(heroText, 0, 0);
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

  // 3. Draw Small Line 2 or Overlapping Script Tail (if present)
  if (small2Text) {
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

    if (style.hierarchyMode === 'sidz-20k-script' && twoLineMode !== 'two-line-split') {
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
        style.primaryColor,
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
  sampleReel: SampleReel
) {
  // Bright studio window key-light + soft editorial room backdrop inspired by creator studio reels
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#2B2D38');
  grad.addColorStop(0.45, '#1D1F27');
  grad.addColorStop(1, '#0E0F14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Soft warm studio window panels in upper background
  ctx.save();
  ctx.fillStyle = 'rgba(255, 250, 240, 0.04)';
  drawRoundedRect(ctx, 48, 48, width * 0.4, height * 0.36, 16);
  ctx.fill();
  drawRoundedRect(ctx, width * 0.52, 48, width * 0.4, height * 0.36, 16);
  ctx.fill();
  ctx.restore();

  // Subtle animated studio light orb
  const orb1X = width * (0.5 + 0.24 * Math.sin(currentTime * 0.9));
  const orb1Y = height * (0.32 + 0.1 * Math.cos(currentTime * 0.7));
  const radGrad = ctx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, width * 0.65);
  radGrad.addColorStop(0, hexToRgba(sampleReel.accentColor, 0.18));
  radGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, width, height);

  // Animated creator vocal waveform visualizer in upper-center
  const centerX = width / 2;
  const waveCenterY = height * 0.28;

  const pulse = 1 + 0.04 * Math.sin(currentTime * 8);
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, waveCenterY - 85, 50 * pulse, 0, Math.PI * 2);
  ctx.strokeStyle = hexToRgba(sampleReel.accentColor, 0.65);
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, waveCenterY - 85, 42, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 18px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SIDZ', centerX, waveCenterY - 85);

  ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(sampleReel.title, centerX, waveCenterY - 12);

  ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(161, 161, 170, 0.9)';
  ctx.fillText(`${sampleReel.creator}`, centerX, waveCenterY + 12);

  // Dynamic equalizer bars
  const barCount = 27;
  const barWidth = 5;
  const barGap = 6;
  const totalWaveWidth = barCount * (barWidth + barGap) - barGap;
  const startX = centerX - totalWaveWidth / 2;

  for (let i = 0; i < barCount; i++) {
    const distFromCenter = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
    const envelope = Math.max(0.15, 1 - distFromCenter * 0.75);
    const wave =
      Math.abs(Math.sin(currentTime * 9.5 + i * 0.45)) *
      Math.abs(Math.cos(currentTime * 5.2 - i * 0.25));
    const barHeight = Math.max(6, (12 + wave * 52) * envelope);
    const bx = startX + i * (barWidth + barGap);
    const by = waveCenterY + 56 - barHeight / 2;

    ctx.fillStyle =
      wave > 0.45 ? sampleReel.accentColor : 'rgba(255, 255, 255, 0.3)';
    drawRoundedRect(ctx, bx, by, barWidth, barHeight, 3);
    ctx.fill();
  }
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
  } = params;

  if (!isExportRender) {
    latestRenderedLayerHitBoxes = [];
  }

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 1. Draw Video Frame or Sample Reel Backdrop
  if (hasUploadedVideo && videoElement && videoElement.readyState >= 2) {
    const vw = videoElement.videoWidth || canvasWidth;
    const vh = videoElement.videoHeight || canvasHeight;
    const canvasRatio = canvasWidth / canvasHeight;
    const videoRatio = vw / vh;

    ctx.fillStyle = '#05060A';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    let drawW = canvasWidth;
    let drawH = canvasHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (videoRatio > canvasRatio) {
      drawH = canvasHeight;
      drawW = canvasHeight * videoRatio;
      offsetX = (canvasWidth - drawW) / 2;
    } else {
      drawW = canvasWidth;
      drawH = canvasWidth / videoRatio;
      offsetY = (canvasHeight - drawH) / 2;
    }
    ctx.drawImage(videoElement, offsetX, offsetY, drawW, drawH);
  } else {
    drawSampleReelBackdrop(ctx, canvasWidth, canvasHeight, currentTime, sampleReel);
  }

  // 2. Measured Contrast Scrim
  if (style.showScrim) {
    const scrimGrad = ctx.createLinearGradient(0, canvasHeight * 0.44, 0, canvasHeight);
    scrimGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    scrimGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.38)');
    scrimGrad.addColorStop(1, 'rgba(0, 0, 0, 0.82)');
    ctx.fillStyle = scrimGrad;
    ctx.fillRect(0, canvasHeight * 0.44, canvasWidth, canvasHeight * 0.56);
  }

  // 2.5 CapCut / Premiere Pro / Photoshop Mask Studio Layer
  if (style.maskMode && style.maskMode !== 'none') {
    drawCapCutPremiereMask(ctx, canvasWidth, canvasHeight, style);
  }

  // 3. Find Active Segment
  const activeSegment = segments.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime + 0.05
  );

  let activePrimaryText = '';

  if (activeSegment) {
    const primaryTrackData =
      activeSegment.tracks[style.primaryTrack] ||
      activeSegment.tracks.english ||
      activeSegment.tracks.tinglish;

    const secondaryTrackData =
      style.displayMode === 'dual-stacked'
        ? activeSegment.tracks[style.secondaryTrack]
        : undefined;

    if (primaryTrackData && primaryTrackData.words.length > 0) {
      activePrimaryText = primaryTrackData.text;
      const isSidzMode =
        style.hierarchyMode === 'sidz-vairagya' ||
        style.hierarchyMode === 'sidz-20k-script' ||
        style.hierarchyMode === 'sidz-valuing-wide' ||
        style.hierarchyMode === 'sidz-truly-flame';

      if (isSidzMode && style.animationType === 'premiere-pro') {
        renderSidzCompositeCaption(
          ctx,
          canvasWidth,
          canvasHeight,
          currentTime,
          activeSegment.startTime,
          activeSegment.endTime,
          primaryTrackData.words,
          style,
          isExportRender
        );
      } else {
        renderAnimatedPrimaryCaption(
          ctx,
          canvasWidth,
          canvasHeight,
          currentTime,
          activeSegment.startTime,
          activeSegment.endTime,
          primaryTrackData.words,
          style,
          isExportRender
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
        canvasWidth,
        canvasHeight,
        secondaryTrackData.text,
        style
      );
    }
  }

  // 4. Optional Authentic Instagram Reels Frame Overlay (Like, Comment, Share, Save, Bottom Bar)
  if (style.showInstagramFrame) {
    drawInstagramReelsFrameOverlay(
      ctx,
      canvasWidth,
      canvasHeight,
      sampleReel,
      activePrimaryText,
      currentTime
    );
  }

  // 5. Optional Safe Zone Overlay
  if (style.showSafeZones) {
    drawSafeZonesGuide(ctx, canvasWidth, canvasHeight);
  }
}

interface MeasuredWordToken {
  raw: WordTiming;
  display: string;
  width: number;
  fontSize: number;
  fontFamily: string;
  isBigHero: boolean;
  localIdx: number;
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
  isExportRender = false
) {
  ctx.save();

  let activeWordIdx = words.findIndex(
    (w) => currentTime >= w.startTime && currentTime <= w.endTime
  );
  if (activeWordIdx === -1) {
    if (currentTime < words[0].startTime) activeWordIdx = 0;
    else activeWordIdx = words.length - 1;
  }

  const chunkSize =
    style.animationType === 'stomp'
      ? Math.min(2, style.wordsPerLine)
      : Math.max(1, style.wordsPerLine);

  const pageIndex = Math.floor(activeWordIdx / chunkSize);
  const pageWords = words.slice(pageIndex * chunkSize, (pageIndex + 1) * chunkSize);
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

  const maxLineWidth = canvasWidth * 0.88;

  const tokens: MeasuredWordToken[] = pageWords.map((w, idx) => {
    const isSpoken = idx === localActiveIdx;
    const isHeroWord = hasExplicitHeroInPage ? Boolean(w.isHero) : idx === fallbackHeroLocalIdx;
    const isMixedScale = style.hierarchyMode !== 'uniform';

    const useBigScale =
      isMixedScale && (isHeroWord || (style.animationType === 'premiere-pro' && isSpoken));
    const scaleFactor = isMixedScale
      ? useBigScale
        ? Math.min(2.25, style.bigWordScale || 1.45)
        : style.smallWordScale || 0.72
      : 1.0;

    let computedFontSize = Math.round(style.fontSize * scaleFactor);
    const chosenFamily =
      useBigScale && style.heroWordFontFamily ? style.heroWordFontFamily : style.fontFamily;
    const display = transformWord(w.word, style.textTransform);

    ctx.font = `${style.fontWeight} ${computedFontSize}px ${getWordFontStack(chosenFamily)}`;
    applyCanvasLetterSpacing(ctx, style.letterSpacing ?? 0);
    let width = ctx.measureText(display).width;

    // Auto-fit single long words so they never overflow the horizontal safe zone
    if (width > maxLineWidth) {
      const fitRatio = Math.max(0.45, maxLineWidth / width);
      computedFontSize = Math.max(20, Math.round(computedFontSize * fitRatio));
      ctx.font = `${style.fontWeight} ${computedFontSize}px ${getWordFontStack(chosenFamily)}`;
      applyCanvasLetterSpacing(ctx, style.letterSpacing ?? 0);
      width = ctx.measureText(display).width;
    }

    return {
      raw: w,
      display,
      width,
      fontSize: computedFontSize,
      fontFamily: chosenFamily,
      isBigHero: useBigScale,
      localIdx: idx,
    };
  });

  const baseWordGap = Math.max(4, Number(style.horizontalSpacing ?? style.fontSize * 0.25));
  const lines: MeasuredWordToken[][] = [];

  if (style.hierarchyMode === 'stacked-hero-callout' && tokens.length > 1) {
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
  if (style.smallTwoLineMode === 'two-line-split') {
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

  const lineSpaceMult = Number(style.lineSpacing ?? 1.24);
  const vertGap = Number(style.verticalSpacing ?? 0);
  const lineHeights = lines.map((line) => {
    const maxFontInLine = Math.max(...line.map((t) => t.fontSize), style.fontSize);
    return maxFontInLine * lineSpaceMult + vertGap * 0.35;
  });
  const totalBlockHeight = lineHeights.reduce((acc, h) => acc + h, 0);
  const baseCenterX = ((style.positionX ?? 50) / 100) * canvasWidth;
  const baseCenterY = ((style.positionY ?? 66) / 100) * canvasHeight;

  const lineWidths = lines.map(
    (line) =>
      line.reduce((acc, t) => acc + t.width, 0) +
      Math.max(0, line.length - 1) * baseWordGap
  );
  const maxRenderedLineWidth = Math.max(...lineWidths, 40);

  // Optional dynamic Instagram / Premiere frame that follows the caption block
  drawCaptionDynamicFrame(
    ctx,
    baseCenterX,
    baseCenterY,
    maxRenderedLineWidth,
    totalBlockHeight,
    style
  );

  if (style.backgroundOpacity > 0.02) {
    const padX = 26;
    const padY = 18;
    const boxX = baseCenterX - maxRenderedLineWidth / 2 - padX;
    const boxY = baseCenterY - totalBlockHeight / 2 - padY;
    const boxW = maxRenderedLineWidth + padX * 2;
    const boxH = totalBlockHeight + padY * 2;

    ctx.fillStyle = hexToRgba(style.backgroundColor, style.backgroundOpacity);
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 18);
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

    // Clamp line horizontally within safe canvas margins
    const margin = canvasWidth * 0.04;
    let cursorX = Math.max(margin, Math.min(canvasWidth - margin - lineW, alignedStartX));
    const lineStartX = cursorX;
    const lineY = Math.max(24, Math.min(canvasHeight - 24, baseLineY + layerOffsetY));

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

      ctx.save();
      const wordCenterX = cursorX + token.width / 2;
      let wordCenterY = lineY;
      let scale = 1;
      let rotationRad = 0;
      let alpha = segFadeAlpha;

      if (style.animationType === 'premiere-pro') {
        if (isSpoken) {
          const popSpring = Math.sin(
            Math.min(1, wordProgress * 1.45 * style.animationSpeed) * Math.PI
          );
          scale = 1.06 + 0.14 * popSpring;
          wordCenterY -= 6 * popSpring;
          if (token.isBigHero) {
            rotationRad = -0.025 * Math.sin(wordProgress * Math.PI);
          }
        } else if (!isPast && !token.isBigHero) {
          alpha = 0.85;
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
        } else if (!isPast) {
          alpha = 0.75;
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
        if (isSpoken) scale = 1.08;
      } else if (style.animationType === 'cinema-fade') {
        wordCenterY += (1 - segFadeAlpha) * 14;
      }

      ctx.translate(wordCenterX, wordCenterY);
      if (rotationRad !== 0) ctx.rotate(rotationRad);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      ctx.font = `${style.fontWeight} ${token.fontSize}px ${getWordFontStack(token.fontFamily)}`;
      applyCanvasLetterSpacing(ctx, style.letterSpacing ?? 0);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

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

      let renderedText = token.display;
      if (style.animationType === 'typewriter' && isSpoken) {
        const charCount = Math.max(1, Math.ceil(token.display.length * wordProgress));
        renderedText = token.display.slice(0, charCount);
      }

      if (
        (style.animationType === 'neon-glow' && isSpoken) ||
        (style.animationType === 'premiere-pro' && (isSpoken || token.isBigHero))
      ) {
        ctx.shadowColor = style.useGradient ? style.gradientMid : style.highlightColor;
        ctx.shadowBlur = Math.max(18, style.shadowBlur * 1.35);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;
      } else if (style.shadowBlur > 0) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.88)';
        ctx.shadowBlur = style.shadowBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
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

      const activeGradientOrColor = createSidzVerticalGradient(
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
        ctx.fillStyle = style.primaryColor;
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
        const shouldColorWithGradient =
          isSpoken ||
          token.isBigHero ||
          (isPast && style.animationType === 'karaoke');

        ctx.fillStyle = shouldColorWithGradient
          ? activeGradientOrColor
          : style.primaryColor;
        ctx.fillText(renderedText, 0, 0);
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
  height: number
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 90, 31, 0.45)';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 1.5;

  ctx.strokeRect(24, 72, width - 48, height - 260);

  ctx.fillStyle = 'rgba(255, 90, 31, 0.12)';
  drawRoundedRect(ctx, width - 78, height * 0.48, 56, height * 0.34, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 90, 31, 0.12)';
  drawRoundedRect(ctx, 24, height - 170, width - 115, 130, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FF5A1F';
  ctx.font = '600 13px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SAFE CAPTION ZONE', 34, 92);
  ctx.fillText('REELS / SHORTS UI OVERLAY ZONE', 34, height - 150);

  ctx.restore();
}
