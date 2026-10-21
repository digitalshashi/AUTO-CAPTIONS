# Dynamic AI Frame, Poster & Region Style Cloning

Deliver a lightning-fast **Copy Style from Any Frame or Poster** engine that lets creators sample any frame from the active reel, an external reference video, or an uploaded image/poster—selecting a specific text area, logo mark, or color swatch (or running a 1-click full-frame scan) so Gemini Vision dynamically extracts typography, multi-stop gradients, strokes, shadows, and glow effects into an immediately applied reel style and saved preset.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following product and workflow choices were confirmed during Phase 1 and govern this implementation:

- **Confirmed Decision 1 — Multi-Source Frame & Poster Sampling**: Users can sample from (1) the **Current Active Video Frame** at any timestamp, (2) an **External Reference Video** (scrub to any frame), or (3) an **Uploaded Image / Poster** (drag-and-drop or file picker).
- **Confirmed Decision 2 — Three Interactive Sampling Modes**:
  1. **Drag-to-Select Region (Text / Logo / Color Area)**: Draw a resizable bounding box around any caption, title, logo mark, or color block on the canvas to crop and analyze that exact region.
  2. **Point-and-Click Eyedropper**: Click anywhere on the frame to sample exact pixel hex colors and build multi-stop gradients directly from the frame.
  3. **One-Click Full Frame AI Scan**: Analyze the entire frame or poster automatically without manual cropping.
- **Confirmed Decision 3 — Instant Application & Preset Persistence**: Extracted styles are **applied immediately to the active reel** (updating font family, casing, primary & emphasis colors, multi-stop gradients & angles, stroke, drop shadow, glow, and background pill) and **automatically saved to My Presets** in the Templates library for one-click reuse.

---

### 1. Overview & Core Concept

- **What It Does**: Bridges visual inspiration and caption styling by turning any video frame, viral reel screenshot, movie poster, or brand logo mark into a complete, production-ready caption style in seconds.
- **Target Audience / Persona**: Short-form video creators, editors, and brand managers who want their reel captions to match a specific visual aesthetic, brand logo palette, or reference creator's typography without manually tweaking 15+ sliders.
- **Key Value**: Eliminates manual trial-and-error font and gradient matching. Whether copying a bold 3D kinetic title from a reference frame or harmonizing caption gradients with a brand mark in the corner of a poster, creators get an instant, accurate style preset.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Quick Launch from Canvas or Inspector**:
     - Click the **"Copy Frame Style"** button in the video transport bar (next to Safe Zone / Replace) or inside the **Captions → Templates** and **Captions → Text** panels.
     - Clicking **Copy Frame Style** immediately captures the current video frame at the active playhead timestamp and opens the **AI Frame & Poster Style Cloner** studio modal (or users can trigger a 1-click **Instant Clone Current Frame** button directly from the transport bar for zero-modal speed).
  2. **Source Selection & Frame Scrubbing**:
     - Switch seamlessly between **Current Video Frame** (with a live frame scrubber to pick any timestamp in the active reel), **Upload Poster / Image**, or **Reference Video** (load any external MP4/WebM and scrub to the exact frame you want to copy).
  3. **Interactive Region & Eyedropper Canvas**:
     - **Region Box Mode (`Text Area` / `Logo Mark` / `Color Palette`)**: Drag a precision bounding box over any text, subtitle, or logo mark on the frame. A live zoomed crop preview shows the exact region being sent to Gemini Vision, along with dominant pixel colors extracted client-side from that region.
     - **Eyedropper Mode**: Click up to 5 points on the frame or poster to sample exact pixel colors directly into a live multi-stop gradient bar or primary/emphasis color slots.
     - **Full Frame Scan Mode**: One click analyzes the full frame and automatically locates the most prominent typography or brand visual motif.
  4. **AI Extraction, Live Preview & Preset Creation**:
     - Gemini Vision (`gemini-3.8-flash`) + client-side canvas pixel clustering analyze the cropped region (plus full-frame context) and return a complete style specification: matched studio font, weight, uppercase/lowercase casing, 5-stop gradient colors & angle, emphasis word gradient, stroke width & color, drop shadow, neon glow, and background pill settings.
     - The style is **applied immediately to the reel** and saved as a named card in **My Presets** (with a thumbnail badge and extracted color swatches).

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-craft dark SaaS studio workspace consistent with the existing Kalakar / Merupify dark slate palette (`#0B0B0D` canvas, `#131315` structural surfaces, `#1C1C22` elevated controls, `#10B981` / `#24B47E` emerald studio accents).
  - *Color Palette & Mood*: 60% deep neutral dark canvas (`#0E0E11`), 30% crisp 1px structural borders (`border-white/[0.08]`) and dark slate panels (`#16161B`), 10% emerald action accents (`#10B981`) paired with live swatches of the user's sampled frame colors.
  - *Typography & Hierarchy*: Clean sans-serif UI controls (`Plus Jakarta Sans` / `DM Sans`) paired with `JetBrains Mono` (`tabular-nums`) for frame timestamps, bounding-box coordinates (`X, Y, W × H`), hex codes, and gradient angles.
  - *Component Styling & Layout*: Single-elevation modal and inspector cards with subtle hairline borders, zero nested card clutter, and single-line action buttons (`whitespace-nowrap shrink-0`).

- **Interactive Feedback & Motion**:
  - Crosshair cursor and high-contrast emerald/white marching bounding box with 8 resize handles when dragging a region over any video frame or poster.
  - Live magnifier loupe and hex readout when hovering in Eyedropper mode.
  - Sub-second client-side dominant color palette extraction paired with a smooth scanning overlay while Gemini Vision synthesizes the typography and effect parameters.
  - Completion toast confirming the newly created preset name and immediate canvas update.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hybrid Client-Side Pixel Clustering + Server-Side Gemini Vision Analysis**
  - *Chosen Approach*: Combine an HTML5 Canvas pixel sampler (which extracts exact RGB/Hex dominant clusters and multi-stop gradient stops from the selected bounding box in `<15ms`) with a server-side `/api/style/clone-from-frame` Gemini Vision (`gemini-3.8-flash`) endpoint that analyzes both the cropped region image and the extracted hex clusters.
  - *Why*: Pure LLM vision can occasionally approximate hex codes slightly off from the true pixel values due to compression, while pure pixel sampling cannot identify font families, stroke thickness, 3D extrusion, or kinetic hierarchy. Combining both guarantees 100% exact color/gradient fidelity AND intelligent font/effect matching, with instant fallback if offline.
  - *Alternatives Considered*: Relying solely on full-frame LLM vision without cropping or pixel sampling (rejected because small logos or lower-third captions get diluted by background scenery).

- **Decision 2: Region Intent Modes (`Text / Typography`, `Logo / Brand Mark`, `Color & Gradient Mood`)**
  - *Chosen Approach*: Let users tag their dragged bounding box (or let AI auto-detect) whether the selected region is a **Text / Caption Area** (copy exact font, stroke, shadow, background, and text gradient), a **Logo Mark** (translate the logo's primary/secondary brand colors and geometry into a cohesive high-contrast caption & emphasis gradient style), or a **Color / Poster Area** (build a multi-stop gradient and glow palette from the selected visual area).
  - *Why*: Directly fulfills the user's requirement to *"select text area or color or logo mark based on that area it will create new style for that reel"*.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        Active Video / Poster Sources                       │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ Current Reel Video   │  │ External Ref Video   │  │ Uploaded Poster  │  │
│  │ (Any Playhead Frame) │  │ (Scrubbable Frame)   │  │ / Image File     │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
└─────────────┼─────────────────────────┼───────────────────────┼────────────┘
              └─────────────────────────┼───────────────────────┘
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│               Interactive Frame & Region Sampler Canvas                    │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ Drag-to-Select Box   │  │ Point & Click        │  │ 1-Click Full     │  │
│  │ (Text / Logo / Area) │  │ Eyedropper (5 Stops) │  │ Frame AI Scan    │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
└─────────────┼─────────────────────────┼───────────────────────┼────────────┘
              │ Cropped Base64 +        │ Exact Pixel           │ Full Frame
              │ Region Intent           │ Hex Stops             │ Base64
              └─────────────────────────┼───────────────────────┘
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│           Hybrid AI Style Synthesis Engine (Client + Server)               │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │ Client Canvas K-Means Sampler   │  │ POST /api/style/clone-from-frame│  │
│  │ Extracts exact 5-stop hexes &   │  │ Gemini Vision (gemini-3.8-flash)│  │
│  │ contrast ratios in <15ms        │  │ Matches Font, Stroke, 3D, Glow  │  │
│  └────────────────┬────────────────┘  └────────────────┬────────────────┘  │
└───────────────────┼────────────────────────────────────┼───────────────────┘
                    └───────────────────┬────────────────┘
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                 Immediate Reel Application & Preset Store                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │ Updates Active StyleConfig      │  │ Saves New StylePreset Card to   │  │
│  │ (Font, 5-Stop Gradients, FX)    │  │ "My Presets" + LocalStorage     │  │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `FrameStyleSampleRequest`: `{ fullFrameDataUrl: string; croppedRegionDataUrl?: string; regionIntent: 'auto' | 'text' | 'logo' | 'color'; boundingBox?: { x: number; y: number; width: number; height: number }; sampledHexStops: string[]; sourceLabel: string; timestampSec?: number }`.
  - `ExtractedFrameStyleResponse`: Structured JSON returned by `/api/style/clone-from-frame` containing `presetName`, `detectedCategory` (`text` | `logo` | `poster`), `fontFamily`, `fontSize`, `textCase`, `textColor`, `highlightColor`, `useGradient`, `gradientColors` (up to 5 stops), `gradientAngle`, `gradientLevel` (`word` | `character`), `useEmphasisGradient`, `emphasisGradientColors` (up to 5 stops), `emphasisGradientAngle`, `strokeWidth`, `strokeColor`, `enableDropShadow`, `shadowColor`, `shadowBlur`, `shadowOffsetY`, `enableGlow`, `glowColor`, `glowIntensity`, `enable3D`, `enableBackground`, `backgroundColor`, `backgroundOpacity`, and `reasoningSummary`.

- **Interactive Component & State Mapping**:
  - **Transport Bar & Inspector Quick Actions**:
    - Adds a **"Copy Frame Style"** button in the video player transport bar and in the **Templates** / **Text** sub-tabs.
    - Clicking captures the exact current `<video>` frame onto an offscreen canvas (`captureCurrentVideoFrameDataUrl()`) and opens the interactive sampler modal pre-loaded with that frame, or lets the user run an instant 1-click clone.
  - **Multi-Source Frame & Poster Modal (`AIFrameStyleClonerModal`)**:
    - **Source Switcher**: Toggle between `Current Reel Frame` (with a live timeline slider that seeks and re-captures any frame in the reel), `Upload Poster / Image`, and `Reference Video` (loads a local video file with its own frame scrubber).
    - **Interactive Overlay Canvas**: Supports mouse/touch drag to draw and adjust a bounding box (`x, y, w, h` in percentage coordinates), an **Intent Selector** (`Auto Detect`, `Text / Captions`, `Logo Mark`, `Color / Gradient`), and an **Eyedropper Mode** that appends clicked pixel hexes directly into a 5-stop gradient builder.
    - **Apply & Save Handler**: Calls `/api/style/clone-from-frame`, merges the AI-extracted typography, effects, and multi-stop gradients into `styleConfig` via `handleUpdateStyleAndSyncPreset`, and registers a new preset in `presets` (`My Presets`) via `handleCreateNewPreset`.
