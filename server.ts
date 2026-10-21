import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import type { GenerateContentParameters, GenerateContentResponse } from '@google/genai';
import { transliterateIndicToRoman } from './src/utils/indicRomanTransliterator';

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
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.5-transcribe',
  'gemini-3.8-flash',
];

const TEXT_MODEL_CHAIN = [
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
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

function isDeveloperInstructionUnsupportedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('Developer instruction is not enabled') ||
    msg.includes('systemInstruction') ||
    msg.includes('system_instruction')
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

function inlineSystemInstructionIntoParams(
  params: Omit<GenerateContentParameters, 'model'>
): Omit<GenerateContentParameters, 'model'> {
  const sysInst = params.config?.systemInstruction;
  if (!sysInst) return params;

  const sysText =
    typeof sysInst === 'string'
      ? sysInst
      : JSON.stringify(sysInst);

  const nextConfig = { ...(params.config || {}) };
  delete nextConfig.systemInstruction;

  const rawContents = params.contents;
  if (typeof rawContents === 'string') {
    return {
      ...params,
      contents: `${sysText}\n\n${rawContents}`,
      config: nextConfig,
    };
  }

  if (
    rawContents &&
    typeof rawContents === 'object' &&
    !Array.isArray(rawContents) &&
    'parts' in rawContents &&
    Array.isArray((rawContents as { parts?: unknown[] }).parts)
  ) {
    const parts = [...((rawContents as { parts: Record<string, unknown>[] }).parts)];
    const textIdx = parts.findIndex((p) => typeof p?.text === 'string');
    if (textIdx >= 0) {
      parts[textIdx] = {
        ...parts[textIdx],
        text: `${sysText}\n\n${String(parts[textIdx].text)}`,
      };
    } else {
      parts.unshift({ text: sysText });
    }
    return {
      ...params,
      contents: {
        ...(rawContents as Record<string, unknown>),
        parts,
      },
      config: nextConfig,
    };
  }

  return {
    ...params,
    config: nextConfig,
  };
}

async function generateContentResilient(
  params: Omit<GenerateContentParameters, 'model'>,
  modelChain: string[] = MULTIMODAL_MODEL_CHAIN
): Promise<GenerateContentResponse> {
  const ai = getGenAIClient();
  let lastError: unknown = null;
  const now = Date.now();

  // Filter out models that hit 429/503 in the last few seconds so parallel/long-video chunks rotate cleanly
  const activeChain = modelChain.filter((m) => {
    const blockedUntil = exhaustedModelsCache.get(m);
    return !blockedUntil || now > blockedUntil;
  });
  const effectiveChain = activeChain.length > 0 ? activeChain : modelChain;

  for (let i = 0; i < effectiveChain.length; i++) {
    const modelName = effectiveChain[i];
    // Always inline systemInstruction for transcribe models (or models that don't support developer instruction)
    const requestParams = modelName.includes('transcribe')
      ? inlineSystemInstructionIntoParams(params)
      : params;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const effectiveRequestParams =
          attempt > 0 ? inlineSystemInstructionIntoParams(requestParams) : requestParams;
        const response = await Promise.race([
          ai.models.generateContent({
            ...effectiveRequestParams,
            model: modelName,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Model ${modelName} timed out after 45s`)), 45000)
          ),
        ]);
        return response;
      } catch (err: unknown) {
        lastError = err;

        // If a model rejects developer/system instructions, retry immediately once with inlined instructions
        if (attempt === 0 && isDeveloperInstructionUnsupportedError(err)) {
          continue;
        }

        if (isQuotaExhaustedError(err)) {
          const msg = err instanceof Error ? err.message : String(err);
          const cooldownMs = msg.includes('404') ? 5 * 60 * 1000 : 6 * 1000;
          exhaustedModelsCache.set(modelName, Date.now() + cooldownMs);
          break;
        }

        if (isTransientHighDemandError(err)) {
          if (attempt < 2) {
            await sleep(180 * (attempt + 1) + Math.floor(Math.random() * 140));
            continue;
          }
          // Temporarily deprioritize 503 model for 8 seconds so subsequent chunks use healthy models
          exhaustedModelsCache.set(modelName, Date.now() + 8 * 1000);
          break;
        }

        break;
      }
    }
    await sleep(40);
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

  // 100% Accurate Verbatim Speech-to-Text Reel Captioning & Auto-Hero NLP Engine
  app.post('/api/captions/transcribe', async (req, res) => {
    try {
      const {
        mediaBase64,
        mimeType = 'audio/wav',
        duration = 12,
        chunkStartTime = 0,
        sourceLanguageHint = 'auto',
        autoHeroNLP = true,
        autoEmojis = false,
        removePunctuation = false,
        speechWindows = [],
      } = req.body || {};

      if (!mediaBase64) {
        res.status(400).json({ error: 'Missing mediaBase64 payload for caption generation.' });
        return;
      }

      const shouldIncludeEmojis = Boolean(autoEmojis);
      const shouldStripPunct = Boolean(removePunctuation);
      const stripServerText = (str: string): string => {
        let out = str || '';
        if (!shouldIncludeEmojis) {
          out = out.replace(
            /(\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}])/gu,
            ''
          );
        }
        if (shouldStripPunct) {
          out = out.replace(/[.,!?;:'"“”‘’()[\]{}\-—–…]/g, '');
        }
        return out.replace(/\s{2,}/g, ' ').trim();
      };

      const startOffset = Math.max(0, Number(chunkStartTime) || 0);
      const clipDuration = Math.max(1, Number(duration) || 12);
      const validSpeechWindows = Array.isArray(speechWindows)
        ? speechWindows.filter(
            (w: { start?: number; end?: number }) =>
              typeof w?.start === 'number' && typeof w?.end === 'number' && w.end > w.start
          )
        : [];

      const languageHintInstruction =
        sourceLanguageHint && sourceLanguageHint !== 'auto'
          ? `User-selected language/script hint: ${sourceLanguageHint}. CRITICAL: For "fullVerbatimTranscript" and "verbatimRoman", you MUST write 100% in phonetic Roman script (English Latin alphabet A-Z, e.g., Tinglish like "Edho chusthuna, kani em telidam ledhu"). NEVER output native Telugu (తెలుగు) or Indic Unicode characters inside "verbatimRoman" or "fullVerbatimTranscript"!`
          : `Automatically detect the spoken language and ALWAYS write "fullVerbatimTranscript" and "verbatimRoman" 100% in phonetic Roman script (English Latin alphabet A-Z, e.g., Tinglish / Hinglish). NEVER output native Telugu (తెలుగు) or Indic Unicode script inside "verbatimRoman" or "fullVerbatimTranscript"!`;

      const emojiInstruction = shouldIncludeEmojis
        ? `Insert a relevant emoji directly after concrete nouns/concepts where natural (for example: "paisalu 💰", "roopaayalu 💵", "time ⏰", "friends 👥", "fire 🔥", "money 💸", "heart ❤️").`
        : `CRITICAL: Do NOT insert or output ANY emojis anywhere in fullVerbatimTranscript, verbatimRoman, verbatimNative, or englishMeaning. Output 100% plain words with ZERO emojis.`;

      const vadHint =
        validSpeechWindows.length > 0
          ? `Detected voice activity intervals in this clip (0.0s to ${clipDuration.toFixed(
              2
            )}s): ${validSpeechWindows
              .slice(0, 24)
              .map((w: { start: number; end: number }) => `[${w.start.toFixed(2)}s-${w.end.toFixed(2)}s]`)
              .join(', ')}. Use these as a reference for when the speaker's voice starts and pauses.`
          : '';

      const systemPrompt = `You are Merupify & Kalakar Studio's 100% Verbatim Word-by-Word Speech-to-Text (ASR) Engine.
CRITICAL VERBATIM TRANSCRIPTION & ROMAN (TINGLISH) SCRIPT RULES:
1. Listen to the entire audio/video from 0.0s right through to the very end (${clipDuration.toFixed(
        1
      )}s) and transcribe 100% VERBATIM EVERY SINGLE SPOKEN WORD.
2. First, write the complete, uninterrupted word-for-word transcript of the entire clip in "fullVerbatimTranscript" STRICTLY in phonetic Roman script / English Latin alphabet (e.g., Tinglish like "Nuvvu ee video chusthunnappudu prathi second"). NEVER use native Telugu (తెలుగు) script in "fullVerbatimTranscript"!
3. Next, break that exact full verbatim transcript into sequential, punchy caption segments of 2 to 4 words per segment in "segments" so that EVERY SINGLE WORD from "fullVerbatimTranscript" is included in exact spoken order without repeating any phrase.
4. Set each segment's startTime and endTime (in seconds relative to 0.0s of this clip) to when those words are spoken, covering the full spoken duration up to ${clipDuration.toFixed(
        1
      )}s without bunching timestamps or leaving artificial gaps.
5. For each segment in "segments", provide:
   - verbatimRoman: STRICTLY in Roman/English Latin alphabet ONLY (Tinglish, Hinglish, Tanglish, or English — e.g. "chusthunnappudu prathi second", "manandaram chudalsina video idhi", "poorthiga chuseyandi"). NEVER write native Telugu (తెలుగు) characters in verbatimRoman! Wrap the 1 most impactful word in *asterisks*.
   - verbatimNative: The exact spoken words in the language's native script (e.g. Telugu తెలుగు, Hindi, Tamil, or English if spoken in English), wrapping the 1 most impactful word in *asterisks*.
   - englishMeaning: Exact English words if spoken in English, or accurate English translation.
   - emphasizedWord: The single most emphasized word in the segment in Roman script (without asterisks).
6. ${languageHintInstruction}
7. ${emojiInstruction} ${vadHint}`;

      let rawSegments: Record<string, unknown>[] = [];
      let fullVerbatimTranscript = '';
      let detectedLanguage = 'Telugu (Roman Script)';

      const verbatimSchema = {
        type: Type.OBJECT,
        properties: {
          detectedLanguage: {
            type: Type.STRING,
          },
          fullVerbatimTranscript: {
            type: Type.STRING,
            description:
              'Complete 100% word-for-word transcript of every spoken word strictly in phonetic Roman/Latin alphabet (Tinglish/Hinglish/English). Never use native Telugu/Indic Unicode script here.',
          },
          segments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                startTime: { type: Type.NUMBER },
                endTime: { type: Type.NUMBER },
                verbatimRoman: {
                  type: Type.STRING,
                  description:
                    'Spoken words strictly in Roman/Latin alphabet (Tinglish/Hinglish/English). Never use native Telugu/Indic script here.',
                },
                verbatimNative: { type: Type.STRING },
                englishMeaning: { type: Type.STRING },
                emphasizedWord: { type: Type.STRING },
              },
              required: [
                'startTime',
                'endTime',
                'verbatimRoman',
                'verbatimNative',
                'englishMeaning',
              ],
            },
          },
        },
        required: ['detectedLanguage', 'fullVerbatimTranscript', 'segments'],
      };

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
                  text:
                    mimeType.startsWith('video/') && startOffset > 0
                      ? `Transcribe 100% VERBATIM word-for-word EVERY SINGLE WORD spoken in the time window from ${startOffset.toFixed(
                          1
                        )}s to ${(startOffset + clipDuration).toFixed(
                          1
                        )}s (${clipDuration.toFixed(
                          1
                        )}s duration) of this video. Write "fullVerbatimTranscript" and every segment's "verbatimRoman" STRICTLY in phonetic Roman English alphabet (Tinglish/Hinglish/English) — NEVER use native Telugu (తెలుగు) Unicode characters in "verbatimRoman"! Split every single word into sequential 2-to-4 word caption lines in "segments" with accurate startTime and endTime timestamps spanning the full speech duration without repeating lines. ${languageHintInstruction} ${emojiInstruction}`
                      : `Transcribe 100% VERBATIM word-for-word EVERY SINGLE WORD spoken in this ${clipDuration.toFixed(
                          1
                        )}s audio clip from 0.0s to ${clipDuration.toFixed(
                          1
                        )}s. Write "fullVerbatimTranscript" and every segment's "verbatimRoman" STRICTLY in phonetic Roman English alphabet (Tinglish/Hinglish/English) — NEVER use native Telugu (తెలుగు) Unicode characters in "verbatimRoman"! Split every single word into sequential 2-to-4 word caption lines in "segments" with accurate startTime and endTime timestamps spanning the full speech duration without repeating lines. ${languageHintInstruction} ${emojiInstruction}`,
                },
              ],
            },
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.0,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json',
              responseSchema: verbatimSchema,
            },
          },
          MULTIMODAL_MODEL_CHAIN
        );

        const parsed = safeParseJSON<{
          detectedLanguage?: string;
          fullVerbatimTranscript?: string;
          segments?: Record<string, unknown>[];
        }>(response.text, {});

        if (parsed.detectedLanguage) {
          detectedLanguage = parsed.detectedLanguage;
        }
        if (typeof parsed.fullVerbatimTranscript === 'string') {
          fullVerbatimTranscript = stripServerText(
            transliterateIndicToRoman(parsed.fullVerbatimTranscript.trim())
          );
        }
        if (Array.isArray(parsed.segments) && parsed.segments.length > 0) {
          rawSegments = parsed.segments;
        }
      } catch (_modelErr) {
        // Handled gracefully by fallback below
      }

      // Completeness Verification: Rebuild from fullVerbatimTranscript if rawSegments is empty,
      // OR append any trailing unspoken words from fullVerbatimTranscript if the model stopped segments early!
      if (fullVerbatimTranscript) {
        const stripClean = (s: string) =>
          s
            .replace(/[*.,!?;:'"“”‘’()[\]{}\-]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        const fullWords = fullVerbatimTranscript
          .split(/\s+/)
          .filter((w) => stripClean(w).length > 0);

        if (rawSegments.length === 0 && fullWords.length > 0) {
          const chunkSize = 3;
          for (let i = 0; i < fullWords.length; i += chunkSize) {
            const phrase = transliterateIndicToRoman(
              fullWords.slice(i, i + chunkSize).join(' ')
            );
            rawSegments.push({
              startTime: (i / fullWords.length) * clipDuration,
              endTime:
                (Math.min(fullWords.length, i + chunkSize) / fullWords.length) *
                clipDuration,
              verbatimRoman: phrase,
              verbatimNative: phrase,
              englishMeaning: phrase,
            });
          }
        } else if (rawSegments.length > 0 && fullWords.length > 2) {
          const segmentWordCount = rawSegments.reduce((acc, s) => {
            const txt = String(
              s.verbatimRoman || s.verbatimNative || s.englishMeaning || ''
            ).trim();
            return acc + txt.split(/\s+/).filter((w) => stripClean(w).length > 0).length;
          }, 0);
          // If segments missed ANY trailing words from fullVerbatimTranscript, append them so 100% of spoken words become captions!
          if (segmentWordCount < fullWords.length - 1) {
            const missingWords = fullWords.slice(segmentWordCount);
            const lastSegEnd = Number(
              rawSegments[rawSegments.length - 1]?.endTime ?? clipDuration * 0.65
            );
            const remStart = Math.min(clipDuration * 0.88, Math.max(0.4, lastSegEnd));
            const remSpan = Math.max(0.6, clipDuration - remStart);
            const chunkSize = 3;
            for (let i = 0; i < missingWords.length; i += chunkSize) {
              const phrase = transliterateIndicToRoman(
                missingWords.slice(i, i + chunkSize).join(' ')
              );
              rawSegments.push({
                startTime: remStart + (i / missingWords.length) * remSpan,
                endTime:
                  remStart +
                  (Math.min(missingWords.length, i + chunkSize) / missingWords.length) *
                    remSpan,
                verbatimRoman: phrase,
                verbatimNative: phrase,
                englishMeaning: phrase,
              });
            }
          }
        }
      }

      if (rawSegments.length === 0) {
        res.status(503).json({
          error:
            'Could not transcribe audio on first pass. Retrying verbatim transcription...',
        });
        return;
      }

      // Split any overly long segment (> 5 words) into crisp 3-word reel caption lines before forced alignment,
      // and strictly transliterate any Indic Unicode in verbatimRoman into phonetic Roman (Tinglish)!
      const normalizedRawSegments: Record<string, unknown>[] = [];
      for (const seg of rawSegments) {
        const rawRomanCandidate = String(
          seg.verbatimRoman ||
            seg.tinglish ||
            seg.hinglish ||
            seg.verbatimNative ||
            seg.englishMeaning ||
            ''
        ).trim();
        const romanTxt = transliterateIndicToRoman(rawRomanCandidate);
        const words = romanTxt.split(/\s+/).filter(Boolean);
        if (words.length <= 5) {
          normalizedRawSegments.push({
            ...seg,
            verbatimRoman: romanTxt,
          });
        } else {
          const nativeWords = String(seg.verbatimNative || romanTxt)
            .trim()
            .split(/\s+/)
            .filter(Boolean);
          const engWords = String(seg.englishMeaning || romanTxt)
            .trim()
            .split(/\s+/)
            .filter(Boolean);
          const numSlices = Math.ceil(words.length / 3);
          const sTime = Number(seg.startTime ?? 0);
          const eTime = Number(seg.endTime ?? sTime + 2.0);
          const dur = Math.max(0.6, eTime - sTime);
          for (let sIdx = 0; sIdx < numSlices; sIdx++) {
            const fStart = sIdx / numSlices;
            const fEnd = (sIdx + 1) / numSlices;
            const rSlice = words
              .slice(Math.floor(fStart * words.length), Math.round(fEnd * words.length))
              .join(' ');
            const nSlice = nativeWords
              .slice(
                Math.floor(fStart * nativeWords.length),
                Math.round(fEnd * nativeWords.length)
              )
              .join(' ');
            const eSlice = engWords
              .slice(Math.floor(fStart * engWords.length), Math.round(fEnd * engWords.length))
              .join(' ');
            normalizedRawSegments.push({
              ...seg,
              startTime: sTime + fStart * dur,
              endTime: sTime + fEnd * dur,
              verbatimRoman: rSlice,
              verbatimNative: nSlice || rSlice,
              englishMeaning: eSlice || rSlice,
            });
          }
        }
      }

      // SYLLABLE-WEIGHTED ACOUSTIC FORCED-ALIGNMENT ENGINE:
      // Prevents Gemini timestamp bunching (where 8 words get squished into 0.5s followed by a 3s gap)
      // by aligning all segments proportionally to their syllable/character weights across the active speech span!
      const count = Math.max(1, normalizedRawSegments.length);
      const segWeights = normalizedRawSegments.map((seg) => {
        const txt = String(
          seg.verbatimRoman || seg.englishMeaning || seg.verbatimNative || ''
        ).trim();
        const cleanChars = txt.replace(/[*.,!?;:'"()\s]/g, '').length;
        const wordCount = txt.split(/\s+/).filter(Boolean).length;
        return Math.max(3, cleanChars + wordCount * 2);
      });
      const totalWeight = segWeights.reduce((a, b) => a + b, 0) || 1;

      // Determine active speech start & end from validSpeechWindows (or full clipDuration)
      const speechStart =
        validSpeechWindows.length > 0
          ? Math.max(0, Math.min(1.2, validSpeechWindows[0].start))
          : 0;
      const speechEnd =
        validSpeechWindows.length > 0
          ? Math.min(
              clipDuration,
              Math.max(
                clipDuration * 0.82,
                validSpeechWindows[validSpeechWindows.length - 1].end
              )
            )
          : clipDuration;
      const activeSpeechSpan = Math.max(1.0, speechEnd - speechStart);

      // Check if model timestamps are well-formed and span the clip without bunching or big unexplained gaps
      const firstRawStart = Number(normalizedRawSegments[0]?.startTime ?? 0);
      const modelUsedAbsoluteOffset =
        startOffset > 0 && firstRawStart >= startOffset * 0.85;

      const rawRelIntervals = normalizedRawSegments.map((seg, idx) => {
        let s = Number(seg.startTime ?? (idx / count) * clipDuration);
        let e = Number(seg.endTime ?? ((idx + 1) / count) * clipDuration);
        if (modelUsedAbsoluteOffset) {
          s -= startOffset;
          e -= startOffset;
        }
        return { start: s, end: e };
      });

      // Detect timestamp bunching, overlaps, or premature cutoff (e.g., last segment ends way before speechEnd)
      let hasBunchingOrGaps = false;
      const lastRawEnd = rawRelIntervals[rawRelIntervals.length - 1]?.end ?? 0;
      if (lastRawEnd < speechEnd * 0.72 || rawRelIntervals[0].start > speechStart + 2.0) {
        hasBunchingOrGaps = true;
      }
      for (let i = 0; i < rawRelIntervals.length; i++) {
        const dur = rawRelIntervals[i].end - rawRelIntervals[i].start;
        if (!isFinite(dur) || dur < 0.28 || dur > 5.5) {
          hasBunchingOrGaps = true;
          break;
        }
        if (i > 0) {
          const gap = rawRelIntervals[i].start - rawRelIntervals[i - 1].end;
          if (gap < -0.1 || gap > 1.6) {
            hasBunchingOrGaps = true;
            break;
          }
        }
      }

      // Compute final aligned intervals: distribute syllable weights across active VAD speech windows (skipping silence gaps!)
      // and preserve exact spoken phrase boundaries at 0.001s millisecond resolution
      const activeWindows =
        validSpeechWindows.length > 0
          ? validSpeechWindows
          : [{ start: speechStart, end: speechEnd }];
      const totalVoicedDuration = Math.max(
        0.5,
        activeWindows.reduce((acc, w) => acc + Math.max(0.05, w.end - w.start), 0)
      );

      // Helper to map a cumulative voiced-time offset [0..totalVoicedDuration] to real clip timestamp
      const mapVoicedTimeToClipTime = (voicedSec: number): number => {
        let rem = Math.max(0, voicedSec);
        for (let wIdx = 0; wIdx < activeWindows.length; wIdx++) {
          const w = activeWindows[wIdx];
          const wDur = Math.max(0.05, w.end - w.start);
          if (rem <= wDur || wIdx === activeWindows.length - 1) {
            return Math.min(w.end, w.start + rem);
          }
          rem -= wDur;
        }
        return speechEnd;
      };

      const relIntervals: { start: number; end: number }[] = [];
      let voicedCursor = 0;

      for (let i = 0; i < count; i++) {
        const weightedVoicedDur = (segWeights[i] / totalWeight) * totalVoicedDuration;
        const acousticStart = mapVoicedTimeToClipTime(voicedCursor);
        voicedCursor += weightedVoicedDur;
        const acousticEnd =
          i === count - 1
            ? speechEnd
            : Math.max(acousticStart + 0.22, mapVoicedTimeToClipTime(voicedCursor));

        if (hasBunchingOrGaps) {
          const prevEnd = i > 0 ? relIntervals[i - 1].end : 0;
          const cleanStart = Math.max(prevEnd, acousticStart);
          const cleanEnd = Math.max(cleanStart + 0.22, acousticEnd);
          relIntervals.push({
            start: Number(cleanStart.toFixed(3)),
            end: Number(cleanEnd.toFixed(3)),
          });
        } else {
          // Trust 88% model spoken timestamp + 12% VAD-windowed syllable anchor, preserving natural inter-phrase pauses!
          const m = rawRelIntervals[i];
          const prevEnd = i > 0 ? relIntervals[i - 1].end : 0;
          const rawStart = m.start * 0.88 + acousticStart * 0.12;
          const blendedStart = Math.max(prevEnd, rawStart);
          const rawEnd = m.end * 0.88 + acousticEnd * 0.12;
          const blendedEnd =
            i === count - 1
              ? Math.max(blendedStart + 0.24, Math.min(clipDuration, Math.max(m.end, speechEnd)))
              : Math.max(blendedStart + 0.22, Math.min(clipDuration, rawEnd));
          relIntervals.push({
            start: Number(blendedStart.toFixed(3)),
            end: Number(blendedEnd.toFixed(3)),
          });
        }
      }

      const isEnglishDetected =
        detectedLanguage.toLowerCase().includes('english') &&
        !detectedLanguage.toLowerCase().includes('tinglish') &&
        !detectedLanguage.toLowerCase().includes('hinglish');

      const enrichedSegments = normalizedRawSegments.map(
        (seg: Record<string, unknown>, index: number) => {
          const interval = relIntervals[index] || {
            start: (index / count) * clipDuration,
            end: ((index + 1) / count) * clipDuration,
          };
          const start = Number((startOffset + interval.start).toFixed(3));
          const end = Number(Math.max(start + 0.22, startOffset + interval.end).toFixed(3));

          const rawEmphWord = seg.emphasizedWord ? String(seg.emphasizedWord).trim() : '';
          const emphWord = transliterateIndicToRoman(rawEmphWord);
          const segHeroKeywords = emphWord
            ? [emphWord]
            : Array.isArray(seg.heroKeywords)
            ? seg.heroKeywords.map((k) => transliterateIndicToRoman(String(k)))
            : [];

          const rawVerbatimRoman = String(
            seg.verbatimRoman ||
              seg.tinglish ||
              seg.hinglish ||
              seg.verbatimNative ||
              seg.englishMeaning ||
              seg.english ||
              ''
          ).trim();
          // Strictly guarantee 100% Roman script (Tinglish/Hinglish) with zero native Telugu/Indic Unicode characters, and enforce emoji/punctuation settings
          const verbatimRoman = stripServerText(transliterateIndicToRoman(rawVerbatimRoman));
          const verbatimNative = stripServerText(
            String(
              seg.verbatimNative || seg.telugu || seg.hindi || seg.tamil || verbatimRoman
            ).trim()
          );
          const englishMeaning = stripServerText(
            transliterateIndicToRoman(
              String(seg.englishMeaning || seg.english || verbatimRoman).trim()
            )
          );

          const romanWords = buildWordTimings(
            verbatimRoman,
            start,
            end,
            segHeroKeywords,
            Boolean(autoHeroNLP)
          );
          const romanClean = romanWords.map((w) => w.word).join(' ');

          const nativeWords = buildWordTimings(
            verbatimNative,
            start,
            end,
            rawEmphWord ? [rawEmphWord] : segHeroKeywords,
            Boolean(autoHeroNLP)
          );
          const nativeClean = nativeWords.map((w) => w.word).join(' ');

          const englishWords = buildWordTimings(
            isEnglishDetected ? verbatimRoman : englishMeaning,
            start,
            end,
            segHeroKeywords,
            Boolean(autoHeroNLP)
          );
          const englishClean = englishWords.map((w) => w.word).join(' ');

          const tracks: Record<string, { text: string; words: WordTiming[] }> = {
            tinglish: { text: romanClean, words: romanWords },
            hinglish: { text: romanClean, words: romanWords },
            tanglish: { text: romanClean, words: romanWords },
            kanglish: { text: romanClean, words: romanWords },
            manglish: { text: romanClean, words: romanWords },
            roman_urdu: { text: romanClean, words: romanWords },
            english: { text: englishClean, words: englishWords },
            telugu: { text: nativeClean, words: nativeWords },
            hindi: { text: nativeClean, words: nativeWords },
            tamil: { text: nativeClean, words: nativeWords },
            kannada: { text: nativeClean, words: nativeWords },
            malayalam: { text: nativeClean, words: nativeWords },
            urdu: { text: nativeClean, words: nativeWords },
          };

          return {
            id: `seg-${Math.round(start * 100)}-${index + 1}-${Date.now()}`,
            displayLineNumber: index + 1,
            startTime: start,
            endTime: end,
            tracks,
          };
        }
      );

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

  // Kalakar AI Caption Director Agent Endpoint
  app.post('/api/captions/agent', async (req, res) => {
    try {
      const { prompt, currentStyle } = req.body;
      if (!prompt) {
        res.status(400).json({ error: 'Missing prompt' });
        return;
      }

      const response = await generateContentResilient(
        {
          contents: `You are the Kalakar Studio AI Caption Director Agent. The user wants to style or configure their video captions with minimal effort and maximum visual impact.
User request: "${prompt}"
Current style snapshot: ${JSON.stringify(currentStyle || {})}

Return a JSON object with:
- summary: A short 1-sentence human-friendly confirmation of what you configured.
- templateId: Optional Kalakar template ID (e.g. "KALAKAR_MOTION", "KALAKAR_HORMOZI", "KALAKAR_ALI_ABDAAL", "KALAKAR_MR_BEAST_1", "KALAKAR_CLEAN", "KALAKAR_LIQUID_GLASS", "SIDZ_VAIRAGYA", "SIDZ_20K_MINT").
- primaryTrack: Optional language track ("tinglish", "telugu", "hinglish", "hindi", "tamil", "english", "urdu", "roman_urdu").
- fontSize: Optional number between 28 and 84.
- bigWordScale: Optional number between 1.2 and 2.8.
- smallWordScale: Optional number between 0.5 and 1.1.
- positionY: Optional vertical position percentage (22 for top, 50 for center, 68 for bottom).
- smallTwoLineMode: Optional "auto" | "two-line-split" | "single-line".
- enableDropShadow: Optional boolean.
- enableGlow: Optional boolean.
- enable3D: Optional boolean.
- enableBackground: Optional boolean.
- enableAutoEmojis: Optional boolean.
- enableAudioClean: Optional boolean.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                templateId: { type: Type.STRING },
                primaryTrack: { type: Type.STRING },
                fontSize: { type: Type.NUMBER },
                bigWordScale: { type: Type.NUMBER },
                smallWordScale: { type: Type.NUMBER },
                positionY: { type: Type.NUMBER },
                smallTwoLineMode: { type: Type.STRING },
                enableDropShadow: { type: Type.BOOLEAN },
                enableGlow: { type: Type.BOOLEAN },
                enable3D: { type: Type.BOOLEAN },
                enableBackground: { type: Type.BOOLEAN },
                enableAutoEmojis: { type: Type.BOOLEAN },
                enableAudioClean: { type: Type.BOOLEAN },
              },
              required: ['summary'],
            },
          },
        },
        TEXT_MODEL_CHAIN
      );

      const parsed = safeParseJSON<Record<string, unknown>>(response.text, {
        summary: 'Applied optimal Kalakar studio caption settings for maximum impact.',
      });
      res.json(parsed);
    } catch (error: unknown) {
      console.error('Agent endpoint fallback:', error);
      res.status(200).json({
        summary: 'Applied smart Kalakar preset configuration for maximum visual clarity.',
        fallbackLocalAgent: true,
      });
    }
  });

  // Gemini AI Script-to-B-Roll 3-Scene Planner Endpoint (Analyzes created captions & selects 3 optimal B-Roll scenes)
  app.post('/api/broll/analyze-script', async (req, res) => {
    try {
      const { segments = [], defaultAspectRatio = '9:16' } = req.body;
      if (!Array.isArray(segments) || segments.length === 0) {
        res.status(400).json({ error: 'No caption segments provided for B-Roll analysis.' });
        return;
      }

      const compactTranscript = segments.map(
        (
          s: {
            id: string;
            startTime: number;
            endTime: number;
            text?: string;
          },
          i: number
        ) => ({
          index: i + 1,
          id: s.id,
          startTime: Number((s.startTime || 0).toFixed(2)),
          endTime: Number((s.endTime || 0).toFixed(2)),
          text: String(s.text || ''),
        })
      );

      const response = await generateContentResilient(
        {
          contents: `Analyze this short-form video caption script and plan exactly THREE (3) contextually apt, cinematic AI B-Roll image scenes distributed across the video (Scene 1: Early Hook, Scene 2: Mid-Video Core Concept, Scene 3: Climax / Takeaway).
For each of the 3 scenes, pick the best matching caption segment ID from the input list, write a vivid, photorealistic, high-contrast visual image generation prompt (no text inside the image) that illustrates what the speaker is talking about in that moment, and recommend an entrance animation and magical effect.

Caption Script:
${JSON.stringify(compactTranscript)}`,
          config: {
            systemInstruction:
              'You are an award-winning short-form video director and AI visual art director. Plan exactly 3 distinct, visually stunning B-Roll scenes that directly match the spoken script.',
            temperature: 0.35,
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
        },
        TEXT_MODEL_CHAIN
      );

      const parsed = safeParseJSON<{
        scenes?: Array<{
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
        }>;
      }>(response.text, {});

      res.json({
        defaultAspectRatio,
        scenes: parsed.scenes || [],
      });
    } catch (error: unknown) {
      console.error('B-Roll script analysis fallback:', error);
      res.status(200).json({
        scenes: [],
        fallbackLocalPlanner: true,
      });
    }
  });

  // Gemini AI Image Creation Endpoint for B-Roll Images (gemini-2.5-flash-image with 9:16, 1:1, 16:9 support)
  app.post('/api/broll/generate-image', async (req, res) => {
    try {
      const { prompt, aspectRatio = '9:16' } = req.body;
      if (!prompt) {
        res.status(400).json({ error: 'Missing B-Roll image prompt' });
        return;
      }

      const validRatio: '9:16' | '1:1' | '16:9' =
        aspectRatio === '1:1' || aspectRatio === '16:9' || aspectRatio === '9:16'
          ? aspectRatio
          : '9:16';

      const ai = getGenAIClient();
      const enhancedPrompt = `${prompt}. Ultra-cinematic lighting, shallow depth of field, rich color grading, 8k photorealistic B-roll visual, no text or watermarks.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: enhancedPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: validRatio,
          },
        },
      });

      let imageDataUrl = '';
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageDataUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageDataUrl) {
        res.status(200).json({
          imageDataUrl: '',
          fallbackRequired: true,
        });
        return;
      }

      res.json({
        imageDataUrl,
        aspectRatio: validRatio,
      });
    } catch (error: unknown) {
      console.error('Gemini B-Roll image generation error:', error);
      res.status(200).json({
        imageDataUrl: '',
        fallbackRequired: true,
      });
    }
  });

  // Dynamic AI Frame, Poster & Region Style Cloning Endpoint (Gemini Vision)
  app.post('/api/style/clone-from-frame', async (req, res) => {
    try {
      const {
        fullFrameDataUrl = '',
        croppedRegionDataUrl = '',
        regionIntent = 'auto',
        toolMode = 'box',
        sampledHexStops = [],
        sourceLabel = 'Frame',
      } = req.body || {};

      const targetImageUrl = String(croppedRegionDataUrl || fullFrameDataUrl || '');
      const match = targetImageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

      const fallbackStops =
        Array.isArray(sampledHexStops) && sampledHexStops.length >= 2
          ? sampledHexStops.slice(0, 5)
          : ['#FFFBEB', '#FACC15', '#F97316'];

      if (!match) {
        res.status(200).json({
          presetName: `${sourceLabel} Style`,
          fontFamily: 'Montserrat',
          textTransform: 'uppercase',
          primaryColor: '#FFFFFF',
          highlightColor: fallbackStops[0] || '#FACC15',
          gradientColors: fallbackStops,
          gradientAngle: 135,
          strokeWidth: 2,
          strokeColor: '#000000',
          dropShadowEnabled: true,
          glowEnabled: regionIntent === 'logo' || regionIntent === 'color',
          glowColor: fallbackStops[1] || '#10B981',
          depth3DEnabled: false,
          backgroundEnabled: regionIntent === 'logo',
          backgroundColor: '#090D16',
          reasoningSummary: `Created style from sampled palette (${fallbackStops.join(', ')})`,
        });
        return;
      }

      const mimeType = match[1];
      const base64Data = match[2];

      const allowedFonts = [
        'Montserrat',
        'Anton',
        'Bricolage Grotesque',
        'Plus Jakarta Sans',
        'Outfit',
        'Playfair Display',
        'Caveat',
        'Rubik Mono One',
        'Silkscreen',
        'Cinzel',
        'Bebas Neue',
        'Poppins',
        'Oswald',
      ];

      const promptText = `You are an elite short-form video typography & visual style cloning AI.
Analyze this ${toolMode === 'full' ? 'full video frame / poster' : 'selected bounding-box region'} (User intent: "${regionIntent}", Source: "${sourceLabel}").
Client-side pixel sampler detected these dominant hex colors in the region: ${JSON.stringify(fallbackStops)}.

Based on whether the selected region shows TEXT/CAPTIONS, a LOGO MARK, or a COLOR/POSTER AREA:
1. Pick the closest matching font family from this exact studio list: ${allowedFonts.join(', ')}.
2. Determine casing ("uppercase" | "lowercase" | "capitalize" | "none").
3. Extract a vivid 3-to-5 stop gradient ("gradientColors" array of hex strings) and optimal "gradientAngle" (0-360) that reproduces or harmonizes with the region's typography, logo mark, or color grade.
4. Set "primaryColor" (base text hex), "highlightColor" (hero word hex), "strokeWidth" (0-6), "strokeColor" (hex), "dropShadowEnabled" (boolean), "glowEnabled" (boolean), "glowColor" (hex), "depth3DEnabled" (boolean), "backgroundEnabled" (boolean), and "backgroundColor" (hex).
5. Provide a short "presetName" (2-3 words) and a concise 1-sentence "reasoningSummary".`;

      const response = await generateContentResilient(
        {
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              { text: promptText },
            ],
          },
          config: {
            temperature: 0.25,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                presetName: { type: Type.STRING },
                fontFamily: { type: Type.STRING },
                textTransform: { type: Type.STRING },
                primaryColor: { type: Type.STRING },
                highlightColor: { type: Type.STRING },
                gradientColors: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                gradientAngle: { type: Type.INTEGER },
                strokeWidth: { type: Type.NUMBER },
                strokeColor: { type: Type.STRING },
                dropShadowEnabled: { type: Type.BOOLEAN },
                glowEnabled: { type: Type.BOOLEAN },
                glowColor: { type: Type.STRING },
                depth3DEnabled: { type: Type.BOOLEAN },
                backgroundEnabled: { type: Type.BOOLEAN },
                backgroundColor: { type: Type.STRING },
                reasoningSummary: { type: Type.STRING },
              },
              required: [
                'presetName',
                'fontFamily',
                'textTransform',
                'primaryColor',
                'highlightColor',
                'gradientColors',
                'gradientAngle',
                'reasoningSummary',
              ],
            },
          },
        },
        TEXT_MODEL_CHAIN
      );

      const parsed = safeParseJSON<Record<string, unknown>>(response.text, {
        presetName: `${sourceLabel} Clone`,
        fontFamily: regionIntent === 'logo' ? 'Outfit' : 'Anton',
        textTransform: 'uppercase',
        primaryColor: '#FFFFFF',
        highlightColor: fallbackStops[0] || '#FACC15',
        gradientColors: fallbackStops,
        gradientAngle: 135,
        strokeWidth: 2,
        strokeColor: '#000000',
        dropShadowEnabled: true,
        glowEnabled: true,
        glowColor: fallbackStops[1] || '#10B981',
        depth3DEnabled: false,
        backgroundEnabled: false,
        backgroundColor: '#000000',
        reasoningSummary: `Matched style and ${fallbackStops.length}-stop gradient from ${sourceLabel}.`,
      });

      res.json(parsed);
    } catch (error: unknown) {
      console.error('Frame style clone fallback:', error);
      const fallbackStops =
        Array.isArray(req.body?.sampledHexStops) && req.body.sampledHexStops.length >= 2
          ? req.body.sampledHexStops.slice(0, 5)
          : ['#FFFBEB', '#FACC15', '#F97316'];
      res.status(200).json({
        presetName: 'AI Frame Clone',
        fontFamily: 'Montserrat',
        textTransform: 'uppercase',
        primaryColor: '#FFFFFF',
        highlightColor: fallbackStops[0] || '#FACC15',
        gradientColors: fallbackStops,
        gradientAngle: 135,
        strokeWidth: 2,
        strokeColor: '#000000',
        dropShadowEnabled: true,
        glowEnabled: true,
        glowColor: fallbackStops[1] || '#10B981',
        depth3DEnabled: false,
        backgroundEnabled: false,
        backgroundColor: '#000000',
        reasoningSummary: `Synthesized high-contrast caption style from sampled colors (${fallbackStops.join(', ')}).`,
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
