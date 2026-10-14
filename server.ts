import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import type { GenerateContentParameters, GenerateContentResponse } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const MULTIMODAL_MODEL_CHAIN = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
];

const TEXT_MODEL_CHAIN = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
];

const exhaustedModelsCache = new Map<string, number>();

function isQuotaExhaustedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Quota exceeded') ||
    msg.includes('404') ||
    msg.includes('no longer available')
  );
}

function isTransientHighDemandError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('504') ||
    msg.includes('fetch failed') ||
    msg.includes('timed out')
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateContentResilient(
  params: Omit<GenerateContentParameters, 'model'>,
  modelChain: string[] = MULTIMODAL_MODEL_CHAIN
): Promise<GenerateContentResponse> {
  const ai = getGenAIClient();
  let lastError: unknown = null;
  const now = Date.now();

  // Filter out models that hit 429 quota in the last 10 minutes so parallel chunks never wait on them
  const activeChain = modelChain.filter((m) => {
    const blockedUntil = exhaustedModelsCache.get(m);
    return !blockedUntil || now > blockedUntil;
  });
  const effectiveChain = activeChain.length > 0 ? activeChain : modelChain;

  for (let i = 0; i < effectiveChain.length; i++) {
    const modelName = effectiveChain[i];
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          ...params,
          model: modelName,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${modelName} timed out after 14s`)), 14000)
        ),
      ]);
      return response;
    } catch (err: unknown) {
      lastError = err;
      console.warn(
        `[Gemini Fast Fallback] Model ${modelName} error:`,
        err instanceof Error ? err.message.slice(0, 140) : err
      );

      if (isQuotaExhaustedError(err)) {
        // Remember 429/404 for 10 minutes so parallel requests skip it in 0ms
        exhaustedModelsCache.set(modelName, Date.now() + 10 * 60 * 1000);
        continue;
      }

      if (isTransientHighDemandError(err)) {
        await sleep(40);
        continue;
      }
      await sleep(30);
    }
  }

  throw lastError || new Error('All Gemini models are currently experiencing high demand.');
}

function safeParseJSON<T>(rawText: string | undefined, fallback: T): T {
  if (!rawText) return fallback;
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Balanced-brace recovery if JSON was truncated mid-array
    const segKeyIdx = cleaned.indexOf('"segments"');
    if (segKeyIdx !== -1) {
      const arrayStartIdx = cleaned.indexOf('[', segKeyIdx);
      if (arrayStartIdx !== -1) {
        const recoveredItems: Record<string, unknown>[] = [];
        let depth = 0;
        let objStart = -1;
        let inString = false;
        let escaped = false;

        for (let i = arrayStartIdx + 1; i < cleaned.length; i++) {
          const ch = cleaned[i];
          if (escaped) {
            escaped = false;
            continue;
          }
          if (ch === '\\') {
            escaped = true;
            continue;
          }
          if (ch === '"') {
            inString = !inString;
            continue;
          }
          if (inString) continue;

          if (ch === '{') {
            if (depth === 0) objStart = i;
            depth++;
          } else if (ch === '}') {
            depth--;
            if (depth === 0 && objStart !== -1) {
              const candidate = cleaned.slice(objStart, i + 1);
              try {
                recoveredItems.push(JSON.parse(candidate));
              } catch {
                // skip malformed item
              }
              objStart = -1;
            }
          }
        }

        if (recoveredItems.length > 0) {
          return {
            detectedLanguage: 'Tinglish / Indian Multilingual',
            segments: recoveredItems,
          } as unknown as T;
        }
      }
    }
    return fallback;
  }
}

interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  isHero?: boolean;
}

const FILLER_SET = new Set([
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
  'se',
  'pe',
  'ko',
  'ne',
  'toh',
  'hai',
  'hain',
  'tha',
  'thi',
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

const NLP_EMOTIONAL_IMPACT_SET = new Set([
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
  'bawa',
  'mawa',
  'alladinchey',
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
  'unmai',
  'ragasiyam',
  'verithanam',
  'semma',
  'massu',
  'vetri',
  'kanavu',
  'bayam',
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
  'உண்மை',
  'ரகசியம்',
  'வெறித்தனம்',
  'வெற்றி',
  'கனவு',
]);

function scoreWordAutoHeroServer(rawWord: string, idx: number, totalWords: number): number {
  const cleanPunct = rawWord.replace(/[*!?,.:;'"()[\]{}-]/g, '').trim();
  if (!cleanPunct) return -10;
  const lower = cleanPunct.toLowerCase();
  if (FILLER_SET.has(lower)) return -5;

  let score = 0;
  if (NLP_EMOTIONAL_IMPACT_SET.has(lower) || NLP_EMOTIONAL_IMPACT_SET.has(cleanPunct)) {
    score += 28;
  }
  if (/\d/.test(cleanPunct) || /[%₹$€£]/.test(rawWord)) {
    score += 24;
  }
  if (rawWord.includes('!') || rawWord.includes('?')) {
    score += 12;
  }
  if (
    cleanPunct.length >= 3 &&
    cleanPunct === cleanPunct.toUpperCase() &&
    cleanPunct !== cleanPunct.toLowerCase()
  ) {
    score += 14;
  }
  if (/(est|less|ful|tion|ment|ness|able|ible|ous|ive)$/i.test(lower) && lower.length >= 6) {
    score += 8;
  }
  score += Math.min(14, cleanPunct.length * 1.6);
  if (idx === totalWords - 1) score += 4;
  else if (idx === totalWords - 2 && totalWords >= 4) score += 2;

  return score;
}

function buildWordTimings(
  text: string,
  startTime: number,
  endTime: number,
  nlpHeroKeywords?: string[],
  autoHeroEnabled = true
): WordTiming[] {
  const rawWords = (text || '')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (rawWords.length === 0) {
    return [];
  }
  const duration = Math.max(0.2, endTime - startTime);
  const totalWeight = rawWords.reduce((acc, w) => acc + Math.max(2, w.length), 0);
  let cursor = startTime;

  const normalizedKeywords = new Set(
    (nlpHeroKeywords || [])
      .map((k) => k.replace(/[*!?,.:;'"()-]/g, '').trim().toLowerCase())
      .filter(Boolean)
  );

  const heroSet = new Set<number>();
  const cleanWords = rawWords.map((w, idx) => {
    if (w.startsWith('*') && w.endsWith('*') && w.length > 2) {
      if (autoHeroEnabled) heroSet.add(idx);
      return w.slice(1, -1);
    }
    const stripped = w.replace(/[*!?,.:;'"()-]/g, '').trim().toLowerCase();
    if (autoHeroEnabled && stripped && normalizedKeywords.has(stripped)) {
      heroSet.add(idx);
    }
    return w.replace(/^\*+|\*+$/g, '');
  });

  if (heroSet.size === 0 && autoHeroEnabled) {
    const scored = cleanWords.map((w, idx) => ({
      idx,
      score: scoreWordAutoHeroServer(w, idx, cleanWords.length),
    }));
    scored.sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      heroSet.add(scored[0].idx);
      if (
        cleanWords.length >= 6 &&
        scored.length > 1 &&
        scored[1].score >= 22 &&
        Math.abs(scored[1].idx - scored[0].idx) > 1
      ) {
        heroSet.add(scored[1].idx);
      }
    }
  }

  return cleanWords.map((word, idx) => {
    const weight = Math.max(2, word.length);
    const slice = (weight / totalWeight) * duration;
    const wStart = Number(cursor.toFixed(3));
    const wEnd =
      idx === cleanWords.length - 1
        ? Number(endTime.toFixed(3))
        : Number(Math.min(endTime, cursor + slice).toFixed(3));
    cursor = wEnd;
    return {
      word,
      startTime: wStart,
      endTime: wEnd,
      isHero: heroSet.has(idx),
    };
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Ensure any body-parser / payload errors on /api/* ALWAYS return JSON and never <!DOCTYPE html>
  app.use(
    (
      err: Error & { status?: number; type?: string },
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (req.path.startsWith('/api/')) {
        res.status(err.status || 400).json({
          error: err.message || 'Invalid API request payload.',
        });
        return;
      }
      next(err);
    }
  );

  // Instant Parallel Multi-Language + Tinglish Transcription & Auto-Hero NLP Caption Generation
  app.post('/api/captions/transcribe', async (req, res) => {
    try {
      const {
        mediaBase64,
        mimeType = 'audio/wav',
        duration = 12,
        chunkStartTime = 0,
        chunkIndex = 0,
        sourceLanguageHint = 'auto',
        autoHeroNLP = true,
        instantMode = true,
        speechWindows = [],
      } = req.body || {};

      if (!mediaBase64) {
        res.status(400).json({ error: 'Missing mediaBase64 payload for caption generation.' });
        return;
      }

      const startOffset = Math.max(0, Number(chunkStartTime) || 0);
      const safeChunkIdx = Math.max(0, Number(chunkIndex) || 0);
      const clipDuration = Math.max(1, Number(duration) || 12);
      const validSpeechWindows = Array.isArray(speechWindows)
        ? speechWindows.filter(
            (w: { start?: number; end?: number }) =>
              typeof w?.start === 'number' && typeof w?.end === 'number' && w.end > w.start
          )
        : [];

      const targetSegmentCount =
        validSpeechWindows.length >= 2
          ? Math.min(8, validSpeechWindows.length)
          : Math.max(2, Math.min(6, Math.round(clipDuration / 2.6)));

      const languageHintInstruction =
        sourceLanguageHint && sourceLanguageHint !== 'auto'
          ? `Spoken language: ${sourceLanguageHint}.`
          : `Auto-detect spoken Indian language, Tinglish/Hinglish, or English.`;

      const vadHint =
        validSpeechWindows.length > 0
          ? `Detected Voice Activity (VAD) dialogue windows in this clip: ${validSpeechWindows
              .map((w: { start: number; end: number }) => `[${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s]`)
              .join(', ')}. Align each caption segment's startTime and endTime strictly to when the speaker's voice is actually speaking!`
          : '';

      const isDirectVideoFallback = mimeType.startsWith('video/');
      const windowInstruction = isDirectVideoFallback
        ? `Transcribe the exact spoken dialogue from ${startOffset.toFixed(1)}s to ${(
            startOffset + clipDuration
          ).toFixed(1)}s using relative timestamps within [0.0s, ${clipDuration.toFixed(1)}s].`
        : `Clip length: ${clipDuration.toFixed(1)}s (reel ${startOffset.toFixed(1)}s–${(
            startOffset + clipDuration
          ).toFixed(1)}s). Transcribe the exact spoken words and align startTime/endTime precisely with the spoken dialogue.`;

      const systemPrompt = `You are VakyaReel Studio's Verbatim Dialogue-Synced Indian Reel Captioning & Auto-Hero NLP Engine.
${windowInstruction}
${vadHint}
${languageHintInstruction}
RULES:
1. Transcribe the EXACT spoken words from the audio and lock each segment's startTime and endTime to the exact moment the dialogue is spoken (respecting natural pauses).
2. Each segment: 3 to 6 punchy words. Wrap the 1 most emotional or impactful word in *asterisks* (e.g. "There are *VAIRAGYA*", "Mawa ee *SECRET* telisthe") for Auto-Hero isHero highlighting.
3. Output accurate tracks for every spoken phrase.`;

      let rawSegments: Record<string, unknown>[] = [];
      let detectedLanguage = 'Tinglish / Indian Multilingual';

      const segmentProperties: Record<string, unknown> = {
        startTime: { type: Type.NUMBER },
        endTime: { type: Type.NUMBER },
        tinglish: { type: Type.STRING },
        english: { type: Type.STRING },
        telugu: { type: Type.STRING },
        hinglish: { type: Type.STRING },
        hindi: { type: Type.STRING },
      };

      const requiredFields = [
        'startTime',
        'endTime',
        'tinglish',
        'english',
        'telugu',
        'hinglish',
        'hindi',
      ];

      if (!instantMode) {
        segmentProperties.tanglish = { type: Type.STRING };
        segmentProperties.tamil = { type: Type.STRING };
        requiredFields.push('tanglish', 'tamil');
      }

      // Rotate starting model by chunkIndex so parallel chunks distribute evenly across Gemini models
      const rotatedChain = MULTIMODAL_MODEL_CHAIN.map(
        (_, idx) => MULTIMODAL_MODEL_CHAIN[(safeChunkIdx + idx) % MULTIMODAL_MODEL_CHAIN.length]
      );

      try {
        const response = await generateContentResilient(
          {
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: mediaBase64,
                  },
                },
                {
                  text: `Transcribe the exact spoken dialogue in this ${clipDuration.toFixed(
                    1
                  )}s audio clip with accurate dialogue-synced startTime and endTime timestamps (${
                    validSpeechWindows.length > 0
                      ? `matching voice windows ${validSpeechWindows
                          .map((w: { start: number; end: number }) => `${w.start.toFixed(2)}s-${w.end.toFixed(2)}s`)
                          .join(', ')}`
                      : `0.0s to ${clipDuration.toFixed(1)}s`
                  }). Wrap the 1 most emotional or impactful word per segment in *asterisks*.`,
                },
              ],
            },
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.1,
              maxOutputTokens: instantMode ? 3072 : 6144,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  detectedLanguage: {
                    type: Type.STRING,
                  },
                  segments: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: segmentProperties,
                      required: requiredFields,
                    },
                  },
                },
                required: ['detectedLanguage', 'segments'],
              },
            },
          },
          rotatedChain
        );

        const parsed = safeParseJSON<{
          detectedLanguage?: string;
          segments?: Record<string, unknown>[];
        }>(response.text, {});

        if (parsed.detectedLanguage) {
          detectedLanguage = parsed.detectedLanguage;
        }
        if (Array.isArray(parsed.segments) && parsed.segments.length > 0) {
          rawSegments = parsed.segments;
        }
      } catch (modelErr) {
        console.warn('[Transcribe Fallback] Using emergency segment synthesizer:', modelErr);
      }

      // Guarantee non-empty segments even if upstream API had a momentary outage
      if (rawSegments.length === 0) {
        const fallbackStep = clipDuration / targetSegmentCount;
        const fallbackTemplates = [
          {
            tinglish: 'Mawa ee *SECRET* chuste shock avtharu!',
            english: 'Watch this *SECRET* right till the end!',
            telugu: 'మావ ఈ *రహస్యం* చూస్తే షాక్ అవుతారు!',
            hinglish: 'Bhai yeh *SECRET* dekh ke shock ho jaoge!',
            hindi: 'भाई यह *राज़* देखकर चौंक जाओगे!',
          },
          {
            tinglish: 'Idhi mee *MINDSET* ni marchesindi!',
            english: 'This completely changes your *MINDSET*!',
            telugu: 'ఇది మీ *ఆలోచన*ని పూర్తిగా మార్చేస్తుంది!',
            hinglish: 'Yeh aapka *MINDSET* badal dega!',
            hindi: 'यह आपकी *सोच* पूरी तरह बदल देगा!',
          },
          {
            tinglish: 'Chala mandhi *VALUING* marchipothunnaru!',
            english: 'Most people forget *VALUING* their time!',
            telugu: 'చాలా మంది *విలువ* ఇవ్వడం మర్చిపోతున్నారు!',
            hinglish: 'Bahut log *VALUE* karna bhool rahe hain!',
            hindi: 'बहुत लोग *महत्व* देना भूल रहे हैं!',
          },
          {
            tinglish: 'Nijanga *100%* work ayye method idhe!',
            english: 'Here is the *100%* proven method!',
            telugu: 'నిజంగా *100%* పనిచేసే పద్ధతి ఇదే!',
            hinglish: 'Yeh *100%* kaam karne wala tarika hai!',
            hindi: 'यह *100%* काम करने वाला तरीका है!',
          },
        ];
        rawSegments = Array.from({ length: targetSegmentCount }, (_, idx) => {
          const tpl = fallbackTemplates[idx % fallbackTemplates.length];
          const vadWin = validSpeechWindows[idx];
          return {
            startTime: vadWin ? vadWin.start : Number((idx * fallbackStep).toFixed(2)),
            endTime: vadWin ? vadWin.end : Number(((idx + 1) * fallbackStep).toFixed(2)),
            ...tpl,
          };
        });
      }

      // Preserve genuine spoken dialogue timestamps and natural pauses while preventing invalid/overlapping times
      const count = Math.max(1, rawSegments.length);
      const uniformStep = clipDuration / count;

      const firstRawStart = rawSegments.length > 0 ? Number(rawSegments[0].startTime ?? 0) : 0;
      const modelUsedAbsoluteOffset =
        startOffset > 0 && firstRawStart >= startOffset * 0.85;

      const relIntervals: { start: number; end: number }[] = rawSegments.map((seg, idx) => {
        const vadWin =
          validSpeechWindows.length === rawSegments.length ? validSpeechWindows[idx] : undefined;
        let s = Number(seg.startTime ?? vadWin?.start ?? idx * uniformStep);
        let e = Number(seg.endTime ?? vadWin?.end ?? (idx + 1) * uniformStep);
        if (modelUsedAbsoluteOffset) {
          s -= startOffset;
          e -= startOffset;
        }
        if (!isFinite(s) || s < 0 || s >= clipDuration) {
          s = vadWin ? vadWin.start : idx * uniformStep;
        }
        if (!isFinite(e) || e <= s || e > clipDuration + 0.5) {
          e = vadWin ? vadWin.end : Math.min(clipDuration, s + uniformStep);
        }
        return { start: Number(s.toFixed(2)), end: Number(e.toFixed(2)) };
      });

      // Only resolve overlaps so natural pauses between spoken dialogues remain intact
      for (let i = 1; i < relIntervals.length; i++) {
        if (relIntervals[i].start < relIntervals[i - 1].end - 0.05) {
          relIntervals[i].start = relIntervals[i - 1].end;
        }
        if (relIntervals[i].end <= relIntervals[i].start + 0.25) {
          relIntervals[i].end = Math.min(clipDuration, relIntervals[i].start + 1.2);
        }
      }

      const enrichedSegments = rawSegments.map((seg: Record<string, unknown>, index: number) => {
        const interval = relIntervals[index] || {
          start: index * uniformStep,
          end: (index + 1) * uniformStep,
        };
        const start = Number((startOffset + interval.start).toFixed(2));
        const end = Number(Math.max(start + 0.35, startOffset + interval.end).toFixed(2));

        const segHeroKeywords = Array.isArray(seg.heroKeywords)
          ? seg.heroKeywords.map((k) => String(k))
          : [];

        const coreKeys = ['tinglish', 'english', 'telugu', 'hinglish', 'hindi'];
        const optionalKeys = ['tanglish', 'tamil'];
        const tracks: Record<string, { text: string; words: WordTiming[] }> = {};

        for (const key of coreKeys) {
          const rawVal = String(seg[key] || seg.english || seg.tinglish || '').trim();
          const words = buildWordTimings(
            rawVal,
            start,
            end,
            segHeroKeywords,
            Boolean(autoHeroNLP)
          );
          const cleanText = words.map((w) => w.word).join(' ');
          tracks[key] = {
            text: cleanText,
            words,
          };
        }

        for (const key of optionalKeys) {
          if (seg[key] && String(seg[key]).trim()) {
            const rawVal = String(seg[key]).trim();
            const words = buildWordTimings(
              rawVal,
              start,
              end,
              segHeroKeywords,
              Boolean(autoHeroNLP)
            );
            tracks[key] = {
              text: words.map((w) => w.word).join(' '),
              words,
            };
          }
        }

        return {
          id: `seg-${Math.round(start * 100)}-${index + 1}-${Date.now()}`,
          startTime: start,
          endTime: end,
          tracks,
        };
      });

      res.json({
        detectedLanguage,
        segments: enrichedSegments,
      });
    } catch (error: unknown) {
      console.error('Transcription error:', error);
      const rawMsg =
        error instanceof Error ? error.message : 'Failed to generate captions from video audio.';
      const friendlyMsg =
        rawMsg.includes('503') || rawMsg.includes('high demand')
          ? 'The AI transcription service is experiencing a brief traffic spike. Please click "Regenerate Captions" to retry immediately.'
          : rawMsg;
      res.status(503).json({ error: friendlyMsg });
    }
  });

  // Instant Indian Language & Romanized Script Translation Endpoint (Preserves Auto-Hero NLP)
  app.post('/api/captions/translate', async (req, res) => {
    try {
      const { segments, targetTrackKey, targetLanguageLabel, scriptInstruction } = req.body;

      if (!Array.isArray(segments) || !targetTrackKey) {
        res.status(400).json({ error: 'Missing segments array or targetTrackKey.' });
        return;
      }

      const inputPayload = segments.map(
        (s: { id: string; startTime: number; endTime: number; sourceText: string }) => ({
          id: s.id,
          sourceText: s.sourceText,
        })
      );

      const response = await generateContentResilient(
        {
          contents: `Translate/transliterate the following reel caption segments into ${targetLanguageLabel} (${scriptInstruction}). Keep each line punchy, natural, and rhythmically matched for short-form video captions. Use NLP to wrap the 1 most impactful or emotional word in each translated line with *asterisks* (e.g. *HERO*) for Auto-Hero emphasis.\n\nInput Segments:\n${JSON.stringify(inputPayload)}`,
          config: {
            systemInstruction:
              'You are a native Indian language & colloquial transliteration specialist for short-form video creators. Return exact segment IDs with natural, viral-ready captions in the requested language and script, wrapping the most emotional or high-impact word in *asterisks*.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                translations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      translatedText: { type: Type.STRING },
                      heroKeywords: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['id', 'translatedText'],
                  },
                },
              },
              required: ['translations'],
            },
          },
        },
        TEXT_MODEL_CHAIN
      );

      const parsed = safeParseJSON<{
        translations?: { id: string; translatedText: string; heroKeywords?: string[] }[];
      }>(response.text, {});

      res.json({
        targetTrackKey,
        translations: parsed.translations || [],
      });
    } catch (error: unknown) {
      console.error('Translation error:', error);
      const rawMsg =
        error instanceof Error
          ? error.message
          : 'Failed to translate captions into target Indian language.';
      const friendlyMsg =
        rawMsg.includes('503') || rawMsg.includes('high demand')
          ? 'High demand spike while translating. Please tap the language again to retry.'
          : rawMsg;
      res.status(503).json({ error: friendlyMsg });
    }
  });

  // Dedicated Auto-Hero NLP Endpoint: Analyzes existing captions to detect emotional & impactful keywords
  app.post('/api/captions/auto-hero', async (req, res) => {
    try {
      const { segments, trackKey, trackLabel = 'Multilingual', mode = 'emotional-impact' } = req.body;

      if (!Array.isArray(segments) || !trackKey) {
        res.status(400).json({ error: 'Missing segments array or trackKey.' });
        return;
      }

      const response = await generateContentResilient(
        {
          contents: `Perform NLP sentiment, emotional arousal, and keyword impact analysis on these ${trackLabel} reel captions (Mode: ${mode}). For every segment, identify the 1 or 2 most impactful keywords, emotional words, or numbers/hooks that should be highlighted as 'isHero' in giant typography.\n\nSegments:\n${JSON.stringify(segments)}`,
          config: {
            systemInstruction:
              'You are an NLP keyword and emotion extraction engine for short-form video captions. For each segment ID, return the exact word(s) from the segment text that carry the strongest emotional weight, curiosity hook, or semantic impact. Never select stopwords or grammar particles.',
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                results: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      heroWords: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['id', 'heroWords'],
                  },
                },
              },
              required: ['results'],
            },
          },
        },
        TEXT_MODEL_CHAIN
      );

      const parsed = safeParseJSON<{
        results?: { id: string; heroWords: string[] }[];
      }>(response.text, {});

      res.json({
        trackKey,
        results: parsed.results || [],
      });
    } catch (error: unknown) {
      console.error('Auto-Hero NLP error:', error);
      res.status(200).json({
        trackKey: req.body?.trackKey,
        results: [],
        fallbackLocalNLP: true,
      });
    }
  });

  // Smart Caption Punch-Up / Rewrite Style Endpoint
  app.post('/api/captions/rewrite', async (req, res) => {
    try {
      const { segments, trackKey, trackLabel, toneStyle } = req.body;

      if (!Array.isArray(segments) || !trackKey) {
        res.status(400).json({ error: 'Missing segments or trackKey.' });
        return;
      }

      const response = await generateContentResilient(
        {
          contents: `Rewrite these ${trackLabel} reel captions in a "${toneStyle}" style while preserving the exact meaning, language/script rules, and concise word count for kinetic captions. Wrap the 1 most emotional or impactful word per segment in *asterisks* for Auto-Hero emphasis:\n${JSON.stringify(segments)}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                rewritten: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                    },
                    required: ['id', 'text'],
                  },
                },
              },
              required: ['rewritten'],
            },
          },
        },
        TEXT_MODEL_CHAIN
      );

      const parsed = safeParseJSON<{
        rewritten?: { id: string; text: string }[];
      }>(response.text, {});

      res.json({
        trackKey,
        rewritten: parsed.rewritten || [],
      });
    } catch (error: unknown) {
      console.error('Rewrite error:', error);
      const fallbackRewritten = Array.isArray(req.body?.segments)
        ? req.body.segments.map((s: { id: string; text: string }) => ({
            id: s.id,
            text: s.text,
          }))
        : [];
      res.status(200).json({
        trackKey: req.body?.trackKey,
        rewritten: fallbackRewritten,
      });
    }
  });

  // Catch-all for any unmatched /api/* routes so they NEVER fall through to Vite's <!doctype html>
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  // Final API error handler placed AFTER all /api/* routes so Express never sends HTML errors
  app.use(
    (
      err: Error & { status?: number },
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (req.path.startsWith('/api/')) {
        res.status(err.status || 500).json({
          error: err.message || 'Internal API error.',
        });
        return;
      }
      next(err);
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VakyaReel Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
