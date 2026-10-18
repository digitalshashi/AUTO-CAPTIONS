import React, { useMemo, useState } from 'react';
import {
  Calculator,
  Check,
  Copy,
  Download,
  IndianRupee,
  DollarSign,
  RotateCcw,
  Volume2,
  X,
  FileText,
  Layers,
} from 'lucide-react';
import { CaptionSegment, TrackKey } from '../types/caption';
import { triggerFileDownload } from '../utils/audioExtractor';

export interface CloudServiceRateItem {
  id: string;
  category: 'transcription' | 'translation-video';
  name: string;
  providerLabel: string;
  pricingModel: string;
  /** Base cost in USD for 1 minute at 900 chars/min (scales with charsPerMin if charBased is true) */
  baseUsdPerMinute: number;
  charBased?: boolean;
  freeTierMonthlyMinutes: number;
  roleDescription: string;
}

export interface GoogleTtsTierItem {
  id: string;
  name: string;
  officialRatePer1MCharsUsd: number;
  freeTierMonthlyChars: number;
  bestUseCase: string;
  sampleVoiceTag: string;
}

export const GOOGLE_TTS_VOICE_TIERS: GoogleTtsTierItem[] = [
  {
    id: 'tts-none',
    name: 'No TTS Voiceover (Original Video Audio)',
    officialRatePer1MCharsUsd: 0,
    freeTierMonthlyChars: 0,
    bestUseCase: 'Keep original speaker audio from uploaded video',
    sampleVoiceTag: 'Original Audio',
  },
  {
    id: 'tts-standard',
    name: 'Google TTS — Standard Voices',
    officialRatePer1MCharsUsd: 4.0,
    freeTierMonthlyChars: 4_000_000,
    bestUseCase: 'Budget voiceovers, IVR & basic narration',
    sampleVoiceTag: 'te-IN-Standard-A / hi-IN-Standard-A',
  },
  {
    id: 'tts-wavenet-neural2',
    name: 'Google TTS — WaveNet & Neural2 Voices',
    officialRatePer1MCharsUsd: 16.0,
    freeTierMonthlyChars: 1_000_000,
    bestUseCase: 'Natural multilingual Indian & global creator voices (Recommended)',
    sampleVoiceTag: 'te-IN-Neural2-B / hi-IN-Neural2-D / en-IN-Neural2-C',
  },
  {
    id: 'tts-gemini-flash',
    name: 'Gemini 2.5 Flash Preview TTS (Audio Tokens)',
    officialRatePer1MCharsUsd: 16.67, // ~$0.0150 per 1-minute (~900 chars)
    freeTierMonthlyChars: 250_000,
    bestUseCase: 'Expressive, context-aware multi-speaker AI voiceover',
    sampleVoiceTag: 'Kore / Puck / Charon / Fenrir',
  },
  {
    id: 'tts-journey-chirp',
    name: 'Google TTS — Journey & Chirp HD Voices',
    officialRatePer1MCharsUsd: 30.0,
    freeTierMonthlyChars: 100_000,
    bestUseCase: 'Conversational storytelling & generative pacing',
    sampleVoiceTag: 'en-US-Journey-D / Chirp-HD',
  },
  {
    id: 'tts-studio-polyglot',
    name: 'Google TTS — Studio & Polyglot Voices',
    officialRatePer1MCharsUsd: 160.0,
    freeTierMonthlyChars: 100_000,
    bestUseCase: 'Broadcast-grade studio narration & documentary media',
    sampleVoiceTag: 'en-US-Studio-O / Studio-M',
  },
];

export const GOOGLE_CLOUD_PIPELINE_SERVICES: CloudServiceRateItem[] = [
  {
    id: 'gemini-2.5-flash-audio',
    category: 'transcription',
    name: 'Gemini 2.5 Flash (Audio Input + Verbatim Captions)',
    providerLabel: 'Vertex AI / Gemini API',
    pricingModel: '~1,500 audio tokens/min + JSON output',
    baseUsdPerMinute: 0.0028,
    charBased: false,
    freeTierMonthlyMinutes: 60,
    roleDescription:
      'Active studio engine for verbatim transcription, Roman (Tinglish) transliteration & Auto-Hero NLP',
  },
  {
    id: 'gemini-2.5-pro-audio',
    category: 'transcription',
    name: 'Gemini 2.5 Pro (Multimodal Audio + Video Reasoning)',
    providerLabel: 'Vertex AI / Gemini API',
    pricingModel: 'Multimodal input + deep reasoning tokens',
    baseUsdPerMinute: 0.032,
    charBased: false,
    freeTierMonthlyMinutes: 15,
    roleDescription:
      'Heavy-duty reasoning, complex multi-speaker translation & visual scene analysis',
  },
  {
    id: 'cloud-stt-v2-chirp',
    category: 'transcription',
    name: 'Cloud Speech-to-Text V2 (Chirp 2 Standard)',
    providerLabel: 'Google Cloud STT V2',
    pricingModel: '$0.0160 / minute (15s increments)',
    baseUsdPerMinute: 0.016,
    charBased: false,
    freeTierMonthlyMinutes: 60,
    roleDescription:
      'Dedicated Google Cloud ASR with word-level timestamps & speaker diarization',
  },
  {
    id: 'cloud-stt-batch',
    category: 'transcription',
    name: 'Cloud Speech-to-Text V2 (Dynamic Batch)',
    providerLabel: 'Google Cloud STT Batch',
    pricingModel: '$0.0040 – $0.0090 / minute',
    baseUsdPerMinute: 0.006,
    charBased: false,
    freeTierMonthlyMinutes: 60,
    roleDescription: 'Async batch transcription for pre-recorded video archives',
  },
  {
    id: 'cloud-translation-nmt',
    category: 'translation-video',
    name: 'Cloud Translation API (Basic / NMT)',
    providerLabel: 'Google Cloud Translation',
    pricingModel: '$20.00 / 1M characters (~900 chars/min)',
    baseUsdPerMinute: 0.018,
    charBased: true,
    freeTierMonthlyMinutes: 550, // 500,000 chars free/month ≈ 555 mins
    roleDescription:
      'Translating 1 minute of transcript into another Indian or global language',
  },
  {
    id: 'cloud-video-intelligence',
    category: 'translation-video',
    name: 'Cloud Video Intelligence API (Shot & Person Detection)',
    providerLabel: 'Google Cloud Video AI',
    pricingModel: '$0.1000 / minute',
    baseUsdPerMinute: 0.1,
    charBased: false,
    freeTierMonthlyMinutes: 1000,
    roleDescription:
      'Automated scene cut detection, subject bounding boxes & label extraction',
  },
  {
    id: 'cloud-transcoder-1080p',
    category: 'translation-video',
    name: 'Cloud Transcoder API (1080p HD Output)',
    providerLabel: 'Google Cloud Transcoder',
    pricingModel: '$0.0300 / minute (HD 1080p)',
    baseUsdPerMinute: 0.03,
    charBased: false,
    freeTierMonthlyMinutes: 0,
    roleDescription:
      'Server-side MP4/H.264 1080p encoding ($0.00 when rendered in-browser via Canvas)',
  },
  {
    id: 'cloud-storage-cdn',
    category: 'translation-video',
    name: 'Cloud Storage + CDN Egress (~25 MB / 1-min 1080p Reel)',
    providerLabel: 'Google Cloud Storage',
    pricingModel: '$0.020/GB storage + egress',
    baseUsdPerMinute: 0.0025,
    charBased: false,
    freeTierMonthlyMinutes: 200,
    roleDescription: 'Cloud hosting and delivery for 1-minute 1080p MP4 reels',
  },
];

type StackPresetId = 'current-studio' | 'creator-tts-dubbing' | 'enterprise-cloud' | 'custom';

const VOLUME_TIERS_MINUTES = [1, 100, 500, 1000, 5000, 10000];

interface CloudCostEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVideoDurationSec: number;
  activeVideoName: string;
  segments: CaptionSegment[];
  primaryTrack: TrackKey;
  onShowToast?: (msg: string) => void;
}

export const CloudCostEstimatorModal: React.FC<CloudCostEstimatorModalProps> = ({
  isOpen,
  onClose,
  activeVideoDurationSec,
  activeVideoName,
  segments,
  primaryTrack,
  onShowToast,
}) => {
  const [selectedStackPreset, setSelectedStackPreset] =
    useState<StackPresetId>('creator-tts-dubbing');
  const [enabledServiceIds, setEnabledServiceIds] = useState<string[]>([
    'gemini-2.5-flash-audio',
    'cloud-translation-nmt',
  ]);
  const [selectedTtsTierId, setSelectedTtsTierId] = useState<string>(
    'tts-wavenet-neural2'
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(1.0);
  const [charsPerMinute, setCharsPerMinute] = useState<number>(900);
  const [monthlyMinutesVolume, setMonthlyMinutesVolume] = useState<number>(1000);
  const [usdToInrRate, setUsdToInrRate] = useState<number>(84.0);
  const [applyFreeTier, setApplyFreeTier] = useState<boolean>(false);

  // Compute real character count and speaking density from the active transcript
  const activeTranscriptStats = useMemo(() => {
    const durMin = Math.max(0.1, activeVideoDurationSec / 60);
    let totalChars = 0;
    let totalWords = 0;
    segments.forEach((seg) => {
      const txt =
        seg.tracks[primaryTrack]?.text ||
        seg.tracks.tinglish?.text ||
        seg.tracks.english?.text ||
        '';
      totalChars += txt.length;
      totalWords += txt.trim().split(/\s+/).filter(Boolean).length;
    });
    const estCharsPerMin =
      totalChars > 20 ? Math.round(totalChars / durMin) : 900;
    return {
      durationMinutes: Number(durMin.toFixed(2)),
      totalChars,
      totalWords,
      estCharsPerMin: Math.max(200, Math.min(2200, estCharsPerMin)),
    };
  }, [activeVideoDurationSec, segments, primaryTrack]);

  if (!isOpen) return null;

  const charScaleFactor = charsPerMinute / 900;

  const getServiceUsdPerMinute = (svc: CloudServiceRateItem): number => {
    return svc.charBased
      ? svc.baseUsdPerMinute * charScaleFactor
      : svc.baseUsdPerMinute;
  };

  const getTtsUsdPerMinute = (tier: GoogleTtsTierItem): number => {
    return (tier.officialRatePer1MCharsUsd / 1_000_000) * charsPerMinute;
  };

  const activeTtsTier =
    GOOGLE_TTS_VOICE_TIERS.find((t) => t.id === selectedTtsTierId) ||
    GOOGLE_TTS_VOICE_TIERS[2];

  const ttsUsdPer1Min = getTtsUsdPerMinute(activeTtsTier);
  const ttsInrPer1Min = ttsUsdPer1Min * usdToInrRate;

  const cloudServicesUsdPer1Min = GOOGLE_CLOUD_PIPELINE_SERVICES.reduce(
    (sum, svc) => {
      if (!enabledServiceIds.includes(svc.id)) return sum;
      return sum + getServiceUsdPerMinute(svc);
    },
    0
  );

  const totalUsdPer1Min = cloudServicesUsdPer1Min + ttsUsdPer1Min;
  const totalInrPer1Min = totalUsdPer1Min * usdToInrRate;

  const activeVideoCostUsd = totalUsdPer1Min * durationMinutes;
  const activeVideoCostInr = activeVideoCostUsd * usdToInrRate;

  const calculateMonthlyTotalUsd = (targetMonthlyMinutes: number): number => {
    let monthlyUsd = 0;

    // 1. Enabled Cloud Pipeline Services
    GOOGLE_CLOUD_PIPELINE_SERVICES.forEach((svc) => {
      if (!enabledServiceIds.includes(svc.id)) return;
      const billableMins = applyFreeTier
        ? Math.max(0, targetMonthlyMinutes - svc.freeTierMonthlyMinutes)
        : targetMonthlyMinutes;
      monthlyUsd += billableMins * getServiceUsdPerMinute(svc);
    });

    // 2. Selected Google TTS Engine
    if (activeTtsTier.officialRatePer1MCharsUsd > 0) {
      const totalMonthlyChars = targetMonthlyMinutes * charsPerMinute;
      const billableChars = applyFreeTier
        ? Math.max(0, totalMonthlyChars - activeTtsTier.freeTierMonthlyChars)
        : totalMonthlyChars;
      monthlyUsd +=
        (billableChars / 1_000_000) * activeTtsTier.officialRatePer1MCharsUsd;
    }

    return monthlyUsd;
  };

  const selectedMonthlyTotalUsd = calculateMonthlyTotalUsd(monthlyMinutesVolume);
  const selectedMonthlyTotalInr = selectedMonthlyTotalUsd * usdToInrRate;

  const handleApplyStackPreset = (preset: StackPresetId) => {
    setSelectedStackPreset(preset);
    if (preset === 'current-studio') {
      setEnabledServiceIds(['gemini-2.5-flash-audio']);
      setSelectedTtsTierId('tts-none');
    } else if (preset === 'creator-tts-dubbing') {
      setEnabledServiceIds(['gemini-2.5-flash-audio', 'cloud-translation-nmt']);
      setSelectedTtsTierId('tts-wavenet-neural2');
    } else if (preset === 'enterprise-cloud') {
      setEnabledServiceIds([
        'cloud-stt-v2-chirp',
        'cloud-translation-nmt',
        'cloud-video-intelligence',
        'cloud-transcoder-1080p',
        'cloud-storage-cdn',
      ]);
      setSelectedTtsTierId('tts-studio-polyglot');
    }
  };

  const toggleServiceId = (id: string) => {
    setSelectedStackPreset('custom');
    setEnabledServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const formatUsd = (val: number, decimals = 4) => {
    if (val === 0) return '$0.0000';
    if (val >= 10) return `$${val.toFixed(2)}`;
    return `$${val.toFixed(decimals)}`;
  };

  const formatInr = (val: number, decimals = 2) => {
    if (val === 0) return '₹0.00';
    if (val < 1) return `₹${val.toFixed(2)}`;
    return `₹${val.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  const handleCopySummary = () => {
    const summaryLines = [
      `Merupify / Google Cloud & TTS Cost Estimate (1 USD = ₹${usdToInrRate.toFixed(2)} INR)`,
      `-------------------------------------------------------------------------`,
      `• Cost per 1 Minute: ${formatUsd(totalUsdPer1Min, 4)} USD (${formatInr(totalInrPer1Min, 2)} INR)`,
      `• Selected Google TTS Tier (${activeTtsTier.name}): ${formatUsd(ttsUsdPer1Min, 4)}/min (${formatInr(ttsInrPer1Min, 2)}/min)`,
      `• Duration (${durationMinutes.toFixed(2)} min @ ${charsPerMinute} chars/min): ${formatUsd(activeVideoCostUsd, 4)} USD (${formatInr(activeVideoCostInr, 2)} INR)`,
      `• Monthly Projection (${monthlyMinutesVolume.toLocaleString()} mins/mo): ${formatUsd(selectedMonthlyTotalUsd, 2)} USD (${formatInr(selectedMonthlyTotalInr, 2)} INR)`,
    ].join('\n');

    navigator.clipboard?.writeText(summaryLines).catch(() => {});
    onShowToast?.('Copied USD & INR Google Cloud + TTS cost breakdown to clipboard!');
  };

  const handleDownloadCsvReport = () => {
    const rows: string[][] = [
      [
        'Category',
        'Service / Engine Name',
        'Official Pricing Basis',
        'Included in Stack',
        'Cost per 1 Min (USD)',
        'Cost per 1 Min (INR)',
        `Cost for ${durationMinutes} Min (USD)`,
        `Cost for ${durationMinutes} Min (INR)`,
        `Monthly ${monthlyMinutesVolume} Mins (USD)`,
        `Monthly ${monthlyMinutesVolume} Mins (INR)`,
      ],
    ];

    GOOGLE_TTS_VOICE_TIERS.filter((t) => t.id !== 'tts-none').forEach((tier) => {
      const perMinUsd = getTtsUsdPerMinute(tier);
      const perMinInr = perMinUsd * usdToInrRate;
      const isSelected = tier.id === selectedTtsTierId;
      rows.push([
        'Google TTS Engine',
        tier.name,
        `$${tier.officialRatePer1MCharsUsd}/1M chars`,
        isSelected ? 'ACTIVE' : 'Optional',
        perMinUsd.toFixed(4),
        perMinInr.toFixed(2),
        (perMinUsd * durationMinutes).toFixed(4),
        (perMinInr * durationMinutes).toFixed(2),
        (perMinUsd * monthlyMinutesVolume).toFixed(2),
        (perMinInr * monthlyMinutesVolume).toFixed(2),
      ]);
    });

    GOOGLE_CLOUD_PIPELINE_SERVICES.forEach((svc) => {
      const perMinUsd = getServiceUsdPerMinute(svc);
      const perMinInr = perMinUsd * usdToInrRate;
      const isIncluded = enabledServiceIds.includes(svc.id);
      rows.push([
        svc.category === 'transcription'
          ? 'Cloud Transcription / AI'
          : 'Cloud Translation & Video',
        svc.name,
        svc.pricingModel,
        isIncluded ? 'ACTIVE' : 'Optional',
        perMinUsd.toFixed(4),
        perMinInr.toFixed(2),
        (perMinUsd * durationMinutes).toFixed(4),
        (perMinInr * durationMinutes).toFixed(2),
        (perMinUsd * monthlyMinutesVolume).toFixed(2),
        (perMinInr * monthlyMinutesVolume).toFixed(2),
      ]);
    });

    rows.push([
      'TOTAL ACTIVE STACK',
      `Selected Pipeline + ${activeTtsTier.name}`,
      `1 USD = ${usdToInrRate} INR (${charsPerMinute} chars/min)`,
      'TOTAL',
      totalUsdPer1Min.toFixed(4),
      totalInrPer1Min.toFixed(2),
      activeVideoCostUsd.toFixed(4),
      activeVideoCostInr.toFixed(2),
      selectedMonthlyTotalUsd.toFixed(2),
      selectedMonthlyTotalInr.toFixed(2),
    ]);

    const csvContent = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    triggerFileDownload(
      csvContent,
      'google-cloud-tts-cost-estimate-usd-inr.csv',
      'text/csv;charset=utf-8'
    );
    onShowToast?.('Downloaded Google Cloud & TTS Cost Estimate (.CSV)!');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[1160px] max-h-[92vh] bg-[#111116] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="px-5 py-3.5 bg-[#15151C] border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#163326] border border-[#2BAE66]/40 flex items-center justify-center text-[#34D399] shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Google Cloud &amp; Google TTS Cost Estimator (USD $ &amp; INR ₹)
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 truncate">
                <span>1-Minute Unit Economics</span>
                <span aria-hidden="true">·</span>
                <span>Google TTS Voice Tiers</span>
                <span aria-hidden="true">·</span>
                <span>Monthly Volume Projections (100 – 10,000 mins)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setDurationMinutes(activeTranscriptStats.durationMinutes);
                setCharsPerMinute(activeTranscriptStats.estCharsPerMin);
                onShowToast?.(
                  `Synced to active video (${activeTranscriptStats.durationMinutes} min · ${activeTranscriptStats.estCharsPerMin} chars/min)`
                );
              }}
              className="px-3 py-1.5 rounded-lg bg-[#1C1C24] hover:bg-[#252530] border border-white/10 text-zinc-200 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
            >
              Sync Active Video ({activeTranscriptStats.durationMinutes}m)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Cost Estimator"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4-COLUMN TOP KPI SUMMARY STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-3.5 bg-[#13131A] border-b border-white/[0.07] shrink-0">
          {/* Metric 1: Total Cost per 1 Minute */}
          <div className="p-3 rounded-xl bg-[#181820] border border-[#2BAE66]/35">
            <div className="text-[11px] text-zinc-400 font-medium">
              Selected Stack · Per 1 Minute
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2 font-mono tabular-nums">
              <span className="text-lg font-bold text-white">
                {formatInr(totalInrPer1Min, 2)}
                <span className="text-[11px] font-normal text-zinc-400">/min</span>
              </span>
              <span className="text-xs font-semibold text-[#34D399]">
                {formatUsd(totalUsdPer1Min, 4)}/min
              </span>
            </div>
            <div className="mt-1 text-[10px] text-zinc-400 truncate">
              {enabledServiceIds.length} Cloud service(s) +{' '}
              {activeTtsTier.id === 'tts-none' ? 'Original Audio' : activeTtsTier.name.replace('Google TTS — ', '')}
            </div>
          </div>

          {/* Metric 2: Google TTS Engine Cost per 1 Minute */}
          <div className="p-3 rounded-xl bg-[#181820] border border-white/[0.07]">
            <div className="text-[11px] text-zinc-400 font-medium">
              Google TTS Engine · Per 1 Min
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2 font-mono tabular-nums">
              <span className="text-lg font-bold text-amber-300">
                {formatInr(ttsInrPer1Min, 2)}
                <span className="text-[11px] font-normal text-zinc-400">/min</span>
              </span>
              <span className="text-xs font-semibold text-zinc-300">
                {formatUsd(ttsUsdPer1Min, 4)}/min
              </span>
            </div>
            <div className="mt-1 text-[10px] text-zinc-400 truncate">
              Basis: ~{charsPerMinute} chars/min ($
              {activeTtsTier.officialRatePer1MCharsUsd}/1M chars)
            </div>
          </div>

          {/* Metric 3: Active Video / Custom Duration Cost */}
          <div className="p-3 rounded-xl bg-[#181820] border border-white/[0.07]">
            <div className="text-[11px] text-zinc-400 font-medium">
              Cost for {durationMinutes.toFixed(2)} Min Video
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2 font-mono tabular-nums">
              <span className="text-lg font-bold text-white">
                {formatInr(activeVideoCostInr, 2)}
              </span>
              <span className="text-xs font-semibold text-[#34D399]">
                {formatUsd(activeVideoCostUsd, 4)}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-zinc-400 truncate">
              {activeVideoName} · {(durationMinutes * charsPerMinute).toLocaleString()} chars
            </div>
          </div>

          {/* Metric 4: Monthly Volume Projection */}
          <div className="p-3 rounded-xl bg-[#181820] border border-white/[0.07]">
            <div className="text-[11px] text-zinc-400 font-medium">
              Monthly ({monthlyMinutesVolume.toLocaleString()} Mins / Mo)
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2 font-mono tabular-nums">
              <span className="text-lg font-bold text-amber-300">
                {formatInr(selectedMonthlyTotalInr, 2)}
              </span>
              <span className="text-xs font-semibold text-zinc-200">
                {formatUsd(selectedMonthlyTotalUsd, 2)}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-zinc-400 truncate">
              {applyFreeTier
                ? 'After Google Cloud Monthly Free Tier credits'
                : 'Standard Pay-As-You-Go rate (No free tier deducted)'}
            </div>
          </div>
        </div>

        {/* MAIN SCROLLABLE BODY */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5 text-xs">
          {/* ROW 1: ARCHITECTURE STACK PRESETS + PARAMETER CONTROLS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 5 Cols: Architecture Presets */}
            <div className="lg:col-span-5 p-4 rounded-xl bg-[#16161D] border border-white/[0.07] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  01. Pipeline Architecture Presets
                </span>
                <span className="text-[11px] text-zinc-400">
                  Click a stack or toggle rows below
                </span>
              </div>

              <div className="space-y-2">
                {(
                  [
                    {
                      id: 'current-studio' as StackPresetId,
                      title: 'Current Studio Stack (Gemini 2.5 Flash + Browser Export)',
                      sub: 'Ultra-low cost: Gemini 2.5 Flash audio captions + client-side 2D Canvas MP4',
                      badgeInr: formatInr(0.0028 * usdToInrRate, 2) + '/min',
                      badgeUsd: '$0.0028/min',
                    },
                    {
                      id: 'creator-tts-dubbing' as StackPresetId,
                      title: 'Creator Dubbing Stack (Gemini Flash + Neural2 TTS + Translate)',
                      sub: 'Multilingual caption translation + natural Indian Neural2 AI voiceover',
                      badgeInr:
                        formatInr(
                          (0.0028 + 0.018 * charScaleFactor + 0.0144 * charScaleFactor) *
                            usdToInrRate,
                          2
                        ) + '/min',
                      badgeUsd:
                        formatUsd(
                          0.0028 + 0.018 * charScaleFactor + 0.0144 * charScaleFactor,
                          4
                        ) + '/min',
                    },
                    {
                      id: 'enterprise-cloud' as StackPresetId,
                      title: 'Full Enterprise Cloud Stack (STT V2 + Studio TTS + 1080p Encode)',
                      sub: 'Cloud STT V2 + Translation + Studio TTS + Video Intelligence + Cloud Transcoder',
                      badgeInr:
                        formatInr(
                          (0.016 +
                            0.018 * charScaleFactor +
                            0.144 * charScaleFactor +
                            0.1 +
                            0.03 +
                            0.0025) *
                            usdToInrRate,
                          2
                        ) + '/min',
                      badgeUsd:
                        formatUsd(
                          0.016 +
                            0.018 * charScaleFactor +
                            0.144 * charScaleFactor +
                            0.1 +
                            0.03 +
                            0.0025,
                          4
                        ) + '/min',
                    },
                  ] as const
                ).map((p) => {
                  const active = selectedStackPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyStackPreset(p.id)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        active
                          ? 'bg-[#152C21] border-[#2BAE66] text-white'
                          : 'bg-[#121218] border-white/[0.06] text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {p.title}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                          {p.sub}
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums shrink-0">
                        <div className="text-xs font-bold text-[#34D399]">
                          {p.badgeInr}
                        </div>
                        <div className="text-[10px] text-zinc-400">{p.badgeUsd}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right 7 Cols: Interactive Calculator Sliders & Currency Controls */}
            <div className="lg:col-span-7 p-4 rounded-xl bg-[#16161D] border border-white/[0.07] space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  02. Duration, Speech Density &amp; Exchange Rate Parameters
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDurationMinutes(1.0);
                    setCharsPerMinute(900);
                    setMonthlyMinutesVolume(1000);
                    setUsdToInrRate(84.0);
                    setApplyFreeTier(false);
                  }}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset 1-Min Standard</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Control A: Video Duration (Minutes) */}
                <div className="p-3 rounded-xl bg-[#121218] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-300 font-medium">
                      Single Video Duration
                    </span>
                    <span className="font-mono tabular-nums text-xs font-bold text-white">
                      {durationMinutes.toFixed(2)} min (
                      {Math.round(durationMinutes * 60)}s)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.25}
                    max={30}
                    step={0.25}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseFloat(e.target.value))}
                    className="w-full accent-[#2BAE66] cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {[
                      { label: '1 Min', val: 1 },
                      {
                        label: `Active (${activeTranscriptStats.durationMinutes}m)`,
                        val: activeTranscriptStats.durationMinutes,
                      },
                      { label: '3 Min', val: 3 },
                      { label: '10 Min', val: 10 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setDurationMinutes(btn.val)}
                        className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition-colors ${
                          Math.abs(durationMinutes - btn.val) < 0.05
                            ? 'bg-[#2BAE66] text-white'
                            : 'bg-[#1B1B24] text-zinc-300 hover:text-white'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Control B: Speaking Rate (Characters per 1 Minute) */}
                <div className="p-3 rounded-xl bg-[#121218] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-300 font-medium">
                      Characters per 1 Minute (TTS &amp; Translate)
                    </span>
                    <span className="font-mono tabular-nums text-xs font-bold text-white">
                      {charsPerMinute} chars/min (~{Math.round(charsPerMinute / 6)} wpm)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={400}
                    max={1600}
                    step={50}
                    value={charsPerMinute}
                    onChange={(e) => setCharsPerMinute(parseInt(e.target.value, 10))}
                    className="w-full accent-[#2BAE66] cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {[
                      { label: 'Slow (650)', val: 650 },
                      { label: 'Standard (900)', val: 900 },
                      { label: 'Fast Reel (1,150)', val: 1150 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setCharsPerMinute(btn.val)}
                        className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition-colors ${
                          charsPerMinute === btn.val
                            ? 'bg-[#2BAE66] text-white'
                            : 'bg-[#1B1B24] text-zinc-300 hover:text-white'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Control C: Monthly Production Volume */}
                <div className="p-3 rounded-xl bg-[#121218] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-300 font-medium">
                      Monthly Volume (Minutes / Month)
                    </span>
                    <span className="font-mono tabular-nums text-xs font-bold text-amber-300">
                      {monthlyMinutesVolume.toLocaleString()} mins/mo
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {VOLUME_TIERS_MINUTES.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setMonthlyMinutesVolume(mins)}
                        className={`py-1.5 rounded text-[10px] font-mono tabular-nums font-semibold cursor-pointer transition-colors ${
                          monthlyMinutesVolume === mins
                            ? 'bg-[#2BAE66] text-white'
                            : 'bg-[#1B1B24] text-zinc-300 hover:text-white'
                        }`}
                      >
                        {mins >= 1000 ? `${mins / 1000}k` : mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Control D: USD to INR Rate & Free Tier Toggle */}
                <div className="p-3 rounded-xl bg-[#121218] border border-white/[0.06] flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-300 font-medium">
                      USD → INR Exchange Rate (₹)
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-zinc-400">₹</span>
                      <input
                        type="number"
                        min={70}
                        max={100}
                        step={0.25}
                        value={usdToInrRate}
                        onChange={(e) =>
                          setUsdToInrRate(Math.max(1, parseFloat(e.target.value) || 84))
                        }
                        className="w-16 bg-[#1B1B24] text-white font-mono tabular-nums text-xs px-2 py-1 rounded border border-white/10 text-right"
                      />
                    </div>
                  </div>

                  <label className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06] cursor-pointer">
                    <span className="text-[11px] text-zinc-300">
                      Deduct Google Cloud Monthly Free Tier
                    </span>
                    <input
                      type="checkbox"
                      checked={applyFreeTier}
                      onChange={(e) => setApplyFreeTier(e.target.checked)}
                      className="accent-[#2BAE66] cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: GOOGLE CLOUD TEXT-TO-SPEECH (TTS) ENGINES TABLE */}
          <div className="rounded-xl bg-[#16161D] border border-white/[0.07] overflow-hidden">
            <div className="px-4 py-3 bg-[#191922] border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-white">
                  03. Google Cloud Text-to-Speech (TTS) Engines — Cost per 1 Minute (~
                  {charsPerMinute} Characters)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Click any Google TTS voice tier to select it in your active cost calculation
                </p>
              </div>
              <div className="text-[11px] font-mono tabular-nums text-zinc-300">
                Selected TTS: <span className="text-[#34D399] font-semibold">{activeTtsTier.name}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[10px] text-zinc-400 bg-[#13131A]">
                    <th className="py-2.5 px-4 font-semibold">Select</th>
                    <th className="py-2.5 px-3 font-semibold">Google TTS Voice Engine</th>
                    <th className="py-2.5 px-3 font-semibold">Official Rate (1M Chars)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">
                      1 Min Cost ($ USD)
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-right">
                      1 Min Cost (₹ INR)
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-right">
                      {monthlyMinutesVolume.toLocaleString()} Mins / Mo ($ / ₹)
                    </th>
                    <th className="py-2.5 px-4 font-semibold">Voice Models &amp; Use Case</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {GOOGLE_TTS_VOICE_TIERS.map((tier) => {
                    const isSelected = tier.id === selectedTtsTierId;
                    const perMinUsd = getTtsUsdPerMinute(tier);
                    const perMinInr = perMinUsd * usdToInrRate;
                    const totalMonthlyChars = monthlyMinutesVolume * charsPerMinute;
                    const billableChars = applyFreeTier
                      ? Math.max(0, totalMonthlyChars - tier.freeTierMonthlyChars)
                      : totalMonthlyChars;
                    const monthlyUsd =
                      (billableChars / 1_000_000) * tier.officialRatePer1MCharsUsd;
                    const monthlyInr = monthlyUsd * usdToInrRate;

                    return (
                      <tr
                        key={tier.id}
                        onClick={() => {
                          setSelectedStackPreset('custom');
                          setSelectedTtsTierId(tier.id);
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#152C21]/75 hover:bg-[#152C21]'
                            : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                              isSelected
                                ? 'bg-[#2BAE66] border-[#2BAE66] text-white'
                                : 'border-zinc-600'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {tier.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-zinc-300">
                          {tier.officialRatePer1MCharsUsd === 0
                            ? 'Free ($0)'
                            : `$${tier.officialRatePer1MCharsUsd.toFixed(2)} / 1M chars`}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[#34D399] font-semibold">
                          {formatUsd(perMinUsd, 4)}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right text-amber-300 font-bold">
                          {formatInr(perMinInr, 2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right text-zinc-200">
                          {formatUsd(monthlyUsd, 2)} ·{' '}
                          <span className="text-amber-300 font-semibold">
                            {formatInr(monthlyInr, 2)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[11px] text-zinc-400">
                          <span className="text-zinc-300 font-mono">{tier.sampleVoiceTag}</span>
                          {' · '}
                          <span>{tier.bestUseCase}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROW 3: GOOGLE CLOUD SPEECH, GEMINI AI, TRANSLATION & VIDEO SERVICES TABLE */}
          <div className="rounded-xl bg-[#16161D] border border-white/[0.07] overflow-hidden">
            <div className="px-4 py-3 bg-[#191922] border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-white">
                  04. Google Cloud Speech, Gemini AI, Translation &amp; Video Services — Cost per 1 Minute
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Toggle individual Google Cloud services on or off to customize your pipeline estimate
                </p>
              </div>
              <div className="text-[11px] font-mono tabular-nums text-zinc-300">
                Active Cloud Services Subtotal:{' '}
                <span className="text-[#34D399] font-semibold">
                  {formatUsd(cloudServicesUsdPer1Min, 4)}/min
                </span>{' '}
                ({formatInr(cloudServicesUsdPer1Min * usdToInrRate, 2)}/min)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[10px] text-zinc-400 bg-[#13131A]">
                    <th className="py-2.5 px-4 font-semibold">Include</th>
                    <th className="py-2.5 px-3 font-semibold">Google Cloud Service</th>
                    <th className="py-2.5 px-3 font-semibold">Pricing Basis</th>
                    <th className="py-2.5 px-3 font-semibold text-right">
                      1 Min Cost ($ USD)
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-right">
                      1 Min Cost (₹ INR)
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-right">
                      {monthlyMinutesVolume.toLocaleString()} Mins / Mo ($ / ₹)
                    </th>
                    <th className="py-2.5 px-4 font-semibold">Pipeline Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {GOOGLE_CLOUD_PIPELINE_SERVICES.map((svc) => {
                    const isIncluded = enabledServiceIds.includes(svc.id);
                    const perMinUsd = getServiceUsdPerMinute(svc);
                    const perMinInr = perMinUsd * usdToInrRate;
                    const billableMins = applyFreeTier
                      ? Math.max(0, monthlyMinutesVolume - svc.freeTierMonthlyMinutes)
                      : monthlyMinutesVolume;
                    const monthlyUsd = billableMins * perMinUsd;
                    const monthlyInr = monthlyUsd * usdToInrRate;

                    return (
                      <tr
                        key={svc.id}
                        onClick={() => toggleServiceId(svc.id)}
                        className={`cursor-pointer transition-colors ${
                          isIncluded
                            ? 'bg-[#152C21]/65 hover:bg-[#152C21]'
                            : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isIncluded
                                ? 'bg-[#2BAE66] border-[#2BAE66] text-white'
                                : 'border-zinc-600'
                            }`}
                          >
                            {isIncluded && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white">{svc.name}</div>
                          <div className="text-[10px] text-zinc-400">{svc.providerLabel}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-zinc-300">
                          {svc.pricingModel}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[#34D399] font-semibold">
                          {formatUsd(perMinUsd, 4)}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right text-amber-300 font-bold">
                          {formatInr(perMinInr, 2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right text-zinc-200">
                          {formatUsd(monthlyUsd, 2)} ·{' '}
                          <span className="text-amber-300 font-semibold">
                            {formatInr(monthlyInr, 2)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[11px] text-zinc-400">
                          {svc.roleDescription}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROW 4: MONTHLY VOLUME PROJECTION MATRIX (1 Min to 10,000 Mins/Month in USD & INR) */}
          <div className="rounded-xl bg-[#16161D] border border-white/[0.07] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white">
                  05. Monthly Production Volume Projections (USD $ &amp; INR ₹)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Total estimated spend for your active stack across monthly minute tiers (1 USD = ₹
                  {usdToInrRate.toFixed(2)})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {VOLUME_TIERS_MINUTES.map((mins) => {
                const tierUsd = calculateMonthlyTotalUsd(mins);
                const tierInr = tierUsd * usdToInrRate;
                const isSelected = monthlyMinutesVolume === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setMonthlyMinutesVolume(mins)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#152C21] border-[#2BAE66] text-white'
                        : 'bg-[#121218] border-white/[0.06] text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <div className="text-[11px] font-semibold text-zinc-300">
                      {mins === 1 ? '1 Minute' : `${mins.toLocaleString()} Mins / Mo`}
                    </div>
                    <div className="mt-1.5 font-mono tabular-nums text-sm font-bold text-amber-300">
                      {formatInr(tierInr, 2)}
                    </div>
                    <div className="font-mono tabular-nums text-[11px] text-[#34D399]">
                      {formatUsd(tierUsd, mins === 1 ? 4 : 2)} USD
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-5 py-3 bg-[#15151C] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
            1-Min Total: <span className="text-white font-bold">{formatUsd(totalUsdPer1Min, 4)}</span> (
            <span className="text-amber-300 font-bold">{formatInr(totalInrPer1Min, 2)}</span>) ·{' '}
            {monthlyMinutesVolume.toLocaleString()} Mins/Mo:{' '}
            <span className="text-white font-bold">{formatUsd(selectedMonthlyTotalUsd, 2)}</span> (
            <span className="text-amber-300 font-bold">{formatInr(selectedMonthlyTotalInr, 2)}</span>)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-lg bg-[#1E1E26] hover:bg-[#282833] border border-white/10 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Summary</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCsvReport}
              className="px-4 py-2 rounded-lg bg-[#2BAE66] hover:bg-[#249957] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .CSV Cost Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
