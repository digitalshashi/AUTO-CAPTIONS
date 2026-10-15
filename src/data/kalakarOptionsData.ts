import { StylePreset, TrackKey, VideoClipEditConfig } from '../types/caption';

export const DEFAULT_VIDEO_CLIP_EDIT: VideoClipEditConfig = {
  zoomX: 100,
  zoomY: 100,
  zoomLinked: true,
  positionX: 0,
  positionY: 0,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  cropLeft: 0,
  cropRight: 0,
  cropTop: 0,
  cropBottom: 0,
  cropSoftness: 0,
  cropRounded: 0,
  opacity: 100,
  volume: 100,
  muted: false,
};

// Section 3.1: 22 Desi & Regional Languages
export const KALAKAR_DESI_LANGUAGES_22: {
  name: string;
  nativeScriptSample: string;
  romanScriptSample: string;
  mappedTrack: TrackKey;
}[] = [
  { name: 'Hinglish', nativeScriptSample: 'भाई ये सच है 🔥', romanScriptSample: 'Bhai yeh sach hai 🔥', mappedTrack: 'hinglish' },
  { name: 'English', nativeScriptSample: 'Money & Friends 👥', romanScriptSample: 'Money & Friends 👥', mappedTrack: 'english' },
  { name: 'Bengali', nativeScriptSample: 'বন্ধুরা টাকা পয়সা 💰', romanScriptSample: 'Bondhura taka poisha 💰', mappedTrack: 'bengali' },
  { name: 'Hindi', nativeScriptSample: 'पैसा और दोस्त 💰👥', romanScriptSample: 'Paisa aur dost 💰👥', mappedTrack: 'hindi' },
  { name: 'Marathi', nativeScriptSample: 'मित्र आणि पैसे 💰', romanScriptSample: 'Mitra aani paise 💰', mappedTrack: 'marathi' },
  { name: 'Nepali', nativeScriptSample: 'साथी र पैसा 💰👥', romanScriptSample: 'Sathi ra paisa 💰👥', mappedTrack: 'nepali' },
  { name: 'Tamil', nativeScriptSample: 'பணம் மற்றும் நண்பர்கள் 💰', romanScriptSample: 'Panam matrum nanbargal 💰', mappedTrack: 'tamil' },
  { name: 'Telugu', nativeScriptSample: 'పైసలు 💰 రూపాయలు 💵 ఫ్రెండ్స్ 👥', romanScriptSample: 'paisalu 💰 roopaayalu 💵 friends 👥', mappedTrack: 'tinglish' },
  { name: 'Urdu', nativeScriptSample: 'یار میں پوری رات سویا نہیں 🌙', romanScriptSample: 'Yaar main poori raat soya nahi 🌙', mappedTrack: 'urdu' },
  { name: 'Kannada', nativeScriptSample: 'ಹಣ ಮತ್ತು ಸ್ನೇಹಿತರು 💰👥', romanScriptSample: 'Hana mattu snehitaru 💰👥', mappedTrack: 'kannada' },
  { name: 'Gujarati', nativeScriptSample: 'પૈસા અને મિત્રો 💰👥', romanScriptSample: 'Paisa ane mitro 💰👥', mappedTrack: 'gujarati' },
  { name: 'Pushto', nativeScriptSample: 'ملګري او پیسې 💰👥', romanScriptSample: 'Malgari aw paise 💰👥', mappedTrack: 'pashto' },
  { name: 'Punjabi', nativeScriptSample: 'ਪੈਸੇ ਤੇ ਯਾਰ ਦੋਸਤ 💰👥', romanScriptSample: 'Paise te yaar dost 💰👥', mappedTrack: 'punjabi' },
  { name: 'Malayalam', nativeScriptSample: 'പണവും സുഹൃത്തുക്കളും 💰👥', romanScriptSample: 'Panavum suhruthukkalum 💰👥', mappedTrack: 'malayalam' },
  { name: 'Malay', nativeScriptSample: 'Wang dan kawan 👥', romanScriptSample: 'Wang dan kawan 👥', mappedTrack: 'english' },
  { name: 'Sindhi', nativeScriptSample: 'پئسا ۽ دوست 💰👥', romanScriptSample: 'Paisa ain dost 💰👥', mappedTrack: 'sindhi' },
  { name: 'Persian', nativeScriptSample: 'پول و دوستان 💰👥', romanScriptSample: 'Pool va doostan 💰👥', mappedTrack: 'urdu' },
  { name: 'Arabic', nativeScriptSample: 'المال والأصدقاء 💰👥', romanScriptSample: 'Al-maal wal-asdiqaa 💰👥', mappedTrack: 'urdu' },
  { name: 'Assamese', nativeScriptSample: 'টকা আৰু বন্ধুসকল 💰👥', romanScriptSample: 'Toka aru bondhuxokol 💰👥', mappedTrack: 'assamese' },
  { name: 'Odia', nativeScriptSample: 'ଟଙ୍କା ଏବଂ ବନ୍ଧୁ 💰👥', romanScriptSample: 'Tanka ebam bandhu 💰👥', mappedTrack: 'odia' },
  { name: 'Kashmiri', nativeScriptSample: 'پۄنٛسہٕ تہٕ دۆس 💰👥', romanScriptSample: 'Ponsa ta dos 💰👥', mappedTrack: 'kashmiri' },
  { name: 'Saraiki', nativeScriptSample: 'پیسے اتے یار 💰👥', romanScriptSample: 'Paise ate yaar 💰👥', mappedTrack: 'roman_urdu' },
];

// Section 3.1: 79 Foreign Languages
export const KALAKAR_FOREIGN_LANGUAGES_79: string[] = [
  'Afrikaans', 'Amharic', 'Armenian', 'Asturian', 'Azerbaijani', 'Belarusian',
  'Bosnian', 'Bulgarian', 'Burmese', 'Cantonese', 'Catalan', 'Cebuano',
  'Chichewa', 'Croatian', 'Czech', 'Danish', 'Dutch', 'Estonian', 'Filipino',
  'Finnish', 'French', 'Fulah', 'Galician', 'Ganda', 'Georgian', 'German',
  'Greek', 'Hausa', 'Hebrew', 'Hungarian', 'Icelandic', 'Igbo', 'Indonesian',
  'Irish', 'Italian', 'Japanese', 'Javanese', 'Kabuverdianu', 'Kazakh',
  'Khmer', 'Korean', 'Kurdish', 'Kyrgyz', 'Lao', 'Latvian', 'Lingala',
  'Lithuanian', 'Luo', 'Luxembourgish', 'Macedonian', 'Maltese',
  'Mandarin Chinese', 'Māori', 'Mongolian', 'Northern Sotho', 'Norwegian',
  'Occitan', 'Polish', 'Portuguese', 'Romanian', 'Russian', 'Serbian',
  'Shona', 'Slovak', 'Slovenian', 'Somali', 'Spanish', 'Swahili', 'Swedish',
  'Tajik', 'Thai', 'Turkish', 'Ukrainian', 'Uzbek', 'Vietnamese', 'Welsh',
  'Wolof', 'Xhosa', 'Zulu',
];

// Section 9: Transitions IN / HOLD / OUT
export const TRANSITION_IN_OUT_OPTIONS: string[] = [
  'None',
  'Fade',
  'Pop',
  'Zoom',
  'Scale',
  'Slide Up',
  'Slide Down',
  'Slide Left',
  'Slide Right',
  'Rise Up',
  'Rise Down',
  'Hook Left',
  'Hook Right',
  'Punch',
  'Wobble',
  'Flicker',
];

export const TRANSITION_HOLD_OPTIONS: string[] = [
  'None',
  'Float',
  'Pulse',
  'Sway',
];

// Section 7.1: Extended Google Fonts list matching Kalakar
export const KALAKAR_GOOGLE_FONTS: { name: string; category: string }[] = [
  { name: 'Inter', category: 'Sans-Serif' },
  { name: 'Inter Tight', category: 'Sans-Serif' },
  { name: 'Instrument Serif', category: 'Editorial Serif' },
  { name: 'Montserrat', category: 'Geometric Sans' },
  { name: 'Zilla Slab', category: 'Slab Serif' },
  { name: 'Bricolage Grotesque', category: 'Creator Display' },
  { name: 'Plus Jakarta Sans', category: 'Modern UI Sans' },
  { name: 'Anton', category: 'Impact Condensed' },
  { name: 'Bebas Neue', category: 'Tall Headline' },
  { name: 'Syne', category: 'Wide Art Display' },
  { name: 'Outfit', category: 'Clean Geometric' },
  { name: 'Space Grotesk', category: 'Tech Display' },
  { name: 'Playfair Display', category: 'Luxury Serif' },
  { name: 'Cinzel', category: 'Cinematic Roman' },
  { name: 'Righteous', category: 'Retro Bold' },
  { name: 'Rubik Mono One', category: 'Heavy Block' },
  { name: 'Permanent Marker', category: 'Street Marker' },
  { name: 'Kaushan Script', category: 'Brush Script' },
  { name: 'Caveat', category: 'Handwritten' },
  { name: 'Pacifico', category: 'Cursive Pop' },
  { name: 'Noto Sans Telugu', category: 'Telugu Native' },
  { name: 'Noto Sans Devanagari', category: 'Hindi / Marathi / Nepali' },
  { name: 'Noto Sans Arabic', category: 'Urdu / Sindhi / Kashmiri RTL' },
  { name: 'Noto Sans Tamil', category: 'Tamil Native' },
  { name: 'Noto Sans Kannada', category: 'Kannada Native' },
  { name: 'Noto Sans Malayalam', category: 'Malayalam Native' },
  { name: 'Noto Sans Bengali', category: 'Bengali / Assamese' },
  { name: 'Noto Sans Gurmukhi', category: 'Punjabi Gurmukhi' },
  { name: 'Noto Sans Gujarati', category: 'Gujarati Native' },
];

export const KALAKAR_FONT_FACES: { label: string; weight: number; italic?: boolean }[] = [
  { label: 'Regular (400)', weight: 400 },
  { label: 'Medium (500)', weight: 500 },
  { label: 'Semi Bold (600)', weight: 600 },
  { label: 'Bold (700)', weight: 700 },
  { label: 'Extra Bold (800)', weight: 800 },
  { label: 'Black (900)', weight: 900 },
  { label: 'Regular Italic', weight: 400, italic: true },
];

// Section 3.3 & 6: Contextual Emoji Auto-Insertion (e.g. "paisalu 💰", "roopaayalu 💵", "friends 👥")
const EMOJI_KEYWORD_MAP: Record<string, string> = {
  paisalu: '💰',
  paisa: '💰',
  paise: '💰',
  money: '💰',
  roopaayalu: '💵',
  rupees: '💵',
  cash: '💵',
  crore: '🏆',
  lakh: '💎',
  '20k': '💰',
  '10x': '🚀',
  friends: '👥',
  dost: '👥',
  yaar: '🤝',
  mawa: '🔥',
  bhai: '🔥',
  secret: '🤫',
  rahasyam: '🤫',
  shock: '😱',
  viral: '⚡',
  reels: '🎬',
  video: '🎬',
  edit: '✂️',
  editing: '✂️',
  raat: '🌙',
  night: '🌙',
  sleep: '😴',
  soya: '😴',
  love: '❤️',
  dil: '❤️',
  power: '⚡',
  king: '👑',
  mind: '🧠',
  brain: '🧠',
  ai: '🤖',
  fast: '⚡',
  fire: '🔥',
  win: '🏆',
  idea: '💡',
};

export function injectKalakarEmojisIntoText(text: string): string {
  if (!text) return text;
  const words = text.split(/\s+/);
  const transformed = words.map((token) => {
    const clean = token.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const emoji = EMOJI_KEYWORD_MAP[clean];
    if (emoji && !token.includes(emoji)) {
      return `${token} ${emoji}`;
    }
    return token;
  });
  return transformed.join(' ');
}

export const injectEmojisIntoCaptionText = injectKalakarEmojisIntoText;

export function stripEmojisFromText(text: string): string {
  if (!text) return text;
  return text
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu,
      ''
    )
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function stripPunctuationFromText(text: string): string {
  if (!text) return text;
  return text
    .replace(/[.,!?;:'"()\-—…]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Section 8: All 48 Built-in Kalakar Templates
const KALAKAR_48_TEMPLATE_DEFS: {
  id: string;
  name: string;
  badgeText: string;
  smallPreviewText: string;
  isPremium?: boolean;
  primaryColor: string;
  highlightColor: string;
  gradientColors?: [string, string, string];
  fontFamily: string;
  animationType: StylePreset['config']['animationType'];
  hierarchyMode?: StylePreset['config']['hierarchyMode'];
  strokeWidth?: number;
  bgOpacity?: number;
  shadowBlur?: number;
}[] = [
  { id: 'kalakar-lala', name: 'Lala', badgeText: 'PAISALU 💰', smallPreviewText: 'nenu neeku', primaryColor: '#FFFFFF', highlightColor: '#30D158', gradientColors: ['#86EFAC', '#30D158', '#15803D'], fontFamily: 'Bricolage Grotesque', animationType: 'pop', hierarchyMode: 'premiere-mixed-scale', strokeWidth: 6 },
  { id: 'kalakar-ali-abdaal', name: 'Ali Abdaal', badgeText: 'PRODUCTIVITY', smallPreviewText: 'how to master', primaryColor: '#FFFFFF', highlightColor: '#38BDF8', gradientColors: ['#E0F2FE', '#38BDF8', '#0284C7'], fontFamily: 'Plus Jakarta Sans', animationType: 'box-slide', hierarchyMode: 'uniform', bgOpacity: 0.55 },
  { id: 'kalakar-double-trouble', name: 'Double Trouble', badgeText: 'ROOPAAYALU 💵', smallPreviewText: 'double impact', isPremium: true, primaryColor: '#FFFFFF', highlightColor: '#FFD60A', gradientColors: ['#FFFBEB', '#FDE047', '#EA580C'], fontFamily: 'Anton', animationType: 'premiere-pro', hierarchyMode: 'sidz-vairagya', strokeWidth: 8 },
  { id: 'kalakar-delhi', name: 'Delhi', badgeText: 'DILLI VIBES', smallPreviewText: 'apna style', primaryColor: '#FFFFFF', highlightColor: '#FF5722', gradientColors: ['#FFEDD5', '#FF5722', '#9A3412'], fontFamily: 'Bebas Neue', animationType: 'stomp', hierarchyMode: 'premiere-mixed-scale', strokeWidth: 7 },
  { id: 'kalakar-motion', name: 'Kalakar Motion', badgeText: 'KALAKAR ⚡', smallPreviewText: 'desi creators', primaryColor: '#FFFFFF', highlightColor: '#FF5722', gradientColors: ['#FFFFFF', '#FF7043', '#E64A19'], fontFamily: 'Bricolage Grotesque', animationType: 'karaoke', hierarchyMode: 'premiere-mixed-scale', strokeWidth: 6 },
  { id: 'kalakar-kathmandu', name: 'Kathmandu', badgeText: 'HIMALAYAN', smallPreviewText: 'sathi ra paisa', primaryColor: '#F8FAFC', highlightColor: '#F43F5E', gradientColors: ['#FFE4E6', '#FB7185', '#E11D48'], fontFamily: 'Outfit', animationType: 'pop', hierarchyMode: 'premiere-mixed-scale' },
  { id: 'kalakar-bold', name: 'Bold', badgeText: 'BOLD IMPACT', smallPreviewText: 'clean & heavy', primaryColor: '#FFFFFF', highlightColor: '#FACC15', fontFamily: 'Anton', animationType: 'stomp', hierarchyMode: 'uniform', strokeWidth: 9 },
  { id: 'kalakar-shadow', name: 'Shadow', badgeText: 'DEEP SHADOW', smallPreviewText: 'cinema contrast', primaryColor: '#FFFFFF', highlightColor: '#A855F7', fontFamily: 'Plus Jakarta Sans', animationType: 'cinema-fade', hierarchyMode: 'uniform', shadowBlur: 28 },
  { id: 'kalakar-bubbles', name: 'Bubbles', badgeText: 'BUBBLES 💬', smallPreviewText: 'fun creator pop', isPremium: true, primaryColor: '#FFFFFF', highlightColor: '#EC4899', gradientColors: ['#FCE7F3', '#F472B6', '#DB2777'], fontFamily: 'Righteous', animationType: 'pop', bgOpacity: 0.72 },
  { id: 'kalakar-ij-template', name: 'IJ Template', badgeText: 'IJ SIGNATURE', smallPreviewText: 'viral storytelling', isPremium: true, primaryColor: '#FFFFFF', highlightColor: '#22C55E', gradientColors: ['#DCFCE7', '#4ADE80', '#16A34A'], fontFamily: 'Bricolage Grotesque', animationType: 'premiere-pro', hierarchyMode: 'sidz-20k-script' },
  { id: 'kalakar-glow', name: 'Kalakar Glow', badgeText: 'NEON GLOW ✨', smallPreviewText: 'luminous aura', primaryColor: '#FFFFFF', highlightColor: '#00F5D4', gradientColors: ['#CCFBF1', '#2DD4BF', '#0D9488'], fontFamily: 'Syne', animationType: 'neon-glow', shadowBlur: 32 },
  { id: 'kalakar-clean-motion', name: 'Clean Motion', badgeText: 'CLEAN FLOW', smallPreviewText: 'minimalist motion', primaryColor: '#FFFFFF', highlightColor: '#60A5FA', fontFamily: 'Plus Jakarta Sans', animationType: 'wave', hierarchyMode: 'uniform', strokeWidth: 3 },
  { id: 'kalakar-goa', name: 'Goa', badgeText: 'SUNSET GOA', smallPreviewText: 'tropical gradient', primaryColor: '#FFFFFF', highlightColor: '#FB923C', gradientColors: ['#FEF08A', '#FB923C', '#E11D48'], fontFamily: 'Righteous', animationType: 'wave', hierarchyMode: 'premiere-mixed-scale' },
  { id: 'kalakar-islamabad', name: 'Islamabad', badgeText: 'ISLAMABAD', smallPreviewText: 'yaar main soya nahi', primaryColor: '#FFFFFF', highlightColor: '#10B981', gradientColors: ['#D1FAE5', '#34D399', '#059669'], fontFamily: 'Outfit', animationType: 'karaoke', hierarchyMode: 'premiere-mixed-scale' },
  { id: 'kalakar-italic', name: 'Italic', badgeText: 'EDITORIAL', smallPreviewText: 'serif emphasis', primaryColor: '#FFFFFF', highlightColor: '#FDE047', fontFamily: 'Playfair Display', animationType: 'cinema-fade', hierarchyMode: 'stacked-hero-callout' },
  { id: 'kalakar-mumbai', name: 'Mumbai', badgeText: 'MAXIMUM CITY', smallPreviewText: 'fast local pace', primaryColor: '#FFFFFF', highlightColor: '#F59E0B', gradientColors: ['#FEF3C7', '#FBBF24', '#D97706'], fontFamily: 'Anton', animationType: 'stomp', hierarchyMode: 'sidz-vairagya', strokeWidth: 8 },
  { id: 'kalakar-karachi', name: 'Karachi', badgeText: 'KARACHI NIGHTS', smallPreviewText: 'roman urdu hits', primaryColor: '#FFFFFF', highlightColor: '#38BDF8', gradientColors: ['#E0F2FE', '#38BDF8', '#2563EB'], fontFamily: 'Bricolage Grotesque', animationType: 'pop', hierarchyMode: 'premiere-mixed-scale' },
  { id: 'kalakar-shamani', name: 'Shamani', badgeText: 'PODCAST HOOK', smallPreviewText: 'raj shamani style', isPremium: true, primaryColor: '#FFFFFF', highlightColor: '#FACC15', gradientColors: ['#FFFFFF', '#FACC15', '#CA8A04'], fontFamily: 'Bricolage Grotesque', animationType: 'premiere-pro', hierarchyMode: 'sidz-vairagya', strokeWidth: 7 },
  { id: 'kalakar-shamani-2', name: 'Shamani 2', badgeText: 'EMPIRE MINDSET', smallPreviewText: 'dual tone authority', isPremium: true, primaryColor: '#FFFFFF', highlightColor: '#4ADE80', gradientColors: ['#ECFDF5', '#4ADE80', '#16A34A'], fontFamily: 'Anton', animationType: 'premiere-pro', hierarchyMode: 'sidz-20k-script', strokeWidth: 7 },
  { id: 'kalakar-flicker', name: 'Flicker', badgeText: 'FLICKER VOLTAGE', smallPreviewText: 'high tension', primaryColor: '#FFFFFF', highlightColor: '#E879F9', fontFamily: 'Syne', animationType: 'neon-glow', shadowBlur: 30 },
  { id: 'kalakar-underline', name: 'Underline', badgeText: 'UNDERLINED', smallPreviewText: 'key point focus', primaryColor: '#FFFFFF', highlightColor: '#38BDF8', fontFamily: 'Plus Jakarta Sans', animationType: 'karaoke', hierarchyMode: 'uniform' },
  { id: 'kalakar-pop-up', name: 'Pop Up', badgeText: 'POP UP 🔥', smallPreviewText: 'springy words', primaryColor: '#FFFFFF', highlightColor: '#FF5722', fontFamily: 'Outfit', animationType: 'pop', hierarchyMode: 'premiere-mixed-scale' },
  { id: 'kalakar-dhaka', name: 'Dhaka', badgeText: 'DHAKA VIBES', smallPreviewText: 'bangla & roman', primaryColor: '#FFFFFF', highlightColor: '#2DD4BF', gradientColors: ['#CCFBF1', '#2DD4BF', '#0F766E'], fontFamily: 'Bricolage Grotesque', animationType: 'pop' },
  { id: 'kalakar-shadow-pro', name: 'Kalakar Shadow', badgeText: 'STUDIO SHADOW', smallPreviewText: '3d depth drop', primaryColor: '#FFFFFF', highlightColor: '#FB923C', fontFamily: 'Bricolage Grotesque', animationType: 'karaoke', shadowBlur: 32, strokeWidth: 7 },
  { id: 'kalakar-classic', name: 'Kalakar', badgeText: 'KALAKAR PRO', smallPreviewText: 'signature desi look', primaryColor: '#FFFFFF', highlightColor: '#FF5722', gradientColors: ['#FFF7ED', '#FF5722', '#C2410C'], fontFamily: 'Bricolage Grotesque', animationType: 'premiere-pro', hierarchyMode: 'sidz-vairagya' },
  { id: 'kalakar-hormozi', name: 'Hormozi Style', badgeText: '10X MONEY 💰', smallPreviewText: 'alex hormozi punch', primaryColor: '#FFFFFF', highlightColor: '#22C55E', gradientColors: ['#86EFAC', '#22C55E', '#15803D'], fontFamily: 'Anton', animationType: 'stomp', hierarchyMode: 'premiere-mixed-scale', strokeWidth: 9 },
  { id: 'kalakar-editing-skool', name: 'Editing Skool', badgeText: 'EDITING SKOOL', smallPreviewText: 'pro timeline grade', isPremium: true, primaryColor: '#FFFFFF', highlightColor: '#A78BFA', gradientColors: ['#EDE9FE', '#A78BFA', '#6D28D9'], fontFamily: 'Syne', animationType: 'premiere-pro', hierarchyMode: 'sidz-valuing-wide' },
  { id: 'kalakar-mrbeast-1', name: 'Mr Beast Style 1', badgeText: '$100,000 CHALLENGE', smallPreviewText: 'extreme retention', primaryColor: '#FFFFFF', highlightColor: '#FACC15', gradientColors: ['#FEF08A', '#FACC15', '#EA580C'], fontFamily: 'Rubik Mono One', animationType: 'stomp', strokeWidth: 10 },
  { id: 'kalakar-mrbeast-2', name: 'Mr Beast Style 2', badgeText: 'LAST TO LEAVE!', smallPreviewText: 'cyan & yellow slam', isPremium: true, primaryColor: '#FFFFFF', highlightColor: '#38BDF8', gradientColors: ['#BAE6FD', '#38BDF8', '#0284C7'], fontFamily: 'Anton', animationType: 'pop', strokeWidth: 9 },
  { id: 'kalakar-iman-gadzhi', name: 'Iman Gadzhi', badgeText: 'MONK MODE', smallPreviewText: 'minimalist luxury', isPremium: true, primaryColor: '#F8FAFC', highlightColor: '#E2E8F0', gradientColors: ['#FFFFFF', '#CBD5E1', '#64748B'], fontFamily: 'Playfair Display', animationType: 'cinema-fade', hierarchyMode: 'stacked-hero-callout' },
  { id: 'kalakar-devin-jatho', name: 'Devin Jatho', badgeText: 'DEVIN JATHO', smallPreviewText: 'bouncy pill cuts', isPremium: true, primaryColor: '#FFFFFF', highlightColor: '#F43F5E', gradientColors: ['#FFE4E6', '#FB7185', '#BE123C'], fontFamily: 'Bricolage Grotesque', animationType: 'box-slide', bgOpacity: 0.65 },
  { id: 'kalakar-highlighted-word', name: 'Highlighted Word', badgeText: 'FRIENDS 👥', smallPreviewText: 'green word spotlight', primaryColor: '#FFFFFF', highlightColor: '#30D158', fontFamily: 'Plus Jakarta Sans', animationType: 'box-slide', bgOpacity: 0.7 },
  { id: 'kalakar-clean-glow', name: 'Clean Glow Style', badgeText: 'SOFT AURA', smallPreviewText: 'ambient halo text', primaryColor: '#FFFFFF', highlightColor: '#FDE047', fontFamily: 'Outfit', animationType: 'neon-glow', shadowBlur: 26 },
  { id: 'kalakar-clean', name: 'Kalakar Clean', badgeText: 'SIMPLE & CRISP', smallPreviewText: 'zero clutter', primaryColor: '#FFFFFF', highlightColor: '#FFFFFF', fontFamily: 'Plus Jakarta Sans', animationType: 'karaoke', hierarchyMode: 'uniform', strokeWidth: 4 },
  { id: 'kalakar-black-punch', name: 'Black Punch', badgeText: 'BLACK PUNCH', smallPreviewText: 'solid dark box', primaryColor: '#FFFFFF', highlightColor: '#FFD60A', fontFamily: 'Anton', animationType: 'stomp', bgOpacity: 0.85 },
  { id: 'kalakar-word', name: 'Kalakar Word', badgeText: 'ONE WORD', smallPreviewText: 'rapid fire cadence', primaryColor: '#FFFFFF', highlightColor: '#FF5722', fontFamily: 'Bebas Neue', animationType: 'stomp' },
  { id: 'kalakar-pixelated', name: 'Pixelated Word', badgeText: 'CYBER PIXEL', smallPreviewText: 'arcade tech vibe', isPremium: true, primaryColor: '#FFFFFF', highlightColor: '#00F5D4', fontFamily: 'Space Grotesk', animationType: 'typewriter' },
  { id: 'kalakar-ziada', name: 'Ziada', badgeText: 'BOHOT ZIADA', smallPreviewText: 'extra bold scale', primaryColor: '#FFFFFF', highlightColor: '#F97316', fontFamily: 'Syne', animationType: 'premiere-pro', hierarchyMode: 'sidz-valuing-wide' },
  { id: 'kalakar-liquid-glass', name: 'Liquid Glass', badgeText: 'LIQUID GLASS', smallPreviewText: 'apple vision frost', isPremium: true, primaryColor: '#FFFFFF', highlightColor: '#7DD3FC', gradientColors: ['#FFFFFF', '#BAE6FD', '#38BDF8'], fontFamily: 'Plus Jakarta Sans', animationType: 'box-slide', bgOpacity: 0.5 },
  { id: 'kalakar-top-up', name: 'Top Up', badgeText: 'RISE UPWARD', smallPreviewText: 'smooth vertical lift', primaryColor: '#FFFFFF', highlightColor: '#4ADE80', fontFamily: 'Outfit', animationType: 'pop' },
  { id: 'kalakar-mota', name: 'Mota', badgeText: 'MOTA BHAI', smallPreviewText: 'ultra thick slab', primaryColor: '#FFFFFF', highlightColor: '#FACC15', fontFamily: 'Rubik Mono One', animationType: 'stomp', strokeWidth: 9 },
  { id: 'kalakar-tabahi', name: 'Tabahi', badgeText: 'TABAHI 🔥', smallPreviewText: 'explosive mass reel', isPremium: true, primaryColor: '#FFFFFF', highlightColor: '#EF4444', gradientColors: ['#FEF08A', '#F97316', '#DC2626'], fontFamily: 'Anton', animationType: 'premiere-pro', hierarchyMode: 'sidz-truly-flame', strokeWidth: 9 },
  { id: 'kalakar-deep-glow', name: 'Deep Glow', badgeText: 'MIDNIGHT GLOW', smallPreviewText: 'electric neon bloom', primaryColor: '#FFFFFF', highlightColor: '#C084FC', gradientColors: ['#F3E8FF', '#C084FC', '#7E22CE'], fontFamily: 'Bricolage Grotesque', animationType: 'neon-glow', shadowBlur: 34 },
  { id: 'kalakar-seedha-saadha', name: 'Seedha Saadha', badgeText: 'SEEDHA SAADHA', smallPreviewText: 'honest & readable', primaryColor: '#FFFFFF', highlightColor: '#FDE047', fontFamily: 'Plus Jakarta Sans', animationType: 'karaoke', hierarchyMode: 'uniform', strokeWidth: 4 },
  { id: 'kalakar-thora-cinematic', name: 'Thora Cinematic', badgeText: 'CINEMA SCOPE', smallPreviewText: 'anurag kashyap vibe', isPremium: true, primaryColor: '#FEF9C3', highlightColor: '#Facc15', fontFamily: 'Cinzel', animationType: 'cinema-fade', hierarchyMode: 'stacked-hero-callout', shadowBlur: 24 },
  { id: 'kalakar-zero-gravity', name: 'Zero Gravity', badgeText: 'ZERO GRAVITY', smallPreviewText: 'weightless float', isPremium: true, primaryColor: '#FFFFFF', highlightColor: '#38BDF8', gradientColors: ['#E0F2FE', '#38BDF8', '#6366F1'], fontFamily: 'Space Grotesk', animationType: 'wave' },
];

export const KALAKAR_48_BUILT_IN_PRESETS: StylePreset[] = KALAKAR_48_TEMPLATE_DEFS.map((t) => ({
  id: t.id,
  name: t.name,
  tagline: `${t.smallPreviewText} · ${t.fontFamily}`,
  badgeText: t.badgeText,
  smallPreviewText: t.smallPreviewText,
  previewBg: 'from-zinc-900 via-zinc-950 to-black',
  isPremium: t.isPremium,
  config: {
    presetId: t.id,
    animationType: t.animationType || 'premiere-pro',
    hierarchyMode: t.hierarchyMode || 'premiere-mixed-scale',
    fontFamily: t.fontFamily,
    heroWordFontFamily: t.fontFamily,
    primaryColor: t.primaryColor,
    highlightColor: t.highlightColor,
    useGradient: Boolean(t.gradientColors),
    gradientStart: t.gradientColors?.[0] || t.highlightColor,
    gradientMid: t.gradientColors?.[1] || t.highlightColor,
    gradientEnd: t.gradientColors?.[2] || t.highlightColor,
    strokeWidth: t.strokeWidth ?? 6,
    backgroundOpacity: t.bgOpacity ?? 0,
    shadowBlur: t.shadowBlur ?? 18,
  },
}));

// Section 1.2 & 13: Kalakar Academy Tutorials (/academy)
export const KALAKAR_ACADEMY_TUTORIALS = [
  {
    id: 'tut-low-res',
    title: 'What is Low Res Preview?',
    duration: '1:45',
    category: 'Editor Basics',
    desc: 'Learn how Kalakar uses Low-Res Proxy Preview for silky 60fps timeline playback while exporting in full crisp 1080p/4K.',
  },
  {
    id: 'tut-roman-vs-native',
    title: 'Using Native vs Roman Script (Telugu, Hindi, Urdu & 101 Languages)',
    duration: '2:30',
    category: 'Desi Captions',
    desc: 'How to transcribe spoken Telugu, Hindi, or Urdu directly into Roman script ("paisalu 💰 roopaayalu 💵") or Native script.',
  },
  {
    id: 'tut-masking-subject',
    title: 'Put Captions Behind the Subject with AI Masking',
    duration: '3:10',
    category: 'Pro Effects',
    desc: 'Use per-line "Put behind the subject" and Linear/Radial Depth Masks for viral 3D depth typography.',
  },
  {
    id: 'tut-curve-arch',
    title: 'Arctext & Per-Line Curve Into an Arch',
    duration: '2:05',
    category: 'Typography',
    desc: 'Bend any caption line into an Arch, Valley, Globe, or Dome and spread words across the frame.',
  },
  {
    id: 'tut-premiere-davinci',
    title: 'Exporting to Premiere Pro & DaVinci Resolve Plugins',
    duration: '2:50',
    category: 'Workflows',
    desc: 'Round-trip your captions into Adobe Premiere Pro and DaVinci Resolve via FCPXML or Transparent Alpha WebM.',
  },
];

export const KALAKAR_48_TEMPLATES = KALAKAR_48_BUILT_IN_PRESETS;

