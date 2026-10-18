import React, { useState } from 'react';
import {
  X,
  Search,
  Sparkles,
  Lock,
  Volume2,
  Smile,
  Globe,
  Play,
} from 'lucide-react';
import {
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
  autoEmojis: boolean;
  onChangeAutoEmojis: (enabled: boolean) => void;
  audioEnhancement: boolean;
  onChangeAudioEnhancement: (enabled: boolean) => void;
  autoHeroNLP: boolean;
  onChangeAutoHeroNLP: (enabled: boolean) => void;
  removePunctuation: boolean;
  onChangeRemovePunctuation: (enabled: boolean) => void;
  onUploadNewFile?: (file: File) => void;
  onClose: () => void;
  onGenerateTranscription: (options: {
    spokenLanguage: string;
    mappedTrack: TrackKey;
    writingSystem: 'Native' | 'Roman';
    autoTranslate: boolean;
    audioEnhancement: boolean;
    autoEmojis: boolean;
    autoHeroNLP: boolean;
    removePunctuation: boolean;
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
  autoEmojis,
  onChangeAutoEmojis,
  audioEnhancement,
  onChangeAudioEnhancement,
  autoHeroNLP,
  onChangeAutoHeroNLP,
  removePunctuation,
  onChangeRemovePunctuation,
  onUploadNewFile,
  onClose,
  onGenerateTranscription,
  onUpgradePlan,
}) => {
  const [langSearch, setLangSearch] = useState('');
  const [selectedLangName, setSelectedLangName] = useState('Telugu');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [writingSystem, setWritingSystem] = useState<'Native' | 'Roman'>('Roman');
  const [autoTranslate, setAutoTranslate] = useState(false);

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
      <div className="bg-[#121615] border border-[#232926] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2321] pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#162a23] text-emerald-400 border border-[#1f4035] text-[10px] font-bold uppercase tracking-wider">
                Prepare Your Media
              </span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Ready for processing
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Prepare Your Media &amp; Language Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#171b19] hover:bg-[#1f2523] text-gray-400 hover:text-white cursor-pointer border border-[#232926]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Preview & Upload Limits Banner */}
        <div className="flex items-center gap-4 p-3.5 rounded-xl bg-[#161a19] border border-[#232926]">
          <div className="w-16 h-24 rounded-lg bg-black border border-[#232926] overflow-hidden shrink-0 flex items-center justify-center relative">
            {videoPreviewUrl ? (
              <video
                src={videoPreviewUrl}
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-1">
                <Play className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-[9px] text-gray-400 block leading-tight">
                  Sample Reel
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-white truncate">
                {videoFile ? videoFile.name : activeSampleTitle}
              </div>
              {onUploadNewFile && (
                <label className="px-2.5 py-1 rounded-lg bg-[#1d2422] hover:bg-[#252e2b] border border-[#2e3834] text-[10px] font-bold text-emerald-400 cursor-pointer shrink-0">
                  Change Video
                  <input
                    type="file"
                    accept="video/*,audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUploadNewFile(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              ✓ Ready for processing · Supported formats: MP4, MOV
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              {userPlan === 'free'
                ? 'Free-plan limits: max 2:00 minutes · max 1 GB file size'
                : 'Creator/Pro Plan: Unlimited 4K length & priority processing'}
            </div>
          </div>
        </div>

        {/* Language & Writing System */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5 relative">
            <label className="text-xs font-semibold text-gray-200 flex items-center justify-between">
              <span>What language is spoken?</span>
              <span className="text-[10px] font-mono text-emerald-400">
                101 languages
              </span>
            </label>
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen((v) => !v)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#161a19] hover:bg-[#1f2523] border border-[#232926] text-left text-xs font-semibold text-white flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{selectedLangName}</span>
              </span>
              <span className="text-[10px] text-gray-400">▼</span>
            </button>

            {isLangDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#121615] border border-[#232926] rounded-xl shadow-2xl p-2.5 max-h-64 flex flex-col">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder="Search 101 languages..."
                    className="w-full bg-[#0c0f0e] text-xs text-white pl-8 pr-2.5 py-1.5 rounded-lg border border-[#232926] focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="overflow-y-auto space-y-2 pr-1 text-xs">
                  {filteredDesi.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-1">
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
                              ? 'bg-[#162a23] text-emerald-400 font-bold border border-[#1f4035]'
                              : 'text-gray-200 hover:bg-white/5'
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
                        Global ({filteredForeign.length}/79)
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
                              ? 'bg-[#162a23] text-emerald-400 font-bold'
                              : 'text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          <span>{lang}</span>
                          <span className="text-[10px] text-gray-500">Global</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Writing system */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-200 block">
              Writing system used?
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-[#161a19] p-1 rounded-lg border border-[#232926]">
              <button
                type="button"
                onClick={() => setWritingSystem('Roman')}
                className={`py-1.5 px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer text-left ${
                  writingSystem === 'Roman'
                    ? 'bg-[#10b981] text-[#071d15] shadow-sm'
                    : 'text-gray-400 hover:text-white'
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
                className={`py-1.5 px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer text-left ${
                  writingSystem === 'Native'
                    ? 'bg-[#10b981] text-[#071d15] shadow-sm'
                    : 'text-gray-400 hover:text-white'
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

        {/* Toggles */}
        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-[#161a19] border border-[#232926] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Translation</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#122820] text-emerald-400 border border-[#1b3d30] text-[9px] font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Creator plan
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 truncate">
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
              className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer shrink-0 ${
                autoTranslate && userPlan !== 'free'
                  ? 'bg-[#10b981] text-[#071d15]'
                  : 'bg-[#1f2523] text-emerald-400 border border-[#2b332f]'
              }`}
            >
              {userPlan === 'free' ? 'Unlock Creator' : autoTranslate ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-[#161a19] border border-[#232926] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Audio Enhancement</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#122820] text-emerald-400 text-[9px] font-bold">
                    Free: {audioCleansRemaining} cleans
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 truncate">
                  Clean up audio quality for better transcription accuracy
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChangeAudioEnhancement(!audioEnhancement)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                audioEnhancement ? 'bg-[#10b981]' : 'bg-[#2e3744]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  audioEnhancement ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-[#161a19] border border-[#232926] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Smile className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Emojis</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#122820] text-emerald-400 text-[9px] font-bold">
                    {autoEmojis ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 truncate">
                  {autoEmojis
                    ? 'Add engaging emojis automatically to captions'
                    : 'Emojis are completely disabled in caption creation'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChangeAutoEmojis(!autoEmojis)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                autoEmojis ? 'bg-[#10b981]' : 'bg-[#2e3744]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  autoEmojis ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Additional Caption Creation Settings Row (Auto Emphasis & Punctuation) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-[#161a19] border border-[#232926] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white truncate">
                  Auto Emphasis
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  Highlight power words
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChangeAutoHeroNLP(!autoHeroNLP)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                  autoHeroNLP ? 'bg-[#10b981]' : 'bg-[#2e3744]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    autoHeroNLP ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-[#161a19] border border-[#232926] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white truncate">
                  Remove Punctuation
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  Clean reel captions
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChangeRemovePunctuation(!removePunctuation)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                  removePunctuation ? 'bg-[#10b981]' : 'bg-[#2e3744]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    removePunctuation ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#161a19] hover:bg-[#1f2523] border border-[#232926] text-xs font-semibold text-gray-300 cursor-pointer"
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
                autoHeroNLP,
                removePunctuation,
              });
            }}
            className="px-5 py-2 rounded-lg bg-[#10b981] hover:bg-emerald-500 text-[#071d15] text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
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

const STITCH_ACADEMY_LESSONS = [
  {
    id: 'l1',
    badgeTitle: 'Caption Unlock Feature',
    title: 'Caption Unlock Feature in Merupify',
    duration: '6:59',
    isNew: true,
    type: 'standard',
  },
  {
    id: 'l2',
    badgeTitle: 'Edit Videos Inside Merupify',
    title: 'Edit Videos Inside Merupify',
    duration: '16:44',
    type: 'standard',
  },
  {
    id: 'l3',
    badgeTitle: 'Replace Video',
    title: 'How to Replace Videos in Merupify?',
    duration: '3:53',
    type: 'standard',
  },
  {
    id: 'l4',
    badgeTitle: 'Word vs Line Control',
    title: 'Word vs Line Level Control in Merupify',
    duration: '3:49',
    type: 'standard',
  },
  {
    id: 'l5',
    badgeTitle: 'Caption Delay Control',
    title: 'How to solve Caption Delay? | Merupify App',
    duration: '3:26',
    type: 'standard',
  },
  {
    id: 'l6',
    badgeTitle: 'Premiere Pro',
    title: 'Introducing Merupify plugin for Premiere Pro',
    duration: '7:23',
    type: 'premiere',
  },
  {
    id: 'l7',
    badgeTitle: 'DaVinci Resolve',
    title: 'Merupify is now available in Davinci Resolve',
    duration: '4:34',
    type: 'davinci',
  },
  {
    id: 'l8',
    badgeTitle: 'How to save a Preset',
    title: 'How to save Presets of Templates & Settings!',
    duration: '2:56',
    type: 'standard',
  },
  {
    id: 'l9',
    badgeTitle: 'Understanding Transitions',
    title: 'A Guide to Transitions Panel',
    duration: '3:28',
    type: 'standard',
  },
  {
    id: 'l10',
    badgeTitle: 'How to add Custom Fonts',
    title: 'Add any Custom Font in Merupify - Breakdown',
    duration: '2:12',
    type: 'standard',
  },
  {
    id: 'l11',
    badgeTitle: 'Vertical VS Horizontal Video',
    title: 'Understanding Vertical vs Horizontal Video in Merupify',
    duration: '2:14',
    type: 'standard',
  },
  {
    id: 'l12',
    badgeTitle: 'Alpha Channel VS Srt',
    title: 'Difference Between Alpha Channel & SRT - Render Settings',
    duration: '4:14',
    type: 'standard',
  },
  {
    id: 'l13',
    badgeTitle: 'How to Customise my UI',
    title: 'How to Customise UI of Merupify',
    duration: '2:00',
    type: 'standard',
  },
  {
    id: 'l14',
    badgeTitle: 'Customise Templates',
    title: 'How to Customise Templates',
    duration: '3:39',
    type: 'standard',
  },
  {
    id: 'l15',
    badgeTitle: 'Manage Billing in Merupify',
    title: 'How to Manage Billings in Merupify (Including Upgrading & Downgrading Packages)',
    duration: '2:15',
    type: 'standard',
  },
  {
    id: 'l16',
    badgeTitle: 'Optimal Render Settings for Social Media',
    title: 'Best Render Settings for Social Media',
    duration: '2:17',
    type: 'standard',
  },
  {
    id: 'l17',
    badgeTitle: 'What is Low Res Preview',
    title: 'What is Low Res Preview?',
    duration: '1:52',
    type: 'standard',
  },
  {
    id: 'l18',
    badgeTitle: 'Caption Tools',
    title: 'A guide to Caption Tools Section // Merupify',
    duration: '10:37',
    type: 'standard',
  },
  {
    id: 'l19',
    badgeTitle: 'Emphasize & Spotlight',
    title: 'What is Emphasis & Spotlight in Merupify?',
    duration: '3:50',
    type: 'standard',
  },
  {
    id: 'l20',
    badgeTitle: 'Find and Replace',
    title: 'Find & Replace words in your Project // Merupify',
    duration: '4:23',
    type: 'standard',
  },
  {
    id: 'l21',
    badgeTitle: 'Line Level Controls',
    title: 'How to Control Lines Separately in Merupify / Line Level Controls',
    duration: '10:18',
    type: 'standard',
  },
  {
    id: 'l22',
    badgeTitle: 'Roman Vs Native',
    title: "Roman vs Native, what's the difference?",
    duration: '3:17',
    type: 'standard',
  },
  {
    id: 'l23',
    badgeTitle: 'AI Audio Cleaning',
    title: 'State of the Art Audio Cleaning inside Merupify!',
    duration: '3:16',
    type: 'standard',
  },
  {
    id: 'l24',
    badgeTitle: 'How to add captions manually',
    title: 'How to add captions manually inside Merupify?',
    duration: '1:39',
    type: 'standard',
  },
];

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
  const [lessonSearchQuery, setLessonSearchQuery] = useState('');
  const [subTab, setSubTab] = useState<
    'overview' | 'web' | 'plugin' | 'payment' | 'history'
  >('overview');
  const [generatedLicenseKey, setGeneratedLicenseKey] = useState<string | null>(
    null
  );
  const [copiedAffiliate, setCopiedAffiliate] = useState(false);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(
    activeView === 'support'
  );

  if (!isOpen) return null;

  const filteredLessons = STITCH_ACADEMY_LESSONS.filter((l) =>
    l.title.toLowerCase().includes(lessonSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0c0b] text-[#9ca3af] font-sans antialiased flex overflow-hidden select-none">
      {/* BEGIN: LeftSidebar (Exact Stitch 260px Sidebar) */}
      <aside className="w-[250px] flex-shrink-0 bg-[#121615] border-r border-[#1e2321] flex flex-col justify-between h-full px-3.5 py-4">
        {/* Top Nav & Brand Section */}
        <div className="flex flex-col space-y-6">
          {/* Brand Logo */}
          <div className="px-2.5 pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center space-x-0.5 text-white tracking-wide text-2xl font-bold font-sans cursor-pointer"
              title="Return to Merupify Editor"
            >
              <span className="text-white">Mer</span>
              <span className="text-emerald-400 font-extrabold">u</span>
              <span className="text-white">pify</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-sm font-medium">
            {/* Home */}
            <button
              type="button"
              onClick={() => onChangeView('home')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                activeView === 'home'
                  ? 'bg-[#162a23] text-emerald-400 border border-[#1f4035] font-semibold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1a201e]'
              }`}
            >
              <svg
                className="w-[18px] h-[18px] stroke-current fill-none stroke-[2]"
                viewBox="0 0 24 24"
              >
                <path
                  d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[13.5px]">Home</span>
            </button>

            {/* Tutorials */}
            <button
              type="button"
              onClick={() => onChangeView('academy')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                activeView === 'academy'
                  ? 'bg-[#162a23] text-emerald-400 border border-[#1f4035] font-semibold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1a201e]'
              }`}
            >
              <svg
                className="w-[18px] h-[18px] stroke-current fill-none stroke-[2]"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[13.5px]">Tutorials</span>
            </button>

            {/* Manage Subscription */}
            <button
              type="button"
              onClick={() => onChangeView('subscriptions')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                activeView === 'subscriptions'
                  ? 'bg-[#162a23] text-emerald-400 border border-[#1f4035] font-semibold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1a201e]'
              }`}
            >
              <svg
                className="w-[18px] h-[18px] stroke-current fill-none stroke-[2]"
                viewBox="0 0 24 24"
              >
                <path
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[13.5px]">Manage Subscription</span>
            </button>

            {/* Manage Plugins */}
            <button
              type="button"
              onClick={() => onChangeView('plugins')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                activeView === 'plugins'
                  ? 'bg-[#162a23] text-emerald-400 border border-[#1f4035] font-semibold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1a201e]'
              }`}
            >
              <svg
                className="w-[18px] h-[18px] stroke-current fill-none stroke-[2]"
                viewBox="0 0 24 24"
              >
                <path
                  d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[13.5px]">Manage Plugins</span>
            </button>

            {/* Refer & Earn Money */}
            <button
              type="button"
              onClick={() => onChangeView('affiliate')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                activeView === 'affiliate'
                  ? 'bg-[#162a23] text-emerald-400 border border-[#1f4035] font-semibold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1a201e]'
              }`}
            >
              <svg
                className="w-[18px] h-[18px] stroke-current fill-none stroke-[2]"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[13.5px]">Refer &amp; Earn Money</span>
            </button>

            {/* Help & Support */}
            <button
              type="button"
              onClick={() => {
                onChangeView('support');
                setIsSupportChatOpen(true);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                activeView === 'support'
                  ? 'bg-[#162a23] text-emerald-400 border border-[#1f4035] font-semibold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1a201e]'
              }`}
            >
              <svg
                className="w-[18px] h-[18px] stroke-current fill-none stroke-[2]"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[13.5px]">Help &amp; Support</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Section (Desktop App + Free Quotas) */}
        <div className="space-y-4 pt-4 border-t border-[#1a1f1d]">
          {/* Desktop App Banner */}
          <div className="bg-[#171b19] border border-[#212724] rounded-xl p-3">
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span>Desktop App</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-2.5">
              Use Merupify on your own computer.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center space-x-1 bg-emerald-500 hover:bg-emerald-600 text-[#091510] font-semibold py-1.5 px-2 rounded-md transition-all shadow-sm cursor-pointer"
              >
                <span>⬇ macOS</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center space-x-1 bg-[#1a201d] hover:bg-[#232b27] border border-[#2b332f] text-gray-300 font-medium py-1.5 px-2 rounded-md transition-all cursor-pointer"
              >
                <span>⊞ Windows</span>
              </button>
            </div>
          </div>

          {/* Plan Quota Card */}
          <div className="bg-[#171b19] border border-[#212724] rounded-xl p-3 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold tracking-wider text-[12px] uppercase">
                {userPlan}
              </span>
              <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-[#122820] border border-[#1b3d30] px-1.5 py-0.5 rounded">
                Monthly
              </span>
            </div>
            {/* Storage */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">Storage</span>
                <span className="text-gray-300 font-mono">
                  <span className="text-emerald-400">&lt; 0.1 GB</span> / 5.0 GB
                </span>
              </div>
              <div className="w-full bg-[#232a26] h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[4%] rounded-full" />
              </div>
            </div>
            {/* Transcription */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">Transcription</span>
                <span className="text-emerald-400 font-mono font-medium">
                  4.5 mins <span className="text-gray-400 font-normal">left</span>
                </span>
              </div>
              <div className="w-full bg-[#232a26] h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[35%] rounded-full" />
              </div>
            </div>
            {/* Audio Clean */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">Audio Clean</span>
                <span className="text-emerald-400 font-mono font-medium">
                  1 <span className="text-gray-400">/ 3</span>
                </span>
              </div>
              <div className="w-full bg-[#232a26] h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[33%] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </aside>
      {/* END: LeftSidebar */}

      {/* BEGIN: MainContentWrapper */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0c0f0e] relative overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#1b201e] px-7 flex items-center justify-between flex-shrink-0">
          {/* Left side: Search and Desktop App */}
          <div className="flex items-center space-x-3">
            {activeView !== 'subscriptions' && activeView !== 'academy' && (
              <div className="relative w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={videoSearchQuery}
                  onChange={(e) => setVideoSearchQuery(e.target.value)}
                  placeholder="Search by title..."
                  className="w-full bg-[#161a19] text-sm text-gray-200 placeholder-gray-500 pl-9 pr-12 py-1.5 rounded-lg border border-[#232926] focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                  <span className="text-[11px] text-gray-500 font-sans">(⌘K)</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex items-center space-x-1.5 bg-[#161a19] hover:bg-[#1f2523] text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#232926] transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span>Desktop App</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center space-x-1.5 bg-[#162a23] hover:bg-[#1f3b31] text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#1f4035] transition-colors cursor-pointer"
            >
              <span>← Back to Studio Editor</span>
            </button>
          </div>

          {/* Right side: Upgrade, Aura status, User profile */}
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => onChangeView('subscriptions')}
              className="bg-[#10b981] hover:bg-emerald-500 text-[#071d15] text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center space-x-1 transition-colors shadow-sm cursor-pointer"
            >
              <span>Upgrade</span>
              <svg
                className="w-3.5 h-3.5 stroke-[2.5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => onChangeView('subscriptions')}
              className="flex items-center space-x-1.5 text-gray-400 text-xs font-medium cursor-pointer hover:text-gray-200 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>Aura</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center space-x-1.5 cursor-pointer bg-[#161a19] hover:bg-[#1f2523] border border-[#232926] p-1 pr-2 rounded-full transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-stone-700 overflow-hidden flex items-center justify-center border border-gray-600">
                <span className="text-[10px] font-bold text-emerald-400">M</span>
              </div>
              <svg
                className="w-3 h-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M19 9l-7 7-7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* 1. HOME VIEW (Exact match to home page afterlogin.png) */}
          {(activeView === 'home' || activeView === 'desktop' || activeView === 'aura') && (
            <div className="space-y-7">
              <label className="w-full border border-dashed border-[#232926] hover:border-emerald-500/50 bg-[#141716]/60 rounded-xl py-14 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                <div className="w-12 h-12 mb-3.5 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-emerald-400 transition-colors">
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M12 8v4m0 0l-2-2m2 2l2-2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.6"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-200 mb-1 group-hover:text-white">
                  Drop your videos here or click to upload
                </h3>
                <p className="text-xs text-gray-500 font-normal">
                  Max: 2:00 minutes, 1GB
                </p>
                <p className="text-xs text-gray-500 font-normal mt-0.5">
                  Supports: MP4, MOV
                </p>
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

              {/* Recent Videos Gallery Section */}
              <section className="space-y-4">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Recent Videos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {/* Video Card 1: Ipkesg */}
                  <div
                    onClick={() => {
                      if (SAMPLE_REELS[0]) onSelectSampleReel(SAMPLE_REELS[0]);
                      onClose();
                    }}
                    className="group flex flex-col space-y-2.5 cursor-pointer"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#181d1b] border border-[#232926] shadow-sm">
                      <div className="w-full h-full bg-[#201d19] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                        <div className="absolute -right-6 top-6 w-32 h-32 rounded-full bg-amber-600/20 blur-2xl" />
                        <div className="absolute -left-6 bottom-6 w-32 h-32 rounded-full bg-emerald-600/10 blur-2xl" />
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-[#3d322c] border border-amber-900/40 mb-1" />
                          <div className="w-28 h-20 bg-[#252221] rounded-t-2xl border border-stone-800" />
                        </div>
                      </div>
                      <div className="absolute inset-0 z-20 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                          <svg
                            className="w-5 h-5 fill-current ml-0.5 text-white"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start justify-between px-0.5">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-gray-100 group-hover:text-emerald-400 transition-colors">
                          Ipkesg
                        </h4>
                        <p className="text-xs text-gray-500 font-normal">
                          2 days ago • Telugu (Roman)
                        </p>
                      </div>
                      <span className="text-gray-500 hover:text-white p-1">⋮</span>
                    </div>
                  </div>

                  {/* Video Card 2: Welcome to Merupify */}
                  <div
                    onClick={() => {
                      if (SAMPLE_REELS[1]) onSelectSampleReel(SAMPLE_REELS[1]);
                      onClose();
                    }}
                    className="group flex flex-col space-y-2.5 cursor-pointer"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#181d1b] border border-[#232926] shadow-sm">
                      <div className="w-full h-full bg-[#1b231f] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                        <div className="absolute -left-4 top-4 w-28 h-28 rounded-full bg-amber-500/25 blur-xl" />
                        <div className="absolute right-0 bottom-8 w-24 h-24 rounded-full bg-emerald-800/30 blur-xl" />
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-[#332b25] border border-stone-700 mb-1" />
                          <div className="w-32 h-20 bg-[#1b3d2f] rounded-t-2xl border border-emerald-800/50" />
                        </div>
                        <div className="absolute bottom-5 inset-x-5 h-5 border border-amber-500/80 rounded bg-amber-500/10 z-20 pointer-events-none" />
                      </div>
                      <div className="absolute inset-0 z-20 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                          <svg
                            className="w-5 h-5 fill-current ml-0.5 text-white"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start justify-between px-0.5">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-gray-100 group-hover:text-emerald-400 transition-colors">
                          Welcome to Merupify
                        </h4>
                        <p className="text-xs text-gray-500 font-normal">
                          2 days ago • English (Native)
                        </p>
                      </div>
                      <span className="text-gray-500 hover:text-white p-1">⋮</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* 2. TUTORIALS / ACADEMY VIEW (Exact match to tutorial page.png) */}
          {activeView === 'academy' && (
            <div className="max-w-[1500px] mx-auto space-y-10">
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4 pr-4">
                  <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-none">
                    <span className="text-white block">Merupify</span>
                    <span className="text-[#2ed8a2] block mt-1">Academy</span>
                  </h1>
                  <p className="text-gray-400 text-base max-w-md font-normal leading-relaxed pt-2">
                    Learn to use Merupify from the most Famous Editor of South
                    Asia &amp; Founder of Editing Skool
                  </p>
                </div>

                <div className="lg:col-span-6">
                  <div
                    onClick={onClose}
                    className="rounded-2xl border border-emerald-950/60 shadow-2xl relative aspect-[16/9] flex flex-col justify-between p-6 overflow-hidden cursor-pointer"
                    style={{
                      background:
                        'radial-gradient(circle at 20% 30%, rgba(45, 212, 191, 0.35) 0%, rgba(6, 40, 32, 0.95) 60%, #06090c 100%)',
                    }}
                  >
                    <div className="absolute right-12 bottom-6 opacity-30 select-none pointer-events-none">
                      <svg
                        className="text-emerald-400"
                        fill="currentColor"
                        height="90"
                        viewBox="0 0 100 80"
                        width="120"
                      >
                        <path d="M20 0 L5 60 L20 60 L28 28 L40 60 L55 60 L38 0 Z" />
                        <path d="M60 0 L45 60 L60 60 L68 28 L80 60 L95 60 L78 0 Z" />
                      </svg>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-white text-xl font-bold tracking-tight">
                        Merupify Overview
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-3 font-medium">
                        Made by Desi Creators,
                        <br />
                        For Desi Creators
                      </p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white pl-1 shadow-lg">
                        <svg
                          className="w-6 h-6 fill-current text-white"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="relative z-10 pt-4">
                      <div className="flex items-center gap-3 text-xs text-gray-300">
                        <svg
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <div className="flex-1 bg-white/20 h-1 rounded-full relative flex items-center">
                          <div className="bg-white h-1 rounded-full w-[28%]" />
                          <div className="w-2.5 h-2.5 bg-white rounded-full -ml-1 shadow" />
                        </div>
                        <span className="bg-[#112520] text-emerald-400 text-[11px] px-2 py-0.5 rounded font-mono font-medium">
                          05:50
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Video Library
                  </h2>
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={lessonSearchQuery}
                      onChange={(e) => setLessonSearchQuery(e.target.value)}
                      placeholder="Search by lesson"
                      className="w-full bg-[#13161d] text-xs text-gray-200 placeholder-gray-500 rounded-full pl-9 pr-4 py-2 border border-[#202633] focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      onClick={onClose}
                      className="group cursor-pointer"
                    >
                      <div
                        className="rounded-xl border border-emerald-950/40 aspect-[16/9] relative p-3.5 flex flex-col justify-between group-hover:border-emerald-700/60 transition shadow-lg overflow-hidden"
                        style={{
                          background:
                            'radial-gradient(circle at 10% 20%, rgba(45, 212, 191, 0.28) 0%, rgba(8, 20, 18, 0.95) 55%, #07090c 100%)',
                        }}
                      >
                        {lesson.type === 'premiere' ? (
                          <div className="flex-1 flex items-center justify-center gap-3">
                            <svg
                              className="text-emerald-400"
                              fill="currentColor"
                              height="28"
                              viewBox="0 0 100 80"
                              width="35"
                            >
                              <path d="M20 0 L5 60 L20 60 L28 28 L40 60 L55 60 L38 0 Z" />
                              <path d="M60 0 L45 60 L60 60 L68 28 L80 60 L95 60 L78 0 Z" />
                            </svg>
                            <div className="w-10 h-10 rounded-lg bg-[#00005b] border border-[#ea77ff]/40 flex items-center justify-center text-[#ea77ff] font-extrabold text-base shadow-md">
                              Pr
                            </div>
                          </div>
                        ) : lesson.type === 'davinci' ? (
                          <div className="flex-1 flex items-center justify-center gap-3">
                            <svg
                              className="text-emerald-400"
                              fill="currentColor"
                              height="28"
                              viewBox="0 0 100 80"
                              width="35"
                            >
                              <path d="M20 0 L5 60 L20 60 L28 28 L40 60 L55 60 L38 0 Z" />
                              <path d="M60 0 L45 60 L60 60 L68 28 L80 60 L95 60 L78 0 Z" />
                            </svg>
                            <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 via-pink-500 to-amber-400 flex items-center justify-center p-1">
                                <div className="w-2.5 h-2.5 bg-black rounded-full" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-200 leading-tight">
                                {lesson.badgeTitle}
                              </span>
                              {lesson.isNew && (
                                <span className="bg-[#12382c] border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] text-gray-400">
                              Made by Desi Creators,
                              <br />
                              For Desi Creators
                            </p>
                            <div className="absolute right-3 bottom-2 text-emerald-500/30">
                              <svg
                                fill="currentColor"
                                height="35"
                                viewBox="0 0 100 80"
                                width="50"
                              >
                                <path d="M20 0 L5 60 L20 60 L28 28 L40 60 L55 60 L38 0 Z" />
                                <path d="M60 0 L45 60 L60 60 L68 28 L80 60 L95 60 L78 0 Z" />
                              </svg>
                            </div>
                          </>
                        )}
                        <span className="absolute bottom-2 right-2 bg-black/80 font-mono text-[10px] text-gray-300 px-1.5 py-0.5 rounded">
                          {lesson.duration}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-gray-300 mt-2.5 group-hover:text-emerald-400 transition leading-snug">
                        {lesson.title}
                      </h4>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* 3. MANAGE SUBSCRIPTION VIEW (Exact match to manage subscption.png) */}
          {activeView === 'subscriptions' && (
            <div className="max-w-5xl space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Subscription
                </h1>
                <p className="text-sm text-neutral-400 mt-1.5 font-normal">
                  Manage your web and plugin plans, payment methods, and billing
                  history.
                </p>
              </div>

              {/* 5-Tab Pill Bar */}
              <div className="inline-flex items-center gap-1 p-1 bg-[#151917] border border-[#232926] rounded-xl text-xs font-medium">
                {(
                  [
                    { id: 'overview', label: 'Overview' },
                    { id: 'web', label: 'Web Plans' },
                    { id: 'plugin', label: 'Plugin Plans' },
                    { id: 'payment', label: 'Payment Methods' },
                    { id: 'history', label: 'Billing History' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSubTab(t.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      subTab === t.id
                        ? 'bg-[#252c28] text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Current Plan Card */}
              <section className="bg-[#141816] border border-[#212724] rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1c221e] border border-[#2a332d] flex items-center justify-center text-neutral-300">
                      <svg
                        className="w-5 h-5 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-neutral-400 block">
                        Current Plan
                      </span>
                      <h2 className="text-2xl font-bold text-white tracking-tight capitalize">
                        {userPlan}
                      </h2>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#132c21] text-[#3ebb88] border border-[#24523d]/40">
                    Active
                  </span>
                </div>

                <p className="text-xs text-neutral-400 mb-6">
                  Upgrade to unlock AI translation, premium audio cleaning, and
                  watermark removal.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      onSelectPlan(userPlan === 'free' ? 'creator' : 'pro')
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-[#3ebb88] hover:bg-[#34a779] text-neutral-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <span>
                      {userPlan === 'free'
                        ? 'Upgrade plan →'
                        : 'Switch Plan Tier →'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectPlan('free')}
                    className="px-4 py-2 bg-[#1b221e] hover:bg-[#232b26] text-neutral-200 border border-[#29342e] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Billing History
                  </button>
                </div>
              </section>

              {/* Plan Features and Usage Card */}
              <section className="bg-[#141816] border border-[#212724] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-6">
                  Plan features and usage
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Storage */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-300">
                        Storage
                      </span>
                      <div className="text-neutral-300 font-semibold font-mono">
                        &lt; 0.1 GB{' '}
                        <span className="text-neutral-400 font-normal">
                          / 5.0 GB
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-[#202723] rounded-full overflow-hidden">
                      <div className="h-full bg-[#3ebb88] w-[2%] rounded-full" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>0.05% used</span>
                      <span>5.0 GB left</span>
                    </div>
                  </div>

                  {/* Transcription */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-300">
                        Transcription
                      </span>
                      <div className="text-neutral-300 font-semibold font-mono">
                        0.6 mins{' '}
                        <span className="text-neutral-400 font-normal">
                          / 5.0 mins
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-[#202723] rounded-full overflow-hidden">
                      <div className="h-full bg-[#3ebb88] w-[11%] rounded-full" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>11% used</span>
                      <span>4.5 mins left</span>
                    </div>
                  </div>

                  {/* Audio cleans */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-300">
                        Audio cleans
                      </span>
                      <div className="text-neutral-300 font-semibold font-mono">
                        1 <span className="text-neutral-400 font-normal">/ 3</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-[#202723] rounded-full overflow-hidden">
                      <div className="h-full bg-[#3ebb88] w-[33.33%] rounded-full" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>33.33% used</span>
                      <span>2 left</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* 4. MANAGE PLUGINS VIEW (Exact match to manage plugins.png) */}
          {activeView === 'plugins' && (
            <div className="max-w-6xl space-y-6">
              <section>
                <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
                  Plugins
                </h1>
                <p className="text-xs text-neutral-400">
                  Your keys and devices for the Premiere Pro and DaVinci Resolve
                  plugins.
                </p>
              </section>

              {/* 3-Step Guide Header Bar */}
              <section>
                <div className="bg-[#141519] border border-[#21242b] rounded-xl px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#21242b]">
                  <div className="flex items-start gap-3 md:pr-4">
                    <span className="w-5 h-5 rounded-full bg-[#1b3b2f] border border-[#275d47] text-[#48bb78] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Generate a key
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Create a free license key below. No card needed.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-4 md:pt-0 md:px-6">
                    <span className="w-5 h-5 rounded-full bg-[#1e2128] border border-[#2f3440] text-neutral-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Paste it in
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Open the Merupify panel in your editor and paste the key.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-4 md:pt-0 md:pl-6">
                    <span className="w-5 h-5 rounded-full bg-[#1e2128] border border-[#2f3440] text-neutral-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Start editing
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Transcribe &amp; translate clips right on your timeline.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {generatedLicenseKey && (
                <div className="p-3.5 rounded-xl bg-[#142820] border border-[#214a38] flex items-center justify-between text-xs text-emerald-300">
                  <span>
                    Active Free License Key:{' '}
                    <code className="font-mono font-bold text-white">
                      {generatedLicenseKey}
                    </code>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard?.writeText(generatedLicenseKey)
                    }
                    className="px-3 py-1 rounded bg-[#3bb681] text-black font-semibold cursor-pointer"
                  >
                    Copy Key
                  </button>
                </div>
              )}

              {/* Plugin Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Premiere Pro Card */}
                <div className="bg-[#141519] border border-[#21242b] rounded-2xl p-6 flex flex-col justify-between shadow-xl min-h-[430px]">
                  <div>
                    <div className="flex items-center justify-between pb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#00005b] border border-[#26248c] flex items-center justify-center shadow-md">
                          <span className="text-[#8888ff] font-bold text-base tracking-tighter">
                            Pr
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-white tracking-tight">
                          Premiere Pro
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChangeView('academy')}
                        className="inline-flex items-center gap-1.5 text-xs text-[#48bb78] hover:underline font-medium cursor-pointer"
                      >
                        <span>🎓 Browse tutorials</span>
                      </button>
                    </div>

                    <div className="pt-2 pb-6 border-b border-[#21242b]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                        INSTALL
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-white">1.3.0</div>
                          <div className="text-[11px] text-neutral-400">
                            8 Oct 2026
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={onExportPremiereXML}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1c1f26] hover:bg-[#252a33] text-neutral-200 border border-[#2d323d] rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          <span>⬇ ZXP</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-6">
                      <h3 className="text-sm font-semibold text-white mb-3">
                        Get your free license key
                      </h3>
                      <div className="space-y-1.5 text-xs text-neutral-400">
                        <p>10 minutes of free transcription.</p>
                        <p>“No Watermark” on Renders (Free Trial Gift)</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8">
                    <button
                      type="button"
                      onClick={() =>
                        setGeneratedLicenseKey('MERUPIFY-PR-2026-FREE10M')
                      }
                      className="px-5 py-2.5 bg-[#48bb78] hover:bg-[#3ea56a] text-black font-semibold text-xs rounded-lg transition shadow-sm cursor-pointer"
                    >
                      Generate free key
                    </button>
                  </div>
                </div>

                {/* DaVinci Resolve Card */}
                <div className="bg-[#141519] border border-[#21242b] rounded-2xl p-6 flex flex-col justify-between shadow-xl min-h-[430px]">
                  <div>
                    <div className="flex items-center justify-between pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#181a20] border border-[#2b2e38] flex items-center justify-center p-1.5 shadow-md">
                          <svg className="w-6 h-6" viewBox="0 0 100 100">
                            <circle cx="50" cy="35" fill="#e53e3e" r="14" />
                            <circle cx="35" cy="65" fill="#3182ce" r="14" />
                            <circle cx="65" cy="65" fill="#dd6b20" r="14" />
                          </svg>
                        </div>
                        <h2 className="text-base font-bold text-white tracking-tight">
                          DaVinci Resolve
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChangeView('academy')}
                        className="inline-flex items-center gap-1.5 text-xs text-[#48bb78] hover:underline font-medium cursor-pointer"
                      >
                        <span>🎓 Browse tutorials</span>
                      </button>
                    </div>

                    <div className="mb-4 bg-[#231e13] border border-[#4d3c1a] rounded-xl px-4 py-3 flex items-start gap-2.5">
                      <span className="text-amber-500 shrink-0 mt-0.5">ⓘ</span>
                      <p className="text-[11px] leading-relaxed text-[#d9a84a] font-normal">
                        <span className="font-semibold text-[#f0ba53]">
                          From DaVinci Resolve 21.1+, the Merupify plugin runs on
                          Resolve Studio only.
                        </span>{' '}
                        We are working on support for the free version, stay
                        tuned.
                      </p>
                    </div>

                    <div className="pt-1 pb-6 border-b border-[#21242b]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                        INSTALL
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-white">2.0.1</div>
                          <div className="text-[11px] text-neutral-400">
                            22 Sept 2026
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={onExportAlphaWebM}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#48bb78] hover:bg-[#3ea56a] text-black rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            <span>⬇ macOS (Apple Silicon)</span>
                          </button>
                          <button
                            type="button"
                            onClick={onExportAlphaWebM}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1f26] hover:bg-[#252a33] text-neutral-200 border border-[#2d323d] rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            <span>⬇ Windows</span>
                          </button>
                          <button
                            type="button"
                            onClick={onExportAlphaWebM}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1f26] hover:bg-[#252a33] text-neutral-200 border border-[#2d323d] rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            <span>⬇ macOS (Intel)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <h3 className="text-sm font-semibold text-white mb-3">
                        Get your free license key
                      </h3>
                      <div className="space-y-1.5 text-xs text-neutral-400">
                        <p>10 minutes of free transcription.</p>
                        <p>“No Watermark” on Renders (Free Trial Gift)</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8">
                    <button
                      type="button"
                      onClick={() =>
                        setGeneratedLicenseKey('MERUPIFY-DR-2026-FREE10M')
                      }
                      className="px-5 py-2.5 bg-[#48bb78] hover:bg-[#3ea56a] text-black font-semibold text-xs rounded-lg transition shadow-sm cursor-pointer"
                    >
                      Generate free key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. REFER & EARN / AFFILIATE VIEW (Exact match to refer earn.png & help ad support.png) */}
          {(activeView === 'affiliate' || activeView === 'support') && (
            <div className="max-w-5xl space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
                  Affiliate
                </h1>
                <p className="text-xs text-gray-400">
                  Earn commission for every customer you refer to Merupify.
                </p>
              </div>

              <section className="bg-[#15171b] border border-[#21252c] rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-7 space-y-5">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#14261f] border border-[#1e4634] text-[#3bb681] text-xs font-medium">
                      <span>🏆 Highest payout percentage in the industry</span>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-extrabold text-white tracking-tight">
                        Recommend Merupify. Make Money.
                      </h2>
                      <p className="text-xs text-gray-400">
                        Share your link. We do the tracking, you do the
                        collecting.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(
                            'https://app.merupify.io/?via=creator'
                          );
                          setCopiedAffiliate(true);
                          setTimeout(() => setCopiedAffiliate(false), 2500);
                        }}
                        className="bg-[#3bb681] hover:bg-[#329e70] text-gray-950 font-semibold px-5 py-2.5 rounded-lg text-xs transition shadow-sm cursor-pointer"
                      >
                        {copiedAffiliate
                          ? '✓ Referral Link Copied!'
                          : 'Become an affiliate'}
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-5">
                    <div className="bg-[#1b1e24] border border-[#282e38] rounded-xl p-6 relative">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        YOU EARN
                      </span>
                      <div className="text-5xl font-extrabold text-[#3bb681] tracking-tight mb-2">
                        50%
                      </div>
                      <div className="text-xs font-semibold text-gray-200 underline decoration-teal-600 underline-offset-4 mb-4">
                        of your referral&apos;s first 2 monthly payments
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed font-normal mb-3">
                        Say you refer someone on our Creator plan ($9.99/mo).
                        That&apos;s $9.24 in your pocket across their first 2
                        payments.
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Yearly plans pay 20%, once.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3 pt-2">
                <h3 className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                  HOW IT WORKS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 bg-[#15171b] border border-[#21252c] rounded-xl divide-y md:divide-y-0 md:divide-x divide-[#21252c] overflow-hidden">
                  <div className="p-6 space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#20252d] text-gray-300 text-[11px] font-bold flex items-center justify-center">
                        1
                      </span>
                      <h4 className="text-xs font-bold text-white">
                        Get your link
                      </h4>
                    </div>
                    <p className="text-xs text-gray-400 leading-normal pl-7">
                      You get a unique referral link and code the moment you
                      join.
                    </p>
                  </div>
                  <div className="p-6 space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#20252d] text-gray-300 text-[11px] font-bold flex items-center justify-center">
                        2
                      </span>
                      <h4 className="text-xs font-bold text-white">Share it</h4>
                    </div>
                    <p className="text-xs text-gray-400 leading-normal pl-7">
                      Post it in your videos, your bio, or wherever your
                      audience hangs out.
                    </p>
                  </div>
                  <div className="p-6 space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#20252d] text-gray-300 text-[11px] font-bold flex items-center justify-center">
                        3
                      </span>
                      <h4 className="text-xs font-bold text-white">Get paid</h4>
                    </div>
                    <p className="text-xs text-gray-400 leading-normal pl-7">
                      Cash out to your local bank account once your balance
                      passes $50.00.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>

        {/* BEGIN: LiveChatWidget (Exact match to help ad support .png) */}
        <div className="absolute bottom-5 right-6 flex flex-col items-end space-y-3 z-30">
          {isSupportChatOpen && (
            <div className="w-[330px] rounded-2xl overflow-hidden shadow-2xl border border-emerald-900/30 bg-[#35a877] text-white flex flex-col">
              <div className="p-5 pb-7 space-y-1 bg-[#35a877]">
                <h2 className="text-2xl font-bold flex items-center space-x-1.5 text-white">
                  <span>Hi there</span> <span>👋</span>
                </h2>
                <p className="text-xs text-emerald-100 font-medium">
                  Need help? Start a conversation:
                </p>
              </div>
              <div className="px-3 pb-4 -mt-2">
                <div
                  onClick={() => setIsSupportChatOpen(false)}
                  className="bg-white rounded-xl p-3.5 shadow-md flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                >
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">
                      New Conversation
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      We typically reply in a few minutes
                    </p>
                  </div>
                  <div className="text-[#3bb681] pl-2">
                    <svg
                      className="w-4 h-4 transform rotate-45"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white py-2.5 px-8 border-t border-gray-100 flex items-center justify-around text-gray-600">
                <button
                  type="button"
                  className="text-[#3bb681] hover:text-emerald-700 transition cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-700 transition cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            {isSupportChatOpen && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white rounded-full text-[11px] font-semibold text-gray-800 shadow-md">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Powered by tawk.to</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSupportChatOpen((v) => !v)}
              className="w-10 h-10 rounded-full bg-[#3bb681] hover:bg-[#329e70] text-white flex items-center justify-center shadow-lg transition transform hover:scale-105 cursor-pointer"
              title="Live Support Chat"
            >
              {isSupportChatOpen ? (
                <svg
                  className="w-5 h-5 stroke-[2.5]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19 9l-7 7-7-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* END: LiveChatWidget */}
      </div>
      {/* END: MainContentWrapper */}
    </div>
  );
};
