import React, { useState } from 'react';
import {
  Search,
  Crown,
  RotateCcw,
  Sparkles,
  Volume2,
  Play,
  Link,
  Unlink,
  FlipHorizontal,
  FlipVertical,
  Check,
  Save,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  AudioEnhancerConfig,
  CaptionSegment,
  CaptionStyleConfig,
  GradientStop,
  LineStyleOverride,
  StylePreset,
  VideoClipEditConfig,
} from '../types/caption';
import {
  DEFAULT_VIDEO_CLIP_EDIT,
  KALAKAR_48_BUILT_IN_PRESETS,
  KALAKAR_FONT_FACES,
  KALAKAR_GOOGLE_FONTS,
  TRANSITION_HOLD_OPTIONS,
  TRANSITION_IN_OUT_OPTIONS,
} from '../data/kalakarOptionsData';
import {
  OPEN_SOURCE_SFX_LIBRARY,
  playOpenSourceSoundEffect,
} from '../utils/soundEffectsEngine';
import {
  GOOGLE_FONT_LANGUAGE_TABS,
  GoogleFontLanguageGroup,
  ensureGoogleFontLoaded,
} from '../utils/googleFontsLibrary';


interface KalakarTemplatesTabProps {
  styleConfig: CaptionStyleConfig;
  userPresets: StylePreset[];
  userPlan: 'free' | 'creator' | 'pro';
  onApplyPreset: (preset: StylePreset) => void;
  onUpdateStyle: (partial: Partial<CaptionStyleConfig>) => void;
  onCreateNewPreset: (name: string, badgeText: string) => void;
  onUpgradePlan?: () => void;
  onOpenFrameStyleCloner?: () => void;
}

const VerifiedCreatorBadge: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4 shrink-0"
    fill="none"
    aria-label="Verified Creator Template"
  >
    <path
      d="M12 2L14.4 4.2L17.6 3.7L18.7 6.8L21.8 7.9L21.3 11.1L23.5 13.5L21.3 15.9L21.8 19.1L18.7 20.2L17.6 23.3L14.4 22.8L12 25L9.6 22.8L6.4 23.3L5.3 20.2L2.2 19.1L2.7 15.9L0.5 13.5L2.7 11.1L2.2 7.9L5.3 6.8L6.4 3.7L9.6 4.2L12 2Z"
      fill="#0095F6"
      transform="scale(0.88) translate(1.6, 0.5)"
    />
    <path
      d="M8.5 12.5L10.8 14.8L15.8 9.8"
      stroke="#FFFFFF"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StarfieldBokehBackdrop: React.FC<{ tint?: string }> = ({ tint }) => (
  <div
    className="absolute inset-0 pointer-events-none overflow-hidden"
    style={{
      background:
        tint ||
        'radial-gradient(circle at 50% 50%, rgba(38, 38, 52, 0.55) 0%, rgba(8, 8, 12, 0.98) 78%)',
    }}
  >
    <span className="absolute left-[12%] top-[24%] w-1.5 h-1.5 rounded-full bg-white/25 blur-[0.5px]" />
    <span className="absolute left-[26%] top-[68%] w-2 h-2 rounded-full bg-white/15 blur-[1px]" />
    <span className="absolute left-[46%] top-[18%] w-1 h-1 rounded-full bg-white/20" />
    <span className="absolute left-[68%] top-[74%] w-1.5 h-1.5 rounded-full bg-white/20 blur-[0.5px]" />
    <span className="absolute left-[84%] top-[28%] w-2 h-2 rounded-full bg-white/15 blur-[1px]" />
    <span className="absolute left-[76%] top-[48%] w-1 h-1 rounded-full bg-white/25" />
  </div>
);

function renderMerupifyTemplatePreviewBanner(
  tpl: StylePreset,
  liveStyle?: CaptionStyleConfig
): React.ReactNode {
  const vKey = tpl.templateVisualKey || tpl.id;

  // 1. LALA (Cream bg + Caveat handwritten + Red double marker swoosh + Creator on right)
  if (
    vKey === 'lala' ||
    tpl.id === 'kalakar-lala' ||
    tpl.name.toLowerCase() === 'lala'
  ) {
    const activeFont = liveStyle?.fontFamily || tpl.config.fontFamily || 'Caveat';
    const activeHeroFont =
      liveStyle?.heroWordFontFamily || tpl.config.heroWordFontFamily || activeFont;
    const activePrimary =
      liveStyle?.primaryColor || tpl.config.primaryColor || '#1C434C';
    const activeHighlight =
      liveStyle?.highlightColor || tpl.config.highlightColor || '#EB4823';
    const activeBg =
      liveStyle?.backgroundColor || tpl.config.backgroundColor || '#FAF6E8';
    return (
      <div
        className="relative h-[98px] w-full overflow-hidden flex items-center justify-between select-none"
        style={{ backgroundColor: activeBg }}
      >
        <div className="w-[70%] h-full flex flex-col items-center justify-center pl-2 pr-1 z-10">
          <div
            className="text-[17px] font-semibold leading-none tracking-tight truncate max-w-full"
            style={{
              fontFamily: `"${activeFont}", "Caveat", cursive`,
              color: activePrimary,
            }}
          >
            {tpl.smallPreviewText || 'Arey Maalik, mein houn'}
          </div>
          <div
            className="text-[30px] font-bold leading-[0.92] -mt-0.5 tracking-tight truncate max-w-full"
            style={{
              fontFamily: `"${activeHeroFont}", "Caveat", cursive`,
              color: activePrimary,
            }}
          >
            {tpl.badgeText || 'Paritosh Anand'}
          </div>
          <svg
            viewBox="0 0 210 22"
            className="w-[148px] h-[15px] -mt-0.5 overflow-visible"
            fill="none"
          >
            <path
              d="M14 11 C 62 3, 138 3, 196 10"
              stroke={activeHighlight}
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M6 16 C 64 7, 145 7, 202 14"
              stroke={activeHighlight}
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M36 18 C 88 12, 146 12, 184 16"
              stroke={activeHighlight}
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.85"
            />
          </svg>
        </div>

        <div className="relative w-[34%] h-full shrink-0 overflow-hidden">
          <svg
            viewBox="0 0 120 110"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            <path
              d="M16 0 L112 0 L118 22 L114 48 L119 78 L115 110 L32 110 L26 88 L30 74 L21 52 L25 32 L14 14 Z"
              fill={activeHighlight}
            />
          </svg>
          <svg
            viewBox="0 0 120 110"
            className="relative z-10 w-full h-full"
            fill="none"
          >
            <path
              d="M34 110 C35 84, 50 74, 72 74 C94 74, 108 86, 110 110 Z"
              fill="#F4EFE0"
              stroke="#DDD4BE"
              strokeWidth="1.5"
            />
            <path
              d="M56 73 L66 86 L77 75"
              stroke="#D0C4A8"
              strokeWidth="2"
              fill="#EFE8D4"
            />
            <rect x="57" y="60" width="15" height="16" rx="5" fill="#D59B74" />
            <ellipse cx="62" cy="46" rx="16" ry="19" fill="#DFA57D" />
            <path
              d="M46 40 C44 24, 58 17, 74 21 C84 24, 85 37, 80 48 C78 38, 72 32, 60 32 C52 32, 48 36, 46 40 Z"
              fill="#1B1B1E"
            />
            <path
              d="M46 47 C46 58, 53 65, 63 65 C72 65, 77 58, 77 48 C73 52, 67 54, 59 53 C52 52, 48 49, 46 47 Z"
              fill="#1F1F24"
            />
            <path
              d="M51 52 Q57 57 64 52"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <rect
              x="45"
              y="38"
              width="11"
              height="7"
              rx="2"
              stroke="#2B2B30"
              strokeWidth="1.6"
            />
            <rect
              x="58"
              y="38"
              width="11"
              height="7"
              rx="2"
              stroke="#2B2B30"
              strokeWidth="1.6"
            />
            <line
              x1="56"
              y1="41"
              x2="58"
              y2="41"
              stroke="#2B2B30"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>
    );
  }

  // 2. ALI ABDAAL (Soft light paper-grid backdrop + white floating rounded pill "Hello and welcome" + Creator portrait)
  if (vKey === 'ali-abdaal') {
    return (
      <div className="relative h-[92px] w-full bg-[#E6ECF0] overflow-hidden flex items-center justify-between px-3 select-none">
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              'linear-gradient(to right, #CBD5E1 1px, transparent 1px), linear-gradient(to bottom, #CBD5E1 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />
        <div className="relative z-10 flex items-center justify-center flex-1 pr-2">
          <div
            className="px-4 py-1.5 rounded-full bg-white/95 shadow-[0_8px_20px_rgba(15,23,42,0.16)] border border-slate-200/80 flex items-baseline gap-1.5"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            <span className="text-[17px] font-medium text-slate-600">
              Hello and
            </span>
            <span className="text-[19px] font-extrabold text-slate-900">
              welcome
            </span>
          </div>
        </div>
        {/* Right Creator Avatar */}
        <div className="relative z-10 w-[76px] h-full flex items-end justify-center shrink-0">
          <svg viewBox="0 0 90 90" className="w-full h-full" fill="none">
            <path
              d="M15 90 C18 66, 32 58, 48 58 C64 58, 76 66, 80 90 Z"
              fill="#1E293B"
            />
            <rect x="40" y="46" width="14" height="14" rx="5" fill="#E0A882" />
            <ellipse cx="47" cy="34" rx="14" ry="16" fill="#E8B490" />
            <path
              d="M33 30 C33 17, 45 13, 57 17 C63 19, 64 28, 60 35 C57 26, 48 24, 38 26 Z"
              fill="#1E1B18"
            />
            <rect
              x="35"
              y="29"
              width="10"
              height="6"
              rx="2"
              stroke="#334155"
              strokeWidth="1.5"
            />
            <rect
              x="48"
              y="29"
              width="10"
              height="6"
              rx="2"
              stroke="#334155"
              strokeWidth="1.5"
            />
            <path
              d="M42 41 Q47 45 52 41"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    );
  }

  // 3. AEVY TV (Crimson editorial backdrop + italic serif "welcome" + bold "TO MERUPIFY" + Creator in yellow blazer)
  if (vKey === 'aevy-tv') {
    return (
      <div
        className="relative h-[92px] w-full overflow-hidden flex items-center justify-between px-3.5 select-none"
        style={{
          background:
            'linear-gradient(125deg, #2D060D 0%, #6E0F1F 52%, #991B1B 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col items-center justify-center flex-1">
          <div
            className="text-[24px] italic text-white/95 leading-none drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]"
            style={{ fontFamily: '"Instrument Serif", "Playfair Display", serif' }}
          >
            welcome
          </div>
          <div
            className="text-[20px] font-black text-white tracking-wider uppercase leading-tight mt-0.5 drop-shadow-[0_4px_14px_rgba(0,0,0,0.65)]"
            style={{ fontFamily: '"Montserrat", sans-serif' }}
          >
            TO MERUPIFY
          </div>
        </div>
        <div className="relative z-10 w-[76px] h-full flex items-end justify-center shrink-0">
          <svg viewBox="0 0 90 90" className="w-full h-full" fill="none">
            <path
              d="M14 90 C18 66, 32 58, 48 58 C64 58, 76 66, 80 90 Z"
              fill="#EAB308"
            />
            <path d="M38 58 L48 76 L58 58 Z" fill="#1E293B" />
            <rect x="41" y="46" width="13" height="13" rx="4" fill="#D99B72" />
            <ellipse cx="47" cy="34" rx="13" ry="15" fill="#E3A882" />
            <path
              d="M34 30 C34 16, 48 14, 58 19 C62 22, 62 30, 59 35 C55 26, 44 25, 34 30 Z"
              fill="#18181B"
            />
            <path
              d="M42 41 Q47 44 52 41"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    );
  }

  // 4. THINK SCHOOL (Warm dark bronze studio + yellow "WELCOME" + white "TO MERUPIFY" + Creator on right)
  if (vKey === 'think-school') {
    return (
      <div
        className="relative h-[92px] w-full overflow-hidden flex items-center justify-between px-3.5 select-none"
        style={{
          background:
            'radial-gradient(circle at 35% 50%, #3E341C 0%, #171510 75%)',
        }}
      >
        <div className="relative z-10 flex flex-col items-center justify-center flex-1">
          <div
            className="text-[25px] font-black text-[#FACC15] tracking-wide uppercase leading-none drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)]"
            style={{ fontFamily: '"Anton", sans-serif' }}
          >
            WELCOME
          </div>
          <div
            className="text-[22px] font-black text-white tracking-wide uppercase leading-tight mt-0.5 drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)]"
            style={{ fontFamily: '"Anton", sans-serif' }}
          >
            TO MERUPIFY
          </div>
        </div>
        <div className="relative z-10 w-[76px] h-full flex items-end justify-center shrink-0">
          <svg viewBox="0 0 90 90" className="w-full h-full" fill="none">
            <path
              d="M14 90 C18 66, 32 58, 48 58 C64 58, 76 66, 80 90 Z"
              fill="#F8FAFC"
            />
            <rect x="41" y="46" width="13" height="13" rx="4" fill="#C6865E" />
            <ellipse cx="47" cy="34" rx="13" ry="15" fill="#D3926A" />
            <path
              d="M34 29 C35 16, 48 14, 58 18 C62 21, 62 30, 59 35 C55 26, 44 25, 34 29 Z"
              fill="#141417"
            />
            <path
              d="M36 37 C36 46, 41 51, 47 51 C53 51, 58 46, 58 37 C54 41, 41 41, 36 37 Z"
              fill="#1E1E24"
            />
          </svg>
        </div>
      </div>
    );
  }

  // 5. MERUPIFY MOTION (was Kalakar Motion — "Hello and" + Red Rounded Pill "Welcome")
  if (vKey === 'merupify-motion') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-2 text-[22px] font-extrabold tracking-tight"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          <span className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            Hello and
          </span>
          <span className="px-2.5 py-0.5 rounded-lg bg-[#EF4444] text-white shadow-[0_0_20px_rgba(239,68,68,0.65)]">
            Welcome
          </span>
        </div>
      </div>
    );
  }

  // 6. MERUPIFY GLOW (was Kalakar Glow — Italic glowing serif "Hello and" / "Welcome to Merupify.")
  if (vKey === 'merupify-glow') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex flex-col items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop tint="radial-gradient(circle at 50% 50%, rgba(254, 240, 138, 0.16) 0%, rgba(8, 8, 12, 0.98) 76%)" />
        <div
          className="relative z-10 text-[22px] italic text-white leading-tight drop-shadow-[0_0_16px_rgba(255,255,255,0.85)]"
          style={{ fontFamily: '"Instrument Serif", "Playfair Display", serif' }}
        >
          Hello and
        </div>
        <div
          className="relative z-10 text-[23px] italic text-[#FEF08A] leading-tight drop-shadow-[0_0_18px_rgba(254,240,138,0.9)]"
          style={{ fontFamily: '"Instrument Serif", "Playfair Display", serif' }}
        >
          Welcome to Merupify.
        </div>
      </div>
    );
  }

  // 7. RAFTAR ("Welcome " + Green Box "to " + "Merupify.")
  if (vKey === 'raftar') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[21px] font-extrabold text-white"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          <span>Welcome</span>
          <span className="px-2 py-0.5 rounded-md bg-[#22C55E] text-zinc-950 font-black shadow-[0_0_16px_rgba(34,197,94,0.6)]">
            to
          </span>
          <span>Merupify.</span>
        </div>
      </div>
    );
  }

  // 8. MASOOM ("Welcome to " + italic golden-orange "Merupify.")
  if (vKey === 'masoom') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div className="relative z-10 flex items-baseline gap-1.5 text-[21px]">
          <span
            className="text-white/90 font-medium"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            Welcome to
          </span>
          <span
            className="text-[#F59E0B] italic font-bold text-[24px] drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            Merupify.
          </span>
        </div>
      </div>
    );
  }

  // 9. TOOFAN (Yellow-gold italic "WELCOME TO MERUPIFY.")
  if (vKey === 'toofan') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 text-[21px] font-black italic uppercase tracking-wide text-[#FACC15] drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]"
          style={{
            fontFamily: '"Montserrat", sans-serif',
            WebkitTextStroke: '1px #000',
          }}
        >
          WELCOME TO MERUPIFY.
        </div>
      </div>
    );
  }

  // 10. SIMPLE CAP ("WELCOME TO " + Pink "MERUPIFY.")
  if (vKey === 'simple-cap') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[20px] font-black uppercase tracking-tight"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          <span className="text-white">WELCOME TO</span>
          <span className="text-[#EC4899] drop-shadow-[0_2px_12px_rgba(236,72,153,0.55)]">
            MERUPIFY.
          </span>
        </div>
      </div>
    );
  }

  // 11. BAWAAL (Green "WELCOME" + White "TO MERUPIFY.")
  if (vKey === 'bawaal') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[22px] font-black uppercase tracking-wide"
          style={{
            fontFamily: '"Anton", sans-serif',
            textShadow: '0 4px 10px rgba(0,0,0,0.95)',
          }}
        >
          <span className="text-[#22C55E]">WELCOME</span>
          <span className="text-white">TO MERUPIFY.</span>
        </div>
      </div>
    );
  }

  // 12. NUKKAD ("Welcome " + Orange "to " + "Merupify.")
  if (vKey === 'nukkad') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[22px] font-black"
          style={{
            fontFamily: '"Bricolage Grotesque", sans-serif',
            textShadow: '0 4px 10px rgba(0,0,0,0.95)',
          }}
        >
          <span className="text-white">Welcome</span>
          <span className="text-[#F97316]">to</span>
          <span className="text-white">Merupify.</span>
        </div>
      </div>
    );
  }

  // 13. PATAKHA (Pink "Welcome " + Yellow "to Merupify.")
  if (vKey === 'patakha') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[21px] font-black"
          style={{
            fontFamily: '"Montserrat", sans-serif',
            textShadow: '0 4px 12px rgba(0,0,0,0.95)',
          }}
        >
          <span className="text-[#F472B6]">Welcome</span>
          <span className="text-[#FACC15]">to Merupify.</span>
        </div>
      </div>
    );
  }

  // 14. TEZAB (Hollow White Outline "WELCOME" + Solid Cyan "TO MERUPIFY.")
  if (vKey === 'tezab') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-2 text-[22px] font-black uppercase tracking-wide"
          style={{ fontFamily: '"Anton", sans-serif' }}
        >
          <span
            className="text-transparent"
            style={{ WebkitTextStroke: '1.6px #FFFFFF' }}
          >
            WELCOME
          </span>
          <span className="text-[#06B6D4] drop-shadow-[0_0_14px_rgba(6,182,212,0.75)]">
            TO MERUPIFY.
          </span>
        </div>
      </div>
    );
  }

  // 15. JHATKA (Orange "WELCOME" + White "TO MERUPIFY.")
  if (vKey === 'jhatka') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[21px] font-black uppercase"
          style={{
            fontFamily: '"Montserrat", sans-serif',
            textShadow: '0 4px 10px rgba(0,0,0,0.95)',
          }}
        >
          <span className="text-[#F97316]">WELCOME</span>
          <span className="text-white">TO MERUPIFY.</span>
        </div>
      </div>
    );
  }

  // 16. TOOTA DIL ("welcome " + glowing gold "to" + " merupify.")
  if (vKey === 'toota-dil') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[20px] lowercase tracking-wide"
          style={{ fontFamily: '"Space Grotesk", sans-serif' }}
        >
          <span className="text-zinc-300 font-medium">welcome</span>
          <span className="text-[#FACC15] font-bold drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]">
            to
          </span>
          <span className="text-zinc-300 font-medium">merupify.</span>
        </div>
      </div>
    );
  }

  // 17. TABAHI (Hot Magenta-Red "Welcome" + White "to Merupify.")
  if (vKey === 'tabahi') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop tint="radial-gradient(circle at 50% 50%, rgba(255, 42, 109, 0.22) 0%, rgba(8, 8, 12, 0.98) 76%)" />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[22px] font-black"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          <span className="text-[#FF2A6D] drop-shadow-[0_0_18px_rgba(255,42,109,0.85)]">
            Welcome
          </span>
          <span className="text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            to Merupify.
          </span>
        </div>
      </div>
    );
  }

  // 18. UNDERLINE (Two stacked Pink Highlight Strips: "Hello and Welcome" / "to Merupify.")
  if (vKey === 'underline') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex flex-col items-center justify-center gap-1 px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 px-2.5 py-0.5 bg-[#EC4899] text-white text-[16px] font-extrabold leading-tight shadow-md"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          Hello and Welcome
        </div>
        <div
          className="relative z-10 px-2.5 py-0.5 bg-[#EC4899] text-white text-[16px] font-extrabold leading-tight shadow-md"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          to Merupify.
        </div>
      </div>
    );
  }

  // 19. POP UP ("WELCOME TO " + Green "MERUPIFY.")
  if (vKey === 'pop-up') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[20px] font-black uppercase"
          style={{
            fontFamily: '"Montserrat", sans-serif',
            textShadow: '0 4px 10px rgba(0,0,0,0.95)',
          }}
        >
          <span className="text-white">WELCOME TO</span>
          <span className="text-[#22C55E]">MERUPIFY.</span>
        </div>
      </div>
    );
  }

  // 20. DHAKA (3-Tier Stacked: "HELLO AND" / giant yellow "WELCOME" / "TO MERUPIFY.")
  if (vKey === 'dhaka') {
    return (
      <div className="relative h-[92px] w-full bg-[#09090D] overflow-hidden flex flex-col items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 text-[10px] font-extrabold uppercase tracking-widest text-white/90 leading-none"
          style={{ fontFamily: '"Outfit", sans-serif' }}
        >
          HELLO AND
        </div>
        <div
          className="relative z-10 text-[28px] font-black uppercase text-[#FACC15] leading-none my-0.5 drop-shadow-[0_0_16px_rgba(250,204,21,0.55)]"
          style={{ fontFamily: '"Anton", sans-serif' }}
        >
          WELCOME
        </div>
        <div
          className="relative z-10 text-[10px] font-extrabold uppercase tracking-widest text-white/90 leading-none"
          style={{ fontFamily: '"Outfit", sans-serif' }}
        >
          TO MERUPIFY.
        </div>
      </div>
    );
  }

  // 21. MERUPIFY SHADOW (was Kalakar Shadow — Stacked "Hello and" / 3D Orange "WELCOME" / "to Merupify.")
  if (vKey === 'merupify-shadow') {
    return (
      <div className="relative h-[92px] w-full bg-[#09090D] overflow-hidden flex flex-col items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div className="relative z-10 text-[11px] font-bold text-white leading-none">
          Hello and
        </div>
        <div
          className="relative z-10 text-[27px] font-black uppercase text-[#F97316] leading-none my-0.5"
          style={{
            fontFamily: '"Montserrat", sans-serif',
            WebkitTextStroke: '1.5px #000',
            textShadow: '3px 3px 0px #000000, 0 5px 14px rgba(0,0,0,0.9)',
          }}
        >
          WELCOME
        </div>
        <div className="relative z-10 text-[11px] font-bold text-white leading-none">
          to Merupify.
        </div>
      </div>
    );
  }

  // 22. MERUPIFY (was Kalakar — Stacked "Hello and" / Lime-Green "WELCOME" / "to Merupify.")
  if (vKey === 'merupify-classic') {
    return (
      <div className="relative h-[92px] w-full bg-[#09090D] overflow-hidden flex flex-col items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop tint="radial-gradient(circle at 50% 50%, rgba(163, 230, 53, 0.16) 0%, rgba(8, 8, 12, 0.98) 76%)" />
        <div className="relative z-10 text-[11px] font-bold text-white leading-none">
          Hello and
        </div>
        <div
          className="relative z-10 text-[27px] font-black uppercase text-[#A3E635] leading-none my-0.5 drop-shadow-[0_3px_12px_rgba(163,230,53,0.5)]"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          WELCOME
        </div>
        <div className="relative z-10 text-[11px] font-bold text-white leading-none">
          to Merupify.
        </div>
      </div>
    );
  }

  // 23. HORMOZI STYLE ("WELCOME TO" / tilted Green Box "MERUPIFY.")
  if (vKey === 'hormozi') {
    return (
      <div className="relative h-[90px] w-full bg-[#09090D] overflow-hidden flex flex-col items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 text-[20px] font-black uppercase text-white leading-none"
          style={{
            fontFamily: '"Anton", sans-serif',
            WebkitTextStroke: '1px #000',
          }}
        >
          WELCOME TO
        </div>
        <div
          className="relative z-10 mt-1 px-2.5 py-0.5 bg-[#22C55E] text-white text-[20px] font-black uppercase leading-none -rotate-2 shadow-[0_4px_14px_rgba(34,197,94,0.6)]"
          style={{ fontFamily: '"Anton", sans-serif' }}
        >
          MERUPIFY.
        </div>
      </div>
    );
  }

  // 24. EDITING SKOOL (Solid Orange Banner "MERUPIFY")
  if (vKey === 'editing-skool') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 px-5 py-1.5 rounded-xl bg-[#FF6B00] text-white text-[22px] font-black uppercase tracking-wide shadow-[0_4px_20px_rgba(255,107,0,0.55)]"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          MERUPIFY
        </div>
      </div>
    );
  }

  // 25. MR BEAST STYLE 1 (Heavy black-stroked white "WELCOME TO MERUPIFY.")
  if (vKey === 'mrbeast-1') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 text-[22px] font-black uppercase text-white tracking-wide"
          style={{
            fontFamily: '"Anton", sans-serif',
            WebkitTextStroke: '1.8px #000000',
            textShadow: '0 4px 0 #000000, 0 6px 14px rgba(0,0,0,0.95)',
          }}
        >
          WELCOME TO MERUPIFY.
        </div>
      </div>
    );
  }

  // 26. MR BEAST STYLE 2 (Heavy black-stroked orange "WELCOME TO MERUPIFY.")
  if (vKey === 'mrbeast-2') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 text-[22px] font-black uppercase text-[#F59E0B] tracking-wide"
          style={{
            fontFamily: '"Anton", sans-serif',
            WebkitTextStroke: '1.8px #000000',
            textShadow: '0 4px 0 #000000, 0 6px 14px rgba(0,0,0,0.95)',
          }}
        >
          WELCOME TO MERUPIFY.
        </div>
      </div>
    );
  }

  // 27. DESI ("Welcome to" / Yellow "Merupify.")
  if (vKey === 'desi') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex flex-col items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 text-[18px] font-extrabold text-white leading-tight"
          style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
        >
          Welcome to
        </div>
        <div
          className="relative z-10 text-[24px] font-black text-[#FACC15] leading-tight"
          style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
        >
          Merupify.
        </div>
      </div>
    );
  }

  // 28. FILMY ("Welcome " + Red Box "to" + " Merupify.")
  if (vKey === 'filmy') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[21px] font-extrabold text-white"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          <span>Welcome</span>
          <span className="px-2 py-0.5 rounded bg-[#EF4444] text-white font-black shadow-[0_0_14px_rgba(239,68,68,0.65)]">
            to
          </span>
          <span>Merupify.</span>
        </div>
      </div>
    );
  }

  // 29. KADAK (White Pill with Dark Text "Welcome" + White "to Merupify.")
  if (vKey === 'kadak') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-2 text-[20px] font-extrabold"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          <span className="px-2.5 py-0.5 rounded-md bg-white text-zinc-950 font-black shadow-md">
            Welcome
          </span>
          <span className="text-white">to Merupify.</span>
        </div>
      </div>
    );
  }

  // 30. CLASSIC (Clean White "Welcome to Merupify.")
  if (vKey === 'classic') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 text-[21px] font-bold text-white"
          style={{ fontFamily: '"Inter", sans-serif' }}
        >
          Welcome to Merupify.
        </div>
      </div>
    );
  }

  // 31. GLITCH (Cyan/Magenta RGB split "WELCOME TO MERUPIFY.")
  if (vKey === 'glitch') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 text-[20px] font-black uppercase text-white tracking-wider"
          style={{
            fontFamily: '"Rubik Mono One", monospace',
            textShadow: '-2.5px 0 #00F5D4, 2.5px 0 #FF1E96',
          }}
        >
          WELCOME TO MERUPIFY.
        </div>
      </div>
    );
  }

  // 32. PIXEL (8-Bit Retro Arcade "Welcome to Merupify.")
  if (vKey === 'pixel') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 text-[18px] font-bold text-white tracking-tight"
          style={{
            fontFamily: '"Silkscreen", monospace',
            textShadow: '2px 2px 0 #000000',
          }}
        >
          Welcome to Merupify.
        </div>
      </div>
    );
  }

  // 33. NEON (Glowing Hot Pink "WELCOME TO MERUPIFY.")
  if (vKey === 'neon') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop tint="radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.25) 0%, rgba(8, 8, 12, 0.98) 76%)" />
        <div
          className="relative z-10 text-[20px] font-extrabold uppercase tracking-wider text-[#F472B6]"
          style={{
            fontFamily: '"Outfit", sans-serif',
            textShadow:
              '0 0 10px #EC4899, 0 0 22px #EC4899, 0 0 36px rgba(236,72,153,0.85)',
          }}
        >
          WELCOME TO MERUPIFY.
        </div>
      </div>
    );
  }

  // 34. GADAR ("Welcome " + Yellow "to " + "Merupify.")
  if (vKey === 'gadar') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[21px] font-extrabold"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          <span className="text-white">Welcome</span>
          <span className="text-[#FACC15]">to</span>
          <span className="text-white">Merupify.</span>
        </div>
      </div>
    );
  }

  // 35. NOOR (Elegant Gold "Welcome" + White "to Merupify.")
  if (vKey === 'noor') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-baseline gap-1.5 text-[22px]"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          <span className="text-[#FBBF24] font-bold">Welcome</span>
          <span className="text-white font-semibold">to Merupify.</span>
        </div>
      </div>
    );
  }

  // 36. TUFAAN (Bold Italic White + Lime "WELCOME TO MERUPIFY.")
  if (vKey === 'tufaan') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[21px] font-black italic uppercase"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          <span className="text-white">WELCOME</span>
          <span className="text-[#A3E635]">TO</span>
          <span className="text-white">MERUPIFY.</span>
        </div>
      </div>
    );
  }

  // 37. JOSH (Rounded Yellow Pill "Welcome" + White "to Merupify.")
  if (vKey === 'josh') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[20px] font-extrabold"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          <span className="px-2.5 py-0.5 rounded-full bg-[#FACC15] text-zinc-950 font-black shadow-[0_0_16px_rgba(250,204,21,0.5)]">
            Welcome
          </span>
          <span className="text-white">to Merupify.</span>
        </div>
      </div>
    );
  }

  // 38. BOLE TOH (Purple Box "Welcome" + White "to Merupify.")
  if (vKey === 'bole-toh') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[20px] font-extrabold"
          style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
        >
          <span className="px-2.5 py-0.5 rounded-lg bg-[#9333EA] text-white font-black shadow-[0_0_16px_rgba(147,51,234,0.6)]">
            Welcome
          </span>
          <span className="text-white">to Merupify.</span>
        </div>
      </div>
    );
  }

  // 39. KHATARNAK ("Welcome to " + Red "Merupify.")
  if (vKey === 'khatarnak') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[21px] font-black"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          <span className="text-white">Welcome to</span>
          <span className="text-[#EF4444] drop-shadow-[0_0_14px_rgba(239,68,68,0.75)]">
            Merupify.
          </span>
        </div>
      </div>
    );
  }

  // 40. PURAANE DIN (Warm Cream Serif "Welcome " + Amber "to " + "Merupify.")
  if (vKey === 'puraane-din') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-baseline gap-1.5 text-[22px] font-bold"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          <span className="text-[#FEF3C7]">Welcome</span>
          <span className="text-[#F59E0B] italic">to</span>
          <span className="text-[#FEF3C7]">Merupify.</span>
        </div>
      </div>
    );
  }

  // 41. DEEP GLOW (Soft Golden-White Glow "WELCOME TO MERUPIFY.")
  if (vKey === 'deep-glow') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop tint="radial-gradient(circle at 50% 50%, rgba(254, 240, 138, 0.22) 0%, rgba(8, 8, 12, 0.98) 76%)" />
        <div
          className="relative z-10 text-[20px] font-extrabold uppercase tracking-wider text-[#FEF9C3]"
          style={{
            fontFamily: '"Outfit", sans-serif',
            textShadow:
              '0 0 12px rgba(254,240,138,0.95), 0 0 28px rgba(250,204,21,0.75)',
          }}
        >
          WELCOME TO MERUPIFY.
        </div>
      </div>
    );
  }

  // 42. SEEDHA SAADHA ("welcome " + subtle dark chip "to" + " merupify.")
  if (vKey === 'seedha-saadha') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 flex items-center gap-1.5 text-[19px] lowercase text-zinc-200 font-medium"
          style={{ fontFamily: '"Inter", sans-serif' }}
        >
          <span>welcome</span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-white border border-white/15">
            to
          </span>
          <span>merupify.</span>
        </div>
      </div>
    );
  }

  // 43. THORA CINEMATIC (Wide-tracked Roman Cinema "WELCOME TO MERUPIFY.")
  if (vKey === 'thora-cinematic') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop />
        <div
          className="relative z-10 text-[16px] font-bold uppercase tracking-[0.28em] text-white"
          style={{ fontFamily: '"Cinzel", serif' }}
        >
          WELCOME TO <span className="text-[#FDE047]">MERUPIFY.</span>
        </div>
      </div>
    );
  }

  // 44. ZERO GRAVITY (Airy glowing cyan-white "WELCOME TO MERUPIFY.")
  if (vKey === 'zero-gravity') {
    return (
      <div className="relative h-[86px] w-full bg-[#09090D] overflow-hidden flex items-center justify-center px-3 select-none">
        <StarfieldBokehBackdrop tint="radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.2) 0%, rgba(8, 8, 12, 0.98) 76%)" />
        <div
          className="relative z-10 text-[19px] font-bold uppercase tracking-[0.16em] text-white"
          style={{
            fontFamily: '"Space Grotesk", sans-serif',
            textShadow: '0 0 16px rgba(56,189,248,0.85)',
          }}
        >
          WELCOME TO <span className="text-[#38BDF8]">MERUPIFY.</span>
        </div>
      </div>
    );
  }

  // Fallback / Existing SIDZ & Merupify Custom Presets (Merupify Vairagya, Merupify 20K Mint, etc.)
  return (
    <div
      className={`relative h-[88px] w-full overflow-hidden flex flex-col items-center justify-center px-3 select-none bg-gradient-to-b ${
        tpl.previewBg || 'from-zinc-900 to-black'
      }`}
    >
      <StarfieldBokehBackdrop />
      {tpl.smallPreviewText && (
        <div className="relative z-10 text-[11px] font-semibold text-zinc-300 truncate max-w-full">
          {tpl.smallPreviewText}
        </div>
      )}
      <div
        className="relative z-10 text-[22px] font-black tracking-tight truncate max-w-full leading-tight"
        style={{
          fontFamily:
            tpl.config.heroWordFontFamily ||
            tpl.config.fontFamily ||
            'Bricolage Grotesque',
          color: tpl.config.highlightColor || '#30D158',
          textShadow: '0 3px 12px rgba(0,0,0,0.85)',
        }}
      >
        {tpl.badgeText}
      </div>
      {tpl.scriptPreviewText && (
        <div
          className="relative z-10 text-[12px] italic text-white/90 -mt-0.5"
          style={{
            fontFamily:
              tpl.config.accentScriptFontFamily || '"Kaushan Script", cursive',
          }}
        >
          {tpl.scriptPreviewText}
        </div>
      )}
    </div>
  );
}

export const KalakarTemplatesTab: React.FC<KalakarTemplatesTabProps> = ({
  styleConfig,
  userPresets,
  userPlan,
  onApplyPreset,
  onUpdateStyle,
  onCreateNewPreset,
  onUpgradePlan,
  onOpenFrameStyleCloner,
}) => {
  const [subTab, setSubTab] = useState<'builtin' | 'mypresets'>('builtin');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveDrawer, setShowSaveDrawer] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Combine all Merupify Templates + existing presets with strict deduplication by ID and normalized Name
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const combinedBuiltIn = [...KALAKAR_48_BUILT_IN_PRESETS, ...userPresets].filter(
    (tpl) => {
      const normName = tpl.name.trim().toLowerCase().replace(/[_\s]+/g, ' ');
      if (seenIds.has(tpl.id) || seenNames.has(normName)) return false;
      seenIds.add(tpl.id);
      seenNames.add(normName);
      return true;
    }
  );

  const filteredBuiltIn = combinedBuiltIn.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.badgeText || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.smallPreviewText || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.styleTags || []).some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const displayedTemplates =
    subTab === 'builtin' ? filteredBuiltIn : userPresets;

  // Enforce strictly ONE selected template ID across the displayed list
  const activeSingleTemplateId =
    displayedTemplates.find((t) => t.id === styleConfig.presetId)?.id ||
    displayedTemplates.find((t) => t.id === styleConfig.kalakarTemplateId)?.id ||
    displayedTemplates[0]?.id;

  return (
    <div className="space-y-3 text-xs">
      {/* AI Copy Frame / Poster Style Banner */}
      {onOpenFrameStyleCloner && (
        <button
          type="button"
          onClick={onOpenFrameStyleCloner}
          className="w-full p-2.5 rounded-xl bg-gradient-to-r from-[#10B981]/15 via-[#181822] to-[#06B6D4]/15 hover:from-[#10B981]/25 hover:to-[#06B6D4]/25 border border-[#10B981]/40 flex items-center justify-between gap-2 text-left cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-[#10B981] text-[#041E15] flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold text-white truncate">
                Copy Style from Frame / Poster
              </div>
              <div className="text-[10px] text-zinc-400 truncate">
                Select text, logo mark, or color area to create a style
              </div>
            </div>
          </div>
          <span className="px-2 py-1 rounded-lg bg-[#10B981] text-[#041E15] text-[10px] font-bold whitespace-nowrap shrink-0">
            Clone AI
          </span>
        </button>
      )}

      {/* Top Row: "Templates" | "My Presets" + "+ Save preset" button (Exact match to captions.png) */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center bg-[#18181F] p-1 rounded-xl border border-white/[0.07]">
          <button
            type="button"
            onClick={() => setSubTab('builtin')}
            className={`py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              subTab === 'builtin'
                ? 'bg-[#272732] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Templates
          </button>
          <button
            type="button"
            onClick={() => setSubTab('mypresets')}
            className={`py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              subTab === 'mypresets'
                ? 'bg-[#272732] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            My Presets
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowSaveDrawer((v) => !v)}
          className="py-1.5 px-2.5 rounded-xl bg-[#18181F] hover:bg-[#23232E] text-zinc-200 hover:text-white border border-white/[0.08] text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>+</span>
          <span>Save preset</span>
        </button>
      </div>

      {/* Collapsible Save Preset Drawer */}
      {(showSaveDrawer || subTab === 'mypresets') && (
        <div className="p-2.5 rounded-xl bg-[#181820] border border-white/10 space-y-2">
          <div className="text-[11px] font-bold text-white">
            Save Current Merupify Style Preset
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Preset name (e.g. Merupify Custom)..."
              className="flex-1 bg-[#111116] text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#2BAE66]"
            />
            <button
              type="button"
              onClick={() => {
                const name =
                  newPresetName.trim() || `Merupify Custom ${userPresets.length + 1}`;
                onCreateNewPreset(name, 'MERUPIFY.');
                setNewPresetName('');
                setShowSaveDrawer(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#2BAE66] hover:bg-[#249657] text-white font-bold flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>
      )}

      {/* "Find a template" search input (Exact match to captions.png) */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Find a template"
          className="w-full bg-[#17171E] text-xs text-white placeholder-zinc-500 pl-8 pr-3 py-2 rounded-xl border border-white/[0.08] focus:outline-none focus:border-[#2BAE66]"
        />
      </div>

      {/* Vertical Stack of All 44 Merupify Templates + Existing Styles (Exact match to captions.png) */}
      <div className="space-y-2.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1 pb-4">
        {displayedTemplates.map((tpl) => {
          const isSelected = activeSingleTemplateId === tpl.id;
          return (
            <div
              key={tpl.id}
              className={`rounded-2xl overflow-hidden border transition-all bg-[#14141A] shadow-md ${
                isSelected
                  ? 'border-[#2BAE66] ring-1 ring-[#2BAE66]/35'
                  : 'border-white/[0.08] hover:border-white/20'
              }`}
            >
              {/* Clickable Card Header + Visual Preview */}
              <button
                type="button"
                onClick={() => onApplyPreset(tpl)}
                className="w-full text-left cursor-pointer block"
              >
                {/* Header Bar: Name + Verified Badge + Style Tags ("Bold", "Shadow", "Italic") on Left | Check + Crown / Info on Right */}
                <div className="px-3 py-2 bg-[#16161D] flex items-center justify-between gap-2 border-b border-white/[0.05]">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="text-[12px] font-bold text-white tracking-tight truncate">
                      {tpl.name}
                    </span>
                    {tpl.isVerifiedCreator && <VerifiedCreatorBadge />}
                    {tpl.styleTags &&
                      tpl.styleTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-[#252530] text-zinc-300 text-[10px] font-semibold leading-none border border-white/[0.06]"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#2BAE66] flex items-center justify-center shadow-sm">
                        <Check className="w-3 h-3 text-white stroke-[2.5]" />
                      </span>
                    )}
                    {tpl.isPremium !== false ? (
                      <span
                        title={
                          userPlan === 'free'
                            ? 'Merupify Pro Template — Click to apply'
                            : 'Unlocked Merupify Template'
                        }
                        onClick={(e) => {
                          if (userPlan === 'free' && onUpgradePlan) {
                            e.stopPropagation();
                            onUpgradePlan();
                          }
                        }}
                        className="px-2 py-0.5 rounded-full bg-[#E59819] text-white flex items-center justify-center shadow-sm"
                      >
                        <Crown className="w-3 h-3 stroke-[2.2]" />
                      </span>
                    ) : (
                      <span
                        title="Free Built-in Merupify Template"
                        className="w-4 h-4 rounded-full border border-zinc-500/70 text-zinc-400 text-[9px] font-serif italic flex items-center justify-center"
                      >
                        i
                      </span>
                    )}
                  </div>
                </div>

                {/* Authentic Visual Template Preview Banner */}
                {renderMerupifyTemplatePreviewBanner(
                  tpl,
                  isSelected ? styleConfig : undefined
                )}
              </button>

              {/* Inline Expanded Controls When Selected — Fully Interlinked with Font, Color, Placement, Transitions & Edit */}
              {isSelected && (
                <div className="p-3 bg-[#181820] border-t border-white/[0.08] space-y-2.5">
                  {/* Font Family & Size Quick Selector */}
                  <div className="grid grid-cols-3 gap-1.5 items-center">
                    <div className="col-span-2">
                      <span className="text-[10px] font-semibold text-zinc-400 block mb-0.5">
                        Font Family
                      </span>
                      <select
                        value={styleConfig.fontFamily}
                        onChange={(e) => {
                          ensureGoogleFontLoaded(e.target.value);
                          onUpdateStyle({
                            fontFamily: e.target.value,
                            heroWordFontFamily: e.target.value,
                            accentScriptFontFamily: e.target.value,
                          });
                        }}
                        className="w-full bg-[#111116] border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#2BAE66] cursor-pointer"
                      >
                        {KALAKAR_GOOGLE_FONTS.map((f) => (
                          <option key={f.name} value={f.name}>
                            {f.name} ({f.scriptGroup})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-400 block mb-0.5">
                        Font Size
                      </span>
                      <div className="flex items-center bg-[#111116] border border-white/10 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          min={16}
                          max={120}
                          value={styleConfig.fontSize}
                          onChange={(e) =>
                            onUpdateStyle({
                              fontSize: parseInt(e.target.value, 10) || 48,
                            })
                          }
                          className="w-full bg-transparent text-white text-[11px] font-mono focus:outline-none"
                        />
                        <span className="text-[9px] text-zinc-400">px</span>
                      </div>
                    </div>
                  </div>

                  {/* Colors: Primary Text | Secondary Highlight | Card Bg */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                    <span className="text-[11px] font-semibold text-zinc-300">
                      Colors
                    </span>
                    <div className="flex items-center gap-2.5">
                      <label className="flex items-center gap-1 text-[10px] text-zinc-300 cursor-pointer">
                        <span>Text</span>
                        <input
                          type="color"
                          value={styleConfig.primaryColor || '#FFFFFF'}
                          onChange={(e) =>
                            onUpdateStyle({ primaryColor: e.target.value })
                          }
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border border-white/20"
                        />
                      </label>
                      <label className="flex items-center gap-1 text-[10px] text-zinc-300 cursor-pointer">
                        <span>Accent</span>
                        <input
                          type="color"
                          value={styleConfig.highlightColor || '#EB4823'}
                          onChange={(e) =>
                            onUpdateStyle({
                              highlightColor: e.target.value,
                              gradientMid: e.target.value,
                            })
                          }
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border border-white/20"
                        />
                      </label>
                      <label className="flex items-center gap-1 text-[10px] text-zinc-300 cursor-pointer">
                        <span>Bg</span>
                        <input
                          type="color"
                          value={styleConfig.backgroundColor || '#FAF6E8'}
                          onChange={(e) =>
                            onUpdateStyle({
                              backgroundColor: e.target.value,
                              backgroundEnabled: true,
                              backgroundOpacity: Math.max(
                                0.85,
                                styleConfig.backgroundOpacity || 0.92
                              ),
                            })
                          }
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border border-white/20"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Horizontal & Vertical Placement Sliders + Quick Screen Positions */}
                  <div className="pt-1.5 border-t border-white/[0.06] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-zinc-300">
                        Screen Placement (Horizontal &amp; Vertical)
                      </span>
                      <div className="flex items-center gap-1">
                        {(
                          [
                            { label: 'Top', x: 50, y: 18 },
                            { label: 'Center', x: 50, y: 50 },
                            { label: 'Bottom', x: 50, y: 74 },
                          ] as const
                        ).map((pos) => (
                          <button
                            key={pos.label}
                            type="button"
                            onClick={() =>
                              onUpdateStyle({
                                positionX: pos.x,
                                positionY: pos.y,
                                smallOffsetX: 0,
                                smallOffsetY: 0,
                                bigOffsetX: 0,
                                bigOffsetY: 0,
                              })
                            }
                            className="px-1.5 py-0.5 rounded bg-[#111116] hover:bg-[#2BAE66] text-[9px] font-bold text-zinc-300 hover:text-white border border-white/[0.06] cursor-pointer"
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-1.5 rounded-lg bg-[#111116] border border-white/[0.05]">
                        <div className="flex justify-between text-zinc-400 mb-0.5">
                          <span>Horizontal (X)</span>
                          <span className="text-white font-mono">
                            {styleConfig.positionX ?? 50}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={2}
                          max={98}
                          value={styleConfig.positionX ?? 50}
                          onChange={(e) =>
                            onUpdateStyle({
                              positionX: Number(e.target.value),
                            })
                          }
                          className="w-full accent-[#2BAE66] cursor-pointer"
                        />
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#111116] border border-white/[0.05]">
                        <div className="flex justify-between text-zinc-400 mb-0.5">
                          <span>Vertical (Y)</span>
                          <span className="text-white font-mono">
                            {styleConfig.positionY ?? 66}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={4}
                          max={96}
                          value={styleConfig.positionY ?? 66}
                          onChange={(e) =>
                            onUpdateStyle({
                              positionY: Number(e.target.value),
                            })
                          }
                          className="w-full accent-[#2BAE66] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Linked Transition Quick Selector */}
                  <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-zinc-300">
                      Transition (In / Hold)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={styleConfig.transitionIn || 'Slide Up'}
                        onChange={(e) =>
                          onUpdateStyle({ transitionIn: e.target.value })
                        }
                        className="bg-[#111116] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white cursor-pointer"
                      >
                        {TRANSITION_IN_OUT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            In: {opt}
                          </option>
                        ))}
                      </select>
                      <select
                        value={styleConfig.transitionHold || 'None'}
                        onChange={(e) =>
                          onUpdateStyle({ transitionHold: e.target.value })
                        }
                        className="bg-[#111116] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white cursor-pointer"
                      >
                        {TRANSITION_HOLD_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            Hold: {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Emphasize | Spotlight & Solid | Gradient segmented bars */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="grid grid-cols-2 gap-1 bg-[#111116] p-1 rounded-xl border border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateStyle({ emphasisMode: 'emphasize' })
                        }
                        className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          (styleConfig.emphasisMode || 'emphasize') ===
                          'emphasize'
                            ? 'bg-[#262632] text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Emphasize
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateStyle({ emphasisMode: 'spotlight' })
                        }
                        className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          styleConfig.emphasisMode === 'spotlight'
                            ? 'bg-[#262632] text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Spotlight
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1 bg-[#111116] p-1 rounded-xl border border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => onUpdateStyle({ useGradient: false })}
                        className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          !styleConfig.useGradient
                            ? 'bg-[#262632] text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Solid
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStyle({ useGradient: true })}
                        className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          styleConfig.useGradient
                            ? 'bg-[#262632] text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Gradient
                      </button>
                    </div>
                  </div>

                  {/* Goldox Section 3.1: Splash / Center Alignment & Linked/Unlinked Padding + Roundness */}
                  <div className="pt-2 border-t border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            styleConfig.backgroundEnabled !== false &&
                            (styleConfig.backgroundOpacity ?? 0.96) > 0.05
                          }
                          onChange={(e) =>
                            onUpdateStyle({
                              backgroundEnabled: e.target.checked,
                              backgroundOpacity: e.target.checked ? 0.95 : 0,
                            })
                          }
                          className="accent-[#2BAE66] cursor-pointer"
                        />
                        <span>Card Backdrop</span>
                      </label>
                      <div className="inline-flex items-center bg-[#111116] p-0.5 rounded-lg border border-white/[0.06]">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateStyle({
                              layoutMode: 'splash',
                              bigTextAlign: 'left',
                              smallTextAlign: 'left',
                            })
                          }
                          title="Left / Splash dynamic offset alignment"
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            styleConfig.bigTextAlign === 'left'
                              ? 'bg-[#2BAE66] text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Left
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateStyle({
                              layoutMode: 'stack-2',
                              bigTextAlign: 'center',
                              smallTextAlign: 'center',
                            })
                          }
                          title="Center balanced stack alignment"
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            (styleConfig.bigTextAlign || 'center') === 'center'
                              ? 'bg-[#2BAE66] text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Center
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateStyle({
                              bigTextAlign: 'right',
                              smallTextAlign: 'right',
                            })
                          }
                          title="Right stack alignment"
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            styleConfig.bigTextAlign === 'right'
                              ? 'bg-[#2BAE66] text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Right
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      <div className="p-1.5 rounded-lg bg-[#111116] border border-white/[0.05]">
                        <div className="flex items-center justify-between text-zinc-400 mb-0.5">
                          <span>Pad X/Y</span>
                          <span className="text-white font-mono">
                            {styleConfig.backgroundPaddingPx ?? 14}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={40}
                          value={styleConfig.backgroundPaddingPx ?? 14}
                          onChange={(e) =>
                            onUpdateStyle({
                              backgroundPaddingPx: Number(e.target.value),
                              backgroundEnabled: true,
                            })
                          }
                          className="w-full accent-[#2BAE66] cursor-pointer"
                        />
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#111116] border border-white/[0.05]">
                        <div className="flex items-center justify-between text-zinc-400 mb-0.5">
                          <span>Round</span>
                          <span className="text-white font-mono">
                            {styleConfig.backgroundRadiusPx ?? 20}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={36}
                          value={styleConfig.backgroundRadiusPx ?? 20}
                          onChange={(e) =>
                            onUpdateStyle({
                              backgroundRadiusPx: Number(e.target.value),
                              backgroundEnabled: true,
                            })
                          }
                          className="w-full accent-[#2BAE66] cursor-pointer"
                        />
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#111116] border border-white/[0.05]">
                        <div className="flex items-center justify-between text-zinc-400 mb-0.5">
                          <span>Opacity</span>
                          <span className="text-white font-mono">
                            {Math.round(
                              (styleConfig.backgroundOpacity ?? 0.96) * 100
                            )}
                            %
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(
                            (styleConfig.backgroundOpacity ?? 0.96) * 100
                          )}
                          onChange={(e) => {
                            const val = Number(e.target.value) / 100;
                            onUpdateStyle({
                              backgroundOpacity: val,
                              backgroundEnabled: val > 0.05,
                            });
                          }}
                          className="w-full accent-[#2BAE66] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface KalakarEffectsSectionProps {
  styleConfig: CaptionStyleConfig;
  customFonts: string[];
  onUpdateStyle: (partial: Partial<CaptionStyleConfig>) => void;
  onOpenFrameStyleCloner?: () => void;
}

interface MultiStopGradientBarProps {
  stops: GradientStop[];
  angle: number;
  level: 'word' | 'char';
  onChangeStops: (stops: GradientStop[]) => void;
  onChangeAngle: (angle: number) => void;
  onChangeLevel: (level: 'word' | 'char') => void;
}

const MULTI_STOP_GRADIENT_PRESETS: { name: string; stops: GradientStop[] }[] = [
  {
    name: 'Emerald Studio',
    stops: [
      { id: 's1', color: '#FFFFFF', position: 0 },
      { id: 's2', color: '#20B038', position: 100 },
    ],
  },
  {
    name: 'Sunset Flame (3-Stop)',
    stops: [
      { id: 's1', color: '#FFDF40', position: 0 },
      { id: 's2', color: '#FF5E36', position: 50 },
      { id: 's3', color: '#E01E5A', position: 100 },
    ],
  },
  {
    name: 'Cyber Neon (4-Stop)',
    stops: [
      { id: 's1', color: '#00F5D4', position: 0 },
      { id: 's2', color: '#00BBF9', position: 35 },
      { id: 's3', color: '#9B5DE5', position: 70 },
      { id: 's4', color: '#F15BB5', position: 100 },
    ],
  },
  {
    name: 'Cinema Gold (5-Stop)',
    stops: [
      { id: 's1', color: '#FFF8D6', position: 0 },
      { id: 's2', color: '#FFD43B', position: 25 },
      { id: 's3', color: '#FF922B', position: 50 },
      { id: 's4', color: '#FF4D6D', position: 75 },
      { id: 's5', color: '#C9184A', position: 100 },
    ],
  },
];

const MultiStopGradientEditor: React.FC<MultiStopGradientBarProps> = ({
  stops,
  angle,
  level,
  onChangeStops,
  onChangeAngle,
  onChangeLevel,
}) => {
  const safeStops: GradientStop[] =
    stops && stops.length >= 2
      ? stops
      : [
          { id: 'stop-0', color: '#FFFFFF', position: 0 },
          { id: 'stop-1', color: '#20B038', position: 100 },
        ];

  const [selectedStopId, setSelectedStopId] = useState<string>(
    safeStops[safeStops.length - 1]?.id || safeStops[0].id
  );
  const barRef = React.useRef<HTMLDivElement | null>(null);
  const draggingStopIdRef = React.useRef<string | null>(null);

  const sortedStops = [...safeStops].sort((a, b) => a.position - b.position);
  const cssGradient = `linear-gradient(90deg, ${sortedStops
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ')})`;

  const activeStop =
    safeStops.find((s) => s.id === selectedStopId) ||
    safeStops[safeStops.length - 1] ||
    safeStops[0];

  const updateStopById = (id: string, partial: Partial<GradientStop>) => {
    const next = safeStops.map((s) => (s.id === id ? { ...s, ...partial } : s));
    onChangeStops(next);
  };

  const handleTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return;
    if ((e.target as HTMLElement).dataset.stopThumb === 'true') return;
    if (safeStops.length >= 5) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(
      0,
      Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100))
    );
    const newStop: GradientStop = {
      id: `stop-${Date.now()}`,
      color: activeStop?.color || '#20B038',
      position: pct,
    };
    const next = [...safeStops, newStop].sort((a, b) => a.position - b.position);
    onChangeStops(next);
    setSelectedStopId(newStop.id);
  };

  const startDraggingThumb = (
    e: React.MouseEvent<HTMLButtonElement>,
    stopId: string
  ) => {
    e.stopPropagation();
    setSelectedStopId(stopId);
    draggingStopIdRef.current = stopId;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!barRef.current || !draggingStopIdRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(
          100,
          Math.round(((moveEvent.clientX - rect.left) / rect.width) * 100)
        )
      );
      onChangeStops(
        safeStops.map((s) =>
          s.id === draggingStopIdRef.current ? { ...s, position: pct } : s
        )
      );
    };

    const handleMouseUp = () => {
      draggingStopIdRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleAddStopButton = () => {
    if (safeStops.length >= 5) return;
    const sorted = [...safeStops].sort((a, b) => a.position - b.position);
    let insertPos = 50;
    if (sorted.length >= 2) {
      let maxGap = -1;
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1].position - sorted[i].position;
        if (gap > maxGap) {
          maxGap = gap;
          insertPos = Math.round(
            (sorted[i].position + sorted[i + 1].position) / 2
          );
        }
      }
    }
    const newStop: GradientStop = {
      id: `stop-${Date.now()}`,
      color: '#FFD43B',
      position: insertPos,
    };
    const next = [...safeStops, newStop].sort((a, b) => a.position - b.position);
    onChangeStops(next);
    setSelectedStopId(newStop.id);
  };

  const handleRemoveStop = (id: string) => {
    if (safeStops.length <= 2) return;
    const next = safeStops.filter((s) => s.id !== id);
    onChangeStops(next);
    if (selectedStopId === id && next[0]) {
      setSelectedStopId(next[0].id);
    }
  };

  return (
    <div className="space-y-2.5 pt-0.5">
      {/* Interactive Multi-Stop Gradient Preview Bar (Exact Screenshot 3/4/5 Match) */}
      <div className="space-y-1.5">
        <div
          ref={barRef}
          onMouseDown={handleTrackMouseDown}
          title={
            safeStops.length < 5
              ? 'Click anywhere on the gradient bar to add a color stop (up to 5)'
              : 'Drag stops to adjust gradient positions'
          }
          className="relative h-6 rounded-full border border-white/15 cursor-pointer select-none shadow-inner"
          style={{ background: cssGradient }}
        >
          {sortedStops.map((stop) => {
            const isSelected = stop.id === activeStop?.id;
            return (
              <button
                key={stop.id}
                type="button"
                data-stop-thumb="true"
                onMouseDown={(e) => startDraggingThumb(e, stop.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStopId(stop.id);
                }}
                style={{
                  left: `calc(${stop.position}% - 10px)`,
                  backgroundColor: stop.color,
                }}
                className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full transition-transform cursor-grab active:cursor-grabbing ${
                  isSelected
                    ? 'ring-2 ring-white scale-110 shadow-md z-10'
                    : 'ring-2 ring-white/75 hover:scale-105'
                }`}
                title={`Stop ${stop.position}% (${stop.color})`}
              />
            );
          })}
        </div>

        {/* Multi-Stop Color Pickers Row (Up to 5 Color Levels) */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap bg-[#141417] px-2.5 py-2 rounded-lg border border-white/[0.06]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {sortedStops.map((stop, idx) => {
              const isSelected = stop.id === activeStop?.id;
              return (
                <div
                  key={stop.id}
                  onClick={() => setSelectedStopId(stop.id)}
                  className={`flex items-center gap-1 px-1.5 py-1 rounded-md border text-[10px] cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#25262B] border-[#20B038] text-white'
                      : 'bg-[#1C1B1E] border-white/[0.08] text-zinc-400 hover:text-white'
                  }`}
                >
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => {
                      setSelectedStopId(stop.id);
                      updateStopById(stop.id, { color: e.target.value });
                    }}
                    className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0"
                    title={`Change color for Stop ${idx + 1}`}
                  />
                  <span className="font-mono text-[10px]">
                    {stop.position}%
                  </span>
                  {safeStops.length > 2 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveStop(stop.id);
                      }}
                      className="text-zinc-400 hover:text-rose-400 ml-0.5 cursor-pointer"
                      title="Remove color stop"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}

            {safeStops.length < 5 && (
              <button
                type="button"
                onClick={handleAddStopButton}
                className="px-2 py-1 rounded-md bg-[#1C1B1E] hover:bg-[#25262B] border border-dashed border-white/20 text-[10px] font-semibold text-[#20B038] cursor-pointer transition-colors"
                title="Add another color level (up to 5 stops)"
              >
                + Stop ({safeStops.length}/5)
              </button>
            )}
          </div>

          {/* Active Stop Hex + Position Fine Editor */}
          {activeStop && (
            <div className="flex items-center gap-1.5 w-full pt-1.5 border-t border-white/[0.05] justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#8E9192]">Active Color</span>
                <input
                  type="text"
                  value={activeStop.color.toUpperCase()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                      updateStopById(activeStop.id, { color: val });
                    }
                  }}
                  className="w-18 bg-[#1C1B1E] border border-white/[0.08] rounded px-1.5 py-0.5 text-[10px] font-mono text-white focus:outline-none focus:border-[#20B038]"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#8E9192]">Pos</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={activeStop.position}
                  onChange={(e) =>
                    updateStopById(activeStop.id, {
                      position: Math.max(
                        0,
                        Math.min(100, parseInt(e.target.value, 10) || 0)
                      ),
                    })
                  }
                  className="w-11 bg-[#1C1B1E] border border-white/[0.08] rounded px-1 py-0.5 text-right text-[10px] font-mono text-white focus:outline-none"
                />
                <span className="text-[10px] text-[#8E9192]">%</span>
              </div>
            </div>
          )}

          {/* Quick Multi-Color Presets */}
          <div className="flex items-center gap-1 w-full pt-1">
            <span className="text-[9px] text-[#8E9192] mr-1">Presets:</span>
            {MULTI_STOP_GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  const cloned = preset.stops.map((s, i) => ({
                    ...s,
                    id: `stop-${Date.now()}-${i}`,
                  }));
                  onChangeStops(cloned);
                  setSelectedStopId(cloned[cloned.length - 1].id);
                }}
                title={preset.name}
                className="h-4 flex-1 rounded border border-white/15 hover:border-white/50 transition-all cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, ${preset.stops
                    .map((s) => `${s.color} ${s.position}%`)
                    .join(', ')})`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Angle Row (Exact Screenshot 3/4/5 Match: Angle | ⦿ | 0 °) */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[#9FA1A6]">Angle</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => onChangeAngle(parseInt(e.target.value, 10) || 0)}
            className="w-20 accent-[#20B038] cursor-pointer"
          />
          <button
            type="button"
            onClick={() => onChangeAngle((angle + 45) % 360)}
            title="Click to rotate angle by 45°"
            className="w-6 h-6 rounded-full border border-white/15 bg-[#18191C] flex items-center justify-center text-[#9FA1A6] hover:text-white cursor-pointer relative"
          >
            <span
              className="w-2 h-2 rounded-full border border-zinc-300 block"
              style={{
                transform: `rotate(${angle}deg) translateY(-2px)`,
              }}
            />
          </button>
          <div className="flex items-center bg-[#18191C] border border-white/[0.08] rounded-lg px-2.5 py-1">
            <input
              type="number"
              min={0}
              max={360}
              value={angle}
              onChange={(e) =>
                onChangeAngle(
                  Math.max(0, Math.min(360, parseInt(e.target.value, 10) || 0))
                )
              }
              className="w-9 bg-transparent text-right text-xs font-mono text-white focus:outline-none"
            />
            <span className="text-xs text-[#8E9192] ml-1">°</span>
          </div>
        </div>
      </div>

      {/* Level Row (Exact Screenshot 3/4/5 Match: Level | Word | Char) */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-[#9FA1A6]">Level</span>
        <div className="grid grid-cols-2 bg-[#16171A] p-0.5 rounded-lg border border-white/[0.08] w-44">
          <button
            type="button"
            onClick={() => onChangeLevel('word')}
            className={`py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              level === 'word'
                ? 'bg-[#26272B] text-white shadow-sm'
                : 'text-[#8E9192] hover:text-white'
            }`}
          >
            Word
          </button>
          <button
            type="button"
            onClick={() => onChangeLevel('char')}
            className={`py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              level === 'char'
                ? 'bg-[#26272B] text-white shadow-sm'
                : 'text-[#8E9192] hover:text-white'
            }`}
          >
            Char
          </button>
        </div>
      </div>
    </div>
  );
};

export const KalakarTextAndEffectsTab: React.FC<KalakarEffectsSectionProps> = ({
  styleConfig,
  customFonts,
  onUpdateStyle,
  onOpenFrameStyleCloner,
}) => {
  const [fontSearch, setFontSearch] = useState('');
  const [selectedFontGroup, setSelectedFontGroup] =
    useState<GoogleFontLanguageGroup>('All');
  const [showFontBrowser, setShowFontBrowser] = useState(false);
  const [showAdvancedPosition, setShowAdvancedPosition] = useState(false);

  // Collapsible section states matching the screenshots
  const [openSections, setOpenSections] = useState<{
    fonts: boolean;
    format: boolean;
    position: boolean;
    color: boolean;
    emphasis: boolean;
    spacing: boolean;
    effects: boolean;
  }>({
    fonts: true,
    format: true,
    position: true,
    color: true,
    emphasis: true,
    spacing: true,
    effects: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFonts = KALAKAR_GOOGLE_FONTS.filter((f) => {
    const matchesGroup =
      selectedFontGroup === 'All' || f.scriptGroup === selectedFontGroup;
    const q = fontSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.label.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      f.scriptGroup.toLowerCase().includes(q);
    return matchesGroup && matchesQuery;
  });

  const handleSelectGoogleFont = (fontName: string) => {
    ensureGoogleFontLoaded(fontName);
    onUpdateStyle({
      fontFamily: fontName,
      heroWordFontFamily: fontName,
    });
  };

  // Base Color multi-stop state
  const baseStops: GradientStop[] =
    styleConfig.baseGradientStops && styleConfig.baseGradientStops.length >= 2
      ? styleConfig.baseGradientStops
      : [
          {
            id: 'base-0',
            color: styleConfig.primaryColor || '#FFFFFF',
            position: 0,
          },
          {
            id: 'base-1',
            color: styleConfig.secondaryColor || '#38BDF8',
            position: 100,
          },
        ];

  // Emphasis multi-stop state
  const emphasisStops: GradientStop[] =
    styleConfig.gradientStops && styleConfig.gradientStops.length >= 2
      ? styleConfig.gradientStops
      : [
          {
            id: 'emp-0',
            color: styleConfig.gradientStart || '#FFFFFF',
            position: 0,
          },
          {
            id: 'emp-1',
            color:
              styleConfig.gradientEnd ||
              styleConfig.highlightColor ||
              '#20B038',
            position: 100,
          },
        ];

  return (
    <div className="space-y-4 text-xs text-[#E5E1E4] pb-4">
      {/* AI Copy Style from Video Frame / Poster Quick Action */}
      {onOpenFrameStyleCloner && (
        <button
          type="button"
          onClick={onOpenFrameStyleCloner}
          className="w-full p-2.5 rounded-xl bg-[#18191E] hover:bg-[#20222A] border border-[#10B981]/40 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-[#10B981]/20 border border-[#10B981]/50 text-[#34D399] flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-white truncate">
                Copy Style from Frame / Poster
              </div>
              <div className="text-[10px] text-[#8E9192] truncate">
                Sample text, logo mark, or colors from any frame
              </div>
            </div>
          </div>
          <span className="px-2 py-1 rounded-lg bg-[#10B981] text-[#041E15] text-[10px] font-bold whitespace-nowrap shrink-0">
            Sample Frame
          </span>
        </button>
      )}

      {/* 1. FONTS COLLAPSIBLE SECTION (Screenshots 1 & 2) */}
      <div className="border-b border-white/[0.07] pb-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={() => toggleSection('fonts')}
            className="flex items-center gap-1.5 text-left cursor-pointer group"
          >
            {openSections.fonts ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#8E9192] group-hover:text-white" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#8E9192] group-hover:text-white" />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9FA1A6] group-hover:text-white">
              FONTS
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              ensureGoogleFontLoaded('Instrument Sans');
              onUpdateStyle({
                fontFamily: 'Instrument Sans',
                heroWordFontFamily: 'Instrument Sans',
                fontFace: 'Bold (700)',
                fontWeight: 700,
                fontSize: 64,
              });
            }}
            className="text-[11px] text-[#8E9192] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {openSections.fonts && (
          <div className="space-y-2.5">
            {/* Font Family Row */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[#9FA1A6] shrink-0">
                Font Family
              </span>
              <div className="relative w-48">
                <select
                  value={styleConfig.fontFamily || 'Instrument Sans'}
                  onChange={(e) => handleSelectGoogleFont(e.target.value)}
                  className="w-full bg-[#18191C] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white appearance-none focus:outline-none focus:border-[#20B038] cursor-pointer pr-7 truncate"
                >
                  {customFonts.map((cf) => (
                    <option key={cf} value={cf}>
                      ★ {cf}
                    </option>
                  ))}
                  {KALAKAR_GOOGLE_FONTS.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#8E9192] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Font Face Row */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[#9FA1A6] shrink-0">Font Face</span>
              <div className="relative w-48">
                <select
                  value={styleConfig.fontFace || 'Bold (700)'}
                  onChange={(e) => {
                    const face = KALAKAR_FONT_FACES.find(
                      (ff) => ff.label === e.target.value
                    );
                    onUpdateStyle({
                      fontFace: e.target.value,
                      fontWeight: face?.weight || 700,
                      italicText: e.target.value
                        .toLowerCase()
                        .includes('italic'),
                    });
                  }}
                  className="w-full bg-[#18191C] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white appearance-none focus:outline-none focus:border-[#20B038] cursor-pointer pr-7"
                >
                  {KALAKAR_FONT_FACES.map((ff) => (
                    <option key={ff.label} value={ff.label}>
                      {ff.label.replace(/\s*\(\d+\)/, '')}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#8E9192] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Size Slider + px Badge Row */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[#9FA1A6] shrink-0">Size</span>
              <div className="flex items-center gap-2.5 w-48">
                <input
                  type="range"
                  min={16}
                  max={120}
                  value={styleConfig.fontSize || 64}
                  onChange={(e) =>
                    onUpdateStyle({
                      fontSize: parseInt(e.target.value, 10) || 64,
                    })
                  }
                  className="flex-1 accent-[#20B038] cursor-pointer"
                />
                <div className="flex items-center bg-[#18191C] border border-white/[0.08] rounded-lg px-2 py-1 shrink-0">
                  <input
                    type="number"
                    min={16}
                    max={120}
                    value={styleConfig.fontSize || 64}
                    onChange={(e) =>
                      onUpdateStyle({
                        fontSize: parseInt(e.target.value, 10) || 64,
                      })
                    }
                    className="w-8 bg-transparent text-right text-xs font-mono text-white focus:outline-none"
                  />
                  <span className="text-[11px] text-[#8E9192] ml-1">px</span>
                </div>
              </div>
            </div>

            {/* Caption Line Count (1 Line / 2 Lines / 3 Lines) & Per-Line Size + Bold / Italic / Shine / Color */}
            <div className="p-2.5 rounded-xl bg-[#141519] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-white">
                  Caption Lines
                </span>
                <div className="grid grid-cols-4 gap-1 bg-[#0E0F12] p-0.5 rounded-lg border border-white/[0.08]">
                  {(
                    [
                      { val: undefined, label: 'Auto' },
                      { val: 1 as const, label: '1 Line' },
                      { val: 2 as const, label: '2 Lines' },
                      { val: 3 as const, label: '3 Lines' },
                    ] as const
                  ).map((opt) => {
                    const isSelected = styleConfig.maxLines === opt.val;
                    return (
                      <button
                        key={`maxlines-${String(opt.val)}`}
                        type="button"
                        onClick={() =>
                          onUpdateStyle({
                            maxLines: opt.val,
                            smallTwoLineMode:
                              opt.val === 3 ? 'two-line-split' : 'single-line',
                          })
                        }
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#20B038] text-white shadow-sm'
                            : 'text-[#8E9192] hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Per-Line Size (- / +) & Style (Bold, Italic, Shine, Color) */}
              <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
                {(
                  [
                    {
                      lineNum: 1,
                      label: 'Line 1 (Top)',
                      sizePx:
                        styleConfig.line1FontSizePx ??
                        Math.round(
                          (styleConfig.fontSize || 48) *
                            (styleConfig.smallWordScale || 0.78)
                        ),
                      bold: Boolean(styleConfig.line1Bold),
                      italic: Boolean(styleConfig.line1Italic),
                      shine: Boolean(styleConfig.line1Shine),
                      color:
                        styleConfig.line1Color ||
                        styleConfig.primaryColor ||
                        '#FFFFFF',
                      onSize: (nextPx: number) =>
                        onUpdateStyle({
                          line1FontSizePx: Math.max(14, Math.min(130, nextPx)),
                        }),
                      onToggleBold: () =>
                        onUpdateStyle({ line1Bold: !styleConfig.line1Bold }),
                      onToggleItalic: () =>
                        onUpdateStyle({
                          line1Italic: !styleConfig.line1Italic,
                        }),
                      onToggleShine: () =>
                        onUpdateStyle({ line1Shine: !styleConfig.line1Shine }),
                      onColor: (c: string) =>
                        onUpdateStyle({ line1Color: c }),
                    },
                    {
                      lineNum: 2,
                      label: 'Line 2 (Hero)',
                      sizePx:
                        styleConfig.line2FontSizePx ??
                        Math.round(
                          (styleConfig.fontSize || 48) *
                            (styleConfig.bigWordScale || 1.75)
                        ),
                      bold: Boolean(styleConfig.line2Bold ?? true),
                      italic: Boolean(styleConfig.line2Italic),
                      shine: Boolean(styleConfig.line2Shine),
                      color:
                        styleConfig.line2Color ||
                        styleConfig.highlightColor ||
                        '#20B038',
                      onSize: (nextPx: number) =>
                        onUpdateStyle({
                          line2FontSizePx: Math.max(16, Math.min(150, nextPx)),
                        }),
                      onToggleBold: () =>
                        onUpdateStyle({
                          line2Bold: !(styleConfig.line2Bold ?? true),
                        }),
                      onToggleItalic: () =>
                        onUpdateStyle({
                          line2Italic: !styleConfig.line2Italic,
                        }),
                      onToggleShine: () =>
                        onUpdateStyle({ line2Shine: !styleConfig.line2Shine }),
                      onColor: (c: string) =>
                        onUpdateStyle({ line2Color: c }),
                    },
                    ...(styleConfig.maxLines === 3
                      ? [
                          {
                            lineNum: 3,
                            label: 'Line 3 (Bottom)',
                            sizePx:
                              styleConfig.line3FontSizePx ??
                              styleConfig.line1FontSizePx ??
                              Math.round(
                                (styleConfig.fontSize || 48) *
                                  (styleConfig.smallWordScale || 0.78)
                              ),
                            bold: Boolean(styleConfig.line3Bold),
                            italic: Boolean(styleConfig.line3Italic),
                            shine: Boolean(styleConfig.line3Shine),
                            color:
                              styleConfig.line3Color ||
                              styleConfig.primaryColor ||
                              '#FFFFFF',
                            onSize: (nextPx: number) =>
                              onUpdateStyle({
                                line3FontSizePx: Math.max(
                                  14,
                                  Math.min(130, nextPx)
                                ),
                              }),
                            onToggleBold: () =>
                              onUpdateStyle({
                                line3Bold: !styleConfig.line3Bold,
                              }),
                            onToggleItalic: () =>
                              onUpdateStyle({
                                line3Italic: !styleConfig.line3Italic,
                              }),
                            onToggleShine: () =>
                              onUpdateStyle({
                                line3Shine: !styleConfig.line3Shine,
                              }),
                            onColor: (c: string) =>
                              onUpdateStyle({ line3Color: c }),
                          },
                        ]
                      : []),
                  ]
                ).map((ln) => (
                  <div
                    key={`global-line-ctrl-${ln.lineNum}`}
                    className="flex items-center justify-between gap-1.5 bg-[#18191E] px-2 py-1.5 rounded-lg border border-white/[0.06]"
                  >
                    <span className="text-[10px] font-semibold text-zinc-200 truncate w-20 shrink-0">
                      {ln.label}
                    </span>

                    {/* Decrease / Increase Line Font Size */}
                    <div className="flex items-center gap-1 bg-[#111216] px-1.5 py-0.5 rounded-md border border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => ln.onSize(ln.sizePx - 2)}
                        title={`Decrease ${ln.label} size`}
                        className="w-4 h-4 rounded hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-[10px] font-mono font-bold text-white w-8 text-center">
                        {ln.sizePx}p
                      </span>
                      <button
                        type="button"
                        onClick={() => ln.onSize(ln.sizePx + 2)}
                        title={`Increase ${ln.label} size`}
                        className="w-4 h-4 rounded hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Line Bold / Italic / Shine / Color */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={ln.onToggleBold}
                        title={`Toggle Bold on ${ln.label}`}
                        className={`w-6 h-6 rounded text-[10px] font-black transition-colors cursor-pointer border ${
                          ln.bold
                            ? 'bg-[#20B038] text-white border-[#20B038]'
                            : 'bg-[#111216] text-zinc-400 border-white/[0.08] hover:text-white'
                        }`}
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={ln.onToggleItalic}
                        title={`Toggle Italic on ${ln.label}`}
                        className={`w-6 h-6 rounded text-[10px] italic font-serif font-bold transition-colors cursor-pointer border ${
                          ln.italic
                            ? 'bg-[#20B038] text-white border-[#20B038]'
                            : 'bg-[#111216] text-zinc-400 border-white/[0.08] hover:text-white'
                        }`}
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={ln.onToggleShine}
                        title={`Toggle Metallic Shine Shimmer on ${ln.label}`}
                        className={`px-1.5 h-6 rounded text-[9px] font-bold transition-colors cursor-pointer border flex items-center gap-0.5 ${
                          ln.shine
                            ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-sm'
                            : 'bg-[#111216] text-zinc-400 border-white/[0.08] hover:text-amber-300'
                        }`}
                      >
                        <span>✨</span>
                      </button>
                      <input
                        type="color"
                        value={ln.color}
                        onChange={(e) => ln.onColor(e.target.value)}
                        title={`${ln.label} Color`}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border border-white/15 p-0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Multilingual Font Browser Drawer */}
            <button
              type="button"
              onClick={() => setShowFontBrowser((v) => !v)}
              className="w-full py-1 px-2.5 rounded-lg bg-[#16171A] hover:bg-[#1E2024] border border-white/[0.06] text-[10px] text-[#20B038] font-medium flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>
                Search {KALAKAR_GOOGLE_FONTS.length}+ Indian &amp; English Fonts
              </span>
              <span className="text-[10px] text-[#8E9192]">
                {showFontBrowser ? 'Hide' : 'Browse'}
              </span>
            </button>

            {showFontBrowser && (
              <div className="p-2.5 rounded-xl bg-[#0F1012] border border-white/[0.08] space-y-2">
                <div className="flex flex-wrap gap-1">
                  {GOOGLE_FONT_LANGUAGE_TABS.map((tab) => {
                    const active = selectedFontGroup === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedFontGroup(tab.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                          active
                            ? 'bg-[#20B038] text-white'
                            : 'bg-[#18191C] text-[#8E9192] hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8E9192] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    placeholder="Search fonts..."
                    className="w-full bg-[#18191C] text-white text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-white/[0.08] focus:outline-none focus:border-[#20B038]"
                  />
                </div>
                <div className="max-h-[150px] overflow-y-auto space-y-1 pr-1">
                  {filteredFonts.map((f) => {
                    const isSelected = styleConfig.fontFamily === f.name;
                    return (
                      <button
                        key={`${f.scriptGroup}-${f.name}`}
                        type="button"
                        onMouseEnter={() => ensureGoogleFontLoaded(f.name)}
                        onClick={() => handleSelectGoogleFont(f.name)}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between gap-2 cursor-pointer border ${
                          isSelected
                            ? 'bg-[#20B038]/15 border-[#20B038]/60 text-white'
                            : 'bg-[#18191C] hover:bg-[#222327] border-white/[0.04] text-zinc-200'
                        }`}
                      >
                        <span className="text-[11px] font-semibold truncate">
                          {f.name}{' '}
                          <span className="text-[9px] text-[#8E9192]">
                            ({f.scriptGroup})
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. FORMAT COLLAPSIBLE SECTION (Screenshots 1 & 2) */}
      <div className="border-b border-white/[0.07] pb-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={() => toggleSection('format')}
            className="flex items-center gap-1.5 text-left cursor-pointer group"
          >
            {openSections.format ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#8E9192] group-hover:text-white" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#8E9192] group-hover:text-white" />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9FA1A6] group-hover:text-white">
              FORMAT
            </span>
          </button>
        </div>

        {openSections.format && (
          <div className="grid grid-cols-2 gap-2">
            {/* Case & Underline (Tt | T | t | U) */}
            <div className="grid grid-cols-4 bg-[#16171A] p-0.5 rounded-lg border border-white/[0.08]">
              {(
                [
                  { id: 'capitalize', label: 'Tt', title: 'Title Case' },
                  { id: 'uppercase', label: 'T', title: 'UPPERCASE' },
                  { id: 'lowercase', label: 't', title: 'lowercase' },
                ] as const
              ).map((st) => {
                const active = (styleConfig.textTransform || 'none') === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() =>
                      onUpdateStyle({
                        textTransform: active ? 'none' : st.id,
                      })
                    }
                    title={st.title}
                    className={`py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#26272B] text-white shadow-sm'
                        : 'text-[#8E9192] hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  onUpdateStyle({ underlineText: !styleConfig.underlineText })
                }
                title="Underline"
                className={`py-1.5 rounded-md text-xs font-semibold underline cursor-pointer transition-colors ${
                  styleConfig.underlineText
                    ? 'bg-[#26272B] text-white shadow-sm'
                    : 'text-[#8E9192] hover:text-white'
                }`}
              >
                U
              </button>
            </div>

            {/* Alignment (Left | Center | Right) */}
            <div className="grid grid-cols-3 bg-[#16171A] p-0.5 rounded-lg border border-white/[0.08]">
              {(
                [
                  { id: 'left', icon: 'format_align_left' },
                  { id: 'center', icon: 'format_align_center' },
                  { id: 'right', icon: 'format_align_right' },
                ] as const
              ).map((al) => {
                const active = (styleConfig.bigTextAlign || 'center') === al.id;
                return (
                  <button
                    key={al.id}
                    type="button"
                    onClick={() =>
                      onUpdateStyle({
                        smallTextAlign: al.id,
                        smallLine2TextAlign: al.id,
                        bigTextAlign: al.id,
                      })
                    }
                    className={`py-1.5 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#26272B] text-white shadow-sm'
                        : 'text-[#8E9192] hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {al.icon}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. POSITION COLLAPSIBLE SECTION (Screenshots 1 & 2) */}
      <div className="border-b border-white/[0.07] pb-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={() => toggleSection('position')}
            className="flex items-center gap-1.5 text-left cursor-pointer group"
          >
            {openSections.position ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#8E9192] group-hover:text-white" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#8E9192] group-hover:text-white" />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9FA1A6] group-hover:text-white">
              POSITION
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateStyle({
                positionX: 50,
                positionY: 80,
                smallOffsetX: 0,
                smallOffsetY: 0,
                smallLine2OffsetX: 0,
                smallLine2OffsetY: 0,
                bigOffsetX: 0,
                bigOffsetY: 0,
              })
            }
            className="text-[11px] text-[#8E9192] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {openSections.position && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-3">
              {/* Horizontal */}
              <div className="space-y-1.5">
                <span className="text-xs text-[#9FA1A6] block">Horizontal</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={styleConfig.positionX ?? 50}
                    onChange={(e) =>
                      onUpdateStyle({
                        positionX: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="flex-1 accent-[#20B038] cursor-pointer min-w-0"
                  />
                  <div className="flex items-center bg-[#18191C] border border-white/[0.08] rounded-lg px-2 py-1 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={styleConfig.positionX ?? 50}
                      onChange={(e) =>
                        onUpdateStyle({
                          positionX: Math.max(
                            0,
                            Math.min(100, parseInt(e.target.value, 10) || 0)
                          ),
                        })
                      }
                      className="w-7 bg-transparent text-right text-xs font-mono text-white focus:outline-none"
                    />
                    <span className="text-[11px] text-[#8E9192] ml-0.5">%</span>
                  </div>
                </div>
              </div>

              {/* Vertical */}
              <div className="space-y-1.5">
                <span className="text-xs text-[#9FA1A6] block">Vertical</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={styleConfig.positionY ?? 80}
                    onChange={(e) =>
                      onUpdateStyle({
                        positionY: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="flex-1 accent-[#20B038] cursor-pointer min-w-0"
                  />
                  <div className="flex items-center bg-[#18191C] border border-white/[0.08] rounded-lg px-2 py-1 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={styleConfig.positionY ?? 80}
                      onChange={(e) =>
                        onUpdateStyle({
                          positionY: Math.max(
                            0,
                            Math.min(100, parseInt(e.target.value, 10) || 0)
                          ),
                        })
                      }
                      className="w-7 bg-transparent text-right text-xs font-mono text-white focus:outline-none"
                    />
                    <span className="text-[11px] text-[#8E9192] ml-0.5">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. COLOR COLLAPSIBLE SECTION (Screenshots 1 & 2 + Multi-Stop Gradient Support) */}
      <div className="border-b border-white/[0.07] pb-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={() => toggleSection('color')}
            className="flex items-center gap-1.5 text-left cursor-pointer group"
          >
            {openSections.color ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#8E9192] group-hover:text-white" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#8E9192] group-hover:text-white" />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9FA1A6] group-hover:text-white">
              COLOR
            </span>
          </button>
        </div>

        {openSections.color && (
          <div className="space-y-2.5">
            {/* Solid | Gradient Segmented Switch */}
            <div className="grid grid-cols-2 bg-[#16171A] p-0.5 rounded-lg border border-white/[0.08]">
              <button
                type="button"
                onClick={() => onUpdateStyle({ useBaseGradient: false })}
                className={`py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  !styleConfig.useBaseGradient
                    ? 'bg-[#26272B] text-white shadow-sm'
                    : 'text-[#8E9192] hover:text-white'
                }`}
              >
                Solid
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateStyle({
                    useBaseGradient: true,
                    baseGradientStops: baseStops,
                  })
                }
                className={`py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  styleConfig.useBaseGradient
                    ? 'bg-[#26272B] text-white shadow-sm'
                    : 'text-[#8E9192] hover:text-white'
                }`}
              >
                Gradient
              </button>
            </div>

            {!styleConfig.useBaseGradient ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[#9FA1A6]">Base</span>
                <label className="flex items-center justify-between bg-[#18191C] border border-white/[0.08] rounded-lg px-3 py-1.5 w-44 cursor-pointer">
                  <span className="text-xs font-mono text-white uppercase">
                    {styleConfig.primaryColor || '#FFFFFF'}
                  </span>
                  <input
                    type="color"
                    value={styleConfig.primaryColor || '#FFFFFF'}
                    onChange={(e) =>
                      onUpdateStyle({ primaryColor: e.target.value })
                    }
                    className="w-5 h-5 rounded border border-white/20 cursor-pointer bg-transparent"
                  />
                </label>
              </div>
            ) : (
              <MultiStopGradientEditor
                stops={baseStops}
                angle={styleConfig.baseGradientAngle ?? 0}
                level={styleConfig.baseGradientLevel || 'word'}
                onChangeStops={(nextStops) =>
                  onUpdateStyle({
                    useBaseGradient: true,
                    baseGradientStops: nextStops,
                    primaryColor: nextStops[0]?.color || '#FFFFFF',
                  })
                }
                onChangeAngle={(nextAngle) =>
                  onUpdateStyle({ baseGradientAngle: nextAngle })
                }
                onChangeLevel={(nextLevel) =>
                  onUpdateStyle({ baseGradientLevel: nextLevel })
                }
              />
            )}
          </div>
        )}
      </div>

      {/* 5. EMPHASIS COLLAPSIBLE SECTION (Screenshots 1, 2, 3, 4, 5) */}
      <div className="border-b border-white/[0.07] pb-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={() => toggleSection('emphasis')}
            className="flex items-center gap-1.5 text-left cursor-pointer group"
          >
            {openSections.emphasis ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#8E9192] group-hover:text-white" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#8E9192] group-hover:text-white" />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9FA1A6] group-hover:text-white">
              EMPHASIS
            </span>
          </button>
        </div>

        {openSections.emphasis && (
          <div className="space-y-2.5">
            {/* Emphasize | Spotlight Segmented Bar */}
            <div className="grid grid-cols-2 bg-[#16171A] p-0.5 rounded-lg border border-white/[0.08]">
              <button
                type="button"
                onClick={() => onUpdateStyle({ emphasisMode: 'emphasize' })}
                className={`py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  (styleConfig.emphasisMode || 'emphasize') === 'emphasize'
                    ? 'bg-[#26272B] text-white shadow-sm'
                    : 'text-[#8E9192] hover:text-white'
                }`}
              >
                Emphasize
              </button>
              <button
                type="button"
                onClick={() => onUpdateStyle({ emphasisMode: 'spotlight' })}
                className={`py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  styleConfig.emphasisMode === 'spotlight'
                    ? 'bg-[#26272B] text-white shadow-sm'
                    : 'text-[#8E9192] hover:text-white'
                }`}
              >
                Spotlight
              </button>
            </div>

            {/* Solid | Gradient Segmented Bar */}
            <div className="grid grid-cols-2 bg-[#16171A] p-0.5 rounded-lg border border-white/[0.08]">
              <button
                type="button"
                onClick={() => onUpdateStyle({ useGradient: false })}
                className={`py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  !styleConfig.useGradient
                    ? 'bg-[#26272B] text-white shadow-sm'
                    : 'text-[#8E9192] hover:text-white'
                }`}
              >
                Solid
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateStyle({
                    useGradient: true,
                    gradientStops: emphasisStops,
                  })
                }
                className={`py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  styleConfig.useGradient
                    ? 'bg-[#26272B] text-white shadow-sm'
                    : 'text-[#8E9192] hover:text-white'
                }`}
              >
                Gradient
              </button>
            </div>

            {/* Solid Word Color vs Multi-Stop Gradient Editor */}
            {!styleConfig.useGradient ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[#9FA1A6]">Word</span>
                <label className="flex items-center justify-between bg-[#18191C] border border-white/[0.08] rounded-lg px-3 py-1.5 w-44 cursor-pointer">
                  <span className="text-xs font-mono text-white uppercase">
                    {styleConfig.highlightColor || '#20B038'}
                  </span>
                  <input
                    type="color"
                    value={styleConfig.highlightColor || '#20B038'}
                    onChange={(e) =>
                      onUpdateStyle({
                        highlightColor: e.target.value,
                        gradientEnd: e.target.value,
                      })
                    }
                    className="w-5 h-5 rounded border border-white/20 cursor-pointer bg-transparent"
                  />
                </label>
              </div>
            ) : (
              <MultiStopGradientEditor
                stops={emphasisStops}
                angle={styleConfig.gradientAngle ?? 0}
                level={styleConfig.gradientLevel || 'word'}
                onChangeStops={(nextStops) => {
                  const first = nextStops[0]?.color || '#FFFFFF';
                  const last =
                    nextStops[nextStops.length - 1]?.color || '#20B038';
                  const mid =
                    nextStops[Math.floor(nextStops.length / 2)]?.color || last;
                  onUpdateStyle({
                    useGradient: true,
                    gradientStops: nextStops,
                    gradientStart: first,
                    gradientMid: mid,
                    gradientEnd: last,
                    highlightColor: last,
                  });
                }}
                onChangeAngle={(nextAngle) =>
                  onUpdateStyle({ gradientAngle: nextAngle })
                }
                onChangeLevel={(nextLevel) =>
                  onUpdateStyle({ gradientLevel: nextLevel })
                }
              />
            )}

            {/* Emphasis Size (Multiplier x) */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[#9FA1A6] shrink-0">Size</span>
              <div className="flex items-center gap-2.5 w-48">
                <input
                  type="range"
                  min={0.8}
                  max={2.5}
                  step={0.1}
                  value={styleConfig.bigWordScale || 1.1}
                  onChange={(e) =>
                    onUpdateStyle({
                      bigWordScale: parseFloat(e.target.value) || 1.1,
                    })
                  }
                  className="flex-1 accent-[#20B038] cursor-pointer"
                />
                <div className="flex items-center bg-[#18191C] border border-white/[0.08] rounded-lg px-2 py-1 shrink-0">
                  <input
                    type="number"
                    min={0.8}
                    max={2.5}
                    step={0.1}
                    value={Number(
                      (styleConfig.bigWordScale || 1.1).toFixed(1)
                    )}
                    onChange={(e) =>
                      onUpdateStyle({
                        bigWordScale: parseFloat(e.target.value) || 1.1,
                      })
                    }
                    className="w-8 bg-transparent text-right text-xs font-mono text-white focus:outline-none"
                  />
                  <span className="text-[11px] text-[#8E9192] ml-1">x</span>
                </div>
              </div>
            </div>

            {/* Glow Color Row with Reset Icon (Screenshots 2, 3, 4) */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[#9FA1A6]">Glow Color</span>
              <div className="flex items-center gap-1.5 w-48">
                <label className="flex-1 flex items-center justify-between bg-[#18191C] border border-white/[0.08] rounded-lg px-2.5 py-1.5 cursor-pointer">
                  <span className="text-xs font-mono text-white uppercase">
                    {styleConfig.emphasisGlowColor ||
                      styleConfig.highlightColor ||
                      '#20B038'}
                  </span>
                  <input
                    type="color"
                    value={
                      styleConfig.emphasisGlowColor ||
                      styleConfig.highlightColor ||
                      '#20B038'
                    }
                    onChange={(e) =>
                      onUpdateStyle({
                        emphasisGlowColor: e.target.value,
                        emphasisGlowEnabled: true,
                      })
                    }
                    className="w-5 h-5 rounded border border-white/20 cursor-pointer bg-transparent"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStyle({
                      emphasisGlowColor: '#20B038',
                      emphasisGlowEnabled: false,
                    })
                  }
                  title="Reset Emphasis Glow"
                  className="p-1.5 rounded-lg bg-[#18191C] border border-white/[0.08] text-[#8E9192] hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Emphasis Font Family */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[#9FA1A6] shrink-0">
                Font Family
              </span>
              <div className="relative w-48">
                <select
                  value={styleConfig.heroWordFontFamily || 'Default'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Default') {
                      onUpdateStyle({
                        heroWordFontFamily: styleConfig.fontFamily,
                      });
                    } else {
                      ensureGoogleFontLoaded(val);
                      onUpdateStyle({ heroWordFontFamily: val });
                    }
                  }}
                  className="w-full bg-[#18191C] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white appearance-none focus:outline-none focus:border-[#20B038] cursor-pointer pr-7 truncate"
                >
                  <option value="Default">Default</option>
                  {customFonts.map((cf) => (
                    <option key={cf} value={cf}>
                      ★ {cf}
                    </option>
                  ))}
                  {KALAKAR_GOOGLE_FONTS.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#8E9192] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Emphasis Font Face */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[#9FA1A6] shrink-0">Font Face</span>
              <div className="relative w-48">
                <select
                  value={styleConfig.emphasisFontFace || 'Bold (700)'}
                  onChange={(e) =>
                    onUpdateStyle({ emphasisFontFace: e.target.value })
                  }
                  className="w-full bg-[#18191C] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white appearance-none focus:outline-none focus:border-[#20B038] cursor-pointer pr-7"
                >
                  {KALAKAR_FONT_FACES.map((ff) => (
                    <option key={ff.label} value={ff.label}>
                      {ff.label.replace(/\s*\(\d+\)/, '')}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#8E9192] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Emphasis Format Bar (Tt | T | t | U) */}
            <div className="grid grid-cols-4 bg-[#16171A] p-0.5 rounded-lg border border-white/[0.08]">
              {(
                [
                  { id: 'capitalize', label: 'Tt', title: 'Title Case' },
                  { id: 'uppercase', label: 'T', title: 'UPPERCASE' },
                  { id: 'lowercase', label: 't', title: 'lowercase' },
                ] as const
              ).map((st) => {
                const active =
                  (styleConfig.emphasisTextTransform || 'none') === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() =>
                      onUpdateStyle({
                        emphasisTextTransform: active ? 'none' : st.id,
                      })
                    }
                    title={st.title}
                    className={`py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#26272B] text-white shadow-sm'
                        : 'text-[#8E9192] hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  onUpdateStyle({
                    emphasisUnderline: !styleConfig.emphasisUnderline,
                  })
                }
                title="Underline Emphasized Words"
                className={`py-1.5 rounded-md text-xs font-semibold underline cursor-pointer transition-colors ${
                  styleConfig.emphasisUnderline
                    ? 'bg-[#26272B] text-white shadow-sm'
                    : 'text-[#8E9192] hover:text-white'
                }`}
              >
                U
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. SPACING COLLAPSIBLE SECTION (Screenshots 3, 4, 5) */}
      <div className="border-b border-white/[0.07] pb-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={() => toggleSection('spacing')}
            className="flex items-center gap-1.5 text-left cursor-pointer group"
          >
            {openSections.spacing ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#8E9192] group-hover:text-white" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#8E9192] group-hover:text-white" />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9FA1A6] group-hover:text-white">
              SPACING
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateStyle({
                letterSpacingPx: 0,
                lineHeightMultiplier: 1,
              })
            }
            className="text-[11px] text-[#8E9192] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {openSections.spacing && (
          <div className="grid grid-cols-2 gap-3">
            {/* Letter Spacing */}
            <div className="space-y-1.5">
              <span className="text-xs text-[#9FA1A6] block">Letter</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={-4}
                  max={20}
                  step={1}
                  value={styleConfig.letterSpacingPx ?? 0}
                  onChange={(e) =>
                    onUpdateStyle({
                      letterSpacingPx: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="flex-1 accent-[#20B038] cursor-pointer min-w-0"
                />
                <div className="flex items-center bg-[#18191C] border border-white/[0.08] rounded-lg px-2 py-1 shrink-0">
                  <input
                    type="number"
                    min={-4}
                    max={20}
                    value={styleConfig.letterSpacingPx ?? 0}
                    onChange={(e) =>
                      onUpdateStyle({
                        letterSpacingPx: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-6 bg-transparent text-right text-xs font-mono text-white focus:outline-none"
                  />
                  <span className="text-[11px] text-[#8E9192] ml-0.5">px</span>
                </div>
              </div>
            </div>

            {/* Line Spacing */}
            <div className="space-y-1.5">
              <span className="text-xs text-[#9FA1A6] block">Line</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.7}
                  max={2.2}
                  step={0.1}
                  value={styleConfig.lineHeightMultiplier ?? 1}
                  onChange={(e) =>
                    onUpdateStyle({
                      lineHeightMultiplier: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="flex-1 accent-[#20B038] cursor-pointer min-w-0"
                />
                <div className="flex items-center bg-[#18191C] border border-white/[0.08] rounded-lg px-2 py-1 shrink-0">
                  <input
                    type="number"
                    min={0.7}
                    max={2.2}
                    step={0.1}
                    value={Number(
                      (styleConfig.lineHeightMultiplier ?? 1).toFixed(1)
                    )}
                    onChange={(e) =>
                      onUpdateStyle({
                        lineHeightMultiplier: parseFloat(e.target.value) || 1,
                      })
                    }
                    className="w-7 bg-transparent text-right text-xs font-mono text-white focus:outline-none"
                  />
                  <span className="text-[11px] text-[#8E9192] ml-0.5">x</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. EFFECTS COLLAPSIBLE SECTION (Screenshots 4 & 5) */}
      <div className="pb-2">
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={() => toggleSection('effects')}
            className="flex items-center gap-1.5 text-left cursor-pointer group"
          >
            {openSections.effects ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#8E9192] group-hover:text-white" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#8E9192] group-hover:text-white" />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9FA1A6] group-hover:text-white">
              EFFECTS
            </span>
          </button>
        </div>

        {openSections.effects && (
          <div className="space-y-2.5">
            {/* Drop Shadow */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-0.5">
                <span className="text-xs text-[#9FA1A6]">Drop Shadow</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(styleConfig.dropShadowEnabled)}
                  onClick={() =>
                    onUpdateStyle({
                      dropShadowEnabled: !styleConfig.dropShadowEnabled,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                    styleConfig.dropShadowEnabled
                      ? 'bg-[#20B038]'
                      : 'bg-[#26272B]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      styleConfig.dropShadowEnabled
                        ? 'translate-x-4'
                        : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {styleConfig.dropShadowEnabled && (
                <div className="grid grid-cols-4 gap-1.5 p-2 rounded-lg bg-[#16171A] border border-white/[0.06] text-[10px]">
                  <div>
                    <span className="text-[#8E9192] block">Color</span>
                    <input
                      type="color"
                      value={styleConfig.dropShadowColor || '#000000'}
                      onChange={(e) =>
                        onUpdateStyle({ dropShadowColor: e.target.value })
                      }
                      className="w-full h-6 rounded bg-transparent cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[#8E9192] block">X px</span>
                    <input
                      type="number"
                      value={styleConfig.dropShadowX ?? 0}
                      onChange={(e) =>
                        onUpdateStyle({
                          dropShadowX: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full bg-[#111215] text-white px-1.5 py-1 rounded text-center border border-white/[0.06]"
                    />
                  </div>
                  <div>
                    <span className="text-[#8E9192] block">Y px</span>
                    <input
                      type="number"
                      value={styleConfig.dropShadowY ?? 6}
                      onChange={(e) =>
                        onUpdateStyle({
                          dropShadowY: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full bg-[#111215] text-white px-1.5 py-1 rounded text-center border border-white/[0.06]"
                    />
                  </div>
                  <div>
                    <span className="text-[#8E9192] block">Blur</span>
                    <input
                      type="number"
                      value={styleConfig.shadowBlur ?? 22}
                      onChange={(e) =>
                        onUpdateStyle({
                          shadowBlur: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full bg-[#111215] text-white px-1.5 py-1 rounded text-center border border-white/[0.06]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Glow */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-0.5">
                <span className="text-xs text-[#9FA1A6]">Glow</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(styleConfig.glowEnabled)}
                  onClick={() =>
                    onUpdateStyle({ glowEnabled: !styleConfig.glowEnabled })
                  }
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                    styleConfig.glowEnabled ? 'bg-[#20B038]' : 'bg-[#26272B]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      styleConfig.glowEnabled
                        ? 'translate-x-4'
                        : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {styleConfig.glowEnabled && (
                <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-[#16171A] border border-white/[0.06] text-[10px]">
                  <div>
                    <span className="text-[#8E9192] block">Color</span>
                    <input
                      type="color"
                      value={
                        styleConfig.glowColor ||
                        styleConfig.highlightColor ||
                        '#20B038'
                      }
                      onChange={(e) =>
                        onUpdateStyle({ glowColor: e.target.value })
                      }
                      className="w-full h-6 rounded bg-transparent cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[#8E9192] block">Spread</span>
                    <input
                      type="number"
                      min={2}
                      max={60}
                      value={styleConfig.glowSpread ?? 24}
                      onChange={(e) =>
                        onUpdateStyle({
                          glowSpread: parseInt(e.target.value, 10) || 24,
                        })
                      }
                      className="w-full bg-[#111215] text-white px-1.5 py-1 rounded text-center border border-white/[0.06]"
                    />
                  </div>
                  <div>
                    <span className="text-[#8E9192] block">Intensity %</span>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={styleConfig.glowIntensity ?? 80}
                      onChange={(e) =>
                        onUpdateStyle({
                          glowIntensity: parseInt(e.target.value, 10) || 80,
                        })
                      }
                      className="w-full bg-[#111215] text-white px-1.5 py-1 rounded text-center border border-white/[0.06]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3D Depth */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-0.5">
                <span className="text-xs text-[#9FA1A6]">3D Depth</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(styleConfig.depth3DEnabled)}
                  onClick={() =>
                    onUpdateStyle({
                      depth3DEnabled: !styleConfig.depth3DEnabled,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                    styleConfig.depth3DEnabled ? 'bg-[#20B038]' : 'bg-[#26272B]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      styleConfig.depth3DEnabled
                        ? 'translate-x-4'
                        : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {styleConfig.depth3DEnabled && (
                <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-[#16171A] border border-white/[0.06] text-[10px]">
                  <div>
                    <span className="text-[#8E9192] block">Color</span>
                    <input
                      type="color"
                      value={styleConfig.depth3DColor || '#20B038'}
                      onChange={(e) =>
                        onUpdateStyle({ depth3DColor: e.target.value })
                      }
                      className="w-full h-6 rounded bg-transparent cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[#8E9192] block">Depth px</span>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={styleConfig.depth3DDepth ?? 8}
                      onChange={(e) =>
                        onUpdateStyle({
                          depth3DDepth: parseInt(e.target.value, 10) || 8,
                        })
                      }
                      className="w-full bg-[#111215] text-white px-1.5 py-1 rounded text-center border border-white/[0.06]"
                    />
                  </div>
                  <div>
                    <span className="text-[#8E9192] block">Angle °</span>
                    <input
                      type="number"
                      min={0}
                      max={360}
                      value={styleConfig.depth3DAngle ?? 135}
                      onChange={(e) =>
                        onUpdateStyle({
                          depth3DAngle: parseInt(e.target.value, 10) || 135,
                        })
                      }
                      className="w-full bg-[#111215] text-white px-1.5 py-1 rounded text-center border border-white/[0.06]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Arc / Text Curve (-360° to +360°: 180° Half Circle, 360° Full Circle, Reversed) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-0.5">
                <span className="text-xs text-[#9FA1A6]">
                  Arc / Text Curve (⌒)
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(styleConfig.arcEnabled)}
                  onClick={() =>
                    onUpdateStyle({
                      arcEnabled: !styleConfig.arcEnabled,
                      arcCurveDeg: !styleConfig.arcEnabled
                        ? styleConfig.arcCurveDeg || 180
                        : 0,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                    styleConfig.arcEnabled ? 'bg-[#20B038]' : 'bg-[#26272B]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      styleConfig.arcEnabled
                        ? 'translate-x-4'
                        : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {styleConfig.arcEnabled && (
                <div className="space-y-2.5 p-2.5 rounded-lg bg-[#16171A] border border-white/[0.06] text-[10px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#8E9192] font-semibold">
                      Direction:{' '}
                      <span className="text-white">
                        {(styleConfig.arcCurveDeg ?? 180) >= 0
                          ? 'Upward Arch'
                          : 'Reversed Valley'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = styleConfig.arcCurveDeg || 180;
                        const flipped = -cur;
                        onUpdateStyle({
                          arcCurveDeg: flipped,
                          arcShape: flipped < 0 ? 'valley' : 'arch',
                        });
                      }}
                      className="px-2 py-1 rounded bg-[#20B038]/15 hover:bg-[#20B038] text-[#34D399] hover:text-white font-bold border border-[#20B038]/40 transition-colors cursor-pointer"
                    >
                      ⇄ Reverse Curve
                    </button>
                  </div>

                  {/* Quick Angle Presets (45°, 90°, 180°, 360° & Reversed -180°, -360°) */}
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { deg: 45, label: '+45° Arch', shape: 'arch' },
                        { deg: 180, label: '180° Arch', shape: 'arch' },
                        { deg: 360, label: '360° Circle', shape: 'globe' },
                        { deg: -45, label: '-45° Rev', shape: 'valley' },
                        { deg: -180, label: '-180° Rev', shape: 'valley' },
                        { deg: -360, label: '-360° Rev', shape: 'sphere' },
                      ] as const
                    ).map((preset) => (
                      <button
                        key={`global-arc-${preset.deg}`}
                        type="button"
                        onClick={() =>
                          onUpdateStyle({
                            arcEnabled: true,
                            arcShape: preset.shape,
                            arcCurveDeg: preset.deg,
                          })
                        }
                        className={`py-1.5 rounded font-bold cursor-pointer transition-colors border ${
                          (styleConfig.arcCurveDeg ?? 180) === preset.deg
                            ? 'bg-[#20B038] text-white border-[#20B038]'
                            : 'bg-[#111215] text-[#8E9192] border-white/[0.06] hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Continuous How Much Curve Slider (-360° to +360°) */}
                  <div className="flex items-center gap-2">
                    <span className="text-[#8E9192] shrink-0">Curve °:</span>
                    <input
                      type="range"
                      min={-360}
                      max={360}
                      step={5}
                      value={styleConfig.arcCurveDeg ?? 180}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        onUpdateStyle({
                          arcEnabled: val !== 0,
                          arcCurveDeg: val,
                        });
                      }}
                      className="flex-1 accent-[#20B038] cursor-pointer"
                    />
                    <div className="flex items-center bg-[#111215] border border-white/[0.08] rounded px-1.5 py-0.5 shrink-0">
                      <input
                        type="number"
                        min={-360}
                        max={360}
                        step={5}
                        value={styleConfig.arcCurveDeg ?? 180}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value, 10);
                          const clamped = Number.isNaN(raw)
                            ? 0
                            : Math.max(-360, Math.min(360, raw));
                          onUpdateStyle({
                            arcEnabled: clamped !== 0,
                            arcCurveDeg: clamped,
                          });
                        }}
                        className="w-10 bg-transparent text-right font-mono text-white focus:outline-none"
                      />
                      <span className="text-[#8E9192] ml-0.5">°</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Background */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-0.5">
                <span className="text-xs text-[#9FA1A6]">Background</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={
                    styleConfig.backgroundEnabled !== false &&
                    (styleConfig.backgroundOpacity ?? 0) > 0.05
                  }
                  onClick={() => {
                    const isCurrentlyOn =
                      styleConfig.backgroundEnabled !== false &&
                      (styleConfig.backgroundOpacity ?? 0) > 0.05;
                    onUpdateStyle({
                      backgroundEnabled: !isCurrentlyOn,
                      backgroundOpacity: !isCurrentlyOn ? 0.94 : 0,
                    });
                  }}
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                    styleConfig.backgroundEnabled !== false &&
                    (styleConfig.backgroundOpacity ?? 0) > 0.05
                      ? 'bg-[#20B038]'
                      : 'bg-[#26272B]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      styleConfig.backgroundEnabled !== false &&
                      (styleConfig.backgroundOpacity ?? 0) > 0.05
                        ? 'translate-x-4'
                        : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {styleConfig.backgroundEnabled !== false &&
                (styleConfig.backgroundOpacity ?? 0) > 0.05 && (
                  <div className="p-2 rounded-lg bg-[#16171A] border border-white/[0.06] space-y-2 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E9192]">Card Color</span>
                      <input
                        type="color"
                        value={styleConfig.backgroundColor || '#FAF6E8'}
                        onChange={(e) =>
                          onUpdateStyle({
                            backgroundColor: e.target.value,
                            backgroundEnabled: true,
                          })
                        }
                        className="w-6 h-5 rounded bg-transparent cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#8E9192]">Opacity</span>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={Math.round(
                          (styleConfig.backgroundOpacity ?? 0.94) * 100
                        )}
                        onChange={(e) =>
                          onUpdateStyle({
                            backgroundOpacity:
                              parseInt(e.target.value, 10) / 100,
                            backgroundEnabled: true,
                          })
                        }
                        className="flex-1 accent-[#20B038] cursor-pointer"
                      />
                      <span className="font-mono text-white">
                        {Math.round(
                          (styleConfig.backgroundOpacity ?? 0.94) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface KalakarTransitionsTabProps {
  styleConfig: CaptionStyleConfig;
  emphasizedWordCount: number;
  selectedLineLabel?: string;
  onClearLineSelection?: () => void;
  onUpdateStyle: (partial: Partial<CaptionStyleConfig>) => void;
  onPreviewTransition: () => void;
}

export const KalakarTransitionsTab: React.FC<KalakarTransitionsTabProps> = ({
  styleConfig,
  selectedLineLabel = 'Line 51',
  onClearLineSelection,
  onUpdateStyle,
  onPreviewTransition,
}) => {
  const scope = styleConfig.transitionScope || 'all';
  const [activePhase, setActivePhase] = useState<'in' | 'hold' | 'out'>('in');
  const [transitionSearch, setTransitionSearch] = useState<string>('');

  const curIn = styleConfig.transitionIn || 'Slide Up';
  const curHold = styleConfig.transitionHold || 'None';
  const curOut = styleConfig.transitionOut || 'None';

  const currentPhaseOptions =
    activePhase === 'hold' ? TRANSITION_HOLD_OPTIONS : TRANSITION_IN_OUT_OPTIONS;
  const filteredPhaseOptions = currentPhaseOptions.filter((opt) =>
    opt.toLowerCase().includes(transitionSearch.trim().toLowerCase())
  );
  const currentPhaseSelected =
    activePhase === 'in' ? curIn : activePhase === 'hold' ? curHold : curOut;

  const handleSelectPhaseOption = (opt: string) => {
    if (activePhase === 'in') {
      const mapAnim =
        opt === 'Pop' || opt === 'Zoom' || opt === 'Scale'
          ? 'pop'
          : opt === 'Fade'
          ? 'cinema-fade'
          : opt === 'Punch'
          ? 'stomp'
          : opt === 'Flicker'
          ? 'neon-glow'
          : opt === 'Wobble'
          ? 'wave'
          : styleConfig.animationType;
      onUpdateStyle({
        transitionIn: opt,
        animationType: mapAnim,
      });
    } else if (activePhase === 'hold') {
      onUpdateStyle({ transitionHold: opt });
    } else {
      onUpdateStyle({ transitionOut: opt });
    }
    if (Boolean(styleConfig.autoSfxEnabled) && opt !== 'None') {
      playOpenSourceSoundEffect('whoosh', styleConfig.sfxVolume ?? 0.45);
    }
  };

  return (
    <div className="space-y-3.5 text-xs">
      {/* Section Title & Subtitle (Exact match to Image 1) */}
      <div>
        <h3 className="text-sm font-bold text-white leading-tight">
          Transitions
        </h3>
        <p className="text-[11px] text-[#8E9192] mt-0.5">
          Animate how captions enter, stay, and exit
        </p>
      </div>

      {/* Row 1: All captions | Emphasized words (Exact match to Image 1) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onUpdateStyle({ transitionScope: 'all' })}
          className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
            scope === 'all'
              ? 'bg-[#163326] text-[#34D399] border-[#24B47E]/60 font-semibold'
              : 'bg-[#18181F] text-zinc-400 border-white/[0.06] hover:text-zinc-200'
          }`}
        >
          All captions
        </button>
        <button
          type="button"
          onClick={() => onUpdateStyle({ transitionScope: 'emphasized' })}
          className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
            scope === 'emphasized'
              ? 'bg-[#163326] text-[#34D399] border-[#24B47E]/60 font-semibold'
              : 'bg-[#18181F] text-zinc-400 border-white/[0.06] hover:text-zinc-200'
          }`}
        >
          Emphasized words
        </button>
      </div>

      {/* Row 2: Selected Line Badge ("Line 51") & "x Clear selection" */}
      <div className="flex items-center justify-between pt-0.5">
        <span className="px-2.5 py-1 rounded-md bg-[#1D1D23] border border-white/10 text-white text-xs font-semibold">
          {selectedLineLabel}
        </span>
        <button
          type="button"
          onClick={() => {
            onUpdateStyle({
              transitionIn: 'None',
              transitionHold: 'None',
              transitionOut: 'None',
            });
            onClearLineSelection?.();
          }}
          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
        >
          <span>×</span>
          <span>Clear selection</span>
        </button>
      </div>

      {/* Row 3: 3-Stage Selector Cards (IN / HOLD / OUT) — Exact match to Image 1 */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#16161B] p-1 rounded-xl border border-white/[0.06]">
        {/* Stage 1: IN */}
        <button
          type="button"
          onClick={() => setActivePhase('in')}
          className={`relative py-2.5 px-2 rounded-lg text-center transition-all cursor-pointer border ${
            activePhase === 'in'
              ? 'bg-[#152E23] border-[#24B47E]/60 text-[#34D399]'
              : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {curIn !== 'None' && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStyle({ transitionIn: 'None' });
              }}
              title="Clear IN transition"
              className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#24B47E]/30 hover:bg-[#24B47E] text-[#34D399] hover:text-white text-[9px] flex items-center justify-center"
            >
              ×
            </span>
          )}
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            ↱ IN
          </div>
          <div className="text-[11px] font-semibold mt-0.5 truncate">{curIn}</div>
        </button>

        {/* Stage 2: HOLD */}
        <button
          type="button"
          onClick={() => setActivePhase('hold')}
          className={`relative py-2.5 px-2 rounded-lg text-center transition-all cursor-pointer border ${
            activePhase === 'hold'
              ? 'bg-[#152E23] border-[#24B47E]/60 text-[#34D399]'
              : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            — HOLD
          </div>
          <div className="text-[11px] font-semibold mt-0.5 truncate">{curHold}</div>
        </button>

        {/* Stage 3: OUT */}
        <button
          type="button"
          onClick={() => setActivePhase('out')}
          className={`relative py-2.5 px-2 rounded-lg text-center transition-all cursor-pointer border ${
            activePhase === 'out'
              ? 'bg-[#152E23] border-[#24B47E]/60 text-[#34D399]'
              : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            ↳ OUT
          </div>
          <div className="text-[11px] font-semibold mt-0.5 truncate">{curOut}</div>
        </button>
      </div>

      {/* Row 4: Section Header ("In" / "Hold" / "Out") + "▷ Preview" */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        <span className="text-sm font-bold text-white capitalize">{activePhase}</span>
        <button
          type="button"
          onClick={() => {
            if (Boolean(styleConfig.autoSfxEnabled)) {
              playOpenSourceSoundEffect('whoosh', styleConfig.sfxVolume ?? 0.45);
            }
            onPreviewTransition();
          }}
          className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="w-3 h-3" />
          <span>Preview</span>
        </button>
      </div>

      {/* Row 4.5: Search transitions bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={transitionSearch}
          onChange={(e) => setTransitionSearch(e.target.value)}
          placeholder="Search transitions..."
          className="w-full bg-[#17171C] text-white placeholder-zinc-500 text-xs pl-8 pr-3 py-2 rounded-xl border border-white/[0.07] focus:outline-none focus:border-[#24B47E]"
        />
      </div>

      {/* Row 5: 3-Column Grid of "Aa" Transition Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {filteredPhaseOptions.map((opt) => {
          const isSelected = currentPhaseSelected === opt;
          return (
            <button
              key={`${activePhase}-${opt}`}
              type="button"
              onClick={() => handleSelectPhaseOption(opt)}
              className={`py-3.5 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#14291F] border-[#24B47E] text-white shadow-sm ring-1 ring-[#24B47E]/40'
                  : 'bg-[#17171C] hover:bg-[#1E1E25] border-white/[0.06] text-zinc-300 hover:border-white/15'
              }`}
            >
              <span className="text-sm font-bold text-white tracking-tight">Aa</span>
              <span
                className={`text-[11px] truncate max-w-full ${
                  isSelected ? 'text-white font-medium' : 'text-zinc-400'
                }`}
              >
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Goldox Section 3.4: Bounce (Less / More) and Dynamic Speed */}
      <div className="p-3 rounded-xl bg-[#16161C] border border-white/[0.07] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-white">
            Bounce &amp; Dynamic Speed
          </span>
          <span className="text-[10px] font-mono text-[#34D399]">
            {(styleConfig.animationSpeed || 1).toFixed(1)}x
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-zinc-400 block mb-1">
              Bounce Physics
            </span>
            <div className="grid grid-cols-2 gap-1 bg-[#111116] p-0.5 rounded-lg border border-white/[0.06]">
              <button
                type="button"
                onClick={() => onUpdateStyle({ animationSpeed: 0.85 })}
                className={`py-1 rounded text-[10px] font-bold cursor-pointer ${
                  (styleConfig.animationSpeed || 1) <= 1
                    ? 'bg-[#24B47E] text-[#050505]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Less Bounce
              </button>
              <button
                type="button"
                onClick={() => onUpdateStyle({ animationSpeed: 1.45 })}
                className={`py-1 rounded text-[10px] font-bold cursor-pointer ${
                  (styleConfig.animationSpeed || 1) > 1
                    ? 'bg-[#24B47E] text-[#050505]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                More Bounce
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 block mb-1">
              Speed Timing
            </span>
            <div className="grid grid-cols-2 gap-1 bg-[#111116] p-0.5 rounded-lg border border-white/[0.06]">
              <button
                type="button"
                onClick={() => onUpdateStyle({ animationSpeed: 1.15 })}
                className={`py-1 rounded text-[10px] font-bold cursor-pointer ${
                  styleConfig.animationSpeed !== 1.0
                    ? 'bg-[#163326] text-[#34D399] border border-[#24B47E]/50'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Dynamic
              </button>
              <button
                type="button"
                onClick={() => onUpdateStyle({ animationSpeed: 1.0 })}
                className={`py-1 rounded text-[10px] font-bold cursor-pointer ${
                  styleConfig.animationSpeed === 1.0
                    ? 'bg-[#163326] text-[#34D399] border border-[#24B47E]/50'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                1.0x Fixed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface KalakarAiAudioTabProps {
  audioEnhancer: AudioEnhancerConfig;
  audioCleansRemaining: number;
  styleConfig?: CaptionStyleConfig;
  onUpdateStyle?: (partial: Partial<CaptionStyleConfig>) => void;
  onUpdateAudioEnhancer: (partial: Partial<AudioEnhancerConfig>) => void;
  onExportEnhancedWAV: () => void;
}

export const KalakarAiAudioTab: React.FC<KalakarAiAudioTabProps> = ({
  audioEnhancer,
  audioCleansRemaining,
  styleConfig,
  onUpdateStyle,
  onUpdateAudioEnhancer,
  onExportEnhancedWAV,
}) => {
  const autoSfxOn = Boolean(styleConfig?.autoSfxEnabled);
  const usedCount = Math.max(0, 3 - Math.min(3, audioCleansRemaining));

  return (
    <div className="space-y-5 text-xs text-[#E5E1E4]">
      {/* Header Section (Exact match to Stitch Editor - AI Audio Enhancement) */}
      <div className="text-center space-y-2 pt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#24B47E]/10 border border-[#24B47E]/20 text-[#24B47E] text-[10px] font-bold uppercase tracking-widest mb-1">
          <span
            className="material-symbols-outlined text-xs"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          AI-Powered
        </div>
        <h2 className="text-base font-bold text-[#E5E1E4]">
          Audio Enhancement
        </h2>
        <p className="text-xs text-[#8E9192] leading-relaxed px-2">
          Clean background noise and enhance vocal clarity in one click.
        </p>
        <p className="text-[10px] text-[#8E9192]/70 italic">
          *Note: Each video counts as one full usage of AI Audio Cleaning.*
        </p>
      </div>

      {/* Controls Stack (Exact match to Stitch HTML) */}
      <div className="space-y-3">
        {/* Card 1: AI Audio Cleaning Toggle */}
        <div className="p-4 rounded-xl bg-[#1C1B1E] border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#24B47E]/10 border border-[#24B47E]/20 flex items-center justify-center text-[#24B47E]">
              <span className="material-symbols-outlined text-lg">
                graphic_eq
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#E5E1E4]">
                AI Audio Cleaning
              </h4>
              <span className="text-[10px] text-[#24B47E] font-medium">
                {audioEnhancer.enabled ? 'Active' : 'Ready'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onUpdateAudioEnhancer({ enabled: !audioEnhancer.enabled })
            }
            className={`w-10 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer ${
              audioEnhancer.enabled ? 'bg-[#24B47E]' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#050505] shadow-sm transition-transform ${
                audioEnhancer.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Live A/B Audition Toggle */}
        <div className="p-2.5 rounded-xl bg-[#1C1B1E] border border-white/[0.06] flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-[#8E9192]">
            Live A/B Audition
          </span>
          <div className="inline-flex items-center bg-[#131315] p-0.5 rounded-lg border border-white/[0.06]">
            <button
              type="button"
              onClick={() => onUpdateAudioEnhancer({ enabled: false })}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                !audioEnhancer.enabled
                  ? 'bg-[#2A2A2D] text-[#E5E1E4]'
                  : 'text-[#8E9192] hover:text-white'
              }`}
            >
              A · Raw
            </button>
            <button
              type="button"
              onClick={() => onUpdateAudioEnhancer({ enabled: true })}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                audioEnhancer.enabled
                  ? 'bg-[#24B47E] text-[#050505]'
                  : 'text-[#8E9192] hover:text-white'
              }`}
            >
              B · Cleaned
            </button>
          </div>
        </div>

        {/* Card 2: Enhanced Audio Status Card (Exact match to Stitch HTML) */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-[#1C1B1E] to-[#131315] border border-[#24B47E]/30 shadow-[0_0_25px_rgba(36,180,126,0.08)] relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#24B47E]/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#24B47E] animate-pulse" />
                <h4 className="text-xs font-bold text-[#E5E1E4]">
                  Enhanced Audio
                </h4>
              </div>
              <p className="text-[11px] text-[#8E9192]">
                Noise removal and voice enhancement applied
              </p>
            </div>
            {/* Equalizer Bars */}
            <div className="flex items-end gap-0.5 h-4 pt-1">
              <div className="w-0.5 h-2 bg-[#24B47E] rounded-full animate-pulse" />
              <div className="w-0.5 h-3.5 bg-[#24B47E] rounded-full animate-pulse" />
              <div className="w-0.5 h-1.5 bg-[#24B47E] rounded-full animate-pulse" />
              <div className="w-0.5 h-4 bg-[#24B47E] rounded-full animate-pulse" />
              <div className="w-0.5 h-2.5 bg-[#24B47E] rounded-full animate-pulse" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-[#8E9192]">
            <span>Clarity Boost: +85%</span>
            <span>Noise Floor: -42dB</span>
          </div>

          <button
            type="button"
            onClick={onExportEnhancedWAV}
            className="mt-3 w-full py-2 rounded-lg bg-[#24B47E] hover:bg-[#199A68] text-[#050505] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Download Enhanced Audio (.WAV)</span>
          </button>
        </div>

        {/* Remaining Credits Card (Exact match to Stitch HTML) */}
        <div className="p-4 rounded-xl bg-[#0B0B0D] border border-white/[0.04] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8E9192] font-medium">
              Remaining Credits
            </span>
            <span className="font-mono font-bold text-[#E5E1E4]">
              {usedCount} / 3 Free Videos
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#1C1B1E] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#24B47E] to-[#4CE0B3] rounded-full"
              style={{ width: `${Math.min(100, Math.round((usedCount / 3) * 100)) || 66}%` }}
            />
          </div>
          <p className="text-[10px] text-[#8E9192] text-center pt-1">
            Need more?{' '}
            <span className="text-[#24B47E] hover:underline font-medium cursor-pointer">
              Upgrade for unlimited audio cleaning
            </span>
          </p>
        </div>

        {/* Open-Source Auto Sound Effects (SFX) */}
        <div className="p-3.5 rounded-xl bg-[#1C1B1E] border border-white/[0.06] space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#E5E1E4]">
                Auto Sound Effects (SFX)
              </h4>
              <p className="text-[10px] text-[#8E9192]">
                Trigger Whoosh, Bell &amp; Pop sounds on captions
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdateStyle?.({ autoSfxEnabled: !autoSfxOn })}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                autoSfxOn ? 'bg-[#24B47E]' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#050505] transition-transform ${
                  autoSfxOn ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {OPEN_SOURCE_SFX_LIBRARY.map((sfx) => (
              <button
                key={sfx.id}
                type="button"
                onClick={() =>
                  playOpenSourceSoundEffect(
                    sfx.id,
                    styleConfig?.sfxVolume ?? 0.45
                  )
                }
                className="p-2 rounded-lg bg-[#131315] hover:bg-[#252429] border border-white/[0.06] text-left flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <span className="text-[11px] font-medium text-[#E5E1E4] truncate">
                  {sfx.name}
                </span>
                <Volume2 className="w-3 h-3 text-[#24B47E] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface KalakarVideoEditTabProps {
  videoClipEdit: VideoClipEditConfig;
  isMuted: boolean;
  onUpdateVideoClipEdit: (partial: Partial<VideoClipEditConfig>) => void;
  onToggleMute: () => void;
}

export const KalakarVideoEditTab: React.FC<KalakarVideoEditTabProps> = ({
  videoClipEdit,
  isMuted,
  onUpdateVideoClipEdit,
  onToggleMute,
}) => {
  const hasAnyCropOrTransform =
    (videoClipEdit.cropLeft || 0) > 0 ||
    (videoClipEdit.cropRight || 0) > 0 ||
    (videoClipEdit.cropTop || 0) > 0 ||
    (videoClipEdit.cropBottom || 0) > 0 ||
    (videoClipEdit.cropRounded || 0) > 0 ||
    (videoClipEdit.zoomX || 100) !== 100 ||
    (videoClipEdit.zoomY || 100) !== 100 ||
    (videoClipEdit.positionX || 0) !== 0 ||
    (videoClipEdit.positionY || 0) !== 0 ||
    (videoClipEdit.rotation || 0) !== 0 ||
    Boolean(videoClipEdit.flipHorizontal) ||
    Boolean(videoClipEdit.flipVertical);

  return (
    <div className="space-y-5 text-xs text-[#E5E1E4]">
      {hasAnyCropOrTransform && (
        <button
          type="button"
          onClick={() =>
            onUpdateVideoClipEdit({
              ...DEFAULT_VIDEO_CLIP_EDIT,
              volume: videoClipEdit.volume ?? 100,
              muted: videoClipEdit.muted ?? false,
            })
          }
          className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Video Crop &amp; Transform</span>
        </button>
      )}

      {/* 1. TRANSFORM SECTION (Exact Stitch HTML Match) */}
      <div className="space-y-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8E9192] text-sm">
              transform
            </span>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#E5E1E4]">
              Transform
            </h4>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateVideoClipEdit({
                zoomX: 100,
                zoomY: 100,
                zoomLinked: true,
                positionX: 0,
                positionY: 0,
                rotation: 0,
                flipHorizontal: false,
                flipVertical: false,
              })
            }
            className="text-[10px] text-[#8E9192] hover:text-[#E5E1E4] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div className="space-y-3 pl-1">
          {/* Zoom Slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-[#8E9192]">Zoom</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateVideoClipEdit({
                      zoomLinked: !videoClipEdit.zoomLinked,
                    })
                  }
                  className="text-[#24B47E] flex items-center gap-0.5 cursor-pointer"
                >
                  {videoClipEdit.zoomLinked ? (
                    <Link className="w-3 h-3" />
                  ) : (
                    <Unlink className="w-3 h-3" />
                  )}
                </button>
                <span className="font-mono text-[#E5E1E4]">
                  {videoClipEdit.zoomX}%
                </span>
              </div>
            </div>
            <input
              type="range"
              min={50}
              max={250}
              value={videoClipEdit.zoomX}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onUpdateVideoClipEdit(
                  videoClipEdit.zoomLinked
                    ? { zoomX: val, zoomY: val }
                    : { zoomX: val }
                );
              }}
              className="w-full accent-[#24B47E] cursor-pointer"
            />
          </div>

          {/* X / Y Position */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center bg-[#1C1B1E] border border-white/[0.08] rounded-lg px-2.5 py-1.5">
              <span className="text-[10px] text-[#8E9192] mr-auto">X Pos</span>
              <input
                type="number"
                value={videoClipEdit.positionX}
                onChange={(e) =>
                  onUpdateVideoClipEdit({
                    positionX: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-12 bg-transparent text-right text-xs font-mono text-[#E5E1E4] focus:outline-none"
              />
              <span className="text-[10px] text-[#8E9192] ml-1">px</span>
            </div>
            <div className="flex items-center bg-[#1C1B1E] border border-white/[0.08] rounded-lg px-2.5 py-1.5">
              <span className="text-[10px] text-[#8E9192] mr-auto">Y Pos</span>
              <input
                type="number"
                value={videoClipEdit.positionY}
                onChange={(e) =>
                  onUpdateVideoClipEdit({
                    positionY: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-12 bg-transparent text-right text-xs font-mono text-[#E5E1E4] focus:outline-none"
              />
              <span className="text-[10px] text-[#8E9192] ml-1">px</span>
            </div>
          </div>

          {/* Rotation & Flip */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-[#1C1B1E] border border-white/[0.08] rounded-lg px-2.5 py-1.5">
              <span className="text-[10px] text-[#8E9192] mr-auto">
                Rotation
              </span>
              <input
                type="number"
                min={-180}
                max={180}
                value={videoClipEdit.rotation}
                onChange={(e) =>
                  onUpdateVideoClipEdit({
                    rotation: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-10 bg-transparent text-right text-xs font-mono text-[#E5E1E4] focus:outline-none"
              />
              <span className="text-[10px] text-[#8E9192] ml-0.5">°</span>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateVideoClipEdit({
                  flipHorizontal: !videoClipEdit.flipHorizontal,
                })
              }
              title="Flip Horizontal"
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                videoClipEdit.flipHorizontal
                  ? 'bg-[#24B47E]/20 border-[#24B47E] text-[#24B47E]'
                  : 'bg-[#1C1B1E] border-white/[0.08] text-[#8E9192] hover:text-[#E5E1E4]'
              }`}
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateVideoClipEdit({
                  flipVertical: !videoClipEdit.flipVertical,
                })
              }
              title="Flip Vertical"
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                videoClipEdit.flipVertical
                  ? 'bg-[#24B47E]/20 border-[#24B47E] text-[#24B47E]'
                  : 'bg-[#1C1B1E] border-white/[0.08] text-[#8E9192] hover:text-[#E5E1E4]'
              }`}
            >
              <FlipVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. CROP SECTION (Exact Stitch HTML Match) */}
      <div className="space-y-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8E9192] text-sm">
              crop
            </span>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#E5E1E4]">
              Crop
            </h4>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateVideoClipEdit({
                cropLeft: 0,
                cropRight: 0,
                cropTop: 0,
                cropBottom: 0,
                cropSoftness: 0,
                cropRounded: 0,
                zoomX: 100,
                zoomY: 100,
                zoomLinked: true,
                positionX: 0,
                positionY: 0,
                rotation: 0,
              })
            }
            className="text-[10px] text-[#8E9192] hover:text-[#E5E1E4] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div className="space-y-3 pl-1">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { key: 'cropLeft', label: 'Left' },
                { key: 'cropRight', label: 'Right' },
                { key: 'cropTop', label: 'Top' },
                { key: 'cropBottom', label: 'Bottom' },
              ] as const
            ).map((c) => (
              <div
                key={c.key}
                className="flex items-center bg-[#1C1B1E] border border-white/[0.08] rounded-lg px-2.5 py-1.5"
              >
                <span className="text-[10px] text-[#8E9192] mr-auto">
                  {c.label}
                </span>
                <input
                  type="number"
                  min={0}
                  max={45}
                  value={videoClipEdit[c.key]}
                  onChange={(e) =>
                    onUpdateVideoClipEdit({
                      [c.key]: Math.max(
                        0,
                        Math.min(45, parseInt(e.target.value, 10) || 0)
                      ),
                    })
                  }
                  className="w-10 bg-transparent text-right text-xs font-mono text-[#E5E1E4] focus:outline-none"
                />
                <span className="text-[10px] text-[#8E9192] ml-0.5">%</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#8E9192]">Softness</span>
                <span className="font-mono text-[#E5E1E4]">
                  {videoClipEdit.cropSoftness} px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={videoClipEdit.cropSoftness}
                onChange={(e) =>
                  onUpdateVideoClipEdit({
                    cropSoftness: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-[#24B47E] cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#8E9192]">Rounded</span>
                <span className="font-mono text-[#E5E1E4]">
                  {videoClipEdit.cropRounded} px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={80}
                value={videoClipEdit.cropRounded}
                onChange={(e) =>
                  onUpdateVideoClipEdit({
                    cropRounded: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-[#24B47E] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. COMPOSITE & AUDIO VOLUME SECTION (Exact Stitch HTML Match) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8E9192] text-sm">
              layers
            </span>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#E5E1E4]">
              Composite
            </h4>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateVideoClipEdit({
                ...DEFAULT_VIDEO_CLIP_EDIT,
              })
            }
            className="text-[10px] text-[#8E9192] hover:text-[#E5E1E4] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div className="pl-1 space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#8E9192]">Opacity</span>
              <span className="font-mono text-[#E5E1E4]">
                {videoClipEdit.opacity}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={videoClipEdit.opacity}
              onChange={(e) =>
                onUpdateVideoClipEdit({
                  opacity: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-[#24B47E] cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onToggleMute}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                isMuted
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#24B47E]/15 text-[#24B47E] border border-[#24B47E]/30'
              }`}
            >
              {isMuted ? 'Muted' : 'Audio On'}
            </button>
            <div className="flex-1">
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-[#8E9192]">Volume</span>
                <span className="font-mono text-[#E5E1E4]">
                  {isMuted ? 0 : videoClipEdit.volume}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : videoClipEdit.volume}
                onChange={(e) =>
                  onUpdateVideoClipEdit({
                    volume: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-[#24B47E] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LINE_STYLING_FONT_FACE_OPTIONS = [
  'Regular',
  'Medium',
  'SemiBold',
  'Bold',
  'ExtraBold',
  'Black',
  'Italic',
] as const;

export interface KalakarLineStylingPanelProps {
  segment: CaptionSegment;
  lineNumber: number;
  styleConfig: CaptionStyleConfig;
  userPresets?: StylePreset[];
  customFonts?: string[];
  onUpdateLineOverride: (override: LineStyleOverride) => void;
  onUpdateSegmentMeta?: (partial: Partial<CaptionSegment>) => void;
  onUpdateGlobalStyle?: (partial: Partial<CaptionStyleConfig>) => void;
  onApplyGlobalPreset?: (preset: StylePreset) => void;
  onEditText?: () => void;
  onClose?: () => void;
}

export const KalakarLineStylingPanel: React.FC<KalakarLineStylingPanelProps> = ({
  segment,
  lineNumber,
  styleConfig,
  userPresets = [],
  customFonts = [],
  onUpdateLineOverride,
  onUpdateSegmentMeta,
  onUpdateGlobalStyle,
  onClose,
}) => {
  const [isTypographyOpen, setIsTypographyOpen] = useState<boolean>(true);
  const [templateSearch, setTemplateSearch] = useState<string>('');

  const lineOverride: LineStyleOverride = segment.lineStyleOverride || {};

  // Build unified font family list starting with Instrument Sans (as in Screenshot 2), Plus Jakarta Sans, Caveat, and all Google/Custom fonts
  const allFontNames = React.useMemo(() => {
    const base = [
      'Instrument Sans',
      'Plus Jakarta Sans',
      'Caveat',
      ...customFonts,
      ...KALAKAR_GOOGLE_FONTS.map((f) => f.name),
    ];
    return Array.from(new Set(base));
  }, [customFonts]);

  const activeFontFamily =
    lineOverride.fontFamily || styleConfig.fontFamily || 'Instrument Sans';
  const activeFontFace = lineOverride.fontFace || 'Regular';
  const activeFontSize = lineOverride.fontSize ?? 24;
  const activeBgEnabled =
    lineOverride.backgroundEnabled !== undefined
      ? lineOverride.backgroundEnabled
      : Boolean(
          styleConfig.backgroundEnabled &&
            (styleConfig.backgroundOpacity ?? 0) > 0.05
        );
  const activePosX = lineOverride.positionX ?? styleConfig.positionX ?? 50.0;
  const activePosY = lineOverride.positionY ?? styleConfig.positionY ?? 70.0;
  const activeTemplateId =
    lineOverride.templateId ||
    styleConfig.kalakarTemplateId ||
    styleConfig.presetId ||
    'kalakar-lala';

  const mergedTemplates = React.useMemo(() => {
    const map = new Map<string, StylePreset>();
    KALAKAR_48_BUILT_IN_PRESETS.forEach((p) => map.set(p.id, p));
    userPresets.forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    return Array.from(map.values());
  }, [userPresets]);

  const filteredTemplates = React.useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    if (!q) return mergedTemplates;
    return mergedTemplates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.badgeText && t.badgeText.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [mergedTemplates, templateSearch]);

  const applyOverridePatch = (patch: Partial<LineStyleOverride>) => {
    const next: LineStyleOverride = {
      ...lineOverride,
      ...patch,
    };
    onUpdateLineOverride(next);
  };

  const stepFontFamily = (dir: -1 | 1) => {
    const idx = allFontNames.indexOf(activeFontFamily);
    const nextIdx =
      idx === -1
        ? 0
        : (idx + dir + allFontNames.length) % allFontNames.length;
    const nextFont = allFontNames[nextIdx];
    ensureGoogleFontLoaded(nextFont);
    applyOverridePatch({ fontFamily: nextFont });
  };

  const stepFontFace = (dir: -1 | 1) => {
    const idx = LINE_STYLING_FONT_FACE_OPTIONS.indexOf(
      activeFontFace as (typeof LINE_STYLING_FONT_FACE_OPTIONS)[number]
    );
    const nextIdx =
      idx === -1
        ? 0
        : (idx + dir + LINE_STYLING_FONT_FACE_OPTIONS.length) %
          LINE_STYLING_FONT_FACE_OPTIONS.length;
    applyOverridePatch({ fontFace: LINE_STYLING_FONT_FACE_OPTIONS[nextIdx] });
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-[310px] sm:w-[316px] max-w-[calc(100vw-24px)] max-h-[470px] flex flex-col rounded-2xl bg-[#111312] border border-white/[0.12] text-[#E5E1E4] overflow-hidden select-none shadow-[0_24px_64px_rgba(0,0,0,0.88)]"
    >
      {/* STICKY TOP HEADER BAR: [ ⊞ ] LINE STYLING  ...  [ Line N ] */}
      <div className="px-3.5 py-2.5 border-b border-white/[0.08] flex items-center justify-between bg-[#111312] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#10291F] border border-[#1B4B38] flex items-center justify-center text-[#24B47E] shrink-0">
            <svg
              viewBox="0 0 20 20"
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <rect x="3" y="3.5" width="14" height="5" rx="1.5" />
              <rect x="3" y="11.5" width="6" height="5" rx="1.5" />
              <rect x="11" y="11.5" width="6" height="5" rx="1.5" />
            </svg>
          </div>
          <span className="text-[11px] font-extrabold tracking-[0.12em] text-white uppercase">
            LINE STYLING
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-[#15161A] border border-white/[0.12] text-[10px] font-semibold text-zinc-200">
            Line {lineNumber}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close Line Styling Pop-up"
              className="w-5 h-5 rounded-md hover:bg-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* SCROLLABLE POP-UP BODY (Exact Match to Screenshot 2) */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.08]">
        {/* SECTION 1: COLLAPSIBLE TYPOGRAPHY ACCORDION */}
        <div>
          <button
            type="button"
            onClick={() => setIsTypographyOpen((prev) => !prev)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-extrabold tracking-[0.09em] text-zinc-200 uppercase">
              TYPOGRAPHY
            </span>
            {isTypographyOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>

          {isTypographyOpen && (
            <div className="px-3.5 pb-3 pt-0.5 space-y-2.5">
              {/* Row 1: Font Family */}
              <div className="flex items-center justify-between gap-1.5">
                <label className="text-[11px] font-medium text-zinc-400 w-18 shrink-0">
                  Font Family
                </label>
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <select
                    value={activeFontFamily}
                    onChange={(e) => {
                      ensureGoogleFontLoaded(e.target.value);
                      applyOverridePatch({ fontFamily: e.target.value });
                    }}
                    className="flex-1 min-w-0 bg-[#1F2024] hover:bg-[#26272C] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white appearance-none focus:outline-none focus:border-[#24B47E] cursor-pointer truncate"
                  >
                    {allFontNames.map((fName) => (
                      <option key={fName} value={fName} className="bg-[#18191D]">
                        {fName}
                      </option>
                    ))}
                  </select>

                  <div className="w-6 h-7 rounded-lg bg-[#1F2024] border border-white/[0.08] flex flex-col items-center justify-center shrink-0 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => stepFontFamily(-1)}
                      title="Previous Font Family"
                      className="w-full flex-1 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
                    >
                      <ChevronUp className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => stepFontFamily(1)}
                      title="Next Font Family"
                      className="w-full flex-1 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
                    >
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => applyOverridePatch({ fontFamily: undefined })}
                    title="Reset Font Family"
                    className="w-7 h-7 rounded-lg bg-[#1F2024] hover:bg-[#292A30] border border-white/[0.08] flex items-center justify-center text-zinc-200 transition-colors cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Row 2: Font Face */}
              <div className="flex items-center justify-between gap-1.5">
                <label className="text-[11px] font-medium text-zinc-400 w-18 shrink-0">
                  Font Face
                </label>
                <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
                  <select
                    value={activeFontFace}
                    onChange={(e) => applyOverridePatch({ fontFace: e.target.value })}
                    className="flex-1 min-w-0 bg-[#1F2024] hover:bg-[#26272C] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white appearance-none focus:outline-none focus:border-[#24B47E] cursor-pointer"
                  >
                    {LINE_STYLING_FONT_FACE_OPTIONS.map((face) => (
                      <option key={face} value={face} className="bg-[#18191D]">
                        {face}
                      </option>
                    ))}
                  </select>

                  <div className="w-6 h-7 rounded-lg bg-[#1F2024] border border-white/[0.08] flex flex-col items-center justify-center shrink-0 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => stepFontFace(-1)}
                      title="Previous Font Face"
                      className="w-full flex-1 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
                    >
                      <ChevronUp className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => stepFontFace(1)}
                      title="Next Font Face"
                      className="w-full flex-1 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
                    >
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => applyOverridePatch({ fontFace: 'Regular' })}
                    title="Reset Font Face"
                    className="w-7 h-7 rounded-lg bg-[#1F2024] hover:bg-[#292A30] border border-white/[0.08] flex items-center justify-center text-zinc-200 transition-colors cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Row 3: Font Size */}
              <div className="flex items-center justify-between gap-1.5">
                <label className="text-[11px] font-medium text-zinc-400 w-18 shrink-0">
                  Font Size
                </label>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <input
                    type="range"
                    min={14}
                    max={100}
                    value={activeFontSize}
                    onChange={(e) =>
                      applyOverridePatch({
                        fontSize: parseInt(e.target.value, 10) || 24,
                      })
                    }
                    className="flex-1 min-w-0 accent-white h-1.5 bg-[#18382B] rounded-lg cursor-pointer"
                  />

                  <input
                    type="number"
                    min={12}
                    max={120}
                    value={activeFontSize}
                    onChange={(e) =>
                      applyOverridePatch({
                        fontSize: Math.max(
                          12,
                          Math.min(120, parseInt(e.target.value, 10) || 24)
                        ),
                      })
                    }
                    className="w-14 bg-[#1F2024] border border-white/[0.08] rounded-lg py-1 text-center text-[11px] font-bold text-white focus:outline-none focus:border-[#24B47E]"
                  />

                  <button
                    type="button"
                    onClick={() => applyOverridePatch({ fontSize: 24 })}
                    title="Reset Font Size to 24"
                    className="w-7 h-7 rounded-lg bg-[#1F2024] hover:bg-[#292A30] border border-white/[0.08] flex items-center justify-center text-zinc-200 transition-colors cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Row 4: Multi-Line Count (1 / 2 / 3 Lines) & Per-Line Text + Style Editor */}
              {(() => {
                const segMaxLines: 1 | 2 | 3 =
                  segment.maxLines ??
                  lineOverride.maxLines ??
                  styleConfig.maxLines ??
                  2;
                const splitPreview = splitSegmentIntoTwoLines(
                  segment,
                  styleConfig.primaryTrack
                );
                const curL1Text =
                  segment.customLine1Text !== undefined
                    ? segment.customLine1Text
                    : splitPreview.line1Text;
                const curL2Text =
                  segment.customLine2Text !== undefined
                    ? segment.customLine2Text
                    : splitPreview.line2Text;
                const curL3Text =
                  segment.customLine3Text !== undefined
                    ? segment.customLine3Text
                    : splitPreview.line3Text || '';

                const l1Size =
                  segment.line1FontSizePx ??
                  lineOverride.line1FontSizePx ??
                  styleConfig.line1FontSizePx ??
                  Math.round(
                    (styleConfig.fontSize || 48) *
                      (styleConfig.smallWordScale || 0.78)
                  );
                const l2Size =
                  segment.line2FontSizePx ??
                  lineOverride.line2FontSizePx ??
                  styleConfig.line2FontSizePx ??
                  Math.round(
                    (styleConfig.fontSize || 48) *
                      (styleConfig.bigWordScale || 1.75)
                  );
                const l3Size =
                  segment.line3FontSizePx ??
                  lineOverride.line3FontSizePx ??
                  styleConfig.line3FontSizePx ??
                  l1Size;

                return (
                  <div className="pt-2 border-t border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                        Lines in Caption
                      </span>
                      <div className="flex items-center gap-1 bg-[#141518] p-0.5 rounded-lg border border-white/[0.08]">
                        {([1, 2, 3] as const).map((cnt) => (
                          <button
                            key={`popup-lines-${cnt}`}
                            type="button"
                            onClick={() => {
                              onUpdateSegmentMeta?.({ maxLines: cnt });
                              applyOverridePatch({ maxLines: cnt });
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              segMaxLines === cnt
                                ? 'bg-[#24B47E] text-[#050505]'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {cnt} {cnt === 1 ? 'Line' : 'Lines'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Editable Line 1, Line 2, Line 3 Inputs + Per-Line Size (-/+) & Bold/Italic/Shine */}
                    <div className="space-y-1.5">
                      {/* LINE 1 */}
                      <div className="p-2 rounded-lg bg-[#16181C] border border-white/[0.07] space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-[#34D399]">
                            Line 1
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const next = Math.max(14, l1Size - 2);
                                onUpdateSegmentMeta?.({ line1FontSizePx: next });
                                applyOverridePatch({ line1FontSizePx: next });
                              }}
                              className="w-5 h-5 rounded bg-[#22242A] hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-[10px] font-mono text-white w-8 text-center">
                              {l1Size}px
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = Math.min(130, l1Size + 2);
                                onUpdateSegmentMeta?.({ line1FontSizePx: next });
                                applyOverridePatch({ line1FontSizePx: next });
                              }}
                              className="w-5 h-5 rounded bg-[#22242A] hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = !(
                                  segment.line1Bold ?? lineOverride.line1Bold
                                );
                                onUpdateSegmentMeta?.({ line1Bold: next });
                                applyOverridePatch({ line1Bold: next });
                              }}
                              className={`w-5 h-5 rounded text-[10px] font-black cursor-pointer ${
                                segment.line1Bold ?? lineOverride.line1Bold
                                  ? 'bg-[#24B47E] text-[#050505]'
                                  : 'bg-[#22242A] text-zinc-400 hover:text-white'
                              }`}
                            >
                              B
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = !(
                                  segment.line1Italic ?? lineOverride.line1Italic
                                );
                                onUpdateSegmentMeta?.({ line1Italic: next });
                                applyOverridePatch({ line1Italic: next });
                              }}
                              className={`w-5 h-5 rounded text-[10px] italic font-serif font-bold cursor-pointer ${
                                segment.line1Italic ?? lineOverride.line1Italic
                                  ? 'bg-[#24B47E] text-[#050505]'
                                  : 'bg-[#22242A] text-zinc-400 hover:text-white'
                              }`}
                            >
                              I
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = !(
                                  segment.line1Shine ?? lineOverride.line1Shine
                                );
                                onUpdateSegmentMeta?.({ line1Shine: next });
                                applyOverridePatch({ line1Shine: next });
                              }}
                              className={`px-1 h-5 rounded text-[9px] font-bold cursor-pointer ${
                                segment.line1Shine ?? lineOverride.line1Shine
                                  ? 'bg-amber-400 text-zinc-950'
                                  : 'bg-[#22242A] text-zinc-400 hover:text-amber-300'
                              }`}
                            >
                              ✨
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={curL1Text}
                          placeholder="Line 1 words..."
                          onChange={(e) =>
                            onUpdateSegmentMeta?.({
                              customLine1Text: e.target.value,
                              customLine2Text: curL2Text,
                            })
                          }
                          className="w-full bg-[#111215] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#24B47E]"
                        />
                      </div>

                      {/* LINE 2 (when 2 or 3 lines) */}
                      {segMaxLines >= 2 && (
                        <div className="p-2 rounded-lg bg-[#16181C] border border-white/[0.07] space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-amber-300">
                              Line 2 (Hero)
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const next = Math.max(16, l2Size - 2);
                                  onUpdateSegmentMeta?.({
                                    line2FontSizePx: next,
                                  });
                                  applyOverridePatch({ line2FontSizePx: next });
                                }}
                                className="w-5 h-5 rounded bg-[#22242A] hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-[10px] font-mono text-white w-8 text-center">
                                {l2Size}px
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = Math.min(150, l2Size + 2);
                                  onUpdateSegmentMeta?.({
                                    line2FontSizePx: next,
                                  });
                                  applyOverridePatch({ line2FontSizePx: next });
                                }}
                                className="w-5 h-5 rounded bg-[#22242A] hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = !(
                                    segment.line2Bold ??
                                    lineOverride.line2Bold ??
                                    true
                                  );
                                  onUpdateSegmentMeta?.({ line2Bold: next });
                                  applyOverridePatch({ line2Bold: next });
                                }}
                                className={`w-5 h-5 rounded text-[10px] font-black cursor-pointer ${
                                  segment.line2Bold ??
                                  lineOverride.line2Bold ??
                                  true
                                    ? 'bg-[#24B47E] text-[#050505]'
                                    : 'bg-[#22242A] text-zinc-400 hover:text-white'
                                }`}
                              >
                                B
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = !(
                                    segment.line2Italic ??
                                    lineOverride.line2Italic
                                  );
                                  onUpdateSegmentMeta?.({ line2Italic: next });
                                  applyOverridePatch({ line2Italic: next });
                                }}
                                className={`w-5 h-5 rounded text-[10px] italic font-serif font-bold cursor-pointer ${
                                  segment.line2Italic ?? lineOverride.line2Italic
                                    ? 'bg-[#24B47E] text-[#050505]'
                                    : 'bg-[#22242A] text-zinc-400 hover:text-white'
                                }`}
                              >
                                I
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = !(
                                    segment.line2Shine ?? lineOverride.line2Shine
                                  );
                                  onUpdateSegmentMeta?.({ line2Shine: next });
                                  applyOverridePatch({ line2Shine: next });
                                }}
                                className={`px-1 h-5 rounded text-[9px] font-bold cursor-pointer ${
                                  segment.line2Shine ?? lineOverride.line2Shine
                                    ? 'bg-amber-400 text-zinc-950'
                                    : 'bg-[#22242A] text-zinc-400 hover:text-amber-300'
                                }`}
                              >
                                ✨
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={curL2Text}
                            placeholder="Line 2 hero words..."
                            onChange={(e) =>
                              onUpdateSegmentMeta?.({
                                customLine1Text: curL1Text,
                                customLine2Text: e.target.value,
                              })
                            }
                            className="w-full bg-[#111215] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#24B47E]"
                          />
                        </div>
                      )}

                      {/* LINE 3 (when 3 lines) */}
                      {segMaxLines === 3 && (
                        <div className="p-2 rounded-lg bg-[#16181C] border border-white/[0.07] space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-sky-300">
                              Line 3
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const next = Math.max(14, l3Size - 2);
                                  onUpdateSegmentMeta?.({
                                    line3FontSizePx: next,
                                  });
                                  applyOverridePatch({ line3FontSizePx: next });
                                }}
                                className="w-5 h-5 rounded bg-[#22242A] hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-[10px] font-mono text-white w-8 text-center">
                                {l3Size}px
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = Math.min(130, l3Size + 2);
                                  onUpdateSegmentMeta?.({
                                    line3FontSizePx: next,
                                  });
                                  applyOverridePatch({ line3FontSizePx: next });
                                }}
                                className="w-5 h-5 rounded bg-[#22242A] hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = !(
                                    segment.line3Bold ?? lineOverride.line3Bold
                                  );
                                  onUpdateSegmentMeta?.({ line3Bold: next });
                                  applyOverridePatch({ line3Bold: next });
                                }}
                                className={`w-5 h-5 rounded text-[10px] font-black cursor-pointer ${
                                  segment.line3Bold ?? lineOverride.line3Bold
                                    ? 'bg-[#24B47E] text-[#050505]'
                                    : 'bg-[#22242A] text-zinc-400 hover:text-white'
                                }`}
                              >
                                B
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = !(
                                    segment.line3Italic ??
                                    lineOverride.line3Italic
                                  );
                                  onUpdateSegmentMeta?.({ line3Italic: next });
                                  applyOverridePatch({ line3Italic: next });
                                }}
                                className={`w-5 h-5 rounded text-[10px] italic font-serif font-bold cursor-pointer ${
                                  segment.line3Italic ?? lineOverride.line3Italic
                                    ? 'bg-[#24B47E] text-[#050505]'
                                    : 'bg-[#22242A] text-zinc-400 hover:text-white'
                                }`}
                              >
                                I
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = !(
                                    segment.line3Shine ?? lineOverride.line3Shine
                                  );
                                  onUpdateSegmentMeta?.({ line3Shine: next });
                                  applyOverridePatch({ line3Shine: next });
                                }}
                                className={`px-1 h-5 rounded text-[9px] font-bold cursor-pointer ${
                                  segment.line3Shine ?? lineOverride.line3Shine
                                    ? 'bg-amber-400 text-zinc-950'
                                    : 'bg-[#22242A] text-zinc-400 hover:text-amber-300'
                                }`}
                              >
                                ✨
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={curL3Text}
                            placeholder="Line 3 words..."
                            onChange={(e) =>
                              onUpdateSegmentMeta?.({
                                customLine1Text: curL1Text,
                                customLine2Text: curL2Text,
                                customLine3Text: e.target.value,
                              })
                            }
                            className="w-full bg-[#111215] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#24B47E]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* SECTION 2: BACKGROUND TOGGLE ROW */}
        <div className="px-3.5 py-2.5 flex items-center justify-between">
          <span className="text-[10px] font-extrabold tracking-[0.09em] text-zinc-300 uppercase">
            BACKGROUND
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={activeBgEnabled}
            onClick={() =>
              applyOverridePatch({ backgroundEnabled: !activeBgEnabled })
            }
            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
              activeBgEnabled
                ? 'bg-[#24B47E] justify-end'
                : 'bg-[#8E9196] justify-start'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-[#15161A] shadow-md transition-transform" />
          </button>
        </div>

        {/* SECTION 2.5: TEXT CURVE (⌒) — 180°, 360°, Reverse & Custom Angle */}
        {(() => {
          const lineArcDeg =
            segment.arcCurveDeg !== undefined
              ? segment.arcCurveDeg
              : styleConfig.arcEnabled
              ? styleConfig.arcCurveDeg || 0
              : 0;
          const isLineCurved = lineArcDeg !== 0;
          return (
            <div className="px-3.5 py-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-[0.09em] text-zinc-300 uppercase flex items-center gap-1.5">
                  <span>TEXT CURVE (⌒)</span>
                  {isLineCurved && (
                    <span className="px-1.5 py-0.5 rounded bg-[#163326] text-[#34D399] font-mono text-[9px]">
                      {lineArcDeg > 0 ? `+${lineArcDeg}°` : `${lineArcDeg}°`}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isLineCurved}
                  onClick={() =>
                    onUpdateSegmentMeta?.({
                      arcCurveDeg: isLineCurved ? 0 : 180,
                    })
                  }
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                    isLineCurved
                      ? 'bg-[#24B47E] justify-end'
                      : 'bg-[#8E9196] justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-[#15161A] shadow-md transition-transform" />
                </button>
              </div>

              {isLineCurved && (
                <div className="p-2.5 rounded-xl bg-[#141518] border border-white/[0.08] space-y-2 text-[10px]">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-zinc-400">
                      {lineArcDeg > 0 ? 'Upward Arch' : 'Reversed Curve'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSegmentMeta?.({
                          arcCurveDeg: -lineArcDeg,
                        })
                      }
                      className="px-2 py-0.5 rounded bg-[#163326] hover:bg-[#24B47E] text-[#34D399] hover:text-[#050505] font-bold border border-[#24B47E]/40 cursor-pointer"
                    >
                      ⇄ Reverse
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { deg: 180, label: '180°' },
                      { deg: 360, label: '360°' },
                      { deg: -180, label: '-180°' },
                      { deg: -360, label: '-360°' },
                    ].map((p) => (
                      <button
                        key={`line-pop-curve-${p.deg}`}
                        type="button"
                        onClick={() =>
                          onUpdateSegmentMeta?.({ arcCurveDeg: p.deg })
                        }
                        className={`py-1 rounded font-bold cursor-pointer border ${
                          lineArcDeg === p.deg
                            ? 'bg-[#24B47E] text-[#050505] border-[#24B47E]'
                            : 'bg-[#1F2024] text-zinc-300 border-white/[0.08] hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={-360}
                      max={360}
                      step={5}
                      value={lineArcDeg}
                      onChange={(e) =>
                        onUpdateSegmentMeta?.({
                          arcCurveDeg: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="flex-1 accent-[#24B47E] cursor-pointer"
                    />
                    <span className="font-mono font-bold text-white w-10 text-right">
                      {lineArcDeg}°
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* SECTION 3: POSITION (X % and Y % Card) */}
        <div className="px-3.5 py-3 space-y-2">
          <span className="text-[10px] font-extrabold tracking-[0.09em] text-zinc-300 uppercase block">
            POSITION
          </span>

          <div className="p-2.5 rounded-xl bg-[#141518] border border-white/[0.08] space-y-2">
            <span className="text-[11px] font-semibold text-zinc-300 block">
              Position
            </span>

            <div className="flex items-center gap-1.5">
              {/* X Input + Reset */}
              <span className="text-[11px] font-medium text-zinc-400">X</span>
              <div className="flex-1 min-w-0 bg-[#1F2024] border border-white/[0.1] rounded-lg px-2 py-1 flex items-center justify-between">
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={100}
                  value={Number(activePosX).toFixed(1)}
                  onChange={(e) => {
                    const val = Math.max(
                      0,
                      Math.min(100, parseFloat(e.target.value) || 0)
                    );
                    applyOverridePatch({ positionX: val });
                    onUpdateGlobalStyle?.({
                      canvasPositionLocked: false,
                      positionX: val,
                    });
                  }}
                  className="w-full bg-transparent text-center text-[11px] font-bold text-white focus:outline-none"
                />
                <span className="text-[10px] text-zinc-400 ml-0.5">%</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  applyOverridePatch({ positionX: 50.0 });
                  onUpdateGlobalStyle?.({ positionX: 50 });
                }}
                title="Reset X Position to 50.0%"
                className="w-6 h-6 rounded-lg bg-[#1F2024] hover:bg-[#292A30] border border-white/[0.08] flex items-center justify-center text-zinc-200 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
              </button>

              {/* Y Input + Reset */}
              <span className="text-[11px] font-medium text-zinc-400 ml-0.5">
                Y
              </span>
              <div className="flex-1 min-w-0 bg-[#1F2024] border border-white/[0.1] rounded-lg px-2 py-1 flex items-center justify-between">
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={100}
                  value={Number(activePosY).toFixed(1)}
                  onChange={(e) => {
                    const val = Math.max(
                      0,
                      Math.min(100, parseFloat(e.target.value) || 0)
                    );
                    applyOverridePatch({ positionY: val });
                    onUpdateGlobalStyle?.({
                      canvasPositionLocked: false,
                      positionY: val,
                    });
                  }}
                  className="w-full bg-transparent text-center text-[11px] font-bold text-white focus:outline-none"
                />
                <span className="text-[10px] text-zinc-400 ml-0.5">%</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  applyOverridePatch({ positionY: 70.0 });
                  onUpdateGlobalStyle?.({ positionY: 70 });
                }}
                title="Reset Y Position to 70.0%"
                className="w-6 h-6 rounded-lg bg-[#1F2024] hover:bg-[#292A30] border border-white/[0.08] flex items-center justify-center text-zinc-200 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 4: TEMPLATES (Search + Visual Template Cards like Lala & Ali Abdaal) */}
        <div className="px-3.5 py-3 space-y-2.5">
          <span className="text-[10px] font-extrabold tracking-[0.09em] text-zinc-300 uppercase block">
            TEMPLATES
          </span>

          {/* Search templates... */}
          <div className="bg-[#141518] border border-white/[0.08] rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full bg-transparent text-[11px] text-white placeholder:text-zinc-500 focus:outline-none"
            />
            {templateSearch && (
              <button
                type="button"
                onClick={() => setTemplateSearch('')}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Visual Template Preview Cards */}
          <div className="space-y-2.5">
            {filteredTemplates.map((tpl) => {
              const isSelected = activeTemplateId === tpl.id;
              return (
                <button
                  key={`line-tpl-${tpl.id}`}
                  type="button"
                  onClick={() => {
                    if (tpl.config.fontFamily) {
                      ensureGoogleFontLoaded(tpl.config.fontFamily);
                    }
                    applyOverridePatch({
                      templateId: tpl.id,
                      fontFamily: tpl.config.fontFamily,
                      primaryColor: tpl.config.primaryColor,
                      secondaryColor: tpl.config.highlightColor,
                      backgroundEnabled: tpl.config.backgroundEnabled,
                    });
                  }}
                  className={`w-full rounded-xl overflow-hidden border text-left transition-all cursor-pointer block bg-[#16171C] ${
                    isSelected
                      ? 'border-[#24B47E] ring-1 ring-[#24B47E]/30'
                      : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="px-3 py-2 bg-[#18191E] flex items-center justify-between gap-2 border-b border-white/[0.05]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-white truncate">
                        {tpl.name}
                      </span>
                      {(tpl.isVerifiedCreator ||
                        tpl.id === 'kalakar-lala' ||
                        tpl.name.toLowerCase() === 'lala') && (
                        <VerifiedCreatorBadge />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-[#24B47E] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-[#050505] stroke-[2.5]" />
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded-full bg-[#E59819] text-zinc-950 flex items-center justify-center shadow-sm">
                        <Crown className="w-2.5 h-2.5 stroke-[2.2]" />
                      </span>
                    </div>
                  </div>

                  {renderMerupifyTemplatePreviewBanner(tpl)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};


