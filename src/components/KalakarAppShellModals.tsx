import React, { useState } from 'react';
import {
  X,
  Upload,
  Search,
  Sparkles,
  Check,
  Lock,
  Volume2,
  Smile,
  Globe,
  Play,
  BookOpen,
  CreditCard,
  Cpu,
  Gift,
  HelpCircle,
  Monitor,
  Crown,
  HardDrive,
  Clock,
  Wand2,
  FileCode,
  Download,
} from 'lucide-react';
import {
  KALAKAR_ACADEMY_TUTORIALS,
  KALAKAR_DESI_LANGUAGES_22,
  KALAKAR_FOREIGN_LANGUAGES_79,
} from '../data/kalakarOptionsData';
import { SampleReel, TrackKey } from '../types/caption';
import { SAMPLE_REELS } from '../data/presetsAndLanguages';

export type KalakarShellView =
  | 'home'
  | 'academy'
  | 'subscriptions'
  | 'plugins'
  | 'affiliate'
  | 'support'
  | 'desktop'
  | 'aura';

interface PrepareMediaModalProps {
  isOpen: boolean;
  videoFile: File | null;
  videoPreviewUrl: string | null;
  activeSampleTitle: string;
  userPlan: 'free' | 'creator' | 'pro';
  audioCleansRemaining: number;
  onClose: () => void;
  onGenerateTranscription: (options: {
    spokenLanguage: string;
    mappedTrack: TrackKey;
    writingSystem: 'Native' | 'Roman';
    autoTranslate: boolean;
    audioEnhancement: boolean;
    autoEmojis: boolean;
  }) => void;
  onUpgradePlan: () => void;
}

export const PrepareYourMediaModal: React.FC<PrepareMediaModalProps> = ({
  isOpen,
  videoFile,
  videoPreviewUrl,
  activeSampleTitle,
  userPlan,
  audioCleansRemaining,
  onClose,
  onGenerateTranscription,
  onUpgradePlan,
}) => {
  const [langSearch, setLangSearch] = useState('');
  const [selectedLangName, setSelectedLangName] = useState('Telugu');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [writingSystem, setWritingSystem] = useState<'Native' | 'Roman'>('Roman');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [audioEnhancement, setAudioEnhancement] = useState(true);
  const [autoEmojis, setAutoEmojis] = useState(true);

  if (!isOpen) return null;

  const filteredDesi = KALAKAR_DESI_LANGUAGES_22.filter((l) =>
    l.name.toLowerCase().includes(langSearch.toLowerCase())
  );
  const filteredForeign = KALAKAR_FOREIGN_LANGUAGES_79.filter((l) =>
    l.toLowerCase().includes(langSearch.toLowerCase())
  );

  const matchedDesiObj = KALAKAR_DESI_LANGUAGES_22.find(
    (l) => l.name.toLowerCase() === selectedLangName.toLowerCase()
  );

  const resolveTargetTrack = (): TrackKey => {
    const lower = selectedLangName.toLowerCase();
    if (lower === 'telugu') return writingSystem === 'Roman' ? 'tinglish' : 'telugu';
    if (lower === 'hindi' || lower === 'hinglish')
      return writingSystem === 'Roman' ? 'hinglish' : 'hindi';
    if (lower === 'urdu' || lower === 'saraiki' || lower === 'persian' || lower === 'arabic')
      return writingSystem === 'Roman' ? 'roman_urdu' : 'urdu';
    if (lower === 'tamil') return writingSystem === 'Roman' ? 'tanglish' : 'tamil';
    if (lower === 'kannada') return writingSystem === 'Roman' ? 'kanglish' : 'kannada';
    if (lower === 'malayalam')
      return writingSystem === 'Roman' ? 'manglish' : 'malayalam';
    if (matchedDesiObj) return matchedDesiObj.mappedTrack;
    return 'english';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#141419] border border-white/15 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#FF5722]/20 text-[#FF5722] text-[10px] font-bold uppercase tracking-wider">
                Step 3 · Prepare Your Media
              </span>
              <span className="text-[11px] font-mono-tabular text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Ready for processing
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 font-display">
              Prepare Your Media &amp; Language Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Preview & Upload Limits Banner (Section 2 & 3) */}
        <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#1C1C24] border border-white/[0.08]">
          <div className="w-16 h-24 rounded-xl bg-black border border-white/10 overflow-hidden shrink-0 flex items-center justify-center relative">
            {videoPreviewUrl ? (
              <video
                src={videoPreviewUrl}
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-1">
                <Play className="w-5 h-5 text-[#FF5722] mx-auto mb-1" />
                <span className="text-[9px] text-zinc-400 block leading-tight">
                  Sample Reel
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-xs font-bold text-white truncate">
              {videoFile ? videoFile.name : activeSampleTitle}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              ✓ Ready for processing · Supported formats: MP4, MOV
            </div>
            <div className="text-[10px] text-zinc-400 font-mono-tabular">
              {userPlan === 'free'
                ? 'Free-plan limits: max 2:00 minutes · max 1 GB file size'
                : 'Creator/Pro Plan: Unlimited 4K length & priority processing'}
            </div>
          </div>
        </div>

        {/* 3.1 What language is spoken? (Searchable dropdown, 101 languages) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5 relative">
            <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
              <span>What language is spoken?</span>
              <span className="text-[10px] font-mono-tabular text-[#FF5722]">
                101 languages
              </span>
            </label>
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen((v) => !v)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1E1E26] hover:bg-[#252530] border border-white/10 text-left text-xs font-semibold text-white flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <Globe className="w-3.5 h-3.5 text-[#FF5722] shrink-0" />
                <span>{selectedLangName}</span>
              </span>
              <span className="text-[10px] text-zinc-400">▼</span>
            </button>

            {isLangDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#181820] border border-white/15 rounded-2xl shadow-2xl p-2.5 max-h-64 flex flex-col">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder="Search 101 languages (Desi & Foreign)..."
                    className="w-full bg-[#101015] text-xs text-white pl-8 pr-2.5 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5722]"
                  />
                </div>
                <div className="overflow-y-auto space-y-2 pr-1 text-xs">
                  {filteredDesi.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#FF5722] px-2 py-1">
                        Desi &amp; Regional ({filteredDesi.length}/22)
                      </div>
                      {filteredDesi.map((l) => (
                        <button
                          key={`desi-${l.name}`}
                          type="button"
                          onClick={() => {
                            setSelectedLangName(l.name);
                            setIsLangDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between cursor-pointer ${
                            selectedLangName === l.name
                              ? 'bg-[#FF5722] text-white font-bold'
                              : 'text-zinc-200 hover:bg-white/5'
                          }`}
                        >
                          <span>{l.name}</span>
                          <span className="text-[10px] opacity-75 truncate max-w-[110px]">
                            {l.nativeScriptSample}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredForeign.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 px-2 py-1">
                        Foreign ({filteredForeign.length}/79)
                      </div>
                      {filteredForeign.map((lang) => (
                        <button
                          key={`foreign-${lang}`}
                          type="button"
                          onClick={() => {
                            setSelectedLangName(lang);
                            setIsLangDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between cursor-pointer ${
                            selectedLangName === lang
                              ? 'bg-sky-500 text-white font-bold'
                              : 'text-zinc-300 hover:bg-white/5'
                          }`}
                        >
                          <span>{lang}</span>
                          <span className="text-[10px] text-zinc-500">Global</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3.2 Writing system used? (Native vs Roman dropdown) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-200 block">
              Writing system used?
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-[#1E1E26] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setWritingSystem('Roman')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-left ${
                  writingSystem === 'Roman'
                    ? 'bg-[#FF5722] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <div>Roman Script</div>
                <div className="text-[9px] font-normal opacity-85 truncate">
                  e.g. &quot;nenu neeku&quot;
                </div>
              </button>
              <button
                type="button"
                onClick={() => setWritingSystem('Native')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-left ${
                  writingSystem === 'Native'
                    ? 'bg-[#FF5722] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <div>Native Script</div>
                <div className="text-[9px] font-normal opacity-85 truncate">
                  e.g. తెలుగు / हिन्दी
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Live Writing System Preview Pill */}
        {matchedDesiObj && (
          <div className="px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between text-xs">
            <span className="text-zinc-400">
              Preview ({selectedLangName} · {writingSystem}):
            </span>
            <span className="font-bold text-[#30D158]">
              {writingSystem === 'Roman'
                ? matchedDesiObj.romanScriptSample
                : matchedDesiObj.nativeScriptSample}
            </span>
          </div>
        )}

        {/* 3.3 Toggles and extras */}
        <div className="space-y-2">
          {/* Translation (Locked, Creator plan) */}
          <div className="p-3 rounded-2xl bg-[#1A1A22] border border-white/[0.07] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Globe className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Translation</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Creator plan
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  Automatically translate your captions
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (userPlan === 'free') {
                  onUpgradePlan();
                } else {
                  setAutoTranslate((v) => !v);
                }
              }}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer shrink-0 ${
                autoTranslate && userPlan !== 'free'
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-[#262630] text-amber-300 border border-amber-400/30'
              }`}
            >
              {userPlan === 'free' ? 'Unlock Creator' : autoTranslate ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Audio Enhancement (Free: 3 cleans) */}
          <div className="p-3 rounded-2xl bg-[#1A1A22] border border-white/[0.07] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Volume2 className="w-4 h-4 text-[#0A84FF] shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Audio Enhancement</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#0A84FF]/20 text-[#5AC8FA] text-[9px] font-bold">
                    Free: {audioCleansRemaining} cleans
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  Clean up audio quality for better transcription accuracy
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAudioEnhancement((v) => !v)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                audioEnhancement ? 'bg-[#30D158]' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  audioEnhancement ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Emojis (Free — e.g. "paisalu 💰", "roopaayalu 💵", "friends 👥") */}
          <div className="p-3 rounded-2xl bg-[#1A1A22] border border-white/[0.07] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Smile className="w-4 h-4 text-[#30D158] shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Emojis</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                    Free
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  Add engaging emojis automatically (e.g. &quot;paisalu 💰&quot;, &quot;roopaayalu 💵&quot;, &quot;friends 👥&quot;)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoEmojis((v) => !v)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                autoEmojis ? 'bg-[#30D158]' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  autoEmojis ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Primary CTA: Generate Transcription */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onGenerateTranscription({
                spokenLanguage: selectedLangName,
                mappedTrack: resolveTargetTrack(),
                writingSystem,
                autoTranslate,
                audioEnhancement,
                autoEmojis,
              });
            }}
            className="px-5 py-2.5 rounded-xl bg-[#FF5722] hover:bg-[#F4511E] text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Transcription</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface KalakarShellHubModalProps {
  isOpen: boolean;
  activeView: KalakarShellView;
  userPlan: 'free' | 'creator' | 'pro';
  audioCleansRemaining: number;
  onChangeView: (view: KalakarShellView) => void;
  onSelectPlan: (plan: 'free' | 'creator' | 'pro') => void;
  onUploadFile: (file: File) => void;
  onSelectSampleReel: (reel: SampleReel) => void;
  onOpenPrepareMedia: () => void;
  onExportPremiereXML: () => void;
  onExportAlphaWebM: () => void;
  onClose: () => void;
}

export const KalakarShellHubModal: React.FC<KalakarShellHubModalProps> = ({
  isOpen,
  activeView,
  userPlan,
  audioCleansRemaining,
  onChangeView,
  onSelectPlan,
  onUploadFile,
  onSelectSampleReel,
  onOpenPrepareMedia,
  onExportPremiereXML,
  onExportAlphaWebM,
  onClose,
}) => {
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [copiedAffiliate, setCopiedAffiliate] = useState(false);

  if (!isOpen) return null;

  const navItems: {
    id: KalakarShellView;
    label: string;
    route: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: 'home', label: 'Home & Recent Videos', route: '/', icon: Upload },
    { id: 'academy', label: 'Tutorials', route: '/academy', icon: BookOpen },
    {
      id: 'subscriptions',
      label: 'Manage Subscription',
      route: '/subscriptions',
      icon: CreditCard,
      badge: userPlan.toUpperCase(),
    },
    { id: 'plugins', label: 'Manage Plugins', route: '/plugins', icon: Cpu },
    { id: 'affiliate', label: 'Refer & Earn Money', route: '/affiliate', icon: Gift },
    { id: 'desktop', label: 'Desktop App (macOS / Win)', route: '/desktop', icon: Monitor },
    {
      id: 'aura',
      label: 'Aura AI Studio',
      route: '/aura',
      icon: Wand2,
      badge: userPlan === 'free' ? 'PAID' : 'ACTIVE',
    },
    { id: 'support', label: 'Help & Support', route: '/support', icon: HelpCircle },
  ];

  const filteredSamples = SAMPLE_REELS.filter((r) =>
    r.title.toLowerCase().includes(videoSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121217] border border-white/15 rounded-3xl max-w-5xl w-full h-[82vh] max-h-[700px] flex flex-col md:flex-row overflow-hidden shadow-2xl">
        {/* Left Sidebar Navigation (Section 1.1 - 1.12) */}
        <div className="w-full md:w-64 bg-[#17171E] border-b md:border-b-0 md:border-r border-white/[0.08] p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FF5722] flex items-center justify-center text-white font-black text-xs">
                  K
                </div>
                <div>
                  <div className="text-xs font-bold text-white">app.kalakar.io</div>
                  <div className="text-[10px] text-zinc-400">Complete App Shell</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="md:hidden p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1.7 Search videos ("Search by title…", shortcut ⌘K) */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={videoSearchQuery}
                onChange={(e) => {
                  setVideoSearchQuery(e.target.value);
                  if (activeView !== 'home') onChangeView('home');
                }}
                placeholder="Search by title… (⌘K)"
                className="w-full bg-[#101015] text-xs text-white pl-8 pr-8 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5722]"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono-tabular text-zinc-500 bg-white/5 px-1 rounded">
                ⌘K
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeView(item.id)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      active
                        ? 'bg-[#FF5722] text-white shadow-sm'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          active
                            ? 'bg-black/30 text-white'
                            : 'bg-white/10 text-amber-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 1.12 Usage meters (sidebar): Storage, Transcription minutes, Audio cleans */}
          <div className="space-y-2.5 pt-3 border-t border-white/[0.08]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Usage Meters ({userPlan.toUpperCase()})</span>
              <button
                type="button"
                onClick={() => onChangeView('subscriptions')}
                className="text-[#FF5722] hover:underline cursor-pointer"
              >
                Upgrade
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-300">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-sky-400" /> Storage
                </span>
                <span className="font-mono-tabular">0.38 GB / 1.00 GB</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full w-[38%] bg-sky-400 rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-300">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" /> Transcription mins
                </span>
                <span className="font-mono-tabular">0:45 / 2:00 mins</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full w-[37%] bg-emerald-400 rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-300">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-amber-400" /> Audio cleans
                </span>
                <span className="font-mono-tabular">{audioCleansRemaining} / 3 left</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${Math.round((audioCleansRemaining / 3) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white font-display">
                {navItems.find((n) => n.id === activeView)?.label}
              </h3>
              <p className="text-xs text-zinc-400">
                Route: <code className="text-[#FF5722]">{navItems.find((n) => n.id === activeView)?.route}</code>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrepareMedia();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#FF5722] hover:bg-[#F4511E] text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Prepare Your Media (101 Languages)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1.1 HOME: Upload Area + "Recent Videos" grid */}
            {activeView === 'home' && (
              <div className="space-y-6">
                <label className="block border-2 border-dashed border-[#FF5722]/40 hover:border-[#FF5722] rounded-3xl p-8 text-center bg-[#181820]/70 transition-all cursor-pointer">
                  <Upload className="w-8 h-8 text-[#FF5722] mx-auto mb-2" />
                  <div className="text-sm font-bold text-white">
                    Drag and drop, or click to upload
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Free-plan limits: max 2:00 minutes, 1 GB · Supported formats: MP4, MOV
                  </div>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        onUploadFile(f);
                        onClose();
                        onOpenPrepareMedia();
                      }
                    }}
                  />
                </label>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Recent Videos</h4>
                    <span className="text-xs text-zinc-400">
                      Built-in Sample Video (Telugu, Roman Script) + Projects
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredSamples.map((reel) => (
                      <div
                        key={reel.id}
                        className="p-4 rounded-2xl bg-[#1A1A22] border border-white/10 hover:border-[#FF5722]/50 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {reel.title}
                          </div>
                          <div className="text-[11px] text-emerald-400 truncate mt-0.5">
                            {reel.dialect}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-1 font-mono-tabular">
                            Duration: {reel.duration}s · Telugu / Roman Script Ready
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSampleReel(reel);
                            onClose();
                          }}
                          className="px-3 py-2 rounded-xl bg-[#FF5722] hover:bg-[#F4511E] text-white text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Open in Editor
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 1.2 TUTORIALS (/academy) */}
            {activeView === 'academy' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {KALAKAR_ACADEMY_TUTORIALS.map((tut) => (
                  <div
                    key={tut.id}
                    className="p-4 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-[#FF5722]/20 text-[#FF5722] font-bold">
                          {tut.category}
                        </span>
                        <span className="font-mono-tabular text-zinc-400">
                          {tut.duration}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{tut.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{tut.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-[#FF5722]" />
                      <span>Try Feature in Studio Now</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 1.3 MANAGE SUBSCRIPTION (/subscriptions) */}
            {activeView === 'subscriptions' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-[#1A1A24] border border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-zinc-400">Current Active Plan</div>
                    <div className="text-base font-bold text-white uppercase flex items-center gap-2">
                      <span>{userPlan} Plan</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-300">
                    Switch plans anytime below to test Free-plan gates vs Creator/Pro unlocked features!
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(
                    [
                      {
                        id: 'free',
                        name: 'Free Plan',
                        price: '₹0 / $0',
                        features: [
                          'Max 2:00 mins per video, 1 GB',
                          '101 Spoken Languages (Native & Roman)',
                          '3 AI Audio Cleans included',
                          'Auto Emojis (paisalu 💰, friends 👥)',
                        ],
                      },
                      {
                        id: 'creator',
                        name: 'Creator Plan',
                        price: '₹799 / $12 mo',
                        features: [
                          'Unlocks Automatic Translation',
                          'Unlocks all 48 Premium Crown Templates',
                          'Unlocks Subject Depth Masking',
                          '30 mins Transcription + 25 Audio Cleans',
                        ],
                      },
                      {
                        id: 'pro',
                        name: 'Agency Pro + Aura',
                        price: '₹1,999 / $29 mo',
                        features: [
                          'Unlocks Aura AI Viral Hook Engine',
                          'Premiere Pro & DaVinci Resolve Plugins',
                          '4K 60fps & Transparent Alpha Export',
                          'Unlimited Audio Cleans & Custom Fonts',
                        ],
                      },
                    ] as const
                  ).map((plan) => {
                    const isCurrent = userPlan === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                          isCurrent
                            ? 'bg-[#1F1A18] border-[#FF5722]'
                            : 'bg-[#181820] border-white/10'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">
                              {plan.name}
                            </span>
                            {plan.id !== 'free' && (
                              <Crown className="w-4 h-4 text-amber-400" />
                            )}
                          </div>
                          <div className="text-xl font-black text-white font-display">
                            {plan.price}
                          </div>
                          <ul className="space-y-1.5 text-xs text-zinc-300 pt-2">
                            {plan.features.map((f) => (
                              <li key={f} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectPlan(plan.id)}
                          className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-[#FF5722] hover:bg-[#F4511E] text-white'
                          }`}
                        >
                          {isCurrent ? 'Current Plan' : `Switch to ${plan.name}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 1.4 MANAGE PLUGINS (/plugins) */}
            {activeView === 'plugins' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-3">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-purple-400" />
                    <span>Adobe Premiere Pro Plugin (.FCPXML)</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Export multi-track Desi &amp; Roman captions directly into Premiere Pro CC timelines with editable word keyframes.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onExportPremiereXML();
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Export Premiere Pro .FCPXML Now
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-3">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-sky-400" />
                    <span>DaVinci Resolve &amp; Alpha Overlay (.WEBM)</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Render a transparent alpha-channel caption overlay or import FCPXML directly into DaVinci Resolve Edit/Cut pages.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onExportAlphaWebM();
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Export Transparent Alpha .WEBM
                  </button>
                </div>
              </div>
            )}

            {/* 1.5 REFER & EARN MONEY (/affiliate) */}
            {activeView === 'affiliate' && (
              <div className="p-6 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-4">
                <h4 className="text-base font-bold text-white">
                  Kalakar Affiliate Program — Earn 30% Recurring Commission
                </h4>
                <p className="text-xs text-zinc-300">
                  Share your Kalakar referral link with fellow Desi creators, video editors, and YouTubers. Earn 30% on every Creator or Pro subscription.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://app.kalakar.io/?via=creator-studio"
                    className="flex-1 bg-[#101015] text-xs font-mono-tabular text-zinc-200 px-3.5 py-2.5 rounded-xl border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        'https://app.kalakar.io/?via=creator-studio'
                      );
                      setCopiedAffiliate(true);
                      setTimeout(() => setCopiedAffiliate(false), 2500);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#FF5722] text-white text-xs font-bold cursor-pointer"
                  >
                    {copiedAffiliate ? 'Copied!' : 'Copy Referral Link'}
                  </button>
                </div>
              </div>
            )}

            {/* 1.8 DESKTOP APP (macOS & Windows) */}
            {activeView === 'desktop' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-3">
                  <div className="text-sm font-bold text-white">
                    Kalakar Desktop for macOS (Apple Silicon M1/M2/M3/M4 &amp; Intel)
                  </div>
                  <p className="text-xs text-zinc-400">
                    Native Metal hardware acceleration for instant 4K ProRes &amp; Alpha exports.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-bold cursor-pointer"
                  >
                    Download for macOS (.DMG)
                  </button>
                </div>
                <div className="p-5 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-3">
                  <div className="text-sm font-bold text-white">
                    Kalakar Desktop for Windows (64-bit RTX / DirectX)
                  </div>
                  <p className="text-xs text-zinc-400">
                    High-speed local GPU rendering and direct folder watch for editors.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-[#0A84FF] text-white text-xs font-bold cursor-pointer"
                  >
                    Download for Windows (.EXE)
                  </button>
                </div>
              </div>
            )}

            {/* 1.10 AURA */}
            {activeView === 'aura' && (
              <div className="p-6 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-3 text-center">
                <Wand2 className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="text-base font-bold text-white">
                  Kalakar Aura — AI Viral Hook &amp; B-Roll Director
                </h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {userPlan === 'free'
                    ? 'Aura is available on paid plans. Upgrade to Creator or Pro to unlock automatic AI B-roll cues and hook scoring.'
                    : 'Aura is unlocked on your plan! Auto-Hero NLP and emphasis scoring are active in the editor.'}
                </p>
                {userPlan === 'free' && (
                  <button
                    type="button"
                    onClick={() => onSelectPlan('creator')}
                    className="px-5 py-2.5 rounded-xl bg-[#FF5722] text-white text-xs font-bold cursor-pointer"
                  >
                    Unlock Aura (Switch to Creator Plan)
                  </button>
                )}
              </div>
            )}

            {/* 1.6 HELP & SUPPORT */}
            {activeView === 'support' && (
              <div className="p-6 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-white">
                  Kalakar Help &amp; Creator Support
                </h4>
                <p className="text-xs text-zinc-400">
                  Need help with Telugu/Hindi/Urdu Roman transliteration, custom fonts, or Premiere Pro XML exports? Everything is built right into the 3-column workspace.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
