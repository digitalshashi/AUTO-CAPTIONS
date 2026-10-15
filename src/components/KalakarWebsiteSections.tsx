import React, { useState } from 'react';
import {
  Upload,
  Wand2,
  Volume2,
  Download,
  Film,
  Check,
  FileCode,
  FileText,
  ChevronUp,
  ChevronDown,
  Layers,
  Sliders,
} from 'lucide-react';
import {
  AudioEnhancerConfig,
  CaptionStyleConfig,
  StylePreset,
  TrackKey,
  VideoAspectRatio,
} from '../types/caption';
import { INDIAN_LANGUAGE_MATRIX } from '../data/presetsAndLanguages';

interface KalakarHeroBannerProps {
  primaryTrack: TrackKey;
  aspectRatio: VideoAspectRatio;
  audioEnhancer: AudioEnhancerConfig;
  customFonts: string[];
  isHeroCollapsed: boolean;
  onToggleHeroCollapse: () => void;
  onSelectTrack: (track: TrackKey) => void;
  onChangeAspectRatio: (ratio: VideoAspectRatio) => void;
  onToggleAudioEnhancer: () => void;
  onUploadVideoFile: (file: File) => void;
  onUploadCustomFont: (file: File) => void;
  onScrollToSection: (sectionId: string) => void;
}

const HERO_SCRIPT_SHOWCASE: {
  langName: string;
  region: string;
  romanKey: TrackKey;
  nativeKey: TrackKey;
  romanSample: string;
  nativeSample: string;
  isRTL?: boolean;
}[] = [
  {
    langName: 'Urdu / Roman Urdu',
    region: 'Pakistan & North India',
    romanKey: 'roman_urdu',
    nativeKey: 'urdu',
    romanSample: 'Yaar main poori raat SOYA NAHI',
    nativeSample: 'یار میں پوری رات سویا نہیں',
    isRTL: true,
  },
  {
    langName: 'Hindi / Hinglish',
    region: 'North & Central India',
    romanKey: 'hinglish',
    nativeKey: 'hindi',
    romanSample: 'Bhai yeh SECRET dekh ke shock ho jaoge',
    nativeSample: 'भाई यह राज़ देखकर चौंक जाओगे',
  },
  {
    langName: 'Telugu / Tinglish',
    region: 'Andhra Pradesh & Telangana',
    romanKey: 'tinglish',
    nativeKey: 'telugu',
    romanSample: 'Mawa ee SECRET chuste shock avtharu',
    nativeSample: 'మావ ఈ రహస్యం చూస్తే షాక్ అవుతారు',
  },
  {
    langName: 'Tamil / Tanglish',
    region: 'Tamil Nadu & Global',
    romanKey: 'tanglish',
    nativeKey: 'tamil',
    romanSample: 'Machi indha SECRET paarunga',
    nativeSample: 'நண்பா இந்த ரகசியம் பாருங்க',
  },
  {
    langName: 'Punjabi / Gurmukhi',
    region: 'Punjab & Diaspora',
    romanKey: 'hinglish',
    nativeKey: 'punjabi',
    romanSample: 'Mere kol 20,000 da PRODUCT hai',
    nativeSample: 'ਮੇਰੇ ਕੋਲ 20,000 ਪ੍ਰੋਡਕਟ ਹੈ',
  },
  {
    langName: 'Bengali / Bangla',
    region: 'West Bengal & Bangladesh',
    romanKey: 'english',
    nativeKey: 'bengali',
    romanSample: 'Amader kache 20,000 PRODUCT ache',
    nativeSample: 'আমাদের কাছে 20,000 প্রোডাক্ট আছে',
  },
];

export const KalakarHeroBanner: React.FC<KalakarHeroBannerProps> = ({
  primaryTrack,
  aspectRatio,
  audioEnhancer,
  customFonts,
  isHeroCollapsed,
  onToggleHeroCollapse,
  onSelectTrack,
  onChangeAspectRatio,
  onToggleAudioEnhancer,
  onUploadVideoFile,
  onUploadCustomFont,
  onScrollToSection,
}) => {
  const [scriptMode, setScriptMode] = useState<'roman' | 'native'>('roman');
  const [selectedShowcaseIdx, setSelectedShowcaseIdx] = useState<number>(0);

  const activeShowcase = HERO_SCRIPT_SHOWCASE[selectedShowcaseIdx] || HERO_SCRIPT_SHOWCASE[0];

  if (isHeroCollapsed) {
    return (
      <div className="bg-[#111115] border-b border-white/[0.07] px-6 py-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="font-semibold text-white">Kalakar Desi Caption Studio</span>
          <span aria-hidden="true">·</span>
          <span>21+ South Asian Languages</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">97% Desi Speech Accuracy</span>
          <span aria-hidden="true">·</span>
          <span>Format: {aspectRatio}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onScrollToSection('kalakar-templates')}
            className="px-2.5 py-1 rounded-lg bg-[#1C1C24] hover:bg-[#262632] text-zinc-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            Creator Templates
          </button>
          <button
            type="button"
            onClick={() => onScrollToSection('kalakar-audio-plugins')}
            className="px-2.5 py-1 rounded-lg bg-[#1C1C24] hover:bg-[#262632] text-zinc-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            AI Audio &amp; Plugins
          </button>
          <button
            type="button"
            onClick={onToggleHeroCollapse}
            className="px-2.5 py-1 rounded-lg bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 text-[#FBBF24] border border-[#F59E0B]/30 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Expand Kalakar Overview</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="relative bg-[#0B0B0E] border-b border-white/[0.08] px-6 py-8 lg:py-10">
      <div className="max-w-[1380px] mx-auto space-y-6">
        {/* Top Kicker Row + Minimize Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="text-[#F59E0B] font-semibold">Kalakar Creator Suite</span>
            <span aria-hidden="true">·</span>
            <span>Made by desi creators, for desi creators</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">23 South Asian &amp; Roman Tracks</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">Up to 97% Accuracy</span>
          </div>

          <button
            type="button"
            onClick={onToggleHeroCollapse}
            className="px-3 py-1.5 rounded-lg bg-[#18181F] hover:bg-[#23232D] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Minimize Banner for Full-Height Editor</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main 2-Column Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Headline, Value Proposition, Primary Actions & Format Controls */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <h1
                className="font-display font-extrabold tracking-tight text-white leading-[1.08]"
                style={{ fontSize: 'clamp(2rem, 3.4vw, 3.25rem)', textWrap: 'balance' }}
              >
                Captioning software, made by{' '}
                <span className="text-[#F59E0B]">desi creators</span>, for desi creators.
              </h1>
              <p className="text-sm lg:text-base text-zinc-300 max-w-2xl leading-relaxed">
                Generate word-by-word animated subtitles in 21+ South Asian languages — including
                Hindi, Hinglish, Urdu (Nastaliq &amp; Roman), Telugu, Tinglish, Tamil, Punjabi, and
                Bengali. Clean background traffic noise in one click and export 1080p video, SRT,
                or transparent alpha layers for Premiere Pro and DaVinci Resolve.
              </p>
            </div>

            {/* Primary Action Bar: Upload Video + Custom Font Upload + AI Audio Enhancer + Aspect Ratio */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <label className="px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-zinc-950 font-bold text-xs lg:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm">
                <Upload className="w-4 h-4" />
                <span>Upload Video &amp; Generate Captions</span>
                <input
                  type="file"
                  accept="video/*,audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadVideoFile(f);
                  }}
                />
              </label>

              {/* Upload Custom Font (.TTF / .OTF / .WOFF2) */}
              <label className="px-4 py-2.5 rounded-xl bg-[#181820] hover:bg-[#22222D] border border-white/10 text-zinc-100 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0">
                <FileCode className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>
                  {customFonts.length > 0
                    ? `Custom Fonts (${customFonts.length}) · Upload +`
                    : 'Upload Custom Font (.TTF/.OTF)'}
                </span>
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadCustomFont(f);
                  }}
                />
              </label>

              {/* 1-Click AI Audio Enhancer Toggle */}
              <button
                type="button"
                onClick={onToggleAudioEnhancer}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  audioEnhancer.enabled
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#181820] border-white/10 text-zinc-300 hover:text-white'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>
                  {audioEnhancer.enabled ? 'AI Audio Cleaning: ON' : 'AI Audio Cleaning: OFF'}
                </span>
              </button>
            </div>

            {/* Video Aspect Ratio Switcher (9:16 Vertical vs 16:9 Horizontal vs 1:1 Square) */}
            <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-white/[0.07]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-400">Video Format:</span>
                <div className="flex items-center gap-1 p-1 bg-[#15151C] rounded-lg border border-white/[0.07]">
                  {(
                    [
                      { id: '9:16', label: '9:16 Vertical (Reels/Shorts)' },
                      { id: '16:9', label: '16:9 Horizontal (YouTube)' },
                      { id: '1:1', label: '1:1 Square' },
                    ] as { id: VideoAspectRatio; label: string }[]
                  ).map((fmt) => {
                    const active = aspectRatio === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => onChangeAspectRatio(fmt.id)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-white text-zinc-950 shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Kalakar Interactive Native Script vs Roman Script Live Switcher */}
          <div className="lg:col-span-5 bg-[#13131A] border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Interactive Desi Script &amp; Language Switcher
                </h2>
                <p className="text-xs text-zinc-400">
                  Switch between Roman script (phonetic) and Native script (including RTL Urdu)
                </p>
              </div>

              {/* Segmented Control: Roman Letters vs Native Script */}
              <div className="flex items-center gap-1 p-1 bg-[#0B0B0F] rounded-lg border border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setScriptMode('roman');
                    onSelectTrack(activeShowcase.romanKey);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    scriptMode === 'roman'
                      ? 'bg-[#F59E0B] text-zinc-950'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Roman Script
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScriptMode('native');
                    onSelectTrack(activeShowcase.nativeKey);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    scriptMode === 'native'
                      ? 'bg-[#F59E0B] text-zinc-950'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Native Script
                </button>
              </div>
            </div>

            {/* Live Caption Preview Box */}
            <div className="bg-[#0B0B0E] border border-white/[0.08] rounded-xl p-4 text-center space-y-2">
              <div className="text-[11px] text-zinc-400 flex items-center justify-center gap-2">
                <span>{activeShowcase.langName}</span>
                <span aria-hidden="true">·</span>
                <span>{activeShowcase.region}</span>
                <span aria-hidden="true">·</span>
                <span>{scriptMode === 'roman' ? 'Roman Letters' : 'Native Script'}</span>
              </div>
              <div
                dir={scriptMode === 'native' && activeShowcase.isRTL ? 'rtl' : 'ltr'}
                className="text-lg lg:text-xl font-extrabold tracking-tight text-white py-1"
              >
                {scriptMode === 'roman' ? (
                  <span>
                    {activeShowcase.romanSample.split(' ').map((w, i) => {
                      const isUpper = w === w.toUpperCase() && w.length >= 4;
                      return (
                        <span
                          key={i}
                          className={
                            isUpper
                              ? 'text-[#F59E0B] underline decoration-[#F59E0B]/50 mx-1'
                              : 'mx-1'
                          }
                        >
                          {w}
                        </span>
                      );
                    })}
                  </span>
                ) : (
                  <span className="text-[#FDE047]">{activeShowcase.nativeSample}</span>
                )}
              </div>
            </div>

            {/* 6 Desi Language Quick Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {HERO_SCRIPT_SHOWCASE.map((item, idx) => {
                const isSelected = idx === selectedShowcaseIdx;
                const targetTrack = scriptMode === 'roman' ? item.romanKey : item.nativeKey;
                const isTrackActive = primaryTrack === targetTrack;
                return (
                  <button
                    key={item.langName}
                    type="button"
                    onClick={() => {
                      setSelectedShowcaseIdx(idx);
                      onSelectTrack(scriptMode === 'roman' ? item.romanKey : item.nativeKey);
                    }}
                    className={`px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                      isSelected || isTrackActive
                        ? 'bg-[#1F1B12] border-[#F59E0B] text-white'
                        : 'bg-[#0E0E13] border-white/[0.06] text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{item.langName}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{item.nativeSample}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface KalakarBottomShowcaseProps {
  presets: StylePreset[];
  styleConfig: CaptionStyleConfig;
  audioEnhancer: AudioEnhancerConfig;
  isExportingAlpha: boolean;
  onApplyPreset: (preset: StylePreset) => void;
  onSelectTrack: (track: TrackKey) => void;
  onUpdateAudioEnhancer: (partial: Partial<AudioEnhancerConfig>) => void;
  onExportEnhancedWAV: () => void;
  onExportAlphaOverlayVideo: () => void;
  onExportPremiereXML: () => void;
  onExportSRT: () => void;
  onScrollToEditor: () => void;
}

type CurrencyCode = 'INR' | 'USD' | 'PKR' | 'BDT' | 'NPR';

const CURRENCY_RATES: Record<
  CurrencyCode,
  { symbol: string; label: string; starter: string; pro: string; agency: string }
> = {
  INR: { symbol: '₹', label: 'INR (₹)', starter: '0', pro: '599', agency: '1,499' },
  USD: { symbol: '$', label: 'USD ($)', starter: '0', pro: '6.99', agency: '19.99' },
  PKR: { symbol: '₨', label: 'PKR (₨)', starter: '0', pro: '1,950', agency: '5,400' },
  BDT: { symbol: '৳', label: 'BDT (৳)', starter: '0', pro: '799', agency: '2,200' },
  NPR: { symbol: 'रू', label: 'NPR (रू)', starter: '0', pro: '950', agency: '2,400' },
};

export const KalakarBottomShowcase: React.FC<KalakarBottomShowcaseProps> = ({
  presets,
  styleConfig,
  audioEnhancer,
  isExportingAlpha,
  onApplyPreset,
  onSelectTrack,
  onUpdateAudioEnhancer,
  onExportEnhancedWAV,
  onExportAlphaOverlayVideo,
  onExportPremiereXML,
  onExportSRT,
  onScrollToEditor,
}) => {
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [scriptFilter, setScriptFilter] = useState<'all' | 'roman' | 'native' | 'rtl'>('all');
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [pluginOs, setPluginOs] = useState<'mac' | 'windows'>('mac');
  const [downloadedPluginMsg, setDownloadedPluginMsg] = useState<string | null>(null);

  const filteredLanguages = INDIAN_LANGUAGE_MATRIX.filter((lang) => {
    if (scriptFilter === 'roman') return lang.isRomanized;
    if (scriptFilter === 'native') return !lang.isRomanized;
    if (scriptFilter === 'rtl') return Boolean(lang.isRTL);
    return true;
  });

  const activeCurr = CURRENCY_RATES[currency];

  const handleDownloadPluginPackage = (hostApp: 'Premiere Pro' | 'DaVinci Resolve') => {
    const manifest = {
      pluginName: `Kalakar Desi Captions for ${hostApp}`,
      version: '2.4.0',
      os: pluginOs,
      supportedLanguages: INDIAN_LANGUAGE_MATRIX.map((l) => l.label),
      activePreset: styleConfig.presetId,
      primaryTrack: styleConfig.primaryTrack,
      instructions: `Import the generated .fcpxml or .srt timeline, or drop the Transparent Alpha (.webm) caption track directly onto Video Track V2 in ${hostApp}.`,
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kalakar-${hostApp.toLowerCase().replace(/\s+/g, '-')}-${pluginOs}-plugin-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    setDownloadedPluginMsg(
      `Downloaded ${hostApp} (${pluginOs.toUpperCase()}) plugin configuration & workflow bundle.`
    );
  };

  return (
    <div className="bg-[#0B0B0E] text-zinc-100 border-t border-white/[0.08]">
      {/* SECTION 01: 21+ DESI LANGUAGES MATRIX (NATIVE & ROMAN SCRIPT) */}
      <section
        id="kalakar-languages"
        className="max-w-[1380px] mx-auto px-6 py-12 border-b border-white/[0.07] space-y-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs text-[#F59E0B] font-semibold">
              01. Desi Language &amp; Script Engine
            </div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
              21+ South Asian Languages in Native &amp; Roman Scripts
            </h2>
            <p className="text-sm text-zinc-400 max-w-2xl">
              Click any language below to switch the live studio caption track immediately. Supports
              phonetic Roman transliteration (Hinglish, Roman Urdu, Tinglish, Tanglish) and native
              scripts including right-to-left Urdu, Sindhi, Kashmiri, and Pashto.
            </p>
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex items-center gap-1 p-1 bg-[#14141B] rounded-xl border border-white/10">
            {(
              [
                { id: 'all', label: `All (${INDIAN_LANGUAGE_MATRIX.length})` },
                { id: 'roman', label: 'Roman Script' },
                { id: 'native', label: 'Native Script' },
                { id: 'rtl', label: 'Right-to-Left (Urdu/RTL)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScriptFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  scriptFilter === tab.id
                    ? 'bg-[#F59E0B] text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {filteredLanguages.map((lang) => {
            const active = styleConfig.primaryTrack === lang.key;
            return (
              <button
                key={lang.key}
                type="button"
                onClick={() => {
                  onSelectTrack(lang.key);
                  onScrollToEditor();
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  active
                    ? 'bg-[#1F1A10] border-[#F59E0B] text-white'
                    : 'bg-[#121217] border-white/[0.07] text-zinc-200 hover:border-white/25'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white truncate">
                      {lang.shortLabel}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono tabular-nums">
                      {lang.isRTL ? 'RTL' : lang.isRomanized ? 'Roman' : 'Native'}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate mt-0.5">{lang.label}</div>
                </div>
                <div className="text-[11px] text-[#F59E0B] font-medium truncate">
                  {lang.nativeName} · {lang.region.split('&')[0].trim()}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 02: VIRAL CREATOR TEMPLATES (MRBEAST, ALEX HORMOZI, IMAN GADZHI, DHRUV, SIDZ) */}
      <section
        id="kalakar-templates"
        className="max-w-[1380px] mx-auto px-6 py-12 border-b border-white/[0.07] space-y-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs text-[#F59E0B] font-semibold">
              02. Customizable Viral Templates
            </div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
              Creator Caption Styles — Alex Hormozi, MrBeast, Iman Gadzhi &amp; SIDZ
            </h2>
            <p className="text-sm text-zinc-400 max-w-2xl">
              Every template works across all 21+ Desi languages and is 100% customizable with
              vertical gradients, dual fonts, custom font uploads, and word-by-word animations.
            </p>
          </div>

          <button
            type="button"
            onClick={onScrollToEditor}
            className="px-4 py-2 rounded-xl bg-[#181820] hover:bg-[#242430] border border-white/10 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
          >
            Customize Active Template in Studio ↑
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {presets.map((preset) => {
            const isSelected = styleConfig.presetId === preset.id;
            return (
              <div
                key={preset.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between gap-4 transition-all ${
                  isSelected
                    ? 'bg-[#191712] border-[#F59E0B]'
                    : 'bg-[#121217] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                    <span className="font-bold text-white">{preset.name}</span>
                    <span>{preset.creatorCategory || 'Creator Style'}</span>
                  </div>

                  {/* Live Typography Preview Box */}
                  <div
                    className={`h-28 rounded-xl bg-gradient-to-br ${preset.previewBg} border border-white/10 flex flex-col items-center justify-center p-3 text-center overflow-hidden`}
                  >
                    {preset.smallPreviewText && (
                      <span
                        className="text-xs font-bold text-white/90 tracking-wide"
                        style={{ fontFamily: preset.config.fontFamily || 'Plus Jakarta Sans' }}
                      >
                        {preset.smallPreviewText}
                      </span>
                    )}
                    <span
                      className="text-2xl font-black tracking-tight leading-none mt-1"
                      style={{
                        fontFamily: preset.config.heroWordFontFamily || 'Anton',
                        color: preset.config.highlightColor || '#FDE047',
                      }}
                    >
                      {preset.badgeText}
                    </span>
                    {preset.scriptPreviewText && (
                      <span
                        className="text-sm text-white/95 -mt-1"
                        style={{
                          fontFamily: preset.config.accentScriptFontFamily || 'Kaushan Script',
                        }}
                      >
                        {preset.scriptPreviewText}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">{preset.tagline}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onApplyPreset(preset);
                    onScrollToEditor();
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#F59E0B] text-zinc-950'
                      : 'bg-[#1E1E28] hover:bg-[#2A2A38] text-white'
                  }`}
                >
                  {isSelected ? 'Active on Canvas' : 'Apply Template to Video'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 03: AI AUDIO ENHANCER & PREMIERE PRO / DAVINCI RESOLVE PLUGINS */}
      <section
        id="kalakar-audio-plugins"
        className="max-w-[1380px] mx-auto px-6 py-12 border-b border-white/[0.07] space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Bento (col-span-6): One-Click AI Audio Enhancer Studio */}
          <div className="lg:col-span-6 bg-[#121217] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="text-xs text-emerald-400 font-semibold">
                03. Built-In AI Audio Cleaning
              </div>
              <h3 className="text-xl lg:text-2xl font-display font-bold text-white">
                Studio-Quality Voice &amp; Background Noise Removal
              </h3>
              <p className="text-xs lg:text-sm text-zinc-400 leading-relaxed">
                Clean up Indian street traffic, ceiling fan hum, crowd noise, and room echo in one
                click. Toggle between Raw Audio and Enhanced Audio in real time for crisper voice
                and higher transcription accuracy.
              </p>
            </div>

            {/* Interactive Raw vs Enhanced Audio Comparison Toggle & Sliders */}
            <div className="bg-[#0B0B0F] border border-white/[0.07] rounded-xl p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white">
                  Real-Time Audio Comparison Mode:
                </span>
                <div className="flex items-center gap-1 p-1 bg-[#16161E] rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => onUpdateAudioEnhancer({ enabled: false })}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      !audioEnhancer.enabled
                        ? 'bg-zinc-700 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Raw Original Audio
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateAudioEnhancer({ enabled: true })}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      audioEnhancer.enabled
                        ? 'bg-emerald-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    AI Enhanced Studio Audio
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">Traffic &amp; Street Noise Cut</span>
                    <span className="font-mono tabular-nums text-emerald-400 font-bold">
                      -{audioEnhancer.noiseReductionDb} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={36}
                    step={2}
                    value={audioEnhancer.noiseReductionDb}
                    onChange={(e) =>
                      onUpdateAudioEnhancer({
                        enabled: true,
                        noiseReductionDb: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">Vocal Crispness &amp; Presence</span>
                    <span className="font-mono tabular-nums text-[#F59E0B] font-bold">
                      +{audioEnhancer.voiceClarityBoost} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={1}
                    value={audioEnhancer.voiceClarityBoost}
                    onChange={(e) =>
                      onUpdateAudioEnhancer({
                        enabled: true,
                        voiceClarityBoost: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-[#F59E0B] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onExportEnhancedWAV}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Volume2 className="w-4 h-4" />
                <span>Download Cleaned Studio Audio (.WAV)</span>
              </button>
              <span className="text-xs text-zinc-400">
                85Hz Traffic High-Pass · 3.2kHz Voice Clarity · Studio Leveler
              </span>
            </div>
          </div>

          {/* Right Bento (col-span-6): Premiere Pro & DaVinci Resolve Plugin Hub + Alpha Export */}
          <div className="lg:col-span-6 bg-[#121217] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#38BDF8] font-semibold">
                  04. Professional NLE Plugins &amp; Alpha Export
                </span>
                <div className="flex items-center gap-1 p-1 bg-[#0B0B0F] rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => setPluginOs('mac')}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                      pluginOs === 'mac' ? 'bg-white text-zinc-950' : 'text-zinc-400'
                    }`}
                  >
                    macOS (Apple Silicon / Intel)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPluginOs('windows')}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                      pluginOs === 'windows' ? 'bg-white text-zinc-950' : 'text-zinc-400'
                    }`}
                  >
                    Windows (64-bit)
                  </button>
                </div>
              </div>
              <h3 className="text-xl lg:text-2xl font-display font-bold text-white">
                Adobe Premiere Pro &amp; DaVinci Resolve Integration
              </h3>
              <p className="text-xs lg:text-sm text-zinc-400 leading-relaxed">
                Export your animated captions as a transparent alpha-channel overlay layer, native
                FCPXML timeline, or SRT subtitles to drop straight into Premiere Pro or DaVinci
                Resolve without watermarks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onExportAlphaOverlayVideo}
                disabled={isExportingAlpha}
                className="p-3.5 rounded-xl bg-[#191923] hover:bg-[#222230] border border-[#38BDF8]/30 text-left transition-colors cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {isExportingAlpha
                      ? 'Rendering Alpha Layer...'
                      : 'Export Transparent Alpha (.WEBM)'}
                  </span>
                  <Layers className="w-4 h-4 text-[#38BDF8]" />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Transparent caption-only video track for Premiere &amp; DaVinci V2 lane
                </p>
              </button>

              <button
                type="button"
                onClick={onExportPremiereXML}
                className="p-3.5 rounded-xl bg-[#191923] hover:bg-[#222230] border border-white/10 text-left transition-colors cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Export Premiere / Resolve (.FCPXML)
                  </span>
                  <FileCode className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Editable timeline XML with synced Desi text layers
                </p>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleDownloadPluginPackage('Premiere Pro')}
                className="px-3.5 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Premiere Pro Plugin ({pluginOs === 'mac' ? 'macOS' : 'Win'})</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPluginPackage('DaVinci Resolve')}
                className="px-3.5 py-2 rounded-xl bg-[#1E1E28] hover:bg-[#2A2A38] border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>DaVinci Resolve Plugin ({pluginOs === 'mac' ? 'macOS' : 'Win'})</span>
              </button>
              <button
                type="button"
                onClick={onExportSRT}
                className="px-3.5 py-2 rounded-xl bg-[#1E1E28] hover:bg-[#2A2A38] border border-white/10 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download .SRT</span>
              </button>
            </div>

            {downloadedPluginMsg && (
              <div className="text-xs text-emerald-400 font-medium">{downloadedPluginMsg}</div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 05: REGIONAL CREATOR PRICING (INR / USD / PKR / BDT / NPR) */}
      <section
        id="kalakar-pricing"
        className="max-w-[1380px] mx-auto px-6 py-12 space-y-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs text-[#F59E0B] font-semibold">
              05. Built for South Asian Creators
            </div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
              Transparent Regional Pricing — No Watermarks
            </h2>
            <p className="text-sm text-zinc-400 max-w-2xl">
              Affordable plans in your local currency with full access to 21+ Desi languages,
              Premiere Pro &amp; DaVinci Resolve plugins, and 1080p/4K rendering.
            </p>
          </div>

          {/* Regional Currency Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#14141B] rounded-xl border border-white/10">
            {(['INR', 'USD', 'PKR', 'BDT', 'NPR'] as CurrencyCode[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  currency === code
                    ? 'bg-[#F59E0B] text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {CURRENCY_RATES[code].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tier 1: Free Creator Plan */}
          <div
            className={`rounded-2xl border p-6 flex flex-col justify-between space-y-5 ${
              selectedPlan === 'free'
                ? 'bg-[#171612] border-[#F59E0B]'
                : 'bg-[#121217] border-white/[0.08]'
            }`}
          >
            <div className="space-y-3">
              <div className="text-xs text-zinc-400 font-medium">For testing &amp; short reels</div>
              <h3 className="text-lg font-bold text-white">Kalakar Free Tier</h3>
              <div className="flex items-baseline gap-1 font-mono tabular-nums">
                <span className="text-3xl font-extrabold text-white">
                  {activeCurr.symbol}
                  {activeCurr.starter}
                </span>
                <span className="text-xs text-zinc-400">/ month</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-white/[0.07]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Zero watermarks on basic creator templates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>5 minutes of full template testing included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Premiere Pro &amp; DaVinci Resolve plugin access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>9:16 Vertical &amp; 16:9 Horizontal formats</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedPlan('free');
                onScrollToEditor();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1E1E28] hover:bg-[#282836] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {selectedPlan === 'free' ? 'Current Active Plan · Start Editing' : 'Use Free Tier'}
            </button>
          </div>

          {/* Tier 2: Kalakar Pro Creator (₹599 / $6.99) */}
          <div
            className={`rounded-2xl border p-6 flex flex-col justify-between space-y-5 ${
              selectedPlan === 'pro'
                ? 'bg-[#19160E] border-[#F59E0B]'
                : 'bg-[#121217] border-white/[0.08]'
            }`}
          >
            <div className="space-y-3">
              <div className="text-xs text-[#F59E0B] font-semibold">
                For daily Desi content creators
              </div>
              <h3 className="text-lg font-bold text-white">Kalakar Creator Pro</h3>
              <div className="flex items-baseline gap-1 font-mono tabular-nums">
                <span className="text-3xl font-extrabold text-white">
                  {activeCurr.symbol}
                  {activeCurr.pro}
                </span>
                <span className="text-xs text-zinc-400">/ month</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-white/[0.07]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                  <span>All 21+ Desi languages (Native + Roman + Urdu RTL)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                  <span>1080p / 4K 60fps clean export + Transparent Alpha</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                  <span>Unlimited 1-Click AI Audio Enhancer &amp; Noise Gate</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                  <span>Custom Font Uploads (.TTF / .OTF) &amp; 30+ Gradients</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedPlan('pro');
                onScrollToEditor();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
            >
              {selectedPlan === 'pro' ? 'Pro Features Unlocked in Studio ↑' : 'Select Creator Pro'}
            </button>
          </div>

          {/* Tier 3: Kalakar Studio & Agency */}
          <div
            className={`rounded-2xl border p-6 flex flex-col justify-between space-y-5 ${
              selectedPlan === 'agency'
                ? 'bg-[#171612] border-[#F59E0B]'
                : 'bg-[#121217] border-white/[0.08]'
            }`}
          >
            <div className="space-y-3">
              <div className="text-xs text-zinc-400 font-medium">
                For video editing agencies &amp; studios
              </div>
              <h3 className="text-lg font-bold text-white">Kalakar Studio Agency</h3>
              <div className="flex items-baseline gap-1 font-mono tabular-nums">
                <span className="text-3xl font-extrabold text-white">
                  {activeCurr.symbol}
                  {activeCurr.agency}
                </span>
                <span className="text-xs text-zinc-400">/ month</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-white/[0.07]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Unlimited transcription hours &amp; multi-track exports</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Shared brand presets &amp; custom gradient libraries</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Batch SRT, WebVTT, FCPXML &amp; Alpha exports</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>5 seats for Premiere Pro &amp; DaVinci Resolve</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedPlan('agency');
                onScrollToEditor();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1E1E28] hover:bg-[#282836] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {selectedPlan === 'agency' ? 'Agency Suite Active in Studio ↑' : 'Select Agency Plan'}
            </button>
          </div>
        </div>
      </section>

      {/* QUIET FOOTER */}
      <footer className="max-w-[1380px] mx-auto px-6 py-8 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-300">Kalakar · VakyaReel Studio</span>
          <span aria-hidden="true">·</span>
          <span>Captioning software for South Asian creators</span>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <a
            href="#workspace"
            onClick={(e) => {
              e.preventDefault();
              onScrollToEditor();
            }}
            className="hover:text-zinc-300 transition-colors"
          >
            Web Studio Editor
          </a>
          <a href="#kalakar-languages" className="hover:text-zinc-300 transition-colors">
            21+ Desi Languages
          </a>
          <a href="#kalakar-templates" className="hover:text-zinc-300 transition-colors">
            Creator Templates
          </a>
          <a href="#kalakar-audio-plugins" className="hover:text-zinc-300 transition-colors">
            Premiere &amp; DaVinci Plugins
          </a>
          <a href="#kalakar-pricing" className="hover:text-zinc-300 transition-colors">
            Pricing
          </a>
        </div>
      </footer>
    </div>
  );
};
