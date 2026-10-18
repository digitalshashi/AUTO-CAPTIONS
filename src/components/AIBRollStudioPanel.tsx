import React, { useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Wand2,
  Play,
  RefreshCw,
  Volume2,
  Check,
  Film,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  AIBRollSlot,
  BRollDisplayLayout,
  BRollMagicalEffect,
  BRollMotionPreset,
  BRollSfxPreset,
  CaptionSegment,
  CaptionStyleConfig,
  TrackKey,
  VideoAspectRatio,
} from '../types/caption';
import { playMagicalBRollSoundEffect } from '../utils/aiBRollGenerator';

interface AIBRollStudioPanelProps {
  segments: CaptionSegment[];
  primaryTrack: TrackKey;
  styleConfig: CaptionStyleConfig;
  aiBRollSlots: AIBRollSlot[];
  isAnalyzingScript: boolean;
  onUpdateStyle: (partial: Partial<CaptionStyleConfig>) => void;
  onUpdateSlot: (slotId: string, partial: Partial<AIBRollSlot>) => void;
  onAnalyzeAndGenerateAllThree: (aspectRatio: VideoAspectRatio) => void;
  onRegenerateSingleSlotImage: (
    slotId: string,
    prompt: string,
    aspectRatio: VideoAspectRatio
  ) => void;
  onLinkSlotToSegment: (slotId: string, segmentId: string) => void;
  onSeekTo: (time: number) => void;
}

const ASPECT_RATIO_OPTIONS: {
  id: VideoAspectRatio;
  label: string;
  desc: string;
}[] = [
  { id: '9:16', label: '9:16 Vertical', desc: 'Reels / Shorts' },
  { id: '1:1', label: '1:1 Square', desc: 'PiP / Feed Card' },
  { id: '16:9', label: '16:9 Wide', desc: 'Cinema Cutaway' },
];

const DISPLAY_LAYOUT_OPTIONS: {
  id: BRollDisplayLayout;
  label: string;
  sub: string;
}[] = [
  { id: 'cutaway', label: 'Full-Screen Cutaway', sub: 'Captions on top' },
  { id: 'pip_card', label: 'Floating PiP Card', sub: 'Framed overlay' },
  { id: 'split_backdrop', label: 'Split Backdrop', sub: 'Upper cinema split' },
];

const MOTION_PRESET_OPTIONS: {
  id: BRollMotionPreset;
  label: string;
}[] = [
  { id: 'ken_burns_zoom', label: '3D Ken Burns Zoom' },
  { id: 'pan_glide', label: 'Cinematic Pan-Glide' },
  { id: 'portal_pop', label: 'Magical Portal Pop-In' },
];

const MAGICAL_EFFECT_OPTIONS: {
  id: BRollMagicalEffect;
  label: string;
}[] = [
  { id: 'all_magic', label: '✨ All Magical Effects (Particles + Leaks + Aura)' },
  { id: 'gold_emerald_particles', label: '🌟 Gold & Emerald Sparkle Particles' },
  { id: 'light_leaks', label: '🌈 Anamorphic Light Leaks' },
  { id: 'aura_burst', label: '⚡ Glowing Aura Burst' },
];

const SFX_PRESET_OPTIONS: {
  id: BRollSfxPreset;
  label: string;
}[] = [
  { id: 'magical_chime', label: '🔔 Magical Chime' },
  { id: 'cinematic_whoosh', label: '💨 Cinematic Whoosh' },
  { id: 'bass_impact', label: '💥 Bass Impact' },
  { id: 'none', label: '🔇 Mute SFX' },
];

export const AIBRollStudioPanel: React.FC<AIBRollStudioPanelProps> = ({
  segments,
  primaryTrack,
  styleConfig,
  aiBRollSlots,
  isAnalyzingScript,
  onUpdateStyle,
  onUpdateSlot,
  onAnalyzeAndGenerateAllThree,
  onRegenerateSingleSlotImage,
  onLinkSlotToSegment,
  onSeekTo,
}) => {
  const [selectedBatchRatio, setSelectedBatchRatio] = useState<VideoAspectRatio>(
    styleConfig.aspectRatio || '9:16'
  );
  const brollEnabled = Boolean(styleConfig.brollEnabled);

  const handleBatchRatioSelect = (ratio: VideoAspectRatio) => {
    setSelectedBatchRatio(ratio);
    // Also update all 3 slots' aspect ratio immediately and regenerate their visuals
    aiBRollSlots.forEach((slot) => {
      onUpdateSlot(slot.id, { aspectRatio: ratio });
      onRegenerateSingleSlotImage(slot.id, slot.prompt, ratio);
    });
  };

  return (
    <div className="space-y-3.5 text-xs">
      {/* Header Banner: Gemini AI Script-to-B-Roll (3 Images for Video) */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#14291F] via-[#161922] to-[#231B10] border border-[#2BAE66]/45 space-y-3 shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FDE047]" />
              <h3 className="text-sm font-bold text-white">
                AI Script-to-B-Roll Studio (3 Images)
              </h3>
            </div>
            <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug">
              Analyzes your created captions with Gemini AI &amp; creates 3 apt B-Roll images with magical effects
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextEnabled = !brollEnabled;
              onUpdateStyle({ brollEnabled: nextEnabled });
              aiBRollSlots.forEach((slot) => {
                onUpdateSlot(slot.id, { enabled: nextEnabled });
              });
            }}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0 ${
              brollEnabled
                ? 'bg-[#2BAE66] text-white shadow-sm'
                : 'bg-zinc-800 text-zinc-400'
            }`}
            title="Enable or disable AI B-Roll across captions, video canvas, and timeline tracks"
          >
            {brollEnabled ? (
              <>
                <Eye className="w-3 h-3" />
                <span>B-Roll ON</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3" />
                <span>B-Roll OFF</span>
              </>
            )}
          </button>
        </div>

        {/* 1. Select B-Roll Image Aspect Ratio (9:16 | 1:1 | 16:9) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold uppercase tracking-wider text-[#34D399]">
              1. Select B-Roll Image Aspect Ratio
            </span>
            <span className="text-zinc-400 font-mono">
              Gemini Image Create ({selectedBatchRatio})
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {ASPECT_RATIO_OPTIONS.map((r) => {
              const active = selectedBatchRatio === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleBatchRatioSelect(r.id)}
                  className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    active
                      ? 'bg-[#163326] border-[#2BAE66] text-white shadow-sm ring-1 ring-[#2BAE66]/40'
                      : 'bg-[#121318] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold text-white">{r.label}</div>
                  <div className="text-[9px] text-zinc-400">{r.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. One-Click "Analyze Script & Create 3 AI B-Roll Images" CTA */}
        <button
          type="button"
          disabled={isAnalyzingScript}
          onClick={() => onAnalyzeAndGenerateAllThree(selectedBatchRatio)}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#2BAE66] via-[#10B981] to-[#F59E0B] hover:brightness-110 disabled:opacity-60 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
        >
          {isAnalyzingScript ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Analyzing Script &amp; Creating 3 B-Roll Images...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 text-zinc-950" />
              <span>
                Analyze Captions &amp; Create 3 AI B-Roll Images ({selectedBatchRatio})
              </span>
            </>
          )}
        </button>
      </div>

      {/* Global Display Layout & Magical Effects Bar */}
      <div className="p-3 rounded-2xl bg-[#171820] border border-white/10 space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          2. B-Roll Canvas Display &amp; Magical On-Screen Effects
        </div>

        {/* Switchable Display Mode: Full-Screen Cutaway | Floating PiP Card | Split Backdrop */}
        <div className="grid grid-cols-3 gap-1.5">
          {DISPLAY_LAYOUT_OPTIONS.map((layout) => {
            const curLayout =
              aiBRollSlots[0]?.displayLayout ||
              styleConfig.aiBrollLayout ||
              'cutaway';
            const isSelected = curLayout === layout.id;
            return (
              <button
                key={layout.id}
                type="button"
                onClick={() => {
                  onUpdateStyle({
                    brollEnabled: true,
                    aiBrollLayout: layout.id,
                  });
                  aiBRollSlots.forEach((s) =>
                    onUpdateSlot(s.id, { displayLayout: layout.id })
                  );
                }}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#163326] border-[#2BAE66] text-white'
                    : 'bg-[#111217] border-white/[0.07] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="text-[11px] font-bold leading-tight truncate">
                  {layout.label}
                </div>
                <div className="text-[9px] text-zinc-400 truncate mt-0.5">
                  {layout.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* Global Magical Effect & 3D Motion Quick Selectors */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">
              Magical On-Screen Effect
            </label>
            <select
              value={
                aiBRollSlots[0]?.magicalEffect ||
                styleConfig.aiBrollMagicalEffect ||
                'all_magic'
              }
              onChange={(e) => {
                const eff = e.target.value as BRollMagicalEffect;
                onUpdateStyle({ aiBrollMagicalEffect: eff });
                aiBRollSlots.forEach((s) =>
                  onUpdateSlot(s.id, { magicalEffect: eff })
                );
              }}
              className="w-full bg-[#111217] text-[#FDE047] font-semibold text-[11px] px-2.5 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#2BAE66]"
            >
              {MAGICAL_EFFECT_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">
              3D B-Roll Animation
            </label>
            <select
              value={
                aiBRollSlots[0]?.motionPreset ||
                styleConfig.aiBrollMotionPreset ||
                'ken_burns_zoom'
              }
              onChange={(e) => {
                const mot = e.target.value as BRollMotionPreset;
                onUpdateStyle({ aiBrollMotionPreset: mot });
                aiBRollSlots.forEach((s) =>
                  onUpdateSlot(s.id, { motionPreset: mot })
                );
              }}
              className="w-full bg-[#111217] text-[#34D399] font-semibold text-[11px] px-2.5 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#2BAE66]"
            >
              {MOTION_PRESET_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3 AI B-Roll Scene Cards (Scene 1, Scene 2, Scene 3) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#34D399]" />
            <span>3 Created AI B-Roll Images for Video</span>
          </span>
          <span className="text-[10px] text-zinc-400">
            Click Preview to view on canvas
          </span>
        </div>

        {aiBRollSlots.map((slot) => {
          const linkedSegIndex = segments.findIndex(
            (s) => s.id === slot.linkedSegmentId
          );

          return (
            <div
              key={slot.id}
              className={`p-3 rounded-2xl border transition-all space-y-2.5 ${
                slot.enabled
                  ? 'bg-[#16171F] border-[#2BAE66]/40 shadow-md'
                  : 'bg-[#121318] border-white/[0.06] opacity-70'
              }`}
            >
              {/* Top Row: Slot Badge + Title + Preview on Video Button + Enable Toggle */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded-md bg-[#163326] border border-[#2BAE66]/50 text-[#34D399] font-mono font-bold text-[10px] shrink-0">
                    B-ROLL #{slot.slotNumber}
                  </span>
                  <input
                    type="text"
                    value={slot.title}
                    onChange={(e) =>
                      onUpdateSlot(slot.id, { title: e.target.value })
                    }
                    className="bg-transparent text-white font-bold text-xs truncate focus:outline-none focus:border-b focus:border-[#2BAE66] min-w-0"
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStyle({ brollEnabled: true });
                      onUpdateSlot(slot.id, { enabled: true });
                      onSeekTo(slot.startTime + 0.05);
                      playMagicalBRollSoundEffect(slot.sfxPreset, 0.48);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#2BAE66] hover:bg-[#239656] text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    title="Seek video to this B-Roll scene and preview magical effects"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSlot(slot.id, { enabled: !slot.enabled })
                    }
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                      slot.enabled
                        ? 'bg-[#152E23] border-[#2BAE66]/50 text-[#34D399]'
                        : 'bg-zinc-800 border-white/10 text-zinc-400'
                    }`}
                  >
                    {slot.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Image Preview + Per-Slot Aspect Ratio & Prompt Controls */}
              <div className="grid grid-cols-12 gap-2.5 items-start">
                {/* Thumbnail Preview in Selected Aspect Ratio */}
                <div className="col-span-5 flex flex-col items-center gap-1.5">
                  <div
                    onClick={() => {
                      onUpdateStyle({ brollEnabled: true });
                      onSeekTo(slot.startTime + 0.05);
                      playMagicalBRollSoundEffect(slot.sfxPreset, 0.48);
                    }}
                    className={`relative w-full rounded-xl overflow-hidden border border-[#FDE047]/40 bg-[#0D0F14] cursor-pointer group ${
                      slot.aspectRatio === '9:16'
                        ? 'aspect-[9/16] max-h-[165px]'
                        : slot.aspectRatio === '1:1'
                        ? 'aspect-square max-h-[135px]'
                        : 'aspect-video max-h-[110px]'
                    }`}
                  >
                    {slot.imageDataUrl ? (
                      <img
                        src={slot.imageDataUrl}
                        alt={slot.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}

                    {/* Aspect Ratio Pill Badge */}
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 border border-white/20 text-[#FDE047] font-mono text-[9px] font-bold">
                      {slot.aspectRatio}
                    </span>

                    {slot.isGenerating && (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-1 text-center p-2">
                        <RefreshCw className="w-4 h-4 text-[#34D399] animate-spin" />
                        <span className="text-[9px] font-bold text-white">
                          Creating {slot.aspectRatio} Image...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Per-Slot Ratio Switcher (9:16 | 1:1 | 16:9) */}
                  <div className="grid grid-cols-3 gap-1 w-full">
                    {(['9:16', '1:1', '16:9'] as VideoAspectRatio[]).map(
                      (ratio) => (
                        <button
                          key={`${slot.id}-${ratio}`}
                          type="button"
                          onClick={() => {
                            onUpdateSlot(slot.id, { aspectRatio: ratio });
                            onRegenerateSingleSlotImage(
                              slot.id,
                              slot.prompt,
                              ratio
                            );
                          }}
                          className={`py-1 rounded text-[9px] font-mono font-bold border cursor-pointer ${
                            slot.aspectRatio === ratio
                              ? 'bg-[#2BAE66] border-[#2BAE66] text-white'
                              : 'bg-[#111217] border-white/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {ratio}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Right 7 Columns: Caption Line Selector, Prompt Editor, Animation & Regenerate Button */}
                <div className="col-span-7 space-y-2">
                  {/* Linked Caption Segment Selector */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">
                      Appear on Caption Line ({slot.startTime.toFixed(1)}s –{' '}
                      {slot.endTime.toFixed(1)}s)
                    </label>
                    <select
                      value={slot.linkedSegmentId || ''}
                      onChange={(e) =>
                        onLinkSlotToSegment(slot.id, e.target.value)
                      }
                      className="w-full bg-[#101116] text-white text-[11px] px-2 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#2BAE66]"
                    >
                      {segments.map((seg, idx) => {
                        const txt =
                          seg.tracks[primaryTrack]?.text ||
                          seg.tracks.tinglish?.text ||
                          seg.tracks.english?.text ||
                          'Caption';
                        return (
                          <option key={seg.id} value={seg.id}>
                            Line #{idx + 1} ({seg.startTime.toFixed(1)}s):{' '}
                            {txt.slice(0, 34)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* AI Visual Prompt Input */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">
                      Gemini Image Prompt (Script-Matched)
                    </label>
                    <textarea
                      rows={2}
                      value={slot.prompt}
                      onChange={(e) =>
                        onUpdateSlot(slot.id, { prompt: e.target.value })
                      }
                      placeholder="Describe B-Roll image..."
                      className="w-full bg-[#101116] text-zinc-200 text-[11px] p-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#2BAE66] resize-none leading-tight"
                    />
                  </div>

                  {/* Per-Slot Layout, Magical Effect & SFX */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={slot.displayLayout}
                      onChange={(e) =>
                        onUpdateSlot(slot.id, {
                          displayLayout: e.target.value as BRollDisplayLayout,
                        })
                      }
                      className="bg-[#101116] text-zinc-200 text-[10px] px-1.5 py-1 rounded border border-white/10"
                    >
                      {DISPLAY_LAYOUT_OPTIONS.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={slot.sfxPreset}
                      onChange={(e) => {
                        const sfx = e.target.value as BRollSfxPreset;
                        onUpdateSlot(slot.id, { sfxPreset: sfx });
                        playMagicalBRollSoundEffect(sfx, 0.48);
                      }}
                      className="bg-[#101116] text-[#34D399] text-[10px] px-1.5 py-1 rounded border border-white/10"
                    >
                      {SFX_PRESET_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Generate / Regenerate This B-Roll Image Button */}
                  <button
                    type="button"
                    disabled={slot.isGenerating}
                    onClick={() =>
                      onRegenerateSingleSlotImage(
                        slot.id,
                        slot.prompt,
                        slot.aspectRatio
                      )
                    }
                    className="w-full py-1.5 px-2.5 rounded-lg bg-[#163326] hover:bg-[#2BAE66] text-[#34D399] hover:text-white border border-[#2BAE66]/50 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>
                      {slot.isGenerating
                        ? `Creating ${slot.aspectRatio} Image...`
                        : `Create / Update ${slot.aspectRatio} B-Roll Image`}
                    </span>
                  </button>
                </div>
              </div>

              {linkedSegIndex >= 0 && (
                <div className="text-[10px] text-zinc-400 bg-[#101116] px-2.5 py-1 rounded-lg border border-white/[0.05] flex items-center justify-between">
                  <span className="truncate">
                    Script: &ldquo;{slot.scriptContext}&rdquo;
                  </span>
                  <span className="text-[#34D399] font-mono shrink-0 ml-2">
                    Line #{linkedSegIndex + 1}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
