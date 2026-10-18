/**
 * Real-Time AI Person Cutout & Auto Behind-Head Depth Masking Engine
 *
 * Performs 60fps foreground speaker segmentation (head, hair crown, face, and shoulders)
 * on uploaded HTML5 <video> streams using YCbCr skin/hair clustering, corner background
 * chrominance modeling, and temporal centroid tracking.
 *
 * Layering order when Depth Mask is ON:
 *   Layer 1: Full Video Frame (Background Plate)
 *   Layer 2: Giant Medical / Creator Hook Captions positioned in the Behind-Head Zone
 *   Layer 3: Real-Time Foreground Subject Cutout (Head & Shoulders rendered ON TOP of captions)
 */

export interface SubjectTrackingState {
  headCenterX: number; // Normalized 0..1 (default 0.5)
  headTopY: number; // Normalized 0..1 (default 0.19)
  headRadiusX: number; // Normalized 0..1 (default 0.16)
  headRadiusY: number; // Normalized 0..1 (default 0.14)
  shoulderCenterY: number; // Normalized 0..1 (default 0.52)
  shoulderRadiusX: number; // Normalized 0..1 (default 0.34)
  recommendedCaptionYPercent: number; // Optimal Y% for behind-head caption placement (e.g. 28%)
  confidence: number; // 0..1
  lastAnalyzedTime: number;
}

const SEG_WIDTH = 96;
const SEG_HEIGHT = 170;

let analysisCanvas: HTMLCanvasElement | null = null;
let analysisCtx: CanvasRenderingContext2D | null = null;
let maskCanvas: HTMLCanvasElement | null = null;
let maskCtx: CanvasRenderingContext2D | null = null;
let foregroundCompCanvas: HTMLCanvasElement | null = null;
let foregroundCompCtx: CanvasRenderingContext2D | null = null;

const latestTrackingState: SubjectTrackingState = {
  headCenterX: 0.5,
  headTopY: 0.18,
  headRadiusX: 0.165,
  headRadiusY: 0.145,
  shoulderCenterY: 0.53,
  shoulderRadiusX: 0.35,
  recommendedCaptionYPercent: 28,
  confidence: 0.92,
  lastAnalyzedTime: -1,
};

function ensureOffscreenCanvases(targetW: number, targetH: number) {
  if (typeof document === 'undefined') return;
  if (!analysisCanvas) {
    analysisCanvas = document.createElement('canvas');
    analysisCanvas.width = SEG_WIDTH;
    analysisCanvas.height = SEG_HEIGHT;
    analysisCtx = analysisCanvas.getContext('2d', { willReadFrequently: true });
  }
  if (!maskCanvas) {
    maskCanvas = document.createElement('canvas');
    maskCanvas.width = SEG_WIDTH;
    maskCanvas.height = SEG_HEIGHT;
    maskCtx = maskCanvas.getContext('2d');
  }
  if (
    !foregroundCompCanvas ||
    foregroundCompCanvas.width !== targetW ||
    foregroundCompCanvas.height !== targetH
  ) {
    foregroundCompCanvas = document.createElement('canvas');
    foregroundCompCanvas.width = targetW;
    foregroundCompCanvas.height = targetH;
    foregroundCompCtx = foregroundCompCanvas.getContext('2d');
  }
}

/**
 * Converts RGB (0..255) to YCbCr and returns skin likelihood (0..1)
 * Tuned for diverse South Asian / Desi & global skin tones under studio or natural lighting.
 */
function computeSkinLikelihood(r: number, g: number, b: number): number {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  if (y < 28 || y > 245) return 0;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  // Center of human skin cluster in Cb/Cr space: Cb ~ 102, Cr ~ 152
  const dCb = (cb - 102) / 26;
  const dCr = (cr - 152) / 24;
  const distSq = dCb * dCb + dCr * dCr;
  if (distSq > 2.4) return 0;
  return Math.max(0, Math.min(1, Math.exp(-distSq * 0.85)));
}

/**
 * Analyzes the current video frame to update the speaker's head/shoulder bounding silhouette
 * and build the pixel-accurate soft alpha matte in `maskCanvas`.
 */
export function updateVideoSubjectDepthMatte(
  videoElement: HTMLVideoElement,
  sensitivity: number = 0.65
): SubjectTrackingState {
  if (
    typeof document === 'undefined' ||
    !videoElement ||
    videoElement.readyState < 2 ||
    videoElement.videoWidth === 0
  ) {
    return latestTrackingState;
  }

  ensureOffscreenCanvases(540, 960);
  if (!analysisCtx || !maskCtx || !maskCanvas) {
    return latestTrackingState;
  }

  try {
    analysisCtx.drawImage(videoElement, 0, 0, SEG_WIDTH, SEG_HEIGHT);
    const frameData = analysisCtx.getImageData(0, 0, SEG_WIDTH, SEG_HEIGHT);
    const data = frameData.data;

    // 1. Sample background color from outer upper-left, upper-right, and top-edge border pixels
    let bgR = 0;
    let bgG = 0;
    let bgB = 0;
    let bgCount = 0;

    for (let y = 2; y < 38; y += 3) {
      for (let x = 2; x < SEG_WIDTH - 2; x += 4) {
        // Only sample outer 18% left/right edges or top 6% strip
        if (x < SEG_WIDTH * 0.18 || x > SEG_WIDTH * 0.82 || y < SEG_HEIGHT * 0.06) {
          const idx = (y * SEG_WIDTH + x) * 4;
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
          bgCount++;
        }
      }
    }

    if (bgCount > 0) {
      bgR /= bgCount;
      bgG /= bgCount;
      bgB /= bgCount;
    }

    // 2. Locate the speaker's face/head centroid using skin-tone + central portrait prior
    let sumSkinX = 0;
    let sumSkinY = 0;
    let sumSkinWeight = 0;

    for (let y = Math.floor(SEG_HEIGHT * 0.08); y < Math.floor(SEG_HEIGHT * 0.58); y++) {
      const ny = y / SEG_HEIGHT;
      for (let x = Math.floor(SEG_WIDTH * 0.16); x < Math.floor(SEG_WIDTH * 0.84); x++) {
        const nx = x / SEG_WIDTH;
        const idx = (y * SEG_WIDTH + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const skinProb = computeSkinLikelihood(r, g, b);
        const centerWeight = Math.exp(-Math.pow((nx - 0.5) / 0.28, 2));
        const weight = skinProb * centerWeight;
        if (weight > 0.22) {
          sumSkinX += nx * weight;
          sumSkinY += ny * weight;
          sumSkinWeight += weight;
        }
      }
    }

    // Smooth temporal tracking so the head cutout never jitters frame-to-frame
    if (sumSkinWeight > 6) {
      const detectedFaceX = Math.max(0.28, Math.min(0.72, sumSkinX / sumSkinWeight));
      const detectedFaceY = Math.max(0.18, Math.min(0.46, sumSkinY / sumSkinWeight));
      const detectedHeadTopY = Math.max(0.08, detectedFaceY - 0.13);

      latestTrackingState.headCenterX =
        latestTrackingState.headCenterX * 0.78 + detectedFaceX * 0.22;
      latestTrackingState.headTopY =
        latestTrackingState.headTopY * 0.78 + detectedHeadTopY * 0.22;
      latestTrackingState.shoulderCenterY = Math.min(
        0.72,
        latestTrackingState.headTopY + 0.36
      );
      // Place behind-head caption right at the upper cranium / forehead horizon
      const targetCaptionY = Math.round(
        Math.max(21, Math.min(35, (latestTrackingState.headTopY + 0.085) * 100))
      );
      latestTrackingState.recommendedCaptionYPercent = Math.round(
        latestTrackingState.recommendedCaptionYPercent * 0.8 + targetCaptionY * 0.2
      );
      latestTrackingState.confidence = Math.min(0.99, 0.75 + Math.min(0.24, sumSkinWeight / 120));
    }

    // 3. Build pixel-level foreground alpha matte combining:
    //    - Background chrominance/luminance distance
    //    - Skin & hair crown clustering
    //    - Tracked anatomical head + neck + shoulders silhouette prior
    const maskImg = maskCtx.createImageData(SEG_WIDTH, SEG_HEIGHT);
    const mData = maskImg.data;

    const hx = latestTrackingState.headCenterX;
    const hy = latestTrackingState.headTopY + latestTrackingState.headRadiusY * 0.88;
    const hRx = latestTrackingState.headRadiusX * (0.95 + sensitivity * 0.18);
    const hRy = latestTrackingState.headRadiusY * (0.98 + sensitivity * 0.18);

    const sx = hx;
    const sy = latestTrackingState.shoulderCenterY;
    const sRx = latestTrackingState.shoulderRadiusX * (0.95 + sensitivity * 0.15);
    const sRy = 0.24;

    const colorThresh = 26 + (1 - sensitivity) * 28;

    for (let y = 0; y < SEG_HEIGHT; y++) {
      const ny = y / SEG_HEIGHT;
      for (let x = 0; x < SEG_WIDTH; x++) {
        const nx = x / SEG_WIDTH;
        const idx = (y * SEG_WIDTH + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Normalized distance to head ellipse and torso/shoulder ellipse
        const dHead =
          Math.pow((nx - hx) / hRx, 2) + Math.pow((ny - hy) / hRy, 2);
        const dTorso =
          ny >= hy
            ? Math.pow((nx - sx) / sRx, 2) + Math.pow((ny - sy) / sRy, 2)
            : 99;
        const dNeck =
          Math.abs(nx - hx) < hRx * 0.72 && ny >= hy && ny <= sy
            ? 0.45
            : 99;

        const minAnatomicalDist = Math.min(dHead, dTorso, dNeck);

        // Background color difference
        const dr = r - bgR;
        const dg = g - bgG;
        const db = b - bgB;
        const bgDiff = Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11);

        const skinScore = computeSkinLikelihood(r, g, b);
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        // Hair crown detection (dark cluster right above/around face)
        const isHairCrown =
          dHead < 1.38 && ny <= hy + hRy * 0.4 && luma < 92 && bgDiff > 14 ? 0.85 : 0;

        let alpha = 0;
        if (minAnatomicalDist <= 0.68) {
          // Core head/face/torso interior
          alpha = 1.0;
        } else if (minAnatomicalDist <= 1.48) {
          // Boundary zone: combine anatomical prior with real pixel edge & skin/hair likelihood
          const spatialFalloff = Math.max(0, 1 - (minAnatomicalDist - 0.68) / 0.8);
          const fgSignal = Math.max(
            skinScore,
            isHairCrown,
            Math.min(1, bgDiff / colorThresh)
          );
          alpha = spatialFalloff * (0.42 + 0.58 * fgSignal);
        }

        const clampedAlpha = Math.max(
          0,
          Math.min(255, Math.round(Math.pow(alpha, 0.85) * 255))
        );
        mData[idx] = 255;
        mData[idx + 1] = 255;
        mData[idx + 2] = 255;
        mData[idx + 3] = clampedAlpha;
      }
    }

    maskCtx.putImageData(maskImg, 0, 0);
  } catch {
    // Ignore cross-origin or transient video frame read errors
  }

  return latestTrackingState;
}

/**
 * Automatically analyzes an uploaded video element to recommend the optimal
 * Behind-Head Y position (%) for captions when Depth Mask is enabled.
 */
export function detectOptimalBehindHeadPlacement(
  videoElement: HTMLVideoElement | null
): { recommendedYPercent: number; tracking: SubjectTrackingState } {
  if (videoElement && videoElement.readyState >= 2) {
    const state = updateVideoSubjectDepthMatte(videoElement, 0.7);
    return {
      recommendedYPercent: state.recommendedCaptionYPercent,
      tracking: state,
    };
  }
  return {
    recommendedYPercent: 28,
    tracking: latestTrackingState,
  };
}

/**
 * Renders Layer 3 (Foreground Speaker Cutout) ON TOP OF the Behind-Head Caption Layer!
 * Also supports an optional subtle Depth Matte Edge Indicator so creators can see the active cutout.
 */
export function renderForegroundSubjectCutoutLayer(params: {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  videoElement: HTMLVideoElement | null;
  hasUploadedVideo: boolean;
  sensitivity?: number;
  showMatteRimGuide?: boolean;
}): SubjectTrackingState {
  const {
    ctx,
    canvasWidth,
    canvasHeight,
    videoElement,
    hasUploadedVideo,
    sensitivity = 0.68,
    showMatteRimGuide = false,
  } = params;

  const isVideoReady =
    hasUploadedVideo &&
    videoElement &&
    videoElement.readyState >= 2 &&
    videoElement.videoWidth > 0 &&
    videoElement.videoHeight > 0;

  if (isVideoReady && videoElement) {
    ensureOffscreenCanvases(canvasWidth, canvasHeight);
    const tracking = updateVideoSubjectDepthMatte(videoElement, sensitivity);

    if (foregroundCompCanvas && foregroundCompCtx && maskCanvas) {
      const vW = videoElement.videoWidth;
      const vH = videoElement.videoHeight;
      const canvasRatio = canvasWidth / canvasHeight;
      const videoRatio = vW / vH;

      let drawW = canvasWidth;
      let drawH = canvasHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (Math.abs(videoRatio - canvasRatio) <= 0.24) {
        // Same orientation: fill canvas edge-to-edge (cover) so there are zero black bars
        if (videoRatio > canvasRatio) {
          drawH = canvasHeight;
          drawW = canvasHeight * videoRatio;
          offsetX = (canvasWidth - drawW) / 2;
        } else {
          drawW = canvasWidth;
          drawH = canvasWidth / videoRatio;
          offsetY = (canvasHeight - drawH) / 2;
        }
      } else if (videoRatio > canvasRatio) {
        drawW = canvasWidth;
        drawH = canvasWidth / videoRatio;
        offsetY = (canvasHeight - drawH) / 2;
      } else {
        drawH = canvasHeight;
        drawW = canvasHeight * videoRatio;
        offsetX = (canvasWidth - drawW) / 2;
      }

      foregroundCompCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      foregroundCompCtx.save();

      // 1. Draw soft-feathered alpha mask aligned to the exact video frame rect
      foregroundCompCtx.filter = 'blur(3.5px)';
      foregroundCompCtx.drawImage(maskCanvas, offsetX, offsetY, drawW, drawH);
      foregroundCompCtx.filter = 'none';

      // 2. Mask in the live video pixels using source-in
      foregroundCompCtx.globalCompositeOperation = 'source-in';
      foregroundCompCtx.drawImage(videoElement, offsetX, offsetY, drawW, drawH);
      foregroundCompCtx.restore();

      // 3. Composite the foreground speaker cutout over the behind-head captions with subtle depth occlusion shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.52)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = -2;
      ctx.drawImage(foregroundCompCanvas, 0, 0);
      ctx.restore();

      if (showMatteRimGuide) {
        ctx.save();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.ellipse(
          tracking.headCenterX * canvasWidth,
          (tracking.headTopY + tracking.headRadiusY * 0.88) * canvasHeight,
          tracking.headRadiusX * canvasWidth,
          tracking.headRadiusY * canvasHeight,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }

      return tracking;
    }
  }

  // Fallback for sample reels (no uploaded video file yet):
  // Render a realistic studio speaker foreground silhouette & rim lighting in front of the behind-head captions
  ctx.save();
  const cx = canvasWidth * 0.5;
  const headY = canvasHeight * 0.36;
  const headRx = canvasWidth * 0.145;
  const headRy = canvasHeight * 0.115;
  const torsoY = canvasHeight * 0.57;
  const torsoRx = canvasWidth * 0.31;
  const torsoRy = canvasHeight * 0.22;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = -3;

  const subjGrad = ctx.createLinearGradient(0, headY - headRy, 0, canvasHeight * 0.76);
  subjGrad.addColorStop(0, 'rgba(20, 24, 38, 0.94)');
  subjGrad.addColorStop(0.55, 'rgba(13, 16, 28, 0.96)');
  subjGrad.addColorStop(1, 'rgba(8, 10, 18, 0)');

  ctx.fillStyle = subjGrad;
  ctx.beginPath();
  ctx.ellipse(cx, headY, headRx, headRy, 0, 0, Math.PI * 2);
  ctx.ellipse(cx, torsoY, torsoRx, torsoRy, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Studio rim light along crown & shoulders so the depth separation pops visually
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.26)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, headY, headRx, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.restore();

  return latestTrackingState;
}

export function getLatestSubjectSegmentation(): SubjectTrackingState & {
  recommendedBehindHeadYRatio: number;
} {
  return {
    ...latestTrackingState,
    recommendedBehindHeadYRatio:
      (latestTrackingState.recommendedCaptionYPercent || 31) / 100,
  };
}
