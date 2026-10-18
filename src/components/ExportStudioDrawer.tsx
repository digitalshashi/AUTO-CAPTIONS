import React from 'react';
import {
  X,
  Download,
  Film,
  FileText,
  Layers,
  Clapperboard,
  Music,
  CheckCircle2,
  Sparkles,
  FileCode2,
  Square,
} from 'lucide-react';
import {
  ExportResolution,
  ExportFrameRate,
  ExportTypeOption,
  VideoExportFormat,
  getExportResolutionDimensions,
} from '../utils/audioExtractor';
import { VideoAspectRatio } from '../types/caption';

interface ExportStudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: ExportTypeOption;
  onChangeExportType: (type: ExportTypeOption) => void;
  exportResolution: ExportResolution;
  onChangeExportResolution: (res: ExportResolution) => void;
  exportFormat: VideoExportFormat;
  onChangeExportFormat: (fmt: VideoExportFormat) => void;
  exportFps: ExportFrameRate;
  onChangeExportFps: (fps: ExportFrameRate) => void;
  aspectRatio: VideoAspectRatio;
  primaryTrackLabel: string;
  isExportingVideo: boolean;
  exportProgress: number;
  onTriggerPrimaryRender: () => void;
  onStopExportNow: () => void;
  onExportBurnedVideo: (
    format?: VideoExportFormat,
    resolution?: ExportResolution,
    fps?: ExportFrameRate
  ) => void;
  onExportSRT: () => void;
  onExportVTT: () => void;
  onExportJSON: () => void;
  onExportPremiereXML: () => void;
  onExportPremiereFCPXML: () => void;
  onExportDaVinciFCPXML: () => void;
  onExportDaVinciEDL: () => void;
  onExportAlphaOverlay: (resolution?: ExportResolution) => void;
  onExportAudioWAV: () => void;
}

export const ExportStudioDrawer: React.FC<ExportStudioDrawerProps> = ({
  isOpen,
  onClose,
  exportType,
  onChangeExportType,
  exportResolution,
  onChangeExportResolution,
  exportFormat,
  onChangeExportFormat,
  exportFps,
  onChangeExportFps,
  aspectRatio,
  primaryTrackLabel,
  isExportingVideo,
  exportProgress,
  onTriggerPrimaryRender,
  onStopExportNow,
  onExportBurnedVideo,
  onExportSRT,
  onExportVTT,
  onExportJSON,
  onExportPremiereXML,
  onExportPremiereFCPXML,
  onExportDaVinciFCPXML,
  onExportDaVinciEDL,
  onExportAlphaOverlay,
  onExportAudioWAV,
}) => {
  if (!isOpen) return null;

  const resMeta = getExportResolutionDimensions(
    exportResolution,
    aspectRatio || '9:16'
  );

  const renderButtonLabel = () => {
    if (isExportingVideo && (exportType === 'video' || exportType === 'alpha-webm')) {
      return `Rendering ${exportResolution.toUpperCase()} (${exportProgress}%)`;
    }
    switch (exportType) {
      case 'video':
        return `Render (${exportResolution.toUpperCase()} ${exportFormat.toUpperCase()})`;
      case 'srt':
        return 'Export .SRT File';
      case 'premiere-xml':
        return 'Export Premiere Pro (.XML)';
      case 'davinci-fcpxml':
        return 'Export DaVinci Resolve (.FCPXML)';
      case 'davinci-edl':
        return 'Export DaVinci Resolve (.EDL)';
      case 'alpha-webm':
        return `Render Alpha Overlay (${exportResolution.toUpperCase()})`;
      case 'vtt':
        return 'Export .VTT File';
      case 'json':
        return 'Export .JSON File';
      case 'wav':
        return 'Export .WAV Audio';
      default:
        return 'Render';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px] animate-fadeIn">
      {/* Click outside backdrop to close */}
      <div
        className="flex-1 h-full cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right-Side Export Drawer matching reference screenshot */}
      <aside className="w-full max-w-[440px] h-full bg-[#131315] border-l border-white/[0.08] flex flex-col justify-between text-[#E5E1E4] shadow-[0_0_60px_rgba(0,0,0,0.85)] select-none z-10">
        {/* Top Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Export
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-[#24B47E]/15 border border-[#24B47E]/30 text-[10px] font-bold text-[#34D399] uppercase tracking-wider">
              {primaryTrackLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8E9192] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Close Export Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Active Video Export Progress Banner (All options remain interactive while exporting!) */}
          {isExportingVideo && (
            <div className="p-4 rounded-xl bg-[#162921] border border-[#24B47E]/50 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#24B47E] animate-ping" />
                  <span className="text-xs font-bold text-white">
                    Exporting {exportResolution.toUpperCase()} Video ({resMeta.width}×{resMeta.height})...
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#34D399]">
                  {exportProgress}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#24B47E] to-[#34D399] transition-all duration-150"
                  style={{ width: `${Math.max(4, exportProgress)}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] text-[#A7F3D0]">
                  You can still export .SRT, Premiere Pro &amp; DaVinci files below while rendering!
                </span>
                <button
                  type="button"
                  onClick={onStopExportNow}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#050505] text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow"
                  title="Finish and save video up to current timestamp immediately"
                >
                  <Square className="w-3 h-3 fill-[#050505]" />
                  <span>Save Now</span>
                </button>
              </div>
            </div>
          )}

          {/* 1. TYPE SELECTOR (Exact match to screenshot 'Type' dropdown with all Video, .SRT, Premiere Pro & DaVinci options) */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#A1A1AA]">
              Type
            </label>
            <div className="relative">
              <select
                value={exportType}
                onChange={(e) =>
                  onChangeExportType(e.target.value as ExportTypeOption)
                }
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#1C1B1E] hover:bg-[#242327] border border-white/[0.1] text-sm font-medium text-white focus:outline-none focus:border-[#24B47E] transition-colors cursor-pointer"
              >
                <option value="video">Video ({exportResolution.toUpperCase()} · {exportFormat.toUpperCase()})</option>
                <option value="srt">SRT Subtitle (.srt)</option>
                <option value="premiere-xml">Premiere Pro Sequence (.xml / .fcpxml)</option>
                <option value="davinci-fcpxml">DaVinci Resolve Timeline (.fcpxml)</option>
                <option value="davinci-edl">DaVinci Resolve Markers &amp; Clips (.edl)</option>
                <option value="alpha-webm">Transparent Caption Overlay (.webm Alpha)</option>
                <option value="vtt">WebVTT Subtitle (.vtt)</option>
                <option value="json">Multi-Language Transcript (.json)</option>
                <option value="wav">Studio Audio Track (.wav)</option>
              </select>
            </div>
          </div>

          {/* 2. RESOLUTION SELECTOR: 720p | 1080p | 4k (Exact match to screenshot!) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-[#A1A1AA]">
                Resolution
              </label>
              <span className="text-[11px] font-mono text-[#34D399]">
                {resMeta.width} × {resMeta.height} px · {resMeta.bitrateMbps} Mbps
              </span>
            </div>

            <div className="grid grid-cols-3 p-1 rounded-lg bg-[#1C1B1E] border border-white/[0.08]">
              {(
                [
                  { id: '720p', label: '720p', sub: 'HD' },
                  { id: '1080p', label: '1080p', sub: 'Full HD' },
                  { id: '4k', label: '4k', sub: 'Ultra HD' },
                ] as { id: ExportResolution; label: string; sub: string }[]
              ).map((res) => {
                const active = exportResolution === res.id;
                return (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => onChangeExportResolution(res.id)}
                    className={`py-2 px-3 rounded-md text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                      active
                        ? 'bg-[#24B47E] text-[#050505] shadow-md'
                        : 'text-[#E5E1E4] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>{res.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick 1-Click Direct Video Render Buttons for 720p, 1080p, and 4K */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(
                [
                  {
                    id: '720p' as ExportResolution,
                    title: 'Export 720p',
                    dims:
                      aspectRatio === '16:9'
                        ? '1280×720'
                        : aspectRatio === '1:1'
                        ? '720×720'
                        : '720×1280',
                  },
                  {
                    id: '1080p' as ExportResolution,
                    title: 'Export 1080p',
                    dims:
                      aspectRatio === '16:9'
                        ? '1920×1080'
                        : aspectRatio === '1:1'
                        ? '1080×1080'
                        : '1080×1920',
                  },
                  {
                    id: '4k' as ExportResolution,
                    title: 'Export 4K',
                    dims:
                      aspectRatio === '16:9'
                        ? '3840×2160'
                        : aspectRatio === '1:1'
                        ? '2160×2160'
                        : '2160×3840',
                  },
                ]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChangeExportResolution(item.id);
                    onChangeExportType('video');
                    onExportBurnedVideo(exportFormat, item.id, exportFps);
                  }}
                  className={`px-2.5 py-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    exportResolution === item.id
                      ? 'bg-[#24B47E]/15 border-[#24B47E]/50 text-white'
                      : 'bg-[#1C1B1E] border-white/[0.06] text-zinc-300 hover:border-white/20'
                  }`}
                  title={`Immediately render and download ${item.title} (${item.dims}) video`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-bold text-[#34D399]">
                      {item.title}
                    </span>
                    <Download className="w-3 h-3 text-[#24B47E]" />
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400 mt-0.5">
                    {item.dims} · {exportFormat.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. VIDEO CONTAINER FORMAT & FRAME RATE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#A1A1AA]">
                Video Format
              </label>
              <div className="grid grid-cols-3 p-0.5 rounded-lg bg-[#1C1B1E] border border-white/[0.08]">
                {(
                  [
                    { id: 'mp4', label: 'MP4' },
                    { id: 'mov', label: 'MOV' },
                    { id: 'webm', label: 'WEBM' },
                  ] as { id: VideoExportFormat; label: string }[]
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => onChangeExportFormat(fmt.id)}
                    className={`py-1.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      exportFormat === fmt.id
                        ? 'bg-[#24B47E] text-[#050505]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#A1A1AA]">
                Frame Rate
              </label>
              <div className="grid grid-cols-3 p-0.5 rounded-lg bg-[#1C1B1E] border border-white/[0.08]">
                {([24, 30, 60] as ExportFrameRate[]).map((fps) => (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => onChangeExportFps(fps)}
                    className={`py-1.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      exportFps === fps
                        ? 'bg-[#24B47E] text-[#050505]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {fps}fps
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. SUBTITLES (.SRT / .VTT) & NLE PROJECT FILES (PREMIERE PRO & DAVINCI RESOLVE) */}
          <div className="pt-2 border-t border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Clapperboard className="w-3.5 h-3.5 text-[#24B47E]" />
                  <span>Subtitles, Premiere Pro &amp; DaVinci Resolve</span>
                </h3>
                <p className="text-[10px] text-[#8E9192] mt-0.5">
                  Click any file format below to download immediately (works anytime &amp; during video export)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* .SRT Subtitle Export */}
              <div className="p-3 rounded-xl bg-[#1C1B1E] border border-white/[0.08] hover:border-[#24B47E]/40 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#24B47E]/15 border border-[#24B47E]/30 flex items-center justify-center text-[#34D399] shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>SubRip Subtitle (.SRT)</span>
                      <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] font-mono text-zinc-300">
                        .srt
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 truncate">
                      Time-synced captions for Premiere Pro, DaVinci, YouTube &amp; IG
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onExportSRT}
                  className="px-3 py-1.5 rounded-lg bg-[#24B47E] hover:bg-[#199A68] text-[#050505] text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.SRT</span>
                </button>
              </div>

              {/* Adobe Premiere Pro (.XML & .FCPXML) */}
              <div className="p-3 rounded-xl bg-[#1C1B1E] border border-white/[0.08] hover:border-purple-500/40 transition-all space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 font-bold text-xs">
                      Pr
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Adobe Premiere Pro Project Files</span>
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-[9px] font-mono text-purple-300">
                          {exportResolution.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">
                        Editable sequence XML, caption titles &amp; markers ({resMeta.width}×{resMeta.height})
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onExportPremiereXML}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Download native Adobe Premiere Pro XMEML (.xml) sequence"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Premiere (.XML)</span>
                  </button>
                  <button
                    type="button"
                    onClick={onExportPremiereFCPXML}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Download Premiere Pro / Final Cut Pro (.fcpxml) timeline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Premiere (.FCPXML)</span>
                  </button>
                </div>
              </div>

              {/* Blackmagic DaVinci Resolve (.FCPXML & .EDL) */}
              <div className="p-3 rounded-xl bg-[#1C1B1E] border border-white/[0.08] hover:border-sky-500/40 transition-all space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-300 shrink-0 font-bold text-xs">
                      Dv
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>DaVinci Resolve Studio Files</span>
                        <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-[9px] font-mono text-sky-300">
                          {exportResolution.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">
                        FCPXML 1.9 timeline &amp; CMX 3600 EDL markers ({resMeta.width}×{resMeta.height})
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onExportDaVinciFCPXML}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Import in DaVinci Resolve via File -> Import -> Timeline (.fcpxml)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DaVinci (.FCPXML)</span>
                  </button>
                  <button
                    type="button"
                    onClick={onExportDaVinciEDL}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/25 border border-sky-500/30 text-sky-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Import in DaVinci Resolve as CMX 3600 EDL Timeline & Subtitle Markers (.edl)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DaVinci (.EDL)</span>
                  </button>
                </div>
              </div>

              {/* Transparent Alpha Caption Overlay (.WEBM) for Premiere Pro & DaVinci Track V2 */}
              <div className="p-3 rounded-xl bg-[#1C1B1E] border border-white/[0.08] hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Transparent Caption Overlay</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[9px] font-mono text-emerald-300">
                        Alpha .WEBM
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 truncate">
                      Drop animated captions onto Track V2 in Premiere / DaVinci
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onExportAlphaOverlay(exportResolution)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Alpha</span>
                </button>
              </div>

              {/* Additional Formats Row: .VTT | .JSON | .WAV Audio */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onExportVTT}
                  className="px-2.5 py-2 rounded-lg bg-[#1C1B1E] hover:bg-[#26252A] border border-white/[0.08] text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#24B47E]" />
                  <span>.VTT</span>
                </button>
                <button
                  type="button"
                  onClick={onExportJSON}
                  className="px-2.5 py-2 rounded-lg bg-[#1C1B1E] hover:bg-[#26252A] border border-white/[0.08] text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>.JSON</span>
                </button>
                <button
                  type="button"
                  onClick={onExportAudioWAV}
                  className="px-2.5 py-2 rounded-lg bg-[#1C1B1E] hover:bg-[#26252A] border border-white/[0.08] text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Music className="w-3.5 h-3.5 text-sky-400" />
                  <span>.WAV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar: Back | Render (Matches reference screenshot!) */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#131315] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-[#1C1B1E] hover:bg-[#27272B] border border-white/[0.08] text-xs font-semibold text-[#E5E1E4] transition-colors cursor-pointer"
          >
            Back
          </button>

          <button
            type="button"
            onClick={onTriggerPrimaryRender}
            className="px-6 py-2.5 rounded-lg bg-[#24B47E] hover:bg-[#1E9E6D] text-[#050505] text-xs font-bold shadow-[0_0_24px_rgba(36,180,126,0.28)] flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{renderButtonLabel()}</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
