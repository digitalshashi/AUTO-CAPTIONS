/**
 * Open-Source Web Audio Sound Effects (SFX) & AI B-Roll Context Engine
 * Synthesizes zero-latency, royalty-free studio sound effects (Whoosh, Bell, Pop, Cash, Riser, Impact)
 * and manages context-aware B-Roll visual cutaways.
 */

export type SoundEffectType =
  | 'whoosh'
  | 'bell'
  | 'pop'
  | 'cash'
  | 'riser'
  | 'impact'
  | 'shutter';

export interface SoundEffectPreset {
  id: SoundEffectType;
  name: string;
  category: string;
  durationLabel: string;
  description: string;
  triggerKeywords: string[];
}

export interface BRollClipItem {
  id: string;
  segmentId: string;
  title: string;
  prompt: string;
  theme: 'wealth' | 'mindset' | 'community' | 'tech' | 'cinema';
  startTime: number;
  endTime: number;
  motionEffect: 'ken-burns-zoom-in' | 'pan-right' | 'flash-pop' | 'split-pip';
  linkedSfx: SoundEffectType;
  customImageUrl?: string;
}

export const OPEN_SOURCE_SFX_LIBRARY: SoundEffectPreset[] = [
  {
    id: 'whoosh',
    name: 'Air Whoosh Transition',
    category: 'Transitions',
    durationLabel: '0.35s',
    description: 'Smooth aerodynamic swipe when a caption slides up or in',
    triggerKeywords: ['unnadhi', 'antha', 'vaalla', 'slide', 'reach'],
  },
  {
    id: 'bell',
    name: 'Crystal Notification Bell',
    category: 'Emphasis',
    durationLabel: '0.60s',
    description: 'Bright harmonic bell chime on key insight or emphasized words',
    triggerKeywords: ['vairagya', 'nijanga', 'truth', 'secret', 'important', 'evaru'],
  },
  {
    id: 'pop',
    name: 'Bubble Word Pop',
    category: 'Captions',
    durationLabel: '0.18s',
    description: 'Crisp organic pop for word-by-word kinetic text reveals',
    triggerKeywords: ['daggara', 'ekkuva', 'friends', 'product'],
  },
  {
    id: 'cash',
    name: 'Cha-Ching Wealth Bell',
    category: 'Context / B-Roll',
    durationLabel: '0.55s',
    description: 'Metallic coin & register chime for money, paisalu, or revenue words',
    triggerKeywords: ['paisalu', 'roopaayalu', '20,000', 'money', 'crore', 'valuing'],
  },
  {
    id: 'riser',
    name: 'Cinematic Whoosh Riser',
    category: 'B-Roll Cutaway',
    durationLabel: '0.75s',
    description: 'Upward pitch sweep that builds anticipation into a B-roll frame',
    triggerKeywords: ['10x', 'viral', 'masterpiece', 'ichchestaaru'],
  },
  {
    id: 'impact',
    name: 'Deep Sub Bass Drop',
    category: 'Hook / Stomp',
    durationLabel: '0.50s',
    description: 'Warm low-end cinema thump for giant hero stomp headlines',
    triggerKeywords: ['soya', 'sach', 'monk', 'unnadantaa'],
  },
];

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Plays a synthesized open-source sound effect in real time using Web Audio API.
 */
export function playOpenSourceSoundEffect(
  type: SoundEffectType,
  volume = 0.45
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.max(0.05, Math.min(1, volume)), now);
  masterGain.connect(ctx.destination);

  if (type === 'whoosh') {
    // Filtered white-noise aerodynamic whoosh
    const bufferSize = Math.floor(ctx.sampleRate * 0.36);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.16);
    filter.frequency.exponentialRampToValueAtTime(280, now + 0.35);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.01, now);
    env.gain.linearRampToValueAtTime(0.7, now + 0.14);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(env);
    env.connect(masterGain);
    noise.start(now);
    noise.stop(now + 0.36);
  } else if (type === 'bell') {
    // Crystal harmonic bell chime (fundamental + overtone)
    const freqs = [1046.5, 2093, 3135.96];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      const amp = idx === 0 ? 0.45 : idx === 1 ? 0.22 : 0.1;
      env.gain.setValueAtTime(amp, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.58 - idx * 0.12);

      osc.connect(env);
      env.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.6);
    });
  } else if (type === 'pop') {
    // Crisp pitch-envelope bubble pop
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.15);

    env.gain.setValueAtTime(0.55, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(env);
    env.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  } else if (type === 'cash') {
    // Dual high-bell wealth chime
    [1318.5, 1760].forEach((freq, i) => {
      const startOffset = i * 0.09;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + startOffset);

      env.gain.setValueAtTime(0.45, now + startOffset);
      env.gain.exponentialRampToValueAtTime(0.001, now + startOffset + 0.42);

      osc.connect(env);
      env.connect(masterGain);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + 0.44);
    });
  } else if (type === 'riser') {
    // Smooth synth pitch riser
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.65);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(2800, now + 0.65);

    env.gain.setValueAtTime(0.02, now);
    env.gain.linearRampToValueAtTime(0.38, now + 0.55);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(filter);
    filter.connect(env);
    env.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.72);
  } else if (type === 'impact' || type === 'shutter') {
    // Deep sub bass drop impact
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.44);

    env.gain.setValueAtTime(0.75, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    osc.connect(env);
    env.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }
}

/**
 * Automatically selects the best open-source SFX for a caption line based on its words.
 */
export function detectContextSfxForText(text: string): SoundEffectType {
  const lower = text.toLowerCase();
  if (
    lower.includes('paisalu') ||
    lower.includes('roopaayalu') ||
    lower.includes('20,000') ||
    lower.includes('money') ||
    lower.includes('valuing')
  ) {
    return 'cash';
  }
  if (
    lower.includes('unnadhi') ||
    lower.includes('antha') ||
    lower.includes('unnadantaa') ||
    lower.includes('ichchestaaru')
  ) {
    return 'whoosh';
  }
  if (
    lower.includes('daggara') ||
    lower.includes('evaru') ||
    lower.includes('ekkuva') ||
    lower.includes('vairagya')
  ) {
    return 'bell';
  }
  return 'pop';
}
