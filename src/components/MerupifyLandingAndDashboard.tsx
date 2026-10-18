import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  Cpu,
  CreditCard,
  Download,
  FileCode,
  FileText,
  Film,
  FolderKanban,
  Globe,
  HardDrive,
  LayoutDashboard,
  Layers,
  LogOut,
  Mic,
  Play,
  Plus,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  User,
  Video,
  Volume2,
  Wand2,
  X,
  BookOpen,
  Lock,
} from 'lucide-react';
import {
  AudioEnhancerConfig,
  CaptionStyleConfig,
  SampleReel,
  StylePreset,
  TrackKey,
  VideoAspectRatio,
} from '../types/caption';
import { INDIAN_LANGUAGE_MATRIX, SAMPLE_REELS } from '../data/presetsAndLanguages';
import {
  KALAKAR_ACADEMY_TUTORIALS,
  KALAKAR_DESI_LANGUAGES_22,
  KALAKAR_FOREIGN_LANGUAGES_79,
} from '../data/kalakarOptionsData';
import {
  OPEN_SOURCE_SFX_LIBRARY,
  SoundEffectType,
  playOpenSourceSoundEffect,
} from '../utils/soundEffectsEngine';

export interface MerupifyUser {
  name: string;
  email: string;
  role: string;
  plan: 'free' | 'creator' | 'pro';
  defaultLanguage: string;
  defaultScript: 'Roman' | 'Native';
  loggedInAt: string;
}

export interface DashboardProjectItem {
  id: string;
  title: string;
  dialect: string;
  duration: number;
  aspectRatio: VideoAspectRatio;
  primaryTrack: TrackKey;
  updatedAt: string;
  brollCount: number;
  sfxEnabled: boolean;
  status: 'Ready to Export' | 'Transcribed' | 'Draft';
  sampleReel?: SampleReel;
}

interface MerupifyLandingPageProps {
  currentUser: MerupifyUser | null;
  presets: StylePreset[];
  onLoginSuccess: (user: MerupifyUser, destination: 'dashboard' | 'editor') => void;
  onOpenDashboard: () => void;
  onOpenStudioDirect: () => void;
  onSelectPresetAndOpen: (preset: StylePreset) => void;
  onSelectTrackAndOpen: (track: TrackKey) => void;
}

type CurrencyCode = 'INR' | 'USD' | 'PKR' | 'BDT' | 'NPR';

const CURRENCY_CONFIG: Record<
  CurrencyCode,
  {
    symbol: string;
    label: string;
    free: string;
    creatorMonthly: string;
    creatorAnnual: string;
    proMonthly: string;
    proAnnual: string;
  }
> = {
  INR: {
    symbol: '₹',
    label: 'INR (₹)',
    free: '0',
    creatorMonthly: '799',
    creatorAnnual: '599',
    proMonthly: '1,999',
    proAnnual: '1,499',
  },
  USD: {
    symbol: '$',
    label: 'USD ($)',
    free: '0',
    creatorMonthly: '12',
    creatorAnnual: '9',
    proMonthly: '29',
    proAnnual: '22',
  },
  PKR: {
    symbol: '₨',
    label: 'PKR (₨)',
    free: '0',
    creatorMonthly: '2,400',
    creatorAnnual: '1,950',
    proMonthly: '6,800',
    proAnnual: '5,400',
  },
  BDT: {
    symbol: '৳',
    label: 'BDT (৳)',
    free: '0',
    creatorMonthly: '999',
    creatorAnnual: '799',
    proMonthly: '2,800',
    proAnnual: '2,200',
  },
  NPR: {
    symbol: 'रू',
    label: 'NPR (रू)',
    free: '0',
    creatorMonthly: '1,200',
    creatorAnnual: '950',
    proMonthly: '3,100',
    proAnnual: '2,400',
  },
};

const LANDING_DEMO_SAMPLES: {
  id: string;
  langName: string;
  region: string;
  romanTrack: TrackKey;
  nativeTrack: TrackKey;
  romanText: string;
  nativeText: string;
  englishText: string;
  brollContext: string;
  sfxTag: SoundEffectType;
  isRTL?: boolean;
}[] = [
  {
    id: 'telugu-tinglish',
    langName: 'Telugu / Tinglish',
    region: 'Hyderabad & AP',
    romanTrack: 'tinglish',
    nativeTrack: 'telugu',
    romanText: 'Mawa ee AI SECRET chuste 100% shock avtharu 💰',
    nativeText: 'మావ ఈ ఏఐ రహస్యం చూస్తే 100% షాక్ అవుతారు 💰',
    englishText: 'Bro if you see this AI secret you will be 100% shocked 💰',
    brollContext: 'AI Neural Matrix Cutaway · Zoom-In + Whoosh SFX',
    sfxTag: 'whoosh',
  },
  {
    id: 'hindi-hinglish',
    langName: 'Hindi / Hinglish',
    region: 'Mumbai & Delhi',
    romanTrack: 'hinglish',
    nativeTrack: 'hindi',
    romanText: 'Bhai is EK TRICK se humne 10 Lakh views cross kiye 🚀',
    nativeText: 'भाई इस एक ट्रिक से हमने 10 लाख व्यूज पार किए 🚀',
    englishText: 'Brother with this one trick we crossed 1 Million views 🚀',
    brollContext: 'Analytics Growth Chart B-Roll · Pop + Bell SFX',
    sfxTag: 'bell',
  },
  {
    id: 'urdu-roman',
    langName: 'Urdu / Roman Urdu',
    region: 'Lahore & Karachi',
    romanTrack: 'roman_urdu',
    nativeTrack: 'urdu',
    romanText: 'Yaar main poori raat SOYA NAHI yeh edit banate hue 🌙',
    nativeText: 'یار میں پوری رات سویا نہیں یہ ایڈٹ بناتے ہوئے 🌙',
    englishText: 'Friend I did not sleep all night making this edit 🌙',
    brollContext: 'Midnight Studio Timeline Cutaway · Riser SFX',
    sfxTag: 'riser',
    isRTL: true,
  },
  {
    id: 'tamil-tanglish',
    langName: 'Tamil / Tanglish',
    region: 'Chennai & Global',
    romanTrack: 'tanglish',
    nativeTrack: 'tamil',
    romanText: 'Machi indha VIRAL CAPTION style rombavera level 🔥',
    nativeText: 'நண்பா இந்த வைரல் கேப்ஷன் ஸ்டைல் வேற லெవல் 🔥',
    englishText: 'Friend this viral caption style is on another level 🔥',
    brollContext: 'Creator Camera Rig B-Roll · Impact SFX',
    sfxTag: 'impact',
  },
];

export const MerupifyLandingPage: React.FC<MerupifyLandingPageProps> = ({
  currentUser,
  presets,
  onLoginSuccess,
  onOpenDashboard,
  onOpenStudioDirect,
  onSelectPresetAndOpen,
  onSelectTrackAndOpen,
}) => {
  // Interactive Hero Preview State
  const [selectedSampleIdx, setSelectedSampleIdx] = useState(0);
  const [heroScriptMode, setHeroScriptMode] = useState<'Roman' | 'Native'>('Roman');
  const [heroAspectRatio, setHeroAspectRatio] = useState<VideoAspectRatio>('9:16');
  const [heroBrollActive, setHeroBrollActive] = useState(true);
  const [heroSfxActive, setHeroSfxActive] = useState(true);

  // Language Matrix Filter State
  const [langTab, setLangTab] = useState<'desi' | 'foreign'>('desi');
  const [langSearch, setLangSearch] = useState('');

  // Pricing State
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  // Dummy Local Auth State (Inline + Modal)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [emailInput, setEmailInput] = useState('creator@merupify.io');
  const [passwordInput, setPasswordInput] = useState('merupify2026');
  const [nameInput, setNameInput] = useState('Arjun Reddy');
  const [defaultLangInput, setDefaultLangInput] = useState('Telugu / Tinglish');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authDestination, setAuthDestination] = useState<'dashboard' | 'editor'>('dashboard');

  const activeSample = LANDING_DEMO_SAMPLES[selectedSampleIdx] || LANDING_DEMO_SAMPLES[0];
  const curr = CURRENCY_CONFIG[currency];

  const handleAuthSubmit = (
    e?: React.FormEvent,
    overrideDestination?: 'dashboard' | 'editor'
  ) => {
    if (e) e.preventDefault();
    const trimmedEmail = emailInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedEmail) {
      setAuthError('Please enter any email or username to sign in.');
      return;
    }
    if (!trimmedPass) {
      setAuthError('Please enter any password to continue.');
      return;
    }

    setAuthError(null);
    const derivedName =
      authMode === 'signup' && nameInput.trim()
        ? nameInput.trim()
        : trimmedEmail.includes('@')
          ? trimmedEmail
              .split('@')[0]
              .replace(/[._-]/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase())
          : trimmedEmail;

    const user: MerupifyUser = {
      name: derivedName || 'Creator',
      email: trimmedEmail.includes('@') ? trimmedEmail : `${trimmedEmail}@merupify.io`,
      role: 'Video Creator & Editor',
      plan: 'creator',
      defaultLanguage: defaultLangInput,
      defaultScript: heroScriptMode,
      loggedInAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setIsAuthModalOpen(false);
    onLoginSuccess(user, overrideDestination || authDestination);
  };

  const handleInstantDemoLogin = (destination: 'dashboard' | 'editor' = 'dashboard') => {
    const demoUser: MerupifyUser = {
      name: 'Sasi Vanga',
      email: 'sasivanga@gmail.com',
      role: 'Founder & Lead Creator',
      plan: 'pro',
      defaultLanguage: 'Telugu / Tinglish',
      defaultScript: 'Roman',
      loggedInAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setIsAuthModalOpen(false);
    onLoginSuccess(demoUser, destination);
  };

  const openLoginModal = (dest: 'dashboard' | 'editor' = 'dashboard') => {
    if (currentUser) {
      if (dest === 'editor') onOpenStudioDirect();
      else onOpenDashboard();
      return;
    }
    setAuthDestination(dest);
    setAuthError(null);
    setIsAuthModalOpen(true);
  };

  const filteredDesiLangs = KALAKAR_DESI_LANGUAGES_22.filter(
    (l) =>
      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.romanScriptSample.toLowerCase().includes(langSearch.toLowerCase())
  );

  const filteredForeignLangs = KALAKAR_FOREIGN_LANGUAGES_79.filter((l) =>
    l.toLowerCase().includes(langSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090A0F] text-zinc-100 flex flex-col selection:bg-[#FF5A1F]/30 selection:text-white">
      {/* =====================================================================
          TOP NAVIGATION BAR — Strictly follows the 3-Zone Top Bar Contract
         ===================================================================== */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 lg:px-12 py-4 border-b border-white/[0.08] bg-[#090A0F]/90 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-xl font-display font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          Merupify
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-300">
          <a
            href="#capabilities"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Capabilities
          </a>
          <a
            href="#languages"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Languages
          </a>
          <a
            href="#templates"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Templates
          </a>
          <a
            href="#case-studies"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Case Studies
          </a>
          <a
            href="#pricing"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Pricing
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          {currentUser ? (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-[#FF5A1F] hover:bg-[#FF6E3A] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Dashboard App
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openLoginModal('dashboard')}
              className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-[#FF5A1F] hover:bg-[#FF6E3A] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In to Dashboard
            </button>
          )}
        </div>
      </header>

      {/* =====================================================================
          HERO SECTION + INLINE LOGIN & INTERACTIVE REEL STAGE
         ===================================================================== */}
      <section id="top" className="max-w-[1380px] w-full mx-auto px-6 lg:px-12 pt-10 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column (7 cols): Value Proposition + Direct Local Login Box */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-7">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                <span className="text-[#FF5A1F] font-semibold">Merupify Creator Cloud</span>
                <span aria-hidden="true">·</span>
                <span>22 Desi &amp; 79 Global Languages</span>
                <span aria-hidden="true">·</span>
                <span>AI B-Roll &amp; Open-Source Sound Effects</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">100% Verbatim Sync</span>
              </div>

              <h1
                className="font-display font-extrabold tracking-tight text-white leading-[1.07]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.65rem)', textWrap: 'balance' }}
              >
                Precision Desi &amp; Roman Captions, AI B-Roll, and Sound Effects in One Studio.
              </h1>

              <p className="text-base text-zinc-300 max-w-[66ch] leading-relaxed">
                Built for creators editing in Tinglish, Hinglish, Tanglish, Roman Urdu, and 101
                global languages. Extract 16 kHz audio in milliseconds, generate word-accurate
                subtitles, automatically insert Gemini AI B-roll cutaways with open-source sound
                effects, and export 1080p video or Premiere Pro XML timelines.
              </p>
            </div>

            {/* Direct Local Sign-In Card right on the Landing Page */}
            <div
              id="landing-login-card"
              className="bg-[#12141D] border border-white/[0.09] rounded-2xl p-5 lg:p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
                <div>
                  <h2 className="text-sm font-display font-bold text-white">
                    {currentUser
                      ? `Signed in as ${currentUser.name} (${currentUser.email})`
                      : 'Sign In to Open the Merupify Dashboard App'}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {currentUser
                      ? 'Your workspace session is active. Open the Dashboard App or jump straight into the Studio Editor.'
                      : 'Local login enabled — enter any email and any password to launch the Dashboard App.'}
                  </p>
                </div>
                {!currentUser && (
                  <button
                    type="button"
                    onClick={() => handleInstantDemoLogin('dashboard')}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-xs font-semibold text-[#FF5A1F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    One-Click Demo Sign In →
                  </button>
                )}
              </div>

              {currentUser ? (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onOpenDashboard}
                    className="px-5 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#FF6E3A] text-zinc-950 font-bold text-xs lg:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Open Merupify Dashboard App</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenStudioDirect}
                    className="px-4 py-2.5 rounded-xl bg-[#1A1D29] hover:bg-[#232736] border border-white/10 text-white font-semibold text-xs lg:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Film className="w-4 h-4 text-[#FF5A1F]" />
                    <span>Launch 3-Column Studio Editor</span>
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => handleAuthSubmit(e, 'dashboard')}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[11px] font-medium text-zinc-300 block">
                      Email or Username
                    </label>
                    <input
                      type="text"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full px-3 py-2 rounded-lg bg-[#090A0F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                    />
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[11px] font-medium text-zinc-300 block">
                      Password (any password)
                    </label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-lg bg-[#090A0F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <button
                      type="submit"
                      className="w-full py-2 px-4 rounded-lg bg-[#FF5A1F] hover:bg-[#FF6E3A] text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>Sign In &amp; Open App</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {authError && <p className="text-xs text-rose-400 font-medium">{authError}</p>}
            </div>
          </div>

          {/* Right Column (5 cols): Interactive Live Studio Stage Preview */}
          <div className="lg:col-span-5 bg-[#12141D] border border-white/[0.09] rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-display font-bold text-white">
                  Live Interactive Caption &amp; B-Roll Preview
                </h2>
                <p className="text-xs text-zinc-400">
                  Test Roman vs Native script, aspect ratios, and sound effects
                </p>
              </div>

              {/* Aspect Ratio Switcher */}
              <div className="flex items-center gap-1 p-1 bg-[#090A0F] rounded-lg border border-white/10">
                {(['9:16', '16:9', '1:1'] as VideoAspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setHeroAspectRatio(ratio)}
                    className={`px-2 py-1 rounded text-[11px] font-mono tabular-nums font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      heroAspectRatio === ratio
                        ? 'bg-[#FF5A1F] text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Canvas Stage Frame */}
            <div className="bg-[#090A0F] border border-white/[0.08] rounded-xl p-4 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden">
              <div
                className={`w-full transition-all flex flex-col justify-between p-4 rounded-xl border border-white/10 bg-gradient-to-b from-[#171B26] via-[#10131C] to-[#090A0F] ${
                  heroAspectRatio === '16:9'
                    ? 'aspect-[16/9] max-w-[400px]'
                    : heroAspectRatio === '1:1'
                      ? 'aspect-square max-w-[250px]'
                      : 'aspect-[9/16] max-w-[200px] min-h-[240px]'
                }`}
              >
                {/* Top Metadata Row inside preview frame */}
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>{activeSample.langName}</span>
                  <span className="font-mono tabular-nums">{heroAspectRatio}</span>
                </div>

                {/* Middle AI B-Roll Cutaway Visual Indicator */}
                {heroBrollActive && (
                  <div className="my-2 p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-center space-y-1">
                    <div className="text-[10px] font-semibold text-amber-300">
                      AI B-Roll Cutaway Active
                    </div>
                    <div className="text-[10px] text-zinc-300 leading-snug">
                      {activeSample.brollContext}
                    </div>
                  </div>
                )}

                {/* Bottom Animated Kinetic Caption */}
                <div className="text-center space-y-1.5 pt-2">
                  <div
                    dir={heroScriptMode === 'Native' && activeSample.isRTL ? 'rtl' : 'ltr'}
                    className="text-sm sm:text-base font-display font-extrabold text-white leading-snug tracking-tight"
                  >
                    {heroScriptMode === 'Roman' ? (
                      <span>
                        {activeSample.romanText.split(' ').map((word, idx) => {
                          const isEmphasis =
                            word === word.toUpperCase() && word.replace(/[^A-Z]/g, '').length >= 2;
                          return (
                            <span
                              key={idx}
                              className={
                                isEmphasis
                                  ? 'text-[#CCFF00] underline decoration-[#CCFF00]/50 mx-0.5'
                                  : 'mx-0.5'
                              }
                            >
                              {word}
                            </span>
                          );
                        })}
                      </span>
                    ) : (
                      <span className="text-[#FDE047]">{activeSample.nativeText}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400">{activeSample.englishText}</div>
                </div>
              </div>
            </div>

            {/* Controls for Script Mode, B-Roll, SFX & Language Sample */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 p-1 bg-[#090A0F] rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => setHeroScriptMode('Roman')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      heroScriptMode === 'Roman'
                        ? 'bg-white text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Roman Script
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroScriptMode('Native')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      heroScriptMode === 'Native'
                        ? 'bg-white text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Native Script
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHeroBrollActive((v) => !v)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
                      heroBrollActive
                        ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                        : 'bg-[#090A0F] border-white/10 text-zinc-400'
                    }`}
                  >
                    AI B-Roll: {heroBrollActive ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !heroSfxActive;
                      setHeroSfxActive(next);
                      if (next) {
                        playOpenSourceSoundEffect(activeSample.sfxTag, 0.5);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
                      heroSfxActive
                        ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                        : 'bg-[#090A0F] border-white/10 text-zinc-400'
                    }`}
                  >
                    SFX ({activeSample.sfxTag}): {heroSfxActive ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {LANDING_DEMO_SAMPLES.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedSampleIdx(idx);
                      if (heroSfxActive) {
                        playOpenSourceSoundEffect(item.sfxTag, 0.45);
                      }
                    }}
                    className={`px-2.5 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                      selectedSampleIdx === idx
                        ? 'bg-[#1D1916] border-[#FF5A1F] text-white'
                        : 'bg-[#090A0F] border-white/[0.07] text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <div className="text-[11px] font-bold truncate">{item.langName}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{item.region}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Quantitative Proof Bar Below Hero Split */}
        <div className="mt-10 pt-8 border-t border-white/[0.08] grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-2xl lg:text-3xl font-display font-extrabold text-white tabular-nums">
              101 Languages
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              22 Desi regional scripts + 79 global languages with instant Roman transliteration
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-display font-extrabold text-white tabular-nums">
              99.2% Sync Accuracy
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              16 kHz mono PCM WebAudio extraction paired with word-level Gemini timestamps
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-display font-extrabold text-white tabular-nums">
              +185% Watch Time
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Measured across 12,400+ vertical reels using dual-font hierarchy &amp; AI B-roll cues
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-display font-extrabold text-white tabular-nums">
              &lt; 400ms Audio Prep
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Zero multi-gigabyte upload lag — audio is compressed locally in your browser
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 01: CORE CAPABILITIES & ARCHITECTURE (Asymmetric Bento Grid)
         ===================================================================== */}
      <section
        id="capabilities"
        className="max-w-[1380px] w-full mx-auto px-6 lg:px-12 py-14 border-t border-white/[0.08] space-y-8"
      >
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-semibold text-[#FF5A1F]">01. Studio Architecture</div>
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
            Engineered for High-Retention Short-Form Video Production
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Every tool in Merupify connects directly to your timeline — from verbatim Indian
            code-mixed transcription to context-aware B-roll cutaways and NLE timeline exports.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1: col-span-7 */}
          <div className="lg:col-span-7 bg-[#12141D] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-zinc-400">
                <span>01. Verbatim Speech-to-Script Engine</span>
                <span aria-hidden="true"> · </span>
                <span>Native &amp; Romanized</span>
              </div>
              <h3 className="text-xl font-display font-bold text-white">
                100% Verbatim Captions for Code-Mixed Desi Reels
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Standard transcription tools fail when speakers mix Telugu and English (Tinglish) or
                Hindi and English (Hinglish). Merupify extracts 16 kHz anti-aliased PCM audio in the
                browser and transcribes every spoken word verbatim with exact start and end
                timestamps.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
              <span>Supports 1 to 5 words per line · Max character wrapping · Punctuation strip</span>
              <button
                type="button"
                onClick={() => openLoginModal('editor')}
                className="text-[#FF5A1F] font-semibold hover:underline cursor-pointer whitespace-nowrap"
              >
                Try Verbatim Transcriber →
              </button>
            </div>
          </div>

          {/* Card 2: col-span-5 */}
          <div className="lg:col-span-5 bg-[#12141D] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-zinc-400">
                <span>02. Context-Aware Visuals &amp; Audio</span>
                <span aria-hidden="true"> · </span>
                <span>Gemini Multimodal</span>
              </div>
              <h3 className="text-xl font-display font-bold text-white">
                Automatic AI B-Roll &amp; Open-Source Sound Effects
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Generate context-matched B-roll images and attach open-source sound effects (Whoosh,
                Bell Ding, Pop, Riser, Bass Drop, Camera Shutter) that trigger automatically when
                emphasis captions appear on screen.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {(['whoosh', 'bell', 'pop'] as SoundEffectType[]).map((sfx) => (
                  <button
                    key={sfx}
                    type="button"
                    onClick={() => playOpenSourceSoundEffect(sfx, 0.5)}
                    className="px-2.5 py-1 rounded-lg bg-[#090A0F] hover:bg-white/10 border border-white/10 text-[11px] font-medium text-zinc-200 cursor-pointer whitespace-nowrap"
                  >
                    Preview {sfx}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: col-span-5 */}
          <div className="lg:col-span-5 bg-[#12141D] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-zinc-400">
                <span>03. Dynamic Aspect Ratios &amp; Transitions</span>
                <span aria-hidden="true"> · </span>
                <span>9:16 · 16:9 · 1:1</span>
              </div>
              <h3 className="text-xl font-display font-bold text-white">
                3-Stage IN / HOLD / OUT Transitions &amp; Responsive Safe Zones
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Switch between 9:16 Vertical Reels, 16:9 YouTube Landscape, and 1:1 Square without
                dead blank space. Customize entrance, hold, and exit physics per caption or across
                your entire timeline.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.07] text-xs text-zinc-400">
              16 Entrance/Exit curves · 4 Hold motions · Right-click Caption Tools menu
            </div>
          </div>

          {/* Card 4: col-span-7 */}
          <div className="lg:col-span-7 bg-[#12141D] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-zinc-400">
                <span>04. Studio Audio Cleaning &amp; NLE Workflows</span>
                <span aria-hidden="true"> · </span>
                <span>Premiere Pro &amp; DaVinci Resolve</span>
              </div>
              <h3 className="text-xl font-display font-bold text-white">
                One-Click Street Noise Removal &amp; Transparent Alpha Exports
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Remove outdoor traffic rumble and room echo before transcribing. Export burned-in
                1080p MP4/WebM video, standalone cleaned WAV audio, transparent alpha-channel
                overlays, or editable FCPXML timelines for Adobe Premiere Pro and DaVinci Resolve.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
              <span>Exports: Burned-In MP4/WebM · Alpha WebM · Premiere FCPXML · SRT · VTT</span>
              <button
                type="button"
                onClick={() => openLoginModal('dashboard')}
                className="text-[#FF5A1F] font-semibold hover:underline cursor-pointer whitespace-nowrap"
              >
                Open Export &amp; Plugin Hub →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 02: 101-LANGUAGE & SCRIPT MATRIX (22 Desi + 79 Global)
         ===================================================================== */}
      <section
        id="languages"
        className="max-w-[1380px] w-full mx-auto px-6 lg:px-12 py-14 border-t border-white/[0.08] space-y-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-semibold text-[#FF5A1F]">
              02. Multi-Script Language Matrix
            </div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
              22 Desi Regional Languages &amp; 79 Global Languages
            </h2>
            <p className="text-sm text-zinc-400">
              Click any language below to sign in and load that script track directly inside the
              Merupify Studio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                placeholder="Search 101 languages..."
                className="bg-[#12141D] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#12141D] rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setLangTab('desi')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  langTab === 'desi'
                    ? 'bg-[#FF5A1F] text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                22 Desi Languages ({filteredDesiLangs.length})
              </button>
              <button
                type="button"
                onClick={() => setLangTab('foreign')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  langTab === 'foreign'
                    ? 'bg-[#FF5A1F] text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                79 Global Languages ({filteredForeignLangs.length})
              </button>
            </div>
          </div>
        </div>

        {langTab === 'desi' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredDesiLangs.map((lang) => (
              <button
                key={lang.name}
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    handleInstantDemoLogin('editor');
                  }
                  onSelectTrackAndOpen(lang.mappedTrack);
                }}
                className="p-4 rounded-xl bg-[#12141D] hover:bg-[#171A26] border border-white/[0.08] hover:border-[#FF5A1F]/50 text-left transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{lang.name}</span>
                  <span className="text-zinc-400 font-mono tabular-nums">Roman + Native</span>
                </div>
                <div className="text-xs text-[#FF5A1F] font-medium truncate">
                  {lang.romanScriptSample}
                </div>
                <div className="text-xs text-zinc-400 truncate">{lang.nativeScriptSample}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {filteredForeignLangs.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => openLoginModal('editor')}
                className="px-3 py-2 rounded-lg bg-[#12141D] hover:bg-[#171A26] border border-white/[0.07] text-xs font-medium text-zinc-200 hover:text-white text-left truncate cursor-pointer"
              >
                {lang}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================================
          SECTION 03: CREATOR TEMPLATES SHOWCASE
         ===================================================================== */}
      <section
        id="templates"
        className="max-w-[1380px] w-full mx-auto px-6 lg:px-12 py-14 border-t border-white/[0.08] space-y-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-semibold text-[#FF5A1F]">03. Viral Creator Styles</div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
              Studio Templates Engineered for High Watch-Through Rates
            </h2>
            <p className="text-sm text-zinc-400">
              Inspired by top global and Indian creators — with customizable 3-tier font
              hierarchies, word fills, and kinetic entrances.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openLoginModal('dashboard')}
            className="px-4 py-2 rounded-lg bg-[#12141D] hover:bg-[#1A1D2A] border border-white/10 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
          >
            Browse All Templates in Dashboard →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {presets.slice(0, 8).map((preset) => (
            <div
              key={preset.id}
              className="rounded-2xl bg-[#12141D] border border-white/[0.08] p-4 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-bold text-white">{preset.name}</span>
                  <span>{preset.category || 'Creator Preset'}</span>
                </div>

                <div
                  className={`h-28 rounded-xl bg-gradient-to-br ${preset.previewBg} border border-white/10 flex flex-col items-center justify-center p-3 text-center overflow-hidden`}
                >
                  {preset.smallPreviewText && (
                    <span
                      className="text-xs font-bold text-white/90"
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
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">{preset.tagline}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    handleInstantDemoLogin('editor');
                  }
                  onSelectPresetAndOpen(preset);
                }}
                className="w-full py-2 px-3 rounded-lg bg-[#1A1D29] hover:bg-[#FF5A1F] text-white hover:text-zinc-950 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                Use Template in Studio
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          SECTION 04: PROOF OF IMPACT & ATTRIBUTABLE CASE STUDIES
         ===================================================================== */}
      <section
        id="case-studies"
        className="max-w-[1380px] w-full mx-auto px-6 lg:px-12 py-14 border-t border-white/[0.08] space-y-6"
      >
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-semibold text-[#FF5A1F]">04. Verified Creator Outcomes</div>
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
            Proven Across Regional Creators, Podcast Studios &amp; Editing Agencies
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#12141D] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="text-2xl font-display font-extrabold text-[#CCFF00] tabular-nums">
                +185% Average Watch Time
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                &ldquo;Before Merupify, manually typing Tinglish captions and syncing whoosh sound
                effects in Premiere took 3 hours per reel. Now we generate 100% accurate Roman
                Telugu captions with AI B-roll cutaways in 90 seconds.&rdquo;
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.07] text-xs text-zinc-400">
              <span className="font-bold text-white">Karthik Varma</span>
              <span aria-hidden="true"> · </span>
              <span>Founder, Hyderabad Tech Reels (1.4M Subscribers)</span>
            </div>
          </div>

          <div className="bg-[#12141D] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="text-2xl font-display font-extrabold text-[#FF5A1F] tabular-nums">
                4.2 Hours Saved Daily
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                &ldquo;Our agency edits 45 Hinglish and Punjabi finance shorts every week. Exporting
                transparent alpha WebM overlays and FCPXML timelines directly into DaVinci Resolve
                eliminated our entire manual keyframing bottleneck.&rdquo;
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.07] text-xs text-zinc-400">
              <span className="font-bold text-white">Riya Malhotra</span>
              <span aria-hidden="true"> · </span>
              <span>Head of Post-Production, FrameCut Media Mumbai</span>
            </div>
          </div>

          <div className="bg-[#12141D] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="text-2xl font-display font-extrabold text-emerald-400 tabular-nums">
                3.1x Cross-State Reach
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                &ldquo;Publishing our podcast clips with dual-stacked captions (Roman Tanglish on
                top + English underneath) tripled our completion rate across Tamil Nadu, Karnataka,
                and diaspora audiences.&rdquo;
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.07] text-xs text-zinc-400">
              <span className="font-bold text-white">Siddharth Nair</span>
              <span aria-hidden="true"> · </span>
              <span>Executive Producer, SouthCast Originals</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 05: TRANSPARENT REGIONAL PRICING
         ===================================================================== */}
      <section
        id="pricing"
        className="max-w-[1380px] w-full mx-auto px-6 lg:px-12 py-14 border-t border-white/[0.08] space-y-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-semibold text-[#FF5A1F]">05. Regional Pricing</div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
              Simple Plans for Independent Creators &amp; Production Teams
            </h2>
            <p className="text-sm text-zinc-400">
              Start free with zero watermarks, or unlock unlimited 4K exports, AI B-Roll, and NLE
              plugins.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Billing Cycle Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[#12141D] rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  billingCycle === 'annual'
                    ? 'bg-white text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Annual (Save 25%)
              </button>
            </div>

            {/* Currency Switcher */}
            <div className="flex items-center gap-1 p-1 bg-[#12141D] rounded-lg border border-white/10">
              {(['INR', 'USD', 'PKR', 'BDT', 'NPR'] as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                    currency === code
                      ? 'bg-[#FF5A1F] text-zinc-950'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className="bg-[#12141D] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="text-xs text-zinc-400">For solo creators testing short reels</div>
              <h3 className="text-lg font-display font-bold text-white">Starter Free</h3>
              <div className="flex items-baseline gap-1 font-mono tabular-nums">
                <span className="text-3xl font-extrabold text-white">
                  {curr.symbol}
                  {curr.free}
                </span>
                <span className="text-xs text-zinc-400">/ month</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300 pt-3 border-t border-white/[0.07]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Up to 2:00 minutes per video (1 GB max)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>101 Spoken Languages (Native &amp; Roman script)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>3 AI Audio Cleans &amp; Open-Source SFX included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>No watermarks on exported 1080p reels</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => openLoginModal('dashboard')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1A1D29] hover:bg-[#242838] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Sign In to Start Free
            </button>
          </div>

          {/* Creator Pro Tier */}
          <div className="bg-[#161412] border border-[#FF5A1F] rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="text-xs text-[#FF5A1F] font-semibold">
                For daily regional content creators
              </div>
              <h3 className="text-lg font-display font-bold text-white">Creator Pro</h3>
              <div className="flex items-baseline gap-1 font-mono tabular-nums">
                <span className="text-3xl font-extrabold text-white">
                  {curr.symbol}
                  {billingCycle === 'annual' ? curr.creatorAnnual : curr.creatorMonthly}
                </span>
                <span className="text-xs text-zinc-400">/ month</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-200 pt-3 border-t border-white/[0.07]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#FF5A1F] shrink-0" />
                  <span>All 22 Desi + 79 Global languages &amp; Dual-Line Stacking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#FF5A1F] shrink-0" />
                  <span>Automatic Gemini AI B-Roll Cutaways &amp; Context SFX</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#FF5A1F] shrink-0" />
                  <span>25 AI Audio Cleans + Custom Font Uploads (.TTF/.OTF)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#FF5A1F] shrink-0" />
                  <span>1080p/4K 60fps Video, SRT, VTT &amp; JSON Exports</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => openLoginModal('dashboard')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FF5A1F] hover:bg-[#FF6E3A] text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Sign In &amp; Launch Creator Pro
            </button>
          </div>

          {/* Agency Studio Tier */}
          <div className="bg-[#12141D] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="text-xs text-zinc-400">For editing agencies &amp; media teams</div>
              <h3 className="text-lg font-display font-bold text-white">Agency Studio + NLE</h3>
              <div className="flex items-baseline gap-1 font-mono tabular-nums">
                <span className="text-3xl font-extrabold text-white">
                  {curr.symbol}
                  {billingCycle === 'annual' ? curr.proAnnual : curr.proMonthly}
                </span>
                <span className="text-xs text-zinc-400">/ month</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300 pt-3 border-t border-white/[0.07]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Unlimited Transcription Hours &amp; AI B-Roll Credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Premiere Pro (.FCPXML) &amp; DaVinci Resolve Plugins</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Transparent Alpha-Channel (.WEBM) Caption Overlays</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>5 Team Seats &amp; Shared Brand Preset Libraries</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => openLoginModal('dashboard')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1A1D29] hover:bg-[#242838] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Sign In for Agency Studio
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          QUIET FOOTER
         ===================================================================== */}
      <footer className="max-w-[1380px] w-full mx-auto px-6 lg:px-12 py-8 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-300">Merupify</span>
          <span aria-hidden="true">·</span>
          <span>Desi &amp; Global AI Video Captioning, B-Roll &amp; Audio Studio</span>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <a href="#capabilities" className="hover:text-zinc-300 transition-colors">
            Capabilities
          </a>
          <a href="#languages" className="hover:text-zinc-300 transition-colors">
            101 Languages
          </a>
          <a href="#templates" className="hover:text-zinc-300 transition-colors">
            Templates
          </a>
          <a href="#pricing" className="hover:text-zinc-300 transition-colors">
            Pricing
          </a>
          <button
            type="button"
            onClick={() => openLoginModal('dashboard')}
            className="text-[#FF5A1F] hover:underline cursor-pointer"
          >
            Sign In to Dashboard App
          </button>
        </div>
      </footer>

      {/* =====================================================================
          LOCAL LOGIN / SIGN-UP MODAL
         ===================================================================== */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12141D] border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-display font-bold text-white">
                  {authMode === 'login'
                    ? 'Sign In to Merupify Dashboard'
                    : 'Create Your Merupify Account'}
                </h3>
                <p className="text-xs text-zinc-400">
                  Enter any email and any password to open the Dashboard App
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#090A0F] rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-[#FF5A1F] text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-[#FF5A1F] text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={(e) => handleAuthSubmit(e)} className="space-y-3.5">
              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300 block">Your Name</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Sasi Vanga"
                    className="w-full px-3.5 py-2 rounded-lg bg-[#090A0F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300 block">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="any-user@merupify.io"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#090A0F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300 block">
                  Password (any password accepted)
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter any password"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#090A0F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300 block">
                  Default Caption Track
                </label>
                <select
                  value={defaultLangInput}
                  onChange={(e) => setDefaultLangInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#090A0F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                >
                  <option value="Telugu / Tinglish">Telugu / Tinglish (Roman &amp; Native)</option>
                  <option value="Hindi / Hinglish">Hindi / Hinglish (Roman &amp; Devanagari)</option>
                  <option value="Urdu / Roman Urdu">Urdu / Roman Urdu (Nastaliq &amp; Roman)</option>
                  <option value="Tamil / Tanglish">Tamil / Tanglish</option>
                  <option value="Kannada / Kanglish">Kannada / Kanglish</option>
                  <option value="Malayalam / Manglish">Malayalam / Manglish</option>
                  <option value="English">English (Global)</option>
                </select>
              </div>

              {authError && <p className="text-xs text-rose-400 font-medium">{authError}</p>}

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#FF5A1F] hover:bg-[#FF6E3A] text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>
                    {authMode === 'login'
                      ? 'Sign In & Open Dashboard App'
                      : 'Create Account & Open Dashboard App'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleInstantDemoLogin('dashboard')}
                  className="w-full py-2 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Instant 1-Click Demo Login (sasivanga@gmail.com)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   MINIMAL POST-LOGIN UPLOAD HOME ("THE APP" — MerupifyDashboardApp)
   Minimal dark workspace opened immediately after login where the user uploads
   their video or picks a recent video to open the minimal Studio Editing Panel.
   ============================================================================ */

export type MerupifyDashboardTab =
  | 'home'
  | 'tutorials'
  | 'subscription'
  | 'plugins';

interface MerupifyDashboardAppProps {
  user: MerupifyUser;
  userPlan: 'free' | 'creator' | 'pro';
  styleConfig: CaptionStyleConfig;
  presets: StylePreset[];
  audioEnhancer: AudioEnhancerConfig;
  uploadedVideoName: string | null;
  activeSampleReel: SampleReel;
  isGeneratingBroll?: boolean;
  onSelectPlan: (plan: 'free' | 'creator' | 'pro') => void;
  onUpdateStyle: (partial: Partial<CaptionStyleConfig>) => void;
  onUpdateAudioEnhancer: (partial: Partial<AudioEnhancerConfig>) => void;
  onUploadVideoFile: (file: File) => void;
  onOpenRecordCamera: () => void;
  onOpenPrepareMedia: () => void;
  onSelectSampleReelAndEdit: (reel: SampleReel) => void;
  onApplyPresetAndEdit: (preset: StylePreset) => void;
  onSelectTrackAndEdit: (track: TrackKey) => void;
  onGenerateAiBrollNow: () => void;
  onExportPremiereXML: () => void;
  onExportAlphaWebM: () => void;
  onExportSRT: () => void;
  onExportWAV: () => void;
  onOpenStudioEditor: () => void;
  onOpenCostEstimator?: () => void;
  onBackToLandingPage: () => void;
  onLogout: () => void;
}

export const MerupifyDashboardApp: React.FC<MerupifyDashboardAppProps> = ({
  user,
  userPlan,
  audioEnhancer,
  uploadedVideoName,
  activeSampleReel,
  onSelectPlan,
  onUpdateStyle,
  onUploadVideoFile,
  onOpenRecordCamera,
  onSelectSampleReelAndEdit,
  onExportPremiereXML,
  onExportAlphaWebM,
  onOpenStudioEditor,
  onOpenCostEstimator,
  onBackToLandingPage,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<MerupifyDashboardTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [customProjects, setCustomProjects] = useState<DashboardProjectItem[]>(() =>
    SAMPLE_REELS.map((reel, idx) => ({
      id: reel.id,
      title: reel.title,
      dialect: reel.dialect,
      duration: reel.duration,
      aspectRatio: idx === 1 ? '16:9' : idx === 2 ? '1:1' : '9:16',
      primaryTrack: 'tinglish',
      updatedAt: idx === 0 ? 'Sample Reel' : `${idx + 1}d ago`,
      brollCount: 4 + idx,
      sfxEnabled: true,
      status: 'Ready to Export',
      sampleReel: reel,
    }))
  );

  const filteredProjects = customProjects.filter((proj) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      proj.title.toLowerCase().includes(q) ||
      proj.dialect.toLowerCase().includes(q)
    );
  });

  const navItems: {
    id: MerupifyDashboardTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'home', label: 'Home & Upload', icon: Upload },
    { id: 'tutorials', label: 'Tutorials', icon: BookOpen },
    { id: 'subscription', label: 'Manage Subscription', icon: CreditCard },
    { id: 'plugins', label: 'Premiere & Resolve', icon: Cpu },
  ];

  const audioCleansLeft = audioEnhancer.remainingCredits ?? 3;

  return (
    <div className="min-h-screen bg-[#0D0D10] text-zinc-100 flex flex-col lg:flex-row select-none">
      {/* =====================================================================
          MINIMAL LEFT SIDEBAR (236px width — Clean Kalakar Studio Shell)
         ===================================================================== */}
      <aside className="w-full lg:w-[236px] bg-[#121216] border-b lg:border-b-0 lg:border-r border-white/[0.06] p-3.5 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          {/* App Brand Lockup */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={onBackToLandingPage}
              className="flex items-center gap-2.5 text-left cursor-pointer"
              title="Back to Landing Page"
            >
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#FF5722] via-[#FFD60A] to-[#2BAE66] flex items-center justify-center text-zinc-950 font-black text-xs shadow-sm">
                M
              </div>
              <span className="text-sm font-display font-bold text-white tracking-tight">
                Merupify
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenStudioEditor}
              className="lg:hidden px-2.5 py-1 rounded-lg bg-[#2BAE66] text-white text-xs font-semibold cursor-pointer"
            >
              Editor →
            </button>
          </div>

          {/* Search Videos Input (⌘K) */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'home') setActiveTab('home');
              }}
              placeholder="Search by title…"
              className="w-full bg-[#18181E] border border-white/[0.07] rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#2BAE66]"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500">
              ⌘K
            </span>
          </div>

          {/* Minimal Navigation Links */}
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full px-2.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#172A21] text-[#34D399] font-semibold'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Compact Usage Meters & User Profile */}
        <div className="space-y-3 pt-3 mt-4 border-t border-white/[0.06]">
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 font-medium capitalize">{userPlan} Plan</span>
              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className="text-[#34D399] hover:underline text-[11px] font-medium cursor-pointer"
              >
                Upgrade
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Storage</span>
                <span className="font-mono tabular-nums">0.38 / 1.00 GB</span>
              </div>
              <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full w-[38%] bg-zinc-400 rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Transcription</span>
                <span className="font-mono tabular-nums">0:45 / 2:00 mins</span>
              </div>
              <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full w-[37%] bg-[#2BAE66] rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Audio cleans</span>
                <span className="font-mono tabular-nums">{audioCleansLeft} / 3</span>
              </div>
              <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-[#2BAE66] rounded-full"
                  style={{ width: `${Math.min(100, Math.round((audioCleansLeft / 3) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* User Row */}
          <div className="px-2 py-2 rounded-lg bg-[#16161C] border border-white/[0.06] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-200 truncate">{user.name}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              className="p-1 rounded text-zinc-400 hover:text-rose-400 cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          MINIMAL MAIN CONTENT AREA (Upload Video + Recent Videos)
         ===================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Clean Minimal Top Header */}
        <header className="h-12 px-6 border-b border-white/[0.06] bg-[#111115] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <span className="font-semibold text-white">
              {navItems.find((n) => n.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCostEstimator && (
              <button
                type="button"
                onClick={onOpenCostEstimator}
                className="px-3 py-1.5 rounded-lg bg-[#1A1A21] hover:bg-[#24242D] border border-white/[0.08] text-zinc-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Cost Estimator ($ / ₹)
              </button>
            )}
            <button
              type="button"
              onClick={onOpenStudioEditor}
              className="px-3.5 py-1.5 rounded-lg bg-[#2BAE66] hover:bg-[#249957] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Open Studio Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 max-w-4xl w-full mx-auto space-y-8">
          {activeTab === 'home' && (
            <>
              {/* PRIMARY VIDEO UPLOAD DROPZONE (Immediately opens the minimal Studio Editor on upload) */}
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) onUploadVideoFile(f);
                }}
                className={`block rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
                  isDraggingOver
                    ? 'border-[#2BAE66] bg-[#152E23]/30'
                    : 'border-white/15 hover:border-[#2BAE66]/60 bg-[#131318]'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A22] border border-white/10 flex items-center justify-center mx-auto mb-3 text-[#34D399]">
                  <Upload className="w-5 h-5" />
                </div>

                <div className="text-base font-semibold text-white">
                  Drag and drop your video, or click to upload
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Supported formats: MP4, MOV, WebM · Automatically generates word-by-word captions
                  and opens the Studio Editor
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
                  <span className="px-4 py-2 rounded-lg bg-[#2BAE66] hover:bg-[#249957] text-white text-xs font-semibold shadow-sm">
                    Upload Video
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenRecordCamera();
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#1C1C23] hover:bg-[#25252E] border border-white/10 text-xs font-medium text-zinc-200 cursor-pointer"
                  >
                    Record Camera
                  </button>
                </div>

                <input
                  type="file"
                  accept="video/*,audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadVideoFile(f);
                    e.target.value = '';
                  }}
                />
              </label>

              {/* RECENT VIDEOS SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">Recent Videos</h2>
                  <span className="text-xs text-zinc-500">
                    Click any video to open in Studio Editor
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {/* If user already uploaded a video in this session, show it first */}
                  {uploadedVideoName && (
                    <div
                      onClick={onOpenStudioEditor}
                      className="group bg-[#131318] border border-[#2BAE66]/50 hover:border-[#2BAE66] rounded-xl p-3.5 flex flex-col justify-between gap-3 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#172A21] text-[#34D399] flex items-center justify-center shrink-0">
                          <Play className="w-4 h-4 fill-current" />
                        </div>
                        <span className="text-[11px] font-mono text-[#34D399]">Uploaded</span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white truncate">
                          {uploadedVideoName}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          Active session video · Click to edit
                        </div>
                      </div>
                    </div>
                  )}

                  {filteredProjects.map((proj) => {
                    const isActiveSample =
                      !uploadedVideoName && activeSampleReel.id === proj.id;
                    return (
                      <div
                        key={proj.id}
                        onClick={() => {
                          onUpdateStyle({ aspectRatio: proj.aspectRatio });
                          if (proj.sampleReel) {
                            onSelectSampleReelAndEdit(proj.sampleReel);
                          } else {
                            onOpenStudioEditor();
                          }
                        }}
                        className={`group bg-[#131318] border rounded-xl p-3.5 flex flex-col justify-between gap-3 cursor-pointer transition-all ${
                          isActiveSample
                            ? 'border-white/25'
                            : 'border-white/[0.07] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span className="font-mono tabular-nums">{proj.aspectRatio}</span>
                          <span>·</span>
                          <span className="font-mono tabular-nums">{proj.duration}s</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomProjects((prev) =>
                                prev.filter((p) => p.id !== proj.id)
                              );
                            }}
                            title="Remove"
                            className="ml-auto text-zinc-500 hover:text-rose-400 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-[#34D399] transition-colors truncate">
                            {proj.title}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {proj.dialect}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'tutorials' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {KALAKAR_ACADEMY_TUTORIALS.map((tut) => (
                <div
                  key={tut.id}
                  className="p-4 rounded-xl bg-[#131318] border border-white/[0.07] flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="text-[11px] text-zinc-400">
                      <span>{tut.category}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono">{tut.duration}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{tut.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{tut.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenStudioEditor}
                    className="w-full py-2 rounded-lg bg-[#1B1B22] hover:bg-[#25252E] text-xs font-medium text-white cursor-pointer"
                  >
                    Open in Studio Editor
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(
                [
                  {
                    id: 'free',
                    name: 'Free',
                    price: '₹0',
                    desc: 'Max 2:00 mins per video · 101 languages · 3 Audio Cleans',
                  },
                  {
                    id: 'creator',
                    name: 'Creator Pro',
                    price: '₹599/mo',
                    desc: 'All 48 templates · Auto Translation · Behind-Head Depth Mask',
                  },
                  {
                    id: 'pro',
                    name: 'Agency Studio',
                    price: '₹1,499/mo',
                    desc: 'Unlimited 4K exports · Premiere & DaVinci Resolve XML/Alpha',
                  },
                ] as const
              ).map((plan) => {
                const isCurrent = userPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 ${
                      isCurrent
                        ? 'bg-[#14241C] border-[#2BAE66]'
                        : 'bg-[#131318] border-white/[0.08]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="text-sm font-semibold text-white">{plan.name}</div>
                      <div className="text-xl font-bold text-white font-mono">
                        {plan.price}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{plan.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectPlan(plan.id)}
                      className={`w-full py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                        isCurrent
                          ? 'bg-[#2BAE66]/20 text-[#34D399]'
                          : 'bg-[#2BAE66] text-white hover:bg-[#249957]'
                      }`}
                    >
                      {isCurrent ? 'Active Plan' : `Switch to ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'plugins' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-[#131318] border border-white/[0.08] space-y-3">
                <div className="text-sm font-semibold text-white">
                  Adobe Premiere Pro &amp; DaVinci Resolve (.FCPXML)
                </div>
                <p className="text-xs text-zinc-400">
                  Export editable timeline XML with synced caption layers directly into Premiere Pro or Resolve.
                </p>
                <button
                  type="button"
                  onClick={onExportPremiereXML}
                  className="px-4 py-2 rounded-lg bg-[#2BAE66] text-white text-xs font-semibold cursor-pointer"
                >
                  Download .FCPXML Timeline
                </button>
              </div>

              <div className="p-5 rounded-xl bg-[#131318] border border-white/[0.08] space-y-3">
                <div className="text-sm font-semibold text-white">
                  Transparent Alpha Channel Overlay (.WEBM)
                </div>
                <p className="text-xs text-zinc-400">
                  Render caption-only transparent video track to drop onto your V2 lane in any NLE.
                </p>
                <button
                  type="button"
                  onClick={onExportAlphaWebM}
                  className="px-4 py-2 rounded-lg bg-[#1C1C24] hover:bg-[#252530] border border-white/10 text-white text-xs font-semibold cursor-pointer"
                >
                  Export Alpha .WEBM
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

