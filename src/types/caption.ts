export type TrackKey =
  | 'tinglish'
  | 'english'
  | 'telugu'
  | 'hinglish'
  | 'hindi'
  | 'tanglish'
  | 'tamil'
  | 'kanglish'
  | 'kannada'
  | 'manglish'
  | 'malayalam'
  | 'marathi'
  | 'bengali'
  | 'gujarati'
  | 'punjabi'
  | 'odia';

export interface LanguageMetadata {
  key: TrackKey;
  label: string;
  shortLabel: string;
  nativeName: string;
  region: string;
  isRomanized: boolean;
  recommendedFont: string;
  scriptInstruction: string;
  coreGenerated: boolean;
}

export type HeroReason =
  | 'emotion'
  | 'power-keyword'
  | 'number'
  | 'ai-nlp'
  | 'emphasis';

export type AutoHeroStrategy =
  | 'balanced-nlp'
  | 'emotional-peak'
  | 'numbers-hooks'
  | 'two-word-impact';

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  isHero?: boolean; // Big highlighted word in SIDZ / Premiere Pro mixed-scale mode
  heroReason?: HeroReason;
  heroScore?: number;
}

export interface CaptionTrackData {
  text: string;
  words: WordTiming[];
}

export interface CaptionSegment {
  id: string;
  startTime: number;
  endTime: number;
  tracks: Partial<Record<TrackKey, CaptionTrackData>>;
}

export type AnimationType =
  | 'premiere-pro'
  | 'karaoke'
  | 'pop'
  | 'box-slide'
  | 'typewriter'
  | 'neon-glow'
  | 'wave'
  | 'stomp'
  | 'cinema-fade';

export type DisplayMode = 'single' | 'dual-stacked';

export type HierarchyMode =
  | 'sidz-vairagya'
  | 'sidz-20k-script'
  | 'sidz-valuing-wide'
  | 'sidz-truly-flame'
  | 'premiere-mixed-scale'
  | 'stacked-hero-callout'
  | 'uniform';

export type GradientDirection = 'vertical' | 'horizontal' | 'diagonal' | 'radial';

export type MaskMode =
  | 'none'
  | 'linear-top-bottom'
  | 'bottom-cinema'
  | 'top-bottom-split'
  | 'rectangle'
  | 'circle-radial';

export type CaptionFrameStyle =
  | 'none'
  | 'ig-glass-pill'
  | 'ig-story-card'
  | 'ig-polaroid-frame'
  | 'ig-neon-border'
  | 'premiere-bounding-box';

export interface GradientPreset {
  id: string;
  name: string;
  colors: string[]; // 3 or 4 color stops
  isCustom?: boolean;
}

export type TextHorizontalAlign = 'left' | 'center' | 'right';

export type SmallTwoLineMode = 'auto' | 'two-line-split' | 'single-line';

export type LineOrderMode =
  | 'small1-small2-big'
  | 'small1-big-small2'
  | 'big-small1-small2';

export type ActiveCanvasLayer = 'all' | 'small1' | 'small2' | 'big';

export interface LayerHitBox {
  layer: 'small1' | 'small2' | 'big';
  x: number;
  y: number;
  width: number;
  height: number;
  handleX: number;
  handleY: number;
}

export interface CaptionStyleConfig {
  presetId: string;
  animationType: AnimationType;
  displayMode: DisplayMode;
  hierarchyMode: HierarchyMode;
  primaryTrack: TrackKey;
  secondaryTrack: TrackKey;
  fontFamily: string;
  heroWordFontFamily: string;
  accentScriptFontFamily?: string;
  secondaryFontFamily: string;
  fontSize: number;
  smallWordScale: number;
  smallLine2Scale?: number;
  bigWordScale: number;
  secondaryFontSize: number;
  fontWeight: number;
  textTransform: 'none' | 'uppercase' | 'capitalize';
  primaryColor: string;
  highlightColor: string;
  secondaryColor: string;
  useGradient: boolean;
  gradientPresetId: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  gradientFourth?: string;
  gradientDirection?: GradientDirection;
  gradientAngle?: number;
  gradientSpeed: number;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor: string;
  backgroundOpacity: number;
  positionX: number;
  positionY: number;
  // Individual Layer X/Y Offsets (% of canvas) & Individual Alignments
  smallOffsetX?: number;
  smallOffsetY?: number;
  smallLine2OffsetX?: number;
  smallLine2OffsetY?: number;
  bigOffsetX?: number;
  bigOffsetY?: number;
  smallTextAlign?: TextHorizontalAlign;
  smallLine2TextAlign?: TextHorizontalAlign;
  bigTextAlign?: TextHorizontalAlign;
  smallTwoLineMode?: SmallTwoLineMode;
  lineOrderMode?: LineOrderMode;
  showOnScreenTransformBoxes?: boolean;
  selectedCanvasLayer?: ActiveCanvasLayer;
  lineSpacing: number;
  letterSpacing: number;
  verticalSpacing: number;
  horizontalSpacing: number;
  wordsPerLine: number;
  animationSpeed: number;
  shadowBlur: number;
  showScrim: boolean;
  showSafeZones: boolean;
  // CapCut / Premiere Pro / Photoshop Mask Studio
  maskMode: MaskMode;
  maskColor: string;
  maskOpacity: number;
  maskFeather: number;
  maskAngle: number;
  maskCenterX: number;
  maskCenterY: number;
  maskRadiusX: number;
  maskRadiusY: number;
  maskInvert: boolean;
  // Instagram Frame & Dynamic Text Callout Frame
  showInstagramFrame: boolean;
  captionFrameStyle: CaptionFrameStyle;
}

export interface StylePreset {
  id: string;
  name: string;
  tagline: string;
  badgeText: string;
  smallPreviewText?: string;
  scriptPreviewText?: string;
  previewBg: string;
  config: Partial<CaptionStyleConfig>;
}

export interface SampleReel {
  id: string;
  title: string;
  creator: string;
  dialect: string;
  duration: number;
  themeColors: [string, string, string];
  accentColor: string;
  segments: CaptionSegment[];
}
