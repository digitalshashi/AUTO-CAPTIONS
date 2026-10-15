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
} from 'lucide-react';
import {
  AudioEnhancerConfig,
  CaptionStyleConfig,
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


interface KalakarTemplatesTabProps {
  styleConfig: CaptionStyleConfig;
  userPresets: StylePreset[];
  userPlan: 'free' | 'creator' | 'pro';
  onApplyPreset: (preset: StylePreset) => void;
  onUpdateStyle: (partial: Partial<CaptionStyleConfig>) => void;
  onCreateNewPreset: (name: string, badgeText: string) => void;
  onUpgradePlan?: () => void;
}

export const KalakarTemplatesTab: React.FC<KalakarTemplatesTabProps> = ({
  styleConfig,
  userPresets,
  userPlan,
  onApplyPreset,
  onUpdateStyle,
  onCreateNewPreset,
  onUpgradePlan,
}) => {
  const [subTab, setSubTab] = useState<'builtin' | 'mypresets'>('builtin');
  const [searchQuery, setSearchQuery] = useState('');
  const [newPresetName, setNewPresetName] = useState('');

  const combinedBuiltIn = [...userPresets, ...KALAKAR_48_BUILT_IN_PRESETS];
  const filteredBuiltIn = combinedBuiltIn.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 text-xs">
      {/* Sub-tabs: Built-in Templates (48+) vs My Presets */}
      <div className="flex items-center justify-between gap-2">
        <div className="grid grid-cols-2 gap-1 bg-[#1C1C24] p-1 rounded-xl flex-1">
          <button
            type="button"
            onClick={() => setSubTab('builtin')}
            className={`py-1.5 px-2.5 rounded-lg font-bold transition-all cursor-pointer ${
              subTab === 'builtin'
                ? 'bg-[#FF5722] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Built-in Templates ({KALAKAR_48_BUILT_IN_PRESETS.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('mypresets')}
            className={`py-1.5 px-2.5 rounded-lg font-bold transition-all cursor-pointer ${
              subTab === 'mypresets'
                ? 'bg-[#FF5722] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            My Presets ({userPresets.length})
          </button>
        </div>
      </div>

      {/* Find a template search box */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Find a template (Lala, Ali Abdaal, Hormozi, Shamani, Goa, Mumbai...)"
          className="w-full bg-[#181820] text-xs text-white pl-8 pr-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5722]"
        />
      </div>

      {/* Active Template Quick Customization Bar (Colors: Primary, Secondary, Emphasis Mode, Solid/Gradient) */}
      <div className="p-3 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-white">
            Selected Template Controls
          </span>
          <div className="flex items-center gap-1 bg-[#121217] p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => onUpdateStyle({ emphasisMode: 'emphasize' })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                (styleConfig.emphasisMode || 'emphasize') === 'emphasize'
                  ? 'bg-[#30D158] text-zinc-950'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Emphasize
            </button>
            <button
              type="button"
              onClick={() => onUpdateStyle({ emphasisMode: 'spotlight' })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                styleConfig.emphasisMode === 'spotlight'
                  ? 'bg-[#30D158] text-zinc-950'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Spotlight
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-zinc-300">
              <span>Primary:</span>
              <input
                type="color"
                value={styleConfig.primaryColor}
                onChange={(e) => onUpdateStyle({ primaryColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent"
              />
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-zinc-300">
              <span>Secondary:</span>
              <input
                type="color"
                value={styleConfig.highlightColor}
                onChange={(e) =>
                  onUpdateStyle({
                    highlightColor: e.target.value,
                    gradientMid: e.target.value,
                  })
                }
                className="w-6 h-6 rounded cursor-pointer bg-transparent"
              />
            </label>
          </div>

          <div className="flex items-center gap-1 bg-[#121217] p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => onUpdateStyle({ useGradient: false })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                !styleConfig.useGradient
                  ? 'bg-white text-zinc-950'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Solid
            </button>
            <button
              type="button"
              onClick={() => onUpdateStyle({ useGradient: true })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                styleConfig.useGradient
                  ? 'bg-[#FF5722] text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Gradient
            </button>
          </div>
        </div>
      </div>

      {subTab === 'mypresets' && (
        <div className="p-3 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-2">
          <div className="text-[11px] font-bold text-white">
            Save Current Style to My Presets
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Preset name (e.g. My Telugu Hook)..."
              className="flex-1 bg-[#121217] text-white text-xs px-2.5 py-1.5 rounded-xl border border-white/10"
            />
            <button
              type="button"
              onClick={() => {
                const name = newPresetName.trim() || `CUSTOM_${userPresets.length + 1}`;
                onCreateNewPreset(name, name.toUpperCase());
                setNewPresetName('');
              }}
              className="px-3 py-1.5 rounded-xl bg-[#30D158] text-zinc-950 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save preset</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid of 48 Kalakar Templates */}
      <div className="grid grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
        {(subTab === 'builtin' ? filteredBuiltIn : userPresets).map((tpl) => {
          const isSelected = styleConfig.presetId === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onApplyPreset(tpl)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-[100px] bg-gradient-to-b ${
                tpl.previewBg || 'from-zinc-900 to-black'
              } ${
                isSelected
                  ? 'border-[#FF5722] ring-2 ring-[#FF5722]/30'
                  : 'border-white/[0.08] hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between w-full gap-1">
                <span className="text-[11px] font-bold text-white truncate">
                  {tpl.name}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {tpl.isPremium && (
                    <span
                      title={
                        userPlan === 'free'
                          ? 'Premium Template (Preview on Free plan — Click Upgrade to unlock)'
                          : 'Unlocked on Creator/Pro Plan'
                      }
                      onClick={(e) => {
                        if (userPlan === 'free' && onUpgradePlan) {
                          e.stopPropagation();
                          onUpgradePlan();
                        }
                      }}
                      className="p-0.5 rounded bg-amber-500/20 text-amber-400"
                    >
                      <Crown className="w-3 h-3" />
                    </span>
                  )}
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-[#FF5722] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </div>
              </div>

              <div className="my-auto">
                {tpl.smallPreviewText && (
                  <div className="text-[9px] text-zinc-400 truncate">
                    {tpl.smallPreviewText}
                  </div>
                )}
                <div
                  className="text-sm font-black tracking-tight truncate"
                  style={{
                    fontFamily: tpl.config.fontFamily || 'Bricolage Grotesque',
                    color: tpl.config.highlightColor || '#30D158',
                  }}
                >
                  {tpl.badgeText}
                </div>
              </div>
            </button>
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
}

export const KalakarTextAndEffectsTab: React.FC<KalakarEffectsSectionProps> = ({
  styleConfig,
  customFonts,
  onUpdateStyle,
}) => {
  const [fontSearch, setFontSearch] = useState('');
  const [showDetailedSliders, setShowDetailedSliders] = useState(false);

  const filteredFonts = KALAKAR_GOOGLE_FONTS.filter((f) =>
    f.name.toLowerCase().includes(fontSearch.toLowerCase())
  );

  return (
    <div className="space-y-3.5 text-xs">
      {/* MINIMAL QUICK ENABLE / DISABLE SWITCHBOARD (Maximum Results with 1 Click) */}
      <div className="p-3.5 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-white block">
              Quick Enable / Disable Toggles
            </span>
            <span className="text-[10px] text-zinc-400">
              Minimal controls for instant visual impact
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDetailedSliders((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors ${
              showDetailedSliders
                ? 'bg-[#FF5722] text-white'
                : 'bg-[#242430] text-zinc-300 hover:text-white'
            }`}
          >
            {showDetailedSliders ? 'Hide Fine Sliders' : 'Fine-Tune Sliders'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {[
            {
              label: 'Big + Small Size',
              enabled: styleConfig.hierarchyMode !== 'uniform',
              onToggle: () =>
                onUpdateStyle({
                  hierarchyMode:
                    styleConfig.hierarchyMode === 'uniform'
                      ? 'premiere-mixed-scale'
                      : 'uniform',
                }),
            },
            {
              label: '2-Line Small Text',
              enabled: styleConfig.smallTwoLineMode === 'two-line-split',
              onToggle: () =>
                onUpdateStyle({
                  smallTwoLineMode:
                    styleConfig.smallTwoLineMode === 'two-line-split'
                      ? 'auto'
                      : 'two-line-split',
                }),
            },
            {
              label: 'Gradient Words',
              enabled: Boolean(styleConfig.useGradient),
              onToggle: () =>
                onUpdateStyle({ useGradient: !styleConfig.useGradient }),
            },
            {
              label: 'Drop Shadow',
              enabled: styleConfig.dropShadowEnabled !== false,
              onToggle: () =>
                onUpdateStyle({
                  dropShadowEnabled: styleConfig.dropShadowEnabled === false,
                  shadowBlur: styleConfig.dropShadowEnabled === false ? 18 : 0,
                }),
            },
            {
              label: 'Neon Glow',
              enabled: Boolean(styleConfig.glowEnabled),
              onToggle: () =>
                onUpdateStyle({ glowEnabled: !styleConfig.glowEnabled }),
            },
            {
              label: '3D Extrusion',
              enabled: Boolean(styleConfig.depth3DEnabled),
              onToggle: () =>
                onUpdateStyle({ depth3DEnabled: !styleConfig.depth3DEnabled }),
            },
            {
              label: 'Arch Curve',
              enabled: Boolean(styleConfig.arcEnabled),
              onToggle: () =>
                onUpdateStyle({
                  arcEnabled: !styleConfig.arcEnabled,
                  arcCurveDeg: !styleConfig.arcEnabled ? 28 : 0,
                }),
            },
            {
              label: 'Background Box',
              enabled: (styleConfig.backgroundOpacity || 0) > 0,
              onToggle: () =>
                onUpdateStyle({
                  backgroundOpacity:
                    (styleConfig.backgroundOpacity || 0) > 0 ? 0 : 85,
                }),
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onToggle}
              className={`px-2.5 py-2 rounded-xl border text-left flex items-center justify-between gap-2 cursor-pointer transition-all ${
                item.enabled
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-white'
                  : 'bg-[#131319] border-white/[0.06] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="text-[11px] font-semibold truncate">
                {item.label}
              </span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  item.enabled
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {item.enabled ? 'ON' : 'OFF'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 7.1 Fonts: Font Family (searchable 2,270+ Google Fonts), Font Face, Font Size + reset */}
      <div className="p-3.5 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white">7.1 Fonts (2,270+ Google Fonts)</span>
          <button
            type="button"
            onClick={() => onUpdateStyle({ fontSize: 32 })}
            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset 32px
          </button>
        </div>

        <input
          type="text"
          value={fontSearch}
          onChange={(e) => setFontSearch(e.target.value)}
          placeholder="Search fonts (Inter, Inter Tight, Instrument Serif, Montserrat, Zilla Slab...)"
          className="w-full bg-[#121217] text-white text-xs px-2.5 py-1.5 rounded-xl border border-white/10"
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">
              Font Family
            </label>
            <select
              value={styleConfig.fontFamily}
              onChange={(e) =>
                onUpdateStyle({
                  fontFamily: e.target.value,
                  heroWordFontFamily: e.target.value,
                })
              }
              className="w-full bg-[#121217] text-white text-xs px-2 py-1.5 rounded-xl border border-white/10"
            >
              {customFonts.map((cf) => (
                <option key={cf} value={cf}>
                  ★ {cf}
                </option>
              ))}
              {filteredFonts.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">
              Font Face
            </label>
            <select
              value={styleConfig.fontFace || 'Extra Bold (800)'}
              onChange={(e) => {
                const face = KALAKAR_FONT_FACES.find(
                  (ff) => ff.label === e.target.value
                );
                onUpdateStyle({
                  fontFace: e.target.value,
                  fontWeight: face?.weight || 800,
                });
              }}
              className="w-full bg-[#121217] text-white text-xs px-2 py-1.5 rounded-xl border border-white/10"
            >
              {KALAKAR_FONT_FACES.map((ff) => (
                <option key={ff.label} value={ff.label}>
                  {ff.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Size:</span>
          <input
            type="range"
            min={16}
            max={110}
            value={styleConfig.fontSize}
            onChange={(e) =>
              onUpdateStyle({ fontSize: parseInt(e.target.value, 10) })
            }
            className="flex-1 accent-[#FF5722] cursor-pointer"
          />
          <input
            type="number"
            min={16}
            max={110}
            value={styleConfig.fontSize}
            onChange={(e) =>
              onUpdateStyle({ fontSize: parseInt(e.target.value, 10) || 32 })
            }
            className="w-14 bg-[#121217] text-white text-center font-mono-tabular py-1 rounded-lg border border-white/10"
          />
          <span className="text-[10px] text-zinc-500">px</span>
        </div>
      </div>

      {/* 7.2 Format: Styles (Tt / T / t / U) + Text Alignment (Left, Center, Right) */}
      <div className="p-3.5 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-2.5">
        <div className="font-bold text-white">7.2 Format &amp; Alignment</div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-[#121217] p-1 rounded-xl border border-white/10">
            {(
              [
                { id: 'capitalize', label: 'Tt', title: 'Capitalize' },
                { id: 'uppercase', label: 'T', title: 'UPPERCASE' },
                { id: 'lowercase', label: 't', title: 'lowercase' },
                { id: 'none', label: 'Aa', title: 'As Typed' },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => onUpdateStyle({ textTransform: st.id })}
                title={st.title}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  styleConfig.textTransform === st.id
                    ? 'bg-[#FF5722] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                onUpdateStyle({ underlineText: !styleConfig.underlineText })
              }
              title="Underline (U)"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold underline cursor-pointer ${
                styleConfig.underlineText
                  ? 'bg-[#FF5722] text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              U
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#121217] p-1 rounded-xl border border-white/10">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                type="button"
                onClick={() =>
                  onUpdateStyle({
                    smallTextAlign: align,
                    smallLine2TextAlign: align,
                    bigTextAlign: align,
                  })
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize cursor-pointer ${
                  (styleConfig.bigTextAlign || 'center') === align
                    ? 'bg-white text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 7.5 Emphasis (highlighted words): Emphasize / Spotlight, Size, Glow color, Font & Face */}
      <div className="p-3.5 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white">
            7.5 Emphasis (Highlighted Words)
          </span>
          <div className="flex items-center gap-1 bg-[#121217] p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => onUpdateStyle({ emphasisMode: 'emphasize' })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                (styleConfig.emphasisMode || 'emphasize') === 'emphasize'
                  ? 'bg-[#30D158] text-zinc-950'
                  : 'text-zinc-400'
              }`}
            >
              Emphasize
            </button>
            <button
              type="button"
              onClick={() => onUpdateStyle({ emphasisMode: 'spotlight' })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                styleConfig.emphasisMode === 'spotlight'
                  ? 'bg-[#30D158] text-zinc-950'
                  : 'text-zinc-400'
              }`}
            >
              Spotlight
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">
              Emphasis Scale ({styleConfig.bigWordScale.toFixed(2)}x)
            </label>
            <input
              type="range"
              min={1.0}
              max={3.2}
              step={0.05}
              value={styleConfig.bigWordScale}
              onChange={(e) =>
                onUpdateStyle({ bigWordScale: parseFloat(e.target.value) })
              }
              className="w-full accent-[#30D158] cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between gap-2 pt-3">
            <label className="flex items-center gap-1 text-[10px] text-zinc-300">
              <span>Color:</span>
              <input
                type="color"
                value={styleConfig.highlightColor}
                onChange={(e) =>
                  onUpdateStyle({ highlightColor: e.target.value })
                }
                className="w-6 h-6 rounded cursor-pointer bg-transparent"
              />
            </label>
            <label className="flex items-center gap-1 text-[10px] text-zinc-300">
              <span>Glow:</span>
              <input
                type="color"
                value={styleConfig.emphasisGlowColor || styleConfig.highlightColor}
                onChange={(e) =>
                  onUpdateStyle({ emphasisGlowColor: e.target.value })
                }
                className="w-6 h-6 rounded cursor-pointer bg-transparent"
              />
            </label>
          </div>
        </div>
      </div>

      {/* 7.7 Effects (each has a toggle): Drop Shadow, Glow, 3D Depth, Text Stroke, Arc, Background */}
      <div className="p-3.5 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-3">
        <div className="font-bold text-white">7.7 Studio Effects</div>

        {/* 1. Drop Shadow */}
        <div className="p-2.5 rounded-xl bg-[#131319] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200">Drop Shadow</span>
            <input
              type="checkbox"
              checked={styleConfig.dropShadowEnabled ?? true}
              onChange={(e) =>
                onUpdateStyle({ dropShadowEnabled: e.target.checked })
              }
              className="accent-[#FF5722] cursor-pointer"
            />
          </div>
          {(styleConfig.dropShadowEnabled ?? true) && (
            <div className="grid grid-cols-4 gap-1.5 text-[10px]">
              <div>
                <span className="text-zinc-400 block">Color</span>
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
                <span className="text-zinc-400 block">X px</span>
                <input
                  type="number"
                  value={styleConfig.dropShadowX ?? 0}
                  onChange={(e) =>
                    onUpdateStyle({
                      dropShadowX: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full bg-[#1C1C24] text-white px-1.5 py-1 rounded text-center"
                />
              </div>
              <div>
                <span className="text-zinc-400 block">Y px</span>
                <input
                  type="number"
                  value={styleConfig.dropShadowY ?? 6}
                  onChange={(e) =>
                    onUpdateStyle({
                      dropShadowY: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full bg-[#1C1C24] text-white px-1.5 py-1 rounded text-center"
                />
              </div>
              <div>
                <span className="text-zinc-400 block">Blur</span>
                <input
                  type="number"
                  value={styleConfig.shadowBlur ?? 22}
                  onChange={(e) =>
                    onUpdateStyle({
                      shadowBlur: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full bg-[#1C1C24] text-white px-1.5 py-1 rounded text-center"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. Glow */}
        <div className="p-2.5 rounded-xl bg-[#131319] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200">Glow</span>
            <input
              type="checkbox"
              checked={Boolean(styleConfig.glowEnabled)}
              onChange={(e) => onUpdateStyle({ glowEnabled: e.target.checked })}
              className="accent-[#FF5722] cursor-pointer"
            />
          </div>
          {styleConfig.glowEnabled && (
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <span className="text-zinc-400 block">Color</span>
                <input
                  type="color"
                  value={styleConfig.glowColor || styleConfig.highlightColor}
                  onChange={(e) => onUpdateStyle({ glowColor: e.target.value })}
                  className="w-full h-6 rounded bg-transparent cursor-pointer"
                />
              </div>
              <div>
                <span className="text-zinc-400 block">Spread</span>
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
                  className="w-full bg-[#1C1C24] text-white px-1.5 py-1 rounded text-center"
                />
              </div>
              <div>
                <span className="text-zinc-400 block">Intensity %</span>
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
                  className="w-full bg-[#1C1C24] text-white px-1.5 py-1 rounded text-center"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. 3D Depth */}
        <div className="p-2.5 rounded-xl bg-[#131319] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200">3D Depth Extrusion</span>
            <input
              type="checkbox"
              checked={Boolean(styleConfig.depth3DEnabled)}
              onChange={(e) =>
                onUpdateStyle({ depth3DEnabled: e.target.checked })
              }
              className="accent-[#FF5722] cursor-pointer"
            />
          </div>
          {styleConfig.depth3DEnabled && (
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <span className="text-zinc-400 block">Color</span>
                <input
                  type="color"
                  value={styleConfig.depth3DColor || '#FF5722'}
                  onChange={(e) =>
                    onUpdateStyle({ depth3DColor: e.target.value })
                  }
                  className="w-full h-6 rounded bg-transparent cursor-pointer"
                />
              </div>
              <div>
                <span className="text-zinc-400 block">Depth px</span>
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
                  className="w-full bg-[#1C1C24] text-white px-1.5 py-1 rounded text-center"
                />
              </div>
              <div>
                <span className="text-zinc-400 block">Angle °</span>
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
                  className="w-full bg-[#1C1C24] text-white px-1.5 py-1 rounded text-center"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Arc (Arctext shapes: Arch, Valley, Globe, Dome, Sphere, Curve) */}
        <div className="p-2.5 rounded-xl bg-[#131319] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200">
              Arc (Arch, Valley, Globe, Dome, Sphere, Curve)
            </span>
            <input
              type="checkbox"
              checked={Boolean(styleConfig.arcEnabled)}
              onChange={(e) =>
                onUpdateStyle({
                  arcEnabled: e.target.checked,
                  arcCurveDeg: e.target.checked
                    ? styleConfig.arcCurveDeg || 24
                    : 0,
                })
              }
              className="accent-[#FF5722] cursor-pointer"
            />
          </div>
          {styleConfig.arcEnabled && (
            <div className="space-y-2 text-[10px]">
              <div className="grid grid-cols-3 gap-1">
                {(
                  ['arch', 'valley', 'globe', 'dome', 'sphere', 'curve'] as const
                ).map((sh) => (
                  <button
                    key={sh}
                    type="button"
                    onClick={() =>
                      onUpdateStyle({
                        arcShape: sh,
                        arcCurveDeg: sh === 'valley' ? -24 : 24,
                      })
                    }
                    className={`py-1 rounded font-bold capitalize cursor-pointer ${
                      (styleConfig.arcShape || 'arch') === sh
                        ? 'bg-[#FF5722] text-white'
                        : 'bg-[#1C1C24] text-zinc-300'
                    }`}
                  >
                    {sh}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Curve °:</span>
                <input
                  type="range"
                  min={-45}
                  max={45}
                  value={styleConfig.arcCurveDeg ?? 24}
                  onChange={(e) =>
                    onUpdateStyle({
                      arcCurveDeg: parseInt(e.target.value, 10),
                    })
                  }
                  className="flex-1 accent-[#FF5722] cursor-pointer"
                />
                <span className="font-mono-tabular text-white">
                  {styleConfig.arcCurveDeg ?? 24}°
                </span>
              </div>
            </div>
          )}
        </div>
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
    if (styleConfig.autoSfxEnabled !== false && opt !== 'None') {
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
        <p className="text-[11px] text-zinc-400 mt-0.5">
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
              ? 'bg-[#163326] text-[#34D399] border-[#2BAE66]/60 font-semibold'
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
              ? 'bg-[#163326] text-[#34D399] border-[#2BAE66]/60 font-semibold'
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
              ? 'bg-[#152E23] border-[#2BAE66]/60 text-[#34D399]'
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
              className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#2BAE66]/30 hover:bg-[#2BAE66] text-[#34D399] hover:text-white text-[9px] flex items-center justify-center"
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
              ? 'bg-[#152E23] border-[#2BAE66]/60 text-[#34D399]'
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
              ? 'bg-[#152E23] border-[#2BAE66]/60 text-[#34D399]'
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
            playOpenSourceSoundEffect('whoosh', styleConfig.sfxVolume ?? 0.45);
            onPreviewTransition();
          }}
          className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="w-3 h-3" />
          <span>Preview</span>
        </button>
      </div>

      {/* Row 4.5: Search transitions bar (Exact match to Image 1) */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={transitionSearch}
          onChange={(e) => setTransitionSearch(e.target.value)}
          placeholder="Search transitions..."
          className="w-full bg-[#17171C] text-white placeholder-zinc-500 text-xs pl-8 pr-3 py-2 rounded-xl border border-white/[0.07] focus:outline-none focus:border-[#2BAE66]"
        />
      </div>

      {/* Row 5: 3-Column Grid of "Aa" Transition Cards (Exact match to Image 1) */}
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
                  ? 'bg-[#14291F] border-[#2BAE66] text-white shadow-sm ring-1 ring-[#2BAE66]/40'
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
  const autoSfxOn = styleConfig?.autoSfxEnabled !== false;
  const brollOn = Boolean(styleConfig?.brollEnabled);

  return (
    <div className="space-y-4 text-xs">
      {/* 1. Open-Source Auto Sound Effects (Whoosh, Bell, Pop, Cash, Riser, Impact) */}
      <div className="p-3.5 rounded-2xl bg-[#17171C] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">
              Open-Source Auto Sound Effects (SFX)
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Automatically trigger Whoosh, Bell &amp; Pop sounds on captions &amp; B-rolls
            </p>
          </div>
          <button
            type="button"
            onClick={() => onUpdateStyle?.({ autoSfxEnabled: !autoSfxOn })}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
              autoSfxOn ? 'bg-[#2BAE66]' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                autoSfxOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 1-Tap Soundboard Preview Grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {OPEN_SOURCE_SFX_LIBRARY.map((sfx) => (
            <button
              key={sfx.id}
              type="button"
              onClick={() =>
                playOpenSourceSoundEffect(sfx.id, styleConfig?.sfxVolume ?? 0.45)
              }
              className="p-2.5 rounded-xl bg-[#121216] hover:bg-[#1C1C23] border border-white/[0.06] hover:border-[#2BAE66]/50 text-left flex items-center justify-between gap-2 cursor-pointer transition-all"
            >
              <div className="min-w-0">
                <div className="font-semibold text-white truncate">{sfx.name}</div>
                <div className="text-[10px] text-zinc-400">
                  {sfx.category} · {sfx.durationLabel}
                </div>
              </div>
              <Volume2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* 2. Context-Aware AI B-Roll Cutaways */}
      <div className="p-3.5 rounded-2xl bg-[#17171C] border border-white/[0.08] space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
              <span>AI B-Roll Context Cutaways</span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Auto-display B-Roll cards &amp; motion effects matched to caption context
            </p>
          </div>
          <button
            type="button"
            onClick={() => onUpdateStyle?.({ brollEnabled: !brollOn })}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
              brollOn ? 'bg-[#2BAE66]' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                brollOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {brollOn && (
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => onUpdateStyle?.({ brollDisplayMode: 'pip' })}
              className={`py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                (styleConfig?.brollDisplayMode || 'pip') === 'pip'
                  ? 'bg-[#152E23] border-[#2BAE66] text-[#34D399]'
                  : 'bg-[#121216] border-white/[0.06] text-zinc-400'
              }`}
            >
              PiP Floating Card
            </button>
            <button
              type="button"
              onClick={() => onUpdateStyle?.({ brollDisplayMode: 'fullscreen' })}
              className={`py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                styleConfig?.brollDisplayMode === 'fullscreen'
                  ? 'bg-[#152E23] border-[#2BAE66] text-[#34D399]'
                  : 'bg-[#121216] border-white/[0.06] text-zinc-400'
              }`}
            >
              Large Cutaway Card
            </button>
          </div>
        )}
      </div>

      {/* 3. AI Audio Cleaning (Noise Removal) */}
      <div className="p-3.5 rounded-2xl bg-[#17171C] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">AI Audio Cleaning</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Removes background noise and enhances studio vocal clarity
            </p>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#152E23] text-[#34D399] text-[10px] font-semibold shrink-0">
            {audioCleansRemaining} / 3 Free
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#121216] border border-white/[0.06] flex items-center justify-between">
          <span className="text-zinc-200 font-medium">
            {audioEnhancer.enabled
              ? 'Studio Voice Isolation Active'
              : 'Enable AI Audio Cleaning'}
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdateAudioEnhancer({ enabled: !audioEnhancer.enabled })
            }
            className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
              audioEnhancer.enabled ? 'bg-[#2BAE66]' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                audioEnhancer.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={onExportEnhancedWAV}
          className="w-full py-2 rounded-xl bg-[#2BAE66] hover:bg-[#239656] text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Download Enhanced Audio (.WAV)</span>
        </button>
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
  return (
    <div className="space-y-4 text-xs">
      {/* 11.1 Transform: Zoom %, Position X px, Position Y px, Rotation °, Flip H, Flip V */}
      <div className="p-3.5 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white">11.1 Video Clip · Transform</span>
          <button
            type="button"
            onClick={() =>
              onUpdateVideoClipEdit({
                zoomX: 100,
                zoomY: 100,
                positionX: 0,
                positionY: 0,
                rotation: 0,
                flipHorizontal: false,
                flipVertical: false,
              })
            }
            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Zoom % (width/height linkable) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-300">
              Zoom % ({videoClipEdit.zoomX}%)
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateVideoClipEdit({ zoomLinked: !videoClipEdit.zoomLinked })
              }
              className="text-[10px] text-[#FF5722] flex items-center gap-1 cursor-pointer"
            >
              {videoClipEdit.zoomLinked ? (
                <>
                  <Link className="w-3 h-3" /> Linked W/H
                </>
              ) : (
                <>
                  <Unlink className="w-3 h-3" /> Unlinked
                </>
              )}
            </button>
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
            className="w-full accent-[#FF5722] cursor-pointer"
          />
        </div>

        {/* Position X px, Position Y px, Rotation ° */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">
              Pos X (px)
            </label>
            <input
              type="number"
              value={videoClipEdit.positionX}
              onChange={(e) =>
                onUpdateVideoClipEdit({
                  positionX: parseInt(e.target.value, 10) || 0,
                })
              }
              className="w-full bg-[#121217] text-white px-2 py-1 rounded-lg border border-white/10 text-center"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">
              Pos Y (px)
            </label>
            <input
              type="number"
              value={videoClipEdit.positionY}
              onChange={(e) =>
                onUpdateVideoClipEdit({
                  positionY: parseInt(e.target.value, 10) || 0,
                })
              }
              className="w-full bg-[#121217] text-white px-2 py-1 rounded-lg border border-white/10 text-center"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">
              Rotation °
            </label>
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
              className="w-full bg-[#121217] text-white px-2 py-1 rounded-lg border border-white/10 text-center"
            />
          </div>
        </div>

        {/* Flip Horizontal / Flip Vertical */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              onUpdateVideoClipEdit({
                flipHorizontal: !videoClipEdit.flipHorizontal,
              })
            }
            className={`py-1.5 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 border cursor-pointer ${
              videoClipEdit.flipHorizontal
                ? 'bg-[#FF5722] text-white border-[#FF5722]'
                : 'bg-[#121217] text-zinc-300 border-white/10'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>Flip Horizontal</span>
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateVideoClipEdit({
                flipVertical: !videoClipEdit.flipVertical,
              })
            }
            className={`py-1.5 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 border cursor-pointer ${
              videoClipEdit.flipVertical
                ? 'bg-[#FF5722] text-white border-[#FF5722]'
                : 'bg-[#121217] text-zinc-300 border-white/10'
            }`}
          >
            <FlipVertical className="w-3.5 h-3.5" />
            <span>Flip Vertical</span>
          </button>
        </div>
      </div>

      {/* 11.2 Crop: Left %, Right %, Top %, Bottom %, Softness px, Rounded px */}
      <div className="p-3.5 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white">11.2 Crop &amp; Rounding</span>
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
              })
            }
            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              { key: 'cropLeft', label: 'Left %' },
              { key: 'cropRight', label: 'Right %' },
              { key: 'cropTop', label: 'Top %' },
              { key: 'cropBottom', label: 'Bot %' },
            ] as const
          ).map((c) => (
            <div key={c.key}>
              <label className="text-[10px] text-zinc-400 block mb-1">
                {c.label}
              </label>
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
                className="w-full bg-[#121217] text-white px-1.5 py-1 rounded-lg border border-white/10 text-center"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">
              Softness (px): {videoClipEdit.cropSoftness}px
            </label>
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
              className="w-full accent-[#FF5722] cursor-pointer"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">
              Rounded (px): {videoClipEdit.cropRounded}px
            </label>
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
              className="w-full accent-[#FF5722] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 11.3 Composite (Opacity %) & 11.4 Volume (Mute toggle, Volume %) */}
      <div className="p-3.5 rounded-2xl bg-[#1A1A22] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white">
            11.3 Composite &amp; Linked Audio Volume
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdateVideoClipEdit({
                ...DEFAULT_VIDEO_CLIP_EDIT,
              })
            }
            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset All
          </button>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-zinc-300">Composite Opacity</span>
            <span className="font-mono-tabular text-white font-bold">
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
            className="w-full accent-[#FF5722] cursor-pointer"
          />
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onToggleMute}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${
              isMuted
                ? 'bg-rose-600 text-white'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isMuted ? 'Muted' : 'Audio Active'}
          </button>
          <div className="flex-1">
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-zinc-400">Volume %</span>
              <span className="font-mono-tabular text-white">
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
              className="w-full accent-[#30D158] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
