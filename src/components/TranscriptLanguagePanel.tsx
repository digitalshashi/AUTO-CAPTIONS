import React, { useState } from 'react';
import {
  Upload,
  Video,
  Sparkles,
  Plus,
  Trash2,
  Search,
  Check,
  Loader2,
  Layers,
  Wand2,
  Play,
  Scissors,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  CaptionSegment,
  CaptionStyleConfig,
  SampleReel,
  TrackKey,
} from '../types/caption';
import { INDIAN_LANGUAGE_MATRIX, SAMPLE_REELS } from '../data/presetsAndLanguages';

interface TranscriptLanguagePanelProps {
  segments: CaptionSegment[];
  currentTime: number;
  duration: number;
  styleConfig: CaptionStyleConfig;
  activeSampleReel: SampleReel;
  uploadedVideoName: string | null;
  detectedLanguage: string;
  isTranscribing: boolean;
  transcribeStage: string;
  translatingTrack: TrackKey | null;
  isRewriting: boolean;
  sourceLanguageHint: string;
  onSourceLanguageHintChange: (hint: string) => void;
  onUploadFile: (file: File) => void;
  onStartCameraRecord: () => void;
  onSelectSampleReel: (reel: SampleReel) => void;
  onGenerateCaptionsNow: () => void;
  onSelectPrimaryTrack: (track: TrackKey) => void;
  onSelectSecondaryTrack: (track: TrackKey) => void;
  onToggleDisplayMode: (mode: 'single' | 'dual-stacked') => void;
  onSeekTo: (seconds: number) => void;
  onUpdateSegmentText: (segmentId: string, trackKey: TrackKey, newText: string) => void;
  onToggleWordHero: (segmentId: string, trackKey: TrackKey, wordIndex: number) => void;
  onUpdateSegmentTiming: (segmentId: string, startTime: number, endTime: number) => void;
  onSplitSegment: (segmentId: string) => void;
  onAddSegment: () => void;
  onDeleteSegment: (segmentId: string) => void;
  onRewriteTrackTone: (tone: string) => void;
  autoHeroNLP: boolean;
  onToggleAutoHeroNLP: () => void;
  isRunningAutoHero: boolean;
  onRunAutoHeroNLP: () => void;
  autoSyncDialogue: boolean;
  onToggleAutoSyncDialogue: () => void;
  onSyncToVoiceNow: () => void;
  onTapSyncActiveToPlayhead: () => void;
  onNudgeDialogueTiming: (offsetSeconds: number, stretchFactor?: number) => void;
  focusedSection: 'workspace' | 'languages' | 'style' | 'export';
}

const QUICK_FAVORITE_TRACKS: TrackKey[] = [
  'tinglish',
  'english',
  'telugu',
  'hinglish',
  'hindi',
  'tanglish',
  'tamil',
  'kannada',
  'malayalam',
];

export const TranscriptLanguagePanel: React.FC<TranscriptLanguagePanelProps> = ({
  segments,
  currentTime,
  duration,
  styleConfig,
  activeSampleReel,
  uploadedVideoName,
  isTranscribing,
  transcribeStage,
  translatingTrack,
  isRewriting,
  sourceLanguageHint,
  onSourceLanguageHintChange,
  onUploadFile,
  onStartCameraRecord,
  onSelectSampleReel,
  onGenerateCaptionsNow,
  onSelectPrimaryTrack,
  onSelectSecondaryTrack,
  onToggleDisplayMode,
  onSeekTo,
  onUpdateSegmentText,
  onToggleWordHero,
  onUpdateSegmentTiming,
  onSplitSegment,
  onAddSegment,
  onDeleteSegment,
  onRewriteTrackTone,
  autoHeroNLP,
  onToggleAutoHeroNLP,
  isRunningAutoHero,
  onRunAutoHeroNLP,
  autoSyncDialogue,
  onToggleAutoSyncDialogue,
  onSyncToVoiceNow,
  onTapSyncActiveToPlayhead,
  onNudgeDialogueTiming,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  const displayedLanguages = showAllLanguages
    ? INDIAN_LANGUAGE_MATRIX
    : INDIAN_LANGUAGE_MATRIX.filter((l) => QUICK_FAVORITE_TRACKS.includes(l.key));

  const filteredSegments = segments.filter((seg) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const pText = seg.tracks[styleConfig.primaryTrack]?.text?.toLowerCase() || '';
    const sText = seg.tracks[styleConfig.secondaryTrack]?.text?.toLowerCase() || '';
    const tText = seg.tracks.tinglish?.text?.toLowerCase() || '';
    const eText = seg.tracks.english?.text?.toLowerCase() || '';
    return pText.includes(q) || sText.includes(q) || tText.includes(q) || eText.includes(q);
  });

  const primaryMeta =
    INDIAN_LANGUAGE_MATRIX.find((l) => l.key === styleConfig.primaryTrack) ||
    INDIAN_LANGUAGE_MATRIX[0];
  const secondaryMeta =
    INDIAN_LANGUAGE_MATRIX.find((l) => l.key === styleConfig.secondaryTrack) ||
    INDIAN_LANGUAGE_MATRIX[2];

  const isTrackPopulated = (key: TrackKey) => {
    return segments.some((s) => Boolean(s.tracks[key]?.text));
  };

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <aside className="w-full lg:w-[400px] xl:w-[420px] shrink-0 border-r border-white/[0.08] bg-[#141417]/95 backdrop-blur-2xl flex flex-col h-full select-none">
      {/* STEP 1: Apple-Style Video Upload & Source Card */}
      <div className="p-3.5 border-b border-white/[0.07] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              1. Video, Voice Sync &amp; Language
            </h2>
            <p className="text-xs text-zinc-400 font-mono-tabular">
              {uploadedVideoName
                ? `${uploadedVideoName} · ${formatMinSec(duration)}`
                : `${activeSampleReel.title} · ${formatMinSec(activeSampleReel.duration)}`}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0A84FF] hover:bg-[#0070E0] rounded-xl shadow-sm transition-all whitespace-nowrap shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Video</span>
              <input
                type="file"
                accept="video/*,audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <button
              type="button"
              onClick={onStartCameraRecord}
              title="Record from Camera"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-200 bg-[#242429] hover:bg-[#2F2F36] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Video className="w-3.5 h-3.5 text-zinc-300" />
              <span>Camera</span>
            </button>
          </div>
        </div>

        {/* Apple Segmented Control for Demo Reels + Spoken Language Hint */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center bg-[#202025] p-1 rounded-xl flex-1">
            {SAMPLE_REELS.map((sample) => {
              const isSelected = !uploadedVideoName && activeSampleReel.id === sample.id;
              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => onSelectSampleReel(sample)}
                  className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-[#34343C] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {sample.id === 'hyd-tech-creator' ? '12s Demo' : '1m 15s Demo'}
                </button>
              );
            })}
          </div>

          <select
            value={sourceLanguageHint}
            onChange={(e) => onSourceLanguageHintChange(e.target.value)}
            aria-label="Spoken language hint"
            className="bg-[#202025] text-xs font-medium text-zinc-200 border border-white/[0.06] rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#0A84FF]"
          >
            <option value="auto">Auto-Detect</option>
            <option value="Telugu / Tinglish">Telugu / Tinglish</option>
            <option value="Hindi / Hinglish">Hindi / Hinglish</option>
            <option value="Tamil / Tanglish">Tamil / Tanglish</option>
            <option value="Kannada / Kanglish">Kannada</option>
            <option value="Malayalam / Manglish">Malayalam</option>
            <option value="English">English</option>
          </select>
        </div>

        {/* DIALOGUE SYNC STUDIO: Toggle Auto-Sync vs Unsynced + 1-Tap Voice Sync & Offset Nudge */}
        <div className="p-2.5 rounded-xl bg-[#1C1C22] border border-[#0A84FF]/30 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                <span>Dialogue Sync Option</span>
                <span className="text-[10px] font-mono-tabular text-[#5AC8FA]">
                  ({autoSyncDialogue ? 'Synced to Voice' : 'Unsynced / Manual'})
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 truncate">
                Switch between 100% Voice Sync (VAD) or Unsynced Free Timing
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleAutoSyncDialogue}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                autoSyncDialogue
                  ? 'bg-[#0A84FF] text-white shadow-sm'
                  : 'bg-[#282832] text-amber-300 border border-amber-400/30'
              }`}
            >
              {autoSyncDialogue ? 'VOICE SYNC ON' : 'UNSYNCED MODE'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={onSyncToVoiceNow}
              className="py-1.5 px-2.5 rounded-lg bg-[#0A84FF]/20 hover:bg-[#0A84FF]/30 border border-[#0A84FF]/40 text-[#5AC8FA] text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              title="Snap all captions to detected voice dialogue windows"
            >
              <Sparkles className="w-3 h-3 text-[#FFD60A]" />
              <span>1-Tap Sync to Voice</span>
            </button>

            <button
              type="button"
              onClick={onTapSyncActiveToPlayhead}
              className="py-1.5 px-2.5 rounded-lg bg-[#262632] hover:bg-[#323242] border border-white/10 text-white text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              title="Snap active or next caption to current video playhead time"
            >
              <Play className="w-3 h-3 text-[#30D158] fill-[#30D158]" />
              <span>Sync Line @ {currentTime.toFixed(1)}s</span>
            </button>
          </div>

          {/* Fine Dialogue Timing Nudge (-0.5s, -0.1s, +0.1s, +0.5s) */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/[0.05]">
            <span className="text-[10px] text-zinc-400">Shift Dialogues:</span>
            <div className="flex items-center gap-1">
              {(
                [
                  { label: '-0.5s', delta: -0.5 },
                  { label: '-0.1s', delta: -0.1 },
                  { label: '+0.1s', delta: 0.1 },
                  { label: '+0.5s', delta: 0.5 },
                ] as const
              ).map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => onNudgeDialogueTiming(btn.delta, 1)}
                  className="px-2 py-0.5 rounded bg-[#121216] hover:bg-[#282834] text-[10px] font-mono-tabular font-semibold text-zinc-200 border border-white/[0.06] cursor-pointer"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Auto-Hero NLP Transcription Toggle */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#1C1C22] border border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD60A] shrink-0" />
            <div className="truncate">
              <div className="text-[11px] font-semibold text-white">
                Auto-Hero NLP Highlighting
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleAutoHeroNLP}
            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
              autoHeroNLP
                ? 'bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/40'
                : 'bg-[#282830] text-zinc-400 border border-white/10'
            }`}
          >
            {autoHeroNLP ? 'AUTO-HERO ON' : 'OFF'}
          </button>
        </div>

        {uploadedVideoName && (
          <button
            type="button"
            disabled={isTranscribing}
            onClick={onGenerateCaptionsNow}
            className="w-full py-2 px-4 rounded-xl bg-[#242429] hover:bg-[#2F2F36] border border-white/10 disabled:opacity-60 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0A84FF]" />
                <span className="truncate">
                  {transcribeStage || 'Creating captions from 0:00...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>Regenerate Captions (From 0:00 + Auto-Hero NLP)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* STEP 2: Easy 1-Tap Language & Dual-Line Picker */}
      <div className="p-4 border-b border-white/[0.07] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-white">
            Choose Caption Language
          </span>

          {/* Simple Apple Segmented Pill for 1 Line vs 2 Stacked Lines */}
          <div className="flex items-center bg-[#202025] p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => onToggleDisplayMode('single')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                styleConfig.displayMode === 'single'
                  ? 'bg-[#34343C] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              1 Line
            </button>
            <button
              type="button"
              onClick={() => onToggleDisplayMode('dual-stacked')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                styleConfig.displayMode === 'dual-stacked'
                  ? 'bg-[#0A84FF] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>2 Lines Stacked</span>
            </button>
          </div>
        </div>

        {/* Clean 3-Column Apple Pill Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {displayedLanguages.map((lang) => {
            const isPrimary = styleConfig.primaryTrack === lang.key;
            const populated = isTrackPopulated(lang.key);
            const isLoading = translatingTrack === lang.key;

            return (
              <button
                key={lang.key}
                type="button"
                disabled={isLoading}
                onClick={() => onSelectPrimaryTrack(lang.key)}
                className={`px-3 py-2 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-1 ${
                  isPrimary
                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                    : 'bg-[#202025] text-zinc-200 hover:bg-[#2A2A32]'
                }`}
              >
                <span className="text-xs truncate">{lang.shortLabel}</span>
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-[#0A84FF] shrink-0" />
                ) : isPrimary ? (
                  <Check className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
                ) : populated ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => setShowAllLanguages((v) => !v)}
            className="text-xs font-medium text-[#0A84FF] hover:underline flex items-center gap-1 cursor-pointer"
          >
            {showAllLanguages ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Show Top 9 Languages</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Show All 16 Indian Languages</span>
              </>
            )}
          </button>

          {styleConfig.displayMode === 'dual-stacked' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-zinc-400">2nd Line:</span>
              <select
                value={styleConfig.secondaryTrack}
                onChange={(e) => onSelectSecondaryTrack(e.target.value as TrackKey)}
                className="bg-[#202025] text-[#5AC8FA] font-semibold text-xs px-2 py-1 rounded-lg border border-white/10 focus:outline-none"
              >
                {INDIAN_LANGUAGE_MATRIX.map((lang) => (
                  <option key={lang.key} value={lang.key}>
                    {lang.shortLabel} ({lang.label.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* STEP 3: Simple Storyboard Caption List + 1-Tap Big Words */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${segments.length} captions...`}
              className="w-full bg-[#202025] text-xs text-white placeholder-zinc-500 pl-8 pr-3 py-1.5 rounded-xl border border-transparent focus:outline-none focus:border-[#0A84FF]"
            />
          </div>

          <button
            type="button"
            disabled={isRunningAutoHero}
            onClick={onRunAutoHeroNLP}
            title="Use NLP to automatically mark emotional & impactful words as isHero"
            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#FF5A1F]/25 to-[#FF2D55]/25 hover:from-[#FF5A1F]/40 hover:to-[#FF2D55]/40 border border-[#FF5A1F]/40 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isRunningAutoHero ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFD60A]" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#FFD60A]" />
            )}
            <span>Auto-Hero</span>
          </button>

          <button
            type="button"
            disabled={isRewriting}
            onClick={() => onRewriteTrackTone('Viral High-Energy Tinglish / Creator Slang')}
            title="Make captions punchier with AI"
            className="px-2.5 py-1.5 text-xs font-medium text-zinc-200 bg-[#202025] hover:bg-[#2C2C34] rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isRewriting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFD60A]" />
            ) : (
              <Wand2 className="w-3.5 h-3.5 text-[#FFD60A]" />
            )}
            <span>Polish</span>
          </button>

          <button
            type="button"
            onClick={onAddSegment}
            title="Add Caption Line"
            className="p-1.5 text-zinc-200 bg-[#202025] hover:bg-[#2C2C34] rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Caption Cards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredSegments.map((seg, idx) => {
            const isActive =
              currentTime >= seg.startTime && currentTime <= seg.endTime;
            const primaryTrackObj = seg.tracks[styleConfig.primaryTrack];
            const primaryText = primaryTrackObj?.text || '';
            const primaryWords = primaryTrackObj?.words || [];
            const secondaryText =
              seg.tracks[styleConfig.secondaryTrack]?.text || '';

            return (
              <div
                key={seg.id}
                onClick={() => onSeekTo(seg.startTime + 0.02)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#222228] border-[#0A84FF]'
                    : 'bg-[#1B1B20] border-white/[0.05] hover:border-white/15'
                }`}
              >
                {/* Header Row: Timecode & Quick Split/Delete */}
                <div className="flex items-center justify-between gap-2 mb-2 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1.5 font-mono-tabular tabular-nums">
                    <Play
                      className={`w-3 h-3 ${
                        isActive ? 'text-[#0A84FF] fill-[#0A84FF]' : 'text-zinc-500'
                      }`}
                    />
                    <span className="text-zinc-300 font-semibold">
                      #{idx + 1}
                    </span>
                    <span aria-hidden="true">·</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={seg.startTime}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onUpdateSegmentTiming(
                          seg.id,
                          Math.max(0, parseFloat(e.target.value) || 0),
                          seg.endTime
                        )
                      }
                      className="w-12 bg-[#121215] rounded px-1 py-0.5 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#0A84FF] text-center"
                    />
                    <span>–</span>
                    <input
                      type="number"
                      step="0.1"
                      min={seg.startTime + 0.2}
                      value={seg.endTime}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onUpdateSegmentTiming(
                          seg.id,
                          seg.startTime,
                          Math.max(seg.startTime + 0.2, parseFloat(e.target.value) || 1)
                        )
                      }
                      className="w-12 bg-[#121215] rounded px-1 py-0.5 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#0A84FF] text-center"
                    />
                    <span>s</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSplitSegment(seg.id);
                      }}
                      title="Split this caption in two"
                      className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSegment(seg.id);
                      }}
                      title="Delete caption"
                      className="text-zinc-500 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Editable Primary Caption Input */}
                <input
                  type="text"
                  value={primaryText}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    onUpdateSegmentText(seg.id, styleConfig.primaryTrack, e.target.value)
                  }
                  placeholder={`Type ${primaryMeta.shortLabel} caption...`}
                  className="w-full bg-[#121216] text-xs font-medium text-white px-3 py-2 rounded-xl border border-white/[0.06] focus:outline-none focus:border-[#0A84FF]"
                />

                {/* 1-Tap Word Pills to Toggle BIG Highlighted Words (Auto-Hero NLP) */}
                {primaryWords.length > 0 && (
                  <div
                    className="flex flex-wrap items-center gap-1 mt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] text-zinc-400 mr-1 font-medium">
                      Auto-Hero (isHero):
                    </span>
                    {primaryWords.map((w, wIdx) => (
                      <button
                        key={`${seg.id}-w-${wIdx}`}
                        type="button"
                        onClick={() =>
                          onToggleWordHero(seg.id, styleConfig.primaryTrack, wIdx)
                        }
                        className={`px-2 py-0.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                          w.isHero
                            ? 'bg-gradient-to-r from-[#FF5A1F] to-[#FF2D55] text-white font-bold shadow-sm'
                            : 'bg-[#121216] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {w.isHero ? `★ ${w.word}` : w.word}
                      </button>
                    ))}
                  </div>
                )}

                {/* Secondary Stacked Line Input */}
                {styleConfig.displayMode === 'dual-stacked' &&
                  styleConfig.secondaryTrack !== styleConfig.primaryTrack && (
                    <div className="mt-2 pt-2 border-t border-white/[0.05]">
                      <input
                        type="text"
                        value={secondaryText}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          onUpdateSegmentText(
                            seg.id,
                            styleConfig.secondaryTrack,
                            e.target.value
                          )
                        }
                        placeholder={`2nd Line (${secondaryMeta.shortLabel})...`}
                        className="w-full bg-[#121216] text-xs text-[#5AC8FA] px-3 py-1.5 rounded-xl border border-sky-500/20 focus:outline-none focus:border-[#5AC8FA]"
                      />
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
