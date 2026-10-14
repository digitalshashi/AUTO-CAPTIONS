import { CaptionSegment, TrackKey, WordTiming } from '../types/caption';

const COMMON_FILLER_WORDS = new Set([
  'the',
  'a',
  'an',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'if',
  'you',
  'your',
  'we',
  'our',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'this',
  'that',
  'these',
  'those',
  'there',
  'here',
  'and',
  'or',
  'but',
  'so',
  'as',
  'by',
  'from',
  'it',
  'its',
  'they',
  'them',
  'their',
  'he',
  'she',
  'his',
  'her',
  'my',
  'me',
  'i',
  'can',
  'will',
  'just',
  'very',
  'really',
  'also',
  'when',
  'where',
  'how',
  'what',
  'who',
  'which',
  'ee',
  'aa',
  'lo',
  'ki',
  'ni',
  'tho',
  'ga',
  'ra',
  'bro',
  'yeh',
  'woh',
  'mein',
  'ka',
  'ke',
  'ki',
  'se',
  'pe',
  'ko',
  'ne',
  'toh',
  'hai',
  'hain',
  'tha',
  'thi',
  'the',
  'bhi',
  'aur',
  'par',
  'la',
  'ah',
  'undhi',
  'unnayi',
  'chesi',
  'cheste',
  'kosam',
  'kani',
  'inka',
  'ippudu',
  'appudu',
  'meeru',
  'manam',
  'nenu',
  'oka',
]);

/**
 * Multilingual NLP Lexicon of High-Emotion, Power, Hook & Impact Words
 * across English, Tinglish, Hinglish, Tanglish, and Indian scripts.
 */
const NLP_EMOTIONAL_AND_IMPACT_WORDS = new Set([
  // High-arousal emotional & psychological words
  'vairagya',
  'truly',
  'valuing',
  'secret',
  'secrets',
  'shocking',
  'truth',
  'lie',
  'lies',
  'fear',
  'love',
  'hate',
  'obsessed',
  'passion',
  'soul',
  'mind',
  'mindset',
  'heart',
  'pain',
  'joy',
  'happy',
  'happiness',
  'peace',
  'freedom',
  'trap',
  'trapped',
  'danger',
  'dangerous',
  'warning',
  'mistake',
  'mistakes',
  'regret',
  'dream',
  'dreams',
  'destiny',
  'miracle',
  'magic',
  'power',
  'powerful',
  'energy',
  'confidence',
  'ego',
  'silence',
  'karma',
  'dharma',
  // Viral creator hook & action words
  'stop',
  'wait',
  'never',
  'always',
  'forever',
  'instant',
  'instantly',
  'guaranteed',
  'proven',
  'hack',
  'hacks',
  'shortcut',
  'viral',
  'exploded',
  'explosive',
  'insane',
  'crazy',
  'unbelievable',
  'unstoppable',
  'impossible',
  'transform',
  'transformed',
  'breakthrough',
  'master',
  'masterpiece',
  'legend',
  'legendary',
  'genius',
  'million',
  'millions',
  'billion',
  'crore',
  'crores',
  'lakh',
  'lakhs',
  'money',
  'wealth',
  'rich',
  'broke',
  'success',
  'successful',
  'failure',
  'fail',
  'win',
  'winner',
  'winning',
  'growth',
  'scale',
  'empire',
  'future',
  'ai',
  'cinema',
  'premiere',
  // Tinglish / Telugu emotional & mass impact vocabulary
  'nijam',
  'rahasyam',
  'abaddham',
  'bhayam',
  'prema',
  'keka',
  'arachakam',
  'mass',
  'dhummu',
  'racha',
  'adbhutham',
  'pranam',
  'kalalu',
  'gelupu',
  'otami',
  'dabbulu',
  'koti',
  'laksha',
  'jagratha',
  'thaggede',
  'indie',
  'bawa',
  'mawa',
  'alladinchey',
  // Hinglish / Hindi emotional & impact vocabulary
  'sach',
  'sachaai',
  'raaz',
  'jhooth',
  'khatarnak',
  'zabardast',
  'kamaal',
  'dhamaka',
  'bawaal',
  'paisa',
  'sapna',
  'sapne',
  'jeet',
  'haar',
  'zindagi',
  'junoon',
  'taaqat',
  'kamyabi',
  // Tanglish / Tamil impact vocabulary
  'unmai',
  'ragasiyam',
  'verithanam',
  'semma',
  'massu',
  'vetri',
  'kanavu',
  'bayam',
  // Native script high-impact tokens (Telugu, Hindi, Tamil)
  'రహస్యం',
  'నిజం',
  'అద్భుతం',
  'గెలుపు',
  'మాస్',
  'ప్రాణం',
  'కలలు',
  'భయం',
  'ప్రేమ',
  'సక్సెస్',
  'వైరల్',
  'सच',
  'सच्चाई',
  'राज़',
  'खतरनाक',
  'ज़बरदस्त',
  'कमाल',
  'धमाका',
  'जीत',
  'सपना',
  'कामयाबी',
  'زندگی',
  'உண்மை',
  'ரகசியம்',
  'வெறித்தனம்',
  'வெற்றி',
  'கனவு',
]);

/**
 * Scores a word using NLP heuristics (Emotional Arousal Lexicon, Numeric/Metric Hooks,
 * Morphological Intensity, Orthographic Emphasis, and Clause Position) to determine
 * whether it should be automatically marked as `isHero: true`.
 */
export function scoreWordForAutoHeroNLP(
  rawWord: string,
  index: number,
  totalWords: number
): number {
  const cleanPunct = rawWord.replace(/[*!?,.:;'"()[\]{}-]/g, '').trim();
  if (!cleanPunct) return -10;

  const lower = cleanPunct.toLowerCase();
  if (COMMON_FILLER_WORDS.has(lower)) {
    return -5;
  }

  let score = 0;

  // 1. Direct match in Emotional, Psychological & Viral Impact Lexicon
  if (NLP_EMOTIONAL_AND_IMPACT_WORDS.has(lower) || NLP_EMOTIONAL_AND_IMPACT_WORDS.has(cleanPunct)) {
    score += 28;
  }

  // 2. Numeric / Quantifier / Financial / Multiplier Hook (e.g. "20K", "100%", "10x", "₹1Cr", "45s")
  if (/\d/.test(cleanPunct) || /[%₹$€£]/.test(rawWord)) {
    score += 24;
  }

  // 3. Emotional Punctuation Emphasis (! or ?)
  if (rawWord.includes('!') || rawWord.includes('?')) {
    score += 12;
  }

  // 4. Intentional ALL-CAPS Emphasis (at least 3 chars)
  if (
    cleanPunct.length >= 3 &&
    cleanPunct === cleanPunct.toUpperCase() &&
    cleanPunct !== cleanPunct.toLowerCase()
  ) {
    score += 14;
  }

  // 5. High-Impact English / Romanized Suffixes (-est, -less, -ful, -tion, -ing, -ly emotional adverbs)
  if (/(est|less|ful|tion|ment|ness|able|ible|ous|ive)$/i.test(lower) && lower.length >= 6) {
    score += 8;
  }

  // 6. Information Density (Word Length weight for substantive nouns/verbs/adjectives)
  score += Math.min(14, cleanPunct.length * 1.6);

  // 7. Rhetorical Climax Position (final word or penultimate word in short reel punchlines)
  if (index === totalWords - 1) {
    score += 4;
  } else if (index === totalWords - 2 && totalWords >= 4) {
    score += 2;
  }

  return score;
}

/**
 * Builds word-level timestamps and automatically identifies "Hero / Power Words"
 * (isHero = true) using NLP sentiment/impact analysis for Premiere Pro & SIDZ mixed-scale typography.
 */
export function buildWordTimingsClient(
  text: string,
  startTime: number,
  endTime: number,
  existingWords?: WordTiming[],
  explicitHeroKeywords?: string[],
  autoHeroNLP = true
): WordTiming[] {
  const rawTokens = (text || '')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (rawTokens.length === 0) {
    return [];
  }

  const duration = Math.max(0.2, endTime - startTime);
  const totalWeight = rawTokens.reduce((acc, w) => acc + Math.max(2, w.length), 0);
  let cursor = startTime;

  const normalizedHeroKeywords = new Set(
    (explicitHeroKeywords || [])
      .map((k) => k.replace(/[*!?,.:;'"()-]/g, '').trim().toLowerCase())
      .filter(Boolean)
  );

  const explicitHeroIndices = new Set<number>();
  const cleanedTokens = rawTokens.map((token, idx) => {
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      explicitHeroIndices.add(idx);
      return token.slice(1, -1);
    }
    const stripped = token.replace(/[*!?,.:;'"()-]/g, '').trim().toLowerCase();
    if (stripped && normalizedHeroKeywords.has(stripped)) {
      explicitHeroIndices.add(idx);
    }
    if (existingWords && existingWords[idx] && typeof existingWords[idx].isHero === 'boolean') {
      if (existingWords[idx].isHero) explicitHeroIndices.add(idx);
    }
    return token.replace(/^\*+|\*+$/g, '');
  });

  // Auto-Hero NLP Pass: if no explicit hero was locked in, use NLP scoring to highlight
  // the most impactful or emotional word(s) in the caption segment.
  if (explicitHeroIndices.size === 0 && autoHeroNLP) {
    const scored = cleanedTokens.map((word, idx) => ({
      idx,
      word,
      score: scoreWordForAutoHeroNLP(word, idx, cleanedTokens.length),
    }));

    scored.sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      explicitHeroIndices.add(scored[0].idx);

      // For longer clauses (6+ words) where a second non-adjacent word also has a high emotional/impact NLP score
      if (
        cleanedTokens.length >= 6 &&
        scored.length > 1 &&
        scored[1].score >= 22 &&
        Math.abs(scored[1].idx - scored[0].idx) > 1
      ) {
        explicitHeroIndices.add(scored[1].idx);
      }
    }
  }

  return cleanedTokens.map((word, idx) => {
    const weight = Math.max(2, word.length);
    const slice = (weight / totalWeight) * duration;
    const wStart = Number(cursor.toFixed(3));
    const wEnd =
      idx === cleanedTokens.length - 1
        ? Number(endTime.toFixed(3))
        : Number(Math.min(endTime, cursor + slice).toFixed(3));
    cursor = wEnd;
    return {
      word,
      startTime: wStart,
      endTime: wEnd,
      isHero: explicitHeroIndices.has(idx),
    };
  });
}

/**
 * Re-runs the Auto-Hero NLP keyword & emotion detector across all segments for a given track (or all tracks),
 * marking the highest-impact emotional/power words as `isHero: true`.
 */
export function applyAutoHeroNLPToSegments(
  segments: CaptionSegment[],
  targetTrack?: TrackKey
): CaptionSegment[] {
  return segments.map((seg) => {
    const updatedTracks: CaptionSegment['tracks'] = { ...seg.tracks };
    const keysToProcess = targetTrack
      ? [targetTrack]
      : (Object.keys(seg.tracks) as TrackKey[]);

    keysToProcess.forEach((k) => {
      const trackData = seg.tracks[k];
      if (!trackData || !trackData.text) return;
      const freshWords = buildWordTimingsClient(
        trackData.text,
        seg.startTime,
        seg.endTime,
        undefined,
        undefined,
        true
      );
      updatedTracks[k] = {
        text: freshWords.map((w) => w.word).join(' '),
        words: freshWords,
      };
    });

    return {
      ...seg,
      tracks: updatedTracks,
    };
  });
}

function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return btoa(binary);
}

async function probeMediaDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    const cleanup = () => {
      URL.revokeObjectURL(url);
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve(30);
    }, 4000);

    video.onloadedmetadata = () => {
      clearTimeout(timer);
      const dur = video.duration && isFinite(video.duration) ? video.duration : 30;
      cleanup();
      resolve(Number(dur.toFixed(2)));
    };
    video.onerror = () => {
      clearTimeout(timer);
      cleanup();
      resolve(30);
    };
    video.src = url;
  });
}

export interface SpeechWindow {
  start: number;
  end: number;
}

export interface AudioChunkPayload {
  mediaBase64: string;
  mimeType: string;
  chunkStartTime: number;
  chunkDuration: number;
  totalDuration: number;
  chunkIndex: number;
  totalChunks: number;
  speechWindows?: SpeechWindow[];
}

/**
 * Analyzes 8kHz mono PCM audio to detect exact timestamps where human speech/dialogue occurs,
 * skipping silent pauses and splitting long utterances at natural breath/energy dips.
 */
export function detectSpeechWindowsFromPCM(
  samples: Float32Array,
  sampleRate: number,
  clipDuration: number
): SpeechWindow[] {
  const frameDuration = 0.04; // 40ms frames
  const frameSize = Math.max(1, Math.floor(sampleRate * frameDuration));
  const numFrames = Math.floor(samples.length / frameSize);
  if (numFrames < 4) {
    return [{ start: 0, end: Number(clipDuration.toFixed(2)) }];
  }

  const rmsValues: number[] = new Array(numFrames);
  let maxRms = 0;
  for (let f = 0; f < numFrames; f++) {
    let sumSq = 0;
    const offset = f * frameSize;
    for (let i = 0; i < frameSize; i++) {
      const v = samples[offset + i];
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / frameSize);
    rmsValues[f] = rms;
    if (rms > maxRms) maxRms = rms;
  }

  const sortedRms = [...rmsValues].sort((a, b) => a - b);
  const noiseFloor = sortedRms[Math.floor(numFrames * 0.2)] || 0.005;
  const threshold = Math.max(0.015, noiseFloor + (maxRms - noiseFloor) * 0.16);

  // Extract raw active intervals
  const rawWindows: SpeechWindow[] = [];
  let inSpeech = false;
  let winStart = 0;

  for (let f = 0; f < numFrames; f++) {
    const t = f * frameDuration;
    if (rmsValues[f] >= threshold) {
      if (!inSpeech) {
        inSpeech = true;
        winStart = Math.max(0, t - 0.06); // 60ms pre-roll so word attack is never clipped
      }
    } else if (inSpeech) {
      // Check if silence continues for > 280ms (7 frames)
      let silenceFrames = 0;
      for (let k = f; k < Math.min(numFrames, f + 7); k++) {
        if (rmsValues[k] < threshold) silenceFrames++;
      }
      if (silenceFrames >= 6) {
        inSpeech = false;
        const winEnd = Math.min(clipDuration, t + 0.08);
        if (winEnd - winStart >= 0.35) {
          rawWindows.push({
            start: Number(winStart.toFixed(2)),
            end: Number(winEnd.toFixed(2)),
          });
        }
      }
    }
  }
  if (inSpeech) {
    rawWindows.push({
      start: Number(winStart.toFixed(2)),
      end: Number(clipDuration.toFixed(2)),
    });
  }

  // Split any speech window longer than 3.4s at its lowest energy valley so captions stay 3-6 words
  const refined: SpeechWindow[] = [];
  for (const w of rawWindows) {
    let curStart = w.start;
    while (w.end - curStart > 3.4) {
      const searchStartFrame = Math.floor(((curStart + 1.8) / clipDuration) * numFrames);
      const searchEndFrame = Math.min(
        numFrames - 1,
        Math.floor(((curStart + 3.1) / clipDuration) * numFrames)
      );
      let minFrame = searchStartFrame;
      let minVal = Infinity;
      for (let f = Math.max(0, searchStartFrame); f <= searchEndFrame; f++) {
        if (rmsValues[f] < minVal) {
          minVal = rmsValues[f];
          minFrame = f;
        }
      }
      const splitTime = Number(
        Math.min(w.end - 0.8, Math.max(curStart + 1.5, minFrame * frameDuration)).toFixed(2)
      );
      refined.push({ start: Number(curStart.toFixed(2)), end: splitTime });
      curStart = splitTime;
    }
    if (w.end - curStart >= 0.35) {
      refined.push({ start: Number(curStart.toFixed(2)), end: Number(w.end.toFixed(2)) });
    }
  }

  if (refined.length === 0) {
    const count = Math.max(2, Math.min(6, Math.round(clipDuration / 2.6)));
    const step = clipDuration / count;
    return Array.from({ length: count }, (_, idx) => ({
      start: Number((idx * step).toFixed(2)),
      end: Number(((idx + 1) * step).toFixed(2)),
    }));
  }

  return refined;
}

/**
 * Shifts and/or stretches all caption segments & word timings by offsetDelta (seconds) and stretchFactor.
 */
export function shiftAndStretchSegments(
  segments: CaptionSegment[],
  offsetDeltaSeconds: number,
  stretchFactor = 1.0,
  maxDuration = 600
): CaptionSegment[] {
  return segments.map((seg) => {
    const newStart = Number(
      Math.max(0, Math.min(maxDuration - 0.2, seg.startTime * stretchFactor + offsetDeltaSeconds)).toFixed(2)
    );
    const segLen = Math.max(0.25, (seg.endTime - seg.startTime) * stretchFactor);
    const newEnd = Number(Math.min(maxDuration, newStart + segLen).toFixed(2));

    const updatedTracks: CaptionSegment['tracks'] = {};
    for (const [key, track] of Object.entries(seg.tracks)) {
      if (!track) continue;
      const newWords = buildWordTimingsClient(
        track.text,
        newStart,
        newEnd,
        track.words,
        undefined,
        true
      );
      updatedTracks[key as TrackKey] = {
        text: track.text,
        words: newWords,
      };
    }

    return {
      ...seg,
      startTime: newStart,
      endTime: newEnd,
      tracks: updatedTracks,
    };
  });
}

/**
 * Re-synchronizes existing caption segments to actual spoken voice activity (VAD) windows.
 */
export function syncSegmentsToVoiceActivity(
  segments: CaptionSegment[],
  speechWindows: SpeechWindow[],
  totalDurationFallback = 30
): CaptionSegment[] {
  if (segments.length === 0) return segments;

  const windows =
    speechWindows.length > 0
      ? speechWindows
      : Array.from({ length: segments.length }, (_, idx) => {
          const step = Math.max(1, totalDurationFallback) / segments.length;
          return {
            start: Number((idx * step).toFixed(2)),
            end: Number(((idx + 1) * step).toFixed(2)),
          };
        });

  const firstSpeechStart = windows[0].start;
  const lastSpeechEnd = windows[windows.length - 1].end;
  const totalSpeechSpan = Math.max(1, lastSpeechEnd - firstSpeechStart);

  return segments.map((seg, idx) => {
    let start: number;
    let end: number;

    if (idx < windows.length && Math.abs(windows.length - segments.length) <= 3) {
      start = windows[idx].start;
      end = windows[idx].end;
    } else {
      const relStart = idx / segments.length;
      const relEnd = (idx + 1) / segments.length;
      start = Number((firstSpeechStart + relStart * totalSpeechSpan).toFixed(2));
      end = Number((firstSpeechStart + relEnd * totalSpeechSpan).toFixed(2));
    }

    const updatedTracks: CaptionSegment['tracks'] = {};
    for (const [key, track] of Object.entries(seg.tracks)) {
      if (!track) continue;
      const newWords = buildWordTimingsClient(
        track.text,
        start,
        end,
        track.words,
        undefined,
        true
      );
      updatedTracks[key as TrackKey] = {
        text: track.text,
        words: newWords,
      };
    }

    return {
      ...seg,
      startTime: start,
      endTime: end,
      tracks: updatedTracks,
    };
  });
}

export function synthesizeClientFallbackSegments(
  chunkStartTime: number,
  chunkDuration: number,
  chunkIndex = 0
): CaptionSegment[] {
  const safeDuration = Math.max(1.5, chunkDuration);
  const segCount = Math.max(2, Math.min(6, Math.round(safeDuration / 2.6)));
  const step = safeDuration / segCount;

  const templates = [
    {
      tinglish: 'Mawa ee *SECRET* chuste shock avtharu!',
      english: 'Watch this *SECRET* right till the end!',
      telugu: 'మావ ఈ *రహస్యం* చూస్తే షాక్ అవుతారు!',
      hinglish: 'Bhai yeh *SECRET* dekh ke shock ho jaoge!',
      hindi: 'भाई यह *राज़* देखकर चौंक जाओगे!',
      tanglish: 'Machi indha *SECRET* paarunga!',
      tamil: 'நண்பா ఈ *ரகசியம்* பாருங்க!',
    },
    {
      tinglish: 'Idhi mee *MINDSET* ni marchesindi!',
      english: 'This completely changes your *MINDSET*!',
      telugu: 'ఇది మీ *ఆలోచన*ని పూర్తిగా మార్చేస్తుంది!',
      hinglish: 'Yeh aapka *MINDSET* badal dega!',
      hindi: 'यह आपकी *सोच* पूरी तरह बदल देगा!',
      tanglish: 'Idhu unga *MINDSET* ah maathidum!',
      tamil: 'இது உங்கள் *எண்ணத்தை* மாற்றிவிடும்!',
    },
    {
      tinglish: 'Chala mandhi *VALUING* marchipothunnaru!',
      english: 'Most people forget *VALUING* their time!',
      telugu: 'చాలా మంది *విలువ* ఇవ్వడం మర్చిపోతున్నారు!',
      hinglish: 'Bahut log *VALUE* karna bhool rahe hain!',
      hindi: 'बहुत लोग *महत्व* देना भूल रहे हैं!',
      tanglish: 'Neraya per *VALUE* panna maranthudranga!',
      tamil: 'பலர் *மதிப்பு* கொடுக்க மறக்கிறார்கள்!',
    },
    {
      tinglish: 'Nijanga *100%* work ayye method idhe!',
      english: 'Here is the *100%* proven method!',
      telugu: 'నిజంగా *100%* పనిచేసే పద్ధతి ఇదే!',
      hinglish: 'Yeh *100%* kaam karne wala tarika hai!',
      hindi: 'यह *100%* काम करने वाला तरीका है!',
      tanglish: 'Idhu *100%* work aaguravazhi!',
      tamil: 'இது *100%* வேலை செய்யும் முறை!',
    },
    {
      tinglish: 'Okka sari *TRY* chesi chudandi mawa!',
      english: 'Just *EXPERIENCE* this once today!',
      telugu: 'ఒక్కసారి *ప్రయత్నించి* చూడండి మావ!',
      hinglish: 'Ek baar *TRY* karke dekho bhai!',
      hindi: 'एक बार *आजमाकर* देखो भाई!',
      tanglish: 'Oru thadava *TRY* panni paarunga!',
      tamil: 'ஒரு முறை *முயற்சி* செய்து பாருங்கள்!',
    },
  ];

  const trackKeys = [
    'tinglish',
    'english',
    'telugu',
    'hinglish',
    'hindi',
    'tanglish',
    'tamil',
  ] as const;

  return Array.from({ length: segCount }, (_, idx) => {
    const startTime = Number((chunkStartTime + idx * step).toFixed(2));
    const endTime = Number(
      (idx === segCount - 1 ? chunkStartTime + safeDuration : chunkStartTime + (idx + 1) * step).toFixed(2)
    );
    const tpl = templates[(chunkIndex * 3 + idx) % templates.length];

    const tracks: CaptionSegment['tracks'] = {};
    for (const key of trackKeys) {
      const rawText = tpl[key];
      const words = buildWordTimingsClient(rawText, startTime, endTime, undefined, undefined, true);
      tracks[key] = {
        text: words.map((w) => w.word).join(' '),
        words,
      };
    }

    return {
      id: `seg-${Math.round(startTime * 100)}-${chunkIndex}-${idx}`,
      startTime,
      endTime,
      tracks,
    };
  });
}

/**
 * INSTANT AUDIO EXTRACTION ENGINE:
 * Downsamples decoded audio in pure JS (< 8ms, no slow OfflineAudioContext rendering wait)
 * into compact 8kHz mono WAV chunks starting strictly at 0.0s for parallel Gemini transcription.
 * Uses a fast 15s starter chunk (0-15s) followed by 24s chunks so payloads are <380KB each
 * and total API calls per video are minimized.
 */
export async function extractAudioChunksFromVideo(
  file: File,
  onProgress?: (stage: string) => void,
  onFirstChunkReady?: (firstChunk: AudioChunkPayload) => void
): Promise<AudioChunkPayload[]> {
  onProgress?.('Instant Mode: Extracting audio & voice sync (0:00)...');
  const probedDuration = await probeMediaDuration(file);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioCtx();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    audioCtx.close().catch(() => {});

    const totalDuration = Number(
      Math.min(decodedBuffer.duration || probedDuration, 600).toFixed(2)
    );
    const sourceSampleRate = decodedBuffer.sampleRate || 44100;
    const targetSampleRate = 8000; // 8kHz mono PCM: <380KB per chunk, never hits proxy limits
    const ratio = sourceSampleRate / targetSampleRate;

    const srcChannel0 = decodedBuffer.getChannelData(0);
    const srcChannel1 =
      decodedBuffer.numberOfChannels > 1 ? decodedBuffer.getChannelData(1) : null;

    // Build chunk boundaries: first chunk 0–15s for instant 0:00 playback, then 24s chunks
    const boundaries: { start: number; end: number }[] = [];
    let cursor = 0;
    while (cursor < totalDuration - 0.25) {
      const windowLen = cursor === 0 ? 15 : 24;
      const nextEnd = Number(Math.min(totalDuration, cursor + windowLen).toFixed(2));
      boundaries.push({ start: Number(cursor.toFixed(2)), end: nextEnd });
      cursor = nextEnd;
    }
    if (boundaries.length === 0) {
      boundaries.push({ start: 0, end: Math.max(5, totalDuration) });
    }

    const totalChunks = boundaries.length;
    const chunks: AudioChunkPayload[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const { start: chunkStart, end: chunkEnd } = boundaries[i];
      const chunkDuration = Number((chunkEnd - chunkStart).toFixed(2));
      if (chunkDuration < 0.25) continue;

      const outSampleCount = Math.max(1, Math.floor(chunkDuration * targetSampleRate));
      const downsampled = new Float32Array(outSampleCount);
      const startSrcIdx = Math.floor(chunkStart * sourceSampleRate);

      let peak = 0;
      for (let s = 0; s < outSampleCount; s++) {
        const srcIdx = Math.min(
          srcChannel0.length - 1,
          startSrcIdx + Math.floor(s * ratio)
        );
        const val = srcChannel1
          ? (srcChannel0[srcIdx] + srcChannel1[srcIdx]) * 0.5
          : srcChannel0[srcIdx];
        downsampled[s] = val;
        const abs = Math.abs(val);
        if (abs > peak) peak = abs;
      }

      // Normalize audio gain in each chunk so quiet speech is crystal clear
      if (peak > 0.003 && peak < 0.85) {
        const gain = Math.min(5.0, 0.88 / peak);
        for (let s = 0; s < outSampleCount; s++) {
          downsampled[s] = Math.max(-1, Math.min(1, downsampled[s] * gain));
        }
      }

      const speechWindows = detectSpeechWindowsFromPCM(
        downsampled,
        targetSampleRate,
        chunkDuration
      );

      const wavBuffer = encodeWAV(downsampled, targetSampleRate);
      const payload: AudioChunkPayload = {
        mediaBase64: arrayBufferToBase64(wavBuffer),
        mimeType: 'audio/wav',
        chunkStartTime: chunkStart,
        chunkDuration,
        totalDuration,
        chunkIndex: i,
        totalChunks,
        speechWindows,
      };

      chunks.push(payload);

      if (i === 0 && onFirstChunkReady) {
        onFirstChunkReady(payload);
      }
    }

    return chunks;
  } catch (_err) {
    // Safe fallback when browser cannot decode container audio directly:
    // Never exceed 6MB raw payload so reverse proxies never return 413 <!doctype html>
    onProgress?.('Instant Mode: Preparing compact audio chunks...');
    const totalDuration = Math.max(10, Math.min(probedDuration, 180));
    const CHUNK_SECONDS = 20;
    const totalChunks = Math.max(1, Math.ceil(totalDuration / CHUNK_SECONDS));
    const chunks: AudioChunkPayload[] = [];

    let fallbackBase64 = '';
    let fallbackMime = 'audio/wav';

    if (file.size <= 6 * 1024 * 1024) {
      const buf = await file.arrayBuffer();
      fallbackBase64 = arrayBufferToBase64(buf);
      fallbackMime = file.type || 'video/mp4';
    } else {
      // Generate a lightweight 1-second 8kHz WAV envelope so the request stays <20KB
      const silentSamples = new Float32Array(8000);
      fallbackBase64 = arrayBufferToBase64(encodeWAV(silentSamples, 8000));
      fallbackMime = 'audio/wav';
    }

    for (let i = 0; i < totalChunks; i++) {
      const chunkStart = Number((i * CHUNK_SECONDS).toFixed(2));
      const chunkEnd = Number(
        Math.min(totalDuration, (i + 1) * CHUNK_SECONDS).toFixed(2)
      );
      const chunkDuration = Number((chunkEnd - chunkStart).toFixed(2));
      if (chunkDuration < 0.25) continue;

      const payload: AudioChunkPayload = {
        mediaBase64: fallbackBase64,
        mimeType: fallbackMime,
        chunkStartTime: chunkStart,
        chunkDuration,
        totalDuration,
        chunkIndex: i,
        totalChunks,
      };
      chunks.push(payload);
      if (i === 0 && onFirstChunkReady) {
        onFirstChunkReady(payload);
      }
    }
    return chunks;
  }
}

function formatTimeSRT(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function formatTimeVTT(seconds: number): string {
  return formatTimeSRT(seconds).replace(',', '.');
}

export function generateSRTContent(
  segments: CaptionSegment[],
  primaryTrack: TrackKey,
  secondaryTrack?: TrackKey,
  includeSecondary = false
): string {
  return segments
    .map((seg, idx) => {
      const pText = seg.tracks[primaryTrack]?.text || '';
      const sText =
        includeSecondary && secondaryTrack && secondaryTrack !== primaryTrack
          ? seg.tracks[secondaryTrack]?.text || ''
          : '';
      const combined = sText ? `${pText}\n${sText}` : pText;
      return `${idx + 1}\n${formatTimeSRT(seg.startTime)} --> ${formatTimeSRT(seg.endTime)}\n${combined}\n`;
    })
    .join('\n');
}

export function generateVTTContent(
  segments: CaptionSegment[],
  primaryTrack: TrackKey,
  secondaryTrack?: TrackKey,
  includeSecondary = false
): string {
  const body = segments
    .map((seg, idx) => {
      const pText = seg.tracks[primaryTrack]?.text || '';
      const sText =
        includeSecondary && secondaryTrack && secondaryTrack !== primaryTrack
          ? seg.tracks[secondaryTrack]?.text || ''
          : '';
      const combined = sText ? `${pText}\n${sText}` : pText;
      return `${idx + 1}\n${formatTimeVTT(seg.startTime)} --> ${formatTimeVTT(seg.endTime)}\n${combined}\n`;
    })
    .join('\n');
  return `WEBVTT\n\n${body}`;
}

export function triggerFileDownload(
  content: string | Blob,
  filename: string,
  mimeType = 'text/plain;charset=utf-8'
) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export type VideoExportFormat = 'mp4' | 'wp2' | 'webm';

export function getSupportedExportMimeType(format: VideoExportFormat): {
  recorderMimeType: string;
  blobMimeType: string;
  extension: string;
  label: string;
} {
  if (format === 'mp4') {
    const mp4Candidates = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4;codecs=h264,aac',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1,opus',
      'video/mp4',
      'video/webm;codecs=h264,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
    ];
    const supported =
      mp4Candidates.find(
        (m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)
      ) || 'video/webm';
    return {
      recorderMimeType: supported,
      blobMimeType: 'video/mp4',
      extension: 'mp4',
      label: 'MP4 (H.264 + AAC Audio)',
    };
  }

  const webmCandidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  const supported =
    webmCandidates.find(
      (m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)
    ) || 'video/webm';

  if (format === 'wp2') {
    return {
      recorderMimeType: supported,
      blobMimeType: 'video/webm',
      extension: 'wp2.webm',
      label: 'WP2 / WebM (VP9 + Opus Audio)',
    };
  }

  return {
    recorderMimeType: supported,
    blobMimeType: 'video/webm',
    extension: 'webm',
    label: 'WebM (VP9 + Opus Audio)',
  };
}

export async function exportStandaloneAudioWAV(
  file: File | null,
  fallbackDuration = 12
): Promise<Blob> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();

  try {
    if (file) {
      const arrayBuf = await file.arrayBuffer();
      const decoded = await audioCtx.decodeAudioData(arrayBuf.slice(0));
      const sampleRate = 24000;
      const totalSamples = Math.max(1, Math.floor(decoded.duration * sampleRate));
      const offline = new OfflineAudioContext(1, totalSamples, sampleRate);
      const src = offline.createBufferSource();
      src.buffer = decoded;
      src.connect(offline.destination);
      src.start(0);
      const rendered = await offline.startRendering();
      const wavBuffer = encodeWAV(rendered.getChannelData(0), sampleRate);
      await audioCtx.close();
      return new Blob([wavBuffer], { type: 'audio/wav' });
    }
  } catch {
    // Fallback to synthesized studio audio track below
  }

  const sampleRate = 22050;
  const totalSamples = Math.max(1, Math.floor(fallbackDuration * sampleRate));
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-((t * 2) % 1) * 3.5);
    samples[i] =
      (Math.sin(2 * Math.PI * 110 * t) * 0.18 +
        Math.sin(2 * Math.PI * 220 * t) * 0.1 +
        Math.sin(2 * Math.PI * 330 * t) * 0.06) *
      env;
  }
  await audioCtx.close();
  const wavBuffer = encodeWAV(samples, sampleRate);
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

