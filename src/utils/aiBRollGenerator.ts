import { GoogleGenAI, Type } from '@google/genai';
import {
  AIBRollSlot,
  BRollDisplayLayout,
  BRollMagicalEffect,
  BRollMotionPreset,
  BRollSfxPreset,
  CaptionSegment,
  TrackKey,
  VideoAspectRatio,
} from '../types/caption';

// Cache of loaded HTMLImageElement instances by dataUrl or slot ID for 60fps synchronous Canvas rendering
const loadedBRollImageCache = new Map<string, HTMLImageElement>();

export function getCachedBRollImageElement(
  imageDataUrl?: string
): HTMLImageElement | null {
  if (!imageDataUrl) return null;
  const existing = loadedBRollImageCache.get(imageDataUrl);
  if (existing && existing.complete && existing.naturalWidth > 0) {
    return existing;
  }
  if (!existing && typeof Image !== 'undefined') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageDataUrl;
    loadedBRollImageCache.set(imageDataUrl, img);
  }
  return null;
}

export function preloadBRollImageElement(
  imageDataUrl: string
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!imageDataUrl || typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const cached = loadedBRollImageCache.get(imageDataUrl);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      resolve(cached);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedBRollImageCache.set(imageDataUrl, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
    loadedBRollImageCache.set(imageDataUrl, img);
  });
}

function getClientGenAI(): GoogleGenAI | null {
  try {
    const envObj =
      typeof process !== 'undefined' && process.env ? process.env : {};
    const apiKey =
      (envObj as Record<string, string | undefined>).GEMINI_API_KEY ||
      (envObj as Record<string, string | undefined>).API_KEY ||
      (import.meta as unknown as { env?: Record<string, string | undefined> })
        .env?.VITE_GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  } catch {
    return null;
  }
}

/**
 * Generates a high-definition, rich cinematic artwork Data URL in the exact selected aspect ratio
 * ('9:16' | '1:1' | '16:9') when initializing or if offline/rate-limited.
 */
export function synthesizeStudioBRollArtworkDataUrl(
  prompt: string,
  aspectRatio: VideoAspectRatio,
  slotNumber: 1 | 2 | 3 = 1,
  title = 'Cinematic AI B-Roll'
): string {
  if (typeof document === 'undefined') return '';
  const dims =
    aspectRatio === '9:16'
      ? { w: 720, h: 1280 }
      : aspectRatio === '1:1'
      ? { w: 960, h: 960 }
      : { w: 1280, h: 720 };

  const canvas = document.createElement('canvas');
  canvas.width = dims.w;
  canvas.height = dims.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const pLower = `${title} ${prompt}`.toLowerCase();
  const isWealth =
    pLower.includes('lakhs') ||
    pLower.includes('money') ||
    pLower.includes('wealth') ||
    pLower.includes('revenue') ||
    pLower.includes('gold') ||
    slotNumber === 2;
  const isCommunity =
    pLower.includes('community') ||
    pLower.includes('people') ||
    pLower.includes('team') ||
    pLower.includes('creator') ||
    slotNumber === 3;

  // 1. Deep Atmospheric Cinema Gradient Backdrop
  const bg = ctx.createLinearGradient(0, 0, dims.w, dims.h);
  if (isWealth) {
    bg.addColorStop(0, '#091914');
    bg.addColorStop(0.45, '#112A22');
    bg.addColorStop(1, '#231909');
  } else if (isCommunity) {
    bg.addColorStop(0, '#0B132B');
    bg.addColorStop(0.5, '#1C2541');
    bg.addColorStop(1, '#0F2922');
  } else {
    bg.addColorStop(0, '#120D26');
    bg.addColorStop(0.5, '#1A1B35');
    bg.addColorStop(1, '#0B2420');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, dims.w, dims.h);

  // 2. Volumetric God-Rays & Magical Anamorphic Light Leaks
  const cx = dims.w * (slotNumber === 1 ? 0.35 : slotNumber === 2 ? 0.65 : 0.5);
  const cy = dims.h * 0.38;
  const aura = ctx.createRadialGradient(
    cx,
    cy,
    dims.w * 0.04,
    cx,
    cy,
    dims.w * 0.75
  );
  if (isWealth) {
    aura.addColorStop(0, 'rgba(253, 224, 71, 0.55)');
    aura.addColorStop(0.35, 'rgba(43, 174, 102, 0.32)');
    aura.addColorStop(0.75, 'rgba(16, 185, 129, 0.08)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else if (isCommunity) {
    aura.addColorStop(0, 'rgba(52, 211, 153, 0.52)');
    aura.addColorStop(0.38, 'rgba(56, 189, 248, 0.28)');
    aura.addColorStop(0.75, 'rgba(250, 204, 21, 0.08)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    aura.addColorStop(0, 'rgba(245, 158, 11, 0.52)');
    aura.addColorStop(0.38, 'rgba(168, 85, 247, 0.28)');
    aura.addColorStop(0.75, 'rgba(43, 174, 102, 0.1)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, dims.w, dims.h);

  // 3. 3D Perspective Cyber/Studio Horizon Grid & Architectural Depth Lines
  ctx.save();
  ctx.strokeStyle = isWealth
    ? 'rgba(250, 204, 21, 0.16)'
    : 'rgba(52, 211, 153, 0.16)';
  ctx.lineWidth = 1.5;
  const horizonY = dims.h * 0.62;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(dims.w * 0.5 + i * (dims.w * 0.04), horizonY);
    ctx.lineTo(dims.w * 0.5 + i * (dims.w * 0.22), dims.h);
    ctx.stroke();
  }
  for (let row = 0; row < 7; row++) {
    const y = horizonY + Math.pow(row / 6, 1.7) * (dims.h - horizonY);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(dims.w, y);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Context-Specific Hero Visual Sculpture (Glowing 3D Hologram / Studio Scene)
  ctx.save();
  const centerX = dims.w * 0.5;
  const centerY = dims.h * 0.46;
  const baseRadius = Math.min(dims.w, dims.h) * 0.24;

  // Outer magical portal rings
  for (let r = 0; r < 3; r++) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * (1.05 + r * 0.22), 0, Math.PI * 2);
    ctx.strokeStyle =
      r === 0
        ? 'rgba(253, 224, 71, 0.55)'
        : r === 1
        ? 'rgba(52, 211, 153, 0.38)'
        : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3 - r * 0.7;
    ctx.stroke();
  }

  if (isWealth) {
    // Rising 3D Golden-Emerald Financial / Growth Bars & Luminous Trajectory Curve
    const barCount = 6;
    const totalW = baseRadius * 1.55;
    const startX = centerX - totalW / 2;
    const baseY = centerY + baseRadius * 0.65;
    for (let b = 0; b < barCount; b++) {
      const bw = totalW / (barCount * 1.45);
      const bh = baseRadius * (0.35 + (b / (barCount - 1)) * 1.05);
      const bx = startX + b * (totalW / barCount);
      const by = baseY - bh;
      const barGrad = ctx.createLinearGradient(bx, by, bx, baseY);
      barGrad.addColorStop(0, '#FDE047');
      barGrad.addColorStop(0.5, '#34D399');
      barGrad.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
      ctx.fillStyle = barGrad;
      ctx.shadowColor = 'rgba(250, 204, 21, 0.55)';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
    }
  } else if (isCommunity) {
    // Interconnected Luminous Creator Network Nodes & Energy Beams
    const nodes = [
      { x: centerX, y: centerY - baseRadius * 0.45, r: 22 },
      { x: centerX - baseRadius * 0.6, y: centerY + baseRadius * 0.2, r: 17 },
      { x: centerX + baseRadius * 0.6, y: centerY + baseRadius * 0.2, r: 17 },
      { x: centerX - baseRadius * 0.32, y: centerY + baseRadius * 0.65, r: 14 },
      { x: centerX + baseRadius * 0.32, y: centerY + baseRadius * 0.65, r: 14 },
    ];
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
    ctx.lineWidth = 3;
    nodes.forEach((n1, i) => {
      nodes.slice(i + 1).forEach((n2) => {
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      });
    });
    nodes.forEach((n, idx) => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = idx === 0 ? '#FDE047' : '#34D399';
      ctx.shadowColor = idx === 0 ? '#FDE047' : '#34D399';
      ctx.shadowBlur = 28;
      ctx.fill();
    });
  } else {
    // Glowing Golden Lotus / Focus Mind Core & Light Beams
    for (let a = 0; a < 12; a++) {
      const angle = (a / 12) * Math.PI * 2;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      const petalGrad = ctx.createLinearGradient(0, 0, 0, -baseRadius * 0.85);
      petalGrad.addColorStop(0, 'rgba(253, 224, 71, 0.85)');
      petalGrad.addColorStop(0.6, 'rgba(52, 211, 153, 0.45)');
      petalGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = petalGrad;
      ctx.beginPath();
      ctx.ellipse(
        0,
        -baseRadius * 0.42,
        baseRadius * 0.14,
        baseRadius * 0.45,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();

  // 5. Magical Gold & Emerald Bokeh Particles
  ctx.save();
  for (let p = 0; p < 42; p++) {
    const px = ((Math.sin(p * 12.9898 + slotNumber) * 43758.5453) % 1 + 1) % 1;
    const py = ((Math.cos(p * 78.233 + slotNumber) * 23421.631) % 1 + 1) % 1;
    const pr = 2 + (p % 6) * 2.4;
    ctx.beginPath();
    ctx.arc(px * dims.w, py * dims.h, pr, 0, Math.PI * 2);
    ctx.fillStyle =
      p % 2 === 0 ? 'rgba(253, 224, 71, 0.65)' : 'rgba(52, 211, 153, 0.65)';
    ctx.shadowColor = p % 2 === 0 ? '#FDE047' : '#34D399';
    ctx.shadowBlur = 16;
    ctx.fill();
  }
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  preloadBRollImageElement(dataUrl);
  return dataUrl;
}

/**
 * Creates the 3 initial AI B-Roll Slots distributed across the video's caption segments
 * (Slot 1: Hook, Slot 2: Mid-Story Core, Slot 3: Climax/Takeaway).
 */
export function createDefaultThreeBRollSlots(
  segments: CaptionSegment[],
  primaryTrack: TrackKey = 'tinglish',
  defaultAspectRatio: VideoAspectRatio = '9:16'
): AIBRollSlot[] {
  const count = segments.length;
  const pickIndices =
    count >= 3
      ? [0, Math.floor(count * 0.45), Math.max(0, count - 2)]
      : [0, 0, 0];

  const defaultConfigs: Array<{
    slotNumber: 1 | 2 | 3;
    title: string;
    motionPreset: BRollMotionPreset;
    magicalEffect: BRollMagicalEffect;
    sfxPreset: BRollSfxPreset;
    displayLayout: BRollDisplayLayout;
    fallbackPrompt: string;
  }> = [
    {
      slotNumber: 1,
      title: 'Scene 1 · Spiritual Calm & Inner Focus',
      motionPreset: 'ken_burns_zoom',
      magicalEffect: 'all_magic',
      sfxPreset: 'none',
      displayLayout: 'cutaway',
      fallbackPrompt:
        'Cinematic golden hour Indian creator studio with warm glowing tungsten lamp, serene spiritual focus aura, floating gold and emerald light particles, shallow depth of field, 8k photorealistic',
    },
    {
      slotNumber: 2,
      title: 'Scene 2 · Compounding Wealth & Growth',
      motionPreset: 'portal_pop',
      magicalEffect: 'gold_emerald_particles',
      sfxPreset: 'none',
      displayLayout: 'pip_card',
      fallbackPrompt:
        'Futuristic glowing golden and emerald wealth compounding hologram rising above a dark luxury desk, warm volumetric light beams, cinematic bokeh, 8k photorealistic',
    },
    {
      slotNumber: 3,
      title: 'Scene 3 · Thriving Creator Community',
      motionPreset: 'pan_glide',
      magicalEffect: 'aura_burst',
      sfxPreset: 'none',
      displayLayout: 'split_backdrop',
      fallbackPrompt:
        'Vibrant creative mastermind community collaborating in a warm sunlit studio with glowing holographic connection nodes and magical golden light leaks, 8k photorealistic',
    },
  ];

  return defaultConfigs.map((cfg, idx) => {
    const seg = segments[pickIndices[idx]] || segments[0];
    const segText =
      seg?.tracks[primaryTrack]?.text ||
      seg?.tracks.tinglish?.text ||
      seg?.tracks.english?.text ||
      'Key story moment';
    const startTime = seg ? seg.startTime : idx * 4;
    const endTime = seg ? seg.endTime : startTime + 2.8;
    const prompt = `${cfg.fallbackPrompt}. Context from script: "${segText}"`;
    const imageDataUrl = synthesizeStudioBRollArtworkDataUrl(
      prompt,
      defaultAspectRatio,
      cfg.slotNumber,
      cfg.title
    );

    return {
      id: `ai-broll-slot-${cfg.slotNumber}`,
      slotNumber: cfg.slotNumber,
      title: cfg.title,
      scriptContext: segText,
      prompt,
      aspectRatio: defaultAspectRatio,
      imageDataUrl,
      isGenerating: false,
      enabled: true,
      linkedSegmentId: seg?.id,
      startTime,
      endTime,
      displayLayout: cfg.displayLayout,
      motionPreset: cfg.motionPreset,
      magicalEffect: cfg.magicalEffect,
      sfxPreset: cfg.sfxPreset,
    };
  });
}

/**
 * Analyzes the created caption script using Gemini 2.5 Flash and returns 3 tailored AIBRollSlot configurations.
 */
export async function analyzeScriptForThreeBRolls(
  segments: CaptionSegment[],
  primaryTrack: TrackKey,
  defaultAspectRatio: VideoAspectRatio = '9:16',
  currentSlots?: AIBRollSlot[]
): Promise<AIBRollSlot[]> {
  if (!segments || segments.length === 0) {
    return createDefaultThreeBRollSlots([], primaryTrack, defaultAspectRatio);
  }

  const transcriptPayload = segments.map((s) => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    text:
      s.tracks[primaryTrack]?.text ||
      s.tracks.english?.text ||
      s.tracks.tinglish?.text ||
      '',
  }));

  try {
    // 1. Try client-side Gemini 2.5 Flash first if key is available in environment
    const clientAi = getClientGenAI();
    let plannedScenes: Array<{
      slotNumber: number;
      title: string;
      scriptContext: string;
      prompt: string;
      linkedSegmentId: string;
      startTime?: number;
      endTime?: number;
      motionPreset?: string;
      magicalEffect?: string;
      sfxPreset?: string;
    }> = [];

    if (clientAi) {
      try {
        const res = await clientAi.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Analyze this short-form video caption script and plan exactly THREE (3) contextually apt, cinematic AI B-Roll image scenes distributed across the video (Scene 1: Early Hook, Scene 2: Mid-Video Core Concept, Scene 3: Climax / Takeaway).
For each of the 3 scenes, pick the best matching caption segment ID from the input list, write a vivid, photorealistic, high-contrast visual image generation prompt (no text inside the image) that illustrates what the speaker is talking about in that moment, and recommend an entrance animation and magical effect.

Caption Script:
${JSON.stringify(transcriptPayload)}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      slotNumber: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      scriptContext: { type: Type.STRING },
                      prompt: { type: Type.STRING },
                      linkedSegmentId: { type: Type.STRING },
                      startTime: { type: Type.NUMBER },
                      endTime: { type: Type.NUMBER },
                      motionPreset: { type: Type.STRING },
                      magicalEffect: { type: Type.STRING },
                      sfxPreset: { type: Type.STRING },
                    },
                    required: [
                      'slotNumber',
                      'title',
                      'scriptContext',
                      'prompt',
                      'linkedSegmentId',
                    ],
                  },
                },
              },
              required: ['scenes'],
            },
          },
        });
        if (res.text) {
          const parsed = JSON.parse(res.text);
          if (Array.isArray(parsed.scenes)) {
            plannedScenes = parsed.scenes;
          }
        }
      } catch {
        // Fallback to server endpoint below
      }
    }

    if (plannedScenes.length === 0) {
      const response = await fetch('/api/broll/analyze-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: transcriptPayload,
          defaultAspectRatio,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.scenes) && data.scenes.length > 0) {
          plannedScenes = data.scenes;
        }
      }
    }

    const baseDefaults = createDefaultThreeBRollSlots(
      segments,
      primaryTrack,
      defaultAspectRatio
    );

    if (plannedScenes.length === 0) {
      return baseDefaults;
    }

    return ([1, 2, 3] as const).map((slotNum, idx) => {
      const apiScene = plannedScenes[idx] || plannedScenes[0];
      const existingSlot = currentSlots?.find((s) => s.slotNumber === slotNum);
      const matchedSeg =
        segments.find((s) => s.id === apiScene?.linkedSegmentId) ||
        segments.find(
          (s) => s.id === baseDefaults[idx]?.linkedSegmentId
        ) ||
        segments[Math.min(segments.length - 1, idx)];

      const ratio = existingSlot?.aspectRatio || defaultAspectRatio;
      const title = apiScene?.title || baseDefaults[idx].title;
      const prompt = apiScene?.prompt || baseDefaults[idx].prompt;
      const scriptContext =
        apiScene?.scriptContext ||
        matchedSeg?.tracks[primaryTrack]?.text ||
        baseDefaults[idx].scriptContext;

      return {
        id: `ai-broll-slot-${slotNum}`,
        slotNumber: slotNum,
        title,
        scriptContext,
        prompt,
        aspectRatio: ratio,
        imageDataUrl:
          existingSlot?.imageDataUrl ||
          synthesizeStudioBRollArtworkDataUrl(prompt, ratio, slotNum, title),
        isGenerating: false,
        enabled: true,
        linkedSegmentId: matchedSeg?.id,
        startTime: matchedSeg ? matchedSeg.startTime : baseDefaults[idx].startTime,
        endTime: matchedSeg ? matchedSeg.endTime : baseDefaults[idx].endTime,
        displayLayout:
          existingSlot?.displayLayout || baseDefaults[idx].displayLayout,
        motionPreset:
          existingSlot?.motionPreset || baseDefaults[idx].motionPreset,
        magicalEffect:
          existingSlot?.magicalEffect || baseDefaults[idx].magicalEffect,
        sfxPreset: existingSlot?.sfxPreset || baseDefaults[idx].sfxPreset,
      };
    });
  } catch {
    return createDefaultThreeBRollSlots(
      segments,
      primaryTrack,
      defaultAspectRatio
    );
  }
}

/**
 * Generates an AI B-Roll image using Gemini (`gemini-2.5-flash-image`) in the user-selected
 * aspect ratio ('9:16' | '1:1' | '16:9') and preloads it into the 60fps Canvas image cache.
 */
export async function generateBRollImageWithGemini(
  prompt: string,
  aspectRatio: VideoAspectRatio = '9:16',
  slotNumber: 1 | 2 | 3 = 1,
  title = 'AI B-Roll Visual'
): Promise<string> {
  const validRatio: VideoAspectRatio =
    aspectRatio === '1:1' || aspectRatio === '16:9' || aspectRatio === '9:16'
      ? aspectRatio
      : '9:16';

  const fullPrompt = `${prompt}. Cinematic B-roll photography, dramatic volumetric lighting, rich color grading, gold and emerald highlights, 8k photorealistic, strictly no text or letters.`;

  // 1. Try direct client-side Gemini 2.5 Flash Image SDK call first
  const clientAi = getClientGenAI();
  if (clientAi) {
    try {
      const response = await clientAi.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: validRatio,
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          const dataUrl = `data:${mime};base64,${part.inlineData.data}`;
          await preloadBRollImageElement(dataUrl);
          return dataUrl;
        }
      }
    } catch {
      // Fall through to server proxy route
    }
  }

  // 2. Call server endpoint `/api/broll/generate-image`
  try {
    const res = await fetch('/api/broll/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: fullPrompt,
        aspectRatio: validRatio,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.imageDataUrl) {
        await preloadBRollImageElement(data.imageDataUrl);
        return data.imageDataUrl;
      }
    }
  } catch {
    // Fall through to synthesized high-res canvas artwork
  }

  // 3. Resilient High-Resolution Studio B-Roll Canvas Synthesizer (guarantees image creation in exact ratio)
  const fallbackUrl = synthesizeStudioBRollArtworkDataUrl(
    prompt,
    validRatio,
    slotNumber,
    title
  );
  await preloadBRollImageElement(fallbackUrl);
  return fallbackUrl;
}

/**
 * Web Audio API synthesizer for Magical B-Roll Sound Effects:
 * - 'magical_chime' (crystalline harmonic shimmer arpeggio)
 * - 'cinematic_whoosh' (filtered airy transition sweep)
 * - 'bass_impact' (sub-bass cinema boom)
 */
let magicalAudioCtx: AudioContext | null = null;

export function playMagicalBRollSoundEffect(
  preset: BRollSfxPreset,
  volume = 0.45
): void {
  if (preset === 'none' || typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    if (!magicalAudioCtx) {
      magicalAudioCtx = new AudioCtx();
    }
    if (magicalAudioCtx.state === 'suspended') {
      magicalAudioCtx.resume();
    }

    const now = magicalAudioCtx.currentTime;
    const safeVol = Math.max(0.05, Math.min(1, volume));

    if (preset === 'magical_chime') {
      // Crystalline 4-note harmonic sparkle chime
      const notes = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
      notes.forEach((freq, idx) => {
        if (!magicalAudioCtx) return;
        const osc = magicalAudioCtx.createOscillator();
        const gain = magicalAudioCtx.createGain();
        osc.type = 'sine';
        const startT = now + idx * 0.055;
        osc.frequency.setValueAtTime(freq, startT);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, startT + 0.45);
        gain.gain.setValueAtTime(0.001, startT);
        gain.gain.linearRampToValueAtTime(safeVol * 0.28, startT + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0008, startT + 0.55);
        osc.connect(gain);
        gain.connect(magicalAudioCtx.destination);
        osc.start(startT);
        osc.stop(startT + 0.58);
      });
    } else if (preset === 'cinematic_whoosh') {
      // Filtered noise + pitch sweep whoosh
      const osc = magicalAudioCtx.createOscillator();
      const gain = magicalAudioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.42);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(safeVol * 0.42, now + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
      osc.connect(gain);
      gain.connect(magicalAudioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.46);
    } else if (preset === 'bass_impact') {
      // Deep sub-bass cinema impact boom
      const osc = magicalAudioCtx.createOscillator();
      const gain = magicalAudioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(115, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 0.55);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(safeVol * 0.6, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.62);
      osc.connect(gain);
      gain.connect(magicalAudioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    }
  } catch {
    // Ignore audio context autoplay restrictions
  }
}
