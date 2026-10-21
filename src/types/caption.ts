export type TrackKey =
  | 'tinglish'
  | 'english'
  | 'telugu'
  | 'hinglish'
  | 'hindi'
  | 'roman_urdu'
  | 'urdu'
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
  | 'odia'
  | 'sindhi'
  | 'nepali'
  | 'assamese'
  | 'kashmiri'
  | 'pashto';

export type VideoAspectRatio = '9:16' | '16:9' | '1:1';

export interface AudioEnhancerConfig {
  enabled: boolean;
  noiseReductionDb: number;
  voiceClarityBoost: number;
  studioWarmth?: number;
  loudnessNormalize?: boolean;
  remainingCredits?: number;
}

export interface LanguageMetadata {
  key: TrackKey;
  label: string;
  shortLabel: string;
  nativeName: string;
  region: string;
  isRomanized: boolean;
  isRTL?: boolean;
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
  isHero?: boolean; // Big highlighted / emphasized word (green chip in Kalakar list)
  heroReason?: HeroReason;
  heroScore?: number;
  // Section 5.3 Per-word styling overrides
  isBold?: boolean;
  isItalic?: boolean;
  isShine?: boolean;
  customColor?: string;
  customFontFamily?: string;
  customScale?: number;
  isUnderlined?: boolean;
}

export interface LineStyleOverride {
  templateId?: string;
  fontFamily?: string;
  fontFace?: string;
  fontSize?: number;
  line1FontSizePx?: number;
  line2FontSizePx?: number;
  line3FontSizePx?: number;
  line1Bold?: boolean;
  line1Italic?: boolean;
  line1Shine?: boolean;
  line1Color?: string;
  line2Bold?: boolean;
  line2Italic?: boolean;
  line2Shine?: boolean;
  line2Color?: string;
  line3Bold?: boolean;
  line3Italic?: boolean;
  line3Shine?: boolean;
  line3Color?: string;
  backgroundEnabled?: boolean;
  positionX?: number;
  positionY?: number;
  primaryColor?: string;
  secondaryColor?: string;
  emphasisMode?: 'emphasize' | 'spotlight';
}

export interface CaptionTrackData {
  text: string;
  words: WordTiming[];
}

export type BRollDisplayLayout = 'cutaway' | 'pip_card' | 'split_backdrop';

export type BRollMotionPreset = 'ken_burns_zoom' | 'pan_glide' | 'portal_pop';

export type BRollMagicalEffect =
  | 'all_magic'
  | 'gold_emerald_particles'
  | 'light_leaks'
  | 'aura_burst';

export type BRollSfxPreset =
  | 'magical_chime'
  | 'cinematic_whoosh'
  | 'bass_impact'
  | 'none';

export interface AIBRollSlot {
  id: string;
  slotNumber: 1 | 2 | 3;
  title: string;
  scriptContext: string;
  prompt: string;
  aspectRatio: VideoAspectRatio; // '9:16' | '1:1' | '16:9'
  imageDataUrl?: string;
  isGenerating?: boolean;
  enabled: boolean;
  linkedSegmentId?: string;
  startTime: number;
  endTime: number;
  displayLayout: BRollDisplayLayout;
  motionPreset: BRollMotionPreset;
  magicalEffect: BRollMagicalEffect;
  sfxPreset: BRollSfxPreset;
}

export interface CaptionSegment {
  id: string;
  startTime: number;
  endTime: number;
  tracks: Partial<Record<TrackKey, CaptionTrackData>>;
  displayLineNumber?: number;
  linesCountOverride?: 1 | 2 | 3;
  // Explicit 1st Line, 2nd Line & 3rd Line Text, Size & Style Overrides
  customLine1Text?: string;
  customLine2Text?: string;
  customLine3Text?: string;
  line1FontSizePx?: number;
  line2FontSizePx?: number;
  line3FontSizePx?: number;
  line1Bold?: boolean;
  line1Italic?: boolean;
  line1Shine?: boolean;
  line1Color?: string;
  line2Bold?: boolean;
  line2Italic?: boolean;
  line2Shine?: boolean;
  line2Color?: string;
  line3Bold?: boolean;
  line3Italic?: boolean;
  line3Shine?: boolean;
  line3Color?: string;
  // Section 5.1 & 5.2 Per-line Kalakar actions & line styling popup
  arcCurveDeg?: number; // Curve into an arch (-360 to +360, 0 = flat)
  spreadWords?: boolean; // Spread the words across the line
  behindSubject?: boolean; // Put behind the subject (Masking)
  lineStyleOverride?: LineStyleOverride;
  // Open-Source SFX & AI B-Roll per-line context
  sfxType?: 'whoosh' | 'bell' | 'pop' | 'cash' | 'riser' | 'impact' | 'none';
  brollTheme?: 'wealth' | 'mindset' | 'community' | 'tech' | 'cinema' | 'none';
  brollTitle?: string;
  brollImageUrl?: string;
  // New Gemini AI B-Roll Slot linkage & per-caption B-Roll overrides
  aiBrollEnabled?: boolean;
  aiBrollSlotId?: string;
  aiBrollAspectRatio?: VideoAspectRatio;
  aiBrollPrompt?: string;
  aiBrollCustomImageUrl?: string;
  aiBrollDisplayLayout?: BRollDisplayLayout;
  aiBrollMotionPreset?: BRollMotionPreset;
  aiBrollMagicalEffect?: BRollMagicalEffect;
  aiBrollSfxPreset?: BRollSfxPreset;
  // Goldox Section 3.3: Mother / Child Line Hierarchy (Magic Wand cascading)
  lineRole?: 'mother' | 'child' | 'none';
  motherSegmentId?: string;
  // Goldox Section 1.5: Manual Text Plus Layer
  isManualTextPlus?: boolean;
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
  | 'standard'
  | 'lala-handwritten'
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

export type SafeZonePreset =
  | 'instagram-reels'
  | 'instagram-story'
  | 'instagram-feed'
  | 'tiktok-foryou'
  | 'youtube-shorts';

export interface VideoClipEditConfig {
  zoomX: number; // % default 100
  zoomY: number; // % default 100
  zoomLinked: boolean;
  positionX: number; // px default 0
  positionY: number; // px default 0
  rotation: number; // deg default 0
  flipHorizontal: boolean;
  flipVertical: boolean;
  cropLeft: number; // % default 0
  cropRight: number; // % default 0
  cropTop: number; // % default 0
  cropBottom: number; // % default 0
  cropSoftness: number; // px default 0
  cropRounded: number; // px default 0
  opacity: number; // % default 100
  volume: number; // % default 100
  muted: boolean;
}

export interface GradientStop {
  id: string;
  color: string;
  position: number; // 0 to 100
}

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
  aspectRatio?: VideoAspectRatio;
  fontFamily: string;
  fontFace?: string;
  heroWordFontFamily: string;
  accentScriptFontFamily?: string;
  secondaryFontFamily: string;
  fontSize: number;
  line1FontSizePx?: number;
  line2FontSizePx?: number;
  line3FontSizePx?: number;
  line1Bold?: boolean;
  line1Italic?: boolean;
  line1Shine?: boolean;
  line1Color?: string;
  line2Bold?: boolean;
  line2Italic?: boolean;
  line2Shine?: boolean;
  line2Color?: string;
  line3Bold?: boolean;
  line3Italic?: boolean;
  line3Shine?: boolean;
  line3Color?: string;
  smallWordScale: number;
  smallLine2Scale?: number;
  bigWordScale: number;
  secondaryFontSize: number;
  fontWeight: number;
  textTransform: 'none' | 'uppercase' | 'capitalize' | 'lowercase';
  underlineText?: boolean;
  primaryColor: string;
  highlightColor: string;
  secondaryColor: string;
  useBaseGradient?: boolean;
  baseGradientStops?: GradientStop[];
  baseGradientAngle?: number;
  baseGradientLevel?: 'word' | 'char';
  useGradient: boolean;
  gradientStops?: GradientStop[];
  gradientPresetId: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  gradientFourth?: string;
  gradientDirection?: GradientDirection;
  gradientAngle?: number;
  gradientLevel?: 'word' | 'char';
  gradientSpeed: number;
  strokeColor: string;
  strokeWidth: number;
  strokeEnabled?: boolean;
  strokeOpacity?: number;
  backgroundColor: string;
  backgroundOpacity: number;
  bgBorderRadius?: number;
  bgWidthPad?: number;
  bgHeightPad?: number;
  bgDropShadow?: boolean;
  bgOutline?: boolean;
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
  maxCharsPerLine?: number;
  maxLinesPerCaption?: number;
  removePunctuation?: boolean;
  removeEmphasis?: boolean;
  removeGaps?: boolean;
  removeEmojis?: boolean;
  captionDelaySeconds?: number;
  animationSpeed: number;
  shadowBlur: number;
  // Section 7.5 Emphasis
  emphasisMode?: 'emphasize' | 'spotlight';
  emphasisGlowColor?: string;
  emphasisFontFace?: string;
  emphasisTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  emphasisUnderline?: boolean;
  // Section 7.7 Effects (Drop Shadow, Glow, 3D Depth, Arc)
  dropShadowEnabled?: boolean;
  dropShadowColor?: string;
  dropShadowOpacity?: number;
  dropShadowX?: number;
  dropShadowY?: number;
  dropShadowBlur?: number;
  glowEnabled?: boolean;
  glowColor?: string;
  glowOpacity?: number;
  glowSpread?: number;
  glowIntensity?: number;
  depth3DEnabled?: boolean;
  depth3DColor?: string;
  depth3DOpacity?: number;
  depth3DDepth?: number;
  depth3DAngle?: number;
  arcEnabled?: boolean;
  arcShape?: 'arch' | 'valley' | 'globe' | 'dome' | 'sphere' | 'curve';
  arcCurveDeg?: number;
  arcHeight?: number;
  arcLineGap?: number;
  arcBendBlock?: boolean;
  arcFollowCurve?: boolean;
  // Section 9 Transitions (IN / HOLD / OUT)
  transitionScope?: 'all' | 'emphasized';
  transitionSameAsOther?: boolean;
  transitionIn?: string;
  transitionHold?: string;
  transitionOut?: string;
  // Section 4.1 Preview Bar & Safe Zones
  showScrim: boolean;
  showSafeZones: boolean;
  safeZonePreset?: SafeZonePreset;
  safeZoneOpacity?: number;
  lowResPreview?: boolean;
  isCanvasLocked?: boolean;
  canvasPositionLocked?: boolean;
  unlockManipulationScope?: 'lines' | 'words' | 'stack';
  boxPaddingLinked?: boolean;
  templateAlignmentMode?: 'splash' | 'center';
  transitionBouncePhysics?: 'less' | 'normal' | 'more';
  transitionDynamicSpeed?: boolean;
  exportResolutionTarget?: '1080p' | '4k';
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
  // Section 11 Video Clip Edit Tab
  videoClipEdit?: VideoClipEditConfig;
  // Open-Source Auto SFX & AI B-Roll Cutaway Settings
  autoSfxEnabled?: boolean;
  sfxVolume?: number;
  brollEnabled?: boolean;
  brollDisplayMode?: 'pip' | 'fullscreen';
  aiBrollLayout?: BRollDisplayLayout;
  aiBrollMotionPreset?: BRollMotionPreset;
  aiBrollMagicalEffect?: BRollMagicalEffect;
  aiBrollSfxPreset?: BRollSfxPreset;
  aiBrollSfxEnabled?: boolean;
  // Real-Time AI Subject Cutout & Behind-Head Depth Masking (Disabled for now, preserved for future activation)
  captionDepthBehindSubject?: boolean;
  // Stitch UI Compatibility Properties
  unlockDragScope?: 'words' | 'lines' | 'stack';
  layoutMode?: 'single' | 'two-line' | 'pyramid' | 'spotlight' | string;
  backgroundPaddingPx?: number;
  backgroundRadiusPx?: number;
  backgroundEnabled?: boolean;
  kalakarTemplateId?: string;
  heroBoxTilted?: boolean;
  italicText?: boolean;
  emphasisGlowEnabled?: boolean;
  emphasisTextTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacingPx?: number;
  lineHeightMultiplier?: number;
}


export interface StylePreset {
  id: string;
  name: string;
  tagline: string;
  description?: string;
  badgeText: string;
  smallPreviewText?: string;
  scriptPreviewText?: string;
  previewBg: string;
  isPremium?: boolean;
  isVerifiedCreator?: boolean;
  styleTags?: ('Bold' | 'Shadow' | 'Italic')[];
  templateVisualKey?: string;
  category?: string;
  creatorCategory?: string;
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
