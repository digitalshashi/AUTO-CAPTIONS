import { CaptionSegment, TrackKey, WordTiming } from '../types/caption';

const INDIC_UNICODE_REGEX = /[\u0900-\u0D7F]/;

export const ROMAN_TRACK_KEYS: Set<TrackKey> = new Set([
  'tinglish',
  'hinglish',
  'tanglish',
  'kanglish',
  'manglish',
  'roman_urdu',
  'english',
]);

export function isRomanTrack(trackKey: TrackKey | string): boolean {
  return ROMAN_TRACK_KEYS.has(trackKey as TrackKey);
}

export function containsIndicScript(text: string): boolean {
  return INDIC_UNICODE_REGEX.test(text || '');
}

/**
 * High-frequency Telugu & Hindi creator vocabulary mapped to natural colloquial Tinglish / Hinglish
 * so common words match how Telugu/Indian creators naturally spell them in Roman script.
 */
const TELUGU_WORD_DICTIONARY: Record<string, string> = {
  'చూస్తున్నప్పుడు': 'chusthunnappudu',
  'చూస్తున్నపుడు': 'chusthunnappudu',
  'ప్రతి': 'prathi',
  'ప్రతీ': 'prathi',
  'సెకను': 'second',
  'సెకన్': 'second',
  'మనందరం': 'manandaram',
  'మనందరమూ': 'manandaram',
  'చూడాల్సిన': 'chudalsina',
  'చూడవలసిన': 'chudalsina',
  'వీడియో': 'video',
  'ఇది': 'idhi',
  'ఇదే': 'idhe',
  'పూర్తిగా': 'poorthiga',
  'చూసేయండి': 'chuseyandi',
  'చూడండి': 'chudandi',
  'ఏదో': 'edho',
  'చూస్తున్నా': 'chusthunna',
  'చూస్తున్నాను': 'chusthunnanu',
  'కానీ': 'kani',
  'కాని': 'kani',
  'ఏం': 'em',
  'ఏమి': 'emi',
  'తెలియడం': 'teliyadam',
  'తెలియటం': 'teliyadam',
  'లేదు': 'ledhu',
  'వినపడుతుంది': 'vinapaduthundi',
  'వినబడుతుంది': 'vinapaduthundi',
  'నువ్వు': 'nuvvu',
  'మీరు': 'meeru',
  'మనం': 'manam',
  'నేను': 'nenu',
  'ఈ': 'ee',
  'ఆ': 'aa',
  'ఎందుకు': 'enduku',
  'చూస్తున్నావో': 'chusthunnavo',
  'నీకు': 'neeku',
  'మీకు': 'meeku',
  'నాకు': 'naaku',
  'తెలియకపోవచ్చు': 'teliyakapovachu',
  'ఎక్కడా': 'ekkada',
  'ఎక్కడ': 'ekkada',
  'మిస్': 'miss',
  'అవ్వద్దు': 'avvaddu',
  'అవద్దు': 'avvaddu',
  'అవ్వకండి': 'avvakandi',
  'చాలా': 'chala',
  'మంది': 'mandhi',
  'నిజంగా': 'nijanga',
  'నిజం': 'nijam',
  'రహస్యం': 'rahasyam',
  'డబ్బు': 'dabbu',
  'డబ్బులు': 'dabbulu',
  'పైసలు': 'paisalu',
  'రూపాయలు': 'roopaayalu',
  'టైమ్': 'time',
  'సమయం': 'samayam',
  'జీవితం': 'jeevitham',
  'మనసు': 'manasu',
  'ఆలోచన': 'alochana',
  'మాట': 'maata',
  'మాటలు': 'maatalu',
  'ఒక్క': 'okka',
  'ఒక్కసారి': 'okkasari',
  'ఒక': 'oka',
  'ఇప్పుడు': 'ippudu',
  'అప్పుడు': 'appudu',
  'ఎప్పుడు': 'eppudu',
  'ఇక్కడ': 'ikkada',
  'అక్కడ': 'akkada',
  'ఎలా': 'ela',
  'ఇలా': 'ila',
  'అలా': 'ala',
  'ఎవరైనా': 'evaraina',
  'అందరూ': 'andaru',
  'అంతా': 'antha',
  'కొత్త': 'kotha',
  'పెద్ద': 'pedda',
  'చిన్న': 'chinna',
  'మంచి': 'manchi',
  'రోజు': 'roju',
  'రోజులు': 'rojulu',
  'సంవత్సరం': 'samvatsaram',
  'ప్రపంచం': 'prapancham',
  'దేశం': 'desam',
  'తెలుగు': 'Telugu',
  'మావ': 'mawa',
  'బ్రో': 'bro',
  'ఫ్రెండ్స్': 'friends',
  'షాక్': 'shock',
  'అవుతారు': 'avtharu',
  'అవుతుంది': 'avthundi',
  'ఉంది': 'undhi',
  'ఉన్నాయి': 'unnayi',
  'ఉన్నారు': 'unnaru',
  'చేసి': 'chesi',
  'చేస్తే': 'cheste',
  'చేయండి': 'cheyandi',
  'చెప్పండి': 'cheppandi',
  'చెప్తాను': 'chepthanu',
  'విషయం': 'vishayam',
  'కథ': 'katha',
  'ప్రేమ': 'prema',
  'భయం': 'bhayam',
  'కలలు': 'kalalu',
  'గెలుపు': 'gelupu',
  'ఓటమి': 'otami',
  'అద్భుతం': 'adbhutham',
};

// Telugu Unicode (U+0C00..U+0C7F) tables
const TELUGU_INDEPENDENT_VOWELS: Record<string, string> = {
  'అ': 'a',
  'ఆ': 'aa',
  'ఇ': 'i',
  'ఈ': 'ee',
  'ఉ': 'u',
  'ఊ': 'oo',
  'ఋ': 'ru',
  'ౠ': 'roo',
  'ఎ': 'e',
  'ఏ': 'e',
  'ఐ': 'ai',
  'ఒ': 'o',
  'ఓ': 'o',
  'ఔ': 'au',
};

const TELUGU_CONSONANTS: Record<string, string> = {
  'క': 'k',
  'ఖ': 'kh',
  'గ': 'g',
  'ఘ': 'gh',
  'ఙ': 'ng',
  'చ': 'ch',
  'ఛ': 'chh',
  'జ': 'j',
  'ఝ': 'jh',
  'ఞ': 'ny',
  'ట': 't',
  'ఠ': 'th',
  'డ': 'd',
  'ఢ': 'dh',
  'ణ': 'n',
  'త': 'th',
  'థ': 'th',
  'ద': 'd',
  'ధ': 'dh',
  'న': 'n',
  'ప': 'p',
  'ఫ': 'ph',
  'బ': 'b',
  'భ': 'bh',
  'మ': 'm',
  'య': 'y',
  'ర': 'r',
  'ఱ': 'r',
  'ల': 'l',
  'ళ': 'l',
  'ఴ': 'zh',
  'వ': 'v',
  'శ': 'sh',
  'ష': 'sh',
  'స': 's',
  'హ': 'h',
};

const TELUGU_MATRAS: Record<string, string> = {
  'ా': 'aa',
  'ి': 'i',
  'ీ': 'ee',
  'ు': 'u',
  'ూ': 'oo',
  'ృ': 'ru',
  'ౄ': 'roo',
  'ె': 'e',
  'ే': 'e',
  'ై': 'ai',
  'ొ': 'o',
  'ో': 'o',
  'ౌ': 'au',
};

const TELUGU_VIRAMA = '్';

// Devanagari Unicode (U+0900..U+097F) tables
const DEVANAGARI_INDEPENDENT_VOWELS: Record<string, string> = {
  'अ': 'a',
  'आ': 'aa',
  'इ': 'i',
  'ई': 'ee',
  'उ': 'u',
  'ऊ': 'oo',
  'ऋ': 'ri',
  'ए': 'e',
  'ऐ': 'ai',
  'ओ': 'o',
  'औ': 'au',
};

const DEVANAGARI_CONSONANTS: Record<string, string> = {
  'क': 'k',
  'ख': 'kh',
  'ग': 'g',
  'घ': 'gh',
  'ङ': 'ng',
  'च': 'ch',
  'छ': 'chh',
  'ज': 'j',
  'झ': 'jh',
  'ञ': 'ny',
  'ट': 't',
  'ठ': 'th',
  'ड': 'd',
  'ढ': 'dh',
  'ण': 'n',
  'त': 't',
  'थ': 'th',
  'द': 'd',
  'ध': 'dh',
  'न': 'n',
  'प': 'p',
  'फ': 'ph',
  'ब': 'b',
  'भ': 'bh',
  'म': 'm',
  'य': 'y',
  'र': 'r',
  'ल': 'l',
  'ळ': 'l',
  'व': 'v',
  'श': 'sh',
  'ष': 'sh',
  'स': 's',
  'ह': 'h',
  'क़': 'q',
  'ख़': 'kh',
  'ग़': 'gh',
  'ज़': 'z',
  'ड़': 'r',
  'ढ़': 'rh',
  'फ़': 'f',
};

const DEVANAGARI_MATRAS: Record<string, string> = {
  'ा': 'aa',
  'ि': 'i',
  'ी': 'ee',
  'ु': 'u',
  'ू': 'oo',
  'ृ': 'ri',
  'े': 'e',
  'ै': 'ai',
  'ो': 'o',
  'ौ': 'au',
  'ॉ': 'o',
  'ॅ': 'e',
};

const DEVANAGARI_VIRAMA = '्';

function transliterateTeluguWord(word: string): string {
  // Strip surrounding punctuation/asterisks, preserve them around the transliterated core
  const match = word.match(/^([*'"([{.,!?;:\-]*)([\s\S]*?)([*'")\]}.,!?;:\-]*)$/);
  const prefix = match ? match[1] : '';
  const core = match ? match[2] : word;
  const suffix = match ? match[3] : '';

  if (!core) return word;
  if (TELUGU_WORD_DICTIONARY[core]) {
    return `${prefix}${TELUGU_WORD_DICTIONARY[core]}${suffix}`;
  }

  let out = '';
  const chars = Array.from(core);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];

    if (TELUGU_INDEPENDENT_VOWELS[ch]) {
      out += TELUGU_INDEPENDENT_VOWELS[ch];
      continue;
    }

    if (TELUGU_CONSONANTS[ch]) {
      const base = TELUGU_CONSONANTS[ch];
      if (next === TELUGU_VIRAMA) {
        out += base;
        i++; // consume virama
      } else if (next && TELUGU_MATRAS[next]) {
        out += base + TELUGU_MATRAS[next];
        i++; // consume matra
      } else {
        out += base + 'a';
      }
      continue;
    }

    if (TELUGU_MATRAS[ch]) {
      out += TELUGU_MATRAS[ch];
      continue;
    }

    if (ch === TELUGU_VIRAMA) {
      continue;
    }

    if (ch === 'ం' || ch === 'ఁ') {
      // Anusvara: 'm' at end of word or before labial (p, b, m, v), otherwise 'n'
      const nextCons = next ? TELUGU_CONSONANTS[next] : '';
      if (!next || ['p', 'ph', 'b', 'bh', 'm', 'v', 's', 'sh', 'h'].includes(nextCons)) {
        out += 'm';
      } else {
        out += 'n';
      }
      continue;
    }

    if (ch === 'ః') {
      out += 'h';
      continue;
    }

    // Other Indic ranges fallback (Devanagari)
    if (DEVANAGARI_INDEPENDENT_VOWELS[ch]) {
      out += DEVANAGARI_INDEPENDENT_VOWELS[ch];
      continue;
    }
    if (DEVANAGARI_CONSONANTS[ch]) {
      const base = DEVANAGARI_CONSONANTS[ch];
      if (next === DEVANAGARI_VIRAMA) {
        out += base;
        i++;
      } else if (next && DEVANAGARI_MATRAS[next]) {
        out += base + DEVANAGARI_MATRAS[next];
        i++;
      } else if (!next) {
        // Hindi schwa deletion at word end
        out += base;
      } else {
        out += base + 'a';
      }
      continue;
    }
    if (DEVANAGARI_MATRAS[ch]) {
      out += DEVANAGARI_MATRAS[ch];
      continue;
    }
    if (ch === DEVANAGARI_VIRAMA) {
      continue;
    }
    if (ch === 'ं' || ch === 'ँ') {
      out += 'n';
      continue;
    }
    if (ch === 'ः') {
      out += 'h';
      continue;
    }

    // Keep ASCII / emojis / punctuation intact
    if (!INDIC_UNICODE_REGEX.test(ch)) {
      out += ch;
    }
  }

  return `${prefix}${out || core}${suffix}`;
}

/**
 * Converts any native Telugu / Hindi / Indic Unicode characters in a phrase into phonetic Roman script (Tinglish / Hinglish).
 * If the text is already 100% Roman script, returns it unchanged.
 */
export function transliterateIndicToRoman(text: string): string {
  if (!text || !containsIndicScript(text)) {
    return text;
  }
  return text
    .split(/(\s+)/)
    .map((token) => (containsIndicScript(token) ? transliterateTeluguWord(token) : token))
    .join('');
}

/**
 * Ensures all Romanized tracks (tinglish, hinglish, tanglish, kanglish, manglish, roman_urdu, english)
 * in a CaptionSegment array contain 100% Roman script (zero native Telugu/Indic Unicode leakage)
 * and have clean 1-indexed sequential displayLineNumber values.
 */
export function sanitizeSegmentsForRomanTracks(
  segments: CaptionSegment[]
): CaptionSegment[] {
  return segments.map((seg, idx) => {
    let changed = false;
    const nextTracks: CaptionSegment['tracks'] = { ...seg.tracks };

    (Object.keys(nextTracks) as TrackKey[]).forEach((tk) => {
      if (!isRomanTrack(tk)) return;
      const tr = nextTracks[tk];
      if (!tr) return;

      const textHasIndic = containsIndicScript(tr.text);
      const wordsHaveIndic = tr.words?.some((w) => containsIndicScript(w.word));

      if (textHasIndic || wordsHaveIndic) {
        changed = true;
        const cleanWords: WordTiming[] = (tr.words || []).map((w) => ({
          ...w,
          word: transliterateIndicToRoman(w.word),
        }));
        const cleanText =
          cleanWords.length > 0
            ? cleanWords.map((w) => w.word).join(' ')
            : transliterateIndicToRoman(tr.text);
        nextTracks[tk] = {
          text: cleanText,
          words: cleanWords,
        };
      }
    });

    const cleanLineNum = idx + 1;
    if (!changed && seg.displayLineNumber === cleanLineNum) {
      return seg;
    }

    return {
      ...seg,
      displayLineNumber: cleanLineNum,
      tracks: nextTracks,
    };
  });
}

export const sanitizeSegmentsRomanTracks = sanitizeSegmentsForRomanTracks;

