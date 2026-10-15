# Implementation Plan: Real-Time AI Subject Depth Masking, Collapsible 3-Track NLE Timeline & High-Density Audio/Whoosh Waveforms

## 1. Context & Product Objectives
We are upgrading the **Merupify / Kalakar Desi Video Editing Studio** across four core areas based on your workflow requirements and preferences:
1. **Real-Time AI Person Cutout with Auto Behind-Head Placement (`Depth Mask ON`)**:
   - When a reel or medical/educational creator video is uploaded (or when a sample reel is loaded), enabling **Placed caption behind subject (Depth Mask ON)** automatically places large background hooks, medical terms, and impact lines *behind* the speaker's head/shoulders while rendering the speaker's foreground cutout cleanly in front of the text.
   - Automatic head/torso bounding-box & portrait alpha matte extraction runs in real time on the uploaded HTML5 `<video>` frame at 60fps, positioning the caption's Y-anchor in the upper-head background zone (`24%–34%` vertical height) so the speaker's head naturally overlaps the lower portion of the giant display typography without obstructing smaller subtitle context.
2. **Streamlined 3-Track Default Timeline (`Captions`, `Video 1`, `Audio 1`) with 1-Click Add / Minimize**:
   - By default, only **3 core tracks** are visible in the timeline: **Captions**, **Video 1**, and **Audio 1**.
   - Optional tracks (**B-Roll 1**, **Video 2**, and **Music & Whoosh SFX**) are minimized/hidden by default so the workspace stays clean and uncluttered.
   - Users can add or restore **B-Roll 1**, **Video 2**, or **Music / Whoosh SFX** with a single click from the Timeline Header bar (`+ B-Roll`, `+ Video 2`, `+ Music & Whoosh`), and any track can be minimized (`–` Collapse/Hide button on the track header) to remove it from the active stack whenever it is not needed.
3. **High-Density Premiere Pro Waveforms for `Audio 1` & `Music / Whoosh SFX`**:
   - Replace coarse block bars with **fine, high-density sub-pixel Premiere Pro waveform peaks** (`1px–1.5px` vertical bi-directional / rectified transient needles with RMS core fill and dB guide lines).
   - For **Audio 1**, decode real PCM audio sample peaks from the uploaded video's `AudioBuffer` (with high-resolution syllabic transient peaks).
   - For **Music & Whoosh SFX**, render dual-layer visual envelopes: continuous high-density stereo music bed wavelengths plus distinct **Whoosh / Transition SFX transient spikes** (highlighted with cyan/amber transient envelopes at caption hook entrances and B-roll cuts).
4. **Gemini Transcription Fallback & Error Fix (`server.ts`)**:
   - Fix `Model gemini-3.5-transcribe error: 400 Developer instruction is not enabled for this model` by inlining system instructions directly into the user prompt contents rather than passing `config.systemInstruction` to models that reject developer instructions.
   - Fix `Model gemini-3.8-flash error: 503 High demand` by adding automatic exponential backoff + jitter and seamless silent failover across `gemini-3.5-transcribe`, `gemini-3.8-flash`, and `gemini-3.1-flash-lite` without emitting `[Gemini Fast Fallback] ... error` console warnings that trigger the runtime error overlay.

---

## 2. Research & Technical Architecture

### A. Real-Time AI Person Cutout & Auto Behind-Head Caption Placement
- **How Real-Time Video Matting Works in the Browser Canvas (`60fps`)**:
  - **Layer 1 (Background Plate)**: Draw the full video frame (or active B-Roll / Video 2 clip) onto the main canvas.
  - **Layer 2 (Behind-Subject Caption Layer)**: When `captionDepthBehindSubject` is `true` (or when a medical/hook template with Depth Mask is selected), compute the **Auto Behind-Head Anchor Zone**:
    - Analyze the upper-center subject silhouette from an offscreen downsampled segmentation pass (`160×284` offscreen analysis buffer) that detects skin-tone/face/hair cluster centroids and bilateral edge gradients against the background plate, or uses MediaPipe/Canvas portrait matte extraction.
    - Automatically lift the giant impact/medical keyword block to the **Behind-Head Horizon (`Y = headTopY + 18%` to `34%` of frame height)** with boosted scale (`1.18x–1.35x`) and subtle depth shadow so the letters sit clearly behind the cranium and shoulders.
  - **Layer 3 (Foreground Subject Cutout Composite)**:
    - Generate a real-time soft-feathered alpha matte (`OffscreenCanvas` / cached frame matte synced to `videoElement.currentTime`) isolating the speaker's head, hair, and torso.
    - Composite the speaker's foreground matte *on top of* the Layer 2 caption text using `source-over` with a `2.5px` edge feather and subtle rim-occlusion shadow (`rgba(0,0,0,0.38)`) where the subject's head overlaps the letters.
  - **Auto-Upload Depth & Medical/Hook Detection**:
    - When a user uploads a video with Depth Mask enabled (or clicks **Auto Behind-Subject Depth** in the inspector/toolbar), the algorithm automatically scans the video's subject position, turns on `captionDepthBehindSubject`, and sets `verticalPositionPx` to the optimal behind-head height.
    - Includes an interactive **Depth Mask Preview Badge & Subject Matte Inspector** (toggle between *Composite View*, *Subject Alpha Matte Preview*, and *Auto Head-Tracking Lock*, plus a Feather/Matte Threshold fine-tune slider for studio lighting variations).

### B. 3-Track Default Timeline & 1-Click Track Minimizer (`PremiereMultiTrackTimeline.tsx`)
- **Default Track Configuration**:
  - `captions` (**Captions — Word & Line Split**): `visibleInTimeline: true` (Default ON)
  - `video1` (**Video 1 — Main Reel**): `visibleInTimeline: true` (Default ON)
  - `audio1` (**Audio 1 — Dialogue Waveform**): `visibleInTimeline: true` (Default ON)
  - `broll` (**B-Roll 1 — Cutaways**): `visibleInTimeline: false` (Minimized by default; opens automatically when `+ B-Roll` or `+ AI B-Roll` is clicked)
  - `video2` (**Video 2 — PIP / Overlay**): `visibleInTimeline: false` (Minimized by default; opens automatically when `+ Video 2` is clicked)
  - `music` (**Music & Whoosh SFX**): `visibleInTimeline: false` (Minimized by default; opens automatically when `+ Music & Whoosh` is clicked)
- **Minimize / Restore UX**:
  - Every track row header in the left column has a **`Minimize Track (–)`** button that collapses and hides that track from the timeline stack with one click.
  - The timeline toolbar displays compact **Minimized Track Chips (`+ B-Roll 1`, `+ Video 2`, `+ Music & Whoosh`)** whenever those tracks are minimized, allowing instant 1-click restoration or clip insertion.

### C. High-Density Premiere Pro Waveforms (`Audio 1` & `Music / Whoosh SFX`)
- **Real Web Audio API High-Density Peak Extraction (`src/utils/audioWaveformAnalyzer.ts`)**:
  - When a user uploads a video or audio file, decode the audio stream via `AudioContext.decodeAudioData` and compute a **high-density multi-resolution peak array** (`1,200` to `2,400` min/max/RMS buckets across the duration).
  - Render using a dedicated high-DPI `<canvas>` inside each `Audio 1` and `Music / Whoosh SFX` clip rather than coarse DOM `<div>` bars:
    - **Audio 1 (Dialogue Track)**: Crisp teal-emerald (`#10B981` outer peak needles + `#34D399` inner RMS core) mirrored waveform with `-6dB` / `-12dB` reference hairlines and exact speech pauses matching the word-by-word captions.
    - **Music & Whoosh SFX Track**: Dual-layer high-density waveform canvas showing:
      1. **Stereo Music Bed**: Dense violet-indigo (`#818CF8` / `#C084FC`) rhythmic waveform needles.
      2. **Whoosh / Riser / Impact SFX Transients**: Distinct golden-amber (`#FBBF24` / `#38BDF8`) high-energy diamond transient spikes aligned with hook transitions and B-Roll cuts, with clickable `+ Add Whoosh at Playhead` support.

---

## 3. Aesthetic & Workspace Design Alignment
Following the SaaS & Broadcast Studio constitution:
- **Typography**: `Outfit` / `Plus Jakarta Sans` for studio headers and controls, `DM Sans` for compact inspector labels, and strict `JetBrains Mono` (`tabular-nums`) for all SMPTE timecodes (`00:00.00`), dB meters, and frame counters.
- **Color Palette (60-30-10 Dark Broadcast NLE)**:
  - **60% Canvas & Timeline Wells**: Deep broadcast obsidian (`#07090F`, `#0B0E17`).
  - **30% Track Headers & Inspector Surfaces**: Slate structural panels (`#111622`) with `1px solid rgba(255,255,255,0.08)` borders.
  - **10% Semantic Track Accents**:
    - Captions: Olive-Gold (`#B5943B` / `#FACC15`)
    - Video 1: Premiere Blue (`#2563EB` / `#60A5FA`)
    - Audio 1: Broadcast Emerald (`#059669` / `#34D399`)
    - Music & Whoosh SFX: Electric Indigo & Amber Whoosh Peaks (`#7C3AED` / `#FBBF24`)

---

## 4. Planned File Changes
1. **`server.ts`**:
   - Update `generateWithModelChain` and transcription model calls so `gemini-3.5-transcribe` receives instructions embedded inside `contents` instead of `config.systemInstruction`.
   - Add retry backoff for `503` spikes and sanitize fallback logging so transient model switchovers never trigger error overlays.
2. **`src/utils/depthSubjectSegmentation.ts` (New)**:
   - Implement real-time 60fps subject foreground matte extraction & head-zone bounding-box estimator for uploaded `<video>` elements and sample reels.
   - Export `computeSubjectDepthMatte()` and `detectOptimalBehindHeadY()` so captions automatically position behind the speaker's head when Depth Mask is active.
3. **`src/utils/audioWaveformAnalyzer.ts` (New)**:
   - Implement Web Audio API high-density peak & RMS envelope extraction (`extractHighDensityWaveformFromVideo`) plus procedural high-resolution Music & Whoosh SFX transient envelope generators.
4. **`src/utils/canvasCaptionRenderer.ts`**:
   - Upgrade `renderReelCanvasFrame` Layer 2 & Layer 3 depth compositing to use the real-time subject matte from `depthSubjectSegmentation.ts`, auto behind-head Y placement, and optional matte debug overlay.
5. **`src/components/PremiereMultiTrackTimeline.tsx`**:
   - Set default visible tracks to **only `Captions`, `Video 1`, and `Audio 1`**, with **1-click Minimize (`–`)** on every track and **1-click Add/Restore buttons** for `B-Roll 1`, `Video 2`, and `Music & Whoosh SFX`.
   - Replace coarse CSS bar waveforms with a high-DPI `<canvas>` Premiere Pro waveform renderer for `Audio 1` and `Music & Whoosh SFX` (including distinct Whoosh SFX transient spikes and `+ Whoosh SFX` insertion).
6. **`src/App.tsx`**:
   - Connect uploaded video audio decoding to the high-density waveform analyzer, wire auto behind-head depth placement on upload/toggle, and add Depth Mask sensitivity & Whoosh SFX controls.
